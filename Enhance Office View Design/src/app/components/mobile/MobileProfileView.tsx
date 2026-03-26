/**
 * MobileProfileView — профиль пользователя для мобильной версии.
 * Аватар + имя + почта + план + меню-список.
 */
import { motion } from "motion/react";
import {
  CreditCard,
  Settings,
  Shield,
  History,
  FileText,
  Lock,
  LogOut,
  ChevronRight,
  Crown,
  Sparkles,
  Zap,
} from "lucide-react";
import type { User } from "../../lib/api";

interface MobileProfileViewProps {
  user: User;
  onLogout: () => void;
  onOpenProfile: () => void;
  onOpenPricing: () => void;
}

const planConfig: Record<string, { label: string; color: string; icon: typeof Zap }> = {
  free: { label: "Free", color: "var(--text-tertiary)", icon: Zap },
  pro: { label: "PRO", color: "var(--accent-blue)", icon: Sparkles },
  ultima: { label: "ULTIMA", color: "#A855F7", icon: Crown },
  admin: { label: "Admin", color: "#EF4444", icon: Shield },
};

interface MenuItem {
  id: string;
  label: string;
  icon: typeof CreditCard;
  color?: string;
  danger?: boolean;
  action: () => void;
}

export function MobileProfileView({
  user,
  onLogout,
  onOpenProfile,
  onOpenPricing,
}: MobileProfileViewProps) {
  const plan = planConfig[user.plan] || planConfig.free;
  const PlanIcon = plan.icon;

  // Расчёт пробного периода
  const createdAt = new Date(user.created_at);
  const trialEnd = new Date(createdAt.getTime() + 14 * 24 * 60 * 60 * 1000);
  const now = new Date();
  const daysLeft = Math.max(0, Math.ceil((trialEnd.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)));
  const isTrial = user.plan === "free" && daysLeft > 0;

  const menuItems: MenuItem[] = [
    {
      id: "pricing",
      label: "Тарифы",
      icon: CreditCard,
      color: "var(--accent-blue)",
      action: onOpenPricing,
    },
    {
      id: "settings",
      label: "Настройки",
      icon: Settings,
      action: onOpenProfile,
    },
    {
      id: "security",
      label: "Безопасность",
      icon: Shield,
      action: onOpenProfile,
    },
    {
      id: "history",
      label: "История",
      icon: History,
      action: () => {},
    },
    {
      id: "terms",
      label: "Оферта",
      icon: FileText,
      action: () => {},
    },
    {
      id: "privacy",
      label: "Конфиденциальность",
      icon: Lock,
      action: () => {},
    },
  ];

  return (
    <div
      className="flex flex-col h-full overflow-y-auto"
      style={{
        backgroundColor: "var(--bg-base)",
        paddingBottom: "calc(80px + env(safe-area-inset-bottom, 0px))",
      }}
    >
      {/* Профиль */}
      <div className="flex flex-col items-center pt-8 pb-6 px-4">
        {/* Аватар */}
        <div
          className="w-20 h-20 rounded-full flex items-center justify-center text-3xl mb-3"
          style={{
            background: "linear-gradient(135deg, #7C3AED, #3B82F6)",
            boxShadow: "0 4px 20px rgba(124, 58, 237, 0.3)",
          }}
        >
          {user.name.charAt(0).toUpperCase()}
        </div>

        {/* Имя */}
        <h2 className="text-[18px] font-semibold" style={{ color: "var(--text-primary)" }}>
          {user.name}
        </h2>

        {/* Email */}
        <p className="text-[13px] mt-0.5" style={{ color: "var(--text-tertiary)" }}>
          {user.email}
        </p>

        {/* План + Trial */}
        <div className="flex items-center gap-2 mt-3">
          <div
            className="flex items-center gap-1.5 px-3 py-1 rounded-full text-[12px] font-medium"
            style={{
              backgroundColor: `color-mix(in srgb, ${plan.color} 15%, transparent)`,
              color: plan.color,
              border: `1px solid color-mix(in srgb, ${plan.color} 30%, transparent)`,
            }}
          >
            <PlanIcon size={13} />
            {plan.label}
          </div>
          {isTrial && (
            <div
              className="px-3 py-1 rounded-full text-[11px] font-medium"
              style={{
                backgroundColor: "rgba(234, 179, 8, 0.1)",
                color: "#EAB308",
                border: "1px solid rgba(234, 179, 8, 0.2)",
              }}
            >
              {daysLeft} {daysLeft === 1 ? "день" : daysLeft < 5 ? "дня" : "дней"} пробного
            </div>
          )}
        </div>

        {/* Использование задач */}
        <div
          className="w-full mt-5 rounded-2xl p-4"
          style={{ backgroundColor: "var(--bg-surface)" }}
        >
          <div className="flex items-center justify-between text-[12px] mb-2">
            <span style={{ color: "var(--text-secondary)" }}>Задач в этом месяце</span>
            <span style={{ color: "var(--text-primary)" }} className="font-medium">
              {user.tasks_used_this_month}
            </span>
          </div>
          <div
            className="h-1.5 rounded-full overflow-hidden"
            style={{ backgroundColor: "var(--bg-elevated)" }}
          >
            <motion.div
              className="h-full rounded-full"
              style={{
                backgroundColor: user.tasks_used_this_month > 40 ? "#EF4444" : "var(--accent-blue)",
              }}
              initial={{ width: 0 }}
              animate={{
                width: `${Math.min((user.tasks_used_this_month / 50) * 100, 100)}%`,
              }}
              transition={{ duration: 0.8, ease: "easeOut" }}
            />
          </div>
        </div>
      </div>

      {/* Меню */}
      <div className="px-4 space-y-1">
        {menuItems.map((item, index) => {
          const Icon = item.icon;
          return (
            <motion.button
              key={item.id}
              initial={{ opacity: 0, x: -8 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.04 }}
              onClick={item.action}
              className="w-full flex items-center gap-3.5 px-4 py-3.5 rounded-2xl active:bg-white/3 transition-colors"
              style={{ WebkitTapHighlightColor: "transparent" }}
            >
              <div
                className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
                style={{ backgroundColor: "var(--bg-surface)" }}
              >
                <Icon
                  size={18}
                  style={{ color: item.color || "var(--text-secondary)" }}
                />
              </div>
              <span
                className="flex-1 text-left text-[15px]"
                style={{ color: "var(--text-primary)" }}
              >
                {item.label}
              </span>
              <ChevronRight size={16} style={{ color: "var(--text-tertiary)" }} />
            </motion.button>
          );
        })}

        {/* Выйти — отдельно, красный */}
        <motion.button
          initial={{ opacity: 0, x: -8 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: menuItems.length * 0.04 }}
          onClick={onLogout}
          className="w-full flex items-center gap-3.5 px-4 py-3.5 rounded-2xl active:bg-red-500/5 transition-colors mt-4"
          style={{ WebkitTapHighlightColor: "transparent" }}
        >
          <div
            className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
            style={{ backgroundColor: "rgba(239, 68, 68, 0.1)" }}
          >
            <LogOut size={18} style={{ color: "#EF4444" }} />
          </div>
          <span className="flex-1 text-left text-[15px]" style={{ color: "#EF4444" }}>
            Выйти
          </span>
        </motion.button>
      </div>
    </div>
  );
}
