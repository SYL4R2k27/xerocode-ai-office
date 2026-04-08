import { useState, useEffect, useCallback } from "react";
import { motion } from "motion/react";
import {
  Settings, Building2, Users, Shield, Bell, Palette,
  Save, Loader2, AlertCircle, Check, Globe, Key, Mail,
  CreditCard, ChevronRight, LogOut, Trash2, Crown,
} from "lucide-react";
import { api, type Org, type OrgMember } from "../../lib/api";
import { RolesManager } from "./RolesManager";

interface SettingsPageProps {
  orgRole: "owner" | "manager" | "member";
  orgName: string;
  userName: string;
  userEmail?: string;
  onLogout: () => void;
}

export function SettingsPage({ orgRole, orgName, userName, userEmail, onLogout }: SettingsPageProps) {
  const [org, setOrg] = useState<Org | null>(null);
  const [members, setMembers] = useState<OrgMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [profileName, setProfileName] = useState(userName);
  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [oldPassword, setOldPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [passwordMsg, setPasswordMsg] = useState<{ type: "ok" | "err"; text: string } | null>(null);
  const isOwner = orgRole === "owner";

  useEffect(() => {
    async function load() {
      try {
        const [orgData, membersData] = await Promise.all([
          api.org.getMyOrg(),
          isOwner ? api.org.getMembers() : Promise.resolve([]),
        ]);
        setOrg(orgData);
        setMembers(membersData);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [isOwner]);

  const handleSaveProfile = useCallback(async () => {
    if (!profileName.trim()) return;
    setSaving(true);
    try {
      await api.auth.updateProfile(profileName.trim());
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 2000);
    } catch (err) {
      console.error(err);
    } finally {
      setSaving(false);
    }
  }, [profileName]);

  const handleChangePassword = useCallback(async () => {
    if (!oldPassword || !newPassword) return;
    setPasswordMsg(null);
    try {
      await api.auth.changePassword(oldPassword, newPassword);
      setPasswordMsg({ type: "ok", text: "Пароль изменён" });
      setOldPassword("");
      setNewPassword("");
    } catch (err: any) {
      setPasswordMsg({ type: "err", text: err.message });
    }
  }, [oldPassword, newPassword]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <Loader2 size={24} className="animate-spin" style={{ color: "var(--accent-blue)" }} />
      </div>
    );
  }

  const roleLabels: Record<string, string> = {
    owner: "Руководитель", manager: "Менеджер", member: "Сотрудник",
  };

  return (
    <div className="h-full overflow-y-auto p-6 md:p-8">
      <div className="max-w-[700px] mx-auto">
        {/* Header */}
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
          <h1 className="text-2xl font-bold" style={{ color: "var(--text-primary)" }}>Настройки</h1>
          <p className="text-sm mt-1" style={{ color: "var(--text-tertiary)" }}>Профиль, организация, безопасность</p>
        </motion.div>

        <div className="space-y-6">
          {/* ── Profile ── */}
          <SettingsSection icon={Users} title="Профиль" delay={0.05}>
            <div className="space-y-4">
              <div className="flex items-center gap-4">
                <div
                  className="w-14 h-14 rounded-full flex items-center justify-center text-xl font-bold flex-shrink-0"
                  style={{ backgroundColor: "var(--bg-elevated)", color: "var(--text-primary)", border: "1px solid var(--border-default)" }}
                >
                  {(profileName || "U").charAt(0).toUpperCase()}
                </div>
                <div>
                  <div className="text-sm font-semibold" style={{ color: "var(--text-primary)" }}>{profileName}</div>
                  <div className="text-xs" style={{ color: "var(--text-tertiary)" }}>{userEmail}</div>
                  <div className="text-xs mt-0.5 flex items-center gap-1" style={{ color: "var(--accent-amber)" }}>
                    <Crown size={10} /> {roleLabels[orgRole]}
                  </div>
                </div>
              </div>

              <div>
                <label className="text-xs block mb-1.5" style={{ color: "var(--text-tertiary)" }}>Имя</label>
                <div className="flex gap-2">
                  <input
                    value={profileName}
                    onChange={(e) => setProfileName(e.target.value)}
                    className="flex-1 px-3 py-2 rounded-lg text-sm outline-none"
                    style={{ backgroundColor: "var(--bg-base)", border: "1px solid var(--border-default)", color: "var(--text-primary)" }}
                  />
                  <button
                    onClick={handleSaveProfile}
                    disabled={saving || !profileName.trim() || profileName === userName}
                    className="px-4 py-2 rounded-lg text-xs font-medium disabled:opacity-40 flex items-center gap-1.5"
                    style={{ backgroundColor: "var(--accent-blue)", color: "#fff" }}
                  >
                    {saving ? <Loader2 size={12} className="animate-spin" /> : saveSuccess ? <Check size={12} /> : <Save size={12} />}
                    {saveSuccess ? "Сохранено" : "Сохранить"}
                  </button>
                </div>
              </div>
            </div>
          </SettingsSection>

          {/* ── Organization ── */}
          {org && (
            <SettingsSection icon={Building2} title="Организация" delay={0.1}>
              <div className="space-y-3">
                <InfoRow label="Название" value={org.name} />
                <InfoRow label="Тариф" value={org.plan || "corporate"} />
                <InfoRow label="Участников" value={`${org.member_count} / ${(org as any).max_members || "∞"}`} />
                <InfoRow label="Создана" value={new Date(org.created_at).toLocaleDateString("ru")} />

                {isOwner && members.length > 0 && (
                  <div className="mt-3 pt-3" style={{ borderTop: "1px solid var(--border-subtle)" }}>
                    <div className="text-xs mb-2" style={{ color: "var(--text-tertiary)" }}>Участники</div>
                    <div className="space-y-1.5">
                      {members.map(m => (
                        <div key={m.id} className="flex items-center justify-between text-xs">
                          <span style={{ color: "var(--text-secondary)" }}>{m.name || m.email}</span>
                          <span style={{ color: "var(--text-tertiary)" }}>{roleLabels[m.org_role || "member"]}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </SettingsSection>
          )}

          {/* ── Roles & Permissions ── */}
          {isOwner && (
            <SettingsSection icon={Shield} title="Роли и права" delay={0.13}>
              <RolesManager isOwner={isOwner} />
            </SettingsSection>
          )}

          {/* ── Security ── */}
          <SettingsSection icon={Shield} title="Безопасность" delay={0.15}>
            <div className="space-y-4">
              <div>
                <label className="text-xs block mb-1.5" style={{ color: "var(--text-tertiary)" }}>Текущий пароль</label>
                <input
                  type="password"
                  value={oldPassword}
                  onChange={(e) => setOldPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full px-3 py-2 rounded-lg text-sm outline-none"
                  style={{ backgroundColor: "var(--bg-base)", border: "1px solid var(--border-default)", color: "var(--text-primary)" }}
                />
              </div>
              <div>
                <label className="text-xs block mb-1.5" style={{ color: "var(--text-tertiary)" }}>Новый пароль</label>
                <input
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Мин. 8 символов, буквы + цифры"
                  className="w-full px-3 py-2 rounded-lg text-sm outline-none"
                  style={{ backgroundColor: "var(--bg-base)", border: "1px solid var(--border-default)", color: "var(--text-primary)" }}
                />
              </div>
              {passwordMsg && (
                <div className="text-xs flex items-center gap-1" style={{ color: passwordMsg.type === "ok" ? "var(--accent-green)" : "var(--accent-rose)" }}>
                  {passwordMsg.type === "ok" ? <Check size={12} /> : <AlertCircle size={12} />}
                  {passwordMsg.text}
                </div>
              )}
              <button
                onClick={handleChangePassword}
                disabled={!oldPassword || !newPassword}
                className="px-4 py-2 rounded-lg text-xs font-medium disabled:opacity-40"
                style={{ backgroundColor: "var(--bg-elevated)", color: "var(--text-primary)", border: "1px solid var(--border-default)" }}
              >
                Изменить пароль
              </button>
            </div>
          </SettingsSection>

          {/* ── Plan info ── */}
          <SettingsSection icon={CreditCard} title="Подписка" delay={0.2}>
            <div className="space-y-3">
              <InfoRow label="Текущий тариф" value={org?.plan || "corporate"} />
              <InfoRow label="Статус" value="Активна" color="var(--accent-green)" />
              <p className="text-xs" style={{ color: "var(--text-tertiary)" }}>
                Управление подпиской и оплата — скоро. Для изменения тарифа напишите на{" "}
                <a href="mailto:sales@xerocode.space" style={{ color: "var(--accent-blue)" }}>sales@xerocode.space</a>
              </p>
            </div>
          </SettingsSection>

          {/* ── Notifications placeholder ── */}
          <SettingsSection icon={Bell} title="Уведомления" delay={0.25}>
            <div className="space-y-3">
              <ToggleRow label="Email о новых задачах" enabled={false} disabled />
              <ToggleRow label="Telegram-бот" enabled={false} disabled />
              <p className="text-xs" style={{ color: "var(--text-tertiary)" }}>
                Настройка уведомлений появится в ближайшем обновлении.
              </p>
            </div>
          </SettingsSection>

          {/* ── Danger zone ── */}
          <SettingsSection icon={Trash2} title="Опасная зона" delay={0.3} danger>
            <div className="space-y-3">
              <button
                onClick={onLogout}
                className="flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-colors w-full justify-center"
                style={{ backgroundColor: "rgba(251,113,133,0.1)", color: "var(--accent-rose)", border: "1px solid rgba(251,113,133,0.2)" }}
              >
                <LogOut size={14} />
                Выйти из аккаунта
              </button>
              <p className="text-[10px] text-center" style={{ color: "var(--text-tertiary)" }}>
                Удаление аккаунта доступно в профиле (Настройки → Удалить аккаунт)
              </p>
            </div>
          </SettingsSection>
        </div>
      </div>
    </div>
  );
}

/* ── Helpers ── */

function SettingsSection({ icon: Icon, title, children, delay = 0, danger }: {
  icon: React.ElementType;
  title: string;
  children: React.ReactNode;
  delay?: number;
  danger?: boolean;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay }}
      className="rounded-xl p-5"
      style={{
        backgroundColor: "var(--bg-surface)",
        border: `1px solid ${danger ? "rgba(251,113,133,0.15)" : "var(--border-default)"}`,
      }}
    >
      <div className="flex items-center gap-2 mb-4">
        <Icon size={16} style={{ color: danger ? "var(--accent-rose)" : "var(--accent-blue)" }} />
        <h2 className="text-sm font-semibold" style={{ color: "var(--text-primary)" }}>{title}</h2>
      </div>
      {children}
    </motion.div>
  );
}

function InfoRow({ label, value, color }: { label: string; value: string | number; color?: string }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-xs" style={{ color: "var(--text-tertiary)" }}>{label}</span>
      <span className="text-xs font-medium" style={{ color: color || "var(--text-primary)" }}>{value}</span>
    </div>
  );
}

function ToggleRow({ label, enabled, disabled }: { label: string; enabled: boolean; disabled?: boolean }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-xs" style={{ color: "var(--text-secondary)" }}>{label}</span>
      <div
        className="w-8 h-4.5 rounded-full relative"
        style={{
          backgroundColor: enabled ? "var(--accent-blue)" : "var(--bg-elevated)",
          opacity: disabled ? 0.4 : 1,
          cursor: disabled ? "not-allowed" : "pointer",
          padding: "2px",
        }}
      >
        <div
          className="w-3.5 h-3.5 rounded-full transition-transform"
          style={{
            backgroundColor: "#fff",
            transform: enabled ? "translateX(14px)" : "translateX(0)",
          }}
        />
      </div>
    </div>
  );
}
