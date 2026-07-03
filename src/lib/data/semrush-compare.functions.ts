import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

// Side-by-side SEMrush comparison for the user's domain vs 1-3 competitors.
// All calls go through the Lovable connector gateway using the workspace's
// authorized SEMrush connection. Free-tier quotas apply — surface ERROR 134
// (TOTAL LIMIT EXCEEDED) as a structured `quotaExceeded` flag so the UI can
// show a clear message instead of a generic error.

const GATEWAY = "https://connector-gateway.lovable.dev/semrush";

export type DomainOverview = {
  domain: string;
  authorityScore: number;
  organicKeywords: number;
  organicTraffic: number;
  organicCost: number;
  backlinks: number;
  referringDomains: number;
  error?: string;
};

export type TopKeyword = {
  phrase: string;
  position: number;
  volume: number;
  traffic: number;
};

export type DomainKeywords = {
  domain: string;
  keywords: TopKeyword[];
  error?: string;
};

export type GapKeyword = {
  phrase: string;
  volume: number;
  rankedBy: string[]; // competitor domains that rank for it
};

export type CompareSnapshot = {
  market: string;
  fetchedAt: string;
  you: string;
  competitors: string[];
  overview: DomainOverview[]; // includes you + competitors
  topKeywords: DomainKeywords[]; // includes you + competitors
  gap: GapKeyword[]; // opps you don't rank for
  quotaExceeded: boolean;
  errors: string[];
};

function marketToDatabase(market: string): string {
  const m = (market || "").toLowerCase();
  if (/hong\s*kong|香港|hk\b/.test(m)) return "hk";
  if (/taiwan|台湾|台灣|\btw\b/.test(m)) return "tw";
  if (/singapore|新加坡|\bsg\b/.test(m)) return "sg";
  if (/china|中国|大陆|mainland|prc|\bcn\b/.test(m)) return "cn";
  if (/korea|한국|韩国|\bkr\b/.test(m)) return "kr";
  if (/japan|日本|\bjp\b/.test(m)) return "jp";
  if (/united kingdom|britain|英国|\buk\b/.test(m)) return "uk";
  if (/german|deutsch|德国|\bde\b/.test(m)) return "de";
  if (/france|法国|\bfr\b/.test(m)) return "fr";
  if (/australia|澳洲|澳大利亚|\bau\b/.test(m)) return "au";
  if (/united states|usa|america|美国|\bus\b/.test(m)) return "us";
  return "us";
}

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

function isQuotaError(err: string): boolean {
  return /ERROR\s*134|TOTAL\s*LIMIT\s*EXCEEDED/i.test(err);
}

async function gw(path: string, params: Record<string, string>): Promise<GatewayResponse> {
  const apiKey = process.env.LOVABLE_API_KEY;
  const connKey = process.env.SEMRUSH_API_KEY;
  if (!apiKey || !connKey) return { error: "SEMrush connection not available" };
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
  if (!res.ok || parsed.error) return { error: parsed.error || `HTTP ${res.status}` };
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

async function fetchOverview(domain: string, db: string): Promise<DomainOverview> {
  const base: DomainOverview = {
    domain,
    authorityScore: 0,
    organicKeywords: 0,
    organicTraffic: 0,
    organicCost: 0,
    backlinks: 0,
    referringDomains: 0,
  };
  const r = await gw("/domains/domain_ranks", {
    domain,
    database: db,
    export_columns: "Dn,Rk,Or,Ot,Oc,Ad,At,Ac",
  });
  if (r.error) return { ...base, error: r.error };
  const row = rowsToObjects(r)[0];
  if (row) {
    base.organicKeywords = toNumber(row.Or);
    base.organicTraffic = toNumber(row.Ot);
    base.organicCost = toNumber(row.Oc);
  }
  // Backlinks overview (root_domain). Best-effort — do not fail overview if this errs.
  const b = await gw("/backlinks/backlinks_overview", {
    target: domain,
    target_type: "root_domain",
    export_columns: "ascore,total,domains_num",
  });
  if (!b.error) {
    const brow = rowsToObjects(b)[0];
    if (brow) {
      base.authorityScore = toNumber(brow.ascore);
      base.backlinks = toNumber(brow.total);
      base.referringDomains = toNumber(brow.domains_num);
    }
  }
  return base;
}

async function fetchTopKw(domain: string, db: string, limit: number): Promise<DomainKeywords> {
  const r = await gw("/domains/domain_organic", {
    domain,
    database: db,
    export_columns: "Ph,Po,Nq,Tr",
    display_limit: String(limit),
  });
  if (r.error) return { domain, keywords: [], error: r.error };
  const rows = rowsToObjects(r);
  const keywords: TopKeyword[] = rows.map((row) => ({
    phrase: row.Ph || "",
    position: toNumber(row.Po),
    volume: toNumber(row.Nq),
    traffic: toNumber(row.Tr),
  }));
  return { domain, keywords };
}

export type CompareInput = {
  yourDomain: string;
  competitors: string[]; // 1-3
  targetMarket: string;
  workspaceId?: string;
};

export const fetchCompareSnapshot = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: CompareInput) => input)
  .handler(async ({ data, context }): Promise<CompareSnapshot> => {
    if (data.workspaceId) {
      const { checkAndIncrement } = await import("@/lib/billing/quota.server");
      await checkAndIncrement({
        userId: context.userId,
        workspaceId: data.workspaceId,
        kind: "semrushCalls",
      });
    }
    const db = marketToDatabase(data.targetMarket);
    const you = normalizeDomain(data.yourDomain);
    const comps = (data.competitors || [])
      .map(normalizeDomain)
      .filter((d): d is string => Boolean(d))
      .slice(0, 3);

    const errors: string[] = [];
    let quotaExceeded = false;
    const snapshot: CompareSnapshot = {
      market: db,
      fetchedAt: new Date().toISOString(),
      you: you || "",
      competitors: comps,
      overview: [],
      topKeywords: [],
      gap: [],
      quotaExceeded: false,
      errors,
    };

    if (!you) {
      errors.push("Missing your domain");
      return snapshot;
    }

    const allDomains = [you, ...comps];

    // Overview + Top 5 kw for each domain, in parallel per-domain but
    // serialized across domains to stay gentle on free-tier quota.
    for (const d of allDomains) {
      const [ov, kw] = await Promise.all([fetchOverview(d, db), fetchTopKw(d, db, 5)]);
      if (ov.error && isQuotaError(ov.error)) quotaExceeded = true;
      if (kw.error && isQuotaError(kw.error)) quotaExceeded = true;
      if (ov.error) errors.push(`overview[${d}]: ${ov.error}`);
      if (kw.error) errors.push(`kw[${d}]: ${kw.error}`);
      snapshot.overview.push(ov);
      snapshot.topKeywords.push(kw);
      if (quotaExceeded) break;
    }

    // Keyword gap: fetch top 20 for each competitor + top 50 for `you`, then
    // return competitor keywords that `you` does not rank for.
    if (!quotaExceeded && comps.length > 0) {
      const yourFull = await fetchTopKw(you, db, 50);
      if (yourFull.error && isQuotaError(yourFull.error)) quotaExceeded = true;
      const yourSet = new Set(yourFull.keywords.map((k) => k.phrase.toLowerCase()));
      const gapMap = new Map<string, GapKeyword>();
      for (const c of comps) {
        if (quotaExceeded) break;
        const cf = await fetchTopKw(c, db, 20);
        if (cf.error && isQuotaError(cf.error)) {
          quotaExceeded = true;
          break;
        }
        for (const k of cf.keywords) {
          const key = k.phrase.toLowerCase();
          if (!key || yourSet.has(key)) continue;
          const existing = gapMap.get(key);
          if (existing) {
            if (!existing.rankedBy.includes(c)) existing.rankedBy.push(c);
            if (k.volume > existing.volume) existing.volume = k.volume;
          } else {
            gapMap.set(key, { phrase: k.phrase, volume: k.volume, rankedBy: [c] });
          }
        }
      }
      snapshot.gap = Array.from(gapMap.values())
        .sort((a, b) => b.volume - a.volume)
        .slice(0, 10);
    }

    snapshot.quotaExceeded = quotaExceeded;
    return snapshot;
  });
