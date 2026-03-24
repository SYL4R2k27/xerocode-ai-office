import { motion } from "motion/react";
import { User, Terminal, MessageSquare, Send, Bot, Settings } from "lucide-react";
import { useState, useEffect, useRef } from "react";
import type { Message } from "../lib/api";

interface ActivityLogProps {
  messages: Message[];
  activeGoalId: string | null;
  onSendMessage: (content: string) => void;
}

export function ActivityLog({ messages, activeGoalId, onSendMessage }: ActivityLogProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [inputValue, setInputValue] = useState("");
  const [expandedId, setExpandedId] = useState<string | null>(null);

  // Auto-scroll on new messages
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages.length]);

  const handleSend = () => {
    if (inputValue.trim() && activeGoalId) {
      onSendMessage(inputValue);
      setInputValue("");
    }
  };

  const getTypeStyle = (senderType: string) => {
    switch (senderType) {
      case "agent": return "border-l-blue-400 bg-blue-400/5";
      case "system": return "border-l-purple-400 bg-purple-400/5";
      case "user": return "border-l-green-400 bg-green-400/5";
      default: return "border-l-gray-400 bg-gray-400/5";
    }
  };

  const getSenderIcon = (senderType: string) => {
    switch (senderType) {
      case "agent": return <Bot className="w-4 h-4 text-blue-400" />;
      case "system": return <Settings className="w-4 h-4 text-purple-400" />;
      case "user": return <User className="w-4 h-4 text-green-400" />;
      default: return <Terminal className="w-4 h-4 text-gray-400" />;
    }
  };

  const formatTime = (iso: string) => {
    try {
      return new Date(iso).toLocaleTimeString("en-US", { hour12: false });
    } catch {
      return "";
    }
  };

  return (
    <div className="h-full bg-[#1A1A1F] border-t border-white/5 flex flex-col">
      {/* Header */}
      <div className="px-6 py-3 border-b border-white/5 flex items-center justify-between">
        <div>
          <h2 className="text-white font-medium text-sm">Журнал активности</h2>
          <p className="text-gray-400 text-xs">Коммуникация команды</p>
        </div>
        <div className="flex items-center gap-2">
          <motion.div
            className="w-2 h-2 bg-green-400 rounded-full"
            animate={{ opacity: [1, 0.4, 1] }}
            transition={{ duration: 2, repeat: Infinity }}
          />
          <span className="text-xs text-gray-400">Онлайн</span>
          {messages.length > 0 && (
            <span className="text-xs text-gray-500 ml-2">{messages.length} сообщ.</span>
          )}
        </div>
      </div>

      {/* Messages */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto px-4 py-2 space-y-2">
        {messages.length === 0 ? (
          <div className="flex items-center justify-center h-full text-gray-500 text-sm">
            Сообщения появятся здесь, когда агенты начнут работу
          </div>
        ) : (
          messages.map((msg) => (
            <motion.div
              key={msg.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.2 }}
              className={`border-l-2 rounded-r-xl p-2.5 ${getTypeStyle(msg.sender_type)}`}
            >
              <div className="flex items-start gap-2.5">
                <div className="mt-0.5">{getSenderIcon(msg.sender_type)}</div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-0.5">
                    <span className="text-xs font-medium text-white">{msg.sender_name}</span>
                    <span className="text-[10px] text-gray-500">{formatTime(msg.created_at)}</span>
                    {msg.cost_usd > 0 && (
                      <span className="text-[10px] text-amber-500">${msg.cost_usd.toFixed(4)}</span>
                    )}
                  </div>
                  <p className="text-xs text-gray-300 whitespace-pre-wrap break-words">
                    {msg.content.length > 300 ? (
                      <>
                        {expandedId === msg.id ? msg.content : msg.content.slice(0, 300) + "..."}
                        <button
                          onClick={() => setExpandedId(expandedId === msg.id ? null : msg.id)}
                          className="text-purple-400 hover:text-purple-300 ml-1"
                        >
                          {expandedId === msg.id ? "Свернуть" : "Ещё"}
                        </button>
                      </>
                    ) : (
                      msg.content
                    )}
                  </p>
                </div>
              </div>
            </motion.div>
          ))
        )}
      </div>

      {/* Input */}
      <div className="p-3 border-t border-white/5">
        <div className="relative">
          <input
            type="text"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSend()}
            placeholder={activeGoalId ? "Отправить сообщение команде..." : "Сначала создай цель"}
            disabled={!activeGoalId}
            className="w-full bg-[#0F0F12] border border-white/10 rounded-xl px-4 py-2 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-purple-500/50 disabled:opacity-50 transition-colors"
          />
          <button
            onClick={handleSend}
            disabled={!activeGoalId || !inputValue.trim()}
            className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-500 hover:text-purple-400 disabled:opacity-30 transition-colors"
          >
            <Send className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
