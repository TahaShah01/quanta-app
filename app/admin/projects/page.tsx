"use client";

import { useState, useEffect } from "react";
import { Plus, Pencil, Trash2, X, Eye, EyeOff } from "lucide-react";
import type { Project, TeamMember } from "@/lib/types";

const CATEGORIES = ["Web Platform", "AI Product", "E-Commerce", "Mobile App", "SaaS", "Other"];
const VISUAL_TYPES = ["alpha", "nova", "orbit", "custom"] as const;

const emptyProject = (): Partial<Project> => ({
  title: "", slug: "", category: "", description: "", overview: "", approach: "", outcome: "",
  results: [], technologies: [], images: [], year: new Date().getFullYear().toString(),
  teamMembers: [], liveUrl: "", visualType: "alpha", featured: false, published: false,
});

export default function AdminProjectsPage() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [team, setTeam] = useState<TeamMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState<{ open: boolean; project: Partial<Project>; isNew: boolean }>({
    open: false, project: emptyProject(), isNew: true,
  });
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [techInput, setTechInput] = useState("");
  const [resultInput, setResultInput] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchProjects();
    fetch("/api/team").then(r => r.json()).then(setTeam);
  }, []);

  async function fetchProjects() {
    setLoading(true);
    const res = await fetch("/api/projects?published=false");
    setProjects(await res.json());
    setLoading(false);
  }

  function openAdd() { setModal({ open: true, project: emptyProject(), isNew: true }); setTechInput(""); setResultInput(""); }
  function openEdit(p: Project) {
    setModal({ open: true, project: { ...p, technologies: [...p.technologies], results: [...p.results], teamMembers: [...p.teamMembers] }, isNew: false });
    setTechInput(""); setResultInput("");
  }
  function closeModal() { setModal({ open: false, project: emptyProject(), isNew: true }); }
  function updateField(field: string, value: unknown) { setModal((prev) => ({ ...prev, project: { ...prev.project, [field]: value } })); }

  function addTech() { if (!techInput.trim()) return; updateField("technologies", [...(modal.project.technologies || []), techInput.trim()]); setTechInput(""); }
  function removeTech(t: string) { updateField("technologies", (modal.project.technologies || []).filter((x) => x !== t)); }
  function addResult() { if (!resultInput.trim()) return; updateField("results", [...(modal.project.results || []), resultInput.trim()]); setResultInput(""); }
  function removeResult(r: string) { updateField("results", (modal.project.results || []).filter((x) => x !== r)); }
  function toggleMember(id: string) {
    const current = modal.project.teamMembers || [];
    updateField("teamMembers", current.includes(id) ? current.filter((x) => x !== id) : [...current, id]);
  }

  async function saveProject() {
    setSaving(true);
    const { isNew, project } = modal;
    const slug = project.slug || project.title?.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "") || "";
    const payload = { ...project, slug };
    if (isNew) {
      await fetch("/api/projects", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) });
    } else {
      await fetch(`/api/projects/${project.id}`, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) });
    }
    await fetchProjects(); closeModal(); setSaving(false);
  }

  async function togglePublish(p: Project) {
    await fetch(`/api/projects/${p.id}`, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ ...p, published: !p.published }) });
    fetchProjects();
  }

  async function deleteProject(id: string) {
    await fetch(`/api/projects/${id}`, { method: "DELETE" }); setDeleteId(null); fetchProjects();
  }

  return (
    <div>
      <div className="admin-page-header">
        <div>
          <h1 className="admin-page-title">Projects</h1>
          <p className="admin-page-sub">Manage your portfolio projects, case studies, and visibility.</p>
        </div>
        <button className="admin-btn admin-btn-primary" onClick={openAdd}><Plus size={15} /> Add Project</button>
      </div>

      <div className="admin-content">
        <div className="admin-table-wrap">
          <table className="admin-table">
            <thead><tr><th>#</th><th>Title</th><th>Category</th><th>Year</th><th>Team</th><th>Status</th><th>Actions</th></tr></thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={7} style={{ textAlign: "center", padding: 30, color: "var(--admin-text-muted)" }}>Loading...</td></tr>
              ) : projects.map((p) => (
                <tr key={p.id}>
                  <td style={{ fontFamily: "monospace", fontSize: 12 }}>{p.num}</td>
                  <td><span className="td-primary">{p.title}</span><br /><span style={{ fontSize: 11, color: "var(--admin-text-muted)" }}>/{p.slug}</span></td>
                  <td><span className="admin-badge admin-badge-purple">{p.category}</span></td>
                  <td>{p.year}</td>
                  <td><span style={{ fontSize: 12, color: "var(--admin-text-muted)" }}>{p.teamMembers.length} members</span></td>
                  <td><span className={`admin-badge ${p.published ? "admin-badge-green" : "admin-badge-gray"}`}>{p.published ? "Live" : "Draft"}</span></td>
                  <td>
                    <div className="admin-actions">
                      <button className="admin-btn admin-btn-ghost admin-btn-icon" onClick={() => togglePublish(p)} title={p.published ? "Unpublish" : "Publish"}>
                        {p.published ? <EyeOff size={13} /> : <Eye size={13} />}
                      </button>
                      <button className="admin-btn admin-btn-ghost admin-btn-icon" onClick={() => openEdit(p)}><Pencil size={13} /></button>
                      <button className="admin-btn admin-btn-danger admin-btn-icon" onClick={() => setDeleteId(p.id)}><Trash2 size={13} /></button>
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
          <div className="admin-modal" style={{ maxWidth: 740 }} onClick={(e) => e.stopPropagation()}>
            <div className="admin-modal-header">
              <h2 className="admin-modal-title">{modal.isNew ? "Add Project" : "Edit Project"}</h2>
              <button className="admin-btn admin-btn-ghost admin-btn-icon" onClick={closeModal}><X size={15} /></button>
            </div>
            <div className="admin-modal-body">
              <div className="admin-form">
                <div className="admin-form-row">
                  <div className="admin-form-group">
                    <label className="admin-label">Title *</label>
                    <input className="admin-input" value={modal.project.title || ""} onChange={(e) => updateField("title", e.target.value)} placeholder="Project title" />
                  </div>
                  <div className="admin-form-group">
                    <label className="admin-label">URL Slug</label>
                    <input className="admin-input" value={modal.project.slug || ""} onChange={(e) => updateField("slug", e.target.value)} placeholder="auto-generated from title" />
                  </div>
                </div>
                <div className="admin-form-row">
                  <div className="admin-form-group">
                    <label className="admin-label">Category</label>
                    <select className="admin-select" value={modal.project.category || ""} onChange={(e) => updateField("category", e.target.value)}>
                      <option value="">Select category</option>
                      {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
                    </select>
                  </div>
                  <div className="admin-form-group">
                    <label className="admin-label">Year</label>
                    <input className="admin-input" value={modal.project.year || ""} onChange={(e) => updateField("year", e.target.value)} placeholder="2026" />
                  </div>
                </div>
                <div className="admin-form-group">
                  <label className="admin-label">Short Description</label>
                  <textarea className="admin-textarea" rows={2} value={modal.project.description || ""} onChange={(e) => updateField("description", e.target.value)} placeholder="One to two sentence summary shown in listings..." />
                </div>
                <div className="admin-form-group">
                  <label className="admin-label">Overview (Case Study)</label>
                  <textarea className="admin-textarea" rows={3} value={modal.project.overview || ""} onChange={(e) => updateField("overview", e.target.value)} placeholder="Detailed overview for the project case study page..." />
                </div>
                <div className="admin-form-group">
                  <label className="admin-label">Approach</label>
                  <textarea className="admin-textarea" rows={3} value={modal.project.approach || ""} onChange={(e) => updateField("approach", e.target.value)} placeholder="How did you approach this project?" />
                </div>
                <div className="admin-form-group">
                  <label className="admin-label">Outcome</label>
                  <textarea className="admin-textarea" rows={3} value={modal.project.outcome || ""} onChange={(e) => updateField("outcome", e.target.value)} placeholder="What was the result?" />
                </div>
                <div className="admin-form-row">
                  <div className="admin-form-group">
                    <label className="admin-label">Technologies</label>
                    <div style={{ display: "flex", gap: 8 }}>
                      <input className="admin-input" value={techInput} onChange={(e) => setTechInput(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); addTech(); }}} placeholder="e.g. React" />
                      <button className="admin-btn admin-btn-ghost admin-btn-sm" type="button" onClick={addTech}>Add</button>
                    </div>
                    <div className="admin-tags">{(modal.project.technologies || []).map((t) => (<span key={t} className="admin-tag">{t} <span className="admin-tag-remove" onClick={() => removeTech(t)}>×</span></span>))}</div>
                  </div>
                  <div className="admin-form-group">
                    <label className="admin-label">Key Results / Metrics</label>
                    <div style={{ display: "flex", gap: 8 }}>
                      <input className="admin-input" value={resultInput} onChange={(e) => setResultInput(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); addResult(); }}} placeholder="e.g. 60% faster load time" />
                      <button className="admin-btn admin-btn-ghost admin-btn-sm" type="button" onClick={addResult}>Add</button>
                    </div>
                    <div className="admin-tags">{(modal.project.results || []).map((r) => (<span key={r} className="admin-tag">{r} <span className="admin-tag-remove" onClick={() => removeResult(r)}>×</span></span>))}</div>
                  </div>
                </div>
                <div className="admin-form-row">
                  <div className="admin-form-group">
                    <label className="admin-label">Live URL</label>
                    <input className="admin-input" value={modal.project.liveUrl || ""} onChange={(e) => updateField("liveUrl", e.target.value)} placeholder="https://..." />
                  </div>
                  <div className="admin-form-group">
                    <label className="admin-label">Visual Type</label>
                    <select className="admin-select" value={modal.project.visualType || "alpha"} onChange={(e) => updateField("visualType", e.target.value)}>
                      {VISUAL_TYPES.map((v) => <option key={v} value={v}>{v}</option>)}
                    </select>
                  </div>
                </div>
                <div className="admin-form-group">
                  <label className="admin-label">Cover Image URL</label>
                  <input className="admin-input" value={(modal.project.images || [])[0] || ""} onChange={(e) => updateField("images", [e.target.value])} placeholder="/projects/alpha-cover.jpg or https://..." />
                </div>
                <div>
                  <p className="admin-section-heading">Team Members</p>
                  <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginTop: 12 }}>
                    {team.map((m) => {
                      const selected = (modal.project.teamMembers || []).includes(m.id);
                      return (
                        <button key={m.id} type="button" onClick={() => toggleMember(m.id)}
                          className={`admin-btn ${selected ? "admin-btn-primary" : "admin-btn-ghost"} admin-btn-sm`}>
                          {m.initials} · {m.name}
                        </button>
                      );
                    })}
                  </div>
                </div>
                <div style={{ display: "flex", gap: 24 }}>
                  <label style={{ display: "flex", alignItems: "center", gap: 10, fontSize: 13, color: "var(--admin-text-secondary)", cursor: "pointer" }}>
                    <label className="admin-toggle">
                      <input type="checkbox" checked={!!modal.project.published} onChange={(e) => updateField("published", e.target.checked)} />
                      <span className="admin-toggle-slider" />
                    </label>
                    Published (visible on website)
                  </label>
                  <label style={{ display: "flex", alignItems: "center", gap: 10, fontSize: 13, color: "var(--admin-text-secondary)", cursor: "pointer" }}>
                    <label className="admin-toggle">
                      <input type="checkbox" checked={!!modal.project.featured} onChange={(e) => updateField("featured", e.target.checked)} />
                      <span className="admin-toggle-slider" />
                    </label>
                    Featured on homepage
                  </label>
                </div>
              </div>
            </div>
            <div className="admin-modal-footer">
              <button className="admin-btn admin-btn-ghost" onClick={closeModal}>Cancel</button>
              <button className="admin-btn admin-btn-primary" onClick={saveProject} disabled={saving}>{saving ? "Saving..." : modal.isNew ? "Add Project" : "Save Changes"}</button>
            </div>
          </div>
        </div>
      )}

      {deleteId && (
        <div className="admin-modal-overlay" onClick={() => setDeleteId(null)}>
          <div className="admin-modal" style={{ maxWidth: 400 }} onClick={(e) => e.stopPropagation()}>
            <div className="admin-modal-header"><h2 className="admin-modal-title">Delete Project</h2><button className="admin-btn admin-btn-ghost admin-btn-icon" onClick={() => setDeleteId(null)}><X size={15} /></button></div>
            <div className="admin-modal-body admin-confirm">
              <p>Are you sure? This will permanently remove the project and its case study.</p>
              <div style={{ display: "flex", gap: 10, justifyContent: "center" }}>
                <button className="admin-btn admin-btn-ghost" onClick={() => setDeleteId(null)}>Cancel</button>
                <button className="admin-btn admin-btn-danger" onClick={() => deleteProject(deleteId)}>Delete</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
