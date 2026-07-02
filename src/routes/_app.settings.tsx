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
  Trash2,
  Sparkles,
  Check,
} from "lucide-react";
import { PageHeader } from "@/components/app-shell";
import { useI18n, localeLabels, type Locale } from "@/lib/i18n";
import { useWorkspace, type WsMember } from "@/lib/workspace-context";
import { supabase } from "@/integrations/supabase/client";

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
    { key: "language", icon: LanguagesIcon, labelKey: "settings.tab.language" },
    { key: "appearance", icon: Palette, labelKey: "settings.tab.appearance" },
    { key: "notifications", icon: Bell, labelKey: "settings.tab.notifications" },
    { key: "billing", icon: CreditCard, labelKey: "settings.tab.billing" },
    { key: "security", icon: Shield, labelKey: "settings.tab.security" },
    { key: "integrations", icon: Plug, labelKey: "settings.tab.integrations" },
    { key: "apikeys", icon: KeyRound, labelKey: "settings.tab.apikeys" },
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

function Card({
  title,
  description,
  children,
}: {
  title: string;
  description?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-2xl border border-[var(--border)] bg-[var(--background)] p-6 shadow-[var(--shadow-soft)]">
      <div className="mb-5">
        <h3 className="text-sm font-semibold">{title}</h3>
        {description && (
          <p className="mt-1 text-xs text-[var(--muted-foreground)]">{description}</p>
        )}
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
    case "language":
      return <LanguageTab />;
    case "appearance":
      return <AppearanceTab />;
    case "notifications":
      return <NotificationsTab />;
    case "billing":
      return <ComingSoonTab tag="billing" />;
    case "security":
      return <ComingSoonTab tag="security" />;
    case "integrations":
      return <ComingSoonTab tag="integrations" />;
    case "apikeys":
      return <ComingSoonTab tag="apikeys" />;
  }
}

// ------------------ Storage helpers (signed URLs for private buckets) ------------------
async function uploadAndSignedUrl(bucket: string, path: string, file: File): Promise<string> {
  const { error } = await supabase.storage
    .from(bucket)
    .upload(path, file, { upsert: true, contentType: file.type });
  if (error) throw error;
  const { data: signed, error: signErr } = await supabase.storage
    .from(bucket)
    .createSignedUrl(path, 60 * 60 * 24 * 365);
  if (signErr || !signed?.signedUrl) throw signErr || new Error("Sign failed");
  return signed.signedUrl;
}

// ------------------ PROFILE ------------------
function ProfileTab() {
  const { t } = useI18n();
  const { profile, user, refreshProfile, activeWorkspace } = useWorkspace();
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState({ name: "", company: "", role: "", email: "" });
  const [busy, setBusy] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setDraft({
      name: profile?.name ?? "",
      company: profile?.company ?? "",
      role: profile?.role ?? "",
      email: profile?.email ?? user?.email ?? "",
    });
  }, [profile, user]);

  if (!profile)
    return (
      <Card title={t("settings.profile.title")}>
        <p className="text-sm text-[var(--muted-foreground)]">…</p>
      </Card>
    );

  const initials = (profile.name || profile.email || "·")
    .split(/\s+/)
    .map((s) => s[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

  async function onAvatar(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0];
    if (!f || !user) return;
    if (!/^image\/(png|jpe?g|webp)$/.test(f.type)) {
      toast.error(t("toast.invalidImage"));
      return;
    }
    if (f.size > 2 * 1024 * 1024) {
      toast.error(t("toast.fileTooLarge"));
      return;
    }
    try {
      const ext = f.name.split(".").pop() || "png";
      const path = `${user.id}/avatar-${Date.now()}.${ext}`;
      const url = await uploadAndSignedUrl("avatars", path, f);
      const { error } = await supabase
        .from("profiles")
        .update({ avatar_url: url })
        .eq("id", user.id);
      if (error) throw error;
      await refreshProfile();
      toast.success(t("toast.avatarUpdated"));
    } catch (err) {
      console.error(err);
      toast.error(t("toast.uploadFailed"));
    } finally {
      if (fileRef.current) fileRef.current.value = "";
    }
  }

  async function removeAvatar() {
    if (!user) return;
    await supabase.from("profiles").update({ avatar_url: null }).eq("id", user.id);
    await refreshProfile();
    toast.success(t("toast.avatarRemoved"));
  }

  async function save() {
    if (!user) return;
    setBusy(true);
    const { error } = await supabase
      .from("profiles")
      .update({
        name: draft.name.trim() || null,
        company: draft.company.trim() || null,
        role: draft.role.trim() || null,
        email: draft.email.trim() || null,
      })
      .eq("id", user.id);
    setBusy(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    await refreshProfile();
    setEditing(false);
    toast.success(t("toast.profileSaved"));
  }

  return (
    <div className="space-y-6">
      <Card title={t("settings.profile.title")}>
        <div className="flex items-center gap-4 pb-5 border-b border-[var(--border)]">
          {profile.avatar_url ? (
            <img src={profile.avatar_url} alt="" className="h-16 w-16 rounded-full object-cover" />
          ) : (
            <div className="grid h-16 w-16 place-items-center rounded-full bg-gradient-to-br from-[var(--primary)] to-[oklch(0.45_0.22_280)] text-lg font-semibold text-white">
              {initials}
            </div>
          )}
          <div>
            <p className="text-base font-semibold">{profile.name || "—"}</p>
            <p className="text-xs text-[var(--muted-foreground)]">
              {profile.role || "—"}
              {profile.company ? ` · ${profile.company}` : ""}
            </p>
          </div>
          <input
            ref={fileRef}
            type="file"
            accept="image/png,image/jpeg,image/webp"
            className="hidden"
            onChange={onAvatar}
          />
          <div className="ml-auto flex items-center gap-2">
            {profile.avatar_url && (
              <button
                onClick={removeAvatar}
                className="rounded-md border border-[var(--border)] px-3 py-1.5 text-xs font-medium hover:bg-[var(--muted)]"
              >
                {t("settings.profile.removeAvatar")}
              </button>
            )}
            <button
              onClick={() => fileRef.current?.click()}
              className="rounded-md border border-[var(--border)] px-3 py-1.5 text-xs font-medium hover:bg-[var(--muted)]"
            >
              {t("settings.profile.changeAvatar")}
            </button>
          </div>
        </div>
        <Row label={t("settings.profile.name")}>
          {editing ? (
            <input
              value={draft.name}
              onChange={(e) => setDraft({ ...draft, name: e.target.value })}
              className="h-8 w-full max-w-sm rounded-md border border-[var(--border)] bg-[var(--background)] px-2 text-sm"
            />
          ) : (
            profile.name || "—"
          )}
        </Row>
        <Row label={t("settings.profile.company")}>
          {editing ? (
            <input
              value={draft.company}
              onChange={(e) => setDraft({ ...draft, company: e.target.value })}
              className="h-8 w-full max-w-sm rounded-md border border-[var(--border)] bg-[var(--background)] px-2 text-sm"
            />
          ) : (
            profile.company || "—"
          )}
        </Row>
        <Row label={t("settings.profile.role")}>
          {editing ? (
            <input
              value={draft.role}
              onChange={(e) => setDraft({ ...draft, role: e.target.value })}
              className="h-8 w-full max-w-sm rounded-md border border-[var(--border)] bg-[var(--background)] px-2 text-sm"
            />
          ) : (
            profile.role || "—"
          )}
        </Row>
        <Row label={t("settings.profile.email")}>
          {editing ? (
            <input
              type="email"
              value={draft.email}
              onChange={(e) => setDraft({ ...draft, email: e.target.value })}
              className="h-8 w-full max-w-sm rounded-md border border-[var(--border)] bg-[var(--background)] px-2 text-sm"
            />
          ) : (
            profile.email || user?.email || "—"
          )}
        </Row>
        <Row label={t("menu.workspace")}>{activeWorkspace.name}</Row>
        <div className="mt-4 flex justify-end gap-2">
          {editing ? (
            <>
              <button
                onClick={() => setEditing(false)}
                className="rounded-md border border-[var(--border)] px-3 py-1.5 text-xs font-medium hover:bg-[var(--muted)]"
              >
                {t("settings.profile.cancel")}
              </button>
              <button
                onClick={save}
                disabled={busy}
                className="rounded-md bg-[var(--foreground)] px-3 py-1.5 text-xs font-medium text-[var(--background)] hover:opacity-90 disabled:opacity-50"
              >
                {t("settings.profile.save")}
              </button>
            </>
          ) : (
            <button
              onClick={() => setEditing(true)}
              className="rounded-md border border-[var(--border)] px-3 py-1.5 text-xs font-medium hover:bg-[var(--muted)]"
            >
              {t("settings.profile.edit")}
            </button>
          )}
        </div>
      </Card>
    </div>
  );
}

// ------------------ WORKSPACE ------------------
function WorkspaceTab() {
  const { t } = useI18n();
  const { activeWorkspace, refreshWorkspaces } = useWorkspace();
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(activeWorkspace.name);
  const [busy, setBusy] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  useEffect(() => setDraft(activeWorkspace.name), [activeWorkspace.id, activeWorkspace.name]);

  async function save() {
    setBusy(true);
    const { error } = await supabase
      .from("workspaces")
      .update({ name: draft.trim() || activeWorkspace.name })
      .eq("id", activeWorkspace.id);
    setBusy(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    await refreshWorkspaces();
    setEditing(false);
    toast.success(t("toast.workspaceSaved"));
  }

  async function onLogo(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0];
    if (!f) return;
    if (!/^image\/(png|jpe?g|webp|svg\+xml)$/.test(f.type)) {
      toast.error(t("toast.invalidImage"));
      return;
    }
    if (f.size > 2 * 1024 * 1024) {
      toast.error(t("toast.fileTooLarge"));
      return;
    }
    try {
      const ext = f.name.split(".").pop() || "png";
      const path = `${activeWorkspace.id}/logo-${Date.now()}.${ext}`;
      const url = await uploadAndSignedUrl("workspace-logos", path, f);
      const { error } = await supabase
        .from("workspaces")
        .update({ logo_url: url })
        .eq("id", activeWorkspace.id);
      if (error) throw error;
      await refreshWorkspaces();
      toast.success(t("toast.logoUpdated"));
    } catch (err) {
      console.error(err);
      toast.error(t("toast.uploadFailed"));
    } finally {
      if (fileRef.current) fileRef.current.value = "";
    }
  }

  async function removeLogo() {
    await supabase.from("workspaces").update({ logo_url: null }).eq("id", activeWorkspace.id);
    await refreshWorkspaces();
    toast.success(t("toast.logoRemoved"));
  }

  return (
    <div className="space-y-6">
      <Card title={t("settings.workspace.title")} description={t("settings.workspace.sub")}>
        <Row label={t("settings.workspace.name")}>
          {editing ? (
            <div className="flex items-center gap-2">
              <input
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
                className="h-8 w-full max-w-sm rounded-md border border-[var(--border)] bg-[var(--background)] px-2 text-sm"
              />
              <button
                onClick={save}
                disabled={busy}
                className="rounded-md bg-[var(--foreground)] px-3 py-1 text-xs font-medium text-[var(--background)] disabled:opacity-50"
              >
                {t("common.save")}
              </button>
              <button
                onClick={() => {
                  setDraft(activeWorkspace.name);
                  setEditing(false);
                }}
                className="rounded-md border border-[var(--border)] px-3 py-1 text-xs font-medium hover:bg-[var(--muted)]"
              >
                {t("common.cancel")}
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <span>{activeWorkspace.name}</span>
              <button
                onClick={() => setEditing(true)}
                className="rounded-md border border-[var(--border)] px-2 py-0.5 text-[11px] font-medium hover:bg-[var(--muted)]"
              >
                {t("settings.profile.edit")}
              </button>
            </div>
          )}
        </Row>
        <Row label={t("settings.workspace.logo")}>
          <div className="flex items-center gap-3">
            {activeWorkspace.logo_url ? (
              <img
                src={activeWorkspace.logo_url}
                alt=""
                className="h-10 w-10 rounded-lg object-cover"
              />
            ) : (
              <div className="grid h-10 w-10 place-items-center rounded-lg bg-gradient-to-br from-[var(--primary)] to-[oklch(0.45_0.22_280)] text-sm font-bold text-white">
                {(activeWorkspace.name?.[0] || "·").toUpperCase()}
              </div>
            )}
            <input
              ref={fileRef}
              type="file"
              accept="image/png,image/jpeg,image/webp,image/svg+xml"
              className="hidden"
              onChange={onLogo}
            />
            <button
              onClick={() => fileRef.current?.click()}
              className="rounded-md border border-[var(--border)] px-3 py-1.5 text-xs font-medium hover:bg-[var(--muted)]"
            >
              {t("settings.workspace.upload")}
            </button>
            {activeWorkspace.logo_url && (
              <button
                onClick={removeLogo}
                className="rounded-md border border-[var(--border)] px-3 py-1.5 text-xs font-medium hover:bg-[var(--muted)]"
              >
                {t("settings.workspace.removeLogo")}
              </button>
            )}
          </div>
        </Row>
        <Row label={t("settings.workspace.region")}>{activeWorkspace.region}</Row>
        <Row label={t("settings.workspace.plan")}>{activeWorkspace.plan}</Row>
      </Card>
    </div>
  );
}

// ------------------ MEMBERS ------------------
function MembersTab() {
  const { t } = useI18n();
  const { activeWorkspace, members, refreshMembers, user } = useWorkspace();
  const [email, setEmail] = useState("");
  const [busy, setBusy] = useState(false);

  const ROLES: WsMember["role"][] = ["owner", "admin", "editor", "viewer"];
  const myRole = members.find((m) => m.user_id === user?.id)?.role ?? "viewer";
  const canManage = myRole === "owner" || myRole === "admin";

  async function invite() {
    const e = email.trim().toLowerCase();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e)) {
      toast.error(t("toast.invalidEmail"));
      return;
    }
    if (members.some((m) => m.email.toLowerCase() === e)) {
      toast.error(t("toast.alreadyMember"));
      return;
    }
    setBusy(true);
    const name = e
      .split("@")[0]
      .replace(/[._-]/g, " ")
      .replace(/\b\w/g, (c) => c.toUpperCase());
    const { error } = await supabase
      .from("workspace_members")
      .insert({ workspace_id: activeWorkspace.id, email: e, name, role: "viewer" });
    setBusy(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    setEmail("");
    await refreshMembers();
    toast.success(t("toast.memberInvited"));
  }

  async function remove(id: string) {
    const { error } = await supabase.from("workspace_members").delete().eq("id", id);
    if (error) {
      toast.error(error.message);
      return;
    }
    await refreshMembers();
    toast.success(t("toast.memberRemoved"));
  }

  async function updateRole(id: string, role: WsMember["role"]) {
    const { error } = await supabase.from("workspace_members").update({ role }).eq("id", id);
    if (error) {
      toast.error(error.message);
      return;
    }
    await refreshMembers();
    toast.success(t("toast.roleUpdated"));
  }

  return (
    <Card
      title={t("settings.members.title")}
      description={`${members.length} ${members.length === 1 ? "member" : "members"}`}
    >
      {canManage && (
        <div className="flex items-center gap-2 pb-4">
          <input
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && invite()}
            placeholder={t("settings.members.invitePlaceholder")}
            className="h-9 flex-1 rounded-md border border-[var(--border)] bg-[var(--background)] px-3 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--ring)]/30"
          />
          <button
            onClick={invite}
            disabled={busy}
            className="h-9 rounded-md bg-[var(--foreground)] px-3 text-xs font-medium text-[var(--background)] hover:opacity-90 disabled:opacity-50"
          >
            {t("settings.members.invite")}
          </button>
        </div>
      )}
      <ul className="divide-y divide-[var(--border)]">
        {members.map((m) => (
          <li key={m.id} className="flex items-center gap-3 py-3">
            <div className="grid h-9 w-9 place-items-center rounded-full bg-[var(--muted)] text-xs font-semibold">
              {(m.name || m.email)
                .split(/\s+/)
                .map((s) => s[0])
                .slice(0, 2)
                .join("")
                .toUpperCase()}
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium">{m.name || m.email.split("@")[0]}</p>
              <p className="truncate text-xs text-[var(--muted-foreground)]">
                {m.email}{" "}
                {!m.joined_at && (
                  <span className="ml-1 rounded bg-[var(--muted)] px-1 text-[10px]">
                    {t("settings.members.pending")}
                  </span>
                )}
              </p>
            </div>
            {canManage && m.role !== "owner" && m.user_id !== user?.id ? (
              <select
                value={m.role}
                onChange={(e) => updateRole(m.id, e.target.value as WsMember["role"])}
                className="h-8 rounded-md border border-[var(--border)] bg-[var(--background)] px-2 text-xs"
              >
                {ROLES.filter((r) => r !== "owner").map((r) => (
                  <option key={r} value={r}>
                    {t(`settings.members.role.${r}`)}
                  </option>
                ))}
              </select>
            ) : (
              <span className="rounded-full bg-[var(--muted)] px-2.5 py-0.5 text-[11px] font-medium text-[var(--muted-foreground)]">
                {t(`settings.members.role.${m.role}`)}
              </span>
            )}
            {canManage && m.role !== "owner" && (
              <button
                onClick={() => remove(m.id)}
                className="grid h-8 w-8 place-items-center rounded-md text-[var(--muted-foreground)] hover:bg-[var(--muted)] hover:text-[var(--destructive)]"
                aria-label={t("settings.members.removeAria")}
              >
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            )}
          </li>
        ))}
      </ul>
    </Card>
  );
}

// ------------------ LANGUAGE (synced to profile) ------------------
function LanguageTab() {
  const { locale, setLocale, t } = useI18n();
  const { profile, user, refreshProfile } = useWorkspace();

  // Apply profile language on mount if it differs
  useEffect(() => {
    if (
      profile?.preferred_language &&
      profile.preferred_language !== locale &&
      profile.preferred_language in localeLabels
    ) {
      setLocale(profile.preferred_language as Locale);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [profile?.preferred_language]);

  async function choose(l: Locale) {
    setLocale(l);
    if (user) {
      await supabase.from("profiles").update({ preferred_language: l }).eq("id", user.id);
      await refreshProfile();
    }
    toast.success(t("toast.languageSaved"));
  }

  return (
    <Card title={t("settings.lang.title")} description={t("settings.lang.sub")}>
      <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
        {(Object.keys(localeLabels) as Locale[]).map((l) => {
          const active = l === locale;
          return (
            <button
              key={l}
              onClick={() => choose(l)}
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

// ------------------ APPEARANCE (synced to profile) ------------------
type Theme = "Light" | "Dark" | "System";
function applyTheme(theme: Theme) {
  if (typeof document === "undefined") return;
  const wantDark =
    theme === "Dark" ||
    (theme === "System" && window.matchMedia("(prefers-color-scheme: dark)").matches);
  document.documentElement.classList.toggle("dark", wantDark);
}
function AppearanceTab() {
  const { t } = useI18n();
  const { profile, user, refreshProfile } = useWorkspace();
  const theme = (profile?.theme as Theme) || "Light";

  useEffect(() => {
    applyTheme(theme);
  }, [theme]);
  useEffect(() => {
    if (theme !== "System") return;
    const mq = window.matchMedia("(prefers-color-scheme: dark)");
    const fn = () => applyTheme("System");
    mq.addEventListener("change", fn);
    return () => mq.removeEventListener("change", fn);
  }, [theme]);

  const labels: Record<Theme, string> = {
    Light: t("settings.appearance.light"),
    Dark: t("settings.appearance.dark"),
    System: t("settings.appearance.system"),
  };

  async function choose(opt: Theme) {
    if (!user) return;
    await supabase.from("profiles").update({ theme: opt }).eq("id", user.id);
    await refreshProfile();
    toast.success(t("toast.themeSaved"));
  }

  return (
    <Card title={t("settings.appearance.title")} description={t("settings.appearance.sub")}>
      <div className="grid grid-cols-3 gap-3">
        {(["Light", "Dark", "System"] as Theme[]).map((opt) => {
          const active = theme === opt;
          return (
            <button
              key={opt}
              onClick={() => choose(opt)}
              className={`rounded-xl border p-4 text-sm font-medium transition-colors ${
                active
                  ? "border-[var(--primary)] bg-[var(--primary-soft)] text-[var(--primary)]"
                  : "border-[var(--border)] hover:bg-[var(--muted)]"
              }`}
            >
              {labels[opt]}
            </button>
          );
        })}
      </div>
    </Card>
  );
}

// ------------------ NOTIFICATIONS (local prefs UI, not yet wired to delivery) ------------------
function NotificationsTab() {
  const { t } = useI18n();
  return (
    <ComingSoonTab
      tag="security"
      customTitle={t("settings.tab.notifications")}
      customBody={t("common.comingSoon")}
    />
  );
}

// ------------------ COMING SOON ------------------
function ComingSoonTab({
  tag,
  customTitle,
  customBody,
}: {
  tag: "billing" | "security" | "apikeys" | "integrations";
  customTitle?: string;
  customBody?: string;
}) {
  const { t } = useI18n();
  const titleKey = `settings.tab.${tag === "apikeys" ? "apikeys" : tag}`;
  return (
    <div className="rounded-2xl border border-dashed border-[var(--border)] bg-[var(--background)] p-12 text-center shadow-[var(--shadow-soft)]">
      <div className="mx-auto grid h-10 w-10 place-items-center rounded-full bg-[var(--primary-soft)] text-[var(--primary)]">
        <Sparkles className="h-5 w-5" />
      </div>
      <div className="mt-3 text-sm font-medium">
        {customTitle ?? t(titleKey)} · {t("settings.comingSoon.title")}
      </div>
      <p className="mx-auto mt-1 max-w-sm text-xs text-[var(--muted-foreground)]">
        {customBody ?? t(`settings.comingSoon.${tag}`)}
      </p>
    </div>
  );
}
