import { createFileRoute, Link } from "@tanstack/react-router";
import { useT } from "@/lib/i18n";
import { AuthLayout, Divider, Field, SocialButtons } from "@/components/auth-layout";

export const Route = createFileRoute("/register")({
  head: () => ({ meta: [{ title: "Create account — BridgeCN AI" }] }),
  component: RegisterPage,
});

function RegisterPage() {
  const t = useT();
  return (
    <AuthLayout
      title={t("auth.signup.title")}
      subtitle={t("auth.signup.sub")}
      footer={
        <span>
          {t("auth.hasAccount")}{" "}
          <Link to="/login" className="font-medium text-[var(--foreground)] hover:underline">
            {t("auth.signin")}
          </Link>
        </span>
      }
    >
      <SocialButtons />
      <Divider label={t("auth.continueWith")} />
      <Field label={t("auth.name")} placeholder="Sora Kim" />
      <Field label={t("auth.company")} placeholder="Beauty of Joseon" />
      <Field label={t("auth.email")} type="email" placeholder="you@company.com" />
      <Field label={t("auth.password")} type="password" placeholder="••••••••" />
      <Link
        to="/"
        className="flex h-10 w-full items-center justify-center rounded-md bg-[var(--foreground)] text-sm font-medium text-[var(--background)] hover:opacity-90"
      >
        {t("auth.signup")}
      </Link>
    </AuthLayout>
  );
}