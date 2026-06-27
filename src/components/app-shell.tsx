import { Link, Outlet, useRouterState } from "@tanstack/react-router";
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
} from "lucide-react";
import type { ReactNode } from "react";

const nav = [
  { to: "/", label: "Dashboard", icon: LayoutDashboard, exact: true },
  { to: "/projects", label: "Projects", icon: FolderKanban },
  { to: "/china-market-insight", label: "China Market Insight", icon: LineChart },
  { to: "/consumer-insight", label: "Consumer Insight", icon: Users },
  { to: "/localization-studio", label: "Localization Studio", icon: Languages },
  { to: "/launch-checklist", label: "Launch Checklist", icon: ListChecks },
  { to: "/reports", label: "Reports", icon: FileBarChart },
  { to: "/settings", label: "Settings", icon: Settings },
] as const;

export function AppShell({ children }: { children?: ReactNode }) {
  const pathname = useRouterState({ select: (s) => s.location.pathname });

  return (
    <div className="flex min-h-screen w-full bg-[var(--muted)]">
      {/* Sidebar */}
      <aside className="hidden md:flex w-64 shrink-0 flex-col border-r border-[var(--sidebar-border)] bg-[var(--sidebar)] px-4 py-5">
        <div className="flex items-center gap-2 px-2 pb-6">
          <div className="grid h-8 w-8 place-items-center rounded-lg bg-[var(--primary)] text-[var(--primary-foreground)]">
            <Sparkles className="h-4 w-4" />
          </div>
          <div className="leading-tight">
            <div className="text-sm font-semibold tracking-tight">BridgeCN AI</div>
            <div className="text-[11px] text-[var(--muted-foreground)]">Korea → China</div>
          </div>
        </div>

        <nav className="flex flex-col gap-0.5">
          {nav.map((item) => {
            const active = item.exact ? pathname === item.to : pathname.startsWith(item.to);
            const Icon = item.icon;
            return (
              <Link
                key={item.to}
                to={item.to}
                className={`flex items-center gap-2.5 rounded-md px-2.5 py-2 text-sm transition-colors ${
                  active
                    ? "bg-[var(--sidebar-accent)] text-[var(--sidebar-accent-foreground)] font-medium"
                    : "text-[var(--muted-foreground)] hover:bg-[var(--sidebar-accent)]/60 hover:text-[var(--foreground)]"
                }`}
              >
                <Icon className="h-4 w-4 shrink-0" />
                <span className="truncate">{item.label}</span>
              </Link>
            );
          })}
        </nav>

        <div className="mt-auto rounded-xl border border-[var(--border)] bg-[var(--muted)] p-3">
          <div className="text-xs font-medium">Free plan</div>
          <div className="mt-0.5 text-[11px] text-[var(--muted-foreground)]">
            12 of 50 credits used this month
          </div>
          <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-[var(--border)]">
            <div className="h-full w-[24%] rounded-full bg-[var(--primary)]" />
          </div>
          <button className="mt-3 w-full rounded-md bg-[var(--primary)] px-2.5 py-1.5 text-xs font-medium text-[var(--primary-foreground)] hover:opacity-90">
            Upgrade plan
          </button>
        </div>
      </aside>

      {/* Main */}
      <div className="flex min-w-0 flex-1 flex-col">
        {/* Topbar */}
        <header className="sticky top-0 z-10 flex h-14 items-center gap-3 border-b border-[var(--border)] bg-[var(--background)]/80 px-4 backdrop-blur md:px-6">
          <div className="relative flex-1 max-w-md">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--muted-foreground)]" />
            <input
              type="search"
              placeholder="Search projects, insights, reports…"
              className="h-9 w-full rounded-md border border-[var(--border)] bg-[var(--muted)] pl-9 pr-3 text-sm placeholder:text-[var(--muted-foreground)] focus:outline-none focus:ring-2 focus:ring-[var(--ring)]/30"
            />
          </div>
          <div className="ml-auto flex items-center gap-2">
            <button className="hidden sm:inline-flex h-9 items-center gap-1.5 rounded-md border border-[var(--border)] bg-[var(--background)] px-3 text-sm font-medium hover:bg-[var(--muted)]">
              <Sparkles className="h-3.5 w-3.5 text-[var(--primary)]" />
              New project
            </button>
            <button className="grid h-9 w-9 place-items-center rounded-md border border-[var(--border)] bg-[var(--background)] hover:bg-[var(--muted)]">
              <Bell className="h-4 w-4 text-[var(--muted-foreground)]" />
            </button>
            <div className="grid h-9 w-9 place-items-center rounded-full bg-[var(--primary)] text-xs font-semibold text-[var(--primary-foreground)]">
              SK
            </div>
          </div>
        </header>

        <main className="flex-1 bg-[var(--muted)] px-4 py-6 md:px-8 md:py-8">
          <div className="mx-auto w-full max-w-7xl">
            {children ?? <Outlet />}
          </div>
        </main>
      </div>
    </div>
  );
}

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