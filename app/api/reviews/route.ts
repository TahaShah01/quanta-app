import { NextResponse } from "next/server";
import {
  canSubmitReview,
  createReview,
  findReviewByPortalAccountId,
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

/** POST — submit a new review (strictly verified client with completed project only) */
export async function POST(request: Request) {
  const forwarded = request.headers.get("x-forwarded-for");
  const ip =
    request.headers.get("cf-connecting-ip")?.trim() ||
    request.headers.get("x-real-ip")?.trim() ||
    (forwarded ? forwarded.split(",")[0].trim() : "local");

  // 1. Authenticate Client Portal Session
  let accountId = "";
  let accountName = "";
  let accountCompany = "";
  let projectName = "";

  try {
    const store = await cookies();
    const session = readSession(store.get(PORTAL_COOKIE)?.value);
    if (!session || session.role !== "client") {
      return NextResponse.json(
        {
          error:
            "Review submission is restricted to verified Quanta clients. Please sign in to your Client Portal to leave project feedback.",
        },
        { status: 401 }
      );
    }

    const account = findById(session.sub);
    if (!account || !account.active) {
      return NextResponse.json(
        { error: "Unauthorized or deactivated client account." },
        { status: 401 }
      );
    }

    // 2. Verify Completed Project Eligibility
    const project = account.project;
    const isCompleted = project && (project.status === "completed" || project.status === "launched");
    if (!isCompleted) {
      return NextResponse.json(
        {
          error: `Engagement in progress: Reviews unlock automatically once your project ('${
            project?.name || "Active Engagement"
          }') is completed and delivered. Current status: ${project?.status || "in-progress"}.`,
        },
        { status: 403 }
      );
    }

    // 3. Verify No Duplicate Reviews
    const existing = findReviewByPortalAccountId(account.id);
    if (existing) {
      return NextResponse.json(
        {
          error: `You have already submitted a review for '${
            project?.name || "your project"
          }'. Current status: ${existing.status}.`,
        },
        { status: 409 }
      );
    }

    accountId = account.id;
    accountName = account.name;
    accountCompany = account.company;
    projectName = project.name;
  } catch {
    return NextResponse.json(
      { error: "Authentication verification failed." },
      { status: 401 }
    );
  }

  // 4. Rate Limiting Check
  if (!canSubmitReview(ip)) {
    return NextResponse.json(
      { error: "Too many submissions. You can submit up to 3 reviews per day." },
      { status: 429 }
    );
  }

  // 5. Parse and Validate Review Input
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
    return NextResponse.json({ error: "Invalid request payload." }, { status: 400 });
  }

  if (!body.body?.trim() || body.body.trim().length < 20) {
    return NextResponse.json(
      { error: "Review text must be at least 20 characters long." },
      { status: 400 }
    );
  }

  const rating = Number(body.rating);
  if (!Number.isInteger(rating) || rating < 1 || rating > 5) {
    return NextResponse.json(
      { error: "Rating must be an integer between 1 and 5 stars." },
      { status: 400 }
    );
  }

  // Sanitize text inputs
  const sanitize = (s: string) => s.replace(/[<>]/g, "").slice(0, 2000);

  // 6. Create Verified Review Record
  const review = createReview({
    reviewerName: sanitize(body.reviewerName?.trim() || accountName),
    reviewerCompany: sanitize(body.reviewerCompany?.trim() || accountCompany),
    reviewerRole: sanitize(body.reviewerRole?.trim() ?? "Verified Client"),
    rating,
    title: sanitize(body.title?.trim() ?? ""),
    body: sanitize(body.body.trim()),
    portalAccountId: accountId,
    projectName: projectName,
  });

  return NextResponse.json(
    {
      success: true,
      message:
        "Your verified review has been successfully submitted and forwarded to Quanta studio moderation.",
      id: review.id,
      review,
    },
    { status: 201 }
  );
}
