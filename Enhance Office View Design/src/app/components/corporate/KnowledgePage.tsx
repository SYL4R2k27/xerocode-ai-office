import { useState, useEffect, useCallback, useRef } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  BookOpen, Upload, Search, Trash2, FileText, File,
  Loader2, AlertCircle, Check, X, Database,
} from "lucide-react";

const API_BASE = import.meta.env.DEV ? "http://localhost:8000/api" : `${window.location.origin}/api`;
function getToken(): string | null { return localStorage.getItem("ai_office_token"); }

interface KBDocument {
  id: string;
  filename: string;
  file_type: string;
  file_size: number;
  chunks_count: number;
  status: string;
  created_at: string;
}

interface SearchResult {
  chunk_id: string;
  document_id: string;
  filename: string;
  content: string;
  similarity: number;
  chunk_index: number;
}

async function apiRequest<T>(path: string, options?: RequestInit): Promise<T> {
  const token = getToken();
  const headers: Record<string, string> = { ...(options?.headers as any) };
  if (token) headers["Authorization"] = `Bearer ${token}`;
  if (!headers["Content-Type"] && !(options?.body instanceof FormData)) headers["Content-Type"] = "application/json";
  const res = await fetch(`${API_BASE}${path}`, { ...options, headers });
  if (!res.ok) { const e = await res.json().catch(() => ({ detail: res.statusText })); throw new Error(e.detail); }
  return res.json();
}

export function KnowledgePage() {
  const [documents, setDocuments] = useState<KBDocument[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [searching, setSearching] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const loadDocs = useCallback(async () => {
    try {
      const data = await apiRequest<KBDocument[]>("/knowledge/documents");
      setDocuments(data);
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { loadDocs(); }, [loadDocs]);

  const handleUpload = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      const token = getToken();
      const res = await fetch(`${API_BASE}/knowledge/upload`, {
        method: "POST",
        headers: token ? { Authorization: `Bearer ${token}` } : {},
        body: formData,
      });
      if (!res.ok) { const e = await res.json().catch(() => ({ detail: "Upload failed" })); throw new Error(e.detail); }
      await loadDocs();
    } catch (err: any) {
      alert(`Ошибка: ${err.message}`);
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  }, [loadDocs]);

  const handleDelete = useCallback(async (id: string) => {
    try {
      await apiRequest(`/knowledge/documents/${id}`, { method: "DELETE" });
      setDocuments(prev => prev.filter(d => d.id !== id));
    } catch (err) { console.error(err); }
  }, []);

  const handleSearch = useCallback(async () => {
    if (!searchQuery.trim()) return;
    setSearching(true);
    try {
      const data = await apiRequest<{ results: SearchResult[] }>(`/knowledge/search?q=${encodeURIComponent(searchQuery)}&limit=10`);
      setSearchResults(data.results);
    } catch (err: any) {
      console.error(err);
      setSearchResults([]);
    } finally {
      setSearching(false);
    }
  }, [searchQuery]);

  const formatSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const typeIcons: Record<string, string> = { pdf: "var(--accent-rose)", docx: "var(--accent-blue)", txt: "var(--text-tertiary)", csv: "var(--accent-green)", md: "var(--accent-lavender)" };

  if (loading) {
    return <div className="flex items-center justify-center h-full"><Loader2 size={24} className="animate-spin" style={{ color: "var(--accent-blue)" }} /></div>;
  }

  return (
    <div className="h-full overflow-y-auto p-6 md:p-8">
      <div className="max-w-[900px] mx-auto">
        {/* Header */}
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold" style={{ color: "var(--text-primary)" }}>База знаний</h1>
            <p className="text-sm mt-1" style={{ color: "var(--text-tertiary)" }}>
              {documents.length} документов · AI отвечает с контекстом из ваших файлов
            </p>
          </div>
          <div>
            <input ref={fileRef} type="file" accept=".pdf,.docx,.txt,.csv,.md" onChange={handleUpload} className="hidden" />
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => fileRef.current?.click()}
              disabled={uploading}
              className="flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium"
              style={{ backgroundColor: "var(--accent-blue)", color: "#fff" }}
            >
              {uploading ? <Loader2 size={16} className="animate-spin" /> : <Upload size={16} />}
              Загрузить
            </motion.button>
          </div>
        </motion.div>

        {/* Search */}
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }} className="mb-8">
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: "var(--text-tertiary)" }} />
              <input
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                placeholder="Поиск по базе знаний..."
                className="w-full pl-9 pr-3 py-2.5 rounded-lg text-sm outline-none"
                style={{ backgroundColor: "var(--bg-surface)", border: "1px solid var(--border-default)", color: "var(--text-primary)" }}
              />
            </div>
            <button
              onClick={handleSearch}
              disabled={searching || !searchQuery.trim()}
              className="px-4 py-2.5 rounded-lg text-sm font-medium disabled:opacity-40"
              style={{ backgroundColor: "var(--bg-elevated)", color: "var(--text-primary)", border: "1px solid var(--border-default)" }}
            >
              {searching ? <Loader2 size={14} className="animate-spin" /> : "Найти"}
            </button>
          </div>

          {/* Search results */}
          <AnimatePresence>
            {searchResults.length > 0 && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                className="mt-4 space-y-2"
              >
                <div className="text-xs mb-2" style={{ color: "var(--text-tertiary)" }}>
                  Найдено: {searchResults.length} результатов
                </div>
                {searchResults.map((r, i) => (
                  <motion.div
                    key={r.chunk_id}
                    initial={{ opacity: 0, x: -8 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.05 }}
                    className="p-3 rounded-lg"
                    style={{ backgroundColor: "var(--bg-surface)", border: "1px solid var(--border-default)" }}
                  >
                    <div className="flex items-center gap-2 mb-1">
                      <FileText size={12} style={{ color: "var(--accent-blue)" }} />
                      <span className="text-[11px] font-medium" style={{ color: "var(--text-primary)" }}>{r.filename}</span>
                      <span className="text-[10px]" style={{ color: "var(--text-tertiary)" }}>часть {r.chunk_index + 1}</span>
                    </div>
                    <p className="text-xs leading-relaxed" style={{ color: "var(--text-secondary)" }}>
                      {r.content.slice(0, 300)}{r.content.length > 300 ? "..." : ""}
                    </p>
                  </motion.div>
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>

        {/* Documents list */}
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
          <h2 className="text-sm font-semibold mb-4" style={{ color: "var(--text-primary)" }}>Документы</h2>

          {documents.length === 0 ? (
            <div
              className="text-center py-12 rounded-xl border-2 border-dashed cursor-pointer transition-colors"
              style={{ borderColor: "var(--border-default)", color: "var(--text-tertiary)" }}
              onClick={() => fileRef.current?.click()}
            >
              <Database size={32} className="mx-auto mb-3 opacity-30" />
              <p className="text-sm mb-1">База знаний пуста</p>
              <p className="text-xs">Загрузите PDF, DOCX, TXT или CSV — AI будет использовать их как контекст</p>
            </div>
          ) : (
            <div className="space-y-2">
              {documents.map((doc, i) => (
                <motion.div
                  key={doc.id}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.03 }}
                  className="group flex items-center gap-4 p-4 rounded-xl"
                  style={{ backgroundColor: "var(--bg-surface)", border: "1px solid var(--border-default)" }}
                >
                  <div
                    className="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0"
                    style={{ backgroundColor: `color-mix(in srgb, ${typeIcons[doc.file_type] || "gray"} 12%, transparent)` }}
                  >
                    <FileText size={18} style={{ color: typeIcons[doc.file_type] || "var(--text-tertiary)" }} />
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium truncate" style={{ color: "var(--text-primary)" }}>{doc.filename}</div>
                    <div className="text-[11px] flex items-center gap-2 mt-0.5" style={{ color: "var(--text-tertiary)" }}>
                      <span>{doc.file_type.toUpperCase()}</span>
                      <span>{formatSize(doc.file_size)}</span>
                      <span>{doc.chunks_count} частей</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <span
                      className="text-[10px] px-2 py-0.5 rounded-full font-medium"
                      style={{
                        color: doc.status === "ready" ? "var(--accent-green)" : "var(--accent-amber)",
                        backgroundColor: doc.status === "ready" ? "rgba(52,211,153,0.1)" : "rgba(251,191,36,0.1)",
                      }}
                    >
                      {doc.status === "ready" ? "Готов" : "Обработка"}
                    </span>
                    <button
                      onClick={() => handleDelete(doc.id)}
                      className="p-1.5 rounded-md opacity-0 group-hover:opacity-100 transition-opacity"
                      style={{ color: "var(--text-tertiary)" }}
                      onMouseEnter={e => { (e.target as HTMLElement).style.color = "var(--accent-rose)"; }}
                      onMouseLeave={e => { (e.target as HTMLElement).style.color = "var(--text-tertiary)"; }}
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </motion.div>

        {/* Info */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="mt-8 p-4 rounded-xl"
          style={{ backgroundColor: "var(--bg-surface)", border: "1px solid var(--border-default)" }}
        >
          <div className="text-xs space-y-1" style={{ color: "var(--text-tertiary)" }}>
            <p><strong style={{ color: "var(--text-secondary)" }}>Как это работает:</strong> загруженные документы разбиваются на части и индексируются. Когда вы задаёте вопрос, AI находит релевантные части и использует их как контекст для ответа.</p>
            <p><strong style={{ color: "var(--text-secondary)" }}>Поддерживаемые форматы:</strong> PDF, DOCX, TXT, CSV, MD (до 20 MB)</p>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
