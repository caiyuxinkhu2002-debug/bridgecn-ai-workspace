import type { AIProvider, AIProviderId } from "../types";
import { placeholderProvider } from "./placeholder";

// Provider registry. Adding a new provider is a one-liner here once its module
// implements the `AIProvider` contract. UI/service code never imports a
// concrete provider directly — they go through `getProvider()`.

const REGISTRY: Partial<Record<AIProviderId, AIProvider>> = {
  placeholder: placeholderProvider,
  // openai:     placeholderProvider, // TODO: implement
  // claude:     placeholderProvider, // TODO: implement
  // gemini:     placeholderProvider, // TODO: implement
  // openrouter: placeholderProvider, // TODO: implement
  // deepseek:   placeholderProvider, // TODO: implement
  // qwen:       placeholderProvider, // TODO: implement
};

const DEFAULT_PROVIDER_KEY = "bridgecn.ai.provider";

export function listProviders(): { id: AIProviderId; label: string; available: boolean }[] {
  const all: AIProviderId[] = ["placeholder", "openai", "claude", "gemini", "openrouter", "deepseek", "qwen"];
  return all.map((id) => ({ id, label: PROVIDER_LABELS[id], available: Boolean(REGISTRY[id]) }));
}

const PROVIDER_LABELS: Record<AIProviderId, string> = {
  placeholder: "Placeholder (Architecture Preview)",
  openai: "OpenAI",
  claude: "Claude",
  gemini: "Gemini",
  openrouter: "OpenRouter",
  deepseek: "DeepSeek",
  qwen: "Qwen",
};

export function getDefaultProviderId(): AIProviderId {
  if (typeof window === "undefined") return "placeholder";
  try {
    const saved = window.localStorage.getItem(DEFAULT_PROVIDER_KEY);
    if (saved && REGISTRY[saved as AIProviderId]) return saved as AIProviderId;
  } catch { /* ignore */ }
  return "placeholder";
}

export function setDefaultProviderId(id: AIProviderId) {
  if (typeof window === "undefined") return;
  try { window.localStorage.setItem(DEFAULT_PROVIDER_KEY, id); } catch { /* ignore */ }
}

export function getProvider(id?: AIProviderId): AIProvider {
  const wanted = id || getDefaultProviderId();
  return REGISTRY[wanted] || placeholderProvider;
}