import { Code2, Eye } from "lucide-react";

interface PreviewPaneProps {
  code: string | null;
  language: string;
}

export function PreviewPane({ code, language }: PreviewPaneProps) {
  if (!code) {
    return (
      <div className="flex flex-col items-center justify-center h-full gap-2 px-4">
        <Eye size={24} style={{ color: "var(--text-tertiary)" }} />
        <p className="text-[12px] text-center" style={{ color: "var(--text-tertiary)" }}>
          Нажми "Открыть в превью" на блоке кода в чате
        </p>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col">
      <div
        className="flex items-center gap-2 px-3 py-2 text-[11px] flex-shrink-0"
        style={{
          borderBottom: "1px solid var(--border-subtle)",
          color: "var(--text-tertiary)",
        }}
      >
        <Code2 size={12} />
        <span className="uppercase font-medium">{language}</span>
      </div>
      <pre
        className="flex-1 overflow-auto p-3 text-[13px] leading-relaxed"
        style={{ backgroundColor: "var(--bg-input)", color: "var(--text-primary)" }}
      >
        <code>{code}</code>
      </pre>
    </div>
  );
}
