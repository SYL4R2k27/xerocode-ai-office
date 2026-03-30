import { motion, AnimatePresence } from "motion/react";
import { Send, Sparkles, Edit3, Lightbulb, Play, Plus, ChevronDown, Monitor } from "lucide-react";
import { useState } from "react";
import type { Goal } from "../lib/api";
import { AgentConnect } from "./shared/AgentConnect";

interface ControlPanelProps {
  activeGoal: Goal | null;
  goals: Goal[];
  onCreateGoal: (title: string, mode: "manager" | "discussion" | "auto") => Promise<any>;
  onStartGoal: () => Promise<void>;
  onUserInput: (content: string, type: "command" | "edit" | "idea") => Promise<void>;
  onSelectGoal: (goal: Goal) => void;
  isStarting: boolean;
}

export function ControlPanel({
  activeGoal, goals, onCreateGoal, onStartGoal, onUserInput, onSelectGoal, isStarting,
}: ControlPanelProps) {
  const [inputValue, setInputValue] = useState("");
  const [mode, setMode] = useState<"manager" | "discussion" | "auto">("manager");
  const [isCreating, setIsCreating] = useState(false);
  const [showGoalSelector, setShowGoalSelector] = useState(false);
  const [showAgentConnect, setShowAgentConnect] = useState(false);

  const handleSubmit = async (type: "command" | "edit" | "idea") => {
    if (!inputValue.trim()) return;

    if (!activeGoal) {
      // No active goal → create one
      setIsCreating(true);
      try {
        await onCreateGoal(inputValue, mode);
      } finally {
        setIsCreating(false);
      }
    } else {
      // Active goal → send user input
      await onUserInput(inputValue, type);
    }
    setInputValue("");
  };

  const modeLabels = {
    manager: "🎯 Режим Менеджера",
    discussion: "💬 Режим Обсуждения",
    auto: "⚡ Авто-режим",
  };

  return (
    <div className="h-full bg-[#1A1A1F] border-r border-white/5 flex flex-col">
      {/* Header */}
      <div className="p-6 border-b border-white/5">
        <h2 className="text-white font-medium mb-1">Панель управления</h2>
        <p className="text-gray-400 text-sm">Управляй своей ИИ-командой</p>
      </div>

      {/* Active Goal Selector */}
      <div className="px-6 pt-4">
        <div className="relative">
          <button
            onClick={() => setShowGoalSelector(!showGoalSelector)}
            className="w-full bg-[#0F0F12] border border-white/10 rounded-xl px-4 py-2.5 text-left flex items-center justify-between hover:border-white/20 transition-colors"
          >
            <span className="text-sm text-white truncate">
              {activeGoal ? activeGoal.title : "Нет активной цели — напиши ниже"}
            </span>
            <ChevronDown className="w-4 h-4 text-gray-500 flex-shrink-0" />
          </button>

          {showGoalSelector && goals.length > 0 && (
            <div className="absolute top-full left-0 right-0 mt-1 bg-[#1A1A1F] border border-white/10 rounded-xl overflow-hidden z-50 shadow-xl">
              {goals.map((goal) => (
                <button
                  key={goal.id}
                  onClick={() => {
                    onSelectGoal(goal);
                    setShowGoalSelector(false);
                  }}
                  className={`w-full px-4 py-2.5 text-left text-sm hover:bg-white/5 transition-colors ${
                    activeGoal?.id === goal.id ? "text-purple-400 bg-purple-500/10" : "text-gray-300"
                  }`}
                >
                  {goal.title}
                  <span className="text-xs text-gray-500 ml-2">{goal.status}</span>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Mode selector */}
      <div className="px-6 pt-3">
        <div className="flex gap-1 bg-[#0F0F12] rounded-xl p-1">
          {(["manager", "discussion", "auto"] as const).map((m) => (
            <button
              key={m}
              onClick={() => setMode(m)}
              className={`flex-1 px-2 py-1.5 rounded-lg text-xs transition-all ${
                mode === m
                  ? "bg-purple-600 text-white"
                  : "text-gray-400 hover:text-white"
              }`}
            >
              {m === "manager" ? "Менеджер" : m === "discussion" ? "Обсуждение" : "Авто"}
            </button>
          ))}
        </div>
      </div>

      {/* Main input area */}
      <div className="p-6 space-y-4">
        <div className="relative">
          <motion.textarea
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            placeholder={activeGoal ? "Дай инструкции команде..." : "Опиши свою цель для старта..."}
            className="w-full h-28 bg-[#0F0F12] border border-white/10 rounded-2xl px-4 py-3 text-white placeholder-gray-500 resize-none focus:outline-none focus:border-purple-500/50 transition-colors duration-300 text-sm"
            onKeyDown={(e) => {
              if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
                handleSubmit("command");
              }
            }}
          />
          <motion.div
            className="absolute bottom-3 right-3"
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.95 }}
          >
            <button
              onClick={() => handleSubmit("command")}
              disabled={isCreating || !inputValue.trim()}
              className="bg-purple-600 hover:bg-purple-500 disabled:bg-gray-600 text-white p-2 rounded-xl transition-colors duration-300"
            >
              {isCreating ? (
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <Send className="w-4 h-4" />
              )}
            </button>
          </motion.div>
        </div>

        {/* Action buttons */}
        {activeGoal && (
          <div className="grid grid-cols-3 gap-2">
            <motion.button
              onClick={() => handleSubmit("command")}
              className="bg-[#0F0F12] hover:bg-[#232328] border border-white/10 rounded-xl px-3 py-2 text-sm text-gray-300 flex items-center justify-center gap-2 transition-all duration-300"
              whileHover={{ scale: 1.02, y: -1 }}
              whileTap={{ scale: 0.98 }}
            >
              <Sparkles className="w-4 h-4 text-purple-400" />
              <span>Команда</span>
            </motion.button>
            <motion.button
              onClick={() => handleSubmit("edit")}
              className="bg-[#0F0F12] hover:bg-[#232328] border border-white/10 rounded-xl px-3 py-2 text-sm text-gray-300 flex items-center justify-center gap-2 transition-all duration-300"
              whileHover={{ scale: 1.02, y: -1 }}
              whileTap={{ scale: 0.98 }}
            >
              <Edit3 className="w-4 h-4 text-blue-400" />
              <span>Правка</span>
            </motion.button>
            <motion.button
              onClick={() => handleSubmit("idea")}
              className="bg-[#0F0F12] hover:bg-[#232328] border border-white/10 rounded-xl px-3 py-2 text-sm text-gray-300 flex items-center justify-center gap-2 transition-all duration-300"
              whileHover={{ scale: 1.02, y: -1 }}
              whileTap={{ scale: 0.98 }}
            >
              <Lightbulb className="w-4 h-4 text-amber-400" />
              <span>Идея</span>
            </motion.button>
          </div>
        )}
      </div>

      {/* Start button */}
      {activeGoal && activeGoal.status === "active" && (
        <div className="px-6 pb-4">
          <motion.button
            onClick={onStartGoal}
            disabled={isStarting}
            className="w-full bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-500 hover:to-blue-500 disabled:from-gray-600 disabled:to-gray-600 text-white rounded-xl px-4 py-3 font-medium flex items-center justify-center gap-2 transition-all"
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            {isStarting ? (
              <>
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Запуск...
              </>
            ) : (
              <>
                <Play className="w-5 h-5" />
                Запустить цель
              </>
            )}
          </motion.button>
        </div>
      )}

      {/* Mode description */}
      <div className="flex-1 px-6 overflow-y-auto space-y-4">
        <div className="bg-[#0F0F12] rounded-xl p-4 border border-white/5">
          <p className="text-xs text-gray-500 mb-1">{modeLabels[mode]}</p>
          <p className="text-xs text-gray-400">
            {mode === "manager" && "Одна ИИ-модель выступает менеджером, разбивает задачи и раздаёт команде."}
            {mode === "discussion" && "Все модели обсуждают цель вместе и решают, кто что делает."}
            {mode === "auto" && "Платформа автоматически назначает задачи по навыкам моделей."}
          </p>
        </div>

        {/* Agent Connect button */}
        <motion.button
          onClick={() => setShowAgentConnect(!showAgentConnect)}
          className="w-full flex items-center gap-2 px-4 py-2.5 rounded-xl border border-purple-500/20 bg-purple-500/5 text-purple-400 text-sm hover:bg-purple-500/10 transition-colors"
          whileHover={{ scale: 1.01 }}
          whileTap={{ scale: 0.99 }}
        >
          <Monitor className="w-4 h-4" />
          Подключить компьютер
        </motion.button>

        <AnimatePresence>
          {showAgentConnect && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.2 }}
            >
              <AgentConnect
                goalId={activeGoal?.id}
                onClose={() => setShowAgentConnect(false)}
              />
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
