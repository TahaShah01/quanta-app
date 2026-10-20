import { NextResponse } from "next/server";
import { getReviewStats, listReviews } from "@/lib/reviews";
import { requireAdmin } from "@/lib/api-auth";

/** GET — admin: all reviews regardless of status, with full detail */
export async function GET() {
  const denied = await requireAdmin();
  if (denied) return denied;
  const reviews = listReviews().sort(
    (a, b) => new Date(b.submittedAt).getTime() - new Date(a.submittedAt).getTime()
  );
  const stats = getReviewStats();
  return NextResponse.json({ reviews, stats });
}
