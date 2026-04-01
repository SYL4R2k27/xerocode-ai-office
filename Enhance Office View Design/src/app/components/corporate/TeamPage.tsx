import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  Users, UserPlus, Shield, ChevronDown, Trash2, Search,
  Crown, Briefcase, User, Loader2, AlertCircle, X, Check,
} from "lucide-react";
import { api, type OrgMember } from "../../lib/api";

interface TeamPageProps {
  orgRole: "owner" | "manager" | "member";
  onInvite?: (email: string, role: string) => void;
  onChangeRole?: (userId: string, role: string) => void;
  onRemoveMember?: (userId: string) => void;
}

const roleConfig: Record<string, { label: string; icon: React.ElementType; color: string }> = {
  owner: { label: "Руководитель", icon: Crown, color: "var(--accent-amber)" },
  manager: { label: "Менеджер", icon: Briefcase, color: "var(--accent-blue)" },
  member: { label: "Сотрудник", icon: User, color: "var(--text-tertiary)" },
};

export function TeamPage({ orgRole }: TeamPageProps) {
  const [members, setMembers] = useState<OrgMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [showInvite, setShowInvite] = useState(false);
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole] = useState("member");
  const [inviteLoading, setInviteLoading] = useState(false);
  const [inviteError, setInviteError] = useState<string | null>(null);
  const [roleDropdownId, setRoleDropdownId] = useState<string | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const isOwner = orgRole === "owner";

  const loadMembers = useCallback(async () => {
    try {
      const data = await api.org.getMembers();
      setMembers(data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadMembers(); }, [loadMembers]);

  const handleInvite = useCallback(async () => {
    if (!inviteEmail.trim()) return;
    setInviteLoading(true);
    setInviteError(null);
    try {
      await api.org.invite(inviteEmail.trim(), inviteRole);
      await loadMembers();
      setInviteEmail("");
      setInviteRole("member");
      setShowInvite(false);
    } catch (err: any) {
      setInviteError(err.message);
    } finally {
      setInviteLoading(false);
    }
  }, [inviteEmail, inviteRole, loadMembers]);

  const handleChangeRole = useCallback(async (userId: string, newRole: string) => {
    try {
      await api.org.changeRole(userId, newRole);
      setMembers(prev => prev.map(m => m.id === userId ? { ...m, org_role: newRole as any } : m));
    } catch (err: any) {
      console.error(err);
    }
    setRoleDropdownId(null);
  }, []);

  const handleRemove = useCallback(async (userId: string) => {
    try {
      await api.org.removeMember(userId);
      setMembers(prev => prev.filter(m => m.id !== userId));
    } catch (err: any) {
      console.error(err);
    }
    setConfirmDeleteId(null);
  }, []);

  const filtered = members.filter(m =>
    (m.name || "").toLowerCase().includes(search.toLowerCase()) ||
    m.email.toLowerCase().includes(search.toLowerCase())
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <Loader2 size={24} className="animate-spin" style={{ color: "var(--accent-blue)" }} />
      </div>
    );
  }

  return (
    <div className="h-full overflow-y-auto p-6 md:p-8">
      <div className="max-w-[900px] mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center justify-between mb-8"
        >
          <div>
            <h1 className="text-2xl font-bold" style={{ color: "var(--text-primary)" }}>Команда</h1>
            <p className="text-sm mt-1" style={{ color: "var(--text-tertiary)" }}>{members.length} участников</p>
          </div>
          {isOwner && (
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => setShowInvite(true)}
              className="flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium"
              style={{ backgroundColor: "var(--accent-blue)", color: "#fff" }}
            >
              <UserPlus size={16} />
              Пригласить
            </motion.button>
          )}
        </motion.div>

        {/* Search */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05 }}
          className="relative mb-6"
        >
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: "var(--text-tertiary)" }} />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Поиск по имени или email..."
            className="w-full pl-10 pr-4 py-2.5 rounded-lg text-sm outline-none"
            style={{ backgroundColor: "var(--bg-surface)", border: "1px solid var(--border-default)", color: "var(--text-primary)" }}
          />
        </motion.div>

        {/* Members */}
        <div className="space-y-2">
          {filtered.map((m, i) => {
            const role = roleConfig[m.org_role || "member"];
            const RoleIcon = role.icon;
            return (
              <motion.div
                key={m.id}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.03 }}
                className="group flex items-center gap-4 p-4 rounded-xl"
                style={{ backgroundColor: "var(--bg-surface)", border: "1px solid var(--border-default)" }}
              >
                <div
                  className="w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0"
                  style={{ backgroundColor: "var(--bg-elevated)", color: "var(--text-primary)", border: "1px solid var(--border-default)" }}
                >
                  {(m.name || m.email).charAt(0).toUpperCase()}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium" style={{ color: "var(--text-primary)" }}>{m.name || "—"}</div>
                  <div className="text-xs" style={{ color: "var(--text-tertiary)" }}>{m.email}</div>
                </div>

                {/* Role */}
                <div className="relative">
                  <button
                    onClick={() => isOwner && m.org_role !== "owner" ? setRoleDropdownId(roleDropdownId === m.id ? null : m.id) : null}
                    className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium"
                    style={{
                      color: role.color,
                      backgroundColor: `color-mix(in srgb, ${role.color} 10%, transparent)`,
                      cursor: isOwner && m.org_role !== "owner" ? "pointer" : "default",
                    }}
                  >
                    <RoleIcon size={12} />
                    {role.label}
                    {isOwner && m.org_role !== "owner" && <ChevronDown size={10} />}
                  </button>

                  <AnimatePresence>
                    {roleDropdownId === m.id && (
                      <motion.div
                        initial={{ opacity: 0, y: -4 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -4 }}
                        className="absolute right-0 top-full mt-1 z-10 rounded-lg overflow-hidden"
                        style={{ backgroundColor: "var(--bg-elevated)", border: "1px solid var(--border-default)", boxShadow: "0 8px 24px rgba(0,0,0,0.3)" }}
                      >
                        {["manager", "member"].map(r => (
                          <button
                            key={r}
                            onClick={() => handleChangeRole(m.id, r)}
                            className="w-full px-4 py-2 text-xs text-left flex items-center gap-2"
                            style={{ color: "var(--text-secondary)" }}
                            onMouseEnter={e => { e.currentTarget.style.backgroundColor = "var(--bg-surface)"; }}
                            onMouseLeave={e => { e.currentTarget.style.backgroundColor = "transparent"; }}
                          >
                            {roleConfig[r].label}
                            {m.org_role === r && <Check size={12} style={{ color: "var(--accent-green)" }} />}
                          </button>
                        ))}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>

                <div className="text-xs text-right hidden sm:block" style={{ color: "var(--text-tertiary)" }}>
                  {m.tasks_used_this_month} задач
                </div>

                {isOwner && m.org_role !== "owner" && (
                  <div>
                    {confirmDeleteId === m.id ? (
                      <div className="flex items-center gap-1">
                        <button onClick={() => handleRemove(m.id)} className="p-1.5 rounded-md" style={{ color: "var(--accent-rose)" }}><Check size={14} /></button>
                        <button onClick={() => setConfirmDeleteId(null)} className="p-1.5 rounded-md" style={{ color: "var(--text-tertiary)" }}><X size={14} /></button>
                      </div>
                    ) : (
                      <button
                        onClick={() => setConfirmDeleteId(m.id)}
                        className="p-1.5 rounded-md opacity-0 group-hover:opacity-100 transition-opacity"
                        style={{ color: "var(--text-tertiary)" }}
                        onMouseEnter={e => { e.currentTarget.style.color = "var(--accent-rose)"; }}
                        onMouseLeave={e => { e.currentTarget.style.color = "var(--text-tertiary)"; }}
                      >
                        <Trash2 size={14} />
                      </button>
                    )}
                  </div>
                )}
              </motion.div>
            );
          })}
        </div>

        {/* Invite modal */}
        <AnimatePresence>
          {showInvite && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-50 flex items-center justify-center p-4"
              style={{ backgroundColor: "rgba(0,0,0,0.6)" }}
              onClick={() => setShowInvite(false)}
            >
              <motion.div
                initial={{ scale: 0.95, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.95, opacity: 0 }}
                className="w-full max-w-[400px] rounded-2xl p-6"
                style={{ backgroundColor: "var(--bg-surface)", border: "1px solid var(--border-default)" }}
                onClick={e => e.stopPropagation()}
              >
                <h3 className="text-lg font-semibold mb-4" style={{ color: "var(--text-primary)" }}>Пригласить участника</h3>
                <div className="space-y-4">
                  <div>
                    <label className="text-xs mb-1.5 block" style={{ color: "var(--text-tertiary)" }}>Email</label>
                    <input
                      value={inviteEmail}
                      onChange={e => setInviteEmail(e.target.value)}
                      placeholder="user@example.com"
                      className="w-full px-3 py-2.5 rounded-lg text-sm outline-none"
                      style={{ backgroundColor: "var(--bg-base)", border: "1px solid var(--border-default)", color: "var(--text-primary)" }}
                    />
                  </div>
                  <div>
                    <label className="text-xs mb-1.5 block" style={{ color: "var(--text-tertiary)" }}>Роль</label>
                    <div className="flex gap-2">
                      {["member", "manager"].map(r => (
                        <button
                          key={r}
                          onClick={() => setInviteRole(r)}
                          className="flex-1 py-2 rounded-lg text-xs font-medium"
                          style={{
                            backgroundColor: inviteRole === r ? "var(--accent-blue)" : "var(--bg-base)",
                            color: inviteRole === r ? "#fff" : "var(--text-secondary)",
                            border: `1px solid ${inviteRole === r ? "var(--accent-blue)" : "var(--border-default)"}`,
                          }}
                        >
                          {roleConfig[r].label}
                        </button>
                      ))}
                    </div>
                  </div>
                  {inviteError && (
                    <div className="text-xs flex items-center gap-1" style={{ color: "var(--accent-rose)" }}>
                      <AlertCircle size={12} />{inviteError}
                    </div>
                  )}
                  <div className="flex gap-2 pt-2">
                    <button onClick={() => setShowInvite(false)} className="flex-1 py-2.5 rounded-lg text-sm font-medium" style={{ backgroundColor: "var(--bg-base)", color: "var(--text-secondary)", border: "1px solid var(--border-default)" }}>Отмена</button>
                    <button onClick={handleInvite} disabled={!inviteEmail.trim() || inviteLoading} className="flex-1 py-2.5 rounded-lg text-sm font-medium disabled:opacity-50" style={{ backgroundColor: "var(--accent-blue)", color: "#fff" }}>
                      {inviteLoading ? <Loader2 size={14} className="animate-spin mx-auto" /> : "Пригласить"}
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
