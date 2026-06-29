import { createFileRoute, Link } from "@tanstack/react-router";
import { useT } from "@/lib/i18n";
import { AuthLayout, Divider, Field, SocialButtons } from "@/components/auth-layout";

export const Route = createFileRoute("/login")({
  head: () => ({ meta: [{ title: "Sign in — BridgeCN AI" }] }),
  component: LoginPage,
});

function LoginPage() {
  const t = useT();
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
      <Field label={t("auth.email")} type="email" placeholder="you@company.com" />
      <Field label={t("auth.password")} type="password" placeholder="••••••••" />
      <div className="-mt-1 flex justify-end">
        <Link to="/forgot-password" className="text-xs font-medium text-[var(--muted-foreground)] hover:text-[var(--foreground)]">
          {t("auth.forgotLink")}
        </Link>
      </div>
      <Link
        to="/"
        className="flex h-10 w-full items-center justify-center rounded-md bg-[var(--foreground)] text-sm font-medium text-[var(--background)] hover:opacity-90"
      >
        {t("auth.signin")}
      </Link>
    </AuthLayout>
  );
}