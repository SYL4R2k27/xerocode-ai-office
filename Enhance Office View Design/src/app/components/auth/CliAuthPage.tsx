/**
 * /cli-auth — device-code approval page.
 *
 * CLI prints a short code (e.g. ABCD-EFGH) and opens this URL.
 * User either:
 *   (a) arrives with ?code=ABCD-EFGH pre-filled
 *   (b) types the code into the form
 *
 * If authenticated → POST /api/auth/cli/approve → show success.
 * If not → show login CTA; after login page re-mounts with token present and auto-approves.
 */
import { useEffect, useMemo, useState } from "react";
import { motion } from "motion/react";
import { LogoFull } from "../shared/Logo";

type Status = "idle" | "approving" | "approved" | "error" | "need_auth";

function getToken(): string | null {
  try {
    return localStorage.getItem("ai_office_token");
  } catch {
    return null;
  }
}

const API_BASE =
  (typeof window !== "undefined" && window.location.origin
    ? window.location.origin
    : "") + "/api";

async function approveCode(userCode: string): Promise<{ ok: true; email: string } | { ok: false; error: string }> {
  const token = getToken();
  if (!token) return { ok: false, error: "not_authenticated" };
  try {
    const resp = await fetch(`${API_BASE}/auth/cli/approve`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ user_code: userCode.toUpperCase() }),
    });
    if (resp.ok) {
      const data = await resp.json();
      return { ok: true, email: data.email };
    }
    const body = await resp.json().catch(() => ({}));
    return {
      ok: false,
      error: body?.detail || `HTTP ${resp.status}`,
    };
  } catch (e: any) {
    return { ok: false, error: e?.message || "Network error" };
  }
}

export function CliAuthPage({ onLoginNeeded }: { onLoginNeeded: () => void }) {
  const prefill = useMemo(() => {
    const u = new URL(window.location.href);
    return (u.searchParams.get("code") || "").toUpperCase();
  }, []);

  const [code, setCode] = useState<string>(prefill);
  const [status, setStatus] = useState<Status>("idle");
  const [userEmail, setUserEmail] = useState<string>("");
  const [errMsg, setErrMsg] = useState<string>("");

  // Auto-approve if we arrived with a code AND user is already signed in
  useEffect(() => {
    if (!prefill) return;
    const t = getToken();
    if (!t) {
      setStatus("need_auth");
      return;
    }
    (async () => {
      setStatus("approving");
      const r = await approveCode(prefill);
      if (r.ok) {
        setUserEmail(r.email);
        setStatus("approved");
      } else if (r.error === "not_authenticated") {
        setStatus("need_auth");
      } else {
        setErrMsg(r.error);
        setStatus("error");
      }
    })();
  }, [prefill]);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!code.trim()) return;
    const t = getToken();
    if (!t) {
      setStatus("need_auth");
      return;
    }
    setStatus("approving");
    const r = await approveCode(code.trim());
    if (r.ok) {
      setUserEmail(r.email);
      setStatus("approved");
    } else if (r.error === "not_authenticated") {
      setStatus("need_auth");
    } else {
      setErrMsg(r.error);
      setStatus("error");
    }
  };

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

        {status === "approved" && (
          <>
            <div className="text-emerald-400 text-4xl mb-3">✓</div>
            <h1 className="text-xl font-semibold mb-2">Готово</h1>
            <p className="text-white/60 text-sm mb-1">
              Терминал авторизован как
            </p>
            <p className="text-white font-medium mb-4">{userEmail}</p>
            <p className="text-white/40 text-xs">
              Вкладку можно закрыть и вернуться в терминал.
            </p>
          </>
        )}

        {status === "need_auth" && (
          <>
            <h1 className="text-xl font-semibold mb-2">Войдите в XeroCode</h1>
            <p className="text-white/60 text-sm mb-6">
              Чтобы подключить CLI{code ? ` с кодом ${code}` : ""}, сначала войдите.
            </p>
            <button
              onClick={onLoginNeeded}
              className="w-full px-5 py-3 rounded-xl bg-gradient-to-r from-purple-600 to-blue-500 text-white font-semibold"
            >
              Войти
            </button>
          </>
        )}

        {(status === "idle" || status === "approving" || status === "error") && (
          <>
            <h1 className="text-xl font-semibold mb-2">Подключить CLI</h1>
            <p className="text-white/60 text-sm mb-6">
              Введите код, который показал{" "}
              <code className="text-white/80 bg-white/[0.06] px-1.5 py-0.5 rounded">
                xerocode login
              </code>
            </p>

            <form onSubmit={onSubmit} className="space-y-4">
              <input
                type="text"
                value={code}
                onChange={(e) => setCode(e.target.value.toUpperCase())}
                placeholder="XXXX-XXXX"
                autoFocus
                maxLength={9}
                className="w-full px-4 py-3 rounded-xl bg-white/[0.04] border border-white/[0.1] focus:border-purple-500/50 outline-none text-center text-2xl tracking-[0.3em] font-mono"
              />

              {status === "error" && (
                <p className="text-rose-400 text-sm">{errMsg}</p>
              )}

              <button
                type="submit"
                disabled={status === "approving" || !code.trim()}
                className="w-full px-5 py-3 rounded-xl bg-gradient-to-r from-purple-600 to-blue-500 text-white font-semibold disabled:opacity-50"
              >
                {status === "approving" ? "Подключаем…" : "Подключить"}
              </button>
            </form>
          </>
        )}
      </motion.div>
    </div>
  );
}
