import { useState, useEffect, useCallback, useMemo } from "react";
import {
  Loader2,
  Eye,
  EyeOff,
  Check,
  AlertCircle,
  Sparkles,
  Zap,
  Shield,
  Bot,
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { toast } from "sonner";

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */
interface AuthPageProps {
  onLogin: (email: string, password: string) => Promise<void>;
  onRegister: (email: string, password: string, name: string, inviteCode?: string) => Promise<void>;
  loading: boolean;
  error: string | null;
}

/* ------------------------------------------------------------------ */
/*  Password-strength helper                                           */
/* ------------------------------------------------------------------ */
function getPasswordStrength(pw: string): { score: number; label: string; color: string } {
  let score = 0;
  if (pw.length >= 6) score++;
  if (pw.length >= 10) score++;
  if (/[A-Z]/.test(pw)) score++;
  if (/[0-9]/.test(pw)) score++;
  if (/[^A-Za-z0-9]/.test(pw)) score++;

  if (score <= 1) return { score: 1, label: "Слабый", color: "var(--accent-rose)" };
  if (score <= 2) return { score: 2, label: "Средний", color: "var(--accent-amber)" };
  if (score <= 3) return { score: 3, label: "Хороший", color: "var(--accent-blue)" };
  return { score: 4, label: "Отличный", color: "var(--accent-teal)" };
}

/* ------------------------------------------------------------------ */
/*  Floating shapes (left panel)                                       */
/* ------------------------------------------------------------------ */
function FloatingShapes() {
  const shapes = useMemo(
    () =>
      Array.from({ length: 6 }, (_, i) => ({
        id: i,
        size: 60 + Math.random() * 120,
        x: 10 + Math.random() * 80,
        y: 10 + Math.random() * 80,
        duration: 18 + Math.random() * 12,
        delay: Math.random() * -20,
        opacity: 0.06 + Math.random() * 0.08,
      })),
    [],
  );

  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {shapes.map((s) => (
        <motion.div
          key={s.id}
          className="absolute rounded-full"
          style={{
            width: s.size,
            height: s.size,
            left: `${s.x}%`,
            top: `${s.y}%`,
            background:
              "linear-gradient(135deg, rgba(147,51,234,0.5), rgba(59,130,246,0.5))",
            opacity: s.opacity,
            filter: "blur(40px)",
          }}
          animate={{
            x: [0, 30, -20, 0],
            y: [0, -25, 15, 0],
            scale: [1, 1.15, 0.9, 1],
          }}
          transition={{
            duration: s.duration,
            repeat: Infinity,
            ease: "easeInOut",
            delay: s.delay,
          }}
        />
      ))}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Floating-label input                                               */
/* ------------------------------------------------------------------ */
interface FloatingInputProps {
  id: string;
  label: string;
  type?: string;
  value: string;
  onChange: (v: string) => void;
  autoComplete?: string;
  delay?: number;
  rightElement?: React.ReactNode;
}

function FloatingInput({
  id,
  label,
  type = "text",
  value,
  onChange,
  autoComplete,
  delay = 0,
  rightElement,
}: FloatingInputProps) {
  const [focused, setFocused] = useState(false);
  const active = focused || value.length > 0;

  return (
    <motion.div
      className="relative"
      initial={false}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, delay }}
    >
      <input
        id={id}
        type={type}
        value={value}
        autoComplete={autoComplete}
        onChange={(e) => onChange(e.target.value)}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        className="peer w-full rounded-xl px-4 pt-5 pb-2 text-[14px] outline-none transition-all duration-200"
        style={{
          backgroundColor: "#141416",
          border: focused
            ? "1px solid rgba(147,51,234,0.5)"
            : "1px solid rgba(255, 255, 255, 0.1)",
          color: "var(--text-primary)",
          boxShadow: focused
            ? "0 0 0 3px rgba(147,51,234,0.1)"
            : "none",
          paddingRight: rightElement ? "2.75rem" : undefined,
        }}
        placeholder=" "
      />
      <label
        htmlFor={id}
        className="absolute left-4 transition-all duration-200 pointer-events-none select-none"
        style={{
          top: active ? "6px" : "50%",
          transform: active ? "none" : "translateY(-50%)",
          fontSize: active ? "10px" : "14px",
          color: focused ? "rgba(147,51,234,0.8)" : "rgba(255, 255, 255, 0.7)",
          fontWeight: active ? 500 : 400,
        }}
      >
        {label}
      </label>
      {rightElement && (
        <div className="absolute right-3 top-1/2 -translate-y-1/2">
          {rightElement}
        </div>
      )}
    </motion.div>
  );
}

/* ------------------------------------------------------------------ */
/*  OAuth button                                                       */
/* ------------------------------------------------------------------ */
function OAuthButton({
  icon,
  label,
  onClick,
}: {
  icon: React.ReactNode;
  label: string;
  onClick: () => void;
}) {
  return (
    <motion.button
      type="button"
      onClick={onClick}
      className="flex items-center justify-center gap-2.5 w-full rounded-xl px-4 py-2.5 text-[13px] font-medium transition-all duration-200"
      style={{
        backgroundColor: "#141416",
        border: "1px solid rgba(255, 255, 255, 0.1)",
        color: "var(--text-secondary)",
      }}
      whileHover={{
        scale: 1.01,
        borderColor: "rgba(147,51,234,0.3)",
        backgroundColor: "rgba(255,255,255,0.03)",
      }}
      whileTap={{ scale: 0.98 }}
    >
      {icon}
      {label}
    </motion.button>
  );
}

/* ------------------------------------------------------------------ */
/*  SVG icons for OAuth                                                */
/* ------------------------------------------------------------------ */
function GoogleIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
      <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4" />
      <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
      <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18A10.97 10.97 0 0 0 1 12c0 1.78.42 3.46 1.18 4.93l3.66-2.84z" fill="#FBBC05" />
      <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
    </svg>
  );
}

function GitHubIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
      <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0 0 24 12c0-6.63-5.37-12-12-12z" />
    </svg>
  );
}

function TelegramIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
      <path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.479.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z" />
    </svg>
  );
}

/* ------------------------------------------------------------------ */
/*  Features list (left panel)                                         */
/* ------------------------------------------------------------------ */
const features = [
  {
    icon: <Bot size={18} />,
    title: "Мульти-агентная система",
    desc: "Несколько ИИ работают над вашей задачей одновременно",
  },
  {
    icon: <Zap size={18} />,
    title: "Ваши подписки — ваша сила",
    desc: "Подключите свои API-ключи и платите только за токены",
  },
  {
    icon: <Shield size={18} />,
    title: "Полный контроль",
    desc: "Управляйте агентами, задачами и бюджетом в реальном времени",
  },
  {
    icon: <Sparkles size={18} />,
    title: "Умная оркестрация",
    desc: "Автоматическое распределение задач между моделями",
  },
];

/* ================================================================== */
/*  AuthPage                                                           */
/* ================================================================== */
export function AuthPage({ onLogin, onRegister, loading, error }: AuthPageProps) {
  const [mode, setMode] = useState<"login" | "register">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [inviteCode, setInviteCode] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [localError, setLocalError] = useState<string | null>(null);
  const [shakeError, setShakeError] = useState(false);
  const [success, setSuccess] = useState(false);

  const displayError = error || localError;
  const pwStrength = password ? getPasswordStrength(password) : null;

  // Trigger shake on error
  useEffect(() => {
    if (displayError) {
      setShakeError(true);
      const t = setTimeout(() => setShakeError(false), 500);
      return () => clearTimeout(t);
    }
  }, [displayError]);

  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      setLocalError(null);

      if (!email || !password) {
        setLocalError("Заполните все обязательные поля");
        return;
      }
      if (mode === "register" && !name) {
        setLocalError("Введите имя");
        return;
      }
      if (mode === "register" && !inviteCode) {
        setLocalError("Введите инвайт-код для доступа к бета-тесту");
        return;
      }
      if (password.length < 6) {
        setLocalError("Пароль должен быть не менее 6 символов");
        return;
      }

      try {
        if (mode === "login") {
          await onLogin(email, password);
        } else {
          await onRegister(email, password, name, inviteCode);
        }
        setSuccess(true);
      } catch {
        // handled by store
      }
    },
    [email, password, name, mode, onLogin, onRegister],
  );

  const switchMode = () => {
    setMode((m) => (m === "login" ? "register" : "login"));
    setLocalError(null);
  };

  const handleOAuth = (provider: string) => {
    toast("Скоро!", {
      description: `Вход через ${provider} будет доступен в ближайшее время`,
    });
  };

  /* ---------------------------------------------------------------- */
  /*  Render                                                           */
  /* ---------------------------------------------------------------- */
  return (
    <div
      className="flex min-h-screen w-full"
      style={{ backgroundColor: "#0F0F12" }}
    >
      {/* ============ LEFT PANEL (hidden on mobile) ============ */}
      <div className="hidden lg:flex lg:w-1/2 relative flex-col justify-center px-16 overflow-hidden">
        {/* Gradient bg */}
        <div
          className="absolute inset-0"
          style={{
            background:
              "linear-gradient(135deg, #0F0F12 0%, #1a0a2e 40%, #0d1b3e 70%, #0F0F12 100%)",
          }}
        />

        <FloatingShapes />

        {/* Content */}
        <div className="relative z-10 max-w-md">
          <motion.div
            initial={false}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
          >
            {/* Logo */}
            <div className="flex items-center gap-3 mb-8">
              <div
                className="w-10 h-10 rounded-xl flex items-center justify-center"
                style={{
                  background: "linear-gradient(135deg, #9333ea, #3b82f6)",
                }}
              >
                <Sparkles size={20} className="text-white" />
              </div>
              <span
                className="text-[22px] font-bold"
                style={{ color: "var(--text-primary)" }}
              >
                XeroCode
              </span>
            </div>

            {/* Tagline */}
            <h2
              className="text-[32px] font-bold leading-tight mb-4"
              style={{ color: "var(--text-primary)" }}
            >
              Ваша команда
              <br />
              <span
                style={{
                  background: "linear-gradient(135deg, #9333ea, #3b82f6)",
                  WebkitBackgroundClip: "text",
                  WebkitTextFillColor: "transparent",
                }}
              >
                ИИ-агентов
              </span>
            </h2>
            <p
              className="text-[15px] leading-relaxed mb-10"
              style={{ color: "var(--text-secondary)" }}
            >
              Подключайте свои модели, ставьте цели — агенты сделают остальное.
            </p>
          </motion.div>

          {/* Features */}
          <div className="space-y-5">
            {features.map((f, i) => (
              <motion.div
                key={i}
                className="flex items-start gap-4"
                initial={false}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.4, delay: 0.4 + i * 0.1 }}
              >
                <div
                  className="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0"
                  style={{
                    background:
                      "linear-gradient(135deg, rgba(147,51,234,0.15), rgba(59,130,246,0.15))",
                    color: "#9333ea",
                  }}
                >
                  {f.icon}
                </div>
                <div>
                  <div
                    className="text-[13px] font-semibold mb-0.5"
                    style={{ color: "var(--text-primary)" }}
                  >
                    {f.title}
                  </div>
                  <div
                    className="text-[12px] leading-relaxed"
                    style={{ color: "var(--text-tertiary)" }}
                  >
                    {f.desc}
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </div>

      {/* ============ RIGHT PANEL ============ */}
      <div className="flex-1 flex items-center justify-center p-6 lg:p-16">
        <div
          className="w-full max-w-[420px]"
        >
          {/* Mobile logo */}
          <div className="lg:hidden flex items-center gap-3 mb-8 justify-center">
            <div
              className="w-10 h-10 rounded-xl flex items-center justify-center"
              style={{
                background: "linear-gradient(135deg, #9333ea, #3b82f6)",
              }}
            >
              <Sparkles size={20} className="text-white" />
            </div>
            <span
              className="text-[22px] font-bold"
              style={{ color: "var(--text-primary)" }}
            >
              XeroCode
            </span>
          </div>

          {/* Card */}
          <div
            className="rounded-2xl p-8 shadow-2xl backdrop-blur-xl"
            style={{
              backgroundColor: "rgba(28, 28, 30, 0.9)",
              border: "1px solid rgba(255, 255, 255, 0.1)",
            }}
          >
            {/* Tabs */}
            <div className="flex mb-8 rounded-xl overflow-hidden" style={{ backgroundColor: "#141416", border: "1px solid rgba(255,255,255,0.06)" }}>
              {(["login", "register"] as const).map((tab) => (
                <button
                  key={tab}
                  onClick={() => {
                    setMode(tab);
                    setLocalError(null);
                  }}
                  className="flex-1 py-2.5 text-[13px] font-medium transition-all duration-200 relative"
                  style={{
                    color:
                      mode === tab ? "var(--text-primary)" : "var(--text-tertiary)",
                    backgroundColor: mode === tab ? "#2A2A2D" : "transparent",
                  }}
                >
                  {tab === "login" ? "Вход" : "Регистрация"}
                  {mode === tab && (
                    <motion.div
                      className="absolute bottom-0 left-0 right-0 h-[2px]"
                      style={{
                        background: "linear-gradient(90deg, #9333ea, #3b82f6)",
                      }}
                      layoutId="auth-tab-indicator"
                      transition={{ duration: 0.3, ease: "easeOut" }}
                    />
                  )}
                </button>
              ))}
            </div>

            {/* Error */}
            <AnimatePresence mode="wait">
              {displayError && (
                <motion.div
                  className="mb-5 px-4 py-3 rounded-xl flex items-center gap-2.5 text-[13px]"
                  style={{
                    backgroundColor: "rgba(212,106,106,0.08)",
                    color: "var(--accent-rose)",
                    border: "1px solid rgba(212,106,106,0.2)",
                  }}
                  initial={false}
                  animate={{
                    opacity: 1,
                    y: 0,
                    x: shakeError ? [0, -6, 6, -4, 4, 0] : 0,
                  }}
                  exit={{ opacity: 0, y: -8 }}
                  transition={{ duration: 0.3 }}
                >
                  <AlertCircle size={15} className="flex-shrink-0" />
                  {displayError}
                </motion.div>
              )}
            </AnimatePresence>

            {/* Success */}
            <AnimatePresence>
              {success && (
                <motion.div
                  className="mb-5 px-4 py-3 rounded-xl flex items-center gap-2.5 text-[13px]"
                  style={{
                    backgroundColor: "rgba(90,191,173,0.08)",
                    color: "var(--accent-teal)",
                    border: "1px solid rgba(90,191,173,0.2)",
                  }}
                  initial={false}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0 }}
                >
                  <Check size={15} className="flex-shrink-0" />
                  Вход выполнен успешно
                </motion.div>
              )}
            </AnimatePresence>

            {/* Form */}
            <AnimatePresence mode="wait">
              <motion.form
                key={mode}
                onSubmit={handleSubmit}
                className="space-y-4"
                initial={false}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: mode === "login" ? 20 : -20 }}
                transition={{ duration: 0.25 }}
              >
                {mode === "register" && (
                  <FloatingInput
                    id="name"
                    label="Имя"
                    value={name}
                    onChange={setName}
                    autoComplete="name"
                    delay={0}
                  />
                )}

                <FloatingInput
                  id="email"
                  label="Email"
                  type="email"
                  value={email}
                  onChange={setEmail}
                  autoComplete="email"
                  delay={mode === "register" ? 0.05 : 0}
                />

                <FloatingInput
                  id="password"
                  label="Пароль"
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={setPassword}
                  autoComplete={
                    mode === "login" ? "current-password" : "new-password"
                  }
                  delay={mode === "register" ? 0.1 : 0.05}
                  rightElement={
                    <button
                      type="button"
                      onClick={() => setShowPassword((s) => !s)}
                      className="p-0.5 transition-colors"
                      style={{ color: "var(--text-tertiary)" }}
                    >
                      {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  }
                />

                {/* Password strength (register only) */}
                {mode === "register" && password.length > 0 && pwStrength && (
                  <motion.div
                    className="space-y-1.5"
                    initial={false}
                    animate={{ opacity: 1, height: "auto" }}
                    transition={{ duration: 0.2 }}
                  >
                    <div className="flex gap-1">
                      {[1, 2, 3, 4].map((level) => (
                        <div
                          key={level}
                          className="h-1 flex-1 rounded-full transition-colors duration-300"
                          style={{
                            backgroundColor:
                              level <= pwStrength.score
                                ? pwStrength.color
                                : "var(--border-default)",
                          }}
                        />
                      ))}
                    </div>
                    <div
                      className="text-[11px]"
                      style={{ color: pwStrength.color }}
                    >
                      {pwStrength.label}
                    </div>
                  </motion.div>
                )}

                {/* Invite code (бета-тест, только регистрация) */}
                {mode === "register" && (
                  <FloatingInput
                    id="invite"
                    label="Инвайт-код (бета-тест)"
                    value={inviteCode}
                    onChange={setInviteCode}
                    autoComplete="off"
                    delay={0.15}
                  />
                )}

                {/* Forgot password (login only) */}
                {mode === "login" && (
                  <motion.div
                    className="text-right"
                    initial={false}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.15 }}
                  >
                    <button
                      type="button"
                      onClick={() =>
                        toast("Скоро!", {
                          description: "Восстановление пароля будет доступно в ближайшее время",
                        })
                      }
                      className="text-[12px] transition-colors hover:underline"
                      style={{ color: "var(--text-tertiary)" }}
                    >
                      Забыли пароль?
                    </button>
                  </motion.div>
                )}

                {/* Submit */}
                <motion.button
                  type="submit"
                  disabled={loading}
                  className="w-full py-3 rounded-xl text-[14px] font-semibold text-white transition-all duration-200 flex items-center justify-center gap-2 disabled:opacity-50"
                  style={{
                    background: "linear-gradient(135deg, #9333ea, #3b82f6)",
                  }}
                  whileHover={{ scale: 1.01, brightness: 1.1 }}
                  whileTap={{ scale: 0.98 }}
                  initial={false}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: mode === "register" ? 0.15 : 0.1 }}
                >
                  {loading && <Loader2 size={16} className="animate-spin" />}
                  {mode === "login" ? "Войти" : "Создать аккаунт"}
                </motion.button>
              </motion.form>
            </AnimatePresence>

            {/* Divider */}
            <div className="flex items-center gap-3 my-6">
              <div className="flex-1 h-px" style={{ backgroundColor: "#2A2A2D" }} />
              <span className="text-[11px]" style={{ color: "var(--text-tertiary)" }}>
                или
              </span>
              <div className="flex-1 h-px" style={{ backgroundColor: "#2A2A2D" }} />
            </div>

            {/* OAuth */}
            <motion.div
              className="space-y-2.5"
              initial={false}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.3 }}
            >
              <OAuthButton
                icon={<GoogleIcon />}
                label="Войти через Google"
                onClick={() => handleOAuth("Google")}
              />
              <OAuthButton
                icon={<GitHubIcon />}
                label="Войти через GitHub"
                onClick={() => handleOAuth("GitHub")}
              />
              <OAuthButton
                icon={<TelegramIcon />}
                label="Войти через Telegram"
                onClick={() => handleOAuth("Telegram")}
              />
            </motion.div>

            {/* Switch mode */}
            <motion.div
              className="mt-6 text-center"
              initial={false}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.35 }}
            >
              <span
                className="text-[13px]"
                style={{ color: "var(--text-tertiary)" }}
              >
                {mode === "login" ? "Нет аккаунта?" : "Уже есть аккаунт?"}{" "}
              </span>
              <button
                onClick={switchMode}
                className="text-[13px] font-medium transition-colors"
                style={{
                  background: "linear-gradient(135deg, #9333ea, #3b82f6)",
                  WebkitBackgroundClip: "text",
                  WebkitTextFillColor: "transparent",
                }}
              >
                {mode === "login" ? "Зарегистрироваться" : "Войти"}
              </button>
            </motion.div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div
        className="absolute bottom-0 left-0 right-0 py-3 text-center text-[10px]"
        style={{ color: "var(--text-tertiary)" }}
      >
        © 2026 XeroCode — Vladimir Tirskikh · ИНН 503015361714 · Владимир Тирских
      </div>
    </div>
  );
}
