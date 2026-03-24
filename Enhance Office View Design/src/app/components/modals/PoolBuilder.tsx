import { useState, useEffect } from "react";
import { X, Plus, Trash2, Zap, Loader2 } from "lucide-react";
import { api } from "../../lib/api";
import { toast } from "sonner";

const categories = [
  { id: "code", label: "Код", icon: "💻" },
  { id: "design", label: "Дизайн", icon: "🎨" },
  { id: "research", label: "Ресёрч", icon: "🔍" },
  { id: "text", label: "Текст", icon: "✍️" },
  { id: "custom", label: "Другое", icon: "⚡" },
];

const providerList = [
  { id: "groq", name: "Groq" },
  { id: "openrouter", name: "OpenRouter" },
  { id: "google", name: "Gemini" },
  { id: "openai", name: "OpenAI" },
  { id: "anthropic", name: "Anthropic" },
  { id: "xai", name: "xAI" },
  { id: "ollama", name: "Ollama" },
  { id: "custom", name: "Custom" },
];

const modelsByProvider: Record<string, Array<{ id: string; label: string }>> = {
  groq: [
    { id: "llama-3.3-70b-versatile", label: "Llama 3.3 70B" },
    { id: "llama-3.1-8b-instant", label: "Llama 3.1 8B (быстрая)" },
    { id: "llama-4-scout-17b-16e-instruct", label: "Llama 4 Scout" },
  ],
  openrouter: [
    { id: "google/gemini-2.5-flash-image", label: "Nano Banana (изображения)" },
    { id: "google/gemini-3-pro-image-preview", label: "Nano Banana Pro" },
    { id: "google/gemini-2.5-flash", label: "Gemini 2.5 Flash" },
    { id: "google/gemini-2.5-pro", label: "Gemini 2.5 Pro" },
    { id: "openai/gpt-4o", label: "GPT-4o" },
    { id: "openai/gpt-4.1", label: "GPT-4.1" },
    { id: "openai/gpt-4.1-nano", label: "GPT-4.1 Nano" },
    { id: "anthropic/claude-sonnet-4.6", label: "Claude Sonnet 4.6" },
    { id: "anthropic/claude-haiku-4.5", label: "Claude Haiku 4.5" },
    { id: "x-ai/grok-4.1-fast", label: "Grok 4.1 Fast" },
    { id: "x-ai/grok-4", label: "Grok 4" },
    { id: "google/gemma-3-27b-it:free", label: "Gemma 3 27B (free)" },
    { id: "meta-llama/llama-3.3-70b-instruct:free", label: "Llama 3.3 70B (free)" },
  ],
  google: [
    { id: "gemini-2.5-flash", label: "Gemini 2.5 Flash" },
    { id: "gemini-2.5-pro", label: "Gemini 2.5 Pro" },
    { id: "gemini-2.5-flash-image", label: "Nano Banana" },
  ],
  openai: [
    { id: "gpt-4o", label: "GPT-4o" },
    { id: "gpt-4.1", label: "GPT-4.1" },
    { id: "gpt-4.1-nano", label: "GPT-4.1 Nano" },
    { id: "o3", label: "o3" },
    { id: "o4-mini", label: "o4-mini" },
  ],
  anthropic: [
    { id: "claude-sonnet-4-6", label: "Claude Sonnet 4.6" },
    { id: "claude-haiku-4-5", label: "Claude Haiku 4.5" },
    { id: "claude-opus-4-6", label: "Claude Opus 4.6" },
  ],
  xai: [
    { id: "grok-4", label: "Grok 4" },
    { id: "grok-4.1-fast", label: "Grok 4.1 Fast" },
    { id: "grok-code-fast-1", label: "Grok Code" },
  ],
  ollama: [
    { id: "llama3.1:8b", label: "Llama 3.1 8B" },
    { id: "mistral:7b", label: "Mistral 7B" },
  ],
  custom: [],
};

const skillChips = ["code", "research", "analysis", "design", "image", "text", "planning", "review", "testing"];

interface AgentEntry {
  name: string;
  role: string;
  provider: string;
  model_name: string;
  skills: string[];
  api_key_source: "user" | "platform";
  api_key: string;
}

function emptyAgent(): AgentEntry {
  return { name: "", role: "", provider: "groq", model_name: "llama-3.3-70b-versatile", skills: [], api_key_source: "platform", api_key: "" };
}

interface PoolBuilderProps {
  userPlan: string;
  onClose: () => void;
  onPoolActivated: () => void;
}

export function PoolBuilder({ userPlan, onClose, onPoolActivated }: PoolBuilderProps) {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("code");
  const [agents, setAgents] = useState<AgentEntry[]>([emptyAgent()]);
  const [saving, setSaving] = useState(false);
  const [existingPools, setExistingPools] = useState<any[]>([]);

  const canUsePlatform = ["pro", "ultima", "admin"].includes(userPlan);

  useEffect(() => {
    api.customPools.list().then(setExistingPools).catch(() => {});
  }, []);

  const updateAgent = (idx: number, field: keyof AgentEntry, value: any) => {
    setAgents((prev) => {
      const next = [...prev];
      next[idx] = { ...next[idx], [field]: value };
      return next;
    });
  };

  const toggleSkill = (idx: number, skill: string) => {
    setAgents((prev) => {
      const next = [...prev];
      const skills = next[idx].skills.includes(skill)
        ? next[idx].skills.filter((s) => s !== skill)
        : [...next[idx].skills, skill];
      next[idx] = { ...next[idx], skills };
      return next;
    });
  };

  const addAgent = () => {
    if (agents.length >= 10) return;
    setAgents((prev) => [...prev, emptyAgent()]);
  };

  const removeAgent = (idx: number) => {
    if (agents.length <= 1) return;
    setAgents((prev) => prev.filter((_, i) => i !== idx));
  };

  const handleSave = async (activate: boolean) => {
    if (!name.trim()) { toast.error("Введите название пула"); return; }
    if (agents.some((a) => !a.name.trim())) { toast.error("У каждого агента должно быть имя"); return; }

    setSaving(true);
    try {
      const pool = await api.customPools.create({
        name, description, category,
        agents_config: agents.map((a) => ({
          name: a.name, role: a.role, provider: a.provider,
          model_name: a.model_name, skills: a.skills,
          api_key_source: a.api_key_source,
          api_key: a.api_key_source === "user" ? a.api_key : undefined,
        })),
      });
      toast.success("Пул создан!");
      if (activate && pool?.id) {
        await api.customPools.activate(pool.id);
        toast.success("Пул активирован — агенты добавлены!");
        onPoolActivated();
      }
      onClose();
    } catch (e: any) {
      toast.error(e?.message || "Ошибка создания пула");
    } finally {
      setSaving(false);
    }
  };

  const handleActivateExisting = async (poolId: string) => {
    try {
      await api.customPools.activate(poolId);
      toast.success("Пул активирован!");
      onPoolActivated();
    } catch (e: any) {
      toast.error(e?.message || "Ошибка активации");
    }
  };

  const handleDeleteExisting = async (poolId: string) => {
    try {
      await api.customPools.delete(poolId);
      setExistingPools((prev) => prev.filter((p) => p.id !== poolId));
      toast.success("Пул удалён");
    } catch {
      toast.error("Ошибка удаления");
    }
  };

  return (
    <div className="space-y-4 max-h-[70vh] overflow-y-auto pr-1">
      {/* Existing pools */}
      {existingPools.length > 0 && (
        <div className="space-y-2">
          <span className="text-[11px] font-semibold uppercase tracking-wider" style={{ color: "var(--text-tertiary)" }}>
            Мои пулы
          </span>
          {existingPools.map((pool) => (
            <div
              key={pool.id}
              className="flex items-center justify-between px-3 py-2 rounded-lg"
              style={{ backgroundColor: "var(--bg-elevated)", border: "1px solid var(--border-subtle)" }}
            >
              <div>
                <span className="text-[13px] font-medium" style={{ color: "var(--text-primary)" }}>{pool.name}</span>
                <span className="text-[10px] ml-2" style={{ color: "var(--text-tertiary)" }}>
                  {pool.agents_config?.length || 0} агентов
                </span>
              </div>
              <div className="flex gap-1">
                <button onClick={() => handleActivateExisting(pool.id)} className="px-2 py-1 rounded text-[11px] hover:bg-white/10 transition-colors" style={{ color: "var(--accent-teal)" }}>
                  <Zap size={12} className="inline mr-1" />Запустить
                </button>
                <button onClick={() => handleDeleteExisting(pool.id)} className="px-1 py-1 rounded hover:bg-red-500/20 transition-colors">
                  <Trash2 size={12} style={{ color: "var(--text-tertiary)" }} />
                </button>
              </div>
            </div>
          ))}
          <div className="my-3" style={{ borderBottom: "1px solid var(--border-subtle)" }} />
        </div>
      )}

      {/* New pool form */}
      <div className="space-y-3">
        <input
          value={name} onChange={(e) => setName(e.target.value)}
          placeholder="Название пула..."
          className="w-full px-3 py-2 rounded-lg text-[13px] outline-none"
          style={{ backgroundColor: "var(--bg-input)", border: "1px solid var(--border-default)", color: "var(--text-primary)" }}
        />
        <input
          value={description} onChange={(e) => setDescription(e.target.value)}
          placeholder="Описание (необязательно)"
          className="w-full px-3 py-2 rounded-lg text-[13px] outline-none"
          style={{ backgroundColor: "var(--bg-input)", border: "1px solid var(--border-default)", color: "var(--text-primary)" }}
        />

        {/* Category */}
        <div className="flex gap-1.5 flex-wrap">
          {categories.map((cat) => (
            <button
              key={cat.id}
              onClick={() => setCategory(cat.id)}
              className={`px-3 py-1.5 rounded-lg text-[12px] transition-colors ${category === cat.id ? "ring-1" : ""}`}
              style={{
                backgroundColor: category === cat.id ? "var(--bg-elevated)" : "var(--bg-input)",
                color: category === cat.id ? "var(--text-primary)" : "var(--text-tertiary)",
                borderColor: category === cat.id ? "var(--accent-blue)" : "var(--border-subtle)",
                border: "1px solid",
              }}
            >
              {cat.icon} {cat.label}
            </button>
          ))}
        </div>
      </div>

      {/* Agents */}
      <div className="space-y-3">
        <span className="text-[11px] font-semibold uppercase tracking-wider" style={{ color: "var(--text-tertiary)" }}>
          Агенты команды ({agents.length}/10)
        </span>

        {agents.map((agent, idx) => (
          <div
            key={idx}
            className="rounded-xl p-3 space-y-2"
            style={{ backgroundColor: "var(--bg-elevated)", border: "1px solid var(--border-subtle)" }}
          >
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-medium" style={{ color: "var(--text-tertiary)" }}>Агент {idx + 1}</span>
              {agents.length > 1 && (
                <button onClick={() => removeAgent(idx)} className="p-1 rounded hover:bg-red-500/20">
                  <X size={12} style={{ color: "var(--text-tertiary)" }} />
                </button>
              )}
            </div>

            <div className="grid grid-cols-2 gap-2">
              <input value={agent.name} onChange={(e) => updateAgent(idx, "name", e.target.value)} placeholder="Имя" className="px-2 py-1.5 rounded text-[12px] outline-none" style={{ backgroundColor: "var(--bg-input)", border: "1px solid var(--border-default)", color: "var(--text-primary)" }} />
              <input value={agent.role} onChange={(e) => updateAgent(idx, "role", e.target.value)} placeholder="Роль" className="px-2 py-1.5 rounded text-[12px] outline-none" style={{ backgroundColor: "var(--bg-input)", border: "1px solid var(--border-default)", color: "var(--text-primary)" }} />
            </div>

            <div className="grid grid-cols-2 gap-2">
              <select value={agent.provider} onChange={(e) => { updateAgent(idx, "provider", e.target.value); const models = modelsByProvider[e.target.value]; if (models?.[0]) updateAgent(idx, "model_name", models[0].id); }} className="px-2 py-1.5 rounded text-[12px] outline-none" style={{ backgroundColor: "var(--bg-input)", border: "1px solid var(--border-default)", color: "var(--text-primary)" }}>
                {providerList.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
              </select>
              <select value={agent.model_name} onChange={(e) => updateAgent(idx, "model_name", e.target.value)} className="px-2 py-1.5 rounded text-[12px] outline-none" style={{ backgroundColor: "var(--bg-input)", border: "1px solid var(--border-default)", color: "var(--text-primary)" }}>
                {(modelsByProvider[agent.provider] || []).map((m) => <option key={m.id} value={m.id}>{m.label}</option>)}
                <option value="">Другая...</option>
              </select>
            </div>

            {/* Skills */}
            <div className="flex gap-1 flex-wrap">
              {skillChips.map((skill) => (
                <button
                  key={skill} onClick={() => toggleSkill(idx, skill)}
                  className="px-2 py-0.5 rounded text-[10px] transition-colors"
                  style={{
                    backgroundColor: agent.skills.includes(skill) ? "color-mix(in srgb, var(--accent-blue) 20%, transparent)" : "var(--bg-input)",
                    color: agent.skills.includes(skill) ? "var(--accent-blue)" : "var(--text-tertiary)",
                    border: `1px solid ${agent.skills.includes(skill) ? "var(--accent-blue)" : "var(--border-subtle)"}`,
                  }}
                >
                  {skill}
                </button>
              ))}
            </div>

            {/* API Key Source */}
            <div className="flex items-center gap-3">
              <label className="flex items-center gap-1.5 cursor-pointer">
                <input type="radio" checked={agent.api_key_source === "platform"} onChange={() => updateAgent(idx, "api_key_source", "platform")} className="accent-purple-500" />
                <span className="text-[11px]" style={{ color: canUsePlatform ? "var(--text-secondary)" : "var(--text-tertiary)" }}>
                  Платформа {!canUsePlatform && "(PRO)"}
                </span>
              </label>
              <label className="flex items-center gap-1.5 cursor-pointer">
                <input type="radio" checked={agent.api_key_source === "user"} onChange={() => updateAgent(idx, "api_key_source", "user")} className="accent-purple-500" />
                <span className="text-[11px]" style={{ color: "var(--text-secondary)" }}>Свой ключ</span>
              </label>
            </div>

            {agent.api_key_source === "user" && (
              <input
                type="password" value={agent.api_key}
                onChange={(e) => updateAgent(idx, "api_key", e.target.value)}
                placeholder="API ключ..."
                className="w-full px-2 py-1.5 rounded text-[12px] outline-none"
                style={{ backgroundColor: "var(--bg-input)", border: "1px solid var(--border-default)", color: "var(--text-primary)" }}
              />
            )}
          </div>
        ))}

        {agents.length < 10 && (
          <button onClick={addAgent} className="w-full flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg text-[12px] transition-colors hover:bg-white/5" style={{ color: "var(--text-tertiary)", border: "1px dashed var(--border-default)" }}>
            <Plus size={14} /> Добавить агента
          </button>
        )}
      </div>

      {/* Actions */}
      <div className="flex gap-2 pt-2">
        <button
          onClick={() => handleSave(false)} disabled={saving}
          className="flex-1 px-4 py-2.5 rounded-lg text-[13px] font-medium transition-colors hover:bg-white/5 disabled:opacity-50"
          style={{ border: "1px solid var(--border-default)", color: "var(--text-secondary)" }}
        >
          Сохранить
        </button>
        <button
          onClick={() => handleSave(true)} disabled={saving}
          className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg text-[13px] font-medium text-white transition-all hover:brightness-110 disabled:opacity-50"
          style={{ background: "linear-gradient(135deg, var(--accent-blue), #8b5cf6)" }}
        >
          {saving ? <Loader2 size={14} className="animate-spin" /> : <Zap size={14} />}
          {saving ? "Создание..." : "Сохранить и запустить"}
        </button>
      </div>
    </div>
  );
}
