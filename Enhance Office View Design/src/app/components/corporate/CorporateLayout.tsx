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
} from "lucide-react";
import { CorporateBackground } from "./CorporateBackground";
import { BackgroundPicker } from "./BackgroundPicker";

export type CorporatePage = "dashboard" | "chat" | "kanban" | "team" | "reports" | "workflows" | "documents" | "skills" | "settings";

interface NavItem {
  id: CorporatePage;
  icon: React.ElementType;
  label: string;
  managerOnly?: boolean;
}

const navItems: NavItem[] = [
  { id: "dashboard", icon: Home, label: "Главная" },
  { id: "chat", icon: MessageSquare, label: "XeroCode AI" },
  { id: "kanban", icon: KanbanSquare, label: "Задачи" },
  { id: "workflows", icon: GitBranch, label: "Workflows" },
  { id: "documents", icon: FileText, label: "Документы" },
  { id: "skills", icon: Zap, label: "Skills" },
  { id: "team", icon: Users, label: "Команда", managerOnly: true },
  { id: "reports", icon: BarChart3, label: "Отчёты", managerOnly: true },
  { id: "settings", icon: Settings, label: "Настройки" },
];

interface CorporateLayoutProps {
  activePage: CorporatePage;
  onNavigate: (page: CorporatePage) => void;
  orgRole: "owner" | "manager" | "member";
  orgName: string;
  userName: string;
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
  onLogout,
  onFocusMode,
  children,
}: CorporateLayoutProps) {
  const [collapsed, setCollapsed] = useState(false);
  const [bgPickerOpen, setBgPickerOpen] = useState(false);
  const isManagerOrOwner = orgRole === "owner" || orgRole === "manager";

  const filteredNav = navItems.filter(
    (item) => !item.managerOnly || isManagerOrOwner
  );

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
        animate={{ width: collapsed ? 60 : 240 }}
        transition={{ duration: 0.2, ease: "easeInOut" }}
      >
        {/* Header */}
        <div
          className="flex items-center h-14 px-3 flex-shrink-0"
          style={{ borderBottom: "1px solid var(--border-default)" }}
        >
          {!collapsed && (
            <motion.div
              className="flex items-center gap-2 flex-1 min-w-0"
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
                  {currentRole.label}
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

        {/* Navigation Items */}
        <div className="flex-1 py-2 px-2 flex flex-col gap-1 overflow-y-auto">
          {filteredNav.map((item) => {
            const isActive = activePage === item.id;
            const Icon = item.icon;

            return (
              <button
                key={item.id}
                onClick={() => onNavigate(item.id)}
                className="flex items-center gap-3 rounded-lg transition-all duration-150 relative group"
                style={{
                  padding: collapsed ? "10px 0" : "10px 12px",
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
                <Icon size={20} className="flex-shrink-0" />
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
                  title="🎯 Фокус-режим — только чат"
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
                  title="🎯 Фокус-режим"
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
      <div className="flex-1 min-w-0 overflow-hidden">
        <CorporateBackground>
          {children}
        </CorporateBackground>
      </div>

      {/* Background Picker Modal */}
      <BackgroundPicker open={bgPickerOpen} onClose={() => setBgPickerOpen(false)} />
    </div>
  );
}
