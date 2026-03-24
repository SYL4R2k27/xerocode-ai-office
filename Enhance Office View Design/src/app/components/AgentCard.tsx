import { motion } from "motion/react";
import { Brain, CheckCircle2, Loader2, MessageSquare, AlertCircle } from "lucide-react";
import { useState, useEffect } from "react";

type AgentStatus = "idle" | "thinking" | "working" | "completed" | "error";

interface AgentCardProps {
  name: string;
  role: string;
  avatar: string | null;
  provider: string;
  modelName: string;
  status: AgentStatus;
  totalCost: number;
  position: { x: number; y: number };
}

const providerColors: Record<string, string> = {
  openai: "from-green-500/20 to-emerald-500/20",
  anthropic: "from-orange-500/20 to-amber-500/20",
  ollama: "from-blue-500/20 to-cyan-500/20",
  custom: "from-purple-500/20 to-pink-500/20",
};

const providerBadge: Record<string, string> = {
  openai: "bg-green-500/10 text-green-400 border-green-500/20",
  anthropic: "bg-orange-500/10 text-orange-400 border-orange-500/20",
  ollama: "bg-blue-500/10 text-blue-400 border-blue-500/20",
  custom: "bg-purple-500/10 text-purple-400 border-purple-500/20",
};

export function AgentCard({ name, role, avatar, provider, modelName, status, totalCost, position }: AgentCardProps) {
  const [showMessage, setShowMessage] = useState(false);

  useEffect(() => {
    if (status === "working" || status === "thinking") {
      const timer = setTimeout(() => setShowMessage(true), 1000);
      return () => clearTimeout(timer);
    } else {
      setShowMessage(false);
    }
  }, [status]);

  const getStatusColor = () => {
    switch (status) {
      case "thinking": return "rgba(139, 92, 246, 0.3)";
      case "working": return "rgba(59, 130, 246, 0.3)";
      case "completed": return "rgba(34, 197, 94, 0.3)";
      case "error": return "rgba(239, 68, 68, 0.3)";
      default: return "rgba(107, 114, 128, 0.1)";
    }
  };

  const getStatusIcon = () => {
    switch (status) {
      case "thinking": return <Brain className="w-4 h-4 text-purple-400" />;
      case "working": return <Loader2 className="w-4 h-4 text-blue-400 animate-spin" />;
      case "completed": return <CheckCircle2 className="w-4 h-4 text-green-400" />;
      case "error": return <AlertCircle className="w-4 h-4 text-red-400" />;
      default: return null;
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.3, ease: "easeInOut" }}
      style={{ position: "absolute", left: position.x, top: position.y }}
      className="group"
    >
      <motion.div className="relative" whileHover={{ scale: 1.02 }} transition={{ duration: 0.2 }}>
        <div className="relative">
          <div className="absolute inset-0 bg-[#232328] rounded-2xl blur-sm opacity-50 transform translate-y-1" />
          <motion.div
            className="relative bg-[#1A1A1F] rounded-2xl p-5 border border-white/5 cursor-pointer"
            style={{ width: 280, boxShadow: `0 8px 32px ${getStatusColor()}, 0 4px 16px rgba(0, 0, 0, 0.4)` }}
            animate={{
              boxShadow: (status === "thinking" || status === "working")
                ? [
                    `0 8px 32px ${getStatusColor()}, 0 4px 16px rgba(0, 0, 0, 0.4)`,
                    `0 8px 48px ${getStatusColor()}, 0 4px 16px rgba(0, 0, 0, 0.4)`,
                    `0 8px 32px ${getStatusColor()}, 0 4px 16px rgba(0, 0, 0, 0.4)`,
                  ]
                : `0 8px 32px ${getStatusColor()}, 0 4px 16px rgba(0, 0, 0, 0.4)`,
            }}
            transition={{ duration: 2, repeat: (status === "thinking" || status === "working") ? Infinity : 0 }}
          >
            {/* Avatar + Info */}
            <div className="flex items-start gap-3 mb-3">
              <motion.div
                className="relative"
                animate={{ y: status === "working" ? [0, -2, 0] : 0 }}
                transition={{ duration: 2, repeat: status === "working" ? Infinity : 0 }}
              >
                <div className={`w-12 h-12 rounded-full bg-gradient-to-br ${providerColors[provider] || providerColors.custom} border border-white/10 flex items-center justify-center relative overflow-hidden`}>
                  <span className="text-xl">{avatar || "🤖"}</span>
                  {(status === "thinking" || status === "working") && (
                    <motion.div
                      className="absolute inset-0 rounded-full border-2 border-purple-400"
                      initial={{ scale: 1, opacity: 0.5 }}
                      animate={{ scale: 1.3, opacity: 0 }}
                      transition={{ duration: 1.5, repeat: Infinity }}
                    />
                  )}
                </div>
              </motion.div>

              <div className="flex-1 min-w-0">
                <h3 className="text-white font-medium text-sm truncate">{name}</h3>
                <p className="text-gray-400 text-xs mb-1.5">{role}</p>
                <div className="flex items-center gap-2">
                  {getStatusIcon()}
                  <span className="text-xs text-gray-400 capitalize">{status}</span>
                </div>
              </div>
            </div>

            {/* Provider badge + model */}
            <div className="flex items-center gap-2 mb-3">
              <span className={`text-[10px] px-2 py-0.5 rounded-md border ${providerBadge[provider] || providerBadge.custom}`}>
                {provider}
              </span>
              <span className="text-[10px] text-gray-500 truncate">{modelName}</span>
            </div>

            {/* Typing indicator */}
            {(status === "working" || status === "thinking") && (
              <div className="flex items-center gap-2 text-xs text-gray-500">
                <motion.div className="flex gap-1">
                  {[0, 1, 2].map((i) => (
                    <motion.div
                      key={i}
                      className="w-1 h-1 bg-blue-400 rounded-full"
                      animate={{ y: [0, -4, 0] }}
                      transition={{ duration: 0.6, repeat: Infinity, delay: i * 0.15 }}
                    />
                  ))}
                </motion.div>
                <span>{status === "thinking" ? "Думает..." : "Работает..."}</span>
              </div>
            )}

            {/* Completed */}
            {status === "completed" && (
              <motion.div
                initial={{ scale: 0 }} animate={{ scale: 1 }}
                className="flex items-center gap-2 text-green-400 text-xs"
              >
                <CheckCircle2 className="w-3 h-3" />
                <span>Готово</span>
              </motion.div>
            )}

            {/* Cost */}
            {totalCost > 0 && (
              <div className="mt-2 text-[10px] text-gray-500">
                💰 ${totalCost.toFixed(4)}
              </div>
            )}
          </motion.div>
        </div>

        {/* Message bubble */}
        {showMessage && (status === "working" || status === "thinking") && (
          <motion.div
            initial={{ opacity: 0, y: 10, scale: 0.8 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            className="absolute -top-10 left-1/2 transform -translate-x-1/2 bg-[#1A1A1F] border border-white/10 rounded-xl px-3 py-1.5 whitespace-nowrap shadow-xl"
          >
            <MessageSquare className="w-3 h-3 inline mr-1.5 text-blue-400" />
            <span className="text-xs text-gray-300">
              {status === "thinking" ? "Анализирую задачу..." : "Генерирую ответ..."}
            </span>
            <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 translate-y-1/2 rotate-45 w-2 h-2 bg-[#1A1A1F] border-r border-b border-white/10" />
          </motion.div>
        )}
      </motion.div>
    </motion.div>
  );
}
