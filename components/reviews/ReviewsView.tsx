"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
  Star,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  MessageSquarePlus,
  Search,
  Lock,
  Clock,
  ArrowRight,
  Sparkles,
  SlidersHorizontal,
} from "lucide-react";
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

interface ClientState {
  account: {
    id: string;
    email: string;
    name: string;
    company: string;
    project: {
      name: string;
      status: string;
    };
  } | null;
  reviewEligibility?: {
    eligible: boolean;
    isCompleted: boolean;
    hasReviewed: boolean;
    existingReview: {
      id: string;
      rating: number;
      title: string;
      body: string;
      status: string;
      submittedAt: string;
    } | null;
  };
}

export function ReviewsView({ initialReviews, stats }: ReviewsViewProps) {
  const [reviews] = useState<PublicReview[]>(initialReviews);
  const [filterRating, setFilterRating] = useState<number | "all">("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState<"newest" | "highest" | "lowest">("newest");

  // Portal Authentication & Eligibility State
  const [clientState, setClientState] = useState<ClientState | null>(null);
  const [loadingAuth, setLoadingAuth] = useState(false);
  const [showModal, setShowModal] = useState(false);

  // Form State for Eligible Clients
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

  // Check portal session
  async function checkClientEligibility() {
    setLoadingAuth(true);
    try {
      const res = await fetch("/api/portal/me");
      if (res.ok) {
        const data: ClientState = await res.json();
        setClientState(data);
        if (data.account) {
          setFormData((prev) => ({
            ...prev,
            reviewerName: data.account?.name || "",
            reviewerCompany: data.account?.company || "",
          }));
        }
      } else {
        setClientState({ account: null });
      }
    } catch {
      setClientState({ account: null });
    } finally {
      setLoadingAuth(false);
    }
  }

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- eager eligibility check on mount
    void checkClientEligibility();
  }, []);

  function handleOpenReviewModal() {
    setShowModal(true);
  }

  // Sorting & Filtering
  const filtered = reviews
    .filter((r) => {
      if (filterRating !== "all" && r.rating !== filterRating) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchName = r.reviewerName.toLowerCase().includes(q);
        const matchCompany = (r.reviewerCompany || "").toLowerCase().includes(q);
        const matchBody = r.body.toLowerCase().includes(q);
        const matchTitle = (r.title || "").toLowerCase().includes(q);
        const matchProject = (r.projectName || "").toLowerCase().includes(q);
        return matchName || matchCompany || matchBody || matchTitle || matchProject;
      }
      return true;
    })
    .sort((a, b) => {
      if (sortBy === "highest") return b.rating - a.rating;
      if (sortBy === "lowest") return a.rating - b.rating;
      return new Date(b.submittedAt).getTime() - new Date(a.submittedAt).getTime();
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
        // Refresh eligibility so state shifts to hasReviewed
        checkClientEligibility();
        setTimeout(() => {
          setShowModal(false);
          setSubmitSuccess(false);
        }, 3500);
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
              <div className="flex items-center gap-2 mb-3">
                <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-500/20 bg-emerald-500/10 px-2.5 py-1 font-mono text-[10px] uppercase tracking-wider text-emerald-400">
                  <ShieldCheck size={12} />
                  100% Verified Clients
                </span>
              </div>
              <span className="text-label mb-2 block">Client Satisfaction Index</span>
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
                onClick={handleOpenReviewModal}
                disabled={loadingAuth}
                className="inline-flex items-center gap-2 rounded-full bg-[var(--accent)] px-6 py-3 font-mono text-xs font-semibold uppercase tracking-wider text-[var(--accent-foreground)] transition-all hover:scale-105 active:scale-95 disabled:opacity-50"
              >
                <MessageSquarePlus size={15} />
                Write a Review
              </button>
              <p className="mt-2.5 font-mono text-[11px] text-[var(--muted)]">
                Exclusive to verified Quanta clients with completed engagements.
              </p>
            </div>
          </div>

          <div className="lg:col-span-7 flex flex-col justify-center rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-8 md:p-10">
            <div className="flex items-center justify-between mb-4">
              <span className="text-label block">Rating Breakdown</span>
              <span className="font-mono text-[11px] text-[var(--muted)]">Independent Audit Standard</span>
            </div>
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

        {/* Filter, Sort and Search Bar */}
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

          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-2 rounded-full border border-[var(--border)] bg-[var(--surface)] px-3 py-1.5 text-xs text-[var(--secondary)]">
              <SlidersHorizontal size={13} className="text-[var(--muted)]" />
              <span className="font-mono text-[11px] uppercase tracking-wider text-[var(--muted)]">Sort:</span>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as "newest" | "highest" | "lowest")}
                className="bg-transparent font-mono text-xs text-[var(--foreground)] outline-none cursor-pointer"
              >
                <option value="newest" className="bg-[var(--surface)] text-[var(--foreground)]">Newest First</option>
                <option value="highest" className="bg-[var(--surface)] text-[var(--foreground)]">Highest Rating</option>
                <option value="lowest" className="bg-[var(--surface)] text-[var(--foreground)]">Lowest Rating</option>
              </select>
            </div>

            <div className="relative min-w-[220px]">
              <Search size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[var(--muted)]" />
              <input
                type="text"
                placeholder="Search reviews..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full rounded-full border border-[var(--border)] bg-[var(--surface)] pl-9 pr-4 py-1.5 text-xs text-[var(--foreground)] outline-none transition-colors focus:border-[var(--accent)]"
              />
            </div>
          </div>
        </div>

        {/* Reviews Grid */}
        {filtered.length === 0 ? (
          <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-12 text-center">
            <p className="text-body text-[var(--muted)]">No verified reviews found matching your criteria.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filtered.map((review) => (
              <article
                key={review.id}
                className="flex flex-col justify-between rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-7 transition-all duration-300 hover:border-[var(--border-hover)] hover:-translate-y-0.5"
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

        {/* Verification & Submission Modal */}
        {showModal && (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-md p-4 animate-in fade-in duration-200"
            onClick={() => setShowModal(false)}
          >
            <div
              className="relative w-full max-w-lg rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-8 shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Close Button */}
              <button
                type="button"
                onClick={() => setShowModal(false)}
                className="absolute right-6 top-6 rounded-full p-1.5 text-[var(--muted)] hover:text-[var(--foreground)] transition-colors"
                aria-label="Close modal"
              >
                ✕
              </button>

              {/* STATE 1: Anonymous / Unauthenticated */}
              {!clientState?.account && (
                <div className="flex flex-col items-center text-center py-4">
                  <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl border border-[var(--border)] bg-[var(--surface-hover)] text-emerald-400 shadow-inner">
                    <Lock size={24} />
                  </div>
                  <span className="inline-flex items-center gap-1 font-mono text-[10px] uppercase tracking-widest text-emerald-400 mb-2">
                    <ShieldCheck size={12} />
                    Verified Client Gate
                  </span>
                  <h3 className="text-xl font-medium text-[var(--foreground)] tracking-tight">
                    Client Authentication Required
                  </h3>
                  <p className="text-sm text-[var(--secondary)] mt-3 leading-relaxed max-w-md">
                    To maintain strict authenticity and eliminate unverified feedback, Quanta client reviews are restricted exclusively to verified clients with completed engagements.
                  </p>
                  <p className="text-xs text-[var(--muted)] mt-2 max-w-sm">
                    If you are an active or previous client, please sign in to your Client Portal to submit project feedback.
                  </p>

                  <div className="mt-8 flex flex-col sm:flex-row items-center gap-3 w-full">
                    <Link
                      href="/portal"
                      className="w-full inline-flex items-center justify-center gap-2 rounded-full bg-[var(--accent)] px-6 py-3 font-mono text-xs font-semibold uppercase tracking-wider text-[var(--accent-foreground)] transition-all hover:brightness-110"
                    >
                      Sign In to Client Portal
                      <ArrowRight size={14} />
                    </Link>
                    <button
                      type="button"
                      onClick={() => setShowModal(false)}
                      className="w-full sm:w-auto rounded-full border border-[var(--border)] px-5 py-3 font-mono text-xs uppercase tracking-wider text-[var(--secondary)] hover:text-[var(--foreground)]"
                    >
                      Dismiss
                    </button>
                  </div>
                </div>
              )}

              {/* STATE 2: Authenticated Client, but Project In-Progress (Ineligible) */}
              {clientState?.account && !clientState.reviewEligibility?.isCompleted && (
                <div className="flex flex-col items-center text-center py-4">
                  <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl border border-amber-500/20 bg-amber-500/10 text-amber-400 shadow-inner">
                    <Clock size={24} />
                  </div>
                  <span className="inline-flex items-center gap-1 font-mono text-[10px] uppercase tracking-widest text-amber-400 mb-2">
                    Engagement In Progress
                  </span>
                  <h3 className="text-xl font-medium text-[var(--foreground)] tracking-tight">
                    Review Available After Completion
                  </h3>
                  <p className="text-sm text-[var(--secondary)] mt-3 leading-relaxed max-w-md">
                    Welcome back, <strong className="text-[var(--foreground)]">{clientState.account.name}</strong>. Your project &ldquo;{clientState.account.project?.name || "Active Engagement"}&rdquo; is currently in progress (Status: <span className="font-mono text-xs uppercase text-amber-400">{clientState.account.project?.status}</span>).
                  </p>
                  <p className="text-xs text-[var(--muted)] mt-2 max-w-sm">
                    Client reviews automatically unlock once all milestones and deliverables have been officially approved and delivered.
                  </p>

                  <div className="mt-8 flex flex-col sm:flex-row items-center gap-3 w-full">
                    <Link
                      href="/portal"
                      className="w-full inline-flex items-center justify-center gap-2 rounded-full bg-[var(--accent)] px-6 py-3 font-mono text-xs font-semibold uppercase tracking-wider text-[var(--accent-foreground)] transition-all hover:brightness-110"
                    >
                      Go to Project Workspace
                      <ArrowRight size={14} />
                    </Link>
                    <button
                      type="button"
                      onClick={() => setShowModal(false)}
                      className="w-full sm:w-auto rounded-full border border-[var(--border)] px-5 py-3 font-mono text-xs uppercase tracking-wider text-[var(--secondary)] hover:text-[var(--foreground)]"
                    >
                      Close
                    </button>
                  </div>
                </div>
              )}

              {/* STATE 3: Authenticated Client with Completed Project who Already Reviewed */}
              {clientState?.account && clientState.reviewEligibility?.hasReviewed && (
                <div className="flex flex-col items-center text-center py-4">
                  <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl border border-emerald-500/20 bg-emerald-500/10 text-emerald-400 shadow-inner">
                    <CheckCircle2 size={24} />
                  </div>
                  <span className="inline-flex items-center gap-1 font-mono text-[10px] uppercase tracking-widest text-emerald-400 mb-2">
                    Review On Record
                  </span>
                  <h3 className="text-xl font-medium text-[var(--foreground)] tracking-tight">
                    Thank You for Your Feedback
                  </h3>
                  <p className="text-sm text-[var(--secondary)] mt-3 leading-relaxed max-w-md">
                    You have already submitted a verified review for &ldquo;{clientState.account.project?.name}&rdquo;.
                  </p>

                  {clientState.reviewEligibility.existingReview && (
                    <div className="mt-4 w-full rounded-xl border border-[var(--border)] bg-[var(--surface-hover)] p-4 text-left">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-1">
                          {Array.from({ length: 5 }).map((_, i) => (
                            <Star
                              key={i}
                              size={12}
                              className={
                                i < (clientState.reviewEligibility?.existingReview?.rating || 5)
                                  ? "fill-amber-400 text-amber-400"
                                  : "text-[var(--border)]"
                              }
                            />
                          ))}
                        </div>
                        <span className="font-mono text-[10px] uppercase tracking-wider text-emerald-400">
                          Status: {clientState.reviewEligibility.existingReview.status}
                        </span>
                      </div>
                      {clientState.reviewEligibility.existingReview.title && (
                        <p className="font-medium text-xs text-[var(--foreground)] mb-1">
                          &ldquo;{clientState.reviewEligibility.existingReview.title}&rdquo;
                        </p>
                      )}
                      <p className="text-xs text-[var(--secondary)] line-clamp-2">
                        {clientState.reviewEligibility.existingReview.body}
                      </p>
                    </div>
                  )}

                  <div className="mt-8 flex flex-col sm:flex-row items-center gap-3 w-full">
                    <Link
                      href="/portal"
                      className="w-full inline-flex items-center justify-center gap-2 rounded-full bg-[var(--foreground)] px-6 py-3 font-mono text-xs font-semibold uppercase tracking-wider text-[var(--background)] transition-all hover:opacity-90"
                    >
                      Return to Portal
                    </Link>
                    <button
                      type="button"
                      onClick={() => setShowModal(false)}
                      className="w-full sm:w-auto rounded-full border border-[var(--border)] px-5 py-3 font-mono text-xs uppercase tracking-wider text-[var(--secondary)] hover:text-[var(--foreground)]"
                    >
                      Close
                    </button>
                  </div>
                </div>
              )}

              {/* STATE 4: Authenticated Client, Completed Project, Eligible to Submit */}
              {clientState?.account && clientState.reviewEligibility?.eligible && (
                <div>
                  <div className="flex items-center justify-between mb-6">
                    <div>
                      <span className="inline-flex items-center gap-1 font-mono text-[10px] uppercase tracking-widest text-emerald-400 mb-1">
                        <Sparkles size={11} />
                        Verified Project Feedback
                      </span>
                      <h3 className="text-xl font-medium text-[var(--foreground)]">Share Your Experience</h3>
                      <p className="text-xs text-[var(--secondary)] mt-0.5">
                        Project: <strong className="text-[var(--foreground)]">{clientState.account.project?.name}</strong>
                      </p>
                    </div>
                  </div>

                  {submitSuccess ? (
                    <div className="flex flex-col items-center justify-center py-10 text-center gap-3">
                      <CheckCircle2 size={48} className="text-emerald-400" />
                      <h4 className="text-lg font-medium text-[var(--foreground)]">Review Submitted!</h4>
                      <p className="text-xs text-[var(--secondary)] max-w-sm">
                        Thank you for your valuable feedback. Your verified review has been submitted for moderation and will appear publicly once approved.
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
                        <label className="text-label">Rating *</label>
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
                            className="rounded-lg border border-[var(--border)] bg-[var(--background)] px-3.5 py-2.5 text-xs text-[var(--foreground)] outline-none focus:border-[var(--accent)]"
                          />
                        </label>
                        <label className="flex flex-col gap-1.5">
                          <span className="text-label">Company</span>
                          <input
                            type="text"
                            value={formData.reviewerCompany}
                            onChange={(e) => setFormData({ ...formData, reviewerCompany: e.target.value })}
                            className="rounded-lg border border-[var(--border)] bg-[var(--background)] px-3.5 py-2.5 text-xs text-[var(--foreground)] outline-none focus:border-[var(--accent)]"
                          />
                        </label>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <label className="flex flex-col gap-1.5">
                          <span className="text-label">Role / Title</span>
                          <input
                            type="text"
                            value={formData.reviewerRole}
                            onChange={(e) => setFormData({ ...formData, reviewerRole: e.target.value })}
                            placeholder="Founder / CEO"
                            className="rounded-lg border border-[var(--border)] bg-[var(--background)] px-3.5 py-2.5 text-xs text-[var(--foreground)] outline-none focus:border-[var(--accent)]"
                          />
                        </label>
                        <label className="flex flex-col gap-1.5">
                          <span className="text-label">Review Headline</span>
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
                        <span className="text-label">Your Review (Minimum 20 characters) *</span>
                        <textarea
                          required
                          rows={4}
                          value={formData.body}
                          onChange={(e) => setFormData({ ...formData, body: e.target.value })}
                          placeholder="Describe the collaboration, the quality of execution, deliverables, and business outcomes achieved with Quanta..."
                          className="rounded-lg border border-[var(--border)] bg-[var(--background)] px-3.5 py-2.5 text-xs text-[var(--foreground)] outline-none focus:border-[var(--accent)]"
                        />
                      </label>

                      <div className="flex items-center justify-end gap-3 mt-4 pt-4 border-t border-[var(--border)]">
                        <button
                          type="button"
                          onClick={() => setShowModal(false)}
                          className="rounded-full px-5 py-2.5 font-mono text-xs uppercase tracking-wider text-[var(--secondary)] hover:text-[var(--foreground)]"
                        >
                          Cancel
                        </button>
                        <button
                          type="submit"
                          disabled={submitting}
                          className="rounded-full bg-[var(--accent)] px-6 py-2.5 font-mono text-xs font-semibold uppercase tracking-wider text-[var(--accent-foreground)] hover:brightness-110 disabled:opacity-50"
                        >
                          {submitting ? "Submitting..." : "Submit Verified Review"}
                        </button>
                      </div>
                    </form>
                  )}
                </div>
              )}
            </div>
          </div>
        )}
      </Container>
    </section>
  );
}

