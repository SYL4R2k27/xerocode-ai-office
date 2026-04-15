import { useState, useCallback } from "react";
import { motion } from "motion/react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import rehypeSanitize from "rehype-sanitize";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { oneDark } from "react-syntax-highlighter/dist/esm/styles/prism";
import { Check, Copy, ExternalLink, ThumbsUp, ThumbsDown } from "lucide-react";
import { api } from "../../lib/api";
import { ImageViewer } from "../shared/ImageViewer";

/* ── Types ── */
interface MessageData {
  id: string;
  sender_type: "user" | "agent" | "system";
  sender_name: string;
  content: string;
  created_at?: string;
  cost_usd?: number;
  tokens_used?: number;
  streaming?: boolean;
  activity?: string;
  model?: string;
  log_id?: string;
  rated?: 1 | -1;
}

interface ChatMessageV2Props {
  message: MessageData;
  isAdmin?: boolean;
  onOpenInPreview?: (code: string, language: string) => void;
}

/* ── Provider colors ── */
const providerColorMap: Record<string, string> = {
  openai: "var(--provider-openai)",
  anthropic: "var(--provider-anthropic)",
  ollama: "var(--provider-ollama)",
  custom: "var(--provider-custom)",
  google: "var(--provider-google)",
  groq: "var(--provider-groq)",
  xai: "var(--provider-xai)",
  deepseek: "var(--provider-deepseek)",
  meta: "var(--provider-meta)",
  mistral: "var(--provider-mistral)",
};

function guessProvider(name: string): string {
  const lower = name.toLowerCase();
  if (lower.includes("gpt") || lower.includes("openai") || lower.includes("o1") || lower.includes("o3") || lower.includes("o4")) return "openai";
  if (lower.includes("claude") || lower.includes("anthropic") || lower.includes("sonnet") || lower.includes("opus") || lower.includes("haiku")) return "anthropic";
  if (lower.includes("gemini") || lower.includes("google")) return "google";
  if (lower.includes("groq") || lower.includes("llama") || lower.includes("mixtral")) return "groq";
  if (lower.includes("grok") || lower.includes("xai")) return "xai";
  if (lower.includes("deepseek")) return "deepseek";
  if (lower.includes("mistral")) return "mistral";
  if (lower.includes("ollama")) return "ollama";
  return "custom";
}

function getProviderColor(senderName: string): string {
  const provider = guessProvider(senderName);
  return providerColorMap[provider] || "var(--text-secondary)";
}

/* ── Helpers ── */
function formatTime(dateStr?: string): string {
  if (!dateStr) return "";
  const d = new Date(dateStr);
  return d.toLocaleTimeString("ru-RU", { hour: "2-digit", minute: "2-digit" });
}

function sanitizeContent(text: string): string {
  return text
    .replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, "")
    .replace(/on\w+\s*=\s*["'][^"']*["']/gi, "")
    .replace(/javascript:/gi, "")
    .replace(/<iframe\b[^>]*>[\s\S]*?<\/iframe>/gi, "")
    .replace(/<object\b[^>]*>[\s\S]*?<\/object>/gi, "")
    .replace(/<embed\b[^>]*>/gi, "");
}

/* ── Code block with copy ── */
function CodeBlock({ code, language, onOpenInPreview }: { code: string; language: string; onOpenInPreview?: (code: string, language: string) => void }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div
      className="relative group rounded-lg overflow-hidden my-2"
      style={{ backgroundColor: "var(--bg-input)" }}
    >
      <div
        className="flex items-center justify-between px-3 py-1.5"
        style={{
          fontSize: "var(--font-size-xs)",
          color: "var(--text-tertiary)",
          borderBottom: "1px solid var(--border-subtle)",
        }}
      >
        <span className="font-medium uppercase">{language}</span>
        <div className="flex items-center gap-1">
          {onOpenInPreview && (
            <button
              onClick={() => onOpenInPreview(code, language)}
              className="flex items-center gap-1 p-1 rounded opacity-0 group-hover:opacity-100 transition-opacity"
              style={{ color: "var(--text-tertiary)" }}
              onMouseEnter={(e) => (e.currentTarget.style.color = "var(--accent-blue)")}
              onMouseLeave={(e) => (e.currentTarget.style.color = "var(--text-tertiary)")}
              title="Превью"
            >
              <ExternalLink size={12} />
            </button>
          )}
          <button
            onClick={handleCopy}
            className="flex items-center gap-1 p-1 rounded opacity-0 group-hover:opacity-100 transition-opacity"
            style={{ color: "var(--text-tertiary)" }}
            onMouseEnter={(e) => (e.currentTarget.style.color = "var(--text-secondary)")}
            onMouseLeave={(e) => (e.currentTarget.style.color = "var(--text-tertiary)")}
            title="Копировать"
          >
            {copied ? <Check size={12} style={{ color: "var(--accent-teal)" }} /> : <Copy size={12} />}
            <span style={{ fontSize: "var(--font-size-xs)" }}>{copied ? "Скопировано" : "Копировать"}</span>
          </button>
        </div>
      </div>
      <SyntaxHighlighter
        language={language === "text" ? undefined : language}
        style={oneDark}
        customStyle={{
          margin: 0,
          padding: "12px",
          fontSize: "13px",
          lineHeight: "1.6",
          background: "transparent",
        }}
        codeTagProps={{
          style: { fontFamily: "var(--font-mono)" },
        }}
      >
        {code}
      </SyntaxHighlighter>
    </div>
  );
}

/* ── Markdown renderer ── */
function MarkdownContent({
  content,
  onImageClick,
  onOpenInPreview,
}: {
  content: string;
  onImageClick?: (src: string) => void;
  onOpenInPreview?: (code: string, language: string) => void;
}) {
  return (
    <ReactMarkdown
      remarkPlugins={[remarkGfm]}
      rehypePlugins={[rehypeSanitize]}
      components={{
        code({ className, children, ...props }) {
          const match = /language-(\w+)/.exec(className || "");
          const codeString = String(children).replace(/\n$/, "");

          if (!match) {
            return (
              <code
                className="px-1.5 py-0.5 rounded"
                style={{
                  fontSize: "var(--font-size-sm)",
                  backgroundColor: "var(--bg-input)",
                  color: "var(--accent-teal)",
                  fontFamily: "var(--font-mono)",
                }}
                {...props}
              >
                {children}
              </code>
            );
          }

          return <CodeBlock code={codeString} language={match[1]} onOpenInPreview={onOpenInPreview} />;
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
              className="underline underline-offset-2 transition-colors"
              style={{ color: "var(--accent-blue)" }}
              {...props}
            >
              {children}
            </a>
          );
        },
        ul({ children, ...props }) {
          return (
            <ul className="list-disc list-inside space-y-1 my-2" style={{ color: "inherit", fontSize: "var(--font-size-base)" }} {...props}>
              {children}
            </ul>
          );
        },
        ol({ children, ...props }) {
          return (
            <ol className="list-decimal list-inside space-y-1 my-2" style={{ color: "inherit", fontSize: "var(--font-size-base)" }} {...props}>
              {children}
            </ol>
          );
        },
        li({ children, ...props }) {
          return (
            <li className="leading-relaxed" style={{ lineHeight: "1.7" }} {...props}>
              {children}
            </li>
          );
        },
        p({ children, ...props }) {
          return (
            <p className="mb-2 last:mb-0" style={{ color: "inherit", fontSize: "var(--font-size-base)", lineHeight: "1.7" }} {...props}>
              {children}
            </p>
          );
        },
        blockquote({ children, ...props }) {
          return (
            <blockquote
              className="border-l-2 pl-3 my-2 italic"
              style={{ borderColor: "var(--text-tertiary)", color: "var(--text-secondary)" }}
              {...props}
            >
              {children}
            </blockquote>
          );
        },
        table({ children, ...props }) {
          return (
            <div className="overflow-x-auto my-2">
              <table className="w-full border-collapse" style={{ fontSize: "var(--font-size-sm)" }} {...props}>
                {children}
              </table>
            </div>
          );
        },
        th({ children, ...props }) {
          return (
            <th
              className="text-left px-3 py-1.5 font-semibold"
              style={{
                fontSize: "var(--font-size-xs)",
                borderBottom: "1px solid var(--border-default)",
                color: "var(--text-secondary)",
              }}
              {...props}
            >
              {children}
            </th>
          );
        },
        td({ children, ...props }) {
          return (
            <td
              className="px-3 py-1.5"
              style={{ fontSize: "var(--font-size-sm)", borderBottom: "1px solid var(--border-subtle)" }}
              {...props}
            >
              {children}
            </td>
          );
        },
        hr() {
          return <hr className="my-3" style={{ borderColor: "var(--border-subtle)" }} />;
        },
        img({ src, alt }) {
          if (!src) return null;
          return (
            <img
              src={src}
              alt={alt || "Image"}
              className="max-w-full rounded-lg mt-2 mb-2 max-h-[400px] object-contain cursor-pointer hover:opacity-90 transition-opacity"
              onClick={() => onImageClick?.(src)}
            />
          );
        },
        h1({ children, ...props }) {
          return (
            <h1 className="font-bold mb-2 mt-3" style={{ fontSize: "var(--font-size-lg)", color: "inherit" }} {...props}>
              {children}
            </h1>
          );
        },
        h2({ children, ...props }) {
          return (
            <h2 className="font-bold mb-2 mt-3" style={{ fontSize: "var(--font-size-md)", color: "inherit" }} {...props}>
              {children}
            </h2>
          );
        },
        h3({ children, ...props }) {
          return (
            <h3 className="font-bold mb-1 mt-2" style={{ fontSize: "var(--font-size-base)", color: "inherit" }} {...props}>
              {children}
            </h3>
          );
        },
      }}
    >
      {content}
    </ReactMarkdown>
  );
}

/* ── Main Component ── */
export function ChatMessageV2({ message, isAdmin, onOpenInPreview }: ChatMessageV2Props) {
  const { sender_type, sender_name, content, created_at, cost_usd, tokens_used, streaming, activity, model, log_id, rated } = message;
  const [localRated, setLocalRated] = useState<1 | -1 | null>(rated ?? null);
  const handleRate = useCallback(async (val: 1 | -1) => {
    if (!log_id || localRated) return;
    setLocalRated(val);
    try {
      await api.training.rate(log_id, val);
    } catch {
      setLocalRated(null); // rollback on error
    }
  }, [log_id, localRated]);
  const [viewerSrc, setViewerSrc] = useState<string | null>(null);

  const handleImageClick = useCallback((src: string) => {
    setViewerSrc(src);
  }, []);

  const sanitized = sanitizeContent(content);
  const providerColor = getProviderColor(sender_name);
  const time = formatTime(created_at);

  /* ── System message ── */
  if (sender_type === "system") {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="flex items-center gap-3 py-2 px-4"
        style={{ marginBottom: "var(--space-6)" }}
      >
        <div className="flex-1 h-px" style={{ backgroundColor: "var(--border-subtle)" }} />
        <span style={{ fontSize: "var(--font-size-xs)", color: "var(--text-tertiary)" }} className="whitespace-nowrap">
          {content}
        </span>
        <div className="flex-1 h-px" style={{ backgroundColor: "var(--border-subtle)" }} />
      </motion.div>
    );
  }

  /* ── User message (right-aligned bubble) ── */
  if (sender_type === "user") {
    return (
      <>
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.2 }}
          className="flex justify-end px-4"
          style={{ marginBottom: "var(--space-6)" }}
        >
          <div className="max-w-[70%]">
            {/* Name + Time */}
            <div className="flex justify-end items-center gap-2 mb-1 px-1">
              <span style={{ fontSize: "var(--font-size-sm)", color: "var(--text-secondary)", fontWeight: 600 }}>
                {sender_name || "Вы"}
              </span>
              {time && (
                <span style={{ fontSize: "var(--font-size-xs)", color: "var(--text-tertiary)" }}>
                  {time}
                </span>
              )}
            </div>

            {/* Bubble */}
            <div
              className="rounded-2xl rounded-br-sm px-4 py-2.5"
              style={{ backgroundColor: "var(--user-bubble)" }}
            >
              <div style={{ color: "var(--text-primary)" }}>
                <MarkdownContent content={sanitized} onImageClick={handleImageClick} onOpenInPreview={onOpenInPreview} />
              </div>
            </div>
          </div>
        </motion.div>
        <ImageViewer src={viewerSrc} onClose={() => setViewerSrc(null)} />
      </>
    );
  }

  /* ── Agent message (left-aligned with avatar) ── */
  const initial = sender_name.charAt(0).toUpperCase();

  return (
    <>
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.2 }}
        className="flex gap-3 px-4"
        style={{ marginBottom: "var(--space-6)" }}
      >
        {/* Avatar */}
        <div
          className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5 font-semibold"
          style={{
            fontSize: "var(--font-size-sm)",
            backgroundColor: `color-mix(in srgb, ${providerColor} 15%, var(--bg-elevated))`,
            color: providerColor,
          }}
        >
          {initial}
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0 max-w-[80%]">
          {/* Name + Time */}
          <div className="flex items-center gap-2 mb-1">
            <span style={{ fontSize: "var(--font-size-sm)", color: providerColor, fontWeight: 700 }}>
              {sender_name}
            </span>
            {time && (
              <span style={{ fontSize: "var(--font-size-xs)", color: "var(--text-tertiary)" }}>
                {time}
              </span>
            )}
          </div>

          {/* Message body with provider border */}
          <div
            className="rounded-2xl rounded-tl-sm px-4 py-2.5"
            style={{
              backgroundColor: "var(--bg-surface)",
              borderLeft: `4px solid ${providerColor}`,
            }}
          >
            <div style={{ color: "var(--text-primary)" }}>
              <MarkdownContent content={sanitized} onImageClick={handleImageClick} onOpenInPreview={onOpenInPreview} />
              {streaming && !sanitized && (
                <span className="inline-block w-1.5 h-4 align-middle animate-pulse" style={{ backgroundColor: providerColor }} />
              )}
            </div>
          </div>

          {/* Activity chip — visible while streaming */}
          {streaming && (
            <motion.div
              initial={{ opacity: 0, x: -4 }}
              animate={{ opacity: 1, x: 0 }}
              className="flex items-center gap-2 mt-2 px-3 py-1.5 rounded-full w-fit"
              style={{
                backgroundColor: "color-mix(in srgb, var(--bg-elevated) 80%, transparent)",
                border: `1px solid color-mix(in srgb, ${providerColor} 30%, var(--border-default))`,
              }}
            >
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full opacity-75" style={{ backgroundColor: providerColor }} />
                <span className="relative inline-flex rounded-full h-2 w-2" style={{ backgroundColor: providerColor }} />
              </span>
              <span style={{ fontSize: "11px", color: "var(--text-secondary)", fontWeight: 500 }}>
                {activity || "Работает"}
              </span>
              {model && (
                <>
                  <span style={{ color: "var(--text-tertiary)", fontSize: "10px" }}>·</span>
                  <span style={{ fontSize: "10px", color: "var(--text-tertiary)", fontFamily: "monospace" }}>
                    {model.split("/").pop()}
                  </span>
                </>
              )}
              <span className="flex gap-0.5 ml-1">
                <span className="w-1 h-1 rounded-full animate-bounce" style={{ backgroundColor: "var(--text-tertiary)", animationDelay: "0ms" }} />
                <span className="w-1 h-1 rounded-full animate-bounce" style={{ backgroundColor: "var(--text-tertiary)", animationDelay: "150ms" }} />
                <span className="w-1 h-1 rounded-full animate-bounce" style={{ backgroundColor: "var(--text-tertiary)", animationDelay: "300ms" }} />
              </span>
            </motion.div>
          )}

          {/* Rating buttons — shown when log_id present and not streaming */}
          {log_id && !streaming && (
            <div className="flex items-center gap-1 mt-2 px-1">
              <button
                onClick={() => handleRate(1)}
                disabled={!!localRated}
                className="p-1.5 rounded-lg transition-all disabled:cursor-default"
                style={{
                  color: localRated === 1 ? "var(--accent-green)" : "var(--text-tertiary)",
                  backgroundColor: localRated === 1 ? "color-mix(in srgb, var(--accent-green) 15%, transparent)" : "transparent",
                }}
                title="Хороший ответ"
              >
                <ThumbsUp size={12} fill={localRated === 1 ? "currentColor" : "none"} />
              </button>
              <button
                onClick={() => handleRate(-1)}
                disabled={!!localRated}
                className="p-1.5 rounded-lg transition-all disabled:cursor-default"
                style={{
                  color: localRated === -1 ? "var(--accent-red, #ef4444)" : "var(--text-tertiary)",
                  backgroundColor: localRated === -1 ? "color-mix(in srgb, var(--accent-red, #ef4444) 15%, transparent)" : "transparent",
                }}
                title="Плохой ответ"
              >
                <ThumbsDown size={12} fill={localRated === -1 ? "currentColor" : "none"} />
              </button>
              {localRated && (
                <span style={{ fontSize: "10px", color: "var(--text-tertiary)", marginLeft: 4 }}>
                  Спасибо за фидбек
                </span>
              )}
            </div>
          )}

          {/* Meta row: cost + tokens (admin only) */}
          {isAdmin && ((cost_usd && cost_usd > 0) || (tokens_used && tokens_used > 0)) && (
            <div className="flex items-center gap-3 mt-1 px-1">
              {cost_usd && cost_usd > 0 && (
                <span style={{ fontSize: "var(--font-size-xs)", color: "var(--accent-amber)" }}>
                  ${cost_usd.toFixed(4)}
                </span>
              )}
              {tokens_used && tokens_used > 0 && (
                <span style={{ fontSize: "var(--font-size-xs)", color: "var(--text-tertiary)" }}>
                  {tokens_used.toLocaleString()} tok
                </span>
              )}
            </div>
          )}
        </div>
      </motion.div>
      <ImageViewer src={viewerSrc} onClose={() => setViewerSrc(null)} />
    </>
  );
}
