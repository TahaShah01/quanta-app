"use client";

import { useCallback, useEffect, useState } from "react";
import { Copy, KeyRound, Pencil, Plus, Trash2, X } from "lucide-react";
import { SectionToggle } from "@/components/admin/SectionToggle";
import type {
  MilestoneStatus,
  PortalLink,
  PortalMilestone,
  PortalUpdate,
  ProjectStatus,
  PublicAccount,
} from "@/lib/portal";

const STATUSES: { value: ProjectStatus; label: string }[] = [
  { value: "planning", label: "Planning" },
  { value: "design", label: "Design" },
  { value: "development", label: "In development" },
  { value: "testing", label: "Testing" },
  { value: "launched", label: "Launched" },
  { value: "on-hold", label: "On hold" },
];
const MILESTONE_STATUSES: { value: MilestoneStatus; label: string }[] = [
  { value: "todo", label: "Up next" },
  { value: "active", label: "In progress" },
  { value: "done", label: "Done" },
];

const json = { "Content-Type": "application/json" };
const uid = () => Math.random().toString(36).slice(2, 9);
const today = () => new Date().toISOString().slice(0, 10);

interface Draft {
  id?: string;
  name: string;
  email: string;
  company: string;
  active: boolean;
  password: string;
  project: PublicAccount["project"];
}

const blankDraft = (): Draft => ({
  name: "",
  email: "",
  company: "",
  active: true,
  password: "",
  project: {
    name: "",
    summary: "",
    status: "planning",
    progress: 0,
    startDate: today(),
    targetDate: "",
    milestones: [],
    updates: [],
    links: [],
  },
});

export default function AdminPortalPage() {
  const [accounts, setAccounts] = useState<PublicAccount[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [draft, setDraft] = useState<Draft | null>(null);
  const [saving, setSaving] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [secret, setSecret] = useState<{ email: string; password: string } | null>(null);

  const load = useCallback(async () => {
    try {
      const res = await fetch("/api/portal-accounts", { cache: "no-store" });
      if (!res.ok) throw new Error();
      setAccounts(await res.json());
    } catch {
      setError("Could not load client accounts.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- initial fetch
    void load();
  }, [load]);

  const setField = <K extends keyof Draft>(key: K, value: Draft[K]) =>
    setDraft((d) => (d ? { ...d, [key]: value } : d));
  const setProject = <K extends keyof Draft["project"]>(key: K, value: Draft["project"][K]) =>
    setDraft((d) => (d ? { ...d, project: { ...d.project, [key]: value } } : d));

  async function save() {
    if (!draft) return;
    if (!draft.name.trim() || !draft.email.trim()) {
      setError("Name and email are required.");
      return;
    }
    setSaving(true);
    setError("");
    try {
      const isNew = !draft.id;
      const { id, password, ...rest } = draft;
      const res = await fetch(isNew ? "/api/portal-accounts" : `/api/portal-accounts/${id}`, {
        method: isNew ? "POST" : "PUT",
        headers: json,
        body: JSON.stringify(isNew ? { ...rest, password } : { ...rest, password: password || undefined }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || "Could not save.");
      if (data.password) setSecret({ email: draft.email, password: data.password });
      setDraft(null);
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not save.");
    } finally {
      setSaving(false);
    }
  }

  async function resetPassword(account: PublicAccount) {
    const res = await fetch(`/api/portal-accounts/${account.id}`, {
      method: "PUT",
      headers: json,
      body: JSON.stringify({ resetPassword: true }),
    });
    const data = await res.json().catch(() => ({}));
    if (res.ok && data.password) setSecret({ email: account.email, password: data.password });
    else setError("Could not reset the password.");
  }

  async function toggleActive(account: PublicAccount) {
    await fetch(`/api/portal-accounts/${account.id}`, {
      method: "PUT",
      headers: json,
      body: JSON.stringify({ active: !account.active }),
    });
    await load();
  }

  async function remove(id: string) {
    await fetch(`/api/portal-accounts/${id}`, { method: "DELETE" });
    setDeleteId(null);
    await load();
  }

  const p = draft?.project;
  const field = (label: string, node: React.ReactNode) => (
    <div className="admin-form-group">
      <label className="admin-label">{label}</label>
      {node}
    </div>
  );

  return (
    <div>
      <div className="admin-page-header">
        <div>
          <h1 className="admin-page-title">Client portal</h1>
          <p className="admin-page-sub">
            Create a login for each client, then keep their project progress up to date. Clients see changes within seconds.
          </p>
        </div>
        <button className="admin-btn admin-btn-primary" onClick={() => { setError(""); setDraft(blankDraft()); }}>
          <Plus size={15} /> Add client login
        </button>
      </div>

      <div className="admin-content">
        <SectionToggle
          feature="portal"
          title="Client portal"
          description="Switch off to close client sign-in. The Portal link disappears from the site and the page shows a closed notice."
        />
        {error && !draft && <p role="alert" style={{ color: "#f87171", fontSize: 13, marginBottom: 12 }}>{error}</p>}

        {secret && (
          <div className="admin-card" style={{ borderColor: "var(--admin-accent)", marginBottom: 20 }}>
            <p style={{ fontSize: 13, fontWeight: 600, color: "var(--admin-text)", marginBottom: 6 }}>
              Credentials for the client. Copy them now, the password is not shown again.
            </p>
            <code style={{ display: "block", fontSize: 13, color: "var(--admin-text)", marginBottom: 10 }}>
              {secret.email} / {secret.password}
            </code>
            <div style={{ display: "flex", gap: 8 }}>
              <button className="admin-btn admin-btn-ghost admin-btn-sm" onClick={() => navigator.clipboard?.writeText(`Email: ${secret.email}\nPassword: ${secret.password}`)}>
                <Copy size={13} /> Copy
              </button>
              <button className="admin-btn admin-btn-ghost admin-btn-sm" onClick={() => setSecret(null)}>Done</button>
            </div>
          </div>
        )}

        <div className="admin-table-wrap">
          <table className="admin-table">
            <thead>
              <tr><th>Client</th><th>Project</th><th>Progress</th><th>Last sign-in</th><th>Status</th><th>Actions</th></tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={6} style={{ textAlign: "center", padding: 30, color: "var(--admin-text-muted)" }}>Loading...</td></tr>
              ) : accounts.length === 0 ? (
                <tr><td colSpan={6} style={{ textAlign: "center", padding: 30, color: "var(--admin-text-muted)" }}>No client logins yet.</td></tr>
              ) : (
                accounts.map((a) => (
                  <tr key={a.id}>
                    <td><span className="td-primary">{a.name}</span><br /><span style={{ fontSize: 11, color: "var(--admin-text-muted)" }}>{a.email}{a.company ? ` · ${a.company}` : ""}</span></td>
                    <td>{a.project.name || "—"}</td>
                    <td>{a.project.progress}%</td>
                    <td style={{ fontSize: 12 }}>{a.lastLoginAt ? new Date(a.lastLoginAt).toLocaleString() : "Never"}</td>
                    <td>
                      <button className={`admin-badge ${a.active ? "admin-badge-green" : "admin-badge-gray"}`} style={{ cursor: "pointer", border: 0 }} onClick={() => toggleActive(a)}>
                        {a.active ? "Can sign in" : "Disabled"}
                      </button>
                    </td>
                    <td>
                      <div className="admin-actions">
                        <button className="admin-btn admin-btn-ghost admin-btn-icon" aria-label="Reset password" title="Reset password" onClick={() => resetPassword(a)}><KeyRound size={13} /></button>
                        <button className="admin-btn admin-btn-ghost admin-btn-icon" aria-label="Edit" onClick={() => { setError(""); setDraft({ id: a.id, name: a.name, email: a.email, company: a.company, active: a.active, password: "", project: structuredClone(a.project) }); }}><Pencil size={13} /></button>
                        <button className="admin-btn admin-btn-danger admin-btn-icon" aria-label="Delete" onClick={() => setDeleteId(a.id)}><Trash2 size={13} /></button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {draft && p && (
        <div className="admin-modal-overlay" onClick={() => setDraft(null)}>
          <div className="admin-modal" style={{ maxWidth: 760 }} onClick={(e) => e.stopPropagation()}>
            <div className="admin-modal-header">
              <h2 className="admin-modal-title">{draft.id ? "Edit client" : "New client login"}</h2>
              <button className="admin-btn admin-btn-ghost admin-btn-icon" onClick={() => setDraft(null)}><X size={15} /></button>
            </div>
            <div className="admin-modal-body" style={{ maxHeight: "70vh", overflowY: "auto" }}>
              <div className="admin-form">
                <p className="admin-section-heading">Login</p>
                <div className="admin-form-row">
                  {field("Name *", <input className="admin-input" value={draft.name} onChange={(e) => setField("name", e.target.value)} />)}
                  {field("Company", <input className="admin-input" value={draft.company} onChange={(e) => setField("company", e.target.value)} />)}
                </div>
                <div className="admin-form-row">
                  {field("Email *", <input className="admin-input" type="email" value={draft.email} onChange={(e) => setField("email", e.target.value)} />)}
                  {field(draft.id ? "New password (optional)" : "Password (blank = generate one)", <input className="admin-input" type="text" autoComplete="off" value={draft.password} onChange={(e) => setField("password", e.target.value)} />)}
                </div>

                <p className="admin-section-heading">Project</p>
                <div className="admin-form-row">
                  {field("Project name", <input className="admin-input" value={p.name} onChange={(e) => setProject("name", e.target.value)} />)}
                  {field("Status", (
                    <select className="admin-select" value={p.status} onChange={(e) => setProject("status", e.target.value as ProjectStatus)}>
                      {STATUSES.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
                    </select>
                  ))}
                </div>
                {field("Summary", <textarea className="admin-textarea" rows={2} value={p.summary} onChange={(e) => setProject("summary", e.target.value)} />)}
                {field(`Overall progress: ${p.progress}%`, <input type="range" min={0} max={100} value={p.progress} onChange={(e) => setProject("progress", Number(e.target.value))} style={{ width: "100%" }} />)}
                <div className="admin-form-row">
                  {field("Start date", <input className="admin-input" type="date" value={p.startDate} onChange={(e) => setProject("startDate", e.target.value)} />)}
                  {field("Target date", <input className="admin-input" type="date" value={p.targetDate} onChange={(e) => setProject("targetDate", e.target.value)} />)}
                </div>

                <p className="admin-section-heading">Milestones</p>
                {p.milestones.map((m, i) => {
                  const patch = (v: Partial<PortalMilestone>) => setProject("milestones", p.milestones.map((x, at) => (at === i ? { ...x, ...v } : x)));
                  return (
                    <div key={m.id} style={{ border: "1px solid var(--admin-border)", borderRadius: 8, padding: 10, display: "grid", gap: 8 }}>
                      <div className="admin-form-row">
                        <input className="admin-input" placeholder="Milestone title" value={m.title} onChange={(e) => patch({ title: e.target.value })} />
                        <select className="admin-select" value={m.status} onChange={(e) => patch({ status: e.target.value as MilestoneStatus })}>
                          {MILESTONE_STATUSES.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
                        </select>
                      </div>
                      <div className="admin-form-row">
                        <input className="admin-input" type="date" value={m.due} onChange={(e) => patch({ due: e.target.value })} />
                        <input className="admin-input" placeholder="Note for the client" value={m.note} onChange={(e) => patch({ note: e.target.value })} />
                      </div>
                      <button type="button" className="admin-btn admin-btn-danger admin-btn-sm" style={{ justifySelf: "start" }} onClick={() => setProject("milestones", p.milestones.filter((_, at) => at !== i))}><Trash2 size={12} /> Remove</button>
                    </div>
                  );
                })}
                <button type="button" className="admin-btn admin-btn-ghost admin-btn-sm" style={{ justifySelf: "start" }} onClick={() => setProject("milestones", [...p.milestones, { id: uid(), title: "", status: "todo", due: "", note: "" }])}><Plus size={13} /> Add milestone</button>

                <p className="admin-section-heading">Updates</p>
                {p.updates.map((u, i) => {
                  const patch = (v: Partial<PortalUpdate>) => setProject("updates", p.updates.map((x, at) => (at === i ? { ...x, ...v } : x)));
                  return (
                    <div key={u.id} style={{ border: "1px solid var(--admin-border)", borderRadius: 8, padding: 10, display: "grid", gap: 8 }}>
                      <div className="admin-form-row">
                        <input className="admin-input" placeholder="Update title" value={u.title} onChange={(e) => patch({ title: e.target.value })} />
                        <input className="admin-input" type="date" value={u.date} onChange={(e) => patch({ date: e.target.value })} />
                      </div>
                      <textarea className="admin-textarea" rows={2} placeholder="What happened" value={u.body} onChange={(e) => patch({ body: e.target.value })} />
                      <button type="button" className="admin-btn admin-btn-danger admin-btn-sm" style={{ justifySelf: "start" }} onClick={() => setProject("updates", p.updates.filter((_, at) => at !== i))}><Trash2 size={12} /> Remove</button>
                    </div>
                  );
                })}
                <button type="button" className="admin-btn admin-btn-ghost admin-btn-sm" style={{ justifySelf: "start" }} onClick={() => setProject("updates", [{ id: uid(), date: today(), title: "", body: "" }, ...p.updates])}><Plus size={13} /> Post update</button>

                <p className="admin-section-heading">Links</p>
                {p.links.map((l, i) => {
                  const patch = (v: Partial<PortalLink>) => setProject("links", p.links.map((x, at) => (at === i ? { ...x, ...v } : x)));
                  return (
                    <div key={i} style={{ display: "flex", gap: 8 }}>
                      <input className="admin-input" placeholder="Label (Staging site)" value={l.label} onChange={(e) => patch({ label: e.target.value })} />
                      <input className="admin-input" placeholder="https://" value={l.url} onChange={(e) => patch({ url: e.target.value })} />
                      <button type="button" className="admin-btn admin-btn-danger admin-btn-icon" aria-label="Remove link" onClick={() => setProject("links", p.links.filter((_, at) => at !== i))}><Trash2 size={12} /></button>
                    </div>
                  );
                })}
                <button type="button" className="admin-btn admin-btn-ghost admin-btn-sm" style={{ justifySelf: "start" }} onClick={() => setProject("links", [...p.links, { label: "", url: "" }])}><Plus size={13} /> Add link</button>

                <label style={{ display: "flex", alignItems: "center", gap: 10, fontSize: 13, color: "var(--admin-text-secondary)" }}>
                  <span className="admin-toggle">
                    <input type="checkbox" checked={draft.active} onChange={(e) => setField("active", e.target.checked)} />
                    <span className="admin-toggle-slider" />
                  </span>
                  This client can sign in
                </label>
                {error && <p role="alert" style={{ color: "#f87171", fontSize: 12 }}>{error}</p>}
              </div>
            </div>
            <div className="admin-modal-footer">
              <button className="admin-btn admin-btn-ghost" onClick={() => setDraft(null)}>Cancel</button>
              <button className="admin-btn admin-btn-primary" onClick={save} disabled={saving}>{saving ? "Saving..." : "Save"}</button>
            </div>
          </div>
        </div>
      )}

      {deleteId && (
        <div className="admin-modal-overlay" onClick={() => setDeleteId(null)}>
          <div className="admin-modal" style={{ maxWidth: 400 }} onClick={(e) => e.stopPropagation()}>
            <div className="admin-modal-header">
              <h2 className="admin-modal-title">Delete client login</h2>
              <button className="admin-btn admin-btn-ghost admin-btn-icon" onClick={() => setDeleteId(null)}><X size={15} /></button>
            </div>
            <div className="admin-modal-body admin-confirm">
              <p>This removes the login and its project progress permanently.</p>
              <div style={{ display: "flex", gap: 10, justifyContent: "center" }}>
                <button className="admin-btn admin-btn-ghost" onClick={() => setDeleteId(null)}>Cancel</button>
                <button className="admin-btn admin-btn-danger" onClick={() => remove(deleteId)}>Delete</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
