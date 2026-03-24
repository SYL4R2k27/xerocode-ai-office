import { motion } from "motion/react";
import { Sparkles, User, Users, Wifi, WifiOff, Settings, DollarSign } from "lucide-react";
import type { Agent } from "../lib/api";

interface TopBarProps {
  agents: Agent[];
  connected: boolean;
  totalCost: number;
  onSettingsClick: () => void;
}

export function TopBar({ agents, connected, totalCost, onSettingsClick }: TopBarProps) {
  const activeAgents = agents.filter((a) => a.is_active);
  const workingAgents = agents.filter((a) => a.status === "thinking" || a.status === "working");

  return (
    <div className="h-16 bg-[#1A1A1F] border-b border-white/5 flex items-center justify-between px-6">
      {/* Logo and title */}
      <div className="flex items-center gap-3">
        <motion.div
          className="w-10 h-10 bg-gradient-to-br from-purple-600 to-blue-600 rounded-xl flex items-center justify-center"
          whileHover={{ scale: 1.05, rotate: 5 }}
          transition={{ duration: 0.2, ease: "easeInOut" }}
        >
          <Sparkles className="w-5 h-5 text-white" />
        </motion.div>
        <div>
          <h1 className="text-white font-semibold">ИИ Офис</h1>
          <p className="text-xs text-gray-500">Цифровое рабочее пространство</p>
        </div>
      </div>

      {/* Status indicators */}
      <div className="flex items-center gap-4">
        {/* Cost display */}
        {totalCost > 0 && (
          <div className="flex items-center gap-2 px-3 py-1.5 bg-amber-500/10 border border-amber-500/20 rounded-lg">
            <DollarSign className="w-4 h-4 text-amber-400" />
            <span className="text-sm text-amber-400">${totalCost.toFixed(4)}</span>
          </div>
        )}

        {/* Connection status */}
        <motion.div
          className={`flex items-center gap-2 px-3 py-1.5 rounded-lg border ${
            connected
              ? "bg-green-500/10 border-green-500/20"
              : "bg-red-500/10 border-red-500/20"
          }`}
          whileHover={{ scale: 1.02 }}
          transition={{ duration: 0.2, ease: "easeInOut" }}
        >
          {connected ? (
            <>
              <motion.div
                animate={{ scale: [1, 1.2, 1] }}
                transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
              >
                <Wifi className="w-4 h-4 text-green-400" />
              </motion.div>
              <span className="text-sm text-green-400">Онлайн</span>
            </>
          ) : (
            <>
              <WifiOff className="w-4 h-4 text-red-400" />
              <span className="text-sm text-red-400">Не в сети</span>
            </>
          )}
        </motion.div>

        {/* Active agents counter */}
        <motion.div
          className="flex items-center gap-2 px-3 py-1.5 bg-purple-500/10 border border-purple-500/20 rounded-lg"
          whileHover={{ scale: 1.02 }}
          transition={{ duration: 0.2, ease: "easeInOut" }}
        >
          <Users className="w-4 h-4 text-purple-400" />
          <span className="text-sm text-purple-400">
            {activeAgents.length} Агент{activeAgents.length !== 1 ? "ов" : ""}
            {workingAgents.length > 0 && (
              <span className="text-blue-400 ml-1">({workingAgents.length} работает)</span>
            )}
          </span>
        </motion.div>

        {/* Settings button */}
        <motion.button
          onClick={onSettingsClick}
          className="w-9 h-9 bg-gradient-to-br from-purple-600/20 to-blue-600/20 border border-white/10 rounded-full flex items-center justify-center hover:border-white/20 transition-colors duration-300"
          whileHover={{ scale: 1.05, rotate: 90 }}
          whileTap={{ scale: 0.95 }}
          transition={{ duration: 0.3, ease: "easeInOut" }}
        >
          <Settings className="w-4 h-4 text-purple-300" />
        </motion.button>
      </div>
    </div>
  );
}
