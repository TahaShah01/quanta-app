"use client";
import { useState, useEffect } from "react";
import { Plus, Pencil, Trash2, X, Eye, EyeOff } from "lucide-react";
import type { FaqItem } from "@/lib/types";

const CATEGORIES = ["Scope", "Pricing", "Timeline", "Process", "Legal", "Technical", "Other"];
const empty = (): Partial<FaqItem> => ({ question: "", answer: "", category: "General", published: true });

export default function AdminFaqPage() {
  const [items, setItems] = useState<FaqItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState<{ open: boolean; item: Partial<FaqItem>; isNew: boolean }>({ open: false, item: empty(), isNew: true });
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => { fetchItems(); }, []);

  async function fetchItems() {
    setLoading(true);
    const res = await fetch("/api/faq?all=true");
    setItems(await res.json());
    setLoading(false);
  }

  function openAdd() { setModal({ open: true, item: empty(), isNew: true }); }
  function openEdit(f: FaqItem) { setModal({ open: true, item: { ...f }, isNew: false }); }
  function closeModal() { setModal({ open: false, item: empty(), isNew: true }); }
  function updateField(field: string, value: unknown) { setModal((prev) => ({ ...prev, item: { ...prev.item, [field]: value } })); }

  async function save() {
    setSaving(true);
    const { isNew, item } = modal;
    if (isNew) await fetch("/api/faq", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(item) });
    else await fetch(`/api/faq/${item.id}`, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(item) });
    await fetchItems(); closeModal(); setSaving(false);
  }

  async function togglePublish(f: FaqItem) {
    await fetch(`/api/faq/${f.id}`, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ ...f, published: !f.published }) });
    fetchItems();
  }

  async function deleteItem(id: string) {
    await fetch(`/api/faq/${id}`, { method: "DELETE" }); setDeleteId(null); fetchItems();
  }

  return (
    <div>
      <div className="admin-page-header">
        <div><h1 className="admin-page-title">FAQ</h1><p className="admin-page-sub">Manage frequently asked questions shown on the Contact page.</p></div>
        <button className="admin-btn admin-btn-primary" onClick={openAdd}><Plus size={15} /> Add Question</button>
      </div>
      <div className="admin-content">
        <div className="admin-table-wrap">
          <table className="admin-table">
            <thead><tr><th>#</th><th>Question</th><th>Category</th><th>Status</th><th>Actions</th></tr></thead>
            <tbody>
              {loading ? <tr><td colSpan={5} style={{ textAlign: "center", padding: 30, color: "var(--admin-text-muted)" }}>Loading...</td></tr>
                : items.map((f, i) => (
                  <tr key={f.id}>
                    <td style={{ fontFamily: "monospace", fontSize: 12 }}>{String(i + 1).padStart(2, "0")}</td>
                    <td><span className="td-primary">{f.question}</span></td>
                    <td><span className="admin-badge admin-badge-purple">{f.category}</span></td>
                    <td><span className={`admin-badge ${f.published ? "admin-badge-green" : "admin-badge-gray"}`}>{f.published ? "Visible" : "Hidden"}</span></td>
                    <td><div className="admin-actions">
                      <button className="admin-btn admin-btn-ghost admin-btn-icon" onClick={() => togglePublish(f)}>{f.published ? <EyeOff size={13} /> : <Eye size={13} />}</button>
                      <button className="admin-btn admin-btn-ghost admin-btn-icon" onClick={() => openEdit(f)}><Pencil size={13} /></button>
                      <button className="admin-btn admin-btn-danger admin-btn-icon" onClick={() => setDeleteId(f.id)}><Trash2 size={13} /></button>
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
            <div className="admin-modal-header"><h2 className="admin-modal-title">{modal.isNew ? "Add FAQ" : "Edit FAQ"}</h2><button className="admin-btn admin-btn-ghost admin-btn-icon" onClick={closeModal}><X size={15} /></button></div>
            <div className="admin-modal-body">
              <div className="admin-form">
                <div className="admin-form-group"><label className="admin-label">Question *</label><input className="admin-input" value={modal.item.question || ""} onChange={(e) => updateField("question", e.target.value)} placeholder="What types of projects do you take on?" /></div>
                <div className="admin-form-group"><label className="admin-label">Answer *</label><textarea className="admin-textarea" rows={5} value={modal.item.answer || ""} onChange={(e) => updateField("answer", e.target.value)} placeholder="Detailed answer..." /></div>
                <div className="admin-form-row">
                  <div className="admin-form-group"><label className="admin-label">Category</label><select className="admin-select" value={modal.item.category || ""} onChange={(e) => updateField("category", e.target.value)}>{CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}</select></div>
                  <label style={{ display: "flex", alignItems: "center", gap: 10, fontSize: 13, color: "var(--admin-text-secondary)", cursor: "pointer", marginTop: 20 }}>
                    <label className="admin-toggle"><input type="checkbox" checked={!!modal.item.published} onChange={(e) => updateField("published", e.target.checked)} /><span className="admin-toggle-slider" /></label>
                    Published
                  </label>
                </div>
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
            <div className="admin-modal-header"><h2 className="admin-modal-title">Delete FAQ</h2><button className="admin-btn admin-btn-ghost admin-btn-icon" onClick={() => setDeleteId(null)}><X size={15} /></button></div>
            <div className="admin-modal-body admin-confirm"><p>Remove this FAQ item permanently?</p><div style={{ display: "flex", gap: 10, justifyContent: "center" }}><button className="admin-btn admin-btn-ghost" onClick={() => setDeleteId(null)}>Cancel</button><button className="admin-btn admin-btn-danger" onClick={() => deleteItem(deleteId)}>Delete</button></div></div>
          </div>
        </div>
      )}
    </div>
  );
}
