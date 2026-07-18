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
  name: "add_kol_to_shortlist",
  title: "Add KOL to project shortlist",
  description:
    "Add a KOL to the project's shortlist (status = saved). Upserts on (project, kol) so re-adding is safe.",
  inputSchema: {
    projectId: z.string().uuid().describe("Project UUID from list_projects."),
    kolId: z.string().uuid().describe("KOL UUID from list_kols."),
    matchScore: z.number().optional().describe("Optional match score 0–100."),
  },
  annotations: { readOnlyHint: false, destructiveHint: false, idempotentHint: true, openWorldHint: false },
  handler: async ({ projectId, kolId, matchScore }, ctx) => {
    if (!ctx.isAuthenticated())
      return { content: [{ type: "text", text: "Not authenticated" }], isError: true };
    const sb = supabaseFor(ctx);
    const { error } = await sb.from("kol_project_shortlist").upsert(
      {
        project_id: projectId,
        kol_id: kolId,
        match_score: matchScore ?? null,
        added_by: ctx.getUserId(),
      },
      { onConflict: "project_id,kol_id" },
    );
    if (error) return { content: [{ type: "text", text: error.message }], isError: true };
    return { content: [{ type: "text", text: "Added to shortlist." }] };
  },
});