import { Plus, X } from "lucide-react";
import { useState } from "react";
import { StatusDot } from "../shared/StatusDot";
import { ProviderBadge } from "../shared/ProviderBadge";
import type { Agent } from "../../lib/api";

const providerColors: Record<string, string> = {
  openai: "var(--provider-openai)",
  anthropic: "var(--provider-anthropic)",
  ollama: "var(--provider-ollama)",
  custom: "var(--provider-custom)",
  google: "var(--provider-google)",
  groq: "#10b981",
  openrouter: "#8b5cf6",
};

interface ModelListProps {
  agents: Agent[];
  onAddModel: () => void;
  onRemoveAgent?: (agentId: string) => void;
  isAdmin?: boolean;
}

export function ModelList({ agents, onAddModel, onRemoveAgent, isAdmin }: ModelListProps) {
  const [hoveredId, setHoveredId] = useState<string | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);

  const handleDelete = (agentId: string) => {
    if (confirmDelete === agentId) {
      onRemoveAgent?.(agentId);
      setConfirmDelete(null);
    } else {
      setConfirmDelete(agentId);
      setTimeout(() => setConfirmDelete(null), 3000);
    }
  };

  return (
    <div className="px-3 py-2">
      <div className="flex items-center justify-between mb-2">
        <span className="text-[11px] font-semibold uppercase tracking-wider" style={{ color: "var(--text-tertiary)" }}>
          Модели
        </span>
        <span className="text-[11px]" style={{ color: "var(--text-tertiary)" }}>
          {agents.length}
        </span>
      </div>

      <div className="space-y-0.5">
        {agents.map((agent) => {
          const color = providerColors[agent.provider] || "var(--text-secondary)";
          return (
            <div
              key={agent.id}
              className="group flex items-center gap-2.5 px-2 py-1.5 rounded-lg hover:bg-white/5 transition-colors cursor-default"
              onMouseEnter={() => setHoveredId(agent.id)}
              onMouseLeave={() => setHoveredId(null)}
            >
              {/* Avatar */}
              <div
                className="w-7 h-7 rounded-full flex items-center justify-center text-[11px] font-medium flex-shrink-0"
                style={{ backgroundColor: `color-mix(in srgb, ${color} 15%, var(--bg-elevated))`, color }}
              >
                {agent.avatar || agent.name.charAt(0).toUpperCase()}
              </div>

              {/* Info */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5">
                  <span className="text-[12px] font-medium truncate" style={{ color: "var(--text-primary)" }}>
                    {agent.name}
                  </span>
                  <StatusDot status={agent.status} size={6} />
                  <ProviderBadge provider={agent.provider} />
                </div>
                <span className="text-[10px] truncate block" style={{ color: "var(--text-tertiary)" }}>
                  {agent.model_name}
                </span>
              </div>

              {/* Delete or Cost (admin only) */}
              {hoveredId === agent.id && onRemoveAgent ? (
                <button
                  onClick={(e) => { e.stopPropagation(); handleDelete(agent.id); }}
                  className="w-5 h-5 rounded flex items-center justify-center flex-shrink-0 transition-colors hover:bg-red-500/20"
                  title={confirmDelete === agent.id ? "Нажми ещё раз для удаления" : "Удалить"}
                >
                  <X size={12} style={{ color: confirmDelete === agent.id ? "#ef4444" : "var(--text-tertiary)" }} />
                </button>
              ) : isAdmin && agent.total_cost_usd > 0 ? (
                <span className="text-[10px] flex-shrink-0" style={{ color: "var(--accent-amber)" }}>
                  ${agent.total_cost_usd.toFixed(3)}
                </span>
              ) : null}
            </div>
          );
        })}
      </div>

      {/* Add button */}
      <button
        onClick={onAddModel}
        className="w-full flex items-center gap-2 px-2 py-2 mt-1 rounded-lg text-[12px] transition-colors hover:bg-white/5"
        style={{ color: "var(--text-tertiary)", border: "1px dashed var(--border-default)" }}
      >
        <Plus size={14} />
        Подключить модель
      </button>
    </div>
  );
}
