"use client";

import { useEffect, useState } from "react";
import {
  Star,
  CheckCircle,
  XCircle,
  Trash2,
  Sparkles,
  Search,
  ShieldCheck,
  Pencil,
  X,
} from "lucide-react";
import type { Review, ReviewStatus } from "@/lib/reviews";

interface ReviewStats {
  total: number;
  pending: number;
  approved: number;
  rejected: number;
  averageRating: number;
}

export default function AdminReviewsPage() {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [stats, setStats] = useState<ReviewStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState<"all" | ReviewStatus>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedReview, setSelectedReview] = useState<Review | null>(null);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchReviews();
  }, []);

  async function fetchReviews() {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/reviews");
      if (res.ok) {
        const data = await res.json();
        setReviews(data.reviews || []);
        setStats(data.stats || null);
      }
    } catch (e) {
      console.error("Failed to load reviews:", e);
    } finally {
      setLoading(false);
    }
  }

  async function updateStatus(id: string, status: ReviewStatus, moderationNote?: string) {
    try {
      const res = await fetch(`/api/reviews/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status, moderationNote: moderationNote ?? "" }),
      });
      if (res.ok) {
        await fetchReviews();
      }
    } catch (e) {
      console.error("Status update error:", e);
    }
  }

  async function toggleFeatured(review: Review) {
    try {
      const res = await fetch(`/api/reviews/${review.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ featured: !review.featured }),
      });
      if (res.ok) {
        await fetchReviews();
      }
    } catch (e) {
      console.error("Feature toggle error:", e);
    }
  }

  async function handleDelete(id: string) {
    try {
      const res = await fetch(`/api/reviews/${id}`, { method: "DELETE" });
      if (res.ok) {
        setDeleteConfirmId(null);
        await fetchReviews();
      }
    } catch (e) {
      console.error("Delete error:", e);
    }
  }

  async function handleSaveEdit(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedReview) return;
    setSaving(true);
    try {
      const res = await fetch(`/api/reviews/${selectedReview.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(selectedReview),
      });
      if (res.ok) {
        setEditModalOpen(false);
        setSelectedReview(null);
        await fetchReviews();
      }
    } catch (e) {
      console.error("Save error:", e);
    } finally {
      setSaving(false);
    }
  }

  const filtered = reviews.filter((r) => {
    if (filterStatus !== "all" && r.status !== filterStatus) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchName = r.reviewerName.toLowerCase().includes(q);
      const matchCompany = r.reviewerCompany.toLowerCase().includes(q);
      const matchBody = r.body.toLowerCase().includes(q);
      const matchTitle = (r.title || "").toLowerCase().includes(q);
      return matchName || matchCompany || matchBody || matchTitle;
    }
    return true;
  });

  return (
    <div>
      <div className="admin-page-header">
        <div>
          <h1 className="admin-page-title">Reviews & Moderation</h1>
          <p className="admin-page-sub">
            Review submissions from clients and visitors. Moderate, approve, and feature client reviews on the homepage.
          </p>
        </div>
      </div>

      {/* Stats KPI Overview */}
      {stats && (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: 16, marginBottom: 24 }}>
          <div className="admin-card" style={{ padding: 18 }}>
            <span style={{ fontSize: 11, textTransform: "uppercase", letterSpacing: "0.08em", color: "var(--admin-text-muted)" }}>
              Average Rating
            </span>
            <div style={{ display: "flex", alignItems: "baseline", gap: 8, marginTop: 6 }}>
              <span style={{ fontSize: 28, fontWeight: 700, color: "var(--admin-text)" }}>
                {stats.averageRating > 0 ? stats.averageRating.toFixed(1) : "—"}
              </span>
              <div style={{ display: "flex", gap: 2 }}>
                {Array.from({ length: 5 }).map((_, i) => (
                  <Star
                    key={i}
                    size={14}
                    fill={i < Math.round(stats.averageRating) ? "#f59e0b" : "none"}
                    stroke="#f59e0b"
                  />
                ))}
              </div>
            </div>
          </div>

          <div className="admin-card" style={{ padding: 18 }}>
            <span style={{ fontSize: 11, textTransform: "uppercase", letterSpacing: "0.08em", color: "var(--admin-text-muted)" }}>
              Pending Moderation
            </span>
            <div style={{ marginTop: 6, display: "flex", alignItems: "center", gap: 8 }}>
              <span style={{ fontSize: 28, fontWeight: 700, color: stats.pending > 0 ? "#f59e0b" : "var(--admin-text)" }}>
                {stats.pending}
              </span>
              {stats.pending > 0 && (
                <span className="admin-badge admin-badge-yellow" style={{ fontSize: 11 }}>
                  Action Needed
                </span>
              )}
            </div>
          </div>

          <div className="admin-card" style={{ padding: 18 }}>
            <span style={{ fontSize: 11, textTransform: "uppercase", letterSpacing: "0.08em", color: "var(--admin-text-muted)" }}>
              Approved (Public)
            </span>
            <div style={{ fontSize: 28, fontWeight: 700, color: "#10b981", marginTop: 6 }}>
              {stats.approved}
            </div>
          </div>

          <div className="admin-card" style={{ padding: 18 }}>
            <span style={{ fontSize: 11, textTransform: "uppercase", letterSpacing: "0.08em", color: "var(--admin-text-muted)" }}>
              Total Submissions
            </span>
            <div style={{ fontSize: 28, fontWeight: 700, color: "var(--admin-text)", marginTop: 6 }}>
              {stats.total}
            </div>
          </div>
        </div>
      )}

      {/* Filter and Search Bar */}
      <div className="admin-content" style={{ display: "flex", flexDirection: "column", gap: 16 }}>
        <div style={{ display: "flex", flexWrap: "wrap", justifyContent: "space-between", alignItems: "center", gap: 12 }}>
          <div style={{ display: "flex", gap: 6 }}>
            {(
              [
                ["all", "All Reviews"],
                ["pending", `Pending (${stats?.pending ?? 0})`],
                ["approved", `Approved (${stats?.approved ?? 0})`],
                ["rejected", `Rejected (${stats?.rejected ?? 0})`],
              ] as const
            ).map(([key, label]) => (
              <button
                key={key}
                type="button"
                onClick={() => setFilterStatus(key)}
                className={`admin-btn ${filterStatus === key ? "admin-btn-primary" : "admin-btn-ghost"}`}
                style={{ fontSize: 12, padding: "6px 12px" }}
              >
                {label}
              </button>
            ))}
          </div>

          <div style={{ position: "relative", minWidth: 260 }}>
            <Search size={14} style={{ position: "absolute", left: 10, top: "50%", transform: "translateY(-50%)", color: "var(--admin-text-muted)" }} />
            <input
              type="text"
              placeholder="Search reviewer, company, content..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="admin-input"
              style={{ paddingLeft: 32, fontSize: 13, height: 36 }}
            />
          </div>
        </div>

        {/* Reviews Table */}
        <div className="admin-table-wrap">
          <table className="admin-table">
            <thead>
              <tr>
                <th>Reviewer</th>
                <th>Rating & Title</th>
                <th>Content</th>
                <th>Status</th>
                <th>Featured</th>
                <th>Date</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={7} style={{ textAlign: "center", padding: 36, color: "var(--admin-text-muted)" }}>
                    Loading reviews...
                  </td>
                </tr>
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={7} style={{ textAlign: "center", padding: 36, color: "var(--admin-text-muted)" }}>
                    No reviews found for current filter.
                  </td>
                </tr>
              ) : (
                filtered.map((r) => (
                  <tr key={r.id}>
                    <td>
                      <div style={{ display: "flex", flexDirection: "column" }}>
                        <span className="td-primary" style={{ display: "flex", alignItems: "center", gap: 4 }}>
                          {r.reviewerName}
                          {r.portalAccountId && (
                            <span title="Verified Client (Portal Account)" style={{ display: "inline-flex" }}>
                              <ShieldCheck size={14} style={{ color: "#3b82f6" }} />
                            </span>
                          )}
                        </span>
                        <span style={{ fontSize: 11, color: "var(--admin-text-muted)" }}>
                          {[r.reviewerRole, r.reviewerCompany].filter(Boolean).join(" · ") || "Independent Reviewer"}
                        </span>
                      </div>
                    </td>

                    <td>
                      <div style={{ display: "flex", flexDirection: "column", gap: 3 }}>
                        <div style={{ display: "flex", gap: 2 }}>
                          {Array.from({ length: 5 }).map((_, i) => (
                            <Star
                              key={i}
                              size={12}
                              fill={i < r.rating ? "#f59e0b" : "none"}
                              stroke="#f59e0b"
                            />
                          ))}
                        </div>
                        {r.title && (
                          <span style={{ fontSize: 12, fontWeight: 600, color: "var(--admin-text)" }}>
                            {r.title}
                          </span>
                        )}
                      </div>
                    </td>

                    <td style={{ maxWidth: 280 }}>
                      <p style={{ display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden", fontSize: 12, margin: 0, color: "var(--admin-text-secondary)" }}>
                        {r.body}
                      </p>
                      {r.moderationNote && (
                        <span style={{ fontSize: 10, color: "var(--admin-text-muted)", fontStyle: "italic", marginTop: 2, display: "block" }}>
                          Note: {r.moderationNote}
                        </span>
                      )}
                    </td>

                    <td>
                      <span
                        className={`admin-badge ${
                          r.status === "approved"
                            ? "admin-badge-green"
                            : r.status === "rejected"
                              ? "admin-badge-red"
                              : "admin-badge-yellow"
                        }`}
                      >
                        {r.status.toUpperCase()}
                      </span>
                    </td>

                    <td>
                      <button
                        type="button"
                        onClick={() => toggleFeatured(r)}
                        disabled={r.status !== "approved"}
                        title={r.status !== "approved" ? "Approve review first to feature on homepage" : "Toggle homepage showcase"}
                        className="admin-btn admin-btn-ghost admin-btn-icon"
                        style={{
                          color: r.featured ? "#f59e0b" : "var(--admin-text-muted)",
                          opacity: r.status !== "approved" ? 0.4 : 1,
                        }}
                      >
                        <Sparkles size={14} fill={r.featured ? "#f59e0b" : "none"} />
                      </button>
                    </td>

                    <td style={{ fontSize: 11, color: "var(--admin-text-muted)", whiteSpace: "nowrap" }}>
                      {new Date(r.submittedAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                    </td>

                    <td>
                      <div className="admin-actions">
                        {r.status !== "approved" && (
                          <button
                            type="button"
                            className="admin-btn admin-btn-ghost admin-btn-icon"
                            style={{ color: "#10b981" }}
                            title="Approve Review"
                            onClick={() => updateStatus(r.id, "approved")}
                          >
                            <CheckCircle size={15} />
                          </button>
                        )}
                        {r.status !== "rejected" && (
                          <button
                            type="button"
                            className="admin-btn admin-btn-ghost admin-btn-icon"
                            style={{ color: "#f87171" }}
                            title="Reject Review"
                            onClick={() => updateStatus(r.id, "rejected")}
                          >
                            <XCircle size={15} />
                          </button>
                        )}
                        <button
                          type="button"
                          className="admin-btn admin-btn-ghost admin-btn-icon"
                          title="Edit Details"
                          onClick={() => {
                            setSelectedReview(r);
                            setEditModalOpen(true);
                          }}
                        >
                          <Pencil size={13} />
                        </button>
                        <button
                          type="button"
                          className="admin-btn admin-btn-danger admin-btn-icon"
                          title="Delete Review"
                          onClick={() => setDeleteConfirmId(r.id)}
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

      {/* Edit Review Modal */}
      {editModalOpen && selectedReview && (
        <div className="admin-modal-overlay" onClick={() => setEditModalOpen(false)}>
          <div className="admin-modal" onClick={(e) => e.stopPropagation()}>
            <div className="admin-modal-header">
              <h2 className="admin-modal-title">Edit Review</h2>
              <button className="admin-btn admin-btn-ghost admin-btn-icon" onClick={() => setEditModalOpen(false)}>
                <X size={15} />
              </button>
            </div>
            <form onSubmit={handleSaveEdit}>
              <div className="admin-modal-body">
                <div className="admin-form">
                  <div className="admin-form-row">
                    <div className="admin-form-group">
                      <label className="admin-label">Reviewer Name</label>
                      <input
                        className="admin-input"
                        value={selectedReview.reviewerName}
                        onChange={(e) => setSelectedReview({ ...selectedReview, reviewerName: e.target.value })}
                        required
                      />
                    </div>
                    <div className="admin-form-group">
                      <label className="admin-label">Role</label>
                      <input
                        className="admin-input"
                        value={selectedReview.reviewerRole}
                        onChange={(e) => setSelectedReview({ ...selectedReview, reviewerRole: e.target.value })}
                        placeholder="e.g. CTO"
                      />
                    </div>
                  </div>

                  <div className="admin-form-row">
                    <div className="admin-form-group">
                      <label className="admin-label">Company</label>
                      <input
                        className="admin-input"
                        value={selectedReview.reviewerCompany}
                        onChange={(e) => setSelectedReview({ ...selectedReview, reviewerCompany: e.target.value })}
                        placeholder="e.g. Acme Corp"
                      />
                    </div>
                    <div className="admin-form-group">
                      <label className="admin-label">Rating (1–5)</label>
                      <input
                        type="number"
                        min={1}
                        max={5}
                        className="admin-input"
                        value={selectedReview.rating}
                        onChange={(e) => setSelectedReview({ ...selectedReview, rating: Number(e.target.value) })}
                        required
                      />
                    </div>
                  </div>

                  <div className="admin-form-group">
                    <label className="admin-label">Review Title (optional)</label>
                    <input
                      className="admin-input"
                      value={selectedReview.title}
                      onChange={(e) => setSelectedReview({ ...selectedReview, title: e.target.value })}
                    />
                  </div>

                  <div className="admin-form-group">
                    <label className="admin-label">Review Body</label>
                    <textarea
                      rows={4}
                      className="admin-textarea"
                      value={selectedReview.body}
                      onChange={(e) => setSelectedReview({ ...selectedReview, body: e.target.value })}
                      required
                    />
                  </div>

                  <div className="admin-form-row">
                    <div className="admin-form-group">
                      <label className="admin-label">Moderation Status</label>
                      <select
                        className="admin-input"
                        value={selectedReview.status}
                        onChange={(e) => setSelectedReview({ ...selectedReview, status: e.target.value as ReviewStatus })}
                      >
                        <option value="pending">Pending</option>
                        <option value="approved">Approved</option>
                        <option value="rejected">Rejected</option>
                      </select>
                    </div>
                    <div className="admin-form-group">
                      <label className="admin-label">Display Order</label>
                      <input
                        type="number"
                        className="admin-input"
                        value={selectedReview.order}
                        onChange={(e) => setSelectedReview({ ...selectedReview, order: Number(e.target.value) })}
                      />
                    </div>
                  </div>

                  <div className="admin-form-group">
                    <label className="admin-label">Internal Moderation Note</label>
                    <input
                      className="admin-input"
                      value={selectedReview.moderationNote}
                      onChange={(e) => setSelectedReview({ ...selectedReview, moderationNote: e.target.value })}
                      placeholder="e.g. Verified client via invoice #1042"
                    />
                  </div>

                  <label style={{ display: "flex", alignItems: "center", gap: 10, fontSize: 13, color: "var(--admin-text-secondary)", cursor: "pointer" }}>
                    <label className="admin-toggle">
                      <input
                        type="checkbox"
                        checked={selectedReview.featured}
                        onChange={(e) => setSelectedReview({ ...selectedReview, featured: e.target.checked })}
                      />
                      <span className="admin-toggle-slider" />
                    </label>
                    Feature this review in the homepage testimonial rotation
                  </label>
                </div>
              </div>

              <div className="admin-modal-footer">
                <button type="button" className="admin-btn admin-btn-ghost" onClick={() => setEditModalOpen(false)}>
                  Cancel
                </button>
                <button type="submit" className="admin-btn admin-btn-primary" disabled={saving}>
                  {saving ? "Saving..." : "Save Changes"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation */}
      {deleteConfirmId && (
        <div className="admin-modal-overlay" onClick={() => setDeleteConfirmId(null)}>
          <div className="admin-modal" style={{ maxWidth: 400 }} onClick={(e) => e.stopPropagation()}>
            <div className="admin-modal-header">
              <h2 className="admin-modal-title">Delete Review</h2>
              <button className="admin-btn admin-btn-ghost admin-btn-icon" onClick={() => setDeleteConfirmId(null)}>
                <X size={15} />
              </button>
            </div>
            <div className="admin-modal-body admin-confirm">
              <p>Permanently delete this review? This action cannot be undone.</p>
              <div style={{ display: "flex", gap: 10, justifyContent: "center", marginTop: 20 }}>
                <button className="admin-btn admin-btn-ghost" onClick={() => setDeleteConfirmId(null)}>
                  Cancel
                </button>
                <button className="admin-btn admin-btn-danger" onClick={() => handleDelete(deleteConfirmId)}>
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
