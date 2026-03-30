import React, { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Swords, Trophy, Eye, Zap, ThumbsUp, ThumbsDown, Equal, ChevronDown } from "lucide-react";

type ArenaMode = "duel" | "evolution" | "tournament" | "blind";

interface ArenaViewProps {
  onStartBattle?: (prompt: string, modelA: string, modelB: string, mode: ArenaMode) => void;
}

const MODES: { id: ArenaMode; label: string; icon: any; desc: string; color: string }[] = [
  { id: "duel", label: "Дуэль", icon: Swords, desc: "2 модели, 1 задача, вы судья", color: "#3b82f6" },
  { id: "evolution", label: "Эволюция", icon: Zap, desc: "Модели улучшают ответы друг друга", color: "#8b5cf6" },
  { id: "tournament", label: "Турнир", icon: Trophy, desc: "4 модели, bracket, финал", color: "#f59e0b" },
  { id: "blind", label: "Слепой тест", icon: Eye, desc: "Имена скрыты до голосования", color: "#22c55e" },
];

const MODELS = [
  "gpt-5.4", "gpt-5", "gpt-4o", "claude-opus-4.6", "claude-sonnet-4.6",
  "gemini-2.5-pro", "gemini-2.5-flash", "grok-4", "llama-3.3-70b",
  "deepseek-v3", "qwen3-coder", "mistral-large",
];

export const ArenaView: React.FC<ArenaViewProps> = ({ onStartBattle }) => {
  const [mode, setMode] = useState<ArenaMode>("duel");
  const [prompt, setPrompt] = useState("");
  const [modelA, setModelA] = useState(MODELS[0]);
  const [modelB, setModelB] = useState(MODELS[3]);
  const [responseA, setResponseA] = useState<string | null>(null);
  const [responseB, setResponseB] = useState<string | null>(null);
  const [voted, setVoted] = useState<string | null>(null);
  const [isRunning, setIsRunning] = useState(false);

  const currentMode = MODES.find(m => m.id === mode)!;

  const handleStart = () => {
    if (!prompt.trim()) return;
    setIsRunning(true);
    setResponseA(null);
    setResponseB(null);
    setVoted(null);
    onStartBattle?.(prompt, modelA, modelB, mode);
    // Simulate responses for UI demo
    setTimeout(() => setResponseA("Ответ модели A загружается с сервера..."), 1000);
    setTimeout(() => { setResponseB("Ответ модели B загружается с сервера..."); setIsRunning(false); }, 2000);
  };

  const handleVote = (winner: string) => {
    setVoted(winner);
  };

  return (
    <div style={{ height: "100%", display: "flex", flexDirection: "column", background: "var(--bg-base)", color: "var(--text-primary)" }}>
      {/* Mode selector */}
      <div style={{ padding: "12px 20px", display: "flex", gap: "8px", borderBottom: "1px solid var(--border-default)" }}>
        {MODES.map(m => {
          const Icon = m.icon;
          const active = mode === m.id;
          return (
            <button
              key={m.id}
              onClick={() => setMode(m.id)}
              style={{
                flex: 1, padding: "8px 12px", borderRadius: "8px", border: "none", cursor: "pointer",
                background: active ? m.color : "var(--bg-input)",
                color: active ? "#fff" : "var(--text-secondary)",
                fontSize: "12px", fontWeight: active ? 600 : 400,
                display: "flex", flexDirection: "column", alignItems: "center", gap: "4px",
                transition: "all 0.2s",
              }}
            >
              <Icon size={16} />
              {m.label}
            </button>
          );
        })}
      </div>

      {/* Prompt + model pickers */}
      <div style={{ padding: "16px 20px", borderBottom: "1px solid var(--border-default)" }}>
        <div style={{ fontSize: "10px", color: "var(--text-tertiary)", marginBottom: "6px", textTransform: "uppercase", fontWeight: 600 }}>
          {currentMode.desc}
        </div>
        <textarea
          value={prompt}
          onChange={e => setPrompt(e.target.value)}
          placeholder="Введите задачу для битвы..."
          style={{
            width: "100%", height: "60px", background: "var(--bg-input)", border: "1px solid var(--border-default)",
            borderRadius: "8px", padding: "10px 12px", color: "var(--text-primary)", fontSize: "13px",
            fontFamily: "'SF Mono', monospace", resize: "none", outline: "none",
          }}
        />
        <div style={{ display: "flex", gap: "12px", marginTop: "10px", alignItems: "center" }}>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: "10px", color: currentMode.color, marginBottom: "4px", fontWeight: 600 }}>
              МОДЕЛЬ A
            </div>
            <select
              value={modelA}
              onChange={e => setModelA(e.target.value)}
              style={{
                width: "100%", padding: "8px 10px", background: "var(--bg-input)", border: "1px solid var(--border-default)",
                borderRadius: "6px", color: "var(--text-primary)", fontSize: "12px", outline: "none",
              }}
            >
              {MODELS.map(m => <option key={m} value={m}>{m}</option>)}
            </select>
          </div>
          <div style={{ fontSize: "20px", color: "var(--text-tertiary)", marginTop: "16px" }}>VS</div>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: "10px", color: currentMode.color, marginBottom: "4px", fontWeight: 600 }}>
              МОДЕЛЬ B
            </div>
            <select
              value={modelB}
              onChange={e => setModelB(e.target.value)}
              style={{
                width: "100%", padding: "8px 10px", background: "var(--bg-input)", border: "1px solid var(--border-default)",
                borderRadius: "6px", color: "var(--text-primary)", fontSize: "12px", outline: "none",
              }}
            >
              {MODELS.map(m => <option key={m} value={m}>{m}</option>)}
            </select>
          </div>
          <button
            onClick={handleStart}
            disabled={!prompt.trim() || isRunning}
            style={{
              padding: "10px 20px", borderRadius: "8px", border: "none", cursor: "pointer",
              background: `linear-gradient(135deg, ${currentMode.color}, #6366f1)`,
              color: "#fff", fontSize: "13px", fontWeight: 600, marginTop: "16px",
              opacity: (!prompt.trim() || isRunning) ? 0.5 : 1,
              transition: "opacity 0.2s",
            }}
          >
            {isRunning ? "..." : "Начать битву"}
          </button>
        </div>
      </div>

      {/* Responses split view */}
      <div style={{ flex: 1, display: "flex", overflow: "hidden" }}>
        {/* Model A */}
        <div style={{ flex: 1, borderRight: "1px solid var(--border-default)", display: "flex", flexDirection: "column" }}>
          <div style={{ padding: "10px 16px", borderBottom: "1px solid var(--border-default)", fontSize: "12px", fontWeight: 600, color: mode === "blind" && !voted ? "var(--text-secondary)" : currentMode.color }}>
            {mode === "blind" && !voted ? "Модель 1" : modelA}
          </div>
          <div style={{ flex: 1, padding: "16px", overflowY: "auto", fontSize: "13px", lineHeight: 1.6, color: "var(--text-secondary)" }}>
            {responseA || <span style={{ color: "var(--text-placeholder)" }}>Ожидание ответа...</span>}
          </div>
        </div>
        {/* Model B */}
        <div style={{ flex: 1, display: "flex", flexDirection: "column" }}>
          <div style={{ padding: "10px 16px", borderBottom: "1px solid var(--border-default)", fontSize: "12px", fontWeight: 600, color: mode === "blind" && !voted ? "var(--text-secondary)" : currentMode.color }}>
            {mode === "blind" && !voted ? "Модель 2" : modelB}
          </div>
          <div style={{ flex: 1, padding: "16px", overflowY: "auto", fontSize: "13px", lineHeight: 1.6, color: "var(--text-secondary)" }}>
            {responseB || <span style={{ color: "var(--text-placeholder)" }}>Ожидание ответа...</span>}
          </div>
        </div>
      </div>

      {/* Vote bar */}
      {responseA && responseB && !isRunning && (
        <motion.div
          initial={{ y: 60, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          style={{
            padding: "12px 20px", borderTop: "1px solid var(--border-default)",
            display: "flex", gap: "12px", justifyContent: "center", alignItems: "center",
            background: "var(--bg-input)",
          }}
        >
          {voted ? (
            <div style={{ fontSize: "14px", color: "#22c55e", fontWeight: 600 }}>
              {voted === "draw" ? "Ничья!" : `Победитель: ${voted}`}
              {mode === "blind" && <span style={{ color: "var(--text-secondary)", marginLeft: "8px" }}>({modelA} vs {modelB})</span>}
            </div>
          ) : (
            <>
              <button onClick={() => handleVote(mode === "blind" ? "Модель 1" : modelA)} style={{ padding: "8px 20px", borderRadius: "8px", border: "1px solid #3b82f6", background: "rgba(59,130,246,0.1)", color: "#3b82f6", cursor: "pointer", fontSize: "13px", fontWeight: 600 }}>
                <ThumbsUp size={14} style={{ marginRight: "6px", verticalAlign: "-2px" }} />
                {mode === "blind" ? "Модель 1" : "A лучше"}
              </button>
              <button onClick={() => handleVote("draw")} style={{ padding: "8px 16px", borderRadius: "8px", border: "1px solid var(--text-tertiary)", background: "transparent", color: "var(--text-secondary)", cursor: "pointer", fontSize: "13px" }}>
                <Equal size={14} style={{ marginRight: "4px", verticalAlign: "-2px" }} />
                Ничья
              </button>
              <button onClick={() => handleVote(mode === "blind" ? "Модель 2" : modelB)} style={{ padding: "8px 20px", borderRadius: "8px", border: "1px solid #8b5cf6", background: "rgba(139,92,246,0.1)", color: "#8b5cf6", cursor: "pointer", fontSize: "13px", fontWeight: 600 }}>
                {mode === "blind" ? "Модель 2" : "B лучше"}
                <ThumbsDown size={14} style={{ marginLeft: "6px", verticalAlign: "-2px", transform: "scaleX(-1)" }} />
              </button>
            </>
          )}
        </motion.div>
      )}
    </div>
  );
};
