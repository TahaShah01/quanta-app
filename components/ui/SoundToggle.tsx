"use client";

import { Volume2, VolumeX } from "lucide-react";
import { setSoundEnabled, useSoundEnabled } from "@/lib/sound";

export function SoundToggle({ className = "" }: { className?: string }) {
  const on = useSoundEnabled();

  return (
    <button
      type="button"
      onClick={() => setSoundEnabled(!on)}
      aria-pressed={on}
      aria-label={on ? "Turn interface sounds off" : "Turn interface sounds on"}
      className={`flex h-10 w-10 items-center justify-center rounded-full text-[var(--secondary)] transition-colors hover:bg-[var(--accent-subtle)] hover:text-[var(--foreground)] ${className}`}
    >
      {on ? <Volume2 size={15} /> : <VolumeX size={15} />}
    </button>
  );
}
