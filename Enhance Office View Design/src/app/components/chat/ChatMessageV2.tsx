import { useState, useCallback } from "react";
import { motion } from "motion/react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { oneDark } from "react-syntax-highlighter/dist/esm/styles/prism";
import { Check, Copy, ExternalLink } from "lucide-react";
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
}

interface ChatMessageV2Props {
  message: MessageData;
  isAdmin?: boolean;
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
function CodeBlock({ code, language }: { code: string; language: string }) {
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
}: {
  content: string;
  onImageClick?: (src: string) => void;
}) {
  return (
    <ReactMarkdown
      remarkPlugins={[remarkGfm]}
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

          return <CodeBlock code={codeString} language={match[1]} />;
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
export function ChatMessageV2({ message, isAdmin }: ChatMessageV2Props) {
  const { sender_type, sender_name, content, created_at, cost_usd, tokens_used } = message;
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
                <MarkdownContent content={sanitized} onImageClick={handleImageClick} />
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
              <MarkdownContent content={sanitized} onImageClick={handleImageClick} />
            </div>
          </div>

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
