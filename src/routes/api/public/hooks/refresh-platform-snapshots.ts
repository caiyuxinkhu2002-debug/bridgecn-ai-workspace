import { createFileRoute } from "@tanstack/react-router";
import { crawlAndStoreAllSeeds } from "@/lib/data/platform-snapshots.functions";

// Public cron endpoint. Called by pg_cron with the Supabase publishable
// (anon) key in the `apikey` header. The /api/public/* prefix bypasses
// the auth wall — see server-runtime docs. We still gate the work behind
// an apikey header check so random internet callers can't drain
// Firecrawl credits.
export const Route = createFileRoute("/api/public/hooks/refresh-platform-snapshots")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const expected = process.env.SUPABASE_PUBLISHABLE_KEY;
        const apikey = request.headers.get("apikey") ?? request.headers.get("x-apikey");
        if (!expected || apikey !== expected) {
          return new Response(JSON.stringify({ error: "unauthorized" }), {
            status: 401,
            headers: { "Content-Type": "application/json" },
          });
        }
        try {
          const summary = await crawlAndStoreAllSeeds();
          return Response.json({ ok: true, ...summary });
        } catch (e) {
          return new Response(
            JSON.stringify({ ok: false, error: (e as Error).message }),
            { status: 500, headers: { "Content-Type": "application/json" } },
          );
        }
      },
    },
  },
});