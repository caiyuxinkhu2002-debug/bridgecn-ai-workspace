import { Link, Outlet, useRouter, useRouterState } from "@tanstack/react-router";
import {
  LayoutDashboard,
  FolderKanban,
  LineChart,
  Users,
  Languages,
  ListChecks,
  FileBarChart,
  Settings,
  Search,
  Bell,
  Sparkles,
  Plus,
  Globe,
  Check,
  ChevronsUpDown,
  Sparkle,
  CircleUser,
  Palette,
  CreditCard,
  KeyRound,
  LogOut,
  Building2,
  Megaphone,
  Wand2,
  ShareIcon,
  TrendingUp,
} from "lucide-react";
import { useEffect, useRef, useState, type ReactNode } from "react";
import { localeLabels, useI18n, type Locale } from "@/lib/i18n";

const navSections: {
  labelKey: string;
  items: { to: string; labelKey: string; icon: typeof LayoutDashboard; exact?: boolean }[];
}[] = [
  {
    labelKey: "nav.section.workspace",
    items: [
      { to: "/", labelKey: "nav.dashboard", icon: LayoutDashboard, exact: true },
      { to: "/projects", labelKey: "nav.projects", icon: FolderKanban },
      { to: "/reports", labelKey: "nav.reports", icon: FileBarChart },
    ],
  },
  {
    labelKey: "nav.section.intelligence",
    items: [
      { to: "/china-market-insight", labelKey: "nav.market", icon: LineChart },
      { to: "/consumer-insight", labelKey: "nav.consumer", icon: Users },
      { to: "/localization-studio", labelKey: "nav.localization", icon: Languages },
      { to: "/launch-checklist", labelKey: "nav.launch", icon: ListChecks },
    ],
  },
  {
    labelKey: "nav.section.account",
    items: [{ to: "/settings", labelKey: "nav.settings", icon: Settings }],
  },
];

function useOutside<T extends HTMLElement>(onClose: () => void) {
  const ref = useRef<T | null>(null);
  useEffect(() => {
    function handle(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) onClose();
    }
    document.addEventListener("mousedown", handle);
    return () => document.removeEventListener("mousedown", handle);
  }, [onClose]);
  return ref;
}

function LanguageSwitcher() {
  const { locale, setLocale, t } = useI18n();
  const [open, setOpen] = useState(false);
  const ref = useOutside<HTMLDivElement>(() => setOpen(false));
  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen((v) => !v)}
        className="inline-flex h-9 items-center gap-1.5 rounded-md border border-[var(--border)] bg-[var(--background)] px-2.5 text-xs font-medium hover:bg-[var(--muted)]"
        aria-label={t("menu.language")}
      >
        <Globe className="h-3.5 w-3.5 text-[var(--muted-foreground)]" />
        <span className="hidden sm:inline">{locale.toUpperCase()}</span>
      </button>
      {open && (
        <div className="absolute right-0 z-50 mt-2 w-44 overflow-hidden rounded-xl border border-[var(--border)] bg-[var(--popover)] p-1 shadow-[var(--shadow-card)]">
          {(Object.keys(localeLabels) as Locale[]).map((l) => (
            <button
              key={l}
              onClick={() => {
                setLocale(l);
                setOpen(false);
              }}
              className="flex w-full items-center justify-between rounded-md px-2.5 py-2 text-sm hover:bg-[var(--muted)]"
            >
              <span>{localeLabels[l]}</span>
              {l === locale && <Check className="h-3.5 w-3.5 text-[var(--primary)]" />}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

function NotificationBell() {
  const { t } = useI18n();
  const [open, setOpen] = useState(false);
  const ref = useOutside<HTMLDivElement>(() => setOpen(false));
  const items = [
    { id: 1, icon: FileBarChart, unread: true, time: "2m" },
    { id: 2, icon: TrendingUp, unread: true, time: "1h" },
    { id: 3, icon: Wand2, unread: true, time: "3h" },
    { id: 4, icon: ShareIcon, unread: false, time: "Yesterday" },
    { id: 5, icon: Sparkle, unread: false, time: "2d" },
  ];
  const unread = items.filter((i) => i.unread).length;
  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen((v) => !v)}
        className="relative grid h-9 w-9 place-items-center rounded-md border border-[var(--border)] bg-[var(--background)] hover:bg-[var(--muted)]"
        aria-label={t("menu.notifications")}
      >
        <Bell className="h-4 w-4 text-[var(--muted-foreground)]" />
        {unread > 0 && (
          <span className="absolute right-1.5 top-1.5 h-2 w-2 rounded-full bg-[var(--primary)] ring-2 ring-[var(--background)]" />
        )}
      </button>
      {open && (
        <div className="absolute right-0 z-50 mt-2 w-[340px] overflow-hidden rounded-2xl border border-[var(--border)] bg-[var(--popover)] shadow-[var(--shadow-card)]">
          <div className="flex items-center justify-between border-b border-[var(--border)] px-4 py-3">
            <div className="text-sm font-semibold">{t("notif.title")}</div>
            <button className="text-xs font-medium text-[var(--muted-foreground)] hover:text-[var(--foreground)]">
              {t("notif.markAll")}
            </button>
          </div>
          <ul className="max-h-[360px] divide-y divide-[var(--border)] overflow-auto">
            {items.map((n) => {
              const Icon = n.icon;
              return (
                <li key={n.id} className="flex items-start gap-3 px-4 py-3 hover:bg-[var(--muted)]/60">
                  <div className="mt-0.5 grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-[var(--muted)]">
                    <Icon className="h-3.5 w-3.5 text-[var(--foreground)]" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <p className="truncate text-sm font-medium">{t(`notif.${n.id}.title`)}</p>
                      {n.unread && <span className="h-1.5 w-1.5 rounded-full bg-[var(--primary)]" />}
                    </div>
                    <p className="truncate text-xs text-[var(--muted-foreground)]">
                      {t(`notif.${n.id}.body`)}
                    </p>
                  </div>
                  <span className="shrink-0 text-[11px] text-[var(--muted-foreground)]">{n.time}</span>
                </li>
              );
            })}
          </ul>
          <div className="border-t border-[var(--border)] px-4 py-2 text-center">
            <button className="text-xs font-medium text-[var(--muted-foreground)] hover:text-[var(--foreground)]">
              {t("notif.viewAll")}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function WorkspaceSwitcher() {
  const { t } = useI18n();
  const [open, setOpen] = useState(false);
  const ref = useOutside<HTMLDivElement>(() => setOpen(false));
  const workspaces = [
    { name: t("top.workspace"), plan: "Free" },
    { name: "Beauty of Joseon", plan: "Pro" },
    { name: "ANUA Global", plan: "Pro" },
  ];
  const [current, setCurrent] = useState(workspaces[0].name);
  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen((v) => !v)}
        className="hidden sm:inline-flex h-9 items-center gap-2 rounded-md border border-[var(--border)] bg-[var(--background)] px-2.5 text-xs font-medium hover:bg-[var(--muted)]"
      >
        <div className="grid h-5 w-5 place-items-center rounded bg-gradient-to-br from-[var(--primary)] to-[oklch(0.62_0.22_300)] text-[10px] font-bold text-white">
          B
        </div>
        <span className="max-w-[120px] truncate">{current}</span>
        <ChevronsUpDown className="h-3 w-3 text-[var(--muted-foreground)]" />
      </button>
      {open && (
        <div className="absolute right-0 z-50 mt-2 w-60 overflow-hidden rounded-xl border border-[var(--border)] bg-[var(--popover)] p-1 shadow-[var(--shadow-card)]">
          {workspaces.map((w) => (
            <button
              key={w.name}
              onClick={() => {
                setCurrent(w.name);
                setOpen(false);
              }}
              className="flex w-full items-center gap-2 rounded-md px-2.5 py-2 text-sm hover:bg-[var(--muted)]"
            >
              <Building2 className="h-3.5 w-3.5 text-[var(--muted-foreground)]" />
              <span className="flex-1 truncate text-left">{w.name}</span>
              <span className="text-[10px] uppercase text-[var(--muted-foreground)]">{w.plan}</span>
              {w.name === current && <Check className="h-3.5 w-3.5 text-[var(--primary)]" />}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

function UserMenu() {
  const { t } = useI18n();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const ref = useOutside<HTMLDivElement>(() => setOpen(false));
  const items: { label: string; icon: typeof CircleUser; to?: string }[] = [
    { label: t("menu.profile"), icon: CircleUser, to: "/settings" },
    { label: t("menu.workspace"), icon: Building2, to: "/settings" },
    { label: t("menu.notifications"), icon: Bell, to: "/settings" },
    { label: t("menu.appearance"), icon: Palette, to: "/settings" },
    { label: t("menu.billing"), icon: CreditCard, to: "/settings" },
    { label: t("menu.apiKeys"), icon: KeyRound, to: "/settings" },
  ];
  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen((v) => !v)}
        className="grid h-9 w-9 place-items-center rounded-full bg-gradient-to-br from-[var(--primary)] to-[oklch(0.45_0.22_280)] text-xs font-semibold text-white ring-2 ring-[var(--background)] hover:opacity-90"
      >
        SK
      </button>
      {open && (
        <div className="absolute right-0 z-50 mt-2 w-64 overflow-hidden rounded-2xl border border-[var(--border)] bg-[var(--popover)] shadow-[var(--shadow-card)]">
          <div className="border-b border-[var(--border)] px-4 py-3">
            <p className="text-xs text-[var(--muted-foreground)]">{t("menu.signedInAs")}</p>
            <p className="mt-0.5 text-sm font-semibold">Sora Kim</p>
            <p className="text-xs text-[var(--muted-foreground)]">sora@beautyofjoseon.com</p>
          </div>
          <div className="p-1">
            {items.map((item) => {
              const Icon = item.icon;
              return (
                <button
                  key={item.label}
                  onClick={() => {
                    setOpen(false);
                    if (item.to) router.navigate({ to: item.to });
                  }}
                  className="flex w-full items-center gap-2.5 rounded-md px-2.5 py-2 text-sm hover:bg-[var(--muted)]"
                >
                  <Icon className="h-3.5 w-3.5 text-[var(--muted-foreground)]" />
                  {item.label}
                </button>
              );
            })}
          </div>
          <div className="border-t border-[var(--border)] p-1">
            <button
              onClick={() => {
                setOpen(false);
                router.navigate({ to: "/login" });
              }}
              className="flex w-full items-center gap-2.5 rounded-md px-2.5 py-2 text-sm text-[var(--destructive)] hover:bg-[var(--muted)]"
            >
              <LogOut className="h-3.5 w-3.5" />
              {t("menu.logout")}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export function AppShell({ children }: { children?: ReactNode }) {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const { t } = useI18n();

  return (
    <div className="flex min-h-screen w-full bg-[var(--muted)]">
      {/* Sidebar */}
      <aside className="hidden md:flex w-60 shrink-0 flex-col border-r border-[var(--sidebar-border)] bg-[var(--sidebar)] px-3 py-4">
        <Link to="/" className="flex items-center gap-2 px-2 pb-5">
          <div className="grid h-8 w-8 place-items-center rounded-lg bg-gradient-to-br from-[var(--primary)] to-[oklch(0.45_0.22_280)] text-white shadow-sm">
            <Sparkles className="h-4 w-4" />
          </div>
          <div className="leading-tight">
            <div className="text-sm font-semibold tracking-tight">BridgeCN AI</div>
            <div className="text-[11px] text-[var(--muted-foreground)]">{t("brand.tag")}</div>
          </div>
        </Link>

        <nav className="flex flex-1 flex-col gap-5 overflow-y-auto">
          {navSections.map((section) => (
            <div key={section.labelKey}>
              <div className="px-2.5 pb-1.5 text-[10px] font-semibold uppercase tracking-[0.08em] text-[var(--muted-foreground)]/70">
                {t(section.labelKey)}
              </div>
              <div className="flex flex-col gap-0.5">
                {section.items.map((item) => {
                  const active = item.exact ? pathname === item.to : pathname.startsWith(item.to);
                  const Icon = item.icon;
                  return (
                    <Link
                      key={item.to}
                      to={item.to as string}
                      className={`group relative flex items-center gap-2.5 rounded-md px-2.5 py-1.5 text-[13px] transition-all ${
                        active
                          ? "bg-[var(--background)] text-[var(--foreground)] font-medium shadow-[var(--shadow-soft)]"
                          : "text-[var(--muted-foreground)] hover:bg-[var(--background)]/60 hover:text-[var(--foreground)]"
                      }`}
                    >
                      {active && (
                        <span className="absolute left-0 top-1/2 h-4 w-0.5 -translate-y-1/2 rounded-r-full bg-[var(--primary)]" />
                      )}
                      <Icon className={`h-4 w-4 shrink-0 ${active ? "text-[var(--primary)]" : ""}`} />
                      <span className="truncate">{t(item.labelKey)}</span>
                    </Link>
                  );
                })}
              </div>
            </div>
          ))}
        </nav>

        <div className="mt-4 overflow-hidden rounded-xl border border-[var(--border)] bg-gradient-to-br from-[var(--background)] to-[var(--primary-soft)] p-3">
          <div className="flex items-center gap-1.5 text-xs font-semibold">
            <Sparkle className="h-3 w-3 text-[var(--primary)]" />
            {t("plan.free")}
          </div>
          <div className="mt-1 text-[11px] text-[var(--muted-foreground)]">{t("plan.credits")}</div>
          <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-[var(--border)]">
            <div className="h-full w-[24%] rounded-full bg-[var(--primary)]" />
          </div>
          <button className="mt-3 w-full rounded-md bg-[var(--foreground)] px-2.5 py-1.5 text-xs font-medium text-[var(--background)] hover:opacity-90">
            {t("plan.upgrade")}
          </button>
        </div>
      </aside>

      {/* Main */}
      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-20 flex h-14 items-center gap-2 border-b border-[var(--border)] bg-[var(--background)]/80 px-4 backdrop-blur md:px-6">
          <WorkspaceSwitcher />
          <div className="relative flex-1 max-w-md">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--muted-foreground)]" />
            <input
              type="search"
              placeholder={t("top.search")}
              className="h-9 w-full rounded-md border border-[var(--border)] bg-[var(--muted)] pl-9 pr-12 text-sm placeholder:text-[var(--muted-foreground)] focus:outline-none focus:ring-2 focus:ring-[var(--ring)]/30"
            />
            <kbd className="pointer-events-none absolute right-2 top-1/2 hidden h-5 -translate-y-1/2 items-center gap-0.5 rounded border border-[var(--border)] bg-[var(--background)] px-1.5 font-mono text-[10px] text-[var(--muted-foreground)] sm:inline-flex">
              ⌘K
            </kbd>
          </div>
          <div className="ml-auto flex items-center gap-2">
            <Link
              to="/start"
              className="hidden sm:inline-flex h-9 items-center gap-1.5 rounded-md bg-[var(--foreground)] px-3 text-xs font-medium text-[var(--background)] hover:opacity-90"
            >
              <Plus className="h-3.5 w-3.5" />
              {t("top.newProject")}
            </Link>
            <LanguageSwitcher />
            <NotificationBell />
            <UserMenu />
          </div>
        </header>

        <main className="flex-1 bg-[var(--muted)] px-4 py-6 md:px-8 md:py-8">
          <div className="mx-auto w-full max-w-7xl">{children ?? <Outlet />}</div>
        </main>
      </div>
    </div>
  );
}

export function PageHeader({
  title,
  description,
  action,
}: {
  title: string;
  description?: string;
  action?: ReactNode;
}) {
  return (
    <div className="mb-8 flex items-end justify-between gap-4">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight md:text-3xl">{title}</h1>
        {description && (
          <p className="mt-1.5 text-sm text-[var(--muted-foreground)]">{description}</p>
        )}
      </div>
      {action}
    </div>
  );
}

export function PlaceholderPanel({ note }: { note?: string }) {
  return (
    <div className="rounded-2xl border border-dashed border-[var(--border)] bg-[var(--background)] p-12 text-center shadow-[var(--shadow-soft)]">
      <div className="mx-auto grid h-10 w-10 place-items-center rounded-full bg-[var(--primary-soft)] text-[var(--primary)]">
        <Sparkles className="h-5 w-5" />
      </div>
      <div className="mt-3 text-sm font-medium">Coming soon</div>
      <p className="mx-auto mt-1 max-w-sm text-xs text-[var(--muted-foreground)]">
        {note ?? "This module is being prepared."}
      </p>
    </div>
  );
}

// Suppress unused warnings for icons used by callers
export const _icons = { Megaphone };

export function PageHeader({
  title,
  description,
}: {
  title: string;
  description?: string;
}) {
  return (
    <div className="mb-6">
      <h1 className="text-2xl font-semibold tracking-tight">{title}</h1>
      {description && (
        <p className="mt-1 text-sm text-[var(--muted-foreground)]">{description}</p>
      )}
    </div>
  );
}

export function PlaceholderPanel({ note }: { note?: string }) {
  return (
    <div className="rounded-2xl border border-dashed border-[var(--border)] bg-[var(--background)] p-12 text-center shadow-[var(--shadow-soft)]">
      <div className="mx-auto grid h-10 w-10 place-items-center rounded-full bg-[var(--primary-soft)] text-[var(--primary)]">
        <Sparkles className="h-5 w-5" />
      </div>
      <div className="mt-3 text-sm font-medium">Coming soon</div>
      <p className="mx-auto mt-1 max-w-sm text-xs text-[var(--muted-foreground)]">
        {note ?? "This module is being prepared. UI scaffolding is in place."}
      </p>
    </div>
  );
}