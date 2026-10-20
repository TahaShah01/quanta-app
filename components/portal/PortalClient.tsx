"use client";

import { useCallback, useEffect, useState, type FormEvent } from "react";
import Link from "next/link";
import { ArrowUpRight, Check, CircleDot, Lock, LogOut, UserCog, X } from "lucide-react";
import { Container } from "@/components/ui/Container";
import type { PagesContent } from "@/lib/pages-types";
import type { PublicAccount } from "@/lib/portal";

type Copy = PagesContent["portal"];

const POLL_MS = 10_000;

type View =
  | { kind: "loading" }
  | { kind: "login" }
  | { kind: "dashboard"; account: PublicAccount; syncedAt: number };

export function PortalClient({ copy, enabled }: { copy: Copy; enabled: boolean }) {
  const [view, setView] = useState<View>({ kind: "loading" });

  const refresh = useCallback(async () => {
    try {
      const res = await fetch("/api/portal/me", { cache: "no-store" });
      const data = res.ok ? ((await res.json()) as { account: PublicAccount | null }) : { account: null };
      if (!data.account) {
        setView({ kind: "login" });
        return;
      }
      setView({ kind: "dashboard", account: data.account, syncedAt: Date.now() });
    } catch {
      // Network blip: keep whatever is on screen.
      setView((v) => (v.kind === "loading" ? { kind: "login" } : v));
    }
  }, []);

  useEffect(() => {
    if (!enabled) return;
    // eslint-disable-next-line react-hooks/set-state-in-effect -- initial session check
    void refresh();
  }, [enabled, refresh]);

  // Live view: poll while signed in and the tab is visible.
  const signedIn = view.kind === "dashboard";
  useEffect(() => {
    if (!signedIn) return;
    const tick = () => {
      if (document.visibilityState === "visible") void refresh();
    };
    const id = window.setInterval(tick, POLL_MS);
    document.addEventListener("visibilitychange", tick);
    return () => {
      window.clearInterval(id);
      document.removeEventListener("visibilitychange", tick);
    };
  }, [signedIn, refresh]);

  const signOut = async () => {
    await fetch("/api/portal/logout", { method: "POST" }).catch(() => undefined);
    setView({ kind: "login" });
  };

  return (
    <section className="w-full py-16 md:py-24">
      <Container>
        {!enabled ? (
          <Disabled copy={copy} />
        ) : view.kind === "loading" ? (
          <div className="mx-auto h-64 max-w-md animate-pulse rounded-2xl border border-[var(--border)] bg-[var(--surface)]" />
        ) : view.kind === "login" ? (
          <LoginForm copy={copy} onSuccess={refresh} />
        ) : (
          <Dashboard copy={copy} account={view.account} syncedAt={view.syncedAt} onSignOut={signOut} onRefresh={refresh} />
        )}
      </Container>
    </section>
  );
}

function Disabled({ copy }: { copy: Copy }) {
  const d = copy.disabled;
  return (
    <div className="mx-auto flex max-w-xl flex-col items-start gap-5 rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-8 md:p-10">
      <Lock size={20} className="text-[var(--accent)]" />
      <h2 className="text-2xl font-medium tracking-tight text-[var(--foreground)]">{d.title}</h2>
      <p className="text-body">{d.body}</p>
      <Link
        href={d.button.href}
        className="rounded-full bg-[var(--accent)] px-5 py-2.5 font-mono text-xs font-semibold uppercase tracking-wider text-[var(--accent-foreground)] hover:brightness-110"
      >
        {d.button.label}
      </Link>
    </div>
  );
}

function LoginForm({ copy, onSuccess }: { copy: Copy; onSuccess: () => Promise<void> }) {
  const t = copy.login;
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setError("");
    try {
      const res = await fetch("/api/portal/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      if (res.ok) {
        await onSuccess();
        return;
      }
      const data = (await res.json().catch(() => ({}))) as { error?: string };
      setError(res.status === 401 || !data.error || data.error === "invalid" ? t.error : data.error);
    } catch {
      setError(t.error);
    } finally {
      setBusy(false);
    }
  };

  const field =
    "w-full rounded-lg border border-[var(--border)] bg-[var(--background)] px-4 py-3 text-sm text-[var(--foreground)] outline-none transition-colors focus:border-[var(--accent)]";

  return (
    <form
      onSubmit={submit}
      className="mx-auto flex max-w-md flex-col gap-5 rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-8 md:p-10"
    >
      <div>
        <h2 className="text-2xl font-medium tracking-tight text-[var(--foreground)]">{t.title}</h2>
        <p className="mt-2 text-sm text-[var(--secondary)]">{t.description}</p>
      </div>
      <label className="flex flex-col gap-2">
        <span className="text-label">{t.emailLabel}</span>
        <input
          type="email"
          autoComplete="username"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className={field}
        />
      </label>
      <label className="flex flex-col gap-2">
        <span className="text-label">{t.passwordLabel}</span>
        <input
          type="password"
          autoComplete="current-password"
          required
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className={field}
        />
      </label>
      {error && (
        <p role="alert" className="text-sm text-rose-400">
          {error}
        </p>
      )}
      <button
        type="submit"
        disabled={busy}
        className="rounded-full bg-[var(--accent)] px-5 py-3 font-mono text-xs font-semibold uppercase tracking-wider text-[var(--accent-foreground)] transition-all hover:brightness-110 disabled:opacity-60"
      >
        {busy ? t.signingIn : t.button}
      </button>
      <p className="text-xs text-[var(--muted)]">
        {t.help}{" "}
        <Link href={t.helpLink.href} className="text-[var(--foreground)] underline underline-offset-4">
          {t.helpLink.label}
        </Link>
      </p>
    </form>
  );
}

function formatDate(value: string) {
  if (!value) return "";
  const d = new Date(value);
  return Number.isNaN(d.getTime())
    ? value
    : d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

function Dashboard({
  copy,
  account,
  syncedAt,
  onSignOut,
  onRefresh,
}: {
  copy: Copy;
  account: PublicAccount;
  syncedAt: number;
  onSignOut: () => void;
  onRefresh: () => Promise<void>;
}) {
  const t = copy.dashboard;
  const { project } = account;
  const progress = Math.max(0, Math.min(100, Number(project.progress) || 0));
  const [settingsOpen, setSettingsOpen] = useState(false);

  // Animate the bar from its previous value on each poll.
  const [shown, setShown] = useState(0);
  useEffect(() => {
    const id = requestAnimationFrame(() => setShown(progress));
    return () => cancelAnimationFrame(id);
  }, [progress]);

  const updates = [...project.updates].sort((a, b) => b.date.localeCompare(a.date));

  return (
    <div className="mx-auto flex max-w-5xl flex-col gap-10">
      <header className="flex flex-wrap items-end justify-between gap-6">
        <div>
          <p className="text-label">
            {t.greeting}, {account.name}
            {account.company ? ` · ${account.company}` : ""}
          </p>
          <h2 className="mt-3 text-3xl font-medium tracking-tight text-[var(--foreground)] md:text-5xl">
            {project.name}
          </h2>
          {project.summary && <p className="mt-3 max-w-2xl text-body">{project.summary}</p>}
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <span className="flex items-center gap-2 font-mono text-[11px] uppercase tracking-widest text-emerald-400">
            <span className="h-2 w-2 animate-pulse rounded-full bg-emerald-400" />
            {t.liveLabel}
          </span>
          <button
            type="button"
            onClick={() => setSettingsOpen(true)}
            className="flex items-center gap-2 rounded-full border border-[var(--border)] px-4 py-2 font-mono text-[11px] uppercase tracking-widest text-[var(--secondary)] transition-colors hover:border-[var(--accent)] hover:text-[var(--foreground)]"
          >
            <UserCog size={13} />
            Profile & Security
          </button>
          <button
            onClick={onSignOut}
            className="flex items-center gap-2 rounded-full border border-[var(--border)] px-4 py-2 font-mono text-[11px] uppercase tracking-widest text-[var(--secondary)] transition-colors hover:text-[var(--foreground)]"
          >
            <LogOut size={13} />
            {t.signOut}
          </button>
        </div>
      </header>

      {settingsOpen && (
        <AccountSettingsModal
          account={account}
          onClose={() => setSettingsOpen(false)}
          onSuccess={async () => {
            await onRefresh();
            setSettingsOpen(false);
          }}
        />
      )}

      <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
        <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-6 md:col-span-2">
          <div className="flex items-baseline justify-between">
            <span className="text-label">{t.progressLabel}</span>
            <span className="font-mono text-3xl text-[var(--foreground)]" data-testid="portal-progress">
              {progress}%
            </span>
          </div>
          <div className="mt-5 h-2 overflow-hidden rounded-full bg-[var(--surface-hover)]">
            <div
              className="h-full rounded-full bg-[var(--accent)] transition-[width] duration-1000 ease-out"
              style={{ width: `${shown}%` }}
            />
          </div>
        </div>
        <Stat label={t.statusLabel} value={t.statusLabels[project.status] ?? project.status} />
        <Stat label={t.targetLabel} value={formatDate(project.targetDate) || "—"} />
      </div>

      <div className="grid grid-cols-1 gap-10 lg:grid-cols-12">
        <div className="lg:col-span-7">
          <h3 className="text-label mb-5">{t.milestonesLabel}</h3>
          {project.milestones.length === 0 ? (
            <p className="text-sm text-[var(--muted)]">{t.emptyMilestones}</p>
          ) : (
            <ol className="flex flex-col">
              {project.milestones.map((m, i) => (
                <li key={m.id} className="relative flex gap-4 pb-6 last:pb-0">
                  {i < project.milestones.length - 1 && (
                    <span className="absolute left-[11px] top-6 h-full w-px bg-[var(--border)]" />
                  )}
                  <span
                    className={`relative z-10 mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full border ${
                      m.status === "done"
                        ? "border-emerald-400 bg-emerald-400/15 text-emerald-400"
                        : m.status === "active"
                          ? "border-[var(--accent)] text-[var(--accent)]"
                          : "border-[var(--border)] text-[var(--muted)]"
                    }`}
                  >
                    {m.status === "done" ? <Check size={13} /> : <CircleDot size={13} />}
                  </span>
                  <div className="flex-1">
                    <div className="flex flex-wrap items-baseline justify-between gap-2">
                      <span className="text-sm font-medium text-[var(--foreground)]">{m.title}</span>
                      <span className="font-mono text-[11px] uppercase tracking-widest text-[var(--muted)]">
                        {t.milestoneLabels[m.status] ?? m.status}
                        {m.due ? ` · ${t.dueLabel} ${formatDate(m.due)}` : ""}
                      </span>
                    </div>
                    {m.note && <p className="mt-1 text-sm text-[var(--secondary)]">{m.note}</p>}
                  </div>
                </li>
              ))}
            </ol>
          )}
        </div>

        <div className="flex flex-col gap-10 lg:col-span-5">
          <div>
            <h3 className="text-label mb-5">{t.updatesLabel}</h3>
            {updates.length === 0 ? (
              <p className="text-sm text-[var(--muted)]">{t.emptyUpdates}</p>
            ) : (
              <ul className="flex flex-col gap-4">
                {updates.map((u) => (
                  <li key={u.id} className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-5">
                    <div className="flex items-baseline justify-between gap-3">
                      <span className="text-sm font-medium text-[var(--foreground)]">{u.title}</span>
                      <span className="font-mono text-[11px] text-[var(--muted)]">{formatDate(u.date)}</span>
                    </div>
                    {u.body && <p className="mt-2 whitespace-pre-line text-sm text-[var(--secondary)]">{u.body}</p>}
                  </li>
                ))}
              </ul>
            )}
          </div>

          {project.links.length > 0 && (
            <div>
              <h3 className="text-label mb-5">{t.linksLabel}</h3>
              <ul className="flex flex-col gap-2">
                {project.links.map((l) => (
                  <li key={l.url}>
                    <a
                      href={l.url}
                      target="_blank"
                      rel="noreferrer"
                      className="group flex items-center justify-between rounded-lg border border-[var(--border)] px-4 py-3 text-sm text-[var(--foreground)] transition-colors hover:border-[var(--accent)]"
                    >
                      {l.label}
                      <ArrowUpRight size={14} className="text-[var(--accent)] transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Client Communication & Reviews */}
          <div className="flex flex-col gap-6">
            <PortalInquiryForm account={account} />
            <PortalReviewForm account={account} />
          </div>
        </div>
      </div>

      <p className="font-mono text-[11px] uppercase tracking-widest text-[var(--muted)]">
        {t.syncedLabel} {new Date(syncedAt).toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", second: "2-digit" })}
      </p>
    </div>
  );
}

function PortalInquiryForm({ account }: { account: PublicAccount }) {
  const [message, setMessage] = useState("");
  const [sending, setSending] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");

  const handleSend = async (e: FormEvent) => {
    e.preventDefault();
    if (!message.trim()) return;
    setSending(true);
    setError("");
    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: account.name,
          email: account.email,
          company: account.company,
          message: `[Portal Inquiry for ${account.project.name}]: ${message}`,
        }),
      });
      if (res.ok) {
        setSuccess(true);
        setMessage("");
        setTimeout(() => setSuccess(false), 4000);
      } else {
        setError("Failed to send message. Please try again.");
      }
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-6">
      <h3 className="text-label mb-2">Direct Team Inquiry</h3>
      <p className="text-xs text-[var(--secondary)] mb-4">
        Need revisions, scope updates, or urgent project support? Send a note directly to your lead engineers.
      </p>
      {success ? (
        <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-4 text-xs font-mono text-emerald-400">
          Inquiry sent! The team will respond via email shortly.
        </div>
      ) : (
        <form onSubmit={handleSend} className="flex flex-col gap-3">
          {error && <p className="text-xs text-rose-400">{error}</p>}
          <textarea
            rows={3}
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Type your message or project question..."
            required
            className="w-full rounded-lg border border-[var(--border)] bg-[var(--background)] p-3 text-xs text-[var(--foreground)] outline-none focus:border-[var(--accent)]"
          />
          <button
            type="submit"
            disabled={sending}
            className="self-end rounded-full bg-[var(--accent)] px-4 py-2 font-mono text-[11px] font-semibold uppercase tracking-wider text-[var(--accent-foreground)] hover:brightness-110 disabled:opacity-50"
          >
            {sending ? "Sending..." : "Send to Team"}
          </button>
        </form>
      )}
    </div>
  );
}

function PortalReviewForm({ account }: { account: PublicAccount }) {
  const [rating, setRating] = useState(5);
  const [body, setBody] = useState("");
  const [title, setTitle] = useState("");
  const [sending, setSending] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");

  const handleReview = async (e: FormEvent) => {
    e.preventDefault();
    if (!body.trim()) return;
    setSending(true);
    setError("");
    try {
      const res = await fetch("/api/reviews", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          reviewerName: account.name,
          reviewerCompany: account.company,
          reviewerRole: "Client",
          rating,
          title,
          body,
          portalAccountId: account.id,
        }),
      });
      if (res.ok) {
        setSuccess(true);
        setBody("");
        setTitle("");
        setTimeout(() => setSuccess(false), 5000);
      } else {
        setError("Failed to submit review. Please try again.");
      }
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-6">
      <h3 className="text-label mb-2">Leave a Project Review</h3>
      <p className="text-xs text-[var(--secondary)] mb-4">
        Share your experience working with Quanta. Your review will be verified with your client account badge.
      </p>
      {success ? (
        <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-4 text-xs font-mono text-emerald-400">
          Thank you! Your verified client review has been submitted for moderation.
        </div>
      ) : (
        <form onSubmit={handleReview} className="flex flex-col gap-3">
          {error && <p className="text-xs text-rose-400">{error}</p>}
          <div className="flex items-center gap-2">
            <span className="text-xs font-mono text-[var(--muted)]">Rating:</span>
            {[1, 2, 3, 4, 5].map((s) => (
              <button
                key={s}
                type="button"
                onClick={() => setRating(s)}
                className="text-amber-400 text-sm focus:outline-none"
              >
                {s <= rating ? "★" : "☆"}
              </button>
            ))}
          </div>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Review headline (optional)"
            className="w-full rounded-lg border border-[var(--border)] bg-[var(--background)] px-3 py-2 text-xs text-[var(--foreground)] outline-none focus:border-[var(--accent)]"
          />
          <textarea
            rows={3}
            value={body}
            onChange={(e) => setBody(e.target.value)}
            placeholder="How has your experience been with our deliverables, speed, and communication?"
            required
            className="w-full rounded-lg border border-[var(--border)] bg-[var(--background)] p-3 text-xs text-[var(--foreground)] outline-none focus:border-[var(--accent)]"
          />
          <button
            type="submit"
            disabled={sending}
            className="self-end rounded-full bg-[var(--accent)] px-4 py-2 font-mono text-[11px] font-semibold uppercase tracking-wider text-[var(--accent-foreground)] hover:brightness-110 disabled:opacity-50"
          >
            {sending ? "Submitting..." : "Submit Review"}
          </button>
        </form>
      )}
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-6">
      <span className="text-label">{label}</span>
      <div className="mt-5 text-xl font-medium text-[var(--foreground)]">{value}</div>
    </div>
  );
}

function AccountSettingsModal({
  account,
  onClose,
  onSuccess,
}: {
  account: PublicAccount;
  onClose: () => void;
  onSuccess: () => Promise<void> | void;
}) {
  const [name, setName] = useState(account.name);
  const [company, setCompany] = useState(account.company || "");
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);

    if (newPassword) {
      if (newPassword.length < 8) {
        setError("New password must be at least 8 characters long.");
        return;
      }
      if (newPassword !== confirmPassword) {
        setError("New passwords do not match.");
        return;
      }
      if (!currentPassword) {
        setError("Current password is required to change password.");
        return;
      }
    }

    setSaving(true);
    try {
      const res = await fetch("/api/portal/me", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          company: company.trim(),
          ...(newPassword ? { currentPassword, newPassword } : {}),
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Failed to update settings");
        setSaving(false);
        return;
      }

      setSuccessMsg(true);
      setTimeout(async () => {
        await onSuccess();
      }, 1000);
    } catch {
      setError("An unexpected network error occurred.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm">
      <div className="w-full max-w-lg rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-6 shadow-2xl md:p-8">
        <div className="flex items-center justify-between pb-4 border-b border-[var(--border)]">
          <div className="flex items-center gap-2">
            <UserCog className="text-[var(--accent)]" size={18} />
            <h3 className="text-lg font-medium text-[var(--foreground)]">Profile & Security</h3>
          </div>
          <button
            onClick={onClose}
            className="rounded-full p-1 text-[var(--muted)] hover:bg-[var(--surface-hover)] hover:text-[var(--foreground)]"
          >
            <X size={18} />
          </button>
        </div>

        {successMsg ? (
          <div className="py-8 text-center">
            <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-emerald-500/10 text-emerald-400">
              <Check size={24} />
            </div>
            <p className="text-sm font-medium text-emerald-400">Profile & credentials updated successfully!</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="mt-5 flex flex-col gap-4">
            {error && (
              <div className="rounded-lg bg-rose-500/10 p-3 text-xs text-rose-400 border border-rose-500/20">
                {error}
              </div>
            )}

            <div>
              <label className="text-label">Your Name</label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="mt-1 w-full rounded-lg border border-[var(--border)] bg-[var(--background)] px-3 py-2 text-sm text-[var(--foreground)] outline-none focus:border-[var(--accent)]"
              />
            </div>

            <div>
              <label className="text-label">Company / Organization</label>
              <input
                type="text"
                value={company}
                onChange={(e) => setCompany(e.target.value)}
                placeholder="e.g. Acme Corp"
                className="mt-1 w-full rounded-lg border border-[var(--border)] bg-[var(--background)] px-3 py-2 text-sm text-[var(--foreground)] outline-none focus:border-[var(--accent)]"
              />
            </div>

            <div>
              <label className="text-label">Email Address (Read-only)</label>
              <input
                type="email"
                disabled
                value={account.email}
                className="mt-1 w-full rounded-lg border border-[var(--border)] bg-[var(--background)]/50 px-3 py-2 text-sm text-[var(--muted)] cursor-not-allowed outline-none"
              />
            </div>

            <div className="mt-2 border-t border-[var(--border)] pt-4">
              <span className="text-xs font-mono uppercase tracking-wider text-[var(--secondary)]">
                Change Password (Optional)
              </span>
              <div className="mt-3 flex flex-col gap-3">
                <div>
                  <label className="text-label">Current Password</label>
                  <input
                    type="password"
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    placeholder="Required to change password"
                    className="mt-1 w-full rounded-lg border border-[var(--border)] bg-[var(--background)] px-3 py-2 text-sm text-[var(--foreground)] outline-none focus:border-[var(--accent)]"
                  />
                </div>
                <div>
                  <label className="text-label">New Password</label>
                  <input
                    type="password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="Min 8 characters"
                    className="mt-1 w-full rounded-lg border border-[var(--border)] bg-[var(--background)] px-3 py-2 text-sm text-[var(--foreground)] outline-none focus:border-[var(--accent)]"
                  />
                </div>
                <div>
                  <label className="text-label">Confirm New Password</label>
                  <input
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Repeat new password"
                    className="mt-1 w-full rounded-lg border border-[var(--border)] bg-[var(--background)] px-3 py-2 text-sm text-[var(--foreground)] outline-none focus:border-[var(--accent)]"
                  />
                </div>
              </div>
            </div>

            <div className="mt-4 flex items-center justify-end gap-3 pt-3 border-t border-[var(--border)]">
              <button
                type="button"
                onClick={onClose}
                className="rounded-full px-4 py-2 font-mono text-xs uppercase tracking-wider text-[var(--secondary)] hover:text-[var(--foreground)]"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={saving}
                className="rounded-full bg-[var(--accent)] px-5 py-2 font-mono text-xs font-semibold uppercase tracking-wider text-[var(--accent-foreground)] hover:brightness-110 disabled:opacity-50"
              >
                {saving ? "Saving..." : "Save Changes"}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}

