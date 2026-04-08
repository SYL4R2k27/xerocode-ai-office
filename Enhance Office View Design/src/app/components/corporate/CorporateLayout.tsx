import { useState, useCallback } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  Home,
  MessageSquare,
  KanbanSquare,
  Users,
  BarChart3,
  Settings,
  Menu,
  ChevronLeft,
  LogOut,
  Crown,
  Palette,
  Focus,
  GitBranch,
  FileText,
  Zap,
  BookOpen,
  TrendingUp,
  Bell,
  Search,
  ChevronRight,
  Plus,
  Command,
  MessagesSquare,
  Calendar,
  UserCheck,
  FileStack,
  PieChart,
  Plug,
  FileCheck,
} from "lucide-react";
import { CorporateBackground } from "./CorporateBackground";
import { BackgroundPicker } from "./BackgroundPicker";

export type CorporatePage = "dashboard" | "chat" | "crm" | "kanban" | "gantt" | "team" | "reports" | "workflows" | "documents" | "skills" | "knowledge" | "research" | "channels" | "calendar" | "hr" | "doc_registry" | "analytics" | "integrations" | "edo" | "settings";

interface NavItem {
  id: CorporatePage;
  icon: React.ElementType;
  label: string;
  group: "main" | "work" | "ai" | "admin";
}

const ALL_NAV_ITEMS: NavItem[] = [
  { id: "dashboard", icon: Home, label: "Главная", group: "main" },
  { id: "chat", icon: MessageSquare, label: "XeroCode AI", group: "ai" },
  { id: "crm", icon: TrendingUp, label: "CRM", group: "work" },
  { id: "kanban", icon: KanbanSquare, label: "Задачи", group: "work" },
  { id: "gantt", icon: BarChart3, label: "Гант", group: "work" },
  { id: "workflows", icon: GitBranch, label: "Workflows", group: "ai" },
  { id: "documents", icon: FileText, label: "Документы", group: "work" },
  { id: "skills", icon: Zap, label: "Skills", group: "ai" },
  { id: "knowledge", icon: BookOpen, label: "База знаний", group: "ai" },
  { id: "research", icon: Search, label: "Исследования", group: "ai" },
  { id: "analytics", icon: PieChart, label: "AI Аналитика", group: "ai" },
  { id: "channels", icon: MessagesSquare, label: "Каналы", group: "work" },
  { id: "calendar", icon: Calendar, label: "Календарь", group: "work" },
  { id: "doc_registry", icon: FileStack, label: "Реестр док.", group: "work" },
  { id: "edo", icon: FileCheck, label: "ЭДО", group: "work" },
  { id: "integrations", icon: Plug, label: "Интеграции", group: "admin" },
  { id: "hr", icon: UserCheck, label: "HR", group: "admin" },
  { id: "team", icon: Users, label: "Команда", group: "admin" },
  { id: "reports", icon: BarChart3, label: "Отчёты", group: "admin" },
  { id: "settings", icon: Settings, label: "Настройки", group: "admin" },
];

const GROUP_LABELS: Record<string, string> = {
  main: "",
  work: "Работа",
  ai: "AI-инструменты",
  admin: "Управление",
};

const PAGE_LABELS: Record<CorporatePage, string> = {
  dashboard: "Главная",
  chat: "XeroCode AI",
  crm: "CRM",
  kanban: "Задачи",
  gantt: "Диаграмма Ганта",
  workflows: "Workflows",
  documents: "Документы",
  skills: "Skills",
  knowledge: "База знаний",
  research: "Исследования",
  analytics: "AI Аналитика",
  integrations: "Интеграции",
  channels: "Каналы",
  calendar: "Календарь",
  doc_registry: "Реестр документов",
  edo: "ЭДО",
  hr: "HR",
  team: "Команда",
  reports: "Отчёты",
  settings: "Настройки",
};

interface CorporateLayoutProps {
  activePage: CorporatePage;
  onNavigate: (page: CorporatePage) => void;
  orgRole: "owner" | "manager" | "member";
  orgName: string;
  userName: string;
  professionalRole?: string;
  professionalRoleLabel?: string;
  userModules?: string[];
  onLogout: () => void;
  onFocusMode?: () => void;
  children: React.ReactNode;
}

export function CorporateLayout({
  activePage,
  onNavigate,
  orgRole,
  orgName,
  userName,
  professionalRole,
  professionalRoleLabel,
  userModules,
  onLogout,
  onFocusMode,
  children,
}: CorporateLayoutProps) {
  const [collapsed, setCollapsed] = useState(false);
  const [bgPickerOpen, setBgPickerOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);

  // Filter sidebar by user's modules (from professional role)
  const filteredNav = userModules && userModules.length > 0
    ? ALL_NAV_ITEMS.filter(item => userModules.includes(item.id))
    : ALL_NAV_ITEMS;

  // Group items
  const groups = ["main", "work", "ai", "admin"]
    .map(g => ({
      key: g,
      label: GROUP_LABELS[g],
      items: filteredNav.filter(item => item.group === g),
    }))
    .filter(g => g.items.length > 0);

  const roleLabels: Record<string, { label: string; color: string }> = {
    owner: { label: "Руководитель", color: "var(--accent-amber)" },
    manager: { label: "Менеджер", color: "var(--accent-blue)" },
    member: { label: "Сотрудник", color: "var(--text-tertiary)" },
  };

  const currentRole = roleLabels[orgRole];

  return (
    <div className="flex h-screen overflow-hidden" style={{ backgroundColor: "var(--bg-base)" }}>
      {/* Left Navigation Sidebar */}
      <motion.nav
        className="h-full flex flex-col flex-shrink-0 relative"
        style={{
          backgroundColor: "var(--bg-surface)",
          borderRight: "1px solid var(--border-default)",
        }}
        animate={{ width: collapsed ? 60 : 248 }}
        transition={{ duration: 0.2, ease: "easeInOut" }}
      >
        {/* Header */}
        <div
          className="flex items-center h-14 px-3 flex-shrink-0"
          style={{ borderBottom: "1px solid var(--border-default)" }}
        >
          {!collapsed && (
            <motion.div
              className="flex items-center gap-2.5 flex-1 min-w-0"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.15 }}
            >
              <div
                className="w-8 h-8 rounded-lg flex items-center justify-center text-[14px] font-bold flex-shrink-0"
                style={{
                  background: "linear-gradient(135deg, var(--accent-blue), var(--accent-teal))",
                  color: "#fff",
                }}
              >
                {orgName.charAt(0).toUpperCase()}
              </div>
              <div className="min-w-0 flex-1">
                <div
                  className="text-[13px] font-semibold truncate"
                  style={{ color: "var(--text-primary)" }}
                >
                  {orgName}
                </div>
                <div className="text-[11px] truncate" style={{ color: currentRole.color }}>
                  {professionalRoleLabel || currentRole.label}
                </div>
              </div>
            </motion.div>
          )}
          <button
            onClick={() => setCollapsed(!collapsed)}
            className="w-8 h-8 flex items-center justify-center rounded-lg transition-colors flex-shrink-0"
            style={{ color: "var(--text-secondary)" }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = "var(--bg-elevated)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = "transparent";
            }}
            title={collapsed ? "Развернуть" : "Свернуть"}
          >
            {collapsed ? <Menu size={18} /> : <ChevronLeft size={18} />}
          </button>
        </div>

        {/* Quick search button */}
        {!collapsed && (
          <div className="px-3 pt-3 pb-1">
            <button
              onClick={() => setSearchOpen(true)}
              className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-xs transition-colors"
              style={{
                backgroundColor: "var(--bg-base)",
                border: "1px solid var(--border-default)",
                color: "var(--text-tertiary)",
              }}
              onMouseEnter={e => { e.currentTarget.style.borderColor = "var(--accent-blue)"; }}
              onMouseLeave={e => { e.currentTarget.style.borderColor = "var(--border-default)"; }}
            >
              <Search size={13} />
              <span className="flex-1 text-left">Поиск...</span>
              <kbd
                className="text-[10px] px-1.5 py-0.5 rounded"
                style={{ backgroundColor: "var(--bg-elevated)", color: "var(--text-tertiary)" }}
              >
                /
              </kbd>
            </button>
          </div>
        )}

        {/* Navigation Items — grouped */}
        <div className="flex-1 py-2 px-2 flex flex-col gap-0.5 overflow-y-auto">
          {groups.map((group, gi) => (
            <div key={group.key}>
              {/* Group label */}
              {group.label && !collapsed && (
                <div
                  className="px-3 pt-4 pb-1.5 text-[10px] font-semibold uppercase tracking-wider"
                  style={{ color: "var(--text-tertiary)" }}
                >
                  {group.label}
                </div>
              )}
              {group.label && collapsed && gi > 0 && (
                <div className="mx-3 my-2" style={{ borderTop: "1px solid var(--border-default)" }} />
              )}

              {group.items.map((item) => {
                const isActive = activePage === item.id;
                const Icon = item.icon;

                return (
                  <button
                    key={item.id}
                    onClick={() => onNavigate(item.id)}
                    className="flex items-center gap-3 rounded-lg transition-all duration-150 relative group w-full"
                    style={{
                      padding: collapsed ? "10px 0" : "9px 12px",
                      justifyContent: collapsed ? "center" : "flex-start",
                      backgroundColor: isActive ? "var(--bg-elevated)" : "transparent",
                      color: isActive ? "var(--accent-blue)" : "var(--text-secondary)",
                    }}
                    onMouseEnter={(e) => {
                      if (!isActive) {
                        e.currentTarget.style.backgroundColor = "var(--bg-elevated)";
                        e.currentTarget.style.color = "var(--text-primary)";
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (!isActive) {
                        e.currentTarget.style.backgroundColor = "transparent";
                        e.currentTarget.style.color = "var(--text-secondary)";
                      }
                    }}
                    title={collapsed ? item.label : undefined}
                  >
                    {isActive && (
                      <motion.div
                        layoutId="nav-indicator"
                        className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] rounded-r-full"
                        style={{
                          height: "60%",
                          backgroundColor: "var(--accent-blue)",
                        }}
                        transition={{ duration: 0.2 }}
                      />
                    )}
                    <Icon size={19} className="flex-shrink-0" />
                    {!collapsed && (
                      <motion.span
                        className="text-[13px] font-medium truncate"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ duration: 0.15, delay: 0.05 }}
                      >
                        {item.label}
                      </motion.span>
                    )}

                    {/* Tooltip when collapsed */}
                    {collapsed && (
                      <div
                        className="absolute left-full ml-2 px-2 py-1 rounded-md text-[12px] font-medium whitespace-nowrap opacity-0 pointer-events-none group-hover:opacity-100 transition-opacity z-50"
                        style={{
                          backgroundColor: "var(--bg-elevated)",
                          color: "var(--text-primary)",
                          border: "1px solid var(--border-default)",
                          boxShadow: "0 4px 12px rgba(0,0,0,0.3)",
                        }}
                      >
                        {item.label}
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
          ))}
        </div>

        {/* User section at bottom */}
        <div
          className="px-2 py-3 flex-shrink-0"
          style={{ borderTop: "1px solid var(--border-default)" }}
        >
          {!collapsed ? (
            <div className="flex items-center gap-2 px-2">
              <div
                className="w-8 h-8 rounded-full flex items-center justify-center text-[12px] font-bold flex-shrink-0"
                style={{
                  backgroundColor: "var(--bg-elevated)",
                  color: "var(--text-primary)",
                  border: "1px solid var(--border-default)",
                }}
              >
                {userName.charAt(0).toUpperCase()}
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-[12px] font-medium truncate" style={{ color: "var(--text-primary)" }}>
                  {userName}
                </div>
              </div>
              {onFocusMode && (
                <button
                  onClick={onFocusMode}
                  className="w-7 h-7 flex items-center justify-center rounded-md transition-colors"
                  style={{ color: "var(--text-tertiary)" }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.color = "var(--accent-teal)";
                    e.currentTarget.style.backgroundColor = "var(--bg-elevated)";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.color = "var(--text-tertiary)";
                    e.currentTarget.style.backgroundColor = "transparent";
                  }}
                  title="Фокус-режим — только чат"
                >
                  <Focus size={15} />
                </button>
              )}
              <button
                onClick={() => setBgPickerOpen(true)}
                className="w-7 h-7 flex items-center justify-center rounded-md transition-colors"
                style={{ color: "var(--text-tertiary)" }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.color = "var(--accent-lavender)";
                  e.currentTarget.style.backgroundColor = "var(--bg-elevated)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.color = "var(--text-tertiary)";
                  e.currentTarget.style.backgroundColor = "transparent";
                }}
                title="Фон рабочего пространства"
              >
                <Palette size={15} />
              </button>
              <button
                onClick={onLogout}
                className="w-7 h-7 flex items-center justify-center rounded-md transition-colors"
                style={{ color: "var(--text-tertiary)" }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.color = "var(--accent-rose)";
                  e.currentTarget.style.backgroundColor = "var(--bg-elevated)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.color = "var(--text-tertiary)";
                  e.currentTarget.style.backgroundColor = "transparent";
                }}
                title="Выйти"
              >
                <LogOut size={15} />
              </button>
            </div>
          ) : (
            <div className="flex flex-col gap-1">
              {onFocusMode && (
                <button
                  onClick={onFocusMode}
                  className="w-full flex items-center justify-center py-2 rounded-lg transition-colors"
                  style={{ color: "var(--text-tertiary)" }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.color = "var(--accent-teal)";
                    e.currentTarget.style.backgroundColor = "var(--bg-elevated)";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.color = "var(--text-tertiary)";
                    e.currentTarget.style.backgroundColor = "transparent";
                  }}
                  title="Фокус-режим"
                >
                  <Focus size={18} />
                </button>
              )}
              <button
                onClick={() => setBgPickerOpen(true)}
                className="w-full flex items-center justify-center py-2 rounded-lg transition-colors"
                style={{ color: "var(--text-tertiary)" }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.color = "var(--accent-lavender)";
                  e.currentTarget.style.backgroundColor = "var(--bg-elevated)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.color = "var(--text-tertiary)";
                  e.currentTarget.style.backgroundColor = "transparent";
                }}
                title="Фон рабочего пространства"
              >
                <Palette size={18} />
              </button>
              <button
                onClick={onLogout}
                className="w-full flex items-center justify-center py-2 rounded-lg transition-colors"
                style={{ color: "var(--text-tertiary)" }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.color = "var(--accent-rose)";
                  e.currentTarget.style.backgroundColor = "var(--bg-elevated)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.color = "var(--text-tertiary)";
                  e.currentTarget.style.backgroundColor = "transparent";
                }}
                title="Выйти"
              >
                <LogOut size={18} />
              </button>
            </div>
          )}
        </div>
      </motion.nav>

      {/* Main Content Area */}
      <div className="flex-1 min-w-0 flex flex-col overflow-hidden">
        {/* Top header bar — Bitrix24 style */}
        <div
          className="h-12 flex items-center px-4 gap-3 flex-shrink-0"
          style={{
            backgroundColor: "var(--bg-surface)",
            borderBottom: "1px solid var(--border-default)",
          }}
        >
          {/* Breadcrumbs */}
          <div className="flex items-center gap-1.5 text-xs min-w-0">
            <button
              onClick={() => onNavigate("dashboard")}
              className="transition-colors"
              style={{ color: "var(--text-tertiary)" }}
              onMouseEnter={e => { e.currentTarget.style.color = "var(--accent-blue)"; }}
              onMouseLeave={e => { e.currentTarget.style.color = "var(--text-tertiary)"; }}
            >
              {orgName}
            </button>
            <ChevronRight size={12} style={{ color: "var(--text-tertiary)" }} />
            <span className="font-medium" style={{ color: "var(--text-primary)" }}>
              {PAGE_LABELS[activePage]}
            </span>
          </div>

          <div className="flex-1" />

          {/* Quick actions */}
          <button
            onClick={() => onNavigate("chat")}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors"
            style={{
              backgroundColor: "var(--bg-base)",
              border: "1px solid var(--border-default)",
              color: "var(--text-secondary)",
            }}
            onMouseEnter={e => {
              e.currentTarget.style.borderColor = "var(--accent-blue)";
              e.currentTarget.style.color = "var(--accent-blue)";
            }}
            onMouseLeave={e => {
              e.currentTarget.style.borderColor = "var(--border-default)";
              e.currentTarget.style.color = "var(--text-secondary)";
            }}
          >
            <Plus size={13} />
            Новая задача
          </button>

          {/* Notifications bell */}
          <button
            className="relative w-8 h-8 flex items-center justify-center rounded-lg transition-colors"
            style={{ color: "var(--text-tertiary)" }}
            onMouseEnter={e => {
              e.currentTarget.style.backgroundColor = "var(--bg-elevated)";
              e.currentTarget.style.color = "var(--text-primary)";
            }}
            onMouseLeave={e => {
              e.currentTarget.style.backgroundColor = "transparent";
              e.currentTarget.style.color = "var(--text-tertiary)";
            }}
            title="Уведомления"
          >
            <Bell size={17} />
            {/* Notification dot */}
            <div
              className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full"
              style={{ backgroundColor: "var(--accent-rose)" }}
            />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0 overflow-hidden">
          <CorporateBackground>
            {children}
          </CorporateBackground>
        </div>
      </div>

      {/* Background Picker Modal */}
      <BackgroundPicker open={bgPickerOpen} onClose={() => setBgPickerOpen(false)} />

      {/* Quick search overlay */}
      <AnimatePresence>
        {searchOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-start justify-center pt-[15vh]"
            style={{ backgroundColor: "rgba(0,0,0,0.5)" }}
            onClick={() => setSearchOpen(false)}
          >
            <motion.div
              initial={{ y: -20, opacity: 0, scale: 0.97 }}
              animate={{ y: 0, opacity: 1, scale: 1 }}
              exit={{ y: -20, opacity: 0, scale: 0.97 }}
              className="w-full max-w-[520px] rounded-2xl overflow-hidden"
              style={{
                backgroundColor: "var(--bg-surface)",
                border: "1px solid var(--border-default)",
                boxShadow: "0 20px 60px rgba(0,0,0,0.4)",
              }}
              onClick={e => e.stopPropagation()}
            >
              <div className="flex items-center gap-3 px-4 py-3" style={{ borderBottom: "1px solid var(--border-default)" }}>
                <Search size={18} style={{ color: "var(--text-tertiary)" }} />
                <input
                  autoFocus
                  placeholder="Поиск по модулям, задачам, документам..."
                  className="flex-1 text-sm outline-none bg-transparent"
                  style={{ color: "var(--text-primary)" }}
                  onKeyDown={e => {
                    if (e.key === "Escape") setSearchOpen(false);
                  }}
                />
                <kbd
                  className="text-[10px] px-1.5 py-0.5 rounded"
                  style={{ backgroundColor: "var(--bg-elevated)", color: "var(--text-tertiary)" }}
                >
                  ESC
                </kbd>
              </div>
              <div className="px-4 py-3">
                <div className="text-[11px] font-medium mb-2" style={{ color: "var(--text-tertiary)" }}>Быстрый переход</div>
                <div className="space-y-0.5">
                  {filteredNav.slice(0, 6).map(item => {
                    const Icon = item.icon;
                    return (
                      <button
                        key={item.id}
                        onClick={() => { onNavigate(item.id); setSearchOpen(false); }}
                        className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors"
                        style={{ color: "var(--text-secondary)" }}
                        onMouseEnter={e => { e.currentTarget.style.backgroundColor = "var(--bg-elevated)"; }}
                        onMouseLeave={e => { e.currentTarget.style.backgroundColor = "transparent"; }}
                      >
                        <Icon size={16} />
                        {item.label}
                      </button>
                    );
                  })}
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
