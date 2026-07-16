import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

export type KolRow = {
  id: string;
  platform: "xiaohongshu" | "douyin" | "bilibili" | "wechat";
  handle: string;
  display_name: string | null;
  profile_url: string;
  avatar_url: string | null;
  followers: number | null;
  bio: string | null;
  primary_categories: string[];
  content_types: string[];
  tone: string[];
  audience_profile: Record<string, string | number | string[] | null>;
  mentioned_brands: string[];
  contact_public_email: string | null;
  contact_note: string | null;
  price_band: { min?: number; max?: number; currency?: string; confidence?: string } | null;
  ai_confidence: Record<string, string>;
  verified_source: "crawl" | "manual";
  last_crawled_at: string | null;
  updated_at: string;
  data_source?: "crawl" | "seed" | "api" | string;
  popularity_score?: number | null;
};

const SELECT_COLS =
  "id,platform,handle,display_name,profile_url,avatar_url,followers,bio,primary_categories,content_types,tone,audience_profile,mentioned_brands,contact_public_email,contact_note,price_band,ai_confidence,verified_source,last_crawled_at,updated_at,data_source,popularity_score,workspace_id";

export const listKols = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { workspaceId: string }) => input)
  .handler(async ({ data, context }): Promise<KolRow[]> => {
    const { data: rows, error } = await context.supabase
      .from("kols")
      .select(SELECT_COLS)
      // Include the shared/global catalog (workspace_id IS NULL) plus this workspace's own rows.
      .or(`workspace_id.is.null,workspace_id.eq.${data.workspaceId}`)
      .order("popularity_score", { ascending: false, nullsFirst: false });
    if (error) throw new Error(error.message);
    return (rows || []) as unknown as KolRow[];
  });

export const getKol = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { kolId: string }) => input)
  .handler(async ({ data, context }): Promise<KolRow | null> => {
    const { data: row } = await context.supabase
      .from("kols")
      .select(SELECT_COLS)
      .eq("id", data.kolId)
      .maybeSingle();
    return (row as unknown as KolRow) || null;
  });

export const deleteKol = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { kolId: string }) => input)
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase.from("kols").delete().eq("id", data.kolId);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

// --- Shortlist ---

export type ShortlistRow = {
  id: string;
  kol_id: string;
  status: "saved" | "contacted" | "rejected" | "booked";
  match_score: number | null;
  match_breakdown: Record<string, number> | null;
  notes: string | null;
  added_at: string;
};

export const listShortlist = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { projectId: string }) => input)
  .handler(async ({ data, context }): Promise<ShortlistRow[]> => {
    const { data: rows, error } = await context.supabase
      .from("kol_project_shortlist")
      .select("id,kol_id,status,match_score,match_breakdown,notes,added_at")
      .eq("project_id", data.projectId)
      .order("match_score", { ascending: false, nullsFirst: false });
    if (error) throw new Error(error.message);
    return (rows || []) as unknown as ShortlistRow[];
  });

export const addToShortlist = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator(
    (input: {
      projectId: string;
      kolId: string;
      matchScore?: number;
      matchBreakdown?: Record<string, number>;
    }) => input,
  )
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase.from("kol_project_shortlist").upsert(
      {
        project_id: data.projectId,
        kol_id: data.kolId,
        match_score: data.matchScore ?? null,
        match_breakdown: data.matchBreakdown
          ? JSON.parse(JSON.stringify(data.matchBreakdown))
          : null,
        added_by: context.userId,
      },
      { onConflict: "project_id,kol_id" },
    );
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const removeFromShortlist = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { projectId: string; kolId: string }) => input)
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase
      .from("kol_project_shortlist")
      .delete()
      .eq("project_id", data.projectId)
      .eq("kol_id", data.kolId);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const updateShortlistStatus = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator(
    (input: {
      projectId: string;
      kolId: string;
      status: "saved" | "contacted" | "rejected" | "booked";
      notes?: string;
    }) => input,
  )
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase
      .from("kol_project_shortlist")
      .update({ status: data.status, notes: data.notes ?? null })
      .eq("project_id", data.projectId)
      .eq("kol_id", data.kolId);
    if (error) throw new Error(error.message);
    return { ok: true };
  });