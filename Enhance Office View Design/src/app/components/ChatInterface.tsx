/**
 * ChatInterface — основной чат-интерфейс (Free/PRO/ULTIMA + corporate "ИИ Офис" таб).
 * Извлечено из App.tsx — 485 строк UI-логики чата с DAG-оркестрацией.
 */
import { useEffect, useState, useCallback, useRef } from "react";
import { SidebarV2 } from "./layout/SidebarV2";
import { ChatAreaV2 } from "./chat/ChatAreaV2";
import { ContextPanelV2 } from "./layout/ContextPanelV2";
import { ModelSetupV2 } from "./modals/ModelSetupV2";
import { BottomNavV2 } from "./layout/BottomNavV2";
import { MobileDrawer } from "./layout/MobileDrawer";
import { ProfileSettings } from "./modals/ProfileSettings";
import { PricingPage } from "./modals/PricingPage";
import { useAgentStore, useGoalStore, useTaskStore, useMessageStore, useStatusStore } from "../store/useStore";
import { useAuthStore } from "../store/useAuthStore";
import { useWebSocket } from "../hooks/useWebSocket";
import { useTheme } from "../hooks/useTheme";
import { useMediaQuery } from "../hooks/useMediaQuery";
import { api } from "../lib/api";

/** Обычный чат-интерфейс. */
export function ChatInterface({
  showModelSetup,
  setShowModelSetup,
  showProfileSettings,
  setShowProfileSettings,
  showPricing,
  setShowPricing,
}: {
  showModelSetup: boolean;
  setShowModelSetup: (v: boolean) => void;
  showProfileSettings: boolean;
  setShowProfileSettings: (v: boolean) => void;
  showPricing: boolean;
  setShowPricing: (v: boolean) => void;
}) {
  const authStore = useAuthStore();
  const agentStore = useAgentStore();
  const goalStore = useGoalStore();
  const taskStore = useTaskStore();
  const messageStore = useMessageStore();
  const statusStore = useStatusStore();
  const { toggleTheme, resolvedTheme } = useTheme();

  const ws = useWebSocket(goalStore.activeGoal?.id || null);

  const [isStarting, setIsStarting] = useState(false);
  const [previewCode, setPreviewCode] = useState<string | null>(null);
  const streamAbortRef = useRef<AbortController | null>(null);
  const [isStreaming, setIsStreaming] = useState(false);

  const [useKnowledgeBase, setUseKnowledgeBase] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [previewLanguage, setPreviewLanguage] = useState("text");

  // Arena / Evolution mode
  const [arenaMode, setArenaMode] = useState<"battle" | "leaderboard" | null>(null);

  // Responsive
  const isMobile = useMediaQuery("(max-width: 767px)");
  const [contextPanelOpen, setContextPanelOpen] = useState(false);
  const [mobileTab, setMobileTab] = useState<"chat" | "history" | "models" | "profile">("chat");
  const [mobileDrawerOpen, setMobileDrawerOpen] = useState(false);
  const [orchMode, setOrchMode] = useState<"manager" | "team" | "swarm" | "auction" | "xerocode_ai">(
    () => (localStorage.getItem("xerocode_mode") as any) || "xerocode_ai",
  );

  // Initial data load
  useEffect(() => {
    agentStore.fetchAgents();
    goalStore.fetchGoals();
  }, []);

  // Fetch tasks & messages when active goal changes
  useEffect(() => {
    if (goalStore.activeGoal) {
      taskStore.fetchTasks(goalStore.activeGoal.id);
      messageStore.fetchMessages(goalStore.activeGoal.id);
      statusStore.fetchStatus(goalStore.activeGoal.id);
    }
  }, [goalStore.activeGoal?.id]);

  // WebSocket events → update stores
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

  // Refresh status periodically
  useEffect(() => {
    if (!goalStore.activeGoal) return;
    const interval = setInterval(() => {
      statusStore.fetchStatus(goalStore.activeGoal!.id);
    }, 5000);
    return () => clearInterval(interval);
  }, [goalStore.activeGoal?.id]);

  // Handlers
  const handleCreateGoal = useCallback(async (title: string, mode: "manager" | "discussion" | "auto") => {
    // Shorten title to meaningful summary (first sentence or 60 chars)
    let shortTitle = title.trim();
    const firstSentenceEnd = shortTitle.search(/[.!?\n]/);
    if (firstSentenceEnd > 0 && firstSentenceEnd < 80) {
      shortTitle = shortTitle.substring(0, firstSentenceEnd);
    } else if (shortTitle.length > 60) {
      shortTitle = shortTitle.substring(0, 57) + "...";
    }

    // Clear previous messages before creating new goal
    messageStore.setMessages([]);

    const goal = await goalStore.createGoal({
      title: shortTitle,
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
      console.error("Failed to start goal:", e);
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

  /**
   * Streaming send — instant chat UX.
   * Adds user message immediately, then streams assistant reply token-by-token.
   * Used when there's no active goal OR goal has 0/1 agents (direct chat mode).
   */
  const handleStreamSend = useCallback(async (content: string, goalId?: string) => {
    const now = new Date().toISOString();
    const userMsgId = `user-${Date.now()}`;
    const asstMsgId = `asst-${Date.now()}`;

    messageStore.addMessage({
      id: userMsgId,
      goal_id: goalId || "",
      sender_type: "user",
      sender_agent_id: null,
      sender_name: authStore.user?.name || "Вы",
      content,
      message_type: "chat",
      tokens_used: 0,
      cost_usd: 0,
      created_at: now,
    } as any);

    const defaultModel = "llama-3.3-70b-versatile";
    messageStore.addMessage({
      id: asstMsgId,
      goal_id: goalId || "",
      sender_type: "agent",
      sender_agent_id: null,
      sender_name: "AI",
      content: "",
      message_type: "chat",
      tokens_used: 0,
      cost_usd: 0,
      created_at: now,
      streaming: true,
      activity: "Подключение",
      model: defaultModel,
    } as any);

    const abort = new AbortController();
    streamAbortRef.current = abort;
    setIsStreaming(true);
    try {
      let firstChunk = true;
      for await (const ev of api.stream.chat({ goal_id: goalId, prompt: content }, abort.signal)) {
        if (ev.type === "meta") {
          // Real model + source from backend (BYOK or platform)
          const m = ev as any;
          messageStore.updateMessage(asstMsgId, {
            activity: m.source === "byok" ? "Думает (свой ключ)" : "Думает",
            model: m.model || defaultModel,
          } as any);
        } else if (ev.type === "chunk" && ev.content) {
          if (firstChunk) {
            messageStore.updateMessage(asstMsgId, { activity: "Генерирует" } as any);
            firstChunk = false;
          }
          messageStore.appendToMessage(asstMsgId, ev.content);
        } else if (ev.type === "done") {
          messageStore.updateMessage(asstMsgId, {
            id: ev.message_id || asstMsgId,
            streaming: false,
            activity: undefined,
          } as any);
        } else if (ev.type === "error") {
          messageStore.updateMessage(asstMsgId, { streaming: false, activity: undefined } as any);
          messageStore.appendToMessage(asstMsgId, `\n\n_Ошибка: ${ev.message}_`);
        }
      }
    } catch (e: any) {
      const aborted = e?.name === "AbortError";
      messageStore.updateMessage(asstMsgId, { streaming: false, activity: undefined } as any);
      if (aborted) {
        messageStore.appendToMessage(asstMsgId, `\n\n_⏹ Остановлено пользователем_`);
      } else {
        messageStore.appendToMessage(asstMsgId, `\n\n_Ошибка соединения: ${e?.message || e}_`);
      }
    } finally {
      setIsStreaming(false);
      streamAbortRef.current = null;
    }
  }, []);

  const handleStopStream = useCallback(() => {
    streamAbortRef.current?.abort();
  }, []);

  /**
   * Send via 5-mode orchestrator. SSE stream of node progress + final result.
   * Used when orchMode is set (all 5 modes go here).
   */
  const handleModeSend = useCallback(async (content: string, goalId?: string) => {
    const now = new Date().toISOString();
    const userMsgId = `user-${Date.now()}`;
    const asstMsgId = `asst-${Date.now()}`;

    messageStore.addMessage({
      id: userMsgId, goal_id: goalId || "", sender_type: "user",
      sender_agent_id: null, sender_name: authStore.user?.name || "Вы",
      content, message_type: "chat", tokens_used: 0, cost_usd: 0, created_at: now,
    } as any);

    messageStore.addMessage({
      id: asstMsgId, goal_id: goalId || "", sender_type: "agent",
      sender_agent_id: null, sender_name: "XeroCode",
      content: "", message_type: "chat", tokens_used: 0, cost_usd: 0, created_at: now,
      streaming: true, activity: "Запуск", model: orchMode,
    } as any);

    const abort = new AbortController();
    streamAbortRef.current = abort;
    setIsStreaming(true);
    try {
      for await (const ev of api.modes.run({ mode: orchMode as any, query: content }, abort.signal)) {
        if (ev.type === "start") {
          messageStore.updateMessage(asstMsgId, { activity: `Режим: ${orchMode}`, model: orchMode } as any);
        } else if (ev.type === "node_status") {
          const label = ev.status === "running" ? `${ev.node_id} работает`
            : ev.status === "completed" ? `${ev.node_id} готов`
            : ev.status === "failed" ? `${ev.node_id} ошибка`
            : ev.node_id;
          messageStore.updateMessage(asstMsgId, { activity: label } as any);
        } else if (ev.type === "done") {
          messageStore.updateMessage(asstMsgId, {
            streaming: false, activity: undefined,
            content: ev.result || "(нет ответа)",
            log_id: ev.log_id,
          } as any);
        } else if (ev.type === "error") {
          messageStore.updateMessage(asstMsgId, { streaming: false, activity: undefined } as any);
          messageStore.appendToMessage(asstMsgId, `\n\n_Ошибка: ${ev.message}_`);
        }
      }
    } catch (e: any) {
      const aborted = e?.name === "AbortError";
      messageStore.updateMessage(asstMsgId, { streaming: false, activity: undefined } as any);
      if (aborted) messageStore.appendToMessage(asstMsgId, `\n\n_⏹ Остановлено_`);
      else messageStore.appendToMessage(asstMsgId, `\n\n_Ошибка: ${e?.message || e}_`);
    } finally {
      setIsStreaming(false);
      streamAbortRef.current = null;
    }
  }, [orchMode]);

  const handleOpenInPreview = useCallback((code: string, language: string) => {
    setPreviewCode(code);
    setPreviewLanguage(language);
    setContextPanelOpen(true);
  }, []);

  // Guard: user must be loaded
  if (!authStore.user || !authStore.user.name) {
    return <div className="flex-1" style={{ backgroundColor: "var(--bg-base)" }} />;
  }

  const isCorporateEmbed = false; // Показываем sidebar всегда, в т.ч. в корп. режиме

  return (
    <>
      <div className="flex h-full" style={{ backgroundColor: "var(--bg-base)" }}>
          {/* V2 Sidebar */}
          {!isMobile && (
            <SidebarV2
              goals={goalStore.goals.map(g => ({ id: g.id, title: g.title, status: g.status, created_at: g.created_at || "" }))}
              activeGoalId={goalStore.activeGoal?.id || null}
              onSelectGoal={(id) => { setArenaMode(null); const g = goalStore.goals.find(g => g.id === id); if (g) goalStore.setActiveGoal(g); }}
              onNewChat={() => { setArenaMode(null); goalStore.setActiveGoal(null as any); messageStore.setMessages([]); taskStore.setTasks?.([]); }}
              userName={authStore.user?.name || "User"}
              userPlan={authStore.user?.plan || "free"}
              onSettings={() => setShowProfileSettings(true)}
              onPricing={() => setShowPricing(true)}
              onLogout={authStore.logout}
              onArena={() => setArenaMode(arenaMode ? null : "battle")}
              collapsed={sidebarCollapsed}
              onToggleCollapse={() => setSidebarCollapsed(!sidebarCollapsed)}
              connected={ws.connected}
              toggleTheme={toggleTheme}
              resolvedTheme={resolvedTheme}
            />
          )}

          {/* V2 Chat Area */}
          <div className="flex-1 min-w-0 flex">
            <div className="flex-1 min-w-0">
              <ChatAreaV2
                goal={goalStore.activeGoal ? { id: goalStore.activeGoal.id, title: goalStore.activeGoal.title, status: goalStore.activeGoal.status, distribution_mode: (goalStore.activeGoal as any).distribution_mode || "manager" } : null}
                messages={messageStore.messages}
                agents={agentStore.agents}
                onSendMessage={async (content) => {
                  // All 5 modes now go through DAG orchestrator (api.modes.run)
                  await handleModeSend(content, goalStore.activeGoal?.id);
                }}
                onCreateGoal={handleCreateGoal}
                onStartGoal={handleStartGoal}
                isStarting={isStarting}
                goalStarted={messageStore.messages.length > 0 || (goalStore.activeGoal?.status === "active")}
                useKnowledgeBase={useKnowledgeBase}
                onToggleKB={() => setUseKnowledgeBase(!useKnowledgeBase)}
                onModeChange={() => {}}
                onAddAgent={() => setShowModelSetup(true)}
                onRemoveAgent={async (id) => { await agentStore.removeAgent(id); }}
                onOpenModelSetup={() => setShowModelSetup(true)}
                showModelSetup={showModelSetup}
                setShowModelSetup={setShowModelSetup}
                isAdmin={authStore.user?.is_admin}
                arenaMode={arenaMode}
                onSetArenaMode={setArenaMode}
                tasks={taskStore.tasks}
                onExecuteTask={(taskId, prompt) => {
                  if (goalStore.activeGoal) handleUserInput(prompt, "command");
                }}
                onOpenInPreview={handleOpenInPreview}
                onToggleContextPanel={() => setContextPanelOpen(!contextPanelOpen)}
                isStreaming={isStreaming}
                onStopStream={handleStopStream}
                messagesLoading={messageStore.loading}
                mode={orchMode}
                onModeSelectorChange={(m) => {
                  setOrchMode(m);
                  localStorage.setItem("xerocode_mode", m);
                }}
              />
            </div>

            {/* V2 Context Panel (slide-in) */}
            <ContextPanelV2
              open={contextPanelOpen || !!previewCode}
              onClose={() => { setContextPanelOpen(false); setPreviewCode(null); }}
              tasks={taskStore.tasks}
              messages={messageStore.messages}
              activeGoal={goalStore.activeGoal}
              previewCode={previewCode}
              previewLanguage={previewLanguage}
            />
          </div>

          {/* Mobile bottom nav + sidebar drawer */}
          {isMobile && (
            <>
              <div style={{ paddingBottom: "calc(64px + var(--safe-bottom))" }} />
              <BottomNavV2
                activeTab={mobileTab}
                onTabChange={(tab) => {
                  setMobileTab(tab);
                  if (tab === "history") setMobileDrawerOpen(true);
                  else if (tab === "models") setShowModelSetup(true);
                  else if (tab === "profile") setShowProfileSettings(true);
                }}
                onNewChat={() => {
                  setArenaMode(null);
                  goalStore.setActiveGoal(null as any);
                  messageStore.setMessages([]);
                  taskStore.setTasks?.([]);
                }}
              />
              <MobileDrawer open={mobileDrawerOpen} onClose={() => { setMobileDrawerOpen(false); setMobileTab("chat"); }}>
                <SidebarV2
                  goals={goalStore.goals.map(g => ({ id: g.id, title: g.title, status: g.status, created_at: g.created_at || "" }))}
                  activeGoalId={goalStore.activeGoal?.id || null}
                  onSelectGoal={(id) => {
                    setArenaMode(null);
                    const g = goalStore.goals.find(g => g.id === id);
                    if (g) goalStore.setActiveGoal(g);
                    setMobileDrawerOpen(false);
                    setMobileTab("chat");
                  }}
                  onNewChat={() => {
                    setArenaMode(null);
                    goalStore.setActiveGoal(null as any);
                    messageStore.setMessages([]);
                    taskStore.setTasks?.([]);
                    setMobileDrawerOpen(false);
                    setMobileTab("chat");
                  }}
                  userName={authStore.user?.name || "User"}
                  userPlan={authStore.user?.plan || "free"}
                  onSettings={() => { setShowProfileSettings(true); setMobileDrawerOpen(false); }}
                  onPricing={() => { setShowPricing(true); setMobileDrawerOpen(false); }}
                  onLogout={authStore.logout}
                  onArena={() => { setArenaMode(arenaMode ? null : "battle"); setMobileDrawerOpen(false); }}
                  collapsed={false}
                  onToggleCollapse={() => {}}
                  connected={ws.connected}
                  toggleTheme={toggleTheme}
                  resolvedTheme={resolvedTheme}
                />
              </MobileDrawer>
            </>
          )}
        </div>

      {/* Model Setup Modal */}
      {showModelSetup && (
        <ModelSetupV2
          agents={agentStore.agents}
          onAddAgent={agentStore.addAgent}
          onRemoveAgent={agentStore.removeAgent}
          onClose={() => { setShowModelSetup(false); setMobileTab("chat"); agentStore.fetchAgents(); }}
        />
      )}

      {/* Profile Settings Modal */}
      <ProfileSettings
        user={authStore.user!}
        open={showProfileSettings}
        onClose={() => { setShowProfileSettings(false); setMobileTab("chat"); }}
        onUserUpdate={() => {
          authStore.loadUser();
        }}
        onOpenPricing={() => setShowPricing(true)}
      />

      {/* Pricing Page */}
      <PricingPage
        open={showPricing}
        onClose={() => setShowPricing(false)}
        currentPlan={authStore.user!.plan}
      />
    </>
  );
}
