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

export const BUILDER_STEP_LABEL: Record<BuilderStep, string> = {
  reading: "Reading website...",
  products: "Finding products...",
  story: "Extracting brand story...",
  positioning: "Analyzing positioning...",
  competitors: "Finding competitors...",
  knowledge: "Generating knowledge base...",
  creating: "Creating project...",
  completed: "Completed",
};

function normalizeDomain(website?: string): string {
  if (!website) return "";
  return website.replace(/^https?:\/\//i, "").replace(/^www\./i, "").replace(/\/.*$/, "");
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