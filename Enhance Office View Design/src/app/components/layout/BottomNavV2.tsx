/**
 * BottomNavV2 — mobile bottom navigation bar.
 * Only rendered on mobile (<768px). Fixed at bottom with safe-area inset.
 */
import { motion } from "motion/react";
import { MessageSquare, MessagesSquare, Plus, Settings, User } from "lucide-react";

interface BottomNavV2Props {
  activeTab: "chat" | "history" | "models" | "profile";
  onTabChange: (tab: "chat" | "history" | "models" | "profile") => void;
  onNewChat: () => void;
}

const TABS = [
  { id: "chat" as const, label: "Чат", icon: MessageSquare },
  { id: "history" as const, label: "История", icon: MessagesSquare },
  { id: "new" as const, label: "Новый", icon: Plus, primary: true },
  { id: "models" as const, label: "Модели", icon: Settings },
  { id: "profile" as const, label: "Профиль", icon: User },
];

export function BottomNavV2({ activeTab, onTabChange, onNewChat }: BottomNavV2Props) {
  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-40 flex items-stretch"
      style={{
        backgroundColor: "color-mix(in srgb, var(--bg-base) 92%, transparent)",
        backdropFilter: "blur(16px)",
        borderTop: "1px solid var(--border-default)",
        paddingBottom: "var(--safe-bottom)",
      }}
    >
      {TABS.map((tab) => {
        const Icon = tab.icon;
        const isActive = tab.id !== "new" && activeTab === tab.id;
        const isPrimary = tab.primary;

        const handleClick = () => {
          if (tab.id === "new") {
            onNewChat();
            onTabChange("chat");
          } else {
            onTabChange(tab.id);
          }
        };

        if (isPrimary) {
          return (
            <button
              key={tab.id}
              onClick={handleClick}
              className="flex-1 flex flex-col items-center justify-center py-2 relative"
              aria-label={tab.label}
            >
              <motion.div
                whileTap={{ scale: 0.92 }}
                className="w-12 h-12 rounded-full flex items-center justify-center -mt-5 shadow-lg"
                style={{
                  background: "linear-gradient(135deg, var(--accent-blue), var(--accent-purple, #9333ea))",
                  boxShadow: "0 4px 12px color-mix(in srgb, var(--accent-blue) 40%, transparent)",
                }}
              >
                <Icon size={22} color="#fff" strokeWidth={2.5} />
              </motion.div>
              <span style={{ fontSize: "10px", color: "var(--text-tertiary)", marginTop: "2px" }}>
                {tab.label}
              </span>
            </button>
          );
        }

        return (
          <button
            key={tab.id}
            onClick={handleClick}
            className="flex-1 flex flex-col items-center justify-center gap-0.5 py-2.5 relative"
            aria-label={tab.label}
            aria-current={isActive ? "page" : undefined}
          >
            <Icon
              size={20}
              style={{ color: isActive ? "var(--accent-blue)" : "var(--text-tertiary)" }}
            />
            <span
              style={{
                fontSize: "10px",
                fontWeight: isActive ? 600 : 400,
                color: isActive ? "var(--accent-blue)" : "var(--text-tertiary)",
              }}
            >
              {tab.label}
            </span>
            {isActive && (
              <motion.div
                layoutId="bottom-nav-indicator"
                className="absolute top-0 left-1/2 -translate-x-1/2 w-8 h-0.5 rounded-b-full"
                style={{ backgroundColor: "var(--accent-blue)" }}
                transition={{ type: "spring", stiffness: 380, damping: 30 }}
              />
            )}
          </button>
        );
      })}
    </nav>
  );
}
