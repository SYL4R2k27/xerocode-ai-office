import { useEffect, useRef, useState, useCallback } from "react";
import { motion, AnimatePresence } from "motion/react";
import { PanelRightOpen, PanelRightClose, Play, Users, Upload, ChevronDown, Code, Palette, Search, FileText, MoreHorizontal } from "lucide-react";
import { ChatMessage } from "./ChatMessage";
import { ChatInput } from "./ChatInput";
import { AgentStatusBar } from "./AgentStatusBar";
import { ArenaView } from "../arena/ArenaView";
import { MessageSkeleton } from "../shared/LoadingSkeleton";
import { api } from "../../lib/api";
import type { Message, Agent, Goal } from "../../lib/api";

const categoryOptions = [
  { id: "code", label: "Код", icon: Code, color: "var(--accent-blue)" },
  { id: "design", label: "Дизайн", icon: Palette, color: "var(--accent-lavender)" },
  { id: "research", label: "Ресёрч", icon: Search, color: "var(--accent-teal)" },
  { id: "text", label: "Текст", icon: FileText, color: "var(--accent-amber)" },
  { id: "other", label: "Другое", icon: MoreHorizontal, color: "var(--text-tertiary)" },
];

interface ChatAreaProps {
  messages: Message[];
  agents: Agent[];
  activeGoal: Goal | null;
  goals: Goal[];
  contextPanelOpen: boolean;
  isStarting: boolean;
  onToggleContextPanel: () => void;
  onCreateGoal: (title: string, mode: "manager" | "discussion" | "auto") => void;
  onStartGoal: () => void;
  onUserInput: (content: string, type: "command" | "edit" | "idea") => void;
  onOpenInPreview?: (code: string, language: string) => void;
  messagesLoading?: boolean;
  arenaMode?: "battle" | "leaderboard" | null;
  onSetArenaMode?: (mode: "battle" | "leaderboard" | null) => void;
}

const modeLabels: Record<string, string> = {
  manager: "Менеджер",
  discussion: "Обсуждение",
  auto: "Авто",
};

export function ChatArea({
  messages,
  agents,
  activeGoal,
  contextPanelOpen,
  isStarting,
  onToggleContextPanel,
  onCreateGoal,
  onStartGoal,
  onUserInput,
  onOpenInPreview,
  messagesLoading,
  arenaMode,
  onSetArenaMode,
}: ChatAreaProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [droppedFiles, setDroppedFiles] = useState<File[]>([]);
  const [showCategoryDropdown, setShowCategoryDropdown] = useState(false);
  const [localCategory, setLocalCategory] = useState<string | null>(null);
  const dragCounter = useRef(0);

  // Sync local category when active goal changes
  useEffect(() => {
    setLocalCategory((activeGoal as any)?.category || null);
  }, [activeGoal?.id]);

  // Close category dropdown on outside click
  useEffect(() => {
    if (!showCategoryDropdown) return;
    const handleClick = () => setShowCategoryDropdown(false);
    const timer = setTimeout(() => document.addEventListener("click", handleClick), 0);
    return () => { clearTimeout(timer); document.removeEventListener("click", handleClick); };
  }, [showCategoryDropdown]);

  const handleCategoryChange = useCallback(async (category: string) => {
    if (!activeGoal) return;
    setLocalCategory(category);
    setShowCategoryDropdown(false);
    try {
      await api.goals.update(activeGoal.id, { category } as any);
    } catch (e) {
      console.error("Не удалось обновить категорию:", e);
    }
  }, [activeGoal]);

  // Auto-scroll on new messages
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages.length]);

  // Scroll to top and close dropdowns when switching goals
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = 0;
    }
    setShowCategoryDropdown(false);
  }, [activeGoal?.id]);

  const goalStarted = activeGoal?.status === "active";

  // Drag & Drop handlers
  const handleDragEnter = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    dragCounter.current++;
    if (e.dataTransfer.types.includes("Files")) {
      setIsDragging(true);
    }
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    dragCounter.current--;
    if (dragCounter.current === 0) {
      setIsDragging(false);
    }
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
    const files = Array.from(e.dataTransfer.files);
    if (files.length > 0) {
      setDroppedFiles((prev) => [...prev, ...files]);
    }
  }, []);

  const handleClearDroppedFiles = useCallback(() => {
    setDroppedFiles([]);
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
      {/* Drag overlay */}
      <AnimatePresence>
        {isDragging && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            className="absolute inset-0 z-50 flex flex-col items-center justify-center gap-3 pointer-events-none"
            style={{
              backgroundColor: "rgba(0, 0, 0, 0.6)",
              backdropFilter: "blur(4px)",
            }}
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
            <p className="text-[12px]" style={{ color: "rgba(255,255,255,0.6)" }}>
              Поддерживаются любые типы файлов
            </p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Header */}
      <div
        className="flex items-center justify-between px-4 h-12 flex-shrink-0"
        style={{ borderBottom: "1px solid var(--border-default)", backgroundColor: "var(--bg-surface)" }}
      >
        <div className="flex items-center gap-3 min-w-0 overflow-hidden flex-1">
          {activeGoal ? (
            <>
              <h3 className="text-[14px] font-semibold truncate max-w-[50vw]" style={{ color: "var(--text-primary)" }}>
                {activeGoal.title}
              </h3>
              <span
                className="text-[10px] font-medium px-2 py-0.5 rounded-full flex-shrink-0"
                style={{
                  backgroundColor: "var(--bg-elevated)",
                  color: "var(--text-secondary)",
                  border: "1px solid var(--border-subtle)",
                }}
              >
                {modeLabels[activeGoal.distribution_mode] || activeGoal.distribution_mode}
              </span>
              {/* Category badge with dropdown */}
              <div className="relative flex-shrink-0">
                {(() => {
                  const cat = categoryOptions.find(c => c.id === localCategory) || null;
                  const CatIcon = cat?.icon || MoreHorizontal;
                  return (
                    <>
                      <button
                        onClick={() => setShowCategoryDropdown(!showCategoryDropdown)}
                        className="flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium transition-all hover:brightness-110"
                        style={{
                          backgroundColor: cat ? cat.color : "var(--bg-elevated)",
                          color: cat ? "#fff" : "var(--text-secondary)",
                          border: `1px solid ${cat ? cat.color : "var(--border-subtle)"}`,
                        }}
                      >
                        <CatIcon size={10} />
                        {cat?.label || "Категория"}
                        <ChevronDown size={8} />
                      </button>
                      {showCategoryDropdown && (
                        <div
                          className="absolute top-full left-0 mt-1 rounded-lg py-1 z-50 min-w-[130px]"
                          style={{ backgroundColor: "var(--bg-elevated)", border: "1px solid var(--border-default)" }}
                        >
                          {categoryOptions.map((opt) => {
                            const OptIcon = opt.icon;
                            const isActive = localCategory === opt.id;
                            return (
                              <button
                                key={opt.id}
                                onClick={() => handleCategoryChange(opt.id)}
                                className="flex items-center gap-2 w-full px-3 py-1.5 text-[11px] hover:bg-white/5 transition-colors"
                                style={{ color: isActive ? opt.color : "var(--text-secondary)" }}
                              >
                                <OptIcon size={12} />
                                {opt.label}
                              </button>
                            );
                          })}
                        </div>
                      )}
                    </>
                  );
                })()}
              </div>
              {/* Agent avatars */}
              <div className="flex -space-x-1.5 ml-2">
                {agents.slice(0, 4).map((agent) => (
                  <div
                    key={agent.id}
                    className="w-6 h-6 rounded-full flex items-center justify-center text-[10px] border-2"
                    style={{
                      backgroundColor: "var(--bg-elevated)",
                      borderColor: "var(--bg-surface)",
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
            <h3 className="text-[14px] font-semibold" style={{ color: "var(--text-secondary)" }}>
              Новый проект
            </h3>
          )}
        </div>

        <button
          onClick={onToggleContextPanel}
          className="p-1.5 rounded-md hover:bg-white/5 transition-colors"
          style={{ color: "var(--text-tertiary)" }}
          title={contextPanelOpen ? "Скрыть панель" : "Показать панель"}
        >
          {contextPanelOpen ? <PanelRightClose size={16} /> : <PanelRightOpen size={16} />}
        </button>
      </div>

      {arenaMode ? (
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Arena header with tabs */}
          <div className="flex items-center gap-2 px-4 py-2" style={{ borderBottom: "1px solid var(--border-default)" }}>
            <button
              onClick={() => onSetArenaMode?.("battle")}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[12px] font-medium transition-all"
              style={{
                background: arenaMode === "battle" ? "color-mix(in srgb, var(--accent-arena) 15%, transparent)" : "transparent",
                color: arenaMode === "battle" ? "var(--accent-arena)" : "var(--text-tertiary)",
              }}
            >
              ⚔️ Битва
            </button>
            <button
              onClick={() => onSetArenaMode?.("leaderboard")}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[12px] font-medium transition-all"
              style={{
                background: arenaMode === "leaderboard" ? "color-mix(in srgb, var(--accent-amber) 15%, transparent)" : "transparent",
                color: arenaMode === "leaderboard" ? "var(--accent-amber)" : "var(--text-tertiary)",
              }}
            >
              🏆 Рейтинг
            </button>
            <div style={{ flex: 1 }} />
            <button
              onClick={() => onSetArenaMode?.(null)}
              className="px-2 py-1 rounded-lg text-[11px] transition-all"
              style={{ color: "var(--text-tertiary)" }}
              onMouseEnter={e => (e.currentTarget.style.color = "var(--text-primary)")}
              onMouseLeave={e => (e.currentTarget.style.color = "var(--text-tertiary)")}
            >
              ← Чат
            </button>
          </div>
          <div className="flex-1 overflow-hidden">
            {arenaMode === "battle" && <ArenaView />}
            {arenaMode === "leaderboard" && (
              <div className="h-full flex items-center justify-center" style={{ color: "var(--text-secondary)" }}>
                <p className="text-sm">Рейтинг отображается в правой панели →</p>
              </div>
            )}
          </div>
        </div>
      ) : (
        <>
          {/* Messages */}
          <div ref={scrollRef} className="flex-1 overflow-y-auto py-4">
            <AnimatePresence mode="wait">
            <motion.div
              key={activeGoal?.id || "empty"}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="h-full"
            >
            {messagesLoading ? (
              <div className="space-y-2 py-2">
                <MessageSkeleton />
                <MessageSkeleton />
                <MessageSkeleton />
              </div>
            ) : messages.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full gap-4">
                <div
                  className="w-16 h-16 rounded-2xl flex items-center justify-center"
                  style={{ backgroundColor: "var(--bg-surface)" }}
                >
                  <Users size={24} style={{ color: "var(--text-tertiary)" }} />
                </div>
                <div className="text-center">
                  <p className="text-[14px] font-medium" style={{ color: "var(--text-secondary)" }}>
                    {!activeGoal ? "Опиши задачу для ИИ-команды" : "Готово к запуску"}
                  </p>
                  <p className="text-[12px] mt-1" style={{ color: "var(--text-tertiary)" }}>
                    {!activeGoal
                      ? "Напиши цель и модели начнут работу"
                      : "Сообщения от моделей появятся здесь"}
                  </p>
                </div>
                {activeGoal && !goalStarted && (
                  <motion.button
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    onClick={onStartGoal}
                    disabled={isStarting}
                    className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all hover:brightness-110 disabled:opacity-50"
                    style={{ backgroundColor: "var(--accent-blue)", color: "#fff" }}
                  >
                    <Play size={14} />
                    {isStarting ? "Запуск..." : "Запустить команду"}
                  </motion.button>
                )}
              </div>
            ) : (
              <div className="space-y-1">
                {messages.map((msg, i) => {
                  const prev = i > 0 ? messages[i - 1] : null;
                  const isGrouped = prev?.sender_name === msg.sender_name && prev?.sender_type === msg.sender_type;
                  return (
                    <ChatMessage
                      key={msg.id}
                      message={msg}
                      agents={agents}
                      isGrouped={isGrouped}
                      onOpenInPreview={onOpenInPreview}
                    />
                  );
                })}
              </div>
            )}
            </motion.div>
            </AnimatePresence>
          </div>

          {/* Agent Status Bar */}
          <AgentStatusBar agents={agents} />

          {/* Input */}
          <ChatInput
            hasActiveGoal={!!activeGoal}
            activeGoal={activeGoal?.id}
            goalStarted={goalStarted}
            onCreateGoal={onCreateGoal}
            onStartGoal={onStartGoal}
            onSendMessage={onUserInput}
            isStarting={isStarting}
            externalFiles={droppedFiles}
            onClearExternalFiles={handleClearDroppedFiles}
          />
        </>
      )}
    </div>
  );
}
