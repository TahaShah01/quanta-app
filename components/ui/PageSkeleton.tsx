import { Container } from "@/components/ui/Container";
import { Skeleton, CardSkeleton, ProjectCardSkeleton } from "@/components/ui/Skeleton";

type Body = "cards" | "projects" | "people" | "form" | "article" | "list";

interface PageSkeletonProps {
  /** What sits under the hero, so the placeholder matches the real page */
  body?: Body;
  /** Hero headline lines (the real pages use 2-3) */
  lines?: number;
}

/** Mirrors PageHero's spacing, then a body shaped like the page it stands in for. */
export function PageSkeleton({ body = "cards", lines = 2 }: PageSkeletonProps) {
  return (
    <div role="status" aria-busy="true" aria-label="Loading">
      <section className="w-full border-b border-[var(--border)] pb-20 pt-36 md:pb-28 md:pt-44">
        <Container>
          <div className="flex max-w-3xl flex-col">
            <Skeleton className="mb-6 h-7 w-36 rounded-full" />
            <div className="mb-8 flex flex-col gap-3">
              {Array.from({ length: lines }).map((_, i) => (
                <Skeleton
                  key={i}
                  className="h-[clamp(2.25rem,6vw,6rem)]"
                  style={{ width: `${[82, 58, 70][i % 3]}%` }}
                />
              ))}
            </div>
            <Skeleton className="mb-2 h-4 w-full max-w-lg" />
            <Skeleton className="h-4 w-2/3 max-w-sm" />
          </div>
        </Container>
      </section>

      <section className="w-full py-20 md:py-28">
        <Container>
          {body === "cards" && (
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-3">
              {Array.from({ length: 6 }).map((_, i) => (
                <CardSkeleton key={i} />
              ))}
            </div>
          )}

          {body === "projects" && (
            <div className="grid grid-cols-1 gap-8 md:grid-cols-2">
              {Array.from({ length: 4 }).map((_, i) => (
                <ProjectCardSkeleton key={i} />
              ))}
            </div>
          )}

          {body === "people" && (
            <div className="grid grid-cols-1 gap-10 sm:grid-cols-2 lg:grid-cols-3">
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="flex flex-col gap-4">
                  <Skeleton className="aspect-[3/4] w-full rounded-2xl" />
                  <Skeleton className="h-6 w-1/2" />
                  <Skeleton className="h-4 w-1/3" />
                </div>
              ))}
            </div>
          )}

          {body === "form" && (
            <div className="grid grid-cols-1 gap-12 lg:grid-cols-12">
              <div className="flex flex-col gap-6 lg:col-span-5">
                {Array.from({ length: 3 }).map((_, i) => (
                  <Skeleton key={i} className="h-20 w-full rounded-xl" />
                ))}
              </div>
              <div className="flex flex-col gap-4 lg:col-span-7">
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <Skeleton className="h-12 w-full rounded-xl" />
                  <Skeleton className="h-12 w-full rounded-xl" />
                </div>
                <Skeleton className="h-12 w-full rounded-xl" />
                <Skeleton className="h-40 w-full rounded-xl" />
                <Skeleton className="h-12 w-40 rounded-full" />
              </div>
            </div>
          )}

          {body === "article" && (
            <div className="mx-auto flex max-w-3xl flex-col gap-4">
              <Skeleton className="mb-6 aspect-[16/9] w-full rounded-2xl" />
              {Array.from({ length: 9 }).map((_, i) => (
                <Skeleton key={i} className="h-4" style={{ width: `${i % 4 === 3 ? 60 : 100}%` }} />
              ))}
            </div>
          )}

          {body === "list" && (
            <div className="flex flex-col divide-y divide-[var(--border)]">
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="flex items-center gap-6 py-6">
                  <Skeleton className="h-4 w-12" />
                  <Skeleton className="h-6 w-1/3" />
                  <Skeleton className="ml-auto hidden h-4 w-1/4 md:block" />
                </div>
              ))}
            </div>
          )}
        </Container>
      </section>
    </div>
  );
}
