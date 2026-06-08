/* XeroCode Landing v3 — Терминал (sub-page).
   Re-skinned to v3 from V2 AgentPage. Primary: xerocode-cli (Homebrew / npm,
   5 режимов оркестрации, OS keychain). Secondary: Desktop Agent (Electron). */
import { useEffect, useState } from "react";
import { AppIcon } from "../Icon";
import { SubHero } from "../SubHero";

const WELCOME = `╭─ XeroCode CLI · v0.1.0-beta ─────────────────╮
│
│  Welcome back, user!
│  free · BYOK · ~/Desktop/project
│
│  xerocode chat      интерактивный REPL
│  xerocode run "…"   one-shot
│  xerocode models    каталог моделей
│
╰──────────────────────────────────────────────╯`;

const CHAT = `╭─ ✕ XeroCode Chat ────────────────────────────╮
│  Target: xerocode_ai   ·   Mode: team
│  /help — команды   ·   /exit — выход
╰──────────────────────────────────────────────╯`;

function TerminalMock() {
  const [phase, setPhase] = useState(0);
  const [typed, setTyped] = useState("");
  useEffect(() => {
    let t: ReturnType<typeof setTimeout> | undefined;
    if (phase === 0) {
      t = setTimeout(() => setPhase(1), 2400);
    } else if (phase === 1) {
      const cmd = "xerocode chat";
      let i = 0;
      const iv = setInterval(() => {
        i++; setTyped(cmd.slice(0, i));
        if (i >= cmd.length) { clearInterval(iv); t = setTimeout(() => { setTyped(""); setPhase(2); }, 600); }
      }, 80);
      return () => { clearInterval(iv); if (t) clearTimeout(t); };
    } else if (phase === 2) {
      t = setTimeout(() => setPhase(3), 1900);
    } else {
      const msg = "Помоги написать README для стартапа";
      let i = 0;
      const iv = setInterval(() => {
        i++; setTyped(msg.slice(0, i));
        if (i >= msg.length) { clearInterval(iv); t = setTimeout(() => { setTyped(""); setPhase(0); }, 2400); }
      }, 50);
      return () => { clearInterval(iv); if (t) clearTimeout(t); };
    }
    return () => { if (t) clearTimeout(t); };
  }, [phase]);

  return (
    <div className="term-win">
      <div className="term-bar">
        <span className="term-dot" style={{ background: "var(--sylar)" }} />
        <span className="term-dot" style={{ background: "var(--ws-images)" }} />
        <span className="term-dot" style={{ background: "var(--ws-code)" }} />
        <span className="title">user@xerocode ~</span>
      </div>
      <div className="term-body">
        <pre className="term-pre">{phase < 2 ? WELCOME : CHAT}</pre>
        <div className="term-prompt">
          <span className="arrow">›</span> <span className="typed">{typed}</span><span className="term-caret" />
        </div>
      </div>
    </div>
  );
}

function InstallCard({ icon, title, sub, cmd, rec }: { icon: string; title: string; sub: string; cmd: string; rec?: boolean }) {
  const [copied, setCopied] = useState(false);
  const copy = () => {
    try { navigator.clipboard.writeText(cmd); } catch { /* noop */ }
    setCopied(true); setTimeout(() => setCopied(false), 1400);
  };
  return (
    <div className={"install-card" + (rec ? " rec" : "")}>
      {rec && <span className="install-badge">РЕКОМЕНДУЕМ</span>}
      <div className="install-top">
        <span className="install-ico"><AppIcon name={icon} size={19} color="var(--xero)" /></span>
        <div><div className="install-h">{title}</div><div className="install-sub">{sub}</div></div>
      </div>
      <div className="install-cmd">
        <pre>{cmd}</pre>
        <button className="copy-btn" onClick={copy} title="Скопировать" aria-label="Скопировать">
          <AppIcon name={copied ? "check" : "copy"} size={14} color={copied ? "var(--ws-code)" : "currentColor"} />
        </button>
      </div>
    </div>
  );
}

const CLI_CAPS = [
  { icon: "message-square", h: "Interactive chat", d: "xerocode chat — REPL со слэш-командами /model, /mode, /system, /clear." },
  { icon: "zap", h: "One-shot", d: "xerocode run \"prompt\" — одна команда, стриминг ответа, автоматический выход." },
  { icon: "git-branch", h: "Pipe-friendly", d: "cat code.py | xerocode run \"add type hints\" + --json для скриптов." },
  { icon: "layers", h: "5 режимов оркестрации", d: "--mode swarm / team / auction / manager — команда моделей на одну задачу." },
  { icon: "key-round", h: "OS keychain", d: "JWT в macOS Keychain / Win Credential Manager / libsecret. Без plain-text." },
  { icon: "globe", h: "Без VPN из РФ", d: "Прямое подключение к xerocode.ru — русские карты, российские серверы." },
];

const CMDS: { html: string; gap?: boolean }[] = [
  { html: '<span class="d">$</span> <span class="c">xerocode login</span>                          <span class="m"># device-code auth через браузер</span>' },
  { html: '<span class="d">$</span> <span class="c">xerocode chat</span>                           <span class="m"># interactive REPL</span>' },
  { html: '<span class="d">$</span> <span class="c">xerocode run <span class="s">"Объясни квиксорт"</span></span>              <span class="m"># one-shot</span>' },
  { html: '<span class="d">$</span> <span class="c">xerocode run <span class="s">"…"</span> --model claude-sonnet</span>     <span class="m"># одна модель</span>' },
  { html: '<span class="d">$</span> <span class="c">xerocode --mode swarm run <span class="s">"сравни X и Y"</span></span>      <span class="m"># оркестрация</span>' },
  { html: '<span class="d">$</span> <span class="c">xerocode models</span>                         <span class="m"># список моделей</span>' },
  { html: '<span class="d">$</span> <span class="c">cat code.py | xerocode run <span class="s">"ревью"</span> --json | jq .response</span>', gap: true },
];

const AGENT_CAPS = [
  { icon: "file-text", h: "Файлы", d: "Создание, чтение и редактирование файлов в твоём проекте." },
  { icon: "terminal", h: "Команды", d: "Запуск npm, git, build и любых CLI-команд." },
  { icon: "search", h: "Поиск по коду", d: "Grep по паттернам, поиск функций и зависимостей." },
  { icon: "folder-open", h: "Навигация", d: "Обзор структуры проекта, list_files, дерево файлов." },
  { icon: "shield-check", h: "Песочница", d: "38 опасных команд заблокировано — безопасное исполнение." },
  { icon: "refresh-cw", h: "Авто-переподключение", d: "При обрыве соединения восстановление за 3 секунды." },
];

const AGENT_VERSION = "0.2.0";
const BASE = `https://github.com/SYL4R2k27/xerocode-ai-office/releases/download/v${AGENT_VERSION}`;
const PLATFORMS = [
  { icon: "laptop", label: "macOS", arch: "Apple Silicon · .dmg", url: `${BASE}/XeroCode.Agent-${AGENT_VERSION}-arm64.dmg` },
  { icon: "monitor", label: "Windows", arch: "x64 · installer .exe", url: `${BASE}/XeroCode.Agent.Setup.${AGENT_VERSION}.exe` },
  { icon: "cpu", label: "Linux", arch: "AppImage", url: `${BASE}/XeroCode.Agent-${AGENT_VERSION}.AppImage` },
];

export function TerminalPage({ onBack }: { onBack: () => void }) {
  return (
    <div className="subpage">
      <SubHero
        eyebrow="Терминал"
        title="XeroCode в"
        accent="твоём терминале."
        sub="Чат с командой AI прямо из консоли. Pipe-friendly, 5 режимов оркестрации, JWT в системном keychain. Ставится одной командой."
        onBack={onBack}
      />
      <div className="pg-wrap">
        <div className="term-split">
          <TerminalMock />
          <div className="install-col">
            <InstallCard icon="box" title="Homebrew" sub="macOS / Linux · самый быстрый способ" cmd={"brew tap SYL4R2k27/tap\nbrew install xerocode"} rec />
            <InstallCard icon="package" title="npm" sub="любая платформа · Node.js 18+" cmd="npm install -g xerocode-cli@beta" />
            <div className="install-links">
              <a href="https://www.npmjs.com/package/xerocode-cli" target="_blank" rel="noreferrer"><AppIcon name="package" size={13} /> npm</a>
              <a href="https://github.com/SYL4R2k27/xerocode-ai-office/tree/main/xerocode-cli" target="_blank" rel="noreferrer"><AppIcon name="github" size={13} /> GitHub</a>
              <a href="https://github.com/SYL4R2k27/homebrew-tap" target="_blank" rel="noreferrer"><AppIcon name="box" size={13} /> tap</a>
            </div>
          </div>
        </div>

        <p className="pg-cap">▸ Что умеет CLI</p>
        <div className="term-caps">
          {CLI_CAPS.map((c) => (
            <div className="cap-card" key={c.h}>
              <span className="cap-ico"><AppIcon name={c.icon} size={19} color="var(--xero)" /></span>
              <div className="cap-h">{c.h}</div>
              <p className="cap-d">{c.d}</p>
            </div>
          ))}
        </div>

        <div className="cmd-sheet">
          <div className="cmd-head"><AppIcon name="terminal" size={14} color="var(--xero)" /> Основные команды</div>
          <div className="cmd-pre">
            {CMDS.map((c, i) => (
              <div className={"cmd-row" + (c.gap ? " gap" : "")} key={i} dangerouslySetInnerHTML={{ __html: c.html }} />
            ))}
          </div>
        </div>

        <div className="term-div"><span>DESKTOP AGENT</span></div>
        <div className="term-intro">
          <h2>AI работает с твоими <span className="accent">файлами напрямую</span></h2>
          <p>Отдельный компонент для локальных файлов. AI из веб-чата читает, редактирует и запускает команды в твоём проекте. Версия {AGENT_VERSION} · работает в системном трее.</p>
        </div>
        <div className="plat-grid">
          {PLATFORMS.map((p) => (
            <a className="plat-card" key={p.label} href={p.url} target="_blank" rel="noreferrer">
              <span className="plat-ico"><AppIcon name={p.icon} size={19} color="var(--xero)" /></span>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div className="plat-l">{p.label}</div>
                <div className="plat-a">{p.arch}</div>
              </div>
              <AppIcon name="download" size={15} color="var(--on-bg-dim)" />
            </a>
          ))}
        </div>
        <div className="biz-note" style={{ marginTop: 6 }}>
          <AppIcon name="key-round" size={16} color="var(--xero)" style={{ flexShrink: 0, marginTop: 1 }} />
          <span>После установки войди через email, выбери папку проекта и введи <b>Goal ID</b> из веб-чата.</span>
        </div>

        <p className="pg-cap" style={{ marginTop: 56 }}>▸ Что умеет агент</p>
        <div className="term-caps">
          {AGENT_CAPS.map((c) => (
            <div className="cap-card" key={c.h}>
              <span className="cap-ico"><AppIcon name={c.icon} size={19} color="var(--xero)" /></span>
              <div className="cap-h">{c.h}</div>
              <p className="cap-d">{c.d}</p>
            </div>
          ))}
        </div>

        <div className="cta-panel" style={{ marginTop: 64 }}>
          <p className="hero-eyebrow" style={{ justifyContent: "center" }}>Начни прямо сейчас</p>
          <h2 className="cta-title">Один <span className="accent">brew install</span><br />— и XeroCode в каждом терминале.</h2>
          <div className="install-cmd" style={{ maxWidth: 440, margin: "22px auto 0" }}>
            <pre>brew install SYL4R2k27/tap/xerocode</pre>
          </div>
        </div>
      </div>
    </div>
  );
}
