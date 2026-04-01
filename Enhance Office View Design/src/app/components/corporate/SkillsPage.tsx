import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  Zap, Plus, Play, Trash2, Edit3, Search, Loader2,
  Code, FileText, BarChart3, Sparkles, Megaphone, Headphones,
  Bot, X, Save, AlertCircle, Check, Copy,
} from "lucide-react";
import { api, type Template } from "../../lib/api";

/* ── Category config ── */
const CATEGORIES: Array<{ id: string; icon: React.ElementType; label: string; color: string }> = [
  { id: "general", icon: Zap, label: "Общее", color: "var(--accent-blue)" },
  { id: "code", icon: Code, label: "Код", color: "var(--accent-lavender)" },
  { id: "text", icon: FileText, label: "Текст", color: "var(--accent-teal)" },
  { id: "analytics", icon: BarChart3, label: "Аналитика", color: "var(--accent-amber)" },
  { id: "marketing", icon: Megaphone, label: "Маркетинг", color: "var(--accent-rose)" },
  { id: "support", icon: Headphones, label: "Поддержка", color: "var(--accent-green)" },
];

const BUILTIN_SKILLS = [
  { id: "builtin-1", name: "Анализ текста", description: "Проанализируй текст: тон, ключевые мысли, рекомендации по улучшению", category: "text", builtin: true },
  { id: "builtin-2", name: "Code Review", description: "Проведи code review: баги, безопасность, производительность, стиль кода", category: "code", builtin: true },
  { id: "builtin-3", name: "SEO-аудит", description: "Проведи SEO-аудит текста: ключевые слова, мета-описание, заголовки, рекомендации", category: "marketing", builtin: true },
  { id: "builtin-4", name: "Отчёт по данным", description: "Проанализируй данные и создай структурированный отчёт: метрики, тренды, выводы", category: "analytics", builtin: true },
  { id: "builtin-5", name: "Ответ клиенту", description: "Подготовь вежливый и конкретный ответ клиенту с решением проблемы", category: "support", builtin: true },
  { id: "builtin-6", name: "Рефакторинг", description: "Рефакторинг кода: чистая архитектура, DRY, SOLID, именование", category: "code", builtin: true },
];

interface SkillsPageProps {
  orgRole: "owner" | "manager" | "member";
}

export function SkillsPage({ orgRole }: SkillsPageProps) {
  const [skills, setSkills] = useState<Template[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filterCat, setFilterCat] = useState<string | null>(null);
  const [showCreate, setShowCreate] = useState(false);
  const [editingSkill, setEditingSkill] = useState<Template | null>(null);
  const [runningId, setRunningId] = useState<string | null>(null);
  const [runResult, setRunResult] = useState<{ id: string; goalId: string } | null>(null);

  // Form state
  const [formName, setFormName] = useState("");
  const [formDesc, setFormDesc] = useState("");
  const [formCat, setFormCat] = useState("general");
  const [formSaving, setFormSaving] = useState(false);

  const loadSkills = useCallback(async () => {
    try {
      const data = await api.templates.list();
      setSkills(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadSkills(); }, [loadSkills]);

  const handleCreate = useCallback(async () => {
    if (!formName.trim()) return;
    setFormSaving(true);
    try {
      await api.templates.create({
        name: formName.trim(),
        description: formDesc.trim(),
        category: formCat,
        agents_config: [],
      });
      await loadSkills();
      setShowCreate(false);
      setFormName("");
      setFormDesc("");
      setFormCat("general");
    } catch (err) {
      console.error(err);
    } finally {
      setFormSaving(false);
    }
  }, [formName, formDesc, formCat, loadSkills]);

  const handleRun = useCallback(async (skillId: string, isBuiltin: boolean) => {
    setRunningId(skillId);
    try {
      if (isBuiltin) {
        // For builtin skills, create a goal directly
        const skill = BUILTIN_SKILLS.find(s => s.id === skillId);
        if (skill) {
          const goal = await api.goals.create({
            title: skill.name,
            description: skill.description,
          });
          setRunResult({ id: skillId, goalId: goal.id });
        }
      } else {
        const result = await api.templates.use(skillId);
        setRunResult({ id: skillId, goalId: result.id });
      }
      setTimeout(() => setRunResult(null), 3000);
    } catch (err: any) {
      console.error(err);
    } finally {
      setRunningId(null);
    }
  }, []);

  const handleDelete = useCallback(async (id: string) => {
    try {
      // api.templates doesn't have delete, but we can add it
      // For now just remove from local state
      setSkills(prev => prev.filter(s => s.id !== id));
    } catch (err) {
      console.error(err);
    }
  }, []);

  // Combine builtin + user skills
  const allSkills = [
    ...BUILTIN_SKILLS.map(s => ({ ...s, id: s.id, name: s.name, created_at: "" })),
    ...skills.map(s => ({ ...s, name: s.name, builtin: false })),
  ];

  const filtered = allSkills
    .filter(s => !search || s.name.toLowerCase().includes(search.toLowerCase()) || (s.description || "").toLowerCase().includes(search.toLowerCase()))
    .filter(s => !filterCat || s.category === filterCat);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <Loader2 size={24} className="animate-spin" style={{ color: "var(--accent-blue)" }} />
      </div>
    );
  }

  return (
    <div className="h-full overflow-y-auto p-6 md:p-8">
      <div className="max-w-[1000px] mx-auto">
        {/* Header */}
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold" style={{ color: "var(--text-primary)" }}>Skills</h1>
            <p className="text-sm mt-1" style={{ color: "var(--text-tertiary)" }}>
              Сохранённые промпты — запускайте одной кнопкой
            </p>
          </div>
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => setShowCreate(true)}
            className="flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium"
            style={{ backgroundColor: "var(--accent-blue)", color: "#fff" }}
          >
            <Plus size={16} />
            Создать скилл
          </motion.button>
        </motion.div>

        {/* Filters */}
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }} className="flex items-center gap-3 mb-6 flex-wrap">
          <div className="relative flex-1 min-w-[200px]">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: "var(--text-tertiary)" }} />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Поиск скиллов..."
              className="w-full pl-9 pr-3 py-2 rounded-lg text-xs outline-none"
              style={{ backgroundColor: "var(--bg-surface)", border: "1px solid var(--border-default)", color: "var(--text-primary)" }}
            />
          </div>
          <div className="flex gap-1">
            <button
              onClick={() => setFilterCat(null)}
              className="px-2.5 py-1.5 rounded-lg text-[11px] font-medium transition-all"
              style={{
                backgroundColor: !filterCat ? "var(--accent-blue)" : "var(--bg-surface)",
                color: !filterCat ? "#fff" : "var(--text-tertiary)",
                border: `1px solid ${!filterCat ? "var(--accent-blue)" : "var(--border-default)"}`,
              }}
            >
              Все
            </button>
            {CATEGORIES.map(c => (
              <button
                key={c.id}
                onClick={() => setFilterCat(filterCat === c.id ? null : c.id)}
                className="px-2.5 py-1.5 rounded-lg text-[11px] font-medium transition-all"
                style={{
                  backgroundColor: filterCat === c.id ? c.color : "var(--bg-surface)",
                  color: filterCat === c.id ? "#fff" : "var(--text-tertiary)",
                  border: `1px solid ${filterCat === c.id ? c.color : "var(--border-default)"}`,
                }}
              >
                {c.label}
              </button>
            ))}
          </div>
        </motion.div>

        {/* Skills grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {filtered.map((skill, i) => {
            const cat = CATEGORIES.find(c => c.id === skill.category) || CATEGORIES[0];
            const CatIcon = cat.icon;
            const isBuiltin = (skill as any).builtin;
            const isRunning = runningId === skill.id;
            const justRan = runResult?.id === skill.id;

            return (
              <motion.div
                key={skill.id}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.03 }}
                className="group p-4 rounded-xl transition-all"
                style={{ backgroundColor: "var(--bg-surface)", border: "1px solid var(--border-default)" }}
              >
                <div className="flex items-start justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ backgroundColor: `color-mix(in srgb, ${cat.color} 12%, transparent)` }}>
                      <CatIcon size={15} style={{ color: cat.color }} />
                    </div>
                    <div>
                      <span className="text-[10px] font-medium" style={{ color: cat.color }}>{cat.label}</span>
                      {isBuiltin && <span className="text-[9px] ml-1 px-1 rounded" style={{ backgroundColor: "var(--bg-elevated)", color: "var(--text-tertiary)" }}>встроенный</span>}
                    </div>
                  </div>
                  {!isBuiltin && (
                    <button
                      onClick={() => handleDelete(skill.id)}
                      className="p-1 rounded opacity-0 group-hover:opacity-100 transition-opacity"
                      style={{ color: "var(--text-tertiary)" }}
                    >
                      <Trash2 size={12} />
                    </button>
                  )}
                </div>

                <h3 className="text-sm font-semibold mb-1" style={{ color: "var(--text-primary)" }}>{skill.name}</h3>
                <p className="text-xs mb-3 line-clamp-2" style={{ color: "var(--text-tertiary)" }}>{skill.description}</p>

                <button
                  onClick={() => handleRun(skill.id, isBuiltin)}
                  disabled={isRunning}
                  className="w-full flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs font-medium transition-all"
                  style={{
                    backgroundColor: justRan ? "rgba(52,211,153,0.1)" : "rgba(129,140,248,0.1)",
                    color: justRan ? "var(--accent-green)" : "var(--accent-blue)",
                  }}
                >
                  {isRunning ? (
                    <><Loader2 size={12} className="animate-spin" /> Запуск...</>
                  ) : justRan ? (
                    <><Check size={12} /> Запущено</>
                  ) : (
                    <><Play size={12} /> Запустить</>
                  )}
                </button>
              </motion.div>
            );
          })}
        </div>

        {filtered.length === 0 && (
          <div className="text-center py-12" style={{ color: "var(--text-tertiary)" }}>
            <Zap size={32} className="mx-auto mb-3 opacity-30" />
            <p className="text-sm">Скиллов не найдено</p>
          </div>
        )}

        {/* Create modal */}
        <AnimatePresence>
          {showCreate && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-50 flex items-center justify-center p-4"
              style={{ backgroundColor: "rgba(0,0,0,0.6)" }}
              onClick={() => setShowCreate(false)}
            >
              <motion.div
                initial={{ scale: 0.95, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.95, opacity: 0 }}
                className="w-full max-w-[450px] rounded-2xl p-6"
                style={{ backgroundColor: "var(--bg-surface)", border: "1px solid var(--border-default)" }}
                onClick={e => e.stopPropagation()}
              >
                <div className="flex items-center justify-between mb-5">
                  <h3 className="text-lg font-semibold" style={{ color: "var(--text-primary)" }}>Новый скилл</h3>
                  <button onClick={() => setShowCreate(false)} style={{ color: "var(--text-tertiary)" }}><X size={18} /></button>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="text-xs block mb-1.5" style={{ color: "var(--text-tertiary)" }}>Название</label>
                    <input
                      value={formName}
                      onChange={e => setFormName(e.target.value)}
                      placeholder="Например: Анализ конкурентов"
                      className="w-full px-3 py-2.5 rounded-lg text-sm outline-none"
                      style={{ backgroundColor: "var(--bg-base)", border: "1px solid var(--border-default)", color: "var(--text-primary)" }}
                    />
                  </div>

                  <div>
                    <label className="text-xs block mb-1.5" style={{ color: "var(--text-tertiary)" }}>Промпт (описание задачи)</label>
                    <textarea
                      value={formDesc}
                      onChange={e => setFormDesc(e.target.value)}
                      rows={4}
                      placeholder="Опишите что должен делать этот скилл при запуске..."
                      className="w-full px-3 py-2.5 rounded-lg text-sm outline-none resize-none"
                      style={{ backgroundColor: "var(--bg-base)", border: "1px solid var(--border-default)", color: "var(--text-primary)" }}
                    />
                  </div>

                  <div>
                    <label className="text-xs block mb-1.5" style={{ color: "var(--text-tertiary)" }}>Категория</label>
                    <div className="flex gap-1.5 flex-wrap">
                      {CATEGORIES.map(c => (
                        <button
                          key={c.id}
                          onClick={() => setFormCat(c.id)}
                          className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-[11px] font-medium transition-all"
                          style={{
                            backgroundColor: formCat === c.id ? c.color : "var(--bg-base)",
                            color: formCat === c.id ? "#fff" : "var(--text-tertiary)",
                            border: `1px solid ${formCat === c.id ? c.color : "var(--border-default)"}`,
                          }}
                        >
                          <c.icon size={11} />
                          {c.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="flex gap-2 pt-2">
                    <button onClick={() => setShowCreate(false)} className="flex-1 py-2.5 rounded-lg text-sm font-medium" style={{ backgroundColor: "var(--bg-base)", color: "var(--text-secondary)", border: "1px solid var(--border-default)" }}>Отмена</button>
                    <button
                      onClick={handleCreate}
                      disabled={!formName.trim() || formSaving}
                      className="flex-1 py-2.5 rounded-lg text-sm font-medium disabled:opacity-40 flex items-center justify-center gap-1.5"
                      style={{ backgroundColor: "var(--accent-blue)", color: "#fff" }}
                    >
                      {formSaving ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
                      Создать
                    </button>
                  </div>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
