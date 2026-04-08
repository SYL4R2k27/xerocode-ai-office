import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  FileCheck,
  Settings,
  RefreshCw,
  CheckCircle2,
  XCircle,
  Clock,
  ArrowDownLeft,
  ArrowUpRight,
  List,
  Eye,
  Loader2,
  Link2,
  AlertCircle,
  Search,
} from "lucide-react";

const API_BASE =
  window.location.hostname === "localhost"
    ? "http://localhost:8000/api"
    : `${window.location.origin}/api`;

const authHeaders = () => ({
  Authorization: "Bearer " + localStorage.getItem("ai_office_token"),
  "Content-Type": "application/json",
});

interface EDODocument {
  id: string;
  doc_number: string;
  doc_type: string;
  category: string;
  title: string;
  status: string;
  created_at: string;
  metadata?: Record<string, any>;
}

interface EDOStatus {
  connected: boolean;
  status: string;
  box_id?: string;
  inn?: string;
  last_sync_at?: string;
  last_sync_stats?: { imported: number; updated: number; errors: number };
}

const DOC_TYPE_LABELS: Record<string, string> = {
  sf: "\u0421\u0424",
  upd: "\u0423\u041f\u0414",
  act: "\u0410\u043a\u0442",
  nakladnaya: "\u041d\u0430\u043a\u043b\u0430\u0434\u043d\u0430\u044f",
  contract: "\u0414\u043e\u0433\u043e\u0432\u043e\u0440",
  invoice: "\u0421\u0447\u0451\u0442",
  other: "\u041f\u0440\u043e\u0447\u0435\u0435",
};

const STATUS_STYLES: Record<string, { color: string; bg: string; label: string }> = {
  draft: { color: "var(--text-secondary)", bg: "var(--bg-elevated)", label: "\u0427\u0435\u0440\u043d\u043e\u0432\u0438\u043a" },
  sent: { color: "var(--accent-blue)", bg: "rgba(96,165,250,0.12)", label: "\u041e\u0442\u043f\u0440\u0430\u0432\u043b\u0435\u043d" },
  signed: { color: "var(--accent-green)", bg: "rgba(74,222,128,0.12)", label: "\u041f\u043e\u0434\u043f\u0438\u0441\u0430\u043d" },
  received: { color: "var(--accent-teal)", bg: "rgba(90,191,173,0.12)", label: "\u041f\u043e\u043b\u0443\u0447\u0435\u043d" },
  rejected: { color: "var(--accent-rose)", bg: "rgba(251,113,133,0.12)", label: "\u041e\u0442\u043a\u043b\u043e\u043d\u0451\u043d" },
  approval: { color: "var(--accent-amber)", bg: "rgba(251,191,36,0.12)", label: "\u041d\u0430 \u0441\u043e\u0433\u043b\u0430\u0441\u043e\u0432\u0430\u043d\u0438\u0438" },
  archive: { color: "var(--text-tertiary)", bg: "var(--bg-elevated)", label: "\u0410\u0440\u0445\u0438\u0432" },
};

type Tab = "all" | "incoming" | "outgoing";

export function EDOPage() {
  const [status, setStatus] = useState<EDOStatus | null>(null);
  const [documents, setDocuments] = useState<EDODocument[]>([]);
  const [tab, setTab] = useState<Tab>("all");
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [setupOpen, setSetupOpen] = useState(false);
  const [search, setSearch] = useState("");

  // Setup form
  const [apiKey, setApiKey] = useState("");
  const [boxId, setBoxId] = useState("");
  const [inn, setInn] = useState("");
  const [setupLoading, setSetupLoading] = useState(false);
  const [setupError, setSetupError] = useState("");

  const fetchStatus = useCallback(async () => {
    try {
      const res = await fetch(`${API_BASE}/edo/status`, { headers: authHeaders() });
      if (res.ok) setStatus(await res.json());
    } catch {}
  }, []);

  const fetchDocuments = useCallback(async () => {
    try {
      const params = new URLSearchParams();
      if (tab === "incoming") params.set("direction", "incoming");
      if (tab === "outgoing") params.set("direction", "outgoing");
      const res = await fetch(`${API_BASE}/edo/documents?${params}`, { headers: authHeaders() });
      if (res.ok) setDocuments(await res.json());
    } catch {}
  }, [tab]);

  useEffect(() => {
    setLoading(true);
    Promise.all([fetchStatus(), fetchDocuments()]).finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    fetchDocuments();
  }, [tab]);

  const handleSetup = async () => {
    setSetupLoading(true);
    setSetupError("");
    try {
      const res = await fetch(`${API_BASE}/edo/setup`, {
        method: "POST",
        headers: authHeaders(),
        body: JSON.stringify({ api_key: apiKey, box_id: boxId, inn }),
      });
      if (!res.ok) {
        const err = await res.json();
        setSetupError(err.detail || "\u041e\u0448\u0438\u0431\u043a\u0430");
        return;
      }
      // Test connection
      const testRes = await fetch(`${API_BASE}/edo/test`, {
        method: "POST",
        headers: authHeaders(),
      });
      if (!testRes.ok) {
        setSetupError("\u041d\u0435 \u0443\u0434\u0430\u043b\u043e\u0441\u044c \u043f\u043e\u0434\u043a\u043b\u044e\u0447\u0438\u0442\u044c\u0441\u044f");
        return;
      }
      setSetupOpen(false);
      fetchStatus();
    } catch {
      setSetupError("\u041e\u0448\u0438\u0431\u043a\u0430 \u0441\u0435\u0442\u0438");
    } finally {
      setSetupLoading(false);
    }
  };

  const handleSync = async () => {
    setSyncing(true);
    try {
      await fetch(`${API_BASE}/edo/sync`, { method: "POST", headers: authHeaders() });
      await fetchDocuments();
      await fetchStatus();
    } catch {}
    setSyncing(false);
  };

  const filteredDocs = search
    ? documents.filter(
        (d) =>
          d.title.toLowerCase().includes(search.toLowerCase()) ||
          d.doc_number.toLowerCase().includes(search.toLowerCase())
      )
    : documents;

  const isConnected = status?.connected;

  const tabs: { id: Tab; label: string; icon: React.ElementType }[] = [
    { id: "all", label: "\u0412\u0441\u0435", icon: List },
    { id: "incoming", label: "\u0412\u0445\u043e\u0434\u044f\u0449\u0438\u0435", icon: ArrowDownLeft },
    { id: "outgoing", label: "\u0418\u0441\u0445\u043e\u0434\u044f\u0449\u0438\u0435", icon: ArrowUpRight },
  ];

  return (
    <div className="h-full overflow-y-auto p-6">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold" style={{ color: "var(--text-primary)" }}>
              \u042d\u043b\u0435\u043a\u0442\u0440\u043e\u043d\u043d\u044b\u0439 \u0434\u043e\u043a\u0443\u043c\u0435\u043d\u0442\u043e\u043e\u0431\u043e\u0440\u043e\u0442 (\u042d\u0414\u041e)
            </h1>
            <p className="text-sm mt-1" style={{ color: "var(--text-secondary)" }}>
              \u041e\u0431\u043c\u0435\u043d \u0434\u043e\u043a\u0443\u043c\u0435\u043d\u0442\u0430\u043c\u0438 \u0447\u0435\u0440\u0435\u0437 \u0414\u0438\u0430\u0434\u043e\u043a
            </p>
          </div>
          <div className="flex items-center gap-3">
            {isConnected && (
              <button
                onClick={handleSync}
                disabled={syncing}
                className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors"
                style={{
                  backgroundColor: "rgba(96,165,250,0.12)",
                  color: "var(--accent-blue)",
                  border: "1px solid rgba(96,165,250,0.2)",
                }}
              >
                <RefreshCw size={15} className={syncing ? "animate-spin" : ""} />
                {syncing ? "\u0421\u0438\u043d\u0445\u0440\u043e\u043d\u0438\u0437\u0430\u0446\u0438\u044f..." : "\u0421\u0438\u043d\u0445\u0440\u043e\u043d\u0438\u0437\u0438\u0440\u043e\u0432\u0430\u0442\u044c"}
              </button>
            )}
            <button
              onClick={() => setSetupOpen(true)}
              className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors"
              style={{
                backgroundColor: "var(--bg-elevated)",
                color: "var(--text-secondary)",
                border: "1px solid var(--border-default)",
              }}
            >
              <Settings size={15} />
              \u041d\u0430\u0441\u0442\u0440\u043e\u0439\u043a\u0438
            </button>
          </div>
        </div>

        {/* Connection status card */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-xl p-4"
          style={{
            backgroundColor: "var(--bg-surface)",
            border: "1px solid var(--border-default)",
          }}
        >
          <div className="flex items-center gap-4">
            <div
              className="w-10 h-10 rounded-lg flex items-center justify-center"
              style={{
                backgroundColor: isConnected ? "rgba(74,222,128,0.12)" : "rgba(251,113,133,0.12)",
              }}
            >
              {isConnected ? (
                <Link2 size={20} style={{ color: "var(--accent-green)" }} />
              ) : (
                <AlertCircle size={20} style={{ color: "var(--accent-rose)" }} />
              )}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium" style={{ color: "var(--text-primary)" }}>
                  \u0414\u0438\u0430\u0434\u043e\u043a
                </span>
                <span
                  className="px-2 py-0.5 rounded-full text-[11px] font-medium"
                  style={{
                    backgroundColor: isConnected ? "rgba(74,222,128,0.12)" : "rgba(251,113,133,0.12)",
                    color: isConnected ? "var(--accent-green)" : "var(--accent-rose)",
                  }}
                >
                  {isConnected ? "\u041f\u043e\u0434\u043a\u043b\u044e\u0447\u0435\u043d\u043e" : "\u041d\u0435 \u043f\u043e\u0434\u043a\u043b\u044e\u0447\u0435\u043d\u043e"}
                </span>
              </div>
              {status?.inn && (
                <div className="text-xs mt-0.5" style={{ color: "var(--text-tertiary)" }}>
                  \u0418\u041d\u041d: {status.inn} | Box ID: {status.box_id}
                </div>
              )}
              {status?.last_sync_at && (
                <div className="text-xs mt-0.5" style={{ color: "var(--text-tertiary)" }}>
                  \u041f\u043e\u0441\u043b\u0435\u0434\u043d\u044f\u044f \u0441\u0438\u043d\u0445\u0440\u043e\u043d\u0438\u0437\u0430\u0446\u0438\u044f:{" "}
                  {new Date(status.last_sync_at).toLocaleString("ru-RU")}
                </div>
              )}
            </div>
            {!isConnected && (
              <button
                onClick={() => setSetupOpen(true)}
                className="px-4 py-2 rounded-lg text-sm font-medium transition-colors"
                style={{
                  background: "linear-gradient(135deg, var(--accent-blue), var(--accent-teal))",
                  color: "#fff",
                }}
              >
                \u041f\u043e\u0434\u043a\u043b\u044e\u0447\u0438\u0442\u044c
              </button>
            )}
          </div>
        </motion.div>

        {/* Tabs + Search */}
        <div className="flex items-center gap-4">
          <div className="flex gap-1 p-1 rounded-lg" style={{ backgroundColor: "var(--bg-surface)", border: "1px solid var(--border-default)" }}>
            {tabs.map((t) => {
              const Icon = t.icon;
              const active = tab === t.id;
              return (
                <button
                  key={t.id}
                  onClick={() => setTab(t.id)}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-colors"
                  style={{
                    backgroundColor: active ? "var(--bg-elevated)" : "transparent",
                    color: active ? "var(--accent-blue)" : "var(--text-secondary)",
                  }}
                >
                  <Icon size={14} />
                  {t.label}
                </button>
              );
            })}
          </div>
          <div className="flex-1" />
          <div className="relative">
            <Search
              size={14}
              className="absolute left-3 top-1/2 -translate-y-1/2"
              style={{ color: "var(--text-tertiary)" }}
            />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="\u041f\u043e\u0438\u0441\u043a \u0434\u043e\u043a\u0443\u043c\u0435\u043d\u0442\u043e\u0432..."
              className="pl-9 pr-3 py-2 rounded-lg text-sm outline-none w-60"
              style={{
                backgroundColor: "var(--bg-surface)",
                border: "1px solid var(--border-default)",
                color: "var(--text-primary)",
              }}
            />
          </div>
        </div>

        {/* Documents table */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="rounded-xl overflow-hidden"
          style={{
            backgroundColor: "var(--bg-surface)",
            border: "1px solid var(--border-default)",
          }}
        >
          {loading ? (
            <div className="flex items-center justify-center py-16">
              <Loader2 size={24} className="animate-spin" style={{ color: "var(--text-tertiary)" }} />
            </div>
          ) : filteredDocs.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <FileCheck size={40} style={{ color: "var(--text-tertiary)" }} />
              <p className="text-sm mt-3" style={{ color: "var(--text-secondary)" }}>
                {isConnected ? "\u0414\u043e\u043a\u0443\u043c\u0435\u043d\u0442\u043e\u0432 \u043f\u043e\u043a\u0430 \u043d\u0435\u0442" : "\u041f\u043e\u0434\u043a\u043b\u044e\u0447\u0438\u0442\u0435 \u0414\u0438\u0430\u0434\u043e\u043a \u0434\u043b\u044f \u043d\u0430\u0447\u0430\u043b\u0430 \u0440\u0430\u0431\u043e\u0442\u044b"}
              </p>
            </div>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr style={{ borderBottom: "1px solid var(--border-default)" }}>
                  {["\u2116", "\u0414\u0430\u0442\u0430", "\u0422\u0438\u043f", "\u041d\u0430\u0437\u0432\u0430\u043d\u0438\u0435", "\u0421\u0442\u0430\u0442\u0443\u0441", ""].map((h) => (
                    <th
                      key={h}
                      className="text-left px-4 py-3 text-xs font-medium"
                      style={{ color: "var(--text-tertiary)" }}
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filteredDocs.map((doc) => {
                  const st = STATUS_STYLES[doc.status] || STATUS_STYLES.draft;
                  return (
                    <tr
                      key={doc.id}
                      className="transition-colors cursor-pointer"
                      style={{ borderBottom: "1px solid var(--border-default)" }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.backgroundColor = "var(--bg-elevated)";
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.backgroundColor = "transparent";
                      }}
                    >
                      <td className="px-4 py-3 font-mono text-xs" style={{ color: "var(--text-secondary)" }}>
                        {doc.doc_number}
                      </td>
                      <td className="px-4 py-3 text-xs" style={{ color: "var(--text-secondary)" }}>
                        {doc.created_at ? new Date(doc.created_at).toLocaleDateString("ru-RU") : "\u2014"}
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className="px-2 py-0.5 rounded text-[11px] font-medium"
                          style={{
                            backgroundColor: "var(--bg-elevated)",
                            color: "var(--text-secondary)",
                          }}
                        >
                          {DOC_TYPE_LABELS[doc.category] || doc.category}
                        </span>
                      </td>
                      <td
                        className="px-4 py-3 max-w-[300px] truncate"
                        style={{ color: "var(--text-primary)" }}
                      >
                        {doc.title}
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className="px-2 py-0.5 rounded-full text-[11px] font-medium"
                          style={{ backgroundColor: st.bg, color: st.color }}
                        >
                          {st.label}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <button
                          className="w-7 h-7 flex items-center justify-center rounded-md transition-colors"
                          style={{ color: "var(--text-tertiary)" }}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.backgroundColor = "var(--bg-elevated)";
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.backgroundColor = "transparent";
                          }}
                          title="\u041f\u0440\u043e\u0441\u043c\u043e\u0442\u0440"
                        >
                          <Eye size={15} />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </motion.div>
      </div>

      {/* Setup modal */}
      <AnimatePresence>
        {setupOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center"
            style={{ backgroundColor: "rgba(0,0,0,0.5)" }}
            onClick={() => setSetupOpen(false)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="w-full max-w-md rounded-2xl p-6 space-y-4"
              style={{
                backgroundColor: "var(--bg-surface)",
                border: "1px solid var(--border-default)",
                boxShadow: "0 20px 60px rgba(0,0,0,0.4)",
              }}
              onClick={(e) => e.stopPropagation()}
            >
              <h2 className="text-lg font-bold" style={{ color: "var(--text-primary)" }}>
                \u041d\u0430\u0441\u0442\u0440\u043e\u0439\u043a\u0430 \u0414\u0438\u0430\u0434\u043e\u043a
              </h2>
              <p className="text-sm" style={{ color: "var(--text-secondary)" }}>
                \u0412\u0432\u0435\u0434\u0438\u0442\u0435 \u0434\u0430\u043d\u043d\u044b\u0435 \u0434\u043b\u044f \u043f\u043e\u0434\u043a\u043b\u044e\u0447\u0435\u043d\u0438\u044f \u043a \u0414\u0438\u0430\u0434\u043e\u043a \u042d\u0414\u041e
              </p>

              <div className="space-y-3">
                <div>
                  <label className="text-xs font-medium mb-1 block" style={{ color: "var(--text-secondary)" }}>
                    API-\u043a\u043b\u044e\u0447
                  </label>
                  <input
                    value={apiKey}
                    onChange={(e) => setApiKey(e.target.value)}
                    placeholder="DD-XXXXXXXX..."
                    className="w-full px-3 py-2 rounded-lg text-sm outline-none"
                    style={{
                      backgroundColor: "var(--bg-base)",
                      border: "1px solid var(--border-default)",
                      color: "var(--text-primary)",
                    }}
                  />
                </div>
                <div>
                  <label className="text-xs font-medium mb-1 block" style={{ color: "var(--text-secondary)" }}>
                    Box ID
                  </label>
                  <input
                    value={boxId}
                    onChange={(e) => setBoxId(e.target.value)}
                    placeholder="XXXXXXXX-XXXX-XXXX-XXXX-XXXXXXXXXXXX"
                    className="w-full px-3 py-2 rounded-lg text-sm outline-none"
                    style={{
                      backgroundColor: "var(--bg-base)",
                      border: "1px solid var(--border-default)",
                      color: "var(--text-primary)",
                    }}
                  />
                </div>
                <div>
                  <label className="text-xs font-medium mb-1 block" style={{ color: "var(--text-secondary)" }}>
                    \u0418\u041d\u041d \u043e\u0440\u0433\u0430\u043d\u0438\u0437\u0430\u0446\u0438\u0438
                  </label>
                  <input
                    value={inn}
                    onChange={(e) => setInn(e.target.value)}
                    placeholder="7712345678"
                    className="w-full px-3 py-2 rounded-lg text-sm outline-none"
                    style={{
                      backgroundColor: "var(--bg-base)",
                      border: "1px solid var(--border-default)",
                      color: "var(--text-primary)",
                    }}
                  />
                </div>
              </div>

              {setupError && (
                <div className="flex items-center gap-2 text-xs" style={{ color: "var(--accent-rose)" }}>
                  <XCircle size={14} />
                  {setupError}
                </div>
              )}

              <div className="flex justify-end gap-3 pt-2">
                <button
                  onClick={() => setSetupOpen(false)}
                  className="px-4 py-2 rounded-lg text-sm"
                  style={{ color: "var(--text-secondary)" }}
                >
                  \u041e\u0442\u043c\u0435\u043d\u0430
                </button>
                <button
                  onClick={handleSetup}
                  disabled={setupLoading || !apiKey || !boxId}
                  className="px-4 py-2 rounded-lg text-sm font-medium transition-colors disabled:opacity-50"
                  style={{
                    background: "linear-gradient(135deg, var(--accent-blue), var(--accent-teal))",
                    color: "#fff",
                  }}
                >
                  {setupLoading ? (
                    <Loader2 size={14} className="animate-spin" />
                  ) : (
                    "\u041f\u043e\u0434\u043a\u043b\u044e\u0447\u0438\u0442\u044c"
                  )}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
