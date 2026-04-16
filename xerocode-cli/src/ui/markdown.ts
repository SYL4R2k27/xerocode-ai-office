/**
 * Markdown rendering for terminal output.
 *
 * For streaming token-by-token rendering we don't pipe through marked — instead we
 * flush raw text to stdout as chunks arrive. A non-streaming helper (`renderMd`)
 * is used for final formatted output (e.g., when --no-stream is set, or for
 * `xerocode models` tables that happen to be markdown).
 */
import { marked } from "marked";
import { markedTerminal } from "marked-terminal";
import { theme } from "./theme.js";

// Register terminal renderer.
// Types: markedTerminal returns MarkedExtension; marked.use accepts it.
marked.use(
  markedTerminal({
    reflowText: false,
    tab: 2,
    // keep headings subtle
    firstHeading: theme.brandBold,
    heading: theme.bold,
    strong: theme.bold,
    em: theme.dim,
    codespan: theme.info,
    blockquote: theme.muted.italic,
    list: (body: string) => body,
    listitem: (body: string) => `  ${theme.brand("•")} ${body}`,
  }) as any
);

export function renderMd(markdown: string): string {
  return String(marked.parse(markdown));
}

/** Print a streaming chunk directly (no markdown parsing). */
export function streamWrite(chunk: string): void {
  process.stdout.write(chunk);
}
