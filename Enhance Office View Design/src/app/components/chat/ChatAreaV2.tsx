import { useEffect, useRef, useState, useCallback } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Play, Upload, Users, Sparkles, Code, Palette, Search, FileText, Settings, Swords, Square, ArrowLeft } from "lucide-react";
import { ArenaView } from "../arena/ArenaView";
import { ChatMessageV2 } from "./ChatMessageV2";
import { ChatInputV2 } from "./ChatInputV2";
import TeamBar from "./TeamBar";

/* ── Types ── */
interface GoalInfo {
  id: string;
  title: string;
  status: string;
  distribution_mode: string;
}

interface ChatAreaV2Props {
  goal: GoalInfo | null;
  messages: any[];
  agents: any[];
  onSendMessage: (content: string) => void;
  onCreateGoal?: (title: string, mode: string) => any;
  onStartGoal: () => void;
  isStarting: boolean;
  goalStarted: boolean;
  useKnowledgeBase: boolean;
  onToggleKB: () => void;
  onModeChange: (mode: string) => void;
  onAddAgent: () => void;
  onRemoveAgent: (id: string) => void;
  onOpenModelSetup: () => void;
  showModelSetup: boolean;
  setShowModelSetup: (v: boolean) => void;
  messagesLoading?: boolean;
  isAdmin?: boolean;
  arenaMode?: "battle" | "leaderboard" | null;
  onSetArenaMode?: (mode: "battle" | "leaderboard" | null) => void;
}

const modeLabels: Record<string, string> = {
  manager: "Менеджер",
  discussion: "Обсуждение",
  auto: "Авто",
};

/* ── Quick Actions (Empty State) ── */
const QUICK_ACTIONS = [
  { icon: Code, label: "Код", desc: "Написать функцию или приложение", color: "#3B82F6", prompt: "Напиши на Python функцию которая " },
  { icon: Palette, label: "Дизайн", desc: "Создать макет или изображение", color: "#EC4899", prompt: "Создай дизайн лендинга для " },
  { icon: Search, label: "Ресёрч", desc: "Исследовать тему", color: "#10B981", prompt: "Проведи исследование на тему " },
  { icon: FileText, label: "Текст", desc: "Написать статью или документ", color: "#F59E0B", prompt: "Напиши статью о " },
];

/* ── Empty State ── */
function EmptyStateView({ onQuickAction }: { onQuickAction: (prompt: string) => void }) {
  return (
    <div className="flex flex-col items-center justify-center h-full gap-6 px-4">
      {/* Logo */}
      <div
        className="w-16 h-16 rounded-2xl flex items-center justify-center"
        style={{ background: "linear-gradient(135deg, var(--accent-blue), var(--accent-lavender))" }}
      >
        <Sparkles size={28} color="#fff" />
      </div>

      <div className="text-center">
        <h2 className="text-xl font-bold" style={{ color: "var(--text-primary)" }}>
          XeroCode AI
        </h2>
        <p className="mt-1" style={{ color: "var(--text-tertiary)", fontSize: "var(--font-size-base)" }}>
          Чем могу помочь сегодня?
        </p>
      </div>

      {/* Quick action cards */}
      <div className="grid grid-cols-2 gap-3 w-full" style={{ maxWidth: "440px" }}>
        {QUICK_ACTIONS.map((action) => {
          const Icon = action.icon;
          return (
            <motion.button
              key={action.label}
              whileHover={{ y: -2, borderColor: action.color }}
              whileTap={{ scale: 0.98 }}
              onClick={() => onQuickAction(action.prompt)}
              className="flex flex-col items-start p-4 rounded-xl text-left transition-all"
              style={{
                backgroundColor: "var(--bg-surface)",
                border: "1px solid var(--border-default)",
              }}
            >
              <Icon size={20} style={{ color: action.color }} className="mb-2" />
              <span className="text-sm font-semibold" style={{ color: "var(--text-primary)" }}>
                {action.label}
              </span>
              <span className="text-xs mt-0.5" style={{ color: "var(--text-tertiary)" }}>
                {action.desc}
              </span>
            </motion.button>
          );
        })}
      </div>
    </div>
  );
}

/* ── Main Component ── */
export function ChatAreaV2({
  goal,
  messages,
  agents,
  onSendMessage,
  onCreateGoal,
  onStartGoal,
  isStarting,
  goalStarted,
  useKnowledgeBase,
  onToggleKB,
  onModeChange,
  onAddAgent,
  onRemoveAgent,
  onOpenModelSetup,
  showModelSetup,
  setShowModelSetup,
  messagesLoading,
  isAdmin,
  arenaMode,
  onSetArenaMode,
}: ChatAreaV2Props) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const dragCounter = useRef(0);

  /* Auto-scroll on new messages */
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages.length]);

  /* Reset scroll when switching goals */
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = 0;
    }
  }, [goal?.id]);

  /* Drag & Drop */
  const handleDragEnter = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    dragCounter.current++;
    if (e.dataTransfer.types.includes("Files")) setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    dragCounter.current--;
    if (dragCounter.current === 0) setIsDragging(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    dragCounter.current = 0;
    setIsDragging(false);
  }, []);

  /* Arena mode */
  if (arenaMode) {
    return (
      <div className="flex flex-col h-full" style={{ backgroundColor: "var(--bg-base)" }}>
        {/* Arena header with back button */}
        <div className="flex items-center gap-3 px-5 h-12 flex-shrink-0" style={{ borderBottom: "1px solid var(--border-default)", backgroundColor: "var(--bg-surface)" }}>
          <button
            onClick={() => onSetArenaMode?.(null)}
            className="flex items-center gap-1.5 text-xs font-medium transition-colors"
            style={{ color: "var(--text-secondary)" }}
            onMouseEnter={e => { e.currentTarget.style.color = "var(--text-primary)"; }}
            onMouseLeave={e => { e.currentTarget.style.color = "var(--text-secondary)"; }}
          >
            <ArrowLeft size={14} /> Назад к чату
          </button>
          <div className="flex items-center gap-2">
            <Swords size={16} style={{ color: "var(--accent-arena, var(--accent-amber))" }} />
            <h3 className="font-semibold" style={{ color: "var(--text-primary)", fontSize: "var(--font-size-base, 15px)" }}>
              Арена
            </h3>
          </div>
        </div>
        {/* Arena content */}
        <div className="flex-1 overflow-hidden">
          <ArenaView onStartBattle={() => {}} />
        </div>
      </div>
    );
  }

  return (
    <div
      className="flex flex-col h-full min-w-0 relative"
      style={{ backgroundColor: "var(--bg-base)" }}
      onDragEnter={handleDragEnter}
      onDragLeave={handleDragLeave}
      onDragOver={(e) => e.preventDefault()}
      onDrop={handleDrop}
    >
      {/* ── Drag overlay ── */}
      <AnimatePresence>
        {isDragging && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 z-50 flex flex-col items-center justify-center gap-3 pointer-events-none"
            style={{ backgroundColor: "rgba(0,0,0,0.6)", backdropFilter: "blur(4px)" }}
          >
            <div className="w-16 h-16 rounded-2xl flex items-center justify-center" style={{ backgroundColor: "var(--accent-blue)" }}>
              <Upload size={28} color="#fff" />
            </div>
            <p className="text-[15px] font-medium text-white">Перетащи файлы сюда</p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Header ── */}
      <div
        className="flex items-center justify-between px-5 h-12 flex-shrink-0"
        style={{ borderBottom: "1px solid var(--border-default)", backgroundColor: "var(--bg-surface)" }}
      >
        <div className="flex items-center gap-3 min-w-0 flex-1">
          <h3 className="font-semibold truncate" style={{ color: "var(--text-primary)", fontSize: "var(--font-size-base, 15px)", maxWidth: "50vw" }}>
            {goal?.title || "Новый проект"}
          </h3>
          {goal && (
            <span className="font-medium px-2 py-0.5 rounded-full flex-shrink-0 text-xs" style={{ backgroundColor: "var(--bg-elevated)", color: "var(--text-secondary)", border: "1px solid var(--border-default)" }}>
              {modeLabels[goal.distribution_mode] || "Менеджер"}
            </span>
          )}
        </div>

        <div className="flex items-center gap-2">
          {/* Start/Stop button */}
          {goal && !goalStarted && (
            <button
              onClick={onStartGoal}
              disabled={isStarting}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all hover:brightness-110 disabled:opacity-50"
              style={{ backgroundColor: "var(--accent-blue)", color: "#fff" }}
            >
              <Play size={12} />
              {isStarting ? "Запуск..." : "Запустить"}
            </button>
          )}
          {goal && goalStarted && goal.status === "active" && (
            <span className="flex items-center gap-1 px-2 py-1 rounded-full text-[10px] font-medium" style={{ backgroundColor: "color-mix(in srgb, var(--accent-green) 15%, transparent)", color: "var(--accent-green)" }}>
              <span className="w-1.5 h-1.5 rounded-full bg-current animate-pulse" /> В работе
            </span>
          )}
        </div>
      </div>

      {/* ── Team Bar ── */}
      {goal && agents.length > 0 && (
        <TeamBar
          agents={agents.map((a: any) => ({
            id: a.id,
            name: a.name,
            role: a.role || "",
            provider: a.provider || "openrouter",
            model_name: a.model_name || "",
            status: a.status || "idle",
            avatar: a.avatar,
          }))}
          mode={(goal.distribution_mode as any) || "manager"}
          onModeChange={onModeChange}
          onRemoveAgent={onRemoveAgent}
          onAddAgent={onAddAgent}
          useKnowledgeBase={useKnowledgeBase}
          onToggleKB={onToggleKB}
        />
      )}

      {/* ── Messages ── */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto py-6 px-4">
        <AnimatePresence mode="wait">
          <motion.div
            key={goal?.id || "empty"}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            className="h-full"
          >
            {messages.length === 0 ? (
              <EmptyStateView onQuickAction={(prompt) => onSendMessage(prompt)} />
            ) : (
              <div style={{ maxWidth: "var(--chat-max-width, 720px)", margin: "0 auto" }}>
                {messages.map((msg: any) => (
                  <ChatMessageV2 key={msg.id} message={msg} isAdmin={isAdmin} />
                ))}
              </div>
            )}
          </motion.div>
        </AnimatePresence>
      </div>

      {/* ── Input ── */}
      <div style={{ maxWidth: "var(--chat-max-width, 720px)", margin: "0 auto", width: "100%", padding: "0 var(--space-4, 16px)" }}>
        <ChatInputV2
          onSend={onSendMessage}
          disabled={false}
          placeholder={
            !goal
              ? "Опиши задачу для создания нового проекта..."
              : goalStarted
              ? "Сообщение для команды... (@claude, @gpt)"
              : "Опиши задачу и нажми Запустить..."
          }
        />
      </div>
    </div>
  );
}
