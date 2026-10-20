"use client";

import { useState, useEffect } from "react";
import { Plus, Pencil, Trash2, X, GripVertical } from "lucide-react";
import type { TeamMember, SocialLinks } from "@/lib/types";

const SOCIAL_PLATFORMS: (keyof SocialLinks)[] = ["linkedin", "twitter", "github", "instagram", "facebook"];

const emptyMember = (): Partial<TeamMember> => ({
  name: "", role: "", initials: "", shortBio: "", expertise: [], image: "",
  socialLinks: { linkedin: "", twitter: "", github: "", instagram: "", facebook: "" },
});

export default function AdminTeamPage() {
  const [members, setMembers] = useState<TeamMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState<{ open: boolean; member: Partial<TeamMember>; isNew: boolean }>({
    open: false, member: emptyMember(), isNew: true,
  });
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [expertiseInput, setExpertiseInput] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => { fetchMembers(); }, []);

  async function fetchMembers() {
    setLoading(true);
    const res = await fetch("/api/team");
    const data = await res.json();
    setMembers(data);
    setLoading(false);
  }

  function openAdd() {
    setModal({ open: true, member: emptyMember(), isNew: true });
    setExpertiseInput("");
  }

  function openEdit(m: TeamMember) {
    setModal({ open: true, member: { ...m, expertise: [...m.expertise], socialLinks: { ...m.socialLinks } }, isNew: false });
    setExpertiseInput("");
  }

  function closeModal() { setModal({ open: false, member: emptyMember(), isNew: true }); }

  function updateField(field: string, value: unknown) {
    setModal((prev) => ({ ...prev, member: { ...prev.member, [field]: value } }));
  }

  function updateSocial(platform: keyof SocialLinks, value: string) {
    setModal((prev) => ({
      ...prev,
      member: { ...prev.member, socialLinks: { ...prev.member.socialLinks, [platform]: value } },
    }));
  }

  function addExpertise() {
    if (!expertiseInput.trim()) return;
    const current = modal.member.expertise || [];
    updateField("expertise", [...current, expertiseInput.trim()]);
    setExpertiseInput("");
  }

  function removeExpertise(tag: string) {
    updateField("expertise", (modal.member.expertise || []).filter((e) => e !== tag));
  }

  async function saveMember() {
    setSaving(true);
    const { isNew, member } = modal;
    const initials = member.name
      ? member.name.split(" ").map((w) => w[0]).join("").toUpperCase().slice(0, 2)
      : member.initials;
    const payload = { ...member, initials };

    if (isNew) {
      await fetch("/api/team", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) });
    } else {
      await fetch(`/api/team/${member.id}`, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) });
    }
    await fetchMembers();
    closeModal();
    setSaving(false);
  }

  async function deleteMember(id: string) {
    await fetch(`/api/team/${id}`, { method: "DELETE" });
    setDeleteId(null);
    fetchMembers();
  }

  return (
    <div>
      <div className="admin-page-header">
        <div>
          <h1 className="admin-page-title">Team</h1>
          <p className="admin-page-sub">Manage your team members, roles, bios, and social links.</p>
        </div>
        <button className="admin-btn admin-btn-primary" onClick={openAdd}>
          <Plus size={15} /> Add Member
        </button>
      </div>

      <div className="admin-content">
        <div className="admin-table-wrap">
          <table className="admin-table">
            <thead>
              <tr>
                <th>#</th><th>Name</th><th>Role</th><th>Expertise</th><th>Socials</th><th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={6} style={{ textAlign: "center", padding: "30px", color: "var(--admin-text-muted)" }}>Loading...</td></tr>
              ) : members.length === 0 ? (
                <tr><td colSpan={6} style={{ textAlign: "center", padding: "30px", color: "var(--admin-text-muted)" }}>No members yet. Add your first team member.</td></tr>
              ) : members.map((m) => (
                <tr key={m.id}>
                  <td><GripVertical size={14} style={{ color: "var(--admin-text-muted)", cursor: "grab" }} /></td>
                  <td>
                    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                      <div style={{ width: 34, height: 34, borderRadius: 6, background: "var(--admin-accent-subtle)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12, fontWeight: 700, color: "var(--admin-accent)", flexShrink: 0 }}>
                        {m.initials}
                      </div>
                      <span className="td-primary">{m.name}</span>
                    </div>
                  </td>
                  <td>{m.role}</td>
                  <td>
                    <div style={{ display: "flex", flexWrap: "wrap", gap: 4 }}>
                      {m.expertise.slice(0, 3).map((e) => (
                        <span key={e} className="admin-badge admin-badge-purple">{e}</span>
                      ))}
                      {m.expertise.length > 3 && <span className="admin-badge admin-badge-gray">+{m.expertise.length - 3}</span>}
                    </div>
                  </td>
                  <td>
                    <div style={{ display: "flex", gap: 6 }}>
                      {SOCIAL_PLATFORMS.map((p) => m.socialLinks?.[p] ? (
                        <span key={p} className="admin-badge admin-badge-green" style={{ textTransform: "capitalize" }}>{p.slice(0, 2)}</span>
                      ) : null)}
                      {!SOCIAL_PLATFORMS.some((p) => m.socialLinks?.[p]) && <span style={{ color: "var(--admin-text-muted)", fontSize: 12 }}>None set</span>}
                    </div>
                  </td>
                  <td>
                    <div className="admin-actions">
                      <button className="admin-btn admin-btn-ghost admin-btn-icon" onClick={() => openEdit(m)} title="Edit"><Pencil size={13} /></button>
                      <button className="admin-btn admin-btn-danger admin-btn-icon" onClick={() => setDeleteId(m.id)} title="Delete"><Trash2 size={13} /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add/Edit Modal */}
      {modal.open && (
        <div className="admin-modal-overlay" onClick={closeModal}>
          <div className="admin-modal" onClick={(e) => e.stopPropagation()}>
            <div className="admin-modal-header">
              <h2 className="admin-modal-title">{modal.isNew ? "Add Team Member" : "Edit Team Member"}</h2>
              <button className="admin-btn admin-btn-ghost admin-btn-icon" onClick={closeModal}><X size={15} /></button>
            </div>
            <div className="admin-modal-body">
              <div className="admin-form">
                <div className="admin-form-row">
                  <div className="admin-form-group">
                    <label className="admin-label">Full Name *</label>
                    <input className="admin-input" value={modal.member.name || ""} onChange={(e) => updateField("name", e.target.value)} placeholder="e.g. Taha Shah" />
                  </div>
                  <div className="admin-form-group">
                    <label className="admin-label">Role / Title *</label>
                    <input className="admin-input" value={modal.member.role || ""} onChange={(e) => updateField("role", e.target.value)} placeholder="e.g. Frontend Developer" />
                  </div>
                </div>
                <div className="admin-form-group">
                  <label className="admin-label">Short Bio</label>
                  <textarea className="admin-textarea" value={modal.member.shortBio || ""} onChange={(e) => updateField("shortBio", e.target.value)} placeholder="A one to two sentence bio..." rows={3} />
                </div>
                <div className="admin-form-group">
                  <label className="admin-label">Profile Image URL</label>
                  <input className="admin-input" value={modal.member.image || ""} onChange={(e) => updateField("image", e.target.value)} placeholder="/team/taha.jpg or https://..." />
                </div>
                <div className="admin-form-group">
                  <label className="admin-label">Expertise Tags</label>
                  <div style={{ display: "flex", gap: 8 }}>
                    <input className="admin-input" value={expertiseInput} onChange={(e) => setExpertiseInput(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); addExpertise(); }}} placeholder="Type a skill and press Enter" />
                    <button className="admin-btn admin-btn-ghost admin-btn-sm" onClick={addExpertise} type="button">Add</button>
                  </div>
                  <div className="admin-tags">
                    {(modal.member.expertise || []).map((tag) => (
                      <span key={tag} className="admin-tag">{tag} <span className="admin-tag-remove" onClick={() => removeExpertise(tag)}>×</span></span>
                    ))}
                  </div>
                </div>

                <div>
                  <p className="admin-section-heading">Social Links</p>
                  <div style={{ display: "flex", flexDirection: "column", gap: 10, marginTop: 12 }}>
                    {SOCIAL_PLATFORMS.map((platform) => (
                      <div key={platform} className="admin-form-group">
                        <label className="admin-label" style={{ textTransform: "capitalize" }}>{platform}</label>
                        <input className="admin-input" value={modal.member.socialLinks?.[platform] || ""} onChange={(e) => updateSocial(platform, e.target.value)} placeholder={`https://${platform}.com/username`} />
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
            <div className="admin-modal-footer">
              <button className="admin-btn admin-btn-ghost" onClick={closeModal}>Cancel</button>
              <button className="admin-btn admin-btn-primary" onClick={saveMember} disabled={saving}>
                {saving ? "Saving..." : modal.isNew ? "Add Member" : "Save Changes"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirm */}
      {deleteId && (
        <div className="admin-modal-overlay" onClick={() => setDeleteId(null)}>
          <div className="admin-modal" style={{ maxWidth: 400 }} onClick={(e) => e.stopPropagation()}>
            <div className="admin-modal-header">
              <h2 className="admin-modal-title">Delete Member</h2>
              <button className="admin-btn admin-btn-ghost admin-btn-icon" onClick={() => setDeleteId(null)}><X size={15} /></button>
            </div>
            <div className="admin-modal-body admin-confirm">
              <p>Are you sure you want to remove this team member? This cannot be undone.</p>
              <div style={{ display: "flex", gap: 10, justifyContent: "center" }}>
                <button className="admin-btn admin-btn-ghost" onClick={() => setDeleteId(null)}>Cancel</button>
                <button className="admin-btn admin-btn-danger" onClick={() => deleteMember(deleteId)}>Delete</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
