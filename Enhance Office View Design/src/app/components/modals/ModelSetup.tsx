import { useState, useEffect } from "react";
import { X, Check, Loader2, Trash2, ChevronRight, ChevronLeft, Users } from "lucide-react";
import { StatusDot } from "../shared/StatusDot";
import { ProviderBadge } from "../shared/ProviderBadge";
import { PoolBuilder as PoolBuilderComponent } from "./PoolBuilder";
import { api, Agent } from "../../lib/api";
import type { Pool } from "../../lib/api";

// Категории моделей (вместо провайдеров)
const categories = [
  { id: "flagship", name: "🧠 Флагманы", desc: "Топ модели для сложных задач", color: "#7C3AED" },
  { id: "fast", name: "⚡ Быстрые", desc: "Дешёвые и быстрые", color: "#06B6D4" },
  { id: "code", name: "💻 Код", desc: "Специализированные для программирования", color: "#10B981" },
  { id: "images", name: "🎨 Изображения", desc: "Генерация картинок", color: "#EC4899" },
  { id: "research", name: "🔍 Ресёрч", desc: "Reasoning + поиск", color: "#F59E0B" },
  { id: "chat", name: "💬 Чат", desc: "Универсальные модели", color: "#4F7CFF" },
  { id: "free", name: "🆓 Бесплатные", desc: "Без оплаты", color: "#22C55E" },
  { id: "video", name: "🎬 Видео", desc: "Генерация видео", color: "#EF4444" },
  { id: "custom", name: "⚙️ Custom", desc: "Свой API", color: "#666666" },
];

// Для обратной совместимости — providers теперь = categories
const providers = categories;

const modelSuggestions: Record<string, string[]> = {
  flagship: [
    "gpt-5.4-pro", "gpt-5.4", "claude-opus-4-6", "gpt-5", "gpt-5.2-pro",
    "x-ai/grok-4", "o3", "o1-pro", "qwen/qwen-max", "moonshotai/kimi-k2.5",
  ],
  fast: [
    "gpt-5.4-nano", "gpt-5-nano", "gpt-4.1-nano", "gpt-5.4-mini", "gpt-5-mini",
    "gpt-4o-mini", "claude-haiku-4-5", "x-ai/grok-4.1-fast", "x-ai/grok-4-fast",
    "o4-mini", "o3-mini", "deepseek/deepseek-chat",
  ],
  code: [
    "gpt-5.3-codex", "gpt-5.2-codex", "gpt-5.1-codex-max", "gpt-5.1-codex", "gpt-5-codex",
    "claude-sonnet-4-6", "qwen/qwen3-coder", "qwen/qwen3-coder-plus",
    "mistralai/codestral-2508", "mistralai/devstral-medium", "x-ai/grok-code-fast-1",
    "inception/mercury-coder",
  ],
  images: [
    "gpt-image-1.5", "gpt-image-1", "gpt-image-1-mini", "dall-e-3",
    "sd3.5-large", "sd3.5-large-turbo", "sd3.5-medium", "stable-image-ultra", "stable-image-core",
  ],
  research: [
    "deepseek/deepseek-r1-0528", "deepseek/deepseek-r1",
    "perplexity/sonar-pro-search", "perplexity/sonar-pro", "perplexity/sonar-deep-research",
    "qwen/qwen3-235b-a22b", "deepseek/deepseek-prover-v2",
  ],
  chat: [
    "gpt-4o", "gpt-4.1", "claude-sonnet-4-5", "mistralai/mistral-large-2411",
    "meta-llama/llama-4-maverick", "cohere/command-a", "moonshotai/kimi-k2",
    "z-ai/glm-5-turbo", "minimax/minimax-m2.7", "baidu/ernie-4.5-300b-a47b",
    "amazon/nova-premier-v1",
  ],
  free: [
    "llama-3.3-70b-versatile", "llama-3.1-8b-instant", "qwen-3-235b",
    "nvidia/nemotron-3-nano-30b-a3b:free", "nvidia/nemotron-nano-9b-v2:free",
    "stepfun/step-3.5-flash:free",
  ],
  video: ["sora-2-pro", "sora-2"],
  custom: [],
};

const modelDescriptions: Record<string, string> = {
  // Flagship
  "gpt-5.4-pro": "Самая мощная модель, $30/$180 за 1M",
  "gpt-5.4": "Флагман 2026, $2.50/$15",
  "claude-opus-4-6": "Самая умная Claude, $5/$25",
  "gpt-5": "Универсальная топ, $1.25/$10",
  "gpt-5.2-pro": "Reasoning Pro, $21/$168",
  "x-ai/grok-4": "Флагман xAI, $3/$15",
  "o3": "Сложная логика, $2/$8",
  "o1-pro": "Reasoning Pro, $15/$60",
  "qwen/qwen-max": "Топ Alibaba, $1/$4",
  "moonshotai/kimi-k2.5": "Топ Moonshot, $0.45/$2.20",
  // Fast
  "gpt-5.4-nano": "Ультра-быстрая, $0.20/$1.25",
  "gpt-5-nano": "Быстрая, $0.05/$0.40",
  "gpt-4.1-nano": "Самая дешёвая, $0.10/$0.40",
  "gpt-5.4-mini": "Мини флагман, $0.75/$4.50",
  "gpt-5-mini": "Компактная, $0.25/$2",
  "gpt-4o-mini": "Классика, $0.15/$0.60",
  "claude-haiku-4-5": "Быстрая Claude, $1/$5",
  "x-ai/grok-4.1-fast": "2M контекст, $0.20/$0.50",
  "x-ai/grok-4-fast": "Быстрый Grok, $0.20/$0.50",
  "o4-mini": "Reasoning быстрый, $1.10/$4.40",
  "o3-mini": "Reasoning компактный, $1.10/$4.40",
  "deepseek/deepseek-chat": "Дешёвый, $0.14/$0.28",
  // Code
  "gpt-5.3-codex": "Код: новейший, $1.75/$14",
  "gpt-5.2-codex": "Код: продвинутый, $1.75/$14",
  "gpt-5.1-codex-max": "Код: макс контекст, $1.25/$10",
  "gpt-5.1-codex": "Код: стандартный, $1.25/$10",
  "gpt-5-codex": "Код: GPT-5, $1.25/$10",
  "claude-sonnet-4-6": "Лучшая для кода, $3/$15",
  "qwen/qwen3-coder": "Кодер 480B, специализированный",
  "qwen/qwen3-coder-plus": "Улучшенный кодер",
  "mistralai/codestral-2508": "80+ языков программирования",
  "mistralai/devstral-medium": "Код от Mistral",
  "x-ai/grok-code-fast-1": "Быстрый кодер, $0.20/$1.50",
  "inception/mercury-coder": "Специализированный кодер",
  // Images
  "gpt-image-1.5": "Новейшая генерация OpenAI",
  "gpt-image-1": "Генерация изображений",
  "gpt-image-1-mini": "Быстрая генерация",
  "dall-e-3": "Классическая генерация",
  "sd3.5-large": "SD 3.5 топ качество",
  "sd3.5-large-turbo": "SD 3.5 быстрый",
  "sd3.5-medium": "SD 3.5 средний",
  "stable-image-ultra": "Максимальное качество SD",
  "stable-image-core": "Базовый SD",
  // Research
  "deepseek/deepseek-r1-0528": "Chain-of-thought reasoning",
  "deepseek/deepseek-r1": "Reasoning модель",
  "perplexity/sonar-pro-search": "С поиском в интернете!",
  "perplexity/sonar-pro": "Ресёрч Perplexity",
  "perplexity/sonar-deep-research": "Глубокий ресёрч",
  "qwen/qwen3-235b-a22b": "235 млрд параметров",
  "deepseek/deepseek-prover-v2": "Математические доказательства",
  // Chat
  "gpt-4o": "Универсальная, $2.50/$10",
  "gpt-4.1": "1M контекст, $2/$8",
  "claude-sonnet-4-5": "Claude 4.5, $3/$15",
  "mistralai/mistral-large-2411": "Топ Mistral, $2/$6",
  "meta-llama/llama-4-maverick": "Мультимодальная Meta",
  "cohere/command-a": "Для RAG, $2.50/$10",
  "moonshotai/kimi-k2": "Moonshot AI, $0.57/$2.30",
  "z-ai/glm-5-turbo": "ChatGLM, $1.20/$4",
  "minimax/minimax-m2.7": "MiniMax AI, $0.30/$1.20",
  "baidu/ernie-4.5-300b-a47b": "Baidu AI, $0.28/$1.10",
  "amazon/nova-premier-v1": "Amazon AI, $2.50/$12.50",
  // Free
  "llama-3.3-70b-versatile": "70B, Groq, бесплатно",
  "llama-3.1-8b-instant": "8B, Groq, бесплатно",
  "qwen-3-235b": "235B, Cerebras, бесплатно",
  "nvidia/nemotron-3-nano-30b-a3b:free": "30B, Nvidia, бесплатно",
  "nvidia/nemotron-nano-9b-v2:free": "9B, Nvidia, бесплатно",
  "stepfun/step-3.5-flash:free": "StepFun, бесплатно",
  // Video
  "sora-2-pro": "Генерация видео Pro",
  "sora-2": "Генерация видео",
};

// Авто-определение провайдера по model ID
function detectProvider(modelId: string): string {
  if (modelId.startsWith("gpt-") || modelId.startsWith("o3") || modelId.startsWith("o4") || modelId.startsWith("o1") || modelId.startsWith("dall-e") || modelId.startsWith("sora-") || modelId.startsWith("chatgpt-")) return "openai";
  if (modelId.startsWith("claude-")) return "anthropic";
  if (modelId.startsWith("sd3") || modelId.startsWith("stable-")) return "stability";
  if (modelId.startsWith("llama-3.3-70b-versatile") || modelId.startsWith("llama-3.1-8b-instant")) return "groq";
  if (modelId.startsWith("qwen-3-235b")) return "cerebras";
  if (modelId.includes("/")) return "openrouter";
  return "openrouter";
}

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
