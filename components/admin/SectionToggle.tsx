"use client";

import { useEffect, useState } from "react";
import type { FeatureFlags, SiteSettings } from "@/lib/types";

interface SectionToggleProps {
  feature: keyof FeatureFlags;
  title: string;
  description: string;
}

/** Master switch for an optional site section, saved straight to settings. */
export function SectionToggle({ feature, title, description }: SectionToggleProps) {
  const [settings, setSettings] = useState<SiteSettings | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;
    fetch("/api/settings")
      .then((r) => r.json())
      .then((s: SiteSettings) => !cancelled && setSettings(s))
      .catch(() => !cancelled && setError("Could not load settings."));
    return () => {
      cancelled = true;
    };
  }, []);

  const features: FeatureFlags = { partners: true, clients: true, clientsOnHome: true, portal: true, ...(settings?.features ?? {}) };
  const on = features[feature];

  async function toggle(next: boolean) {
    if (!settings) return;
    setBusy(true);
    setError("");
    try {
      const res = await fetch("/api/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ features: { ...features, [feature]: next } }),
      });
      if (!res.ok) throw new Error();
      setSettings(await res.json());
    } catch {
      setError("Could not save. Try again.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="admin-card" style={{ display: "flex", alignItems: "center", gap: 16, marginBottom: 20 }}>
      <label className="admin-toggle" aria-label={title}>
        <input
          type="checkbox"
          checked={on}
          disabled={!settings || busy}
          onChange={(e) => toggle(e.target.checked)}
        />
        <span className="admin-toggle-slider" />
      </label>
      <div style={{ flex: 1 }}>
        <p style={{ fontSize: 14, fontWeight: 600, color: "var(--admin-text)" }}>
          {title}{" "}
          <span className={`admin-badge ${on ? "admin-badge-green" : "admin-badge-gray"}`}>
            {settings ? (on ? "Visible on site" : "Hidden from site") : "…"}
          </span>
        </p>
        <p style={{ fontSize: 12, color: "var(--admin-text-muted)", marginTop: 2 }}>{description}</p>
        {error && <p style={{ fontSize: 12, color: "#f87171", marginTop: 4 }}>{error}</p>}
      </div>
    </div>
  );
}
