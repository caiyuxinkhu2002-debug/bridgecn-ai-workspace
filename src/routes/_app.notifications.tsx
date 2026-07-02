import { createFileRoute } from "@tanstack/react-router";
import { PageHeader } from "@/components/app-shell";
import { useI18n } from "@/lib/i18n";
import { useWorkspace } from "@/lib/workspace-context";
import { Bell } from "lucide-react";

export const Route = createFileRoute("/_app/notifications")({
  head: () => ({ meta: [{ title: "Notifications — BridgeCN AI" }] }),
  component: NotificationsPage,
});

function NotificationsPage() {
  const { t } = useI18n();
  const { notifications, markAllRead } = useWorkspace();
  const groups: { key: "today" | "yesterday" | "earlier"; labelKey: string }[] = [
    { key: "today", labelKey: "notifs.today" },
    { key: "yesterday", labelKey: "notifs.yesterday" },
    { key: "earlier", labelKey: "notifs.earlier" },
  ];
  return (
    <div>
      <div className="flex items-end justify-between gap-4">
        <PageHeader title={t("notifs.title")} description={t("notifs.sub")} />
        <button
          onClick={markAllRead}
          className="h-9 rounded-md border border-[var(--border)] px-3 text-xs font-medium hover:bg-[var(--muted)]"
        >
          {t("notif.markAll")}
        </button>
      </div>
      <div className="space-y-6">
        {groups.map((g) => {
          const list = notifications.filter((n) => n.group === g.key);
          if (!list.length) return null;
          return (
            <div key={g.key}>
              <h3 className="mb-2 text-[11px] font-semibold uppercase tracking-wider text-[var(--muted-foreground)]">
                {t(g.labelKey)}
              </h3>
              <div className="overflow-hidden rounded-2xl border border-[var(--border)] bg-[var(--background)] shadow-[var(--shadow-soft)]">
                <ul className="divide-y divide-[var(--border)]">
                  {list.map((n) => (
                    <li key={n.id} className="flex items-start gap-3 px-4 py-3">
                      <div className="mt-0.5 grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-[var(--muted)]">
                        <Bell className="h-3.5 w-3.5" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <p className="truncate text-sm font-medium">{t(n.titleKey)}</p>
                          {!n.read && (
                            <span className="h-1.5 w-1.5 rounded-full bg-[var(--primary)]" />
                          )}
                        </div>
                        <p className="text-xs text-[var(--muted-foreground)]">{t(n.bodyKey)}</p>
                      </div>
                      <span className="shrink-0 text-[11px] text-[var(--muted-foreground)]">
                        {n.time}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
