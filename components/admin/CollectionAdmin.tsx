"use client";

import { useCallback, useEffect, useState, type ReactNode } from "react";
import { ArrowDown, ArrowUp, Eye, EyeOff, Pencil, Plus, Trash2, X } from "lucide-react";

export interface FieldDef<T> {
  key: keyof T & string;
  label: string;
  type?: "text" | "textarea" | "select" | "url";
  placeholder?: string;
  options?: { value: string; label: string }[];
  required?: boolean;
  /** Share a row with the next field */
  half?: boolean;
}

interface Base {
  id: string;
  order: number;
  published: boolean;
}

interface CollectionAdminProps<T extends Base> {
  endpoint: string;
  noun: string;
  title: string;
  subtitle: string;
  fields: FieldDef<T>[];
  blank: () => Omit<T, "id" | "order">;
  /** Table cells: first is the primary column */
  columns: { label: string; render: (item: T) => ReactNode }[];
  banner?: ReactNode;
}

const json = { "Content-Type": "application/json" };

export function CollectionAdmin<T extends Base>({
  endpoint,
  noun,
  title,
  subtitle,
  fields,
  blank,
  columns,
  banner,
}: CollectionAdminProps<T>) {
  const [items, setItems] = useState<T[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [modal, setModal] = useState<{ item: Partial<T>; isNew: boolean } | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    try {
      const res = await fetch(`${endpoint}?published=false`, { cache: "no-store" });
      if (!res.ok) throw new Error();
      setItems(await res.json());
      setError("");
    } catch {
      setError("Could not load the list.");
    } finally {
      setLoading(false);
    }
  }, [endpoint]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- initial fetch
    void load();
  }, [load]);

  async function call(url: string, method: string, body?: unknown) {
    const res = await fetch(url, { method, headers: json, body: body ? JSON.stringify(body) : undefined });
    if (!res.ok) throw new Error();
  }

  async function save() {
    if (!modal) return;
    const missing = fields.find((f) => f.required && !String(modal.item[f.key] ?? "").trim());
    if (missing) {
      setError(`${missing.label} is required.`);
      return;
    }
    setSaving(true);
    try {
      if (modal.isNew) await call(endpoint, "POST", modal.item);
      else await call(`${endpoint}/${modal.item.id}`, "PUT", modal.item);
      setModal(null);
      await load();
    } catch {
      setError("Could not save. Try again.");
    } finally {
      setSaving(false);
    }
  }

  async function togglePublished(item: T) {
    try {
      await call(`${endpoint}/${item.id}`, "PUT", { ...item, published: !item.published });
      await load();
    } catch {
      setError("Could not update.");
    }
  }

  async function move(item: T, dir: -1 | 1) {
    const sorted = [...items].sort((a, b) => a.order - b.order);
    const at = sorted.findIndex((i) => i.id === item.id);
    const other = sorted[at + dir];
    if (!other) return;
    try {
      await Promise.all([
        call(`${endpoint}/${item.id}`, "PUT", { ...item, order: other.order }),
        call(`${endpoint}/${other.id}`, "PUT", { ...other, order: item.order }),
      ]);
      await load();
    } catch {
      setError("Could not reorder.");
    }
  }

  async function remove(id: string) {
    try {
      await call(`${endpoint}/${id}`, "DELETE");
      setDeleteId(null);
      await load();
    } catch {
      setError("Could not delete.");
    }
  }

  const set = (key: string, value: unknown) =>
    setModal((m) => (m ? { ...m, item: { ...m.item, [key]: value } } : m));

  const sorted = [...items].sort((a, b) => a.order - b.order);

  function renderField(f: FieldDef<T>) {
    const value = String(modal?.item[f.key] ?? "");
    return (
      <div className="admin-form-group" key={f.key}>
        <label className="admin-label">
          {f.label}
          {f.required ? " *" : ""}
        </label>
        {f.type === "textarea" ? (
          <textarea className="admin-textarea" rows={3} value={value} placeholder={f.placeholder} onChange={(e) => set(f.key, e.target.value)} />
        ) : f.type === "select" ? (
          <select className="admin-select" value={value} onChange={(e) => set(f.key, e.target.value)}>
            {f.options?.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
        ) : (
          <input className="admin-input" type={f.type === "url" ? "url" : "text"} value={value} placeholder={f.placeholder} onChange={(e) => set(f.key, e.target.value)} />
        )}
      </div>
    );
  }

  const rows: FieldDef<T>[][] = [];
  for (let i = 0; i < fields.length; i++) {
    if (fields[i].half && fields[i + 1]) rows.push([fields[i], fields[++i]]);
    else rows.push([fields[i]]);
  }

  return (
    <div>
      <div className="admin-page-header">
        <div>
          <h1 className="admin-page-title">{title}</h1>
          <p className="admin-page-sub">{subtitle}</p>
        </div>
        <button
          className="admin-btn admin-btn-primary"
          onClick={() => {
            setError("");
            setModal({ item: blank() as Partial<T>, isNew: true });
          }}
        >
          <Plus size={15} /> Add {noun}
        </button>
      </div>

      <div className="admin-content">
        {banner}
        {error && <p role="alert" style={{ color: "#f87171", fontSize: 13, marginBottom: 12 }}>{error}</p>}
        <div className="admin-table-wrap">
          <table className="admin-table">
            <thead>
              <tr>
                {columns.map((c) => (
                  <th key={c.label}>{c.label}</th>
                ))}
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={columns.length + 2} style={{ textAlign: "center", padding: 30, color: "var(--admin-text-muted)" }}>Loading...</td></tr>
              ) : sorted.length === 0 ? (
                <tr><td colSpan={columns.length + 2} style={{ textAlign: "center", padding: 30, color: "var(--admin-text-muted)" }}>Nothing here yet. Add your first {noun.toLowerCase()}.</td></tr>
              ) : (
                sorted.map((item, i) => (
                  <tr key={item.id}>
                    {columns.map((c, ci) => (
                      <td key={c.label} className={ci === 0 ? "td-primary" : undefined}>{c.render(item)}</td>
                    ))}
                    <td>
                      <span className={`admin-badge ${item.published ? "admin-badge-green" : "admin-badge-gray"}`}>
                        {item.published ? "Shown" : "Hidden"}
                      </span>
                    </td>
                    <td>
                      <div className="admin-actions">
                        <button className="admin-btn admin-btn-ghost admin-btn-icon" aria-label="Move up" disabled={i === 0} onClick={() => move(item, -1)}><ArrowUp size={13} /></button>
                        <button className="admin-btn admin-btn-ghost admin-btn-icon" aria-label="Move down" disabled={i === sorted.length - 1} onClick={() => move(item, 1)}><ArrowDown size={13} /></button>
                        <button className="admin-btn admin-btn-ghost admin-btn-icon" aria-label={item.published ? "Hide" : "Show"} onClick={() => togglePublished(item)}>{item.published ? <EyeOff size={13} /> : <Eye size={13} />}</button>
                        <button className="admin-btn admin-btn-ghost admin-btn-icon" aria-label="Edit" onClick={() => { setError(""); setModal({ item: { ...item }, isNew: false }); }}><Pencil size={13} /></button>
                        <button className="admin-btn admin-btn-danger admin-btn-icon" aria-label="Delete" onClick={() => setDeleteId(item.id)}><Trash2 size={13} /></button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {modal && (
        <div className="admin-modal-overlay" onClick={() => setModal(null)}>
          <div className="admin-modal" onClick={(e) => e.stopPropagation()}>
            <div className="admin-modal-header">
              <h2 className="admin-modal-title">{modal.isNew ? `Add ${noun}` : `Edit ${noun}`}</h2>
              <button className="admin-btn admin-btn-ghost admin-btn-icon" onClick={() => setModal(null)}><X size={15} /></button>
            </div>
            <div className="admin-modal-body">
              <div className="admin-form">
                {rows.map((row) =>
                  row.length === 2 ? (
                    <div className="admin-form-row" key={row[0].key}>{row.map(renderField)}</div>
                  ) : (
                    renderField(row[0])
                  )
                )}
                <label style={{ display: "flex", alignItems: "center", gap: 10, fontSize: 13, color: "var(--admin-text-secondary)" }}>
                  <span className="admin-toggle">
                    <input type="checkbox" checked={!!modal.item.published} onChange={(e) => set("published", e.target.checked)} />
                    <span className="admin-toggle-slider" />
                  </span>
                  Show on the website
                </label>
                {error && <p role="alert" style={{ color: "#f87171", fontSize: 12 }}>{error}</p>}
              </div>
            </div>
            <div className="admin-modal-footer">
              <button className="admin-btn admin-btn-ghost" onClick={() => setModal(null)}>Cancel</button>
              <button className="admin-btn admin-btn-primary" onClick={save} disabled={saving}>{saving ? "Saving..." : "Save"}</button>
            </div>
          </div>
        </div>
      )}

      {deleteId && (
        <div className="admin-modal-overlay" onClick={() => setDeleteId(null)}>
          <div className="admin-modal" style={{ maxWidth: 400 }} onClick={(e) => e.stopPropagation()}>
            <div className="admin-modal-header">
              <h2 className="admin-modal-title">Delete {noun}</h2>
              <button className="admin-btn admin-btn-ghost admin-btn-icon" onClick={() => setDeleteId(null)}><X size={15} /></button>
            </div>
            <div className="admin-modal-body admin-confirm">
              <p>Remove this {noun.toLowerCase()} permanently?</p>
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
