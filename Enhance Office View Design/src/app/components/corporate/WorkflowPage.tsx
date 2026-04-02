import { useState, useEffect, useCallback, useRef } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  Plus, Play, Trash2, Edit3, ArrowRight, Loader2, AlertCircle,
  GitBranch, Sparkles, Search, BarChart3, Headphones, FileText,
  Code, Megaphone, X, Save, ChevronDown, GripVertical, Check,
  Zap, Bot,
} from "lucide-react";
import { api, type WorkflowData, type WorkflowTemplate, type WorkflowStep } from "../../lib/api";

/* ── Category config ── */
const CATEGORY_CONFIG: Record<string, { icon: React.ElementType; color: string; label: string }> = {
  marketing: { icon: Megaphone, color: "var(--accent-rose)", label: "Маркетинг" },
  support: { icon: Headphones, color: "var(--accent-blue)", label: "Поддержка" },
  analytics: { icon: BarChart3, color: "var(--accent-amber)", label: "Аналитика" },
  content: { icon: FileText, color: "var(--accent-teal)", label: "Контент" },
  code: { icon: Code, color: "var(--accent-lavender)", label: "Код" },
};

interface WorkflowPageProps {
  orgRole: "owner" | "manager" | "member";
}

export function WorkflowPage({ orgRole }: WorkflowPageProps) {
  const [workflows, setWorkflows] = useState<WorkflowData[]>([]);
  const [templates, setTemplates] = useState<WorkflowTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState<"list" | "builder">("list");
  const [editingWorkflow, setEditingWorkflow] = useState<WorkflowData | null>(null);
  const [runningId, setRunningId] = useState<string | null>(null);

  const loadData = useCallback(async () => {
    try {
      const [wfs, tpls] = await Promise.all([
        api.workflows.list(),
        api.workflows.templates(),
      ]);
      setWorkflows(wfs);
      setTemplates(tpls);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  const handleRun = useCallback(async (id: string) => {
    setRunningId(id);
    try {
      const result = await api.workflows.run(id);
      alert(`${result.message}\nGoal ID: ${result.goal_id}`);
      await loadData();
    } catch (err: any) {
      alert(`Ошибка: ${err.message}`);
    } finally {
      setRunningId(null);
    }
  }, [loadData]);

  const handleDelete = useCallback(async (id: string) => {
    try {
      await api.workflows.delete(id);
      setWorkflows(prev => prev.filter(w => w.id !== id));
    } catch (err: any) {
      console.error(err);
    }
  }, []);

  const handleCreateFromTemplate = useCallback(async (tpl: WorkflowTemplate) => {
    try {
      const wf = await api.workflows.create({
        name: tpl.name,
        description: tpl.description,
        steps: tpl.steps,
        category: tpl.category,
      });
      setWorkflows(prev => [wf, ...prev]);
      setEditingWorkflow(wf);
      setView("builder");
    } catch (err: any) {
      console.error(err);
    }
  }, []);

  const handleNew = useCallback(() => {
    setEditingWorkflow(null);
    setView("builder");
  }, []);

  const handleEdit = useCallback((wf: WorkflowData) => {
    setEditingWorkflow(wf);
    setView("builder");
  }, []);

  const handleBuilderSave = useCallback(async (data: { name: string; description?: string; steps: WorkflowStep[] }) => {
    try {
      if (editingWorkflow) {
        await api.workflows.update(editingWorkflow.id, data);
      } else {
        const wf = await api.workflows.create(data);
        setEditingWorkflow(wf);
      }
      await loadData();
    } catch (err: any) {
      console.error(err);
    }
  }, [editingWorkflow, loadData]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <Loader2 size={24} className="animate-spin" style={{ color: "var(--accent-blue)" }} />
      </div>
    );
  }

  if (view === "builder") {
    return (
      <WorkflowBuilder
        workflow={editingWorkflow}
        onSave={handleBuilderSave}
        onBack={() => { setView("list"); setEditingWorkflow(null); }}
        onRun={editingWorkflow ? () => handleRun(editingWorkflow.id) : undefined}
      />
    );
  }

  return (
    <div className="h-full overflow-y-auto p-6 md:p-8">
      <div className="max-w-[1100px] mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center justify-between mb-8"
        >
          <div>
            <h1 className="text-2xl font-bold" style={{ color: "var(--text-primary)" }}>Workflows</h1>
            <p className="text-sm mt-1" style={{ color: "var(--text-tertiary)" }}>
              Конструктор AI-цепочек · {workflows.length} workflow
            </p>
          </div>
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={handleNew}
            className="flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium"
            style={{ backgroundColor: "var(--accent-blue)", color: "#fff" }}
          >
            <Plus size={16} />
            Создать
          </motion.button>
        </motion.div>

        {/* My workflows */}
        {workflows.length > 0 && (
          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }} className="mb-10">
            <h2 className="text-sm font-semibold mb-4" style={{ color: "var(--text-primary)" }}>Мои Workflows</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {workflows.filter(w => !w.is_template).map((wf, i) => {
                const cat = CATEGORY_CONFIG[wf.category || ""] || { icon: GitBranch, color: "var(--accent-blue)", label: "Кастомный" };
                const CatIcon = cat.icon;
                return (
                  <motion.div
                    key={wf.id}
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.03 }}
                    className="p-4 rounded-xl group"
                    style={{ backgroundColor: "var(--bg-surface)", border: "1px solid var(--border-default)" }}
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <CatIcon size={16} style={{ color: cat.color }} />
                        <span className="text-xs" style={{ color: cat.color }}>{cat.label}</span>
                      </div>
                      <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button onClick={() => handleEdit(wf)} className="p-1 rounded" style={{ color: "var(--text-tertiary)" }}><Edit3 size={12} /></button>
                        <button onClick={() => handleDelete(wf.id)} className="p-1 rounded" style={{ color: "var(--accent-rose)" }}><Trash2 size={12} /></button>
                      </div>
                    </div>
                    <h3 className="text-sm font-semibold mb-1" style={{ color: "var(--text-primary)" }}>{wf.name}</h3>
                    <p className="text-xs mb-3 line-clamp-2" style={{ color: "var(--text-tertiary)" }}>{wf.description || `${wf.steps.length} шагов`}</p>
                    <div className="flex items-center justify-between">
                      <span className="text-[10px]" style={{ color: "var(--text-tertiary)" }}>
                        {wf.steps.length} шагов · {wf.run_count} запусков
                      </span>
                      <button
                        onClick={() => handleRun(wf.id)}
                        disabled={runningId === wf.id}
                        className="flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-medium"
                        style={{ backgroundColor: "rgba(129,140,248,0.1)", color: "var(--accent-blue)" }}
                      >
                        {runningId === wf.id ? <Loader2 size={10} className="animate-spin" /> : <Play size={10} />}
                        Запустить
                      </button>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </motion.div>
        )}

        {/* Templates */}
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
          <h2 className="text-sm font-semibold mb-4" style={{ color: "var(--text-primary)" }}>
            Шаблоны
            <span className="ml-2 text-xs font-normal" style={{ color: "var(--text-tertiary)" }}>Готовые цепочки — настройте под себя</span>
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {templates.map((tpl, i) => {
              const cat = CATEGORY_CONFIG[tpl.category] || { icon: GitBranch, color: "var(--accent-blue)", label: "Другое" };
              const CatIcon = cat.icon;
              return (
                <motion.div
                  key={tpl.id}
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.15 + i * 0.04 }}
                  className="p-4 rounded-xl cursor-pointer transition-all hover:scale-[1.01]"
                  style={{ backgroundColor: "var(--bg-surface)", border: "1px solid var(--border-default)" }}
                  onClick={() => handleCreateFromTemplate(tpl)}
                >
                  <div className="flex items-center gap-2 mb-3">
                    <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ backgroundColor: `color-mix(in srgb, ${cat.color} 12%, transparent)` }}>
                      <CatIcon size={16} style={{ color: cat.color }} />
                    </div>
                    <span className="text-xs font-medium" style={{ color: cat.color }}>{cat.label}</span>
                    <Sparkles size={10} style={{ color: "var(--accent-amber)" }} />
                  </div>
                  <h3 className="text-sm font-semibold mb-1" style={{ color: "var(--text-primary)" }}>{tpl.name}</h3>
                  <p className="text-xs mb-3" style={{ color: "var(--text-tertiary)" }}>{tpl.description}</p>
                  {/* Step preview */}
                  <div className="flex items-center gap-1 flex-wrap">
                    {tpl.steps.map((s, si) => (
                      <div key={s.id} className="flex items-center gap-1">
                        <span className="text-[10px] px-1.5 py-0.5 rounded" style={{ backgroundColor: "var(--bg-elevated)", color: "var(--text-secondary)" }}>
                          {s.title}
                        </span>
                        {si < tpl.steps.length - 1 && <ArrowRight size={8} style={{ color: "var(--text-tertiary)" }} />}
                      </div>
                    ))}
                  </div>
                </motion.div>
              );
            })}
          </div>
        </motion.div>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════
   WORKFLOW BUILDER — Visual canvas with nodes & arrows
   ═══════════════════════════════════════════════════════ */

function WorkflowBuilder({ workflow, onSave, onBack, onRun }: {
  workflow: WorkflowData | null;
  onSave: (data: { name: string; description?: string; steps: WorkflowStep[] }) => Promise<void>;
  onBack: () => void;
  onRun?: () => void;
}) {
  const [name, setName] = useState(workflow?.name || "Новый workflow");
  const [description, setDescription] = useState(workflow?.description || "");
  const [steps, setSteps] = useState<WorkflowStep[]>(workflow?.steps || []);
  const [selectedStep, setSelectedStep] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const canvasRef = useRef<HTMLDivElement>(null);
  const dragRef = useRef<{ id: string; startX: number; startY: number; origX: number; origY: number } | null>(null);
  const autoSaveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Autosave: debounced 2s after any change
  useEffect(() => {
    if (autoSaveTimer.current) clearTimeout(autoSaveTimer.current);
    autoSaveTimer.current = setTimeout(async () => {
      if (name.trim() && steps.length > 0) {
        try {
          await onSave({ name, description: description || undefined, steps });
          setSaved(true);
          setTimeout(() => setSaved(false), 1500);
        } catch {}
      }
    }, 2000);
    return () => { if (autoSaveTimer.current) clearTimeout(autoSaveTimer.current); };
  }, [name, description, steps]);

  // Native drag for nodes
  useEffect(() => {
    const onMouseMove = (e: MouseEvent) => {
      if (!dragRef.current) return;
      const dx = e.clientX - dragRef.current.startX;
      const dy = e.clientY - dragRef.current.startY;
      setSteps(prev => prev.map(s =>
        s.id === dragRef.current!.id
          ? { ...s, x: Math.max(0, dragRef.current!.origX + dx), y: Math.max(0, dragRef.current!.origY + dy) }
          : s
      ));
    };
    const onMouseUp = () => { dragRef.current = null; };
    window.addEventListener("mousemove", onMouseMove);
    window.addEventListener("mouseup", onMouseUp);
    return () => { window.removeEventListener("mousemove", onMouseMove); window.removeEventListener("mouseup", onMouseUp); };
  }, []);

  const startDrag = useCallback((e: React.MouseEvent, stepId: string) => {
    const step = steps.find(s => s.id === stepId);
    if (!step) return;
    e.preventDefault();
    dragRef.current = { id: stepId, startX: e.clientX, startY: e.clientY, origX: step.x, origY: step.y };
  }, [steps]);

  const addStep = useCallback((parentId?: string) => {
    const id = `s${Date.now()}`;
    const parent = parentId ? steps.find(s => s.id === parentId) : steps[steps.length - 1];
    // For branching: place below-right of parent, or next in line
    const offsetX = parentId ? 0 : 280;
    const offsetY = parentId ? 140 : 0;
    setSteps(prev => [...prev, {
      id,
      title: `Шаг ${prev.length + 1}`,
      prompt: "",
      model: "auto",
      task_type: "general",
      depends_on: parent ? [parent.id] : [],
      x: (parent?.x || 0) + offsetX,
      y: (parent?.y || 200) + offsetY,
    }]);
    setSelectedStep(id);
  }, [steps]);

  const removeStep = useCallback((stepId: string) => {
    setSteps(prev => {
      const filtered = prev.filter(s => s.id !== stepId);
      return filtered.map(s => ({
        ...s,
        depends_on: s.depends_on.filter(d => d !== stepId),
      }));
    });
    if (selectedStep === stepId) setSelectedStep(null);
  }, [selectedStep]);

  const updateStep = useCallback((stepId: string, updates: Partial<WorkflowStep>) => {
    setSteps(prev => prev.map(s => s.id === stepId ? { ...s, ...updates } : s));
  }, []);

  const handleSave = useCallback(async () => {
    setSaving(true);
    try {
      await onSave({ name, description: description || undefined, steps });
    } finally {
      setSaving(false);
    }
  }, [name, description, steps, onSave]);

  const selected = steps.find(s => s.id === selectedStep);

  return (
    <div className="h-full flex flex-col overflow-hidden">
      {/* Toolbar */}
      <div className="flex items-center justify-between px-4 py-3 flex-shrink-0" style={{ borderBottom: "1px solid var(--border-default)" }}>
        <div className="flex items-center gap-3">
          <button onClick={onBack} className="p-1.5 rounded-lg" style={{ color: "var(--text-tertiary)" }}>
            <X size={18} />
          </button>
          <input
            value={name}
            onChange={e => setName(e.target.value)}
            className="text-base font-semibold bg-transparent outline-none border-none"
            style={{ color: "var(--text-primary)" }}
            placeholder="Название workflow"
          />
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={addStep}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium"
            style={{ backgroundColor: "var(--bg-elevated)", color: "var(--text-secondary)", border: "1px solid var(--border-default)" }}
          >
            <Plus size={14} /> Шаг
          </button>
          {onRun && (
            <button
              onClick={onRun}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium"
              style={{ backgroundColor: "rgba(52,211,153,0.1)", color: "var(--accent-green)" }}
            >
              <Play size={14} /> Запустить
            </button>
          )}
          <span className="text-[10px]" style={{ color: saved ? "var(--accent-green)" : "var(--text-tertiary)" }}>
            {saving ? "Сохранение..." : saved ? "✓ Сохранено" : "Автосохранение"}
          </span>
          <button
            onClick={handleSave}
            disabled={saving}
            className="flex items-center gap-1.5 px-4 py-1.5 rounded-lg text-xs font-medium"
            style={{ backgroundColor: "var(--accent-blue)", color: "#fff" }}
          >
            {saving ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
            Сохранить
          </button>
        </div>
      </div>

      <div className="flex-1 flex overflow-hidden">
        {/* Canvas */}
        <div
          ref={canvasRef}
          className="flex-1 overflow-auto relative"
          style={{ backgroundColor: "var(--bg-base)" }}
          onClick={() => setSelectedStep(null)}
        >
          {/* Grid background */}
          <svg className="absolute inset-0 w-full h-full pointer-events-none" style={{ minWidth: 2000, minHeight: 800 }}>
            <defs>
              <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
                <path d="M 40 0 L 0 0 0 40" fill="none" stroke="rgba(255,255,255,0.03)" strokeWidth="1" />
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#grid)" />

            {/* Arrows between nodes */}
            {steps.map(step =>
              step.depends_on.map(depId => {
                const from = steps.find(s => s.id === depId);
                if (!from) return null;
                const x1 = from.x + 220;
                const y1 = from.y + 40;
                const x2 = step.x;
                const y2 = step.y + 40;
                const cx = (x1 + x2) / 2;
                return (
                  <g key={`${depId}-${step.id}`}>
                    <path
                      d={`M ${x1} ${y1} C ${cx} ${y1}, ${cx} ${y2}, ${x2} ${y2}`}
                      fill="none"
                      stroke="rgba(129,140,248,0.3)"
                      strokeWidth="2"
                    />
                    {/* Arrow head */}
                    <circle cx={x2} cy={y2} r="4" fill="rgba(129,140,248,0.5)" />
                  </g>
                );
              })
            )}
          </svg>

          {/* Empty state */}
          {steps.length === 0 && (
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="text-center">
                <GitBranch size={32} className="mx-auto mb-3 opacity-20" style={{ color: "var(--text-tertiary)" }} />
                <p className="text-sm mb-1" style={{ color: "var(--text-tertiary)" }}>Пустой workflow</p>
                <p className="text-xs mb-4" style={{ color: "var(--text-tertiary)" }}>Нажмите "+ Шаг" чтобы добавить первый шаг</p>
                <button
                  onClick={addStep}
                  className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-medium mx-auto"
                  style={{ backgroundColor: "var(--accent-blue)", color: "#fff" }}
                >
                  <Plus size={14} /> Добавить шаг
                </button>
              </div>
            </div>
          )}

          {/* Nodes */}
          {steps.map((step, i) => (
            <div
              key={step.id}
              className="absolute select-none group"
              style={{ left: step.x, top: step.y, width: 220 }}
              onClick={(e) => { e.stopPropagation(); setSelectedStep(step.id); }}
            >
              <div
                className="rounded-xl p-3 transition-all cursor-grab active:cursor-grabbing"
                onMouseDown={(e) => startDrag(e, step.id)}
                style={{
                  backgroundColor: "var(--bg-surface)",
                  border: `2px solid ${selectedStep === step.id ? "var(--accent-blue)" : "var(--border-default)"}`,
                  boxShadow: selectedStep === step.id ? "0 0 16px rgba(129,140,248,0.15)" : "0 2px 8px rgba(0,0,0,0.2)",
                }}
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-1.5">
                    <div
                      className="w-5 h-5 rounded flex items-center justify-center text-[10px] font-bold"
                      style={{ backgroundColor: step.depends_on.length === 0 ? "var(--accent-green)" : "var(--accent-blue)", color: "#fff" }}
                    >
                      {i + 1}
                    </div>
                    <span className="text-xs font-semibold truncate" style={{ color: "var(--text-primary)" }}>{step.title}</span>
                  </div>
                  <div className="flex items-center gap-0.5">
                    {/* Branch button */}
                    <button
                      onClick={(e) => { e.stopPropagation(); addStep(step.id); }}
                      className="p-0.5 rounded opacity-0 group-hover:opacity-100 transition-opacity"
                      style={{ color: "var(--accent-teal)" }}
                      title="Добавить ветку от этого шага"
                    >
                      <GitBranch size={11} />
                    </button>
                    <button
                      onClick={(e) => { e.stopPropagation(); removeStep(step.id); }}
                      className="p-0.5 rounded opacity-0 group-hover:opacity-100 transition-opacity"
                      style={{ color: "var(--text-tertiary)" }}
                      onMouseEnter={e => { (e.target as HTMLElement).style.color = "var(--accent-rose)"; }}
                      onMouseLeave={e => { (e.target as HTMLElement).style.color = "var(--text-tertiary)"; }}
                    >
                      <X size={11} />
                    </button>
                  </div>
                </div>
                <p className="text-[10px] line-clamp-2 mb-1.5" style={{ color: "var(--text-tertiary)" }}>
                  {step.prompt || "Кликните чтобы добавить промпт →"}
                </p>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1">
                    <Bot size={9} style={{ color: "var(--accent-lavender)" }} />
                    <span className="text-[9px]" style={{ color: "var(--text-tertiary)" }}>{step.model}</span>
                  </div>
                  {step.depends_on.length > 1 && (
                    <span className="text-[8px] px-1 rounded" style={{ backgroundColor: "var(--bg-elevated)", color: "var(--accent-amber)" }}>
                      merge
                    </span>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Properties panel */}
        <AnimatePresence>
          {selected && (
            <motion.div
              initial={{ width: 0, opacity: 0 }}
              animate={{ width: 300, opacity: 1 }}
              exit={{ width: 0, opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="flex-shrink-0 overflow-y-auto"
              style={{ backgroundColor: "var(--bg-surface)", borderLeft: "1px solid var(--border-default)" }}
            >
              <div className="p-4 space-y-4">
                <h3 className="text-sm font-semibold" style={{ color: "var(--text-primary)" }}>Настройки шага</h3>

                <div>
                  <label className="text-[11px] block mb-1" style={{ color: "var(--text-tertiary)" }}>Название</label>
                  <input
                    value={selected.title}
                    onChange={e => updateStep(selected.id, { title: e.target.value })}
                    className="w-full px-2.5 py-1.5 rounded-lg text-xs outline-none"
                    style={{ backgroundColor: "var(--bg-base)", border: "1px solid var(--border-default)", color: "var(--text-primary)" }}
                  />
                </div>

                <div>
                  <label className="text-[11px] block mb-1" style={{ color: "var(--text-tertiary)" }}>Промпт</label>
                  <textarea
                    value={selected.prompt}
                    onChange={e => updateStep(selected.id, { prompt: e.target.value })}
                    rows={6}
                    placeholder="Опишите что должен делать этот шаг...&#10;&#10;Используйте {input} для входных данных"
                    className="w-full px-2.5 py-1.5 rounded-lg text-xs outline-none resize-none"
                    style={{ backgroundColor: "var(--bg-base)", border: "1px solid var(--border-default)", color: "var(--text-primary)" }}
                  />
                </div>

                <div>
                  <label className="text-[11px] block mb-1" style={{ color: "var(--text-tertiary)" }}>Модель</label>
                  <select
                    value={selected.model}
                    onChange={e => updateStep(selected.id, { model: e.target.value })}
                    className="w-full px-2.5 py-1.5 rounded-lg text-xs outline-none"
                    style={{ backgroundColor: "var(--bg-base)", border: "1px solid var(--border-default)", color: "var(--text-primary)" }}
                  >
                    <option value="auto">Авто (лучшая для задачи)</option>
                    <option value="gpt-4.1">GPT-4.1</option>
                    <option value="gpt-4o">GPT-4o</option>
                    <option value="claude-sonnet-4-6">Claude Sonnet 4.6</option>
                    <option value="claude-haiku-4-5">Claude Haiku 4.5</option>
                    <option value="gemini-2.5-flash">Gemini 2.5 Flash</option>
                    <option value="llama-3.3-70b">Llama 3.3 70B (бесплатно)</option>
                  </select>
                </div>

                <div>
                  <label className="text-[11px] block mb-1" style={{ color: "var(--text-tertiary)" }}>Тип задачи</label>
                  <select
                    value={selected.task_type}
                    onChange={e => updateStep(selected.id, { task_type: e.target.value })}
                    className="w-full px-2.5 py-1.5 rounded-lg text-xs outline-none"
                    style={{ backgroundColor: "var(--bg-base)", border: "1px solid var(--border-default)", color: "var(--text-primary)" }}
                  >
                    <option value="general">Общая</option>
                    <option value="research">Исследование</option>
                    <option value="code">Код</option>
                    <option value="design">Дизайн</option>
                    <option value="analysis">Анализ</option>
                  </select>
                </div>

                <div>
                  <label className="text-[11px] block mb-1" style={{ color: "var(--text-tertiary)" }}>Зависит от</label>
                  <div className="space-y-1">
                    {steps.filter(s => s.id !== selected.id).map(s => (
                      <label key={s.id} className="flex items-center gap-2 text-xs cursor-pointer" style={{ color: "var(--text-secondary)" }}>
                        <input
                          type="checkbox"
                          checked={selected.depends_on.includes(s.id)}
                          onChange={e => {
                            const deps = e.target.checked
                              ? [...selected.depends_on, s.id]
                              : selected.depends_on.filter(d => d !== s.id);
                            updateStep(selected.id, { depends_on: deps });
                          }}
                        />
                        {s.title}
                      </label>
                    ))}
                    {steps.length <= 1 && (
                      <p className="text-[10px]" style={{ color: "var(--text-tertiary)" }}>Добавьте больше шагов для создания зависимостей</p>
                    )}
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
