import { motion } from "motion/react";
import { X, Plus, Trash2, TestTube, Check, AlertCircle } from "lucide-react";
import { useState } from "react";
import type { Agent, AgentCreate } from "../lib/api";
import { api } from "../lib/api";

interface SettingsPanelProps {
  agents: Agent[];
  onAddAgent: (data: AgentCreate) => Promise<Agent>;
  onRemoveAgent: (id: string) => Promise<void>;
  onClose: () => void;
}

const PROVIDERS = [
  { value: "openai", label: "OpenAI (GPT)", icon: "🟢", placeholder: "sk-..." },
  { value: "anthropic", label: "Anthropic (Claude)", icon: "🟠", placeholder: "sk-ant-..." },
  { value: "ollama", label: "Ollama (Локально)", icon: "🔵", placeholder: "Ключ не нужен" },
  { value: "custom", label: "Свой API", icon: "🟣", placeholder: "API ключ..." },
];

const SKILL_OPTIONS = ["код", "исследование", "анализ", "дизайн", "текст", "планирование", "управление"];

export function SettingsPanel({ agents, onAddAgent, onRemoveAgent, onClose }: SettingsPanelProps) {
  const [showAdd, setShowAdd] = useState(false);
  const [testing, setTesting] = useState<string | null>(null);
  const [testResult, setTestResult] = useState<Record<string, "ok" | "fail">>({});

  // New agent form
  const [form, setForm] = useState({
    name: "",
    role: "",
    avatar: "🤖",
    provider: "openai" as "openai" | "anthropic" | "ollama" | "custom",
    model_name: "",
    api_key: "",
    base_url: "",
    skills: [] as string[],
  });

  const handleAdd = async () => {
    if (!form.name || !form.model_name) return;

    const data: AgentCreate = {
      name: form.name,
      role: form.role || form.name,
      avatar: form.avatar,
      provider: form.provider,
      model_name: form.model_name,
      skills: form.skills.length > 0 ? form.skills : undefined,
    };

    if (form.api_key) data.api_key = form.api_key;
    if (form.base_url) data.base_url = form.base_url;

    try {
      await onAddAgent(data);
      setForm({ name: "", role: "", avatar: "🤖", provider: "openai", model_name: "", api_key: "", base_url: "", skills: [] });
      setShowAdd(false);
    } catch (e) {
      console.error("Failed to add agent:", e);
    }
  };

  const handleTest = async (agentId: string) => {
    setTesting(agentId);
    try {
      const result = await api.agents.test(agentId);
      setTestResult((prev) => ({ ...prev, [agentId]: result.status === "ok" ? "ok" : "fail" }));
    } catch {
      setTestResult((prev) => ({ ...prev, [agentId]: "fail" }));
    } finally {
      setTesting(null);
    }
  };

  const toggleSkill = (skill: string) => {
    setForm((prev) => ({
      ...prev,
      skills: prev.skills.includes(skill)
        ? prev.skills.filter((s) => s !== skill)
        : [...prev.skills, skill],
    }));
  };

  const modelSuggestions: Record<string, string[]> = {
    openai: ["gpt-4", "gpt-4o", "gpt-4o-mini", "gpt-3.5-turbo"],
    anthropic: ["claude-sonnet-4-20250514", "claude-3-5-sonnet-20241022", "claude-3-haiku-20240307"],
    ollama: ["llama3", "mistral", "codellama", "gemma2"],
    custom: ["default"],
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <motion.div
        initial={{ scale: 0.9, y: 20 }}
        animate={{ scale: 1, y: 0 }}
        className="bg-[#1A1A1F] rounded-2xl border border-white/10 w-full max-w-2xl max-h-[80vh] overflow-hidden flex flex-col"
      >
        {/* Header */}
        <div className="p-6 border-b border-white/5 flex items-center justify-between">
          <div>
            <h2 className="text-white font-semibold text-lg">Настройки</h2>
            <p className="text-gray-400 text-sm">Подключи свои ИИ-модели</p>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-white transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          {/* Existing agents */}
          {agents.map((agent) => (
            <div key={agent.id} className="bg-[#0F0F12] rounded-xl p-4 border border-white/5 flex items-center gap-4">
              <span className="text-2xl">{agent.avatar || "🤖"}</span>
              <div className="flex-1">
                <div className="text-white font-medium text-sm">{agent.name}</div>
                <div className="text-gray-400 text-xs">{agent.provider} / {agent.model_name}</div>
                <div className="flex gap-1 mt-1">
                  {agent.skills?.map((s) => (
                    <span key={s} className="text-[10px] bg-purple-500/10 text-purple-400 px-1.5 py-0.5 rounded">
                      {s}
                    </span>
                  ))}
                </div>
              </div>

              {/* Test button */}
              <button
                onClick={() => handleTest(agent.id)}
                disabled={testing === agent.id}
                className="text-gray-400 hover:text-blue-400 transition-colors"
              >
                {testing === agent.id ? (
                  <div className="w-4 h-4 border-2 border-blue-400/30 border-t-blue-400 rounded-full animate-spin" />
                ) : testResult[agent.id] === "ok" ? (
                  <Check className="w-4 h-4 text-green-400" />
                ) : testResult[agent.id] === "fail" ? (
                  <AlertCircle className="w-4 h-4 text-red-400" />
                ) : (
                  <TestTube className="w-4 h-4" />
                )}
              </button>

              {/* Delete button */}
              <button
                onClick={() => onRemoveAgent(agent.id)}
                className="text-gray-400 hover:text-red-400 transition-colors"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          ))}

          {/* Add new agent form */}
          {showAdd ? (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-[#0F0F12] rounded-xl p-5 border border-purple-500/20 space-y-4"
            >
              <h3 className="text-white font-medium text-sm">Подключить новую модель</h3>

              {/* Provider selection */}
              <div className="grid grid-cols-4 gap-2">
                {PROVIDERS.map((p) => (
                  <button
                    key={p.value}
                    onClick={() => setForm((prev) => ({ ...prev, provider: p.value as any, model_name: "" }))}
                    className={`p-2 rounded-xl border text-center text-xs transition-all ${
                      form.provider === p.value
                        ? "border-purple-500 bg-purple-500/10 text-white"
                        : "border-white/10 text-gray-400 hover:border-white/20"
                    }`}
                  >
                    <div className="text-lg mb-1">{p.icon}</div>
                    {p.label}
                  </button>
                ))}
              </div>

              {/* Name + Role */}
              <div className="grid grid-cols-2 gap-3">
                <input
                  value={form.name}
                  onChange={(e) => setForm((prev) => ({ ...prev, name: e.target.value }))}
                  placeholder="Имя (напр. Аналитик)"
                  className="bg-[#1A1A1F] border border-white/10 rounded-xl px-3 py-2 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-purple-500/50"
                />
                <input
                  value={form.role}
                  onChange={(e) => setForm((prev) => ({ ...prev, role: e.target.value }))}
                  placeholder="Роль (напр. Дата-аналитик)"
                  className="bg-[#1A1A1F] border border-white/10 rounded-xl px-3 py-2 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-purple-500/50"
                />
              </div>

              {/* Model name */}
              <div>
                <div className="flex gap-2 mb-2">
                  {modelSuggestions[form.provider]?.map((m) => (
                    <button
                      key={m}
                      onClick={() => setForm((prev) => ({ ...prev, model_name: m }))}
                      className={`text-[10px] px-2 py-1 rounded-lg border transition-all ${
                        form.model_name === m
                          ? "border-purple-500 bg-purple-500/10 text-purple-400"
                          : "border-white/10 text-gray-400 hover:border-white/20"
                      }`}
                    >
                      {m}
                    </button>
                  ))}
                </div>
                <input
                  value={form.model_name}
                  onChange={(e) => setForm((prev) => ({ ...prev, model_name: e.target.value }))}
                  placeholder="Название модели"
                  className="w-full bg-[#1A1A1F] border border-white/10 rounded-xl px-3 py-2 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-purple-500/50"
                />
              </div>

              {/* API Key */}
              {form.provider !== "ollama" && (
                <input
                  type="password"
                  value={form.api_key}
                  onChange={(e) => setForm((prev) => ({ ...prev, api_key: e.target.value }))}
                  placeholder={PROVIDERS.find((p) => p.value === form.provider)?.placeholder}
                  className="w-full bg-[#1A1A1F] border border-white/10 rounded-xl px-3 py-2 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-purple-500/50"
                />
              )}

              {/* Base URL for Ollama/Custom */}
              {(form.provider === "ollama" || form.provider === "custom") && (
                <input
                  value={form.base_url}
                  onChange={(e) => setForm((prev) => ({ ...prev, base_url: e.target.value }))}
                  placeholder={form.provider === "ollama" ? "http://localhost:11434" : "https://your-api.com/v1"}
                  className="w-full bg-[#1A1A1F] border border-white/10 rounded-xl px-3 py-2 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-purple-500/50"
                />
              )}

              {/* Skills */}
              <div>
                <p className="text-xs text-gray-400 mb-2">Навыки</p>
                <div className="flex flex-wrap gap-1.5">
                  {SKILL_OPTIONS.map((skill) => (
                    <button
                      key={skill}
                      onClick={() => toggleSkill(skill)}
                      className={`text-xs px-2.5 py-1 rounded-lg border transition-all ${
                        form.skills.includes(skill)
                          ? "border-purple-500 bg-purple-500/10 text-purple-400"
                          : "border-white/10 text-gray-400 hover:border-white/20"
                      }`}
                    >
                      {skill}
                    </button>
                  ))}
                </div>
              </div>

              {/* Actions */}
              <div className="flex gap-2">
                <button
                  onClick={handleAdd}
                  disabled={!form.name || !form.model_name}
                  className="flex-1 bg-purple-600 hover:bg-purple-500 disabled:bg-gray-600 text-white rounded-xl px-4 py-2 text-sm font-medium transition-colors"
                >
                  Подключить
                </button>
                <button
                  onClick={() => setShowAdd(false)}
                  className="px-4 py-2 text-gray-400 hover:text-white transition-colors text-sm"
                >
                  Отмена
                </button>
              </div>
            </motion.div>
          ) : (
            <motion.button
              onClick={() => setShowAdd(true)}
              className="w-full bg-[#0F0F12] border border-dashed border-white/10 hover:border-purple-500/30 rounded-xl p-4 flex items-center justify-center gap-2 text-gray-400 hover:text-purple-400 transition-all"
              whileHover={{ scale: 1.01 }}
              whileTap={{ scale: 0.99 }}
            >
              <Plus className="w-5 h-5" />
              <span className="text-sm">Добавить ИИ-модель</span>
            </motion.button>
          )}
        </div>
      </motion.div>
    </motion.div>
  );
}
