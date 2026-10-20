"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowLeft, CheckCircle, Save } from "lucide-react";
import { JsonEditor, type Json } from "@/components/admin/JsonEditor";
import { CONTENT_FILES } from "@/lib/content-files";

export function ContentEditor({ file }: { file: string }) {
  const meta = CONTENT_FILES.find((f) => f.key === file);

  const [data, setData] = useState<Json | null>(null);
  const [raw, setRaw] = useState("");
  const [mode, setMode] = useState<"form" | "raw">("form");
  const [state, setState] = useState<"idle" | "saving" | "saved" | "error">("idle");
  const [message, setMessage] = useState("");

  useEffect(() => {
    if (!meta) return;
    let cancelled = false;
    fetch(`/api/content/${file}`, { cache: "no-store" })
      .then((r) => (r.ok ? r.json() : Promise.reject()))
      .then((d: Json) => {
        if (cancelled) return;
        setData(d);
        setRaw(JSON.stringify(d, null, 2));
      })
      .catch(() => !cancelled && setMessage("Could not load this content."));
    return () => {
      cancelled = true;
    };
  }, [file, meta]);

  if (!meta) {
    return (
      <div className="admin-content">
        <p>Unknown content file.</p>
        <Link href="/admin/content">Back</Link>
      </div>
    );
  }

  function switchMode(next: "form" | "raw") {
    if (next === mode) return;
    if (next === "form") {
      try {
        setData(JSON.parse(raw));
        setMessage("");
      } catch {
        setMessage("That JSON isn't valid yet, so the form can't open.");
        return;
      }
    } else if (data !== null) {
      setRaw(JSON.stringify(data, null, 2));
    }
    setMode(next);
  }

  async function save() {
    let payload: Json | null = data;
    if (mode === "raw") {
      try {
        payload = JSON.parse(raw);
      } catch {
        setState("error");
        setMessage("That JSON isn't valid, so nothing was saved.");
        return;
      }
    }
    setState("saving");
    setMessage("");
    try {
      const res = await fetch(`/api/content/${file}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error();
      setData(payload);
      setState("saved");
      setTimeout(() => setState("idle"), 2500);
    } catch {
      setState("error");
      setMessage("Could not save. Try again.");
    }
  }

  return (
    <div>
      <div className="admin-page-header">
        <div>
          <Link href="/admin/content" className="admin-back-link" style={{ marginBottom: 8, display: "inline-flex", gap: 6, alignItems: "center" }}>
            <ArrowLeft size={13} /> All content
          </Link>
          <h1 className="admin-page-title">{meta.title}</h1>
          <p className="admin-page-sub">{meta.description}</p>
        </div>
        <button className="admin-btn admin-btn-primary" onClick={save} disabled={state === "saving" || data === null}>
          {state === "saved" ? <CheckCircle size={15} /> : <Save size={15} />}
          {state === "saving" ? "Saving..." : state === "saved" ? "Saved" : "Save changes"}
        </button>
      </div>

      <div className="admin-content">
        <div style={{ display: "flex", gap: 8, marginBottom: 16 }}>
          <button className={`admin-btn admin-btn-sm ${mode === "form" ? "admin-btn-primary" : "admin-btn-ghost"}`} onClick={() => switchMode("form")}>Form</button>
          <button className={`admin-btn admin-btn-sm ${mode === "raw" ? "admin-btn-primary" : "admin-btn-ghost"}`} onClick={() => switchMode("raw")}>Raw JSON</button>
        </div>
        {message && <p role="alert" style={{ color: "#f87171", fontSize: 13, marginBottom: 12 }}>{message}</p>}
        {data === null && !message ? (
          <p style={{ color: "var(--admin-text-muted)" }}>Loading...</p>
        ) : mode === "form" && data !== null ? (
          <div className="admin-card">
            <JsonEditor value={data} onChange={setData} />
          </div>
        ) : (
          <textarea
            className="admin-textarea"
            style={{ fontFamily: "ui-monospace, monospace", fontSize: 12, minHeight: 520 }}
            spellCheck={false}
            value={raw}
            onChange={(e) => setRaw(e.target.value)}
          />
        )}
        <p style={{ fontSize: 12, color: "var(--admin-text-muted)", marginTop: 12 }}>
          Placeholders like {"{companyName}"} or {"{teamCount}"} are filled in automatically, so leave them as they are.
        </p>
      </div>
    </div>
  );
}
