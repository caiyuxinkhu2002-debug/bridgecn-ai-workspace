import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import type { Stage } from "./workflow";

export type Workspace = { id: string; name: string; plan: string; region: string };

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

const WORKSPACES: Workspace[] = [
  { id: "seoul", name: "Seoul HQ", plan: "Pro", region: "KR" },
  { id: "shanghai", name: "Shanghai Office", plan: "Pro", region: "CN" },
  { id: "beijing", name: "Beijing Team", plan: "Team", region: "CN" },
  { id: "global", name: "Global Marketing", plan: "Enterprise", region: "GLOBAL" },
];

const ALL_PROJECTS: Project[] = [
  {
    id: "boj",
    workspaceId: "seoul",
    name: "Beauty of Joseon",
    initials: "BJ",
    industry: "Hanbang skincare",
    region: "Shanghai · Tier 1",
    stage: "consumer",
    owner: "Sora Kim",
    progress: 48,
    updated: "2h ago",
    summary: "Premium hanbang skincare entering Tmall and Xiaohongshu in Q3 2026.",
    kpi: [
      { label: "TAM", value: "¥48.2B" },
      { label: "Forecast GMV", value: "¥6.4B" },
      { label: "Break-even", value: "Q4 2027" },
    ],
  },
  {
    id: "anua",
    workspaceId: "seoul",
    name: "ANUA",
    initials: "AN",
    industry: "Skincare · clean beauty",
    region: "Tier 1 + Tier 1.5",
    stage: "localization",
    owner: "Jihoon Park",
    progress: 68,
    updated: "Yesterday",
    summary: "Xiaohongshu KOC seeding for Heartleaf line, 50 creators in pilot wave.",
    kpi: [
      { label: "KOC partners", value: "50" },
      { label: "Expected reach", value: "2.4M" },
      { label: "CPM target", value: "¥38" },
    ],
  },
  {
    id: "medicube",
    workspaceId: "seoul",
    name: "Medicube",
    initials: "MC",
    industry: "Derma cosmetics",
    region: "Mainland · Tier 1",
    stage: "launch",
    owner: "Minji Lee",
    progress: 86,
    updated: "3d ago",
    summary: "Tmall flagship store opening combined with Douyin live commerce kickoff.",
    kpi: [
      { label: "SKUs", value: "12" },
      { label: "Launch", value: "Sep 10" },
      { label: "Pre-orders", value: "8,400" },
    ],
  },
  {
    id: "roundlab",
    workspaceId: "shanghai",
    name: "Round Lab",
    initials: "RL",
    industry: "Mineral skincare",
    region: "Shanghai · Hangzhou",
    stage: "research",
    owner: "Sora Kim",
    progress: 22,
    updated: "1w ago",
    summary: "Early-stage feasibility for Dokdo cleanser line in Tier 1 China.",
    kpi: [
      { label: "Category", value: "Cleansers" },
      { label: "Survey size", value: "1,200" },
      { label: "Stage", value: "Research" },
    ],
  },
  {
    id: "torriden",
    workspaceId: "beijing",
    name: "Torriden",
    initials: "TR",
    industry: "Hydration skincare",
    region: "Mainland China",
    stage: "reports",
    owner: "Jihoon Park",
    progress: 100,
    updated: "2w ago",
    summary: "Douyin Q2 campaign retrospective and Q3 GMV forecast complete.",
    kpi: [
      { label: "GMV Q2", value: "¥2.1B" },
      { label: "ROAS", value: "4.8x" },
      { label: "Live sessions", value: "120" },
    ],
  },
];

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
};

const WorkspaceCtx = createContext<Ctx | null>(null);

const WS_KEY = "bridgecn.workspaceId";
const AP_KEY = "bridgecn.activeProjectId";
const NR_KEY = "bridgecn.notifsRead";

export function WorkspaceProvider({ children }: { children: ReactNode }) {
  const [workspaceId, setWorkspaceIdState] = useState("seoul");
  const [activeProjectId, setActiveProjectIdState] = useState("boj");
  const [projectsState, setProjectsState] = useState<Project[]>(ALL_PROJECTS);
  const [notifications, setNotifications] = useState<Notification[]>(DEFAULT_NOTIFICATIONS);

  useEffect(() => {
    try {
      const w = localStorage.getItem(WS_KEY);
      const p = localStorage.getItem(AP_KEY);
      const nr = localStorage.getItem(NR_KEY);
      if (w && WORKSPACES.find((x) => x.id === w)) setWorkspaceIdState(w);
      if (p && ALL_PROJECTS.find((x) => x.id === p)) setActiveProjectIdState(p);
      if (nr === "1") setNotifications((n) => n.map((x) => ({ ...x, read: true })));
    } catch {
      /* ignore */
    }
  }, []);

  const setWorkspaceId = useCallback((id: string) => {
    setWorkspaceIdState(id);
    try { localStorage.setItem(WS_KEY, id); } catch { /* ignore */ }
    // ensure active project belongs to this workspace
    const firstInWs = ALL_PROJECTS.find((p) => p.workspaceId === id);
    if (firstInWs) {
      setActiveProjectIdState(firstInWs.id);
      try { localStorage.setItem(AP_KEY, firstInWs.id); } catch { /* ignore */ }
    }
  }, []);

  const setActiveProjectId = useCallback((id: string) => {
    setActiveProjectIdState(id);
    try { localStorage.setItem(AP_KEY, id); } catch { /* ignore */ }
    const p = ALL_PROJECTS.find((x) => x.id === id);
    if (p && p.workspaceId !== workspaceId) {
      setWorkspaceIdState(p.workspaceId);
      try { localStorage.setItem(WS_KEY, p.workspaceId); } catch { /* ignore */ }
    }
  }, [workspaceId]);

  const advanceStage = useCallback((s: Stage) => {
    setProjectsState((list) =>
      list.map((p) => (p.id === activeProjectId ? { ...p, stage: s, updated: "just now" } : p)),
    );
  }, [activeProjectId]);

  const markAllRead = useCallback(() => {
    setNotifications((n) => n.map((x) => ({ ...x, read: true })));
    try { localStorage.setItem(NR_KEY, "1"); } catch { /* ignore */ }
  }, []);

  const activeWorkspace = useMemo(
    () => WORKSPACES.find((w) => w.id === workspaceId) ?? WORKSPACES[0],
    [workspaceId],
  );

  const projects = useMemo(
    () => projectsState.filter((p) => p.workspaceId === workspaceId),
    [projectsState, workspaceId],
  );

  const activeProject = useMemo(
    () => projectsState.find((p) => p.id === activeProjectId) ?? projectsState[0],
    [projectsState, activeProjectId],
  );

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
    workspaces: WORKSPACES,
    workspaceId,
    setWorkspaceId,
    activeWorkspace,
    projects,
    allProjects: projectsState,
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
  };

  return <WorkspaceCtx.Provider value={value}>{children}</WorkspaceCtx.Provider>;
}

export function useWorkspace() {
  const ctx = useContext(WorkspaceCtx);
  if (!ctx) throw new Error("useWorkspace must be used within WorkspaceProvider");
  return ctx;
}