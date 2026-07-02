import { Link } from "@tanstack/react-router";
import { Sparkles } from "lucide-react";
import { useState, type ReactNode } from "react";
import { toast } from "sonner";
import { useT } from "@/lib/i18n";
import { lovable } from "@/integrations/lovable";

export function AuthLayout({
  title,
  subtitle,
  children,
  footer,
}: {
  title: string;
  subtitle: string;
  children: ReactNode;
  footer?: ReactNode;
}) {
  const t = useT();
  return (
    <div className="grid min-h-screen w-full bg-[var(--background)] lg:grid-cols-2">
      {/* Left: form */}
      <div className="flex flex-col px-6 py-8 md:px-12">
        <Link to="/" className="inline-flex items-center gap-2">
          <div className="grid h-8 w-8 place-items-center rounded-lg bg-gradient-to-br from-[var(--primary)] to-[oklch(0.45_0.22_280)] text-white">
            <Sparkles className="h-4 w-4" />
          </div>
          <div className="leading-tight">
            <div className="text-sm font-semibold tracking-tight">BridgeCN AI</div>
            <div className="text-[11px] text-[var(--muted-foreground)]">{t("brand.tag")}</div>
          </div>
        </Link>

        <div className="mx-auto my-auto w-full max-w-sm py-12">
          <h1 className="text-3xl font-semibold tracking-[-0.02em]">{title}</h1>
          <p className="mt-2 text-sm text-[var(--muted-foreground)]">{subtitle}</p>
          <div className="mt-8 space-y-4">{children}</div>
          {footer && (
            <div className="mt-8 text-center text-sm text-[var(--muted-foreground)]">{footer}</div>
          )}
        </div>
        <p className="text-center text-[11px] text-[var(--muted-foreground)]">
          © 2026 BridgeCN AI · Seoul · Shanghai · Shenzhen
        </p>
      </div>

      {/* Right: visual */}
      <div className="relative hidden overflow-hidden bg-[oklch(0.16_0.03_260)] lg:block">
        <div
          aria-hidden
          className="absolute inset-0"
          style={{
            background:
              "radial-gradient(ellipse 80% 60% at 30% 20%, oklch(0.55 0.22 256 / 0.55), transparent 60%), radial-gradient(ellipse 60% 50% at 80% 80%, oklch(0.55 0.20 320 / 0.4), transparent 60%)",
          }}
        />
        <svg
          className="absolute inset-0 h-full w-full opacity-[0.18]"
          viewBox="0 0 600 800"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          aria-hidden
        >
          <defs>
            <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
              <path d="M 40 0 L 0 0 0 40" fill="none" stroke="white" strokeWidth="0.5" />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#grid)" />
          {/* Korea → China arc */}
          <circle cx="430" cy="220" r="6" fill="white" />
          <text x="445" y="225" fill="white" fontSize="11" fontFamily="Inter">
            Seoul
          </text>
          <circle cx="250" cy="430" r="6" fill="white" />
          <text x="160" y="435" fill="white" fontSize="11" fontFamily="Inter" textAnchor="end">
            Shanghai
          </text>
          <path
            d="M 430 220 Q 320 280 250 430"
            stroke="white"
            strokeWidth="1.5"
            strokeDasharray="4 4"
            fill="none"
          />
        </svg>
        <div className="absolute inset-0 flex flex-col justify-end p-12 text-white">
          <h2 className="max-w-md text-3xl font-semibold leading-tight tracking-[-0.02em]">
            {t("auth.side.title")}
          </h2>
          <p className="mt-4 max-w-sm text-sm text-white/70">{t("auth.side.sub")}</p>
          <div className="mt-10 max-w-md rounded-2xl border border-white/10 bg-white/5 p-5 backdrop-blur">
            <p className="text-sm italic text-white/90">"{t("auth.side.quote")}"</p>
            <p className="mt-3 text-xs text-white/60">{t("auth.side.author")}</p>
          </div>
        </div>
      </div>
    </div>
  );
}

export function SocialButtons() {
  const t = useT();
  const [loading, setLoading] = useState<string | null>(null);
  const btn =
    "flex h-10 w-full items-center justify-center gap-2 rounded-md border border-[var(--border)] bg-[var(--background)] text-sm font-medium hover:bg-[var(--muted)] transition-colors disabled:opacity-50";

  async function signInGoogle() {
    try {
      setLoading("google");
      const result = await lovable.auth.signInWithOAuth("google", {
        redirect_uri: window.location.origin,
      });
      if (result.error) {
        toast.error(t("toast.googleFailed"));
        setLoading(null);
        return;
      }
      if (result.redirected) return;
      window.location.href = "/";
    } catch {
      toast.error(t("toast.googleFailed"));
      setLoading(null);
    }
  }

  return (
    <div className="space-y-2">
      <button onClick={signInGoogle} disabled={loading === "google"} className={btn}>
        <GoogleIcon />
        {loading === "google" ? t("auth.signingIn") : t("auth.google")}
      </button>
      <button disabled className={`${btn} cursor-not-allowed`} title={t("common.comingSoon")}>
        <AppleIcon />
        {t("auth.apple")} · {t("common.comingSoon")}
      </button>
      <button
        disabled
        className={`${btn} bg-[#FEE500] border-transparent text-[#191919] cursor-not-allowed`}
        title={t("common.comingSoon")}
      >
        <KakaoIcon />
        {t("auth.kakao")} · {t("common.comingSoon")}
      </button>
    </div>
  );
}

export function Divider({ label }: { label: string }) {
  return (
    <div className="relative flex items-center py-2">
      <div className="flex-1 border-t border-[var(--border)]" />
      <span className="px-3 text-[11px] uppercase tracking-wider text-[var(--muted-foreground)]">
        {label}
      </span>
      <div className="flex-1 border-t border-[var(--border)]" />
    </div>
  );
}

export function Field({
  label,
  type = "text",
  placeholder,
  value,
  onChange,
  autoComplete,
  required,
}: {
  label: string;
  type?: string;
  placeholder?: string;
  value?: string;
  onChange?: (v: string) => void;
  autoComplete?: string;
  required?: boolean;
}) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-xs font-medium text-[var(--foreground)]">{label}</span>
      <input
        type={type}
        placeholder={placeholder}
        value={value}
        onChange={onChange ? (e) => onChange(e.target.value) : undefined}
        autoComplete={autoComplete}
        required={required}
        className="h-10 w-full rounded-md border border-[var(--border)] bg-[var(--background)] px-3 text-sm placeholder:text-[var(--muted-foreground)] focus:outline-none focus:ring-2 focus:ring-[var(--ring)]/30"
      />
    </label>
  );
}

function GoogleIcon() {
  return (
    <svg className="h-4 w-4" viewBox="0 0 24 24" aria-hidden>
      <path
        fill="#4285F4"
        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.56c2.08-1.92 3.28-4.74 3.28-8.1Z"
      />
      <path
        fill="#34A853"
        d="M12 23c2.97 0 5.46-.98 7.28-2.65l-3.56-2.77c-.99.66-2.25 1.06-3.72 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84A11 11 0 0 0 12 23Z"
      />
      <path
        fill="#FBBC05"
        d="M5.84 14.11A6.6 6.6 0 0 1 5.5 12c0-.73.13-1.44.34-2.11V7.05H2.18A11 11 0 0 0 1 12c0 1.77.42 3.45 1.18 4.95l3.66-2.84Z"
      />
      <path
        fill="#EA4335"
        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.05l3.66 2.84C6.71 7.3 9.14 5.38 12 5.38Z"
      />
    </svg>
  );
}

function AppleIcon() {
  return (
    <svg className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
      <path d="M17.05 13.04c-.03-2.75 2.25-4.07 2.35-4.13-1.28-1.87-3.27-2.13-3.98-2.16-1.69-.17-3.31 1-4.17 1-.87 0-2.19-.97-3.6-.94-1.85.03-3.56 1.08-4.51 2.74-1.93 3.34-.49 8.27 1.38 10.97.91 1.32 2 2.81 3.41 2.76 1.37-.06 1.89-.89 3.54-.89 1.65 0 2.12.89 3.57.86 1.47-.02 2.41-1.34 3.32-2.67 1.04-1.53 1.47-3.02 1.49-3.1-.03-.01-2.85-1.09-2.88-4.34ZM14.61 4.84c.76-.92 1.27-2.2 1.13-3.47-1.09.04-2.41.72-3.19 1.64-.7.81-1.31 2.11-1.15 3.36 1.21.09 2.45-.62 3.21-1.53Z" />
    </svg>
  );
}

function KakaoIcon() {
  return (
    <svg className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
      <path d="M12 3C6.48 3 2 6.58 2 11c0 2.86 1.86 5.36 4.66 6.78l-1.18 4.32a.5.5 0 0 0 .76.55l5.05-3.36c.23.02.47.03.71.03 5.52 0 10-3.58 10-8s-4.48-8-10-8Z" />
    </svg>
  );
}
