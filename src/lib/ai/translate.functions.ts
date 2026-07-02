import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

// Translate the persisted, AI-written project content (description / summary /
// knowledge_base free-text fields) into the user's current UI language.
// Brand names, URLs, social handles and SKU codes are kept verbatim.
//
// Why this exists: the Knowledge Base is extracted once at project creation
// and stored in the database. Switching the UI language does NOT retranslate
// those stored strings, so Chinese/Korean users still saw English. This fn
// rewrites the stored values in place and tags them with `_locale`.

const MODEL = "google/gemini-3-flash-preview";

type Locale = "en" | "ko" | "zh";

type SocialChannel = { label: string; url: string };

type KnowledgeBase = {
  company?: string;
  industry?: string;
  category?: string;
  products?: string[];
  brandStory?: string;
  brandTone?: string[];
  keywords?: string[];
  competitors?: string[];
  targetAudience?: string;
  koreanCopy?: string;
  website?: string;
  socialChannels?: SocialChannel[];
  _locale?: Locale;
  _originalEn?: Partial<KnowledgeBase> & { description?: string };
};

export type TranslateInput = {
  projectId: string;
  targetLocale: Locale;
};

export type TranslateResult = {
  ok: true;
  locale: Locale;
};

function localeName(loc: Locale): string {
  if (loc === "zh") return "Simplified Chinese (简体中文)";
  if (loc === "ko") return "Korean (한국어)";
  return "English";
}

async function translateBundle(
  payload: Record<string, unknown>,
  target: Locale,
): Promise<Record<string, unknown>> {
  const apiKey = process.env.LOVABLE_API_KEY;
  if (!apiKey) throw new Error("LOVABLE_API_KEY missing");

  const lang = localeName(target);
  const system = `You are a professional brand-copy translator. Translate the VALUES in the given JSON into ${lang}.

RULES:
- Keep JSON KEYS exactly as given.
- Keep brand names, product SKU codes (e.g. "Jeju Samdasoo 500mL"), URLs, email addresses, social handles, and platform names (Xiaohongshu/Tmall/TikTok/Instagram) in their original form.
- For arrays of strings, translate each item.
- For "products": translate descriptive words but preserve proper nouns and volume units (mL, L, g).
- Output natural, idiomatic ${lang} appropriate for marketing.
- Return ONLY a JSON object with the SAME shape as the input, no prose, no markdown.`;

  const user = `Translate the values of this JSON to ${lang}:\n${JSON.stringify(payload)}`;

  const res = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
    method: "POST",
    headers: { "content-type": "application/json", "Lovable-API-Key": apiKey },
    body: JSON.stringify({
      model: MODEL,
      messages: [
        { role: "system", content: system },
        { role: "user", content: user },
      ],
      response_format: { type: "json_object" },
      temperature: 0.2,
    }),
  });
  if (res.status === 429) throw new Error("AI rate limit — please retry in a moment.");
  if (res.status === 402)
    throw new Error("AI credits exhausted. Add credits in Settings → Plans & credits.");
  if (!res.ok) {
    const body = await res.text().catch(() => "");
    throw new Error(`AI gateway ${res.status}: ${body.slice(0, 240)}`);
  }
  const json = (await res.json()) as { choices?: { message?: { content?: string } }[] };
  const content = json.choices?.[0]?.message?.content || "{}";
  try {
    return JSON.parse(content) as Record<string, unknown>;
  } catch {
    const m = content.match(/\{[\s\S]*\}/);
    if (m) {
      try {
        return JSON.parse(m[0]) as Record<string, unknown>;
      } catch {
        /* fall */
      }
    }
    throw new Error("AI returned non-JSON content");
  }
}

export const translateProjectContent = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: TranslateInput) => input)
  .handler(async ({ data, context }): Promise<TranslateResult> => {
    const { projectId, targetLocale } = data;
    const sb = context.supabase;

    const { data: row, error } = await sb
      .from("projects")
      .select("id, description, summary, knowledge_base")
      .eq("id", projectId)
      .maybeSingle();
    if (error) throw new Error(error.message);
    if (!row) throw new Error("Project not found");

    const kb =
      ((row.knowledge_base && typeof row.knowledge_base === "object"
        ? row.knowledge_base
        : {}) as KnowledgeBase) || {};

    // Build a payload of just the translatable string fields. URLs and the
    // social channel list are intentionally excluded.
    const payload: Record<string, unknown> = {};
    if (row.description) payload.description = row.description;
    if (kb.industry) payload.industry = kb.industry;
    if (kb.category) payload.category = kb.category;
    if (kb.brandStory) payload.brandStory = kb.brandStory;
    if (kb.targetAudience) payload.targetAudience = kb.targetAudience;
    if (kb.koreanCopy) payload.koreanCopy = kb.koreanCopy;
    if (kb.products && kb.products.length) payload.products = kb.products;
    if (kb.brandTone && kb.brandTone.length) payload.brandTone = kb.brandTone;
    if (kb.keywords && kb.keywords.length) payload.keywords = kb.keywords;
    if (kb.competitors && kb.competitors.length) payload.competitors = kb.competitors;

    if (Object.keys(payload).length === 0) {
      // Nothing to translate — just tag the locale and exit.
      await sb
        .from("projects")
        .update({ knowledge_base: { ...kb, _locale: targetLocale } as never })
        .eq("id", projectId);
      return { ok: true, locale: targetLocale };
    }

    const translated = await translateBundle(payload, targetLocale);

    // Preserve the very first English snapshot so users can later switch back.
    const originalEn = kb._originalEn ?? {
      description: row.description ?? undefined,
      industry: kb.industry,
      category: kb.category,
      brandStory: kb.brandStory,
      targetAudience: kb.targetAudience,
      koreanCopy: kb.koreanCopy,
      products: kb.products,
      brandTone: kb.brandTone,
      keywords: kb.keywords,
      competitors: kb.competitors,
    };

    const newDescription =
      typeof translated.description === "string" ? translated.description : row.description;

    const newKb: KnowledgeBase = {
      ...kb,
      industry: typeof translated.industry === "string" ? translated.industry : kb.industry,
      category: typeof translated.category === "string" ? translated.category : kb.category,
      brandStory: typeof translated.brandStory === "string" ? translated.brandStory : kb.brandStory,
      targetAudience:
        typeof translated.targetAudience === "string"
          ? translated.targetAudience
          : kb.targetAudience,
      koreanCopy: typeof translated.koreanCopy === "string" ? translated.koreanCopy : kb.koreanCopy,
      products: Array.isArray(translated.products)
        ? (translated.products as string[])
        : kb.products,
      brandTone: Array.isArray(translated.brandTone)
        ? (translated.brandTone as string[])
        : kb.brandTone,
      keywords: Array.isArray(translated.keywords)
        ? (translated.keywords as string[])
        : kb.keywords,
      competitors: Array.isArray(translated.competitors)
        ? (translated.competitors as string[])
        : kb.competitors,
      _locale: targetLocale,
      _originalEn: originalEn,
    };

    const { error: upErr } = await sb
      .from("projects")
      .update({
        description: newDescription,
        summary: newDescription,
        industry: newKb.industry ?? null,
        knowledge_base: newKb as never,
      })
      .eq("id", projectId);
    if (upErr) throw new Error(upErr.message);

    return { ok: true, locale: targetLocale };
  });
