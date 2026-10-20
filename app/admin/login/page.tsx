"use client";

import { useState, type FormEvent } from "react";
import { Lock } from "lucide-react";

export default function AdminLoginPage() {
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function submit(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError("");
    try {
      const res = await fetch("/api/admin/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
      });
      if (res.ok) {
        const next = new URLSearchParams(window.location.search).get("next");
        // Only ever go to another admin page.
        window.location.assign(next && /^\/admin(\/|$)/.test(next) ? next : "/admin");
        return;
      }
      const data = (await res.json().catch(() => ({}))) as { error?: string };
      setError(data.error ?? "Could not sign in.");
    } catch {
      setError("Could not reach the server.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div style={{ minHeight: "100vh", display: "grid", placeItems: "center", padding: 24 }}>
      <form onSubmit={submit} className="admin-card" style={{ width: "100%", maxWidth: 380, display: "grid", gap: 16 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <span className="admin-brand-logo"><Lock size={15} /></span>
          <div>
            <p className="admin-brand-name">QUANTA</p>
            <p className="admin-brand-sub">Admin sign in</p>
          </div>
        </div>
        <div className="admin-form-group">
          <label className="admin-label" htmlFor="admin-password">Password</label>
          <input
            id="admin-password"
            className="admin-input"
            type="password"
            autoComplete="current-password"
            autoFocus
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        </div>
        {error && <p role="alert" style={{ color: "#f87171", fontSize: 13 }}>{error}</p>}
        <button className="admin-btn admin-btn-primary" disabled={busy}>{busy ? "Signing in..." : "Sign in"}</button>
      </form>
    </div>
  );
}
