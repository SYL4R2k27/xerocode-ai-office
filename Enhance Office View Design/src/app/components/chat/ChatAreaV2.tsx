import { useEffect, useRef, useState, useCallback } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Play, Upload, Users } from "lucide-react";
import { ChatMessageV2 } from "./ChatMessageV2";
import { ChatInputV2 } from "./ChatInputV2";
import { MessageSkeleton } from "../shared/LoadingSkeleton";

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
}

const modeLabels: Record<string, string> = {
  manager: "Менеджер",
  discussion: "Обсуждение",
  auto: "Авто",
};

/* ── Empty state ── */
function EmptyState({
  hasGoal,
  goalStarted,
  isStarting,
  onStartGoal,
}: {
  hasGoal: boolean;
  goalStarted: boolean;
  isStarting: boolean;
  onStartGoal: () => void;
}) {
  return (
    <div className="flex flex-col items-center justify-center h-full gap-4">
      <div
        className="w-16 h-16 rounded-2xl flex items-center justify-center"
        style={{ backgroundColor: "var(--bg-surface)" }}
      >
        <Users size={24} style={{ color: "var(--text-tertiary)" }} />
      </div>
      <div className="text-center">
        <p
          className="font-medium"
          style={{ color: "var(--text-secondary)", fontSize: "var(--font-size-base)" }}
        >
          {!hasGoal ? "Опиши задачу для ИИ-команды" : "Готово к запуску"}
        </p>
        <p
          className="mt-1"
          style={{ color: "var(--text-tertiary)", fontSize: "var(--font-size-sm)" }}
        >
          {!hasGoal
            ? "Напиши цель и модели начнут работу"
            : "Сообщения от моделей появятся здесь"}
        </p>
      </div>
      {hasGoal && !goalStarted && (
        <motion.button
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          onClick={onStartGoal}
          disabled={isStarting}
          className="flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all hover:brightness-110 disabled:opacity-50"
          style={{
            backgroundColor: "var(--accent-blue)",
            color: "#fff",
            fontSize: "var(--font-size-sm)",
          }}
        >
          <Play size={14} />
          {isStarting ? "Запуск..." : "Запустить команду"}
        </motion.button>
      )}
    </div>
  );
}

/* ── Main Component ── */
export function ChatAreaV2({
  goal,
  messages,
  agents,
  onSendMessage,
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

  /* Drag & Drop handlers */
  const handleDragEnter = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    dragCounter.current++;
    if (e.dataTransfer.types.includes("Files")) setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    dragCounter.current--;
    if (dragCounter.current === 0) setIsDragging(false);
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    dragCounter.current = 0;
    setIsDragging(false);
    // Files are handled by ChatInputV2 via its own drop zone
  }, []);

  return (
    <div
      className="flex flex-col h-full min-w-0 relative"
      style={{ backgroundColor: "var(--bg-base)" }}
      onDragEnter={handleDragEnter}
      onDragLeave={handleDragLeave}
      onDragOver={handleDragOver}
      onDrop={handleDrop}
    >
      {/* ── Drag overlay ── */}
      <AnimatePresence>
        {isDragging && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            className="absolute inset-0 z-50 flex flex-col items-center justify-center gap-3 pointer-events-none"
            style={{ backgroundColor: "rgba(0, 0, 0, 0.6)", backdropFilter: "blur(4px)" }}
          >
            <div
              className="w-16 h-16 rounded-2xl flex items-center justify-center"
              style={{ backgroundColor: "var(--accent-blue)" }}
            >
              <Upload size={28} style={{ color: "#fff" }} />
            </div>
            <p className="text-[15px] font-medium" style={{ color: "#fff" }}>
              Перетащи файлы сюда
            </p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Header ── */}
      <div
        className="flex items-center justify-between px-4 h-12 flex-shrink-0"
        style={{
          borderBottom: "1px solid var(--border-default)",
          backgroundColor: "var(--bg-surface)",
        }}
      >
        <div className="flex items-center gap-3 min-w-0 flex-1">
          {goal ? (
            <>
              <h3
                className="font-semibold truncate max-w-[50vw]"
                style={{ color: "var(--text-primary)", fontSize: "var(--font-size-base)" }}
              >
                {goal.title}
              </h3>
              <span
                className="font-medium px-2 py-0.5 rounded-full flex-shrink-0"
                style={{
                  fontSize: "var(--font-size-xs)",
                  backgroundColor: "var(--bg-elevated)",
                  color: "var(--text-secondary)",
                  border: "1px solid var(--border-subtle)",
                }}
              >
                {modeLabels[goal.distribution_mode] || goal.distribution_mode}
              </span>
              {/* Agent avatars */}
              <div className="flex -space-x-1.5 ml-2">
                {agents.slice(0, 4).map((agent: any) => (
                  <div
                    key={agent.id}
                    className="w-6 h-6 rounded-full flex items-center justify-center text-[10px] border-2"
                    style={{
                      backgroundColor: "var(--bg-elevated)",
                      borderColor: "var(--bg-surface)",
                      color: "var(--text-secondary)",
                    }}
                    title={agent.name}
                  >
                    {agent.name.charAt(0)}
                  </div>
                ))}
                {agents.length > 4 && (
                  <div
                    className="w-6 h-6 rounded-full flex items-center justify-center text-[10px] border-2"
                    style={{
                      backgroundColor: "var(--bg-elevated)",
                      borderColor: "var(--bg-surface)",
                      color: "var(--text-tertiary)",
                    }}
                  >
                    +{agents.length - 4}
                  </div>
                )}
              </div>
            </>
          ) : (
            <h3
              className="font-semibold"
              style={{ color: "var(--text-secondary)", fontSize: "var(--font-size-base)" }}
            >
              Новый проект
            </h3>
          )}
        </div>

        {/* Start button */}
        {goal && !goalStarted && (
          <button
            onClick={onStartGoal}
            disabled={isStarting}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-medium transition-all hover:brightness-110 disabled:opacity-50"
            style={{
              fontSize: "var(--font-size-sm)",
              backgroundColor: "var(--accent-blue)",
              color: "#fff",
            }}
          >
            <Play size={14} />
            {isStarting ? "Запуск..." : "Запустить"}
          </button>
        )}
      </div>

      {/* ── Messages ── */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto py-4">
        <AnimatePresence mode="wait">
          <motion.div
            key={goal?.id || "empty"}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="h-full"
          >
            {messagesLoading ? (
              <div className="space-y-2 py-2" style={{ maxWidth: "var(--chat-max-width)", margin: "0 auto" }}>
                <MessageSkeleton />
                <MessageSkeleton />
                <MessageSkeleton />
              </div>
            ) : messages.length === 0 ? (
              <EmptyState
                hasGoal={!!goal}
                goalStarted={goalStarted}
                isStarting={isStarting}
                onStartGoal={onStartGoal}
              />
            ) : (
              <div
                style={{ maxWidth: "var(--chat-max-width)", margin: "0 auto" }}
              >
                {messages.map((msg: any) => (
                  <ChatMessageV2 key={msg.id} message={msg} isAdmin={isAdmin} />
                ))}
              </div>
            )}
          </motion.div>
        </AnimatePresence>
      </div>

      {/* ── Input ── */}
      <div style={{ maxWidth: "var(--chat-max-width)", margin: "0 auto", width: "100%", padding: "0 var(--space-4)" }}>
        <ChatInputV2
          onSend={onSendMessage}
          disabled={!goal}
          placeholder={
            !goal
              ? "Опиши задачу для создания нового проекта..."
              : goalStarted
              ? "Сообщение для команды..."
              : "Опиши задачу..."
          }
        />
      </div>
    </div>
  );
}
