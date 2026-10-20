import { PageSkeleton } from "@/components/ui/PageSkeleton";

export default function BlogPostLoading() {
  return <PageSkeleton body="article" lines={3} />;
}
