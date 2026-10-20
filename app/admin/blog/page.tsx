"use client";

import { useState, useEffect } from "react";
import { Plus, Pencil, Trash2, X, Eye, EyeOff, ExternalLink } from "lucide-react";
import type { BlogPost } from "@/lib/types";
import { RichTextEditor } from "@/components/admin/RichTextEditor";

const empty = (): Partial<BlogPost> => ({
  title: "",
  slug: "",
  excerpt: "",
  content: "<p>Start writing your post here...</p>",
  coverImage: "",
  author: "Taha Shah",
  authorRole: "Frontend Developer",
  authorImage: "",
  tags: ["engineering", "design"],
  readTime: 3,
  published: true,
  publishedAt: new Date().toISOString(),
  seo: {
    title: "",
    description: "",
  },
});

export default function AdminBlogPage() {
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState<{ open: boolean; item: Partial<BlogPost>; isNew: boolean }>({
    open: false,
    item: empty(),
    isNew: true,
  });
  const [tagsRaw, setTagsRaw] = useState("");
  const [deleteSlug, setDeleteSlug] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchPosts();
  }, []);

  async function fetchPosts() {
    setLoading(true);
    const res = await fetch("/api/blog?all=true");
    const data = await res.json();
    setPosts(Array.isArray(data) ? data : []);
    setLoading(false);
  }

  function openAdd() {
    const fresh = empty();
    setTagsRaw(fresh.tags?.join(", ") || "");
    setModal({ open: true, item: fresh, isNew: true });
  }

  function openEdit(p: BlogPost) {
    setTagsRaw((p.tags || []).join(", "));
    setModal({ open: true, item: { ...p }, isNew: false });
  }

  function closeModal() {
    setModal({ open: false, item: empty(), isNew: true });
  }

  function updateField(field: string, value: unknown) {
    setModal((prev) => {
      const next = { ...prev, item: { ...prev.item, [field]: value } };
      // auto slug if new and updating title
      if (prev.isNew && field === "title" && typeof value === "string") {
        next.item.slug = value
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, "-")
          .replace(/(^-|-$)/g, "");
      }
      return next;
    });
  }

  function updateSeo(key: "title" | "description", value: string) {
    setModal((prev) => ({
      ...prev,
      item: {
        ...prev.item,
        seo: {
          title: prev.item.seo?.title || "",
          description: prev.item.seo?.description || "",
          [key]: value,
        },
      },
    }));
  }

  async function save() {
    setSaving(true);
    const tags = tagsRaw
      .split(",")
      .map((t) => t.trim())
      .filter(Boolean);

    const payload = {
      ...modal.item,
      tags,
      seo: {
        title: modal.item.seo?.title || modal.item.title || "",
        description: modal.item.seo?.description || modal.item.excerpt || "",
      },
    };

    if (modal.isNew) {
      await fetch("/api/blog", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
    } else {
      await fetch(`/api/blog/${modal.item.slug}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
    }

    await fetchPosts();
    closeModal();
    setSaving(false);
  }

  async function togglePublish(p: BlogPost) {
    await fetch(`/api/blog/${p.slug}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...p, published: !p.published }),
    });
    fetchPosts();
  }

  async function deletePost(slug: string) {
    await fetch(`/api/blog/${slug}`, { method: "DELETE" });
    setDeleteSlug(null);
    fetchPosts();
  }

  return (
    <div>
      <div className="admin-page-header">
        <div>
          <h1 className="admin-page-title">Blog & Insights</h1>
          <p className="admin-page-sub">Create and publish engineering, design, and studio articles.</p>
        </div>
        <button className="admin-btn admin-btn-primary" onClick={openAdd}>
          <Plus size={15} /> Write New Article
        </button>
      </div>

      <div className="admin-content">
        <div className="admin-table-wrap">
          <table className="admin-table">
            <thead>
              <tr>
                <th>Title & Excerpt</th>
                <th>Author</th>
                <th>Tags</th>
                <th>Read Time</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={6} style={{ textAlign: "center", padding: 30, color: "var(--admin-text-muted)" }}>
                    Loading articles...
                  </td>
                </tr>
              ) : posts.length === 0 ? (
                <tr>
                  <td colSpan={6} style={{ textAlign: "center", padding: 30, color: "var(--admin-text-muted)" }}>
                    No blog posts yet. Click &quot;Write New Article&quot; to create your first post!
                  </td>
                </tr>
              ) : (
                posts.map((p) => (
                  <tr key={p.id || p.slug}>
                    <td>
                      <div>
                        <div className="td-primary" style={{ display: "flex", alignItems: "center", gap: 6 }}>
                          {p.title}
                          {p.published && (
                            <a
                              href={`/blog/${p.slug}`}
                              target="_blank"
                              rel="noreferrer"
                              style={{ color: "var(--admin-text-muted)", display: "inline-flex" }}
                              title="Preview article on live site"
                            >
                              <ExternalLink size={12} />
                            </a>
                          )}
                        </div>
                        <div
                          style={{
                            fontSize: 12,
                            color: "var(--admin-text-muted)",
                            maxWidth: 320,
                            whiteSpace: "nowrap",
                            overflow: "hidden",
                            textOverflow: "ellipsis",
                          }}
                        >
                          {p.excerpt}
                        </div>
                      </div>
                    </td>
                    <td>
                      <div style={{ fontSize: 13, color: "var(--admin-text-primary)" }}>{p.author}</div>
                      <div style={{ fontSize: 11, color: "var(--admin-text-muted)" }}>{p.authorRole}</div>
                    </td>
                    <td>
                      <div style={{ display: "flex", flexWrap: "wrap", gap: 4 }}>
                        {(p.tags || []).slice(0, 2).map((tag) => (
                          <span key={tag} className="admin-badge admin-badge-purple" style={{ fontSize: 10 }}>
                            {tag}
                          </span>
                        ))}
                        {(p.tags || []).length > 2 && (
                          <span className="admin-badge admin-badge-gray" style={{ fontSize: 10 }}>
                            +{p.tags.length - 2}
                          </span>
                        )}
                      </div>
                    </td>
                    <td>
                      <span style={{ fontSize: 12, color: "var(--admin-text-secondary)" }}>{p.readTime || 3} min</span>
                    </td>
                    <td>
                      <span className={`admin-badge ${p.published ? "admin-badge-green" : "admin-badge-gray"}`}>
                        {p.published ? "Published" : "Draft"}
                      </span>
                    </td>
                    <td>
                      <div className="admin-actions">
                        <button
                          className="admin-btn admin-btn-ghost admin-btn-icon"
                          title="Toggle publish"
                          onClick={() => togglePublish(p)}
                        >
                          {p.published ? <EyeOff size={13} /> : <Eye size={13} />}
                        </button>
                        <button
                          className="admin-btn admin-btn-ghost admin-btn-icon"
                          title="Edit article"
                          onClick={() => openEdit(p)}
                        >
                          <Pencil size={13} />
                        </button>
                        <button
                          className="admin-btn admin-btn-danger admin-btn-icon"
                          title="Delete article"
                          onClick={() => setDeleteSlug(p.slug)}
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
          <div
            className="admin-modal"
            style={{ maxWidth: 860, maxHeight: "90vh", display: "flex", flexDirection: "column" }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="admin-modal-header">
              <h2 className="admin-modal-title">
                {modal.isNew ? "Create New Blog Article" : "Edit Article"}
              </h2>
              <button className="admin-btn admin-btn-ghost admin-btn-icon" onClick={closeModal}>
                <X size={15} />
              </button>
            </div>
            <div className="admin-modal-body" style={{ overflowY: "auto", flex: 1 }}>
              <div className="admin-form">
                <div className="admin-form-row">
                  <div className="admin-form-group" style={{ flex: 2 }}>
                    <label className="admin-label">Article Title *</label>
                    <input
                      className="admin-input"
                      value={modal.item.title || ""}
                      onChange={(e) => updateField("title", e.target.value)}
                      placeholder="e.g. Why We Build Small (And Why You Should Too)"
                    />
                  </div>
                  <div className="admin-form-group" style={{ flex: 1 }}>
                    <label className="admin-label">URL Slug *</label>
                    <input
                      className="admin-input"
                      value={modal.item.slug || ""}
                      onChange={(e) => updateField("slug", e.target.value)}
                      placeholder="why-we-build-small"
                      disabled={!modal.isNew}
                    />
                  </div>
                </div>

                <div className="admin-form-group">
                  <label className="admin-label">Excerpt / Teaser Summary *</label>
                  <textarea
                    className="admin-textarea"
                    rows={2}
                    value={modal.item.excerpt || ""}
                    onChange={(e) => updateField("excerpt", e.target.value)}
                    placeholder="Short engaging paragraph summarizing the piece for cards and search results..."
                  />
                </div>

                <div className="admin-form-group">
                  <label className="admin-label">Article Content (Rich Text Editor) *</label>
                  <RichTextEditor
                    value={modal.item.content || ""}
                    onChange={(html) => updateField("content", html)}
                  />
                </div>

                <div className="admin-form-row">
                  <div className="admin-form-group">
                    <label className="admin-label">Author Name</label>
                    <input
                      className="admin-input"
                      value={modal.item.author || ""}
                      onChange={(e) => updateField("author", e.target.value)}
                      placeholder="e.g. Taha Shah"
                    />
                  </div>
                  <div className="admin-form-group">
                    <label className="admin-label">Author Role</label>
                    <input
                      className="admin-input"
                      value={modal.item.authorRole || ""}
                      onChange={(e) => updateField("authorRole", e.target.value)}
                      placeholder="e.g. Frontend Developer"
                    />
                  </div>
                  <div className="admin-form-group">
                    <label className="admin-label">Estimated Read Time (min)</label>
                    <input
                      className="admin-input"
                      type="number"
                      value={modal.item.readTime || 3}
                      onChange={(e) => updateField("readTime", parseInt(e.target.value) || 3)}
                    />
                  </div>
                </div>

                <div className="admin-form-row">
                  <div className="admin-form-group">
                    <label className="admin-label">Cover Image URL (Optional)</label>
                    <input
                      className="admin-input"
                      value={modal.item.coverImage || ""}
                      onChange={(e) => updateField("coverImage", e.target.value)}
                      placeholder="/images/blog-cover.jpg or URL"
                    />
                  </div>
                  <div className="admin-form-group">
                    <label className="admin-label">Tags (comma-separated)</label>
                    <input
                      className="admin-input"
                      value={tagsRaw}
                      onChange={(e) => setTagsRaw(e.target.value)}
                      placeholder="philosophy, engineering, react"
                    />
                  </div>
                </div>

                <div
                  style={{
                    background: "var(--admin-bg)",
                    border: "1px solid var(--admin-border)",
                    borderRadius: "var(--admin-radius-sm)",
                    padding: 12,
                  }}
                >
                  <div style={{ fontSize: 13, fontWeight: 600, color: "var(--admin-text-primary)", marginBottom: 8 }}>
                    SEO Metadata
                  </div>
                  <div className="admin-form-group">
                    <label className="admin-label">Meta Title</label>
                    <input
                      className="admin-input"
                      value={modal.item.seo?.title || ""}
                      onChange={(e) => updateSeo("title", e.target.value)}
                      placeholder="Custom page title tag"
                    />
                  </div>
                  <div className="admin-form-group" style={{ marginBottom: 0 }}>
                    <label className="admin-label">Meta Description</label>
                    <textarea
                      className="admin-textarea"
                      rows={2}
                      value={modal.item.seo?.description || ""}
                      onChange={(e) => updateSeo("description", e.target.value)}
                      placeholder="Google search snippet description"
                    />
                  </div>
                </div>

                <div style={{ marginTop: 12 }}>
                  <label
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 10,
                      fontSize: 13,
                      color: "var(--admin-text-secondary)",
                      cursor: "pointer",
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
                    Publish immediately (visible to all site visitors)
                  </label>
                </div>
              </div>
            </div>
            <div className="admin-modal-footer">
              <button className="admin-btn admin-btn-ghost" onClick={closeModal}>
                Cancel
              </button>
              <button className="admin-btn admin-btn-primary" onClick={save} disabled={saving}>
                {saving ? "Saving..." : "Save Article"}
              </button>
            </div>
          </div>
        </div>
      )}

      {deleteSlug && (
        <div className="admin-modal-overlay" onClick={() => setDeleteSlug(null)}>
          <div className="admin-modal" style={{ maxWidth: 400 }} onClick={(e) => e.stopPropagation()}>
            <div className="admin-modal-header">
              <h2 className="admin-modal-title">Delete Article</h2>
              <button className="admin-btn admin-btn-ghost admin-btn-icon" onClick={() => setDeleteSlug(null)}>
                <X size={15} />
              </button>
            </div>
            <div className="admin-modal-body admin-confirm">
              <p>Are you sure you want to permanently delete this article?</p>
              <div style={{ display: "flex", gap: 10, justifyContent: "center" }}>
                <button className="admin-btn admin-btn-ghost" onClick={() => setDeleteSlug(null)}>
                  Cancel
                </button>
                <button className="admin-btn admin-btn-danger" onClick={() => deletePost(deleteSlug)}>
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
