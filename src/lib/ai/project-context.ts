import type { KnowledgeBase, Project } from "@/lib/workspace-context";

// Single source of truth for every AI module. Built from the active
// project's Knowledge Base + core fields. Passed as `input.projectContext`
// into every createAndRunJob() call. Providers MUST derive output from
// this object — never from hardcoded brand/category data.
export type ProjectContext = {
  company: string;
  industry: string;
  category: string;
  products: string[];
  competitors: string[];
  website: string;
  targetAudience: string;
  targetMarket: string;
  brandStory: string;
  brandTone: string[];
  marketingCopy: string;
  keywords: string[];
  socialChannels: { label: string; url: string }[];
};

const EMPTY: ProjectContext = {
  company: "",
  industry: "",
  category: "",
  products: [],
  competitors: [],
  website: "",
  targetAudience: "",
  targetMarket: "",
  brandStory: "",
  brandTone: [],
  marketingCopy: "",
  keywords: [],
  socialChannels: [],
};

export function buildProjectContext(project: Project | null | undefined): ProjectContext {
  if (!project) return EMPTY;
  const kb: KnowledgeBase = project.knowledgeBase || {};
  return {
    company: kb.company || project.name || "",
    industry: kb.industry || project.industry || "",
    category: kb.category || "",
    products: kb.products || [],
    competitors: kb.competitors || [],
    website: kb.website || project.website || "",
    targetAudience: kb.targetAudience || "",
    targetMarket: project.targetMarket || project.region || "",
    brandStory: kb.brandStory || project.description || project.summary || "",
    brandTone: kb.brandTone || [],
    marketingCopy: kb.koreanCopy || "",
    keywords: kb.keywords || [],
    socialChannels: kb.socialChannels || [],
  };
}

// Category-aware keyword presets. Used as a deterministic fallback when the
// Knowledge Base has no keywords yet. Matches on substrings (case-insensitive)
// so "Natural Mineral Water" → water preset, "Skincare" → skincare preset, etc.
const CATEGORY_PRESETS: { match: RegExp; keywords: string[]; regions?: string[] }[] = [
  {
    match: /(water|mineral|beverage|drink|hydration)/i,
    keywords: [
      "Natural Mineral Water",
      "Healthy Hydration",
      "Premium Water",
      "Home Delivery",
      "Label-free Bottle",
      "Eco-friendly Packaging",
      "Volcanic Water",
      "Mineral Content",
    ],
  },
  {
    match: /(coffee|tea|caf)/i,
    keywords: ["Specialty Coffee", "Single Origin", "Cold Brew", "Premium Tea", "Daily Ritual", "Sustainable Sourcing"],
  },
  {
    match: /(snack|food|confection|bakery)/i,
    keywords: ["Healthy Snacking", "Clean Label", "Plant-based", "On-the-go", "Premium Ingredients", "Family-friendly"],
  },
  {
    match: /(skincare|cosmetic|beauty|derma)/i,
    keywords: ["Glass Skin", "Sensitive Skin", "Ingredient-led", "Clean Beauty", "Barrier Care", "K-beauty Routine"],
  },
  {
    match: /(fashion|apparel|clothing|wear)/i,
    keywords: ["Quiet Luxury", "Capsule Wardrobe", "Sustainable Fashion", "Streetwear", "Minimalist Style", "Heritage Craft"],
  },
  {
    match: /(tech|saas|software|app|platform)/i,
    keywords: ["Productivity", "Workflow Automation", "AI-native", "Enterprise Ready", "Self-serve", "Integrations"],
  },
  {
    match: /(health|wellness|supplement|nutrition)/i,
    keywords: ["Daily Wellness", "Functional Health", "Clean Ingredients", "Science-backed", "Clinically Tested", "Premium Formula"],
  },
];

export function deriveKeywords(ctx: ProjectContext, count = 6): string[] {
  if (ctx.keywords.length >= 3) return ctx.keywords.slice(0, count);
  const haystack = `${ctx.category} ${ctx.industry} ${ctx.products.join(" ")}`.toLowerCase();
  const preset = CATEGORY_PRESETS.find((p) => p.match.test(haystack));
  const base = preset?.keywords ?? [];
  const merged = Array.from(new Set([...(ctx.keywords ?? []), ...base])).slice(0, count);
  if (merged.length > 0) return merged;
  // Last-resort generic: derive from category/industry words
  const tokens = `${ctx.category} ${ctx.industry}`.split(/[\s,/·]+/).filter(Boolean);
  return tokens.slice(0, count);
}

export function describeBrand(ctx: ProjectContext): string {
  const parts: string[] = [];
  if (ctx.company) parts.push(ctx.company);
  if (ctx.category) parts.push(ctx.category);
  else if (ctx.industry) parts.push(ctx.industry);
  return parts.join(" · ") || "the brand";
}

export function targetMarketLabel(ctx: ProjectContext): string {
  return ctx.targetMarket || "the target market";
}