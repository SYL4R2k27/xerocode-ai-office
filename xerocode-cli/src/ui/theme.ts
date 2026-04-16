/**
 * XeroCode CLI palette — matches the web brand (violet accent).
 * All terminal colors go through here so we can swap for themes later.
 */
import chalk from "chalk";

export const theme = {
  // Brand
  brand: chalk.hex("#A78BFA"),       // violet-soft
  brandBold: chalk.hex("#A78BFA").bold,
  accent: chalk.hex("#7C3AED"),      // violet

  // Semantic
  primary: chalk.white,
  muted: chalk.hex("#8A8A94"),
  subtle: chalk.hex("#5A5A63"),
  dim: chalk.dim,

  // Status
  success: chalk.hex("#10B981"),
  warn: chalk.hex("#F59E0B"),
  error: chalk.hex("#EF4444"),
  info: chalk.hex("#06B6D4"),

  // Roles
  user: chalk.hex("#A78BFA"),
  assistant: chalk.white,
  system: chalk.hex("#8A8A94"),

  // Utilities
  bold: chalk.bold,
  underline: chalk.underline,
};

/** Small X8 mark rendered with box-drawing chars, one line wide. */
export function brandMark(): string {
  return theme.brand("✕");
}

/** Multi-line XEROCODE banner — shown on login and `--help`. */
export function banner(): string {
  const m = theme.brand;
  return [
    m("  ✕   XEROCODE"),
    theme.muted("  ──────────"),
    theme.muted("  AI, который думает командой."),
    "",
  ].join("\n");
}
