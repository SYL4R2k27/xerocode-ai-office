/**
 * `xerocode login` — device-code authentication flow.
 *
 * Flow:
 *   1. POST /api/auth/cli/request     → { device_code, user_code, verification_url_complete, interval }
 *   2. Print user_code + URL, open browser to verification_url_complete
 *   3. User approves in browser: /cli-auth?code=XXXX-XXXX (page calls /approve)
 *   4. Poll /api/auth/cli/poll every `interval` seconds → { status: approved|pending|expired }
 *   5. On approved: save token, confirm /auth/me, print email
 *
 * No loopback server, no mixed-content issues — works on every browser.
 */
import { Command } from "commander";
import open from "open";
import { theme, banner } from "../ui/theme.js";
import { spinner } from "../ui/spinner.js";
import { setAuthToken, getAuthToken } from "../api/auth.js";
import { apiJson } from "../api/client.js";
import { friendlyError, ApiError } from "../util/errors.js";

interface RequestResponse {
  device_code: string;
  user_code: string;
  verification_url: string;
  verification_url_complete: string;
  expires_in: number;
  interval: number;
}

interface PollResponse {
  status: "pending" | "approved" | "expired";
  token?: string;
}

const MAX_POLL_MINUTES = 10;

function sleep(ms: number): Promise<void> {
  return new Promise((r) => setTimeout(r, ms));
}

export function loginCommand(): Command {
  const cmd = new Command("login");
  cmd
    .description("Authenticate with XeroCode (opens a browser)")
    .option("--force", "re-login even if already authenticated")
    .action(async (opts) => {
      const existing = getAuthToken();
      if (existing && !opts.force) {
        try {
          const me = await apiJson<{ email: string }>("/auth/me");
          console.log(theme.success(`✓ Already logged in as ${theme.bold(me.email)}`));
          console.log(theme.muted(`  Run ${theme.brand("xerocode login --force")} to sign in as a different user.`));
          return;
        } catch {
          // Stale token — continue with fresh login
        }
      }

      console.log(banner());

      // 1. Request device code
      let req: RequestResponse;
      try {
        req = await apiJson<RequestResponse>("/auth/cli/request", {
          method: "POST",
          body: {},
        });
      } catch (err) {
        if (err instanceof ApiError) {
          console.error(friendlyError(err.status, err.body));
        } else {
          console.error(theme.error("✖ " + (err as Error).message));
        }
        process.exit(1);
      }

      // 2. Show code + URL
      console.log(theme.muted("Введите этот код в браузере:"));
      console.log("");
      console.log("  " + theme.brandBold(req.user_code));
      console.log("");
      console.log(theme.muted("URL:"));
      console.log("  " + theme.brand(req.verification_url_complete));
      console.log("");

      // 3. Open browser
      try {
        await open(req.verification_url_complete);
      } catch {
        console.log(
          theme.warn("Не смог открыть браузер автоматически — открой URL вручную.")
        );
      }

      // 4. Poll
      const spin = spinner("Waiting for approval in browser…").start();
      const deadline = Date.now() + MAX_POLL_MINUTES * 60_000;
      const intervalMs = Math.max(req.interval, 1) * 1000;

      let token: string | null = null;
      while (Date.now() < deadline) {
        await sleep(intervalMs);
        try {
          const resp = await apiJson<PollResponse>("/auth/cli/poll", {
            method: "POST",
            body: { device_code: req.device_code },
          });
          if (resp.status === "approved" && resp.token) {
            token = resp.token;
            break;
          }
          if (resp.status === "expired") {
            spin.fail(theme.error("✖ Code expired."));
            console.log(
              theme.muted(`  Run ${theme.brand("xerocode login")} again to retry.`)
            );
            process.exit(1);
          }
          // status === "pending" → keep polling
        } catch (err) {
          // Transient network errors are okay; keep polling
          if (err instanceof ApiError && err.status && err.status >= 500) {
            continue;
          }
          // But 4xx should abort
          if (err instanceof ApiError && err.status && err.status >= 400 && err.status < 500) {
            spin.fail(theme.error("✖ Login failed."));
            console.error(friendlyError(err.status, err.body));
            process.exit(1);
          }
        }
      }

      if (!token) {
        spin.fail(theme.error("✖ Login timed out after " + MAX_POLL_MINUTES + " minutes."));
        process.exit(1);
      }

      spin.stop();
      setAuthToken(token);

      // 5. Confirm
      try {
        const me = await apiJson<{ email: string }>("/auth/me");
        console.log(theme.success(`✓ Logged in as ${theme.bold(me.email)}`));
        console.log(theme.muted(`  Try: ${theme.brand('xerocode run "hi"')}`));
      } catch (err) {
        if (err instanceof ApiError) {
          console.log(friendlyError(err.status, err.body));
        } else {
          console.log(
            theme.warn(
              'Token saved, but /auth/me failed. Run `xerocode run "hi"` to test.'
            )
          );
        }
      }
    });
  return cmd;
}
