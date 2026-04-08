import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  Shield, Plus, Trash2, Check, X, ChevronDown, Loader2,
  Building2, Edit3, Save, AlertCircle,
} from "lucide-react";
import { api } from "../../lib/api";

interface CustomRole {
  id: string;
  name: string;
  label: string;
  description?: string;
  permissions: string[];
  modules: string[];
  is_system: boolean;
  industry_template?: string;
}

const MODULE_LABELS: Record<string, string> = {
  dashboard: "Главная",
  chat: "AI Чат",
  crm: "CRM",
  kanban: "Задачи",
  workflows: "Workflows",
  documents: "Документы",
  skills: "Skills",
  kb: "База знаний",
  research: "Исследования",
  team: "Команда",
  reports: "Отчёты",
  settings: "Настройки",
  edo: "ЭДО",
  budget: "Бюджет",
  channels: "Каналы",
  calendar: "Календарь",
  hr: "HR",
  files: "Файлы",
  integrations: "Интеграции",
};

const ACTION_LABELS: Record<string, string> = {
  view: "Просмотр",
  create: "Создание",
  edit: "Редакт.",
  delete: "Удаление",
  manage: "Управление",
  full: "Полный",
  run: "Запуск",
  sign: "Подпись",
  upload: "Загрузка",
  send: "Отправка",
  start: "Запуск",
  council: "Council",
  finance: "Финансы",
  sales: "Продажи",
  projects: "Проекты",
};

export function RolesManager({ isOwner }: { isOwner: boolean }) {
  const [matrix, setMatrix] = useState<Record<string, string[]>>({});
  const [builtinRoles, setBuiltinRoles] = useState<Record<string, { label: string; permissions: string[] }>>({});
  const [customRoles, setCustomRoles] = useState<CustomRole[]>([]);
  const [templates, setTemplates] = useState<Record<string, { label: string; roles_count: number }>>({});
  const [loading, setLoading] = useState(true);
  const [selectedRole, setSelectedRole] = useState<string | null>(null);
  const [showCreate, setShowCreate] = useState(false);
  const [createName, setCreateName] = useState("");
  const [createLabel, setCreateLabel] = useState("");
  const [createPerms, setCreatePerms] = useState<Set<string>>(new Set());
  const [createModules, setCreateModules] = useState<Set<string>>(new Set());
  const [saving, setSaving] = useState(false);

  const loadData = useCallback(async () => {
    try {
      const [matrixData, customData, tplData] = await Promise.all([
        api.customRoles.matrix(),
        api.customRoles.list().catch(() => []),
        api.customRoles.templates().catch(() => ({})),
      ]);
      setMatrix(matrixData.matrix);
      setBuiltinRoles(matrixData.roles);
      setCustomRoles(customData);
      setTemplates(tplData);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  const handleCreateRole = useCallback(async () => {
    if (!createName.trim() || !createLabel.trim()) return;
    setSaving(true);
    try {
      await api.customRoles.create({
        name: createName.trim().toLowerCase().replace(/\s+/g, "_"),
        label: createLabel.trim(),
        permissions: Array.from(createPerms),
        modules: Array.from(createModules),
      });
      setShowCreate(false);
      setCreateName("");
      setCreateLabel("");
      setCreatePerms(new Set());
      setCreateModules(new Set());
      await loadData();
    } catch (err) {
      console.error(err);
    } finally {
      setSaving(false);
    }
  }, [createName, createLabel, createPerms, createModules, loadData]);

  const handleDeleteRole = useCallback(async (id: string) => {
    try {
      await api.customRoles.delete(id);
      setCustomRoles(prev => prev.filter(r => r.id !== id));
    } catch (err) {
      console.error(err);
    }
  }, []);

  const togglePerm = (perm: string, set: Set<string>, setFn: (s: Set<string>) => void) => {
    const next = new Set(set);
    if (next.has(perm)) next.delete(perm); else next.add(perm);
    setFn(next);
  };

  // Get permissions for selected role
  const getSelectedPerms = (): Set<string> => {
    if (!selectedRole) return new Set();
    const builtin = builtinRoles[selectedRole];
    if (builtin) return new Set(builtin.permissions);
    const custom = customRoles.find(r => r.name === selectedRole);
    if (custom) return new Set(custom.permissions);
    return new Set();
  };

  const selectedPerms = getSelectedPerms();

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 size={24} className="animate-spin" style={{ color: "var(--accent-blue)" }} />
      </div>
    );
  }

  const allModules = Object.keys(matrix);

  return (
    <div className="space-y-6">
      {/* Role selector */}
      <div className="flex items-center gap-3 flex-wrap">
        <span className="text-xs font-medium" style={{ color: "var(--text-tertiary)" }}>Роль:</span>
        {Object.entries(builtinRoles).map(([id, role]) => (
          <button
            key={id}
            onClick={() => setSelectedRole(selectedRole === id ? null : id)}
            className="px-3 py-1.5 rounded-lg text-xs font-medium transition-colors"
            style={{
              backgroundColor: selectedRole === id ? "var(--accent-blue)" : "var(--bg-base)",
              color: selectedRole === id ? "#fff" : "var(--text-secondary)",
              border: `1px solid ${selectedRole === id ? "var(--accent-blue)" : "var(--border-default)"}`,
            }}
          >
            {role.label}
          </button>
        ))}
        {customRoles.map(cr => (
          <div key={cr.id} className="flex items-center gap-1">
            <button
              onClick={() => setSelectedRole(selectedRole === cr.name ? null : cr.name)}
              className="px-3 py-1.5 rounded-lg text-xs font-medium transition-colors"
              style={{
                backgroundColor: selectedRole === cr.name ? "var(--accent-teal)" : "var(--bg-base)",
                color: selectedRole === cr.name ? "#fff" : "var(--text-secondary)",
                border: `1px solid ${selectedRole === cr.name ? "var(--accent-teal)" : "var(--border-default)"}`,
              }}
            >
              {cr.label}
            </button>
            {isOwner && (
              <button onClick={() => handleDeleteRole(cr.id)} className="p-1 rounded" style={{ color: "var(--text-tertiary)" }}>
                <Trash2 size={12} />
              </button>
            )}
          </div>
        ))}
        {isOwner && (
          <button
            onClick={() => setShowCreate(true)}
            className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-medium"
            style={{ backgroundColor: "var(--bg-base)", color: "var(--accent-blue)", border: "1px dashed var(--border-default)" }}
          >
            <Plus size={12} /> Новая роль
          </button>
        )}
      </div>

      {/* Permission matrix */}
      {selectedRole && (
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-xl overflow-hidden"
          style={{ backgroundColor: "var(--bg-surface)", border: "1px solid var(--border-default)" }}
        >
          <div className="px-4 py-3" style={{ borderBottom: "1px solid var(--border-default)" }}>
            <h3 className="text-sm font-semibold" style={{ color: "var(--text-primary)" }}>
              Матрица прав: {builtinRoles[selectedRole]?.label || customRoles.find(r => r.name === selectedRole)?.label || selectedRole}
            </h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr style={{ borderBottom: "1px solid var(--border-default)" }}>
                  <th className="text-left px-4 py-2 font-semibold" style={{ color: "var(--text-tertiary)" }}>Модуль</th>
                  <th className="text-center px-2 py-2 font-semibold" style={{ color: "var(--text-tertiary)" }} colSpan={8}>Действия</th>
                </tr>
              </thead>
              <tbody>
                {allModules.map(mod => {
                  const actions = matrix[mod] || [];
                  return (
                    <tr key={mod} style={{ borderBottom: "1px solid var(--border-default)" }}>
                      <td className="px-4 py-2.5 font-medium" style={{ color: "var(--text-primary)" }}>
                        {MODULE_LABELS[mod] || mod}
                      </td>
                      {actions.map(action => {
                        const perm = `${mod}_${action}`;
                        const has = selectedPerms.has(perm);
                        return (
                          <td key={action} className="px-2 py-2.5 text-center">
                            <div className="flex items-center justify-center gap-1">
                              <div
                                className="w-5 h-5 rounded flex items-center justify-center"
                                style={{
                                  backgroundColor: has ? "color-mix(in srgb, var(--accent-green) 15%, transparent)" : "var(--bg-base)",
                                  border: `1px solid ${has ? "var(--accent-green)" : "var(--border-default)"}`,
                                }}
                              >
                                {has && <Check size={10} style={{ color: "var(--accent-green)" }} />}
                              </div>
                              <span style={{ color: "var(--text-tertiary)", fontSize: "10px" }}>
                                {ACTION_LABELS[action] || action}
                              </span>
                            </div>
                          </td>
                        );
                      })}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </motion.div>
      )}

      {/* Industry templates */}
      {Object.keys(templates).length > 0 && (
        <div>
          <h3 className="text-sm font-semibold mb-3" style={{ color: "var(--text-primary)" }}>Шаблоны по отраслям</h3>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {Object.entries(templates).map(([tid, tpl]) => (
              <div
                key={tid}
                className="p-4 rounded-xl"
                style={{ backgroundColor: "var(--bg-surface)", border: "1px solid var(--border-default)" }}
              >
                <div className="flex items-center gap-2 mb-1">
                  <Building2 size={14} style={{ color: "var(--accent-teal)" }} />
                  <span className="text-sm font-medium" style={{ color: "var(--text-primary)" }}>{tpl.label}</span>
                </div>
                <span className="text-[11px]" style={{ color: "var(--text-tertiary)" }}>{tpl.roles_count} ролей</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Create role modal */}
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
              className="w-full max-w-[500px] max-h-[80vh] rounded-2xl overflow-hidden flex flex-col"
              style={{ backgroundColor: "var(--bg-surface)", border: "1px solid var(--border-default)" }}
              onClick={e => e.stopPropagation()}
            >
              <div className="px-6 py-4 flex-shrink-0" style={{ borderBottom: "1px solid var(--border-default)" }}>
                <h3 className="text-lg font-semibold" style={{ color: "var(--text-primary)" }}>Новая роль</h3>
              </div>
              <div className="flex-1 overflow-y-auto p-6 space-y-4">
                <div>
                  <label className="text-xs mb-1 block" style={{ color: "var(--text-tertiary)" }}>Системное имя</label>
                  <input value={createName} onChange={e => setCreateName(e.target.value)} placeholder="tech_lead" className="w-full px-3 py-2 rounded-lg text-sm outline-none" style={{ backgroundColor: "var(--bg-base)", border: "1px solid var(--border-default)", color: "var(--text-primary)" }} />
                </div>
                <div>
                  <label className="text-xs mb-1 block" style={{ color: "var(--text-tertiary)" }}>Название</label>
                  <input value={createLabel} onChange={e => setCreateLabel(e.target.value)} placeholder="Техлид" className="w-full px-3 py-2 rounded-lg text-sm outline-none" style={{ backgroundColor: "var(--bg-base)", border: "1px solid var(--border-default)", color: "var(--text-primary)" }} />
                </div>

                <div>
                  <label className="text-xs mb-2 block" style={{ color: "var(--text-tertiary)" }}>Модули sidebar</label>
                  <div className="flex flex-wrap gap-2">
                    {Object.entries(MODULE_LABELS).slice(0, 12).map(([mod, label]) => (
                      <button
                        key={mod}
                        onClick={() => togglePerm(mod, createModules, setCreateModules)}
                        className="px-2.5 py-1 rounded text-[11px] font-medium"
                        style={{
                          backgroundColor: createModules.has(mod) ? "color-mix(in srgb, var(--accent-blue) 15%, transparent)" : "var(--bg-base)",
                          color: createModules.has(mod) ? "var(--accent-blue)" : "var(--text-tertiary)",
                          border: `1px solid ${createModules.has(mod) ? "var(--accent-blue)" : "var(--border-default)"}`,
                        }}
                      >
                        {label}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="text-xs mb-2 block" style={{ color: "var(--text-tertiary)" }}>Права</label>
                  <div className="space-y-2 max-h-[200px] overflow-y-auto">
                    {Object.entries(matrix).map(([mod, actions]) => (
                      <div key={mod}>
                        <div className="text-[10px] font-semibold mb-1" style={{ color: "var(--text-tertiary)" }}>{MODULE_LABELS[mod] || mod}</div>
                        <div className="flex flex-wrap gap-1">
                          {actions.map(action => {
                            const perm = `${mod}_${action}`;
                            return (
                              <button
                                key={perm}
                                onClick={() => togglePerm(perm, createPerms, setCreatePerms)}
                                className="px-2 py-0.5 rounded text-[10px]"
                                style={{
                                  backgroundColor: createPerms.has(perm) ? "color-mix(in srgb, var(--accent-green) 15%, transparent)" : "var(--bg-base)",
                                  color: createPerms.has(perm) ? "var(--accent-green)" : "var(--text-tertiary)",
                                  border: `1px solid ${createPerms.has(perm) ? "var(--accent-green)" : "var(--border-default)"}`,
                                }}
                              >
                                {ACTION_LABELS[action] || action}
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
              <div className="px-6 py-4 flex gap-2 flex-shrink-0" style={{ borderTop: "1px solid var(--border-default)" }}>
                <button onClick={() => setShowCreate(false)} className="flex-1 py-2 rounded-lg text-sm font-medium" style={{ backgroundColor: "var(--bg-base)", color: "var(--text-secondary)", border: "1px solid var(--border-default)" }}>Отмена</button>
                <button onClick={handleCreateRole} disabled={!createName.trim() || !createLabel.trim() || saving} className="flex-1 py-2 rounded-lg text-sm font-medium disabled:opacity-50" style={{ backgroundColor: "var(--accent-blue)", color: "#fff" }}>
                  {saving ? <Loader2 size={14} className="animate-spin mx-auto" /> : "Создать"}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
