import ora, { type Ora } from "ora";
import { theme } from "./theme.js";

/** Ora spinner in brand color with `color: cyan` disabled. */
export function spinner(text: string): Ora {
  return ora({
    text: theme.muted(text),
    spinner: "dots",
    color: "magenta",
  });
}
