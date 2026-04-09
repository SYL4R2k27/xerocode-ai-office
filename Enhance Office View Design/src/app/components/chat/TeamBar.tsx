"use client";

import React, { useState, useRef, useEffect } from "react";

interface Agent {
  id: string;
  name: string;
  role: string;
  provider: string;
  model_name: string;
  status: string;
  avatar?: string;
}

interface TeamBarProps {
  agents: Agent[];
  mode: "manager" | "discussion" | "auto";
  onModeChange: (mode: string) => void;
  onRemoveAgent: (id: string) => void;
  onAddAgent: () => void;
  useKnowledgeBase: boolean;
  onToggleKB: () => void;
}

const PROVIDER_COLORS: Record<string, string> = {
  openai: "var(--provider-openai)",
  anthropic: "var(--provider-anthropic)",
  google: "var(--provider-google)",
  groq: "var(--provider-groq)",
  xai: "var(--provider-xai)",
  deepseek: "var(--provider-deepseek)",
  meta: "var(--provider-meta)",
  mistral: "var(--provider-mistral)",
  ollama: "var(--provider-ollama)",
  custom: "var(--provider-custom)",
};

const STATUS_INDICATORS: Record<string, { color: string; label: string }> = {
  idle: { color: "#34D399", label: "Готов" },
  thinking: { color: "#60A5FA", label: "Думает..." },
  working: { color: "#FBBF24", label: "Работает..." },
  error: { color: "#FB7185", label: "Ошибка" },
};

const MODE_OPTIONS = [
  { value: "manager", label: "Менеджер" },
  { value: "discussion", label: "Обсуждение" },
  { value: "auto", label: "Авто" },
];

function AgentCard({
  agent,
  onRemove,
}: {
  agent: Agent;
  onRemove: (id: string) => void;
}) {
  const [hovered, setHovered] = useState(false);
  const providerColor = PROVIDER_COLORS[agent.provider] || "var(--provider-custom)";
  const statusInfo = STATUS_INDICATORS[agent.status] || STATUS_INDICATORS.idle;

  return (
    <div
      className="agent-card"
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        display: "flex",
        alignItems: "center",
        gap: "var(--space-2)",
        padding: "var(--space-1) var(--space-3)",
        background: "var(--bg-elevated)",
        border: `1px solid ${hovered ? "var(--border-focus)" : "var(--border-default)"}`,
        borderRadius: "var(--radius-md)",
        cursor: "pointer",
        transition: "border-color 0.2s ease, box-shadow 0.2s ease",
        boxShadow: hovered ? "0 0 8px rgba(129, 140, 248, 0.12)" : "none",
        fontSize: "var(--font-size-sm)",
        whiteSpace: "nowrap",
        position: "relative",
      }}
    >
      {/* Provider color dot */}
      <span
        style={{
          width: 8,
          height: 8,
          borderRadius: "50%",
          background: providerColor,
          flexShrink: 0,
        }}
      />

      {/* Model name */}
      <span style={{ color: "var(--text-primary)", fontWeight: 500 }}>
        {agent.name}
      </span>

      {/* Dropdown arrow (future: model switcher) */}
      <svg
        width="10"
        height="10"
        viewBox="0 0 10 10"
        fill="none"
        style={{ opacity: 0.5, flexShrink: 0 }}
      >
        <path
          d="M2.5 4L5 6.5L7.5 4"
          stroke="var(--text-secondary)"
          strokeWidth="1.2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>

      {/* Status indicator */}
      <span
        style={{
          width: 7,
          height: 7,
          borderRadius: "50%",
          background: statusInfo.color,
          flexShrink: 0,
          animation: agent.status === "thinking" ? "pulse 1.5s ease-in-out infinite" : "none",
        }}
        title={statusInfo.label}
      />

      {/* Remove button (visible on hover) */}
      {hovered && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            onRemove(agent.id);
          }}
          style={{
            position: "absolute",
            top: -6,
            right: -6,
            width: 16,
            height: 16,
            borderRadius: "50%",
            background: "var(--accent-rose)",
            border: "none",
            color: "#fff",
            fontSize: "10px",
            lineHeight: "16px",
            textAlign: "center",
            cursor: "pointer",
            padding: 0,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
          title="Убрать агента"
        >
          <svg width="8" height="8" viewBox="0 0 8 8" fill="none">
            <path d="M1.5 1.5L6.5 6.5M6.5 1.5L1.5 6.5" stroke="#fff" strokeWidth="1.2" strokeLinecap="round" />
          </svg>
        </button>
      )}
    </div>
  );
}

function ModeDropdown({
  mode,
  onModeChange,
}: {
  mode: string;
  onModeChange: (mode: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const currentLabel = MODE_OPTIONS.find((o) => o.value === mode)?.label || mode;

  return (
    <div ref={ref} style={{ position: "relative" }}>
      <button
        onClick={() => setOpen(!open)}
        style={{
          display: "flex",
          alignItems: "center",
          gap: "var(--space-1)",
          padding: "var(--space-1) var(--space-3)",
          background: "var(--bg-elevated)",
          border: "1px solid var(--border-default)",
          borderRadius: "var(--radius-sm)",
          color: "var(--text-primary)",
          fontSize: "var(--font-size-sm)",
          cursor: "pointer",
          fontWeight: 500,
        }}
      >
        <span style={{ color: "var(--text-secondary)", fontWeight: 400 }}>Режим:</span>
        {currentLabel}
        <svg width="10" height="10" viewBox="0 0 10 10" fill="none" style={{ opacity: 0.5 }}>
          <path d="M2.5 4L5 6.5L7.5 4" stroke="var(--text-secondary)" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>

      {open && (
        <div
          style={{
            position: "absolute",
            top: "calc(100% + 4px)",
            left: 0,
            background: "var(--bg-surface)",
            border: "1px solid var(--border-default)",
            borderRadius: "var(--radius-sm)",
            boxShadow: "var(--shadow-md)",
            zIndex: 50,
            minWidth: 140,
            overflow: "hidden",
          }}
        >
          {MODE_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              onClick={() => {
                onModeChange(opt.value);
                setOpen(false);
              }}
              style={{
                display: "block",
                width: "100%",
                padding: "var(--space-2) var(--space-3)",
                background: opt.value === mode ? "var(--bg-elevated)" : "transparent",
                border: "none",
                color: "var(--text-primary)",
                fontSize: "var(--font-size-sm)",
                cursor: "pointer",
                textAlign: "left",
              }}
            >
              {opt.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

function KBToggle({
  enabled,
  onToggle,
}: {
  enabled: boolean;
  onToggle: () => void;
}) {
  return (
    <button
      onClick={onToggle}
      style={{
        display: "flex",
        alignItems: "center",
        gap: "var(--space-2)",
        padding: "var(--space-1) var(--space-3)",
        background: "var(--bg-elevated)",
        border: "1px solid var(--border-default)",
        borderRadius: "var(--radius-sm)",
        color: "var(--text-primary)",
        fontSize: "var(--font-size-sm)",
        cursor: "pointer",
      }}
    >
      <span style={{ color: "var(--text-secondary)", fontWeight: 400 }}>KB:</span>
      <span
        style={{
          display: "inline-block",
          width: 28,
          height: 16,
          borderRadius: 8,
          background: enabled ? "var(--accent-green)" : "var(--border-default)",
          position: "relative",
          transition: "background 0.2s ease",
        }}
      >
        <span
          style={{
            position: "absolute",
            top: 2,
            left: enabled ? 14 : 2,
            width: 12,
            height: 12,
            borderRadius: "50%",
            background: "#fff",
            transition: "left 0.2s ease",
          }}
        />
      </span>
    </button>
  );
}

export default function TeamBar({
  agents,
  mode,
  onModeChange,
  onRemoveAgent,
  onAddAgent,
  useKnowledgeBase,
  onToggleKB,
}: TeamBarProps) {
  return (
    <div
      className="team-bar"
      style={{
        display: "flex",
        flexDirection: "column",
        gap: "var(--space-2)",
        padding: "var(--space-3) var(--space-4)",
        background: "var(--bg-surface)",
        borderBottom: "1px solid var(--border-subtle)",
        fontSize: "var(--font-size-sm)",
      }}
    >
      {/* Top row: label + agent cards + add button */}
      <div style={{ display: "flex", alignItems: "center", gap: "var(--space-2)", flexWrap: "wrap" }}>
        <span style={{ color: "var(--text-secondary)", fontSize: "var(--font-size-xs)", fontWeight: 500, textTransform: "uppercase", letterSpacing: "0.04em" }}>
          Команда:
        </span>

        {agents.map((agent) => (
          <AgentCard key={agent.id} agent={agent} onRemove={onRemoveAgent} />
        ))}

        <button
          onClick={onAddAgent}
          style={{
            display: "flex",
            alignItems: "center",
            gap: "var(--space-1)",
            padding: "var(--space-1) var(--space-3)",
            background: "transparent",
            border: "1px dashed var(--border-default)",
            borderRadius: "var(--radius-md)",
            color: "var(--text-tertiary)",
            fontSize: "var(--font-size-sm)",
            cursor: "pointer",
            transition: "color 0.2s, border-color 0.2s",
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.color = "var(--text-primary)";
            e.currentTarget.style.borderColor = "var(--border-focus)";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.color = "var(--text-tertiary)";
            e.currentTarget.style.borderColor = "var(--border-default)";
          }}
        >
          <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
            <path d="M6 2.5V9.5M2.5 6H9.5" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
          </svg>
          Add
        </button>
      </div>

      {/* Bottom row: mode + KB toggle */}
      <div style={{ display: "flex", alignItems: "center", gap: "var(--space-3)" }}>
        <ModeDropdown mode={mode} onModeChange={onModeChange} />
        <KBToggle enabled={useKnowledgeBase} onToggle={onToggleKB} />
      </div>

      {/* Pulse animation for thinking status */}
      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.4; }
        }
      `}</style>
    </div>
  );
}
