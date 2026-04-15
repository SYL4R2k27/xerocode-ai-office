import { useState, useCallback } from "react";
import {
  User as UserIcon,
  CreditCard,
  Shield,
  Database,
  X,
  Check,
  Eye,
  EyeOff,
  Loader2,
  Download,
  Trash2,
  Smartphone,
  Monitor,
  ChevronRight,
  Sparkles,
  Crown,
  Zap,
  Target,
  CheckCircle2,
  AlertTriangle,
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { toast } from "sonner";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "../ui/tabs";
import { Switch } from "../ui/switch";
import { api } from "../../lib/api";
import type { User } from "../../lib/api";

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */
interface ProfileSettingsProps {
  user: User;
  open: boolean;
  onClose: () => void;
  onUserUpdate?: (user: User) => void;
  onOpenPricing?: () => void;
}

/* ------------------------------------------------------------------ */
/*  Avatar emojis                                                      */
/* ------------------------------------------------------------------ */
const avatarEmojis = ["😊", "🚀", "🎯", "💡", "⚡", "🔮", "🎨", "🧠", "🦊", "🐱", "🌟", "🔥"];

/* ------------------------------------------------------------------ */
/*  Plan data                                                          */
/* ------------------------------------------------------------------ */
const plans = [
  {
    id: "free",
    name: "Free",
    price: "Бесплатно",
    priceNote: "навсегда",
    icon: <Zap size={20} />,
    color: "var(--text-tertiary)",
    gradient: "linear-gradient(135deg, #48484A, #6E6E73)",
    features: [
      "50 задач в месяц",
      "3 агента одновременно",
      "Свои модели (BYOK)",
      "Поддержка сообщества",
    ],
  },
  {
    id: "pro",
    name: "PRO",
    price: "990 ₽",
    priceNote: "/ месяц",
    icon: <Sparkles size={20} />,
    color: "var(--accent-teal)",
    gradient: "linear-gradient(135deg, #5ABFAD, #3b82f6)",
    popular: true,
    features: [
      "500 задач в месяц",
      "10 агентов одновременно",
      "Бесплатный пул моделей",
      "100 изображений / месяц",
      "Готовые пулы под задачи",
    ],
  },
  {
    id: "ultima",
    name: "ULTIMA",
    price: "2 990 ₽",
    priceNote: "/ месяц",
    icon: <Crown size={20} />,
    color: "var(--accent-amber)",
    gradient: "linear-gradient(135deg, #D4A054, #9333ea)",
    features: [
      "5 000 задач в месяц",
      "Безлимитные агенты",
      "Премиум модели (GPT-4o, Claude, Grok)",
      "1 000 изображений / месяц",
      "Docker Sandbox",
      "Кастомные пулы",
    ],
  },
];

/* ------------------------------------------------------------------ */
/*  ProfileSettings Component                                          */
/* ------------------------------------------------------------------ */
function useIsMobile(): boolean {
  // Read once on mount; sufficient for modal lifetime
  if (typeof window === "undefined") return false;
  return window.matchMedia("(max-width: 767px)").matches;
}

export function ProfileSettings({ user, open, onClose, onUserUpdate, onOpenPricing }: ProfileSettingsProps) {
  const isMobile = useIsMobile();
  const [activeTab, setActiveTab] = useState("profile");

  // Profile state
  const [editName, setEditName] = useState(user.name);
  const [savingName, setSavingName] = useState(false);
  const [showAvatarPicker, setShowAvatarPicker] = useState(false);
  const [selectedEmoji, setSelectedEmoji] = useState<string | null>(null);

  // Password state
  const [showChangePassword, setShowChangePassword] = useState(false);
  const [oldPassword, setOldPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showOldPw, setShowOldPw] = useState(false);
  const [showNewPw, setShowNewPw] = useState(false);
  const [savingPassword, setSavingPassword] = useState(false);

  // Delete account
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleteConfirmText, setDeleteConfirmText] = useState("");
  const [deleting, setDeleting] = useState(false);

  const userInitial = selectedEmoji || (user.name || user.email || "U").charAt(0).toUpperCase();

  /* -- Profile handlers -- */
  const handleSaveName = useCallback(async () => {
    if (!editName.trim() || editName === user.name) return;
    setSavingName(true);
    try {
      await api.auth.updateProfile(editName.trim());
      toast.success("Имя обновлено");
      if (onUserUpdate) onUserUpdate({ ...user, name: editName.trim() });
    } catch (e: any) {
      toast.error(e.message || "Ошибка при обновлении");
    } finally {
      setSavingName(false);
    }
  }, [editName, user, onUserUpdate]);

  const handleChangePassword = useCallback(async () => {
    if (!oldPassword || !newPassword) {
      toast.error("Заполните все поля");
      return;
    }
    if (newPassword !== confirmPassword) {
      toast.error("Пароли не совпадают");
      return;
    }
    if (newPassword.length < 6) {
      toast.error("Пароль должен быть не менее 6 символов");
      return;
    }
    setSavingPassword(true);
    try {
      await api.auth.changePassword(oldPassword, newPassword);
      toast.success("Пароль изменён");
      setShowChangePassword(false);
      setOldPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch (e: any) {
      toast.error(e.message || "Ошибка при смене пароля");
    } finally {
      setSavingPassword(false);
    }
  }, [oldPassword, newPassword, confirmPassword]);

  const handleDeleteAccount = useCallback(async () => {
    if (deleteConfirmText !== "УДАЛИТЬ") return;
    setDeleting(true);
    try {
      await api.auth.deleteAccount();
      toast.success("Аккаунт удалён");
      window.location.reload();
    } catch (e: any) {
      toast.error(e.message || "Ошибка при удалении");
    } finally {
      setDeleting(false);
    }
  }, [deleteConfirmText]);

  if (!open) return null;

  /* ---------------------------------------------------------------- */
  /*  Tab contents                                                     */
  /* ---------------------------------------------------------------- */

  const profileTab = (
    <motion.div
      className="space-y-6"
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2 }}
    >
      {/* Avatar */}
      <div className="flex items-center gap-4">
        <button
          onClick={() => setShowAvatarPicker((s) => !s)}
          className="w-16 h-16 rounded-2xl flex items-center justify-center text-[24px] font-bold transition-all duration-200 hover:scale-105 flex-shrink-0"
          style={{
            background: "linear-gradient(135deg, rgba(147,51,234,0.2), rgba(59,130,246,0.2))",
            border: "2px solid rgba(147,51,234,0.3)",
            color: selectedEmoji ? undefined : "#9333ea",
          }}
        >
          {userInitial}
        </button>
        <div>
          <div className="text-[14px] font-semibold" style={{ color: "var(--text-primary)" }}>
            {user.name}
          </div>
          <div className="text-[12px]" style={{ color: "var(--text-tertiary)" }}>
            Нажмите на аватар, чтобы изменить
          </div>
        </div>
      </div>

      {/* Emoji picker */}
      <AnimatePresence>
        {showAvatarPicker && (
          <motion.div
            className="grid grid-cols-6 gap-2 p-3 rounded-xl"
            style={{ backgroundColor: "var(--bg-input)", border: "1px solid var(--border-default)" }}
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
          >
            {avatarEmojis.map((emoji) => (
              <button
                key={emoji}
                onClick={() => {
                  setSelectedEmoji(emoji);
                  setShowAvatarPicker(false);
                  toast.success("Аватар обновлён");
                }}
                className="w-10 h-10 rounded-lg flex items-center justify-center text-[20px] hover:scale-110 transition-transform"
                style={{
                  backgroundColor:
                    selectedEmoji === emoji ? "rgba(147,51,234,0.15)" : "transparent",
                }}
              >
                {emoji}
              </button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Name edit */}
      <div>
        <label className="text-[12px] font-medium block mb-1.5" style={{ color: "var(--text-secondary)" }}>
          Имя
        </label>
        <div className="flex gap-2">
          <input
            type="text"
            value={editName}
            onChange={(e) => setEditName(e.target.value)}
            className="flex-1 px-4 py-2.5 rounded-xl text-[14px] outline-none transition-all duration-200"
            style={{
              backgroundColor: "var(--bg-input)",
              border: "1px solid var(--border-default)",
              color: "var(--text-primary)",
            }}
          />
          {editName !== user.name && (
            <motion.button
              onClick={handleSaveName}
              disabled={savingName}
              className="px-4 py-2.5 rounded-xl text-[13px] font-medium text-white disabled:opacity-50"
              style={{ background: "linear-gradient(135deg, #9333ea, #3b82f6)" }}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              {savingName ? <Loader2 size={14} className="animate-spin" /> : "Сохранить"}
            </motion.button>
          )}
        </div>
      </div>

      {/* Email (read-only) */}
      <div>
        <label className="text-[12px] font-medium block mb-1.5" style={{ color: "var(--text-secondary)" }}>
          Email
        </label>
        <div
          className="px-4 py-2.5 rounded-xl text-[14px]"
          style={{
            backgroundColor: "var(--bg-input)",
            border: "1px solid var(--border-default)",
            color: "var(--text-tertiary)",
          }}
        >
          {user.email}
        </div>
      </div>

      {/* Change password */}
      <div>
        <button
          onClick={() => setShowChangePassword((s) => !s)}
          className="flex items-center gap-2 text-[13px] font-medium transition-colors"
          style={{ color: "var(--accent-lavender)" }}
        >
          <Shield size={14} />
          Сменить пароль
          <ChevronRight
            size={14}
            className="transition-transform duration-200"
            style={{ transform: showChangePassword ? "rotate(90deg)" : "none" }}
          />
        </button>

        <AnimatePresence>
          {showChangePassword && (
            <motion.div
              className="space-y-3 mt-3"
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
            >
              {/* Old password */}
              <div className="relative">
                <input
                  type={showOldPw ? "text" : "password"}
                  value={oldPassword}
                  onChange={(e) => setOldPassword(e.target.value)}
                  placeholder="Текущий пароль"
                  className="w-full px-4 py-2.5 rounded-xl text-[14px] outline-none pr-10"
                  style={{
                    backgroundColor: "var(--bg-input)",
                    border: "1px solid var(--border-default)",
                    color: "var(--text-primary)",
                  }}
                />
                <button
                  type="button"
                  onClick={() => setShowOldPw((s) => !s)}
                  className="absolute right-3 top-1/2 -translate-y-1/2"
                  style={{ color: "var(--text-tertiary)" }}
                >
                  {showOldPw ? <EyeOff size={14} /> : <Eye size={14} />}
                </button>
              </div>

              {/* New password */}
              <div className="relative">
                <input
                  type={showNewPw ? "text" : "password"}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Новый пароль"
                  className="w-full px-4 py-2.5 rounded-xl text-[14px] outline-none pr-10"
                  style={{
                    backgroundColor: "var(--bg-input)",
                    border: "1px solid var(--border-default)",
                    color: "var(--text-primary)",
                  }}
                />
                <button
                  type="button"
                  onClick={() => setShowNewPw((s) => !s)}
                  className="absolute right-3 top-1/2 -translate-y-1/2"
                  style={{ color: "var(--text-tertiary)" }}
                >
                  {showNewPw ? <EyeOff size={14} /> : <Eye size={14} />}
                </button>
              </div>

              {/* Confirm password */}
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Подтвердите новый пароль"
                className="w-full px-4 py-2.5 rounded-xl text-[14px] outline-none"
                style={{
                  backgroundColor: "var(--bg-input)",
                  border: `1px solid ${
                    confirmPassword && confirmPassword !== newPassword
                      ? "var(--accent-rose)"
                      : "var(--border-default)"
                  }`,
                  color: "var(--text-primary)",
                }}
              />

              <motion.button
                onClick={handleChangePassword}
                disabled={savingPassword}
                className="px-5 py-2.5 rounded-xl text-[13px] font-medium text-white disabled:opacity-50 flex items-center gap-2"
                style={{ background: "linear-gradient(135deg, #9333ea, #3b82f6)" }}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                {savingPassword && <Loader2 size={14} className="animate-spin" />}
                Сменить пароль
              </motion.button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );

  const currentPlanInfo = plans.find((p) => p.id === user.plan) || plans[0];

  const subscriptionTab = (
    <motion.div
      className="space-y-5"
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2 }}
    >
      {/* Current plan summary */}
      <div
        className="rounded-xl p-5 relative overflow-hidden"
        style={{
          backgroundColor: "rgba(147,51,234,0.06)",
          border: "1px solid rgba(147,51,234,0.3)",
        }}
      >
        <div className="flex items-start gap-3">
          <div
            className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
            style={{
              background: currentPlanInfo.gradient,
              color: "#fff",
              opacity: 0.9,
            }}
          >
            {currentPlanInfo.icon}
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <span className="text-[15px] font-bold" style={{ color: "var(--text-primary)" }}>
                {currentPlanInfo.name}
              </span>
              <span
                className="text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1"
                style={{ backgroundColor: "rgba(147,51,234,0.15)", color: "#9333ea" }}
              >
                <Check size={10} />
                Текущий
              </span>
            </div>
            <div className="flex items-baseline gap-1 mb-3">
              <span className="text-[20px] font-bold" style={{ color: "var(--text-primary)" }}>
                {currentPlanInfo.price}
              </span>
              <span className="text-[12px]" style={{ color: "var(--text-tertiary)" }}>
                {currentPlanInfo.priceNote}
              </span>
            </div>
            <div className="space-y-1.5">
              {currentPlanInfo.features.slice(0, 3).map((f, i) => (
                <div key={i} className="flex items-center gap-2 text-[12px]" style={{ color: "var(--text-secondary)" }}>
                  <CheckCircle2 size={12} style={{ color: currentPlanInfo.color }} />
                  {f}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Usage stats */}
      <div
        className="rounded-xl p-4"
        style={{ backgroundColor: "var(--bg-input)", border: "1px solid var(--border-default)" }}
      >
        <div className="text-[12px] font-semibold mb-3" style={{ color: "var(--text-primary)" }}>
          Использование
        </div>
        <div className="space-y-3">
          <div>
            <div className="flex justify-between text-[11px] mb-1.5">
              <span style={{ color: "var(--text-secondary)" }}>Задачи в этом месяце</span>
              <span style={{ color: "var(--text-primary)" }}>{user.tasks_used_this_month} / {currentPlanInfo.id === "ultima" ? "∞" : currentPlanInfo.features[0]?.match(/\d[\d\s]*/)?.[0]?.trim() || "50"}</span>
            </div>
            <div className="h-1.5 rounded-full overflow-hidden" style={{ backgroundColor: "rgba(255,255,255,0.06)" }}>
              <div
                className="h-full rounded-full transition-all"
                style={{
                  width: `${Math.min((user.tasks_used_this_month / 50) * 100, 100)}%`,
                  background: currentPlanInfo.gradient,
                }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* All plans button */}
      <motion.button
        onClick={() => {
          if (onOpenPricing) {
            onClose();
            onOpenPricing();
          }
        }}
        className="w-full flex items-center justify-center gap-2 py-3 rounded-xl text-[13px] font-semibold text-white"
        style={{ background: "linear-gradient(135deg, #9333ea, #3b82f6)" }}
        whileHover={{ scale: 1.02, boxShadow: "0 4px 20px rgba(147,51,234,0.3)" }}
        whileTap={{ scale: 0.98 }}
      >
        Все тарифы
        <ChevronRight size={16} />
      </motion.button>
    </motion.div>
  );

  const securityTab = (
    <motion.div
      className="space-y-5"
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2 }}
    >
      {/* Active sessions */}
      <div>
        <div className="text-[13px] font-semibold mb-3" style={{ color: "var(--text-primary)" }}>
          Активные сессии
        </div>
        <div className="space-y-2">
          {[
            { icon: <Monitor size={16} />, name: "Текущий браузер", active: true, location: "Москва, Россия" },
            { icon: <Smartphone size={16} />, name: "iPhone 15 Pro", active: false, location: "Москва, Россия" },
          ].map((session, i) => (
            <div
              key={i}
              className="flex items-center gap-3 p-3 rounded-xl"
              style={{
                backgroundColor: "var(--bg-input)",
                border: "1px solid var(--border-default)",
              }}
            >
              <div style={{ color: session.active ? "var(--accent-teal)" : "var(--text-tertiary)" }}>
                {session.icon}
              </div>
              <div className="flex-1">
                <div className="text-[13px] font-medium flex items-center gap-2" style={{ color: "var(--text-primary)" }}>
                  {session.name}
                  {session.active && (
                    <span
                      className="text-[9px] font-bold px-1.5 py-0.5 rounded"
                      style={{
                        backgroundColor: "rgba(90,191,173,0.12)",
                        color: "var(--accent-teal)",
                      }}
                    >
                      Текущая
                    </span>
                  )}
                </div>
                <div className="text-[11px]" style={{ color: "var(--text-tertiary)" }}>
                  {session.location}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 2FA */}
      <div
        className="flex items-center justify-between p-4 rounded-xl"
        style={{
          backgroundColor: "var(--bg-input)",
          border: "1px solid var(--border-default)",
        }}
      >
        <div>
          <div className="text-[13px] font-semibold" style={{ color: "var(--text-primary)" }}>
            Двухфакторная аутентификация
          </div>
          <div className="text-[11px]" style={{ color: "var(--text-tertiary)" }}>
            Дополнительная защита аккаунта
          </div>
        </div>
        <Switch
          onCheckedChange={() =>
            toast("Скоро!", {
              description: "2FA будет доступна в ближайшее время",
            })
          }
        />
      </div>

      {/* Delete account */}
      <div className="pt-4" style={{ borderTop: "1px solid var(--border-default)" }}>
        <button
          onClick={() => setShowDeleteConfirm(true)}
          className="flex items-center gap-2 text-[13px] font-medium transition-colors hover:brightness-125"
          style={{ color: "var(--accent-rose)" }}
        >
          <Trash2 size={14} />
          Удалить аккаунт
        </button>

        <AnimatePresence>
          {showDeleteConfirm && (
            <motion.div
              className="mt-4 p-4 rounded-xl space-y-3"
              style={{
                backgroundColor: "rgba(212,106,106,0.06)",
                border: "1px solid rgba(212,106,106,0.2)",
              }}
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
            >
              <div className="flex items-start gap-2.5">
                <AlertTriangle size={16} style={{ color: "var(--accent-rose)" }} className="flex-shrink-0 mt-0.5" />
                <div>
                  <div className="text-[13px] font-semibold" style={{ color: "var(--accent-rose)" }}>
                    Это действие необратимо
                  </div>
                  <div className="text-[12px] mt-1" style={{ color: "var(--text-secondary)" }}>
                    Все ваши данные, агенты и цели будут удалены безвозвратно. Введите УДАЛИТЬ для подтверждения.
                  </div>
                </div>
              </div>
              <input
                type="text"
                value={deleteConfirmText}
                onChange={(e) => setDeleteConfirmText(e.target.value)}
                placeholder='Введите "УДАЛИТЬ"'
                className="w-full px-4 py-2.5 rounded-xl text-[14px] outline-none"
                style={{
                  backgroundColor: "var(--bg-input)",
                  border: "1px solid rgba(212,106,106,0.3)",
                  color: "var(--text-primary)",
                }}
              />
              <div className="flex gap-2">
                <button
                  onClick={handleDeleteAccount}
                  disabled={deleteConfirmText !== "УДАЛИТЬ" || deleting}
                  className="px-4 py-2 rounded-lg text-[12px] font-semibold text-white disabled:opacity-40 flex items-center gap-2"
                  style={{ backgroundColor: "var(--accent-rose)" }}
                >
                  {deleting && <Loader2 size={12} className="animate-spin" />}
                  Удалить навсегда
                </button>
                <button
                  onClick={() => {
                    setShowDeleteConfirm(false);
                    setDeleteConfirmText("");
                  }}
                  className="px-4 py-2 rounded-lg text-[12px] font-medium"
                  style={{ color: "var(--text-secondary)" }}
                >
                  Отмена
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );

  const dataTab = (
    <motion.div
      className="space-y-5"
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2 }}
    >
      {/* Stats */}
      <div>
        <div className="text-[13px] font-semibold mb-3" style={{ color: "var(--text-primary)" }}>
          Статистика
        </div>
        <div className="grid grid-cols-2 gap-3">
          {[
            { label: "Целей создано", value: "—", icon: <Target size={16} /> },
            { label: "Задач выполнено", value: String(user.tasks_used_this_month), icon: <CheckCircle2 size={16} /> },
            { label: "Токенов использовано", value: "—", icon: <Zap size={16} /> },
            {
              label: "Дата регистрации",
              value: new Date(user.created_at).toLocaleDateString("ru-RU"),
              icon: <UserIcon size={16} />,
            },
          ].map((stat, i) => (
            <div
              key={i}
              className="p-4 rounded-xl"
              style={{
                backgroundColor: "var(--bg-input)",
                border: "1px solid var(--border-default)",
              }}
            >
              <div className="flex items-center gap-2 mb-2" style={{ color: "var(--accent-lavender)" }}>
                {stat.icon}
              </div>
              <div className="text-[18px] font-bold" style={{ color: "var(--text-primary)" }}>
                {stat.value}
              </div>
              <div className="text-[11px]" style={{ color: "var(--text-tertiary)" }}>
                {stat.label}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Download data */}
      <div>
        <motion.button
          onClick={() =>
            toast("Скоро!", {
              description: "Скачивание данных будет доступно в ближайшее время",
            })
          }
          className="flex items-center gap-2.5 w-full p-4 rounded-xl text-[13px] font-medium transition-all"
          style={{
            backgroundColor: "var(--bg-input)",
            border: "1px solid var(--border-default)",
            color: "var(--text-secondary)",
          }}
          whileHover={{ scale: 1.01, borderColor: "rgba(147,51,234,0.3)" }}
          whileTap={{ scale: 0.99 }}
        >
          <Download size={16} style={{ color: "var(--accent-lavender)" }} />
          Скачать мои данные
          <ChevronRight size={14} className="ml-auto" style={{ color: "var(--text-tertiary)" }} />
        </motion.button>
      </div>
    </motion.div>
  );

  /* ---------------------------------------------------------------- */
  /*  Render                                                           */
  /* ---------------------------------------------------------------- */
  const tabItems = [
    { id: "profile", label: "Профиль", icon: <UserIcon size={14} /> },
    { id: "subscription", label: "Подписка", icon: <CreditCard size={14} /> },
    { id: "security", label: "Безопасность", icon: <Shield size={14} /> },
    { id: "data", label: "Данные", icon: <Database size={14} /> },
  ];

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className={`fixed inset-0 z-50 flex justify-center ${isMobile ? "items-end p-0" : "items-center p-4"}`}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
        >
          {/* Overlay */}
          <motion.div
            className="absolute inset-0"
            style={{ backgroundColor: "rgba(0,0,0,0.6)", backdropFilter: "blur(4px)" }}
            onClick={onClose}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          />

          {/* Modal */}
          <motion.div
            className={`relative w-full ${isMobile ? "max-w-full max-h-[92vh] rounded-t-3xl rounded-b-none" : "max-w-[560px] max-h-[85vh] rounded-2xl"} overflow-hidden flex flex-col`}
            style={{
              backgroundColor: "#1C1C1E",
              border: "1px solid #2A2A2D",
              boxShadow: "0 25px 50px -12px rgba(0,0,0,0.5)",
              paddingBottom: isMobile ? "var(--safe-bottom)" : undefined,
            }}
            initial={isMobile ? { y: "100%" } : { opacity: 0, scale: 0.95, y: 20 }}
            animate={isMobile ? { y: 0 } : { opacity: 1, scale: 1, y: 0 }}
            exit={isMobile ? { y: "100%" } : { opacity: 0, scale: 0.95, y: 20 }}
            drag={isMobile ? "y" : false}
            dragConstraints={{ top: 0, bottom: 0 }}
            dragElastic={{ top: 0, bottom: 0.4 }}
            onDragEnd={isMobile ? (_, info) => { if (info.offset.y > 100 || info.velocity.y > 500) onClose(); } : undefined}
            transition={{ type: "spring", stiffness: 350, damping: 30 }}
          >
            {/* Header */}
            <div
              className="flex items-center justify-between px-6 py-4 flex-shrink-0"
              style={{ borderBottom: "1px solid var(--border-default)" }}
            >
              <h2 className="text-[16px] font-semibold" style={{ color: "var(--text-primary)" }}>
                Настройки
              </h2>
              <button
                onClick={onClose}
                className="p-1.5 rounded-lg transition-colors hover:bg-white/5"
                style={{ color: "var(--text-tertiary)" }}
              >
                <X size={18} />
              </button>
            </div>

            {/* Tabs */}
            <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col min-h-0">
              <div className="px-6 pt-4 flex-shrink-0">
                <TabsList className="w-full grid grid-cols-4 gap-0 h-9" style={{ backgroundColor: "var(--bg-input)" }}>
                  {tabItems.map((tab) => (
                    <TabsTrigger
                      key={tab.id}
                      value={tab.id}
                      className="flex items-center gap-1.5 text-[12px] px-2"
                    >
                      {tab.icon}
                      <span className="hidden sm:inline">{tab.label}</span>
                    </TabsTrigger>
                  ))}
                </TabsList>
              </div>

              <div className="flex-1 overflow-y-auto px-6 py-5">
                <TabsContent value="profile">{profileTab}</TabsContent>
                <TabsContent value="subscription">{subscriptionTab}</TabsContent>
                <TabsContent value="security">{securityTab}</TabsContent>
                <TabsContent value="data">{dataTab}</TabsContent>
              </div>
            </Tabs>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
