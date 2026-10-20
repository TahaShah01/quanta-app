"use client";

import { createContext, useContext, type ReactNode } from "react";
import type { FeatureFlags, SiteSettings } from "@/lib/types";
import type { NavigationContent } from "@/lib/pages-types";
import type { SearchEntry } from "@/lib/site";

interface SiteContextValue {
  settings: SiteSettings | null;
  searchIndex: SearchEntry[];
  navigation: NavigationContent | null;
  features: FeatureFlags;
}

const SiteContext = createContext<SiteContextValue>({
  settings: null,
  searchIndex: [],
  navigation: null,
  features: { partners: true, clients: true, clientsOnHome: true, portal: true },
});

export function SiteProvider({
  children,
  ...value
}: SiteContextValue & { children: ReactNode }) {
  return <SiteContext.Provider value={value}>{children}</SiteContext.Provider>;
}

export const useSite = () => useContext(SiteContext);
export const useSiteSettings = () => useContext(SiteContext).settings;
