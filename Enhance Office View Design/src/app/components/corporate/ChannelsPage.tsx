import { useState, useCallback, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  Hash, Plus, Send, Loader2, X, Users, MessageSquare, Search,
} from "lucide-react";

const API_BASE = window.location.hostname === "localhost" ? "http://localhost:8000/api" : `${window.location.origin}/api`;
const authHeaders = () => ({
  Authorization: `Bearer ${localStorage.getItem("token")}`,
  "Content-Type": "application/json",
});

// ---- Types ----
interface Channel {
  id: string;
  name: string;
  type: "department" | "project" | "general";
  member_count: number;
  last_message?: string;
}

interface ChannelMessage {
  id: string;
  channel_id: string;
  user_name: string;
  content: string;
  created_at: string;
}

const CHANNEL_TYPES: { id: Channel["type"]; label: string }[] = [
  { id: "general", label: "Общий" },
  { id: "department", label: "Отдел" },
  { id: "project", label: "Проект" },
];

function initials(name: string) {
  return name.split(" ").map(w => w[0]).join("").toUpperCase().slice(0, 2);
}
function timeStr(iso: string) {
  return new Date(iso).toLocaleTimeString("ru-RU", { hour: "2-digit", minute: "2-digit" });
}

export function ChannelsPage() {
  const [channels, setChannels] = useState<Channel[]>([]);
  const [messages, setMessages] = useState<ChannelMessage[]>([]);
  const [activeId, setActiveId] = useState("");
  const [input, setInput] = useState("");
  const [search, setSearch] = useState("");
  const [showCreate, setShowCreate] = useState(false);
  const [loading, setLoading] = useState(false);
  const [fName, setFName] = useState("");
  const [fType, setFType] = useState<Channel["type"]>("general");
  const bottomRef = useRef<HTMLDivElement>(null);

  const fetchChannels = useCallback(async () => {
    setLoading(true);
    try {
      const resp = await fetch(`${API_BASE}/channels/`, { headers: authHeaders() });
      if (resp.ok) {
        const data = await resp.json();
        setChannels(data || []);
        if (data.length > 0 && !activeId) {
          setActiveId(data[0].id);
        }
      }
    } catch (err) {
      console.error("Failed to fetch channels", err);
    } finally {
      setLoading(false);
    }
  }, [activeId]);

  const fetchMessages = useCallback(async (channelId: string) => {
    if (!channelId) return;
    try {
      const resp = await fetch(`${API_BASE}/channels/${channelId}/messages`, { headers: authHeaders() });
      if (resp.ok) {
        const data = await resp.json();
        setMessages(data || []);
      }
    } catch (err) {
      console.error("Failed to fetch messages", err);
    }
  }, []);

  useEffect(() => { fetchChannels(); }, [fetchChannels]);
  useEffect(() => { if (activeId) fetchMessages(activeId); }, [activeId, fetchMessages]);
  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: "smooth" }); }, [activeId, messages]);

  const handleSend = useCallback(async () => {
    if (!input.trim() || !activeId) return;
    try {
      const resp = await fetch(`${API_BASE}/channels/${activeId}/messages`, {
        method: "POST",
        headers: authHeaders(),
        body: JSON.stringify({ content: input.trim() }),
      });
      if (resp.ok) {
        await fetchMessages(activeId);
      }
    } catch (err) {
      console.error("Failed to send message", err);
    }
    setInput("");
  }, [input, activeId, fetchMessages]);

  const handleCreateChannel = useCallback(async () => {
    if (!fName.trim()) return;
    try {
      const resp = await fetch(`${API_BASE}/channels/`, {
        method: "POST",
        headers: authHeaders(),
        body: JSON.stringify({ name: fName.trim(), type: fType }),
      });
      if (resp.ok) {
        const created = await resp.json();
        await fetchChannels();
        setActiveId(created.id);
      }
    } catch (err) {
      console.error("Failed to create channel", err);
    }
    setFName(""); setFType("general"); setShowCreate(false);
  }, [fName, fType, fetchChannels]);

  const filteredChannels = channels.filter(c => !search || c.name.toLowerCase().includes(search.toLowerCase()));
  const active = channels.find(c => c.id === activeId);

  if (loading) return <div className="flex items-center justify-center h-full"><Loader2 size={24} className="animate-spin" style={{ color: "var(--accent-blue)" }} /></div>;

  return (
    <div className="h-full flex overflow-hidden">
      {/* Sidebar */}
      <motion.div initial={{ opacity: 0, x: -12 }} animate={{ opacity: 1, x: 0 }} className="w-64 shrink-0 flex flex-col" style={{ background: "var(--bg-surface)", borderRight: "1px solid var(--border-default)" }}>
        <div className="p-3 flex items-center justify-between" style={{ borderBottom: "1px solid var(--border-default)" }}>
          <span className="text-sm font-semibold" style={{ color: "var(--text-primary)" }}>Каналы</span>
          <button onClick={() => setShowCreate(true)} className="p-1 rounded-md hover:opacity-70" style={{ color: "var(--accent-blue)" }}><Plus size={16} /></button>
        </div>
        <div className="p-2">
          <div className="relative">
            <Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2" style={{ color: "var(--text-tertiary)" }} />
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Поиск..." className="w-full pl-8 pr-3 py-1.5 rounded-lg text-xs outline-none" style={{ background: "var(--bg-elevated)", color: "var(--text-primary)", border: "1px solid var(--border-default)" }} />
          </div>
        </div>
        <div className="flex-1 overflow-y-auto px-2 pb-2 space-y-0.5">
          {filteredChannels.map(ch => (
            <button key={ch.id} onClick={() => setActiveId(ch.id)} className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-left transition-colors" style={{ background: ch.id === activeId ? "var(--bg-elevated)" : "transparent" }}>
              <Hash size={14} style={{ color: ch.id === activeId ? "var(--accent-blue)" : "var(--text-tertiary)" }} />
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium truncate" style={{ color: "var(--text-primary)" }}>{ch.name}</p>
                <p className="text-[10px]" style={{ color: "var(--text-tertiary)" }}>{ch.member_count} участн.</p>
              </div>
            </button>
          ))}
        </div>
      </motion.div>

      {/* Main area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Header */}
        <div className="px-5 py-3 flex items-center gap-3" style={{ borderBottom: "1px solid var(--border-default)" }}>
          <Hash size={16} style={{ color: "var(--accent-blue)" }} />
          <span className="text-sm font-semibold" style={{ color: "var(--text-primary)" }}>{active?.name || "—"}</span>
          <span className="text-xs ml-auto flex items-center gap-1" style={{ color: "var(--text-tertiary)" }}>
            <Users size={12} /> {active?.member_count || 0}
          </span>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-5 space-y-3">
          {messages.length === 0 && (
            <div className="flex flex-col items-center justify-center h-full gap-2" style={{ color: "var(--text-tertiary)" }}>
              <MessageSquare size={32} />
              <p className="text-sm">Нет сообщений</p>
            </div>
          )}
          {messages.map(m => (
            <motion.div key={m.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="flex gap-3">
              <div className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold text-white shrink-0" style={{ background: "var(--accent-blue)" }}>{initials(m.user_name)}</div>
              <div className="min-w-0">
                <div className="flex items-baseline gap-2">
                  <span className="text-sm font-medium" style={{ color: "var(--text-primary)" }}>{m.user_name}</span>
                  <span className="text-[10px]" style={{ color: "var(--text-tertiary)" }}>{timeStr(m.created_at)}</span>
                </div>
                <p className="text-sm mt-0.5" style={{ color: "var(--text-secondary)" }}>{m.content}</p>
              </div>
            </motion.div>
          ))}
          <div ref={bottomRef} />
        </div>

        {/* Input */}
        <div className="p-4" style={{ borderTop: "1px solid var(--border-default)" }}>
          <div className="flex gap-2">
            <input value={input} onChange={e => setInput(e.target.value)} onKeyDown={e => e.key === "Enter" && handleSend()} placeholder="Написать сообщение..." className="flex-1 px-4 py-2.5 rounded-lg text-sm outline-none" style={{ background: "var(--bg-elevated)", color: "var(--text-primary)", border: "1px solid var(--border-default)" }} />
            <button onClick={handleSend} className="px-4 py-2.5 rounded-lg text-white" style={{ background: "var(--accent-blue)" }}><Send size={16} /></button>
          </div>
        </div>
      </div>

      {/* Create channel modal */}
      <AnimatePresence>
        {showCreate && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: "rgba(0,0,0,.45)" }} onClick={() => setShowCreate(false)}>
            <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }} className="w-full max-w-sm rounded-xl p-6" style={{ background: "var(--bg-surface)", border: "1px solid var(--border-default)" }} onClick={e => e.stopPropagation()}>
              <div className="flex items-center justify-between mb-5">
                <h2 className="text-lg font-semibold" style={{ color: "var(--text-primary)" }}>Новый канал</h2>
                <button onClick={() => setShowCreate(false)}><X size={18} style={{ color: "var(--text-tertiary)" }} /></button>
              </div>
              <div className="space-y-3">
                <input value={fName} onChange={e => setFName(e.target.value)} placeholder="Название канала" className="w-full px-3 py-2 rounded-lg text-sm outline-none" style={{ background: "var(--bg-elevated)", color: "var(--text-primary)", border: "1px solid var(--border-default)" }} />
                <div className="flex gap-2">
                  {CHANNEL_TYPES.map(t => (
                    <button key={t.id} onClick={() => setFType(t.id)} className="px-3 py-1.5 rounded-lg text-xs font-medium" style={{ background: fType === t.id ? "var(--accent-blue)" : "var(--bg-elevated)", color: fType === t.id ? "#fff" : "var(--text-secondary)", border: `1px solid ${fType === t.id ? "var(--accent-blue)" : "var(--border-default)"}` }}>
                      {t.label}
                    </button>
                  ))}
                </div>
                <button onClick={handleCreateChannel} className="w-full py-2.5 rounded-lg text-sm font-medium text-white" style={{ background: "var(--accent-blue)" }}>Создать</button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
