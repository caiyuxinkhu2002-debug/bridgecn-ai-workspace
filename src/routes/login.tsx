import { createFileRoute, Link, useRouter } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { useT } from "@/lib/i18n";
import { AuthLayout, Divider, Field, SocialButtons } from "@/components/auth-layout";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/login")({
  head: () => ({ meta: [{ title: "Sign in — BridgeCN AI" }] }),
  component: LoginPage,
});

function LoginPage() {
  const t = useT();
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => { if (data.user) router.navigate({ to: "/" }); });
  }, [router]);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    setBusy(false);
    if (error) { toast.error(error.message || t("toast.signInFailed")); return; }
    toast.success(t("toast.signedIn"));
    router.navigate({ to: "/" });
  }

  return (
    <AuthLayout
      title={t("auth.signin.title")}
      subtitle={t("auth.signin.sub")}
      footer={
        <span>
          {t("auth.noAccount")}{" "}
          <Link to="/register" className="font-medium text-[var(--foreground)] hover:underline">
            {t("auth.signup")}
          </Link>
        </span>
      }
    >
      <SocialButtons />
      <Divider label={t("auth.continueWith")} />
      <form onSubmit={submit} className="space-y-4">
        <Field label={t("auth.email")} type="email" autoComplete="email" required value={email} onChange={setEmail} placeholder="you@company.com" />
        <Field label={t("auth.password")} type="password" autoComplete="current-password" required value={password} onChange={setPassword} placeholder="••••••••" />
        <div className="-mt-1 flex justify-end">
          <Link to="/forgot-password" className="text-xs font-medium text-[var(--muted-foreground)] hover:text-[var(--foreground)]">
            {t("auth.forgotLink")}
          </Link>
        </div>
        <button
          type="submit"
          disabled={busy}
          className="flex h-10 w-full items-center justify-center rounded-md bg-[var(--foreground)] text-sm font-medium text-[var(--background)] hover:opacity-90 disabled:opacity-50"
        >
          {busy ? t("auth.signingIn") : t("auth.signin")}
        </button>
      </form>
    </AuthLayout>
  );
}