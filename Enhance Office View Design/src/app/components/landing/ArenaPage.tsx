import { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  ArrowLeft, Swords, Trophy, Eye, GitBranch, BarChart3,
  Zap, Brain, Sparkles,
} from "lucide-react";
import { LogoFull } from "../shared/Logo";

interface ArenaPageProps {
  onBack: () => void;
  onLogin: () => void;
  hideHeader?: boolean;
}

const modes = [
  {
    id: "duel",
    icon: Swords,
    title: "Дуэль",
    desc: "2 модели получают одну задачу. Вы видите оба ответа и выбираете лучший. Проигравший теряет Elo.",
    color: "#F43F5E",
    example: "GPT-5 vs Claude Opus — кто лучше напишет маркетинговый текст?",
  },
  {
    id: "evolution",
    icon: GitBranch,
    title: "Эволюция",
    desc: "Модели улучшают ответы друг друга в цепочке. Каждый следующий участник видит предыдущий результат и делает лучше.",
    color: "#818CF8",
    example: "Groq → Claude → GPT-5 — каждый шаг улучшает текст",
  },
  {
    id: "tournament",
    icon: Trophy,
    title: "Турнир",
    desc: "4 модели, bracket-система. Победители полуфиналов встречаются в финале. Лучший получает максимум Elo.",
    color: "#FBBF24",
    example: "Четвертьфиналы → Полуфиналы → Финал. Один победитель.",
  },
  {
    id: "blind",
    icon: Eye,
    title: "Слепой тест",
    desc: "Имена моделей скрыты до голосования. Вы оцениваете только качество ответа — без предвзятости к бренду.",
    color: "#5EEAD4",
    example: "Модель A vs Модель B — кто лучше? Имена откроются после.",
  },
];

export function ArenaPage({ onBack, onLogin, hideHeader }: ArenaPageProps) {
  const [activeMode, setActiveMode] = useState("duel");
  const active = modes.find(m => m.id === activeMode)!;

  return (
    <div className="min-h-screen bg-[#0A0A0F] text-white">
      {/* Header */}
      {!hideHeader && (
      <header className="sticky top-0 z-50 bg-[#0A0A0F]/80 backdrop-blur-xl border-b border-white/[0.06]">
        <div className="max-w-[1440px] mx-auto px-6 md:px-16 flex items-center justify-between h-16">
          <button onClick={onBack} className="flex items-center gap-2 text-white/40 hover:text-white transition-colors text-sm">
            <ArrowLeft size={16} />
            Назад
          </button>
          <LogoFull height={26} />
          <button onClick={onLogin} className="flex items-center gap-2 px-4 py-2 rounded-lg bg-white/[0.04] border border-white/[0.08] text-white/70 text-sm hover:bg-white/[0.08] transition-all">
            Войти
          </button>
        </div>
      </header>
      )}

      <main className="max-w-[900px] mx-auto px-6 py-16 md:py-24">
        {/* Hero */}
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-16"
        >
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs mb-6">
            <Swords size={12} />
            Эволюция / Арена
          </div>
          <h1 className="text-4xl md:text-5xl font-bold mb-4">
            Пусть модели{" "}
            <span className="bg-gradient-to-r from-rose-400 to-purple-400 bg-clip-text text-transparent">соревнуются</span>
          </h1>
          <p className="text-white/40 text-lg max-w-[550px] mx-auto">
            Узнайте какая AI-модель лучше справляется с вашими задачами. Честный Elo-рейтинг на основе ваших оценок.
          </p>
        </motion.div>

        {/* Mode selector */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="flex flex-wrap justify-center gap-2 mb-8"
        >
          {modes.map(m => (
            <button
              key={m.id}
              onClick={() => setActiveMode(m.id)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition-all ${
                activeMode === m.id
                  ? "bg-white/[0.08] text-white border border-white/[0.12]"
                  : "text-white/40 hover:text-white/70 border border-transparent hover:border-white/[0.06]"
              }`}
            >
              <m.icon size={16} />
              {m.title}
            </button>
          ))}
        </motion.div>

        {/* Active mode detail */}
        <AnimatePresence mode="wait">
          <motion.div
            key={activeMode}
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -16 }}
            transition={{ duration: 0.3 }}
            className="p-8 rounded-2xl border mb-16"
            style={{ borderColor: `${active.color}20`, background: `${active.color}04` }}
          >
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 rounded-xl flex items-center justify-center" style={{ background: `${active.color}15` }}>
                <active.icon size={24} style={{ color: active.color }} />
              </div>
              <div>
                <h2 className="text-xl font-bold text-white">{active.title}</h2>
                <p className="text-white/30 text-sm">Режим арены</p>
              </div>
            </div>
            <p className="text-white/60 leading-relaxed mb-4">{active.desc}</p>
            <div className="p-4 rounded-xl bg-black/20 border border-white/[0.04]">
              <div className="text-white/30 text-[11px] uppercase tracking-wider mb-1">Пример</div>
              <p className="text-white/50 text-sm">{active.example}</p>
            </div>
          </motion.div>
        </AnimatePresence>

        {/* How Elo works */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="mb-16"
        >
          <h2 className="text-2xl font-bold text-white mb-8 text-center">Как работает рейтинг</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              { icon: Swords, title: "Модели соревнуются", desc: "AI-модели получают вашу задачу и отвечают. Вы видите результаты и голосуете.", color: "#F43F5E" },
              { icon: BarChart3, title: "Elo обновляется", desc: "После каждого голосования рейтинг пересчитывается. Сильные модели растут, слабые падают.", color: "#818CF8" },
              { icon: Brain, title: "Вы находите лучшую", desc: "Со временем рейтинг показывает какая модель лучше для именно ваших задач.", color: "#5EEAD4" },
            ].map((s, i) => (
              <motion.div
                key={s.title}
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.35 + i * 0.08 }}
                className="p-6 rounded-2xl bg-white/[0.02] border border-white/[0.06] text-center"
              >
                <div className="w-10 h-10 rounded-xl flex items-center justify-center mx-auto mb-4" style={{ background: `${s.color}12` }}>
                  <s.icon size={20} style={{ color: s.color }} />
                </div>
                <h3 className="text-white font-semibold mb-2">{s.title}</h3>
                <p className="text-white/40 text-sm leading-relaxed">{s.desc}</p>
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* Why it matters */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="p-8 rounded-2xl bg-gradient-to-br from-rose-500/[0.06] to-purple-500/[0.04] border border-white/[0.06]"
        >
          <h2 className="text-xl font-bold text-white mb-4 text-center">Зачем это нужно</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-[700px] mx-auto">
            {[
              { icon: Sparkles, text: "Найти лучшую модель для ваших задач — объективно, без маркетинга" },
              { icon: Zap, text: "Сэкономить — зачем платить за GPT-5, если Groq справляется не хуже?" },
              { icon: Brain, text: "Улучшить результат — эволюция позволяет моделям совершенствовать ответы" },
              { icon: Trophy, text: "Развлечься — наблюдать за битвой AI-моделей просто интересно" },
            ].map((item, i) => (
              <div key={i} className="flex items-start gap-3 p-3 rounded-lg bg-white/[0.02]">
                <item.icon size={16} className="text-rose-400 flex-shrink-0 mt-0.5" />
                <span className="text-white/60 text-sm">{item.text}</span>
              </div>
            ))}
          </div>
        </motion.div>

        {/* CTA */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6 }}
          className="mt-12 text-center"
        >
          <motion.button
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.98 }}
            onClick={onLogin}
            className="inline-flex items-center gap-2 px-8 py-4 rounded-xl bg-gradient-to-r from-rose-500 to-purple-500 text-white font-semibold hover:from-rose-400 hover:to-purple-400 transition-all shadow-lg shadow-rose-500/20"
          >
            <Swords size={18} />
            Попробовать Арену
          </motion.button>
        </motion.div>
      </main>
    </div>
  );
}
