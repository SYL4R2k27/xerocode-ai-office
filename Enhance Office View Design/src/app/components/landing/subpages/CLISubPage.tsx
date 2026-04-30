/**
 * CLI / Терминал — самая богатая sub-страница.
 * Использует БРЕНДБУК (Section 20): ASCII XEROCODE с gradient, splash/header/spinner/progress.
 * Контент из v2 AgentPage: terminal mockup + 2 install + capabilities + cheat-sheet + Desktop Agent.
 */
import { useEffect, useState } from "react";
import { motion } from "motion/react";
import {
  Terminal, Box, Package, Github, Copy, Check,
  MessageSquare, Zap, GitBranch, Layers, Key, Globe,
  FileText, Search, FolderOpen, Shield, RefreshCw,
  Download, Monitor, Cpu, Laptop,
} from "lucide-react";
import { SubPageHero } from "../shared/SubPageHero";
import { SectionHeader } from "../shared/SectionHeader";
import { FinalCTA } from "../shared/FinalCTA";

interface Props {
  onBack: () => void;
  onCTA?: () => void;
}

const AGENT_VERSION = "0.2.0";
const AGENT_BASE = `https://github.com/SYL4R2k27/xerocode-ai-office/releases/download/v${AGENT_VERSION}`;

// ────────────────────────────────────────────────────────────────────────
// CheatSheet — структурированная шпаргалка команд
// ────────────────────────────────────────────────────────────────────────

interface CmdLine {
  cmd?: string;            // основная команда (выделена белым)
  arg?: string;            // аргумент в кавычках (cyan)
  argTail?: string;        // продолжение команды после arg (белый)
  comment?: string;        // # комментарий (muted)
  raw?: string;            // если просто текст без $ префикса
  bullet?: string;         // префикс типа SPINNER:
  bulletColor?: string;
}

const CHEATSHEET_GROUPS: Array<{ title: string; lines: CmdLine[] }> = [
  {
    title: "Авторизация и базовые команды",
    lines: [
      { cmd: "xerocode login",   comment: "device-code auth через браузер" },
      { cmd: "xerocode chat",    comment: "interactive REPL" },
      { cmd: "xerocode models",  comment: "список моделей" },
    ],
  },
  {
    title: "One-shot и режимы",
    lines: [
      { cmd: "xerocode run ", arg: "\"Объясни квиксорт\"",                                          comment: "one-shot" },
      { cmd: "xerocode run ", arg: "\"...\"", argTail: " --model claude-sonnet-4-6",                comment: "одна модель" },
      { cmd: "xerocode --mode swarm run ", arg: "\"сравни X и Y\"",                                 comment: "swarm-оркестрация" },
      { cmd: "xerocode --mode team run ", arg: "\"design system\"",                                 comment: "team-режим" },
    ],
  },
  {
    title: "Pipe и автоматизация",
    lines: [
      { cmd: "cat code.py | xerocode run ", arg: "\"ревью кода\"", argTail: " --json | jq .response" },
      { cmd: "xerocode doc ",   arg: "\"квартальный отчёт\"", argTail: " --output report.pptx" },
      { cmd: "xerocode image ", arg: "\"futuristic kitchen\"",  argTail: " --size 1024x1024" },
    ],
  },
];

const CHEATSHEET_STATUS: Array<{ label: string; bullets: Array<{ text: string; color: string }> }> = [
  {
    label: "SPINNER:",
    bullets: [{ text: "⠋ ⠙ ⠹ ⠸ ⠼ ⠴ ⠦ ⠧ ⠇ ⠏", color: "#8B6FFF" }],
  },
  {
    label: "PROGRESS:",
    bullets: [
      { text: "▰▰▰▰▰", color: "var(--violet-500)" },
      { text: "▱▱▱▱▱", color: "var(--text-muted)" },
      { text: " 50%", color: "var(--amber-500)" },
      { text: "   draft.pptx", color: "var(--ink-200)" },
    ],
  },
  {
    label: "STATES:",
    bullets: [
      { text: "✓ done   ",     color: "var(--aurora)" },
      { text: "⚠ warn   ",     color: "var(--amber-500)" },
      { text: "⚙ running   ",  color: "var(--violet-500)" },
      { text: "○ queued   ",   color: "var(--text-muted)" },
      { text: "✕ error",       color: "#FF3B5C" },
    ],
  },
];

function CheatSheetLine({ line }: { line: CmdLine }) {
  return (
    <div style={{ display: "flex", flexWrap: "wrap", gap: 4, alignItems: "baseline" }}>
      {line.bullet ? (
        <span style={{ color: line.bulletColor || "var(--ink-300)", marginRight: 8, minWidth: 80, display: "inline-block" }}>
          {line.bullet}
        </span>
      ) : (
        <span style={{ color: "var(--violet-500)", marginRight: 6 }}>$</span>
      )}
      {line.cmd && <span style={{ color: "var(--ink-50)" }}>{line.cmd}</span>}
      {line.arg && <span style={{ color: "var(--cyan-500)" }}>{line.arg}</span>}
      {line.argTail && <span style={{ color: "var(--ink-50)" }}>{line.argTail}</span>}
      {line.comment && (
        <span style={{ color: "var(--text-muted)", marginLeft: "auto", paddingLeft: 24 }}>
          # {line.comment}
        </span>
      )}
    </div>
  );
}

function CheatSheet() {
  return (
    <div
      style={{
        padding: 24,
        fontFamily: "var(--font-mono)",
        fontSize: 13,
        lineHeight: 1.9,
        color: "var(--ink-200)",
        overflowX: "auto",
      }}
    >
      {CHEATSHEET_GROUPS.map((group, gi) => (
        <div key={group.title} style={{ marginBottom: gi === CHEATSHEET_GROUPS.length - 1 ? 24 : 32 }}>
          <div style={{ color: "var(--text-muted)", marginBottom: 8 }}># {group.title}</div>
          {group.lines.map((line, i) => (
            <CheatSheetLine key={i} line={line} />
          ))}
        </div>
      ))}

      <div style={{ marginTop: 16, paddingTop: 16, borderTop: "1px solid var(--border-subtle)" }}>
        <div style={{ color: "var(--text-muted)", marginBottom: 12 }}># Прогресс / статусы / спиннеры</div>
        {CHEATSHEET_STATUS.map((s) => (
          <div key={s.label} style={{ display: "flex", alignItems: "baseline", flexWrap: "wrap", marginBottom: 6 }}>
            <span style={{ color: "var(--ink-300)", minWidth: 100, display: "inline-block" }}>{s.label}</span>
            {s.bullets.map((b, j) => (
              <span key={j} style={{ color: b.color }}>{b.text}</span>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}

// ────────────────────────────────────────────────────────────────────────
// Animated XEROCODE Terminal — анимированный typewriter в стиле брендбука
// ────────────────────────────────────────────────────────────────────────

function BrandbookTerminal() {
  const [phase, setPhase] = useState<0 | 1 | 2 | 3>(0);
  const [typed, setTyped] = useState("");

  useEffect(() => {
    let timer: ReturnType<typeof setTimeout> | null = null;
    if (phase === 0) {
      timer = setTimeout(() => setPhase(1), 2800);
    } else if (phase === 1) {
      const cmd = "xerocode chat";
      let i = 0;
      const iv = setInterval(() => {
        i++;
        setTyped(cmd.slice(0, i));
        if (i >= cmd.length) {
          clearInterval(iv);
          timer = setTimeout(() => { setTyped(""); setPhase(2); }, 600);
        }
      }, 70);
      return () => { clearInterval(iv); if (timer) clearTimeout(timer); };
    } else if (phase === 2) {
      timer = setTimeout(() => setPhase(3), 2200);
    } else if (phase === 3) {
      const msg = "Сделай питч-дек на 8 слайдов про Q2 рост";
      let i = 0;
      const iv = setInterval(() => {
        i++;
        setTyped(msg.slice(0, i));
        if (i >= msg.length) {
          clearInterval(iv);
          timer = setTimeout(() => { setTyped(""); setPhase(0); }, 2800);
        }
      }, 50);
      return () => { clearInterval(iv); if (timer) clearTimeout(timer); };
    }
    return () => { if (timer) clearTimeout(timer); };
  }, [phase]);

  return (
    <div
      style={{
        background: "#050510",
        border: "1px solid var(--border-subtle)",
        borderRadius: "var(--radius-lg)",
        overflow: "hidden",
        fontFamily: "var(--font-mono)",
        boxShadow: "0 24px 48px rgba(0,0,0,0.5), 0 0 64px rgba(124,92,255,0.2)",
      }}
    >
      {/* macOS bar */}
      <div
        style={{
          background: "var(--void-800)",
          padding: "10px 16px",
          display: "flex",
          alignItems: "center",
          gap: 8,
          borderBottom: "1px solid var(--border-subtle)",
        }}
      >
        <span style={{ width: 12, height: 12, borderRadius: "50%", background: "#FF5F56" }} />
        <span style={{ width: 12, height: 12, borderRadius: "50%", background: "#FFBD2E" }} />
        <span style={{ width: 12, height: 12, borderRadius: "50%", background: "#27C93F" }} />
        <span
          style={{
            marginLeft: "auto",
            fontSize: 11,
            color: "var(--ink-400)",
            letterSpacing: "0.1em",
          }}
        >
          ~/xerocode · zsh · 80×24
        </span>
      </div>

      {/* Terminal body */}
      <div
        style={{
          padding: 24,
          fontSize: 12,
          lineHeight: 1.55,
          color: "var(--ink-200)",
          minHeight: 380,
          whiteSpace: "pre",
          overflowX: "auto",
        }}
      >
        {(phase === 0 || phase === 1) && (
          <>
            {/* ASCII XEROCODE с gradient на CODE — из брендбука */}
            <div>
              <span style={{ color: "var(--ink-50)" }}>{`__  __  _____  ____    ___ `}</span>
              <span style={{ color: "var(--violet-500)", fontStyle: "italic" }}>{`  ____  ___   ____  _____`}</span>
            </div>
            <div>
              <span style={{ color: "var(--ink-50)" }}>{`\\ \\/ / | ____||  _ \\  / _ \\`}</span>
              <span style={{ color: "var(--violet-500)", fontStyle: "italic" }}>{` / ___|/ _ \\ |  _ \\| ____|`}</span>
            </div>
            <div>
              <span style={{ color: "var(--ink-50)" }}>{` \\  /  |  _|  | |_) || | | `}</span>
              <span style={{ color: "#8B6FFF", fontStyle: "italic" }}>{`|`}</span>
              <span style={{ color: "#8B6FFF", fontStyle: "italic" }}>{` |   | | | || | | ||  _|  `}</span>
            </div>
            <div>
              <span style={{ color: "var(--ink-50)" }}>{` /  \\  | |___ |  _ < | |_| `}</span>
              <span style={{ color: "#5882FF", fontStyle: "italic" }}>{`|`}</span>
              <span style={{ color: "#2DA8FF", fontStyle: "italic" }}>{` |___| |_| || |_| || |___ `}</span>
            </div>
            <div>
              <span style={{ color: "var(--ink-50)" }}>{`/_/\\_\\ |_____||_| \\_\\ \\___/`}</span>
              <span style={{ color: "var(--cyan-500)", fontStyle: "italic" }}>{` \\____|\\___/ |____/ |_____|`}</span>
            </div>
            <div style={{ marginTop: 12, color: "var(--ink-300)" }}>
              {"  AI-Office · v0.1.0-beta · multi-model orchestration"}
            </div>
            <div>
              <span style={{ color: "var(--amber-500)" }}>{"  ▸"}</span>
              <span style={{ color: "var(--ink-300)" }}>{" 430+ models · BYOK · DAG · 8 workspaces"}</span>
            </div>
            <div>
              <span style={{ color: "var(--amber-500)" }}>{"  ▸"}</span>
              <span style={{ color: "var(--ink-300)" }}>{" Made in Russia · MMXXVI · xerocode.ru"}</span>
            </div>
            <div style={{ marginTop: 12 }}>
              <span style={{ color: "var(--violet-500)" }}>›</span>
              <span style={{ color: "var(--ink-50)" }}>{` ${typed}`}</span>
              <span
                style={{
                  display: "inline-block",
                  width: 7,
                  height: 14,
                  background: "var(--ink-50)",
                  marginLeft: 2,
                  verticalAlign: "middle",
                  animation: "xc-cursor 1s steps(2) infinite",
                }}
              />
            </div>
          </>
        )}

        {(phase === 2 || phase === 3) && (
          <>
            <div style={{ color: "var(--text-muted)", marginBottom: 12 }}>
              <span style={{ color: "var(--violet-500)" }}>$</span>{" xerocode chat"}
            </div>
            <div style={{ color: "var(--cyan-500)" }}>
              ▰▱{" "}
              <span style={{ color: "var(--ink-50)" }}>XERO</span>
              <span style={{ color: "var(--violet-500)", fontStyle: "italic" }}>CODE</span>
              {"  v0.1.0  "}
              <span style={{ color: "var(--amber-500)" }}>●</span>
              <span style={{ color: "var(--ink-300)" }}>{" connected  "}</span>
              <span style={{ color: "var(--aurora)" }}>● online</span>
            </div>
            <div style={{ marginTop: 16, color: "var(--ink-200)" }}>
              <span style={{ color: "var(--text-muted)" }}>Target:</span>{" "}
              <span style={{ color: "var(--cyan-500)" }}>xerocode_ai</span>
              {"   "}
              <span style={{ color: "var(--text-muted)" }}>Mode:</span>{" "}
              <span style={{ color: "var(--violet-500)" }}>swarm</span>
            </div>
            <div style={{ color: "var(--ink-300)", marginTop: 8, fontSize: 11 }}>
              {"  Type /help, /model, /exit · Ctrl+D to quit."}
            </div>
            <div style={{ marginTop: 20 }}>
              <span style={{ color: "var(--violet-500)" }}>›</span>
              <span style={{ color: "var(--ink-50)" }}>{` ${typed}`}</span>
              <span
                style={{
                  display: "inline-block",
                  width: 7,
                  height: 14,
                  background: "var(--ink-50)",
                  marginLeft: 2,
                  verticalAlign: "middle",
                  animation: "xc-cursor 1s steps(2) infinite",
                }}
              />
            </div>
          </>
        )}
      </div>
    </div>
  );
}

// ────────────────────────────────────────────────────────────────────────
// Install block с copy-button
// ────────────────────────────────────────────────────────────────────────

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
      style={{
        position: "relative",
        background: recommended ? "rgba(124,92,255,0.04)" : "var(--void-800)",
        border: `1px solid ${recommended ? "rgba(124,92,255,0.30)" : "var(--border-subtle)"}`,
        borderRadius: "var(--radius-lg)",
        padding: 24,
      }}
    >
      {recommended && (
        <span
          style={{
            position: "absolute",
            top: -10,
            right: 16,
            padding: "3px 10px",
            borderRadius: 9999,
            background: "var(--violet-500)",
            color: "white",
            fontFamily: "var(--font-mono)",
            fontSize: 10,
            fontWeight: 700,
            letterSpacing: "0.15em",
          }}
        >
          РЕКОМЕНДУЕМ
        </span>
      )}
      <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 16 }}>
        <div
          style={{
            width: 40,
            height: 40,
            borderRadius: "var(--radius-md)",
            background: recommended ? "rgba(124,92,255,0.15)" : "var(--void-700)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <Icon size={20} color={recommended ? "var(--violet-500)" : "var(--ink-300)"} strokeWidth={1.75} />
        </div>
        <div>
          <h3 style={{ fontFamily: "var(--font-sans)", fontWeight: 600, color: "var(--ink-50)", fontSize: 15, margin: 0 }}>
            {title}
          </h3>
          <p style={{ color: "var(--text-muted)", fontSize: 12, margin: "2px 0 0", fontFamily: "var(--font-mono)", letterSpacing: "0.05em" }}>
            {subtitle}
          </p>
        </div>
      </div>
      <div style={{ position: "relative" }}>
        <pre
          style={{
            padding: "12px 48px 12px 16px",
            borderRadius: "var(--radius-sm)",
            background: "#050510",
            border: "1px solid var(--border-subtle)",
            fontFamily: "var(--font-mono)",
            fontSize: 12.5,
            color: "var(--ink-100)",
            overflowX: "auto",
            whiteSpace: "pre-wrap",
            wordBreak: "break-all",
            margin: 0,
          }}
        >
          {command}
        </pre>
        <button
          onClick={copy}
          style={{
            position: "absolute",
            top: 8,
            right: 8,
            padding: 6,
            borderRadius: "var(--radius-xs)",
            background: "var(--void-700)",
            border: "1px solid var(--border-subtle)",
            color: copied ? "var(--aurora)" : "var(--ink-300)",
            cursor: "pointer",
            transition: "color 200ms, background 200ms",
            display: "flex",
            alignItems: "center",
          }}
          onMouseEnter={(e) => { e.currentTarget.style.background = "var(--void-600)"; }}
          onMouseLeave={(e) => { e.currentTarget.style.background = "var(--void-700)"; }}
          title="Скопировать"
        >
          {copied ? <Check size={14} /> : <Copy size={14} />}
        </button>
      </div>
    </div>
  );
}

// ────────────────────────────────────────────────────────────────────────
// MAIN
// ────────────────────────────────────────────────────────────────────────

export function CLISubPage({ onBack, onCTA }: Props) {
  const cliCapabilities = [
    { icon: MessageSquare, title: "Interactive chat",         desc: "xerocode chat — REPL со слэш-командами /model, /mode, /system, /clear", color: "#7C5CFF" },
    { icon: Zap,           title: "One-shot",                 desc: "xerocode run \"prompt\" — одна команда, стриминг ответа, автомат-выход", color: "#FFB547" },
    { icon: GitBranch,     title: "Pipe-friendly",            desc: "cat code.py | xerocode run \"add type hints\" + --json для скриптов",     color: "#22C55E" },
    { icon: Layers,        title: "5 режимов оркестрации",    desc: "--mode swarm/team/auction/manager — команда моделей на одну задачу",     color: "#00D4FF" },
    { icon: Key,           title: "OS keychain",              desc: "JWT в macOS Keychain / Win Credential Manager / libsecret",              color: "#FF6BFF" },
    { icon: Globe,         title: "Без VPN из РФ",            desc: "Прямое подключение к xerocode.ru — русские карты, российские серверы",   color: "#FF3B5C" },
  ];

  const agentCapabilities = [
    { icon: FileText,    title: "Файлы",                  desc: "Создание, чтение и редактирование файлов в вашем проекте",         color: "#7C5CFF" },
    { icon: Terminal,    title: "Команды",                desc: "Запуск npm, git, build и любых CLI-команд",                         color: "#00D4FF" },
    { icon: Search,      title: "Поиск по коду",          desc: "Grep по паттернам, поиск функций и зависимостей",                   color: "#FFB547" },
    { icon: FolderOpen,  title: "Навигация",              desc: "Обзор структуры проекта, list_files, дерево файлов",                color: "#FF3B5C" },
    { icon: Shield,      title: "Песочница",              desc: "38 опасных команд заблокировано. Безопасное исполнение.",           color: "#22C55E" },
    { icon: RefreshCw,   title: "Авто-переподключение",   desc: "При обрыве соединения — восстановление за 3 секунды",               color: "#FF6BFF" },
  ];

  const platforms = [
    { icon: Laptop,  label: "macOS",   arch: "Apple Silicon",     url: `${AGENT_BASE}/XeroCode.Agent-${AGENT_VERSION}-arm64.dmg` },
    { icon: Monitor, label: "Windows", arch: "x64 · installer",   url: `${AGENT_BASE}/XeroCode.Agent.Setup.${AGENT_VERSION}.exe` },
    { icon: Cpu,     label: "Linux",   arch: "AppImage",          url: `${AGENT_BASE}/XeroCode.Agent-${AGENT_VERSION}.AppImage` },
  ];

  return (
    <>
      <SubPageHero
        num="02"
        title={<>Терми<em style={{ color: "var(--amber-500)", fontStyle: "italic", fontWeight: 400 }}>нал.</em></>}
        subtitle="XeroCode для разработчиков. Командная строка. Sandbox. Git native. Pipe-friendly. JWT в OS keychain."
        tag={{ icon: <Terminal size={12} />, label: "CLI · DESKTOP AGENT", accent: "var(--violet-500)" }}
        onBack={onBack}
      />

      {/* ═══════════ PART 1: CLI ═══════════ */}

      <section style={{ padding: "80px 32px", maxWidth: 1280, margin: "0 auto" }}>
        {/* Live mockup + install */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1.4fr 1fr",
            gap: 32,
            alignItems: "start",
            marginBottom: 64,
          }}
          className="xc-cli-row"
        >
          <motion.div
            initial={{ opacity: 0, x: -12 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <BrandbookTerminal />
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 12 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.1 }}
            style={{ display: "flex", flexDirection: "column", gap: 16 }}
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
            <div
              style={{
                display: "flex",
                gap: 16,
                fontFamily: "var(--font-mono)",
                fontSize: 11,
                color: "var(--text-muted)",
                letterSpacing: "0.1em",
                paddingTop: 8,
              }}
            >
              <a
                href="https://www.npmjs.com/package/xerocode-cli"
                target="_blank"
                rel="noreferrer"
                style={{ color: "var(--text-muted)", display: "inline-flex", alignItems: "center", gap: 6, textDecoration: "none", transition: "color 200ms" }}
                onMouseEnter={(e) => { e.currentTarget.style.color = "var(--violet-500)"; }}
                onMouseLeave={(e) => { e.currentTarget.style.color = "var(--text-muted)"; }}
              >
                <Package size={12} /> npm
              </a>
              <a
                href="https://github.com/SYL4R2k27/xerocode-ai-office/tree/main/xerocode-cli"
                target="_blank"
                rel="noreferrer"
                style={{ color: "var(--text-muted)", display: "inline-flex", alignItems: "center", gap: 6, textDecoration: "none" }}
                onMouseEnter={(e) => { e.currentTarget.style.color = "var(--violet-500)"; }}
                onMouseLeave={(e) => { e.currentTarget.style.color = "var(--text-muted)"; }}
              >
                <Github size={12} /> GitHub
              </a>
              <a
                href="https://github.com/SYL4R2k27/homebrew-tap"
                target="_blank"
                rel="noreferrer"
                style={{ color: "var(--text-muted)", display: "inline-flex", alignItems: "center", gap: 6, textDecoration: "none" }}
                onMouseEnter={(e) => { e.currentTarget.style.color = "var(--violet-500)"; }}
                onMouseLeave={(e) => { e.currentTarget.style.color = "var(--text-muted)"; }}
              >
                🍺 tap
              </a>
            </div>
          </motion.div>
        </div>

        {/* CLI capabilities */}
        <SectionHeader
          num="02.A"
          title={<>Что умеет <em style={{ color: "var(--amber-500)", fontStyle: "italic", fontWeight: 400 }}>CLI.</em></>}
        />
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(3, 1fr)",
            gap: 12,
            marginBottom: 64,
          }}
          className="xc-cli-cap-grid"
        >
          {cliCapabilities.map((c, i) => (
            <motion.div
              key={c.title}
              initial={{ opacity: 0, y: 12 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.06, duration: 0.4 }}
              whileHover={{ y: -4, borderColor: c.color }}
              style={{
                background: "var(--void-800)",
                border: "1px solid var(--border-subtle)",
                borderRadius: "var(--radius-lg)",
                padding: 24,
                position: "relative",
                overflow: "hidden",
                transition: "border-color 200ms",
              }}
            >
              <div style={{ position: "absolute", top: 0, left: 0, height: "100%", width: 3, background: c.color }} />
              <div
                style={{
                  width: 40,
                  height: 40,
                  borderRadius: "var(--radius-md)",
                  background: `${c.color}15`,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  marginBottom: 14,
                }}
              >
                <c.icon size={20} color={c.color} strokeWidth={1.75} />
              </div>
              <h3
                style={{
                  fontFamily: "var(--font-sans)",
                  fontWeight: 600,
                  color: "var(--ink-50)",
                  fontSize: 14,
                  marginBottom: 6,
                }}
              >
                {c.title}
              </h3>
              <p style={{ color: "var(--ink-300)", fontSize: 12, lineHeight: 1.55 }}>
                {c.desc}
              </p>
            </motion.div>
          ))}
        </div>

        {/* Commands cheat-sheet — в стиле брендбука */}
        <SectionHeader
          num="02.B"
          title={<>Основные <em style={{ color: "var(--amber-500)", fontStyle: "italic", fontWeight: 400 }}>команды.</em></>}
          subtitle="Шпаргалка по самым используемым."
        />
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          style={{
            background: "#050510",
            border: "1px solid var(--border-subtle)",
            borderRadius: "var(--radius-lg)",
            overflow: "hidden",
            marginBottom: 64,
            boxShadow: "0 24px 48px rgba(0,0,0,0.4)",
          }}
        >
          <div
            style={{
              background: "var(--void-800)",
              padding: "10px 16px",
              display: "flex",
              alignItems: "center",
              gap: 8,
              borderBottom: "1px solid var(--border-subtle)",
            }}
          >
            <span style={{ width: 12, height: 12, borderRadius: "50%", background: "#FF5F56" }} />
            <span style={{ width: 12, height: 12, borderRadius: "50%", background: "#FFBD2E" }} />
            <span style={{ width: 12, height: 12, borderRadius: "50%", background: "#27C93F" }} />
            <span
              style={{
                marginLeft: "auto",
                fontFamily: "var(--font-mono)",
                fontSize: 11,
                color: "var(--ink-400)",
                letterSpacing: "0.1em",
              }}
            >
              <Terminal size={11} style={{ display: "inline-block", marginRight: 6, verticalAlign: "middle" }} />
              xerocode-cli · cheat-sheet
            </span>
          </div>
          <CheatSheet />
        </motion.div>
      </section>

      {/* ═══════════ DIVIDER ═══════════ */}
      <section style={{ padding: "0 32px" }}>
        <div style={{ maxWidth: 1280, margin: "0 auto", position: "relative", padding: "32px 0" }}>
          <div
            style={{
              position: "absolute",
              left: 0,
              right: 0,
              top: "50%",
              height: 1,
              background: "linear-gradient(90deg, transparent, var(--border-subtle), transparent)",
            }}
          />
          <div style={{ position: "relative", textAlign: "center" }}>
            <span
              style={{
                display: "inline-block",
                padding: "6px 16px",
                borderRadius: 9999,
                background: "var(--void-900)",
                color: "var(--text-muted)",
                fontFamily: "var(--font-mono)",
                fontSize: 11,
                letterSpacing: "0.3em",
                border: "1px solid var(--border-subtle)",
              }}
            >
              DESKTOP AGENT
            </span>
          </div>
        </div>
      </section>

      {/* ═══════════ PART 2: Desktop Agent ═══════════ */}

      <section style={{ padding: "32px 32px 80px", maxWidth: 1280, margin: "0 auto" }}>
        <div style={{ textAlign: "center", marginBottom: 48 }}>
          <h2
            style={{
              fontFamily: "var(--font-serif)",
              fontSize: "clamp(32px, 4.5vw, 48px)",
              fontWeight: 700,
              letterSpacing: "-0.03em",
              lineHeight: 1.1,
              color: "var(--ink-50)",
              marginBottom: 16,
            }}
          >
            AI работает с твоими{" "}
            <em
              style={{
                fontStyle: "italic",
                fontWeight: 400,
                background: "linear-gradient(135deg, #00D4FF, #5882FF)",
                WebkitBackgroundClip: "text",
                backgroundClip: "text",
                color: "transparent",
              }}
            >
              файлами напрямую.
            </em>
          </h2>
          <p style={{ color: "var(--ink-300)", fontSize: 16, lineHeight: 1.6, maxWidth: 640, margin: "0 auto" }}>
            Отдельный компонент для работы с локальными файлами. AI из веб-чата читает,
            редактирует и запускает команды в твоём проекте.
          </p>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          style={{
            background: "var(--void-800)",
            border: "1px solid var(--border-subtle)",
            borderRadius: "var(--radius-lg)",
            padding: 32,
            marginBottom: 48,
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 16, marginBottom: 24 }}>
            <div
              style={{
                width: 48,
                height: 48,
                borderRadius: "var(--radius-md)",
                background: "rgba(124,92,255,0.15)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Download size={22} color="var(--violet-500)" strokeWidth={1.75} />
            </div>
            <div>
              <h3 style={{ fontFamily: "var(--font-sans)", fontSize: 18, fontWeight: 600, color: "var(--ink-50)" }}>
                Скачать Desktop Agent
              </h3>
              <p style={{ color: "var(--text-muted)", fontSize: 12, fontFamily: "var(--font-mono)", letterSpacing: "0.1em", marginTop: 4 }}>
                v{AGENT_VERSION} · работает в системном трее · автоподключение
              </p>
            </div>
          </div>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(3, 1fr)",
              gap: 12,
            }}
            className="xc-platforms-grid"
          >
            {platforms.map((p) => (
              <a
                key={p.label}
                href={p.url}
                target="_blank"
                rel="noreferrer"
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 14,
                  padding: 16,
                  background: "var(--void-900)",
                  border: "1px solid var(--border-subtle)",
                  borderRadius: "var(--radius-md)",
                  color: "var(--ink-100)",
                  textDecoration: "none",
                  transition: "border-color 200ms, background 200ms",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.borderColor = "var(--violet-500)";
                  e.currentTarget.style.background = "rgba(124,92,255,0.04)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = "var(--border-subtle)";
                  e.currentTarget.style.background = "var(--void-900)";
                }}
              >
                <div
                  style={{
                    width: 36,
                    height: 36,
                    borderRadius: "var(--radius-sm)",
                    background: "var(--void-700)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    flexShrink: 0,
                  }}
                >
                  <p.icon size={18} color="var(--violet-500)" strokeWidth={1.75} />
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontFamily: "var(--font-sans)", fontWeight: 600, fontSize: 14, color: "var(--ink-50)" }}>
                    {p.label}
                  </div>
                  <div style={{ fontFamily: "var(--font-mono)", fontSize: 11, color: "var(--text-muted)", letterSpacing: "0.05em" }}>
                    {p.arch}
                  </div>
                </div>
                <Download size={14} color="var(--text-muted)" />
              </a>
            ))}
          </div>
          <p style={{ marginTop: 24, color: "var(--text-muted)", fontSize: 12, fontFamily: "var(--font-mono)", letterSpacing: "0.05em" }}>
            После установки войдите через email, выберите папку проекта и введите Goal ID из веб-чата.
          </p>
        </motion.div>

        {/* Agent capabilities */}
        <SectionHeader
          num="02.C"
          title={<>Что умеет <em style={{ color: "var(--amber-500)", fontStyle: "italic", fontWeight: 400 }}>агент.</em></>}
        />
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(3, 1fr)",
            gap: 12,
          }}
          className="xc-agent-cap-grid"
        >
          {agentCapabilities.map((c, i) => (
            <motion.div
              key={c.title}
              initial={{ opacity: 0, y: 12 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.06, duration: 0.4 }}
              whileHover={{ y: -4, borderColor: c.color }}
              style={{
                background: "var(--void-800)",
                border: "1px solid var(--border-subtle)",
                borderRadius: "var(--radius-lg)",
                padding: 24,
                position: "relative",
                overflow: "hidden",
                transition: "border-color 200ms",
              }}
            >
              <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 3, background: c.color }} />
              <div
                style={{
                  width: 40,
                  height: 40,
                  borderRadius: "var(--radius-md)",
                  background: `${c.color}15`,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  marginBottom: 14,
                }}
              >
                <c.icon size={20} color={c.color} strokeWidth={1.75} />
              </div>
              <h3
                style={{
                  fontFamily: "var(--font-sans)",
                  fontWeight: 600,
                  color: "var(--ink-50)",
                  fontSize: 14,
                  marginBottom: 6,
                }}
              >
                {c.title}
              </h3>
              <p style={{ color: "var(--ink-300)", fontSize: 12, lineHeight: 1.55 }}>
                {c.desc}
              </p>
            </motion.div>
          ))}
        </div>
      </section>

      <style>{`
        @media (max-width: 920px) {
          .xc-cli-row { grid-template-columns: 1fr !important; }
          .xc-cli-cap-grid, .xc-agent-cap-grid { grid-template-columns: repeat(2, 1fr) !important; }
          .xc-platforms-grid { grid-template-columns: 1fr !important; }
        }
        @media (max-width: 600px) {
          .xc-cli-cap-grid, .xc-agent-cap-grid { grid-template-columns: 1fr !important; }
        }
      `}</style>

      <FinalCTA
        onCTA={onCTA}
        title="Установи XeroCode CLI."
        subtitle="brew install · 30 секунд · Готово."
        buttonText="Установить →"
      />
    </>
  );
}
