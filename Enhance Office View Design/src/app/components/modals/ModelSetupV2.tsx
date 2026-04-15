/**
 * ModelSetup V2 — 4-block model management
 * Block 1: API Keys (BYOK)
 * Block 2: Our Pools (ready teams with our keys)
 * Block 3: Our Models (by provider, accordion)
 * Block 4: Custom Pools (user-built teams)
 */
import { useState, useEffect, useCallback, useMemo } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  X, Key, Users, Bot, Wrench, Search, Plus, Trash2, Check,
  ChevronDown, ChevronRight, Loader2, Zap, Shield, Star,
  Code, Palette, FileText, BarChart3, Sparkles, Eye,
} from "lucide-react";
import { api, type Agent } from "../../lib/api";

/* ── Types ── */
interface ModelSetupV2Props {
  agents: Agent[];
  onAddAgent: (data: any) => Promise<any>;
  onRemoveAgent: (id: string) => Promise<any>;
  onClose: () => void;
}

type Tab = "keys" | "pools" | "models" | "custom";

/* ── Provider config ── */
const PROVIDERS = [
  { id: "openai", name: "OpenAI", color: "#10a37f", icon: "🟢" },
  { id: "anthropic", name: "Anthropic", color: "#d4a27f", icon: "🟣" },
  { id: "google", name: "Google", color: "#4285f4", icon: "🔵" },
  { id: "xai", name: "xAI", color: "#1da1f2", icon: "⚡" },
  { id: "meta", name: "Meta", color: "#0668e1", icon: "🔷" },
  { id: "deepseek", name: "DeepSeek", color: "#4f46e5", icon: "🧠" },
  { id: "qwen", name: "Qwen", color: "#7C3AED", icon: "🟡" },
  { id: "mistral", name: "Mistral", color: "#ff7000", icon: "🟠" },
  { id: "groq", name: "Groq", color: "#f97316", icon: "🚀" },
  { id: "perplexity", name: "Perplexity", color: "#22C55E", icon: "🔍" },
];

/* ── Platform models (our keys) ── */
const PLATFORM_MODELS: Record<string, { id: string; name: string; desc: string; context: string }[]> = {
  openai: [
    { id: "openai/gpt-5.4", name: "GPT-5.4 Pro", desc: "Самая мощная модель OpenAI", context: "256K" },
    { id: "openai/gpt-5", name: "GPT-5", desc: "Флагман 2026", context: "128K" },
    { id: "openai/gpt-4.1", name: "GPT-4.1", desc: "Универсальная", context: "128K" },
    { id: "openai/gpt-4.1-mini", name: "GPT-4.1 Mini", desc: "Быстрая и дешёвая", context: "128K" },
    { id: "openai/gpt-4.1-nano", name: "GPT-4.1 Nano", desc: "Ультра-быстрая", context: "128K" },
    { id: "openai/o3-pro", name: "o3-pro", desc: "Глубокое reasoning", context: "200K" },
    { id: "openai/o4-mini", name: "o4-mini", desc: "Reasoning компактный", context: "128K" },
  ],
  anthropic: [
    { id: "anthropic/claude-opus-4.6", name: "Claude Opus 4.6", desc: "Самая умная модель", context: "1M" },
    { id: "anthropic/claude-sonnet-4.6", name: "Claude Sonnet 4.6", desc: "Баланс качества и скорости", context: "200K" },
    { id: "anthropic/claude-haiku-4.5", name: "Claude Haiku 4.5", desc: "Быстрая и дешёвая", context: "200K" },
  ],
  google: [
    { id: "google/gemini-2.5-pro", name: "Gemini 2.5 Pro", desc: "Мощная мультимодальная", context: "1M" },
    { id: "google/gemini-2.5-flash", name: "Gemini 2.5 Flash", desc: "Быстрая", context: "1M" },
  ],
  xai: [
    { id: "xai/grok-4", name: "Grok 4", desc: "Флагман xAI, 2M контекст", context: "2M" },
    { id: "xai/grok-4.1-fast", name: "Grok 4.1 Fast", desc: "Быстрая версия", context: "128K" },
  ],
  meta: [
    { id: "meta/llama-4-maverick", name: "Llama 4 Maverick", desc: "400B параметров", context: "1M" },
    { id: "meta/llama-4-scout", name: "Llama 4 Scout", desc: "109B, 10M контекст", context: "10M" },
  ],
  deepseek: [
    { id: "deepseek/deepseek-r1-0528", name: "DeepSeek R1", desc: "Reasoning модель", context: "128K" },
    { id: "deepseek/deepseek-chat-v3.1", name: "DeepSeek Chat v3.1", desc: "Универсальная", context: "128K" },
  ],
  qwen: [
    { id: "qwen/qwen3-235b-a22b", name: "Qwen 3 235B", desc: "Крупнейшая Qwen", context: "128K" },
    { id: "qwen/qwen3-coder", name: "Qwen 3 Coder", desc: "Для программирования", context: "128K" },
  ],
  mistral: [
    { id: "mistral/mistral-large-2411", name: "Mistral Large", desc: "Флагман Mistral", context: "128K" },
    { id: "mistral/codestral-2508", name: "Codestral", desc: "Для кода", context: "256K" },
    { id: "mistral/devstral-small", name: "Devstral Small", desc: "Быстрый dev", context: "128K" },
  ],
  groq: [
    { id: "groq/llama-3.3-70b-versatile", name: "Llama 3.3 70B (бесплатно)", desc: "Через Groq, мгновенная", context: "128K" },
    { id: "groq/llama-4-scout-17b-16e-instruct", name: "Llama 4 Scout 17B (бесплатно)", desc: "Новейшая Meta", context: "128K" },
  ],
  perplexity: [
    { id: "perplexity/sonar-pro", name: "Sonar Pro", desc: "Поиск в интернете", context: "128K" },
    { id: "perplexity/sonar-deep-research", name: "Sonar Deep Research", desc: "Глубокий ресёрч", context: "128K" },
  ],
};

/* ── Our pools ── */
const OUR_POOLS = [
  { id: "flagship", name: "🏆 Флагман", desc: "Claude Opus + GPT-5.4 + Grok 4 + DeepSeek R1", models: 4, tier: "ultima" },
  { id: "coding_start", name: "💻 Кодинг Старт", desc: "Llama 3.3 + Devstral — бесплатные", models: 3, tier: "pro" },
  { id: "coding_pro", name: "💻 Кодинг Про", desc: "DeepSeek R1 + Qwen Coder + Codestral", models: 3, tier: "pro_plus" },
  { id: "coding_fullstack", name: "🌐 Fullstack", desc: "Qwen Coder + DeepSeek + Grok Fast + Devstral", models: 4, tier: "pro_plus" },
  { id: "design_start", name: "🎨 Дизайн Старт", desc: "Llama 4 Maverick + Llama 3.3", models: 2, tier: "pro" },
  { id: "design_pro", name: "🎨 Дизайн Про", desc: "Grok 4 + SD 3.5 + Qwen Coder", models: 3, tier: "ultima" },
  { id: "research", name: "🔬 Ресёрч", desc: "DeepSeek R1 + Llama 3.3", models: 2, tier: "pro" },
  { id: "research_deep", name: "🔬 Глубокий ресёрч", desc: "Perplexity + DeepSeek R1 + Mistral Large", models: 3, tier: "ultima" },
  { id: "copywriting", name: "📝 Копирайтинг", desc: "Mistral Large + Llama 3.3", models: 2, tier: "pro" },
  { id: "data_analysis", name: "📊 Данные", desc: "DeepSeek Chat + Qwen Coder", models: 2, tier: "pro_plus" },
  { id: "solo_grok", name: "⚡ Grok 4 (соло)", desc: "Одна модель — Grok 4", models: 1, tier: "pro_plus" },
  { id: "solo_deepseek", name: "🧠 DeepSeek R1 (соло)", desc: "Reasoning модель", models: 1, tier: "pro" },
  { id: "solo_fast", name: "🚀 Быстрый (соло)", desc: "Llama 3.3 через Groq — бесплатно", models: 1, tier: "pro" },
];

/* ── Tab config ── */
const TABS: { id: Tab; label: string; icon: any }[] = [
  { id: "keys", label: "API ключи", icon: Key },
  { id: "pools", label: "Наши пулы", icon: Users },
  { id: "models", label: "Наши модели", icon: Bot },
  { id: "custom", label: "Свои пулы", icon: Wrench },
];

/* ── Main Component ── */
export function ModelSetupV2({ agents, onAddAgent, onRemoveAgent, onClose }: ModelSetupV2Props) {
  const [activeTab, setActiveTab] = useState<Tab>("models");
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [expandedProvider, setExpandedProvider] = useState<string | null>(null);
  const [activatingPool, setActivatingPool] = useState<string | null>(null);

  // BYOK keys state
  const [keys, setKeys] = useState<Record<string, string>>({
    openai: "", anthropic: "", google: "", groq: "", openrouter: "",
  });
  const [savedKeys, setSavedKeys] = useState<Record<string, { masked: string } | null>>({});
  const [savingKeys, setSavingKeys] = useState(false);
  const [keysStatus, setKeysStatus] = useState<string | null>(null);

  // Load existing BYOK keys on mount
  useEffect(() => {
    api.byok.list().then(data => {
      setSavedKeys(data as any);
    }).catch(() => {});
  }, []);

  const handleSaveKeys = useCallback(async () => {
    // Only send non-empty values
    const payload: Record<string, string> = {};
    for (const [k, v] of Object.entries(keys)) {
      if (v && v.trim()) payload[k] = v.trim();
    }
    if (Object.keys(payload).length === 0) {
      setKeysStatus("Введите хотя бы один ключ");
      return;
    }
    setSavingKeys(true);
    setKeysStatus(null);
    try {
      const res = await api.byok.save(payload);
      setKeysStatus(`Сохранено: ${res.saved.join(", ")}`);
      // Clear inputs, refresh status
      setKeys({ openai: "", anthropic: "", google: "", groq: "", openrouter: "" });
      const fresh = await api.byok.list();
      setSavedKeys(fresh as any);
    } catch (e: any) {
      setKeysStatus(`Ошибка: ${e?.message || "не удалось сохранить"}`);
    } finally {
      setSavingKeys(false);
    }
  }, [keys]);

  const handleRemoveKey = useCallback(async (provider: string) => {
    try {
      await api.byok.remove(provider);
      const fresh = await api.byok.list();
      setSavedKeys(fresh as any);
    } catch {}
  }, []);

  const connectedAgentModels = useMemo(() => new Set(agents.map(a => `${a.provider}/${a.model_name}`)), [agents]);

  /* Add platform model to team */
  const handleAddModel = useCallback(async (modelId: string, displayName: string) => {
    setLoading(true);
    try {
      const [provider, ...rest] = modelId.split("/");
      const modelName = rest.join("/");
      await onAddAgent({
        name: displayName,
        role: "Универсальный",
        provider: "openrouter",
        model_name: modelId,
        skills: ["code", "text", "research"],
      });
    } catch (e) {
      console.error("Add model error:", e);
    } finally {
      setLoading(false);
    }
  }, [onAddAgent]);

  /* Activate pool */
  const handleActivatePool = useCallback(async (poolId: string) => {
    setActivatingPool(poolId);
    try {
      await api.pools.activate(poolId);
      // Refresh agents after pool activation
      window.location.reload();
    } catch (e) {
      console.error("Pool activation error:", e);
    } finally {
      setActivatingPool(null);
    }
  }, []);

  /* Tier labels */
  const tierLabel = (tier: string) => {
    switch (tier) {
      case "pro": return { text: "PRO", color: "var(--accent-teal)" };
      case "pro_plus": return { text: "PRO+", color: "var(--accent-blue)" };
      case "ultima": return { text: "ULTIMA", color: "var(--accent-amber)" };
      default: return { text: "FREE", color: "var(--text-tertiary)" };
    }
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4" style={{ backgroundColor: "rgba(0,0,0,0.7)" }} onClick={onClose}>
      <motion.div
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.95, opacity: 0 }}
        className="w-full max-w-[700px] max-h-[85vh] rounded-2xl overflow-hidden flex flex-col"
        style={{ backgroundColor: "var(--bg-surface)", border: "1px solid var(--border-default)" }}
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 flex-shrink-0" style={{ borderBottom: "1px solid var(--border-default)" }}>
          <h2 className="text-lg font-bold" style={{ color: "var(--text-primary)" }}>Управление моделями</h2>
          <button onClick={onClose} className="p-1.5 rounded-lg transition-colors" style={{ color: "var(--text-tertiary)" }}
            onMouseEnter={e => { e.currentTarget.style.backgroundColor = "var(--bg-elevated)"; }}
            onMouseLeave={e => { e.currentTarget.style.backgroundColor = "transparent"; }}>
            <X size={18} />
          </button>
        </div>

        {/* Tab bar */}
        <div className="flex gap-1 px-6 py-2 flex-shrink-0" style={{ borderBottom: "1px solid var(--border-default)" }}>
          {TABS.map(tab => {
            const Icon = tab.icon;
            const active = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium transition-all"
                style={{
                  backgroundColor: active ? "var(--bg-elevated)" : "transparent",
                  color: active ? "var(--text-primary)" : "var(--text-tertiary)",
                }}
              >
                <Icon size={14} />
                {tab.label}
              </button>
            );
          })}
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {/* ═══ BLOCK 1: API KEYS ═══ */}
          {activeTab === "keys" && (
            <div className="space-y-4">
              <p className="text-sm" style={{ color: "var(--text-tertiary)" }}>
                Подключите свои API ключи для прямого доступа к моделям (BYOK). Ключи шифруются и хранятся безопасно.
              </p>
              {[
                { id: "openai", name: "OpenAI", placeholder: "sk-..." },
                { id: "anthropic", name: "Anthropic", placeholder: "sk-ant-..." },
                { id: "google", name: "Google AI", placeholder: "AIza..." },
                { id: "groq", name: "Groq (бесплатно)", placeholder: "gsk_..." },
                { id: "openrouter", name: "OpenRouter", placeholder: "sk-or-..." },
              ].map(provider => (
                <div key={provider.id} className="flex items-center gap-3">
                  <div className="w-24 text-xs font-medium flex-shrink-0" style={{ color: "var(--text-secondary)" }}>
                    {provider.name}
                  </div>
                  <input
                    type="password"
                    value={keys[provider.id] || ""}
                    onChange={e => setKeys(prev => ({ ...prev, [provider.id]: e.target.value }))}
                    placeholder={provider.placeholder}
                    className="flex-1 px-3 py-2 rounded-lg text-xs outline-none"
                    style={{ backgroundColor: "var(--bg-base)", border: "1px solid var(--border-default)", color: "var(--text-primary)" }}
                  />
                  <div className="flex items-center gap-2 min-w-[100px]">
                    {savedKeys[provider.id] ? (
                      <>
                        <span className="text-xs" style={{ color: "var(--accent-green)" }}>
                          {savedKeys[provider.id]?.masked}
                        </span>
                        <button
                          onClick={() => handleRemoveKey(provider.id)}
                          className="text-xs opacity-60 hover:opacity-100"
                          style={{ color: "var(--text-tertiary)" }}
                          title="Удалить"
                        >
                          ✕
                        </button>
                      </>
                    ) : keys[provider.id] ? (
                      <Check size={14} style={{ color: "var(--accent-green)" }} />
                    ) : null}
                  </div>
                </div>
              ))}
              <button
                onClick={handleSaveKeys}
                disabled={savingKeys}
                className="w-full py-2.5 rounded-lg text-sm font-medium mt-4 disabled:opacity-50 transition-opacity"
                style={{ backgroundColor: "var(--accent-blue)", color: "#fff" }}
              >
                {savingKeys ? "Сохраняю..." : "Сохранить ключи"}
              </button>
              {keysStatus && (
                <p className="text-xs mt-2 text-center" style={{ color: keysStatus.startsWith("Ошибка") ? "var(--accent-red)" : "var(--accent-green)" }}>
                  {keysStatus}
                </p>
              )}
            </div>
          )}

          {/* ═══ BLOCK 2: OUR POOLS ═══ */}
          {activeTab === "pools" && (
            <div className="space-y-3">
              <p className="text-sm mb-4" style={{ color: "var(--text-tertiary)" }}>
                Готовые команды моделей с нашими ключами. Один клик — команда собрана.
              </p>
              {OUR_POOLS.map(pool => {
                const tier = tierLabel(pool.tier);
                return (
                  <motion.div
                    key={pool.id}
                    whileHover={{ y: -1 }}
                    className="flex items-center gap-3 p-3 rounded-xl transition-all"
                    style={{ backgroundColor: "var(--bg-base)", border: "1px solid var(--border-default)" }}
                  >
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-semibold" style={{ color: "var(--text-primary)" }}>{pool.name}</span>
                        <span className="text-[10px] px-1.5 py-0.5 rounded-full font-bold" style={{ color: tier.color, backgroundColor: `color-mix(in srgb, ${tier.color} 12%, transparent)` }}>
                          {tier.text}
                        </span>
                      </div>
                      <p className="text-xs mt-0.5" style={{ color: "var(--text-tertiary)" }}>{pool.desc}</p>
                    </div>
                    <span className="text-[10px] flex-shrink-0" style={{ color: "var(--text-tertiary)" }}>{pool.models} мод.</span>
                    <button
                      onClick={() => handleActivatePool(pool.id)}
                      disabled={activatingPool === pool.id}
                      className="px-3 py-1.5 rounded-lg text-xs font-medium flex-shrink-0 disabled:opacity-50"
                      style={{ backgroundColor: "var(--accent-blue)", color: "#fff" }}
                    >
                      {activatingPool === pool.id ? <Loader2 size={12} className="animate-spin" /> : "Применить"}
                    </button>
                  </motion.div>
                );
              })}
            </div>
          )}

          {/* ═══ BLOCK 3: OUR MODELS (by provider, accordion) ═══ */}
          {activeTab === "models" && (
            <div className="space-y-2">
              {/* Search */}
              <div className="relative mb-4">
                <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: "var(--text-tertiary)" }} />
                <input
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  placeholder="Поиск модели..."
                  className="w-full pl-9 pr-3 py-2 rounded-lg text-sm outline-none"
                  style={{ backgroundColor: "var(--bg-base)", border: "1px solid var(--border-default)", color: "var(--text-primary)" }}
                />
              </div>

              <p className="text-xs mb-3" style={{ color: "var(--text-tertiary)" }}>
                Модели с нашими ключами. Нажмите на провайдера чтобы раскрыть список.
              </p>

              {/* Provider accordions */}
              {PROVIDERS.map(provider => {
                const models = PLATFORM_MODELS[provider.id] || [];
                if (models.length === 0) return null;

                const filteredModels = searchQuery
                  ? models.filter(m => m.name.toLowerCase().includes(searchQuery.toLowerCase()) || m.desc.toLowerCase().includes(searchQuery.toLowerCase()))
                  : models;

                if (searchQuery && filteredModels.length === 0) return null;
                const isExpanded = expandedProvider === provider.id || !!searchQuery;

                return (
                  <div key={provider.id} className="rounded-xl overflow-hidden" style={{ border: "1px solid var(--border-default)" }}>
                    {/* Provider header */}
                    <button
                      onClick={() => setExpandedProvider(expandedProvider === provider.id ? null : provider.id)}
                      className="w-full flex items-center gap-3 px-4 py-3 text-left transition-colors"
                      style={{ backgroundColor: isExpanded ? "var(--bg-elevated)" : "var(--bg-base)" }}
                      onMouseEnter={e => { if (!isExpanded) (e.currentTarget as HTMLElement).style.backgroundColor = "var(--bg-elevated)"; }}
                      onMouseLeave={e => { if (!isExpanded) (e.currentTarget as HTMLElement).style.backgroundColor = "var(--bg-base)"; }}
                    >
                      <span className="text-base">{provider.icon}</span>
                      <span className="text-sm font-semibold flex-1" style={{ color: "var(--text-primary)" }}>{provider.name}</span>
                      <span className="text-[10px]" style={{ color: "var(--text-tertiary)" }}>{filteredModels.length} моделей</span>
                      <motion.div animate={{ rotate: isExpanded ? 90 : 0 }} transition={{ duration: 0.15 }}>
                        <ChevronRight size={14} style={{ color: "var(--text-tertiary)" }} />
                      </motion.div>
                    </button>

                    {/* Models list */}
                    <AnimatePresence>
                      {isExpanded && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: "auto", opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          transition={{ duration: 0.2 }}
                          className="overflow-hidden"
                        >
                          {filteredModels.map(model => {
                            const isConnected = connectedAgentModels.has(model.id);
                            return (
                              <div
                                key={model.id}
                                className="flex items-center gap-3 px-4 py-2.5"
                                style={{ borderTop: "1px solid var(--border-default)" }}
                              >
                                <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: provider.color }} />
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-center gap-2">
                                    <span className="text-xs font-semibold" style={{ color: "var(--text-primary)" }}>{model.name}</span>
                                    <span className="text-[9px] px-1.5 py-0.5 rounded-full" style={{ backgroundColor: "color-mix(in srgb, var(--accent-teal) 15%, transparent)", color: "var(--accent-teal)" }}>
                                      Наш ключ
                                    </span>
                                  </div>
                                  <span className="text-[10px]" style={{ color: "var(--text-tertiary)" }}>
                                    {model.desc} · {model.context}
                                  </span>
                                </div>
                                {isConnected ? (
                                  <span className="text-[10px] px-2 py-1 rounded flex items-center gap-1" style={{ color: "var(--accent-green)" }}>
                                    <Check size={10} /> В команде
                                  </span>
                                ) : (
                                  <button
                                    onClick={() => handleAddModel(model.id, model.name)}
                                    disabled={loading}
                                    className="p-1.5 rounded-lg transition-colors disabled:opacity-50"
                                    style={{ color: "var(--accent-blue)" }}
                                    onMouseEnter={e => { e.currentTarget.style.backgroundColor = "color-mix(in srgb, var(--accent-blue) 12%, transparent)"; }}
                                    onMouseLeave={e => { e.currentTarget.style.backgroundColor = "transparent"; }}
                                    title="Добавить в команду"
                                  >
                                    <Plus size={16} />
                                  </button>
                                )}
                              </div>
                            );
                          })}
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                );
              })}
            </div>
          )}

          {/* ═══ BLOCK 4: CUSTOM POOLS ═══ */}
          {activeTab === "custom" && (
            <div className="space-y-4">
              <p className="text-sm" style={{ color: "var(--text-tertiary)" }}>
                Соберите свой пул из наших моделей или моделей со своими ключами. Назначьте роли для каждого участника.
              </p>

              {/* Current agents as custom pool */}
              <div className="rounded-xl p-4" style={{ backgroundColor: "var(--bg-base)", border: "1px solid var(--border-default)" }}>
                <h4 className="text-sm font-semibold mb-3" style={{ color: "var(--text-primary)" }}>Текущая команда</h4>
                <div className="space-y-2">
                  {agents.length === 0 ? (
                    <p className="text-xs text-center py-4" style={{ color: "var(--text-tertiary)" }}>
                      Добавьте модели из вкладки "Наши модели"
                    </p>
                  ) : (
                    agents.map(agent => (
                      <div key={agent.id} className="flex items-center gap-2 p-2 rounded-lg" style={{ backgroundColor: "var(--bg-surface)" }}>
                        <div className="w-7 h-7 rounded-full flex items-center justify-center text-[11px] font-bold" style={{ backgroundColor: "var(--bg-elevated)", color: "var(--text-primary)" }}>
                          {agent.name.charAt(0)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="text-xs font-medium truncate" style={{ color: "var(--text-primary)" }}>{agent.name}</div>
                          <div className="text-[10px]" style={{ color: "var(--text-tertiary)" }}>{agent.model_name}</div>
                        </div>
                        <span className="text-[10px] px-1.5 py-0.5 rounded" style={{ backgroundColor: "var(--bg-elevated)", color: "var(--text-tertiary)" }}>
                          {agent.role || "Универсальный"}
                        </span>
                        <button
                          onClick={() => onRemoveAgent(agent.id)}
                          className="p-1 rounded transition-colors"
                          style={{ color: "var(--text-tertiary)" }}
                          onMouseEnter={e => { e.currentTarget.style.color = "var(--accent-rose)"; }}
                          onMouseLeave={e => { e.currentTarget.style.color = "var(--text-tertiary)"; }}
                        >
                          <Trash2 size={12} />
                        </button>
                      </div>
                    ))
                  )}
                </div>
              </div>

              {/* Add from platform */}
              <button
                onClick={() => setActiveTab("models")}
                className="w-full flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-medium"
                style={{ border: "1px dashed var(--border-default)", color: "var(--accent-blue)" }}
              >
                <Plus size={14} /> Добавить модель из каталога
              </button>
            </div>
          )}
        </div>
      </motion.div>
    </div>
  );
}
