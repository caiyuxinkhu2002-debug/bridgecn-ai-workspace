import { useEffect, useState } from "react";
import type { SemrushSnapshot } from "@/lib/data/semrush.functions";

// Lightweight, project-scoped cache for the last SEMrush snapshot so every
// stage of the workflow (market → consumer → localization → launch → report)
// can tell whether the active project currently has a real verified data
// source connected, and drop the yellow "AI estimate" banner accordingly.

const KEY = (projectId: string) => `bridgecn:verified-snapshot:${projectId}`;

export function snapshotHasRealData(snap: SemrushSnapshot | null | undefined): boolean {
  if (!snap) return false;
  return Boolean(
    snap.domainOverview ||
      (snap.keywords && snap.keywords.length > 0) ||
      (snap.competitors && snap.competitors.length > 0),
  );
}

export function saveVerifiedSnapshot(projectId: string | null | undefined, snap: SemrushSnapshot) {
  if (!projectId || typeof window === "undefined") return;
  try {
    if (snapshotHasRealData(snap)) {
      window.localStorage.setItem(KEY(projectId), JSON.stringify(snap));
      window.dispatchEvent(new Event("bridgecn:verified-snapshot"));
    }
  } catch {
    /* noop */
  }
}

export function clearVerifiedSnapshot(projectId: string | null | undefined) {
  if (!projectId || typeof window === "undefined") return;
  try {
    window.localStorage.removeItem(KEY(projectId));
    window.dispatchEvent(new Event("bridgecn:verified-snapshot"));
  } catch {
    /* noop */
  }
}

function readSnapshot(projectId: string | null | undefined): SemrushSnapshot | null {
  if (!projectId || typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(KEY(projectId));
    if (!raw) return null;
    return JSON.parse(raw) as SemrushSnapshot;
  } catch {
    return null;
  }
}

export function useVerifiedSnapshot(projectId: string | null | undefined): SemrushSnapshot | null {
  const [snap, setSnap] = useState<SemrushSnapshot | null>(() => readSnapshot(projectId));
  useEffect(() => {
    setSnap(readSnapshot(projectId));
    const handler = () => setSnap(readSnapshot(projectId));
    window.addEventListener("bridgecn:verified-snapshot", handler);
    window.addEventListener("storage", handler);
    return () => {
      window.removeEventListener("bridgecn:verified-snapshot", handler);
      window.removeEventListener("storage", handler);
    };
  }, [projectId]);
  return snap;
}