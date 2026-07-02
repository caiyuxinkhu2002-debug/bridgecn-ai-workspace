import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

// SEMrush real-data layer. All calls go through the Lovable connector
// gateway; the user authorized SEMrush via standard_connectors--connect,
// so SEMRUSH_API_KEY is injected as an env var on the server.
//
// Free SEMrush accounts have a daily API quota — this function is only
// invoked when the user explicitly clicks "Refresh with real data".

const GATEWAY = "https://connector-gateway.lovable.dev/semrush";

export type SemrushKeyword = {
  phrase: string;
  volume: number;
  cpc: number;
  competition: number;
  difficulty?: number;
};

export type SemrushCompetitor = {
  domain: string;
  commonKeywords: number;
  organicKeywords: number;
  organicTraffic: number;
};

export type SemrushSnapshot = {
  market: string; // database code used (us, cn, kr…)
  fetchedAt: string; // ISO
  domain: string | null;
  domainOverview: {
    organicKeywords: number;
    organicTraffic: number;
    organicCost: number;
  } | null;
  keywords: SemrushKeyword[];
  competitors: SemrushCompetitor[];
  errors: string[]; // non-fatal per-call errors (quota, missing data)
};

// Map a free-text targetMarket like "China" / "中国" / "Korea" to a SEMrush
// database code. Defaults to "us" when nothing matches.
function marketToDatabase(market: string): string {
  const m = market.toLowerCase();
  // Hong Kong / Taiwan / Singapore must be matched BEFORE the generic
  // "china" / "中国" rule, otherwise "Hong Kong, China" falls into cn.
  if (/hong\s*kong|香港|hk\b/.test(m)) return "hk";
  if (/taiwan|台湾|台灣|\btw\b/.test(m)) return "tw";
  if (/singapore|新加坡|\bsg\b/.test(m)) return "sg";
  if (/indonesia|印尼/.test(m)) return "id";
  if (/india|印度|\bin\b/.test(m)) return "in";
  if (/china|中国|大陆|mainland|prc|tier\s*[12]|tier\s*1\.5|\bcn\b/.test(m)) return "cn";
  if (/korea|한국|韩国|\bkr\b/.test(m)) return "kr";
  if (/japan|日本|\bjp\b/.test(m)) return "jp";
  if (/united kingdom|britain|英国|\buk\b/.test(m)) return "uk";
  if (/german|deutsch|德国|\bde\b/.test(m)) return "de";
  if (/france|法国|\bfr\b/.test(m)) return "fr";
  if (/spain|西班牙|\bes\b/.test(m)) return "es";
  if (/italy|意大利|\bit\b/.test(m)) return "it";
  if (/australia|澳洲|澳大利亚|\bau\b/.test(m)) return "au";
  if (/brazil|巴西|\bbr\b/.test(m)) return "br";
  if (/mexico|墨西哥|\bmx\b/.test(m)) return "mx";
  if (/united states|usa|america|美国|\bus\b/.test(m)) return "us";
  return "us";
}

// Strip http(s):// and trailing path/slash to get a bare domain SEMrush accepts.
function normalizeDomain(url: string): string | null {
  const trimmed = (url || "").trim();
  if (!trimmed) return null;
  try {
    const u = new URL(trimmed.startsWith("http") ? trimmed : `https://${trimmed}`);
    return u.hostname.replace(/^www\./, "");
  } catch {
    return (
      trimmed
        .replace(/^https?:\/\//, "")
        .replace(/\/.*$/, "")
        .replace(/^www\./, "") || null
    );
  }
}

type GatewayResponse = {
  data?: { columnNames?: string[]; rows?: unknown[][] };
  status?: number;
  error?: string;
};

async function gw(path: string, params: Record<string, string>): Promise<GatewayResponse> {
  const apiKey = process.env.LOVABLE_API_KEY;
  const connKey = process.env.SEMRUSH_API_KEY;
  if (!apiKey || !connKey) {
    return { error: "SEMrush connection not available" };
  }
  const qs = new URLSearchParams(params).toString();
  const res = await fetch(`${GATEWAY}${path}?${qs}`, {
    method: "GET",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "X-Connection-Api-Key": connKey,
    },
  });
  const text = await res.text();
  let parsed: GatewayResponse;
  try {
    parsed = JSON.parse(text) as GatewayResponse;
  } catch {
    return { error: `Non-JSON response (${res.status})` };
  }
  if (!res.ok || parsed.error) {
    return { error: parsed.error || `HTTP ${res.status}` };
  }
  return parsed;
}

function rowsToObjects(resp: GatewayResponse): Record<string, string>[] {
  const cols = resp.data?.columnNames || [];
  const rows = resp.data?.rows || [];
  return rows.map((r) => {
    const o: Record<string, string> = {};
    cols.forEach((c, i) => {
      o[c] = String((r as unknown[])[i] ?? "");
    });
    return o;
  });
}

function toNumber(s: string | undefined): number {
  if (!s) return 0;
  const n = Number(s.replace(/,/g, ""));
  return Number.isFinite(n) ? n : 0;
}

export type FetchSnapshotInput = {
  domain: string; // raw URL or hostname (KB website)
  targetMarket: string; // free-text market label
  seedKeywords: string[]; // up to 3 keywords to deep-dive
};

export const fetchSemrushSnapshot = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: FetchSnapshotInput) => input)
  .handler(async ({ data }): Promise<SemrushSnapshot> => {
    const db = marketToDatabase(data.targetMarket);
    const domain = normalizeDomain(data.domain);
    const errors: string[] = [];
    console.log("[semrush.snapshot]", { targetMarket: data.targetMarket, mappedDb: db, domain });

    const snapshot: SemrushSnapshot = {
      market: db,
      fetchedAt: new Date().toISOString(),
      domain,
      domainOverview: null,
      keywords: [],
      competitors: [],
      errors,
    };

    // 1. Domain overview (organic traffic/keywords/cost)
    if (domain) {
      const r = await gw("/domains/domain_ranks", {
        domain,
        database: db,
        export_columns: "Dn,Rk,Or,Ot,Oc,Ad,At,Ac",
      });
      if (r.error) errors.push(`domain_ranks: ${r.error}`);
      else {
        const rows = rowsToObjects(r);
        if (rows[0]) {
          snapshot.domainOverview = {
            organicKeywords: toNumber(rows[0].Or),
            organicTraffic: toNumber(rows[0].Ot),
            organicCost: toNumber(rows[0].Oc),
          };
        }
      }

      // 2. Top organic competitors
      const c = await gw("/domains/domain_domains", {
        domain,
        database: db,
        export_columns: "Dn,Cr,Np,Or,Ot",
        display_limit: "5",
      });
      if (c.error) errors.push(`domain_domains: ${c.error}`);
      else {
        snapshot.competitors = rowsToObjects(c)
          .filter((r) => r.Dn && r.Dn !== domain)
          .slice(0, 5)
          .map((r) => ({
            domain: r.Dn,
            commonKeywords: toNumber(r.Cr),
            organicKeywords: toNumber(r.Or),
            organicTraffic: toNumber(r.Ot),
          }));
      }
    }

    // 3. Keyword overview for up to 3 seed keywords
    const seeds = (data.seedKeywords || []).slice(0, 3).filter(Boolean);
    for (const kw of seeds) {
      const k = await gw("/keywords/phrase_this", {
        phrase: kw,
        database: db,
        export_columns: "Ph,Nq,Cp,Co,Nr,Td",
      });
      if (k.error) {
        errors.push(`phrase_this[${kw}]: ${k.error}`);
        continue;
      }
      const row = rowsToObjects(k)[0];
      if (row) {
        snapshot.keywords.push({
          phrase: row.Ph || kw,
          volume: toNumber(row.Nq),
          cpc: toNumber(row.Cp),
          competition: toNumber(row.Co),
        });
      }
    }

    return snapshot;
  });
