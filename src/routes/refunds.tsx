import { createFileRoute } from "@tanstack/react-router";
import { LegalShell } from "./privacy";

export const Route = createFileRoute("/refunds")({
  head: () => ({
    meta: [
      { title: "Refund Policy — BridgeCN AI" },
      {
        name: "description",
        content:
          "30-day money-back guarantee for BridgeCN AI subscriptions. Refunds are processed by Paddle, our Merchant of Record.",
      },
      { name: "robots", content: "index,follow" },
      { property: "og:title", content: "Refund Policy — BridgeCN AI" },
      {
        property: "og:description",
        content:
          "30-day money-back guarantee. Refunds handled by Paddle.",
      },
      { property: "og:type", content: "article" },
      { name: "twitter:card", content: "summary" },
    ],
    links: [
      { rel: "canonical", href: "https://bridgecn-ai-workspace.lovable.app/refunds" },
    ],
  }),
  component: RefundsPage,
});

function RefundsPage() {
  return (
    <LegalShell title="Refund Policy" updated="July 4, 2026">
      <p>
        This Refund Policy applies to purchases of BridgeCN AI subscriptions
        made from <strong>no</strong>, trading as BridgeCN AI.
      </p>

      <h2>30-day money-back guarantee</h2>
      <p>
        If you are not satisfied with your BridgeCN AI subscription, you can
        request a full refund within <strong>30 days</strong> of your original
        order date. This applies to first-time purchases of any paid plan.
      </p>

      <h2>How to request a refund</h2>
      <p>
        Refunds are processed by our Merchant of Record, <strong>Paddle</strong>.
        To request a refund:
      </p>
      <ul>
        <li>
          Visit <a href="https://paddle.net" target="_blank" rel="noreferrer">paddle.net</a>,
          look up your order using the email you used at checkout, and follow the
          refund flow; or
        </li>
        <li>
          Email us at <a href="mailto:billing@bridgecn.ai">billing@bridgecn.ai</a> with
          your order reference and we will pass the request to Paddle.
        </li>
      </ul>

      <h2>After a refund</h2>
      <p>
        Once a refund is issued, your paid plan will end and your workspace
        will revert to the Free plan. Content you created remains available
        subject to Free-plan quotas.
      </p>

      <h2>Renewals</h2>
      <p>
        Subscriptions renew automatically. You can cancel at any time from
        your billing settings or via paddle.net; cancellation stops future
        renewals. Charges for a renewal period may be refunded on request in
        line with Paddle's
        {" "}
        <a href="https://www.paddle.com/legal/refund-policy" target="_blank" rel="noreferrer">Refund Policy</a>.
      </p>
    </LegalShell>
  );
}