"use client";
import { useState, useEffect } from "react";
import { Plus, Pencil, Trash2, X, Eye, EyeOff, Star } from "lucide-react";
import type { Testimonial } from "@/lib/types";

const empty = (): Partial<Testimonial> => ({ clientName: "", clientRole: "", clientCompany: "", quote: "", avatar: "", rating: 5, published: true });

export default function AdminTestimonialsPage() {
  const [items, setItems] = useState<Testimonial[]>([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState<{ open: boolean; item: Partial<Testimonial>; isNew: boolean }>({ open: false, item: empty(), isNew: true });
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => { fetchItems(); }, []);

  async function fetchItems() {
    setLoading(true);
    const res = await fetch("/api/testimonials");
    setItems(await res.json());
    setLoading(false);
  }

  function openAdd() { setModal({ open: true, item: empty(), isNew: true }); }
  function openEdit(t: Testimonial) { setModal({ open: true, item: { ...t }, isNew: false }); }
  function closeModal() { setModal({ open: false, item: empty(), isNew: true }); }
  function updateField(field: string, value: unknown) { setModal((prev) => ({ ...prev, item: { ...prev.item, [field]: value } })); }

  async function save() {
    setSaving(true);
    const { isNew, item } = modal;
    if (isNew) await fetch("/api/testimonials", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(item) });
    else await fetch(`/api/testimonials/${item.id}`, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(item) });
    await fetchItems(); closeModal(); setSaving(false);
  }

  async function togglePublish(t: Testimonial) {
    await fetch(`/api/testimonials/${t.id}`, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ ...t, published: !t.published }) });
    fetchItems();
  }

  async function deleteItem(id: string) {
    await fetch(`/api/testimonials/${id}`, { method: "DELETE" }); setDeleteId(null); fetchItems();
  }

  return (
    <div>
      <div className="admin-page-header">
        <div><h1 className="admin-page-title">Testimonials</h1><p className="admin-page-sub">Manage client testimonials displayed on your website.</p></div>
        <button className="admin-btn admin-btn-primary" onClick={openAdd}><Plus size={15} /> Add Testimonial</button>
      </div>
      <div className="admin-content">
        <div className="admin-table-wrap">
          <table className="admin-table">
            <thead><tr><th>Client</th><th>Company</th><th>Quote</th><th>Rating</th><th>Status</th><th>Actions</th></tr></thead>
            <tbody>
              {loading ? <tr><td colSpan={6} style={{ textAlign: "center", padding: 30, color: "var(--admin-text-muted)" }}>Loading...</td></tr>
                : items.length === 0 ? <tr><td colSpan={6} style={{ textAlign: "center", padding: 30, color: "var(--admin-text-muted)" }}>No testimonials yet.</td></tr>
                : items.map((t) => (
                  <tr key={t.id}>
                    <td><span className="td-primary">{t.clientName}</span><br /><span style={{ fontSize: 11, color: "var(--admin-text-muted)" }}>{t.clientRole}</span></td>
                    <td>{t.clientCompany}</td>
                    <td style={{ maxWidth: 280 }}><span style={{ display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden", fontSize: 12 }}>&ldquo;{t.quote}&rdquo;</span></td>
                    <td><div style={{ display: "flex", gap: 2 }}>{Array.from({ length: 5 }).map((_, i) => <Star key={i} size={12} fill={i < t.rating ? "#f59e0b" : "none"} stroke="#f59e0b" />)}</div></td>
                    <td><span className={`admin-badge ${t.published ? "admin-badge-green" : "admin-badge-gray"}`}>{t.published ? "Published" : "Hidden"}</span></td>
                    <td>
                      <div className="admin-actions">
                        <button className="admin-btn admin-btn-ghost admin-btn-icon" onClick={() => togglePublish(t)}>{t.published ? <EyeOff size={13} /> : <Eye size={13} />}</button>
                        <button className="admin-btn admin-btn-ghost admin-btn-icon" onClick={() => openEdit(t)}><Pencil size={13} /></button>
                        <button className="admin-btn admin-btn-danger admin-btn-icon" onClick={() => setDeleteId(t.id)}><Trash2 size={13} /></button>
                      </div>
                    </td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>
      </div>

      {modal.open && (
        <div className="admin-modal-overlay" onClick={closeModal}>
          <div className="admin-modal" onClick={(e) => e.stopPropagation()}>
            <div className="admin-modal-header"><h2 className="admin-modal-title">{modal.isNew ? "Add Testimonial" : "Edit Testimonial"}</h2><button className="admin-btn admin-btn-ghost admin-btn-icon" onClick={closeModal}><X size={15} /></button></div>
            <div className="admin-modal-body">
              <div className="admin-form">
                <div className="admin-form-row">
                  <div className="admin-form-group"><label className="admin-label">Client Name *</label><input className="admin-input" value={modal.item.clientName || ""} onChange={(e) => updateField("clientName", e.target.value)} placeholder="Sarah Mitchell" /></div>
                  <div className="admin-form-group"><label className="admin-label">Role / Title</label><input className="admin-input" value={modal.item.clientRole || ""} onChange={(e) => updateField("clientRole", e.target.value)} placeholder="CTO" /></div>
                </div>
                <div className="admin-form-row">
                  <div className="admin-form-group"><label className="admin-label">Company</label><input className="admin-input" value={modal.item.clientCompany || ""} onChange={(e) => updateField("clientCompany", e.target.value)} placeholder="Acme Inc." /></div>
                  <div className="admin-form-group"><label className="admin-label">Rating (1–5)</label><input className="admin-input" type="number" min={1} max={5} value={modal.item.rating || 5} onChange={(e) => updateField("rating", Number(e.target.value))} /></div>
                </div>
                <div className="admin-form-group"><label className="admin-label">Quote *</label><textarea className="admin-textarea" rows={4} value={modal.item.quote || ""} onChange={(e) => updateField("quote", e.target.value)} placeholder="What did the client say about working with Quanta?" /></div>
                <div className="admin-form-group"><label className="admin-label">Avatar Image URL</label><input className="admin-input" value={modal.item.avatar || ""} onChange={(e) => updateField("avatar", e.target.value)} placeholder="/team/client-avatar.jpg" /></div>
                <label style={{ display: "flex", alignItems: "center", gap: 10, fontSize: 13, color: "var(--admin-text-secondary)", cursor: "pointer" }}>
                  <label className="admin-toggle"><input type="checkbox" checked={!!modal.item.published} onChange={(e) => updateField("published", e.target.checked)} /><span className="admin-toggle-slider" /></label>
                  Published (visible on website)
                </label>
              </div>
            </div>
            <div className="admin-modal-footer">
              <button className="admin-btn admin-btn-ghost" onClick={closeModal}>Cancel</button>
              <button className="admin-btn admin-btn-primary" onClick={save} disabled={saving}>{saving ? "Saving..." : "Save"}</button>
            </div>
          </div>
        </div>
      )}

      {deleteId && (
        <div className="admin-modal-overlay" onClick={() => setDeleteId(null)}>
          <div className="admin-modal" style={{ maxWidth: 400 }} onClick={(e) => e.stopPropagation()}>
            <div className="admin-modal-header"><h2 className="admin-modal-title">Delete Testimonial</h2><button className="admin-btn admin-btn-ghost admin-btn-icon" onClick={() => setDeleteId(null)}><X size={15} /></button></div>
            <div className="admin-modal-body admin-confirm"><p>Remove this testimonial permanently?</p><div style={{ display: "flex", gap: 10, justifyContent: "center" }}><button className="admin-btn admin-btn-ghost" onClick={() => setDeleteId(null)}>Cancel</button><button className="admin-btn admin-btn-danger" onClick={() => deleteItem(deleteId)}>Delete</button></div></div>
          </div>
        </div>
      )}
    </div>
  );
}
