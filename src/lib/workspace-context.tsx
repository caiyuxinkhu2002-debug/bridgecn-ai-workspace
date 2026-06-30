import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import type { Stage } from "./workflow";
import { supabase } from "@/integrations/supabase/client";
import type { User } from "@supabase/supabase-js";

export type Workspace = { id: string; name: string; plan: string; region: string; logo_url: string | null };

export type KnowledgeBase = {
  company?: string;
  industry?: string;
  category?: string;
  products?: string[];
  brandStory?: string;
  brandTone?: string[];
  keywords?: string[];
  competitors?: string[];
  targetAudience?: string;
  koreanCopy?: string;
  website?: string;
  socialChannels?: { label: string; url: string }[];
};

export type Project = {
  id: string;
  workspaceId: string;
  name: string;
  initials: string;
  industry: string;
  region: string;
  stage: Stage;
  owner: string;
  progress: number;
  updated: string;
  kpi: { label: string; value: string }[];
  summary: string;
  description: string;
  targetMarket: string;
  archived: boolean;
  website: string;
  knowledgeBase: KnowledgeBase;
};

export type Profile = {
  id: string;
  email: string | null;
  name: string | null;
  company: string | null;
  role: string | null;
  avatar_url: string | null;
  preferred_language: string;
  theme: string;
};

export type WsMember = {
  id: string;
  workspace_id: string;
  user_id: string | null;
  email: string;
  name: string | null;
  role: "owner" | "admin" | "editor" | "viewer";
  joined_at: string | null;
};

export type Notification = {
  id: string;
  group: "today" | "yesterday" | "earlier";
  titleKey: string;
  bodyKey: string;
  time: string;
  read: boolean;
  link?: string;
  projectId?: string;
};

export type SearchItem = {
  kind: "project" | "report" | "localization" | "market" | "consumer";
  id: string;
  title: string;
  subtitle: string;
  link: string;
  projectId?: string;
};

function initialsOf(name: string): string {
  return name.split(/\s+/).map((p) => p[0]).filter(Boolean).slice(0, 2).join("").toUpperCase() || "·";
}

function relativeTime(iso: string): string {
  const t = new Date(iso).getTime();
  const diff = Date.now() - t;
  const m = Math.floor(diff / 60000);
  if (m < 1) return "just now";
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  const d = Math.floor(h / 24);
  if (d < 7) return `${d}d ago`;
  const w = Math.floor(d / 7);
  return `${w}w ago`;
}

const REPORTS = [
  { id: "r1", projectId: "boj", title: "Beauty of Joseon · China Expansion", type: "Market Entry", date: "Jun 24, 2026", status: "Ready" },
  { id: "r2", projectId: "anua", title: "ANUA · Xiaohongshu Strategy", type: "Channel Strategy", date: "Jun 18, 2026", status: "Ready" },
  { id: "r3", projectId: "medicube", title: "Medicube · Tmall Launch Plan", type: "Launch Plan", date: "Jun 12, 2026", status: "Ready" },
  { id: "r4", projectId: "roundlab", title: "Round Lab · Consumer Insight", type: "Consumer Research", date: "Jun 03, 2026", status: "Ready" },
  { id: "r5", projectId: "torriden", title: "Torriden · Douyin Campaign", type: "Campaign Brief", date: "May 28, 2026", status: "Draft" },
];

const LOC_JOBS = [
  { id: "l1", projectId: "boj", title: "Tmall PDP · Glow Serum", lang: "KR → CN", date: "Today", status: "In review" },
  { id: "l2", projectId: "anua", title: "Xiaohongshu caption · Heartleaf 77", lang: "KR → CN", date: "Yesterday", status: "Approved" },
  { id: "l3", projectId: "medicube", title: "Douyin live script · Booster", lang: "KR → CN", date: "Jun 21", status: "Draft" },
];

const MARKET_RESEARCH = [
  { id: "m1", projectId: "boj", title: "K-beauty TAM in Tier 1 cities", date: "Jun 20" },
  { id: "m2", projectId: "anua", title: "Xiaohongshu glass-skin trend brief", date: "Jun 14" },
  { id: "m3", projectId: "roundlab", title: "Cleanser category share — Tmall", date: "Jun 09" },
];

const CONSUMER_RESEARCH = [
  { id: "c1", projectId: "boj", title: "Persona · Xiao Ya, 24–32, Shanghai", date: "Jun 22" },
  { id: "c2", projectId: "anua", title: "Sentiment · ANUA reviews on Tmall", date: "Jun 17" },
  { id: "c3", projectId: "medicube", title: "Repurchase drivers · derma cosmetics", date: "Jun 10" },
];

const DEFAULT_NOTIFICATIONS: Notification[] = [
  { id: "n1", group: "today", titleKey: "notif.1.title", bodyKey: "notif.1.body", time: "12m", read: false, link: "/reports", projectId: "boj" },
  { id: "n2", group: "today", titleKey: "notif.2.title", bodyKey: "notif.2.body", time: "1h", read: false, link: "/china-market-insight", projectId: "boj" },
  { id: "n3", group: "today", titleKey: "notif.3.title", bodyKey: "notif.3.body", time: "3h", read: false, link: "/localization-studio", projectId: "anua" },
  { id: "n4", group: "yesterday", titleKey: "notif.4.title", bodyKey: "notif.4.body", time: "1d", read: true, link: "/projects", projectId: "medicube" },
  { id: "n5", group: "earlier", titleKey: "notif.5.title", bodyKey: "notif.5.body", time: "3d", read: true, link: "/launch-checklist" },
];

type Ctx = {
  workspaces: Workspace[];
  workspaceId: string;
  setWorkspaceId: (id: string) => void;
  activeWorkspace: Workspace;
  projects: Project[];
  allProjects: Project[];
  archivedProjects: Project[];
  activeProjectId: string;
  setActiveProjectId: (id: string) => void;
  activeProject: Project;
  advanceStage: (s: Stage) => void;
  notifications: Notification[];
  unreadCount: number;
  markAllRead: () => void;
  searchIndex: SearchItem[];
  reports: typeof REPORTS;
  locJobs: typeof LOC_JOBS;
  marketResearch: typeof MARKET_RESEARCH;
  consumerResearch: typeof CONSUMER_RESEARCH;
  // New backend-backed extras
  user: User | null;
  profile: Profile | null;
  members: WsMember[];
  isLoading: boolean;
  refreshProfile: () => Promise<void>;
  refreshWorkspaces: () => Promise<void>;
  refreshMembers: () => Promise<void>;
  refreshProjects: () => Promise<void>;
  createProject: (input: { name: string; industry?: string; targetMarket?: string; description?: string }) => Promise<Project | null>;
  updateProject: (id: string, patch: Partial<{ name: string; industry: string; region: string; targetMarket: string; description: string; summary: string; stage: Stage }>) => Promise<void>;
  deleteProject: (id: string) => Promise<void>;
  archiveProject: (id: string) => Promise<void>;
  unarchiveProject: (id: string) => Promise<void>;
  duplicateProject: (id: string) => Promise<Project | null>;
};

const WorkspaceCtx = createContext<Ctx | null>(null);

const WS_KEY = "bridgecn.workspaceId";
const AP_KEY = "bridgecn.activeProjectId";
const NR_KEY = "bridgecn.notifsRead";

export function WorkspaceProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [workspaces, setWorkspaces] = useState<Workspace[]>([]);
  const [projectsState, setProjectsState] = useState<Project[]>([]);
  const [members, setMembers] = useState<WsMember[]>([]);
  const [workspaceId, setWorkspaceIdState] = useState<string>("");
  const [activeProjectId, setActiveProjectIdState] = useState<string>("");
  const [notifications, setNotifications] = useState<Notification[]>(DEFAULT_NOTIFICATIONS);
  const [isLoading, setIsLoading] = useState(true);

  const mapProject = useCallback(
    (r: {
      id: string;
      workspace_id: string;
      name: string;
      initials: string | null;
      industry: string | null;
      region: string | null;
      stage: Stage;
      owner_name: string | null;
      progress: number;
      summary: string | null;
      description?: string | null;
      target_market?: string | null;
      updated_at: string;
      website?: string | null;
      knowledge_base?: unknown;
    }): Project => ({
      id: r.id,
      workspaceId: r.workspace_id,
      name: r.name,
      initials: r.initials || initialsOf(r.name),
      industry: r.industry || "—",
      region: r.region || "—",
      stage: r.stage,
      owner: r.owner_name || "—",
      progress: r.progress,
      updated: relativeTime(r.updated_at),
      kpi: [],
      summary: r.summary || "",
      description: r.description || "",
      targetMarket: r.target_market || "",
      archived: Boolean((r as { archived_at?: string | null }).archived_at),
      website: r.website || "",
      knowledgeBase: (r.knowledge_base && typeof r.knowledge_base === "object" ? r.knowledge_base : {}) as KnowledgeBase,
    }),
    [],
  );

  const refreshProfile = useCallback(async () => {
    const { data: u } = await supabase.auth.getUser();
    if (!u.user) { setUser(null); setProfile(null); return; }
    setUser(u.user);
    let { data: p } = await supabase.from("profiles").select("*").eq("id", u.user.id).maybeSingle();
    if (!p) {
      // Auto-create a profile row on first login if the signup trigger didn't run.
      const meta = (u.user.user_metadata ?? {}) as Record<string, unknown>;
      const fallbackName =
        (typeof meta.name === "string" && meta.name) ||
        (typeof meta.full_name === "string" && meta.full_name) ||
        (u.user.email ? u.user.email.split("@")[0] : null);
      const { data: created } = await supabase
        .from("profiles")
        .insert({ id: u.user.id, email: u.user.email ?? null, name: fallbackName })
        .select("*")
        .maybeSingle();
      p = created;
    }
    if (p) setProfile(p as Profile);
  }, []);

  const refreshWorkspaces = useCallback(async () => {
    const { data } = await supabase.from("workspaces").select("id,name,plan,region,logo_url").order("created_at", { ascending: true });
    const list = (data || []) as Workspace[];
    setWorkspaces(list);
    if (list.length && !list.find((w) => w.id === workspaceId)) {
      const saved = typeof window !== "undefined" ? localStorage.getItem(WS_KEY) : null;
      const chosen = (saved && list.find((w) => w.id === saved)) ? saved : list[0].id;
      setWorkspaceIdState(chosen);
    }
  }, [workspaceId]);

  const refreshProjects = useCallback(async () => {
    if (!workspaceId) return;
    const { data } = await supabase
      .from("projects")
      .select("*")
      .eq("workspace_id", workspaceId)
      .is("deleted_at", null)
      .order("created_at", { ascending: true });
    const mapped = (data || []).map(mapProject);
    setProjectsState(mapped);
    const active = mapped.filter((p) => !p.archived);
    if (active.length && !active.find((p) => p.id === activeProjectId)) {
      const saved = typeof window !== "undefined" ? localStorage.getItem(AP_KEY) : null;
      const chosen = (saved && active.find((p) => p.id === saved)) ? saved : active[0].id;
      setActiveProjectIdState(chosen);
    }
  }, [workspaceId, activeProjectId, mapProject]);

  const refreshMembers = useCallback(async () => {
    if (!workspaceId) { setMembers([]); return; }
    const { data } = await supabase.from("workspace_members").select("*").eq("workspace_id", workspaceId).order("invited_at", { ascending: true });
    setMembers((data || []) as WsMember[]);
  }, [workspaceId]);

  // Initial load + auth subscription
  useEffect(() => {
    let cancelled = false;
    const init = async () => {
      setIsLoading(true);
      try {
        const nr = typeof window !== "undefined" ? localStorage.getItem(NR_KEY) : null;
        if (nr === "1") setNotifications((n) => n.map((x) => ({ ...x, read: true })));
        await refreshProfile();
        if (cancelled) return;
        await refreshWorkspaces();
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    };
    init();
    const { data: sub } = supabase.auth.onAuthStateChange((event) => {
      if (event === "SIGNED_IN" || event === "SIGNED_OUT" || event === "USER_UPDATED") {
        refreshProfile();
        refreshWorkspaces();
      }
    });
    return () => { cancelled = true; sub.subscription.unsubscribe(); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => { if (workspaceId) { refreshProjects(); refreshMembers(); } }, [workspaceId, refreshProjects, refreshMembers]);

  // Apply preferred theme from profile (write-through to localStorage so root bootstrap also picks it up)
  useEffect(() => {
    if (!profile?.theme) return;
    try { localStorage.setItem("bridgecn.settings.theme", JSON.stringify(profile.theme)); } catch { /* ignore */ }
    if (typeof document !== "undefined") {
      const wantDark = profile.theme === "Dark" || (profile.theme === "System" && window.matchMedia("(prefers-color-scheme: dark)").matches);
      document.documentElement.classList.toggle("dark", wantDark);
    }
  }, [profile?.theme]);

  const setWorkspaceId = useCallback((id: string) => {
    setWorkspaceIdState(id);
    try { localStorage.setItem(WS_KEY, id); } catch { /* ignore */ }
  }, []);

  const setActiveProjectId = useCallback((id: string) => {
    setActiveProjectIdState(id);
    try { localStorage.setItem(AP_KEY, id); } catch { /* ignore */ }
    const p = projectsState.find((x) => x.id === id);
    if (p && p.workspaceId !== workspaceId) {
      setWorkspaceIdState(p.workspaceId);
      try { localStorage.setItem(WS_KEY, p.workspaceId); } catch { /* ignore */ }
    }
  }, [workspaceId, projectsState]);

  const advanceStage = useCallback(async (s: Stage) => {
    if (!activeProjectId) return;
    setProjectsState((list) => list.map((p) => (p.id === activeProjectId ? { ...p, stage: s, updated: "just now" } : p)));
    await supabase.from("projects").update({ stage: s }).eq("id", activeProjectId);
  }, [activeProjectId]);

  const createProject = useCallback(
    async (input: { name: string; industry?: string; targetMarket?: string; description?: string }): Promise<Project | null> => {
      if (!workspaceId) return null;
      const name = input.name.trim();
      if (!name) return null;
      const { data, error } = await supabase
        .from("projects")
        .insert({
          workspace_id: workspaceId,
          name,
          initials: initialsOf(name),
          industry: input.industry?.trim() || null,
          region: input.targetMarket?.trim() || null,
          target_market: input.targetMarket?.trim() || null,
          description: input.description?.trim() || null,
          summary: input.description?.trim() || null,
          owner_name: profile?.name || null,
          created_by: user?.id || null,
          stage: "research",
          progress: 0,
        })
        .select("*")
        .maybeSingle();
      if (error || !data) return null;
      const mapped = mapProject(data);
      setProjectsState((list) => [...list, mapped]);
      setActiveProjectIdState(mapped.id);
      try { localStorage.setItem(AP_KEY, mapped.id); } catch { /* ignore */ }
      return mapped;
    },
    [workspaceId, profile?.name, user?.id, mapProject],
  );

  const updateProject = useCallback(
    async (id: string, patch: Partial<{ name: string; industry: string; region: string; targetMarket: string; description: string; summary: string; stage: Stage }>) => {
      type ProjectUpdate = {
        name?: string;
        initials?: string;
        industry?: string | null;
        region?: string | null;
        target_market?: string | null;
        description?: string | null;
        summary?: string | null;
        stage?: Stage;
      };
      const dbPatch: ProjectUpdate = {};
      if (patch.name !== undefined) { dbPatch.name = patch.name.trim(); dbPatch.initials = initialsOf(patch.name); }
      if (patch.industry !== undefined) dbPatch.industry = patch.industry.trim() || null;
      if (patch.region !== undefined) dbPatch.region = patch.region.trim() || null;
      if (patch.targetMarket !== undefined) {
        dbPatch.target_market = patch.targetMarket.trim() || null;
        dbPatch.region = patch.targetMarket.trim() || null;
      }
      if (patch.description !== undefined) {
        dbPatch.description = patch.description.trim() || null;
        dbPatch.summary = patch.description.trim() || null;
      }
      if (patch.summary !== undefined) dbPatch.summary = patch.summary.trim() || null;
      if (patch.stage !== undefined) dbPatch.stage = patch.stage;
      const { error } = await supabase.from("projects").update(dbPatch as never).eq("id", id);
      if (error) throw error;
      await refreshProjects();
    },
    [refreshProjects],
  );

  const deleteProject = useCallback(
    async (id: string) => {
      const { error } = await supabase.from("projects").update({ deleted_at: new Date().toISOString() }).eq("id", id);
      if (error) throw error;
      setProjectsState((list) => list.filter((p) => p.id !== id));
      if (activeProjectId === id) {
        const next = projectsState.find((p) => p.id !== id && !p.archived);
        if (next) {
          setActiveProjectIdState(next.id);
          try { localStorage.setItem(AP_KEY, next.id); } catch { /* ignore */ }
        }
      }
    },
    [activeProjectId, projectsState],
  );

  const archiveProject = useCallback(async (id: string) => {
    const { error } = await supabase.from("projects").update({ archived_at: new Date().toISOString() } as never).eq("id", id);
    if (error) throw error;
    setProjectsState((list) => list.map((p) => (p.id === id ? { ...p, archived: true } : p)));
    if (activeProjectId === id) {
      const next = projectsState.find((p) => p.id !== id && !p.archived);
      if (next) {
        setActiveProjectIdState(next.id);
        try { localStorage.setItem(AP_KEY, next.id); } catch { /* ignore */ }
      }
    }
  }, [activeProjectId, projectsState]);

  const unarchiveProject = useCallback(async (id: string) => {
    const { error } = await supabase.from("projects").update({ archived_at: null } as never).eq("id", id);
    if (error) throw error;
    setProjectsState((list) => list.map((p) => (p.id === id ? { ...p, archived: false } : p)));
  }, []);

  const duplicateProject = useCallback(async (id: string): Promise<Project | null> => {
    const src = projectsState.find((p) => p.id === id);
    if (!src || !workspaceId) return null;
    const newName = `${src.name} (Copy)`;
    const { data, error } = await supabase
      .from("projects")
      .insert({
        workspace_id: workspaceId,
        name: newName,
        initials: initialsOf(newName),
        industry: src.industry === "—" ? null : src.industry,
        region: src.region === "—" ? null : src.region,
        target_market: src.targetMarket || null,
        description: src.description || null,
        summary: src.summary || null,
        owner_name: profile?.name || src.owner || null,
        created_by: user?.id || null,
        stage: "research",
        progress: 0,
      })
      .select("*")
      .maybeSingle();
    if (error || !data) return null;
    const mapped = mapProject(data);
    setProjectsState((list) => [...list, mapped]);
    return mapped;
  }, [projectsState, workspaceId, profile?.name, user?.id, mapProject]);

  const markAllRead = useCallback(() => {
    setNotifications((n) => n.map((x) => ({ ...x, read: true })));
    try { localStorage.setItem(NR_KEY, "1"); } catch { /* ignore */ }
  }, []);

  const FALLBACK_WS: Workspace = { id: "", name: "—", plan: "Free", region: "KR", logo_url: null };
  const FALLBACK_PROJECT: Project = { id: "", workspaceId: "", name: "—", initials: "—", industry: "—", region: "—", stage: "research" as Stage, owner: "—", progress: 0, updated: "", kpi: [], summary: "", description: "", targetMarket: "", archived: false, website: "", knowledgeBase: {} };
  const activeWorkspace = useMemo<Workspace>(() => workspaces.find((w) => w.id === workspaceId) ?? workspaces[0] ?? FALLBACK_WS, [workspaces, workspaceId]);
  const projects = useMemo(() => projectsState.filter((p) => p.workspaceId === workspaceId && !p.archived), [projectsState, workspaceId]);
  const archivedProjects = useMemo(() => projectsState.filter((p) => p.workspaceId === workspaceId && p.archived), [projectsState, workspaceId]);
  const activeProject = useMemo<Project>(() => projectsState.find((p) => p.id === activeProjectId) ?? projects[0] ?? FALLBACK_PROJECT, [projectsState, activeProjectId, projects]);

  const searchIndex = useMemo<SearchItem[]>(() => {
    const items: SearchItem[] = [];
    for (const p of projectsState) {
      items.push({ kind: "project", id: p.id, title: p.name, subtitle: p.industry, link: `/projects/${p.id}`, projectId: p.id });
    }
    for (const r of REPORTS) {
      items.push({ kind: "report", id: r.id, title: r.title, subtitle: `${r.type} · ${r.date}`, link: "/reports", projectId: r.projectId });
    }
    for (const l of LOC_JOBS) {
      items.push({ kind: "localization", id: l.id, title: l.title, subtitle: `${l.lang} · ${l.status}`, link: "/localization-studio", projectId: l.projectId });
    }
    for (const m of MARKET_RESEARCH) {
      items.push({ kind: "market", id: m.id, title: m.title, subtitle: `Market research · ${m.date}`, link: "/china-market-insight", projectId: m.projectId });
    }
    for (const c of CONSUMER_RESEARCH) {
      items.push({ kind: "consumer", id: c.id, title: c.title, subtitle: `Consumer research · ${c.date}`, link: "/consumer-insight", projectId: c.projectId });
    }
    return items;
  }, [projectsState]);

  const value: Ctx = {
    workspaces,
    workspaceId,
    setWorkspaceId,
    activeWorkspace,
    projects,
    allProjects: projectsState,
    archivedProjects,
    activeProjectId,
    setActiveProjectId,
    activeProject,
    advanceStage,
    notifications,
    unreadCount: notifications.filter((n) => !n.read).length,
    markAllRead,
    searchIndex,
    reports: REPORTS,
    locJobs: LOC_JOBS,
    marketResearch: MARKET_RESEARCH,
    consumerResearch: CONSUMER_RESEARCH,
    user,
    profile,
    members,
    isLoading,
    refreshProfile,
    refreshWorkspaces,
    refreshMembers,
    refreshProjects,
    createProject,
    updateProject,
    deleteProject,
    archiveProject,
    unarchiveProject,
    duplicateProject,
  };

  return <WorkspaceCtx.Provider value={value}>{children}</WorkspaceCtx.Provider>;
}

export function useWorkspace() {
  const ctx = useContext(WorkspaceCtx);
  if (!ctx) throw new Error("useWorkspace must be used within WorkspaceProvider");
  return ctx;
}