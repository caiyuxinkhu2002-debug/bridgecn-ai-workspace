import { createClient } from "@supabase/supabase-js";
import { defineTool, type ToolContext } from "@lovable.dev/mcp-js";
import { z } from "zod";

function supabaseFor(ctx: ToolContext) {
  return createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_PUBLISHABLE_KEY!, {
    global: { headers: { Authorization: `Bearer ${ctx.getToken()}` } },
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

export default defineTool({
  name: "list_kols",
  title: "Browse China KOL catalog",
  description:
    "Browse the shared BridgeCN AI KOL catalog for the Chinese market (小红书, 抖音, B站, 微信). Filter by platform and category, sort by popularity or price. Follower counts and price bands may be AI-estimated — see ai_confidence per row.",
  inputSchema: {
    platform: z
      .enum(["xiaohongshu", "douyin", "bilibili", "wechat"])
      .optional()
      .describe("Restrict to one platform."),
    category: z
      .string()
      .optional()
      .describe("Match a primary category, e.g. beauty, fashion, food, lifestyle, parenting, health."),
    sortBy: z
      .enum(["popularity", "price_low", "price_high"])
      .optional()
      .describe("Sort order. Defaults to popularity."),
    limit: z.number().int().min(1).max(50).optional().describe("Max rows to return. Default 20."),
  },
  annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: false },
  handler: async ({ platform, category, sortBy, limit }, ctx) => {
    if (!ctx.isAuthenticated())
      return { content: [{ type: "text", text: "Not authenticated" }], isError: true };
    const sb = supabaseFor(ctx);
    let q = sb
      .from("kols")
      .select(
        "id,platform,handle,display_name,profile_url,followers,primary_categories,price_band,contact_public_email,contact_note,ai_confidence,data_source,popularity_score",
      )
      .is("workspace_id", null);
    if (platform) q = q.eq("platform", platform);
    if (category) q = q.contains("primary_categories", [category]);
    if (sortBy === "price_low") q = q.order("price_band->min", { ascending: true, nullsFirst: false });
    else if (sortBy === "price_high")
      q = q.order("price_band->max", { ascending: false, nullsFirst: false });
    else q = q.order("popularity_score", { ascending: false, nullsFirst: false });
    q = q.limit(limit ?? 20);
    const { data, error } = await q;
    if (error) return { content: [{ type: "text", text: error.message }], isError: true };
    return {
      content: [{ type: "text", text: JSON.stringify(data ?? []) }],
      structuredContent: { kols: data ?? [] },
    };
  },
});