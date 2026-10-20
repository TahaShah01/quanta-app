"use client";

import Link from "next/link";
import { useSiteSettings } from "@/components/layout/SiteProvider";

interface AvailabilityBadgeProps {
  className?: string;
  showLink?: boolean;
}

export function AvailabilityBadge({ className = "", showLink = true }: AvailabilityBadgeProps) {
  const config = useSiteSettings()?.availability;

  if (!config || !config.enabled) return null;

  const colorMap: Record<string, { dot: string; ping: string; border: string }> = {
    green: {
      dot: "bg-emerald-400",
      ping: "bg-emerald-400",
      border: "border-emerald-500/20 bg-emerald-500/5 text-emerald-300",
    },
    amber: {
      dot: "bg-amber-400",
      ping: "bg-amber-400",
      border: "border-amber-500/20 bg-amber-500/5 text-amber-300",
    },
    purple: {
      dot: "bg-purple-400",
      ping: "bg-purple-400",
      border: "border-purple-500/20 bg-purple-500/5 text-purple-300",
    },
    red: {
      dot: "bg-rose-400",
      ping: "bg-rose-400",
      border: "border-rose-500/20 bg-rose-500/5 text-rose-300",
    },
  };

  const currentTheme = colorMap[config.badge_color || "green"] || colorMap.green;

  const content = (
    <div
      className={`inline-flex items-center gap-2.5 px-3 py-1 rounded-full text-xs font-mono border transition-all ${currentTheme.border} ${className}`}
    >
      <span className="relative flex h-2 w-2">
        <span
          className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${currentTheme.ping}`}
        />
        <span className={`relative inline-flex rounded-full h-2 w-2 ${currentTheme.dot}`} />
      </span>
      <span className="truncate">{config.message || "Available for select Q1 projects"}</span>
    </div>
  );

  if (showLink) {
    return (
      <Link href="/contact" className="hover:opacity-90 transition-opacity">
        {content}
      </Link>
    );
  }

  return content;
}
