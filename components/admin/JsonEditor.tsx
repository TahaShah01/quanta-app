"use client";

import { useState } from "react";
import { ArrowDown, ArrowUp, ChevronDown, ChevronRight, Plus, Trash2 } from "lucide-react";

type Json = string | number | boolean | null | Json[] | { [key: string]: Json };

const humanize = (key: string) =>
  key
    .replace(/([a-z0-9])([A-Z])/g, "$1 $2")
    .replace(/[-_]/g, " ")
    .replace(/^./, (c) => c.toUpperCase());

/** A blank copy of a sample value, used when adding a list item. */
function blankLike(sample: Json | undefined): Json {
  if (Array.isArray(sample)) return [];
  if (sample && typeof sample === "object") {
    return Object.fromEntries(Object.entries(sample).map(([k, v]) => [k, blankLike(v)]));
  }
  if (typeof sample === "number") return 0;
  if (typeof sample === "boolean") return false;
  return "";
}

/** Short label for a collapsed list item: first non-empty string inside it. */
function summarize(value: Json): string {
  if (typeof value === "string") return value;
  if (value && typeof value === "object") {
    for (const v of Object.values(value)) {
      const s = typeof v === "string" && v.trim() ? v : "";
      if (s) return s;
    }
  }
  return "";
}

const isPrimitive = (v: Json) => v === null || typeof v !== "object";

function Leaf({ label, value, onChange }: { label: string; value: Json; onChange: (v: Json) => void }) {
  if (typeof value === "boolean") {
    return (
      <label style={{ display: "flex", alignItems: "center", gap: 10, fontSize: 13, color: "var(--admin-text-secondary)" }}>
        <span className="admin-toggle">
          <input type="checkbox" checked={value} onChange={(e) => onChange(e.target.checked)} />
          <span className="admin-toggle-slider" />
        </span>
        {label}
      </label>
    );
  }
  if (typeof value === "number") {
    return (
      <div className="admin-form-group">
        <label className="admin-label">{label}</label>
        <input className="admin-input" type="number" value={value} onChange={(e) => onChange(Number(e.target.value))} />
      </div>
    );
  }
  const text = value === null ? "" : String(value);
  const long = text.length > 80 || text.includes("\n");
  return (
    <div className="admin-form-group">
      <label className="admin-label">{label}</label>
      {long ? (
        <textarea className="admin-textarea" rows={Math.min(10, Math.max(3, Math.ceil(text.length / 90)))} value={text} onChange={(e) => onChange(e.target.value)} />
      ) : (
        <input className="admin-input" value={text} onChange={(e) => onChange(e.target.value)} />
      )}
    </div>
  );
}

function Node({ label, value, onChange, depth }: { label: string; value: Json; onChange: (v: Json) => void; depth: number }) {
  if (Array.isArray(value)) return <ListNode label={label} value={value} onChange={onChange} depth={depth} />;
  if (value && typeof value === "object") return <ObjectNode label={label} value={value} onChange={onChange} depth={depth} />;
  return <Leaf label={label} value={value} onChange={onChange} />;
}

function ObjectNode({ label, value, onChange, depth }: { label: string; value: { [k: string]: Json }; onChange: (v: Json) => void; depth: number }) {
  const [open, setOpen] = useState(depth < 1);
  const entries = Object.entries(value);
  const leaves = entries.filter(([, v]) => isPrimitive(v));
  const groups = entries.filter(([, v]) => !isPrimitive(v));
  const set = (key: string, v: Json) => onChange({ ...value, [key]: v });

  const body = (
    <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
      {leaves.map(([k, v]) => (
        <Leaf key={k} label={humanize(k)} value={v} onChange={(nv) => set(k, nv)} />
      ))}
      {groups.map(([k, v]) => (
        <Node key={k} label={humanize(k)} value={v} onChange={(nv) => set(k, nv)} depth={depth + 1} />
      ))}
    </div>
  );

  if (depth === 0 && !label) return body;
  return (
    <div style={{ border: "1px solid var(--admin-border)", borderRadius: 10, padding: 12 }}>
      <button type="button" onClick={() => setOpen((o) => !o)} style={{ display: "flex", alignItems: "center", gap: 6, background: "none", border: 0, color: "var(--admin-text)", fontSize: 13, fontWeight: 600, cursor: "pointer", width: "100%", textAlign: "left" }}>
        {open ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
        {label}
      </button>
      {open && <div style={{ marginTop: 12 }}>{body}</div>}
    </div>
  );
}

function ListNode({ label, value, onChange, depth }: { label: string; value: Json[]; onChange: (v: Json) => void; depth: number }) {
  const [open, setOpen] = useState(depth < 1);
  const [openItems, setOpenItems] = useState<Set<number>>(new Set());

  const replace = (i: number, v: Json) => onChange(value.map((x, at) => (at === i ? v : x)));
  const remove = (i: number) => onChange(value.filter((_, at) => at !== i));
  const move = (i: number, dir: -1 | 1) => {
    const j = i + dir;
    if (j < 0 || j >= value.length) return;
    const next = [...value];
    [next[i], next[j]] = [next[j], next[i]];
    onChange(next);
  };
  const add = () => {
    onChange([...value, blankLike(value[value.length - 1] ?? value[0] ?? "")]);
    setOpenItems((s) => new Set(s).add(value.length));
  };
  const toggleItem = (i: number) =>
    setOpenItems((s) => {
      const next = new Set(s);
      if (next.has(i)) next.delete(i);
      else next.add(i);
      return next;
    });

  const primitives = value.every(isPrimitive);

  return (
    <div style={{ border: "1px solid var(--admin-border)", borderRadius: 10, padding: 12 }}>
      <button type="button" onClick={() => setOpen((o) => !o)} style={{ display: "flex", alignItems: "center", gap: 6, background: "none", border: 0, color: "var(--admin-text)", fontSize: 13, fontWeight: 600, cursor: "pointer", width: "100%", textAlign: "left" }}>
        {open ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
        {label} <span style={{ color: "var(--admin-text-muted)", fontWeight: 400 }}>({value.length})</span>
      </button>
      {open && (
        <div style={{ marginTop: 12, display: "flex", flexDirection: "column", gap: 10 }}>
          {value.map((item, i) => (
            <div key={i} style={{ display: "flex", gap: 8, alignItems: primitives ? "flex-end" : "flex-start" }}>
              <div style={{ flex: 1, minWidth: 0 }}>
                {primitives ? (
                  <Leaf label={`${label} ${i + 1}`} value={item} onChange={(v) => replace(i, v)} />
                ) : (
                  <div style={{ border: "1px solid var(--admin-border)", borderRadius: 8, padding: 10 }}>
                    <button type="button" onClick={() => toggleItem(i)} style={{ display: "flex", alignItems: "center", gap: 6, background: "none", border: 0, color: "var(--admin-text-secondary)", fontSize: 12, cursor: "pointer", width: "100%", textAlign: "left" }}>
                      {openItems.has(i) ? <ChevronDown size={13} /> : <ChevronRight size={13} />}
                      <span style={{ color: "var(--admin-text-muted)" }}>{i + 1}.</span>
                      <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{summarize(item) || "Untitled"}</span>
                    </button>
                    {openItems.has(i) && (
                      <div style={{ marginTop: 12 }}>
                        <Node label="" value={item} onChange={(v) => replace(i, v)} depth={depth + 1} />
                      </div>
                    )}
                  </div>
                )}
              </div>
              <div style={{ display: "flex", gap: 4 }}>
                <button type="button" className="admin-btn admin-btn-ghost admin-btn-icon" aria-label="Move up" onClick={() => move(i, -1)} disabled={i === 0}><ArrowUp size={12} /></button>
                <button type="button" className="admin-btn admin-btn-ghost admin-btn-icon" aria-label="Move down" onClick={() => move(i, 1)} disabled={i === value.length - 1}><ArrowDown size={12} /></button>
                <button type="button" className="admin-btn admin-btn-danger admin-btn-icon" aria-label="Remove" onClick={() => remove(i)}><Trash2 size={12} /></button>
              </div>
            </div>
          ))}
          <button type="button" className="admin-btn admin-btn-ghost admin-btn-sm" style={{ alignSelf: "flex-start" }} onClick={add}>
            <Plus size={13} /> Add
          </button>
        </div>
      )}
    </div>
  );
}

export function JsonEditor({ value, onChange }: { value: Json; onChange: (v: Json) => void }) {
  return <Node label="" value={value} onChange={onChange} depth={0} />;
}

export type { Json };
