import { NextResponse } from "next/server";
import {
  canSubmitReview,
  createReview,
  listApprovedReviews,
  getReviewStats,
} from "@/lib/reviews";
import { cookies } from "next/headers";
import { PORTAL_COOKIE, readSession } from "@/lib/auth";
import { findById } from "@/lib/portal";

/** GET — public list of approved reviews + aggregate stats */
export async function GET(request: Request) {
  const url = new URL(request.url);
  const featured = url.searchParams.get("featured") === "true";
  const reviews = listApprovedReviews();
  const list = featured ? reviews.filter((r) => r.featured) : reviews;
  const stats = getReviewStats();
  return NextResponse.json(
    { reviews: list, stats },
    { headers: { "Cache-Control": "public, s-maxage=60, stale-while-revalidate=120" } }
  );
}

/** POST — submit a new review (public or authenticated portal user) */
export async function POST(request: Request) {
  const forwarded = request.headers.get("x-forwarded-for");
  const ip =
    request.headers.get("cf-connecting-ip")?.trim() ||
    request.headers.get("x-real-ip")?.trim() ||
    (forwarded ? forwarded.split(",")[0].trim() : "local");

  if (!canSubmitReview(ip)) {
    return NextResponse.json(
      { error: "Too many submissions. You can submit up to 3 reviews per day." },
      { status: 429 }
    );
  }

  let body: {
    reviewerName?: string;
    reviewerCompany?: string;
    reviewerRole?: string;
    rating?: number;
    title?: string;
    body?: string;
  };

  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  // Validation
  if (!body.reviewerName?.trim()) {
    return NextResponse.json({ error: "Your name is required." }, { status: 400 });
  }
  if (!body.body?.trim() || body.body.trim().length < 20) {
    return NextResponse.json(
      { error: "Review text must be at least 20 characters." },
      { status: 400 }
    );
  }
  const rating = Number(body.rating);
  if (!Number.isInteger(rating) || rating < 1 || rating > 5) {
    return NextResponse.json(
      { error: "Rating must be a whole number between 1 and 5." },
      { status: 400 }
    );
  }

  // Sanitize text fields (basic XSS prevention — the admin displays these in React so they're escaped, but guard at input)
  const sanitize = (s: string) => s.replace(/[<>]/g, "").slice(0, 2000);

  // Try to associate with a portal account (optional)
  let portalAccountId = "";
  try {
    const store = await cookies();
    const session = readSession(store.get(PORTAL_COOKIE)?.value);
    if (session?.role === "client") {
      const account = findById(session.sub);
      if (account?.active) {
        portalAccountId = account.id;
        // Use portal account name if reviewer didn't fill in their own
      }
    }
  } catch {
    // No cookie context — that's fine for public submissions
  }

  const review = createReview({
    reviewerName: sanitize(body.reviewerName.trim()),
    reviewerCompany: sanitize(body.reviewerCompany?.trim() ?? ""),
    reviewerRole: sanitize(body.reviewerRole?.trim() ?? ""),
    rating,
    title: sanitize(body.title?.trim() ?? ""),
    body: sanitize(body.body.trim()),
    portalAccountId,
  });

  return NextResponse.json(
    {
      success: true,
      message: "Your review has been submitted and will appear after moderation.",
      id: review.id,
    },
    { status: 201 }
  );
}
