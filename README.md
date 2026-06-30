# China Market Insight

An AI-powered market intelligence platform that combines **real SEMrush data** with **Lovable AI** generation to produce structured market entry reports for the Greater China region (Mainland CN, HK, TW) and adjacent APAC markets.

> Built on TanStack Start + Lovable Cloud (Supabase). Designed for cross-border brands, consultants, and product teams researching China market opportunities.

---

## ✨ Features

- **Verified data layer** — live SEMrush domain / keyword / SERP pulls with a "Verified · SEMrush · {market}" provenance badge on every card.
- **AI report generation** — multi-section market briefs (KPIs, segments, channels, competitors, risks, sources) via Lovable AI Gateway.
- **Job reliability** — stale `ai_jobs` (>5 min) are auto-reaped server-side so the UI never gets stuck on a spinning job.
- **Market mapping** — robust regex routing (`mainland`, `tier 1/2`, `hk`, `tw`, `kr`, `jp`, `in`, …) into the right SEMrush database.
- **i18n** — EN / 中文 / 한국어 across the full UI.
- **No fake sources** — when live data isn't available, the UI labels content as *"AI inference (category benchmark)"* instead of fabricating institution names.

---

## 🧱 Tech Stack

- **Framework:** TanStack Start v1 (React 19 + Vite 7, SSR-capable, edge-ready)
- **Styling:** Tailwind CSS v4 + shadcn/ui + Radix primitives
- **Backend:** Lovable Cloud (Supabase: Postgres, Auth, RLS, Edge)
- **AI:** Lovable AI Gateway (no separate API key required)
- **Data:** SEMrush API (via Lovable connector)
- **Data fetching:** TanStack Query + `createServerFn`

---

## 🚀 Getting Started

```bash
bun install
bun dev          # http://localhost:8080
bun run build    # production build
```

### Environment

Auto-injected by Lovable Cloud — no manual `.env` setup needed when developing in Lovable:

- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_PUBLISHABLE_KEY`
- `VITE_SUPABASE_PROJECT_ID`
- `LOVABLE_API_KEY` *(server-side, for AI Gateway)*
- SEMrush credentials *(via Lovable connector)*

If self-hosting, recreate these in your own environment and point at your own Supabase project.

---

## 📂 Project Structure

```
src/
├── routes/                     # File-based routing (TanStack)
│   ├── _app.china-market-insight.tsx
│   ├── _app.report.tsx
│   └── api/                    # Public HTTP endpoints (webhooks)
├── components/                 # UI + feature components
├── lib/
│   ├── ai/                     # AI generation server fns
│   └── data/                   # SEMrush server fns + market mapping
├── integrations/supabase/      # Auto-generated client (do not edit)
└── i18n.tsx                    # EN / ZH / KO copy
supabase/migrations/            # SQL migrations (incl. reap_stale_ai_jobs)
```

---

## 🔒 Security Notes

- All public-schema tables have explicit `GRANT`s + RLS policies.
- User roles live in a dedicated `user_roles` table with a `SECURITY DEFINER` `has_role()` check (no role storage on profiles).
- The `service_role` key is **never** exposed to the client — only used inside `*.server.ts` modules.
- `reap_stale_ai_jobs()` runs as `SECURITY INVOKER` and is scoped by RLS to the caller's workspace.

---

## 📜 License

MIT — see `LICENSE`.

---

## 🙏 Built With

[Lovable](https://lovable.dev) — AI fullstack builder. Original project URL: see workspace.