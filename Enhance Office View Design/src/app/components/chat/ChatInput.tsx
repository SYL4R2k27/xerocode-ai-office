import { useState, useRef, useCallback } from "react";
import { Send, Zap, Edit3, Lightbulb, ChevronDown, Wand2, Code, Palette, Search, FileText, MoreHorizontal, Paperclip, X, Image, Code2, Archive, File, Loader2, Play, BarChart3, ClipboardList, GraduationCap } from "lucide-react";
import { api } from "../../lib/api";
import { DesignPanel, DEFAULT_DESIGN_PARAMS, serializeDesignParams } from "./DesignPanel";
import type { DesignParams } from "./DesignPanel";
import { CodePanel, DEFAULT_CODE_PARAMS, serializeCodeParams } from "./CodePanel";
import type { CodeParams } from "./CodePanel";
import { ResearchPanel, DEFAULT_RESEARCH_PARAMS, serializeResearchParams } from "./ResearchPanel";
import type { ResearchParams } from "./ResearchPanel";
import { TextPanel, DEFAULT_TEXT_PARAMS, serializeTextParams } from "./TextPanel";
import type { TextParams } from "./TextPanel";
import { DataPanel, DEFAULT_DATA_PARAMS, serializeDataParams } from "./DataPanel";
import type { DataParams } from "./DataPanel";
import { ManagementPanel, DEFAULT_MANAGEMENT_PARAMS, serializeManagementParams } from "./ManagementPanel";
import type { ManagementParams } from "./ManagementPanel";
import { EducationPanel, DEFAULT_EDUCATION_PARAMS, serializeEducationParams } from "./EducationPanel";
import type { EducationParams } from "./EducationPanel";

type InputMode = "command" | "edit" | "idea";
type GoalMode = "manager" | "discussion" | "auto";

const modes: Record<InputMode, { label: string; icon: typeof Zap; color: string }> = {
  command: { label: "Команда", icon: Zap, color: "var(--accent-blue)" },
  edit: { label: "Правка", icon: Edit3, color: "var(--accent-amber)" },
  idea: { label: "Идея", icon: Lightbulb, color: "var(--accent-lavender)" },
};

const goalModes: Record<GoalMode, { label: string; color: string }> = {
  manager: { label: "Менеджер", color: "var(--accent-blue)" },
  discussion: { label: "Обсуждение", color: "var(--accent-lavender)" },
  auto: { label: "Авто", color: "var(--accent-teal)" },
};

const categoryButtons = [
  { id: "code", label: "Код", icon: Code, mode: "manager" as GoalMode, prefix: "[Код]", color: "#3b82f6" },
  { id: "design", label: "Дизайн", icon: Palette, mode: "auto" as GoalMode, prefix: "[Дизайн]", color: "#a78bfa" },
  { id: "research", label: "Ресёрч", icon: Search, mode: "discussion" as GoalMode, prefix: "[Ресёрч]", color: "#2dd4bf" },
  { id: "text", label: "Текст", icon: FileText, mode: "auto" as GoalMode, prefix: "[Текст]", color: "#f59e0b" },
  { id: "data", label: "Данные", icon: BarChart3, mode: "manager" as GoalMode, prefix: "[Данные]", color: "#10b981" },
  { id: "management", label: "Менеджмент", icon: ClipboardList, mode: "manager" as GoalMode, prefix: "[Менеджмент]", color: "#f43f5e" },
  { id: "education", label: "Обучение", icon: GraduationCap, mode: "discussion" as GoalMode, prefix: "[Обучение]", color: "#8b5cf6" },
];

const IMAGE_EXTS = [".png", ".jpg", ".jpeg", ".gif", ".webp", ".svg"];
const DOC_EXTS = [".pdf", ".doc", ".docx", ".txt", ".md"];
const CODE_EXTS = [".py", ".js", ".ts", ".html", ".css", ".json"];
const ARCHIVE_EXTS = [".zip", ".rar", ".tar.gz", ".7z"];

function getFileCategory(name: string): "image" | "document" | "code" | "archive" | "other" {
  const lower = name.toLowerCase();
  if (IMAGE_EXTS.some((e) => lower.endsWith(e))) return "image";
  if (DOC_EXTS.some((e) => lower.endsWith(e))) return "document";
  if (CODE_EXTS.some((e) => lower.endsWith(e))) return "code";
  if (ARCHIVE_EXTS.some((e) => lower.endsWith(e))) return "archive";
  return "other";
}

function getFileIcon(category: "image" | "document" | "code" | "archive" | "other") {
  switch (category) {
    case "image": return Image;
    case "document": return FileText;
    case "code": return Code2;
    case "archive": return Archive;
    default: return File;
  }
}

function formatSize(bytes: number): string {
  if (bytes < 1024) return bytes + " Б";
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + " КБ";
  return (bytes / (1024 * 1024)).toFixed(1) + " МБ";
}

/** Расширяет короткую идею в детальный промпт для ИИ-команды. */
function expandToPrompt(shortIdea: string): string {
  const idea = shortIdea.trim();
  if (idea.length > 200) return idea; // уже достаточно подробный

  // Определяем тип задачи
  const isCode = /код|программ|скрипт|сайт|приложен|api|бот|сервер|frontend|backend|бэкенд|фронтенд/i.test(idea);
  const isDesign = /дизайн|макет|лого|баннер|ui|ux|интерфейс|стиль/i.test(idea);
  const isResearch = /анализ|исследова|сравни|найди|изучи|ресёрч|обзор|рынок/i.test(idea);
  const isText = /текст|статья|пост|письмо|описани|контент|копирайт/i.test(idea);

  let expanded = `Цель: ${idea}\n\n`;

  if (isCode) {
    expanded += `Требования:\n`;
    expanded += `- Напиши чистый, рабочий код\n`;
    expanded += `- Добавь обработку ошибок\n`;
    expanded += `- Прокомментируй ключевые моменты\n`;
    expanded += `- Протестируй работоспособность\n`;
    expanded += `- Используй современные практики\n\n`;
    expanded += `Результат: рабочий код + инструкция по запуску`;
  } else if (isDesign) {
    expanded += `Требования:\n`;
    expanded += `- Современный минималистичный стиль\n`;
    expanded += `- Адаптивность (мобайл + десктоп)\n`;
    expanded += `- Продумай цветовую палитру и типографику\n`;
    expanded += `- Предложи 2-3 варианта\n\n`;
    expanded += `Результат: макет/код + описание дизайн-решений`;
  } else if (isResearch) {
    expanded += `Требования:\n`;
    expanded += `- Проведи глубокий анализ темы\n`;
    expanded += `- Найди актуальные данные и источники\n`;
    expanded += `- Сравни варианты с плюсами и минусами\n`;
    expanded += `- Сделай выводы и рекомендации\n\n`;
    expanded += `Результат: структурированный отчёт с выводами`;
  } else if (isText) {
    expanded += `Требования:\n`;
    expanded += `- Пиши на русском языке\n`;
    expanded += `- Адаптируй стиль под целевую аудиторию\n`;
    expanded += `- Структурируй текст с заголовками\n`;
    expanded += `- Проверь на ошибки\n\n`;
    expanded += `Результат: готовый текст`;
  } else {
    expanded += `Задачи для команды:\n`;
    expanded += `- Разберись в задаче и спланируй выполнение\n`;
    expanded += `- Раздели на подзадачи и распредели по ролям\n`;
    expanded += `- Выполни каждую подзадачу качественно\n`;
    expanded += `- Проверь результат перед сдачей\n\n`;
    expanded += `Результат: готовое решение + отчёт о выполнении`;
  }

  return expanded;
}

interface ChatInputProps {
  hasActiveGoal: boolean;
  activeGoal?: string;
  goalStarted: boolean;
  onCreateGoal: (title: string, mode: "manager" | "discussion" | "auto") => void;
  onStartGoal: () => void;
  onSendMessage: (content: string, type: InputMode) => void;
  isStarting?: boolean;
  externalFiles?: File[];
  onClearExternalFiles?: () => void;
}

export function ChatInput({ hasActiveGoal, activeGoal, goalStarted, onCreateGoal, onStartGoal, onSendMessage, isStarting, externalFiles, onClearExternalFiles }: ChatInputProps) {
  const MAX_MESSAGE_LENGTH = 10000;
  const [text, setText] = useState("");

  const handleTextChange = (val: string) => {
    const sanitized = val.replace(/[\x00-\x08\x0B\x0C\x0E-\x1F]/g, "");
    if (sanitized.length <= MAX_MESSAGE_LENGTH) setText(sanitized);
  };
  const [goalTitle, setGoalTitle] = useState("");
  const [mode, setMode] = useState<InputMode>("command");
  const [goalMode, setGoalMode] = useState<GoalMode>("manager");
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [showModeMenu, setShowModeMenu] = useState(false);
  const [showExpandedPreview, setShowExpandedPreview] = useState(false);
  const [expandedText, setExpandedText] = useState("");
  const [attachedFiles, setAttachedFiles] = useState<File[]>([]);
  const [isEnhancing, setIsEnhancing] = useState(false);
  const [panelOpen, setPanelOpen] = useState(false);
  const [designParams, setDesignParams] = useState<DesignParams>(DEFAULT_DESIGN_PARAMS);
  const [codeParams, setCodeParams] = useState<CodeParams>(DEFAULT_CODE_PARAMS);
  const [researchParams, setResearchParams] = useState<ResearchParams>(DEFAULT_RESEARCH_PARAMS);
  const [textParams, setTextParams] = useState<TextParams>(DEFAULT_TEXT_PARAMS);
  const [dataParams, setDataParams] = useState<DataParams>(DEFAULT_DATA_PARAMS);
  const [managementParams, setManagementParams] = useState<ManagementParams>(DEFAULT_MANAGEMENT_PARAMS);
  const [educationParams, setEducationParams] = useState<EducationParams>(DEFAULT_EDUCATION_PARAMS);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const goalTitleRef = useRef<HTMLInputElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Merge external files (from drag & drop) into attachedFiles
  const allFiles = [...attachedFiles, ...(externalFiles || [])];

  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files) {
      setAttachedFiles((prev) => [...prev, ...Array.from(files)]);
    }
    // Reset so same file can be re-selected
    if (fileInputRef.current) fileInputRef.current.value = "";
  }, []);

  const removeFile = useCallback((index: number) => {
    // If index is within attachedFiles range, remove from there
    if (index < attachedFiles.length) {
      setAttachedFiles((prev) => prev.filter((_, i) => i !== index));
    } else {
      // It's in externalFiles range — clear all external files
      onClearExternalFiles?.();
    }
  }, [attachedFiles.length, onClearExternalFiles]);

  // Категории, у которых есть специализированная панель
  const PANEL_CATEGORIES = ["code", "design", "research", "text", "data", "management", "education"];

  const handleCategorySelect = useCallback((cat: typeof categoryButtons[0]) => {
    setSelectedCategory(cat.id);
    setGoalMode(cat.mode);
    // Автоматически открывать панель при выборе категории с панелью
    setPanelOpen(PANEL_CATEGORIES.includes(cat.id));
    if (!hasActiveGoal) {
      goalTitleRef.current?.focus();
    } else {
      textareaRef.current?.focus();
    }
  }, [hasActiveGoal]);

  const handleAutoPrompt = useCallback(async () => {
    const trimmed = text.trim();
    if (!trimmed || isEnhancing) return;

    setIsEnhancing(true);

    // Определяем категорию из выбранной кнопки
    const category = selectedCategory || "general";

    try {
      // Пробуем серверное AI-улучшение с таймаутом 3с
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 3000);

      const result = await api.autoprompt.enhance(trimmed, category);
      clearTimeout(timeout);

      if (result.enhanced && result.enhanced !== trimmed) {
        setExpandedText(result.enhanced);
        setShowExpandedPreview(true);
      }
    } catch {
      // Фолбэк на локальное расширение
      const expanded = expandToPrompt(trimmed);
      if (expanded !== trimmed) {
        setExpandedText(expanded);
        setShowExpandedPreview(true);
      }
    } finally {
      setIsEnhancing(false);
    }
  }, [text, isEnhancing, selectedCategory]);

  const handleAcceptExpanded = useCallback(() => {
    setText(expandedText);
    setShowExpandedPreview(false);
    setExpandedText("");
    if (textareaRef.current) {
      textareaRef.current.style.height = "44px";
      setTimeout(() => {
        if (textareaRef.current) {
          textareaRef.current.style.height = Math.min(textareaRef.current.scrollHeight, 160) + "px";
        }
      }, 10);
    }
  }, [expandedText]);

  const handleCreateGoalOnly = useCallback(() => {
    const title = goalTitle.trim();
    if (!title) return;
    onCreateGoal(title, goalMode);
    setGoalTitle("");
    // НЕ сбрасываем selectedCategory — панель (Дизайн и др.) остаётся активной
  }, [goalTitle, goalMode, onCreateGoal]);

  const handleSubmit = useCallback(async () => {
    const trimmed = text.trim();
    const hasFiles = allFiles.length > 0;
    if (!trimmed && !hasFiles) return;

    // Добавляем параметры категории если панель открыта
    let categorySuffix = "";
    if (panelOpen && selectedCategory) {
      switch (selectedCategory) {
        case "design": categorySuffix = serializeDesignParams(designParams); break;
        case "code": categorySuffix = serializeCodeParams(codeParams); break;
        case "research": categorySuffix = serializeResearchParams(researchParams); break;
        case "text": categorySuffix = serializeTextParams(textParams); break;
        case "data": categorySuffix = serializeDataParams(dataParams); break;
        case "management": categorySuffix = serializeManagementParams(managementParams); break;
        case "education": categorySuffix = serializeEducationParams(educationParams); break;
      }
    }

    if (hasActiveGoal && !goalStarted) {
      // Описание задачи → отправить как сообщение и запустить
      const uploadedNames: string[] = [];
      if (hasFiles && activeGoal) {
        for (const file of allFiles) {
          try {
            const result = await api.files.upload(activeGoal, file);
            uploadedNames.push(result.filename || file.name);
          } catch (e) {
            console.error("Upload failed:", e);
            uploadedNames.push(file.name + " (не загружен)");
          }
        }
      }
      let content = trimmed + categorySuffix;
      if (uploadedNames.length > 0) {
        const fileNames = uploadedNames.join(", ");
        content = content ? `${content}\n\n📎 Файлы: ${fileNames}` : `📎 Файлы: ${fileNames}`;
      }
      onSendMessage(content, "command");
      onStartGoal();
    } else if (hasActiveGoal && goalStarted) {
      // Обычное сообщение в чат
      const uploadedNames: string[] = [];
      if (hasFiles && activeGoal) {
        for (const file of allFiles) {
          try {
            const result = await api.files.upload(activeGoal, file);
            uploadedNames.push(result.filename || file.name);
          } catch (e) {
            console.error("Upload failed:", e);
            uploadedNames.push(file.name + " (не загружен)");
          }
        }
      }
      let content = trimmed + categorySuffix;
      if (uploadedNames.length > 0) {
        const fileNames = uploadedNames.join(", ");
        content = content ? `${content}\n\n📎 Файлы: ${fileNames}` : `📎 Файлы: ${fileNames}`;
      }
      onSendMessage(content, mode);
    }
    setText("");
    setAttachedFiles([]);
    onClearExternalFiles?.();
    setShowExpandedPreview(false);
    if (textareaRef.current) {
      textareaRef.current.style.height = "44px";
    }
  }, [text, mode, goalMode, hasActiveGoal, goalStarted, activeGoal, onCreateGoal, onStartGoal, onSendMessage, allFiles, onClearExternalFiles, selectedCategory, panelOpen, designParams, codeParams, researchParams, textParams, dataParams, managementParams, educationParams]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      if (hasActiveGoal && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        handleSubmit();
      } else if (hasActiveGoal && !goalStarted) {
        e.preventDefault();
        handleSubmit();
      }
    }
  };

  const handleTitleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      e.preventDefault();
      handleCreateGoalOnly();
    }
  };

  const handleInput = () => {
    const ta = textareaRef.current;
    if (ta) {
      ta.style.height = "44px";
      ta.style.height = Math.min(ta.scrollHeight, 160) + "px";
    }
  };

  const placeholder = !hasActiveGoal
    ? "Опишите задачу для ИИ-команды..."
    : !goalStarted
    ? "Опишите задачу подробнее..."
    : "Напиши команду, правку или идею для команды...";

  const ModeIcon = modes[mode].icon;

  return (
    <div
      className="px-4 py-3 min-w-0"
      style={{ borderTop: "1px solid var(--border-default)", backgroundColor: "var(--bg-base)" }}
    >
      {/* Goal creation form — when no active goal */}
      {!hasActiveGoal && (
        <div className="mb-3 space-y-3 overflow-hidden">
          {/* Title input */}
          <input
            ref={goalTitleRef}
            type="text"
            value={goalTitle}
            onChange={(e) => setGoalTitle(e.target.value)}
            onKeyDown={handleTitleKeyDown}
            placeholder="Название цели..."
            className="w-full bg-transparent outline-none"
            style={{
              fontSize: "18px",
              fontWeight: 600,
              color: "var(--text-primary)",
              borderBottom: "1px solid var(--border-default)",
              paddingBottom: "8px",
            }}
          />

          {/* Category quick-select */}
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="text-[10px] font-medium mr-1" style={{ color: "var(--text-tertiary)" }}>
              Категория:
            </span>
            {categoryButtons.map((cat) => {
              const Icon = cat.icon;
              const isSelected = selectedCategory === cat.id;
              return (
                <button
                  key={cat.id}
                  onClick={() => handleCategorySelect(cat)}
                  className="flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-medium transition-all"
                  style={{
                    backgroundColor: isSelected ? cat.color : "var(--bg-elevated)",
                    color: isSelected ? "#fff" : "var(--text-secondary)",
                    border: `1px solid ${isSelected ? cat.color : "var(--border-default)"}`,
                  }}
                >
                  <Icon size={11} />
                  {cat.label}
                </button>
              );
            })}
          </div>

          {/* Goal mode selector */}
          <div className="flex items-center gap-1.5">
            <span className="text-[10px] font-medium mr-1" style={{ color: "var(--text-tertiary)" }}>
              Режим:
            </span>
            {(Object.entries(goalModes) as [GoalMode, { label: string; color: string }][]).map(([key, m]) => (
              <button
                key={key}
                onClick={() => setGoalMode(key)}
                className="px-2.5 py-1 rounded-lg text-[11px] font-medium transition-all"
                style={{
                  backgroundColor: goalMode === key ? m.color : "var(--bg-elevated)",
                  color: goalMode === key ? "#fff" : "var(--text-secondary)",
                  border: `1px solid ${goalMode === key ? m.color : "var(--border-default)"}`,
                }}
              >
                {m.label}
              </button>
            ))}
          </div>

          {/* Create goal button */}
          <button
            onClick={handleCreateGoalOnly}
            disabled={!goalTitle.trim() || isStarting}
            className="px-4 py-2 rounded-lg text-[13px] font-medium transition-all disabled:opacity-30"
            style={{ backgroundColor: "var(--accent-blue)", color: "#fff" }}
          >
            Создать цель
          </button>
        </div>
      )}

      {/* Mode selector + start hint */}
      {hasActiveGoal && goalStarted && (
        <div className="flex items-center gap-1 mb-2 relative">
          <button
            onClick={() => setShowModeMenu(!showModeMenu)}
            className="flex items-center gap-1.5 px-2 py-1 rounded-md text-[11px] font-medium transition-colors hover:bg-white/5"
            style={{ color: modes[mode].color }}
          >
            <ModeIcon size={12} />
            {modes[mode].label}
            <ChevronDown size={10} />
          </button>

          {showModeMenu && (
            <div
              className="absolute bottom-full left-0 mb-1 rounded-lg py-1 z-50 min-w-[140px]"
              style={{ backgroundColor: "var(--bg-elevated)", border: "1px solid var(--border-default)" }}
            >
              {(Object.entries(modes) as [InputMode, typeof modes.command][]).map(([key, m]) => {
                const Icon = m.icon;
                return (
                  <button
                    key={key}
                    onClick={() => { setMode(key); setShowModeMenu(false); }}
                    className="flex items-center gap-2 w-full px-3 py-1.5 text-[12px] hover:bg-white/5 transition-colors"
                    style={{ color: key === mode ? m.color : "var(--text-secondary)" }}
                  >
                    <Icon size={12} />
                    {m.label}
                  </button>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Expanded prompt preview */}
      {showExpandedPreview && expandedText && (
        <div
          className="mb-2 rounded-xl p-3 text-xs leading-relaxed"
          style={{
            backgroundColor: "var(--bg-elevated)",
            border: "1px solid var(--accent-lavender)",
            color: "var(--text-secondary)",
          }}
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-[10px] font-medium" style={{ color: "var(--accent-lavender)" }}>
              ✨ Расширенный промпт
            </span>
            <div className="flex gap-1">
              <button
                onClick={handleAcceptExpanded}
                className="px-2 py-0.5 rounded text-[10px] font-medium transition-colors"
                style={{ backgroundColor: "var(--accent-blue)", color: "#fff" }}
              >
                Применить
              </button>
              <button
                onClick={() => setShowExpandedPreview(false)}
                className="px-2 py-0.5 rounded text-[10px] transition-colors hover:bg-white/5"
                style={{ color: "var(--text-tertiary)" }}
              >
                Отмена
              </button>
            </div>
          </div>
          <pre className="whitespace-pre-wrap font-sans">{expandedText}</pre>
        </div>
      )}

      {/* Attached files preview */}
      {allFiles.length > 0 && (
        <div className="mb-2 flex flex-wrap gap-1.5">
          {allFiles.map((file, idx) => {
            const category = getFileCategory(file.name);
            const IconComp = getFileIcon(category);
            const isImage = category === "image";
            return (
              <div
                key={`${file.name}-${idx}`}
                className="flex items-center gap-1.5 pl-2 pr-1 py-1 rounded-lg text-[11px] max-w-[220px]"
                style={{
                  backgroundColor: "var(--bg-elevated)",
                  border: "1px solid var(--border-default)",
                  color: "var(--text-secondary)",
                }}
              >
                {isImage ? (
                  <img
                    src={URL.createObjectURL(file)}
                    alt={file.name}
                    className="w-5 h-5 rounded object-cover flex-shrink-0"
                  />
                ) : (
                  <IconComp size={13} className="flex-shrink-0" style={{ color: "var(--text-tertiary)" }} />
                )}
                <span className="truncate">{file.name}</span>
                <span className="text-[9px] flex-shrink-0" style={{ color: "var(--text-tertiary)" }}>
                  {formatSize(file.size)}
                </span>
                <button
                  onClick={() => removeFile(idx)}
                  className="w-4 h-4 rounded flex items-center justify-center flex-shrink-0 hover:bg-white/10 transition-colors"
                  style={{ color: "var(--text-tertiary)" }}
                >
                  <X size={10} />
                </button>
              </div>
            );
          })}
        </div>
      )}

      {/* Специализированные панели — выезжают при выборе категории */}
      {selectedCategory === "code" && (
        <CodePanel isOpen={panelOpen} onToggle={() => setPanelOpen(!panelOpen)} params={codeParams} onParamsChange={setCodeParams} />
      )}
      {selectedCategory === "design" && (
        <DesignPanel isOpen={panelOpen} onToggle={() => setPanelOpen(!panelOpen)} params={designParams} onParamsChange={setDesignParams} />
      )}
      {selectedCategory === "research" && (
        <ResearchPanel isOpen={panelOpen} onToggle={() => setPanelOpen(!panelOpen)} params={researchParams} onParamsChange={setResearchParams} />
      )}
      {selectedCategory === "text" && (
        <TextPanel isOpen={panelOpen} onToggle={() => setPanelOpen(!panelOpen)} params={textParams} onParamsChange={setTextParams} />
      )}
      {selectedCategory === "data" && (
        <DataPanel isOpen={panelOpen} onToggle={() => setPanelOpen(!panelOpen)} params={dataParams} onParamsChange={setDataParams} />
      )}
      {selectedCategory === "management" && (
        <ManagementPanel isOpen={panelOpen} onToggle={() => setPanelOpen(!panelOpen)} params={managementParams} onParamsChange={setManagementParams} />
      )}
      {selectedCategory === "education" && (
        <EducationPanel isOpen={panelOpen} onToggle={() => setPanelOpen(!panelOpen)} params={educationParams} onParamsChange={setEducationParams} />
      )}

      {/* Input area — hidden when no active goal (title form is shown above instead) */}
      {hasActiveGoal && (
        <>
          <div
            className="flex items-end gap-2 rounded-xl px-3 py-2 min-w-0 overflow-hidden"
            style={{ backgroundColor: "var(--bg-surface)", border: "1px solid var(--border-default)" }}
          >
            {/* Paperclip button */}
            <button
              onClick={() => fileInputRef.current?.click()}
              className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 transition-all hover:bg-white/5"
              title="Прикрепить файл"
            >
              <Paperclip size={14} style={{ color: "var(--text-tertiary)" }} />
            </button>
            <input
              ref={fileInputRef}
              type="file"
              multiple
              hidden
              onChange={handleFileSelect}
            />

            <textarea
              ref={textareaRef}
              value={text}
              onChange={(e) => setText(e.target.value)}
              onKeyDown={handleKeyDown}
              onInput={handleInput}
              placeholder={placeholder}
              rows={1}
              className="flex-1 min-w-0 bg-transparent resize-none text-sm outline-none overflow-y-auto word-break-all"
              style={{
                color: "var(--text-primary)",
                height: "44px",
                maxHeight: "160px",
                lineHeight: "1.5",
                wordBreak: "break-word",
                overflowWrap: "break-word",
              }}
            />
            {/* Panel toggle button — показывает иконку выбранной категории */}
            {selectedCategory && PANEL_CATEGORIES.includes(selectedCategory) && (() => {
              const cat = categoryButtons.find(c => c.id === selectedCategory);
              if (!cat) return null;
              const CatIcon = cat.icon;
              return (
                <button
                  onClick={() => setPanelOpen(!panelOpen)}
                  className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 transition-all hover:bg-white/5"
                  title={panelOpen ? "Скрыть параметры" : "Параметры"}
                  style={{
                    backgroundColor: panelOpen ? `color-mix(in srgb, ${cat.color} 15%, transparent)` : "transparent",
                    border: panelOpen ? `1px solid color-mix(in srgb, ${cat.color} 30%, transparent)` : "1px solid transparent",
                  }}
                >
                  <CatIcon size={14} style={{ color: panelOpen ? cat.color : "var(--text-tertiary)" }} />
                </button>
              );
            })()}
            {/* Auto-prompt button */}
            {text.trim() && text.trim().length <= 200 && (
              <button
                onClick={handleAutoPrompt}
                disabled={isEnhancing}
                className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 transition-all hover:bg-white/5 disabled:opacity-50"
                title="Улучшить промпт с помощью ИИ"
              >
                {isEnhancing ? (
                  <Loader2 size={14} className="animate-spin" style={{ color: "var(--accent-lavender)" }} />
                ) : (
                  <Wand2 size={14} style={{ color: "var(--accent-lavender)" }} />
                )}
              </button>
            )}
            {!goalStarted ? (
              <button
                onClick={handleSubmit}
                disabled={(!text.trim() && allFiles.length === 0) || isStarting}
                className="px-3 h-8 rounded-lg flex items-center gap-1.5 flex-shrink-0 transition-all disabled:opacity-30 text-[11px] font-medium"
                style={{ backgroundColor: "var(--accent-blue)", color: "#fff" }}
              >
                <Play size={12} />
                {isStarting ? "Запуск..." : "Запустить"}
              </button>
            ) : (
              <button
                onClick={handleSubmit}
                disabled={(!text.trim() && allFiles.length === 0) || isStarting}
                className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 transition-all disabled:opacity-30"
                style={{
                  backgroundColor: (text.trim() || allFiles.length > 0) ? "var(--accent-blue)" : "transparent",
                }}
              >
                <Send size={14} style={{ color: (text.trim() || allFiles.length > 0) ? "#fff" : "var(--text-tertiary)" }} />
              </button>
            )}
          </div>

          <p className="text-[10px] mt-1.5 text-center" style={{ color: "var(--text-placeholder)" }}>
            {!goalStarted ? "Enter — описать и запустить" : "Ctrl+Enter — отправить"}
          </p>
        </>
      )}
      {!hasActiveGoal && (
        <p className="text-[10px] mt-1.5 text-center" style={{ color: "var(--text-placeholder)" }}>
          Введите название и нажмите Enter или кнопку
        </p>
      )}
    </div>
  );
}
