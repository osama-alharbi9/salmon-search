"use client";
import { useEffect, useState } from "react";
import { api, GOOGLE_LOGIN_URL, type AuthUser } from "../lib/api";

/* AuthBar — login / signup / Google, and the logged-in state (email + log out).
   Sits in the window title area. Search works logged out; this only gates the
   saved features added in later steps. UNDER the Cupertino '84 design system. */

export default function AuthBar({
  user,
  onChange,
}: {
  user: AuthUser | null;
  onChange: (u: AuthUser | null) => void;
}) {
  const [open, setOpen] = useState(false);
  const [mode, setMode] = useState<"login" | "signup">("login");
  const [email, setEmail] = useState("");
  const [pw, setPw] = useState("");
  const [name, setName] = useState("");
  const [busy, setBusy] = useState(false);
  const [confirmLogout, setConfirmLogout] = useState(false);
  // seed any Google-redirect error from the URL at first render (no setState in effect)
  const [err, setErr] = useState(() => {
    if (typeof window === "undefined") return "";
    return new URLSearchParams(window.location.search).get("auth") === "google_failed"
      ? "Google sign-in failed. Try again."
      : "";
  });

  // a Google redirect comes back as /app?auth=ok|google_failed: clean the URL.
  useEffect(() => {
    const a = new URLSearchParams(window.location.search).get("auth");
    if (a === "ok" || a === "google_failed") {
      window.history.replaceState({}, "", "/app");
    }
  }, []);

  async function submit() {
    setErr("");
    if (busy) return;
    setBusy(true);
    try {
      const u =
        mode === "login"
          ? await api.login(email.trim(), pw)
          : await api.signup(email.trim(), pw, name.trim() || undefined);
      onChange(u);
      setOpen(false);
      setEmail(""); setPw(""); setName("");
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Something went wrong.");
    }
    setBusy(false);
  }

  async function logout() {
    setConfirmLogout(false);
    await api.logout();
    onChange(null);
  }

  // ── logged in ──────────────────────────────────────────────────────────────
  if (user) {
    return (
      <span className="chrome" style={{ position: "relative", display: "flex", alignItems: "center", gap: 8 }}>
        <span style={{ opacity: 0.7 }}>{user.name || user.email}</span>
        <span className="link" onClick={() => setConfirmLogout(true)}>LOG OUT</span>

        {confirmLogout && (
          <div
            className="win"
            style={{ position: "absolute", right: 0, top: 20, zIndex: 20, width: 220, padding: 10 }}
          >
            <div className="chrome" style={{ marginBottom: 8 }}>log out of salmon?</div>
            <div style={{ display: "flex", gap: 6 }}>
              <button className="btn" type="button" style={{ flex: 1 }} onClick={logout}>
                Log out
              </button>
              <button
                className="btn"
                type="button"
                style={{ flex: 1, background: "var(--paper)", color: "var(--ink)", border: "1px solid var(--ink)" }}
                onClick={() => setConfirmLogout(false)}
              >
                Cancel
              </button>
            </div>
          </div>
        )}
      </span>
    );
  }

  // ── logged out ───────────────────────────────────────────────────────────--
  return (
    <span style={{ position: "relative" }}>
      <span className="link chrome" onClick={() => { setOpen((o) => !o); setErr(""); }}>
        SIGN IN
      </span>

      {open && (
        <div
          className="win"
          style={{
            position: "absolute",
            right: 0,
            top: 20,
            zIndex: 20,
            width: 260,
            padding: 10,
          }}
        >
          <div className="chrome" style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
            <span>
              <span
                className="link"
                style={{ color: mode === "login" ? "var(--salmon)" : undefined }}
                onClick={() => setMode("login")}
              >
                LOG IN
              </span>{" "}
              ·{" "}
              <span
                className="link"
                style={{ color: mode === "signup" ? "var(--salmon)" : undefined }}
                onClick={() => setMode("signup")}
              >
                SIGN UP
              </span>
            </span>
            <span className="link" onClick={() => setOpen(false)}>close</span>
          </div>

          <form
            onSubmit={(e) => { e.preventDefault(); submit(); }}
            style={{ display: "flex", flexDirection: "column", gap: 6 }}
          >
            {mode === "signup" && (
              <input
                className="field" style={inputStyle}
                value={name} onChange={(e) => setName(e.target.value)}
                placeholder="name (optional)"
              />
            )}
            <input
              className="field" style={inputStyle} type="email" autoComplete="email"
              value={email} onChange={(e) => setEmail(e.target.value)}
              placeholder="email"
            />
            <input
              className="field" style={inputStyle} type="password"
              autoComplete={mode === "login" ? "current-password" : "new-password"}
              value={pw} onChange={(e) => setPw(e.target.value)}
              placeholder={mode === "signup" ? "password, 8+ characters" : "password"}
            />
            <button className="btn" type="submit" disabled={busy}>
              {busy ? "..." : mode === "login" ? "Log in" : "Sign up"}
            </button>
          </form>

          <div className="chrome" style={{ textAlign: "center", opacity: 0.5, margin: "8px 0 6px" }}>
            OR
          </div>
          <a className="btn" href={GOOGLE_LOGIN_URL}
             style={{ display: "block", textAlign: "center", textDecoration: "none" }}>
            Continue with Google
          </a>

          {err && (
            <div className="chrome" style={{ color: "var(--salmon)", marginTop: 8 }}>{err}</div>
          )}
        </div>
      )}
    </span>
  );
}

const inputStyle: React.CSSProperties = {
  border: "1px solid var(--ink)",
  fontSize: 17,
  padding: "3px 6px",
};
