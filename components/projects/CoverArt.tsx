/** Generated cover for projects that have no image yet: a soft gradient tinted per project. */
export function CoverArt({ seed, label }: { seed: string; label?: string }) {
  let hash = 0;
  for (let i = 0; i < seed.length; i++) hash = (hash * 31 + seed.charCodeAt(i)) >>> 0;
  const hue = hash % 360;
  const hue2 = (hue + 70) % 360;
  const angle = 20 + (hash % 140);

  return (
    <div
      aria-hidden
      className="absolute inset-0 overflow-hidden"
      style={{
        background: `radial-gradient(60% 70% at ${20 + (hash % 50)}% ${20 + ((hash >> 3) % 50)}%, hsl(${hue} 70% 55% / 0.28), transparent 70%), radial-gradient(55% 65% at ${70 - (hash % 30)}% 80%, hsl(${hue2} 70% 55% / 0.2), transparent 70%), linear-gradient(${angle}deg, var(--surface-hover), var(--background))`,
      }}
    >
      <div
        className="absolute inset-0 opacity-40"
        style={{
          backgroundSize: "28px 28px",
          backgroundImage:
            "linear-gradient(to right, var(--grid-line) 1px, transparent 1px), linear-gradient(to bottom, var(--grid-line) 1px, transparent 1px)",
          maskImage: "radial-gradient(ellipse 75% 75% at 50% 50%, black, transparent)",
          WebkitMaskImage: "radial-gradient(ellipse 75% 75% at 50% 50%, black, transparent)",
        }}
      />
      {label && (
        <span className="absolute bottom-4 left-5 font-mono text-xs uppercase tracking-widest text-[var(--foreground)]/60">
          {label}
        </span>
      )}
    </div>
  );
}
