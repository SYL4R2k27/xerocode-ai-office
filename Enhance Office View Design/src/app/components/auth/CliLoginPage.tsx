/**
 * /cli-login — browser page used by `xerocode` CLI for authentication.
 *
 * Flow:
 *   1. CLI opens https://xerocode.ru/cli-login?port=<N>&state=<S>
 *   2. If user isn't logged in → this page shows login UI (delegates to AuthPage)
 *   3. Once authenticated, page reads `ai_office_token` from localStorage and
 *      POSTs { token, state } to http://127.0.0.1:<N>/callback
 *   4. Shows success state; user can close the tab
 *
 * The loopback target is 127.0.0.1 — browser allows mixed content http→https
 * for 127.0.0.1 under modern CORS rules when the server sends permissive headers.
 */
import { useEffect, useMemo, useState } from "react";
import { motion } from "motion/react";
import { LogoFull } from "../shared/Logo";

type Status = "checking" | "unauthenticated" | "sending" | "success" | "error";

function getToken(): string | null {
  try {
    return localStorage.getItem("ai_office_token");
  } catch {
    return null;
  }
}

export function CliLoginPage({ onLoginNeeded }: { onLoginNeeded: () => void }) {
  const params = useMemo(() => {
    const u = new URL(window.location.href);
    return {
      port: u.searchParams.get("port") || "",
      state: u.searchParams.get("state") || "",
    };
  }, []);

  const [status, setStatus] = useState<Status>("checking");
  const [errMsg, setErrMsg] = useState<string>("");

  useEffect(() => {
    // Validate params
    const portNum = Number(params.port);
    if (!params.port || !params.state || !Number.isInteger(portNum) || portNum < 1 || portNum > 65535) {
      setErrMsg("Invalid CLI login link — missing or malformed port/state.");
      setStatus("error");
      return;
    }

    const token = getToken();
    if (!token) {
      setStatus("unauthenticated");
      return;
    }

    (async () => {
      setStatus("sending");
      try {
        const resp = await fetch(`http://127.0.0.1:${portNum}/callback`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ token, state: params.state }),
        });
        if (!resp.ok) {
          const body = await resp.json().catch(() => ({}));
          throw new Error(body?.error || `HTTP ${resp.status}`);
        }
        setStatus("success");
      } catch (e: any) {
        setErrMsg(
          e?.message ||
            "Could not reach the CLI listener. Make sure `xerocode login` is still running."
        );
        setStatus("error");
      }
    })();
  }, [params.port, params.state]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#0a0a0f] text-white px-4">
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="max-w-md w-full rounded-2xl border border-white/[0.08] bg-white/[0.03] backdrop-blur-xl p-8 text-center"
      >
        <div className="flex justify-center mb-6">
          <LogoFull height={28} />
        </div>

        {status === "checking" && <p className="text-white/60">Подключение к CLI…</p>}

        {status === "unauthenticated" && (
          <>
            <h1 className="text-xl font-semibold mb-2">Войдите, чтобы подключить CLI</h1>
            <p className="text-white/60 text-sm mb-6">
              Для авторизации терминала нужно сначала войти в XeroCode.
            </p>
            <button
              onClick={onLoginNeeded}
              className="w-full px-5 py-3 rounded-xl bg-gradient-to-r from-purple-600 to-blue-500 text-white font-semibold"
            >
              Войти
            </button>
            <p className="text-white/40 text-xs mt-4">
              После входа страница автоматически передаст токен в CLI.
            </p>
          </>
        )}

        {status === "sending" && (
          <p className="text-white/60">Отправляем токен в терминал…</p>
        )}

        {status === "success" && (
          <>
            <div className="text-emerald-400 text-4xl mb-3">✓</div>
            <h1 className="text-xl font-semibold mb-2">CLI подключён</h1>
            <p className="text-white/60 text-sm">
              Возвращайтесь в терминал — эту вкладку можно закрыть.
            </p>
          </>
        )}

        {status === "error" && (
          <>
            <div className="text-rose-400 text-4xl mb-3">✖</div>
            <h1 className="text-xl font-semibold mb-2">Не получилось</h1>
            <p className="text-white/60 text-sm break-words">{errMsg}</p>
            <p className="text-white/40 text-xs mt-4">
              Попробуйте повторить: <code className="text-white/70">xerocode login</code>
            </p>
          </>
        )}
      </motion.div>
    </div>
  );
}
