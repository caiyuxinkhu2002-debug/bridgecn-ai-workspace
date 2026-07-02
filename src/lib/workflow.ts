export type Stage = "research" | "consumer" | "localization" | "launch" | "reports" | "completed";

export const stageOrder: Stage[] = [
  "research",
  "consumer",
  "localization",
  "launch",
  "reports",
  "completed",
];

export const stageToPath: Record<Stage, string> = {
  research: "/china-market-insight",
  consumer: "/consumer-insight",
  localization: "/localization-studio",
  launch: "/launch-checklist",
  reports: "/reports",
  completed: "/projects",
};

export const stageLabelKey: Record<Stage, string> = {
  research: "stage.research",
  consumer: "stage.consumer",
  localization: "stage.localization",
  launch: "stage.launch",
  reports: "stage.reports",
  completed: "stage.completed",
};

export function nextStage(s: Stage): Stage | null {
  const i = stageOrder.indexOf(s);
  return i >= 0 && i < stageOrder.length - 1 ? stageOrder[i + 1] : null;
}

export function prevStage(s: Stage): Stage | null {
  const i = stageOrder.indexOf(s);
  return i > 0 ? stageOrder[i - 1] : null;
}

export function stageFromPath(pathname: string): Stage | null {
  for (const s of stageOrder) {
    if (pathname.startsWith(stageToPath[s])) return s;
  }
  return null;
}
