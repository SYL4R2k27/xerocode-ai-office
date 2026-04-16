/**
 * `xerocode run "<prompt>"` — one-shot. Streams by default.
 *
 * Pipe-friendly:
 *   echo "this code" | xerocode run "explain:" --model claude-3-5-sonnet
 *   xerocode run "2+2" --json | jq -r '.response'
 */
import { Command } from "commander";
import { theme } from "../ui/theme.js";
import { spinner } from "../ui/spinner.js";
import { streamChat, runMode } from "../api/stream.js";
import { loadConfig } from "../config.js";
import { getAuthToken } from "../api/auth.js";
import { readStdin } from "../util/stdin.js";
import { ApiError, friendlyError } from "../util/errors.js";

interface RunOpts {
  model?: string;
  mode?: string;
  system?: string;
  json?: boolean;
  stream?: boolean; // commander `--no-stream` inverts this to false
  api?: string;
}

function getGlobalOpts(cmd: Command): RunOpts {
  // Merge ancestor (program) options with this command's own options.
  let opts: RunOpts = cmd.opts() as any;
  let parent = cmd.parent;
  while (parent) {
    opts = { ...(parent.opts() as any), ...opts };
    parent = parent.parent;
  }
  return opts;
}

export function runCommand(): Command {
  const cmd = new Command("run");
  cmd
    .description("One-shot: send a prompt, print the answer, exit")
    .argument("[prompt...]", "prompt text (or pipe via stdin)")
    .action(async (promptParts: string[], _options, thisCmd: Command) => {
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

      const argPrompt = (promptParts || []).join(" ").trim();
      const piped = await readStdin();
      const prompt = [argPrompt, piped].filter(Boolean).join("\n\n").trim();

      if (!prompt) {
        console.error(
          theme.error("✖ No prompt provided.") +
            "\n  Usage: " +
            theme.brand('xerocode run "your question"')
        );
        process.exit(1);
      }

      const useStream = opts.stream !== false;
      const jsonMode = !!opts.json;

      // Decide transport: single-model or orchestration
      const singleModel = !!opts.model;
      const mode = opts.mode || cfg.default.mode || "xerocode_ai";

      let fullResponse = "";
      let finalModel: string | undefined = opts.model;

      let spin: ReturnType<typeof spinner> | null = !jsonMode && !useStream ? spinner("Thinking…").start() : null;

      try {
        if (singleModel) {
          // Single-model via /stream/chat
          await streamChat(
            {
              prompt,
              model: opts.model,
              system: opts.system,
              apiBase: opts.api,
            },
            (evt) => {
              if (evt.type === "meta" && evt.model) {
                finalModel = evt.model;
              } else if (evt.type === "chunk" && typeof evt.content === "string") {
                fullResponse += evt.content;
                if (useStream && !jsonMode) {
                  process.stdout.write(evt.content);
                }
              } else if (evt.type === "error") {
                throw new Error(evt.message || "provider error");
              }
            }
          );
        } else {
          // Orchestration via /modes/run — emits node_status events + final `done.result`.
          // No token-by-token streaming; we show per-node progress on the spinner.
          if (!jsonMode) {
            if (!spin) {
              // User passed streaming; orchestration is batch — show spinner anyway.
              spin = spinner(`Running ${mode} orchestration…`).start();
            } else {
              spin.start(`Running ${mode} orchestration…`);
            }
          }
          await runMode(
            {
              prompt,
              mode,
              system: opts.system,
              apiBase: opts.api,
            },
            (evt) => {
              if (evt.type === "start") {
                if (!jsonMode && spin) {
                  const nodes = Array.isArray(evt.nodes) ? evt.nodes.join(" → ") : "";
                  spin.start(theme.muted(`${mode}  ${nodes}`));
                }
              } else if (evt.type === "node_status") {
                if (!jsonMode && spin) {
                  spin.start(theme.muted(`${evt.node_id} · ${evt.status}`));
                }
              } else if (evt.type === "done") {
                if (typeof evt.result === "string") fullResponse = evt.result;
                finalModel = mode;
              } else if (evt.type === "error") {
                throw new Error(evt.message || "orchestration error");
              }
            }
          );
        }
      } catch (err) {
        spin?.stop();
        if (err instanceof ApiError) {
          console.error(friendlyError(err.status, err.body));
        } else {
          console.error(theme.error("✖ " + (err as Error).message));
        }
        process.exit(1);
      }

      spin?.stop();

      if (jsonMode) {
        process.stdout.write(
          JSON.stringify(
            {
              response: fullResponse,
              model: finalModel || null,
              mode: singleModel ? null : mode,
            },
            null,
            2
          ) + "\n"
        );
      } else if (singleModel && useStream) {
        // Single-model with streaming — chunks were already printed in the callback.
        // Add a trailing newline.
        process.stdout.write("\n");
      } else {
        // Either: orchestration (no streaming), OR --no-stream — print collected response now.
        process.stdout.write(fullResponse + "\n");
      }
    });
  return cmd;
}
