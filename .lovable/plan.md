# BridgeCN AI v2 — Global SaaS Upgrade Plan

A focused, high-impact pass that brings the whole app to a production SaaS quality bar (Linear / Notion AI / Vercel). UI-only — no real auth backend, no AI calls.

## 1. Foundation: i18n + Theme Polish

- Add lightweight i18n context (`src/lib/i18n.tsx`) with three locales: `en`, `ko`, `zh`. Persist to `localStorage`. Provides `t(key)` and `useLocale()`.
- Translate every visible string across shell, dashboard, start, report, projects, settings, auth, profile.
- Refine `src/styles.css` tokens: softer shadows, refined radii, premium gradients (Korea→China subtle line/aurora), neutral palette tuned for Linear-grade feel. Keep blue accent.

## 2. App Shell Redesign

- Sidebar: tighter type scale, refined icons, animated active indicator (left bar), section labels ("Workspace", "Intelligence", "Account"), collapsible feel, premium upgrade card.
- Topbar: command-palette-style search (⌘K hint), workspace switcher dropdown, language switcher (EN/KO/ZH), notification popover, user menu dropdown, primary "New Project" button.
- Notification popover: 5 sample notifications with icons, timestamps, unread dots, "Mark all read".
- User menu: avatar + name/email header, links to Profile, Workspace, Language, Notifications, Appearance, Billing, API Keys, Logout.

## 3. Authentication Surface (UI only)

New public routes outside `_app`:
- `/login` — email + password, social buttons (Google, Apple, Kakao), "Forgot password" link.
- `/register` — name, company, email, password, social options.
- `/forgot-password` — email input + confirmation state.

Split-screen layout: left form, right gradient panel with Korea→China map motif and product testimonial. No backend wiring — buttons route to `/`.

## 4. Profile + Workspace Settings

Replace placeholder `_app.settings.tsx` with a tabbed settings experience:
- Tabs: Profile, Workspace, Members, Billing, Security, Integrations, API Keys, Notifications, Appearance, Language.
- Profile tab: avatar, name, company, role, email, preferred language, current workspace, plan, usage stats (credits, reports, members).
- Workspace tab: name, logo upload placeholder, default language, region.
- Members tab: table with 4 sample members + invite row, role badges.
- Billing tab: current plan card, usage meters, invoice list.
- Security tab: 2FA toggle, sessions, password.
- Integrations tab: Notion, Slack, WeChat Work, Xiaohongshu, Tmall, Douyin cards with connect buttons.
- API Keys tab: list with reveal/copy/regenerate.
- Notifications, Appearance (theme), Language tabs.

## 5. Page-Level Polish

Replace every `PlaceholderPanel` with real-looking content:
- **China Market Insight**: category heatmap, top trending keywords, regional bar chart, channel mix.
- **Consumer Insight**: persona cards, sentiment radar, trend signals list.
- **Localization Studio**: KR↔CN side-by-side editor mock with tone presets.
- **Launch Checklist**: phased Kanban-style checklist with progress.
- **Reports**: searchable list of past reports with status, owner, export buttons.
- **Projects**: keep table, add filters + status pills polish.
- **Dashboard**: tighten spacing, add subtle Korea→China map line motif behind hero.

## 6. Shared UI Improvements

- New components: `StatusBadge`, `EmptyState`, `Skeleton` patterns, `Section` wrappers used consistently.
- Hover/transition polish on cards & buttons.
- Loading skeleton for tables/cards.

## Technical Notes

- Pure frontend. No Lovable Cloud, no DB, no real auth — pure UI scaffolding so the product reads as production-ready.
- i18n via a tiny custom context (no `react-i18next` dependency) to keep bundle small. Dictionary at `src/lib/i18n/dict.ts`.
- All new routes are TanStack file routes; route tree regenerates automatically.
- Auth pages live at top level (`/login`, `/register`, `/forgot-password`) — no `_app` shell.
- "Logout" in user menu navigates to `/login` (no real session).
- Korea→China visual motif: subtle SVG dotted arc + soft gradient, reused in hero + auth side panel. No red/decorative motifs.

## Out of Scope (this pass)

- Real authentication / Lovable Cloud backend.
- Real AI generation.
- Dark mode (tokens prepared, toggle stub only).
- Real file uploads, real Stripe billing, real OAuth.

Ship as one coordinated upgrade.
