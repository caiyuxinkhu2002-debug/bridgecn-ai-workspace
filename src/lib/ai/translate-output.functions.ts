import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

// Translate an arbitrary AI job output (or report payload) JSON blob into the
// target UI locale. Keeps JSON keys and proper nouns intact, translates every
// string value including nested arrays/objects. Used by useLocalizedOutput on
// the client to swap cached outputs when the user switches language.

const MODEL = "google/gemini-3-flash-preview";

type Locale = "en" | "ko" | "zh";
type JsonValue = string | number | boolean | null | JsonValue[] | { [k: string]: JsonValue };

export type TranslateOutputInput = {
  payload: { [k: string]: JsonValue };
  targetLocale: Locale;
};

function localeName(loc: Locale): string {
  if (loc === "zh") return "Simplified Chinese (简体中文)";
  if (loc === "ko") return "Korean (한국어)";
  return "English";
}

export const translateJobOutput = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: TranslateOutputInput) => input)
  .handler(async ({ data }): Promise<{ payload: { [k: string]: JsonValue } }> => {
    const { payload, targetLocale } = data;
    if (!payload || typeof payload !== "object") return { payload };

    const apiKey = process.env.LOVABLE_API_KEY;
    if (!apiKey) throw new Error("LOVABLE_API_KEY missing");

    const lang = localeName(targetLocale);
    const system = `You are a professional marketing translator.

Translate every STRING VALUE inside the given JSON into ${lang}.

ABSOLUTE RULES:
- Return the SAME JSON structure with the SAME keys, arrays, nesting and numeric values.
- Do NOT translate keys. Do NOT add or remove keys.
- Do NOT translate numbers, booleans, URLs, email addresses, hex/uuid ids.
- Keep brand names, platform names (Xiaohongshu/小红书, Tmall/天猫, TikTok, Douyin, Instagram, WeChat), regulator acronyms (NMPA, KFTC, HKRMA), SKU codes and unit suffixes (mL, L, g, kg) in original form.
- Keep provenance tags exactly as-is: "Verified · SEMrush · <market>", "AI inference · category benchmark", "AI inference (SEMrush ... unavailable ...)".
- Keep the "_locale" field's value updated to "${targetLocale}".
- Output ONLY the JSON object. No prose, no markdown fences.`;

    const user = `Translate the string values of this JSON to ${lang}:\n${JSON.stringify(payload).slice(0, 30000)}`;

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
    let parsed: { [k: string]: JsonValue } = {};
    try {
      parsed = JSON.parse(content) as { [k: string]: JsonValue };
    } catch {
      const m = content.match(/\{[\s\S]*\}/);
      if (m) {
        try {
          parsed = JSON.parse(m[0]) as { [k: string]: JsonValue };
        } catch {
          throw new Error("AI returned non-JSON content");
        }
      } else throw new Error("AI returned non-JSON content");
    }
    if (parsed && typeof parsed === "object") {
      parsed._locale = targetLocale;
    }
    return { payload: parsed };
  });