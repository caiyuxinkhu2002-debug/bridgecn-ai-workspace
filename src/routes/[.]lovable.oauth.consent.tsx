import { createFileRoute, redirect } from "@tanstack/react-router";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";

// Beta Supabase OAuth namespace typing shim.
type OAuthClientInfo = {
  name?: string;
  client_name?: string;
  redirect_uris?: string[];
};
type OAuthAuthorizationDetails = {
  client?: OAuthClientInfo;
  scope?: string;
  redirect_url?: string;
  redirect_to?: string;
};
type OAuthResponse<T> = { data: T | null; error: { message: string } | null };
type OAuthApi = {
  getAuthorizationDetails: (id: string) => Promise<OAuthResponse<OAuthAuthorizationDetails>>;
  approveAuthorization: (id: string) => Promise<OAuthResponse<{ redirect_url?: string; redirect_to?: string }>>;
  denyAuthorization: (id: string) => Promise<OAuthResponse<{ redirect_url?: string; redirect_to?: string }>>;
};
function sbOAuth(): OAuthApi {
  return (supabase.auth as unknown as { oauth: OAuthApi }).oauth;
}

export const Route = createFileRoute("/.lovable/oauth/consent")({
  ssr: false,
  validateSearch: (s: Record<string, unknown>) => ({
    authorization_id: typeof s.authorization_id === "string" ? s.authorization_id : "",
  }),
  beforeLoad: async ({ search, location }) => {
    if (!search.authorization_id) throw new Error("Missing authorization_id");
    const { data } = await supabase.auth.getSession();
    if (!data.session) {
      const next = location.pathname + location.searchStr;
      throw redirect({ to: "/login", search: { next } });
    }
  },
  loader: async ({ location }) => {
    const authorizationId = new URLSearchParams(location.search).get("authorization_id")!;
    const { data, error } = await sbOAuth().getAuthorizationDetails(authorizationId);
    if (error) throw new Error(error.message);
    const immediate = data?.redirect_url ?? data?.redirect_to;
    if (immediate && !data?.client) throw redirect({ href: immediate });
    return data;
  },
  component: Consent,
  errorComponent: ({ error }) => (
    <main className="mx-auto max-w-md p-8 text-sm text-[var(--foreground)]">
      Could not load this authorization request: {String((error as Error)?.message ?? error)}
    </main>
  ),
});

function Consent() {
  const details = Route.useLoaderData();
  const { authorization_id } = Route.useSearch();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function decide(approve: boolean) {
    setBusy(true);
    setError(null);
    const api = sbOAuth();
    const { data, error } = approve
      ? await api.approveAuthorization(authorization_id)
      : await api.denyAuthorization(authorization_id);
    if (error) {
      setBusy(false);
      setError(error.message);
      return;
    }
    const target = data?.redirect_url ?? data?.redirect_to;
    if (!target) {
      setBusy(false);
      setError("No redirect returned by the authorization server.");
      return;
    }
    window.location.href = target;
  }

  const clientName = details?.client?.client_name || details?.client?.name || "an app";

  return (
    <main className="mx-auto flex min-h-screen max-w-md flex-col justify-center gap-6 p-8 text-[var(--foreground)]">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">
          Connect {clientName} to BridgeCN AI
        </h1>
        <p className="mt-2 text-sm text-[var(--muted-foreground)]">
          {clientName} will be able to use BridgeCN AI's enabled tools while you are signed in — read
          your projects, browse the shared China KOL catalog, and manage your KOL shortlists.
        </p>
      </div>
      <div className="rounded-lg border border-[var(--border)] bg-[var(--muted)]/40 p-4 text-xs text-[var(--muted-foreground)]">
        This does not bypass BridgeCN AI's permissions. Only your own projects and shortlists are
        reachable — global KOL data stays read-only.
      </div>
      {error && (
        <p role="alert" className="text-sm text-red-500">
          {error}
        </p>
      )}
      <div className="flex gap-3">
        <button
          disabled={busy}
          onClick={() => decide(true)}
          className="flex h-10 flex-1 items-center justify-center rounded-md bg-[var(--foreground)] text-sm font-medium text-[var(--background)] hover:opacity-90 disabled:opacity-50"
        >
          {busy ? "Working…" : "Approve"}
        </button>
        <button
          disabled={busy}
          onClick={() => decide(false)}
          className="flex h-10 flex-1 items-center justify-center rounded-md border border-[var(--border)] text-sm font-medium hover:bg-[var(--muted)] disabled:opacity-50"
        >
          Cancel
        </button>
      </div>
    </main>
  );
}