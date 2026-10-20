"use client";

import { useState, useEffect } from "react";
import { Plus, Pencil, Trash2, X, Eye, EyeOff } from "lucide-react";
import type { Service } from "@/lib/types";

const ICONS = ["Monitor", "Pen", "Server", "CheckCircle", "Rocket", "Code", "Database", "Cpu", "Globe", "Layers", "Shield", "Zap"];

const empty = (): Partial<Service> => ({
  title: "",
  icon: "Monitor",
  shortDesc: "",
  description: "",
  features: [],
  published: true,
  order: 1,
});

export default function AdminServicesPage() {
  const [items, setItems] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState<{ open: boolean; item: Partial<Service>; isNew: boolean }>({
    open: false,
    item: empty(),
    isNew: true,
  });
  const [featuresRaw, setFeaturesRaw] = useState("");
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchItems();
  }, []);

  async function fetchItems() {
    setLoading(true);
    const res = await fetch("/api/services?all=true");
    const data = await res.json();
    setItems(Array.isArray(data) ? data : []);
    setLoading(false);
  }

  function openAdd() {
    setFeaturesRaw("");
    setModal({ open: true, item: empty(), isNew: true });
  }

  function openEdit(s: Service) {
    setFeaturesRaw((s.features || []).join("\n"));
    setModal({ open: true, item: { ...s }, isNew: false });
  }

  function closeModal() {
    setModal({ open: false, item: empty(), isNew: true });
  }

  function updateField(field: string, value: unknown) {
    setModal((prev) => ({ ...prev, item: { ...prev.item, [field]: value } }));
  }

  async function save() {
    setSaving(true);
    const features = featuresRaw
      .split("\n")
      .map((f) => f.trim())
      .filter(Boolean);

    const payload = {
      ...modal.item,
      features,
      num: modal.item.num || String(items.length + 1).padStart(2, "0"),
    };

    if (modal.isNew) {
      await fetch("/api/services", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
    } else {
      await fetch(`/api/services/${modal.item.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
    }

    await fetchItems();
    closeModal();
    setSaving(false);
  }

  async function togglePublish(s: Service) {
    await fetch(`/api/services/${s.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...s, published: !s.published }),
    });
    fetchItems();
  }

  async function deleteItem(id: string) {
    await fetch(`/api/services/${id}`, { method: "DELETE" });
    setDeleteId(null);
    fetchItems();
  }

  return (
    <div>
      <div className="admin-page-header">
        <div>
          <h1 className="admin-page-title">Services & Capabilities</h1>
          <p className="admin-page-sub">Manage service offerings shown across homepage and services page.</p>
        </div>
        <button className="admin-btn admin-btn-primary" onClick={openAdd}>
          <Plus size={15} /> Add Service
        </button>
      </div>

      <div className="admin-content">
        <div className="admin-table-wrap">
          <table className="admin-table">
            <thead>
              <tr>
                <th>#</th>
                <th>Title</th>
                <th>Icon</th>
                <th>Features Count</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={6} style={{ textAlign: "center", padding: 30, color: "var(--admin-text-muted)" }}>
                    Loading...
                  </td>
                </tr>
              ) : items.length === 0 ? (
                <tr>
                  <td colSpan={6} style={{ textAlign: "center", padding: 30, color: "var(--admin-text-muted)" }}>
                    No services found.
                  </td>
                </tr>
              ) : (
                items.map((s, i) => (
                  <tr key={s.id}>
                    <td style={{ fontFamily: "monospace", fontSize: 12 }}>{s.num || String(i + 1).padStart(2, "0")}</td>
                    <td>
                      <div>
                        <div className="td-primary">{s.title}</div>
                        <div style={{ fontSize: 12, color: "var(--admin-text-muted)", maxWidth: 320, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                          {s.shortDesc}
                        </div>
                      </div>
                    </td>
                    <td>
                      <span className="admin-badge admin-badge-purple">{s.icon || "Monitor"}</span>
                    </td>
                    <td>
                      <span style={{ fontSize: 13, color: "var(--admin-text-secondary)" }}>
                        {s.features ? s.features.length : 0} features
                      </span>
                    </td>
                    <td>
                      <span className={`admin-badge ${s.published ? "admin-badge-green" : "admin-badge-gray"}`}>
                        {s.published ? "Visible" : "Hidden"}
                      </span>
                    </td>
                    <td>
                      <div className="admin-actions">
                        <button
                          className="admin-btn admin-btn-ghost admin-btn-icon"
                          title="Toggle visibility"
                          onClick={() => togglePublish(s)}
                        >
                          {s.published ? <EyeOff size={13} /> : <Eye size={13} />}
                        </button>
                        <button
                          className="admin-btn admin-btn-ghost admin-btn-icon"
                          title="Edit service"
                          onClick={() => openEdit(s)}
                        >
                          <Pencil size={13} />
                        </button>
                        <button
                          className="admin-btn admin-btn-danger admin-btn-icon"
                          title="Delete service"
                          onClick={() => setDeleteId(s.id)}
                        >
                          <Trash2 size={13} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {modal.open && (
        <div className="admin-modal-overlay" onClick={closeModal}>
          <div className="admin-modal" onClick={(e) => e.stopPropagation()}>
            <div className="admin-modal-header">
              <h2 className="admin-modal-title">{modal.isNew ? "Add Service" : "Edit Service"}</h2>
              <button className="admin-btn admin-btn-ghost admin-btn-icon" onClick={closeModal}>
                <X size={15} />
              </button>
            </div>
            <div className="admin-modal-body">
              <div className="admin-form">
                <div className="admin-form-row">
                  <div className="admin-form-group">
                    <label className="admin-label">Service Title *</label>
                    <input
                      className="admin-input"
                      value={modal.item.title || ""}
                      onChange={(e) => updateField("title", e.target.value)}
                      placeholder="e.g. Frontend Development"
                    />
                  </div>
                  <div className="admin-form-group">
                    <label className="admin-label">Icon</label>
                    <select
                      className="admin-select"
                      value={modal.item.icon || "Monitor"}
                      onChange={(e) => updateField("icon", e.target.value)}
                    >
                      {ICONS.map((icon) => (
                        <option key={icon} value={icon}>
                          {icon}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="admin-form-group">
                  <label className="admin-label">Short Description (for cards) *</label>
                  <input
                    className="admin-input"
                    value={modal.item.shortDesc || ""}
                    onChange={(e) => updateField("shortDesc", e.target.value)}
                    placeholder="Brief single-line summary..."
                  />
                </div>

                <div className="admin-form-group">
                  <label className="admin-label">Full Description *</label>
                  <textarea
                    className="admin-textarea"
                    rows={4}
                    value={modal.item.description || ""}
                    onChange={(e) => updateField("description", e.target.value)}
                    placeholder="Comprehensive description of this capability..."
                  />
                </div>

                <div className="admin-form-group">
                  <label className="admin-label">Key Features / Deliverables (One per line)</label>
                  <textarea
                    className="admin-textarea"
                    rows={5}
                    value={featuresRaw}
                    onChange={(e) => setFeaturesRaw(e.target.value)}
                    placeholder="Next.js applications&#10;TypeScript-first&#10;Micro-interactions&#10;Core Web Vitals optimization"
                  />
                </div>

                <div className="admin-form-row">
                  <div className="admin-form-group">
                    <label className="admin-label">Display Order</label>
                    <input
                      className="admin-input"
                      type="number"
                      value={modal.item.order ?? 1}
                      onChange={(e) => updateField("order", parseInt(e.target.value) || 1)}
                    />
                  </div>
                  <label
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 10,
                      fontSize: 13,
                      color: "var(--admin-text-secondary)",
                      cursor: "pointer",
                      marginTop: 20,
                    }}
                  >
                    <label className="admin-toggle">
                      <input
                        type="checkbox"
                        checked={!!modal.item.published}
                        onChange={(e) => updateField("published", e.target.checked)}
                      />
                      <span className="admin-toggle-slider" />
                    </label>
                    Published
                  </label>
                </div>
              </div>
            </div>
            <div className="admin-modal-footer">
              <button className="admin-btn admin-btn-ghost" onClick={closeModal}>
                Cancel
              </button>
              <button className="admin-btn admin-btn-primary" onClick={save} disabled={saving}>
                {saving ? "Saving..." : "Save Service"}
              </button>
            </div>
          </div>
        </div>
      )}

      {deleteId && (
        <div className="admin-modal-overlay" onClick={() => setDeleteId(null)}>
          <div className="admin-modal" style={{ maxWidth: 400 }} onClick={(e) => e.stopPropagation()}>
            <div className="admin-modal-header">
              <h2 className="admin-modal-title">Delete Service</h2>
              <button className="admin-btn admin-btn-ghost admin-btn-icon" onClick={() => setDeleteId(null)}>
                <X size={15} />
              </button>
            </div>
            <div className="admin-modal-body admin-confirm">
              <p>Are you sure you want to permanently remove this service?</p>
              <div style={{ display: "flex", gap: 10, justifyContent: "center" }}>
                <button className="admin-btn admin-btn-ghost" onClick={() => setDeleteId(null)}>
                  Cancel
                </button>
                <button className="admin-btn admin-btn-danger" onClick={() => deleteItem(deleteId)}>
                  Delete
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
