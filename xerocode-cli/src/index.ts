/**
 * XeroCode CLI entrypoint.
 *
 * Registers commands and wires global flags. Actual command logic is in
 * src/commands/*.ts — this file stays thin on purpose.
 */
import { Command } from "commander";
import { theme, banner } from "./ui/theme.js";
import { printWelcome } from "./ui/welcome.js";

import { loginCommand } from "./commands/login.js";
import { logoutCommand } from "./commands/logout.js";
import { runCommand } from "./commands/run.js";
import { chatCommand } from "./commands/chat.js";
import { modelsCommand } from "./commands/models.js";
import { configCommand } from "./commands/config.js";

const VERSION = "0.1.0-beta.0";

const program = new Command();

program
  .name("xerocode")
  .description(banner())
  .version(VERSION, "-v, --version")
  .option("--model <id>", "force a single model (skips orchestration)")
  .option(
    "--mode <name>",
    "orchestration mode: xerocode_ai | team | swarm | auction | manager"
  )
  .option("--system <prompt>", "custom system prompt")
  .option("--json", "machine-readable output")
  .option("--no-stream", "print the full answer at once")
  .option("--api <url>", "override API base URL (e.g. http://localhost:8000/api)");

program.addCommand(loginCommand());
program.addCommand(logoutCommand());
program.addCommand(runCommand());
program.addCommand(chatCommand());
program.addCommand(modelsCommand());
program.addCommand(configCommand());

// Standalone `welcome` command (also shown when running with no args)
program
  .command("welcome")
  .description("Show the welcome banner")
  .action(async () => {
    await printWelcome();
  });

// Friendly error for unknown command
program.on("command:*", (operands) => {
  console.error(theme.error(`Unknown command: ${operands[0]}`));
  console.error(theme.muted(`Run ${theme.brand("xerocode --help")} to see available commands.`));
  process.exit(1);
});

// If no args — show the welcome banner (Claude Code style)
if (process.argv.length <= 2) {
  printWelcome()
    .catch(() => program.outputHelp())
    .finally(() => process.exit(0));
} else {
  program.parseAsync(process.argv).catch((err) => {
    console.error(theme.error("✖ " + (err?.message || String(err))));
    process.exit(1);
  });
}
