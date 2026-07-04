import { createFileRoute } from "@tanstack/react-router";
import { LegalShell } from "./privacy";

export const Route = createFileRoute("/terms")({
  head: () => ({
    meta: [
      { title: "Terms & Conditions — BridgeCN AI" },
      {
        name: "description",
        content:
          "Terms & Conditions for the BridgeCN AI workspace operated by no, including Paddle Merchant of Record disclosure and acceptable use.",
      },
      { name: "robots", content: "index,follow" },
      { property: "og:title", content: "Terms & Conditions — BridgeCN AI" },
      {
        property: "og:description",
        content:
          "Terms & Conditions for the BridgeCN AI workspace operated by no.",
      },
      { property: "og:type", content: "article" },
      { name: "twitter:card", content: "summary" },
    ],
    links: [
      { rel: "canonical", href: "https://bridgecn-ai-workspace.lovable.app/terms" },
    ],
  }),
  component: TermsPage,
});

function TermsPage() {
  return (
    <LegalShell title="Terms & Conditions" updated="July 4, 2026">
      <p>
        These Terms & Conditions ("Terms") govern your access to and use of
        the BridgeCN AI workspace (the "Service") provided by <strong>no</strong>
        &nbsp;("no", "we", "us"), trading as BridgeCN AI. By creating an account
        or otherwise using the Service, you agree to be bound by these Terms.
      </p>

      <h2>1. The Service</h2>
      <p>
        BridgeCN AI is an AI-assisted workspace that helps Korean and Japanese
        brands research and plan market entry into China, including keyword
        research, consumer insight generation, competitor analysis, localized
        copy, and launch checklists.
      </p>

      <h2>2. Eligibility & account</h2>
      <p>
        You must be of legal age in your jurisdiction and, if using the
        Service on behalf of an organization, have authority to bind that
        organization. You are responsible for keeping your credentials
        confidential and for all activity under your account, and must
        provide accurate information and keep it up to date.
      </p>

      <h2>3. Acceptable use</h2>
      <p>You must not misuse the Service. In particular, you must not:</p>
      <ul>
        <li>use it for any unlawful, fraudulent, deceptive, or abusive purpose;</li>
        <li>send spam or unsolicited communications;</li>
        <li>infringe intellectual property or privacy rights of others;</li>
        <li>attempt to probe, scan, or compromise the security of the Service;</li>
        <li>scrape, crawl, or extract data at scale except through provided APIs;</li>
        <li>reverse engineer, decompile, or circumvent technical limits.</li>
      </ul>

      <h2>4. Generative AI outputs</h2>
      <ul>
        <li>You are responsible for the prompts you submit and the outputs you use, including verifying accuracy and having rights to any content you input.</li>
        <li>You must not use the Service to generate illegal content, hate speech, harassment, deepfakes of real people, malware, or content that violates third-party rights.</li>
        <li>Outputs may be inaccurate or incomplete and are not a substitute for professional legal, financial, medical, or regulatory advice.</li>
        <li>We may filter, restrict, or refuse outputs, and suspend accounts that repeatedly generate infringing or prohibited material. Rights-holders may email <a href="mailto:legal@bridgecn.ai">legal@bridgecn.ai</a> to request takedown.</li>
      </ul>

      <h2>5. Intellectual property</h2>
      <p>
        no retains all right, title, and interest in and to the Service,
        including software, documentation, and branding. Subject to these
        Terms, we grant you a limited, non-exclusive, non-transferable right
        to use the Service within your selected plan. You retain rights in
        your content and grant us a limited licence to host and process it
        solely to provide the Service.
      </p>

      <h2>6. Payments, subscriptions, and refunds</h2>
      <p>
        Our order process is conducted by our online reseller
        <strong> Paddle.com</strong>. Paddle.com is the Merchant of Record for all
        our orders. Paddle provides all customer service inquiries and
        handles returns. Payment, billing, tax, cancellation, and refund
        mechanics are governed by
        {" "}
        <a href="https://www.paddle.com/legal/checkout-buyer-terms" target="_blank" rel="noreferrer">Paddle's Buyer Terms</a>
        &nbsp;and our <a href="/refunds">Refund Policy</a>. Subscriptions renew
        automatically at the end of each billing cycle until cancelled.
      </p>

      <h2>7. Service availability</h2>
      <p>
        We work hard to keep the Service reliable, but we do not guarantee
        uninterrupted or error-free performance. Features may change or be
        discontinued.
      </p>

      <h2>8. Suspension and termination</h2>
      <p>
        We may suspend or terminate your access if you materially breach
        these Terms, fail to pay, pose a security or fraud risk, or engage
        in repeated or serious policy violations. On termination you may
        export your data for 30 days; after that we may delete it.
      </p>

      <h2>9. Warranties and liability</h2>
      <p>
        To the maximum extent permitted by law, the Service is provided "as
        is" and we disclaim all implied warranties. Our aggregate liability
        arising out of or in connection with the Service is capped at the
        fees you paid us in the 12 months preceding the claim. We are not
        liable for indirect, consequential, or special damages, including
        loss of profits, data, or goodwill. Nothing in these Terms limits
        liability for fraud, death, or personal injury where prohibited by
        law.
      </p>

      <h2>10. Indemnity</h2>
      <p>
        You will indemnify us against claims arising from your content,
        your use of outputs, or your breach of these Terms.
      </p>

      <h2>11. Governing law</h2>
      <p>
        These Terms are governed by the laws of the seller's jurisdiction,
        and disputes will be resolved in its competent courts, unless
        mandatory local consumer law provides otherwise.
      </p>

      <h2>12. Changes</h2>
      <p>
        We may update these Terms; material changes will be announced in-app
        or by email. Continued use after changes take effect constitutes
        acceptance.
      </p>

      <h2>13. Contact</h2>
      <p>
        Questions about these Terms: <a href="mailto:legal@bridgecn.ai">legal@bridgecn.ai</a>.
      </p>
    </LegalShell>
  );
}