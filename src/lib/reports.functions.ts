import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import type { ProjectContext } from "./ai/project-context";
import { generateAIOutput, type JsonValue } from "./ai/generate.functions";

export type ReportRow = {
  id: string;
  workspace_id: string;
  project_id: string;
  title: string;
  type: string;
  status: string;
  summary: string | null;
  payload: { [k: string]: JsonValue };
  created_at: string;
};

export const listReports = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { workspaceId: string; projectId?: string | null }) => input)
  .handler(async ({ data, context }) => {
    let q = context.supabase
      .from("reports")
      .select("id, workspace_id, project_id, title, type, status, summary, payload, created_at")
      .eq("workspace_id", data.workspaceId)
      .order("created_at", { ascending: false });
    if (data.projectId) q = q.eq("project_id", data.projectId);
    const { data: rows, error } = await q;
    if (error) throw new Error(error.message);
    return (rows ?? []) as ReportRow[];
  });

export const getReport = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { id: string }) => input)
  .handler(async ({ data, context }) => {
    const { data: row, error } = await context.supabase
      .from("reports")
      .select("id, workspace_id, project_id, title, type, status, summary, payload, created_at")
      .eq("id", data.id)
      .maybeSingle();
    if (error) throw new Error(error.message);
    return (row ?? null) as ReportRow | null;
  });

export const deleteReport = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { id: string }) => input)
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase.from("reports").delete().eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const generateReportNow = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator(
    (input: {
      workspaceId: string;
      projectId: string;
      projectContext: ProjectContext;
      uiLocale?: "en" | "ko" | "zh";
    }) => input,
  )
  .handler(async ({ data, context }) => {
    // Pull the latest completed market/consumer/localization jobs to enrich the report.
    const sb = context.supabase;
    const { data: jobs } = await sb
      .from("ai_jobs")
      .select("module, output_data, output, completed_at")
      .eq("workspace_id", data.workspaceId)
      .eq("project_id", data.projectId)
      .eq("status", "completed")
      .order("completed_at", { ascending: false })
      .limit(50);
    const latest: Record<string, { output_data: unknown; output: string | null }> = {};
    for (const j of (jobs ?? []) as {
      module: string;
      output_data: unknown;
      output: string | null;
    }[]) {
      if (!latest[j.module]) latest[j.module] = { output_data: j.output_data, output: j.output };
    }
    const extra = {
      market: latest.market ?? null,
      consumer: latest.consumer ?? null,
      localization: latest.localization ?? null,
    };

    const result = await generateAIOutput({
      data: {
        module: "report",
        projectContext: data.projectContext,
        uiLocale: data.uiLocale,
        extra: extra as unknown as Record<string, unknown>,
      },
    });

    const payload = result.output_data;
    const title =
      (typeof payload.title === "string" && payload.title) ||
      `${data.projectContext.company || "Project"} — Market Entry Report`;
    const summary =
      (typeof payload.executiveSummary === "string" && payload.executiveSummary) ||
      result.summary ||
      "";

    const { data: row, error } = await sb
      .from("reports")
      .insert({
        workspace_id: data.workspaceId,
        project_id: data.projectId,
        title,
        type: "Market Entry Report",
        status: "Ready",
        summary,
        payload,
        generated_by: context.userId,
      })
      .select("id, workspace_id, project_id, title, type, status, summary, payload, created_at")
      .maybeSingle();
    if (error) throw new Error(error.message);
    return row as ReportRow;
  });
