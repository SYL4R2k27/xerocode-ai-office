import { useState, useCallback } from "react";
import { motion, AnimatePresence } from "motion/react";
import { X, ArrowRight, ArrowLeft, Settings, Target, Eye, Rocket, Code, Palette, Search, FileText } from "lucide-react";

interface OnboardingWizardProps {
  onComplete: () => void;
}

const TOTAL_STEPS = 5;

export function OnboardingWizard({ onComplete }: OnboardingWizardProps) {
  const [step, setStep] = useState(0);
  const [direction, setDirection] = useState(1); // 1 = вперёд, -1 = назад

  const handleNext = useCallback(() => {
    if (step < TOTAL_STEPS - 1) {
      setDirection(1);
      setStep((s) => s + 1);
    } else {
      onComplete();
    }
  }, [step, onComplete]);

  const handleBack = useCallback(() => {
    if (step > 0) {
      setDirection(-1);
      setStep((s) => s - 1);
    }
  }, [step]);

  const handleSkip = useCallback(() => {
    onComplete();
  }, [onComplete]);

  const variants = {
    enter: (dir: number) => ({
      x: dir > 0 ? 80 : -80,
      opacity: 0,
    }),
    center: {
      x: 0,
      opacity: 1,
    },
    exit: (dir: number) => ({
      x: dir > 0 ? -80 : 80,
      opacity: 0,
    }),
  };

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center">
      {/* Backdrop */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="absolute inset-0"
        style={{ backgroundColor: "rgba(0,0,0,0.7)", backdropFilter: "blur(8px)" }}
        onClick={handleSkip}
      />

      {/* Modal */}
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        transition={{ duration: 0.3, ease: "easeOut" }}
        className="relative w-full max-w-[500px] mx-4 rounded-2xl overflow-hidden"
        style={{
          backgroundColor: "var(--bg-elevated)",
          border: "1px solid var(--border-default)",
          boxShadow: "0 25px 50px -12px rgba(0,0,0,0.5)",
        }}
      >
        {/* Close button */}
        <button
          onClick={handleSkip}
          className="absolute top-3 right-3 z-10 w-7 h-7 rounded-lg flex items-center justify-center transition-colors hover:bg-white/10"
          style={{ color: "var(--text-tertiary)" }}
        >
          <X size={14} />
        </button>

        {/* Step content */}
        <div className="px-8 pt-8 pb-4 min-h-[380px] flex flex-col">
          <AnimatePresence mode="wait" custom={direction}>
            <motion.div
              key={step}
              custom={direction}
              variants={variants}
              initial="enter"
              animate="center"
              exit="exit"
              transition={{ duration: 0.25, ease: "easeInOut" }}
              className="flex-1 flex flex-col"
            >
              {step === 0 && <StepWelcome />}
              {step === 1 && <StepModels />}
              {step === 2 && <StepGoal />}
              {step === 3 && <StepObserve />}
              {step === 4 && <StepReady />}
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Footer: dots + buttons */}
        <div
          className="px-8 py-4 flex items-center justify-between"
          style={{ borderTop: "1px solid var(--border-default)" }}
        >
          {/* Step dots */}
          <div className="flex items-center gap-1.5">
            {Array.from({ length: TOTAL_STEPS }).map((_, i) => (
              <div
                key={i}
                className="rounded-full transition-all duration-300"
                style={{
                  width: i === step ? 20 : 6,
                  height: 6,
                  backgroundColor: i === step ? "var(--accent-blue)" : i < step ? "var(--accent-teal)" : "var(--border-default)",
                }}
              />
            ))}
          </div>

          {/* Buttons */}
          <div className="flex items-center gap-2">
            {step > 0 && (
              <button
                onClick={handleBack}
                className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-[12px] font-medium transition-colors hover:bg-white/5"
                style={{ color: "var(--text-secondary)" }}
              >
                <ArrowLeft size={12} />
                Назад
              </button>
            )}
            {step < TOTAL_STEPS - 1 && (
              <button
                onClick={handleSkip}
                className="px-3 py-1.5 rounded-lg text-[12px] transition-colors hover:bg-white/5"
                style={{ color: "var(--text-tertiary)" }}
              >
                Пропустить
              </button>
            )}
            <button
              onClick={handleNext}
              className="flex items-center gap-1.5 px-4 py-1.5 rounded-lg text-[12px] font-medium transition-all hover:brightness-110"
              style={{
                backgroundColor: step === TOTAL_STEPS - 1 ? "var(--accent-teal)" : "var(--accent-blue)",
                color: "#fff",
              }}
            >
              {step === TOTAL_STEPS - 1 ? (
                <>
                  <Rocket size={12} />
                  Начать работу
                </>
              ) : (
                <>
                  Далее
                  <ArrowRight size={12} />
                </>
              )}
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
}

/* ==================== Steps ==================== */

function StepWelcome() {
  return (
    <div className="flex-1 flex flex-col items-center justify-center text-center">
      <div className="text-[56px] mb-4">
        <span role="img" aria-label="office">🏢</span>
      </div>
      <h2 className="text-[22px] font-bold mb-2" style={{ color: "var(--text-primary)" }}>
        Добро пожаловать!
      </h2>
      <p className="text-[14px] leading-relaxed max-w-[360px]" style={{ color: "var(--text-secondary)" }}>
        <span className="font-semibold" style={{ color: "var(--accent-blue)" }}>XeroCode</span> — ваша команда ИИ-агентов.
        Они работают вместе, чтобы решать сложные задачи: от написания кода до исследований и дизайна.
      </p>
      <div className="flex items-center gap-3 mt-6">
        {["🤖", "🧠", "🎨", "📊", "🔍"].map((emoji, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 + i * 0.1 }}
            className="w-10 h-10 rounded-xl flex items-center justify-center text-[20px]"
            style={{ backgroundColor: "var(--bg-surface)", border: "1px solid var(--border-default)" }}
          >
            {emoji}
          </motion.div>
        ))}
      </div>
    </div>
  );
}

function StepModels() {
  const providers = [
    { name: "OpenAI", emoji: "🟢", desc: "GPT-4o, GPT-4" },
    { name: "Anthropic", emoji: "🟠", desc: "Claude 3.5, Claude 3" },
    { name: "Ollama", emoji: "🔵", desc: "Локальные модели" },
    { name: "OpenRouter", emoji: "🟣", desc: "100+ моделей" },
  ];

  return (
    <div className="flex-1 flex flex-col">
      <div className="flex items-center gap-3 mb-4">
        <div
          className="w-10 h-10 rounded-xl flex items-center justify-center"
          style={{ backgroundColor: "rgba(99,102,241,0.15)" }}
        >
          <Settings size={20} style={{ color: "var(--accent-blue)" }} />
        </div>
        <div>
          <h2 className="text-[18px] font-bold" style={{ color: "var(--text-primary)" }}>
            Подключите модели
          </h2>
          <p className="text-[12px]" style={{ color: "var(--text-tertiary)" }}>
            Добавьте ИИ-модели через настройки
          </p>
        </div>
      </div>

      <div className="space-y-2 mb-4">
        {providers.map((p, i) => (
          <motion.div
            key={p.name}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.1 + i * 0.08 }}
            className="flex items-center gap-3 px-3 py-2.5 rounded-xl"
            style={{ backgroundColor: "var(--bg-surface)", border: "1px solid var(--border-default)" }}
          >
            <span className="text-[18px]">{p.emoji}</span>
            <div className="flex-1 min-w-0">
              <div className="text-[13px] font-medium" style={{ color: "var(--text-primary)" }}>{p.name}</div>
              <div className="text-[11px]" style={{ color: "var(--text-tertiary)" }}>{p.desc}</div>
            </div>
          </motion.div>
        ))}
      </div>

      <div
        className="rounded-xl px-3 py-2.5 text-[12px]"
        style={{
          backgroundColor: "rgba(45,212,191,0.08)",
          border: "1px solid rgba(45,212,191,0.2)",
          color: "var(--accent-teal)",
        }}
      >
        💡 Или используйте готовые пулы агентов — они уже настроены и готовы к работе
      </div>
    </div>
  );
}

function StepGoal() {
  const categories = [
    { icon: Code, label: "Код", color: "var(--accent-blue)" },
    { icon: Palette, label: "Дизайн", color: "var(--accent-lavender)" },
    { icon: Search, label: "Ресёрч", color: "var(--accent-teal)" },
    { icon: FileText, label: "Текст", color: "var(--accent-amber)" },
  ];

  return (
    <div className="flex-1 flex flex-col">
      <div className="flex items-center gap-3 mb-4">
        <div
          className="w-10 h-10 rounded-xl flex items-center justify-center"
          style={{ backgroundColor: "rgba(251,191,36,0.15)" }}
        >
          <Target size={20} style={{ color: "var(--accent-amber)" }} />
        </div>
        <div>
          <h2 className="text-[18px] font-bold" style={{ color: "var(--text-primary)" }}>
            Создайте цель
          </h2>
          <p className="text-[12px]" style={{ color: "var(--text-tertiary)" }}>
            Опишите задачу — модели разобьют на подзадачи
          </p>
        </div>
      </div>

      {/* Mockup input */}
      <div
        className="rounded-xl px-4 py-3 mb-4 text-[13px]"
        style={{
          backgroundColor: "var(--bg-surface)",
          border: "1px solid var(--border-default)",
          color: "var(--text-tertiary)",
        }}
      >
        <span style={{ color: "var(--text-placeholder)" }}>Опишите задачу для ИИ-команды...</span>
      </div>

      {/* Category buttons */}
      <p className="text-[11px] font-medium mb-2" style={{ color: "var(--text-tertiary)" }}>
        Выберите категорию:
      </p>
      <div className="flex flex-wrap gap-2 mb-4">
        {categories.map((cat, i) => {
          const Icon = cat.icon;
          return (
            <motion.div
              key={cat.label}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.2 + i * 0.08 }}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[12px] font-medium"
              style={{
                backgroundColor: "var(--bg-elevated)",
                border: `1px solid ${cat.color}`,
                color: cat.color,
              }}
            >
              <Icon size={12} />
              {cat.label}
            </motion.div>
          );
        })}
      </div>

      <div
        className="rounded-xl px-3 py-2.5 text-[12px] leading-relaxed"
        style={{
          backgroundColor: "rgba(99,102,241,0.08)",
          border: "1px solid rgba(99,102,241,0.2)",
          color: "var(--text-secondary)",
        }}
      >
        ✨ Используйте кнопку «Волшебная палочка» для автоматического улучшения промпта с помощью ИИ
      </div>
    </div>
  );
}

function StepObserve() {
  const messages = [
    { name: "Менеджер", text: "Разбиваю задачу на подзадачи...", color: "var(--accent-blue)" },
    { name: "Кодер", text: "Пишу основную логику модуля", color: "var(--accent-teal)" },
    { name: "Ревьюер", text: "Проверяю качество кода", color: "var(--accent-amber)" },
  ];

  return (
    <div className="flex-1 flex flex-col">
      <div className="flex items-center gap-3 mb-4">
        <div
          className="w-10 h-10 rounded-xl flex items-center justify-center"
          style={{ backgroundColor: "rgba(45,212,191,0.15)" }}
        >
          <Eye size={20} style={{ color: "var(--accent-teal)" }} />
        </div>
        <div>
          <h2 className="text-[18px] font-bold" style={{ color: "var(--text-primary)" }}>
            Наблюдайте
          </h2>
          <p className="text-[12px]" style={{ color: "var(--text-tertiary)" }}>
            Следите за работой в реальном времени
          </p>
        </div>
      </div>

      {/* Chat mockup */}
      <div
        className="rounded-xl overflow-hidden flex-1"
        style={{ backgroundColor: "var(--bg-surface)", border: "1px solid var(--border-default)" }}
      >
        <div className="space-y-0">
          {messages.map((msg, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 + i * 0.2 }}
              className="px-4 py-3"
              style={{ borderBottom: i < messages.length - 1 ? "1px solid var(--border-default)" : "none" }}
            >
              <div className="flex items-center gap-2 mb-1">
                <div
                  className="w-5 h-5 rounded-md flex items-center justify-center text-[10px]"
                  style={{ backgroundColor: msg.color, color: "#fff" }}
                >
                  {msg.name[0]}
                </div>
                <span className="text-[11px] font-medium" style={{ color: msg.color }}>
                  {msg.name}
                </span>
              </div>
              <p className="text-[12px] pl-7" style={{ color: "var(--text-secondary)" }}>
                {msg.text}
              </p>
            </motion.div>
          ))}
        </div>
      </div>

      <p className="text-[11px] mt-3 text-center" style={{ color: "var(--text-tertiary)" }}>
        Вы можете вмешиваться, давать команды и корректировать курс в любой момент
      </p>
    </div>
  );
}

function StepReady() {
  return (
    <div className="flex-1 flex flex-col items-center justify-center text-center">
      <motion.div
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ type: "spring", stiffness: 200, damping: 15 }}
        className="text-[64px] mb-4"
      >
        🚀
      </motion.div>
      <h2 className="text-[22px] font-bold mb-2" style={{ color: "var(--text-primary)" }}>
        Всё готово!
      </h2>
      <p className="text-[14px] leading-relaxed max-w-[340px] mb-6" style={{ color: "var(--text-secondary)" }}>
        Ваш ИИ-офис настроен. Создайте первую цель и наблюдайте, как агенты работают над ней вместе.
      </p>
      <div className="flex flex-col gap-2 text-[12px] text-left w-full max-w-[300px]">
        {[
          "Подключите ИИ-модели или используйте пулы",
          "Опишите задачу в чате",
          "Наблюдайте за работой агентов",
        ].map((tip, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.3 + i * 0.12 }}
            className="flex items-center gap-2"
            style={{ color: "var(--text-secondary)" }}
          >
            <div
              className="w-5 h-5 rounded-md flex items-center justify-center text-[10px] font-bold flex-shrink-0"
              style={{ backgroundColor: "var(--accent-blue)", color: "#fff" }}
            >
              {i + 1}
            </div>
            {tip}
          </motion.div>
        ))}
      </div>
    </div>
  );
}
