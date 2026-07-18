import { auth, defineMcp } from "@lovable.dev/mcp-js";
import listProjects from "./tools/list-projects";
import getProject from "./tools/get-project";
import listKols from "./tools/list-kols";
import getKol from "./tools/get-kol";
import listShortlist from "./tools/list-shortlist";
import addToShortlist from "./tools/add-to-shortlist";

// The OAuth issuer MUST be the direct Supabase host — the published SUPABASE_URL
// is proxied through .lovable.cloud and RFC 8414 rejects an issuer mismatch.
const projectRef = import.meta.env.VITE_SUPABASE_PROJECT_ID ?? "project-ref-unset";

export default defineMcp({
  name: "bridgecn-ai-mcp",
  title: "BridgeCN AI",
  version: "0.1.0",
  instructions:
    "Tools for BridgeCN AI, the Korea → China market-entry OS. Use these to browse the user's projects, look up KOLs from the shared China KOL catalog (小红书 / 抖音 / B站 / 微信), and manage per-project KOL shortlists.",
  auth: auth.oauth.issuer({
    issuer: `https://${projectRef}.supabase.co/auth/v1`,
    acceptedAudiences: "authenticated",
  }),
  tools: [listProjects, getProject, listKols, getKol, listShortlist, addToShortlist],
});