/**
 * MobileChatView — полноэкранный чат, оптимизированный для мобильных устройств.
 * Пользовательские сообщения справа (фиолетовый), агентские слева (тёмный фон с аватаром).
 */
import { useState, useRef, useCallback, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  Send,
  Paperclip,
  Copy,
  Quote,
  X,
  Loader2,
  Play,
  Users,
} from "lucide-react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { oneDark } from "react-syntax-highlighter/dist/esm/styles/prism";
import { ImageViewer } from "../shared/ImageViewer";
import { useSwipe } from "../../hooks/useSwipe";
import type { Message, Agent, Goal } from "../../lib/api";

interface MobileChatViewProps {
  messages: Message[];
  agents: Agent[];
  activeGoal: Goal | null;
  isStarting: boolean;
  onCreateGoal: (title: string, mode: "manager" | "discussion" | "auto") => void;
  onStartGoal: () => void;
  onUserInput: (content: string, type: "command" | "edit" | "idea") => void;
}

function formatTime(dateStr: string): string {
  const d = new Date(dateStr);
  return d.toLocaleTimeString("ru-RU", { hour: "2-digit", minute: "2-digit" });
}

function sanitizeContent(text: string): string {
  return text
    .replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, "")
    .replace(/on\w+\s*=\s*["'][^"']*["']/gi, "")
    .replace(/javascript:/gi, "");
}

/** Мобильный блок кода — горизонтальная прокрутка, уменьшенный шрифт */
function MobileCodeBlock({ code, language }: { code: string; language: string }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div
      className="relative rounded-xl overflow-hidden my-2"
      style={{ backgroundColor: "var(--bg-input)" }}
    >
      <div
        className="flex items-center justify-between px-3 py-1.5 text-[10px]"
        style={{
          color: "var(--text-tertiary)",
          borderBottom: "1px solid var(--border-subtle)",
        }}
      >
        <span className="font-medium uppercase">{language}</span>
        <button
          onClick={handleCopy}
          className="p-1 rounded hover:bg-white/5 transition-colors"
        >
          {copied ? (
            <span style={{ color: "var(--accent-teal)" }}>Скопировано</span>
          ) : (
            <Copy size={11} />
          )}
        </button>
      </div>
      <div className="overflow-x-auto" style={{ touchAction: "pan-x pan-y" }}>
        <SyntaxHighlighter
          language={language === "text" ? undefined : language}
          style={oneDark}
          customStyle={{
            margin: 0,
            padding: "10px 12px",
            fontSize: "12px",
            lineHeight: "1.5",
            background: "transparent",
            minWidth: "max-content",
          }}
          codeTagProps={{
            style: { fontFamily: "'JetBrains Mono', 'Fira Code', monospace" },
          }}
        >
          {code}
        </SyntaxHighlighter>
      </div>
    </div>
  );
}

/** Мобильный маркдаун-рендерер */
function MobileMarkdown({
  content,
  onImageClick,
}: {
  content: string;
  onImageClick?: (src: string) => void;
}) {
  return (
    <ReactMarkdown
      remarkPlugins={[remarkGfm]}
      components={{
        code({ className, children }) {
          const match = /language-(\w+)/.exec(className || "");
          const codeString = String(children).replace(/\n$/, "");
          if (!match) {
            return (
              <code
                className="px-1 py-0.5 rounded text-[11px]"
                style={{
                  backgroundColor: "var(--bg-input)",
                  color: "var(--accent-teal)",
                  fontFamily: "'JetBrains Mono', monospace",
                }}
              >
                {children}
              </code>
            );
          }
          return <MobileCodeBlock code={codeString} language={match[1]} />;
        },
        pre({ children }) {
          return <>{children}</>;
        },
        a({ href, children, ...props }) {
          return (
            <a
              href={href}
              target="_blank"
              rel="noopener noreferrer"
              className="underline underline-offset-2"
              style={{ color: "var(--accent-blue)" }}
              {...props}
            >
              {children}
            </a>
          );
        },
        p({ children, ...props }) {
          return (
            <p className="text-[15px] leading-relaxed mb-1.5 last:mb-0" style={{ color: "inherit" }} {...props}>
              {children}
            </p>
          );
        },
        ul({ children, ...props }) {
          return <ul className="list-disc list-inside space-y-1 my-1.5 text-[14px]" {...props}>{children}</ul>;
        },
        ol({ children, ...props }) {
          return <ol className="list-decimal list-inside space-y-1 my-1.5 text-[14px]" {...props}>{children}</ol>;
        },
        img({ src, alt }) {
          if (!src) return null;
          return (
            <img
              src={src}
              alt={alt || "Изображение"}
              className="max-w-full rounded-xl mt-2 mb-2 max-h-[300px] object-contain cursor-pointer active:opacity-80"
              onClick={() => onImageClick?.(src)}
            />
          );
        },
        h1({ children, ...props }) {
          return <h1 className="text-[17px] font-bold mb-1.5 mt-2" style={{ color: "inherit" }} {...props}>{children}</h1>;
        },
        h2({ children, ...props }) {
          return <h2 className="text-[16px] font-bold mb-1.5 mt-2" style={{ color: "inherit" }} {...props}>{children}</h2>;
        },
        h3({ children, ...props }) {
          return <h3 className="text-[15px] font-bold mb-1 mt-1.5" style={{ color: "inherit" }} {...props}>{children}</h3>;
        },
        blockquote({ children, ...props }) {
          return (
            <blockquote
              className="border-l-2 pl-3 my-2 italic text-[14px]"
              style={{ borderColor: "var(--text-tertiary)", color: "var(--text-secondary)" }}
              {...props}
            >
              {children}
            </blockquote>
          );
        },
      }}
    >
      {content}
    </ReactMarkdown>
  );
}

/** Контекстное меню сообщения (long press) */
function MessageContextMenu({
  x,
  y,
  onCopy,
  onQuote,
  onClose,
}: {
  x: number;
  y: number;
  onCopy: () => void;
  onQuote: () => void;
  onClose: () => void;
}) {
  return (
    <>
      {/* Оверлей для закрытия */}
      <div className="fixed inset-0 z-[100]" onClick={onClose} />
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.9 }}
        transition={{ duration: 0.12 }}
        className="fixed z-[101] rounded-2xl py-1 min-w-[160px]"
        style={{
          left: Math.min(x, window.innerWidth - 180),
          top: Math.min(y, window.innerHeight - 120),
          backgroundColor: "rgba(30, 30, 35, 0.95)",
          backdropFilter: "blur(20px)",
          border: "1px solid rgba(255, 255, 255, 0.08)",
          boxShadow: "0 8px 32px rgba(0,0,0,0.4)",
        }}
      >
        <button
          onClick={() => { onCopy(); onClose(); }}
          className="flex items-center gap-3 w-full px-4 py-2.5 text-[14px] active:bg-white/5"
          style={{ color: "var(--text-primary)" }}
        >
          <Copy size={16} style={{ color: "var(--text-tertiary)" }} />
          Копировать
        </button>
        <button
          onClick={() => { onQuote(); onClose(); }}
          className="flex items-center gap-3 w-full px-4 py-2.5 text-[14px] active:bg-white/5"
          style={{ color: "var(--text-primary)" }}
        >
          <Quote size={16} style={{ color: "var(--text-tertiary)" }} />
          Цитировать
        </button>
      </motion.div>
    </>
  );
}

const providerColors: Record<string, string> = {
  openai: "var(--provider-openai)",
  anthropic: "var(--provider-anthropic)",
  ollama: "var(--provider-ollama)",
  custom: "var(--provider-custom)",
  google: "var(--provider-google)",
};

export function MobileChatView({
  messages,
  agents,
  activeGoal,
  isStarting,
  onCreateGoal,
  onStartGoal,
  onUserInput,
}: MobileChatViewProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [text, setText] = useState("");
  const [viewerSrc, setViewerSrc] = useState<string | null>(null);
  const [contextMenu, setContextMenu] = useState<{
    x: number;
    y: number;
    content: string;
  } | null>(null);
  const [replyTo, setReplyTo] = useState<string | null>(null);

  // Для создания новой цели (если нет активной)
  const [goalTitle, setGoalTitle] = useState("");

  // Автоскролл на новые сообщения
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages.length]);

  // Long press для контекстного меню
  const longPressTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const handleTouchStart = useCallback((e: React.TouchEvent, content: string) => {
    longPressTimer.current = setTimeout(() => {
      const touch = e.touches[0];
      setContextMenu({ x: touch.clientX, y: touch.clientY, content });
    }, 500);
  }, []);

  const handleTouchEnd = useCallback(() => {
    if (longPressTimer.current) {
      clearTimeout(longPressTimer.current);
      longPressTimer.current = null;
    }
  }, []);

  const handleCopy = useCallback(() => {
    if (contextMenu) {
      navigator.clipboard.writeText(contextMenu.content);
    }
  }, [contextMenu]);

  const handleQuote = useCallback(() => {
    if (contextMenu) {
      const quote = contextMenu.content.split("\n").slice(0, 2).join("\n");
      setReplyTo(quote.length > 80 ? quote.slice(0, 80) + "..." : quote);
    }
  }, [contextMenu]);

  const handleSend = useCallback(() => {
    const trimmed = text.trim();
    if (!trimmed) return;

    if (!activeGoal) {
      // Создаём новую цель
      const title = goalTitle.trim() || trimmed.slice(0, 60);
      onCreateGoal(title, "manager");
      setGoalTitle("");
    } else if (activeGoal.status !== "active") {
      onUserInput(trimmed, "command");
      onStartGoal();
    } else {
      const content = replyTo ? `> ${replyTo}\n\n${trimmed}` : trimmed;
      onUserInput(content, "command");
    }

    setText("");
    setReplyTo(null);
    if (textareaRef.current) {
      textareaRef.current.style.height = "44px";
    }
  }, [text, replyTo, activeGoal, goalTitle, onCreateGoal, onStartGoal, onUserInput]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleTextareaInput = () => {
    const ta = textareaRef.current;
    if (ta) {
      ta.style.height = "44px";
      ta.style.height = Math.min(ta.scrollHeight, 120) + "px";
    }
  };

  const getAgentColor = (senderName: string) => {
    const agent = agents.find((a) => a.name === senderName);
    return agent ? providerColors[agent.provider] || "var(--text-secondary)" : "var(--text-secondary)";
  };

  const goalStarted = activeGoal?.status === "active";

  // Свайп на сообщении (reply) — используем на контейнере сообщений
  const messageContainerRef = useRef<HTMLDivElement>(null);

  return (
    <div
      className="flex flex-col h-full"
      style={{
        backgroundColor: "var(--bg-base)",
        paddingBottom: "calc(60px + env(safe-area-inset-bottom, 0px))",
      }}
    >
      {/* Сообщения */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto px-3 py-3">
        {messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full gap-3">
            <div
              className="w-14 h-14 rounded-2xl flex items-center justify-center"
              style={{ backgroundColor: "var(--bg-surface)" }}
            >
              <Users size={22} style={{ color: "var(--text-tertiary)" }} />
            </div>
            <p
              className="text-[15px] font-medium text-center"
              style={{ color: "var(--text-secondary)" }}
            >
              {!activeGoal ? "Опиши задачу для ИИ-команды" : "Готово к запуску"}
            </p>
            <p
              className="text-[13px] text-center"
              style={{ color: "var(--text-tertiary)" }}
            >
              {!activeGoal
                ? "Напиши цель и модели начнут работу"
                : "Сообщения от моделей появятся здесь"}
            </p>
            {activeGoal && !goalStarted && (
              <motion.button
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                onClick={onStartGoal}
                disabled={isStarting}
                className="flex items-center gap-2 px-5 py-2.5 rounded-2xl text-[14px] font-medium transition-all disabled:opacity-50"
                style={{ backgroundColor: "var(--accent-blue)", color: "#fff" }}
              >
                <Play size={16} />
                {isStarting ? "Запуск..." : "Запустить команду"}
              </motion.button>
            )}
          </div>
        ) : (
          <div className="space-y-1" ref={messageContainerRef}>
            {messages.map((msg, i) => {
              const prev = i > 0 ? messages[i - 1] : null;
              const isGrouped = prev?.sender_name === msg.sender_name && prev?.sender_type === msg.sender_type;

              // Системные сообщения
              if (msg.sender_type === "system") {
                return (
                  <div key={msg.id} className="flex items-center gap-2 py-2">
                    <div className="flex-1 h-px" style={{ backgroundColor: "var(--border-subtle)" }} />
                    <span className="text-[11px]" style={{ color: "var(--text-tertiary)" }}>
                      {msg.content}
                    </span>
                    <div className="flex-1 h-px" style={{ backgroundColor: "var(--border-subtle)" }} />
                  </div>
                );
              }

              // Пользовательские сообщения — справа
              if (msg.sender_type === "user") {
                return (
                  <motion.div
                    key={msg.id}
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="flex justify-end py-0.5"
                    onTouchStart={(e) => handleTouchStart(e, msg.content)}
                    onTouchEnd={handleTouchEnd}
                    onTouchMove={handleTouchEnd}
                    style={{ touchAction: "pan-y" }}
                  >
                    <div className="max-w-[85%]">
                      <div
                        className="px-4 py-2.5"
                        style={{
                          backgroundColor: "var(--user-bubble)",
                          borderRadius: "18px 4px 18px 18px",
                        }}
                      >
                        <div style={{ color: "var(--text-primary)" }}>
                          <MobileMarkdown
                            content={sanitizeContent(msg.content)}
                            onImageClick={setViewerSrc}
                          />
                        </div>
                      </div>
                      <div className="flex justify-end mt-0.5 px-1">
                        <span className="text-[10px]" style={{ color: "var(--text-tertiary)" }}>
                          {formatTime(msg.created_at)}
                        </span>
                      </div>
                    </div>
                  </motion.div>
                );
              }

              // Агентские сообщения — слева
              const agentColor = getAgentColor(msg.sender_name);
              return (
                <motion.div
                  key={msg.id}
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="flex gap-2 py-0.5"
                  onTouchStart={(e) => handleTouchStart(e, msg.content)}
                  onTouchEnd={handleTouchEnd}
                  onTouchMove={handleTouchEnd}
                  style={{ touchAction: "pan-y" }}
                >
                  {/* Аватар 28px */}
                  {!isGrouped ? (
                    <div
                      className="w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 text-[11px] font-medium mt-0.5"
                      style={{
                        backgroundColor: `color-mix(in srgb, ${agentColor} 15%, var(--bg-elevated))`,
                        color: agentColor,
                      }}
                    >
                      {msg.sender_name.charAt(0).toUpperCase()}
                    </div>
                  ) : (
                    <div className="w-7 flex-shrink-0" />
                  )}

                  <div className="flex-1 min-w-0 max-w-[85%]">
                    {!isGrouped && (
                      <span
                        className="text-[12px] font-semibold mb-0.5 block"
                        style={{ color: agentColor }}
                      >
                        {msg.sender_name}
                      </span>
                    )}
                    <div
                      className="px-3.5 py-2.5"
                      style={{
                        backgroundColor: "var(--bg-surface)",
                        borderRadius: "4px 18px 18px 18px",
                        borderLeft: `2px solid ${agentColor}`,
                      }}
                    >
                      <div style={{ color: "#E5E5E7" }}>
                        <MobileMarkdown
                          content={sanitizeContent(msg.content)}
                          onImageClick={setViewerSrc}
                        />
                      </div>
                    </div>
                    <div className="flex items-center gap-2 mt-0.5 px-1">
                      <span className="text-[10px]" style={{ color: "var(--text-tertiary)" }}>
                        {formatTime(msg.created_at)}
                      </span>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}
      </div>

      {/* Статус-бар агентов (компактный) */}
      <AgentStatusCompact agents={agents} />

      {/* Reply preview */}
      <AnimatePresence>
        {replyTo && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="px-3 pt-2"
          >
            <div
              className="flex items-center gap-2 px-3 py-2 rounded-xl"
              style={{
                backgroundColor: "var(--bg-surface)",
                borderLeft: "2px solid var(--accent-lavender)",
              }}
            >
              <Quote size={12} style={{ color: "var(--accent-lavender)" }} />
              <span
                className="text-[12px] flex-1 truncate"
                style={{ color: "var(--text-secondary)" }}
              >
                {replyTo}
              </span>
              <button onClick={() => setReplyTo(null)}>
                <X size={14} style={{ color: "var(--text-tertiary)" }} />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Ввод */}
      <div className="px-3 py-2" style={{ borderTop: "1px solid var(--border-subtle)" }}>
        {!activeGoal && (
          <input
            type="text"
            value={goalTitle}
            onChange={(e) => setGoalTitle(e.target.value)}
            placeholder="Название цели..."
            className="w-full bg-transparent outline-none mb-2 text-[16px] font-semibold"
            style={{
              color: "var(--text-primary)",
              borderBottom: "1px solid var(--border-default)",
              paddingBottom: "6px",
              height: "var(--mobile-input-height, 44px)",
            }}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                handleSend();
              }
            }}
          />
        )}
        <div
          className="flex items-end gap-2 rounded-2xl px-3 py-2"
          style={{
            backgroundColor: "var(--bg-surface)",
            border: "1px solid var(--border-default)",
          }}
        >
          <button
            onClick={() => fileInputRef.current?.click()}
            className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 active:bg-white/5"
          >
            <Paperclip size={18} style={{ color: "var(--text-tertiary)" }} />
          </button>
          <input ref={fileInputRef} type="file" multiple hidden />

          <textarea
            ref={textareaRef}
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={handleKeyDown}
            onInput={handleTextareaInput}
            placeholder={
              !activeGoal
                ? "Опишите задачу..."
                : !goalStarted
                ? "Уточните задачу..."
                : "Сообщение..."
            }
            rows={1}
            className="flex-1 min-w-0 bg-transparent resize-none outline-none text-[15px]"
            style={{
              color: "var(--text-primary)",
              height: "44px",
              maxHeight: "120px",
              lineHeight: "1.5",
              wordBreak: "break-word",
            }}
          />

          <button
            onClick={handleSend}
            disabled={!text.trim() && !goalTitle.trim()}
            className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 transition-all disabled:opacity-30"
            style={{
              backgroundColor: text.trim() ? "var(--accent-blue)" : "transparent",
            }}
          >
            {isStarting ? (
              <Loader2 size={18} className="animate-spin" style={{ color: "#fff" }} />
            ) : (
              <Send
                size={18}
                style={{
                  color: text.trim() ? "#fff" : "var(--text-tertiary)",
                }}
              />
            )}
          </button>
        </div>
      </div>

      {/* Контекстное меню */}
      <AnimatePresence>
        {contextMenu && (
          <MessageContextMenu
            x={contextMenu.x}
            y={contextMenu.y}
            onCopy={handleCopy}
            onQuote={handleQuote}
            onClose={() => setContextMenu(null)}
          />
        )}
      </AnimatePresence>

      {/* Image Viewer */}
      <ImageViewer src={viewerSrc} onClose={() => setViewerSrc(null)} />
    </div>
  );
}

/** Компактный статус-бар агентов — одна строка */
function AgentStatusCompact({ agents }: { agents: Agent[] }) {
  const active = agents.filter(
    (a) => a.status === "thinking" || a.status === "working"
  );
  if (active.length === 0) return null;

  return (
    <motion.div
      initial={{ opacity: 0, height: 0 }}
      animate={{ opacity: 1, height: "auto" }}
      exit={{ opacity: 0, height: 0 }}
      className="px-3 py-1.5"
      style={{ borderTop: "1px solid var(--border-subtle)" }}
    >
      <div className="flex items-center gap-2 overflow-x-auto">
        {active.map((agent) => (
          <div
            key={agent.id}
            className="flex items-center gap-1.5 flex-shrink-0 text-[11px]"
          >
            {agent.status === "thinking" ? (
              <motion.span
                animate={{ opacity: [1, 0.4, 1] }}
                transition={{ duration: 1.5, repeat: Infinity }}
                className="text-[12px]"
              >
                💭
              </motion.span>
            ) : (
              <Loader2
                size={11}
                className="animate-spin"
                style={{ color: "var(--accent-amber)" }}
              />
            )}
            <span className="font-medium" style={{ color: "var(--text-primary)" }}>
              {agent.name}
            </span>
            <span style={{ color: "var(--text-tertiary)" }}>
              {agent.status === "thinking" ? "думает" : "работает"}
            </span>
          </div>
        ))}
      </div>
    </motion.div>
  );
}
