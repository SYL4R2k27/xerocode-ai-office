import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  Users, UserPlus, Shield, ChevronDown, Trash2, Search,
  Crown, Briefcase, User, Loader2, AlertCircle, X, Check,
  BadgeCheck, Building2,
} from "lucide-react";
import { api, type OrgMember, type RoleInfo, type ProfessionalRole } from "../../lib/api";

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

const PROF_ROLE_ICONS: Record<string, string> = {
  director: "👔",
  chief_accountant: "📊",
  accountant: "🧮",
  sales_manager: "💼",
  project_manager: "📋",
  logistics: "🚚",
  hr_manager: "👥",
  legal: "⚖️",
  marketer: "📢",
  operator: "🎧",
};

export function TeamPage({ orgRole }: TeamPageProps) {
  const [members, setMembers] = useState<OrgMember[]>([]);
  const [roles, setRoles] = useState<RoleInfo[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [showInvite, setShowInvite] = useState(false);
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole] = useState("member");
  const [inviteLoading, setInviteLoading] = useState(false);
  const [inviteError, setInviteError] = useState<string | null>(null);
  const [roleDropdownId, setRoleDropdownId] = useState<string | null>(null);
  const [profRoleDropdownId, setProfRoleDropdownId] = useState<string | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [savingRole, setSavingRole] = useState<string | null>(null);
  const isOwner = orgRole === "owner";
  const isManagerOrOwner = orgRole === "owner" || orgRole === "manager";

  const loadData = useCallback(async () => {
    try {
      const [membersData, rolesData] = await Promise.all([
        api.org.getMembers(),
        api.roles.list().catch(() => [] as RoleInfo[]),
      ]);
      setMembers(membersData);
      setRoles(rolesData);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  // Close dropdowns on click outside
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (!target.closest("[data-dropdown]")) {
        setRoleDropdownId(null);
        setProfRoleDropdownId(null);
      }
    };
    document.addEventListener("click", handler);
    return () => document.removeEventListener("click", handler);
  }, []);

  const handleInvite = useCallback(async () => {
    if (!inviteEmail.trim()) return;
    setInviteLoading(true);
    setInviteError(null);
    try {
      await api.org.invite(inviteEmail.trim(), inviteRole);
      await loadData();
      setInviteEmail("");
      setInviteRole("member");
      setShowInvite(false);
    } catch (err: any) {
      setInviteError(err.message);
    } finally {
      setInviteLoading(false);
    }
  }, [inviteEmail, inviteRole, loadData]);

  const handleChangeRole = useCallback(async (userId: string, newRole: string) => {
    try {
      await api.org.changeRole(userId, newRole);
      setMembers(prev => prev.map(m => m.id === userId ? { ...m, org_role: newRole as any } : m));
    } catch (err: any) {
      console.error(err);
    }
    setRoleDropdownId(null);
  }, []);

  const handleChangeProfRole = useCallback(async (userId: string, profRole: ProfessionalRole) => {
    setSavingRole(userId);
    try {
      await api.roles.setProfessionalRole(userId, profRole);
      const roleInfo = roles.find(r => r.id === profRole);
      setMembers(prev => prev.map(m =>
        m.id === userId
          ? { ...m, professional_role: profRole, professional_role_label: roleInfo?.label || profRole }
          : m
      ));
    } catch (err: any) {
      console.error(err);
    } finally {
      setSavingRole(null);
      setProfRoleDropdownId(null);
    }
  }, [roles]);

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
    m.email.toLowerCase().includes(search.toLowerCase()) ||
    (m.professional_role_label || "").toLowerCase().includes(search.toLowerCase())
  );

  // Group by professional role
  const byProfRole = new Map<string, number>();
  members.forEach(m => {
    const key = m.professional_role_label || "Без роли";
    byProfRole.set(key, (byProfRole.get(key) || 0) + 1);
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <Loader2 size={24} className="animate-spin" style={{ color: "var(--accent-blue)" }} />
      </div>
    );
  }

  return (
    <div className="h-full overflow-y-auto p-6 md:p-8">
      <div className="max-w-[1100px] mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center justify-between mb-6"
        >
          <div>
            <h1 className="text-2xl font-bold" style={{ color: "var(--text-primary)" }}>Команда</h1>
            <p className="text-sm mt-1" style={{ color: "var(--text-tertiary)" }}>
              {members.length} участников · {byProfRole.size} {byProfRole.size === 1 ? "роль" : "ролей"}
            </p>
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

        {/* Role stats chips */}
        {byProfRole.size > 1 && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.05 }}
            className="flex flex-wrap gap-2 mb-5"
          >
            {Array.from(byProfRole.entries()).map(([label, count]) => (
              <div
                key={label}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium"
                style={{
                  backgroundColor: "var(--bg-surface)",
                  border: "1px solid var(--border-default)",
                  color: "var(--text-secondary)",
                }}
              >
                <Building2 size={12} style={{ color: "var(--accent-teal)" }} />
                {label}
                <span
                  className="ml-1 px-1.5 py-0.5 rounded-full text-[10px]"
                  style={{ backgroundColor: "var(--bg-elevated)", color: "var(--text-tertiary)" }}
                >
                  {count}
                </span>
              </div>
            ))}
          </motion.div>
        )}

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
            placeholder="Поиск по имени, email или должности..."
            className="w-full pl-10 pr-4 py-2.5 rounded-lg text-sm outline-none"
            style={{ backgroundColor: "var(--bg-surface)", border: "1px solid var(--border-default)", color: "var(--text-primary)" }}
          />
        </motion.div>

        {/* Table header */}
        <div
          className="hidden md:grid items-center gap-4 px-4 py-2 mb-2 text-[11px] font-semibold uppercase tracking-wider"
          style={{
            gridTemplateColumns: "1fr 180px 120px 80px 40px",
            color: "var(--text-tertiary)",
          }}
        >
          <span>Сотрудник</span>
          <span>Должность</span>
          <span>Доступ</span>
          <span className="text-right">Задач</span>
          <span />
        </div>

        {/* Members */}
        <div className="space-y-1.5">
          {filtered.map((m, i) => {
            const role = roleConfig[m.org_role || "member"];
            const RoleIcon = role.icon;
            const profIcon = m.professional_role ? PROF_ROLE_ICONS[m.professional_role] : null;
            return (
              <motion.div
                key={m.id}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.02 }}
                className="group md:grid items-center gap-4 p-4 rounded-xl flex flex-wrap"
                style={{
                  gridTemplateColumns: "1fr 180px 120px 80px 40px",
                  backgroundColor: "var(--bg-surface)",
                  border: "1px solid var(--border-default)",
                }}
              >
                {/* Name + Email */}
                <div className="flex items-center gap-3 min-w-0">
                  <div
                    className="w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0"
                    style={{
                      backgroundColor: "var(--bg-elevated)",
                      color: "var(--text-primary)",
                      border: "1px solid var(--border-default)",
                    }}
                  >
                    {(m.name || m.email).charAt(0).toUpperCase()}
                  </div>
                  <div className="min-w-0">
                    <div className="text-sm font-medium truncate" style={{ color: "var(--text-primary)" }}>
                      {m.name || "—"}
                    </div>
                    <div className="text-xs truncate" style={{ color: "var(--text-tertiary)" }}>{m.email}</div>
                  </div>
                </div>

                {/* Professional Role selector */}
                <div className="relative" data-dropdown>
                  {isManagerOrOwner && m.org_role !== "owner" ? (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setProfRoleDropdownId(profRoleDropdownId === m.id ? null : m.id);
                        setRoleDropdownId(null);
                      }}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium w-full transition-colors"
                      style={{
                        backgroundColor: m.professional_role
                          ? "color-mix(in srgb, var(--accent-teal) 10%, transparent)"
                          : "var(--bg-base)",
                        color: m.professional_role ? "var(--accent-teal)" : "var(--text-tertiary)",
                        border: `1px solid ${m.professional_role ? "color-mix(in srgb, var(--accent-teal) 20%, transparent)" : "var(--border-default)"}`,
                        cursor: "pointer",
                      }}
                    >
                      {savingRole === m.id ? (
                        <Loader2 size={12} className="animate-spin" />
                      ) : profIcon ? (
                        <span className="text-sm">{profIcon}</span>
                      ) : (
                        <BadgeCheck size={12} />
                      )}
                      <span className="truncate">
                        {m.professional_role_label || "Назначить должность"}
                      </span>
                      <ChevronDown size={10} className="ml-auto flex-shrink-0" />
                    </button>
                  ) : (
                    <div
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium"
                      style={{
                        color: m.org_role === "owner" ? "var(--accent-amber)" : "var(--accent-teal)",
                      }}
                    >
                      {m.org_role === "owner" ? (
                        <>
                          <Crown size={12} />
                          <span>Директор</span>
                        </>
                      ) : (
                        <>
                          {profIcon && <span className="text-sm">{profIcon}</span>}
                          <span>{m.professional_role_label || "—"}</span>
                        </>
                      )}
                    </div>
                  )}

                  {/* Professional role dropdown */}
                  <AnimatePresence>
                    {profRoleDropdownId === m.id && roles.length > 0 && (
                      <motion.div
                        initial={{ opacity: 0, y: -4, scale: 0.97 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: -4, scale: 0.97 }}
                        className="absolute left-0 top-full mt-1 z-20 rounded-xl overflow-hidden w-[220px]"
                        style={{
                          backgroundColor: "var(--bg-elevated)",
                          border: "1px solid var(--border-default)",
                          boxShadow: "0 12px 40px rgba(0,0,0,0.35)",
                        }}
                      >
                        <div
                          className="px-3 py-2 text-[10px] font-semibold uppercase tracking-wider"
                          style={{ color: "var(--text-tertiary)", borderBottom: "1px solid var(--border-default)" }}
                        >
                          Выберите должность
                        </div>
                        <div className="max-h-[280px] overflow-y-auto py-1">
                          {roles.map(r => (
                            <button
                              key={r.id}
                              onClick={(e) => {
                                e.stopPropagation();
                                handleChangeProfRole(m.id, r.id);
                              }}
                              className="w-full px-3 py-2 text-xs text-left flex items-center gap-2 transition-colors"
                              style={{ color: "var(--text-secondary)" }}
                              onMouseEnter={e => { e.currentTarget.style.backgroundColor = "var(--bg-surface)"; }}
                              onMouseLeave={e => { e.currentTarget.style.backgroundColor = "transparent"; }}
                            >
                              <span className="text-sm w-5 text-center">{PROF_ROLE_ICONS[r.id] || "👤"}</span>
                              <div className="flex-1 min-w-0">
                                <div className="font-medium" style={{ color: "var(--text-primary)" }}>{r.label}</div>
                                <div className="text-[10px] mt-0.5" style={{ color: "var(--text-tertiary)" }}>
                                  {r.modules.length} модулей · {r.permissions_count} прав
                                </div>
                              </div>
                              {m.professional_role === r.id && (
                                <Check size={12} style={{ color: "var(--accent-green)" }} />
                              )}
                            </button>
                          ))}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>

                {/* Org Role */}
                <div className="relative" data-dropdown>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      if (isOwner && m.org_role !== "owner") {
                        setRoleDropdownId(roleDropdownId === m.id ? null : m.id);
                        setProfRoleDropdownId(null);
                      }
                    }}
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
                        className="absolute right-0 top-full mt-1 z-20 rounded-lg overflow-hidden"
                        style={{
                          backgroundColor: "var(--bg-elevated)",
                          border: "1px solid var(--border-default)",
                          boxShadow: "0 8px 24px rgba(0,0,0,0.3)",
                        }}
                      >
                        {["manager", "member"].map(r => (
                          <button
                            key={r}
                            onClick={(e) => {
                              e.stopPropagation();
                              handleChangeRole(m.id, r);
                            }}
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

                {/* Tasks count */}
                <div className="text-xs text-right" style={{ color: "var(--text-tertiary)" }}>
                  {m.tasks_used_this_month}
                </div>

                {/* Delete */}
                {isOwner && m.org_role !== "owner" ? (
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
                ) : (
                  <div />
                )}
              </motion.div>
            );
          })}
        </div>

        {filtered.length === 0 && !loading && (
          <div className="text-center py-12" style={{ color: "var(--text-tertiary)" }}>
            <Users size={32} className="mx-auto mb-3 opacity-40" />
            <p className="text-sm">Никого не найдено</p>
          </div>
        )}

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
                className="w-full max-w-[420px] rounded-2xl p-6"
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
                    <label className="text-xs mb-1.5 block" style={{ color: "var(--text-tertiary)" }}>Уровень доступа</label>
                    <div className="flex gap-2">
                      {["member", "manager"].map(r => (
                        <button
                          key={r}
                          onClick={() => setInviteRole(r)}
                          className="flex-1 py-2 rounded-lg text-xs font-medium transition-colors"
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
