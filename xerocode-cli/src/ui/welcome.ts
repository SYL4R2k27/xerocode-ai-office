/**
 * Welcome banner — Claude Code style two-column box.
 *
 * Rendered when:
 *   - `xerocode` is run with no arguments
 *   - `xerocode welcome` is invoked explicitly
 *
 * Layout (approximate, inside rounded box):
 *   ╭─ XeroCode CLI v0.1.0-beta ──────────────────────────╮
 *   │  Welcome back, Vladimir!     Tips for getting started │
 *   │                              Run `xerocode chat` …   │
 *   │          ✕                                            │
 *   │                              Recent activity          │
 *   │  admin@example.com · free    No recent activity       │
 *   │  /Users/vladimirtirs                                  │
 *   ╰───────────────────────────────────────────────────────╯
 */
import stringWidth from "string-width";
import * as os from "os";
import { theme } from "./theme.js";
import { loadConfig } from "../config.js";
import { getAuthToken } from "../api/auth.js";
import { apiJson } from "../api/client.js";

const VERSION = "0.1.0-beta.0";

/**
 * Hand-rolled rounded-box renderer.
 * Uses Unicode box-drawing chars. Preserves leading whitespace.
 * Title is embedded in the top border.
 */
function drawBox(content: string, title: string, innerWidth: number, borderColor: (s: string) => string): string {
  const lines = content.split("\n");
  const TL = "╭", TR = "╮", BL = "╰", BR = "╯", H = "─", V = "│";

  const strippedTitle = stripAnsi(title);
  const titleSegment = strippedTitle ? ` ${title} ` : "";
  const titleRawWidth = strippedTitle ? stringWidth(strippedTitle) + 2 : 0;
  const topDashes = Math.max(2, innerWidth + 2 - titleRawWidth);
  const top = borderColor(TL) + (strippedTitle ? titleSegment : "") + borderColor(H.repeat(topDashes)) + borderColor(TR);

  const out: string[] = [top];
  // Inner top padding
  out.push(borderColor(V) + " ".repeat(innerWidth + 2) + borderColor(V));
  for (const raw of lines) {
    const w = stringWidth(raw);
    const pad = Math.max(0, innerWidth - w);
    out.push(borderColor(V) + " " + raw + " ".repeat(pad) + " " + borderColor(V));
  }
  // Inner bottom padding
  out.push(borderColor(V) + " ".repeat(innerWidth + 2) + borderColor(V));
  out.push(borderColor(BL + H.repeat(innerWidth + 2) + BR));
  return out.join("\n");
}

/** Strip ANSI escape codes for visible-width calculations. */
function stripAnsi(s: string): string {
  return s.replace(/\x1b\[[\d;]*m/g, "");
}

/** Shorten $HOME prefix to ~ for display. */
function tildePath(p: string): string {
  const home = os.homedir();
  return p.startsWith(home) ? "~" + p.slice(home.length) : p;
}

/** Truncate with ellipsis to visible width. */
function truncate(s: string, width: number): string {
  const raw = s;
  // naive — assumes caller already colorised final segment. For CWD we feed plain.
  if (stringWidth(raw) <= width) return raw;
  return raw.slice(0, width - 1) + "…";
}

/**
 * Join left/right column lines side-by-side.
 * - Uses whitespace-only gap (no vertical bar, keeps it clean like Claude Code)
 * - Pads left col to fixed visible width using stringWidth (ANSI-safe)
 */
function joinColumns(leftLines: string[], rightLines: string[], leftWidth: number, gap: number): string {
  const maxLines = Math.max(leftLines.length, rightLines.length);
  const lines: string[] = [];
  for (let i = 0; i < maxLines; i++) {
    const L = leftLines[i] ?? "";
    const R = rightLines[i] ?? "";
    const pad = Math.max(0, leftWidth - stringWidth(L));
    lines.push(L + " ".repeat(pad + gap) + R);
  }
  return lines.join("\n");
}

interface MeInfo {
  email: string;
  plan?: string;
}

async function fetchMe(): Promise<MeInfo | null> {
  if (!getAuthToken()) return null;
  try {
    const me = await apiJson<MeInfo>("/auth/me");
    return me;
  } catch {
    return null;
  }
}

/**
 * Render and print the welcome banner. Call once, returns void.
 */
export async function printWelcome(): Promise<void> {
  const cfg = loadConfig();
  const me = await fetchMe();
  const cwd = process.cwd();

  const username = me?.email ? me.email.split("@")[0] : "";
  const plan = me?.plan || "free";

  // --- LEFT COLUMN ---
  const left: string[] = [];
  left.push(theme.primary.bold(`Welcome back${username ? `, ${username}` : ""}!`));
  left.push("");
  left.push("         " + theme.brand.bold("✕"));
  left.push("");
  if (me?.email) {
    left.push(theme.muted(me.email));
    left.push(theme.muted(`${plan} plan · xerocode_ai`));
  } else {
    left.push(theme.warn("Not signed in"));
    left.push(theme.muted(`run ${theme.brand("xerocode login")}`));
  }
  // Tilde + truncate long cwd
  left.push(theme.muted(truncate(tildePath(cwd), 36)));

  // --- RIGHT COLUMN ---
  const right: string[] = [];
  right.push(theme.brandBold("Tips for getting started"));
  if (me) {
    right.push("Run " + theme.info("xerocode chat") + " for a conversation");
    right.push("Run " + theme.info('xerocode run "…"') + " one-shot");
    right.push("Run " + theme.info("xerocode models") + " to list models");
  } else {
    right.push("Run " + theme.info("xerocode login") + " to sign in");
    right.push("Run " + theme.info("xerocode --help") + " for all commands");
  }
  right.push("");
  right.push(theme.brandBold("Recent activity"));
  right.push(theme.muted("No recent activity"));

  // Render columns at fixed widths (tuned for ≥80-col terminals)
  const LEFT_WIDTH = 36;
  const GAP = 3;
  const RIGHT_WIDTH = 38;
  const INNER_WIDTH = LEFT_WIDTH + GAP + RIGHT_WIDTH;
  const content = joinColumns(left, right, LEFT_WIDTH, GAP);

  const boxed = drawBox(
    content,
    theme.brand(`XeroCode CLI v${VERSION}`),
    INNER_WIDTH,
    theme.brand
  );

  process.stdout.write("\n" + boxed + "\n");

  // Empty input hint (matches Claude Code vibe)
  process.stdout.write("\n" + theme.brand("›") + " " + theme.subtle("(run a command, or 'xerocode --help')") + "\n");

  // Status line
  const left2 = theme.muted("? for shortcuts");
  const right2 = theme.muted(
    (me ? "●" : "○") + " " + (cfg.default.mode || "xerocode_ai") + " · " + theme.dim(cfg.api.base.replace(/^https?:\/\//, ""))
  );
  const termWidth = process.stdout.columns || 100;
  const gap2 = Math.max(1, termWidth - stringWidth(left2) - stringWidth(right2));
  process.stdout.write("\n" + left2 + " ".repeat(gap2) + right2 + "\n");
}
