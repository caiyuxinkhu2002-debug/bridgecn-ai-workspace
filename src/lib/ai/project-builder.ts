import type { KnowledgeBase } from "@/lib/workspace-context";

export type BuilderInput = { brandName: string; website?: string; targetMarket?: string };

export type BuilderStep =
  | "reading"
  | "products"
  | "story"
  | "positioning"
  | "competitors"
  | "knowledge"
  | "creating"
  | "completed";

export const BUILDER_STEPS: BuilderStep[] = [
  "reading",
  "products",
  "story",
  "positioning",
  "competitors",
  "knowledge",
  "creating",
  "completed",
];

// i18n keys for each pipeline step. The English fallback lives in the
// dictionary (en.json equivalent) — never hardcode UI text here.
export const BUILDER_STEP_KEY: Record<BuilderStep, string> = {
  reading: "builder.step.reading",
  products: "builder.step.products",
  story: "builder.step.story",
  positioning: "builder.step.positioning",
  competitors: "builder.step.competitors",
  knowledge: "builder.step.knowledge",
  creating: "builder.step.creating",
  completed: "builder.step.completed",
};

function normalizeDomain(website?: string): string {
  if (!website) return "";
  return website
    .replace(/^https?:\/\//i, "")
    .replace(/^www\./i, "")
    .replace(/\/.*$/, "");
}

// Placeholder generator — deterministic, brand-agnostic skeleton.
// Only the fields the user provided (or that are derivable from them)
// are populated. Every other field is left empty so the UI shows a
// "enrich your Knowledge Base" empty state instead of demo content.
// When a real provider is wired, replace this with a structured-output call.
export function synthesizeKnowledgeBase(input: BuilderInput): KnowledgeBase {
  const name = input.brandName.trim();
  const domain = normalizeDomain(input.website);
  const site = domain ? `https://${domain}` : input.website?.trim() || "";

  return {
    company: name || undefined,
    industry: undefined,
    category: undefined,
    products: [],
    brandStory: "",
    brandTone: [],
    keywords: [],
    competitors: [],
    targetAudience: "",
    koreanCopy: "",
    website: site,
    socialChannels: [],
  };
}
