/**
 * /agent — Terminal page.
 *
 * Primary content: `xerocode-cli` (new). Secondary: the legacy Desktop Agent
 * (WebSocket bridge that executes local tools on behalf of the web AI).
 *
 * Menu label: "Терминал". Route kept as /agent for link continuity.
 */
import { useEffect, useState, useRef } from "react";
import { motion } from "motion/react";
import {
  ArrowLeft, Terminal, FileText, Search, FolderOpen, Shield, RefreshCw,
  Download, Monitor, Cpu, Laptop, Zap, MessageSquare, Layers, Key, Globe,
  GitBranch, Copy, Check, Package, Box, Github,
} from "lucide-react";
import { LogoFull } from "../shared/Logo";

interface AgentPageProps {
  onBack: () => void;
  onLogin: () => void;
  hideHeader?: boolean;
}

/* ── Animated terminal mockup (typewriter) ── */
function TerminalMockup() {
  const [phase, setPhase] = useState<0 | 1 | 2 | 3>(0);
  const [typed, setTyped] = useState("");

  // Phases:
  //   0 → static welcome box (2.5s)
  //   1 → type "xerocode chat" at prompt (1.2s)
  //   2 → show chat intro (2.0s)
  //   3 → type "Hello, XeroCode!" (1.5s), then loop back
  useEffect(() => {
    let timer: ReturnType<typeof setTimeout> | null = null;
    if (phase === 0) {
      timer = setTimeout(() => setPhase(1), 2500);
    } else if (phase === 1) {
      const cmd = "xerocode chat";
      let i = 0;
      const iv = setInterval(() => {
        i++;
        setTyped(cmd.slice(0, i));
        if (i >= cmd.length) {
          clearInterval(iv);
          timer = setTimeout(() => { setTyped(""); setPhase(2); }, 500);
        }
      }, 80);
      return () => { clearInterval(iv); if (timer) clearTimeout(timer); };
    } else if (phase === 2) {
      timer = setTimeout(() => setPhase(3), 2000);
    } else if (phase === 3) {
      const msg = "Помоги написать README для стартапа";
      let i = 0;
      const iv = setInterval(() => {
        i++;
        setTyped(msg.slice(0, i));
        if (i >= msg.length) {
          clearInterval(iv);
          timer = setTimeout(() => { setTyped(""); setPhase(0); }, 2500);
        }
      }, 50);
      return () => { clearInterval(iv); if (timer) clearTimeout(timer); };
    }
    return () => { if (timer) clearTimeout(timer); };
  }, [phase]);

  return (
    <div
      className="rounded-xl overflow-hidden border border-white/[0.1] bg-[#0a0a0f] shadow-2xl shadow-purple-500/10"
      style={{ fontFamily: "ui-monospace, 'SF Mono', Menlo, Consolas, monospace" }}
    >
      {/* macOS-style title bar */}
      <div className="flex items-center gap-2 px-4 py-2.5 bg-white/[0.03] border-b border-white/[0.06]">
        <span className="w-3 h-3 rounded-full bg-rose-500/70" />
        <span className="w-3 h-3 rounded-full bg-amber-500/70" />
        <span className="w-3 h-3 rounded-full bg-emerald-500/70" />
        <span className="flex-1 text-center text-white/40 text-[11px] tracking-wide">
          user@xerocode ~
        </span>
      </div>

      {/* Terminal body */}
      <div className="p-4 md:p-5 text-[12px] md:text-[13px] leading-[1.55] min-h-[340px]">
        {(phase === 0 || phase === 1) && (
          <>
            {/* Welcome box */}
            <pre className="text-purple-400 whitespace-pre">
{`╭ XeroCode CLI v0.1.0-beta.0 ──────────────────────────╮
│                                                      │
│ `}<span className="text-white">Welcome back, user!</span>{`          `}<span className="text-purple-300">Tips for getting started</span>{`        │
│                              `}<span className="text-white/80">xerocode chat</span>{`            │
│          `}<span className="text-purple-300">✕</span>{`                   `}<span className="text-white/80">xerocode run "..."</span>{`         │
│                              `}<span className="text-white/80">xerocode models</span>{`          │
│ `}<span className="text-white/60">user@xerocode.ru</span>{`             `}<span className="text-purple-300">Recent activity</span>{`            │
│ `}<span className="text-white/60">free plan · xerocode_ai</span>{`      `}<span className="text-white/40">No recent activity</span>{`        │
│ `}<span className="text-white/60">~/Desktop/project</span>{`                                   │
│                                                      │
╰──────────────────────────────────────────────────────╯`}
            </pre>
            <div className="mt-3">
              <span className="text-purple-400">›</span>{" "}
              <span className="text-white">{typed}</span>
              <span className="inline-block w-[7px] h-[14px] bg-white/60 ml-0.5 align-middle animate-pulse" />
            </div>
          </>
        )}

        {(phase === 2 || phase === 3) && (
          <>
            <div className="text-white/40 mb-2">
              <span className="text-purple-400">$</span> xerocode chat
            </div>
            <pre className="text-purple-400 whitespace-pre">
{`╭ ✕ XEROCODE ─────────────────────────────────────────╮
│                                                     │
│ `}<span className="text-white">XeroCode Chat</span>{`                                       │
│                                                     │
│ `}<span className="text-white/60">Target:</span>{` `}<span className="text-cyan-300">xerocode_ai</span>{`                                 │
│ `}<span className="text-white/60">System:</span>{` `}<span className="text-white/30">(default)</span>{`                                   │
│                                                     │
│ `}<span className="text-white/50">Type /help for commands, /exit or Ctrl+D to quit.</span>{`   │
│                                                     │
╰─────────────────────────────────────────────────────╯`}
            </pre>
            <div className="mt-3">
              <span className="text-purple-400">›</span>{" "}
              <span className="text-white">{typed}</span>
              <span className="inline-block w-[7px] h-[14px] bg-white/60 ml-0.5 align-middle animate-pulse" />
            </div>
          </>
        )}
      </div>
    </div>
  );
}

/* ── Install code block with copy button ── */
function InstallBlock({
  icon: Icon,
  title,
  subtitle,
  command,
  recommended,
}: {
  icon: typeof Terminal;
  title: string;
  subtitle: string;
  command: string;
  recommended?: boolean;
}) {
  const [copied, setCopied] = useState(false);
  const copy = () => {
    navigator.clipboard.writeText(command);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };
  return (
    <div
      className={`relative p-6 rounded-2xl border transition-all ${
        recommended
          ? "bg-purple-500/[0.04] border-purple-500/25"
          : "bg-white/[0.02] border-white/[0.06] hover:border-white/[0.12]"
      }`}
    >
      {recommended && (
        <span className="absolute -top-2.5 right-4 px-2.5 py-0.5 rounded-full bg-purple-600 text-white text-[10px] font-semibold tracking-wider">
          РЕКОМЕНДУЕМ
        </span>
      )}
      <div className="flex items-center gap-3 mb-4">
        <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
          recommended ? "bg-purple-500/15" : "bg-white/[0.04]"
        }`}>
          <Icon size={20} className={recommended ? "text-purple-300" : "text-white/60"} />
        </div>
        <div>
          <h3 className="text-white font-semibold">{title}</h3>
          <p className="text-white/30 text-xs">{subtitle}</p>
        </div>
      </div>
      <div className="relative group">
        <pre className="p-3 pr-12 rounded-lg bg-black/40 border border-white/[0.06] font-mono text-[12.5px] text-white/80 overflow-x-auto whitespace-pre-wrap break-all">
          {command}
        </pre>
        <button
          onClick={copy}
          className="absolute top-2 right-2 p-1.5 rounded-md bg-white/[0.04] border border-white/[0.08] hover:bg-white/[0.08] text-white/40 hover:text-white/90 transition-all"
          title="Скопировать"
        >
          {copied ? <Check size={14} className="text-emerald-400" /> : <Copy size={14} />}
        </button>
      </div>
    </div>
  );
}

export function AgentPage({ onBack, onLogin, hideHeader }: AgentPageProps) {
  const cliCapabilities = [
    { icon: MessageSquare, title: "Interactive chat", desc: "xerocode chat — REPL со слэш-командами /model, /mode, /system, /clear", color: "#A78BFA" },
    { icon: Zap, title: "One-shot", desc: 'xerocode run "prompt" — одна команда, стриминг ответа, автомат-выход', color: "#FBBF24" },
    { icon: GitBranch, title: "Pipe-friendly", desc: 'cat code.py | xerocode run "add type hints" + --json для скриптов', color: "#5EEAD4" },
    { icon: Layers, title: "5 режимов оркестрации", desc: "--mode swarm/team/auction/manager — команда моделей на одну задачу", color: "#818CF8" },
    { icon: Key, title: "OS keychain", desc: "JWT в macOS Keychain / Win Credential Manager / libsecret. Без plain-text файлов", color: "#10B981" },
    { icon: Globe, title: "Без VPN из РФ", desc: "Прямое подключение к xerocode.ru — русские карты, российские серверы", color: "#FB7185" },
  ];

  const agentCapabilities = [
    { icon: FileText, title: "Файлы", desc: "Создание, чтение и редактирование файлов в вашем проекте", color: "#818CF8" },
    { icon: Terminal, title: "Команды", desc: "Запуск npm, git, build и любых CLI-команд", color: "#5EEAD4" },
    { icon: Search, title: "Поиск по коду", desc: "Grep по паттернам, поиск функций и зависимостей", color: "#FBBF24" },
    { icon: FolderOpen, title: "Навигация", desc: "Обзор структуры проекта, list_files, дерево файлов", color: "#FB7185" },
    { icon: Shield, title: "Песочница", desc: "38 опасных команд заблокировано. Безопасное исполнение.", color: "#10B981" },
    { icon: RefreshCw, title: "Авто-переподключение", desc: "При обрыве соединения — восстановление за 3 секунды", color: "#A78BFA" },
  ];

  // Real download URLs for the Electron Desktop Agent v0.2.0.
  // Update these when a new release is published on GitHub.
  const AGENT_VERSION = "0.2.0";
  const AGENT_BASE =
    `https://github.com/SYL4R2k27/xerocode-ai-office/releases/download/v${AGENT_VERSION}`;
  const platforms = [
    {
      icon: Laptop,
      label: "macOS",
      arch: "Apple Silicon",
      ext: ".dmg",
      url: `${AGENT_BASE}/XeroCode.Agent-${AGENT_VERSION}-arm64.dmg`,
    },
    {
      icon: Monitor,
      label: "Windows",
      arch: "x64 · installer",
      ext: ".exe",
      url: `${AGENT_BASE}/XeroCode.Agent.Setup.${AGENT_VERSION}.exe`,
    },
    {
      icon: Cpu,
      label: "Linux",
      arch: "AppImage",
      ext: ".AppImage",
      url: `${AGENT_BASE}/XeroCode.Agent-${AGENT_VERSION}.AppImage`,
    },
  ];

  return (
    <div className="min-h-screen text-white">
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

      <main className="max-w-[1100px] mx-auto px-6 py-16 md:py-24">

        {/* ═══════════ PART 1: CLI ═══════════ */}

        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-16"
        >
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-purple-500/10 border border-purple-500/20 text-purple-300 text-xs mb-6">
            <Terminal size={12} />
            ТЕРМИНАЛ
          </div>
          <h1 className="text-4xl md:text-5xl font-bold mb-4 tracking-tight">
            XeroCode в{" "}
            <span className="bg-gradient-to-r from-purple-400 to-blue-400 bg-clip-text text-transparent">твоём терминале</span>
          </h1>
          <p className="text-white/50 text-lg max-w-[640px] mx-auto leading-relaxed">
            Чат с командой AI из консоли. Pipe-friendly, 5 режимов оркестрации,
            JWT в OS keychain. Устанавливается одной командой.
          </p>
        </motion.div>

        {/* Live mockup + install side-by-side */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-16 items-start">
          <motion.div
            initial={{ opacity: 0, x: -12 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.15 }}
          >
            <TerminalMockup />
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 12 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.25 }}
            className="space-y-4"
          >
            <InstallBlock
              icon={Box}
              title="Homebrew"
              subtitle="macOS / Linux · самый быстрый способ"
              command={"brew tap SYL4R2k27/tap\nbrew install xerocode"}
              recommended
            />
            <InstallBlock
              icon={Package}
              title="npm"
              subtitle="Any platform · требуется Node.js 18+"
              command="npm install -g xerocode-cli@beta"
            />
            <div className="flex items-center gap-4 text-xs text-white/40 pt-2">
              <a
                href="https://www.npmjs.com/package/xerocode-cli"
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1.5 hover:text-purple-300 transition-colors"
              >
                <Package size={12} /> npm
              </a>
              <a
                href="https://github.com/SYL4R2k27/xerocode-ai-office/tree/main/xerocode-cli"
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1.5 hover:text-purple-300 transition-colors"
              >
                <Github size={12} /> GitHub
              </a>
              <a
                href="https://github.com/SYL4R2k27/homebrew-tap"
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1.5 hover:text-purple-300 transition-colors"
              >
                🍺 tap
              </a>
            </div>
          </motion.div>
        </div>

        {/* CLI capabilities */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.35 }}
        >
          <h2 className="text-2xl font-bold text-white mb-8 text-center">Что умеет CLI</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-16">
            {cliCapabilities.map((c, i) => (
              <motion.div
                key={c.title}
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 + i * 0.06 }}
                whileHover={{ y: -4 }}
                className="p-5 rounded-2xl bg-white/[0.02] border border-white/[0.06] hover:border-white/[0.12] transition-all"
              >
                <div className="w-10 h-10 rounded-lg flex items-center justify-center mb-3" style={{ background: `${c.color}12` }}>
                  <c.icon size={20} style={{ color: c.color }} />
                </div>
                <h3 className="text-white font-semibold text-sm mb-1.5">{c.title}</h3>
                <p className="text-white/50 text-xs leading-relaxed">{c.desc}</p>
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* Commands cheat-sheet */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.55 }}
          className="mb-20 rounded-2xl bg-black/40 border border-white/[0.06] overflow-hidden"
        >
          <div className="flex items-center gap-2 px-5 py-3 border-b border-white/[0.06] bg-white/[0.02]">
            <Terminal size={14} className="text-purple-300" />
            <span className="text-white/70 text-sm font-medium">Основные команды</span>
          </div>
          <pre
            className="p-5 text-[13px] leading-[1.7] overflow-x-auto"
            style={{ fontFamily: "ui-monospace, 'SF Mono', Menlo, monospace" }}
          >
            <div><span className="text-purple-400">$</span> <span className="text-white">xerocode login</span>                          <span className="text-white/40"># device-code auth через браузер</span></div>
            <div><span className="text-purple-400">$</span> <span className="text-white">xerocode chat</span>                           <span className="text-white/40"># interactive REPL</span></div>
            <div><span className="text-purple-400">$</span> <span className="text-white">xerocode run <span className="text-cyan-300">"Объясни квиксорт"</span></span>              <span className="text-white/40"># one-shot</span></div>
            <div><span className="text-purple-400">$</span> <span className="text-white">xerocode run <span className="text-cyan-300">"..."</span> --model claude-3-5-sonnet</span>  <span className="text-white/40"># одна модель</span></div>
            <div><span className="text-purple-400">$</span> <span className="text-white">xerocode --mode swarm run <span className="text-cyan-300">"сравни X и Y"</span></span>      <span className="text-white/40"># оркестрация</span></div>
            <div><span className="text-purple-400">$</span> <span className="text-white">xerocode models</span>                        <span className="text-white/40"># список моделей</span></div>
            <div className="mt-2"><span className="text-purple-400">$</span> <span className="text-white">cat code.py | xerocode run <span className="text-cyan-300">"ревью"</span> --json | jq .response</span></div>
          </pre>
        </motion.div>

        {/* ═══════════ PART 2: Desktop Agent (legacy) ═══════════ */}

        <div className="relative py-8 mb-12">
          <div className="absolute left-0 right-0 top-1/2 h-px bg-gradient-to-r from-transparent via-white/[0.1] to-transparent" />
          <div className="relative text-center">
            <span className="inline-block px-4 py-1 rounded-full bg-[#0a0a0f] text-white/30 text-xs tracking-[0.2em] border border-white/[0.06]">
              DESKTOP AGENT
            </span>
          </div>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.7 }}
          className="text-center mb-12"
        >
          <h2 className="text-3xl md:text-4xl font-bold mb-4 tracking-tight">
            AI работает с твоими{" "}
            <span className="bg-gradient-to-r from-cyan-400 to-blue-400 bg-clip-text text-transparent">
              файлами напрямую
            </span>
          </h2>
          <p className="text-white/50 text-base max-w-[560px] mx-auto leading-relaxed">
            Отдельный компонент для работы с локальными файлами. AI из веб-чата
            читает, редактирует и запускает команды в твоём проекте.
          </p>
        </motion.div>

        {/* Install options for Desktop Agent — Electron App downloads */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.75 }}
          className="mb-12 p-6 md:p-8 rounded-2xl bg-white/[0.02] border border-white/[0.06]"
        >
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-xl bg-purple-500/10 flex items-center justify-center">
              <Download size={20} className="text-purple-400" />
            </div>
            <div>
              <h3 className="text-white font-semibold">Скачать Desktop Agent</h3>
              <p className="text-white/40 text-xs">
                Версия {AGENT_VERSION} · работает в системном трее · автоподключение
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {platforms.map((p) => (
              <a
                key={p.label}
                href={p.url}
                target="_blank"
                rel="noreferrer"
                className="group p-4 rounded-xl bg-white/[0.02] border border-white/[0.06] hover:border-purple-500/30 hover:bg-white/[0.04] transition-all flex items-center gap-4"
              >
                <div className="w-10 h-10 rounded-lg bg-white/[0.03] flex items-center justify-center flex-shrink-0 group-hover:bg-purple-500/15 transition-colors">
                  <p.icon size={20} className="text-white/50 group-hover:text-purple-300 transition-colors" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-white font-semibold text-sm">{p.label}</div>
                  <div className="text-white/40 text-xs">{p.arch}</div>
                </div>
                <Download size={14} className="text-white/30 group-hover:text-purple-300 transition-colors flex-shrink-0" />
              </a>
            ))}
          </div>

          <p className="mt-5 text-xs text-white/30">
            После установки войдите через email, выберите папку проекта и введите Goal ID
            из веб-чата.
          </p>
        </motion.div>

        {/* Agent capabilities */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.85 }}
        >
          <h2 className="text-2xl font-bold text-white mb-8 text-center">Что умеет агент</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {agentCapabilities.map((c, i) => (
              <motion.div
                key={c.title}
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.9 + i * 0.06 }}
                whileHover={{ y: -4 }}
                className="p-5 rounded-2xl bg-white/[0.02] border border-white/[0.06] hover:border-white/[0.12] transition-all"
              >
                <div className="w-10 h-10 rounded-lg flex items-center justify-center mb-3" style={{ background: `${c.color}12` }}>
                  <c.icon size={20} style={{ color: c.color }} />
                </div>
                <h3 className="text-white font-semibold text-sm mb-1">{c.title}</h3>
                <p className="text-white/40 text-xs leading-relaxed">{c.desc}</p>
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* Final CTA */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1.0 }}
          className="mt-20 p-10 rounded-2xl bg-gradient-to-br from-purple-500/[0.08] to-blue-500/[0.04] border border-white/[0.08] text-center"
        >
          <h2 className="text-2xl md:text-3xl font-bold text-white mb-3">
            Начни прямо сейчас
          </h2>
          <p className="text-white/50 text-base mb-6 max-w-[480px] mx-auto">
            Один `brew install` — и XeroCode с тобой в каждом терминале.
          </p>
          <div className="inline-flex items-center gap-3 px-5 py-3 rounded-xl bg-black/50 border border-purple-500/30 font-mono text-sm text-white">
            <span className="text-purple-400">$</span>
            <span>brew install SYL4R2k27/tap/xerocode</span>
          </div>
        </motion.div>

      </main>
    </div>
  );
}
