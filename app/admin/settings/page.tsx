"use client";

import { useState, useEffect } from "react";
import {
  Save,
  CheckCircle,
  Globe,
  Share2,
  Activity,
  Sparkles,
  ToggleRight,
  Search,
  MessageCircle,
  Plus,
  Trash2,
  ChevronUp,
  ChevronDown,
  Eye,
  EyeOff,
  AlertCircle,
  Check,
  ExternalLink,
} from "lucide-react";
import type { FeatureFlags, SeoSettings, SiteSettings, WhatsAppConfig, ManagedSocialLink, SocialLinks } from "@/lib/types";
import { DEFAULT_SOCIAL_LINKS, isValidSocialUrl } from "@/lib/socials";
import { getSocialIcon, SOCIAL_ICON_REGISTRY } from "@/components/ui/SocialIcons";

const DEFAULT_FEATURES: FeatureFlags = { partners: true, clients: true, clientsOnHome: true, portal: true };
const DEFAULT_SEO: SeoSettings = { siteUrl: "", title: "", description: "", keywords: [] };

export default function AdminSettingsPage() {
  const [settings, setSettings] = useState<SiteSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);

  // Dynamic social links state
  const [socialLinks, setSocialLinks] = useState<ManagedSocialLink[]>([]);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [newPlatformModal, setNewPlatformModal] = useState(false);
  const [newPlatformKey, setNewPlatformKey] = useState("youtube");
  const [newPlatformLabel, setNewPlatformLabel] = useState("YouTube");
  const [newPlatformUrl, setNewPlatformUrl] = useState("");

  useEffect(() => {
    let cancelled = false;
    fetch("/api/settings")
      .then((res) => res.json())
      .then((data: SiteSettings) => {
        if (cancelled) return;
        setSettings(data);
        // Initialize managed social links
        if (Array.isArray(data.socialLinks) && data.socialLinks.length > 0) {
          setSocialLinks(data.socialLinks);
        } else {
          // Initialize from defaults with any existing legacy URLs mapped
          const legacy = data.socials || {};
          const initialized = DEFAULT_SOCIAL_LINKS.map((def) => {
            const legUrl = (legacy as Record<string, string | undefined>)[def.platform] || "";
            return {
              ...def,
              url: legUrl,
              enabled: true,
            };
          });
          setSocialLinks(initialized);
        }
      })
      .catch((e) => console.error(e))
      .finally(() => !cancelled && setLoading(false));
    return () => {
      cancelled = true;
    };
  }, []);

  function updateField<K extends keyof SiteSettings>(field: K, value: SiteSettings[K]) {
    setSettings((prev) => (prev ? { ...prev, [field]: value } : prev));
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

  // Social Links Handlers
  function updateSocialLink(id: string, patch: Partial<ManagedSocialLink>) {
    setSocialLinks((prev) =>
      prev.map((item) => (item.id === id ? { ...item, ...patch } : item))
    );
  }

  function moveSocialLink(index: number, direction: "up" | "down") {
    setSocialLinks((prev) => {
      const targetIndex = direction === "up" ? index - 1 : index + 1;
      if (targetIndex < 0 || targetIndex >= prev.length) return prev;
      const copy = [...prev];
      const temp = copy[index];
      copy[index] = copy[targetIndex];
      copy[targetIndex] = temp;
      return copy.map((item, idx) => ({ ...item, order: idx + 1 }));
    });
  }

  function toggleSocialEnabled(id: string) {
    setSocialLinks((prev) =>
      prev.map((item) => (item.id === id ? { ...item, enabled: !item.enabled } : item))
    );
  }

  function removeSocialLink(id: string) {
    setSocialLinks((prev) => prev.filter((item) => item.id !== id).map((item, idx) => ({ ...item, order: idx + 1 })));
    setDeleteConfirmId(null);
  }

  function handleAddSocialPlatform() {
    if (!newPlatformLabel.trim()) return;
    const newId = `social-${newPlatformKey}-${Date.now()}`;
    const newLink: ManagedSocialLink = {
      id: newId,
      platform: newPlatformKey,
      label: newPlatformLabel.trim(),
      ariaLabel: `Follow Quanta on ${newPlatformLabel.trim()}`,
      url: newPlatformUrl.trim(),
      icon: newPlatformKey,
      enabled: true,
      order: socialLinks.length + 1,
    };
    setSocialLinks((prev) => [...prev, newLink]);
    setNewPlatformModal(false);
    setNewPlatformUrl("");
    setNewPlatformLabel("YouTube");
    setNewPlatformKey("youtube");
  }

  async function handleSave(e?: React.FormEvent) {
    if (e) e.preventDefault();
    if (!settings) return;
    setSaving(true);

    // Sync legacy socials dictionary from managed links
    const legacySocials: SocialLinks = { ...(settings.socials || {}) };
    socialLinks.forEach((link) => {
      const p = link.platform.toLowerCase();
      if (link.url && (p === "twitter" || p === "instagram" || p === "facebook" || p === "github" || p === "linkedin")) {
        legacySocials[p] = link.url.trim();
      }
    });

    const payload: SiteSettings = {
      ...settings,
      socials: legacySocials,
      socialLinks: socialLinks,
    };

    try {
      const res = await fetch("/api/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (res.ok) {
        setSettings(payload);
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

  // Active links that will actually render in footer
  const activePreviewLinks = socialLinks.filter(
    (l) => l.enabled !== false && isValidSocialUrl(l.url)
  );

  return (
    <div>
      <div className="admin-page-header">
        <div>
          <h1 className="admin-page-title">Website & Studio Settings</h1>
          <p className="admin-page-sub">
            Configure site-wide identity, configurable footer, dynamic social links, availability, and SEO defaults.
          </p>
        </div>
        <button
          className="admin-btn admin-btn-primary"
          onClick={() => handleSave()}
          disabled={saving}
          style={{ minWidth: 140 }}
        >
          {saving ? (
            "Saving..."
          ) : savedSuccess ? (
            <>
              <CheckCircle size={15} /> Saved!
            </>
          ) : (
            <>
              <Save size={15} /> Save Changes
            </>
          )}
        </button>
      </div>

      <div className="admin-content">
        {/* Section 1: General Info */}
        <div className="admin-card">
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 16 }}>
            <Globe size={18} style={{ color: "var(--admin-accent)" }} />
            <h2 style={{ fontSize: 16, fontWeight: 600, color: "var(--admin-text-primary)", margin: 0 }}>
              Studio Identity & Public Contact
            </h2>
          </div>
          <div className="admin-form">
            <div className="admin-form-row">
              <div className="admin-form-group">
                <label className="admin-label">Studio / Brand Name</label>
                <input
                  className="admin-input"
                  value={settings.companyName || ""}
                  onChange={(e) => updateField("companyName", e.target.value)}
                  placeholder="Quanta"
                />
              </div>
              <div className="admin-form-group">
                <label className="admin-label">Public Email</label>
                <input
                  className="admin-input"
                  type="email"
                  value={settings.email || ""}
                  onChange={(e) => updateField("email", e.target.value)}
                  placeholder="hello@quanta.studio"
                />
              </div>
            </div>

            <div className="admin-form-row">
              <div className="admin-form-group">
                <label className="admin-label">Location / Studio Base</label>
                <input
                  className="admin-input"
                  value={settings.location || ""}
                  onChange={(e) => updateField("location", e.target.value)}
                  placeholder="Remote — Worldwide"
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

        {/* Section 2: DYNAMIC SOCIAL MEDIA LINKS (PHASE 5) */}
        <div className="admin-card">
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <Share2 size={18} style={{ color: "var(--admin-accent)" }} />
              <h2 style={{ fontSize: 16, fontWeight: 600, color: "var(--admin-text-primary)", margin: 0 }}>
                Dynamic Social Media & Network Links (Footer)
              </h2>
            </div>
            <button
              type="button"
              className="admin-btn admin-btn-sm admin-btn-ghost"
              onClick={() => setNewPlatformModal(true)}
              style={{ display: "flex", alignItems: "center", gap: 6 }}
            >
              <Plus size={14} /> Add Social Platform
            </button>
          </div>
          <p style={{ fontSize: 13, color: "var(--admin-text-muted)", marginBottom: 16 }}>
            Manage the social platforms shown in the website footer. Links require a valid HTTP/HTTPS protocol.
            Unconfigured or disabled links are automatically omitted from public pages to prevent dead destinations.
          </p>

          {/* Live Footer Preview */}
          <div
            style={{
              padding: "16px 20px",
              background: "var(--admin-bg)",
              border: "1px solid var(--admin-border)",
              borderRadius: "var(--admin-radius)",
              marginBottom: 20,
            }}
          >
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
              <span style={{ fontSize: 11, fontFamily: "ui-monospace, monospace", textTransform: "uppercase", letterSpacing: "0.08em", color: "var(--admin-text-muted)" }}>
                Live Footer Social Preview ({activePreviewLinks.length} active destinations)
              </span>
              <span style={{ fontSize: 11, color: "var(--admin-text-muted)", fontFamily: "ui-monospace, monospace" }}>
                {settings.location || "Remote Worldwide"}
              </span>
            </div>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
              {activePreviewLinks.length > 0 ? (
                activePreviewLinks.map((link) => {
                  const Icon = getSocialIcon(link.icon || link.platform);
                  return (
                    <div
                      key={link.id}
                      style={{
                        display: "inline-flex",
                        alignItems: "center",
                        gap: 8,
                        padding: "6px 12px",
                        fontSize: 12,
                        borderRadius: 8,
                        background: "var(--admin-surface)",
                        border: "1px solid var(--admin-border)",
                        color: "var(--admin-text)",
                      }}
                    >
                      <Icon size={13} />
                      <span>{link.label}</span>
                      <ExternalLink size={10} style={{ opacity: 0.5 }} />
                    </div>
                  );
                })
              ) : (
                <span style={{ fontSize: 12, color: "var(--admin-text-muted)", fontStyle: "italic" }}>
                  No active social links configured. Add or enter destination URLs below to enable.
                </span>
              )}
            </div>
          </div>

          {/* Social Links List */}
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {socialLinks.map((link, idx) => {
              const Icon = getSocialIcon(link.icon || link.platform);
              const isValid = isValidSocialUrl(link.url);
              const isUnconfigured = !link.url || !link.url.trim();

              return (
                <div
                  key={link.id}
                  style={{
                    background: "var(--admin-bg)",
                    border: `1px solid ${
                      !link.enabled
                        ? "rgba(255,255,255,0.04)"
                        : isUnconfigured
                        ? "rgba(245, 158, 11, 0.2)"
                        : "var(--admin-border)"
                    }`,
                    borderRadius: "var(--admin-radius-sm)",
                    padding: "16px",
                    opacity: link.enabled ? 1 : 0.6,
                    transition: "all 0.2s ease",
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      marginBottom: 12,
                      borderBottom: "1px solid var(--admin-border)",
                      paddingBottom: 8,
                    }}
                  >
                    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                      <span
                        style={{
                          fontSize: 11,
                          fontFamily: "ui-monospace, monospace",
                          color: "var(--admin-text-muted)",
                          padding: "2px 6px",
                          background: "var(--admin-surface)",
                          borderRadius: 4,
                        }}
                      >
                        #{idx + 1}
                      </span>
                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          width: 28,
                          height: 28,
                          borderRadius: 6,
                          background: "var(--admin-surface)",
                          color: "var(--admin-accent)",
                        }}
                      >
                        <Icon size={14} />
                      </div>
                      <strong style={{ fontSize: 14, color: "var(--admin-text)" }}>{link.label}</strong>
                      <span style={{ fontSize: 11, color: "var(--admin-text-muted)", textTransform: "capitalize" }}>
                        ({link.platform})
                      </span>

                      {/* Status Badges */}
                      {isUnconfigured ? (
                        <span className="admin-badge admin-badge-yellow" style={{ fontSize: 10 }}>
                          Unconfigured (URL required)
                        </span>
                      ) : !link.enabled ? (
                        <span className="admin-badge admin-badge-gray" style={{ fontSize: 10 }}>
                          Disabled
                        </span>
                      ) : isValid ? (
                        <span className="admin-badge admin-badge-green" style={{ fontSize: 10 }}>
                          Live on Footer
                        </span>
                      ) : (
                        <span className="admin-badge admin-badge-red" style={{ fontSize: 10 }}>
                          Invalid URL Protocol
                        </span>
                      )}
                    </div>

                    {/* Reorder and State Action Controls */}
                    <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                      <button
                        type="button"
                        onClick={() => moveSocialLink(idx, "up")}
                        disabled={idx === 0}
                        className="admin-btn admin-btn-ghost admin-btn-sm"
                        style={{ padding: "4px 8px" }}
                        title="Move Up"
                      >
                        <ChevronUp size={14} />
                      </button>
                      <button
                        type="button"
                        onClick={() => moveSocialLink(idx, "down")}
                        disabled={idx === socialLinks.length - 1}
                        className="admin-btn admin-btn-ghost admin-btn-sm"
                        style={{ padding: "4px 8px" }}
                        title="Move Down"
                      >
                        <ChevronDown size={14} />
                      </button>
                      <button
                        type="button"
                        onClick={() => toggleSocialEnabled(link.id)}
                        className={`admin-btn admin-btn-sm ${link.enabled ? "admin-btn-ghost" : "admin-btn-primary"}`}
                        style={{ padding: "4px 10px", fontSize: 11 }}
                        title={link.enabled ? "Disable link" : "Enable link"}
                      >
                        {link.enabled ? (
                          <>
                            <EyeOff size={12} /> Hide
                          </>
                        ) : (
                          <>
                            <Eye size={12} /> Enable
                          </>
                        )}
                      </button>
                      {deleteConfirmId === link.id ? (
                        <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
                          <button
                            type="button"
                            onClick={() => removeSocialLink(link.id)}
                            className="admin-btn admin-btn-sm"
                            style={{ background: "var(--admin-danger)", color: "#fff", padding: "4px 8px", fontSize: 11 }}
                          >
                            Confirm Delete
                          </button>
                          <button
                            type="button"
                            onClick={() => setDeleteConfirmId(null)}
                            className="admin-btn admin-btn-ghost admin-btn-sm"
                            style={{ padding: "4px 8px", fontSize: 11 }}
                          >
                            Cancel
                          </button>
                        </div>
                      ) : (
                        <button
                          type="button"
                          onClick={() => setDeleteConfirmId(link.id)}
                          className="admin-btn admin-btn-ghost admin-btn-sm"
                          style={{ padding: "4px 8px", color: "var(--admin-danger)" }}
                          title="Remove social link"
                        >
                          <Trash2 size={13} />
                        </button>
                      )}
                    </div>
                  </div>

                  <div className="admin-form-row" style={{ gap: 12 }}>
                    <div className="admin-form-group" style={{ flex: 3 }}>
                      <label className="admin-label" style={{ fontSize: 11 }}>
                        Destination Profile / Page URL
                      </label>
                      <div style={{ position: "relative" }}>
                        <input
                          className="admin-input"
                          style={{
                            paddingRight: 32,
                            borderColor: !isUnconfigured && !isValid ? "var(--admin-danger)" : undefined,
                          }}
                          value={link.url}
                          onChange={(e) => updateSocialLink(link.id, { url: e.target.value })}
                          placeholder={`https://${link.platform}.com/quanta`}
                        />
                        <div
                          style={{
                            position: "absolute",
                            right: 10,
                            top: "50%",
                            transform: "translateY(-50%)",
                            display: "flex",
                            alignItems: "center",
                          }}
                        >
                          {isValid ? (
                            <span title="Valid URL" style={{ display: "inline-flex" }}>
                              <Check size={14} style={{ color: "var(--admin-success)" }} />
                            </span>
                          ) : !isUnconfigured ? (
                            <span title="Must begin with http:// or https://" style={{ display: "inline-flex" }}>
                              <AlertCircle size={14} style={{ color: "var(--admin-danger)" }} />
                            </span>
                          ) : null}
                        </div>
                      </div>
                    </div>

                    <div className="admin-form-group" style={{ flex: 2 }}>
                      <label className="admin-label" style={{ fontSize: 11 }}>
                        Display Name
                      </label>
                      <input
                        className="admin-input"
                        value={link.label}
                        onChange={(e) => updateSocialLink(link.id, { label: e.target.value })}
                        placeholder="Platform label"
                      />
                    </div>

                    <div className="admin-form-group" style={{ flex: 1.5 }}>
                      <label className="admin-label" style={{ fontSize: 11 }}>
                        Controlled Icon
                      </label>
                      <select
                        className="admin-select"
                        value={link.icon || link.platform}
                        onChange={(e) => updateSocialLink(link.id, { icon: e.target.value })}
                      >
                        {Object.keys(SOCIAL_ICON_REGISTRY).map((key) => (
                          <option key={key} value={key}>
                            {key.toUpperCase()}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div style={{ marginTop: 8 }}>
                    <label className="admin-label" style={{ fontSize: 11 }}>
                      Accessible Screen-Reader Label (ARIA)
                    </label>
                    <input
                      className="admin-input"
                      value={link.ariaLabel || ""}
                      onChange={(e) => updateSocialLink(link.id, { ariaLabel: e.target.value })}
                      placeholder={`Follow Quanta on ${link.label}`}
                    />
                  </div>
                </div>
              );
            })}
          </div>

          {/* Modal / Dialog to Add New Platform */}
          {newPlatformModal && (
            <div
              style={{
                position: "fixed",
                inset: 0,
                background: "rgba(0,0,0,0.75)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                zIndex: 1000,
                padding: 20,
              }}
            >
              <div
                style={{
                  background: "var(--admin-surface)",
                  border: "1px solid var(--admin-border)",
                  borderRadius: "var(--admin-radius)",
                  padding: 24,
                  maxWidth: 480,
                  width: "100%",
                }}
              >
                <h3 style={{ fontSize: 16, fontWeight: 600, color: "var(--admin-text)", marginBottom: 12 }}>
                  Add Social Network Platform
                </h3>
                <p style={{ fontSize: 13, color: "var(--admin-text-muted)", marginBottom: 16 }}>
                  Choose a supported platform or configure a custom network link with safe URL validation.
                </p>

                <div className="admin-form">
                  <div className="admin-form-group">
                    <label className="admin-label">Platform Type & Icon</label>
                    <select
                      className="admin-select"
                      value={newPlatformKey}
                      onChange={(e) => {
                        const val = e.target.value;
                        setNewPlatformKey(val);
                        const presets: Record<string, string> = {
                          youtube: "YouTube",
                          discord: "Discord",
                          dribbble: "Dribbble",
                          threads: "Threads",
                          globe: "Website",
                          twitter: "X (Twitter)",
                          github: "GitHub",
                          linkedin: "LinkedIn",
                          instagram: "Instagram",
                          facebook: "Facebook",
                        };
                        setNewPlatformLabel(presets[val] || val);
                      }}
                    >
                      <option value="youtube">YouTube</option>
                      <option value="discord">Discord</option>
                      <option value="dribbble">Dribbble</option>
                      <option value="threads">Threads</option>
                      <option value="globe">Custom Website / Portfolio</option>
                      <option value="twitter">X / Twitter</option>
                      <option value="github">GitHub</option>
                      <option value="linkedin">LinkedIn</option>
                      <option value="instagram">Instagram</option>
                      <option value="facebook">Facebook</option>
                    </select>
                  </div>

                  <div className="admin-form-group">
                    <label className="admin-label">Display Name</label>
                    <input
                      className="admin-input"
                      value={newPlatformLabel}
                      onChange={(e) => setNewPlatformLabel(e.target.value)}
                      placeholder="e.g. YouTube"
                    />
                  </div>

                  <div className="admin-form-group">
                    <label className="admin-label">Destination Profile URL (optional now, or configure later)</label>
                    <input
                      className="admin-input"
                      value={newPlatformUrl}
                      onChange={(e) => setNewPlatformUrl(e.target.value)}
                      placeholder="https://youtube.com/@quanta"
                    />
                  </div>

                  <div style={{ display: "flex", justifyContent: "flex-end", gap: 10, marginTop: 20 }}>
                    <button
                      type="button"
                      className="admin-btn admin-btn-ghost"
                      onClick={() => setNewPlatformModal(false)}
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      className="admin-btn admin-btn-primary"
                      onClick={handleAddSocialPlatform}
                    >
                      Add Platform
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Section 3: Optional Sections */}
        <div className="admin-card">
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 8 }}>
            <ToggleRight size={18} style={{ color: "var(--admin-accent)" }} />
            <h2 style={{ fontSize: 16, fontWeight: 600, color: "var(--admin-text-primary)", margin: 0 }}>
              Optional Sections Visibility
            </h2>
          </div>
          <p style={{ fontSize: 13, color: "var(--admin-text-muted)", marginBottom: 16 }}>
            Toggle sections on or off. A switched-off section is completely omitted from pages, navigation search, and the footer.
          </p>
          <div className="admin-form">
            {([
              ["partners", "Partners Section", "The Partners block on the People page."],
              ["clients", "Clients Wall", "The 'closely working with' client logos on the homepage and people page."],
              ["portal", "Client Portal", "Client sign-in, project dashboard, deliverables approval, and verified review unlock."],
            ] as const).map(([key, label, hint]) => (
              <label key={key} style={{ display: "flex", alignItems: "center", gap: 12, fontSize: 13, color: "var(--admin-text-secondary)", cursor: "pointer" }}>
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

        {/* Section 4: SEO & Metadata */}
        <div className="admin-card">
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 16 }}>
            <Search size={18} style={{ color: "var(--admin-accent)" }} />
            <h2 style={{ fontSize: 16, fontWeight: 600, color: "var(--admin-text-primary)", margin: 0 }}>
              Search Engine & Metadata Defaults
            </h2>
          </div>
          <div className="admin-form">
            <div className="admin-form-row">
              <div className="admin-form-group">
                <label className="admin-label">Canonical Site URL</label>
                <input
                  className="admin-input"
                  value={settings.seo?.siteUrl || ""}
                  onChange={(e) => updateSeo("siteUrl", e.target.value)}
                  placeholder="https://quanta.studio"
                />
              </div>
              <div className="admin-form-group">
                <label className="admin-label">Studio Timezone (Live Clock)</label>
                <input
                  className="admin-input"
                  value={settings.timezone || ""}
                  onChange={(e) => updateField("timezone", e.target.value)}
                  placeholder="Asia/Karachi"
                />
              </div>
            </div>
            <div className="admin-form-group">
              <label className="admin-label">Default Browser Title</label>
              <input
                className="admin-input"
                value={settings.seo?.title || ""}
                onChange={(e) => updateSeo("title", e.target.value)}
              />
            </div>
            <div className="admin-form-group">
              <label className="admin-label">Default Meta Description</label>
              <textarea
                className="admin-textarea"
                rows={2}
                value={settings.seo?.description || ""}
                onChange={(e) => updateSeo("description", e.target.value)}
              />
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

        {/* Section 5: WhatsApp Contact Widget */}
        <div className="admin-card">
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 8 }}>
            <MessageCircle size={18} style={{ color: "var(--admin-accent)" }} />
            <h2 style={{ fontSize: 16, fontWeight: 600, color: "var(--admin-text-primary)", margin: 0 }}>
              WhatsApp Direct Contact Widget
            </h2>
          </div>
          <p style={{ fontSize: 13, color: "var(--admin-text-muted)", marginBottom: 16 }}>
            A persistent WhatsApp contact trigger on public pages with mobile safe-area insets.
            Enter the number in international format without &quot;+&quot; (e.g. 923001234567).
          </p>
          <div className="admin-form">
            <div style={{ marginBottom: 16 }}>
              <label style={{ display: "inline-flex", alignItems: "center", gap: 10, fontSize: 14, fontWeight: 500, color: "var(--admin-text-primary)", cursor: "pointer" }}>
                <span className="admin-toggle">
                  <input
                    type="checkbox"
                    checked={!!settings.whatsapp?.visible}
                    onChange={(e) => updateWhatsApp("visible", e.target.checked)}
                  />
                  <span className="admin-toggle-slider" />
                </span>
                Show WhatsApp button on public pages
              </label>
            </div>
            <div className="admin-form-row">
              <div className="admin-form-group">
                <label className="admin-label">WhatsApp Number</label>
                <input
                  className="admin-input"
                  value={settings.whatsapp?.number || ""}
                  onChange={(e) => updateWhatsApp("number", e.target.value)}
                  placeholder="923001234567"
                />
              </div>
            </div>
            <div className="admin-form-group">
              <label className="admin-label">Pre-filled Message</label>
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

        {/* Section 6: Studio Availability Indicator */}
        <div className="admin-card">
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 8 }}>
            <Activity size={18} style={{ color: "var(--admin-accent)" }} />
            <h2 style={{ fontSize: 16, fontWeight: 600, color: "var(--admin-text-primary)", margin: 0 }}>
              Live Availability Status Indicator
            </h2>
          </div>
          <p style={{ fontSize: 13, color: "var(--admin-text-muted)", marginBottom: 16 }}>
            Display an authentic live capacity status on the homepage, navigation bar, and footer.
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
                <span className="admin-toggle">
                  <input
                    type="checkbox"
                    checked={!!settings.availability?.enabled}
                    onChange={(e) => updateAvailability("enabled", e.target.checked)}
                  />
                  <span className="admin-toggle-slider" />
                </span>
                Show Availability Indicator on Website
              </label>
            </div>

            <div className="admin-form-row">
              <div className="admin-form-group" style={{ flex: 2 }}>
                <label className="admin-label">Capacity Message</label>
                <input
                  className="admin-input"
                  value={settings.availability?.message || ""}
                  onChange={(e) => updateAvailability("message", e.target.value)}
                  placeholder="e.g. Accepting Q2/Q3 2026 digital projects."
                />
              </div>
              <div className="admin-form-group" style={{ flex: 1 }}>
                <label className="admin-label">Indicator Dot Color</label>
                <select
                  className="admin-select"
                  value={settings.availability?.badge_color || "green"}
                  onChange={(e) => updateAvailability("badge_color", e.target.value)}
                >
                  <option value="green">Active Capacity (Green)</option>
                  <option value="amber">Limited Slots (Amber)</option>
                  <option value="purple">Private Invite Only (Purple)</option>
                  <option value="red">Booked Out (Red)</option>
                </select>
              </div>
            </div>
          </div>
        </div>

        {/* Section 7: Key Numbers & Stats */}
        <div className="admin-card">
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 8 }}>
            <Sparkles size={18} style={{ color: "var(--admin-accent)" }} />
            <h2 style={{ fontSize: 16, fontWeight: 600, color: "var(--admin-text-primary)", margin: 0 }}>
              Studio Highlights & Statistics
            </h2>
          </div>
          <p style={{ fontSize: 13, color: "var(--admin-text-muted)", marginBottom: 16 }}>
            Accurate studio metrics displayed across the About and Home pages.
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
                    Stat #{i + 1} Value
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
                    Metric Label
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
