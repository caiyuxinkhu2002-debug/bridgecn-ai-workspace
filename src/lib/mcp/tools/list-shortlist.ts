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
  name: "list_shortlist",
  title: "List KOL shortlist for a project",
  description: "List KOLs the user has shortlisted for one project, with status and match score.",
  inputSchema: { projectId: z.string().uuid().describe("Project UUID from list_projects.") },
  annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: false },
  handler: async ({ projectId }, ctx) => {
    if (!ctx.isAuthenticated())
      return { content: [{ type: "text", text: "Not authenticated" }], isError: true };
    const sb = supabaseFor(ctx);
    const { data, error } = await sb
      .from("kol_project_shortlist")
      .select("id,kol_id,status,match_score,match_breakdown,notes,added_at")
      .eq("project_id", projectId)
      .order("match_score", { ascending: false, nullsFirst: false });
    if (error) return { content: [{ type: "text", text: error.message }], isError: true };
    return {
      content: [{ type: "text", text: JSON.stringify(data ?? []) }],
      structuredContent: { shortlist: data ?? [] },
    };
  },
});