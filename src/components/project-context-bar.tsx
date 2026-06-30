import { Link } from "@tanstack/react-router";
import { ChevronsUpDown, Check } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { useWorkspace } from "@/lib/workspace-context";
import { useI18n } from "@/lib/i18n";
import { stageLabelKey } from "@/lib/workflow";

export function ProjectContextBar() {
  const { activeProject, projects, setActiveProjectId } = useWorkspace();
  const { t } = useI18n();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    function h(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, []);

  return (
    <div className="mb-6 flex items-center justify-between gap-4 rounded-2xl border border-[var(--border)] bg-[var(--background)] px-4 py-3 shadow-[var(--shadow-soft)]">
      <div className="flex min-w-0 items-center gap-3">
        <div className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-gradient-to-br from-[var(--muted)] to-[var(--primary-soft)] text-xs font-semibold">
          {activeProject.initials}
        </div>
        <div className="min-w-0">
          <p className="text-[10px] font-semibold uppercase tracking-wider text-[var(--muted-foreground)]">
            {t("projectBar.activeProject")}
          </p>
          <p className="truncate text-sm font-semibold">{activeProject.name}</p>
        </div>
      </div>
      <div className="hidden items-center gap-6 md:flex">
        <div className="text-xs">
          <div className="text-[10px] uppercase tracking-wider text-[var(--muted-foreground)]">{t("projectBar.stage")}</div>
          <div className="mt-0.5 font-medium">{t(stageLabelKey[activeProject.stage])}</div>
        </div>
        <div className="flex items-center gap-2 text-xs">
          <div className="h-1 w-32 overflow-hidden rounded-full bg-[var(--muted)]">
            <div className="h-full rounded-full bg-[var(--primary)]" style={{ width: `${activeProject.progress}%` }} />
          </div>
          <span className="tabular-nums text-[var(--muted-foreground)]">{activeProject.progress}%</span>
        </div>
      </div>
      <div className="relative" ref={ref}>
        <button
          onClick={() => setOpen((v) => !v)}
          className="inline-flex h-8 items-center gap-1.5 rounded-md border border-[var(--border)] px-2.5 text-xs font-medium hover:bg-[var(--muted)]"
        >
          {t("projectBar.switch")}
          <ChevronsUpDown className="h-3 w-3 text-[var(--muted-foreground)]" />
        </button>
        {open && (
          <div className="absolute right-0 z-30 mt-2 w-64 overflow-hidden rounded-xl border border-[var(--border)] bg-[var(--popover)] p-1 shadow-[var(--shadow-card)]">
            {projects.map((p) => (
              <button
                key={p.id}
                onClick={() => {
                  setActiveProjectId(p.id);
                  setOpen(false);
                }}
                className="flex w-full items-center gap-2 rounded-md px-2.5 py-2 text-sm hover:bg-[var(--muted)]"
              >
                <span className="grid h-6 w-6 place-items-center rounded bg-[var(--muted)] text-[10px] font-semibold">{p.initials}</span>
                <span className="flex-1 truncate text-left">{p.name}</span>
                {p.id === activeProject.id && <Check className="h-3.5 w-3.5 text-[var(--primary)]" />}
              </button>
            ))}
            <Link
              to="/projects"
              onClick={() => setOpen(false)}
              className="mt-1 flex items-center justify-center rounded-md border-t border-[var(--border)] px-2.5 py-2 text-xs font-medium text-[var(--muted-foreground)] hover:text-[var(--foreground)]"
            >
              {t("common.viewAll")} →
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}