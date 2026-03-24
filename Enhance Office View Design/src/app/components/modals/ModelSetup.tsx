import { useState, useEffect } from "react";
import { X, Check, Loader2, Trash2, ChevronRight, ChevronLeft, Users } from "lucide-react";
import { StatusDot } from "../shared/StatusDot";
import { ProviderBadge } from "../shared/ProviderBadge";
import { PoolBuilder as PoolBuilderComponent } from "./PoolBuilder";
import { api, Agent } from "../../lib/api";
import type { Pool } from "../../lib/api";

const providers = [
  { id: "openrouter", name: "OpenRouter", desc: "22+ модели через один ключ", color: "#8b5cf6" },
  { id: "groq", name: "Groq", desc: "Llama 3.3 70B, Scout — бесплатно", color: "#F55036" },
  { id: "google", name: "Google Gemini", desc: "Flash, Pro, Nano Banana", color: "#4285F4" },
  { id: "openai", name: "OpenAI", desc: "GPT-4o, GPT-4.1, o3, o4-mini", color: "#10a37f" },
  { id: "anthropic", name: "Anthropic", desc: "Claude Sonnet 4.6, Opus, Haiku", color: "#d97706" },
  { id: "xai", name: "xAI (Grok)", desc: "Grok 4, Grok Code, Aurora", color: "#1DA1F2" },
  { id: "stability", name: "Stability AI", desc: "SD 3.5 — изображения", color: "#8B5CF6" },
  { id: "ollama", name: "Ollama", desc: "Локальные модели", color: "#333333" },
  { id: "custom", name: "Custom", desc: "OpenAI-совместимый API", color: "#666666" },
];

const modelSuggestions: Record<string, string[]> = {
  openrouter: [
    "google/gemini-2.5-flash-image", "google/gemini-2.5-flash", "google/gemini-2.5-pro",
    "google/gemini-3-pro-image-preview", "google/gemma-3-27b-it:free", "google/gemma-3-12b-it:free",
    "openai/gpt-4o", "openai/gpt-4.1", "openai/gpt-4.1-nano", "openai/gpt-4.1-mini",
    "openai/o3", "openai/o4-mini",
    "anthropic/claude-sonnet-4.6", "anthropic/claude-opus-4.6", "anthropic/claude-haiku-4.5",
    "x-ai/grok-4", "x-ai/grok-4.1-fast", "x-ai/grok-3",
    "meta-llama/llama-3.3-70b-instruct:free",
  ],
  groq: ["llama-3.3-70b-versatile", "llama-3.1-8b-instant", "llama-4-scout-17b-16e-instruct", "gemma2-9b-it"],
  google: ["gemini-2.5-flash", "gemini-2.5-pro", "gemini-2.5-flash-image", "gemini-3-pro-image-preview"],
  openai: ["gpt-4o", "gpt-4o-mini", "gpt-4.1", "gpt-4.1-mini", "gpt-4.1-nano", "o3", "o4-mini"],
  anthropic: ["claude-sonnet-4-6", "claude-haiku-4-5", "claude-opus-4-6"],
  xai: ["grok-4", "grok-4.1-fast", "grok-3", "grok-code-fast-1"],
  stability: ["sd3.5-large", "sd3.5-medium", "stable-image-ultra"],
  ollama: ["llama3.1:8b", "mistral:7b", "codellama:13b", "qwen2.5:14b", "llama3.3:70b"],
  custom: [],
};

const modelDescriptions: Record<string, string> = {
  // OpenRouter
  "google/gemini-2.5-flash-image": "Nano Banana — генерация изображений",
  "google/gemini-2.5-flash": "Быстрая, $0.15/1M токенов",
  "google/gemini-2.5-pro": "Мощная, $1.25/1M токенов",
  "google/gemini-3-pro-image-preview": "Превью изображений, новая",
  "google/gemma-3-27b-it:free": "27B, бесплатно",
  "google/gemma-3-12b-it:free": "12B, бесплатно",
  "openai/gpt-4o": "$2.50/1M — универсальная",
  "openai/gpt-4.1": "$2.00/1M — новейшая",
  "openai/gpt-4.1-nano": "$0.10/1M — сверхдешёвая",
  "openai/gpt-4.1-mini": "$0.40/1M — баланс цена/качество",
  "openai/o3": "Reasoning, $10/1M",
  "openai/o4-mini": "Reasoning, $1.10/1M",
  "anthropic/claude-sonnet-4.6": "Лучший баланс, $3/1M",
  "anthropic/claude-opus-4.6": "Самая мощная, $15/1M",
  "anthropic/claude-haiku-4.5": "Быстрая, $0.80/1M",
  "x-ai/grok-4": "Флагман xAI",
  "x-ai/grok-4.1-fast": "Быстрый Grok",
  "x-ai/grok-3": "Предыдущее поколение",
  "meta-llama/llama-3.3-70b-instruct:free": "70B, бесплатно",
  // Groq
  "llama-3.3-70b-versatile": "70B, быстрый, бесплатно",
  "llama-3.1-8b-instant": "8B, мгновенный, бесплатно",
  "llama-4-scout-17b-16e-instruct": "Scout MoE, бесплатно",
  "gemma2-9b-it": "9B от Google, бесплатно",
  // Google
  "gemini-2.5-flash": "Быстрая, бесплатный тир",
  "gemini-2.5-pro": "Мощная, бесплатный тир",
  "gemini-2.5-flash-image": "Nano Banana — генерация изображений",
  "gemini-3-pro-image-preview": "Превью нового поколения",
  // OpenAI
  "gpt-4o": "$2.50/1M — универсальная",
  "gpt-4o-mini": "$0.15/1M — лёгкая",
  "gpt-4.1": "$2.00/1M — новейшая",
  "gpt-4.1-mini": "$0.40/1M — баланс",
  "gpt-4.1-nano": "$0.10/1M — сверхдешёвая",
  "o3": "Reasoning, $10/1M",
  "o4-mini": "Reasoning, $1.10/1M",
  // Anthropic
  "claude-sonnet-4-6": "Лучший баланс, $3/1M",
  "claude-haiku-4-5": "Быстрая, $0.80/1M",
  "claude-opus-4-6": "Самая мощная, $15/1M",
  // xAI
  "grok-4": "Флагман xAI",
  "grok-4.1-fast": "Быстрый Grok",
  "grok-3": "Предыдущее поколение",
  "grok-code-fast-1": "Код, быстрый",
  // Stability
  "sd3.5-large": "Лучшее качество",
  "sd3.5-medium": "Баланс скорость/качество",
  "stable-image-ultra": "Максимальное качество",
  // Ollama
  "llama3.1:8b": "8B, локально",
  "mistral:7b": "7B, локально",
  "codellama:13b": "13B, код",
  "qwen2.5:14b": "14B, мультиязычная",
  "llama3.3:70b": "70B, мощная локальная",
};

const skillOptions = ["code", "research", "analysis", "design", "image", "text", "planning", "review", "testing"];

interface ModelSetupProps {
  agents: Agent[];
  onAddAgent: (data: any) => Promise<Agent>;
  onRemoveAgent: (id: string) => Promise<void>;
  onClose: () => void;
}

const tierConfig: Record<string, { label: string; color: string }> = {
  pro: { label: "PRO", color: "var(--accent-teal)" },
  ultima: { label: "ULTIMA", color: "var(--accent-amber)" },
};

export function ModelSetup({ agents, onAddAgent, onRemoveAgent, onClose }: ModelSetupProps) {
  const [activeTab, setActiveTab] = useState<"models" | "pools" | "builder">("models");
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [provider, setProvider] = useState("");
  const [name, setName] = useState("");
  const [role, setRole] = useState("");
  const [modelName, setModelName] = useState("");
  const [apiKey, setApiKey] = useState("");
  const [baseUrl, setBaseUrl] = useState("");
  const [skills, setSkills] = useState<string[]>(["code"]);
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState<"ok" | "fail" | null>(null);
  const [deleting, setDeleting] = useState<string | null>(null);

  // Pools state
  const [pools, setPools] = useState<Pool[]>([]);
  const [poolsLoading, setPoolsLoading] = useState(false);
  const [activatingPool, setActivatingPool] = useState<string | null>(null);

  useEffect(() => {
    if (activeTab === "pools" && pools.length === 0) {
      setPoolsLoading(true);
      api.pools.list().then(setPools).catch(console.error).finally(() => setPoolsLoading(false));
    }
  }, [activeTab]);

  const needsApiKey = provider !== "ollama";
  const needsBaseUrl = provider === "ollama" || provider === "custom";
  const needsOpenRouterNote = provider === "openrouter";

  const handleTest = async () => {
    setTesting(true);
    setTestResult(null);
    try {
      const agent = await onAddAgent({
        name: name || `${provider}-agent`,
        role: role || "assistant",
        provider,
        model_name: modelName,
        api_key: apiKey || undefined,
        base_url: baseUrl || undefined,
        skills,
      });
      // Test connection
      const result = await api.agents.test(agent.id);
      setTestResult(result.status === "ok" ? "ok" : "fail");
      setStep(3);
    } catch {
      setTestResult("fail");
    } finally {
      setTesting(false);
    }
  };

  const handleDelete = async (id: string) => {
    setDeleting(id);
    try {
      await onRemoveAgent(id);
    } finally {
      setDeleting(null);
    }
  };

  const toggleSkill = (skill: string) => {
    setSkills((prev) =>
      prev.includes(skill) ? prev.filter((s) => s !== skill) : [...prev, skill]
    );
  };

  const handleActivatePool = async (poolId: string) => {
    setActivatingPool(poolId);
    try {
      await api.pools.activate(poolId);
      // Перезагрузить список агентов — закрываем модалку, родитель обновит
      onClose();
    } catch (e) {
      console.error("Pool activation error:", e);
    } finally {
      setActivatingPool(null);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center"
      style={{ backgroundColor: "var(--bg-overlay)" }}
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div
        className="w-full max-w-lg rounded-2xl overflow-hidden"
        style={{ backgroundColor: "var(--bg-surface)", border: "1px solid var(--border-default)" }}
      >
        {/* Header */}
        <div
          className="flex items-center justify-between px-5 py-4"
          style={{ borderBottom: "1px solid var(--border-default)" }}
        >
          <h2 className="text-[15px] font-semibold">Управление моделями</h2>
          <button onClick={onClose} className="p-1 rounded hover:bg-white/5">
            <X size={16} style={{ color: "var(--text-tertiary)" }} />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex px-5 pt-3 gap-1" style={{ borderBottom: "1px solid var(--border-default)" }}>
          <button
            onClick={() => setActiveTab("models")}
            className="px-3 py-2 text-[12px] font-medium rounded-t-lg transition-colors"
            style={{
              color: activeTab === "models" ? "var(--text-primary)" : "var(--text-tertiary)",
              borderBottom: activeTab === "models" ? "2px solid var(--accent-blue)" : "2px solid transparent",
            }}
          >
            Модели
          </button>
          <button
            onClick={() => setActiveTab("pools")}
            className="px-3 py-2 text-[12px] font-medium rounded-t-lg transition-colors flex items-center gap-1.5"
            style={{
              color: activeTab === "pools" ? "var(--text-primary)" : "var(--text-tertiary)",
              borderBottom: activeTab === "pools" ? "2px solid var(--accent-blue)" : "2px solid transparent",
            }}
          >
            <Users size={12} />
            Пулы
          </button>
          <button
            onClick={() => setActiveTab("builder")}
            className="px-3 py-2 text-[12px] font-medium rounded-t-lg transition-colors"
            style={{
              color: activeTab === "builder" ? "var(--text-primary)" : "var(--text-tertiary)",
              borderBottom: activeTab === "builder" ? "2px solid var(--accent-blue)" : "2px solid transparent",
            }}
          >
            Конструктор
          </button>
        </div>

        <div className="p-5">

          {/* Pools tab */}
          {activeTab === "pools" && (
            <div>
              <p className="text-[13px] font-medium mb-3">Готовые команды моделей</p>
              {poolsLoading ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 size={20} className="animate-spin" style={{ color: "var(--text-tertiary)" }} />
                </div>
              ) : (
                <div className="space-y-2 max-h-[400px] overflow-y-auto">
                  {pools.map((pool) => {
                    const tier = tierConfig[pool.tier] || tierConfig.pro;
                    return (
                      <div
                        key={pool.id}
                        className="rounded-xl p-3"
                        style={{
                          backgroundColor: "var(--bg-elevated)",
                          border: "1px solid var(--border-default)",
                        }}
                      >
                        <div className="flex items-center justify-between mb-1.5">
                          <div className="flex items-center gap-2">
                            <span className="text-[16px]">{pool.icon}</span>
                            <span className="text-[13px] font-semibold" style={{ color: "var(--text-primary)" }}>
                              {pool.name}
                            </span>
                            <span
                              className="text-[9px] font-bold px-1.5 py-0.5 rounded"
                              style={{
                                color: tier.color,
                                backgroundColor: `color-mix(in srgb, ${tier.color} 12%, transparent)`,
                              }}
                            >
                              {tier.label}
                            </span>
                          </div>
                          <button
                            onClick={() => handleActivatePool(pool.id)}
                            disabled={activatingPool === pool.id}
                            className="px-3 py-1.5 rounded-lg text-[11px] font-medium transition-all hover:brightness-110 disabled:opacity-50"
                            style={{ backgroundColor: "var(--accent-blue)", color: "#fff" }}
                          >
                            {activatingPool === pool.id ? (
                              <Loader2 size={12} className="animate-spin" />
                            ) : (
                              "Активировать"
                            )}
                          </button>
                        </div>
                        <p className="text-[11px] mb-2" style={{ color: "var(--text-tertiary)" }}>
                          {pool.description}
                        </p>
                        <div className="flex flex-wrap gap-1">
                          {pool.agents.map((agent, i) => (
                            <span
                              key={i}
                              className="text-[10px] px-2 py-0.5 rounded-md"
                              style={{
                                backgroundColor: "var(--bg-surface)",
                                color: "var(--text-secondary)",
                              }}
                            >
                              {agent.avatar} {agent.name} — {agent.model_name}
                            </span>
                          ))}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}
          {/* Builder tab */}
          {activeTab === "builder" && (
            <PoolBuilderComponent userPlan="admin" onClose={onClose} onPoolActivated={() => { onClose(); }} />
          )}

          {/* Models tab */}
          {activeTab === "models" && <>
          {/* Existing agents */}
          {agents.length > 0 && (
            <div className="mb-5">
              <p className="text-[11px] font-semibold uppercase tracking-wider mb-2" style={{ color: "var(--text-tertiary)" }}>
                Подключённые модели
              </p>
              <div className="space-y-1.5">
                {agents.map((agent) => (
                  <div
                    key={agent.id}
                    className="flex items-center gap-3 px-3 py-2 rounded-lg"
                    style={{ backgroundColor: "var(--bg-elevated)" }}
                  >
                    <StatusDot status={agent.status} />
                    <div className="flex-1 min-w-0">
                      <span className="text-[13px] font-medium">{agent.name}</span>
                      <span className="text-[11px] ml-2" style={{ color: "var(--text-tertiary)" }}>
                        {agent.model_name}
                      </span>
                    </div>
                    <ProviderBadge provider={agent.provider} />
                    <button
                      onClick={() => handleDelete(agent.id)}
                      disabled={deleting === agent.id}
                      className="p-1 rounded hover:bg-white/10 transition-colors"
                      style={{ color: "var(--accent-rose)" }}
                    >
                      {deleting === agent.id ? <Loader2 size={13} className="animate-spin" /> : <Trash2 size={13} />}
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Stepper */}
          <div className="flex items-center gap-2 mb-4">
            {[1, 2, 3].map((s) => (
              <div
                key={s}
                className="h-1 flex-1 rounded-full"
                style={{
                  backgroundColor: s <= step ? "var(--accent-blue)" : "var(--border-default)",
                }}
              />
            ))}
          </div>

          {/* Step 1: Provider */}
          {step === 1 && (
            <div>
              <p className="text-[13px] font-medium mb-3">Выбери провайдера</p>
              <div className="grid grid-cols-2 gap-2">
                {providers.map((p) => (
                  <button
                    key={p.id}
                    onClick={() => {
                      setProvider(p.id);
                      if (modelSuggestions[p.id]?.length) setModelName(modelSuggestions[p.id][0]);
                      if (p.id === "ollama") setBaseUrl("http://localhost:11434");
                      setStep(2);
                    }}
                    className="flex flex-col items-start p-3 rounded-xl text-left transition-all hover:scale-[1.02]"
                    style={{
                      backgroundColor: "var(--bg-elevated)",
                      border: `1px solid ${provider === p.id ? p.color : "var(--border-default)"}`,
                    }}
                  >
                    <span className="text-[13px] font-semibold" style={{ color: p.color }}>
                      {p.name}
                    </span>
                    <span className="text-[11px] mt-0.5" style={{ color: "var(--text-tertiary)" }}>
                      {p.desc}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Step 2: Configure */}
          {step === 2 && (
            <div className="space-y-3">
              <p className="text-[13px] font-medium mb-1">Настройки модели</p>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[11px] block mb-1" style={{ color: "var(--text-tertiary)" }}>Имя агента</label>
                  <input
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Например: Кодер"
                    className="w-full px-3 py-2 rounded-lg text-[13px] outline-none"
                    style={{ backgroundColor: "var(--bg-input)", border: "1px solid var(--border-default)", color: "var(--text-primary)" }}
                  />
                </div>
                <div>
                  <label className="text-[11px] block mb-1" style={{ color: "var(--text-tertiary)" }}>Роль</label>
                  <input
                    value={role}
                    onChange={(e) => setRole(e.target.value)}
                    placeholder="Например: Разработчик"
                    className="w-full px-3 py-2 rounded-lg text-[13px] outline-none"
                    style={{ backgroundColor: "var(--bg-input)", border: "1px solid var(--border-default)", color: "var(--text-primary)" }}
                  />
                </div>
              </div>

              {/* Model */}
              <div>
                <label className="text-[11px] block mb-1" style={{ color: "var(--text-tertiary)" }}>Модель</label>
                <div className="flex flex-wrap gap-1.5 mb-2 max-h-[140px] overflow-y-auto">
                  {(modelSuggestions[provider] || []).map((m) => (
                    <button
                      key={m}
                      onClick={() => setModelName(m)}
                      className="px-2 py-1 rounded-md text-[11px] transition-colors flex flex-col items-start"
                      title={modelDescriptions[m] || m}
                      style={{
                        backgroundColor: modelName === m ? "var(--accent-blue)" : "var(--bg-elevated)",
                        color: modelName === m ? "#fff" : "var(--text-secondary)",
                      }}
                    >
                      <span>{m}</span>
                      {modelDescriptions[m] && (
                        <span
                          className="text-[9px] mt-0.5"
                          style={{ color: modelName === m ? "rgba(255,255,255,0.7)" : "var(--text-tertiary)" }}
                        >
                          {modelDescriptions[m]}
                        </span>
                      )}
                    </button>
                  ))}
                </div>
                <input
                  value={modelName}
                  onChange={(e) => setModelName(e.target.value)}
                  placeholder="model-name"
                  className="w-full px-3 py-2 rounded-lg text-[13px] outline-none"
                  style={{ backgroundColor: "var(--bg-input)", border: "1px solid var(--border-default)", color: "var(--text-primary)" }}
                />
              </div>

              {/* API Key */}
              {needsApiKey && (
                <div>
                  <label className="text-[11px] block mb-1" style={{ color: "var(--text-tertiary)" }}>API ключ</label>
                  <input
                    type="password"
                    value={apiKey}
                    onChange={(e) => setApiKey(e.target.value)}
                    placeholder="sk-..."
                    className="w-full px-3 py-2 rounded-lg text-[13px] outline-none"
                    style={{ backgroundColor: "var(--bg-input)", border: "1px solid var(--border-default)", color: "var(--text-primary)" }}
                  />
                </div>
              )}

              {/* Base URL */}
              {needsBaseUrl && (
                <div>
                  <label className="text-[11px] block mb-1" style={{ color: "var(--text-tertiary)" }}>Base URL</label>
                  <input
                    value={baseUrl}
                    onChange={(e) => setBaseUrl(e.target.value)}
                    placeholder="http://localhost:11434"
                    className="w-full px-3 py-2 rounded-lg text-[13px] outline-none"
                    style={{ backgroundColor: "var(--bg-input)", border: "1px solid var(--border-default)", color: "var(--text-primary)" }}
                  />
                </div>
              )}

              {/* Skills */}
              <div>
                <label className="text-[11px] block mb-1" style={{ color: "var(--text-tertiary)" }}>Навыки</label>
                <div className="flex flex-wrap gap-1.5">
                  {skillOptions.map((skill) => (
                    <button
                      key={skill}
                      onClick={() => toggleSkill(skill)}
                      className="px-2.5 py-1 rounded-md text-[11px] transition-colors"
                      style={{
                        backgroundColor: skills.includes(skill) ? "var(--accent-blue)" : "var(--bg-elevated)",
                        color: skills.includes(skill) ? "#fff" : "var(--text-secondary)",
                      }}
                    >
                      {skill}
                    </button>
                  ))}
                </div>
              </div>

              {/* Actions */}
              <div className="flex items-center justify-between pt-2">
                <button
                  onClick={() => setStep(1)}
                  className="flex items-center gap-1 text-[12px] px-3 py-1.5 rounded-lg hover:bg-white/5"
                  style={{ color: "var(--text-secondary)" }}
                >
                  <ChevronLeft size={12} />
                  Назад
                </button>
                <button
                  onClick={handleTest}
                  disabled={testing || !modelName}
                  className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-[13px] font-medium transition-all hover:brightness-110 disabled:opacity-50"
                  style={{ backgroundColor: "var(--accent-blue)", color: "#fff" }}
                >
                  {testing ? <Loader2 size={14} className="animate-spin" /> : <ChevronRight size={14} />}
                  Подключить и проверить
                </button>
              </div>
            </div>
          )}

          {/* Step 3: Result */}
          {step === 3 && (
            <div className="text-center py-6">
              {testResult === "ok" ? (
                <>
                  <div
                    className="w-14 h-14 rounded-full flex items-center justify-center mx-auto mb-3"
                    style={{ backgroundColor: "color-mix(in srgb, var(--accent-teal) 15%, transparent)" }}
                  >
                    <Check size={24} style={{ color: "var(--accent-teal)" }} />
                  </div>
                  <p className="text-[14px] font-medium" style={{ color: "var(--accent-teal)" }}>
                    Модель подключена!
                  </p>
                  <p className="text-[12px] mt-1" style={{ color: "var(--text-tertiary)" }}>
                    {name || provider} готов к работе
                  </p>
                </>
              ) : (
                <>
                  <div
                    className="w-14 h-14 rounded-full flex items-center justify-center mx-auto mb-3"
                    style={{ backgroundColor: "color-mix(in srgb, var(--accent-rose) 15%, transparent)" }}
                  >
                    <X size={24} style={{ color: "var(--accent-rose)" }} />
                  </div>
                  <p className="text-[14px] font-medium" style={{ color: "var(--accent-rose)" }}>
                    Ошибка подключения
                  </p>
                  <p className="text-[12px] mt-1" style={{ color: "var(--text-tertiary)" }}>
                    Проверь API-ключ и настройки
                  </p>
                </>
              )}
              <div className="flex items-center justify-center gap-2 mt-4">
                <button
                  onClick={() => { setStep(1); setProvider(""); setTestResult(null); setName(""); setRole(""); setApiKey(""); }}
                  className="px-4 py-2 rounded-lg text-[12px] hover:bg-white/5"
                  style={{ border: "1px solid var(--border-default)", color: "var(--text-secondary)" }}
                >
                  Добавить ещё
                </button>
                <button
                  onClick={onClose}
                  className="px-4 py-2 rounded-lg text-[12px] font-medium"
                  style={{ backgroundColor: "var(--accent-blue)", color: "#fff" }}
                >
                  Готово
                </button>
              </div>
            </div>
          )}
          </>}
        </div>
      </div>
    </div>
  );
}
