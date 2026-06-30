# BridgeCN AI v3 — Connected SaaS Workspace

Goal: keep the existing visual system. Add product logic so every page is part of one workflow driven by a shared project + workspace context, with full i18n and working top-bar utilities.

## 1. Shared state (new)

Create `src/lib/workspace-context.tsx` — a single provider holding:

- `workspaces[]` (Seoul HQ, Shanghai Office, Beijing Team, Global Marketing) with current `workspaceId`
- `projects[]` scoped per workspace (Beauty of Joseon, Round Lab, ANUA, Medicube, Torriden) with realistic metadata: industry, stage (`research | consumer | localization | launch | reports`), owner, updatedAt, progress, region, KPIs
- `activeProjectId` persisted to `localStorage`
- `notifications[]` with `read` flag + `markAllRead`, grouped by Today/Yesterday/Earlier
- Helpers: `setActiveProject`, `setWorkspace`, `getProject`, `advanceStage(nextStage)`

Mount inside `__root.tsx` alongside `I18nProvider`.

## 2. Workflow wiring

Each module page reads `activeProject` from context and renders that project's data in its header (`ProjectContextBar` — project name, stage badge, progress). Add a sticky `WorkflowFooter` with `Back` + `Continue to <next step>` button that calls `advanceStage` and navigates:

```
dashboard → projects → project detail → market → consumer → localization → launch → reports
```

New route `src/routes/_app.projects.$projectId.tsx` for project detail with stage timeline + jump-to-step cards.

## 3. Dashboard rewrite

Replace `_app.index.tsx` hero/landing with workspace home:

- `Continue Working` card (active project + resume CTA pointing at current stage)
- `Recent Projects` (5, with stage badges, click → set active + open detail)
- `Recent Reports` (table, 4 rows)
- `AI Suggestions` (3 cards tied to active project)
- `Latest China Market Trends` (4 trend items)
- `Quick Actions` (4 buttons → key flows)
- `Recent Activity` feed
- `Upcoming Tasks` from active project's launch checklist

Keep current card / typography styles.

## 4. Full i18n

Expand `src/lib/i18n.tsx` dictionaries to cover every page (dashboard, projects, market, consumer, localization, launch, reports, settings, start, report, auth, workflow footer, project bar, search, notifications, quick actions, trends, tasks, statuses, stage names, table headers, buttons, empty states, placeholders, tooltips). Replace hardcoded strings on all `_app.*` routes, `app-shell`, `auth-layout`, `start`, `report` with `t("…")`. Add a tiny `tList` helper for arrays where useful.

## 5. Top bar features

In `app-shell.tsx`:

- **Search**: controlled input, opens a popover with filtered results across `projects`, `reports`, `localizationJobs`, `marketResearch`, `consumerResearch` arrays exposed by context. Each result navigates to its page and sets active project where relevant. ⌘K focuses input.
- **Workspace switcher**: dropdown lists 4 workspaces; selecting updates context → project list re-renders everywhere.
- **Notifications**: popover with Today / Yesterday / Earlier groupings, unread dot, "Mark all as read", "View all" → `/notifications` page (new minimal route reusing existing styles).
- **User menu**: every item is a real `<Link>` — Profile/Workspace/Notifications/Appearance/Language/Billing/API Keys → `/settings?tab=…` (settings page reads `tab` search param); Logout → `/login`.

## 6. Realistic data

Seed context with Korea→China demo data using the existing brands. Reports, localization jobs, trends, activities, tasks all reference these brands with believable metrics (GMV, Xiaohongshu posts, Tmall conversion, NMPA status, etc.).

## Technical notes

- Pure client state — no backend, no Lovable Cloud.
- No visual redesign: reuse existing tokens (`var(--primary)`, rounded-2xl cards, shadow-soft).
- Persist `activeProjectId`, `workspaceId`, `locale`, `notificationsRead` in `localStorage`.
- New files: `src/lib/workspace-context.tsx`, `src/lib/workflow.ts` (stage order + next-step helper), `src/components/project-context-bar.tsx`, `src/components/workflow-footer.tsx`, `src/routes/_app.projects.$projectId.tsx`, `src/routes/_app.notifications.tsx`.
- Edited: `src/lib/i18n.tsx` (large dict expansion), `src/components/app-shell.tsx`, `src/routes/__root.tsx`, every `_app.*.tsx` route, `auth-layout.tsx`, `_app.start.tsx`, `_app.report.tsx`.
- Out of scope: real auth, real AI, dark mode, new visual styles, new feature pages beyond project detail + notifications.

```text
WorkspaceProvider
 ├─ workspaces / activeWorkspace
 ├─ projects (scoped)            ── used by Dashboard, Projects, Detail
 ├─ activeProject                ── used by every module page
 ├─ notifications                ── used by topbar + /notifications
 └─ search index                 ── used by topbar search popover
```
