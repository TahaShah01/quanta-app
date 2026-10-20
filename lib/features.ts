import type { FeatureFlags } from "@/lib/types";

/** Keep links whose feature switch is on (or that have none). Client-safe. */
export function visibleLinks<T extends { feature?: keyof FeatureFlags }>(
  links: T[],
  features: FeatureFlags
): T[] {
  return links.filter((l) => !l.feature || features[l.feature]);
}
