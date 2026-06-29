import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { useT } from "@/lib/i18n";
import { AuthLayout, Field } from "@/components/auth-layout";
import { CheckCircle2 } from "lucide-react";

export const Route = createFileRoute("/forgot-password")({
  head: () => ({ meta: [{ title: "Forgot password — BridgeCN AI" }] }),
  component: ForgotPage,
});

function ForgotPage() {
  const t = useT();
  const [sent, setSent] = useState(false);
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
        <>
          <Field label={t("auth.email")} type="email" placeholder="you@company.com" />
          <button
            onClick={() => setSent(true)}
            className="flex h-10 w-full items-center justify-center rounded-md bg-[var(--foreground)] text-sm font-medium text-[var(--background)] hover:opacity-90"
          >
            {t("auth.sendReset")}
          </button>
        </>
      )}
    </AuthLayout>
  );
}