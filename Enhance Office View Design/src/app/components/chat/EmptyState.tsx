"use client";

import React, { useState } from "react";

interface EmptyStateProps {
  onQuickAction: (prompt: string) => void;
}

interface QuickAction {
  icon: string;
  title: string;
  description: string;
  prompt: string;
  accentColor: string;
}

const QUICK_ACTIONS: QuickAction[] = [
  {
    icon: "\uD83D\uDCBB",
    title: "\u041A\u043E\u0434",
    description: "\u041D\u0430\u043F\u0438\u0441\u0430\u0442\u044C \u0444\u0443\u043D\u043A\u0446\u0438\u044E, \u043E\u0442\u0440\u0435\u0444\u0430\u043A\u0442\u043E\u0440\u0438\u0442\u044C, \u043E\u0442\u043B\u0430\u0434\u0438\u0442\u044C",
    prompt: "\u041D\u0430\u043F\u0438\u0448\u0438 \u0444\u0443\u043D\u043A\u0446\u0438\u044E \u043D\u0430 Python \u043A\u043E\u0442\u043E\u0440\u0430\u044F...",
    accentColor: "var(--accent-blue)",
  },
  {
    icon: "\uD83C\uDFA8",
    title: "\u0414\u0438\u0437\u0430\u0439\u043D",
    description: "\u041B\u0435\u043D\u0434\u0438\u043D\u0433, UI \u043A\u043E\u043C\u043F\u043E\u043D\u0435\u043D\u0442\u044B, \u043C\u0430\u043A\u0435\u0442\u044B",
    prompt: "\u0421\u043E\u0437\u0434\u0430\u0439 \u0434\u0438\u0437\u0430\u0439\u043D \u043B\u0435\u043D\u0434\u0438\u043D\u0433\u0430 \u0434\u043B\u044F...",
    accentColor: "var(--accent-lavender)",
  },
  {
    icon: "\uD83D\uDD0D",
    title: "\u0420\u0435\u0441\u0451\u0440\u0447",
    description: "\u0410\u043D\u0430\u043B\u0438\u0437, \u0441\u0440\u0430\u0432\u043D\u0435\u043D\u0438\u0435, \u0438\u0441\u0441\u043B\u0435\u0434\u043E\u0432\u0430\u043D\u0438\u0435",
    prompt: "\u041F\u0440\u043E\u0432\u0435\u0434\u0438 \u0438\u0441\u0441\u043B\u0435\u0434\u043E\u0432\u0430\u043D\u0438\u0435 \u043D\u0430 \u0442\u0435\u043C\u0443...",
    accentColor: "var(--accent-teal)",
  },
  {
    icon: "\uD83D\uDCDD",
    title: "\u0422\u0435\u043A\u0441\u0442",
    description: "\u0421\u0442\u0430\u0442\u044C\u044F, \u043F\u0438\u0441\u044C\u043C\u043E, \u0434\u043E\u043A\u0443\u043C\u0435\u043D\u0442",
    prompt: "\u041D\u0430\u043F\u0438\u0448\u0438 \u0441\u0442\u0430\u0442\u044C\u044E \u043E...",
    accentColor: "var(--accent-amber)",
  },
];

function QuickActionCard({
  action,
  onClick,
}: {
  action: QuickAction;
  onClick: () => void;
}) {
  const [hovered, setHovered] = useState(false);

  return (
    <button
      onClick={onClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "flex-start",
        gap: "var(--space-2)",
        padding: "var(--space-4)",
        background: hovered ? "var(--bg-elevated)" : "var(--bg-surface)",
        border: `1px solid ${hovered ? action.accentColor : "var(--border-default)"}`,
        borderRadius: "var(--radius-lg)",
        cursor: "pointer",
        transition: "all 0.2s ease",
        textAlign: "left",
        boxShadow: hovered ? `0 0 12px ${action.accentColor}22` : "none",
        minWidth: 0,
      }}
    >
      <span style={{ fontSize: "24px", lineHeight: 1 }}>{action.icon}</span>
      <span
        style={{
          fontSize: "var(--font-size-base)",
          fontWeight: 600,
          color: "var(--text-primary)",
        }}
      >
        {action.title}
      </span>
      <span
        style={{
          fontSize: "var(--font-size-xs)",
          color: "var(--text-tertiary)",
          lineHeight: 1.4,
        }}
      >
        {action.description}
      </span>
    </button>
  );
}

export default function EmptyState({ onQuickAction }: EmptyStateProps) {
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        flex: 1,
        padding: "var(--space-10) var(--space-4)",
        minHeight: 0,
      }}
    >
      {/* Logo — X8 Refined */}
      <div
        style={{
          width: 56,
          height: 56,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          marginBottom: "var(--space-5)",
          color: "var(--text-primary)",
        }}
      >
        <svg width="48" height="48" viewBox="0 0 200 200" fill="none" aria-hidden="true">
          <g stroke="currentColor" strokeWidth="16" strokeLinecap="round">
            <line x1="58" y1="58" x2="88" y2="88" />
            <line x1="112" y1="112" x2="142" y2="142" />
            <line x1="142" y1="58" x2="112" y2="88" />
            <line x1="58" y1="142" x2="88" y2="112" />
          </g>
        </svg>
      </div>

      {/* Heading */}
      <h1
        style={{
          fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, system-ui, sans-serif",
          fontSize: 22,
          fontWeight: 500,
          color: "var(--text-primary)",
          margin: 0,
          marginBottom: "var(--space-2)",
          letterSpacing: "3px",
          lineHeight: 1.1,
        }}
      >
        XEROCODE AI
      </h1>

      {/* Subtitle */}
      <p
        style={{
          fontSize: "var(--font-size-base)",
          color: "var(--text-tertiary)",
          margin: 0,
          marginBottom: "var(--space-8)",
        }}
      >
        {"\u0427\u0435\u043C \u043C\u043E\u0433\u0443 \u043F\u043E\u043C\u043E\u0447\u044C \u0441\u0435\u0433\u043E\u0434\u043D\u044F?"}
      </p>

      {/* Quick action grid (2x2) */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          gap: "var(--space-3)",
          maxWidth: 380,
          width: "100%",
        }}
      >
        {QUICK_ACTIONS.map((action) => (
          <QuickActionCard
            key={action.title}
            action={action}
            onClick={() => onQuickAction(action.prompt)}
          />
        ))}
      </div>
    </div>
  );
}
