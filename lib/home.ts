// Server-side loaders for homepage content.
// Strings in the JSON may use tokens such as {teamCount}, {teamCountWord}
// and {TeamCountWord}; they are filled from live data so copy never goes stale.

import { readJSON } from "@/lib/content";
import type { HomeContent, TechStackContent } from "@/lib/home-types";

export type TokenMap = Record<string, string>;

const NUMBER_WORDS = [
  "zero",
  "one",
  "two",
  "three",
  "four",
  "five",
  "six",
  "seven",
  "eight",
  "nine",
  "ten",
  "eleven",
  "twelve",
];

function numberWord(n: number): string {
  return NUMBER_WORDS[n] ?? String(n);
}

function capitalize(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1);
}

export function buildTokens(
  counts: {
    team: number;
    services: number;
    projects: number;
    tools?: number;
  },
  extra: TokenMap = {}
): TokenMap {
  return {
    ...extra,
    toolCount: String(counts.tools ?? 0),
    teamCount: String(counts.team),
    teamCountWord: numberWord(counts.team),
    TeamCountWord: capitalize(numberWord(counts.team)),
    serviceCount: String(counts.services),
    serviceCountWord: numberWord(counts.services),
    ServiceCountWord: capitalize(numberWord(counts.services)),
    projectCount: String(counts.projects),
    projectCountWord: numberWord(counts.projects),
    ProjectCountWord: capitalize(numberWord(counts.projects)),
  };
}

function fillString(value: string, tokens: TokenMap): string {
  return value.replace(/\{(\w+)\}/g, (match, key: string) =>
    Object.prototype.hasOwnProperty.call(tokens, key) ? tokens[key] : match
  );
}

export function fillDeep<T>(value: T, tokens: TokenMap): T {
  if (typeof value === "string") {
    return fillString(value, tokens) as unknown as T;
  }
  if (Array.isArray(value)) {
    return value.map((item) => fillDeep(item, tokens)) as unknown as T;
  }
  if (value && typeof value === "object") {
    const out: Record<string, unknown> = {};
    for (const [key, item] of Object.entries(value as Record<string, unknown>)) {
      out[key] = fillDeep(item, tokens);
    }
    return out as T;
  }
  return value;
}

export function getHomeContent(tokens: TokenMap): HomeContent {
  return fillDeep(readJSON<HomeContent>("home.json"), tokens);
}

export function getTechStack(tokens: TokenMap): TechStackContent {
  return fillDeep(readJSON<TechStackContent>("techstack.json"), tokens);
}

/** Total tools listed in techstack.json (feeds the {toolCount} token). */
export function countTools(): number {
  try {
    return readJSON<TechStackContent>("techstack.json").categories.reduce(
      (sum, category) => sum + category.items.length,
      0
    );
  } catch {
    return 0;
  }
}

/** Fill {tokens} in any JSON-shaped copy (pages, navigation, legal). */
export function readFilled<T>(file: string, tokens: TokenMap): T {
  return fillDeep(readJSON<T>(file), tokens);
}
