"use client";

import { useState, useEffect } from "react";
import { Save, CheckCircle, Globe, Share2, Activity, BarChart3, Sparkles, ToggleRight, Search, MessageCircle } from "lucide-react";
import type { FeatureFlags, SeoSettings, SiteSettings, WhatsAppConfig } from "@/lib/types";

const DEFAULT_FEATURES: FeatureFlags = { partners: true, clients: true, clientsOnHome: true, portal: true };
const DEFAULT_SEO: SeoSettings = { siteUrl: "", title: "", description: "", keywords: [] };

export default function AdminSettingsPage() {
  const [settings, setSettings] = useState<SiteSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);

  useEffect(() => {
    let cancelled = false;
    fetch("/api/settings")
      .then((res) => res.json())
      .then((data) => !cancelled && setSettings(data))
      .catch((e) => console.error(e))
      .finally(() => !cancelled && setLoading(false));
    return () => {
      cancelled = true;
    };
  }, []);

  function updateField<K extends keyof SiteSettings>(field: K, value: SiteSettings[K]) {
    setSettings((prev) => (prev ? { ...prev, [field]: value } : prev));
  }

  function updateSocial(network: keyof SiteSettings["socials"], value: string) {
    setSettings((prev) => {
      if (!prev) return prev;
      return {
        ...prev,
        socials: {
          ...prev.socials,
          [network]: value,
        },
      };
    });
  }

  function updateAvailability<K extends keyof SiteSettings["availability"]>(
    key: K,
    value: SiteSettings["availability"][K]
  ) {
    setSettings((prev) => {
      if (!prev) return prev;
      return {
        ...prev,
        availability: {
          ...prev.availability,
          [key]: value,
        },
      };
    });
  }

  function updateFeature(key: keyof FeatureFlags, value: boolean) {
    setSettings((prev) =>
      prev ? { ...prev, features: { ...DEFAULT_FEATURES, ...prev.features, [key]: value } } : prev
    );
  }

  function updateSeo<K extends keyof SeoSettings>(key: K, value: SeoSettings[K]) {
    setSettings((prev) =>
      prev ? { ...prev, seo: { ...DEFAULT_SEO, ...prev.seo, [key]: value } } : prev
    );
  }

  function updateWhatsApp<K extends keyof WhatsAppConfig>(key: K, value: WhatsAppConfig[K]) {
    setSettings((prev) => {
      if (!prev) return prev;
      const current: WhatsAppConfig = prev.whatsapp ?? { number: "", message: "", visible: false };
      return { ...prev, whatsapp: { ...current, [key]: value } };
    });
  }

  function updateStat(index: number, key: "number" | "label", value: string) {
    setSettings((prev) => {
      if (!prev) return prev;
      const stats = [...(prev.stats || [])];
      stats[index] = { ...stats[index], [key]: value };
      return { ...prev, stats };
    });
  }

  async function handleSave(e?: React.FormEvent) {
    if (e) e.preventDefault();
    if (!settings) return;
    setSaving(true);
    try {
      const res = await fetch("/api/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(settings),
      });
      if (res.ok) {
        setSavedSuccess(true);
        setTimeout(() => setSavedSuccess(false), 3000);
      }
    } catch (err) {
      console.error("Save error:", err);
    } finally {
      setSaving(false);
    }
  }

  if (loading || !settings) {
    return (
      <div style={{ padding: 40, color: "var(--admin-text-muted)", textAlign: "center" }}>
        Loading settings...
      </div>
    );
  }

  return (
    <div>
      <div className="admin-page-header">
        <div>
          <h1 className="admin-page-title">Global Settings</h1>
          <p className="admin-page-sub">
            Configure site-wide metadata, social links, availability status, and third-party integrations.
          </p>
        </div>
        <button
          className="admin-btn admin-btn-primary"
          onClick={() => handleSave()}
          disabled={saving}
          style={{ minWidth: 120 }}
        >
          {savedSuccess ? (
            <>
              <CheckCircle size={15} style={{ color: "#4ade80" }} /> Saved!
            </>
          ) : saving ? (
            "Saving..."
          ) : (
            <>
              <Save size={15} /> Save Changes
            </>
          )}
        </button>
      </div>

      <div className="admin-content" style={{ display: "flex", flexDirection: "column", gap: 24 }}>
        {/* Section 1: Company Profile */}
        <div className="admin-card">
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 16 }}>
            <Globe size={18} style={{ color: "var(--admin-accent)" }} />
            <h2 style={{ fontSize: 16, fontWeight: 600, color: "var(--admin-text-primary)", margin: 0 }}>
              Company & Brand Information
            </h2>
          </div>
          <div className="admin-form">
            <div className="admin-form-row">
              <div className="admin-form-group">
                <label className="admin-label">Company Name</label>
                <input
                  className="admin-input"
                  value={settings.companyName || ""}
                  onChange={(e) => updateField("companyName", e.target.value)}
                />
              </div>
              <div className="admin-form-group">
                <label className="admin-label">Public Email</label>
                <input
                  className="admin-input"
                  type="email"
                  value={settings.email || ""}
                  onChange={(e) => updateField("email", e.target.value)}
                />
              </div>
            </div>

            <div className="admin-form-row">
              <div className="admin-form-group">
                <label className="admin-label">Location / Work Style</label>
                <input
                  className="admin-input"
                  value={settings.location || ""}
                  onChange={(e) => updateField("location", e.target.value)}
                  placeholder="e.g. Remote — Worldwide"
                />
              </div>
              <div className="admin-form-group">
                <label className="admin-label">Phone (Optional)</label>
                <input
                  className="admin-input"
                  value={settings.phone || ""}
                  onChange={(e) => updateField("phone", e.target.value)}
                  placeholder="+1 (555) 000-0000"
                />
              </div>
            </div>

            <div className="admin-form-group">
              <label className="admin-label">Tagline & Hero Subtitle</label>
              <textarea
                className="admin-textarea"
                rows={2}
                value={settings.tagline || ""}
                onChange={(e) => updateField("tagline", e.target.value)}
              />
            </div>
          </div>
        </div>

        {/* Optional sections */}
        <div className="admin-card">
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 8 }}>
            <ToggleRight size={18} style={{ color: "var(--admin-accent)" }} />
            <h2 style={{ fontSize: 16, fontWeight: 600, color: "var(--admin-text-primary)", margin: 0 }}>
              Optional sections
            </h2>
          </div>
          <p style={{ fontSize: 13, color: "var(--admin-text-muted)", marginBottom: 16 }}>
            Turn whole sections on or off. A switched-off section disappears from the page, the menu, search and the footer.
          </p>
          <div className="admin-form">
            {([
              ["partners", "Partners", "The Partners block on the People page."],
              ["clients", "Clients wall", "The “closely working with” client logos on the homepage."],
              ["portal", "Client portal", "Client sign-in and the live project dashboard."],
            ] as const).map(([key, label, hint]) => (
              <label key={key} style={{ display: "flex", alignItems: "center", gap: 12, fontSize: 13, color: "var(--admin-text-secondary)" }}>
                <span className="admin-toggle">
                  <input
                    type="checkbox"
                    checked={settings.features?.[key] ?? true}
                    onChange={(e) => updateFeature(key, e.target.checked)}
                  />
                  <span className="admin-toggle-slider" />
                </span>
                <span>
                  <strong style={{ color: "var(--admin-text)" }}>{label}</strong>
                  <br />
                  <span style={{ fontSize: 12, color: "var(--admin-text-muted)" }}>{hint}</span>
                </span>
              </label>
            ))}
          </div>
        </div>

        {/* SEO */}
        <div className="admin-card">
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 16 }}>
            <Search size={18} style={{ color: "var(--admin-accent)" }} />
            <h2 style={{ fontSize: 16, fontWeight: 600, color: "var(--admin-text-primary)", margin: 0 }}>
              Search & sharing
            </h2>
          </div>
          <div className="admin-form">
            <div className="admin-form-row">
              <div className="admin-form-group">
                <label className="admin-label">Site URL</label>
                <input className="admin-input" value={settings.seo?.siteUrl || ""} onChange={(e) => updateSeo("siteUrl", e.target.value)} placeholder="https://yourdomain.com" />
              </div>
              <div className="admin-form-group">
                <label className="admin-label">Studio time zone</label>
                <input className="admin-input" value={settings.timezone || ""} onChange={(e) => updateField("timezone", e.target.value)} placeholder="Asia/Karachi" />
              </div>
            </div>
            <div className="admin-form-group">
              <label className="admin-label">Browser title</label>
              <input className="admin-input" value={settings.seo?.title || ""} onChange={(e) => updateSeo("title", e.target.value)} />
            </div>
            <div className="admin-form-group">
              <label className="admin-label">Description</label>
              <textarea className="admin-textarea" rows={2} value={settings.seo?.description || ""} onChange={(e) => updateSeo("description", e.target.value)} />
            </div>
            <div className="admin-form-group">
              <label className="admin-label">Keywords (comma separated)</label>
              <input
                className="admin-input"
                value={(settings.seo?.keywords || []).join(", ")}
                onChange={(e) => updateSeo("keywords", e.target.value.split(",").map((k) => k.trimStart()))}
              />
            </div>
          </div>
        </div>

        {/* Section 2: Social Media Links */}
        <div className="admin-card">
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 8 }}>
            <Share2 size={18} style={{ color: "var(--admin-accent)" }} />
            <h2 style={{ fontSize: 16, fontWeight: 600, color: "var(--admin-text-primary)", margin: 0 }}>
              Social Media Links
            </h2>
          </div>
          <p style={{ fontSize: 13, color: "var(--admin-text-muted)", marginBottom: 16 }}>
            These links appear in the navigation bar, footer, and team profile cards. Leave blank to hide the icon.
          </p>

          <div className="admin-form">
            <div className="admin-form-row">
              <div className="admin-form-group">
                <label className="admin-label">Instagram Profile URL</label>
                <input
                  className="admin-input"
                  value={settings.socials?.instagram || ""}
                  onChange={(e) => updateSocial("instagram", e.target.value)}
                  placeholder="https://instagram.com/quanta"
                />
              </div>
              <div className="admin-form-group">
                <label className="admin-label">Facebook Page URL</label>
                <input
                  className="admin-input"
                  value={settings.socials?.facebook || ""}
                  onChange={(e) => updateSocial("facebook", e.target.value)}
                  placeholder="https://facebook.com/quanta"
                />
              </div>
            </div>

            <div className="admin-form-row">
              <div className="admin-form-group">
                <label className="admin-label">Twitter / X URL</label>
                <input
                  className="admin-input"
                  value={settings.socials?.twitter || ""}
                  onChange={(e) => updateSocial("twitter", e.target.value)}
                  placeholder="https://x.com/quanta_studio"
                />
              </div>
              <div className="admin-form-group">
                <label className="admin-label">GitHub Organization URL</label>
                <input
                  className="admin-input"
                  value={settings.socials?.github || ""}
                  onChange={(e) => updateSocial("github", e.target.value)}
                  placeholder="https://github.com/quanta-studio"
                />
              </div>
            </div>

            <div className="admin-form-group">
              <label className="admin-label">LinkedIn Company Page URL</label>
              <input
                className="admin-input"
                value={settings.socials?.linkedin || ""}
                onChange={(e) => updateSocial("linkedin", e.target.value)}
                placeholder="https://linkedin.com/company/quanta-studio"
              />
            </div>
          </div>
        </div>

        {/* Section: WhatsApp Contact Button */}
        <div className="admin-card">
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 8 }}>
            <MessageCircle size={18} style={{ color: "var(--admin-accent)" }} />
            <h2 style={{ fontSize: 16, fontWeight: 600, color: "var(--admin-text-primary)", margin: 0 }}>
              WhatsApp Contact Button
            </h2>
          </div>
          <p style={{ fontSize: 13, color: "var(--admin-text-muted)", marginBottom: 16 }}>
            A floating WhatsApp button appears on every public page. Leave the number blank or disable to hide it.
            Enter the number in international format without the &quot;+&quot; sign (e.g. 923001234567).
          </p>
          <div className="admin-form">
            <div style={{ marginBottom: 16 }}>
              <label style={{ display: "inline-flex", alignItems: "center", gap: 10, fontSize: 14, fontWeight: 500, color: "var(--admin-text-primary)", cursor: "pointer" }}>
                <label className="admin-toggle">
                  <input
                    type="checkbox"
                    checked={!!settings.whatsapp?.visible}
                    onChange={(e) => updateWhatsApp("visible", e.target.checked)}
                  />
                  <span className="admin-toggle-slider" />
                </label>
                Show WhatsApp button on the website
              </label>
            </div>
            <div className="admin-form-row">
              <div className="admin-form-group">
                <label className="admin-label">WhatsApp Number (international format, no &quot;+&quot;)</label>
                <input
                  className="admin-input"
                  value={settings.whatsapp?.number || ""}
                  onChange={(e) => updateWhatsApp("number", e.target.value)}
                  placeholder="923001234567"
                />
              </div>
            </div>
            <div className="admin-form-group">
              <label className="admin-label">Pre-filled Message (optional)</label>
              <textarea
                className="admin-textarea"
                rows={2}
                value={settings.whatsapp?.message || ""}
                onChange={(e) => updateWhatsApp("message", e.target.value)}
                placeholder="Hi! I'd like to get in touch with your team."
              />
            </div>
          </div>
        </div>

        {/* Section 3: Availability Badge */}
        <div className="admin-card">
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 8 }}>
            <Activity size={18} style={{ color: "var(--admin-accent)" }} />
            <h2 style={{ fontSize: 16, fontWeight: 600, color: "var(--admin-text-primary)", margin: 0 }}>
              Live Availability Status Badge
            </h2>
          </div>
          <p style={{ fontSize: 13, color: "var(--admin-text-muted)", marginBottom: 16 }}>
            Display a live indicator on the homepage and navigation showing current studio project capacity.
          </p>

          <div className="admin-form">
            <div style={{ marginBottom: 16 }}>
              <label
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 10,
                  fontSize: 14,
                  fontWeight: 500,
                  color: "var(--admin-text-primary)",
                  cursor: "pointer",
                }}
              >
                <label className="admin-toggle">
                  <input
                    type="checkbox"
                    checked={!!settings.availability?.enabled}
                    onChange={(e) => updateAvailability("enabled", e.target.checked)}
                  />
                  <span className="admin-toggle-slider" />
                </label>
                Show Availability Indicator on Website
              </label>
            </div>

            <div className="admin-form-row">
              <div className="admin-form-group" style={{ flex: 2 }}>
                <label className="admin-label">Status Message</label>
                <input
                  className="admin-input"
                  value={settings.availability?.message || ""}
                  onChange={(e) => updateAvailability("message", e.target.value)}
                  placeholder="e.g. We have 2 project slots open for Q1 2027."
                />
              </div>
              <div className="admin-form-group" style={{ flex: 1 }}>
                <label className="admin-label">Indicator Dot Color</label>
                <select
                  className="admin-select"
                  value={settings.availability?.badge_color || "green"}
                  onChange={(e) => updateAvailability("badge_color", e.target.value)}
                >
                  <option value="green">Active / Open (Green)</option>
                  <option value="amber">Limited Capacity (Amber/Yellow)</option>
                  <option value="purple">Special Invite Only (Purple)</option>
                  <option value="red">Booked Out (Red)</option>
                </select>
              </div>
            </div>
          </div>
        </div>

        {/* Section 4: Analytics & Integrations */}
        <div className="admin-card">
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 8 }}>
            <BarChart3 size={18} style={{ color: "var(--admin-accent)" }} />
            <h2 style={{ fontSize: 16, fontWeight: 600, color: "var(--admin-text-primary)", margin: 0 }}>
              Analytics & Developer Endpoints
            </h2>
          </div>
          <p style={{ fontSize: 13, color: "var(--admin-text-muted)", marginBottom: 16 }}>
            Set up tracking and hook up backend API endpoints.
          </p>

          <div className="admin-form">
            <div className="admin-form-row">
              <div className="admin-form-group">
                <label className="admin-label">Google Analytics 4 Measurement ID</label>
                <input
                  className="admin-input"
                  value={settings.analytics?.ga4_measurement_id || ""}
                  onChange={(e) =>
                    setSettings((prev) =>
                      prev
                        ? {
                            ...prev,
                            analytics: {
                              ...prev.analytics,
                              ga4_measurement_id: e.target.value,
                            },
                          }
                        : prev
                    )
                  }
                  placeholder="G-XXXXXXXXXX (leaves GA disabled if empty)"
                />
              </div>

              <div className="admin-form-group">
                <label className="admin-label">Custom Contact Webhook / Endpoint (Optional)</label>
                <input
                  className="admin-input"
                  value={settings.contact_api_endpoint || ""}
                  onChange={(e) => updateField("contact_api_endpoint", e.target.value)}
                  placeholder="https://api.yourbackend.com/v1/inquiries"
                />
              </div>
            </div>

            <div className="admin-form-group">
              <label className="admin-label">Open Graph Social Preview Image Path</label>
              <input
                className="admin-input"
                value={settings.og_image || "/og-image.png"}
                onChange={(e) => updateField("og_image", e.target.value)}
                placeholder="/og-image.png or full URL"
              />
            </div>
          </div>
        </div>

        {/* Section 5: Key Stats */}
        <div className="admin-card">
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 8 }}>
            <Sparkles size={18} style={{ color: "var(--admin-accent)" }} />
            <h2 style={{ fontSize: 16, fontWeight: 600, color: "var(--admin-text-primary)", margin: 0 }}>
              Studio Highlights & Stats (About Page & Homepage)
            </h2>
          </div>
          <p style={{ fontSize: 13, color: "var(--admin-text-muted)", marginBottom: 16 }}>
            Key numbers shown on the About and Home pages.
          </p>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 16 }}>
            {(settings.stats || []).map((stat, i) => (
              <div
                key={i}
                style={{
                  background: "var(--admin-bg)",
                  border: "1px solid var(--admin-border)",
                  borderRadius: "var(--admin-radius-sm)",
                  padding: 12,
                }}
              >
                <div style={{ marginBottom: 8 }}>
                  <label className="admin-label" style={{ fontSize: 11 }}>
                    Stat #{i + 1} Number / Value
                  </label>
                  <input
                    className="admin-input"
                    value={stat.number}
                    onChange={(e) => updateStat(i, "number", e.target.value)}
                    placeholder="e.g. 5"
                  />
                </div>
                <div>
                  <label className="admin-label" style={{ fontSize: 11 }}>
                    Label
                  </label>
                  <input
                    className="admin-input"
                    value={stat.label}
                    onChange={(e) => updateStat(i, "label", e.target.value)}
                    placeholder="e.g. Team Members"
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
