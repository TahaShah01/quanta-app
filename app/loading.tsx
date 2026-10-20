export default function Loading() {
  return (
    <div className="flex min-h-[60vh] items-center justify-center">
      <div className="flex flex-col items-center gap-4">
        <span className="relative block h-px w-24 overflow-hidden bg-[var(--border-hover)]">
          <span className="animate-shimmer absolute inset-0 bg-[var(--foreground)]" />
        </span>
        <span className="font-mono text-[11px] uppercase tracking-[0.25em] text-[var(--muted)]">
          Loading
        </span>
      </div>
    </div>
  );
}
