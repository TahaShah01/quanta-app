"use client";

import { useState } from "react";
import { Star, ShieldCheck, CheckCircle2, AlertCircle, MessageSquarePlus, Search } from "lucide-react";
import { Container } from "@/components/ui/Container";
import type { PublicReview } from "@/lib/reviews";

interface ReviewsViewProps {
  initialReviews: PublicReview[];
  stats: {
    total: number;
    averageRating: number;
    distribution: Record<number, number>;
  };
}

export function ReviewsView({ initialReviews, stats }: ReviewsViewProps) {
  const [reviews] = useState<PublicReview[]>(initialReviews);
  const [filterRating, setFilterRating] = useState<number | "all">("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [showSubmitModal, setShowSubmitModal] = useState(false);

  // Submission form state
  const [formData, setFormData] = useState({
    reviewerName: "",
    reviewerCompany: "",
    reviewerRole: "",
    rating: 5,
    title: "",
    body: "",
  });
  const [submitting, setSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);
  const [submitError, setSubmitError] = useState("");

  const filtered = reviews.filter((r) => {
    if (filterRating !== "all" && r.rating !== filterRating) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchName = r.reviewerName.toLowerCase().includes(q);
      const matchCompany = (r.reviewerCompany || "").toLowerCase().includes(q);
      const matchBody = r.body.toLowerCase().includes(q);
      const matchTitle = (r.title || "").toLowerCase().includes(q);
      return matchName || matchCompany || matchBody || matchTitle;
    }
    return true;
  });

  async function handleSubmitReview(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setSubmitError("");
    try {
      const res = await fetch("/api/reviews", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      const data = await res.json();
      if (!res.ok) {
        setSubmitError(data.error || "Failed to submit review. Please try again.");
      } else {
        setSubmitSuccess(true);
        setFormData({
          reviewerName: "",
          reviewerCompany: "",
          reviewerRole: "",
          rating: 5,
          title: "",
          body: "",
        });
        setTimeout(() => {
          setShowSubmitModal(false);
          setSubmitSuccess(false);
        }, 3000);
      }
    } catch {
      setSubmitError("Network error. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <section className="w-full py-16 md:py-24">
      <Container>
        {/* Rating Overview and Distribution Card */}
        <div className="grid grid-cols-1 gap-8 lg:grid-cols-12 mb-16">
          <div className="lg:col-span-5 flex flex-col justify-between rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-8 md:p-10">
            <div>
              <span className="text-label mb-2 block">Client Satisfaction</span>
              <div className="flex items-baseline gap-4 mt-2">
                <span className="text-6xl font-light tabular-nums tracking-tight text-[var(--foreground)]">
                  {stats.averageRating > 0 ? stats.averageRating.toFixed(1) : "5.0"}
                </span>
                <div className="flex flex-col gap-1">
                  <div className="flex items-center gap-1">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <Star
                        key={i}
                        size={18}
                        className={
                          i < Math.round(stats.averageRating || 5)
                            ? "fill-amber-400 text-amber-400"
                            : "text-[var(--border)]"
                        }
                      />
                    ))}
                  </div>
                  <span className="font-mono text-xs uppercase tracking-widest text-[var(--secondary)]">
                    Based on {stats.total} verified reviews
                  </span>
                </div>
              </div>
            </div>

            <div className="mt-8 pt-6 border-t border-[var(--border)]">
              <button
                type="button"
                onClick={() => setShowSubmitModal(true)}
                className="inline-flex items-center gap-2 rounded-full bg-[var(--accent)] px-6 py-3 font-mono text-xs font-semibold uppercase tracking-wider text-[var(--accent-foreground)] transition-transform hover:scale-105"
              >
                <MessageSquarePlus size={15} />
                Leave a Client Review
              </button>
            </div>
          </div>

          <div className="lg:col-span-7 flex flex-col justify-center rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-8 md:p-10">
            <span className="text-label mb-4 block">Rating Breakdown</span>
            <div className="flex flex-col gap-3">
              {[5, 4, 3, 2, 1].map((stars) => {
                const count = stats.distribution[stars] || 0;
                const percentage = stats.total > 0 ? Math.round((count / stats.total) * 100) : 0;
                return (
                  <button
                    key={stars}
                    type="button"
                    onClick={() => setFilterRating(filterRating === stars ? "all" : stars)}
                    className={`group flex items-center gap-4 text-xs font-mono transition-opacity ${
                      filterRating === "all" || filterRating === stars ? "opacity-100" : "opacity-40"
                    }`}
                  >
                    <span className="w-10 text-left flex items-center gap-1 text-[var(--foreground)]">
                      {stars} <Star size={11} className="fill-amber-400 text-amber-400" />
                    </span>
                    <div className="h-2 flex-1 rounded-full bg-[var(--surface-hover)] overflow-hidden">
                      <div
                        className="h-full rounded-full bg-amber-400 transition-all duration-700"
                        style={{ width: `${percentage}%` }}
                      />
                    </div>
                    <span className="w-12 text-right text-[var(--muted)]">{count} ({percentage}%)</span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Filter and Search Bar */}
        <div className="flex flex-wrap items-center justify-between gap-4 mb-10 pb-6 border-b border-[var(--border)]">
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => setFilterRating("all")}
              className={`rounded-full px-4 py-1.5 font-mono text-xs uppercase tracking-wider transition-colors ${
                filterRating === "all"
                  ? "bg-[var(--foreground)] text-[var(--background)] font-medium"
                  : "border border-[var(--border)] text-[var(--secondary)] hover:text-[var(--foreground)]"
              }`}
            >
              All Ratings ({reviews.length})
            </button>
            {[5, 4, 3].map((s) => (
              <button
                key={s}
                type="button"
                onClick={() => setFilterRating(s)}
                className={`flex items-center gap-1.5 rounded-full px-4 py-1.5 font-mono text-xs uppercase tracking-wider transition-colors ${
                  filterRating === s
                    ? "bg-[var(--foreground)] text-[var(--background)] font-medium"
                    : "border border-[var(--border)] text-[var(--secondary)] hover:text-[var(--foreground)]"
                }`}
              >
                {s} <Star size={11} className="fill-amber-400 text-amber-400" />
              </button>
            ))}
          </div>

          <div className="relative min-w-[240px]">
            <Search size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[var(--muted)]" />
            <input
              type="text"
              placeholder="Filter reviews..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full rounded-full border border-[var(--border)] bg-[var(--surface)] pl-9 pr-4 py-2 text-xs text-[var(--foreground)] outline-none transition-colors focus:border-[var(--accent)]"
            />
          </div>
        </div>

        {/* Reviews Grid */}
        {filtered.length === 0 ? (
          <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-12 text-center">
            <p className="text-body text-[var(--muted)]">No reviews found matching your criteria.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filtered.map((review) => (
              <article
                key={review.id}
                className="flex flex-col justify-between rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-7 transition-colors hover:border-[var(--border-hover)]"
              >
                <div>
                  <div className="flex items-center justify-between gap-2 mb-4">
                    <div className="flex items-center gap-1">
                      {Array.from({ length: 5 }).map((_, i) => (
                        <Star
                          key={i}
                          size={13}
                          className={
                            i < review.rating ? "fill-amber-400 text-amber-400" : "text-[var(--border)]"
                          }
                        />
                      ))}
                    </div>
                    <time className="font-mono text-[11px] text-[var(--muted)]">
                      {new Date(review.submittedAt).toLocaleDateString("en-US", {
                        month: "short",
                        year: "numeric",
                      })}
                    </time>
                  </div>

                  {review.title && (
                    <h3 className="text-base font-medium text-[var(--foreground)] mb-3 leading-snug">
                      &ldquo;{review.title}&rdquo;
                    </h3>
                  )}

                  <p className="text-sm leading-relaxed text-[var(--secondary)] mb-6 whitespace-pre-line">
                    {review.body}
                  </p>
                </div>

                <div className="pt-4 border-t border-[var(--border)] flex items-center justify-between">
                  <div>
                    <h4 className="text-sm font-medium text-[var(--foreground)] flex items-center gap-1.5">
                      {review.reviewerName}
                    </h4>
                    <p className="text-xs text-[var(--muted)]">
                      {[review.reviewerRole, review.reviewerCompany].filter(Boolean).join(" · ")}
                    </p>
                  </div>
                  <span className="flex items-center gap-1 font-mono text-[10px] uppercase tracking-wider text-emerald-400">
                    <ShieldCheck size={13} />
                    Verified
                  </span>
                </div>
              </article>
            ))}
          </div>
        )}

        {/* Submit Review Modal */}
        {showSubmitModal && (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
            onClick={() => setShowSubmitModal(false)}
          >
            <div
              className="relative w-full max-w-lg rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-8 shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h3 className="text-xl font-medium text-[var(--foreground)]">Share Your Experience</h3>
                  <p className="text-xs text-[var(--secondary)] mt-1">
                    Your feedback helps us continuously elevate our design and engineering standards.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setShowSubmitModal(false)}
                  className="rounded-full p-1.5 text-[var(--muted)] hover:text-[var(--foreground)]"
                >
                  ✕
                </button>
              </div>

              {submitSuccess ? (
                <div className="flex flex-col items-center justify-center py-10 text-center gap-3">
                  <CheckCircle2 size={48} className="text-emerald-400" />
                  <h4 className="text-lg font-medium text-[var(--foreground)]">Review Submitted!</h4>
                  <p className="text-xs text-[var(--secondary)] max-w-sm">
                    Thank you for your valuable feedback. Your review has been submitted for moderation and will appear publicly once approved.
                  </p>
                </div>
              ) : (
                <form onSubmit={handleSubmitReview} className="flex flex-col gap-4">
                  {submitError && (
                    <div className="flex items-center gap-2 rounded-lg border border-rose-500/30 bg-rose-500/10 p-3 text-xs text-rose-400">
                      <AlertCircle size={14} />
                      {submitError}
                    </div>
                  )}

                  <div className="flex flex-col gap-1.5">
                    <label className="text-label">Rating</label>
                    <div className="flex items-center gap-2 mt-1">
                      {[1, 2, 3, 4, 5].map((s) => (
                        <button
                          key={s}
                          type="button"
                          onClick={() => setFormData({ ...formData, rating: s })}
                          className="p-1 transition-transform hover:scale-110"
                        >
                          <Star
                            size={22}
                            className={
                              s <= formData.rating
                                ? "fill-amber-400 text-amber-400"
                                : "text-[var(--border)]"
                            }
                          />
                        </button>
                      ))}
                      <span className="font-mono text-xs text-[var(--muted)] ml-2">
                        {formData.rating} of 5 stars
                      </span>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <label className="flex flex-col gap-1.5">
                      <span className="text-label">Your Name *</span>
                      <input
                        type="text"
                        required
                        value={formData.reviewerName}
                        onChange={(e) => setFormData({ ...formData, reviewerName: e.target.value })}
                        placeholder="Alex Morgan"
                        className="rounded-lg border border-[var(--border)] bg-[var(--background)] px-3.5 py-2.5 text-xs text-[var(--foreground)] outline-none focus:border-[var(--accent)]"
                      />
                    </label>
                    <label className="flex flex-col gap-1.5">
                      <span className="text-label">Company (Optional)</span>
                      <input
                        type="text"
                        value={formData.reviewerCompany}
                        onChange={(e) => setFormData({ ...formData, reviewerCompany: e.target.value })}
                        placeholder="Apex Technologies"
                        className="rounded-lg border border-[var(--border)] bg-[var(--background)] px-3.5 py-2.5 text-xs text-[var(--foreground)] outline-none focus:border-[var(--accent)]"
                      />
                    </label>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <label className="flex flex-col gap-1.5">
                      <span className="text-label">Role / Title (Optional)</span>
                      <input
                        type="text"
                        value={formData.reviewerRole}
                        onChange={(e) => setFormData({ ...formData, reviewerRole: e.target.value })}
                        placeholder="Head of Product"
                        className="rounded-lg border border-[var(--border)] bg-[var(--background)] px-3.5 py-2.5 text-xs text-[var(--foreground)] outline-none focus:border-[var(--accent)]"
                      />
                    </label>
                    <label className="flex flex-col gap-1.5">
                      <span className="text-label">Headline / Title (Optional)</span>
                      <input
                        type="text"
                        value={formData.title}
                        onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                        placeholder="Uncompromising craftsmanship"
                        className="rounded-lg border border-[var(--border)] bg-[var(--background)] px-3.5 py-2.5 text-xs text-[var(--foreground)] outline-none focus:border-[var(--accent)]"
                      />
                    </label>
                  </div>

                  <label className="flex flex-col gap-1.5">
                    <span className="text-label">Your Review *</span>
                    <textarea
                      required
                      rows={4}
                      value={formData.body}
                      onChange={(e) => setFormData({ ...formData, body: e.target.value })}
                      placeholder="Describe your collaboration with Quanta, the deliverables, and the outcomes achieved..."
                      className="rounded-lg border border-[var(--border)] bg-[var(--background)] px-3.5 py-2.5 text-xs text-[var(--foreground)] outline-none focus:border-[var(--accent)]"
                    />
                  </label>

                  <div className="flex items-center justify-end gap-3 mt-4 pt-4 border-t border-[var(--border)]">
                    <button
                      type="button"
                      onClick={() => setShowSubmitModal(false)}
                      className="rounded-full px-5 py-2.5 font-mono text-xs uppercase tracking-wider text-[var(--secondary)] hover:text-[var(--foreground)]"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={submitting}
                      className="rounded-full bg-[var(--accent)] px-6 py-2.5 font-mono text-xs font-semibold uppercase tracking-wider text-[var(--accent-foreground)] hover:brightness-110 disabled:opacity-50"
                    >
                      {submitting ? "Submitting..." : "Submit Review"}
                    </button>
                  </div>
                </form>
              )}
            </div>
          </div>
        )}
      </Container>
    </section>
  );
}
