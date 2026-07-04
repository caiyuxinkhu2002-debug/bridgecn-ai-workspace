import { createFileRoute, Link } from "@tanstack/react-router";

export const Route = createFileRoute("/privacy")({
  head: () => ({
    meta: [
      { title: "Privacy Notice — BridgeCN AI" },
      {
        name: "description",
        content:
          "How no (BridgeCN AI) collects, uses, shares, and protects personal data, including our use of Paddle as Merchant of Record.",
      },
      { name: "robots", content: "index,follow" },
      { property: "og:title", content: "Privacy Notice — BridgeCN AI" },
      {
        property: "og:description",
        content:
          "How no (BridgeCN AI) collects, uses, shares, and protects personal data.",
      },
      { property: "og:type", content: "article" },
      { name: "twitter:card", content: "summary" },
    ],
    links: [
      { rel: "canonical", href: "https://bridgecn-ai-workspace.lovable.app/privacy" },
    ],
  }),
  component: PrivacyPage,
});

function PrivacyPage() {
  return (
    <LegalShell title="Privacy Notice" updated="July 4, 2026">
      <p>
        This Privacy Notice explains how <strong>no</strong> ("no", "we", "us"),
        trading as BridgeCN AI, collects, uses, shares, and protects personal
        data when you use the BridgeCN AI workspace (the "Service") available at
        bridgecn-ai-workspace.lovable.app.
      </p>

      <h2>1. Who we are</h2>
      <p>
        no is the data controller for personal data processed through the
        Service. You can contact us at <a href="mailto:privacy@bridgecn.ai">privacy@bridgecn.ai</a>.
      </p>

      <h2>2. Categories of personal data we collect</h2>
      <ul>
        <li><strong>Account data:</strong> name, email address, password hash, workspace preferences.</li>
        <li><strong>Content data:</strong> projects, prompts, uploaded materials, generated outputs, and translations you create in the workspace.</li>
        <li><strong>Usage & telemetry:</strong> pages visited, features used, AI generation counts, error logs, device identifiers, and IP address.</li>
        <li><strong>Support data:</strong> messages you send us and their metadata.</li>
        <li><strong>Billing metadata:</strong> plan, subscription status, and invoice references. Payment card details are collected and processed by Paddle, not by us.</li>
      </ul>

      <h2>3. Purposes and legal bases</h2>
      <ul>
        <li><strong>Provide the Service</strong> (performance of a contract): account creation, running AI generations, storing your projects, delivering exports.</li>
        <li><strong>Security & fraud prevention</strong> (legitimate interests / legal obligation): rate limiting, abuse detection, audit logs.</li>
        <li><strong>Product improvement</strong> (legitimate interests): aggregated analytics on how features are used. We do not train foundation models on your content.</li>
        <li><strong>Customer support</strong> (performance of a contract): responding to your questions.</li>
        <li><strong>Legal compliance</strong> (legal obligation): tax records, responding to lawful requests.</li>
      </ul>

      <h2>4. How we share data</h2>
      <p>We share personal data only with the following categories of recipients:</p>
      <ul>
        <li><strong>Service providers / subprocessors:</strong> hosting, database, analytics, email delivery, error monitoring, and AI model providers used to power generations.</li>
        <li><strong>Paddle (Merchant of Record):</strong> Paddle.com Market Ltd handles order processing, subscription management, payment collection, tax compliance, invoicing, and refund handling. Your payment details are collected directly by Paddle under their own privacy notice.</li>
        <li><strong>Professional advisers:</strong> our legal, accounting, and compliance advisers where necessary.</li>
        <li><strong>Authorities:</strong> where required by law or to protect our rights.</li>
      </ul>

      <h2>5. International transfers</h2>
      <p>
        Personal data may be transferred outside your country of residence
        (including to the United States and the European Economic Area) to our
        service providers. Where required, we rely on appropriate safeguards
        such as the Standard Contractual Clauses or an adequacy decision.
      </p>

      <h2>6. Retention</h2>
      <p>
        We keep account and content data for as long as your account is active.
        On deletion, workspace content is removed within 30 days and backups
        are purged within 90 days. Billing and tax records are retained for
        the period required by applicable law (typically 6–10 years).
      </p>

      <h2>7. Your rights</h2>
      <p>
        Depending on where you live, you may have the right to access,
        rectify, erase, restrict, or port your personal data, to object to
        certain processing, to withdraw consent, and to lodge a complaint with
        your local data protection authority. To exercise any of these
        rights, email <a href="mailto:privacy@bridgecn.ai">privacy@bridgecn.ai</a>.
        We respond within one month.
      </p>

      <h2>8. Security</h2>
      <p>
        We apply appropriate technical and organisational measures including
        encryption in transit (TLS), encryption at rest, access controls,
        least-privilege database policies, and audit logging.
      </p>

      <h2>9. Cookies</h2>
      <p>
        We use strictly-necessary cookies for authentication and session
        management, and optional analytics cookies to understand product
        usage. You can control non-essential cookies via your browser settings.
      </p>

      <h2>10. Changes</h2>
      <p>
        We may update this notice from time to time. Material changes will be
        announced in-app or by email.
      </p>
    </LegalShell>
  );
}

export function LegalShell({
  title,
  updated,
  children,
}: {
  title: string;
  updated: string;
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-[var(--background)]">
      <header className="border-b border-[var(--border)]">
        <div className="mx-auto flex max-w-4xl items-center justify-between px-6 py-4">
          <Link to="/" className="text-sm font-semibold tracking-tight">
            BridgeCN AI
          </Link>
          <nav className="flex items-center gap-4 text-xs text-[var(--muted-foreground)]">
            <Link to="/pricing" className="hover:text-[var(--foreground)]">Pricing</Link>
            <Link to="/terms" className="hover:text-[var(--foreground)]">Terms</Link>
            <Link to="/privacy" className="hover:text-[var(--foreground)]">Privacy</Link>
            <Link to="/refunds" className="hover:text-[var(--foreground)]">Refunds</Link>
          </nav>
        </div>
      </header>
      <main className="mx-auto max-w-3xl px-6 py-12">
        <h1 className="text-3xl font-bold tracking-tight">{title}</h1>
        <p className="mt-2 text-xs text-[var(--muted-foreground)]">Last updated: {updated}</p>
        <article className="prose prose-sm mt-8 max-w-none text-sm leading-relaxed text-[var(--foreground)] [&_a]:text-[var(--primary)] [&_a]:underline [&_h2]:mt-8 [&_h2]:text-lg [&_h2]:font-semibold [&_ul]:my-3 [&_ul]:list-disc [&_ul]:pl-5 [&_p]:my-3">
          {children}
        </article>
        <div className="mt-12 border-t border-[var(--border)] pt-6 text-xs text-[var(--muted-foreground)]">
          Questions? Email <a className="underline" href="mailto:hello@bridgecn.ai">hello@bridgecn.ai</a>.
        </div>
      </main>
    </div>
  );
}