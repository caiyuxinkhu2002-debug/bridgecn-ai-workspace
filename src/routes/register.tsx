import { createFileRoute, Link, useRouter } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { useT } from "@/lib/i18n";
import { AuthLayout, Divider, Field, SocialButtons } from "@/components/auth-layout";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/register")({
  validateSearch: (s: Record<string, unknown>): { next?: string } => ({
    next: typeof s.next === "string" && s.next.startsWith("/") && !s.next.startsWith("//") ? s.next : undefined,
  }),
  head: () => ({
    meta: [
      { title: "Create account — BridgeCN AI" },
      { name: "description", content: "Create your BridgeCN AI workspace and start planning your China market entry with real SEMrush data and AI insights." },
      { property: "og:title", content: "Create account — BridgeCN AI" },
      { property: "og:description", content: "Start your China market entry plan with BridgeCN AI." },
      { property: "og:url", content: "https://bridgecn-ai-workspace.lovable.app/register" },
    ],
    links: [{ rel: "canonical", href: "https://bridgecn-ai-workspace.lovable.app/register" }],
  }),
  component: RegisterPage,
});

function RegisterPage() {
  const t = useT();
  const router = useRouter();
  const { next } = Route.useSearch();
  const dest = next || "/";
  const [name, setName] = useState("");
  const [company, setCompany] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (password.length < 6) {
      toast.error(t("toast.passwordShort"));
      return;
    }
    setBusy(true);
    const { error, data } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: window.location.origin + dest,
        data: { name, company },
      },
    });
    if (error) {
      setBusy(false);
      toast.error(error.message);
      return;
    }
    // Patch profile with company once it's auto-created
    if (data.user && company) {
      await supabase.from("profiles").update({ company, name }).eq("id", data.user.id);
    }
    setBusy(false);
    toast.success(t("toast.accountCreated"));
    window.location.href = dest;
  }

  return (
    <AuthLayout
      title={t("auth.signup.title")}
      subtitle={t("auth.signup.sub")}
      footer={
        <span>
          {t("auth.hasAccount")}{" "}
          <Link
            to="/login"
            search={next ? { next } : undefined}
            className="font-medium text-[var(--foreground)] hover:underline"
          >
            {t("auth.signin")}
          </Link>
        </span>
      }
    >
      <SocialButtons />
      <Divider label={t("auth.continueWith")} />
      <form onSubmit={submit} className="space-y-4">
        <Field
          label={t("auth.name")}
          required
          value={name}
          onChange={setName}
          placeholder="Sora Kim"
          autoComplete="name"
        />
        <Field
          label={t("auth.company")}
          value={company}
          onChange={setCompany}
          placeholder="Your company"
          autoComplete="organization"
        />
        <Field
          label={t("auth.email")}
          type="email"
          required
          value={email}
          onChange={setEmail}
          placeholder="you@company.com"
          autoComplete="email"
        />
        <Field
          label={t("auth.password")}
          type="password"
          required
          value={password}
          onChange={setPassword}
          placeholder="••••••••"
          autoComplete="new-password"
        />
        <button
          type="submit"
          disabled={busy}
          className="flex h-10 w-full items-center justify-center rounded-md bg-[var(--foreground)] text-sm font-medium text-[var(--background)] hover:opacity-90 disabled:opacity-50"
        >
          {busy ? t("auth.creatingAccount") : t("auth.signup")}
        </button>
      </form>
    </AuthLayout>
  );
}
