import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import {
  CircleUser,
  Building2,
  Users,
  CreditCard,
  Shield,
  Plug,
  KeyRound,
  Bell,
  Palette,
  Languages as LanguagesIcon,
  Copy,
  RefreshCcw,
  Check,
} from "lucide-react";
import { PageHeader } from "@/components/app-shell";
import { useI18n, localeLabels, type Locale } from "@/lib/i18n";

export const Route = createFileRoute("/_app/settings")({
  head: () => ({ meta: [{ title: "Settings — BridgeCN AI" }] }),
  component: SettingsPage,
});

type TabKey =
  | "profile"
  | "workspace"
  | "members"
  | "billing"
  | "security"
  | "integrations"
  | "apikeys"
  | "notifications"
  | "appearance"
  | "language";

function SettingsPage() {
  const { t } = useI18n();
  const [tab, setTab] = useState<TabKey>("profile");

  const tabs: { key: TabKey; icon: typeof CircleUser; labelKey: string }[] = [
    { key: "profile", icon: CircleUser, labelKey: "settings.tab.profile" },
    { key: "workspace", icon: Building2, labelKey: "settings.tab.workspace" },
    { key: "members", icon: Users, labelKey: "settings.tab.members" },
    { key: "billing", icon: CreditCard, labelKey: "settings.tab.billing" },
    { key: "security", icon: Shield, labelKey: "settings.tab.security" },
    { key: "integrations", icon: Plug, labelKey: "settings.tab.integrations" },
    { key: "apikeys", icon: KeyRound, labelKey: "settings.tab.apikeys" },
    { key: "notifications", icon: Bell, labelKey: "settings.tab.notifications" },
    { key: "appearance", icon: Palette, labelKey: "settings.tab.appearance" },
    { key: "language", icon: LanguagesIcon, labelKey: "settings.tab.language" },
  ];

  return (
    <div>
      <PageHeader title={t("settings.title")} description={t("settings.sub")} />
      <div className="grid gap-8 lg:grid-cols-[220px_1fr]">
        <aside className="lg:sticky lg:top-20 self-start">
          <nav className="flex gap-1 overflow-x-auto lg:flex-col">
            {tabs.map((tb) => {
              const Icon = tb.icon;
              const active = tab === tb.key;
              return (
                <button
                  key={tb.key}
                  onClick={() => setTab(tb.key)}
                  className={`flex items-center gap-2 whitespace-nowrap rounded-md px-3 py-2 text-sm transition-colors ${
                    active
                      ? "bg-[var(--background)] font-medium text-[var(--foreground)] shadow-[var(--shadow-soft)]"
                      : "text-[var(--muted-foreground)] hover:bg-[var(--background)]/60 hover:text-[var(--foreground)]"
                  }`}
                >
                  <Icon className={`h-4 w-4 ${active ? "text-[var(--primary)]" : ""}`} />
                  {t(tb.labelKey)}
                </button>
              );
            })}
          </nav>
        </aside>
        <section className="min-w-0">{renderTab(tab)}</section>
      </div>
    </div>
  );
}

function Card({ title, description, children }: { title: string; description?: string; children: React.ReactNode }) {
  return (
    <div className="rounded-2xl border border-[var(--border)] bg-[var(--background)] p-6 shadow-[var(--shadow-soft)]">
      <div className="mb-5">
        <h3 className="text-sm font-semibold">{title}</h3>
        {description && <p className="mt-1 text-xs text-[var(--muted-foreground)]">{description}</p>}
      </div>
      {children}
    </div>
  );
}

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="grid gap-1.5 sm:grid-cols-[180px_1fr] sm:items-center sm:gap-4 py-3 border-b border-[var(--border)] last:border-0">
      <div className="text-xs font-medium text-[var(--muted-foreground)]">{label}</div>
      <div className="text-sm">{children}</div>
    </div>
  );
}

function renderTab(tab: TabKey) {
  switch (tab) {
    case "profile":
      return <ProfileTab />;
    case "workspace":
      return <WorkspaceTab />;
    case "members":
      return <MembersTab />;
    case "billing":
      return <BillingTab />;
    case "security":
      return <SecurityTab />;
    case "integrations":
      return <IntegrationsTab />;
    case "apikeys":
      return <ApiKeysTab />;
    case "notifications":
      return <NotificationsTab />;
    case "appearance":
      return <AppearanceTab />;
    case "language":
      return <LanguageTab />;
  }
}

function ProfileTab() {
  const { locale } = useI18n();
  return (
    <div className="space-y-6">
      <Card title="Profile">
        <div className="flex items-center gap-4 pb-5 border-b border-[var(--border)]">
          <div className="grid h-16 w-16 place-items-center rounded-full bg-gradient-to-br from-[var(--primary)] to-[oklch(0.45_0.22_280)] text-lg font-semibold text-white">
            SK
          </div>
          <div>
            <p className="text-base font-semibold">Sora Kim</p>
            <p className="text-xs text-[var(--muted-foreground)]">Brand Lead · Beauty of Joseon</p>
          </div>
          <button className="ml-auto rounded-md border border-[var(--border)] px-3 py-1.5 text-xs font-medium hover:bg-[var(--muted)]">
            Change avatar
          </button>
        </div>
        <Row label="Name">Sora Kim</Row>
        <Row label="Company">Beauty of Joseon</Row>
        <Row label="Role">Brand Lead</Row>
        <Row label="Email">sora@beautyofjoseon.com</Row>
        <Row label="Preferred language">{localeLabels[locale as Locale]}</Row>
        <Row label="Current workspace">Seoul HQ</Row>
        <Row label="Plan">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-[var(--primary-soft)] px-2.5 py-0.5 text-xs font-medium text-[var(--primary)]">
            Free · 12 / 50 credits
          </span>
        </Row>
      </Card>
      <Card title="Usage statistics" description="Last 30 days">
        <div className="grid grid-cols-3 gap-4">
          {[
            { label: "Reports generated", value: "14" },
            { label: "Localizations", value: "62" },
            { label: "API calls", value: "1.2k" },
          ].map((s) => (
            <div key={s.label} className="rounded-xl border border-[var(--border)] p-4">
              <p className="text-xs text-[var(--muted-foreground)]">{s.label}</p>
              <p className="mt-1 text-2xl font-semibold tracking-tight">{s.value}</p>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}

function WorkspaceTab() {
  return (
    <div className="space-y-6">
      <Card title="Workspace" description="Update your team's workspace details.">
        <Row label="Workspace name">Seoul HQ</Row>
        <Row label="Logo">
          <div className="flex items-center gap-3">
            <div className="grid h-10 w-10 place-items-center rounded-lg bg-gradient-to-br from-[var(--primary)] to-[oklch(0.45_0.22_280)] text-sm font-bold text-white">
              B
            </div>
            <button className="rounded-md border border-[var(--border)] px-3 py-1.5 text-xs font-medium hover:bg-[var(--muted)]">Upload</button>
          </div>
        </Row>
        <Row label="Default language">English</Row>
        <Row label="Region">Asia · Seoul</Row>
      </Card>
    </div>
  );
}

function MembersTab() {
  const members = [
    { name: "Sora Kim", email: "sora@beautyofjoseon.com", role: "Owner" },
    { name: "Jihoon Park", email: "jihoon@beautyofjoseon.com", role: "Admin" },
    { name: "Minji Lee", email: "minji@beautyofjoseon.com", role: "Editor" },
    { name: "Wei Chen", email: "wei@bridgecn.ai", role: "Viewer" },
  ];
  return (
    <Card title="Team members" description="4 members · 6 seats available">
      <div className="flex items-center gap-2 pb-4">
        <input
          placeholder="email@company.com"
          className="h-9 flex-1 rounded-md border border-[var(--border)] bg-[var(--background)] px-3 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--ring)]/30"
        />
        <button className="h-9 rounded-md bg-[var(--foreground)] px-3 text-xs font-medium text-[var(--background)]">Invite</button>
      </div>
      <ul className="divide-y divide-[var(--border)]">
        {members.map((m) => (
          <li key={m.email} className="flex items-center gap-3 py-3">
            <div className="grid h-9 w-9 place-items-center rounded-full bg-[var(--muted)] text-xs font-semibold">
              {m.name.split(" ").map((s) => s[0]).join("")}
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium">{m.name}</p>
              <p className="truncate text-xs text-[var(--muted-foreground)]">{m.email}</p>
            </div>
            <span className="rounded-full bg-[var(--muted)] px-2.5 py-0.5 text-[11px] font-medium text-[var(--muted-foreground)]">
              {m.role}
            </span>
          </li>
        ))}
      </ul>
    </Card>
  );
}

function BillingTab() {
  return (
    <div className="space-y-6">
      <Card title="Current plan">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-lg font-semibold">Free</p>
            <p className="text-xs text-[var(--muted-foreground)]">12 of 50 credits used this month</p>
          </div>
          <button className="rounded-md bg-[var(--foreground)] px-3 py-1.5 text-xs font-medium text-[var(--background)]">Upgrade to Pro</button>
        </div>
        <div className="mt-4 h-2 w-full overflow-hidden rounded-full bg-[var(--muted)]">
          <div className="h-full w-[24%] rounded-full bg-[var(--primary)]" />
        </div>
      </Card>
      <Card title="Invoices">
        <ul className="divide-y divide-[var(--border)] text-sm">
          {["INV-0042 · Jun 2026 · $0.00", "INV-0041 · May 2026 · $0.00", "INV-0040 · Apr 2026 · $0.00"].map((i) => (
            <li key={i} className="flex items-center justify-between py-3">
              <span>{i}</span>
              <button className="text-xs font-medium text-[var(--muted-foreground)] hover:text-[var(--foreground)]">Download</button>
            </li>
          ))}
        </ul>
      </Card>
    </div>
  );
}

function SecurityTab() {
  return (
    <div className="space-y-6">
      <Card title="Two-factor authentication">
        <div className="flex items-center justify-between">
          <p className="text-sm text-[var(--muted-foreground)]">Add an extra layer of security to your account.</p>
          <button className="rounded-md border border-[var(--border)] px-3 py-1.5 text-xs font-medium hover:bg-[var(--muted)]">Enable</button>
        </div>
      </Card>
      <Card title="Active sessions">
        <ul className="divide-y divide-[var(--border)] text-sm">
          <li className="flex items-center justify-between py-3">
            <div>
              <p className="font-medium">MacBook Pro · Chrome</p>
              <p className="text-xs text-[var(--muted-foreground)]">Seoul, KR · Active now</p>
            </div>
            <span className="text-xs text-[oklch(0.55_0.14_150)]">Current</span>
          </li>
          <li className="flex items-center justify-between py-3">
            <div>
              <p className="font-medium">iPhone 15 · Safari</p>
              <p className="text-xs text-[var(--muted-foreground)]">Seoul, KR · 3h ago</p>
            </div>
            <button className="text-xs font-medium text-[var(--destructive)]">Revoke</button>
          </li>
        </ul>
      </Card>
    </div>
  );
}

function IntegrationsTab() {
  const integrations = [
    { name: "Notion", desc: "Sync reports & notes", connected: true },
    { name: "Slack", desc: "Alerts to your team channel", connected: true },
    { name: "WeChat Work", desc: "China team collaboration", connected: false },
    { name: "Xiaohongshu", desc: "Trend data & KOLs", connected: false },
    { name: "Tmall", desc: "Listings & sales data", connected: false },
    { name: "Douyin", desc: "Short-video analytics", connected: false },
  ];
  return (
    <div className="grid gap-4 sm:grid-cols-2">
      {integrations.map((i) => (
        <div key={i.name} className="rounded-2xl border border-[var(--border)] bg-[var(--background)] p-5 shadow-[var(--shadow-soft)]">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm font-semibold">{i.name}</p>
              <p className="mt-1 text-xs text-[var(--muted-foreground)]">{i.desc}</p>
            </div>
            <button
              className={`rounded-md px-3 py-1.5 text-xs font-medium ${
                i.connected
                  ? "border border-[var(--border)] hover:bg-[var(--muted)]"
                  : "bg-[var(--foreground)] text-[var(--background)] hover:opacity-90"
              }`}
            >
              {i.connected ? "Connected" : "Connect"}
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}

function ApiKeysTab() {
  return (
    <Card title="API keys" description="Use these to access BridgeCN AI programmatically.">
      <ul className="divide-y divide-[var(--border)]">
        {[
          { name: "Production", key: "bcn_live_••••••••••••a8f2", created: "Mar 12, 2026" },
          { name: "Development", key: "bcn_test_••••••••••••39c1", created: "Mar 12, 2026" },
        ].map((k) => (
          <li key={k.name} className="flex items-center gap-3 py-3">
            <div className="min-w-0 flex-1">
              <p className="text-sm font-medium">{k.name}</p>
              <p className="font-mono text-xs text-[var(--muted-foreground)]">{k.key}</p>
            </div>
            <span className="hidden text-xs text-[var(--muted-foreground)] sm:inline">Created {k.created}</span>
            <button className="grid h-8 w-8 place-items-center rounded-md hover:bg-[var(--muted)]" aria-label="Copy">
              <Copy className="h-3.5 w-3.5" />
            </button>
            <button className="grid h-8 w-8 place-items-center rounded-md hover:bg-[var(--muted)]" aria-label="Regenerate">
              <RefreshCcw className="h-3.5 w-3.5" />
            </button>
          </li>
        ))}
      </ul>
    </Card>
  );
}

function NotificationsTab() {
  const items = [
    "Market report finished",
    "New trend detected",
    "Localization completed",
    "Project shared with me",
    "Weekly AI recommendation digest",
  ];
  return (
    <Card title="Email notifications">
      {items.map((i) => (
        <div key={i} className="flex items-center justify-between border-b border-[var(--border)] py-3 last:border-0">
          <span className="text-sm">{i}</span>
          <input type="checkbox" defaultChecked className="h-4 w-4 accent-[var(--primary)]" />
        </div>
      ))}
    </Card>
  );
}

function AppearanceTab() {
  return (
    <Card title="Appearance" description="Theme preferences for this device.">
      <div className="grid grid-cols-3 gap-3">
        {["Light", "Dark", "System"].map((theme, i) => (
          <button
            key={theme}
            className={`rounded-xl border p-4 text-sm font-medium transition-colors ${
              i === 0 ? "border-[var(--primary)] bg-[var(--primary-soft)] text-[var(--primary)]" : "border-[var(--border)] hover:bg-[var(--muted)]"
            }`}
          >
            {theme}
          </button>
        ))}
      </div>
    </Card>
  );
}

function LanguageTab() {
  const { locale, setLocale } = useI18n();
  return (
    <Card title="Language" description="Choose the interface language.">
      <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
        {(Object.keys(localeLabels) as Locale[]).map((l) => {
          const active = l === locale;
          return (
            <button
              key={l}
              onClick={() => setLocale(l)}
              className={`flex items-center justify-between rounded-xl border p-4 text-sm font-medium transition-colors ${
                active
                  ? "border-[var(--primary)] bg-[var(--primary-soft)] text-[var(--primary)]"
                  : "border-[var(--border)] hover:bg-[var(--muted)]"
              }`}
            >
              {localeLabels[l]}
              {active && <Check className="h-4 w-4" />}
            </button>
          );
        })}
      </div>
    </Card>
  );
}
