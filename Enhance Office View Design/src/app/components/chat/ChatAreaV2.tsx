import { useEffect, useRef, useState, useCallback } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Play, Upload, Users, Sparkles, Code, Palette, Search, FileText, Settings, Swords, Square, ArrowLeft, Eye, Key } from "lucide-react";
import { api } from "../../lib/api";
import { ArenaView } from "../arena/ArenaView";
import { TaskPlanPanel } from "./TaskPlanPanel";
import { ChatMessageV2 } from "./ChatMessageV2";
import { ChatInputV2 } from "./ChatInputV2";
import { MessageSkeleton } from "../shared/LoadingSkeleton";
import { ModeSelector, type OrchMode } from "./ModeSelector";
import { TeamPicker } from "./TeamPicker";

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
  onOpenInPreview?: (code: string, language: string) => void;
  onToggleContextPanel?: () => void;
  isStreaming?: boolean;
  onStopStream?: () => void;
  mode?: OrchMode;
  onModeSelectorChange?: (m: OrchMode) => void;
  isAdmin?: boolean;
  arenaMode?: "battle" | "leaderboard" | null;
  onSetArenaMode?: (mode: "battle" | "leaderboard" | null) => void;
  tasks?: any[];
  onExecuteTask?: (taskId: string, prompt: string) => void;
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

// Ref for ChatInputV2 to set text from outside
let _inputSetText: ((text: string) => void) | null = null;
export function setInputText(fn: (text: string) => void) { _inputSetText = fn; }

/* ── Empty State ── */
function EmptyStateView({ onQuickAction }: { onQuickAction: (prompt: string, insertOnly?: boolean) => void }) {
  return (
    <div className="flex flex-col items-center justify-center h-full gap-6 px-4">
      {/* Logo — X8 Refined */}
      <div className="flex items-center justify-center" style={{ width: 72, height: 72, color: "var(--text-primary)" }}>
        <svg viewBox="0 0 200 200" width="64" height="64" fill="none" aria-hidden="true">
          <g stroke="currentColor" strokeWidth="16" strokeLinecap="round">
            <line x1="58" y1="58" x2="88" y2="88" />
            <line x1="112" y1="112" x2="142" y2="142" />
            <line x1="142" y1="58" x2="112" y2="88" />
            <line x1="58" y1="142" x2="88" y2="112" />
          </g>
        </svg>
      </div>

      <div className="text-center">
        <h2
          style={{
            color: "var(--text-primary)",
            fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, system-ui, sans-serif",
            fontWeight: 500,
            fontSize: 22,
            letterSpacing: "3px",
            lineHeight: 1.1,
          }}
        >
          XEROCODE AI
        </h2>
        <p className="mt-2" style={{ color: "var(--text-tertiary)", fontSize: "var(--font-size-base)" }}>
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
              onClick={() => onQuickAction(action.prompt, true)}
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
  tasks = [],
  onExecuteTask,
  onOpenInPreview,
  onToggleContextPanel,
  isStreaming,
  onStopStream,
  mode = "xerocode_ai",
  onModeSelectorChange,
}: ChatAreaV2Props) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [inputText, setInputTextState] = useState("");
  const dragCounter = useRef(0);

  /* BYOK status — has user own keys? */
  const [hasBYOK, setHasBYOK] = useState<boolean>(false);
  useEffect(() => {
    api.byok.list().then((data: any) => {
      const any = Object.values(data || {}).some((v: any) => v && v.masked);
      setHasBYOK(any);
    }).catch(() => {});
  }, []);

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

      {/* ── Header ── 2 zones: primary controls (left) + meta actions (right) */}
      <div
        className="flex items-center gap-2 px-4 h-12 flex-shrink-0"
        /* NO overflow — иначе абсолютно-позиционированные dropdown'ы клипаются */
        style={{ borderBottom: "1px solid var(--border-default)", backgroundColor: "var(--bg-surface)" }}
      >
        {/* LEFT: Mode selector + Team picker — primary controls cluster */}
        {onModeSelectorChange && (
          <div className="flex-shrink-0">
            <ModeSelector value={mode} onChange={onModeSelectorChange} />
          </div>
        )}
        <div className="flex-shrink-0">
          <TeamPicker
            agents={agents as any}
            onAddAgent={onAddAgent}
            onRemoveAgent={onRemoveAgent}
            useKnowledgeBase={useKnowledgeBase}
            onToggleKB={onToggleKB}
          />
        </div>

        {/* Title (compact, collapsible) */}
        {goal?.title ? (
          <h3
            className="font-medium truncate text-sm hidden sm:block"
            style={{ color: "var(--text-secondary)", maxWidth: "30vw", marginLeft: 4 }}
            title={goal.title}
          >
            {goal.title}
          </h3>
        ) : null}

        {/* Status badge — только когда активно работает */}
        {goal && goalStarted && goal.status === "active" && (
          <span className="flex items-center gap-1 px-2 py-1 rounded-full text-[10px] font-medium flex-shrink-0" style={{ backgroundColor: "color-mix(in srgb, var(--accent-green) 15%, transparent)", color: "var(--accent-green)" }}>
            <span className="w-1.5 h-1.5 rounded-full bg-current animate-pulse" /> В работе
          </span>
        )}

        {/* Spacer */}
        <div className="flex-1" />

        {/* RIGHT: meta actions cluster */}
        <div className="flex items-center gap-1.5 flex-shrink-0">
          {hasBYOK && (
            <span
              className="flex items-center gap-1 px-2 py-1 rounded-full text-[10px] font-medium"
              style={{ backgroundColor: "color-mix(in srgb, var(--accent-blue) 15%, transparent)", color: "var(--accent-blue)" }}
              title="Используются ваши API ключи (BYOK)"
            >
              <Key size={10} /> Свои
            </span>
          )}
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
          {onToggleContextPanel && goal && (
            <button
              onClick={onToggleContextPanel}
              className="p-1.5 rounded-lg transition-colors"
              style={{ color: "var(--text-tertiary)" }}
              onMouseEnter={e => { e.currentTarget.style.backgroundColor = "var(--bg-elevated)"; }}
              onMouseLeave={e => { e.currentTarget.style.backgroundColor = "transparent"; }}
              title="План / Превью / Лог"
            >
              <Eye size={15} />
            </button>
          )}
        </div>
      </div>

      {/* Team/models живут теперь в TeamPicker (header) — отдельная строка убрана */}

      {/* ── Content area (messages + task panel) ── */}
      <div className="flex-1 flex overflow-hidden">
        {/* Messages */}
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
              {messagesLoading && messages.length === 0 ? (
                <div style={{ maxWidth: "var(--chat-max-width, 720px)", margin: "0 auto" }}>
                  <MessageSkeleton />
                  <MessageSkeleton />
                  <MessageSkeleton />
                </div>
              ) : messages.length === 0 ? (
                <EmptyStateView onQuickAction={(prompt, insertOnly) => {
                  if (insertOnly) {
                    setInputTextState(prompt);
                  } else {
                    onSendMessage(prompt);
                  }
                }} />
              ) : (
                <div style={{ maxWidth: tasks.length > 0 ? "none" : "var(--chat-max-width, 720px)", margin: tasks.length > 0 ? "0" : "0 auto" }}>
                  {messages.map((msg: any) => (
                    <ChatMessageV2 key={msg.id} message={msg} isAdmin={isAdmin} onOpenInPreview={onOpenInPreview} />
                  ))}
                </div>
              )}
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Task Plan Panel (right side) */}
        {goal && tasks.length > 0 && (
          <TaskPlanPanel
            tasks={tasks}
            agents={agents}
            onExecuteTask={(taskId, prompt) => {
              onSendMessage(`[Выполни задачу ${taskId}]: ${prompt}`);
            }}
          />
        )}
      </div>

      {/* ── Input ── */}
      <div className="mobile-safe-bottom" style={{ maxWidth: tasks.length > 0 ? "none" : "var(--chat-max-width, 720px)", margin: tasks.length > 0 ? "0" : "0 auto", width: "100%", padding: "0 var(--space-4, 16px)" }}>
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
          initialText={inputText}
          onTextChange={() => setInputTextState("")}
          isStreaming={isStreaming}
          onStop={onStopStream}
        />
      </div>
    </div>
  );
}
