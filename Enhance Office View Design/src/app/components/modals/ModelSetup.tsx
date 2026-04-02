import { useState, useEffect, useMemo } from "react";
import { X, Check, Loader2, Trash2, ChevronRight, ChevronLeft, Users, Search } from "lucide-react";
import { StatusDot } from "../shared/StatusDot";
import { ProviderBadge } from "../shared/ProviderBadge";
import { PoolBuilder as PoolBuilderComponent } from "./PoolBuilder";
import { api, Agent } from "../../lib/api";
import type { Pool } from "../../lib/api";

// Провайдер-фильтры для каталога
const providerFilters = [
  { id: "all", name: "Все", color: "var(--text-primary)" },
  { id: "openai", name: "OpenAI", color: "#10a37f" },
  { id: "anthropic", name: "Anthropic", color: "#d4a27f" },
  { id: "google", name: "Google", color: "#4285f4" },
  { id: "xai", name: "xAI", color: "#1da1f2" },
  { id: "meta", name: "Meta", color: "#0668e1" },
  { id: "deepseek", name: "DeepSeek", color: "#4f46e5" },
  { id: "qwen", name: "Qwen", color: "#7C3AED" },
  { id: "stability", name: "Stability", color: "#9333ea" },
  { id: "perplexity", name: "Perplexity", color: "#22C55E" },
  { id: "mistral", name: "Mistral", color: "#ff7000" },
  { id: "free", name: "Free", color: "#22C55E" },
  { id: "custom", name: "Custom", color: "#666" },
];

// Плоский каталог всех моделей
interface ModelEntry {
  id: string;
  name: string;
  provider: string;
  providerDisplay: string;
  price: string;
  desc: string;
  category: string;
  free?: boolean;
  platformKey?: boolean; // доступна с ключами платформы (без BYOK)
}

// Провайдеры с ключами платформы (доступны всем пользователям)
const PLATFORM_PROVIDERS = ["openai", "anthropic", "google", "xai", "stability", "free"];

const ALL_MODELS: ModelEntry[] = [
  // OpenAI — Flagship
  { id: "gpt-5.4-pro", name: "GPT-5.4 Pro", provider: "openai", providerDisplay: "OpenAI", price: "$30/$180", desc: "Самая мощная модель", category: "flagship" },
  { id: "gpt-5.4", name: "GPT-5.4", provider: "openai", providerDisplay: "OpenAI", price: "$2.50/$15", desc: "Флагман 2026", category: "flagship" },
  { id: "gpt-5", name: "GPT-5", provider: "openai", providerDisplay: "OpenAI", price: "$1.25/$10", desc: "Универсальная топ", category: "flagship" },
  { id: "gpt-5.2-pro", name: "GPT-5.2 Pro", provider: "openai", providerDisplay: "OpenAI", price: "$21/$168", desc: "Reasoning Pro", category: "flagship" },
  // OpenAI — Fast
  { id: "gpt-5.4-nano", name: "GPT-5.4 Nano", provider: "openai", providerDisplay: "OpenAI", price: "$0.20/$1.25", desc: "Ультра-быстрая", category: "fast" },
  { id: "gpt-5.4-mini", name: "GPT-5.4 Mini", provider: "openai", providerDisplay: "OpenAI", price: "$0.75/$4.50", desc: "Мини флагман", category: "fast" },
  { id: "gpt-5-mini", name: "GPT-5 Mini", provider: "openai", providerDisplay: "OpenAI", price: "$0.25/$2", desc: "Компактная", category: "fast" },
  { id: "gpt-5-nano", name: "GPT-5 Nano", provider: "openai", providerDisplay: "OpenAI", price: "$0.05/$0.40", desc: "Быстрая", category: "fast" },
  { id: "gpt-4o-mini", name: "GPT-4o Mini", provider: "openai", providerDisplay: "OpenAI", price: "$0.15/$0.60", desc: "Классика", category: "fast" },
  { id: "gpt-4.1-nano", name: "GPT-4.1 Nano", provider: "openai", providerDisplay: "OpenAI", price: "$0.10/$0.40", desc: "Самая дешёвая", category: "fast" },
  // OpenAI — Code
  { id: "gpt-5.3-codex", name: "GPT-5.3 Codex", provider: "openai", providerDisplay: "OpenAI", price: "$1.75/$14", desc: "Код: новейший", category: "code" },
  { id: "gpt-5.2-codex", name: "GPT-5.2 Codex", provider: "openai", providerDisplay: "OpenAI", price: "$1.75/$14", desc: "Код: продвинутый", category: "code" },
  { id: "gpt-5.1-codex-max", name: "GPT-5.1 Codex Max", provider: "openai", providerDisplay: "OpenAI", price: "$1.25/$10", desc: "Код: макс контекст", category: "code" },
  { id: "gpt-5-codex", name: "GPT-5 Codex", provider: "openai", providerDisplay: "OpenAI", price: "$1.25/$10", desc: "Код: GPT-5", category: "code" },
  // OpenAI — Reasoning
  { id: "o3", name: "o3", provider: "openai", providerDisplay: "OpenAI", price: "$2/$8", desc: "Сложная логика", category: "research" },
  { id: "o4-mini", name: "o4-mini", provider: "openai", providerDisplay: "OpenAI", price: "$1.10/$4.40", desc: "Reasoning быстрый", category: "research" },
  { id: "o3-mini", name: "o3-mini", provider: "openai", providerDisplay: "OpenAI", price: "$1.10/$4.40", desc: "Reasoning компактный", category: "research" },
  { id: "o1-pro", name: "o1-pro", provider: "openai", providerDisplay: "OpenAI", price: "$15/$60", desc: "Reasoning Pro", category: "research" },
  // OpenAI — Chat
  { id: "gpt-4o", name: "GPT-4o", provider: "openai", providerDisplay: "OpenAI", price: "$2.50/$10", desc: "Универсальная", category: "chat" },
  { id: "gpt-4.1", name: "GPT-4.1", provider: "openai", providerDisplay: "OpenAI", price: "$2/$8", desc: "1M контекст", category: "chat" },
  // OpenAI — Images
  { id: "gpt-image-1.5", name: "GPT Image 1.5", provider: "openai", providerDisplay: "OpenAI", price: "~$0.02/img", desc: "Новейшая генерация", category: "images" },
  { id: "gpt-image-1", name: "GPT Image 1", provider: "openai", providerDisplay: "OpenAI", price: "~$0.02/img", desc: "Генерация изображений", category: "images" },
  { id: "dall-e-3", name: "DALL-E 3", provider: "openai", providerDisplay: "OpenAI", price: "~$0.04/img", desc: "Классическая генерация", category: "images" },
  // OpenAI — Video
  { id: "sora-2-pro", name: "Sora 2 Pro", provider: "openai", providerDisplay: "OpenAI", price: "Premium", desc: "Генерация видео Pro", category: "video" },
  { id: "sora-2", name: "Sora 2", provider: "openai", providerDisplay: "OpenAI", price: "Premium", desc: "Генерация видео", category: "video" },

  // Anthropic
  { id: "claude-opus-4-6", name: "Claude Opus 4.6", provider: "anthropic", providerDisplay: "Anthropic", price: "$5/$25", desc: "Самая умная Claude", category: "flagship" },
  { id: "claude-sonnet-4-6", name: "Claude Sonnet 4.6", provider: "anthropic", providerDisplay: "Anthropic", price: "$3/$15", desc: "Лучшая для кода", category: "code" },
  { id: "claude-sonnet-4-5", name: "Claude Sonnet 4.5", provider: "anthropic", providerDisplay: "Anthropic", price: "$3/$15", desc: "Claude 4.5", category: "chat" },
  { id: "claude-haiku-4-5", name: "Claude Haiku 4.5", provider: "anthropic", providerDisplay: "Anthropic", price: "$1/$5", desc: "Быстрая Claude", category: "fast" },

  // xAI
  { id: "x-ai/grok-4", name: "Grok 4", provider: "xai", providerDisplay: "xAI", price: "$3/$15", desc: "Флагман xAI", category: "flagship" },
  { id: "x-ai/grok-4.1-fast", name: "Grok 4.1 Fast", provider: "xai", providerDisplay: "xAI", price: "$0.20/$0.50", desc: "2M контекст", category: "fast" },
  { id: "x-ai/grok-4-fast", name: "Grok 4 Fast", provider: "xai", providerDisplay: "xAI", price: "$0.20/$0.50", desc: "Быстрый Grok", category: "fast" },
  { id: "x-ai/grok-code-fast-1", name: "Grok Code Fast", provider: "xai", providerDisplay: "xAI", price: "$0.20/$1.50", desc: "Быстрый кодер", category: "code" },

  // Google
  { id: "gemini-2.5-pro", name: "Gemini 2.5 Pro", provider: "google", providerDisplay: "Google", price: "$1.25/$10", desc: "1M контекст", category: "flagship" },
  { id: "gemini-2.5-flash", name: "Gemini 2.5 Flash", provider: "google", providerDisplay: "Google", price: "$0.15/$0.60", desc: "Быстрая Gemini", category: "fast" },
  { id: "nano-banana", name: "Nano Banana", provider: "google", providerDisplay: "Google", price: "Бесплатно", desc: "Генерация изображений", category: "images", free: true },
  { id: "nano-banana-2", name: "Nano Banana 2", provider: "google", providerDisplay: "Google", price: "Бесплатно", desc: "Улучшенная генерация", category: "images", free: true },
  { id: "nano-banana-pro", name: "Nano Banana Pro", provider: "google", providerDisplay: "Google", price: "$0.50/img", desc: "Pro генерация", category: "images" },

  // Meta
  { id: "meta-llama/llama-4-maverick", name: "Llama 4 Maverick", provider: "meta", providerDisplay: "Meta", price: "$0.20/$0.60", desc: "Мультимодальная", category: "chat" },
  { id: "meta-llama/llama-3.3-70b-instruct", name: "Llama 3.3 70B", provider: "meta", providerDisplay: "Meta", price: "$0.10/$0.30", desc: "Открытая 70B", category: "chat" },

  // DeepSeek
  { id: "deepseek/deepseek-chat-v3-0324", name: "DeepSeek V3", provider: "deepseek", providerDisplay: "DeepSeek", price: "$0.14/$0.28", desc: "Дешёвый и сильный", category: "chat" },
  { id: "deepseek/deepseek-r1-0528", name: "DeepSeek R1", provider: "deepseek", providerDisplay: "DeepSeek", price: "$0.55/$2.19", desc: "Chain-of-thought", category: "research" },
  { id: "deepseek/deepseek-prover-v2", name: "DeepSeek Prover V2", provider: "deepseek", providerDisplay: "DeepSeek", price: "$0.55/$2.19", desc: "Мат. доказательства", category: "research" },

  // Qwen
  { id: "qwen/qwen-max", name: "Qwen Max", provider: "qwen", providerDisplay: "Qwen", price: "$1/$4", desc: "Топ Alibaba", category: "flagship" },
  { id: "qwen/qwen3-coder", name: "Qwen3 Coder", provider: "qwen", providerDisplay: "Qwen", price: "$0.20/$0.60", desc: "Кодер 480B", category: "code" },
  { id: "qwen/qwen3-coder-plus", name: "Qwen3 Coder+", provider: "qwen", providerDisplay: "Qwen", price: "$0.40/$1.20", desc: "Улучшенный кодер", category: "code" },
  { id: "qwen/qwen3-235b-a22b", name: "Qwen3 235B", provider: "qwen", providerDisplay: "Qwen", price: "$0.20/$0.60", desc: "235 млрд параметров", category: "research" },

  // Stability AI — Generate
  { id: "stable-image-ultra", name: "Stable Image Ultra", provider: "stability", providerDisplay: "Stability AI", price: "8 кр", desc: "Флагман, максимальное качество", category: "images" },
  { id: "sd3.5-large", name: "SD 3.5 Large", provider: "stability", providerDisplay: "Stability AI", price: "6.5 кр", desc: "8B параметров, топ качество", category: "images" },
  { id: "sd3.5-large-turbo", name: "SD 3.5 Large Turbo", provider: "stability", providerDisplay: "Stability AI", price: "4 кр", desc: "Быстрый SD 3.5 Large", category: "images" },
  { id: "sd3.5-medium", name: "SD 3.5 Medium", provider: "stability", providerDisplay: "Stability AI", price: "3.5 кр", desc: "2.5B параметров", category: "images" },
  { id: "sd3.5-flash", name: "SD 3.5 Flash", provider: "stability", providerDisplay: "Stability AI", price: "2.5 кр", desc: "Дистилляция Medium, быстрый", category: "images" },
  { id: "stable-image-core", name: "Stable Image Core", provider: "stability", providerDisplay: "Stability AI", price: "3 кр", desc: "Быстрый и дешёвый", category: "images" },
  { id: "sdxl-1.0", name: "SDXL 1.0", provider: "stability", providerDisplay: "Stability AI", price: "от 0.9 кр", desc: "Legacy, базовая генерация", category: "images" },
  // Stability AI — Upscale
  { id: "creative-upscaler", name: "Creative Upscaler", provider: "stability", providerDisplay: "Stability AI", price: "60 кр", desc: "Low-res → 4K с prompt guidance", category: "images" },
  { id: "conservative-upscaler", name: "Conservative Upscaler", provider: "stability", providerDisplay: "Stability AI", price: "40 кр", desc: "Low-res → 4K без изменений", category: "images" },
  { id: "fast-upscaler", name: "Fast Upscaler", provider: "stability", providerDisplay: "Stability AI", price: "2 кр", desc: "Быстрый upscale ×4", category: "images" },
  // Stability AI — Edit
  { id: "erase-object", name: "Erase Object", provider: "stability", providerDisplay: "Stability AI", price: "5 кр", desc: "Удаление объектов с фото", category: "images" },
  { id: "inpaint", name: "Inpaint", provider: "stability", providerDisplay: "Stability AI", price: "5 кр", desc: "Замена части изображения", category: "images" },
  { id: "outpaint", name: "Outpaint", provider: "stability", providerDisplay: "Stability AI", price: "4 кр", desc: "Расширение изображения", category: "images" },
  { id: "remove-background", name: "Remove Background", provider: "stability", providerDisplay: "Stability AI", price: "5 кр", desc: "Удаление фона", category: "images" },
  { id: "search-and-replace", name: "Search & Replace", provider: "stability", providerDisplay: "Stability AI", price: "5 кр", desc: "Найти и заменить объект", category: "images" },
  { id: "search-and-recolor", name: "Search & Recolor", provider: "stability", providerDisplay: "Stability AI", price: "5 кр", desc: "Перекрасить объект", category: "images" },
  { id: "replace-bg-relight", name: "Replace BG & Relight", provider: "stability", providerDisplay: "Stability AI", price: "8 кр", desc: "Замена фона + освещение", category: "images" },
  // Stability AI — Control
  { id: "structure-control", name: "Structure Control", provider: "stability", providerDisplay: "Stability AI", price: "5 кр", desc: "Генерация по структуре", category: "images" },
  { id: "sketch-control", name: "Sketch Control", provider: "stability", providerDisplay: "Stability AI", price: "5 кр", desc: "Генерация по скетчу", category: "images" },
  { id: "style-guide", name: "Style Guide", provider: "stability", providerDisplay: "Stability AI", price: "5 кр", desc: "Генерация по стилю", category: "images" },
  { id: "style-transfer", name: "Style Transfer", provider: "stability", providerDisplay: "Stability AI", price: "8 кр", desc: "Перенос стиля", category: "images" },

  // Perplexity
  { id: "perplexity/sonar-pro-search", name: "Sonar Pro Search", provider: "perplexity", providerDisplay: "Perplexity", price: "$3/$15", desc: "С поиском в интернете!", category: "research" },
  { id: "perplexity/sonar-pro", name: "Sonar Pro", provider: "perplexity", providerDisplay: "Perplexity", price: "$3/$15", desc: "Ресёрч Perplexity", category: "research" },
  { id: "perplexity/sonar-deep-research", name: "Sonar Deep Research", provider: "perplexity", providerDisplay: "Perplexity", price: "$5/$25", desc: "Глубокий ресёрч", category: "research" },

  // Mistral
  { id: "mistralai/mistral-large-2411", name: "Mistral Large", provider: "mistral", providerDisplay: "Mistral", price: "$2/$6", desc: "Топ Mistral", category: "chat" },
  { id: "mistralai/codestral-2508", name: "Codestral", provider: "mistral", providerDisplay: "Mistral", price: "$0.30/$0.90", desc: "80+ языков кода", category: "code" },
  { id: "mistralai/devstral-medium", name: "Devstral", provider: "mistral", providerDisplay: "Mistral", price: "$0.50/$1.50", desc: "Код от Mistral", category: "code" },

  // Free models
  { id: "llama-3.3-70b-versatile", name: "Llama 3.3 70B (Groq)", provider: "free", providerDisplay: "Groq", price: "Бесплатно", desc: "70B, быстрый", category: "chat", free: true },
  { id: "llama-3.1-8b-instant", name: "Llama 3.1 8B (Groq)", provider: "free", providerDisplay: "Groq", price: "Бесплатно", desc: "8B, мгновенный", category: "fast", free: true },
  { id: "qwen-3-235b", name: "Qwen 3 235B (Cerebras)", provider: "free", providerDisplay: "Cerebras", price: "Бесплатно", desc: "235B, бесплатно", category: "chat", free: true },
  { id: "nvidia/nemotron-3-nano-30b-a3b:free", name: "Nemotron 30B", provider: "free", providerDisplay: "Nvidia", price: "Бесплатно", desc: "30B, Nvidia", category: "chat", free: true },
  { id: "nvidia/nemotron-nano-9b-v2:free", name: "Nemotron 9B", provider: "free", providerDisplay: "Nvidia", price: "Бесплатно", desc: "9B, Nvidia", category: "fast", free: true },

  // Other providers
  { id: "cohere/command-a", name: "Command A", provider: "other", providerDisplay: "Cohere", price: "$2.50/$10", desc: "Для RAG, retrieval", category: "chat" },
  { id: "moonshotai/kimi-k2.5", name: "Kimi K2.5", provider: "other", providerDisplay: "Moonshot", price: "$0.45/$2.20", desc: "Топ Moonshot", category: "flagship" },
  { id: "moonshotai/kimi-k2", name: "Kimi K2", provider: "other", providerDisplay: "Moonshot", price: "$0.57/$2.30", desc: "Moonshot AI", category: "chat" },
  { id: "inception/mercury-coder", name: "Mercury Coder", provider: "other", providerDisplay: "Inception", price: "$0.25/$1", desc: "Специализированный кодер", category: "code" },
  { id: "amazon/nova-premier-v1", name: "Nova Premier", provider: "other", providerDisplay: "Amazon", price: "$2.50/$12.50", desc: "Amazon AI", category: "chat" },
  { id: "minimax/minimax-m2.7", name: "MiniMax M2.7", provider: "other", providerDisplay: "MiniMax", price: "$0.30/$1.20", desc: "MiniMax AI", category: "chat" },
  { id: "baidu/ernie-4.5-300b-a47b", name: "ERNIE 4.5 300B", provider: "other", providerDisplay: "Baidu", price: "$0.28/$1.10", desc: "Baidu AI", category: "chat" },

  // Meta (additional)
  { id: "meta-llama/llama-4-scout", name: "Llama 4 Scout", provider: "meta", providerDisplay: "Meta", price: "$0.10/$0.30", desc: "Быстрая разведка", category: "fast" },

  // OpenAI (additional verified)
  { id: "gpt-5.2", name: "GPT-5.2", provider: "openai", providerDisplay: "OpenAI", price: "$1.75/$14", desc: "Advanced reasoning", category: "flagship" },
  { id: "gpt-5.1", name: "GPT-5.1", provider: "openai", providerDisplay: "OpenAI", price: "$1.25/$10", desc: "Standard 5.1", category: "chat" },
  { id: "gpt-4.1-mini", name: "GPT-4.1 Mini", provider: "openai", providerDisplay: "OpenAI", price: "$0.40/$1.60", desc: "Мини 4.1", category: "fast" },
  { id: "dall-e-2", name: "DALL-E 2", provider: "openai", providerDisplay: "OpenAI", price: "~$0.02/img", desc: "Быстрая генерация", category: "images" },

  // Anthropic (additional verified)
  { id: "claude-sonnet-4-5-20250929", name: "Claude Sonnet 4.5", provider: "anthropic", providerDisplay: "Anthropic", price: "$3/$15", desc: "Предыдущее поколение", category: "chat" },
  { id: "claude-opus-4-5-20251101", name: "Claude Opus 4.5", provider: "anthropic", providerDisplay: "Anthropic", price: "$5/$25", desc: "Предыдущее поколение", category: "flagship" },

  // SambaNova (free)
  { id: "Meta-Llama-3.3-70B-Instruct", name: "Llama 3.3 70B (SN)", provider: "free", providerDisplay: "SambaNova", price: "Бесплатно", desc: "70B, SambaNova, бесплатно", category: "chat", free: true },
  { id: "Meta-Llama-3.1-8B-Instruct", name: "Llama 3.1 8B (SN)", provider: "free", providerDisplay: "SambaNova", price: "Бесплатно", desc: "8B, SambaNova, бесплатно", category: "fast", free: true },

  // DeepSeek (additional)
  { id: "deepseek/deepseek-r1", name: "DeepSeek R1 (v1)", provider: "deepseek", providerDisplay: "DeepSeek", price: "$0.55/$2.19", desc: "Reasoning v1", category: "research" },
];

// Legacy — для обратной совместимости
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

// Полный каталог моделей по провайдерам
const providerModels: Record<string, { category: string; models: string[] }[]> = {
  openrouter: [
    { category: "Флагманы", models: ["x-ai/grok-4", "deepseek/deepseek-r1-0528", "qwen/qwen-max"] },
    { category: "Код", models: ["qwen/qwen3-coder", "mistralai/codestral-2508", "x-ai/grok-code-fast-1", "inception/mercury-coder"] },
    { category: "Быстрые", models: ["x-ai/grok-4.1-fast", "deepseek/deepseek-chat", "meta-llama/llama-3.3-70b-instruct"] },
    { category: "Ресёрч", models: ["perplexity/sonar-pro-search", "deepseek/deepseek-r1-0528"] },
    { category: "Чат", models: ["mistralai/mistral-large-2411", "cohere/command-a", "moonshotai/kimi-k2.5"] },
    { category: "Бесплатные", models: ["nvidia/nemotron-3-nano-30b-a3b:free", "stepfun/step-3.5-flash:free"] },
  ],
  groq: [
    { category: "Все", models: ["llama-3.3-70b-versatile", "llama-3.1-8b-instant"] },
  ],
  openai: [
    { category: "Все", models: ["gpt-4o", "gpt-4.1", "gpt-4.1-nano", "gpt-4.1-mini", "o3", "o4-mini", "gpt-5", "gpt-5-nano"] },
  ],
  anthropic: [
    { category: "Все", models: ["claude-sonnet-4-6", "claude-haiku-4-5", "claude-opus-4-6"] },
  ],
  stability: [
    { category: "Все", models: ["sd3.5-large", "sd3.5-medium", "stable-image-ultra"] },
  ],
  apiyi: [
    { category: "Все", models: ["nano-banana", "nano-banana-2", "nano-banana-pro", "gemini-2.5-flash", "gemini-2.5-pro", "flux-2-pro"] },
  ],
  custom: [],
};

// Маппинг категорий → провайдеры для обратной совместимости
function getProviderForCategory(categoryId: string): string | null {
  const map: Record<string, string> = {
    flagship: "openrouter", fast: "openrouter", code: "openrouter",
    images: "stability", research: "openrouter", chat: "openrouter",
    free: "groq", video: "openai", custom: "custom",
  };
  return map[categoryId] || null;
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
  const [modelSearch, setModelSearch] = useState("");
  const [soloMode, setSoloMode] = useState(false);
  const [providerFilter, setProviderFilter] = useState("all");

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

  // Filtered models for catalog
  const filteredModels = useMemo(() => {
    const q = modelSearch.toLowerCase();
    return ALL_MODELS.filter(m => {
      const matchesSearch = !q || m.id.toLowerCase().includes(q) || m.name.toLowerCase().includes(q) || m.desc.toLowerCase().includes(q) || m.providerDisplay.toLowerCase().includes(q);
      const matchesProvider = providerFilter === "all" || m.provider === providerFilter || (providerFilter === "free" && m.free);
      return matchesSearch && matchesProvider;
    });
  }, [modelSearch, providerFilter]);

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

          {/* Step 1: Model Catalog */}
          {step === 1 && (
            <div>
              {/* Search */}
              <div className="relative mb-3">
                <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: "var(--text-tertiary)" }} />
                <input
                  type="text"
                  placeholder="Поиск модели... (gpt-5, claude, llama, sd3...)"
                  value={modelSearch}
                  onChange={(e) => setModelSearch(e.target.value)}
                  className="w-full pl-8 pr-3 py-2.5 rounded-lg text-[13px] outline-none"
                  style={{ backgroundColor: "var(--bg-input)", border: "1px solid var(--border-default)", color: "var(--text-primary)" }}
                  autoFocus
                />
              </div>

              {/* Provider filter pills */}
              <div className="flex flex-wrap gap-1.5 mb-3">
                {providerFilters.map(pf => (
                  <button
                    key={pf.id}
                    onClick={() => setProviderFilter(pf.id)}
                    className="px-2.5 py-1 rounded-lg text-[10px] font-medium transition-all"
                    style={{
                      backgroundColor: providerFilter === pf.id ? pf.color : "var(--bg-elevated)",
                      color: providerFilter === pf.id ? "#fff" : "var(--text-tertiary)",
                      border: `1px solid ${providerFilter === pf.id ? pf.color : "var(--border-default)"}`,
                    }}
                  >
                    {pf.name}
                  </button>
                ))}
              </div>

              {/* Model list */}
              <div className="max-h-[320px] overflow-y-auto space-y-1">
                {filteredModels.length === 0 && (
                  <p className="text-center py-8 text-[12px]" style={{ color: "var(--text-tertiary)" }}>Модели не найдены</p>
                )}
                {filteredModels.map(m => {
                  const isAdded = agents.some(a => a.model_name === m.id);
                  const pf = providerFilters.find(p => p.id === m.provider);
                  const provColor = pf?.color || "var(--text-tertiary)";
                  return (
                    <div
                      key={m.id}
                      className="flex items-center gap-3 px-3 py-2 rounded-lg transition-colors cursor-pointer"
                      style={{ backgroundColor: "var(--bg-elevated)", border: "1px solid var(--border-default)" }}
                      onClick={() => {
                        if (isAdded) return;
                        const detected = detectProvider(m.id);
                        setProvider(detected);
                        setModelName(m.id);
                        setName(m.name);
                        setStep(2);
                      }}
                      onMouseEnter={e => { e.currentTarget.style.borderColor = provColor; }}
                      onMouseLeave={e => { e.currentTarget.style.borderColor = "var(--border-default)"; }}
                    >
                      {/* Provider dot */}
                      <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: provColor }} />
                      {/* Info */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="text-[12px] font-semibold" style={{ color: "var(--text-primary)" }}>{m.name}</span>
                          {m.free && <span className="text-[8px] px-1.5 py-0.5 rounded" style={{ backgroundColor: "rgba(34,197,94,0.15)", color: "#22c55e" }}>FREE</span>}
                          {PLATFORM_PROVIDERS.includes(m.provider) && !m.free && <span className="text-[8px] px-1.5 py-0.5 rounded" style={{ backgroundColor: "rgba(129,140,248,0.12)", color: "var(--accent-blue)" }}>Наш ключ</span>}
                        </div>
                        <div className="text-[10px]" style={{ color: "var(--text-tertiary)" }}>
                          <span style={{ color: provColor }}>{m.providerDisplay}</span>
                          <span className="mx-1">·</span>
                          <span>{m.price}</span>
                          <span className="mx-1">·</span>
                          <span>{m.desc}</span>
                        </div>
                      </div>
                      {/* Add button */}
                      {isAdded ? (
                        <Check size={14} style={{ color: "var(--accent-teal)", flexShrink: 0 }} />
                      ) : (
                        <div className="w-6 h-6 rounded-md flex items-center justify-center flex-shrink-0 text-[14px] font-light" style={{ backgroundColor: "var(--bg-surface)", color: "var(--text-secondary)" }}>+</div>
                      )}
                    </div>
                  );
                })}
              </div>

              {/* Custom model input */}
              <div className="mt-3 pt-3" style={{ borderTop: "1px solid var(--border-default)" }}>
                <p className="text-[10px] font-semibold uppercase mb-1.5" style={{ color: "var(--text-tertiary)" }}>Или введите ID модели вручную</p>
                <div className="flex gap-2">
                  <input
                    value={modelName}
                    onChange={(e) => setModelName(e.target.value)}
                    placeholder="provider/model-name"
                    className="flex-1 px-3 py-2 rounded-lg text-[12px] outline-none"
                    style={{ backgroundColor: "var(--bg-input)", border: "1px solid var(--border-default)", color: "var(--text-primary)" }}
                  />
                  <button
                    onClick={() => { if (modelName) { setProvider(detectProvider(modelName)); setName(modelName.split("/").pop() || modelName); setStep(2); } }}
                    disabled={!modelName}
                    className="px-4 py-2 rounded-lg text-[12px] font-medium disabled:opacity-30"
                    style={{ backgroundColor: "var(--accent-blue)", color: "#fff" }}
                  >
                    Далее
                  </button>
                </div>
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

              {/* Одиночный режим */}
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setSoloMode(!soloMode)}
                  className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-[11px] transition-colors"
                  style={{
                    backgroundColor: soloMode ? "var(--accent-blue)" : "var(--bg-elevated)",
                    color: soloMode ? "#fff" : "var(--text-secondary)",
                    border: `1px solid ${soloMode ? "var(--accent-blue)" : "var(--border-default)"}`,
                  }}
                >
                  {soloMode ? <Check size={12} /> : null}
                  Одиночный режим
                </button>
                <span className="text-[10px]" style={{ color: "var(--text-tertiary)" }}>
                  {soloMode ? "1 агент, без команды" : "Командный режим"}
                </span>
              </div>

              {/* Model */}
              <div>
                <label className="text-[11px] block mb-1" style={{ color: "var(--text-tertiary)" }}>Модель</label>
                {/* Поиск */}
                <div className="relative mb-2">
                  <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: "var(--text-tertiary)" }} />
                  <input
                    type="text"
                    placeholder="Поиск модели..."
                    value={modelSearch}
                    onChange={(e) => setModelSearch(e.target.value)}
                    className="w-full pl-8 pr-3 py-2 rounded-lg text-[12px] outline-none"
                    style={{ backgroundColor: "var(--bg-input)", border: "1px solid var(--border-default)", color: "var(--text-primary)" }}
                  />
                </div>
                {/* Модели по провайдеру */}
                <div className="max-h-[180px] overflow-y-auto space-y-2 mb-2">
                  {(() => {
                    const resolvedProvider = getProviderForCategory(provider) || provider;
                    const groups = providerModels[resolvedProvider] || [];
                    const categoryModels = modelSuggestions[provider] || [];
                    const searchLower = modelSearch.toLowerCase();

                    // Если есть группы провайдера — показываем по группам
                    if (groups.length > 0) {
                      return groups.map((g) => {
                        const filtered = g.models.filter((m) => m.toLowerCase().includes(searchLower));
                        if (filtered.length === 0) return null;
                        return (
                          <div key={g.category}>
                            <div className="text-[10px] font-semibold uppercase tracking-wider mb-1" style={{ color: "var(--text-tertiary)" }}>{g.category}</div>
                            <div className="flex flex-wrap gap-1.5">
                              {filtered.map((m) => (
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
                                    <span className="text-[9px] mt-0.5" style={{ color: modelName === m ? "rgba(255,255,255,0.7)" : "var(--text-tertiary)" }}>
                                      {modelDescriptions[m]}
                                    </span>
                                  )}
                                </button>
                              ))}
                            </div>
                          </div>
                        );
                      });
                    }

                    // Фоллбэк на старые modelSuggestions
                    const filtered = categoryModels.filter((m) => m.toLowerCase().includes(searchLower));
                    return (
                      <div className="flex flex-wrap gap-1.5">
                        {filtered.map((m) => (
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
                              <span className="text-[9px] mt-0.5" style={{ color: modelName === m ? "rgba(255,255,255,0.7)" : "var(--text-tertiary)" }}>
                                {modelDescriptions[m]}
                              </span>
                            )}
                          </button>
                        ))}
                      </div>
                    );
                  })()}
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
