import { useState, useCallback } from "react";
import { motion } from "motion/react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { oneDark } from "react-syntax-highlighter/dist/esm/styles/prism";
import { Check, Copy, ExternalLink } from "lucide-react";
import { StatusDot } from "../shared/StatusDot";
import { ProviderBadge } from "../shared/ProviderBadge";
import { ImageViewer } from "../shared/ImageViewer";
import type { Message, Agent } from "../../lib/api";

interface ChatMessageProps {
  message: Message;
  agents: Agent[];
  isGrouped?: boolean;
  onOpenInPreview?: (code: string, language: string) => void;
}

const providerColors: Record<string, string> = {
  openai: "var(--provider-openai)",
  anthropic: "var(--provider-anthropic)",
  ollama: "var(--provider-ollama)",
  custom: "var(--provider-custom)",
  google: "var(--provider-google)",
};

function getAgentColor(agents: Agent[], senderName: string): string {
  const agent = agents.find((a) => a.name === senderName);
  return agent ? providerColors[agent.provider] || "var(--text-secondary)" : "var(--text-secondary)";
}

function getAgentProvider(agents: Agent[], senderName: string): string | null {
  const agent = agents.find((a) => a.name === senderName);
  return agent?.provider || null;
}

function getAgentModel(agents: Agent[], senderName: string): string | null {
  const agent = agents.find((a) => a.name === senderName);
  return agent?.model_name || null;
}

// Parse code blocks and images from content
function sanitizeContent(text: string): string {
  return text
    .replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, "")
    .replace(/on\w+\s*=\s*["'][^"']*["']/gi, "")
    .replace(/javascript:/gi, "")
    .replace(/<iframe\b[^>]*>[\s\S]*?<\/iframe>/gi, "")
    .replace(/<object\b[^>]*>[\s\S]*?<\/object>/gi, "")
    .replace(/<embed\b[^>]*>/gi, "");
}

function isAllowedImageUrl(url: string): boolean {
  return url.startsWith("/uploads/") || url.startsWith("data:image/") || url.startsWith("https://");
}

function parseContent(content: string): Array<{ type: "text" | "code" | "image"; value: string; language?: string }> {
  const parts: Array<{ type: "text" | "code" | "image"; value: string; language?: string }> = [];

  // Check for markdown image: ![alt](/uploads/filename.png)
  const mdImgMatch = content.match(/!\[([^\]]*)\]\((\/uploads\/[^\s)]+)\)/);
  if (mdImgMatch) {
    const idx = content.indexOf(mdImgMatch[0]);
    const textBefore = content.slice(0, idx).trim();
    if (textBefore) parts.push({ type: "text", value: textBefore });
    parts.push({ type: "image", value: mdImgMatch[2] });
    const after = content.slice(idx + mdImgMatch[0].length).trim();
    if (after) parts.push({ type: "text", value: after });
    return parts;
  }

  // Check for relative upload URLs: /uploads/filename.png
  const uploadMatch = content.match(/(\/uploads\/[a-zA-Z0-9_.-]+\.(png|jpg|jpeg|gif|webp))/);
  if (uploadMatch) {
    const idx = content.indexOf(uploadMatch[0]);
    const textBefore = content.slice(0, idx).trim();
    if (textBefore) parts.push({ type: "text", value: textBefore });
    parts.push({ type: "image", value: uploadMatch[0] });
    const after = content.slice(idx + uploadMatch[0].length).trim();
    if (after) parts.push({ type: "text", value: after });
    return parts;
  }

  // Check for base64 image data
  const base64Match = content.match(/data:image\/(png|jpeg|jpg|gif|webp);base64,[A-Za-z0-9+/=]+/);
  if (base64Match) {
    const idx = content.indexOf(base64Match[0]);
    if (idx > 0) {
      parts.push({ type: "text", value: content.slice(0, idx).trim() });
    }
    parts.push({ type: "image", value: base64Match[0] });
    const after = content.slice(idx + base64Match[0].length).trim();
    if (after) parts.push({ type: "text", value: after });
    return parts;
  }

  // Check for image URLs
  const imgUrlRegex = /(https?:\/\/[^\s]+\.(png|jpg|jpeg|gif|webp|svg)(\?[^\s]*)?)/gi;
  let imgMatch;
  let lastImgIdx = 0;
  const imgParts: typeof parts = [];
  let hasImages = false;

  while ((imgMatch = imgUrlRegex.exec(content)) !== null) {
    hasImages = true;
    if (imgMatch.index > lastImgIdx) {
      imgParts.push({ type: "text", value: content.slice(lastImgIdx, imgMatch.index) });
    }
    imgParts.push({ type: "image", value: imgMatch[0] });
    lastImgIdx = imgMatch.index + imgMatch[0].length;
  }
  if (hasImages) {
    if (lastImgIdx < content.length) {
      imgParts.push({ type: "text", value: content.slice(lastImgIdx) });
    }
    return imgParts;
  }

  // Default: return as single text part (markdown will handle code blocks)
  return [{ type: "text", value: content }];
}

function formatTime(dateStr: string): string {
  const d = new Date(dateStr);
  return d.toLocaleTimeString("ru-RU", { hour: "2-digit", minute: "2-digit" });
}

// Code block component with copy button and syntax highlighting
function MarkdownCodeBlock({
  code,
  language,
  onOpenInPreview,
}: {
  code: string;
  language: string;
  onOpenInPreview?: (code: string, language: string) => void;
}) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="relative group rounded-lg overflow-hidden my-2" style={{ backgroundColor: "var(--bg-input)" }}>
      {/* Header */}
      <div
        className="flex items-center justify-between px-3 py-1.5 text-[11px]"
        style={{ color: "var(--text-tertiary)", borderBottom: "1px solid var(--border-subtle)" }}
      >
        <span className="font-medium uppercase">{language}</span>
        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          {onOpenInPreview && (
            <button
              onClick={() => onOpenInPreview(code, language)}
              className="p-1 rounded hover:bg-white/5 transition-colors"
              title="Открыть в превью"
            >
              <ExternalLink size={12} />
            </button>
          )}
          <button
            onClick={handleCopy}
            className="p-1 rounded hover:bg-white/5 transition-colors"
            title="Копировать"
          >
            {copied ? <Check size={12} style={{ color: "var(--accent-teal)" }} /> : <Copy size={12} />}
          </button>
        </div>
      </div>

      {/* Code with syntax highlighting */}
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
          style: { fontFamily: "'JetBrains Mono', 'Fira Code', monospace" },
        }}
      >
        {code}
      </SyntaxHighlighter>
    </div>
  );
}

// Markdown renderer component
function MarkdownContent({
  content,
  onOpenInPreview,
  onImageClick,
}: {
  content: string;
  onOpenInPreview?: (code: string, language: string) => void;
  onImageClick?: (src: string) => void;
}) {
  return (
    <ReactMarkdown
      remarkPlugins={[remarkGfm]}
      components={{
        code({ className, children, ...props }) {
          const match = /language-(\w+)/.exec(className || "");
          const codeString = String(children).replace(/\n$/, "");

          // Inline code
          if (!match) {
            return (
              <code
                className="px-1.5 py-0.5 rounded text-[12px]"
                style={{
                  backgroundColor: "var(--bg-input)",
                  color: "var(--accent-teal)",
                  fontFamily: "'JetBrains Mono', 'Fira Code', monospace",
                }}
                {...props}
              >
                {children}
              </code>
            );
          }

          // Block code
          return (
            <MarkdownCodeBlock
              code={codeString}
              language={match[1]}
              onOpenInPreview={onOpenInPreview}
            />
          );
        },
        pre({ children }) {
          // Let the code component handle everything
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
            <ul className="list-disc list-inside space-y-1 my-2 text-sm" style={{ color: "inherit" }} {...props}>
              {children}
            </ul>
          );
        },
        ol({ children, ...props }) {
          return (
            <ol className="list-decimal list-inside space-y-1 my-2 text-sm" style={{ color: "inherit" }} {...props}>
              {children}
            </ol>
          );
        },
        li({ children, ...props }) {
          return (
            <li className="leading-relaxed" {...props}>
              {children}
            </li>
          );
        },
        p({ children, ...props }) {
          return (
            <p className="text-sm leading-relaxed mb-2 last:mb-0" style={{ color: "inherit" }} {...props}>
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
              <table
                className="text-sm w-full border-collapse"
                style={{ borderColor: "var(--border-subtle)" }}
                {...props}
              >
                {children}
              </table>
            </div>
          );
        },
        th({ children, ...props }) {
          return (
            <th
              className="text-left px-3 py-1.5 text-xs font-semibold"
              style={{
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
              className="px-3 py-1.5 text-sm"
              style={{ borderBottom: "1px solid var(--border-subtle)" }}
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
          return <h1 className="text-lg font-bold mb-2 mt-3" style={{ color: "inherit" }} {...props}>{children}</h1>;
        },
        h2({ children, ...props }) {
          return <h2 className="text-base font-bold mb-2 mt-3" style={{ color: "inherit" }} {...props}>{children}</h2>;
        },
        h3({ children, ...props }) {
          return <h3 className="text-sm font-bold mb-1 mt-2" style={{ color: "inherit" }} {...props}>{children}</h3>;
        },
      }}
    >
      {content}
    </ReactMarkdown>
  );
}

export function ChatMessage({ message, agents, isGrouped, onOpenInPreview }: ChatMessageProps) {
  const { sender_type, sender_name, content, cost_usd, tokens_used, created_at } = message;
  const [viewerSrc, setViewerSrc] = useState<string | null>(null);

  const handleImageClick = useCallback((src: string) => {
    setViewerSrc(src);
  }, []);

  // Check admin status from JWT token in localStorage
  const isAdmin = (() => {
    try {
      const token = localStorage.getItem("ai_office_token");
      if (!token) return false;
      const payload = JSON.parse(atob(token.split(".")[1]));
      return payload.plan === "admin";
    } catch { return false; }
  })();

  // System messages — centered, minimal
  if (sender_type === "system") {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="flex items-center gap-3 py-2 px-4"
      >
        <div className="flex-1 h-px" style={{ backgroundColor: "var(--border-subtle)" }} />
        <span className="text-xs whitespace-nowrap" style={{ color: "var(--text-tertiary)" }}>
          {content}
        </span>
        <div className="flex-1 h-px" style={{ backgroundColor: "var(--border-subtle)" }} />
      </motion.div>
    );
  }

  // User messages — right-aligned
  if (sender_type === "user") {
    const parts = parseContent(sanitizeContent(content));
    return (
      <>
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.2 }}
          className="flex justify-end px-4 py-1"
        >
          <div className="max-w-[70%]">
            <div
              className="rounded-2xl rounded-br-sm px-4 py-2.5"
              style={{ backgroundColor: "var(--user-bubble)" }}
            >
              {parts.map((part, i) =>
                part.type === "image" ? (
                  <img
                    key={i}
                    src={part.value}
                    alt="Uploaded"
                    className="max-w-full rounded-lg mt-2 mb-2 max-h-[400px] object-contain cursor-pointer hover:opacity-90 transition-opacity"
                    onClick={() => handleImageClick(part.value)}
                  />
                ) : (
                  <div key={i} style={{ color: "var(--text-primary)" }}>
                    <MarkdownContent
                      content={part.value}
                      onOpenInPreview={onOpenInPreview}
                      onImageClick={handleImageClick}
                    />
                  </div>
                )
              )}
            </div>
            <div className="flex justify-end items-center gap-2 mt-1 px-1">
              <span className="text-[11px]" style={{ color: "var(--text-tertiary)" }}>
                {formatTime(created_at)}
              </span>
            </div>
          </div>
        </motion.div>
        <ImageViewer src={viewerSrc} onClose={() => setViewerSrc(null)} />
      </>
    );
  }

  // Agent messages — left-aligned with avatar
  const agentColor = getAgentColor(agents, sender_name);
  const provider = getAgentProvider(agents, sender_name);
  const modelName = getAgentModel(agents, sender_name);
  const parts = parseContent(sanitizeContent(content));

  return (
    <>
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.2 }}
        className="flex gap-3 px-4 py-1"
      >
        {/* Avatar */}
        {!isGrouped ? (
          <div
            className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 text-sm mt-0.5"
            style={{ backgroundColor: `color-mix(in srgb, ${agentColor} 15%, var(--bg-elevated))` }}
          >
            {sender_name.charAt(0).toUpperCase()}
          </div>
        ) : (
          <div className="w-8 flex-shrink-0" />
        )}

        {/* Content */}
        <div className="flex-1 min-w-0 max-w-[80%]">
          {/* Name row */}
          {!isGrouped && (
            <div className="flex items-center gap-2 mb-1">
              <span className="text-[13px] font-semibold" style={{ color: agentColor }}>
                {sender_name}
              </span>
              {modelName && (
                <span className="text-[10px]" style={{ color: "var(--text-tertiary)" }}>
                  {modelName.replace(/^[^/]+\//, "")}
                </span>
              )}
            </div>
          )}

          {/* Message body */}
          <div
            className="rounded-2xl rounded-tl-sm px-4 py-2.5"
            style={{
              backgroundColor: "var(--bg-surface)",
              borderLeft: `2px solid ${agentColor}`,
            }}
          >
            {parts.map((part, i) =>
              part.type === "image" ? (
                <img
                  key={i}
                  src={part.value}
                  alt="Generated"
                  className="max-w-full rounded-lg mt-2 mb-2 max-h-[400px] object-contain shadow-lg cursor-pointer hover:opacity-90 transition-opacity"
                  onClick={() => handleImageClick(part.value)}
                />
              ) : (
                <div key={i} style={{ color: "#E5E5E7" }}>
                  <MarkdownContent
                    content={part.value}
                    onOpenInPreview={onOpenInPreview}
                    onImageClick={handleImageClick}
                  />
                </div>
              )
            )}
          </div>

          {/* Meta row */}
          <div className="flex items-center gap-3 mt-1 px-1">
            <span className="text-[11px]" style={{ color: "var(--text-tertiary)" }}>
              {formatTime(created_at)}
            </span>
            {isAdmin && cost_usd > 0 && (
              <span className="text-[11px]" style={{ color: "var(--accent-amber)" }}>
                ${cost_usd.toFixed(4)}
              </span>
            )}
            {isAdmin && tokens_used > 0 && (
              <span className="text-[11px]" style={{ color: "var(--text-tertiary)" }}>
                {tokens_used.toLocaleString()} tok
              </span>
            )}
          </div>
        </div>
      </motion.div>
      <ImageViewer src={viewerSrc} onClose={() => setViewerSrc(null)} />
    </>
  );
}
