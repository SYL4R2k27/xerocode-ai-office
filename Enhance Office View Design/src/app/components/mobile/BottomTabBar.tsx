/**
 * BottomTabBar — нижняя навигация для мобильной версии.
 * 5 вкладок: Чат, Модели, Новая цель (центр), Задачи, Профиль.
 */
import { motion } from "motion/react";
import { MessageCircle, Bot, Plus, ListTodo, UserCircle } from "lucide-react";

export type MobileTab = "chat" | "models" | "new" | "tasks" | "profile";

interface BottomTabBarProps {
  active: MobileTab;
  onTabChange: (tab: MobileTab) => void;
}

const tabs: Array<{
  id: MobileTab;
  label: string;
  icon: typeof MessageCircle;
}> = [
  { id: "chat", label: "Чат", icon: MessageCircle },
  { id: "models", label: "Модели", icon: Bot },
  { id: "new", label: "Новая", icon: Plus },
  { id: "tasks", label: "Задачи", icon: ListTodo },
  { id: "profile", label: "Профиль", icon: UserCircle },
];

export function BottomTabBar({ active, onTabChange }: BottomTabBarProps) {
  return (
    <div
      className="fixed bottom-0 left-0 right-0 z-50 flex items-end justify-around"
      style={{
        height: "calc(60px + env(safe-area-inset-bottom, 0px))",
        paddingBottom: "env(safe-area-inset-bottom, 0px)",
        backgroundColor: "rgba(15, 15, 18, 0.90)",
        backdropFilter: "blur(24px)",
        WebkitBackdropFilter: "blur(24px)",
        borderTop: "1px solid rgba(255, 255, 255, 0.05)",
      }}
    >
      {tabs.map((tab) => {
        const Icon = tab.icon;
        const isActive = active === tab.id;
        const isCenter = tab.id === "new";

        if (isCenter) {
          return (
            <button
              key={tab.id}
              onClick={() => onTabChange(tab.id)}
              className="flex flex-col items-center justify-center relative"
              style={{
                width: 56,
                height: 60,
                WebkitTapHighlightColor: "transparent",
              }}
            >
              <motion.div
                whileTap={{ scale: 0.9 }}
                className="flex items-center justify-center rounded-full"
                style={{
                  width: 48,
                  height: 48,
                  marginTop: -12,
                  background: isActive
                    ? "linear-gradient(135deg, #A855F7, #3B82F6)"
                    : "linear-gradient(135deg, #7C3AED, #2563EB)",
                  boxShadow: isActive
                    ? "0 4px 20px rgba(168, 85, 247, 0.4)"
                    : "0 2px 12px rgba(124, 58, 237, 0.3)",
                }}
              >
                <Plus size={24} color="#fff" strokeWidth={2.5} />
              </motion.div>
            </button>
          );
        }

        return (
          <button
            key={tab.id}
            onClick={() => onTabChange(tab.id)}
            className="flex flex-col items-center justify-center gap-0.5 relative"
            style={{
              width: 64,
              height: 60,
              WebkitTapHighlightColor: "transparent",
            }}
          >
            <motion.div
              animate={{ scale: isActive ? 1 : 0.95 }}
              transition={{ duration: 0.15 }}
              className="flex flex-col items-center gap-0.5"
            >
              <Icon
                size={22}
                strokeWidth={isActive ? 2.2 : 1.5}
                style={{
                  color: isActive ? "#A855F7" : "rgba(255, 255, 255, 0.3)",
                  transition: "color 0.15s ease",
                }}
              />
              <span
                className="text-[10px] font-medium leading-none"
                style={{
                  color: isActive ? "#A855F7" : "rgba(255, 255, 255, 0.3)",
                  transition: "color 0.15s ease",
                }}
              >
                {tab.label}
              </span>
            </motion.div>
            {/* Индикатор активной вкладки */}
            {isActive && (
              <motion.div
                layoutId="tab-indicator"
                className="absolute top-0 left-1/2 -translate-x-1/2 rounded-full"
                style={{
                  width: 20,
                  height: 2,
                  backgroundColor: "#A855F7",
                }}
                transition={{ type: "spring", stiffness: 400, damping: 30 }}
              />
            )}
          </button>
        );
      })}
    </div>
  );
}
