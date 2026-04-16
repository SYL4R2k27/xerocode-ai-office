/**
 * Config & credential storage.
 *
 * - Non-secret config → ~/.xerocode/config.json  (readable plain JSON)
 * - JWT token       → OS keychain via @napi-rs/keyring,
 *                     fallback ~/.xerocode/credentials.json (0600)
 */
import * as fs from "fs";
import * as os from "os";
import * as path from "path";
import { Entry } from "@napi-rs/keyring";

const CONFIG_DIR = path.join(os.homedir(), ".xerocode");
const CONFIG_FILE = path.join(CONFIG_DIR, "config.json");
const CREDS_FILE = path.join(CONFIG_DIR, "credentials.json");

const KEYRING_SERVICE = "xerocode-cli";
const KEYRING_USER = "default";

export interface AppConfig {
  api: { base: string };
  default: {
    mode: string;
    model?: string;
  };
}

const DEFAULT_CONFIG: AppConfig = {
  api: { base: process.env.XEROCODE_API || "https://xerocode.ru/api" },
  default: { mode: "xerocode_ai" },
};

function ensureDir(): void {
  if (!fs.existsSync(CONFIG_DIR)) {
    fs.mkdirSync(CONFIG_DIR, { recursive: true, mode: 0o700 });
  }
}

export function loadConfig(): AppConfig {
  ensureDir();
  if (!fs.existsSync(CONFIG_FILE)) {
    saveConfig(DEFAULT_CONFIG);
    return DEFAULT_CONFIG;
  }
  try {
    const raw = fs.readFileSync(CONFIG_FILE, "utf-8");
    const user = JSON.parse(raw);
    // Shallow merge with defaults so adding new fields is non-breaking
    return {
      api: { ...DEFAULT_CONFIG.api, ...(user.api || {}) },
      default: { ...DEFAULT_CONFIG.default, ...(user.default || {}) },
    };
  } catch {
    return DEFAULT_CONFIG;
  }
}

export function saveConfig(cfg: AppConfig): void {
  ensureDir();
  fs.writeFileSync(CONFIG_FILE, JSON.stringify(cfg, null, 2), { mode: 0o600 });
}

export function getConfigPath(): string {
  return CONFIG_FILE;
}

// ---------- Credentials (JWT) ----------

/** Try keyring first; fall back to 0600 file if keyring unavailable. */
export function saveToken(token: string): void {
  try {
    const entry = new Entry(KEYRING_SERVICE, KEYRING_USER);
    entry.setPassword(token);
    // Remove stale file fallback if we now have keyring
    if (fs.existsSync(CREDS_FILE)) fs.unlinkSync(CREDS_FILE);
    return;
  } catch {
    // fall through to file
  }
  ensureDir();
  fs.writeFileSync(
    CREDS_FILE,
    JSON.stringify({ token }, null, 2),
    { mode: 0o600 }
  );
}

export function loadToken(): string | null {
  // Prefer keyring
  try {
    const entry = new Entry(KEYRING_SERVICE, KEYRING_USER);
    const tok = entry.getPassword();
    if (tok) return tok;
  } catch {
    /* ignore */
  }
  // Fallback file
  if (fs.existsSync(CREDS_FILE)) {
    try {
      const data = JSON.parse(fs.readFileSync(CREDS_FILE, "utf-8"));
      return typeof data.token === "string" ? data.token : null;
    } catch {
      return null;
    }
  }
  return null;
}

export function clearToken(): void {
  try {
    const entry = new Entry(KEYRING_SERVICE, KEYRING_USER);
    entry.deletePassword();
  } catch {
    /* ignore */
  }
  if (fs.existsSync(CREDS_FILE)) {
    try {
      fs.unlinkSync(CREDS_FILE);
    } catch {
      /* ignore */
    }
  }
}
