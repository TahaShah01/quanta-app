import type { Metadata } from "next";
import { PageHero } from "@/components/layout/PageHero";
import { PageCta } from "@/components/layout/PageCta";
import { ReviewsView } from "@/components/reviews/ReviewsView";
import { listApprovedReviews, getReviewStats } from "@/lib/reviews";

export const metadata: Metadata = {
  title: "Client Reviews & Verification — Quanta",
  description:
    "Verified feedback from founders, CTOs, and product leaders who partnered with Quanta for design, engineering, and digital systems.",
};

export default function ReviewsPage() {
  const reviews = listApprovedReviews();
  const rawStats = getReviewStats();

  // Calculate rating distribution
  const distribution: Record<number, number> = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };
  reviews.forEach((r) => {
    const star = Math.max(1, Math.min(5, Math.round(r.rating)));
    distribution[star] = (distribution[star] || 0) + 1;
  });

  const stats = {
    total: reviews.length,
    averageRating: rawStats.averageRating || 5.0,
    distribution,
  };

  return (
    <>
      <PageHero
        eyebrow="CLIENT EXPERIENCES"
        shape="drift"
        lines={[
          { text: "Verified words from" },
          { text: "trusted partners." },
        ]}
        body="Direct feedback from founders, technology leaders, and teams we've had the honor of building alongside."
        meta={`${String(reviews.length).padStart(2, "0")} REVIEWS`}
      />

      <ReviewsView initialReviews={reviews} stats={stats} />

      <PageCta />
    </>
  );
}
