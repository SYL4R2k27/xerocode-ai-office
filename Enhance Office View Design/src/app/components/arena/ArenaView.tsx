import React, { useState, useCallback } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  Swords, Trophy, Eye, Zap, ThumbsUp, ThumbsDown, Equal,
  Plus, X, Shuffle, Loader2, Bot,
} from "lucide-react";

type ArenaMode = "duel" | "evolution" | "tournament" | "blind";

interface ArenaViewProps {
  onStartBattle?: (prompt: string, modelA: string, modelB: string, mode: ArenaMode) => void;
}

const MODES: { id: ArenaMode; label: string; icon: any; desc: string; color: string; maxModels: number }[] = [
  { id: "duel", label: "Дуэль", icon: Swords, desc: "2 модели, 1 задача, вы судья", color: "var(--accent-blue)", maxModels: 2 },
  { id: "evolution", label: "Эволюция", icon: Zap, desc: "Модели улучшают ответы друг друга цепочкой", color: "var(--accent-lavender)", maxModels: 10 },
  { id: "tournament", label: "Турнир", icon: Trophy, desc: "До 10 моделей, bracket-система", color: "var(--accent-amber)", maxModels: 10 },
  { id: "blind", label: "Слепой тест", icon: Eye, desc: "Имена скрыты до голосования", color: "var(--accent-green)", maxModels: 10 },
];

const ALL_MODELS = [
  { id: "gpt-5.4", provider: "OpenAI", color: "var(--provider-openai)" },
  { id: "gpt-5", provider: "OpenAI", color: "var(--provider-openai)" },
  { id: "gpt-4o", provider: "OpenAI", color: "var(--provider-openai)" },
  { id: "claude-opus-4.6", provider: "Anthropic", color: "var(--provider-anthropic)" },
  { id: "claude-sonnet-4.6", provider: "Anthropic", color: "var(--provider-anthropic)" },
  { id: "gemini-2.5-pro", provider: "Google", color: "var(--provider-google)" },
  { id: "gemini-2.5-flash", provider: "Google", color: "var(--provider-google)" },
  { id: "grok-4", provider: "xAI", color: "var(--provider-xai)" },
  { id: "llama-3.3-70b", provider: "Meta", color: "var(--provider-meta)" },
  { id: "deepseek-v3", provider: "DeepSeek", color: "var(--provider-deepseek)" },
  { id: "qwen3-coder", provider: "Qwen", color: "var(--accent-teal)" },
  { id: "mistral-large", provider: "Mistral", color: "var(--provider-mistral)" },
];

export const ArenaView: React.FC<ArenaViewProps> = ({ onStartBattle }) => {
  const [mode, setMode] = useState<ArenaMode>("duel");
  const [prompt, setPrompt] = useState("");
  const [selectedModels, setSelectedModels] = useState<string[]>(["gpt-5.4", "claude-opus-4.6"]);
  const [responses, setResponses] = useState<Record<string, string>>({});
  const [voted, setVoted] = useState<string | null>(null);
  const [isRunning, setIsRunning] = useState(false);
  const [revealed, setRevealed] = useState(false);

  const currentMode = MODES.find(m => m.id === mode)!;
  const isBlind = mode === "blind";

  const addModel = useCallback(() => {
    if (selectedModels.length >= currentMode.maxModels) return;
    const available = ALL_MODELS.filter(m => !selectedModels.includes(m.id));
    if (available.length > 0) {
      setSelectedModels(prev => [...prev, available[0].id]);
    }
  }, [selectedModels, currentMode.maxModels]);

  const removeModel = useCallback((idx: number) => {
    if (selectedModels.length <= 2) return;
    setSelectedModels(prev => prev.filter((_, i) => i !== idx));
  }, [selectedModels.length]);

  const randomizeModels = useCallback(() => {
    const shuffled = [...ALL_MODELS].sort(() => Math.random() - 0.5);
    setSelectedModels(shuffled.slice(0, currentMode.maxModels === 2 ? 2 : Math.min(4, currentMode.maxModels)).map(m => m.id));
  }, [currentMode.maxModels]);

  const handleStart = useCallback(() => {
    if (!prompt.trim() || selectedModels.length < 2) return;
    setIsRunning(true);
    setResponses({});
    setVoted(null);
    setRevealed(false);

    onStartBattle?.(prompt, selectedModels[0], selectedModels[1], mode);

    // Simulate responses
    selectedModels.forEach((model, i) => {
      setTimeout(() => {
        setResponses(prev => ({ ...prev, [model]: `Ответ от ${isBlind ? `Модель ${i + 1}` : model} загружается с сервера...` }));
        if (i === selectedModels.length - 1) setIsRunning(false);
      }, 1000 + i * 800);
    });
  }, [prompt, selectedModels, mode, isBlind, onStartBattle]);

  const handleVote = useCallback((winner: string) => {
    setVoted(winner);
    if (isBlind) setRevealed(true);
  }, [isBlind]);

  const allResponded = selectedModels.every(m => responses[m]);

  return (
    <div className="h-full flex flex-col" style={{ backgroundColor: "var(--bg-base)" }}>
      {/* Mode selector */}
      <div className="flex gap-2 p-3 flex-shrink-0" style={{ borderBottom: "1px solid var(--border-default)" }}>
        {MODES.map(m => {
          const Icon = m.icon;
          const active = mode === m.id;
          return (
            <motion.button
              key={m.id}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => { setMode(m.id); setResponses({}); setVoted(null); setRevealed(false); if (m.maxModels === 2 && selectedModels.length > 2) setSelectedModels(prev => prev.slice(0, 2)); }}
              className="flex-1 flex flex-col items-center gap-1 py-2.5 rounded-lg text-xs font-medium transition-all"
              style={{
                backgroundColor: active ? m.color : "var(--bg-surface)",
                color: active ? "#fff" : "var(--text-secondary)",
                border: `1px solid ${active ? m.color : "var(--border-default)"}`,
              }}
            >
              <Icon size={16} />
              {m.label}
            </motion.button>
          );
        })}
      </div>

      {/* Config area */}
      <div className="p-4 flex-shrink-0" style={{ borderBottom: "1px solid var(--border-default)" }}>
        <div className="text-[10px] uppercase font-semibold mb-2" style={{ color: currentMode.color }}>
          {currentMode.desc}
        </div>

        <textarea
          value={prompt}
          onChange={e => setPrompt(e.target.value)}
          placeholder="Введите задачу для битвы..."
          className="w-full rounded-lg px-3 py-2.5 text-sm outline-none resize-none mb-3"
          rows={2}
          style={{ backgroundColor: "var(--bg-surface)", border: "1px solid var(--border-default)", color: "var(--text-primary)" }}
        />

        {/* Model selectors */}
        <div className="flex items-center gap-2 mb-3 flex-wrap">
          {selectedModels.map((modelId, idx) => {
            const model = ALL_MODELS.find(m => m.id === modelId);
            return (
              <div key={idx} className="flex items-center gap-1.5">
                {isBlind && !revealed ? (
                  <div className="px-3 py-1.5 rounded-lg text-xs font-medium flex items-center gap-1.5" style={{ backgroundColor: "var(--bg-elevated)", color: "var(--text-secondary)", border: "1px solid var(--border-default)" }}>
                    <Eye size={12} />
                    Модель {idx + 1}
                  </div>
                ) : (
                  <select
                    value={modelId}
                    onChange={e => setSelectedModels(prev => prev.map((m, i) => i === idx ? e.target.value : m))}
                    className="px-2.5 py-1.5 rounded-lg text-xs outline-none"
                    style={{ backgroundColor: "var(--bg-surface)", border: "1px solid var(--border-default)", color: "var(--text-primary)" }}
                  >
                    {ALL_MODELS.map(m => <option key={m.id} value={m.id}>{m.id}</option>)}
                  </select>
                )}
                {selectedModels.length > 2 && (
                  <button onClick={() => removeModel(idx)} className="p-0.5 rounded" style={{ color: "var(--text-tertiary)" }}>
                    <X size={12} />
                  </button>
                )}
                {idx < selectedModels.length - 1 && (
                  <span className="text-[10px] font-bold" style={{ color: "var(--text-tertiary)" }}>VS</span>
                )}
              </div>
            );
          })}

          {selectedModels.length < currentMode.maxModels && (
            <button onClick={addModel} className="p-1.5 rounded-lg" style={{ backgroundColor: "var(--bg-elevated)", color: "var(--text-tertiary)", border: "1px solid var(--border-default)" }}>
              <Plus size={14} />
            </button>
          )}

          <button onClick={randomizeModels} className="p-1.5 rounded-lg ml-1" style={{ color: "var(--text-tertiary)" }} title="Случайный набор">
            <Shuffle size={14} />
          </button>
        </div>

        <div className="flex items-center gap-2">
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={handleStart}
            disabled={!prompt.trim() || isRunning || selectedModels.length < 2}
            className="px-5 py-2 rounded-lg text-sm font-semibold disabled:opacity-40 flex items-center gap-2"
            style={{ background: `linear-gradient(135deg, ${currentMode.color}, var(--accent-lavender))`, color: "#fff" }}
          >
            {isRunning ? <Loader2 size={14} className="animate-spin" /> : <Swords size={14} />}
            {isRunning ? "Идёт битва..." : "Начать битву"}
          </motion.button>
          <span className="text-[10px]" style={{ color: "var(--text-tertiary)" }}>
            {selectedModels.length} {selectedModels.length === 2 ? "модели" : selectedModels.length <= 4 ? "модели" : "моделей"}
          </span>
        </div>
      </div>

      {/* Responses */}
      <div className="flex-1 flex overflow-hidden">
        {selectedModels.map((modelId, idx) => {
          const model = ALL_MODELS.find(m => m.id === modelId);
          const response = responses[modelId];
          const displayName = isBlind && !revealed ? `Модель ${idx + 1}` : modelId;
          const isWinner = voted === displayName || voted === modelId;

          return (
            <div
              key={idx}
              className="flex-1 flex flex-col min-w-0"
              style={{ borderRight: idx < selectedModels.length - 1 ? "1px solid var(--border-default)" : undefined }}
            >
              {/* Header */}
              <div className="flex items-center gap-2 px-3 py-2 flex-shrink-0" style={{ borderBottom: "1px solid var(--border-subtle)" }}>
                <Bot size={12} style={{ color: isBlind && !revealed ? "var(--text-tertiary)" : (model?.color || "var(--text-secondary)") }} />
                <span className="text-xs font-semibold truncate" style={{ color: isBlind && !revealed ? "var(--text-secondary)" : "var(--text-primary)" }}>
                  {displayName}
                </span>
                {!isBlind && model && (
                  <span className="text-[9px]" style={{ color: "var(--text-tertiary)" }}>{model.provider}</span>
                )}
                {isWinner && (
                  <span className="text-[9px] px-1.5 py-0.5 rounded-full ml-auto" style={{ backgroundColor: "rgba(52,211,153,0.15)", color: "var(--accent-green)" }}>
                    Победитель
                  </span>
                )}
              </div>

              {/* Content */}
              <div className="flex-1 p-3 overflow-y-auto text-sm leading-relaxed" style={{ color: "var(--text-secondary)" }}>
                {response || (
                  <div className="flex items-center gap-2 h-full justify-center" style={{ color: "var(--text-placeholder)" }}>
                    <span className="text-xs">Ожидание ответа...</span>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Vote bar */}
      <AnimatePresence>
        {allResponded && !isRunning && (
          <motion.div
            initial={{ y: 60, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 60, opacity: 0 }}
            className="flex items-center justify-center gap-3 p-3 flex-shrink-0"
            style={{ borderTop: "1px solid var(--border-default)", backgroundColor: "var(--bg-surface)" }}
          >
            {voted ? (
              <div className="flex items-center gap-2">
                <span className="text-sm font-semibold" style={{ color: "var(--accent-green)" }}>
                  {voted === "draw" ? "Ничья!" : `Победитель: ${voted}`}
                </span>
                {isBlind && revealed && (
                  <span className="text-xs" style={{ color: "var(--text-tertiary)" }}>
                    ({selectedModels.join(" vs ")})
                  </span>
                )}
              </div>
            ) : (
              <>
                {selectedModels.map((modelId, idx) => {
                  const displayName = isBlind ? `Модель ${idx + 1}` : modelId;
                  return (
                    <motion.button
                      key={idx}
                      whileHover={{ scale: 1.03 }}
                      whileTap={{ scale: 0.97 }}
                      onClick={() => handleVote(displayName)}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold"
                      style={{
                        backgroundColor: `color-mix(in srgb, ${currentMode.color} 10%, transparent)`,
                        color: currentMode.color,
                        border: `1px solid color-mix(in srgb, ${currentMode.color} 25%, transparent)`,
                      }}
                    >
                      <ThumbsUp size={12} />
                      {displayName}
                    </motion.button>
                  );
                })}
                <button
                  onClick={() => handleVote("draw")}
                  className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs"
                  style={{ color: "var(--text-secondary)", border: "1px solid var(--border-default)" }}
                >
                  <Equal size={12} /> Ничья
                </button>
              </>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
