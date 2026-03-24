import { useState, useCallback } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  UserPlus,
  Crown,
  ClipboardList,
  User,
  Trash2,
  ChevronDown,
  X,
  Mail,
  Search,
  Shield,
} from "lucide-react";

// ====== Types ======

interface OrgMember {
  id: string;
  name: string;
  email: string;
  role: "owner" | "manager" | "member";
  avatar?: string;
  tasks_count: number;
  joined_at: string;
}

// ====== Constants ======

const roleConfig: Record<string, { label: string; icon: React.ElementType; color: string; bgColor: string }> = {
  owner: {
    label: "Руководитель",
    icon: Crown,
    color: "var(--accent-amber)",
    bgColor: "color-mix(in srgb, var(--accent-amber) 15%, transparent)",
  },
  manager: {
    label: "Менеджер",
    icon: ClipboardList,
    color: "var(--accent-blue)",
    bgColor: "color-mix(in srgb, var(--accent-blue) 15%, transparent)",
  },
  member: {
    label: "Сотрудник",
    icon: User,
    color: "var(--text-tertiary)",
    bgColor: "var(--bg-elevated)",
  },
};

// ====== Mock Data ======

const initialMembers: OrgMember[] = [
  { id: "1", name: "Иван Петров", email: "ivan@company.ru", role: "owner", tasks_count: 5, joined_at: "2025-01-15" },
  { id: "2", name: "Алексей Козлов", email: "alexey@company.ru", role: "manager", tasks_count: 8, joined_at: "2025-03-10" },
  { id: "3", name: "Мария Попова", email: "maria@company.ru", role: "member", tasks_count: 12, joined_at: "2025-04-22" },
  { id: "4", name: "Дмитрий Смирнов", email: "dmitry@company.ru", role: "member", tasks_count: 6, joined_at: "2025-05-18" },
  { id: "5", name: "Елена Волкова", email: "elena@company.ru", role: "member", tasks_count: 3, joined_at: "2025-06-01" },
  { id: "6", name: "Сергей Новиков", email: "sergey@company.ru", role: "member", tasks_count: 7, joined_at: "2025-07-12" },
];

// ====== Component ======

interface TeamPageProps {
  orgRole: "owner" | "manager" | "member";
  onInvite?: (email: string, role: string) => void;
  onChangeRole?: (memberId: string, newRole: string) => void;
  onRemoveMember?: (memberId: string) => void;
}

export function TeamPage({ orgRole, onInvite, onChangeRole, onRemoveMember }: TeamPageProps) {
  const isOwner = orgRole === "owner";
  const isManagerOrOwner = orgRole === "owner" || orgRole === "manager";

  const [members, setMembers] = useState<OrgMember[]>(initialMembers);
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole] = useState<"manager" | "member">("member");
  const [searchQuery, setSearchQuery] = useState("");
  const [roleDropdownId, setRoleDropdownId] = useState<string | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  const filteredMembers = members.filter((m) => {
    const q = searchQuery.toLowerCase();
    return m.name.toLowerCase().includes(q) || m.email.toLowerCase().includes(q);
  });

  const handleInvite = useCallback(() => {
    if (!inviteEmail.trim()) return;
    onInvite?.(inviteEmail, inviteRole);
    // Optimistic add
    const newMember: OrgMember = {
      id: Date.now().toString(),
      name: inviteEmail.split("@")[0],
      email: inviteEmail,
      role: inviteRole,
      tasks_count: 0,
      joined_at: new Date().toISOString(),
    };
    setMembers((prev) => [...prev, newMember]);
    setInviteEmail("");
    setInviteRole("member");
    setShowInviteModal(false);
  }, [inviteEmail, inviteRole, onInvite]);

  const handleChangeRole = useCallback((memberId: string, newRole: "owner" | "manager" | "member") => {
    setMembers((prev) =>
      prev.map((m) => (m.id === memberId ? { ...m, role: newRole } : m))
    );
    onChangeRole?.(memberId, newRole);
    setRoleDropdownId(null);
  }, [onChangeRole]);

  const handleDelete = useCallback((memberId: string) => {
    setMembers((prev) => prev.filter((m) => m.id !== memberId));
    onRemoveMember?.(memberId);
    setConfirmDeleteId(null);
  }, [onRemoveMember]);

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    const months = ["янв", "фев", "мар", "апр", "мая", "июн", "июл", "авг", "сен", "окт", "ноя", "дек"];
    return `${date.getDate()} ${months[date.getMonth()]} ${date.getFullYear()}`;
  };

  return (
    <div
      className="h-full overflow-y-auto"
      style={{ backgroundColor: "var(--bg-base)" }}
    >
      <div className="max-w-[900px] mx-auto p-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1
              className="text-[22px] font-semibold"
              style={{ color: "var(--text-primary)" }}
            >
              Команда
            </h1>
            <p className="text-[13px] mt-1" style={{ color: "var(--text-secondary)" }}>
              {members.length} участников в организации
            </p>
          </div>

          {isManagerOrOwner && (
            <button
              onClick={() => setShowInviteModal(true)}
              className="flex items-center gap-2 px-4 py-2 rounded-lg text-[13px] font-medium transition-all"
              style={{
                backgroundColor: "var(--accent-blue)",
                color: "#fff",
              }}
              onMouseEnter={(e) => (e.currentTarget.style.opacity = "0.9")}
              onMouseLeave={(e) => (e.currentTarget.style.opacity = "1")}
            >
              <UserPlus size={15} />
              Пригласить
            </button>
          )}
        </div>

        {/* Search */}
        <div className="relative mb-4">
          <Search
            size={15}
            className="absolute left-3 top-1/2 -translate-y-1/2"
            style={{ color: "var(--text-tertiary)" }}
          />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Поиск по имени или email..."
            className="w-full text-[13px] pl-9 pr-4 py-2.5 rounded-xl"
            style={{
              backgroundColor: "var(--bg-surface)",
              color: "var(--text-primary)",
              border: "1px solid var(--border-default)",
              outline: "none",
            }}
            onFocus={(e) => (e.currentTarget.style.borderColor = "var(--border-focus)")}
            onBlur={(e) => (e.currentTarget.style.borderColor = "var(--border-default)")}
          />
        </div>

        {/* Members List */}
        <div
          className="rounded-xl overflow-hidden"
          style={{
            backgroundColor: "var(--bg-surface)",
            border: "1px solid var(--border-default)",
          }}
        >
          {/* Table Header */}
          <div
            className="grid items-center px-5 py-3 text-[11px] font-semibold tracking-wider"
            style={{
              gridTemplateColumns: "1fr 1fr 120px 80px 100px",
              color: "var(--text-tertiary)",
              borderBottom: "1px solid var(--border-default)",
              backgroundColor: "var(--bg-elevated)",
            }}
          >
            <span>УЧАСТНИК</span>
            <span>EMAIL</span>
            <span>РОЛЬ</span>
            <span>ЗАДАЧ</span>
            <span></span>
          </div>

          {/* Members */}
          <AnimatePresence>
            {filteredMembers.map((member, i) => {
              const role = roleConfig[member.role];
              const RoleIcon = role.icon;
              const isCurrentOwner = member.role === "owner";

              return (
                <motion.div
                  key={member.id}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0, height: 0 }}
                  transition={{ duration: 0.2 }}
                  className="grid items-center px-5 py-3.5 transition-colors relative"
                  style={{
                    gridTemplateColumns: "1fr 1fr 120px 80px 100px",
                    borderBottom:
                      i < filteredMembers.length - 1
                        ? "1px solid var(--border-subtle)"
                        : "none",
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = "var(--bg-elevated)";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = "transparent";
                  }}
                >
                  {/* Name + Avatar */}
                  <div className="flex items-center gap-3">
                    <div
                      className="w-8 h-8 rounded-full flex items-center justify-center text-[12px] font-bold flex-shrink-0"
                      style={{
                        backgroundColor: `hsl(${(member.name.charCodeAt(0) * 37) % 360}, 35%, 35%)`,
                        color: "#fff",
                      }}
                    >
                      {member.name.charAt(0)}
                    </div>
                    <div>
                      <div
                        className="text-[13px] font-medium"
                        style={{ color: "var(--text-primary)" }}
                      >
                        {member.name}
                      </div>
                      <div
                        className="text-[11px]"
                        style={{ color: "var(--text-tertiary)" }}
                      >
                        с {formatDate(member.joined_at)}
                      </div>
                    </div>
                  </div>

                  {/* Email */}
                  <span
                    className="text-[12px]"
                    style={{ color: "var(--text-secondary)" }}
                  >
                    {member.email}
                  </span>

                  {/* Role Badge */}
                  <div className="relative">
                    <button
                      onClick={() => {
                        if (isManagerOrOwner && !isCurrentOwner) {
                          setRoleDropdownId(
                            roleDropdownId === member.id ? null : member.id
                          );
                        }
                      }}
                      className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-medium transition-colors"
                      style={{
                        backgroundColor: role.bgColor,
                        color: role.color,
                        cursor: isManagerOrOwner && !isCurrentOwner ? "pointer" : "default",
                      }}
                    >
                      <RoleIcon size={12} />
                      {role.label}
                      {isManagerOrOwner && !isCurrentOwner && (
                        <ChevronDown size={10} />
                      )}
                    </button>

                    {/* Role Dropdown */}
                    <AnimatePresence>
                      {roleDropdownId === member.id && (
                        <motion.div
                          initial={{ opacity: 0, y: -4 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -4 }}
                          className="absolute left-0 top-full mt-1 rounded-lg p-1 z-20 min-w-[140px]"
                          style={{
                            backgroundColor: "var(--bg-elevated)",
                            border: "1px solid var(--border-default)",
                            boxShadow: "0 4px 16px rgba(0,0,0,0.3)",
                          }}
                        >
                          {(["manager", "member"] as const).map((r) => {
                            const rc = roleConfig[r];
                            const Icon = rc.icon;
                            return (
                              <button
                                key={r}
                                onClick={() => handleChangeRole(member.id, r)}
                                className="flex items-center gap-2 w-full text-left text-[11px] px-3 py-1.5 rounded-md transition-colors"
                                style={{
                                  color: member.role === r ? rc.color : "var(--text-secondary)",
                                  backgroundColor: member.role === r ? rc.bgColor : "transparent",
                                }}
                                onMouseEnter={(e) => {
                                  if (member.role !== r) {
                                    e.currentTarget.style.backgroundColor = "var(--bg-surface)";
                                  }
                                }}
                                onMouseLeave={(e) => {
                                  if (member.role !== r) {
                                    e.currentTarget.style.backgroundColor = "transparent";
                                  }
                                }}
                              >
                                <Icon size={12} />
                                {rc.label}
                              </button>
                            );
                          })}
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>

                  {/* Tasks Count */}
                  <span
                    className="text-[12px]"
                    style={{ color: "var(--text-secondary)" }}
                  >
                    {member.tasks_count}
                  </span>

                  {/* Actions */}
                  <div className="flex items-center justify-end gap-1">
                    {isOwner && !isCurrentOwner && (
                      <>
                        {confirmDeleteId === member.id ? (
                          <div className="flex items-center gap-1">
                            <button
                              onClick={() => handleDelete(member.id)}
                              className="text-[10px] px-2 py-1 rounded-md font-medium"
                              style={{
                                backgroundColor: "color-mix(in srgb, var(--accent-rose) 20%, transparent)",
                                color: "var(--accent-rose)",
                              }}
                            >
                              Удалить
                            </button>
                            <button
                              onClick={() => setConfirmDeleteId(null)}
                              className="text-[10px] px-2 py-1 rounded-md"
                              style={{ color: "var(--text-tertiary)" }}
                            >
                              Отмена
                            </button>
                          </div>
                        ) : (
                          <button
                            onClick={() => setConfirmDeleteId(member.id)}
                            className="w-7 h-7 flex items-center justify-center rounded-md transition-colors opacity-0 group-hover:opacity-100"
                            style={{
                              color: "var(--text-tertiary)",
                              opacity: 1,
                            }}
                            onMouseEnter={(e) => {
                              e.currentTarget.style.color = "var(--accent-rose)";
                              e.currentTarget.style.backgroundColor = "color-mix(in srgb, var(--accent-rose) 10%, transparent)";
                            }}
                            onMouseLeave={(e) => {
                              e.currentTarget.style.color = "var(--text-tertiary)";
                              e.currentTarget.style.backgroundColor = "transparent";
                            }}
                            title="Удалить"
                          >
                            <Trash2 size={14} />
                          </button>
                        )}
                      </>
                    )}
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>

          {filteredMembers.length === 0 && (
            <div
              className="flex items-center justify-center py-12 text-[13px]"
              style={{ color: "var(--text-tertiary)" }}
            >
              Участники не найдены
            </div>
          )}
        </div>
      </div>

      {/* Invite Modal */}
      <AnimatePresence>
        {showInviteModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center"
            style={{ backgroundColor: "var(--bg-overlay)" }}
            onClick={() => setShowInviteModal(false)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              transition={{ duration: 0.2 }}
              className="w-[420px] rounded-xl p-6"
              style={{
                backgroundColor: "var(--bg-surface)",
                border: "1px solid var(--border-default)",
                boxShadow: "0 16px 48px rgba(0,0,0,0.4)",
              }}
              onClick={(e) => e.stopPropagation()}
            >
              {/* Modal Header */}
              <div className="flex items-center justify-between mb-5">
                <div className="flex items-center gap-2">
                  <div
                    className="w-8 h-8 rounded-lg flex items-center justify-center"
                    style={{
                      backgroundColor: "color-mix(in srgb, var(--accent-blue) 15%, transparent)",
                      color: "var(--accent-blue)",
                    }}
                  >
                    <UserPlus size={16} />
                  </div>
                  <h3
                    className="text-[15px] font-semibold"
                    style={{ color: "var(--text-primary)" }}
                  >
                    Пригласить участника
                  </h3>
                </div>
                <button
                  onClick={() => setShowInviteModal(false)}
                  className="w-7 h-7 flex items-center justify-center rounded-md transition-colors"
                  style={{ color: "var(--text-tertiary)" }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = "var(--bg-elevated)";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = "transparent";
                  }}
                >
                  <X size={16} />
                </button>
              </div>

              {/* Email Input */}
              <div className="mb-4">
                <label
                  className="block text-[12px] font-medium mb-1.5"
                  style={{ color: "var(--text-secondary)" }}
                >
                  Email адрес
                </label>
                <div className="relative">
                  <Mail
                    size={15}
                    className="absolute left-3 top-1/2 -translate-y-1/2"
                    style={{ color: "var(--text-tertiary)" }}
                  />
                  <input
                    type="email"
                    value={inviteEmail}
                    onChange={(e) => setInviteEmail(e.target.value)}
                    placeholder="name@company.ru"
                    className="w-full text-[13px] pl-9 pr-4 py-2.5 rounded-lg"
                    style={{
                      backgroundColor: "var(--bg-input)",
                      color: "var(--text-primary)",
                      border: "1px solid var(--border-default)",
                      outline: "none",
                    }}
                    onFocus={(e) => (e.currentTarget.style.borderColor = "var(--border-focus)")}
                    onBlur={(e) => (e.currentTarget.style.borderColor = "var(--border-default)")}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") handleInvite();
                    }}
                    autoFocus
                  />
                </div>
              </div>

              {/* Role Select */}
              <div className="mb-6">
                <label
                  className="block text-[12px] font-medium mb-1.5"
                  style={{ color: "var(--text-secondary)" }}
                >
                  Роль
                </label>
                <div className="flex gap-2">
                  {(["member", "manager"] as const).map((r) => {
                    const rc = roleConfig[r];
                    const Icon = rc.icon;
                    const isSelected = inviteRole === r;
                    return (
                      <button
                        key={r}
                        onClick={() => setInviteRole(r)}
                        className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-[12px] font-medium transition-all"
                        style={{
                          backgroundColor: isSelected ? rc.bgColor : "var(--bg-elevated)",
                          color: isSelected ? rc.color : "var(--text-tertiary)",
                          border: `1px solid ${isSelected ? rc.color : "var(--border-default)"}`,
                        }}
                      >
                        <Icon size={14} />
                        {rc.label}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Actions */}
              <div className="flex gap-3">
                <button
                  onClick={() => setShowInviteModal(false)}
                  className="flex-1 py-2.5 rounded-lg text-[13px] font-medium transition-colors"
                  style={{
                    backgroundColor: "var(--bg-elevated)",
                    color: "var(--text-secondary)",
                    border: "1px solid var(--border-default)",
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = "var(--bg-input)";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = "var(--bg-elevated)";
                  }}
                >
                  Отмена
                </button>
                <button
                  onClick={handleInvite}
                  className="flex-1 py-2.5 rounded-lg text-[13px] font-medium transition-all"
                  style={{
                    backgroundColor: inviteEmail.trim()
                      ? "var(--accent-blue)"
                      : "var(--bg-elevated)",
                    color: inviteEmail.trim() ? "#fff" : "var(--text-tertiary)",
                    cursor: inviteEmail.trim() ? "pointer" : "not-allowed",
                  }}
                >
                  Пригласить
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
