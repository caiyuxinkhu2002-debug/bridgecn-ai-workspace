import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

// Server function: fetch a brand website and extract a Knowledge Base
// using Lovable AI Gateway (structured JSON output). No real LLM is
// connected to the rest of the app yet (the in-product "AI Engine"
// streaming still uses the placeholder provider) — this single call is
// the one place where we actually need a real model, because we need
// information that only the live page contains.

export type ExtractInput = {
  brandName?: string;
  website?: string;
  targetMarket?: string;
  uiLocale?: "en" | "ko" | "zh";
};

export type ExtractedKB = {
  company?: string;
  industry?: string;
  category?: string;
  products?: string[];
  brandStory?: string;
  brandPositioning?: string;
  brandTone?: string[];
  keywords?: string[];
  competitors?: string[];
  targetAudience?: string;
  koreanCopy?: string;
  website?: string;
  socialChannels?: { label: string; url: string }[];
  _confidence?: Record<string, "high" | "medium" | "low">;
  _locale?: "en" | "ko" | "zh";
};

function normalizeUrl(input: string): string {
  const trimmed = input.trim();
  if (!trimmed) return "";
  if (/^https?:\/\//i.test(trimmed)) return trimmed;
  return `https://${trimmed.replace(/^\/\//, "")}`;
}

function originOf(url: string): string {
  try { return new URL(url).origin; } catch { return ""; }
}

function stripHtml(html: string): { text: string; title: string; meta: string; ogDesc: string; links: { href: string; text: string }[]; socials: { label: string; url: string }[] } {
  const title = (html.match(/<title[^>]*>([^<]{1,300})<\/title>/i)?.[1] || "").trim();
  const meta = (html.match(/<meta[^>]+name=["']description["'][^>]+content=["']([^"']{1,500})["']/i)?.[1] || "").trim();
  const ogDesc = (html.match(/<meta[^>]+property=["']og:description["'][^>]+content=["']([^"']{1,500})["']/i)?.[1] || "").trim();

  const links: { href: string; text: string }[] = [];
  const linkRe = /<a\b[^>]*href=["']([^"'#]+)["'][^>]*>([\s\S]*?)<\/a>/gi;
  let m: RegExpExecArray | null;
  while ((m = linkRe.exec(html)) && links.length < 200) {
    const href = m[1];
    const text = m[2].replace(/<[^>]+>/g, "").replace(/\s+/g, " ").trim();
    if (text || href) links.push({ href, text });
  }

  const socials: { label: string; url: string }[] = [];
  const socialMap: { re: RegExp; label: string }[] = [
    { re: /instagram\.com\//i, label: "Instagram" },
    { re: /facebook\.com\//i, label: "Facebook" },
    { re: /tiktok\.com\//i, label: "TikTok" },
    { re: /youtube\.com\//i, label: "YouTube" },
    { re: /x\.com\/|twitter\.com\//i, label: "X" },
    { re: /linkedin\.com\//i, label: "LinkedIn" },
    { re: /xiaohongshu\.com\/|xhslink\.com\//i, label: "Xiaohongshu" },
    { re: /weibo\.com\//i, label: "Weibo" },
    { re: /pinterest\.com\//i, label: "Pinterest" },
  ];
  const seen = new Set<string>();
  for (const l of links) {
    for (const s of socialMap) {
      if (s.re.test(l.href) && !seen.has(s.label)) {
        seen.add(s.label);
        socials.push({ label: s.label, url: l.href });
      }
    }
  }

  const text = html
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<noscript[\s\S]*?<\/noscript>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&[a-z]+;/gi, " ")
    .replace(/\s+/g, " ")
    .trim();

  return { text, title, meta, ogDesc, links, socials };
}

async function tryFetch(url: string, timeoutMs = 8000): Promise<string> {
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), timeoutMs);
  try {
    const res = await fetch(url, {
      signal: ctrl.signal,
      headers: {
        "user-agent": "Mozilla/5.0 (compatible; BridgeCN-Builder/1.0; +https://bridgecn.ai)",
        accept: "text/html,application/xhtml+xml",
      },
      redirect: "follow",
    });
    if (!res.ok) return "";
    const ct = res.headers.get("content-type") || "";
    if (!/text\/html|application\/xhtml/i.test(ct)) return "";
    const text = await res.text();
    return text.slice(0, 400_000);
  } catch {
    return "";
  } finally {
    clearTimeout(t);
  }
}

function pickKeyLinks(links: { href: string; text: string }[], origin: string): string[] {
  const wanted = /(about|brand|story|company|product|shop|collection|press|sustain|mission|values)/i;
  const out: string[] = [];
  const seen = new Set<string>();
  for (const l of links) {
    if (!wanted.test(l.text) && !wanted.test(l.href)) continue;
    let url = l.href;
    if (url.startsWith("/")) url = origin + url;
    if (!/^https?:\/\//i.test(url)) continue;
    if (origin && !url.startsWith(origin)) continue;
    if (seen.has(url)) continue;
    seen.add(url);
    out.push(url);
    if (out.length >= 3) break;
  }
  return out;
}

async function callLovableAI(payload: { brandName?: string; website?: string; targetMarket?: string; corpus: string; uiLocale?: "en" | "ko" | "zh" }): Promise<ExtractedKB> {
  const apiKey = process.env.LOVABLE_API_KEY;
  if (!apiKey) throw new Error("LOVABLE_API_KEY missing");

  const langName = payload.uiLocale === "zh"
    ? "Simplified Chinese (简体中文)"
    : payload.uiLocale === "ko"
      ? "Korean (한국어)"
      : "English";
  const system = `You are a brand research analyst. From the provided website content, extract a structured Knowledge Base for a brand that is preparing to enter the Chinese market. Be specific and grounded in the source — never invent products or competitors that are not implied. If a field cannot be determined, return the most reasonable inference based on industry context, and lower its confidence.

LANGUAGE: Write ALL free-text values (industry, category, brandStory, brandPositioning, brandTone, keywords, competitors, targetAudience, koreanCopy, product descriptions) in ${langName}. Keep JSON KEYS in English. Keep brand names, product SKU codes, URLs, social handles, and platform names (Xiaohongshu/Tmall/TikTok/Instagram) in their original form.

Output STRICT JSON only, matching the requested schema.`;

  const schemaHint = `{
  "company": string,
  "industry": string,
  "category": string,
  "products": string[],            // 3-12 concrete product or product-line names
  "brandStory": string,            // 2-4 sentences, third person
  "brandPositioning": string,      // one sentence positioning statement
  "brandTone": string[],           // 3-6 adjectives e.g. ["minimalist","warm","clinical"]
  "keywords": string[],            // 5-12 SEO / category keywords
  "competitors": string[],         // 3-8 plausible competitors in the same category
  "targetAudience": string,        // 1-3 sentences describing the core audience
  "koreanCopy": string,            // 1-2 sentence brand tagline in Korean (한국어). If the brand is not Korean, write a natural Korean marketing line consistent with the brand.
  "socialChannels": [{"label": string, "url": string}],
  "_confidence": { "<fieldName>": "high"|"medium"|"low" }
}`;

  const user = `Brand name (optional): ${payload.brandName || "(unknown — infer from site)"}
Website: ${payload.website || "(none)"}
Target market: ${payload.targetMarket || "Mainland China"}

--- WEBSITE CONTENT (truncated) ---
${payload.corpus.slice(0, 18_000)}
--- END ---

Return ONLY a JSON object with this exact shape:
${schemaHint}`;

  const res = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
    method: "POST",
    headers: {
      "content-type": "application/json",
      "Lovable-API-Key": apiKey,
    },
    body: JSON.stringify({
      model: "google/gemini-3-flash-preview",
      messages: [
        { role: "system", content: system },
        { role: "user", content: user },
      ],
      response_format: { type: "json_object" },
      temperature: 0.4,
    }),
  });
  if (!res.ok) {
    const body = await res.text().catch(() => "");
    throw new Error(`AI gateway ${res.status}: ${body.slice(0, 300)}`);
  }
  const json = (await res.json()) as { choices?: { message?: { content?: string } }[] };
  const content = json.choices?.[0]?.message?.content || "{}";
  let parsed: ExtractedKB = {};
  try { parsed = JSON.parse(content); } catch {
    const match = content.match(/\{[\s\S]*\}/);
    if (match) { try { parsed = JSON.parse(match[0]); } catch { /* ignore */ } }
  }
  return parsed;
}

export const extractKnowledgeFromWebsite = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: ExtractInput) => input)
  .handler(async ({ data }) => {
    const website = data.website ? normalizeUrl(data.website) : "";
    const origin = website ? originOf(website) : "";

    let corpus = "";
    let mergedSocials: { label: string; url: string }[] = [];
    let homeTitle = "";
    let homeMeta = "";

    if (website) {
      const home = await tryFetch(website);
      if (home) {
        const parsed = stripHtml(home);
        homeTitle = parsed.title;
        homeMeta = parsed.meta || parsed.ogDesc;
        mergedSocials = parsed.socials;
        corpus += `# HOME (${website})\nTITLE: ${parsed.title}\nDESCRIPTION: ${parsed.meta || parsed.ogDesc}\n\n${parsed.text.slice(0, 8000)}\n\n`;

        const subUrls = pickKeyLinks(parsed.links, origin);
        for (const u of subUrls) {
          const sub = await tryFetch(u);
          if (!sub) continue;
          const sp = stripHtml(sub);
          corpus += `# PAGE (${u})\nTITLE: ${sp.title}\n\n${sp.text.slice(0, 4000)}\n\n`;
          for (const s of sp.socials) {
            if (!mergedSocials.some((m) => m.label === s.label)) mergedSocials.push(s);
          }
        }
      }
    }

    // If we have basically nothing to send, still ask the model to infer
    // from the brand name alone — but be honest about confidence.
    if (!corpus) {
      corpus = `(No website content available. Infer cautiously from the brand name only.)`;
    }

    const ai = await callLovableAI({
      brandName: data.brandName,
      website,
      targetMarket: data.targetMarket,
      corpus,
      uiLocale: data.uiLocale,
    });

    // Merge: prefer scraped socials when AI returned none, dedupe by label.
    const aiSocials = ai.socialChannels || [];
    const socialChannels = [...aiSocials];
    for (const s of mergedSocials) {
      if (!socialChannels.some((m) => m.label === s.label)) socialChannels.push(s);
    }

    const result: ExtractedKB = {
      company: ai.company || data.brandName || homeTitle || "",
      industry: ai.industry || "",
      category: ai.category || "",
      products: ai.products || [],
      brandStory: ai.brandStory || homeMeta || "",
      brandPositioning: ai.brandPositioning || "",
      brandTone: ai.brandTone || [],
      keywords: ai.keywords || [],
      competitors: ai.competitors || [],
      targetAudience: ai.targetAudience || "",
      koreanCopy: ai.koreanCopy || "",
      website: website || data.website || "",
      socialChannels,
      _confidence: ai._confidence,
      _locale: data.uiLocale ?? "en",
    };
    return result;
  });