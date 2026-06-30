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

// Placeholder generator — deterministic synthesis from name + domain.
// When a real provider is wired, replace this with a structured-output call.
export function synthesizeKnowledgeBase(input: BuilderInput): KnowledgeBase {
  const name = input.brandName.trim() || "Untitled Brand";
  const domain = normalizeDomain(input.website);
  const site = domain ? `https://${domain}` : input.website || "";
  const market = input.targetMarket || "Mainland · Tier 1";

  return {
    company: name,
    industry: "Beauty & Personal Care",
    category: "Skincare",
    products: [
      `${name} Signature Serum`,
      `${name} Daily Moisturizer`,
      `${name} Gentle Cleanser`,
    ],
    brandStory:
      `${name} is a Korean brand built around clean, efficacy-driven formulas. ` +
      `Rooted in dermatological research, ${name} pairs minimalist routines with ` +
      `high-performance actives, targeting consumers who want visible results ` +
      `without unnecessary ingredients. Expanding into ${market} with a focus on ` +
      `digital-first storytelling and KOC-led seeding.`,
    brandTone: ["Clean", "Confident", "Scientific", "Warm"],
    keywords: [
      "K-beauty",
      "clean beauty",
      "barrier repair",
      "glass skin",
      "dermatologist-tested",
      name.toLowerCase().replace(/\s+/g, ""),
    ],
    competitors: ["Beauty of Joseon", "ANUA", "Round Lab", "Torriden", "Medicube"],
    targetAudience:
      `Chinese women aged 22–34 living in Tier 1 and Tier 1.5 cities, ` +
      `digitally native, active on Xiaohongshu and Douyin, value efficacy ` +
      `and ingredient transparency, willing to pay a premium for trusted ` +
      `K-beauty brands.`,
    koreanCopy:
      `${name} — 피부 본연의 균형을 위한 한국발 클린 뷰티. ` +
      `검증된 성분과 미니멀한 루틴으로 매일의 변화를 만드는 ${name}.`,
    website: site,
    socialChannels: [
      { label: "Instagram", url: `https://instagram.com/${domain ? domain.split(".")[0] : name.toLowerCase().replace(/\s+/g, "")}` },
      { label: "Xiaohongshu", url: "https://www.xiaohongshu.com/" },
      { label: "Douyin", url: "https://www.douyin.com/" },
    ],
  };
}