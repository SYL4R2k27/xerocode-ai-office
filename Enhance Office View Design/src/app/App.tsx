import { useEffect, useState, useCallback, useRef, Component, type ReactNode, useSyncExternalStore } from "react";
import { Sidebar } from "./components/layout/Sidebar";
import { ContextPanel } from "./components/layout/ContextPanel";
import { ChatArea } from "./components/chat/ChatArea";
import { ModelSetup } from "./components/modals/ModelSetup";
import { ProfileSettings } from "./components/modals/ProfileSettings";
import { PricingPage } from "./components/modals/PricingPage";
import { AuthPage } from "./components/auth/AuthPage";
import { LandingPage } from "./components/landing/LandingPage";
import { CorporateLayout, type CorporatePage } from "./components/corporate/CorporateLayout";
import { Dashboard } from "./components/corporate/Dashboard";
import { ReportsPage } from "./components/corporate/ReportsPage";
import { KanbanBoard } from "./components/corporate/KanbanBoard";
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

import { ResizablePanelGroup, ResizablePanel, ResizableHandle } from "./components/ui/resizable";
import { useAgentStore, useGoalStore, useTaskStore, useMessageStore, useStatusStore } from "./store/useStore";
import { useAuthStore } from "./store/useAuthStore";
import { useWebSocket } from "./hooks/useWebSocket";
import { useKeyboardShortcuts } from "./hooks/useKeyboardShortcuts";
import { api } from "./lib/api";
import { OnboardingWizard } from "./components/modals/OnboardingWizard";
import { Toaster } from "sonner";
import type { ImperativePanelHandle } from "react-resizable-panels";

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
  const [previewLanguage, setPreviewLanguage] = useState("text");

  // Arena / Evolution mode
  const [arenaMode, setArenaMode] = useState<"battle" | "leaderboard" | null>(null);

  // Responsive
  const isMobile = useMediaQuery("(max-width: 767px)");
  const isTablet = useMediaQuery("(min-width: 768px) and (max-width: 1023px)");
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Resizable panel refs
  const contextPanelRef = useRef<ImperativePanelHandle>(null);
  const sidebarPanelRef = useRef<ImperativePanelHandle>(null);
  const [contextPanelOpen, setContextPanelOpen] = useState(true);

  // Auto-collapse sidebar on tablet, auto-hide on mobile
  useEffect(() => {
    if (isMobile && sidebarPanelRef.current && !sidebarPanelRef.current.isCollapsed()) {
      sidebarPanelRef.current.collapse();
    }
    if (isMobile && contextPanelRef.current && !contextPanelRef.current.isCollapsed()) {
      contextPanelRef.current.collapse();
    }
  }, [isMobile]);

  // Load saved panel sizes
  const savedSizes = JSON.parse(localStorage.getItem("ai-office-panel-sizes") || "[20, 55, 25]");

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

  const handleOpenInPreview = useCallback((code: string, language: string) => {
    setPreviewCode(code);
    setPreviewLanguage(language);
    if (contextPanelRef.current) {
      contextPanelRef.current.expand();
    }
  }, []);

  const handleToggleContextPanel = useCallback(() => {
    if (contextPanelRef.current) {
      if (contextPanelRef.current.isCollapsed()) {
        contextPanelRef.current.expand();
      } else {
        contextPanelRef.current.collapse();
      }
    }
  }, []);

  const handleToggleSidebar = useCallback(() => {
    if (sidebarPanelRef.current) {
      if (sidebarPanelRef.current.isCollapsed()) {
        sidebarPanelRef.current.expand();
      } else {
        sidebarPanelRef.current.collapse();
      }
    }
  }, []);

  // Guard: user must be loaded
  if (!authStore.user || !authStore.user.name) {
    return <div className="flex-1" style={{ backgroundColor: "var(--bg-base)" }} />;
  }

  const isCorporateEmbed = !!authStore.user?.organization_id;

  return (
    <>
      {/* Мобильный гамбургер */}
      {isMobile && !isCorporateEmbed && (
        <button
          onClick={() => {
            setMobileMenuOpen(!mobileMenuOpen);
            if (sidebarPanelRef.current) {
              if (sidebarPanelRef.current.isCollapsed()) sidebarPanelRef.current.expand();
              else sidebarPanelRef.current.collapse();
            }
          }}
          className="fixed top-3 left-3 z-50 p-2 rounded-lg"
          style={{
            backgroundColor: "var(--bg-elevated)",
            border: "1px solid var(--border-default)",
            color: "var(--text-secondary)",
          }}
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><line x1="3" y1="6" x2="21" y2="6" /><line x1="3" y1="12" x2="21" y2="12" /><line x1="3" y1="18" x2="21" y2="18" /></svg>
        </button>
      )}
      <ResizablePanelGroup
        direction="horizontal"
        className="h-full"
        onLayout={(sizes: number[]) => localStorage.setItem("ai-office-panel-sizes", JSON.stringify(sizes))}
      >
        {/* Sidebar — скрываем в корпоративном режиме (там свой навбар) */}
        {!isCorporateEmbed && (
          <>
            <ResizablePanel
              ref={sidebarPanelRef}
              defaultSize={isMobile ? 0 : isTablet ? 8 : (savedSizes[0] ?? 20)}
              minSize={isMobile ? 0 : isTablet ? 5 : 12}
              maxSize={isMobile ? 80 : 30}
              collapsible
              collapsedSize={0}
              className="min-w-0"
            >
              <Sidebar
                agents={agentStore.agents}
                goals={goalStore.goals}
                tasks={taskStore.tasks}
                activeGoal={goalStore.activeGoal}
                status={statusStore.status}
                connected={ws.connected}
                onSelectGoal={(g: any) => { setArenaMode(null); goalStore.setActiveGoal(g); }}
                onAddModel={() => setShowModelSetup(true)}
                onRemoveAgent={async (id) => { await agentStore.removeAgent(id); }}
                onNewGoal={() => { setArenaMode(null); goalStore.setActiveGoal(null as any); }}
                user={authStore.user}
                onLogout={authStore.logout}
                onOpenProfile={() => setShowProfileSettings(true)}
                arenaMode={arenaMode}
                onToggleArena={() => setArenaMode(arenaMode ? null : "battle")}
                toggleTheme={toggleTheme}
                resolvedTheme={resolvedTheme}
              />
            </ResizablePanel>

            <ResizableHandle withHandle />
          </>
        )}

        {/* Main Chat */}
        <ResizablePanel
          defaultSize={isCorporateEmbed ? 75 : (savedSizes[1] ?? 55)}
          minSize={30}
          className="min-w-0"
        >
          <ChatArea
            messages={messageStore.messages}
            agents={agentStore.agents}
            activeGoal={goalStore.activeGoal}
            goals={goalStore.goals}
            contextPanelOpen={contextPanelOpen}
            isStarting={isStarting}
            onToggleContextPanel={handleToggleContextPanel}
            onCreateGoal={handleCreateGoal}
            onStartGoal={handleStartGoal}
            onUserInput={handleUserInput}
            onOpenInPreview={handleOpenInPreview}
            arenaMode={arenaMode}
            onSetArenaMode={setArenaMode}
          />
        </ResizablePanel>

        <ResizableHandle withHandle />

        {/* Context Panel */}
        <ResizablePanel
          ref={contextPanelRef}
          defaultSize={isCorporateEmbed ? 25 : (savedSizes[2] ?? 25)}
          minSize={0}
          maxSize={40}
          collapsible
          collapsedSize={0}
          className="min-w-0"
          onCollapse={() => setContextPanelOpen(false)}
          onExpand={() => setContextPanelOpen(true)}
        >
          <ContextPanel
            tasks={taskStore.tasks}
            agents={agentStore.agents}
            messages={messageStore.messages}
            activeGoal={goalStore.activeGoal}
            previewCode={previewCode}
            previewLanguage={previewLanguage}
            arenaMode={arenaMode}
          />
        </ResizablePanel>
      </ResizablePanelGroup>

      {/* Model Setup Modal */}
      {showModelSetup && (
        <ModelSetup
          agents={agentStore.agents}
          onAddAgent={agentStore.addAgent}
          onRemoveAgent={agentStore.removeAgent}
          onClose={() => { setShowModelSetup(false); agentStore.fetchAgents(); }}
        />
      )}

      {/* Profile Settings Modal */}
      <ProfileSettings
        user={authStore.user!}
        open={showProfileSettings}
        onClose={() => setShowProfileSettings(false)}
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

  // Landing page state (must be before any conditional returns — React hooks rule)
  const [showLanding, setShowLanding] = useState(true);

  // Focus mode — корпоративный пользователь переключается в чистый чат
  const [focusMode, setFocusMode] = useState(false);

  // Arena state removed — now inside ChatInterface

  // Mobile detection
  const isMobileApp = useMediaQuery("(max-width: 767px)");

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
          <ModelSetup
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
  const isCorporate = isRealCorporate || (isAdmin && adminTestCorporate);
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
          onLogout={authStore.logout}
          onFocusMode={() => setFocusMode(true)}
        >
          {corporatePage === "dashboard" && (
            <Dashboard
              orgRole={orgRole}
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

          {corporatePage === "kanban" && (
            <KanbanBoard
              onReviewAction={(taskId, action, comment) => {
                api.tasks.review(taskId, action, comment).catch(console.error);
              }}
            />
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
            <div className="h-full flex items-center justify-center" style={{ backgroundColor: "var(--bg-base)" }}>
              <div className="text-center">
                <div className="text-[48px] mb-3">⚙️</div>
                <h2 className="text-[18px] font-semibold mb-2" style={{ color: "var(--text-primary)" }}>
                  Настройки
                </h2>
                <p className="text-[13px]" style={{ color: "var(--text-secondary)" }}>
                  Настройки организации в разработке
                </p>
              </div>
            </div>
          )}
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
                // Если реальная организация — временно "отключаем" корп вид
                if (isRealCorporate) {
                  // Перезагрузка уберёт тест-флаг, но для моментального переключения:
                  window.location.reload();
                }
              } else {
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
            {isCorporate ? "← Обычный вид" : "🏢 Corp View"}
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
          onClick={() => setAdminTestCorporate(true)}
          className="fixed bottom-4 right-4 z-50 flex items-center gap-2 px-3 py-2 rounded-xl text-[11px] font-medium transition-all hover:scale-105"
          style={{
            backgroundColor: "rgba(147,51,234,0.15)",
            border: "1px solid rgba(147,51,234,0.3)",
            color: "#9333ea",
            backdropFilter: "blur(8px)",
          }}
          title="Переключить на корпоративный вид (тест)"
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
