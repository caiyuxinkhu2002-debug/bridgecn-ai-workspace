import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
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
  Trash2,
  X,
} from "lucide-react";
import { PageHeader } from "@/components/app-shell";
import { useI18n, localeLabels, type Locale } from "@/lib/i18n";

// ---------- localStorage helpers ----------
const LS = {
  profile: "bridgecn.settings.profile",
  avatar: "bridgecn.settings.avatar",
  workspaceName: "bridgecn.settings.workspaceName",
  theme: "bridgecn.settings.theme",
  notifications: "bridgecn.settings.notifications",
  apiKeys: "bridgecn.settings.apiKeys",
  members: "bridgecn.settings.members",
  integrations: "bridgecn.settings.integrations",
};

function useLocalStorage<T>(key: string, initial: T) {
  const [value, setValue] = useState<T>(() => {
    if (typeof window === "undefined") return initial;
    try {
      const raw = localStorage.getItem(key);
      return raw ? (JSON.parse(raw) as T) : initial;
    } catch {
      return initial;
    }
  });
  useEffect(() => {
    try { localStorage.setItem(key, JSON.stringify(value)); } catch { /* ignore */ }
  }, [key, value]);
  return [value, setValue] as const;
}

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
  const [profile, setProfile] = useLocalStorage(LS.profile, {
    name: "Sora Kim",
    company: "Beauty of Joseon",
    role: "Brand Lead",
  });
  const [avatar, setAvatar] = useLocalStorage<string | null>(LS.avatar, null);
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(profile);
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => { setDraft(profile); }, [profile]);

  const initials = profile.name.split(" ").map((s) => s[0]).slice(0, 2).join("").toUpperCase();

  const onAvatar = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (!f) return;
    if (!/^image\/(png|jpe?g)$/.test(f.type)) {
      toast.error("Please upload a JPG or PNG image");
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      setAvatar(reader.result as string);
      toast.success("Avatar updated");
    };
    reader.readAsDataURL(f);
  };

  const save = () => {
    setProfile(draft);
    setEditing(false);
    toast.success("Profile saved");
  };

  return (
    <div className="space-y-6">
      <Card title="Profile">
        <div className="flex items-center gap-4 pb-5 border-b border-[var(--border)]">
          {avatar ? (
            <img src={avatar} alt="" className="h-16 w-16 rounded-full object-cover" />
          ) : (
            <div className="grid h-16 w-16 place-items-center rounded-full bg-gradient-to-br from-[var(--primary)] to-[oklch(0.45_0.22_280)] text-lg font-semibold text-white">
              {initials}
            </div>
          )}
          <div>
            <p className="text-base font-semibold">{profile.name}</p>
            <p className="text-xs text-[var(--muted-foreground)]">{profile.role} · {profile.company}</p>
          </div>
          <input ref={fileRef} type="file" accept="image/png,image/jpeg" className="hidden" onChange={onAvatar} />
          <div className="ml-auto flex items-center gap-2">
            {avatar && (
              <button
                onClick={() => { setAvatar(null); toast.success("Avatar removed"); }}
                className="rounded-md border border-[var(--border)] px-3 py-1.5 text-xs font-medium hover:bg-[var(--muted)]"
              >
                Remove
              </button>
            )}
            <button
              onClick={() => fileRef.current?.click()}
              className="rounded-md border border-[var(--border)] px-3 py-1.5 text-xs font-medium hover:bg-[var(--muted)]"
            >
              Change avatar
            </button>
          </div>
        </div>
        <Row label="Name">
          {editing ? (
            <input value={draft.name} onChange={(e) => setDraft({ ...draft, name: e.target.value })} className="h-8 w-full max-w-sm rounded-md border border-[var(--border)] bg-[var(--background)] px-2 text-sm" />
          ) : profile.name}
        </Row>
        <Row label="Company">
          {editing ? (
            <input value={draft.company} onChange={(e) => setDraft({ ...draft, company: e.target.value })} className="h-8 w-full max-w-sm rounded-md border border-[var(--border)] bg-[var(--background)] px-2 text-sm" />
          ) : profile.company}
        </Row>
        <Row label="Role">
          {editing ? (
            <input value={draft.role} onChange={(e) => setDraft({ ...draft, role: e.target.value })} className="h-8 w-full max-w-sm rounded-md border border-[var(--border)] bg-[var(--background)] px-2 text-sm" />
          ) : profile.role}
        </Row>
        <Row label="Email">sora@beautyofjoseon.com</Row>
        <Row label="Preferred language">{localeLabels[locale as Locale]}</Row>
        <Row label="Current workspace">Seoul HQ</Row>
        <Row label="Plan">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-[var(--primary-soft)] px-2.5 py-0.5 text-xs font-medium text-[var(--primary)]">
            Free · 12 / 50 credits
          </span>
        </Row>
        <div className="mt-4 flex justify-end gap-2">
          {editing ? (
            <>
              <button onClick={() => { setDraft(profile); setEditing(false); }} className="rounded-md border border-[var(--border)] px-3 py-1.5 text-xs font-medium hover:bg-[var(--muted)]">Cancel</button>
              <button onClick={save} className="rounded-md bg-[var(--foreground)] px-3 py-1.5 text-xs font-medium text-[var(--background)] hover:opacity-90">Save changes</button>
            </>
          ) : (
            <button onClick={() => setEditing(true)} className="rounded-md border border-[var(--border)] px-3 py-1.5 text-xs font-medium hover:bg-[var(--muted)]">Edit profile</button>
          )}
        </div>
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
  const [name, setName] = useLocalStorage(LS.workspaceName, "Seoul HQ");
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(name);
  useEffect(() => { setDraft(name); }, [name]);
  const save = () => { setName(draft.trim() || name); setEditing(false); toast.success("Workspace updated"); };
  return (
    <div className="space-y-6">
      <Card title="Workspace" description="Update your team's workspace details.">
        <Row label="Workspace name">
          {editing ? (
            <div className="flex items-center gap-2">
              <input value={draft} onChange={(e) => setDraft(e.target.value)} className="h-8 w-full max-w-sm rounded-md border border-[var(--border)] bg-[var(--background)] px-2 text-sm" />
              <button onClick={save} className="rounded-md bg-[var(--foreground)] px-3 py-1 text-xs font-medium text-[var(--background)]">Save</button>
              <button onClick={() => { setDraft(name); setEditing(false); }} className="rounded-md border border-[var(--border)] px-3 py-1 text-xs font-medium hover:bg-[var(--muted)]">Cancel</button>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <span>{name}</span>
              <button onClick={() => setEditing(true)} className="rounded-md border border-[var(--border)] px-2 py-0.5 text-[11px] font-medium hover:bg-[var(--muted)]">Edit</button>
            </div>
          )}
        </Row>
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

type Member = { name: string; email: string; role: string };
const DEFAULT_MEMBERS: Member[] = [
  { name: "Sora Kim", email: "sora@beautyofjoseon.com", role: "Owner" },
  { name: "Jihoon Park", email: "jihoon@beautyofjoseon.com", role: "Admin" },
  { name: "Minji Lee", email: "minji@beautyofjoseon.com", role: "Editor" },
  { name: "Wei Chen", email: "wei@bridgecn.ai", role: "Viewer" },
];

function MembersTab() {
  const [members, setMembers] = useLocalStorage<Member[]>(LS.members, DEFAULT_MEMBERS);
  const [email, setEmail] = useState("");
  const invite = () => {
    const e = email.trim().toLowerCase();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e)) { toast.error("Please enter a valid email"); return; }
    if (members.some((m) => m.email === e)) { toast.error("That member is already invited"); return; }
    const name = e.split("@")[0].replace(/[._-]/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
    setMembers([...members, { name, email: e, role: "Viewer" }]);
    setEmail("");
    toast.success(`Invitation sent to ${e}`);
  };
  const remove = (e: string) => {
    setMembers(members.filter((m) => m.email !== e));
    toast.success("Member removed");
  };
  return (
    <Card title="Team members" description="4 members · 6 seats available">
      <div className="flex items-center gap-2 pb-4">
        <input
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && invite()}
          placeholder="email@company.com"
          className="h-9 flex-1 rounded-md border border-[var(--border)] bg-[var(--background)] px-3 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--ring)]/30"
        />
        <button onClick={invite} className="h-9 rounded-md bg-[var(--foreground)] px-3 text-xs font-medium text-[var(--background)] hover:opacity-90">Invite</button>
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
            {m.role !== "Owner" && (
              <button onClick={() => remove(m.email)} className="grid h-8 w-8 place-items-center rounded-md text-[var(--muted-foreground)] hover:bg-[var(--muted)] hover:text-[var(--destructive)]" aria-label="Remove">
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            )}
          </li>
        ))}
      </ul>
    </Card>
  );
}

function BillingTab() {
  const [open, setOpen] = useState(false);
  return (
    <div className="space-y-6">
      <Card title="Current plan">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-lg font-semibold">Free</p>
            <p className="text-xs text-[var(--muted-foreground)]">12 of 50 credits used this month</p>
          </div>
          <button onClick={() => setOpen(true)} className="rounded-md bg-[var(--foreground)] px-3 py-1.5 text-xs font-medium text-[var(--background)] hover:opacity-90">Upgrade to Pro</button>
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
      {open && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-black/50 p-4" onClick={() => setOpen(false)}>
          <div onClick={(e) => e.stopPropagation()} className="w-full max-w-md rounded-2xl border border-[var(--border)] bg-[var(--background)] p-6 shadow-[var(--shadow-soft)]">
            <div className="flex items-start justify-between">
              <div>
                <h3 className="text-base font-semibold">Upgrade — Coming Soon</h3>
                <p className="mt-1 text-sm text-[var(--muted-foreground)]">Pro and Enterprise plans are launching soon. We'll notify you when checkout opens.</p>
              </div>
              <button onClick={() => setOpen(false)} className="grid h-8 w-8 place-items-center rounded-md hover:bg-[var(--muted)]"><X className="h-4 w-4" /></button>
            </div>
            <div className="mt-5 flex justify-end">
              <button onClick={() => setOpen(false)} className="rounded-md bg-[var(--foreground)] px-3 py-1.5 text-xs font-medium text-[var(--background)] hover:opacity-90">Got it</button>
            </div>
          </div>
        </div>
      )}
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

const DEFAULT_INTEGRATIONS: Record<string, boolean> = {
  OpenAI: false,
  Claude: false,
  Gemini: false,
  Slack: true,
  Notion: true,
  "WeChat Work": false,
  Xiaohongshu: false,
  Tmall: false,
  Douyin: false,
};
const INTEGRATION_META: { name: string; desc: string }[] = [
  { name: "OpenAI", desc: "GPT models for AI generation" },
  { name: "Claude", desc: "Anthropic models for long-context tasks" },
  { name: "Gemini", desc: "Google models for multimodal research" },
  { name: "Slack", desc: "Alerts to your team channel" },
  { name: "Notion", desc: "Sync reports & notes" },
  { name: "WeChat Work", desc: "China team collaboration" },
  { name: "Xiaohongshu", desc: "Trend data & KOLs" },
  { name: "Tmall", desc: "Listings & sales data" },
  { name: "Douyin", desc: "Short-video analytics" },
];

function IntegrationsTab() {
  const [state, setState] = useLocalStorage<Record<string, boolean>>(LS.integrations, DEFAULT_INTEGRATIONS);
  const toggle = (name: string) => {
    const next = !state[name];
    setState({ ...state, [name]: next });
    toast.success(next ? `${name} connected` : `${name} disconnected`);
  };
  return (
    <div className="grid gap-4 sm:grid-cols-2">
      {INTEGRATION_META.map((i) => {
        const connected = !!state[i.name];
        return (
        <div key={i.name} className="rounded-2xl border border-[var(--border)] bg-[var(--background)] p-5 shadow-[var(--shadow-soft)]">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm font-semibold">{i.name}</p>
              <p className="mt-1 text-xs text-[var(--muted-foreground)]">{i.desc}</p>
            </div>
            <button
              onClick={() => toggle(i.name)}
              className={`rounded-md px-3 py-1.5 text-xs font-medium ${
                connected
                  ? "border border-[var(--border)] hover:bg-[var(--muted)]"
                  : "bg-[var(--foreground)] text-[var(--background)] hover:opacity-90"
              }`}
            >
              {connected ? "Disconnect" : "Connect"}
            </button>
          </div>
        </div>
        );
      })}
    </div>
  );
}

type ApiKey = { id: string; name: string; key: string; created: string };
function randKey(prefix: string) {
  const chars = "abcdefghijklmnopqrstuvwxyz0123456789";
  let s = "";
  for (let i = 0; i < 32; i++) s += chars[Math.floor(Math.random() * chars.length)];
  return `${prefix}_${s}`;
}
const DEFAULT_API_KEYS: ApiKey[] = [
  { id: "k1", name: "Production", key: randKey("bcn_live"), created: "Mar 12, 2026" },
  { id: "k2", name: "Development", key: randKey("bcn_test"), created: "Mar 12, 2026" },
];
function maskKey(k: string) {
  if (k.length < 16) return k;
  return `${k.slice(0, 12)}${"•".repeat(12)}${k.slice(-4)}`;
}
function ApiKeysTab() {
  const [keys, setKeys] = useLocalStorage<ApiKey[]>(LS.apiKeys, DEFAULT_API_KEYS);
  const [revealed, setRevealed] = useState<Record<string, boolean>>({});
  const copy = async (k: ApiKey) => {
    try {
      await navigator.clipboard.writeText(k.key);
      toast.success("API key copied to clipboard");
    } catch {
      toast.error("Unable to copy");
    }
  };
  const regen = (id: string) => {
    setKeys(keys.map((k) => (k.id === id ? { ...k, key: randKey(k.name === "Production" ? "bcn_live" : "bcn_test"), created: new Date().toLocaleDateString("en-US", { month: "short", day: "2-digit", year: "numeric" }) } : k)));
    toast.success("New key generated");
  };
  const remove = (id: string) => {
    setKeys(keys.filter((k) => k.id !== id));
    toast.success("API key deleted");
  };
  const create = () => {
    const idx = keys.length + 1;
    const k: ApiKey = {
      id: `k${Date.now()}`,
      name: `Key ${idx}`,
      key: randKey("bcn_live"),
      created: new Date().toLocaleDateString("en-US", { month: "short", day: "2-digit", year: "numeric" }),
    };
    setKeys([...keys, k]);
    setRevealed((r) => ({ ...r, [k.id]: true }));
    toast.success("New API key created");
  };
  return (
    <Card title="API keys" description="Use these to access BridgeCN AI programmatically.">
      <div className="flex justify-end pb-3">
        <button onClick={create} className="rounded-md bg-[var(--foreground)] px-3 py-1.5 text-xs font-medium text-[var(--background)] hover:opacity-90">Generate new key</button>
      </div>
      <ul className="divide-y divide-[var(--border)]">
        {keys.map((k) => (
          <li key={k.id} className="flex items-center gap-3 py-3">
            <div className="min-w-0 flex-1">
              <p className="text-sm font-medium">{k.name}</p>
              <button onClick={() => setRevealed((r) => ({ ...r, [k.id]: !r[k.id] }))} className="font-mono text-xs text-[var(--muted-foreground)] hover:text-[var(--foreground)]">
                {revealed[k.id] ? k.key : maskKey(k.key)}
              </button>
            </div>
            <span className="hidden text-xs text-[var(--muted-foreground)] sm:inline">Created {k.created}</span>
            <button onClick={() => copy(k)} className="grid h-8 w-8 place-items-center rounded-md hover:bg-[var(--muted)]" aria-label="Copy">
              <Copy className="h-3.5 w-3.5" />
            </button>
            <button onClick={() => regen(k.id)} className="grid h-8 w-8 place-items-center rounded-md hover:bg-[var(--muted)]" aria-label="Regenerate">
              <RefreshCcw className="h-3.5 w-3.5" />
            </button>
            <button onClick={() => remove(k.id)} className="grid h-8 w-8 place-items-center rounded-md text-[var(--muted-foreground)] hover:bg-[var(--muted)] hover:text-[var(--destructive)]" aria-label="Delete">
              <Trash2 className="h-3.5 w-3.5" />
            </button>
          </li>
        ))}
        {keys.length === 0 && (
          <li className="py-6 text-center text-xs text-[var(--muted-foreground)]">No API keys. Generate one to get started.</li>
        )}
      </ul>
    </Card>
  );
}

const NOTIF_ITEMS = [
  "Market report finished",
  "New trend detected",
  "Localization completed",
  "Project shared with me",
  "Weekly AI recommendation digest",
];
function NotificationsTab() {
  const [state, setState] = useLocalStorage<Record<string, boolean>>(
    LS.notifications,
    Object.fromEntries(NOTIF_ITEMS.map((i) => [i, true])),
  );
  return (
    <Card title="Email notifications">
      {NOTIF_ITEMS.map((i) => (
        <div key={i} className="flex items-center justify-between border-b border-[var(--border)] py-3 last:border-0">
          <span className="text-sm">{i}</span>
          <input
            type="checkbox"
            checked={state[i] ?? true}
            onChange={(e) => {
              setState({ ...state, [i]: e.target.checked });
              toast.success(`${i} ${e.target.checked ? "enabled" : "disabled"}`);
            }}
            className="h-4 w-4 accent-[var(--primary)]"
          />
        </div>
      ))}
    </Card>
  );
}

type Theme = "Light" | "Dark" | "System";
function applyTheme(theme: Theme) {
  if (typeof document === "undefined") return;
  const root = document.documentElement;
  const wantDark = theme === "Dark" || (theme === "System" && window.matchMedia("(prefers-color-scheme: dark)").matches);
  root.classList.toggle("dark", wantDark);
}
function AppearanceTab() {
  const [theme, setTheme] = useLocalStorage<Theme>(LS.theme, "Light");
  useEffect(() => { applyTheme(theme); }, [theme]);
  useEffect(() => {
    if (theme !== "System") return;
    const mq = window.matchMedia("(prefers-color-scheme: dark)");
    const fn = () => applyTheme("System");
    mq.addEventListener("change", fn);
    return () => mq.removeEventListener("change", fn);
  }, [theme]);
  return (
    <Card title="Appearance" description="Theme preferences for this device.">
      <div className="grid grid-cols-3 gap-3">
        {(["Light", "Dark", "System"] as Theme[]).map((opt) => {
          const active = theme === opt;
          return (
          <button
            key={opt}
            onClick={() => { setTheme(opt); toast.success(`${opt} theme applied`); }}
            className={`rounded-xl border p-4 text-sm font-medium transition-colors ${
              active ? "border-[var(--primary)] bg-[var(--primary-soft)] text-[var(--primary)]" : "border-[var(--border)] hover:bg-[var(--muted)]"
            }`}
          >
            {opt}
          </button>
          );
        })}
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
