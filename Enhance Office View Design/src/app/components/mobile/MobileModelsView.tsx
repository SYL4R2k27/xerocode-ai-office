/**
 * MobileModelsView — список подключённых агентов/моделей для мобильной версии.
 * Свайп влево — кнопка удаления, нижние кнопки: Добавить / Пулы.
 */
import { useState, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Plus, Package, Trash2, Bot } from "lucide-react";
import { StatusDot } from "../shared/StatusDot";
import { useSwipe } from "../../hooks/useSwipe";
import type { Agent } from "../../lib/api";

interface MobileModelsViewProps {
  agents: Agent[];
  onAddModel: () => void;
  onRemoveAgent: (id: string) => void;
}

const providerColors: Record<string, string> = {
  openai: "var(--provider-openai)",
  anthropic: "var(--provider-anthropic)",
  ollama: "var(--provider-ollama)",
  custom: "var(--provider-custom)",
  google: "var(--provider-google)",
  groq: "#10b981",
  openrouter: "#8b5cf6",
};

function AgentRow({
  agent,
  onRemove,
}: {
  agent: Agent;
  onRemove: (id: string) => void;
}) {
  const [showDelete, setShowDelete] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const rowRef = useRef<HTMLDivElement>(null);

  useSwipe(rowRef, {
    onSwipeLeft: () => setShowDelete(true),
    onSwipeRight: () => { setShowDelete(false); setConfirmDelete(false); },
  }, 40);

  const color = providerColors[agent.provider] || "var(--text-secondary)";

  const handleDelete = useCallback(() => {
    if (confirmDelete) {
      onRemove(agent.id);
      setShowDelete(false);
      setConfirmDelete(false);
    } else {
      setConfirmDelete(true);
      setTimeout(() => setConfirmDelete(false), 3000);
    }
  }, [confirmDelete, agent.id, onRemove]);

  return (
    <div
      ref={rowRef}
      className="relative overflow-hidden rounded-2xl"
      style={{ touchAction: "pan-y", willChange: "transform" }}
    >
      {/* Красная кнопка удаления (за элементом) */}
      <AnimatePresence>
        {showDelete && (
          <motion.div
            initial={{ opacity: 0, x: 60 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 60 }}
            className="absolute right-0 top-0 bottom-0 flex items-center z-10"
          >
            <button
              onClick={handleDelete}
              className="h-full px-5 flex items-center gap-2 text-[13px] font-medium"
              style={{
                backgroundColor: confirmDelete ? "#DC2626" : "#EF4444",
                color: "#fff",
              }}
            >
              <Trash2 size={16} />
              {confirmDelete ? "Точно?" : "Удалить"}
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Карточка агента */}
      <motion.div
        animate={{ x: showDelete ? -100 : 0 }}
        transition={{ type: "spring", stiffness: 300, damping: 30 }}
        className="flex items-center gap-3 px-4 py-3 relative z-20"
        style={{ backgroundColor: "var(--bg-surface)" }}
        onClick={() => { if (showDelete) { setShowDelete(false); setConfirmDelete(false); } }}
      >
        {/* Аватар */}
        <div
          className="w-10 h-10 rounded-full flex items-center justify-center text-[14px] font-semibold flex-shrink-0"
          style={{
            backgroundColor: `color-mix(in srgb, ${color} 15%, var(--bg-elevated))`,
            color,
          }}
        >
          {agent.avatar || agent.name.charAt(0).toUpperCase()}
        </div>

        {/* Инфо */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span
              className="text-[14px] font-medium truncate"
              style={{ color: "var(--text-primary)" }}
            >
              {agent.name}
            </span>
            <StatusDot status={agent.status} size={7} />
          </div>
          <span
            className="text-[12px] truncate block mt-0.5"
            style={{ color: "var(--text-tertiary)" }}
          >
            {(agent.model_name || "").replace(/^[^/]+\//, "")}
          </span>
        </div>

        {/* Статус */}
        <div
          className="w-2.5 h-2.5 rounded-full flex-shrink-0"
          style={{
            backgroundColor: agent.is_active ? "#22C55E" : "var(--text-tertiary)",
            boxShadow: agent.is_active ? "0 0 6px rgba(34, 197, 94, 0.4)" : "none",
          }}
        />
      </motion.div>
    </div>
  );
}

export function MobileModelsView({
  agents,
  onAddModel,
  onRemoveAgent,
}: MobileModelsViewProps) {
  return (
    <div
      className="flex flex-col h-full"
      style={{
        backgroundColor: "var(--bg-base)",
        paddingBottom: "calc(60px + env(safe-area-inset-bottom, 0px))",
      }}
    >
      {/* Заголовок */}
      <div className="px-4 pt-4 pb-2">
        <h2 className="text-[16px] font-semibold" style={{ color: "var(--text-primary)" }}>
          Модели ({agents.length})
        </h2>
        <p className="text-[13px] mt-0.5" style={{ color: "var(--text-tertiary)" }}>
          Свайп влево для удаления
        </p>
      </div>

      {/* Список агентов */}
      <div className="flex-1 overflow-y-auto px-3">
        {agents.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-64 gap-3">
            <div
              className="w-14 h-14 rounded-2xl flex items-center justify-center"
              style={{ backgroundColor: "var(--bg-surface)" }}
            >
              <Bot size={24} style={{ color: "var(--text-tertiary)" }} />
            </div>
            <p className="text-[15px] font-medium" style={{ color: "var(--text-secondary)" }}>
              Нет моделей
            </p>
            <p className="text-[13px] text-center" style={{ color: "var(--text-tertiary)" }}>
              Подключите первую ИИ-модель
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            {agents.map((agent) => (
              <AgentRow key={agent.id} agent={agent} onRemove={onRemoveAgent} />
            ))}
          </div>
        )}
      </div>

      {/* Нижние кнопки */}
      <div className="px-4 py-3 flex gap-3">
        <button
          onClick={onAddModel}
          className="flex-1 flex items-center justify-center gap-2 py-3 rounded-2xl text-[14px] font-medium transition-all active:scale-[0.98]"
          style={{
            backgroundColor: "var(--accent-blue)",
            color: "#fff",
          }}
        >
          <Plus size={18} />
          Добавить
        </button>
        <button
          className="flex items-center justify-center gap-2 px-5 py-3 rounded-2xl text-[14px] font-medium transition-all active:scale-[0.98]"
          style={{
            backgroundColor: "var(--bg-surface)",
            color: "var(--text-secondary)",
            border: "1px solid var(--border-default)",
          }}
        >
          <Package size={18} />
          Пулы
        </button>
      </div>
    </div>
  );
}
