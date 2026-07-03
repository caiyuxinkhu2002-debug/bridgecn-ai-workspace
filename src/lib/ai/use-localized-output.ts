import { useEffect, useMemo, useRef, useState } from "react";
import { useI18n } from "@/lib/i18n";
import { translateJobOutput } from "./translate-output.functions";

// Client-side auto-translator for AI job outputs.
// If the cached output was generated in a different UI language than the
// current one, we call the AI gateway ONCE to translate the string values
// and memoize the result per locale for the lifetime of the component.
//
// Usage:
//   const data = useLocalizedOutput(job?.output_data);
//   // `data` is the same shape, translated to the active UI locale.

type Dict = { [k: string]: unknown };

export function useLocalizedOutput<T extends Dict | null | undefined>(input: T): T {
  const { locale } = useI18n();
  const cacheRef = useRef<Map<string, Dict>>(new Map());
  const [, force] = useState(0);

  const sourceKey = useMemo(() => {
    if (!input || typeof input !== "object") return "";
    // Cheap identity key: source locale + a stable hash of JSON length +
    // first 120 chars of summary. Good enough for cache invalidation between
    // different jobs without hashing the full payload.
    try {
      const src = (input as Dict)._locale as string | undefined;
      const s = JSON.stringify(input);
      return `${src ?? "en"}::${s.length}::${s.slice(0, 120)}`;
    } catch {
      return "";
    }
  }, [input]);

  useEffect(() => {
    if (!input || typeof input !== "object" || !sourceKey) return;
    const src = ((input as Dict)._locale as string | undefined) ?? "en";
    if (src === locale) return;
    const cacheKey = `${sourceKey}->${locale}`;
    if (cacheRef.current.has(cacheKey)) {
      force((n) => n + 1);
      return;
    }
    let cancelled = false;
    (async () => {
      try {
        const res = await translateJobOutput({
          data: {
            payload: input as never,
            targetLocale: locale,
          },
        });
        if (cancelled) return;
        cacheRef.current.set(cacheKey, res.payload as Dict);
        force((n) => n + 1);
      } catch {
        // Silent fail — the untranslated original still renders.
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [input, sourceKey, locale]);

  if (!input || typeof input !== "object") return input;
  const src = ((input as Dict)._locale as string | undefined) ?? "en";
  if (src === locale) return input;
  const cacheKey = `${sourceKey}->${locale}`;
  const cached = cacheRef.current.get(cacheKey);
  return (cached as T) ?? input;
}
