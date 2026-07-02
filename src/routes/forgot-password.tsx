import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { useT } from "@/lib/i18n";
import { AuthLayout, Field } from "@/components/auth-layout";
import { CheckCircle2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/forgot-password")({
  head: () => ({ meta: [{ title: "Forgot password — BridgeCN AI" }] }),
  component: ForgotPage,
});

function ForgotPage() {
  const t = useT();
  const [sent, setSent] = useState(false);
  const [email, setEmail] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/login`,
    });
    setBusy(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    setSent(true);
  }

  return (
    <AuthLayout
      title={t("auth.forgot.title")}
      subtitle={t("auth.forgot.sub")}
      footer={
        <Link to="/login" className="font-medium text-[var(--foreground)] hover:underline">
          ← {t("auth.backToSignin")}
        </Link>
      }
    >
      {sent ? (
        <div className="flex items-start gap-3 rounded-xl border border-[var(--border)] bg-[var(--muted)] p-4">
          <CheckCircle2 className="mt-0.5 h-4 w-4 text-[oklch(0.55_0.14_150)]" />
          <p className="text-sm">{t("auth.forgot.sent")}</p>
        </div>
      ) : (
        <form onSubmit={submit} className="space-y-4">
          <Field
            label={t("auth.email")}
            type="email"
            required
            value={email}
            onChange={setEmail}
            placeholder="you@company.com"
            autoComplete="email"
          />
          <button
            type="submit"
            disabled={busy}
            className="flex h-10 w-full items-center justify-center rounded-md bg-[var(--foreground)] text-sm font-medium text-[var(--background)] hover:opacity-90 disabled:opacity-50"
          >
            {busy ? "…" : t("auth.sendReset")}
          </button>
        </form>
      )}
    </AuthLayout>
  );
}
