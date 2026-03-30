import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";

interface AgentConnectProps {
  goalId?: string;
  isConnected?: boolean;
  onClose?: () => void;
}

export const AgentConnect: React.FC<AgentConnectProps> = ({
  goalId,
  isConnected = false,
  onClose,
}) => {
  const [copied, setCopied] = useState<string | null>(null);
  const [tab, setTab] = useState<"cli" | "desktop">("cli");

  const cliCommand = goalId
    ? `npx xerocode-agent connect -g ${goalId}`
    : `npx xerocode-agent login`;

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    setCopied(label);
    setTimeout(() => setCopied(null), 2000);
  };

  return (
    <div
      style={{
        background: "#141416",
        borderRadius: "12px",
        border: "1px solid rgba(139,92,246,0.2)",
        overflow: "hidden",
      }}
    >
      {/* Header */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "12px 16px",
          borderBottom: "1px solid #1e1e1e",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          <span style={{ fontSize: "16px" }}>💻</span>
          <span style={{ fontSize: "13px", fontWeight: 600, color: "#fff" }}>
            Подключить компьютер
          </span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          {/* Status indicator */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "6px",
              padding: "3px 10px",
              borderRadius: "12px",
              background: isConnected
                ? "rgba(34,197,94,0.15)"
                : "rgba(100,100,100,0.15)",
              fontSize: "11px",
              color: isConnected ? "#22c55e" : "#888",
            }}
          >
            <div
              style={{
                width: "6px",
                height: "6px",
                borderRadius: "50%",
                background: isConnected ? "#22c55e" : "#666",
                boxShadow: isConnected ? "0 0 6px #22c55e" : "none",
              }}
            />
            {isConnected ? "Подключен" : "Не подключен"}
          </div>
          {onClose && (
            <button
              onClick={onClose}
              style={{
                background: "none",
                border: "none",
                color: "#666",
                cursor: "pointer",
                fontSize: "16px",
                padding: "2px",
              }}
            >
              ✕
            </button>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div
        style={{
          display: "flex",
          gap: "2px",
          padding: "8px 12px 0",
        }}
      >
        {(["cli", "desktop"] as const).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            style={{
              flex: 1,
              padding: "6px 12px",
              background: tab === t ? "#1e1e1e" : "transparent",
              border: "none",
              borderRadius: "6px 6px 0 0",
              color: tab === t ? "#fff" : "#666",
              fontSize: "12px",
              cursor: "pointer",
              fontWeight: tab === t ? 600 : 400,
              transition: "all 0.2s",
            }}
          >
            {t === "cli" ? "⌨️ Терминал" : "🖥 Приложение"}
          </button>
        ))}
      </div>

      {/* Content */}
      <div style={{ padding: "12px 16px 16px" }}>
        {tab === "cli" ? (
          <div>
            <p
              style={{
                fontSize: "12px",
                color: "#888",
                marginBottom: "10px",
                lineHeight: 1.5,
              }}
            >
              Выполните в терминале — агент подключится к этой цели и будет
              исполнять задачи на вашем компьютере:
            </p>

            {/* Step 1: Login (if no goal) */}
            {!goalId && (
              <div style={{ marginBottom: "10px" }}>
                <div
                  style={{
                    fontSize: "10px",
                    color: "#8b5cf6",
                    marginBottom: "4px",
                    fontWeight: 600,
                  }}
                >
                  ШАГ 1: УСТАНОВКА И ВХОД
                </div>
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    background: "#0e0e0e",
                    borderRadius: "8px",
                    border: "1px solid #2a2a2a",
                    overflow: "hidden",
                  }}
                >
                  <code
                    style={{
                      flex: 1,
                      padding: "10px 12px",
                      fontSize: "12px",
                      color: "#22c55e",
                      fontFamily:
                        "'SF Mono', 'JetBrains Mono', 'Menlo', monospace",
                    }}
                  >
                    npx xerocode-agent login
                  </code>
                  <button
                    onClick={() =>
                      copyToClipboard("npx xerocode-agent login", "login")
                    }
                    style={{
                      padding: "10px 12px",
                      background: "none",
                      border: "none",
                      borderLeft: "1px solid #2a2a2a",
                      color: copied === "login" ? "#22c55e" : "#666",
                      cursor: "pointer",
                      fontSize: "12px",
                    }}
                  >
                    {copied === "login" ? "✓" : "📋"}
                  </button>
                </div>
              </div>
            )}

            {/* Step 2: Connect */}
            <div>
              {!goalId && (
                <div
                  style={{
                    fontSize: "10px",
                    color: "#8b5cf6",
                    marginBottom: "4px",
                    fontWeight: 600,
                  }}
                >
                  ШАГ 2: ПОДКЛЮЧЕНИЕ К ЦЕЛИ
                </div>
              )}
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  background: "#0e0e0e",
                  borderRadius: "8px",
                  border: "1px solid #2a2a2a",
                  overflow: "hidden",
                }}
              >
                <code
                  style={{
                    flex: 1,
                    padding: "10px 12px",
                    fontSize: "12px",
                    color: "#22c55e",
                    fontFamily:
                      "'SF Mono', 'JetBrains Mono', 'Menlo', monospace",
                    whiteSpace: "nowrap",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                  }}
                >
                  {cliCommand}
                </code>
                <button
                  onClick={() => copyToClipboard(cliCommand, "connect")}
                  style={{
                    padding: "10px 12px",
                    background: "none",
                    border: "none",
                    borderLeft: "1px solid #2a2a2a",
                    color: copied === "connect" ? "#22c55e" : "#666",
                    cursor: "pointer",
                    fontSize: "12px",
                    flexShrink: 0,
                  }}
                >
                  {copied === "connect" ? "✓" : "📋"}
                </button>
              </div>
            </div>

            <p
              style={{
                fontSize: "11px",
                color: "#555",
                marginTop: "10px",
                lineHeight: 1.5,
              }}
            >
              Требуется Node.js 18+. Агент работает в песочнице — опасные
              команды заблокированы.
            </p>
          </div>
        ) : (
          <div>
            <p
              style={{
                fontSize: "12px",
                color: "#888",
                marginBottom: "12px",
                lineHeight: 1.5,
              }}
            >
              Скачайте приложение XeroCode Agent — GUI с треем, логом и
              автоподключением:
            </p>

            <div
              style={{
                display: "flex",
                gap: "8px",
                marginBottom: "12px",
              }}
            >
              {[
                { os: "macOS", icon: "🍎", url: "https://github.com/SYL4R2k27/xerocode-ai-office/releases/download/v0.2.0/XeroCode.Agent-0.2.0-arm64.dmg" },
                { os: "Windows", icon: "🪟", url: "https://github.com/SYL4R2k27/xerocode-ai-office/releases/download/v0.2.0/XeroCode.Agent.Setup.0.2.0.exe" },
                { os: "Linux", icon: "🐧", url: "https://github.com/SYL4R2k27/xerocode-ai-office/releases/download/v0.2.0/XeroCode.Agent-0.2.0.AppImage" },
              ].map(({ os, icon, url }) => (
                <a
                  key={os}
                  href={url}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{
                    flex: 1,
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    gap: "4px",
                    padding: "12px 8px",
                    background: "#1a1a1a",
                    border: "1px solid #2a2a2a",
                    borderRadius: "8px",
                    color: "#ccc",
                    cursor: "pointer",
                    fontSize: "11px",
                    transition: "all 0.2s",
                    textDecoration: "none",
                  }}
                  onMouseEnter={(e) => {
                    (e.currentTarget as HTMLElement).style.borderColor = "#8b5cf6";
                  }}
                  onMouseLeave={(e) => {
                    (e.currentTarget as HTMLElement).style.borderColor = "#2a2a2a";
                  }}
                >
                  <span style={{ fontSize: "20px" }}>{icon}</span>
                  <span>{os}</span>
                </a>
              ))}
            </div>

            <p
              style={{
                fontSize: "11px",
                color: "#555",
                lineHeight: 1.5,
              }}
            >
              Приложение работает в системном трее. Войдите через email, выберите
              папку проекта и введите Goal ID.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};
