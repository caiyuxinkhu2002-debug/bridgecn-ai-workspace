// Public surface for the AI engine. Modules import from "@/lib/ai".
export * from "./types";
export { createAndRunJob, listJobs, getJob, deleteJob } from "./service";
export type { CreateJobInput, AIJobEvent } from "./service";
export { useAIJob, type UseAIJobState } from "./use-ai-job";
export { getProvider, getDefaultProviderId, setDefaultProviderId, listProviders } from "./providers";