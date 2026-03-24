import { useState } from "react";
import { Check, Copy, ExternalLink } from "lucide-react";

interface CodeBlockProps {
  code: string;
  language?: string;
  onOpenInPreview?: (code: string, language: string) => void;
}

export function CodeBlock({ code, language = "text", onOpenInPreview }: CodeBlockProps) {
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

      {/* Code */}
      <pre className="p-3 overflow-x-auto text-[13px] leading-relaxed" style={{ color: "var(--text-primary)" }}>
        <code>{code}</code>
      </pre>
    </div>
  );
}
