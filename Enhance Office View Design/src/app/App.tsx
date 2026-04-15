import { useEffect, useState, useCallback, useRef, Component, lazy, Suspense, type ReactNode, useSyncExternalStore } from "react";
import { ProfileSettings } from "./components/modals/ProfileSettings";
import { PricingPage } from "./components/modals/PricingPage";
import { AuthPage } from "./components/auth/AuthPage";
import { LandingPage } from "./components/landing/LandingPage";
import { CorporateLayout, type CorporatePage } from "./components/corporate/CorporateLayout";
import { ModelSetupV2 } from "./components/modals/ModelSetupV2";

// Heavy corporate pages — lazy-loaded (code-splitting, cut main bundle by ~400kb)
const Dashboard = lazy(() => import("./components/corporate/Dashboard").then(m => ({ default: m.Dashboard })));
const ReportsPage = lazy(() => import("./components/corporate/ReportsPage").then(m => ({ default: m.ReportsPage })));
const SettingsPage = lazy(() => import("./components/corporate/SettingsPage").then(m => ({ default: m.SettingsPage })));
const WorkflowPage = lazy(() => import("./components/corporate/WorkflowPage").then(m => ({ default: m.WorkflowPage })));
const DocumentsPage = lazy(() => import("./components/corporate/DocumentsPage").then(m => ({ default: m.DocumentsPage })));
const SkillsPage = lazy(() => import("./components/corporate/SkillsPage").then(m => ({ default: m.SkillsPage })));
const CRMPage = lazy(() => import("./components/corporate/CRMPage").then(m => ({ default: m.CRMPage })));
const KnowledgePage = lazy(() => import("./components/corporate/KnowledgePage").then(m => ({ default: m.KnowledgePage })));
const ResearchPage = lazy(() => import("./components/corporate/ResearchPage").then(m => ({ default: m.ResearchPage })));
const CalendarPage = lazy(() => import("./components/corporate/CalendarPage").then(m => ({ default: m.CalendarPage })));
const ChannelsPage = lazy(() => import("./components/corporate/ChannelsPage").then(m => ({ default: m.ChannelsPage })));
const AdminTrainingPage = lazy(() => import("./components/admin/AdminTrainingPage").then(m => ({ default: m.AdminTrainingPage })));
const DocumentRegistryPage = lazy(() => import("./components/corporate/DocumentRegistryPage").then(m => ({ default: m.DocumentRegistryPage })));
const HRPage = lazy(() => import("./components/corporate/HRPage").then(m => ({ default: m.HRPage })));
const AnalyticsPage = lazy(() => import("./components/corporate/AnalyticsPage").then(m => ({ default: m.AnalyticsPage })));
const IntegrationsPage = lazy(() => import("./components/corporate/IntegrationsPage").then(m => ({ default: m.IntegrationsPage })));
const EDOPage = lazy(() => import("./components/corporate/EDOPage").then(m => ({ default: m.EDOPage })));
const AICopilot = lazy(() => import("./components/corporate/AICopilot").then(m => ({ default: m.AICopilot })));
const KanbanBoard = lazy(() => import("./components/corporate/KanbanBoard").then(m => ({ default: m.KanbanBoard })));
const GanttPage = lazy(() => import("./components/corporate/GanttPage").then(m => ({ default: m.GanttPage })));
const TeamPage = lazy(() => import("./components/corporate/TeamPage").then(m => ({ default: m.TeamPage })));
const MobileLayout = lazy(() => import("./components/mobile/MobileLayout").then(m => ({ default: m.MobileLayout })));
// Arena components imported inside ChatInterface
import { useTheme } from "./hooks/useTheme";

/* ErrorBoundary для Corp View */
function PageLoader() {
  return (
    <div className="flex items-center justify-center h-full" style={{ backgroundColor: "var(--bg-base)" }}>
      <div className="text-[13px] animate-pulse" style={{ color: "var(--text-tertiary)" }}>
        Загрузка…
      </div>
    </div>
  );
}

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


import { ChatInterface } from "./components/ChatInterface";


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
        <Suspense fallback={<PageLoader />}>
          <MobileLayout
            user={user}
            onShowModelSetup={() => setShowModelSetup(true)}
            onShowProfileSettings={() => setShowProfileSettings(true)}
            onShowPricing={() => setShowPricing(true)}
          />
        </Suspense>

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
          isAdmin={isAdmin}
          onLogout={authStore.logout}
          onFocusMode={() => setFocusMode(true)}
        >
          <Suspense fallback={<PageLoader />}>
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

          {corporatePage === "admin_training" && isAdmin && (
            <AdminTrainingPage />
          )}

          </Suspense>
          {/* AI Copilot floating widget */}
          <Suspense fallback={null}>
            <AICopilot currentPage={corporatePage} />
          </Suspense>
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
