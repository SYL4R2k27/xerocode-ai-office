import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  Plus,
  Search,
  Settings,
  LogOut,
  Swords,
  ChevronDown,
  ChevronRight,
  PanelLeftClose,
  PanelLeft,
  MessageSquare,
  DollarSign,
  Sun,
  Moon,
  Wifi,
  WifiOff,
} from "lucide-react";
import { LogoIcon } from "../shared/Logo";

/* ── Plan config ── */
const planConfig: Record<string, { label: string; color: string }> = {
  free: { label: "FREE", color: "var(--text-tertiary)" },
  start: { label: "START", color: "var(--text-secondary)" },
  pro: { label: "PRO", color: "var(--accent-teal)" },
  pro_plus: { label: "PRO PLUS", color: "var(--accent-lavender)" },
  ultima: { label: "ULTIMA", color: "var(--accent-amber)" },
  admin: { label: "ADMIN", color: "var(--accent-rose)" },
};

/* ── Types ── */
interface GoalItem {
  id: string;
  title: string;
  status: string;
  created_at: string;
}

interface SidebarV2Props {
  goals: GoalItem[];
  activeGoalId: string | null;
  onSelectGoal: (id: string) => void;
  onNewChat: () => void;
  userName: string;
  userPlan: string;
  onSettings: () => void;
  onPricing: () => void;
  onLogout: () => void;
  onArena: () => void;
  collapsed?: boolean;
  onToggleCollapse?: () => void;
  connected?: boolean;
  toggleTheme?: () => void;
  resolvedTheme?: string;
}

/* ── Date grouping helpers ── */
function getDateGroup(dateStr: string): string {
  const now = new Date();
  const date = new Date(dateStr);

  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const yesterdayStart = new Date(todayStart);
  yesterdayStart.setDate(yesterdayStart.getDate() - 1);

  // Start of this week (Monday)
  const weekStart = new Date(todayStart);
  const dayOfWeek = todayStart.getDay();
  const diff = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
  weekStart.setDate(weekStart.getDate() - diff);

  if (date >= todayStart) return "today";
  if (date >= yesterdayStart) return "yesterday";
  if (date >= weekStart) return "week";
  return "older";
}

const groupLabels: Record<string, string> = {
  today: "Сегодня",
  yesterday: "Вчера",
  week: "На этой неделе",
  older: "Ранее",
};

const groupOrder = ["today", "yesterday", "week", "older"];

function groupGoals(goals: GoalItem[]) {
  const groups: Record<string, GoalItem[]> = {};
  for (const goal of goals) {
    const group = getDateGroup(goal.created_at);
    if (!groups[group]) groups[group] = [];
    groups[group].push(goal);
  }
  return groups;
}

/* ── Component ── */
export function SidebarV2({
  goals,
  activeGoalId,
  onSelectGoal,
  onNewChat,
  userName,
  userPlan,
  onSettings,
  onPricing,
  onLogout,
  onArena,
  collapsed = false,
  onToggleCollapse,
  toggleTheme,
  resolvedTheme,
}: SidebarV2Props) {
  const [searchQuery, setSearchQuery] = useState("");
  const [olderExpanded, setOlderExpanded] = useState(false);

  const cfg = planConfig[userPlan] || planConfig.free;

  /* Filter goals by search */
  const filteredGoals = useMemo(() => {
    if (!searchQuery.trim()) return goals;
    const q = searchQuery.toLowerCase();
    return goals.filter((g) => g.title.toLowerCase().includes(q));
  }, [goals, searchQuery]);

  /* Group filtered goals by date */
  const grouped = useMemo(() => groupGoals(filteredGoals), [filteredGoals]);

  const userInitial = (userName || "U").charAt(0).toUpperCase();

  /* ── Collapsed mode ── */
  if (collapsed) {
    return (
      <div
        className="w-[56px] h-full flex flex-col items-center py-3 gap-2 flex-shrink-0"
        style={{
          background: "var(--glass-bg)",
          backdropFilter: `blur(var(--glass-blur))`,
          borderRight: "1px solid var(--glass-border)",
        }}
      >
        {/* Logo */}
        <div className="mb-1">
          <LogoIcon size={24} />
        </div>

        {/* Expand */}
        <button
          onClick={onToggleCollapse}
          className="p-2 rounded-lg transition-colors"
          style={{ color: "var(--text-tertiary)" }}
          onMouseEnter={(e) => (e.currentTarget.style.background = "var(--bg-elevated)")}
          onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
          title="Развернуть"
        >
          <PanelLeft size={16} />
        </button>

        {/* New chat */}
        <button
          onClick={onNewChat}
          className="p-2 rounded-lg transition-colors"
          style={{ color: "var(--accent-blue)" }}
          onMouseEnter={(e) => (e.currentTarget.style.background = "var(--bg-elevated)")}
          onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
          title="Новый чат"
        >
          <Plus size={18} />
        </button>

        {/* Search */}
        <button
          className="p-2 rounded-lg transition-colors"
          style={{ color: "var(--text-tertiary)" }}
          onMouseEnter={(e) => (e.currentTarget.style.background = "var(--bg-elevated)")}
          onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
          title="Поиск"
        >
          <Search size={16} />
        </button>

        <div className="flex-1" />

        {/* Arena */}
        <button
          onClick={onArena}
          className="p-2 rounded-lg transition-colors"
          style={{ color: "var(--text-tertiary)" }}
          onMouseEnter={(e) => (e.currentTarget.style.background = "var(--bg-elevated)")}
          onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
          title="Арена"
        >
          <Swords size={16} />
        </button>

        {/* User avatar */}
        <button
          onClick={onSettings}
          className="w-8 h-8 rounded-full flex items-center justify-center text-[12px] font-semibold flex-shrink-0"
          style={{
            background: "linear-gradient(135deg, var(--accent-blue), var(--accent-lavender))",
            color: "#fff",
          }}
          title={userName}
        >
          {userInitial}
        </button>
      </div>
    );
  }

  /* ── Expanded mode ── */
  return (
    <div
      className="h-full flex flex-col flex-shrink-0"
      style={{
        width: "var(--sidebar-width)",
        background: "var(--glass-bg)",
        backdropFilter: `blur(var(--glass-blur))`,
        borderRight: "1px solid var(--glass-border)",
      }}
    >
      {/* ── Header: Logo + Collapse ── */}
      <div
        className="flex items-center justify-between px-4 h-12 flex-shrink-0"
        style={{ borderBottom: "1px solid var(--border-subtle)" }}
      >
        <div className="flex items-center gap-2">
          <LogoIcon size={20} />
          <span
            style={{
              color: "var(--text-primary)",
              fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, system-ui, sans-serif",
              fontWeight: 500,
              fontSize: 13,
              letterSpacing: "1.8px",
              lineHeight: 1,
            }}
          >
            XEROCODE
          </span>
        </div>
        {onToggleCollapse && (
          <button
            onClick={onToggleCollapse}
            className="p-1.5 rounded-lg transition-colors"
            style={{ color: "var(--text-tertiary)" }}
            onMouseEnter={(e) => (e.currentTarget.style.background = "var(--bg-elevated)")}
            onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
            title="Свернуть"
          >
            <PanelLeftClose size={16} />
          </button>
        )}
      </div>

      {/* ── New Chat Button ── */}
      <div className="px-3 pt-3 pb-1">
        <button
          onClick={onNewChat}
          className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-lg font-medium transition-all"
          style={{
            fontSize: "var(--font-size-sm)",
            backgroundColor: "var(--accent-blue)",
            color: "#fff",
          }}
          onMouseEnter={(e) => (e.currentTarget.style.opacity = "0.9")}
          onMouseLeave={(e) => (e.currentTarget.style.opacity = "1")}
        >
          <Plus size={16} />
          Новый чат
        </button>
      </div>

      {/* ── Search ── */}
      <div className="px-3 py-2">
        <div
          className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg"
          style={{
            backgroundColor: "var(--bg-input)",
            border: "1px solid var(--border-subtle)",
          }}
        >
          <Search size={14} style={{ color: "var(--text-tertiary)", flexShrink: 0 }} />
          <input
            type="text"
            placeholder="Поиск..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-transparent border-none outline-none"
            style={{
              fontSize: "var(--font-size-sm)",
              color: "var(--text-primary)",
            }}
          />
        </div>
      </div>

      {/* ── Chat List (grouped by date) ── */}
      <div className="flex-1 overflow-y-auto px-1.5">
        {filteredGoals.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-8 gap-2">
            <MessageSquare size={24} style={{ color: "var(--text-tertiary)" }} />
            <span style={{ color: "var(--text-tertiary)", fontSize: "var(--font-size-sm)" }}>
              {searchQuery ? "Ничего не найдено" : "Нет чатов"}
            </span>
          </div>
        ) : (
          groupOrder.map((groupKey) => {
            const items = grouped[groupKey];
            if (!items || items.length === 0) return null;

            const isOlder = groupKey === "older";
            const showItems = isOlder && !olderExpanded ? items.slice(0, 3) : items;

            return (
              <div key={groupKey} className="mb-1">
                {/* Group header */}
                <div className="flex items-center px-2.5 pt-3 pb-1">
                  {isOlder && items.length > 3 ? (
                    <button
                      onClick={() => setOlderExpanded(!olderExpanded)}
                      className="flex items-center gap-1 w-full"
                    >
                      <span
                        className="font-semibold uppercase tracking-wider"
                        style={{
                          fontSize: "var(--font-size-xs)",
                          color: "var(--text-tertiary)",
                          letterSpacing: "0.05em",
                        }}
                      >
                        {groupLabels[groupKey]}
                      </span>
                      {olderExpanded ? (
                        <ChevronDown size={10} style={{ color: "var(--text-tertiary)" }} />
                      ) : (
                        <ChevronRight size={10} style={{ color: "var(--text-tertiary)" }} />
                      )}
                    </button>
                  ) : (
                    <span
                      className="font-semibold uppercase tracking-wider"
                      style={{
                        fontSize: "var(--font-size-xs)",
                        color: "var(--text-tertiary)",
                        letterSpacing: "0.05em",
                      }}
                    >
                      {groupLabels[groupKey]}
                    </span>
                  )}
                </div>

                {/* Goal items */}
                <AnimatePresence initial={false}>
                  {showItems.map((goal) => {
                    const isActive = goal.id === activeGoalId;
                    return (
                      <motion.button
                        key={goal.id}
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        exit={{ opacity: 0, height: 0 }}
                        transition={{ duration: 0.15 }}
                        onClick={() => onSelectGoal(goal.id)}
                        className="w-full flex items-center gap-2 px-2.5 py-2 rounded-lg text-left transition-colors group"
                        style={{
                          fontSize: "var(--font-size-sm)",
                          color: isActive ? "var(--text-primary)" : "var(--text-secondary)",
                          backgroundColor: isActive
                            ? "color-mix(in srgb, var(--accent-blue) 12%, transparent)"
                            : "transparent",
                          borderLeft: isActive ? "3px solid var(--accent-blue)" : "3px solid transparent",
                        }}
                        onMouseEnter={(e) => {
                          if (!isActive) e.currentTarget.style.backgroundColor = "var(--bg-elevated)";
                        }}
                        onMouseLeave={(e) => {
                          if (!isActive)
                            e.currentTarget.style.backgroundColor = "transparent";
                        }}
                      >
                        <span className="truncate flex-1">{goal.title}</span>
                        {goal.status === "active" && (
                          <span
                            className="w-1.5 h-1.5 rounded-full flex-shrink-0"
                            style={{ backgroundColor: "var(--accent-teal)" }}
                          />
                        )}
                      </motion.button>
                    );
                  })}
                </AnimatePresence>

                {/* "Show more" for older */}
                {isOlder && !olderExpanded && items.length > 3 && (
                  <button
                    onClick={() => setOlderExpanded(true)}
                    className="w-full px-2.5 py-1.5 text-left transition-colors"
                    style={{
                      fontSize: "var(--font-size-xs)",
                      color: "var(--accent-blue)",
                    }}
                    onMouseEnter={(e) => (e.currentTarget.style.opacity = "0.8")}
                    onMouseLeave={(e) => (e.currentTarget.style.opacity = "1")}
                  >
                    + ещё {items.length - 3}
                  </button>
                )}
              </div>
            );
          })
        )}
      </div>

      {/* ── Arena link ── */}
      <div className="px-3 py-1" style={{ borderTop: "1px solid var(--border-subtle)" }}>
        <button
          onClick={onArena}
          className="w-full flex items-center gap-2.5 px-2.5 py-2 rounded-lg font-medium transition-all"
          style={{
            fontSize: "var(--font-size-sm)",
            color: "var(--text-secondary)",
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = "var(--bg-elevated)";
            e.currentTarget.style.color = "var(--accent-arena)";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = "transparent";
            e.currentTarget.style.color = "var(--text-secondary)";
          }}
        >
          <Swords size={16} />
          Арена
        </button>
      </div>

      {/* ── User section ── */}
      <div
        className="px-3 py-3 flex-shrink-0"
        style={{ borderTop: "1px solid var(--border-subtle)" }}
      >
        <div className="flex items-center gap-2.5">
          {/* Avatar */}
          <div
            className="w-8 h-8 rounded-full flex items-center justify-center text-[12px] font-semibold flex-shrink-0"
            style={{
              background: "linear-gradient(135deg, var(--accent-blue), var(--accent-lavender))",
              color: "#fff",
            }}
          >
            {userInitial}
          </div>

          {/* Name + Plan */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-1.5">
              <span
                className="font-medium truncate"
                style={{ color: "var(--text-primary)", fontSize: "var(--font-size-sm)" }}
              >
                {userName}
              </span>
            </div>
            <div className="flex items-center gap-1 mt-0.5">
              <span
                className="font-bold px-1.5 py-0.5 rounded-md"
                style={{
                  fontSize: "9px",
                  color: cfg.color,
                  backgroundColor: `color-mix(in srgb, ${cfg.color} 12%, transparent)`,
                }}
              >
                {cfg.label}
              </span>
            </div>
          </div>

          {/* Settings gear */}
          <button
            onClick={onSettings}
            className="p-1.5 rounded-lg transition-colors"
            style={{ color: "var(--text-tertiary)" }}
            onMouseEnter={(e) => (e.currentTarget.style.background = "var(--bg-elevated)")}
            onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
            title="Настройки"
          >
            <Settings size={14} />
          </button>

          {/* Theme toggle */}
          {toggleTheme && (
            <button
              onClick={toggleTheme}
              className="p-1.5 rounded-lg transition-colors"
              style={{ color: "var(--text-tertiary)" }}
              onMouseEnter={(e) => (e.currentTarget.style.background = "var(--bg-elevated)")}
              onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
              title={resolvedTheme === "dark" ? "Светлая тема" : "Тёмная тема"}
            >
              {resolvedTheme === "dark" ? <Sun size={14} /> : <Moon size={14} />}
            </button>
          )}

          {/* Pricing */}
          <button
            onClick={onPricing}
            className="p-1.5 rounded-lg transition-colors"
            style={{ color: "var(--text-tertiary)" }}
            onMouseEnter={(e) => (e.currentTarget.style.background = "var(--bg-elevated)")}
            onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
            title="Тарифы"
          >
            <DollarSign size={14} />
          </button>

          {/* Logout */}
          <button
            onClick={onLogout}
            className="p-1.5 rounded-lg transition-colors"
            style={{ color: "var(--text-tertiary)" }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = "var(--bg-elevated)";
              e.currentTarget.style.color = "var(--accent-rose)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = "transparent";
              e.currentTarget.style.color = "var(--text-tertiary)";
            }}
            title="Выйти"
          >
            <LogOut size={14} />
          </button>
        </div>
      </div>
    </div>
  );
}
