"use client";
import { useState, useEffect } from "react";
import { Plus, Pencil, Trash2, X, Eye, EyeOff } from "lucide-react";
import type { ChangelogEntry } from "@/lib/types";

const TYPE_OPTIONS = ["feature", "fix", "update"] as const;
const TYPE_BADGES: Record<string, string> = { feature: "admin-badge-green", fix: "admin-badge-red", update: "admin-badge-yellow" };
const empty = (): Partial<ChangelogEntry> => ({ title: "", description: "", type: "feature", date: new Date().toISOString().split("T")[0], published: true });

export default function AdminChangelogPage() {
  const [items, setItems] = useState<ChangelogEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState<{ open: boolean; item: Partial<ChangelogEntry>; isNew: boolean }>({ open: false, item: empty(), isNew: true });
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => { fetchItems(); }, []);
  async function fetchItems() { setLoading(true); const r = await fetch("/api/changelog?all=true"); setItems(await r.json()); setLoading(false); }
  function openAdd() { setModal({ open: true, item: empty(), isNew: true }); }
  function openEdit(c: ChangelogEntry) { setModal({ open: true, item: { ...c }, isNew: false }); }
  function closeModal() { setModal({ open: false, item: empty(), isNew: true }); }
  function updateField(field: string, value: unknown) { setModal((prev) => ({ ...prev, item: { ...prev.item, [field]: value } })); }

  async function save() {
    setSaving(true); const { isNew, item } = modal;
    if (isNew) await fetch("/api/changelog", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(item) });
    else await fetch(`/api/changelog/${item.id}`, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(item) });
    await fetchItems(); closeModal(); setSaving(false);
  }

  async function togglePublish(c: ChangelogEntry) {
    await fetch(`/api/changelog/${c.id}`, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ ...c, published: !c.published }) }); fetchItems();
  }
  async function deleteItem(id: string) { await fetch(`/api/changelog/${id}`, { method: "DELETE" }); setDeleteId(null); fetchItems(); }

  return (
    <div>
      <div className="admin-page-header">
        <div><h1 className="admin-page-title">Changelog</h1><p className="admin-page-sub">Track and publish updates, fixes, and new features.</p></div>
        <button className="admin-btn admin-btn-primary" onClick={openAdd}><Plus size={15} /> Add Entry</button>
      </div>
      <div className="admin-content">
        <div className="admin-table-wrap">
          <table className="admin-table">
            <thead><tr><th>Date</th><th>Title</th><th>Type</th><th>Status</th><th>Actions</th></tr></thead>
            <tbody>
              {loading ? <tr><td colSpan={5} style={{ textAlign: "center", padding: 30, color: "var(--admin-text-muted)" }}>Loading...</td></tr>
                : items.map((c) => (
                  <tr key={c.id}>
                    <td style={{ fontFamily: "monospace", fontSize: 12 }}>{c.date}</td>
                    <td><span className="td-primary">{c.title}</span></td>
                    <td><span className={`admin-badge ${TYPE_BADGES[c.type]}`} style={{ textTransform: "capitalize" }}>{c.type}</span></td>
                    <td><span className={`admin-badge ${c.published ? "admin-badge-green" : "admin-badge-gray"}`}>{c.published ? "Live" : "Draft"}</span></td>
                    <td><div className="admin-actions">
                      <button className="admin-btn admin-btn-ghost admin-btn-icon" onClick={() => togglePublish(c)}>{c.published ? <EyeOff size={13} /> : <Eye size={13} />}</button>
                      <button className="admin-btn admin-btn-ghost admin-btn-icon" onClick={() => openEdit(c)}><Pencil size={13} /></button>
                      <button className="admin-btn admin-btn-danger admin-btn-icon" onClick={() => setDeleteId(c.id)}><Trash2 size={13} /></button>
                    </div></td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>
      </div>

      {modal.open && (
        <div className="admin-modal-overlay" onClick={closeModal}>
          <div className="admin-modal" onClick={(e) => e.stopPropagation()}>
            <div className="admin-modal-header"><h2 className="admin-modal-title">{modal.isNew ? "New Entry" : "Edit Entry"}</h2><button className="admin-btn admin-btn-ghost admin-btn-icon" onClick={closeModal}><X size={15} /></button></div>
            <div className="admin-modal-body"><div className="admin-form">
              <div className="admin-form-row">
                <div className="admin-form-group"><label className="admin-label">Title *</label><input className="admin-input" value={modal.item.title || ""} onChange={(e) => updateField("title", e.target.value)} placeholder="What changed?" /></div>
                <div className="admin-form-group"><label className="admin-label">Type</label><select className="admin-select" value={modal.item.type || "feature"} onChange={(e) => updateField("type", e.target.value)}>{TYPE_OPTIONS.map((t) => <option key={t} value={t} style={{ textTransform: "capitalize" }}>{t}</option>)}</select></div>
              </div>
              <div className="admin-form-group"><label className="admin-label">Description</label><textarea className="admin-textarea" rows={3} value={modal.item.description || ""} onChange={(e) => updateField("description", e.target.value)} placeholder="What was added, fixed, or updated?" /></div>
              <div className="admin-form-row">
                <div className="admin-form-group"><label className="admin-label">Date</label><input className="admin-input" type="date" value={modal.item.date || ""} onChange={(e) => updateField("date", e.target.value)} /></div>
                <label style={{ display: "flex", alignItems: "center", gap: 10, fontSize: 13, color: "var(--admin-text-secondary)", cursor: "pointer", marginTop: 20 }}>
                  <label className="admin-toggle"><input type="checkbox" checked={!!modal.item.published} onChange={(e) => updateField("published", e.target.checked)} /><span className="admin-toggle-slider" /></label>
                  Published
                </label>
              </div>
            </div></div>
            <div className="admin-modal-footer"><button className="admin-btn admin-btn-ghost" onClick={closeModal}>Cancel</button><button className="admin-btn admin-btn-primary" onClick={save} disabled={saving}>{saving ? "Saving..." : "Save"}</button></div>
          </div>
        </div>
      )}

      {deleteId && (
        <div className="admin-modal-overlay" onClick={() => setDeleteId(null)}>
          <div className="admin-modal" style={{ maxWidth: 400 }} onClick={(e) => e.stopPropagation()}>
            <div className="admin-modal-header"><h2 className="admin-modal-title">Delete Entry</h2><button className="admin-btn admin-btn-ghost admin-btn-icon" onClick={() => setDeleteId(null)}><X size={15} /></button></div>
            <div className="admin-modal-body admin-confirm"><p>Remove this changelog entry?</p><div style={{ display: "flex", gap: 10, justifyContent: "center" }}><button className="admin-btn admin-btn-ghost" onClick={() => setDeleteId(null)}>Cancel</button><button className="admin-btn admin-btn-danger" onClick={() => deleteItem(deleteId)}>Delete</button></div></div>
          </div>
        </div>
      )}
    </div>
  );
}
