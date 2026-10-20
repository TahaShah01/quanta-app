// Reviews — data model and file-backed persistence layer.
//
// Reviews go through a moderation workflow:
//   pending  → awaiting admin decision
//   approved → public, may appear on homepage and /reviews
//   rejected → not shown publicly
//
// A "featured" flag on approved reviews controls which ones appear on the homepage.
//
// BACKEND NOTE: replace the load/save functions with database calls when migrating
// off the file-backed store. Nothing outside this file reads reviews.json directly.

import { readJSON, writeJSON } from "@/lib/content";

export type ReviewStatus = "pending" | "approved" | "rejected";

export interface Review {
  id: string;
  /** Display name the reviewer wants shown */
  reviewerName: string;
  /** Optional: company/organization */
  reviewerCompany: string;
  /** Optional: job title */
  reviewerRole: string;
  /** 1–5 stars */
  rating: number;
  /** Short headline (optional) */
  title: string;
  /** The review body */
  body: string;
  /** Which portal account submitted this */
  portalAccountId: string;
  /** Associated completed engagement/project */
  projectId?: string;
  projectName?: string;
  /** Moderation status */
  status: ReviewStatus;
  /** Whether this appears on the homepage testimonials */
  featured: boolean;
  /** ISO datetime of submission */
  submittedAt: string;
  /** ISO datetime of last status change */
  moderatedAt: string;
  /** Internal moderation note (admin only, never exposed publicly) */
  moderationNote: string;
  /** Display order (admin-controlled for featured reviews) */
  order: number;
}

/** What the public-facing website sees — no internal fields */
export type PublicReview = Omit<Review, "moderationNote" | "portalAccountId">;

interface ReviewsFile {
  reviews: Review[];
}

function load(): ReviewsFile {
  try {
    const data = readJSON<ReviewsFile>("reviews.json");
    return { reviews: Array.isArray(data.reviews) ? data.reviews : [] };
  } catch {
    return { reviews: [] };
  }
}

function save(file: ReviewsFile) {
  writeJSON("reviews.json", file);
}

function toPublic(r: Review): PublicReview {
  const { moderationNote: _note, portalAccountId: _pid, ...rest } = r;
  void _note; void _pid;
  return rest;
}

export function listReviews(): Review[] {
  return load().reviews;
}

export function listApprovedReviews(): PublicReview[] {
  return load()
    .reviews
    .filter((r) => r.status === "approved")
    .sort((a, b) => a.order - b.order || new Date(b.submittedAt).getTime() - new Date(a.submittedAt).getTime())
    .map(toPublic);
}

export function listFeaturedReviews(): PublicReview[] {
  return listApprovedReviews().filter((r) => r.featured);
}

export function findReviewById(id: string): Review | undefined {
  return load().reviews.find((r) => r.id === id);
}

export function findReviewByPortalAccountId(portalAccountId: string): Review | undefined {
  if (!portalAccountId) return undefined;
  return load().reviews.find((r) => r.portalAccountId === portalAccountId);
}

export function createReview(
  input: Pick<Review, "reviewerName" | "reviewerCompany" | "reviewerRole" | "rating" | "title" | "body"> & {
    portalAccountId: string;
    projectId?: string;
    projectName?: string;
  }
): Review {
  const file = load();
  const review: Review = {
    id: `review-${Date.now()}`,
    reviewerName: input.reviewerName.trim(),
    reviewerCompany: input.reviewerCompany?.trim() ?? "",
    reviewerRole: input.reviewerRole?.trim() ?? "",
    rating: Math.max(1, Math.min(5, Math.round(input.rating))),
    title: input.title?.trim() ?? "",
    body: input.body.trim(),
    portalAccountId: input.portalAccountId,
    projectId: input.projectId ?? "",
    projectName: input.projectName ?? "",
    status: "pending",
    featured: false,
    submittedAt: new Date().toISOString(),
    moderatedAt: "",
    moderationNote: "",
    order: file.reviews.length + 1,
  };
  file.reviews.push(review);
  save(file);
  return review;
}

export function updateReview(
  id: string,
  patch: Partial<Omit<Review, "id" | "submittedAt">>
): Review | undefined {
  const file = load();
  const index = file.reviews.findIndex((r) => r.id === id);
  if (index === -1) return undefined;
  const now = new Date().toISOString();
  const wasModerated =
    patch.status !== undefined && patch.status !== file.reviews[index].status;
  file.reviews[index] = {
    ...file.reviews[index],
    ...patch,
    id,
    moderatedAt: wasModerated ? now : file.reviews[index].moderatedAt,
  };
  save(file);
  return file.reviews[index];
}

export function deleteReview(id: string): boolean {
  const file = load();
  const next = file.reviews.filter((r) => r.id !== id);
  if (next.length === file.reviews.length) return false;
  save({ reviews: next });
  return true;
}

export function getReviewStats(): {
  total: number;
  pending: number;
  approved: number;
  rejected: number;
  averageRating: number;
} {
  const reviews = load().reviews;
  const approved = reviews.filter((r) => r.status === "approved");
  const avg =
    approved.length > 0
      ? approved.reduce((sum, r) => sum + r.rating, 0) / approved.length
      : 0;
  return {
    total: reviews.length,
    pending: reviews.filter((r) => r.status === "pending").length,
    approved: approved.length,
    rejected: reviews.filter((r) => r.status === "rejected").length,
    averageRating: Math.round(avg * 10) / 10,
  };
}

import crypto from "crypto";

interface RateLimitStore {
  [hash: string]: number[];
}

function hashClientIdentifier(ip: string): string {
  return crypto.createHash("sha256").update(ip + "_quanta_rl_salt").digest("hex").slice(0, 20);
}

/** Rate-limiting: max 3 submissions per IP per 24 hours (file-backed, persistent across restarts) */
export function canSubmitReview(ip: string): boolean {
  const now = Date.now();
  const oneDayAgo = now - 24 * 60 * 60 * 1000;
  const key = hashClientIdentifier(ip || "unknown");

  let store: RateLimitStore = {};
  try {
    store = readJSON<RateLimitStore>("rate-limits.json");
  } catch {
    store = {};
  }

  // Purge expired records across all entries to prevent file growth
  for (const k of Object.keys(store)) {
    store[k] = (store[k] || []).filter((t) => t > oneDayAgo);
    if (store[k].length === 0) delete store[k];
  }

  const clientTimestamps = store[key] || [];
  if (clientTimestamps.length >= 3) {
    return false;
  }

  clientTimestamps.push(now);
  store[key] = clientTimestamps;

  try {
    writeJSON("rate-limits.json", store);
  } catch {
    // Non-fatal if disk write encounters unexpected error
  }

  return true;
}

