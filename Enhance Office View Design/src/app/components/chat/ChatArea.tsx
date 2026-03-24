import { useEffect, useRef, useState, useCallback } from "react";
import { motion, AnimatePresence } from "motion/react";
import { PanelRightOpen, PanelRightClose, Play, Users, Upload } from "lucide-react";
import { ChatMessage } from "./ChatMessage";
import { ChatInput } from "./ChatInput";
import { AgentStatusBar } from "./AgentStatusBar";
import { MessageSkeleton } from "../shared/LoadingSkeleton";
import type { Message, Agent, Goal } from "../../lib/api";

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
}: ChatAreaProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [droppedFiles, setDroppedFiles] = useState<File[]>([]);
  const dragCounter = useRef(0);

  // Auto-scroll on new messages
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages.length]);

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

      {/* Messages */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto py-4">
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
      </div>

      {/* Agent Status Bar */}
      <AgentStatusBar agents={agents} />

      {/* Input */}
      <ChatInput
        hasActiveGoal={!!activeGoal}
        goalStarted={goalStarted}
        onCreateGoal={onCreateGoal}
        onStartGoal={onStartGoal}
        onSendMessage={onUserInput}
        isStarting={isStarting}
        externalFiles={droppedFiles}
        onClearExternalFiles={handleClearDroppedFiles}
      />
    </div>
  );
}
