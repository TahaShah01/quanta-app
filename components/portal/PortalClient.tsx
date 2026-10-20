"use client";

import { useCallback, useEffect, useState, type FormEvent } from "react";
import Link from "next/link";
import {
  ArrowUpRight,
  Check,
  CircleDot,
  Lock,
  LogOut,
  UserCog,
  X,
  FileText,
  CheckSquare,
  Square,
  MessageSquare,
  Sparkles,
  ShieldCheck,
  Clock,
  Star,
  CheckCircle2,
  AlertCircle,
  Send,
  Eye,
  Layers,
  Calendar,
} from "lucide-react";
import { Container } from "@/components/ui/Container";
import type { PagesContent } from "@/lib/pages-types";
import type {
  PublicAccount,
  PortalDeliverable,
} from "@/lib/portal";

type Copy = PagesContent["portal"];

const POLL_MS = 10_000;

interface ReviewEligibility {
  eligible: boolean;
  isCompleted: boolean;
  hasReviewed: boolean;
  existingReview: {
    id: string;
    rating: number;
    title: string;
    body: string;
    status: string;
    submittedAt: string;
  } | null;
}

type View =
  | { kind: "loading" }
  | { kind: "login" }
  | {
      kind: "dashboard";
      account: PublicAccount;
      reviewEligibility?: ReviewEligibility;
      syncedAt: number;
    };

export function PortalClient({ copy, enabled }: { copy: Copy; enabled: boolean }) {
  const [view, setView] = useState<View>({ kind: "loading" });

  const refresh = useCallback(async () => {
    try {
      const res = await fetch("/api/portal/me", { cache: "no-store" });
      const data = res.ok
        ? ((await res.json()) as {
            account: PublicAccount | null;
            reviewEligibility?: ReviewEligibility;
          })
        : { account: null };
      if (!data.account) {
        setView({ kind: "login" });
        return;
      }
      setView({
        kind: "dashboard",
        account: data.account,
        reviewEligibility: data.reviewEligibility,
        syncedAt: Date.now(),
      });
    } catch {
      setView((v) => (v.kind === "loading" ? { kind: "login" } : v));
    }
  }, []);

  useEffect(() => {
    if (!enabled) return;
    // eslint-disable-next-line react-hooks/set-state-in-effect -- initial session check
    void refresh();
  }, [enabled, refresh]);

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
    <section className="w-full py-12 md:py-20">
      <Container>
        {!enabled ? (
          <Disabled copy={copy} />
        ) : view.kind === "loading" ? (
          <div className="mx-auto h-72 max-w-lg animate-pulse rounded-2xl border border-[var(--border)] bg-[var(--surface)]" />
        ) : view.kind === "login" ? (
          <LoginForm copy={copy} onSuccess={refresh} />
        ) : (
          <Dashboard
            copy={copy}
            account={view.account}
            reviewEligibility={view.reviewEligibility}
            syncedAt={view.syncedAt}
            onSignOut={signOut}
            onRefresh={refresh}
          />
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
      className="mx-auto flex max-w-md flex-col gap-5 rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-8 md:p-10 shadow-2xl"
    >
      <div>
        <div className="flex items-center gap-2 mb-2">
          <span className="inline-flex items-center gap-1.5 rounded-full border border-[var(--border)] bg-[var(--surface-hover)] px-2.5 py-1 font-mono text-[10px] uppercase tracking-wider text-[var(--accent)]">
            <Lock size={11} />
            Client Portal Gateway
          </span>
        </div>
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

type TabKey = "overview" | "deliverables" | "tasks" | "communication" | "updates" | "review";

function Dashboard({
  copy,
  account,
  reviewEligibility,
  syncedAt,
  onSignOut,
  onRefresh,
}: {
  copy: Copy;
  account: PublicAccount;
  reviewEligibility?: ReviewEligibility;
  syncedAt: number;
  onSignOut: () => void;
  onRefresh: () => Promise<void>;
}) {
  const t = copy.dashboard;
  const { project } = account;
  const progress = Math.max(0, Math.min(100, Number(project.progress) || 0));
  const [activeTab, setActiveTab] = useState<TabKey>("overview");
  const [settingsOpen, setSettingsOpen] = useState(false);

  // Deliverables modal state
  const [selectedDeliverable, setSelectedDeliverable] = useState<PortalDeliverable | null>(null);
  const [approvalAction, setApprovalAction] = useState<"approve" | "revision" | null>(null);
  const [feedbackNote, setFeedbackNote] = useState("");
  const [deliverableSubmitting, setDeliverableSubmitting] = useState(false);

  // Animate progress
  const [shown, setShown] = useState(0);
  useEffect(() => {
    const id = requestAnimationFrame(() => setShown(progress));
    return () => cancelAnimationFrame(id);
  }, [progress]);

  const deliverables = project.deliverables || [];
  const clientTasks = project.clientTasks || [];
  const inquiries = project.inquiries || [];
  const updates = [...project.updates].sort((a, b) => b.date.localeCompare(a.date));

  const pendingApprovalsCount = deliverables.filter(
    (d) => d.status === "pending_approval" || !d.status
  ).length;
  const pendingTasksCount = clientTasks.filter((task) => !task.completed).length;

  // Deliverable action submit
  async function handleDeliverableDecision(e: FormEvent) {
    e.preventDefault();
    if (!selectedDeliverable || !approvalAction) return;
    setDeliverableSubmitting(true);
    try {
      const res = await fetch("/api/portal/me", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          deliverableAction: {
            deliverableId: selectedDeliverable.id,
            action: approvalAction,
            feedback: feedbackNote.trim(),
          },
        }),
      });
      if (res.ok) {
        setSelectedDeliverable(null);
        setApprovalAction(null);
        setFeedbackNote("");
        await onRefresh();
      }
    } catch {
      // Non-fatal
    } finally {
      setDeliverableSubmitting(false);
    }
  }

  // Toggle client task
  async function handleTaskToggle(taskId: string, currentCompleted: boolean) {
    try {
      const res = await fetch("/api/portal/me", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          taskAction: {
            taskId,
            completed: !currentCompleted,
          },
        }),
      });
      if (res.ok) {
        await onRefresh();
      }
    } catch {
      // Non-fatal
    }
  }

  return (
    <div className="mx-auto flex max-w-6xl flex-col gap-8">
      {/* Executive Header */}
      <header className="flex flex-wrap items-end justify-between gap-6 border-b border-[var(--border)] pb-8">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <span className="font-mono text-xs uppercase tracking-widest text-[var(--accent)] font-semibold">
              {account.company || "Client Workspace"}
            </span>
            <span className="text-[var(--border)]">/</span>
            <span className="font-mono text-xs text-[var(--secondary)]">
              Representative: {account.name}
            </span>
          </div>
          <h2 className="text-3xl font-medium tracking-tight text-[var(--foreground)] md:text-5xl">
            {project.name}
          </h2>
          {project.summary && (
            <p className="mt-3 max-w-3xl text-sm leading-relaxed text-[var(--secondary)]">
              {project.summary}
            </p>
          )}
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <span className="flex items-center gap-2 rounded-full border border-emerald-500/20 bg-emerald-500/10 px-3 py-1.5 font-mono text-[11px] uppercase tracking-widest text-emerald-400">
            <span className="h-2 w-2 animate-pulse rounded-full bg-emerald-400" />
            Live Sync
          </span>
          <button
            type="button"
            onClick={() => setSettingsOpen(true)}
            className="flex items-center gap-2 rounded-full border border-[var(--border)] px-4 py-2 font-mono text-[11px] uppercase tracking-widest text-[var(--secondary)] transition-colors hover:border-[var(--accent)] hover:text-[var(--foreground)]"
          >
            <UserCog size={13} />
            Security & Profile
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

      {/* Navigation Tabs */}
      <div className="flex overflow-x-auto border-b border-[var(--border)] gap-2 scrollbar-none pb-px">
        <TabButton
          active={activeTab === "overview"}
          onClick={() => setActiveTab("overview")}
          icon={<Layers size={14} />}
          label="Overview & Milestones"
        />
        <TabButton
          active={activeTab === "deliverables"}
          onClick={() => setActiveTab("deliverables")}
          icon={<FileText size={14} />}
          label="Deliverables & Approvals"
          badge={pendingApprovalsCount > 0 ? `${pendingApprovalsCount} Pending` : undefined}
        />
        <TabButton
          active={activeTab === "tasks"}
          onClick={() => setActiveTab("tasks")}
          icon={<CheckSquare size={14} />}
          label="Action Items"
          badge={pendingTasksCount > 0 ? `${pendingTasksCount} Action` : undefined}
        />
        <TabButton
          active={activeTab === "communication"}
          onClick={() => setActiveTab("communication")}
          icon={<MessageSquare size={14} />}
          label="Communication Center"
          badge={inquiries.length > 0 ? `${inquiries.length}` : undefined}
        />
        <TabButton
          active={activeTab === "updates"}
          onClick={() => setActiveTab("updates")}
          icon={<Calendar size={14} />}
          label="Studio Bulletins & Links"
        />
        <TabButton
          active={activeTab === "review"}
          onClick={() => setActiveTab("review")}
          icon={<Sparkles size={14} />}
          label="Project Review"
          highlight={reviewEligibility?.eligible}
        />
      </div>

      {/* TAB 1: OVERVIEW & MILESTONES */}
      {activeTab === "overview" && (
        <div className="flex flex-col gap-10">
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
            <Stat label={t.targetLabel} value={formatDate(project.targetDate) || "Target Scheduled"} />
          </div>

          <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-8">
            <h3 className="text-label mb-6">{t.milestonesLabel}</h3>
            {project.milestones.length === 0 ? (
              <p className="text-sm text-[var(--muted)]">{t.emptyMilestones}</p>
            ) : (
              <ol className="flex flex-col">
                {project.milestones.map((m, i) => (
                  <li key={m.id} className="relative flex gap-5 pb-8 last:pb-0">
                    {i < project.milestones.length - 1 && (
                      <span className="absolute left-[13px] top-7 h-full w-px bg-[var(--border)]" />
                    )}
                    <span
                      className={`relative z-10 mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full border ${
                        m.status === "done"
                          ? "border-emerald-400 bg-emerald-400/15 text-emerald-400"
                          : m.status === "active"
                            ? "border-[var(--accent)] bg-[var(--accent)]/15 text-[var(--accent)]"
                            : "border-[var(--border)] bg-[var(--surface-hover)] text-[var(--muted)]"
                      }`}
                    >
                      {m.status === "done" ? <Check size={14} /> : <CircleDot size={14} />}
                    </span>
                    <div className="flex-1 rounded-xl border border-[var(--border)] bg-[var(--surface-hover)]/40 p-4">
                      <div className="flex flex-wrap items-baseline justify-between gap-2">
                        <span className="text-sm font-medium text-[var(--foreground)]">{m.title}</span>
                        <span className="font-mono text-[11px] uppercase tracking-widest text-[var(--muted)]">
                          {t.milestoneLabels[m.status] ?? m.status}
                          {m.due ? ` · ${t.dueLabel} ${formatDate(m.due)}` : ""}
                        </span>
                      </div>
                      {m.note && <p className="mt-2 text-xs leading-relaxed text-[var(--secondary)]">{m.note}</p>}
                    </div>
                  </li>
                ))}
              </ol>
            )}
          </div>
        </div>
      )}

      {/* TAB 2: DELIVERABLES & APPROVALS */}
      {activeTab === "deliverables" && (
        <div className="flex flex-col gap-6">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <h3 className="text-xl font-medium text-[var(--foreground)]">Project Deliverables & Artifacts</h3>
              <p className="text-xs text-[var(--secondary)] mt-1">
                Review production builds, design artifacts, staging links, and formal approvals.
              </p>
            </div>
            <span className="font-mono text-xs text-[var(--muted)]">
              {deliverables.length} Deliverables on Record
            </span>
          </div>

          {deliverables.length === 0 ? (
            <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-12 text-center">
              <p className="text-body text-[var(--muted)]">No deliverables published yet for this project milestone.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {deliverables.map((d) => (
                <div
                  key={d.id}
                  className="flex flex-col justify-between rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-6 transition-colors hover:border-[var(--border-hover)]"
                >
                  <div>
                    <div className="flex items-center justify-between gap-2 mb-3">
                      <span className="font-mono text-xs uppercase tracking-wider text-[var(--muted)]">
                        v{d.version || "1.0"}
                      </span>
                      <span
                        className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 font-mono text-[10px] uppercase tracking-wider ${
                          d.status === "approved"
                            ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                            : d.status === "revision_requested"
                              ? "bg-amber-500/10 text-amber-400 border border-amber-500/20"
                              : "bg-sky-500/10 text-sky-400 border border-sky-500/20"
                        }`}
                      >
                        {d.status === "approved"
                          ? "Approved by Client"
                          : d.status === "revision_requested"
                            ? "Revision Requested"
                            : "Pending Approval"}
                      </span>
                    </div>

                    <h4 className="text-base font-medium text-[var(--foreground)] mb-2">{d.title}</h4>
                    {d.description && (
                      <p className="text-xs leading-relaxed text-[var(--secondary)] mb-4">{d.description}</p>
                    )}

                    {d.feedback && (
                      <div className="mb-4 rounded-xl border border-[var(--border)] bg-[var(--surface-hover)] p-3 text-xs text-[var(--secondary)]">
                        <strong className="text-[var(--foreground)]">Client Note:</strong> &ldquo;{d.feedback}&rdquo;
                      </div>
                    )}
                  </div>

                  <div className="pt-4 border-t border-[var(--border)] flex flex-wrap items-center justify-between gap-3">
                    {d.url ? (
                      <a
                        href={d.url}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1.5 font-mono text-xs text-[var(--accent)] hover:underline"
                      >
                        <Eye size={13} />
                        Inspect Artifact
                        <ArrowUpRight size={12} />
                      </a>
                    ) : (
                      <span className="font-mono text-[11px] text-[var(--muted)]">Direct Artifact</span>
                    )}

                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => {
                          setSelectedDeliverable(d);
                          setApprovalAction("revision");
                          setFeedbackNote(d.feedback || "");
                        }}
                        className="rounded-full border border-[var(--border)] px-3 py-1.5 font-mono text-[11px] uppercase tracking-wider text-[var(--secondary)] hover:text-amber-400 hover:border-amber-400/40 transition-colors"
                      >
                        Request Revision
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setSelectedDeliverable(d);
                          setApprovalAction("approve");
                          setFeedbackNote("");
                        }}
                        className="rounded-full bg-emerald-500/15 border border-emerald-500/30 px-3.5 py-1.5 font-mono text-[11px] font-semibold uppercase tracking-wider text-emerald-400 hover:bg-emerald-500/25 transition-colors"
                      >
                        Approve
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* TAB 3: CLIENT ACTION ITEMS */}
      {activeTab === "tasks" && (
        <div className="flex flex-col gap-6">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <h3 className="text-xl font-medium text-[var(--foreground)]">Client Action Items</h3>
              <p className="text-xs text-[var(--secondary)] mt-1">
                Items requiring your team&apos;s review, content assets, or sign-offs to maintain project velocity.
              </p>
            </div>
            <span className="font-mono text-xs text-[var(--muted)]">
              {clientTasks.filter((t) => t.completed).length} of {clientTasks.length} Completed
            </span>
          </div>

          {clientTasks.length === 0 ? (
            <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-12 text-center">
              <p className="text-body text-[var(--muted)]">No pending client action items at this stage. All requirements are clear!</p>
            </div>
          ) : (
            <div className="flex flex-col gap-3">
              {clientTasks.map((task) => (
                <div
                  key={task.id}
                  onClick={() => handleTaskToggle(task.id, task.completed)}
                  className={`flex items-start gap-4 rounded-xl border p-5 cursor-pointer transition-colors ${
                    task.completed
                      ? "border-[var(--border)] bg-[var(--surface)]/50 opacity-60"
                      : "border-[var(--border)] bg-[var(--surface)] hover:border-[var(--accent)]"
                  }`}
                >
                  <button type="button" className="mt-0.5 text-[var(--accent)]">
                    {task.completed ? <CheckSquare size={18} className="text-emerald-400" /> : <Square size={18} />}
                  </button>
                  <div className="flex-1">
                    <div className="flex flex-wrap items-baseline justify-between gap-2">
                      <span className={`text-sm font-medium ${task.completed ? "line-through text-[var(--muted)]" : "text-[var(--foreground)]"}`}>
                        {task.title}
                      </span>
                      {task.due && (
                        <span className="font-mono text-[11px] uppercase tracking-wider text-[var(--muted)]">
                          Due: {formatDate(task.due)}
                        </span>
                      )}
                    </div>
                    {task.description && (
                      <p className="mt-1 text-xs leading-relaxed text-[var(--secondary)]">{task.description}</p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* TAB 4: COMMUNICATION CENTER */}
      {activeTab === "communication" && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          <div className="lg:col-span-5">
            <PortalInquiryForm account={account} onSent={onRefresh} />
          </div>
          <div className="lg:col-span-7">
            <h3 className="text-label mb-4">Inquiry & Change Request History</h3>
            {inquiries.length === 0 ? (
              <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-8 text-center text-xs text-[var(--muted)]">
                No past inquiries or change requests recorded.
              </div>
            ) : (
              <div className="flex flex-col gap-4">
                {inquiries.map((inq) => (
                  <div key={inq.id} className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-5">
                    <div className="flex items-center justify-between gap-2 mb-2">
                      <span className="text-sm font-medium text-[var(--foreground)]">{inq.subject}</span>
                      <span
                        className={`inline-flex items-center px-2 py-0.5 rounded-full font-mono text-[10px] uppercase tracking-wider ${
                          inq.status === "resolved"
                            ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                            : inq.status === "in_progress"
                              ? "bg-sky-500/10 text-sky-400 border border-sky-500/20"
                              : "bg-amber-500/10 text-amber-400 border border-amber-500/20"
                        }`}
                      >
                        {inq.status.replace("_", " ")}
                      </span>
                    </div>
                    <p className="text-xs text-[var(--secondary)] leading-relaxed mb-3">{inq.message}</p>
                    <time className="font-mono text-[10px] text-[var(--muted)] block">
                      Submitted {formatDate(inq.createdAt)}
                    </time>
                    {inq.response && (
                      <div className="mt-3 rounded-lg border border-[var(--border)] bg-[var(--surface-hover)] p-3 text-xs text-[var(--foreground)]">
                        <strong className="text-[var(--accent)] font-mono text-[11px] block mb-1">
                          Quanta Team Response:
                        </strong>
                        {inq.response}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 5: UPDATES & ANNOUNCEMENTS */}
      {activeTab === "updates" && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          <div className="lg:col-span-8 flex flex-col gap-4">
            <h3 className="text-label mb-2">Studio Bulletins & Change Logs</h3>
            {updates.length === 0 ? (
              <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-8 text-center text-xs text-[var(--muted)]">
                {t.emptyUpdates}
              </div>
            ) : (
              updates.map((u) => (
                <article key={u.id} className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-6">
                  <div className="flex items-baseline justify-between gap-3 mb-2">
                    <h4 className="text-base font-medium text-[var(--foreground)]">{u.title}</h4>
                    <span className="font-mono text-xs text-[var(--muted)]">{formatDate(u.date)}</span>
                  </div>
                  {u.body && <p className="whitespace-pre-line text-sm text-[var(--secondary)] leading-relaxed">{u.body}</p>}
                </article>
              ))
            )}
          </div>

          <div className="lg:col-span-4 flex flex-col gap-4">
            <h3 className="text-label mb-2">Project Assets & Resources</h3>
            {project.links.length === 0 ? (
              <p className="text-xs text-[var(--muted)]">No external resource links attached.</p>
            ) : (
              <ul className="flex flex-col gap-2">
                {project.links.map((l) => (
                  <li key={l.url}>
                    <a
                      href={l.url}
                      target="_blank"
                      rel="noreferrer"
                      className="group flex items-center justify-between rounded-xl border border-[var(--border)] bg-[var(--surface)] px-4 py-3 text-xs text-[var(--foreground)] transition-colors hover:border-[var(--accent)]"
                    >
                      <span>{l.label}</span>
                      <ArrowUpRight size={13} className="text-[var(--accent)] transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
                    </a>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      )}

      {/* TAB 6: PROJECT REVIEW */}
      {activeTab === "review" && (
        <div className="max-w-2xl mx-auto w-full">
          <PortalReviewSection
            account={account}
            reviewEligibility={reviewEligibility}
            onReviewed={onRefresh}
          />
        </div>
      )}

      {/* DELIVERABLE APPROVAL / REVISION MODAL */}
      {selectedDeliverable && approvalAction && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm"
          onClick={() => setSelectedDeliverable(null)}
        >
          <div
            className="w-full max-w-lg rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-6 md:p-8 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-4 border-b border-[var(--border)] mb-5">
              <div className="flex items-center gap-2">
                <FileText className="text-[var(--accent)]" size={18} />
                <h3 className="text-lg font-medium text-[var(--foreground)]">
                  {approvalAction === "approve" ? "Approve Deliverable" : "Request Revision"}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setSelectedDeliverable(null)}
                className="rounded-full p-1 text-[var(--muted)] hover:text-[var(--foreground)]"
              >
                <X size={18} />
              </button>
            </div>

            <p className="text-xs text-[var(--secondary)] mb-4">
              Artifact: <strong className="text-[var(--foreground)]">{selectedDeliverable.title}</strong> (v{selectedDeliverable.version || "1.0"})
            </p>

            <form onSubmit={handleDeliverableDecision} className="flex flex-col gap-4">
              <label className="flex flex-col gap-1.5">
                <span className="text-label">
                  {approvalAction === "approve" ? "Approval Notes (Optional)" : "Revision Instructions *"}
                </span>
                <textarea
                  required={approvalAction === "revision"}
                  rows={4}
                  value={feedbackNote}
                  onChange={(e) => setFeedbackNote(e.target.value)}
                  placeholder={
                    approvalAction === "approve"
                      ? "Add any feedback, sign-off notes, or next-phase recommendations..."
                      : "Describe specific adjustments, bug fixes, or visual refinements needed..."
                  }
                  className="rounded-lg border border-[var(--border)] bg-[var(--background)] p-3 text-xs text-[var(--foreground)] outline-none focus:border-[var(--accent)]"
                />
              </label>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-[var(--border)]">
                <button
                  type="button"
                  onClick={() => setSelectedDeliverable(null)}
                  className="rounded-full px-4 py-2 font-mono text-xs uppercase tracking-wider text-[var(--secondary)] hover:text-[var(--foreground)]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={deliverableSubmitting}
                  className={`rounded-full px-5 py-2 font-mono text-xs font-semibold uppercase tracking-wider transition-all disabled:opacity-50 ${
                    approvalAction === "approve"
                      ? "bg-emerald-500 text-black hover:bg-emerald-400"
                      : "bg-amber-500 text-black hover:bg-amber-400"
                  }`}
                >
                  {deliverableSubmitting
                    ? "Submitting..."
                    : approvalAction === "approve"
                      ? "Confirm Approval"
                      : "Submit Revision Request"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Account Settings Modal */}
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

      <footer className="pt-6 border-t border-[var(--border)] flex items-center justify-between text-xs text-[var(--muted)]">
        <span className="font-mono text-[11px] uppercase tracking-widest">
          {t.syncedLabel}{" "}
          {new Date(syncedAt).toLocaleTimeString("en-US", {
            hour: "2-digit",
            minute: "2-digit",
            second: "2-digit",
          })}
        </span>
        <span className="font-mono text-[11px]">Quanta Enterprise Portal CRM</span>
      </footer>
    </div>
  );
}

function TabButton({
  active,
  onClick,
  icon,
  label,
  badge,
  highlight,
}: {
  active: boolean;
  onClick: () => void;
  icon: React.ReactNode;
  label: string;
  badge?: string;
  highlight?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex items-center gap-2 whitespace-nowrap px-4 py-3 font-mono text-xs uppercase tracking-wider transition-all border-b-2 ${
        active
          ? "border-[var(--accent)] text-[var(--foreground)] font-semibold"
          : "border-transparent text-[var(--secondary)] hover:text-[var(--foreground)]"
      }`}
    >
      <span className={active || highlight ? "text-[var(--accent)]" : "text-[var(--muted)]"}>{icon}</span>
      <span>{label}</span>
      {badge && (
        <span className="rounded-full bg-[var(--surface-hover)] border border-[var(--border)] px-2 py-0.5 text-[10px] font-mono text-[var(--accent)]">
          {badge}
        </span>
      )}
    </button>
  );
}

function PortalInquiryForm({
  onSent,
}: {
  account?: PublicAccount;
  onSent?: () => Promise<void> | void;
}) {
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [sending, setSending] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");

  const handleSend = async (e: FormEvent) => {
    e.preventDefault();
    if (!subject.trim() || !message.trim()) return;
    setSending(true);
    setError("");
    try {
      const res = await fetch("/api/portal/me", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          inquiry: {
            subject: subject.trim(),
            message: message.trim(),
          },
        }),
      });
      if (res.ok) {
        setSuccess(true);
        setSubject("");
        setMessage("");
        if (onSent) await onSent();
        setTimeout(() => setSuccess(false), 4000);
      } else {
        setError("Failed to record inquiry. Please try again.");
      }
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-6">
      <div className="flex items-center gap-2 mb-2">
        <Send size={15} className="text-[var(--accent)]" />
        <h3 className="text-base font-medium text-[var(--foreground)]">Direct Team Inquiry</h3>
      </div>
      <p className="text-xs text-[var(--secondary)] mb-4">
        Need revisions, scope updates, or urgent project support? Inquiries log directly to your assigned project leads.
      </p>
      {success ? (
        <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-4 text-xs font-mono text-emerald-400">
          Inquiry logged! Quanta engineers will review and respond shortly.
        </div>
      ) : (
        <form onSubmit={handleSend} className="flex flex-col gap-3">
          {error && <p className="text-xs text-rose-400">{error}</p>}
          <input
            type="text"
            required
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
            placeholder="Subject / Topic (e.g. Scope adjustment, Asset delivery)"
            className="w-full rounded-lg border border-[var(--border)] bg-[var(--background)] px-3 py-2 text-xs text-[var(--foreground)] outline-none focus:border-[var(--accent)]"
          />
          <textarea
            rows={4}
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Type your message or project question in detail..."
            required
            className="w-full rounded-lg border border-[var(--border)] bg-[var(--background)] p-3 text-xs text-[var(--foreground)] outline-none focus:border-[var(--accent)]"
          />
          <button
            type="submit"
            disabled={sending}
            className="self-end rounded-full bg-[var(--accent)] px-5 py-2 font-mono text-xs font-semibold uppercase tracking-wider text-[var(--accent-foreground)] hover:brightness-110 disabled:opacity-50"
          >
            {sending ? "Logging Inquiry..." : "Send to Team"}
          </button>
        </form>
      )}
    </div>
  );
}

function PortalReviewSection({
  account,
  reviewEligibility,
  onReviewed,
}: {
  account: PublicAccount;
  reviewEligibility?: ReviewEligibility;
  onReviewed?: () => Promise<void> | void;
}) {
  const [rating, setRating] = useState(5);
  const [body, setBody] = useState("");
  const [title, setTitle] = useState("");
  const [role, setRole] = useState("Client");
  const [sending, setSending] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");

  const isCompleted =
    reviewEligibility?.isCompleted ||
    account.project.status === "completed" ||
    account.project.status === "launched";

  // CASE 1: Engagement in Progress (not completed)
  if (!isCompleted) {
    return (
      <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-8 text-center flex flex-col items-center">
        <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl border border-amber-500/20 bg-amber-500/10 text-amber-400 shadow-inner">
          <Clock size={24} />
        </div>
        <span className="inline-flex items-center gap-1 font-mono text-[10px] uppercase tracking-widest text-amber-400 mb-2">
          Engagement In Progress
        </span>
        <h3 className="text-xl font-medium text-[var(--foreground)]">Review Unlocks Upon Project Completion</h3>
        <p className="text-xs text-[var(--secondary)] mt-2 max-w-md leading-relaxed">
          To maintain strict integrity, Quanta client reviews unlock exclusively when all project milestones are completed and approved.
        </p>
        <div className="mt-6 inline-flex items-center gap-2 rounded-full border border-[var(--border)] bg-[var(--surface-hover)] px-4 py-2 font-mono text-xs text-[var(--muted)]">
          Current Project Status: <span className="uppercase text-[var(--foreground)]">{account.project.status}</span>
        </div>
      </div>
    );
  }

  // CASE 2: Already Submitted a Review
  if (reviewEligibility?.hasReviewed) {
    const r = reviewEligibility.existingReview;
    return (
      <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-8 flex flex-col items-center text-center">
        <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl border border-emerald-500/20 bg-emerald-500/10 text-emerald-400 shadow-inner">
          <ShieldCheck size={24} />
        </div>
        <span className="inline-flex items-center gap-1 font-mono text-[10px] uppercase tracking-widest text-emerald-400 mb-2">
          Verified Review on File
        </span>
        <h3 className="text-xl font-medium text-[var(--foreground)]">Thank You for Your Feedback!</h3>
        <p className="text-xs text-[var(--secondary)] mt-2 max-w-md">
          Your review for &ldquo;{account.project.name}&rdquo; is logged in the studio review directory.
        </p>

        {r && (
          <div className="mt-6 w-full rounded-xl border border-[var(--border)] bg-[var(--surface-hover)] p-5 text-left">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-1">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Star
                    key={i}
                    size={14}
                    className={i < r.rating ? "fill-amber-400 text-amber-400" : "text-[var(--border)]"}
                  />
                ))}
              </div>
              <span className="font-mono text-[10px] uppercase tracking-wider text-emerald-400">
                Moderation Status: {r.status}
              </span>
            </div>
            {r.title && <h5 className="font-medium text-sm text-[var(--foreground)] mb-1">&ldquo;{r.title}&rdquo;</h5>}
            <p className="text-xs text-[var(--secondary)] leading-relaxed">{r.body}</p>
          </div>
        )}
      </div>
    );
  }

  // CASE 3: Completed Engagement - Eligible to Submit
  const handleReview = async (e: FormEvent) => {
    e.preventDefault();
    if (!body.trim() || body.trim().length < 20) {
      setError("Review must be at least 20 characters.");
      return;
    }
    setSending(true);
    setError("");
    try {
      const res = await fetch("/api/reviews", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          reviewerName: account.name,
          reviewerCompany: account.company,
          reviewerRole: role,
          rating,
          title,
          body,
        }),
      });
      const data = await res.json();
      if (res.ok) {
        setSuccess(true);
        if (onReviewed) await onReviewed();
      } else {
        setError(data.error || "Failed to submit review.");
      }
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-8">
      <div className="flex items-center gap-2 mb-2">
        <Sparkles size={16} className="text-emerald-400" />
        <h3 className="text-xl font-medium text-[var(--foreground)]">Leave a Verified Project Review</h3>
      </div>
      <p className="text-xs text-[var(--secondary)] mb-6">
        Congratulations on the completion of <strong className="text-[var(--foreground)]">{account.project.name}</strong>. Your feedback is verified with an authentic client badge.
      </p>

      {success ? (
        <div className="flex flex-col items-center justify-center py-8 text-center gap-3">
          <CheckCircle2 size={40} className="text-emerald-400" />
          <h4 className="text-base font-medium text-[var(--foreground)]">Review Submitted Successfully!</h4>
          <p className="text-xs text-[var(--secondary)] max-w-sm">
            Thank you! Your verified client review has been forwarded to Quanta studio moderation.
          </p>
        </div>
      ) : (
        <form onSubmit={handleReview} className="flex flex-col gap-4">
          {error && (
            <div className="flex items-center gap-2 rounded-lg border border-rose-500/30 bg-rose-500/10 p-3 text-xs text-rose-400">
              <AlertCircle size={14} />
              {error}
            </div>
          )}

          <div className="flex flex-col gap-1.5">
            <span className="text-label">Rating *</span>
            <div className="flex items-center gap-2 mt-1">
              {[1, 2, 3, 4, 5].map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => setRating(s)}
                  className="p-1 transition-transform hover:scale-110"
                >
                  <Star
                    size={22}
                    className={s <= rating ? "fill-amber-400 text-amber-400" : "text-[var(--border)]"}
                  />
                </button>
              ))}
              <span className="font-mono text-xs text-[var(--muted)] ml-2">{rating} of 5 stars</span>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <label className="flex flex-col gap-1.5">
              <span className="text-label">Your Title / Role</span>
              <input
                type="text"
                value={role}
                onChange={(e) => setRole(e.target.value)}
                placeholder="Founder / VP Product"
                className="rounded-lg border border-[var(--border)] bg-[var(--background)] px-3.5 py-2.5 text-xs text-[var(--foreground)] outline-none focus:border-[var(--accent)]"
              />
            </label>
            <label className="flex flex-col gap-1.5">
              <span className="text-label">Headline / Title</span>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Flawless engineering and speed"
                className="rounded-lg border border-[var(--border)] bg-[var(--background)] px-3.5 py-2.5 text-xs text-[var(--foreground)] outline-none focus:border-[var(--accent)]"
              />
            </label>
          </div>

          <label className="flex flex-col gap-1.5">
            <span className="text-label">Your Review (Minimum 20 characters) *</span>
            <textarea
              rows={4}
              required
              value={body}
              onChange={(e) => setBody(e.target.value)}
              placeholder="Describe your collaboration with Quanta, the deliverables, and the outcomes achieved..."
              className="rounded-lg border border-[var(--border)] bg-[var(--background)] p-3 text-xs text-[var(--foreground)] outline-none focus:border-[var(--accent)]"
            />
          </label>

          <button
            type="submit"
            disabled={sending}
            className="self-end rounded-full bg-[var(--accent)] px-6 py-2.5 font-mono text-xs font-semibold uppercase tracking-wider text-[var(--accent-foreground)] hover:brightness-110 disabled:opacity-50"
          >
            {sending ? "Submitting..." : "Submit Verified Review"}
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


