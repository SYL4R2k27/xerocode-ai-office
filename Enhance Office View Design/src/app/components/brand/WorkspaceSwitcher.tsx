/**
 * XEROCODE WorkspaceSwitcher — sidebar with 8 workspaces
 * Reference: BRANDBOOK_FINAL_v3.0.html, Section 10
 */
import { motion } from "motion/react";
import {
  Building2,
  Film,
  FileText,
  Image as ImageIcon,
  Lock,
  MessageSquare,
  Music,
  Network,
  Terminal,
} from "lucide-react";
import { WORKSPACES, type WorkspaceId, isWorkspaceAllowed, type Workspace } from "../../lib/workspaces";
import { staggerItem, staggerList } from "../../lib/motion-presets";

const iconMap = {
  MessageSquare,
  FileText,
  Terminal,
  Image: ImageIcon,
  Film,
  Music,
  Network,
  Building2,
};

interface WorkspaceSwitcherProps {
  activeId: WorkspaceId;
  userPlan?: string;
  collapsed?: boolean;
  onSelect: (id: WorkspaceId) => void;
}

function WorkspaceItem({
  ws,
  active,
  allowed,
  collapsed,
  onClick,
}: {
  ws: Workspace;
  active: boolean;
  allowed: boolean;
  collapsed: boolean;
  onClick: () => void;
}) {
  const Icon = iconMap[ws.iconKey as keyof typeof iconMap] || MessageSquare;
  return (
    <motion.button
      variants={staggerItem}
      onClick={allowed ? onClick : undefined}
      disabled={!allowed}
      data-mascot-trigger
      style={{
        display: "flex",
        alignItems: "center",
        gap: collapsed ? 0 : 12,
        padding: collapsed ? "10px" : "10px 12px",
        borderRadius: "var(--radius-sm)",
        background: active ? `${ws.accent}1F` : "transparent",
        color: active ? ws.accent : allowed ? "var(--text-secondary)" : "var(--text-disabled)",
        border: "none",
        cursor: allowed ? "pointer" : "not-allowed",
        opacity: allowed ? 1 : 0.5,
        fontFamily: "var(--font-sans)",
        fontWeight: active ? 600 : 500,
        fontSize: 13,
        textAlign: "left",
        width: "100%",
        position: "relative",
        transition: "background 150ms, color 150ms",
        justifyContent: collapsed ? "center" : "flex-start",
      }}
      whileHover={allowed && !active ? { background: "var(--bg-hover)" } : undefined}
    >
      {active && !collapsed && (
        <span
          style={{
            position: "absolute",
            left: 0,
            top: "20%",
            bottom: "20%",
            width: 3,
            background: ws.accent,
            borderRadius: "0 3px 3px 0",
            boxShadow: `0 0 12px ${ws.accent}`,
          }}
        />
      )}
      <Icon size={18} strokeWidth={1.75} />
      {!collapsed && (
        <>
          <span style={{ flex: 1, whiteSpace: "nowrap" }}>{ws.name}</span>
          {!allowed && <Lock size={12} strokeWidth={2} />}
        </>
      )}
    </motion.button>
  );
}

export function WorkspaceSwitcher({
  activeId,
  userPlan = "free",
  collapsed = false,
  onSelect,
}: WorkspaceSwitcherProps) {
  const aiWorkspaces = WORKSPACES.filter((w) => w.segment === "ai");
  const corpWorkspaces = WORKSPACES.filter((w) => w.segment === "corp");

  return (
    <motion.nav
      variants={staggerList}
      initial="hidden"
      animate="visible"
      style={{
        display: "flex",
        flexDirection: "column",
        gap: 4,
        padding: "12px 8px",
      }}
    >
      {!collapsed && (
        <p
          style={{
            fontFamily: "var(--font-mono)",
            fontSize: 9,
            letterSpacing: "0.2em",
            color: "var(--text-muted)",
            textTransform: "uppercase",
            padding: "8px 12px 4px",
            margin: 0,
          }}
        >
          AI Workspaces
        </p>
      )}

      {aiWorkspaces.map((ws) => (
        <WorkspaceItem
          key={ws.id}
          ws={ws}
          active={ws.id === activeId}
          allowed={isWorkspaceAllowed(ws, userPlan)}
          collapsed={collapsed}
          onClick={() => onSelect(ws.id)}
        />
      ))}

      {!collapsed && corpWorkspaces.length > 0 && (
        <p
          style={{
            fontFamily: "var(--font-mono)",
            fontSize: 9,
            letterSpacing: "0.2em",
            color: "var(--text-muted)",
            textTransform: "uppercase",
            padding: "20px 12px 4px",
            margin: 0,
          }}
        >
          Corporate
        </p>
      )}

      {corpWorkspaces.map((ws) => (
        <WorkspaceItem
          key={ws.id}
          ws={ws}
          active={ws.id === activeId}
          allowed={isWorkspaceAllowed(ws, userPlan)}
          collapsed={collapsed}
          onClick={() => onSelect(ws.id)}
        />
      ))}
    </motion.nav>
  );
}
