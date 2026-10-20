import Image from "@/components/ui/SafeImage";
import { CoverArt } from "@/components/projects/CoverArt";
import type { Project } from "@/lib/types";

// Abstract visual for projects that have no uploaded image yet.
export function ProjectVisual({
  type,
  images,
  title,
}: {
  type: Project["visualType"];
  images?: string[];
  title: string;
}) {
  if (images && images.length > 0 && images[0]) {
    return (
      <div className="relative h-full w-full overflow-hidden transition-transform duration-700 ease-out group-hover:scale-[1.03]">
        <Image
          src={images[0]}
          alt={title}
          fill
          sizes="(min-width: 1024px) 60vw, 100vw"
          className="object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-[var(--background)]/80 via-transparent to-transparent" />
      </div>
    );
  }

  return (
    <div className="relative h-full w-full overflow-hidden bg-[var(--background)] transition-transform duration-700 ease-out group-hover:scale-[1.02]">
      <CoverArt seed={title} />

      {type === "alpha" && (
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="flex aspect-square w-[60%] items-center justify-center rounded-full border border-[var(--border)]">
            <div className="aspect-square w-[60%] rounded-full border border-[var(--border)]" />
          </div>
          <div className="absolute left-0 top-0 h-full w-full bg-gradient-to-br from-transparent via-transparent to-[var(--border)] opacity-30" />
        </div>
      )}

      {type === "nova" && (
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="h-[1px] w-[70%] rotate-45 bg-gradient-to-r from-transparent via-[var(--border)] to-transparent" />
          <div className="absolute h-[1px] w-[70%] -rotate-45 bg-gradient-to-r from-transparent via-[var(--border)] to-transparent" />
          <div className="h-16 w-16 border border-[var(--border)] bg-[var(--surface-hover)]" />
        </div>
      )}

      {type === "orbit" && (
        <div className="absolute inset-0 flex items-center justify-center">
          <div
            className="h-full w-full"
            style={{
              background:
                "radial-gradient(circle at 70% 30%, var(--surface-hover) 0%, transparent 40%)",
            }}
          />
          <div className="aspect-square w-[40%] rotate-12 border-b border-l border-[var(--border)]" />
        </div>
      )}

      {type === "custom" && (
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="aspect-square w-[50%] rotate-6 rounded-xl border border-[var(--accent)]/30" />
        </div>
      )}

      <div
        className="pointer-events-none absolute inset-0 opacity-50"
        style={{
          backgroundSize: "24px 24px",
          backgroundImage:
            "linear-gradient(to right, var(--grid-line) 1px, transparent 1px), linear-gradient(to bottom, var(--grid-line) 1px, transparent 1px)",
          maskImage:
            "radial-gradient(ellipse 80% 80% at 50% 50%, black, transparent)",
        }}
      />
    </div>
  );
}
