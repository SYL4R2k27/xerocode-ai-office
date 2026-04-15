import { useEffect, useState, useCallback, useRef, Component, type ReactNode, useSyncExternalStore } from "react";
import { SidebarV2 } from "./components/layout/SidebarV2";
import { ChatAreaV2 } from "./components/chat/ChatAreaV2";
import { ContextPanelV2 } from "./components/layout/ContextPanelV2";
import { ModelSetupV2 } from "./components/modals/ModelSetupV2";
import { BottomNavV2 } from "./components/layout/BottomNavV2";
import { MobileDrawer } from "./components/layout/MobileDrawer";
import { ProfileSettings } from "./components/modals/ProfileSettings";
import { PricingPage } from "./components/modals/PricingPage";
import { AuthPage } from "./components/auth/AuthPage";
import { LandingPage } from "./components/landing/LandingPage";
import { CorporateLayout, type CorporatePage } from "./components/corporate/CorporateLayout";
import { Dashboard } from "./components/corporate/Dashboard";
import { ReportsPage } from "./components/corporate/ReportsPage";
import { SettingsPage } from "./components/corporate/SettingsPage";
import { WorkflowPage } from "./components/corporate/WorkflowPage";
import { DocumentsPage } from "./components/corporate/DocumentsPage";
import { SkillsPage } from "./components/corporate/SkillsPage";
import { CRMPage } from "./components/corporate/CRMPage";
import { KnowledgePage } from "./components/corporate/KnowledgePage";
import { ResearchPage } from "./components/corporate/ResearchPage";
import { CalendarPage } from "./components/corporate/CalendarPage";
import { ChannelsPage } from "./components/corporate/ChannelsPage";
import { DocumentRegistryPage } from "./components/corporate/DocumentRegistryPage";
import { HRPage } from "./components/corporate/HRPage";
import { AnalyticsPage } from "./components/corporate/AnalyticsPage";
import { IntegrationsPage } from "./components/corporate/IntegrationsPage";
import { EDOPage } from "./components/corporate/EDOPage";
import { AICopilot } from "./components/corporate/AICopilot";
import { KanbanBoard } from "./components/corporate/KanbanBoard";
import { GanttPage } from "./components/corporate/GanttPage";
import { TeamPage } from "./components/corporate/TeamPage";
import { MobileLayout } from "./components/mobile/MobileLayout";
// Arena components imported inside ChatInterface
import { useTheme } from "./hooks/useTheme";

/* ErrorBoundary для Corp View */
class CorpErrorBoundary extends Component<{children: ReactNode; fallback: ReactNode}, {hasError: boolean}> {
  state = { hasError: false };
  static getDerivedStateFromError() { return { hasError: true }; }
  componentDidCatch(e: Error) { console.error("Corp View error:", e); }
  render() { return this.state.hasError ? this.props.fallback : this.props.children; }
}
/* Responsive helpers */
function useMediaQuery(query: string): boolean {
  const subscribe = useCallback((cb: () => void) => {
    const mql = window.matchMedia(query);
    mql.addEventListener("change", cb);
    return () => mql.removeEventListener("change", cb);
  }, [query]);
  const getSnapshot = useCallback(() => window.matchMedia(query).matches, [query]);
  const getServerSnapshot = useCallback(() => false, []);
  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}

import { useAgentStore, useGoalStore, useTaskStore, useMessageStore, useStatusStore } from "./store/useStore";
import { useAuthStore } from "./store/useAuthStore";
import { useWebSocket } from "./hooks/useWebSocket";
import { useKeyboardShortcuts } from "./hooks/useKeyboardShortcuts";
import { api } from "./lib/api";
import { OnboardingWizard } from "./components/modals/OnboardingWizard";
import { Toaster } from "sonner";

/** Обычный чат-интерфейс (для Free/PRO/ULTIMA и для corporate "ИИ Офис" вкладки). */
function ChatInterface({
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

export default function App() {
  const authStore = useAuthStore();
  const { toggleTheme, resolvedTheme } = useTheme();

  const [showModelSetup, setShowModelSetup] = useState(false);
  const [showProfileSettings, setShowProfileSettings] = useState(false);
  const [showPricing, setShowPricing] = useState(false);

  // Onboarding wizard
  const [showOnboarding, setShowOnboarding] = useState(() => {
    return !localStorage.getItem("ai-office-onboarding-done");
  });

  const handleOnboardingComplete = useCallback(() => {
    localStorage.setItem("ai-office-onboarding-done", "true");
    setShowOnboarding(false);
  }, []);

  // Corporate state
  const [corporatePage, setCorporatePage] = useState<CorporatePage>("dashboard");
  // Admin: кнопка переключения профиля для тестов
  const [adminTestCorporate, setAdminTestCorporate] = useState(false);
  const [adminForceNonCorp, setAdminForceNonCorp] = useState(false);

  // Landing page state (must be before any conditional returns — React hooks rule)
  const [showLanding, setShowLanding] = useState(true);

  // Focus mode — корпоративный пользователь переключается в чистый чат
  const [focusMode, setFocusMode] = useState(false);

  // Arena state removed — now inside ChatInterface

  // Mobile detection
  const isMobileApp = useMediaQuery("(max-width: 767px)");

  // OAuth callback: extract token from URL fragment after redirect.
  useEffect(() => {
    const path = window.location.pathname;
    const hash = window.location.hash;
    if (path === "/auth/callback" || hash.startsWith("#token=")) {
      const m = hash.match(/token=([^&]+)/);
      if (m && m[1]) {
        localStorage.setItem("ai_office_token", decodeURIComponent(m[1]));
        window.history.replaceState({}, "", "/");
        authStore.loadUser();
      }
    }
    // Show OAuth error toast if backend redirected with ?oauth_error=
    const params = new URLSearchParams(window.location.search);
    if (params.get("oauth_error")) {
      console.warn("OAuth error:", params.get("oauth_error"));
      window.history.replaceState({}, "", "/");
    }
  }, []);

  // Keyboard shortcuts (must be before any early returns per React hooks rules)
  useKeyboardShortcuts({
    onCloseModal: () => {
      if (showPricing) setShowPricing(false);
      else if (showProfileSettings) setShowProfileSettings(false);
      else if (showModelSetup) setShowModelSetup(false);
    },
  });

  // Загрузка — ждём проверку токена
  if (authStore.loading && !authStore.user) {
    return (
      <div
        className="flex items-center justify-center h-screen"
        style={{ backgroundColor: "var(--bg-base)" }}
      >
        <div className="text-[14px] animate-pulse" style={{ color: "var(--text-tertiary)" }}>
          Загрузка...
        </div>
      </div>
    );
  }

  // Не авторизован — показываем лендинг или форму входа
  if (!authStore.user) {
    return (
      <>
        {showLanding ? (
          <LandingPage onLogin={() => setShowLanding(false)} />
        ) : (
          <AuthPage
            onLogin={authStore.login}
            onRegister={authStore.register}
            loading={authStore.loading}
            error={authStore.error}
          />
        )}
        <Toaster
          theme="dark"
          position="bottom-right"
          toastOptions={{
            style: {
              background: "var(--bg-elevated)",
              border: "1px solid var(--border-default)",
              color: "var(--text-primary)",
            },
          }}
        />
      </>
    );
  }

  // Безопасная проверка — user может быть null или неполный во время загрузки
  const user = authStore.user;
  if (!user || !user.email || !user.name) {
    return (
      <div className="flex items-center justify-center h-screen" style={{ backgroundColor: "var(--bg-base)" }}>
        <div className="text-[14px] animate-pulse" style={{ color: "var(--text-tertiary)" }}>Загрузка...</div>
      </div>
    );
  }

  // Мобильная версия — полностью отдельный layout
  if (isMobileApp) {
    return (
      <>
        <MobileLayout
          user={user}
          onShowModelSetup={() => setShowModelSetup(true)}
          onShowProfileSettings={() => setShowProfileSettings(true)}
          onShowPricing={() => setShowPricing(true)}
        />

        {/* Модалки поверх мобильного layout */}
        {showModelSetup && (
          <ModelSetupV2
            agents={[]}
            onAddAgent={async () => ({} as any)}
            onRemoveAgent={async () => {}}
            onClose={() => setShowModelSetup(false)}
          />
        )}
        <ProfileSettings
          user={user}
          open={showProfileSettings}
          onClose={() => setShowProfileSettings(false)}
          onUserUpdate={() => authStore.loadUser()}
          onOpenPricing={() => setShowPricing(true)}
        />
        <PricingPage
          open={showPricing}
          onClose={() => setShowPricing(false)}
          currentPlan={user.plan}
        />
        <Toaster
          theme="dark"
          position="top-center"
          toastOptions={{
            style: {
              background: "var(--bg-elevated)",
              border: "1px solid var(--border-default)",
              color: "var(--text-primary)",
            },
          }}
        />
      </>
    );
  }

  // Проверяем, корпоративный ли пользователь
  const isRealCorporate = !!(user.organization_id && user.org_role);
  const isAdmin = user.plan === "admin" || user.is_admin;
  const isCorporate = (isRealCorporate || (isAdmin && adminTestCorporate)) && !adminForceNonCorp;
  const orgRole = isRealCorporate
    ? (user.org_role || "member") as "owner" | "manager" | "member"
    : "owner";
  const orgName = isRealCorporate
    ? (user.organization_name || "Организация")
    : "Тестовая организация";

  // Корпоративный пользователь в фокус-режиме → чистый чат
  if (isCorporate && focusMode) {
    return (
      <div className="h-screen overflow-hidden" style={{ backgroundColor: "var(--bg-base)" }}>
        <ChatInterface
          showModelSetup={showModelSetup}
          setShowModelSetup={setShowModelSetup}
          showProfileSettings={showProfileSettings}
          setShowProfileSettings={setShowProfileSettings}
          showPricing={showPricing}
          setShowPricing={setShowPricing}
        />

        {/* Кнопка выхода из фокус-режима */}
        <button
          onClick={() => setFocusMode(false)}
          className="fixed bottom-4 right-4 z-50 flex items-center gap-2 px-4 py-2.5 rounded-xl text-[12px] font-medium transition-all hover:scale-105"
          style={{
            backgroundColor: "rgba(90,191,173,0.15)",
            border: "1px solid rgba(90,191,173,0.3)",
            color: "#5ABFAD",
            backdropFilter: "blur(8px)",
          }}
          title="Вернуться в рабочее пространство"
        >
          📋 Пространство
        </button>

        <Toaster theme="dark" position="bottom-right" toastOptions={{ style: { background: "var(--bg-elevated)", border: "1px solid var(--border-default)", color: "var(--text-primary)" } }} />
      </div>
    );
  }

  // Корпоративный пользователь → CorporateLayout (с ErrorBoundary)
  if (isCorporate) {
    const corpFallback = (
      <div className="h-screen flex items-center justify-center" style={{ backgroundColor: "var(--bg-base)" }}>
        <div className="text-center p-8">
          <div className="text-4xl mb-4">⚠️</div>
          <h2 className="text-lg font-bold mb-2" style={{ color: "var(--text-primary)" }}>Ошибка корпоративного режима</h2>
          <p className="text-sm mb-4" style={{ color: "var(--text-secondary)" }}>Переключаемся на обычный режим</p>
          <button onClick={() => { setAdminTestCorporate(false); setFocusMode(false); }} className="px-4 py-2 rounded-lg bg-purple-600 text-white text-sm">Обычный режим</button>
        </div>
      </div>
    );
    return (
      <CorpErrorBoundary fallback={corpFallback}>
      <>
        <CorporateLayout
          activePage={corporatePage}
          onNavigate={setCorporatePage}
          orgRole={orgRole}
          orgName={orgName}
          userName={user.name}
          professionalRole={(user as any).professional_role}
          professionalRoleLabel={(user as any).professional_role_label}
          userModules={(user as any).modules}
          onLogout={authStore.logout}
          onFocusMode={() => setFocusMode(true)}
        >
          {corporatePage === "dashboard" && (
            <Dashboard
              orgRole={orgRole}
              professionalRole={(user as any).professional_role}
              onNavigate={(page) => setCorporatePage(page as CorporatePage)}
            />
          )}

          {corporatePage === "chat" && (
            <div className="flex h-full overflow-hidden" style={{ backgroundColor: "var(--bg-base)" }}>
              <ChatInterface
                showModelSetup={showModelSetup}
                setShowModelSetup={setShowModelSetup}
                showProfileSettings={showProfileSettings}
                setShowProfileSettings={setShowProfileSettings}
                showPricing={showPricing}
                setShowPricing={setShowPricing}
              />
            </div>
          )}

          {corporatePage === "crm" && (
            <CRMPage orgRole={orgRole} />
          )}

          {corporatePage === "kanban" && (
            <KanbanBoard
              orgRole={orgRole}
              onReviewAction={(taskId, action, comment) => {
                api.tasks.review(taskId, action, comment).catch(console.error);
              }}
            />
          )}

          {corporatePage === "gantt" && (
            <GanttPage onOpenTask={(taskId) => { /* could navigate to task detail */ }} />
          )}

          {corporatePage === "workflows" && (
            <WorkflowPage orgRole={orgRole} />
          )}

          {corporatePage === "documents" && (
            <DocumentsPage />
          )}

          {corporatePage === "skills" && (
            <SkillsPage orgRole={orgRole} />
          )}

          {corporatePage === "knowledge" && (
            <KnowledgePage />
          )}

          {corporatePage === "research" && (
            <ResearchPage />
          )}

          {corporatePage === "calendar" && (
            <CalendarPage />
          )}

          {corporatePage === "channels" && (
            <ChannelsPage />
          )}

          {corporatePage === "doc_registry" && (
            <DocumentRegistryPage />
          )}

          {corporatePage === "hr" && (
            <HRPage />
          )}

          {corporatePage === "analytics" && (
            <AnalyticsPage />
          )}

          {corporatePage === "integrations" && (
            <IntegrationsPage />
          )}

          {corporatePage === "edo" && (
            <EDOPage />
          )}

          {corporatePage === "team" && (
            <TeamPage
              orgRole={orgRole}
              onInvite={(email, role) => {
                api.org.invite(email, role).catch(console.error);
              }}
            />
          )}

          {corporatePage === "reports" && (
            <ReportsPage orgRole={orgRole} />
          )}

          {corporatePage === "settings" && (
            <SettingsPage
              orgRole={orgRole}
              orgName={orgName}
              userName={user?.name || ""}
              userEmail={user?.email}
              onLogout={authStore.logout}
            />
          )}

          {/* AI Copilot floating widget */}
          <AICopilot currentPage={corporatePage} />
        </CorporateLayout>

        {/* Onboarding Wizard (corporate) */}
        {showOnboarding && authStore.user && (
          <OnboardingWizard onComplete={handleOnboardingComplete} />
        )}

        {/* Админ: кнопка переключения вида */}
        {isAdmin && (
          <button
            onClick={() => {
              if (isCorporate) {
                setAdminTestCorporate(false);
                setAdminForceNonCorp(true);
              } else {
                setAdminForceNonCorp(false);
                setAdminTestCorporate(true);
              }
            }}
            className="fixed bottom-4 right-4 z-50 flex items-center gap-2 px-3 py-2 rounded-xl text-[11px] font-medium transition-all hover:scale-105"
            style={{
              backgroundColor: isCorporate ? "rgba(239,68,68,0.15)" : "rgba(147,51,234,0.15)",
              border: `1px solid ${isCorporate ? "rgba(239,68,68,0.3)" : "rgba(147,51,234,0.3)"}`,
              color: isCorporate ? "#ef4444" : "#9333ea",
              backdropFilter: "blur(8px)",
            }}
            title={isCorporate ? "Переключить на обычный вид" : "Переключить на корпоративный вид"}
          >
            {isCorporate ? "← Обычный вид" : "Corp View"}
          </button>
        )}

        <Toaster
          theme="dark"
          position="bottom-right"
          toastOptions={{
            style: {
              background: "var(--bg-elevated)",
              border: "1px solid var(--border-default)",
              color: "var(--text-primary)",
            },
          }}
        />
      </>
      </CorpErrorBoundary>
    );
  }

  // Обычный пользователь (Free/PRO/ULTIMA) → стандартный чат-интерфейс
  return (
    <div className="h-screen overflow-hidden" style={{ backgroundColor: "var(--bg-base)" }}>
      <ChatInterface
        showModelSetup={showModelSetup}
        setShowModelSetup={setShowModelSetup}
        showProfileSettings={showProfileSettings}
        setShowProfileSettings={setShowProfileSettings}
        showPricing={showPricing}
        setShowPricing={setShowPricing}
      />

      {/* Onboarding Wizard */}
      {showOnboarding && authStore.user && (
        <OnboardingWizard onComplete={handleOnboardingComplete} />
      )}

      {/* Админ: универсальная кнопка переключения (корп ↔ обычный) */}
      {isAdmin && !isCorporate && (
        <button
          onClick={() => { setAdminTestCorporate(true); setAdminForceNonCorp(false); }}
          className="fixed bottom-4 right-4 z-50 flex items-center gap-2 px-3 py-2 rounded-xl text-[11px] font-medium transition-all hover:scale-105"
          style={{
            backgroundColor: "rgba(147,51,234,0.15)",
            border: "1px solid rgba(147,51,234,0.3)",
            color: "#9333ea",
            backdropFilter: "blur(8px)",
          }}
          title="Переключить на корпоративный вид"
        >
          Corp View
        </button>
      )}

      <Toaster
        theme="dark"
        position="bottom-right"
        toastOptions={{
          style: {
            background: "var(--bg-elevated)",
            border: "1px solid var(--border-default)",
            color: "var(--text-primary)",
          },
        }}
      />
    </div>
  );
}
