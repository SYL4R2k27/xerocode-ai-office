import { useState, useEffect, useCallback, useRef } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  Plug, Settings, RefreshCw, Trash2, X, Check, AlertCircle,
  Loader2, ChevronRight, ExternalLink, Database, Clock, Download,
  Shield, CheckCircle2, XCircle, ArrowRight, Info, Zap,
} from "lucide-react";

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// API
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

const API_BASE = window.location.hostname === "localhost"
  ? "http://localhost:8000/api"
  : `${window.location.origin}/api`;

const authHeaders = () => ({
  Authorization: `Bearer ${localStorage.getItem("ai_office_token")}`,
  "Content-Type": "application/json",
});

async function apiGet<T>(path: string): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, { headers: authHeaders() });
  if (!res.ok) throw new Error(`API error: ${res.status}`);
  return res.json();
}

async function apiPost<T>(path: string, body?: unknown): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    method: "POST",
    headers: authHeaders(),
    body: body ? JSON.stringify(body) : undefined,
  });
  if (!res.ok) throw new Error(`API error: ${res.status}`);
  return res.json();
}

async function apiDelete(path: string): Promise<void> {
  const res = await fetch(`${API_BASE}${path}`, {
    method: "DELETE",
    headers: authHeaders(),
  });
  if (!res.ok) throw new Error(`API error: ${res.status}`);
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// TYPES
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

type ConnectorStatus = "disconnected" | "connected" | "syncing" | "error";

interface Connector {
  id: string;
  connector_type: "bitrix24" | "1c";
  name: string;
  status: ConnectorStatus;
  last_sync?: string;
  import_stats?: Record<string, number>;
  error_message?: string;
}

interface ImportProgress {
  status: "running" | "done" | "error";
  total: number;
  imported: number;
  entities: Record<string, { count: number; status: "done" | "importing" | "error"; error?: string }>;
  errors: string[];
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// CONNECTOR DEFINITIONS
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

interface ConnectorDef {
  type: "bitrix24" | "1c";
  name: string;
  description: string;
  icon: string;
  color: string;
  authFields: { key: string; label: string; type: string; placeholder: string }[];
  entities: { key: string; label: string }[];
}

const CONNECTOR_DEFS: ConnectorDef[] = [
  {
    type: "bitrix24",
    name: "Bitrix24",
    description: "CRM, задачи, контакты, сделки",
    icon: "B24",
    color: "var(--accent-blue)",
    authFields: [
      { key: "webhook_url", label: "Webhook URL", type: "url", placeholder: "https://your-domain.bitrix24.ru/rest/1/abc123xyz/" },
    ],
    entities: [
      { key: "deals", label: "Сделки" },
      { key: "contacts", label: "Контакты" },
      { key: "companies", label: "Компании" },
      { key: "tasks", label: "Задачи" },
    ],
  },
  {
    type: "1c",
    name: "1С:Предприятие",
    description: "Контрагенты, номенклатура, документы",
    icon: "1С",
    color: "var(--accent-amber)",
    authFields: [
      { key: "odata_url", label: "OData URL", type: "url", placeholder: "http://server/base/odata/standard.odata" },
      { key: "username", label: "Имя пользователя", type: "text", placeholder: "admin" },
      { key: "password", label: "Пароль", type: "password", placeholder: "********" },
    ],
    entities: [
      { key: "contractors", label: "Контрагенты" },
      { key: "nomenclature", label: "Номенклатура" },
      { key: "documents", label: "Документы" },
    ],
  },
];

const STATUS_CONFIG: Record<ConnectorStatus, { label: string; color: string; bg: string; icon: React.ElementType }> = {
  connected: { label: "Подключено", color: "var(--accent-green)", bg: "color-mix(in srgb, var(--accent-green) 12%, transparent)", icon: CheckCircle2 },
  disconnected: { label: "Не подключено", color: "var(--text-tertiary)", bg: "color-mix(in srgb, var(--text-tertiary) 8%, transparent)", icon: XCircle },
  syncing: { label: "Синхронизация...", color: "var(--accent-blue)", bg: "color-mix(in srgb, var(--accent-blue) 12%, transparent)", icon: RefreshCw },
  error: { label: "Ошибка", color: "var(--accent-rose)", bg: "color-mix(in srgb, var(--accent-rose) 12%, transparent)", icon: AlertCircle },
};

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// COMPONENT
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

export function IntegrationsPage() {
  const [connectors, setConnectors] = useState<Connector[]>([]);
  const [loading, setLoading] = useState(true);
  const [setupModal, setSetupModal] = useState<ConnectorDef | null>(null);
  const [editConnector, setEditConnector] = useState<Connector | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);

  // Setup modal state
  const [setupStep, setSetupStep] = useState(0);
  const [authConfig, setAuthConfig] = useState<Record<string, string>>({});
  const [testResult, setTestResult] = useState<"idle" | "testing" | "ok" | "fail">("idle");
  const [testError, setTestError] = useState("");
  const [selectedEntities, setSelectedEntities] = useState<string[]>([]);
  const [importProgress, setImportProgress] = useState<ImportProgress | null>(null);
  const [setupLoading, setSetupLoading] = useState(false);

  const pollRef = useRef<NodeJS.Timeout | null>(null);

  // ---- Load connectors ----
  const loadConnectors = useCallback(async () => {
    try {
      const data = await apiGet<Connector[]>("/connectors/");
      setConnectors(data);
    } catch (err) {
      console.error("Failed to load connectors:", err);
      // Mock data for demo
      setConnectors([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadConnectors(); }, [loadConnectors]);

  // Cleanup polling on unmount
  useEffect(() => {
    return () => {
      if (pollRef.current) clearInterval(pollRef.current);
    };
  }, []);

  // ---- Handlers ----
  const openSetup = (def: ConnectorDef, existing?: Connector) => {
    setSetupModal(def);
    setEditConnector(existing || null);
    setSetupStep(0);
    setAuthConfig({});
    setTestResult("idle");
    setTestError("");
    setSelectedEntities([]);
    setImportProgress(null);
  };

  const closeSetup = () => {
    setSetupModal(null);
    setEditConnector(null);
    if (pollRef.current) {
      clearInterval(pollRef.current);
      pollRef.current = null;
    }
  };

  const handleTestConnection = async () => {
    if (!setupModal) return;
    setTestResult("testing");
    setTestError("");
    try {
      if (editConnector) {
        await apiPost(`/connectors/${editConnector.id}/test`);
      } else {
        // Save first, then test
        const saved = await apiPost<Connector>("/connectors/setup", {
          connector_type: setupModal.type,
          name: setupModal.name,
          auth_config: authConfig,
          sync_config: {},
        });
        setEditConnector(saved);
        await apiPost(`/connectors/${saved.id}/test`);
      }
      setTestResult("ok");
      setTimeout(() => setSetupStep(2), 600);
    } catch (err: any) {
      setTestResult("fail");
      setTestError(err.message || "Не удалось подключиться");
    }
  };

  const handleStartImport = async () => {
    if (!editConnector || selectedEntities.length === 0) return;
    setSetupStep(3);
    setSetupLoading(true);
    try {
      await apiPost(`/connectors/${editConnector.id}/import`, { entities: selectedEntities });
      // Start polling
      pollRef.current = setInterval(async () => {
        try {
          const progress = await apiGet<ImportProgress>(`/connectors/${editConnector.id}/status`);
          setImportProgress(progress);
          if (progress.status === "done" || progress.status === "error") {
            if (pollRef.current) clearInterval(pollRef.current);
            pollRef.current = null;
            loadConnectors();
          }
        } catch {
          if (pollRef.current) clearInterval(pollRef.current);
          pollRef.current = null;
        }
      }, 2000);
    } catch (err: any) {
      setImportProgress({ status: "error", total: 0, imported: 0, entities: {}, errors: [err.message] });
    } finally {
      setSetupLoading(false);
    }
  };

  const handleSync = async (connectorId: string) => {
    try {
      setConnectors(prev => prev.map(c => c.id === connectorId ? { ...c, status: "syncing" as const } : c));
      await apiPost(`/connectors/${connectorId}/import`, { entities: [] });
      // Poll until done
      const poll = setInterval(async () => {
        try {
          const progress = await apiGet<ImportProgress>(`/connectors/${connectorId}/status`);
          if (progress.status === "done" || progress.status === "error") {
            clearInterval(poll);
            loadConnectors();
          }
        } catch {
          clearInterval(poll);
          loadConnectors();
        }
      }, 3000);
    } catch {
      loadConnectors();
    }
  };

  const handleDelete = async (connectorId: string) => {
    try {
      await apiDelete(`/connectors/${connectorId}`);
      setConnectors(prev => prev.filter(c => c.id !== connectorId));
    } catch (err) {
      console.error("Delete failed:", err);
    }
    setDeleteConfirm(null);
  };

  const toggleEntity = (key: string) => {
    setSelectedEntities(prev =>
      prev.includes(key) ? prev.filter(k => k !== key) : [...prev, key]
    );
  };

  // ---- Find existing connector for a def ----
  const getExisting = (type: string) => connectors.find(c => c.connector_type === type);

  // ---- Format time ----
  const formatTime = (iso?: string) => {
    if (!iso) return "---";
    try {
      const d = new Date(iso);
      return d.toLocaleString("ru-RU", { day: "2-digit", month: "2-digit", year: "2-digit", hour: "2-digit", minute: "2-digit" });
    } catch { return iso; }
  };

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // RENDER
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

  return (
    <div className="h-full overflow-y-auto px-6 py-6">
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="max-w-[1100px] mx-auto"
      >
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-2xl font-bold mb-2" style={{ color: "var(--text-primary)" }}>
            Интеграции
          </h1>
          <p className="text-sm" style={{ color: "var(--text-secondary)" }}>
            Подключайте внешние системы для автоматического импорта данных в рабочее пространство
          </p>
        </div>

        {/* Loading */}
        {loading && (
          <div className="flex items-center justify-center py-20">
            <Loader2 size={24} className="animate-spin" style={{ color: "var(--accent-blue)" }} />
          </div>
        )}

        {/* Connector cards grid */}
        {!loading && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
            {CONNECTOR_DEFS.map(def => {
              const existing = getExisting(def.type);
              const status = existing ? STATUS_CONFIG[existing.status] : STATUS_CONFIG.disconnected;
              const StatusIcon = status.icon;

              return (
                <motion.div
                  key={def.type}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="rounded-2xl p-5"
                  style={{
                    backgroundColor: "var(--bg-surface)",
                    border: "1px solid var(--border-default)",
                  }}
                >
                  {/* Card header */}
                  <div className="flex items-start gap-4 mb-4">
                    <div
                      className="w-12 h-12 rounded-xl flex items-center justify-center text-sm font-bold flex-shrink-0"
                      style={{
                        backgroundColor: `color-mix(in srgb, ${def.color} 15%, transparent)`,
                        color: def.color,
                        border: `1px solid color-mix(in srgb, ${def.color} 25%, transparent)`,
                      }}
                    >
                      {def.icon}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2.5 mb-1">
                        <h3 className="text-[15px] font-semibold" style={{ color: "var(--text-primary)" }}>
                          {def.name}
                        </h3>
                        <div
                          className="flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium"
                          style={{ backgroundColor: status.bg, color: status.color }}
                        >
                          <StatusIcon size={12} className={existing?.status === "syncing" ? "animate-spin" : ""} />
                          {status.label}
                        </div>
                      </div>
                      <p className="text-xs" style={{ color: "var(--text-tertiary)" }}>
                        {def.description}
                      </p>
                    </div>
                  </div>

                  {/* Connected info */}
                  {existing && existing.status !== "disconnected" && (
                    <div
                      className="rounded-xl p-3.5 mb-4 space-y-2"
                      style={{ backgroundColor: "var(--bg-base)", border: "1px solid var(--border-default)" }}
                    >
                      <div className="flex items-center gap-2 text-xs" style={{ color: "var(--text-secondary)" }}>
                        <Clock size={13} />
                        <span>Последняя синхронизация: {formatTime(existing.last_sync)}</span>
                      </div>
                      {existing.import_stats && Object.keys(existing.import_stats).length > 0 && (
                        <div className="flex flex-wrap gap-2">
                          {Object.entries(existing.import_stats).map(([key, count]) => (
                            <div
                              key={key}
                              className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-medium"
                              style={{
                                backgroundColor: "color-mix(in srgb, var(--accent-blue) 8%, transparent)",
                                color: "var(--accent-blue)",
                              }}
                            >
                              <Database size={11} />
                              {key}: {count}
                            </div>
                          ))}
                        </div>
                      )}
                      {existing.status === "error" && existing.error_message && (
                        <div className="flex items-start gap-2 text-xs" style={{ color: "var(--accent-rose)" }}>
                          <AlertCircle size={13} className="flex-shrink-0 mt-0.5" />
                          <span>{existing.error_message}</span>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Actions */}
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => openSetup(def, existing || undefined)}
                      className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-medium transition-all"
                      style={{
                        backgroundColor: existing ? "var(--bg-base)" : `color-mix(in srgb, ${def.color} 12%, transparent)`,
                        border: `1px solid ${existing ? "var(--border-default)" : `color-mix(in srgb, ${def.color} 25%, transparent)`}`,
                        color: existing ? "var(--text-secondary)" : def.color,
                      }}
                      onMouseEnter={e => { e.currentTarget.style.borderColor = def.color; e.currentTarget.style.color = def.color; }}
                      onMouseLeave={e => {
                        e.currentTarget.style.borderColor = existing ? "var(--border-default)" : `color-mix(in srgb, ${def.color} 25%, transparent)`;
                        e.currentTarget.style.color = existing ? "var(--text-secondary)" : def.color;
                      }}
                    >
                      <Settings size={13} />
                      Настроить
                    </button>

                    {existing && existing.status === "connected" && (
                      <button
                        onClick={() => handleSync(existing.id)}
                        className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-medium transition-all"
                        style={{
                          backgroundColor: "color-mix(in srgb, var(--accent-teal) 10%, transparent)",
                          border: "1px solid color-mix(in srgb, var(--accent-teal) 20%, transparent)",
                          color: "var(--accent-teal)",
                        }}
                        onMouseEnter={e => { e.currentTarget.style.borderColor = "var(--accent-teal)"; }}
                        onMouseLeave={e => { e.currentTarget.style.borderColor = "color-mix(in srgb, var(--accent-teal) 20%, transparent)"; }}
                      >
                        <RefreshCw size={13} />
                        Синхронизировать
                      </button>
                    )}

                    {existing && (
                      <button
                        onClick={() => setDeleteConfirm(existing.id)}
                        className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-medium transition-all ml-auto"
                        style={{
                          color: "var(--text-tertiary)",
                        }}
                        onMouseEnter={e => { e.currentTarget.style.color = "var(--accent-rose)"; e.currentTarget.style.backgroundColor = "color-mix(in srgb, var(--accent-rose) 8%, transparent)"; }}
                        onMouseLeave={e => { e.currentTarget.style.color = "var(--text-tertiary)"; e.currentTarget.style.backgroundColor = "transparent"; }}
                      >
                        <Trash2 size={13} />
                        Удалить
                      </button>
                    )}
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}

        {/* Info block */}
        {!loading && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="mt-6 flex items-start gap-3 rounded-xl p-4"
            style={{
              backgroundColor: "color-mix(in srgb, var(--accent-blue) 5%, transparent)",
              border: "1px solid color-mix(in srgb, var(--accent-blue) 12%, transparent)",
            }}
          >
            <Info size={16} className="flex-shrink-0 mt-0.5" style={{ color: "var(--accent-blue)" }} />
            <div className="text-xs leading-relaxed" style={{ color: "var(--text-secondary)" }}>
              Импортированные данные автоматически попадут в соответствующие модули: сделки в CRM,
              задачи в Канбан, контакты в CRM-контакты. Синхронизация происходит в одну сторону
              (из внешней системы в XeroCode).
            </div>
          </motion.div>
        )}
      </motion.div>

      {/* ━━━ Delete confirmation ━━━ */}
      <AnimatePresence>
        {deleteConfirm && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center"
            style={{ backgroundColor: "rgba(0,0,0,0.5)" }}
            onClick={() => setDeleteConfirm(null)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="w-full max-w-[400px] rounded-2xl p-6"
              style={{ backgroundColor: "var(--bg-surface)", border: "1px solid var(--border-default)" }}
              onClick={e => e.stopPropagation()}
            >
              <div className="flex items-center gap-3 mb-4">
                <div
                  className="w-10 h-10 rounded-xl flex items-center justify-center"
                  style={{ backgroundColor: "color-mix(in srgb, var(--accent-rose) 12%, transparent)" }}
                >
                  <Trash2 size={18} style={{ color: "var(--accent-rose)" }} />
                </div>
                <div>
                  <h3 className="text-sm font-semibold" style={{ color: "var(--text-primary)" }}>
                    Удалить интеграцию?
                  </h3>
                  <p className="text-xs" style={{ color: "var(--text-tertiary)" }}>
                    Импортированные данные сохранятся
                  </p>
                </div>
              </div>
              <div className="flex gap-2 justify-end">
                <button
                  onClick={() => setDeleteConfirm(null)}
                  className="px-4 py-2 rounded-xl text-xs font-medium transition-colors"
                  style={{ color: "var(--text-secondary)", backgroundColor: "var(--bg-base)", border: "1px solid var(--border-default)" }}
                >
                  Отмена
                </button>
                <button
                  onClick={() => handleDelete(deleteConfirm)}
                  className="px-4 py-2 rounded-xl text-xs font-medium transition-colors"
                  style={{ backgroundColor: "var(--accent-rose)", color: "#fff" }}
                >
                  Удалить
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ━━━ Setup Modal ━━━ */}
      <AnimatePresence>
        {setupModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center"
            style={{ backgroundColor: "rgba(0,0,0,0.5)" }}
            onClick={closeSetup}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0, y: 10 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 10 }}
              className="w-full max-w-[560px] rounded-2xl overflow-hidden"
              style={{ backgroundColor: "var(--bg-surface)", border: "1px solid var(--border-default)", maxHeight: "85vh" }}
              onClick={e => e.stopPropagation()}
            >
              {/* Modal header */}
              <div
                className="flex items-center gap-3 px-6 py-4"
                style={{ borderBottom: "1px solid var(--border-default)" }}
              >
                <div
                  className="w-9 h-9 rounded-lg flex items-center justify-center text-xs font-bold"
                  style={{
                    backgroundColor: `color-mix(in srgb, ${setupModal.color} 15%, transparent)`,
                    color: setupModal.color,
                  }}
                >
                  {setupModal.icon}
                </div>
                <div className="flex-1">
                  <h2 className="text-sm font-semibold" style={{ color: "var(--text-primary)" }}>
                    Настройка {setupModal.name}
                  </h2>
                  <p className="text-[11px]" style={{ color: "var(--text-tertiary)" }}>
                    {setupStep === 0 && "Шаг 1: Авторизация"}
                    {setupStep === 1 && "Шаг 2: Проверка подключения"}
                    {setupStep === 2 && "Шаг 3: Выбор данных"}
                    {setupStep === 3 && "Шаг 4: Импорт"}
                  </p>
                </div>
                <button
                  onClick={closeSetup}
                  className="w-8 h-8 flex items-center justify-center rounded-lg transition-colors"
                  style={{ color: "var(--text-tertiary)" }}
                  onMouseEnter={e => { e.currentTarget.style.backgroundColor = "var(--bg-elevated)"; }}
                  onMouseLeave={e => { e.currentTarget.style.backgroundColor = "transparent"; }}
                >
                  <X size={16} />
                </button>
              </div>

              {/* Steps indicator */}
              <div className="flex items-center gap-1 px-6 py-3" style={{ borderBottom: "1px solid var(--border-default)" }}>
                {[0, 1, 2, 3].map(s => (
                  <div key={s} className="flex items-center gap-1 flex-1">
                    <div
                      className="h-1.5 flex-1 rounded-full transition-colors"
                      style={{
                        backgroundColor: s <= setupStep
                          ? setupModal.color
                          : "color-mix(in srgb, var(--text-tertiary) 20%, transparent)",
                      }}
                    />
                  </div>
                ))}
              </div>

              {/* Modal content */}
              <div className="px-6 py-5 overflow-y-auto" style={{ maxHeight: "60vh" }}>
                {/* Step 0: Auth fields */}
                {setupStep === 0 && (
                  <motion.div
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="space-y-4"
                  >
                    {setupModal.authFields.map(field => (
                      <div key={field.key}>
                        <label className="block text-xs font-medium mb-1.5" style={{ color: "var(--text-secondary)" }}>
                          {field.label}
                        </label>
                        <input
                          type={field.type}
                          value={authConfig[field.key] || ""}
                          onChange={e => setAuthConfig(prev => ({ ...prev, [field.key]: e.target.value }))}
                          placeholder={field.placeholder}
                          className="w-full px-3.5 py-2.5 rounded-xl text-sm outline-none transition-colors"
                          style={{
                            backgroundColor: "var(--bg-base)",
                            border: "1px solid var(--border-default)",
                            color: "var(--text-primary)",
                          }}
                          onFocus={e => { e.currentTarget.style.borderColor = setupModal.color; }}
                          onBlur={e => { e.currentTarget.style.borderColor = "var(--border-default)"; }}
                        />
                      </div>
                    ))}
                    <div className="flex justify-end pt-2">
                      <button
                        onClick={() => setSetupStep(1)}
                        disabled={setupModal.authFields.some(f => !authConfig[f.key])}
                        className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-xs font-medium transition-all disabled:opacity-40"
                        style={{
                          backgroundColor: setupModal.color,
                          color: "#fff",
                        }}
                      >
                        Далее
                        <ChevronRight size={14} />
                      </button>
                    </div>
                  </motion.div>
                )}

                {/* Step 1: Test connection */}
                {setupStep === 1 && (
                  <motion.div
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="text-center py-6"
                  >
                    <div
                      className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4"
                      style={{
                        backgroundColor: testResult === "ok"
                          ? "color-mix(in srgb, var(--accent-green) 12%, transparent)"
                          : testResult === "fail"
                          ? "color-mix(in srgb, var(--accent-rose) 12%, transparent)"
                          : `color-mix(in srgb, ${setupModal.color} 12%, transparent)`,
                      }}
                    >
                      {testResult === "idle" && <Shield size={28} style={{ color: setupModal.color }} />}
                      {testResult === "testing" && <Loader2 size={28} className="animate-spin" style={{ color: setupModal.color }} />}
                      {testResult === "ok" && <CheckCircle2 size={28} style={{ color: "var(--accent-green)" }} />}
                      {testResult === "fail" && <XCircle size={28} style={{ color: "var(--accent-rose)" }} />}
                    </div>

                    <h3 className="text-sm font-semibold mb-1" style={{ color: "var(--text-primary)" }}>
                      {testResult === "idle" && "Проверить подключение"}
                      {testResult === "testing" && "Проверяем..."}
                      {testResult === "ok" && "Подключение установлено"}
                      {testResult === "fail" && "Ошибка подключения"}
                    </h3>
                    <p className="text-xs mb-5" style={{ color: "var(--text-tertiary)" }}>
                      {testResult === "idle" && "Нажмите кнопку ниже для проверки доступа"}
                      {testResult === "testing" && "Подождите несколько секунд..."}
                      {testResult === "ok" && "Можно переходить к выбору данных"}
                      {testResult === "fail" && (testError || "Проверьте параметры и попробуйте снова")}
                    </p>

                    <div className="flex justify-center gap-2">
                      {setupStep === 1 && testResult !== "ok" && (
                        <button
                          onClick={() => setSetupStep(0)}
                          className="px-4 py-2.5 rounded-xl text-xs font-medium transition-colors"
                          style={{ color: "var(--text-secondary)", backgroundColor: "var(--bg-base)", border: "1px solid var(--border-default)" }}
                        >
                          Назад
                        </button>
                      )}
                      {testResult !== "ok" && (
                        <button
                          onClick={handleTestConnection}
                          disabled={testResult === "testing"}
                          className="flex items-center gap-1.5 px-5 py-2.5 rounded-xl text-xs font-medium transition-all disabled:opacity-50"
                          style={{ backgroundColor: setupModal.color, color: "#fff" }}
                        >
                          {testResult === "testing" ? (
                            <Loader2 size={14} className="animate-spin" />
                          ) : (
                            <Zap size={14} />
                          )}
                          Проверить подключение
                        </button>
                      )}
                    </div>
                  </motion.div>
                )}

                {/* Step 2: Select entities */}
                {setupStep === 2 && (
                  <motion.div
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="space-y-3"
                  >
                    <p className="text-xs mb-3" style={{ color: "var(--text-secondary)" }}>
                      Выберите данные для импорта:
                    </p>
                    {setupModal.entities.map(ent => {
                      const selected = selectedEntities.includes(ent.key);
                      return (
                        <button
                          key={ent.key}
                          onClick={() => toggleEntity(ent.key)}
                          className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-left transition-all"
                          style={{
                            backgroundColor: selected
                              ? `color-mix(in srgb, ${setupModal.color} 8%, transparent)`
                              : "var(--bg-base)",
                            border: `1px solid ${selected ? setupModal.color : "var(--border-default)"}`,
                          }}
                        >
                          <div
                            className="w-5 h-5 rounded-md flex items-center justify-center flex-shrink-0 transition-colors"
                            style={{
                              backgroundColor: selected ? setupModal.color : "transparent",
                              border: `2px solid ${selected ? setupModal.color : "var(--border-default)"}`,
                            }}
                          >
                            {selected && <Check size={12} color="#fff" />}
                          </div>
                          <div className="flex items-center gap-2">
                            <Database size={14} style={{ color: selected ? setupModal.color : "var(--text-tertiary)" }} />
                            <span className="text-sm font-medium" style={{ color: selected ? "var(--text-primary)" : "var(--text-secondary)" }}>
                              {ent.label}
                            </span>
                          </div>
                        </button>
                      );
                    })}
                    <div className="flex justify-end pt-3">
                      <button
                        onClick={handleStartImport}
                        disabled={selectedEntities.length === 0}
                        className="flex items-center gap-1.5 px-5 py-2.5 rounded-xl text-xs font-medium transition-all disabled:opacity-40"
                        style={{ backgroundColor: setupModal.color, color: "#fff" }}
                      >
                        <Download size={14} />
                        Начать импорт
                      </button>
                    </div>
                  </motion.div>
                )}

                {/* Step 3: Import progress */}
                {setupStep === 3 && (
                  <motion.div
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="space-y-4"
                  >
                    {/* Progress bar */}
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-xs font-medium" style={{ color: "var(--text-secondary)" }}>
                          Прогресс импорта
                        </span>
                        <span className="text-xs font-medium" style={{ color: "var(--text-primary)" }}>
                          {importProgress ? `${importProgress.imported} / ${importProgress.total}` : "Запуск..."}
                        </span>
                      </div>
                      <div
                        className="h-2.5 rounded-full overflow-hidden"
                        style={{ backgroundColor: "color-mix(in srgb, var(--text-tertiary) 15%, transparent)" }}
                      >
                        <motion.div
                          className="h-full rounded-full"
                          style={{ backgroundColor: setupModal.color }}
                          initial={{ width: "0%" }}
                          animate={{
                            width: importProgress && importProgress.total > 0
                              ? `${Math.round((importProgress.imported / importProgress.total) * 100)}%`
                              : "5%",
                          }}
                          transition={{ duration: 0.5 }}
                        />
                      </div>
                    </div>

                    {/* Entity statuses */}
                    {importProgress && Object.entries(importProgress.entities).length > 0 && (
                      <div className="space-y-2">
                        {Object.entries(importProgress.entities).map(([key, ent]) => {
                          const entityLabel = setupModal.entities.find(e => e.key === key)?.label || key;
                          return (
                            <div
                              key={key}
                              className="flex items-center gap-3 px-3.5 py-2.5 rounded-xl"
                              style={{ backgroundColor: "var(--bg-base)", border: "1px solid var(--border-default)" }}
                            >
                              {ent.status === "done" && <CheckCircle2 size={15} style={{ color: "var(--accent-green)" }} />}
                              {ent.status === "importing" && <Loader2 size={15} className="animate-spin" style={{ color: setupModal.color }} />}
                              {ent.status === "error" && <XCircle size={15} style={{ color: "var(--accent-rose)" }} />}
                              <span className="text-xs font-medium flex-1" style={{ color: "var(--text-primary)" }}>
                                {entityLabel}
                              </span>
                              <span className="text-xs" style={{ color: "var(--text-tertiary)" }}>
                                {ent.count}
                                {ent.status === "done" && " \u2713"}
                                {ent.status === "importing" && "..."}
                              </span>
                            </div>
                          );
                        })}
                      </div>
                    )}

                    {/* Errors */}
                    {importProgress && importProgress.errors.length > 0 && (
                      <div
                        className="rounded-xl p-3 space-y-1"
                        style={{
                          backgroundColor: "color-mix(in srgb, var(--accent-rose) 6%, transparent)",
                          border: "1px solid color-mix(in srgb, var(--accent-rose) 15%, transparent)",
                        }}
                      >
                        <div className="flex items-center gap-1.5 text-xs font-medium" style={{ color: "var(--accent-rose)" }}>
                          <AlertCircle size={13} />
                          Ошибки импорта
                        </div>
                        {importProgress.errors.map((err, i) => (
                          <div key={i} className="text-[11px] pl-5" style={{ color: "var(--text-tertiary)" }}>
                            {err}
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Done state */}
                    {importProgress?.status === "done" && (
                      <div className="flex justify-end pt-2">
                        <button
                          onClick={closeSetup}
                          className="flex items-center gap-1.5 px-5 py-2.5 rounded-xl text-xs font-medium"
                          style={{ backgroundColor: "var(--accent-green)", color: "#fff" }}
                        >
                          <Check size={14} />
                          Готово
                        </button>
                      </div>
                    )}

                    {importProgress?.status === "error" && (
                      <div className="flex justify-end gap-2 pt-2">
                        <button
                          onClick={() => setSetupStep(2)}
                          className="px-4 py-2.5 rounded-xl text-xs font-medium transition-colors"
                          style={{ color: "var(--text-secondary)", backgroundColor: "var(--bg-base)", border: "1px solid var(--border-default)" }}
                        >
                          Назад
                        </button>
                        <button
                          onClick={handleStartImport}
                          className="flex items-center gap-1.5 px-5 py-2.5 rounded-xl text-xs font-medium"
                          style={{ backgroundColor: setupModal.color, color: "#fff" }}
                        >
                          <RefreshCw size={14} />
                          Повторить
                        </button>
                      </div>
                    )}
                  </motion.div>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
