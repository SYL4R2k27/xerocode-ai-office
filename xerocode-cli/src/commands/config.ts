/**
 * `xerocode config get|set|list` — manage ~/.xerocode/config.json
 */
import { Command } from "commander";
import { theme } from "../ui/theme.js";
import { loadConfig, saveConfig, getConfigPath, type AppConfig } from "../config.js";

function deepGet(obj: any, path: string): unknown {
  return path.split(".").reduce((acc: any, k) => (acc == null ? acc : acc[k]), obj);
}

function deepSet(obj: any, path: string, value: any): void {
  const parts = path.split(".");
  let cur = obj;
  for (let i = 0; i < parts.length - 1; i++) {
    const k = parts[i];
    if (typeof cur[k] !== "object" || cur[k] === null) cur[k] = {};
    cur = cur[k];
  }
  cur[parts[parts.length - 1]] = value;
}

function coerce(v: string): unknown {
  if (v === "true") return true;
  if (v === "false") return false;
  const n = Number(v);
  if (!Number.isNaN(n) && v.trim() !== "") return n;
  return v;
}

export function configCommand(): Command {
  const cmd = new Command("config");
  cmd.description("View or edit ~/.xerocode/config.json");

  cmd
    .command("list")
    .description("Print the full config")
    .action(() => {
      const cfg = loadConfig();
      console.log(theme.muted(`# ${getConfigPath()}`));
      console.log(JSON.stringify(cfg, null, 2));
    });

  cmd
    .command("get <key>")
    .description("Print a single config value (dot-notation)")
    .action((key: string) => {
      const cfg = loadConfig();
      const val = deepGet(cfg as any, key);
      if (val === undefined) {
        console.log(theme.muted("(unset)"));
      } else if (typeof val === "object") {
        console.log(JSON.stringify(val, null, 2));
      } else {
        console.log(String(val));
      }
    });

  cmd
    .command("set <key> <value>")
    .description("Set a config value (dot-notation, auto-coerces true/false/numbers)")
    .action((key: string, value: string) => {
      const cfg = loadConfig();
      deepSet(cfg as any, key, coerce(value));
      saveConfig(cfg as AppConfig);
      console.log(theme.success(`✓ ${key} = ${value}`));
    });

  cmd
    .command("path")
    .description("Print config file path")
    .action(() => {
      console.log(getConfigPath());
    });

  return cmd;
}
