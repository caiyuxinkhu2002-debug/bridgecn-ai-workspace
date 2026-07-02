import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

export type ChecklistItem = {
  id: string;
  project_id: string;
  phase_key: string;
  item_key: string;
  label: string;
  checked: boolean;
  checked_at: string | null;
  sort_order: number;
};

export const listChecklist = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { projectId: string }) => input)
  .handler(async ({ data, context }) => {
    const { data: rows, error } = await context.supabase
      .from("project_checklist")
      .select("id, project_id, phase_key, item_key, label, checked, checked_at, sort_order")
      .eq("project_id", data.projectId)
      .order("sort_order", { ascending: true });
    if (error) throw new Error(error.message);
    return (rows ?? []) as ChecklistItem[];
  });

export const seedChecklist = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator(
    (input: {
      projectId: string;
      phases: { key: string; name: string; items: { key: string; label: string }[] }[];
    }) => input,
  )
  .handler(async ({ data, context }) => {
    let order = 0;
    const rows: {
      project_id: string;
      phase_key: string;
      item_key: string;
      label: string;
      sort_order: number;
    }[] = [];
    for (const p of data.phases) {
      for (const it of p.items) {
        rows.push({
          project_id: data.projectId,
          phase_key: p.key,
          item_key: it.key,
          label: it.label,
          sort_order: order++,
        });
      }
    }
    if (rows.length === 0) return { inserted: 0 };
    // Upsert by (project_id, item_key) — preserves existing checked state.
    const { error } = await context.supabase
      .from("project_checklist")
      .upsert(rows, { onConflict: "project_id,item_key", ignoreDuplicates: true });
    if (error) throw new Error(error.message);
    return { inserted: rows.length };
  });

export const toggleChecklistItem = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { id: string; checked: boolean }) => input)
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase
      .from("project_checklist")
      .update({
        checked: data.checked,
        checked_at: data.checked ? new Date().toISOString() : null,
        checked_by: data.checked ? context.userId : null,
      })
      .eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });
