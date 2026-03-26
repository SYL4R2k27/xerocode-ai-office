/**
 * MobileLayout — мобильная обёртка, заменяет десктопный 3-панельный layout на экранах < 768px.
 * Переключение между вкладками через BottomTabBar и свайп-жесты.
 */
import { useState, useEffect, useCallback, useRef } from "react";
import { motion, AnimatePresence } from "motion/react";
import { ArrowLeft, Menu, X } from "lucide-react";
import { BottomTabBar, type MobileTab } from "./BottomTabBar";
import { MobileChatView } from "./MobileChatView";
import { MobileTaskView } from "./MobileTaskView";
import { MobileModelsView } from "./MobileModelsView";
import { MobileProfileView } from "./MobileProfileView";
import { useSwipe } from "../../hooks/useSwipe";
import { useAgentStore, useGoalStore, useTaskStore, useMessageStore, useStatusStore } from "../../store/useStore";
import { useAuthStore } from "../../store/useAuthStore";
import { useWebSocket } from "../../hooks/useWebSocket";
import { api } from "../../lib/api";
import type { User } from "../../lib/api";

interface MobileLayoutProps {
  user: User;
  onShowModelSetup: () => void;
  onShowProfileSettings: () => void;
  onShowPricing: () => void;
}

/** Порядок вкладок для свайп-навигации */
const TAB_ORDER: MobileTab[] = ["chat", "models", "new", "tasks", "profile"];

export function MobileLayout({
  user,
  onShowModelSetup,
  onShowProfileSettings,
  onShowPricing,
}: MobileLayoutProps) {
  const [activeTab, setActiveTab] = useState<MobileTab>("chat");
  const [isStarting, setIsStarting] = useState(false);

  const authStore = useAuthStore();
  const agentStore = useAgentStore();
  const goalStore = useGoalStore();
  const taskStore = useTaskStore();
  const messageStore = useMessageStore();
  const statusStore = useStatusStore();

  const ws = useWebSocket(goalStore.activeGoal?.id || null);

  // Контейнер для свайпа между вкладками
  const containerRef = useRef<HTMLDivElement>(null);

  // Свайп между вкладками
  useSwipe(containerRef, {
    onSwipeLeft: () => {
      const idx = TAB_ORDER.indexOf(activeTab);
      if (idx < TAB_ORDER.length - 1) {
        setActiveTab(TAB_ORDER[idx + 1]);
      }
    },
    onSwipeRight: () => {
      const idx = TAB_ORDER.indexOf(activeTab);
      if (idx > 0) {
        setActiveTab(TAB_ORDER[idx - 1]);
      }
    },
  }, 60);

  // Загрузка данных
  useEffect(() => {
    agentStore.fetchAgents();
    goalStore.fetchGoals();
  }, []);

  // Загрузка задач и сообщений при смене активной цели
  useEffect(() => {
    if (goalStore.activeGoal) {
      taskStore.fetchTasks(goalStore.activeGoal.id);
      messageStore.fetchMessages(goalStore.activeGoal.id);
      statusStore.fetchStatus(goalStore.activeGoal.id);
    }
  }, [goalStore.activeGoal?.id]);

  // WebSocket события
  useEffect(() => {
    if (!goalStore.activeGoal) return;

    const unsubs = [
      ws.on("new_message", (data) => {
        messageStore.addMessage({
          id: data.id || Date.now().toString(),
          goal_id: goalStore.activeGoal!.id,
          sender_type: data.sender_type,
          sender_agent_id: null,
          sender_name: data.sender_name,
          content: data.content,
          message_type: "chat",
          tokens_used: data.tokens_used || 0,
          cost_usd: data.cost_usd || 0,
          created_at: new Date().toISOString(),
        });
      }),
      ws.on("agent_status", (data) => {
        agentStore.updateAgentStatus(data.agent_id, data.status);
      }),
      ws.on("task_update", (data) => {
        taskStore.updateTask(data.task_id, { status: data.status });
      }),
    ];

    return () => unsubs.forEach((fn) => fn());
  }, [goalStore.activeGoal?.id, ws.on]);

  // Периодическое обновление статуса
  useEffect(() => {
    if (!goalStore.activeGoal) return;
    const interval = setInterval(() => {
      statusStore.fetchStatus(goalStore.activeGoal!.id);
    }, 5000);
    return () => clearInterval(interval);
  }, [goalStore.activeGoal?.id]);

  // Обработчики
  const handleCreateGoal = useCallback(async (title: string, mode: "manager" | "discussion" | "auto") => {
    const goal = await goalStore.createGoal({
      title,
      distribution_mode: mode,
    });
    if (goal?.id) {
      setIsStarting(true);
      try {
        await api.orchestration.start(goal.id);
        await taskStore.fetchTasks(goal.id);
        await messageStore.fetchMessages(goal.id);
        await statusStore.fetchStatus(goal.id);
      } catch (e) {
        console.error("Auto-start error:", e);
      } finally {
        setIsStarting(false);
      }
      // Переключиться на чат после создания цели
      setActiveTab("chat");
    }
    return goal;
  }, []);

  const handleStartGoal = useCallback(async () => {
    if (!goalStore.activeGoal) return;
    setIsStarting(true);
    try {
      await api.orchestration.start(goalStore.activeGoal.id);
      await taskStore.fetchTasks(goalStore.activeGoal.id);
      await messageStore.fetchMessages(goalStore.activeGoal.id);
      await statusStore.fetchStatus(goalStore.activeGoal.id);
    } catch (e) {
      console.error("Start goal error:", e);
    } finally {
      setIsStarting(false);
    }
  }, [goalStore.activeGoal?.id]);

  const handleUserInput = useCallback(async (content: string, type: "command" | "edit" | "idea") => {
    if (!goalStore.activeGoal) return;
    try {
      await api.orchestration.userInput(goalStore.activeGoal.id, content, type);
      await messageStore.fetchMessages(goalStore.activeGoal.id);
      await taskStore.fetchTasks(goalStore.activeGoal.id);
    } catch (e) {
      console.error("User input error:", e);
    }
  }, [goalStore.activeGoal?.id]);

  const handleTabChange = useCallback((tab: MobileTab) => {
    if (tab === "new") {
      // Сбрасываем активную цель, переключаемся на чат для создания новой
      goalStore.setActiveGoal(null as any);
      setActiveTab("chat");
      return;
    }
    setActiveTab(tab);
  }, []);

  // Определяем заголовок для хедера
  const headerTitle = (() => {
    switch (activeTab) {
      case "chat":
        return goalStore.activeGoal?.title || "Новый проект";
      case "models":
        return "Модели";
      case "tasks":
        return "Задачи";
      case "profile":
        return "Профиль";
      default:
        return "XeroCode";
    }
  })();

  return (
    <div
      className="h-screen flex flex-col overflow-hidden"
      style={{
        backgroundColor: "var(--bg-base)",
        overflowX: "hidden",
      }}
    >
      {/* Верхний хедер */}
      <div
        className="flex items-center justify-between px-4 flex-shrink-0"
        style={{
          height: "var(--mobile-header-height, 56px)",
          paddingTop: "env(safe-area-inset-top, 0px)",
          backgroundColor: "rgba(15, 15, 18, 0.90)",
          backdropFilter: "blur(24px)",
          WebkitBackdropFilter: "blur(24px)",
          borderBottom: "1px solid rgba(255, 255, 255, 0.05)",
        }}
      >
        {/* Левая часть: кнопка назад (если есть активная цель) */}
        <div className="flex items-center gap-2 min-w-0 flex-1">
          {activeTab === "chat" && goalStore.activeGoal && (
            <button
              onClick={() => goalStore.setActiveGoal(null as any)}
              className="w-8 h-8 rounded-xl flex items-center justify-center active:bg-white/5"
            >
              <ArrowLeft size={18} style={{ color: "var(--text-secondary)" }} />
            </button>
          )}
          <h1
            className="text-[16px] font-semibold truncate"
            style={{ color: "var(--text-primary)" }}
          >
            {headerTitle}
          </h1>
        </div>

        {/* Правая часть */}
        <div className="flex items-center gap-1">
          {activeTab === "chat" && goalStore.activeGoal && (
            <span
              className="text-[10px] px-2 py-0.5 rounded-full"
              style={{
                backgroundColor: "var(--bg-elevated)",
                color: "var(--text-tertiary)",
                border: "1px solid var(--border-subtle)",
              }}
            >
              {goalStore.activeGoal.distribution_mode === "manager"
                ? "Менеджер"
                : goalStore.activeGoal.distribution_mode === "discussion"
                ? "Обсуждение"
                : "Авто"}
            </span>
          )}
        </div>
      </div>

      {/* Контент — переключение вкладок */}
      <div
        ref={containerRef}
        className="flex-1 min-h-0 overflow-hidden"
        style={{ touchAction: "pan-y" }}
      >
        <AnimatePresence mode="wait">
          {activeTab === "chat" && (
            <motion.div
              key="chat"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              transition={{ duration: 0.15 }}
              className="h-full"
            >
              <MobileChatView
                messages={messageStore.messages}
                agents={agentStore.agents}
                activeGoal={goalStore.activeGoal}
                isStarting={isStarting}
                onCreateGoal={handleCreateGoal}
                onStartGoal={handleStartGoal}
                onUserInput={handleUserInput}
              />
            </motion.div>
          )}

          {activeTab === "models" && (
            <motion.div
              key="models"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              transition={{ duration: 0.15 }}
              className="h-full"
            >
              <MobileModelsView
                agents={agentStore.agents}
                onAddModel={onShowModelSetup}
                onRemoveAgent={async (id) => {
                  await agentStore.removeAgent(id);
                }}
              />
            </motion.div>
          )}

          {activeTab === "tasks" && (
            <motion.div
              key="tasks"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              transition={{ duration: 0.15 }}
              className="h-full"
            >
              <MobileTaskView
                tasks={taskStore.tasks}
                agents={agentStore.agents}
              />
            </motion.div>
          )}

          {activeTab === "profile" && (
            <motion.div
              key="profile"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              transition={{ duration: 0.15 }}
              className="h-full"
            >
              <MobileProfileView
                user={user}
                onLogout={authStore.logout}
                onOpenProfile={onShowProfileSettings}
                onOpenPricing={onShowPricing}
              />
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Нижний таб-бар */}
      <BottomTabBar active={activeTab} onTabChange={handleTabChange} />
    </div>
  );
}
