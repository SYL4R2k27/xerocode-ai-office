/**
 * `xerocode chat` — interactive REPL.
 *
 * Slash commands:
 *   /model <id>     switch to single-model mode
 *   /mode <name>    switch orchestration mode; use "off" to unset (back to --model)
 *   /system <text>  set system prompt for this session
 *   /clear          reset in-memory history
 *   /help           show commands
 *   /exit | /quit   leave REPL (Ctrl+D works too)
 */
import { Command } from "commander";
import * as readline from "readline";
import stringWidth from "string-width";
import { theme } from "../ui/theme.js";
import { streamChat, runMode } from "../api/stream.js";
import { loadConfig } from "../config.js";
import { getAuthToken } from "../api/auth.js";
import { ApiError, friendlyError } from "../util/errors.js";

/** Minimal rounded-box renderer (shared pattern with ui/welcome.ts). */
function drawBox(content: string, title: string, innerWidth: number, color: (s: string) => string): string {
  const lines = content.split("\n");
  const TL = "╭", TR = "╮", BL = "╰", BR = "╯", H = "─", V = "│";
  const stripped = title.replace(/\x1b\[[\d;]*m/g, "");
  const titleLen = stripped ? stringWidth(stripped) + 2 : 0;
  const top =
    color(TL) +
    (stripped ? ` ${title} ` : "") +
    color(H.repeat(Math.max(2, innerWidth + 2 - titleLen))) +
    color(TR);
  const out: string[] = [top];
  out.push(color(V) + " ".repeat(innerWidth + 2) + color(V));
  for (const raw of lines) {
    const w = stringWidth(raw);
    const pad = Math.max(0, innerWidth - w);
    out.push(color(V) + " " + raw + " ".repeat(pad) + " " + color(V));
  }
  out.push(color(V) + " ".repeat(innerWidth + 2) + color(V));
  out.push(color(BL + H.repeat(innerWidth + 2) + BR));
  return out.join("\n");
}

interface ChatOpts {
  model?: string;
  mode?: string;
  system?: string;
  api?: string;
}

function getGlobalOpts(cmd: Command): ChatOpts {
  let opts: ChatOpts = cmd.opts() as any;
  let parent = cmd.parent;
  while (parent) {
    opts = { ...(parent.opts() as any), ...opts };
    parent = parent.parent;
  }
  return opts;
}

interface ChatState {
  model?: string;
  mode: string;
  system?: string;
  api?: string;
  // Minimal in-memory history (only for UX; backend is stateless per request).
  // When API supports message history we'll send it; today we just keep for display.
  history: { role: "user" | "assistant"; content: string }[];
}

function printPrompt(rl: readline.Interface): void {
  rl.setPrompt(theme.brand("› "));
  rl.prompt();
}

function printHelp(): void {
  console.log(theme.muted("Commands:"));
  console.log(
    "  " + theme.brand("/model <id>   ") + theme.muted("use a single model (bypass orchestration)")
  );
  console.log(
    "  " + theme.brand("/mode <name>  ") + theme.muted("switch orchestration mode (or 'off')")
  );
  console.log(
    "  " + theme.brand("/system <txt> ") + theme.muted("set system prompt for the session")
  );
  console.log(
    "  " + theme.brand("/clear        ") + theme.muted("reset local chat context")
  );
  console.log(
    "  " + theme.brand("/help         ") + theme.muted("this help")
  );
  console.log(
    "  " + theme.brand("/exit         ") + theme.muted("quit (Ctrl+D also works)")
  );
}

function printStatus(state: ChatState): void {
  const parts: string[] = [];
  if (state.model) {
    parts.push(theme.brand("model=") + state.model);
  } else {
    parts.push(theme.brand("mode=") + state.mode);
  }
  if (state.system) parts.push(theme.brand("system=") + "…");
  console.log(theme.muted("  " + parts.join("  ")));
}

async function sendTurn(state: ChatState, prompt: string): Promise<void> {
  state.history.push({ role: "user", content: prompt });
  process.stdout.write("\n");
  let buffer = "";

  try {
    if (state.model) {
      await streamChat(
        { prompt, model: state.model, system: state.system, apiBase: state.api },
        (evt) => {
          if (evt.type === "chunk" && typeof evt.content === "string") {
            buffer += evt.content;
            process.stdout.write(evt.content);
          } else if (evt.type === "error") {
            throw new Error(evt.message || "provider error");
          }
        }
      );
    } else {
      // Orchestration: no token streaming, just final result.
      process.stdout.write(theme.muted(`[${state.mode}] thinking…\r`));
      await runMode(
        { prompt, mode: state.mode, system: state.system, apiBase: state.api },
        (evt) => {
          if (evt.type === "node_status") {
            // Overwrite progress line
            process.stdout.write(
              theme.muted(`[${state.mode}] ${evt.node_id || ""} · ${evt.status || ""}\r`) + " ".repeat(10) + "\r"
            );
          } else if (evt.type === "done" && typeof evt.result === "string") {
            // Clear progress line
            process.stdout.write("\r" + " ".repeat(80) + "\r");
            buffer = evt.result;
            process.stdout.write(evt.result);
          } else if (evt.type === "error") {
            throw new Error(evt.message || "orchestration error");
          }
        }
      );
    }
  } catch (err) {
    process.stdout.write("\n");
    if (err instanceof ApiError) {
      console.log(friendlyError(err.status, err.body));
    } else {
      console.log(theme.error("✖ " + (err as Error).message));
    }
    return;
  }

  process.stdout.write("\n\n");
  state.history.push({ role: "assistant", content: buffer });
}

export function chatCommand(): Command {
  const cmd = new Command("chat");
  cmd
    .description("Interactive REPL chat")
    .action(async (_options, thisCmd: Command) => {
      const opts = getGlobalOpts(thisCmd);
      const cfg = loadConfig();

      if (!getAuthToken()) {
        console.error(
          theme.error("✖ Not authenticated.") +
            "\n  Run " +
            theme.brand("xerocode login") +
            " to sign in."
        );
        process.exit(1);
      }

      const state: ChatState = {
        model: opts.model,
        mode: opts.mode || cfg.default.mode || "xerocode_ai",
        system: opts.system,
        api: opts.api,
        history: [],
      };

      // Intro box — matches Claude Code chat aesthetic
      const target = state.model ? theme.info(state.model) : theme.info(state.mode);
      const intro = [
        theme.primary.bold("XeroCode Chat"),
        "",
        theme.muted("Target: ") + target,
        state.system
          ? theme.muted("System: ") + theme.dim(state.system.slice(0, 40) + (state.system.length > 40 ? "…" : ""))
          : theme.muted("System: ") + theme.dim("(default)"),
        "",
        theme.muted("Type /help for commands, /exit or Ctrl+D to quit."),
      ].join("\n");
      console.log("\n" + drawBox(intro, theme.brand("✕ XEROCODE"), 64, theme.brand) + "\n");

      const rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout,
        terminal: true,
      });

      rl.on("close", () => {
        console.log(theme.muted("\nGoodbye."));
        process.exit(0);
      });

      printPrompt(rl);

      rl.on("line", async (raw) => {
        const line = raw.trim();
        if (!line) {
          printPrompt(rl);
          return;
        }

        // Slash commands
        if (line.startsWith("/")) {
          const [cmdName, ...rest] = line.slice(1).split(/\s+/);
          const arg = rest.join(" ").trim();
          switch (cmdName) {
            case "exit":
            case "quit":
              rl.close();
              return;
            case "help":
              printHelp();
              break;
            case "clear":
              state.history = [];
              console.log(theme.muted("  context cleared"));
              break;
            case "model":
              if (!arg) {
                console.log(
                  theme.muted("  current: ") + (state.model || theme.dim("(orchestrated)"))
                );
              } else if (arg === "off") {
                state.model = undefined;
                console.log(theme.muted("  switched to orchestration: " + state.mode));
              } else {
                state.model = arg;
                console.log(theme.muted("  model → " + arg));
              }
              break;
            case "mode":
              if (!arg) {
                console.log(theme.muted("  current: " + state.mode));
              } else if (arg === "off") {
                console.log(
                  theme.muted("  use /model <id> to force a single model; /mode needs a value")
                );
              } else {
                state.mode = arg;
                state.model = undefined;
                console.log(theme.muted("  mode → " + arg));
              }
              break;
            case "system":
              state.system = arg || undefined;
              console.log(
                theme.muted("  system prompt " + (arg ? "set" : "cleared"))
              );
              break;
            default:
              console.log(theme.warn("  unknown command: /" + cmdName));
              console.log(theme.muted("  /help for list"));
          }
          printPrompt(rl);
          return;
        }

        // Normal prompt
        await sendTurn(state, line);
        printPrompt(rl);
      });
    });
  return cmd;
}
