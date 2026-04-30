/**
 * XEROCODE Workspaces — registry of 8 modules
 * Reference: BRANDBOOK_FINAL_v3.0.html, Sections 10-17
 */

export type WorkspaceId =
  | "chat"
  | "corp"
  | "images"
  | "code"
  | "video"
  | "sound"
  | "text"
  | "orchestration";

export interface Workspace {
  id: WorkspaceId;
  name: string;
  tagline: string;
  accent: string;          // CSS color value (hex)
  accentVar: string;       // CSS variable name
  iconKey: string;         // lucide icon name
  route: string;
  segment: "ai" | "corp";
  minPlan?: "free" | "go" | "pro" | "prime" | "enterprise";  // gating
}

export const WORKSPACES: Workspace[] = [
  {
    id: "chat",
    name: "Chat",
    tagline: "Общий диалог · 430+ моделей",
    accent: "#7C5CFF",
    accentVar: "--w-chat",
    iconKey: "MessageSquare",
    route: "/chat",
    segment: "ai",
    minPlan: "free",
  },
  {
    id: "text",
    name: "Text",
    tagline: "Документы · AI-coauthor",
    accent: "#F8F8FB",
    accentVar: "--w-text",
    iconKey: "FileText",
    route: "/text",
    segment: "ai",
    minPlan: "go",
  },
  {
    id: "code",
    name: "Code",
    tagline: "IDE · Docker sandbox · git",
    accent: "#22C55E",
    accentVar: "--w-code",
    iconKey: "Terminal",
    route: "/code",
    segment: "ai",
    minPlan: "go",
  },
  {
    id: "images",
    name: "Images",
    tagline: "gpt-image · Flux · Stability",
    accent: "#FFB547",
    accentVar: "--w-image",
    iconKey: "Image",
    route: "/images",
    segment: "ai",
    minPlan: "pro",
  },
  {
    id: "video",
    name: "Video",
    tagline: "Sora · Veo · Runway",
    accent: "#FF3B5C",
    accentVar: "--w-video",
    iconKey: "Film",
    route: "/video",
    segment: "ai",
    minPlan: "prime",
  },
  {
    id: "sound",
    name: "Sound",
    tagline: "Suno · ElevenLabs · Whisper",
    accent: "#FF6BFF",
    accentVar: "--w-sound",
    iconKey: "Music",
    route: "/sound",
    segment: "ai",
    minPlan: "prime",
  },
  {
    id: "orchestration",
    name: "Orchestration",
    tagline: "DAG · Multi-agent · 5 modes",
    accent: "#7C5CFF",
    accentVar: "--w-orch",
    iconKey: "Network",
    route: "/orchestration",
    segment: "ai",
    minPlan: "pro",
  },
  {
    id: "corp",
    name: "Corporate",
    tagline: "CRM · Каналы · 1С · Битрикс",
    accent: "#00D4FF",
    accentVar: "--w-corp",
    iconKey: "Building2",
    route: "/corp",
    segment: "corp",
    minPlan: "enterprise",
  },
];

export function getWorkspace(id: WorkspaceId): Workspace | undefined {
  return WORKSPACES.find((w) => w.id === id);
}

export function isWorkspaceAllowed(workspace: Workspace, plan: string): boolean {
  const order = ["free", "go", "pro", "prime", "enterprise", "enterprise_plus"];
  if (!workspace.minPlan) return true;
  return order.indexOf(plan) >= order.indexOf(workspace.minPlan);
}
