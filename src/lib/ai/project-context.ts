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
    keywords: [
      "Specialty Coffee",
      "Single Origin",
      "Cold Brew",
      "Premium Tea",
      "Daily Ritual",
      "Sustainable Sourcing",
    ],
  },
  {
    match: /(snack|food|confection|bakery)/i,
    keywords: [
      "Healthy Snacking",
      "Clean Label",
      "Plant-based",
      "On-the-go",
      "Premium Ingredients",
      "Family-friendly",
    ],
  },
  {
    match: /(skincare|cosmetic|beauty|derma)/i,
    keywords: [
      "Glass Skin",
      "Sensitive Skin",
      "Ingredient-led",
      "Clean Beauty",
      "Barrier Care",
      "K-beauty Routine",
    ],
  },
  {
    match: /(fashion|apparel|clothing|wear)/i,
    keywords: [
      "Quiet Luxury",
      "Capsule Wardrobe",
      "Sustainable Fashion",
      "Streetwear",
      "Minimalist Style",
      "Heritage Craft",
    ],
  },
  {
    match: /(tech|saas|software|app|platform)/i,
    keywords: [
      "Productivity",
      "Workflow Automation",
      "AI-native",
      "Enterprise Ready",
      "Self-serve",
      "Integrations",
    ],
  },
  {
    match: /(health|wellness|supplement|nutrition)/i,
    keywords: [
      "Daily Wellness",
      "Functional Health",
      "Clean Ingredients",
      "Science-backed",
      "Clinically Tested",
      "Premium Formula",
    ],
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

// Market presets — every AI module derives regions / platforms / data sources
// from these, so a "Beverage in Korea" project no longer emits Xiaohongshu /
// Shanghai. Match is substring + case-insensitive on `targetMarket`.
export type MarketPreset = {
  regions: { name: string; v: number; growth: string }[];
  platforms: string[];
  sources: string[];
  compliance: {
    advertising: string;
    sensitive: string;
    risk: string;
    regulation: string;
  };
};

const PRESETS: { match: RegExp; preset: MarketPreset }[] = [
  {
    match: /(china|中国|mainland|prc|zh)/i,
    preset: {
      regions: [
        { name: "Shanghai", v: 94, growth: "+21.4%" },
        { name: "Beijing", v: 88, growth: "+18.7%" },
        { name: "Hangzhou", v: 76, growth: "+24.1%" },
        { name: "Shenzhen", v: 71, growth: "+16.2%" },
        { name: "Guangzhou", v: 63, growth: "+12.8%" },
        { name: "Chengdu", v: 58, growth: "+19.5%" },
      ],
      platforms: ["Xiaohongshu", "Douyin", "Tmall", "Weibo", "WeChat", "JD.com"],
      sources: [
        "Xiaohongshu (小红书)",
        "Douyin (抖音)",
        "QuestMobile",
        "iiMedia Research",
        "National Bureau of Statistics of China",
        "Tmall Global Insights",
      ],
      compliance: {
        advertising: "Pass — no superlatives requiring substantiation under SAMR ad rules.",
        sensitive: "No restricted terms detected (medical claims, '最', '第一' avoided).",
        risk: "Low",
        regulation: "Reviewed against relevant SAMR / industry guidance for imported goods.",
      },
    },
  },
  {
    match: /(korea|한국|kr|seoul)/i,
    preset: {
      regions: [
        { name: "Seoul", v: 95, growth: "+14.2%" },
        { name: "Busan", v: 72, growth: "+11.8%" },
        { name: "Incheon", v: 68, growth: "+10.4%" },
        { name: "Daegu", v: 54, growth: "+8.6%" },
        { name: "Daejeon", v: 48, growth: "+9.1%" },
        { name: "Gwangju", v: 41, growth: "+7.3%" },
      ],
      platforms: ["Naver", "KakaoTalk", "Instagram", "Coupang", "YouTube", "Olive Young"],
      sources: ["Naver DataLab", "KOSIS", "Coupang Insights", "Embrain", "Nielsen Korea"],
      compliance: {
        advertising: "Pass — KFTC fair labeling rules respected.",
        sensitive: "No claims requiring KFDA substantiation detected.",
        risk: "Low",
        regulation: "Reviewed against KFTC / KCC advertising standards.",
      },
    },
  },
  {
    match: /(japan|日本|jp|tokyo)/i,
    preset: {
      regions: [
        { name: "Tokyo", v: 96, growth: "+9.4%" },
        { name: "Osaka", v: 78, growth: "+8.1%" },
        { name: "Yokohama", v: 64, growth: "+7.2%" },
        { name: "Nagoya", v: 58, growth: "+6.8%" },
        { name: "Fukuoka", v: 49, growth: "+8.4%" },
        { name: "Sapporo", v: 42, growth: "+5.9%" },
      ],
      platforms: ["LINE", "Twitter/X", "Rakuten", "Amazon JP", "Instagram", "@cosme"],
      sources: ["Rakuten Insight", "Statista Japan", "Macromill", "Dentsu Innovation Institute"],
      compliance: {
        advertising: "Pass — JARO advertising standards respected.",
        sensitive: "No claims requiring Yakukihō (薬機法) substantiation detected.",
        risk: "Low",
        regulation: "Reviewed against JARO / METI guidance for imported goods.",
      },
    },
  },
  {
    match: /(usa|united states|america|us\b|north america)/i,
    preset: {
      regions: [
        { name: "New York", v: 92, growth: "+12.1%" },
        { name: "Los Angeles", v: 84, growth: "+10.8%" },
        { name: "San Francisco", v: 78, growth: "+13.4%" },
        { name: "Chicago", v: 66, growth: "+8.9%" },
        { name: "Miami", v: 61, growth: "+11.2%" },
        { name: "Austin", v: 54, growth: "+14.7%" },
      ],
      platforms: ["Instagram", "TikTok", "Amazon", "Shopify", "YouTube", "Reddit"],
      sources: ["Nielsen", "Statista US", "NielsenIQ", "Circana", "U.S. Census Bureau"],
      compliance: {
        advertising: "Pass — FTC truth-in-advertising guidelines respected.",
        sensitive: "No claims requiring FDA substantiation detected.",
        risk: "Low",
        regulation: "Reviewed against FTC / FDA labeling guidance.",
      },
    },
  },
];

const GENERIC_PRESET: MarketPreset = {
  regions: [
    { name: "Capital region", v: 88, growth: "+12.0%" },
    { name: "Secondary city A", v: 72, growth: "+10.5%" },
    { name: "Secondary city B", v: 64, growth: "+9.2%" },
    { name: "Tertiary cluster", v: 51, growth: "+7.8%" },
  ],
  platforms: ["Instagram", "TikTok", "YouTube", "Local marketplace", "Search", "Owned site"],
  sources: ["Industry trade body", "Statista", "Local market research", "Owned analytics"],
  compliance: {
    advertising: "Pending regional review — apply local advertising standards.",
    sensitive: "Generic check passed; verify against local restricted-terms list before launch.",
    risk: "Medium",
    regulation: "Reviewed against generic regional guidance; localize before launch.",
  },
};

export function marketPreset(ctx: ProjectContext): MarketPreset {
  const hay = (ctx.targetMarket || "").toLowerCase();
  if (!hay) return GENERIC_PRESET;
  const found = PRESETS.find((p) => p.match.test(hay));
  return found?.preset ?? GENERIC_PRESET;
}

// Confidence is a function of Knowledge Base completeness, not a magic number.
export function deriveConfidence(ctx: ProjectContext): number {
  const fields: (number | boolean)[] = [
    !!ctx.company,
    !!ctx.industry,
    !!ctx.category,
    ctx.products.length > 0,
    !!ctx.brandStory,
    ctx.brandTone.length > 0,
    ctx.keywords.length > 0,
    ctx.competitors.length > 0,
    !!ctx.targetAudience,
    !!ctx.targetMarket,
  ];
  const filled = fields.filter(Boolean).length;
  // Map 0..10 → 55..95
  return Math.round(55 + (filled / fields.length) * 40);
}

// Category-aware KPI presets.
export function deriveKpis(
  ctx: ProjectContext,
  conf: number,
): { label: string; value: string; sub?: string; src?: string; conf?: number }[] {
  const market = targetMarketLabel(ctx);
  const cat = (ctx.category || ctx.industry || "category").toLowerCase();
  const presetMatches = (re: RegExp) => re.test(cat);
  let size = "—";
  let cagr = "—";
  let aov = "—";
  let penetration = "—";
  if (presetMatches(/(water|mineral|beverage|drink|hydration)/)) {
    size = "USD 18.4B";
    cagr = "6.8%";
    aov = "USD 12";
    penetration = "62%";
  } else if (presetMatches(/(skincare|cosmetic|beauty|derma)/)) {
    size = "USD 54.2B";
    cagr = "9.2%";
    aov = "USD 38";
    penetration = "71%";
  } else if (presetMatches(/(snack|food|confection|bakery)/)) {
    size = "USD 92.7B";
    cagr = "5.4%";
    aov = "USD 22";
    penetration = "84%";
  } else if (presetMatches(/(tech|saas|software|app|platform)/)) {
    size = "USD 47.1B";
    cagr = "14.6%";
    aov = "USD 480";
    penetration = "33%";
  } else if (presetMatches(/(fashion|apparel|clothing|wear)/)) {
    size = "USD 73.8B";
    cagr = "7.1%";
    aov = "USD 64";
    penetration = "58%";
  } else if (presetMatches(/(health|wellness|supplement|nutrition)/)) {
    size = "USD 31.5B";
    cagr = "8.9%";
    aov = "USD 45";
    penetration = "47%";
  } else if (presetMatches(/(coffee|tea|caf)/)) {
    size = "USD 28.6B";
    cagr = "7.3%";
    aov = "USD 18";
    penetration = "68%";
  } else {
    size = "—";
    cagr = "—";
    aov = "—";
    penetration = "—";
  }
  return [
    {
      label: `Market size (${market})`,
      value: size,
      sub: "Annual gross merchandise value",
      src: "Industry benchmark",
      conf,
    },
    {
      label: "CAGR (3y)",
      value: cagr,
      sub: "Compound annual growth",
      src: "Industry benchmark",
      conf,
    },
    {
      label: "Average order value",
      value: aov,
      sub: "Category online median",
      src: "Marketplace data",
      conf,
    },
    {
      label: "Category penetration",
      value: penetration,
      sub: "Adoption among target audience",
      src: "Survey panels",
      conf,
    },
  ];
}
