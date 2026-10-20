"use client";

import { useCallback, useEffect, useMemo, useRef, useState, useSyncExternalStore } from "react";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import { ArrowUpRight, CornerDownLeft, Copy, Moon, Search, Sun } from "lucide-react";
import { useTheme } from "@/components/theme/ThemeProvider";
import { useSite } from "@/components/layout/SiteProvider";

export const OPEN_PALETTE_EVENT = "quanta:open-palette";

const noopSubscribe = () => () => {};

/** "⌘" on Apple platforms, "Ctrl" everywhere else. */
export function useModKey() {
  return useSyncExternalStore(
    noopSubscribe,
    () => (/Mac|iPhone|iPad/.test(navigator.platform) ? "⌘" : "Ctrl"),
    () => "Ctrl"
  );
}

interface Item {
  id: string;
  group: string;
  label: string;
  hint?: string;
  run: () => void;
  icon?: "arrow" | "copy" | "theme";
}

function matches(item: Item, query: string) {
  if (!query) return true;
  const haystack = `${item.label} ${item.hint ?? ""} ${item.group}`.toLowerCase();
  return query
    .toLowerCase()
    .split(/\s+/)
    .filter(Boolean)
    .every((token) => haystack.includes(token));
}

export function CommandPalette() {
  const router = useRouter();
  const { theme, toggleTheme } = useTheme();
  const { settings, searchIndex } = useSite();
  const modKey = useModKey();

  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [active, setActive] = useState(0);
  const [copied, setCopied] = useState(false);
  const listRef = useRef<HTMLUListElement>(null);

  const close = useCallback(() => {
    setOpen(false);
    setQuery("");
    setActive(0);
  }, []);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setOpen((v) => !v);
        return;
      }
      const target = e.target as HTMLElement | null;
      const typing =
        target?.tagName === "INPUT" ||
        target?.tagName === "TEXTAREA" ||
        target?.isContentEditable;
      if (e.key === "/" && !typing) {
        e.preventDefault();
        setOpen(true);
      }
    };
    const onOpen = () => setOpen(true);
    window.addEventListener("keydown", onKey);
    window.addEventListener(OPEN_PALETTE_EVENT, onOpen);
    return () => {
      window.removeEventListener("keydown", onKey);
      window.removeEventListener(OPEN_PALETTE_EVENT, onOpen);
    };
  }, []);

  useEffect(() => {
    if (!open) return;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  const email = settings?.email;

  const items = useMemo<Item[]>(() => {
    const go = (href: string) => () => {
      close();
      router.push(href);
    };

    const navigation = searchIndex.map<Item>((entry) => ({
      id: entry.href,
      group: entry.group === "Page" ? "Go to" : entry.group,
      label: entry.label,
      hint: entry.hint,
      run: go(entry.href),
      icon: "arrow",
    }));

    const actions: Item[] = [
      {
        id: "action-theme",
        group: "Actions",
        label: theme === "dark" ? "Switch to light mode" : "Switch to dark mode",
        run: () => {
          close();
          toggleTheme({ x: window.innerWidth / 2, y: 80 });
        },
        icon: "theme",
      },
    ];

    if (email) {
      actions.push({
        id: "action-email",
        group: "Actions",
        label: "Copy email address",
        hint: email,
        run: () => {
          navigator.clipboard?.writeText(email).then(() => {
            setCopied(true);
            window.setTimeout(() => setCopied(false), 1600);
          });
        },
        icon: "copy",
      });
    }

    return [...navigation, ...actions];
  }, [searchIndex, theme, toggleTheme, email, router, close]);

  const results = useMemo(() => items.filter((item) => matches(item, query)), [items, query]);

  const groups = useMemo(() => {
    const map = new Map<string, Item[]>();
    for (const item of results) {
      map.set(item.group, [...(map.get(item.group) ?? []), item]);
    }
    return [...map.entries()];
  }, [results]);

  const safeActive = Math.min(active, Math.max(results.length - 1, 0));

  useEffect(() => {
    listRef.current
      ?.querySelector<HTMLElement>(`[data-index="${safeActive}"]`)
      ?.scrollIntoView({ block: "nearest" });
  }, [safeActive]);

  const onInputKey = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActive((safeActive + 1) % Math.max(results.length, 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActive((safeActive - 1 + results.length) % Math.max(results.length, 1));
    } else if (e.key === "Enter") {
      e.preventDefault();
      results[safeActive]?.run();
    } else if (e.key === "Escape") {
      e.preventDefault();
      close();
    }
  };

  let index = -1;

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-[100] flex items-start justify-center px-4 pt-[14vh]"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
        >
          <div
            className="absolute inset-0 bg-[var(--background)]/70 backdrop-blur-md"
            onClick={close}
            aria-hidden
          />

          <motion.div
            role="dialog"
            aria-modal="true"
            aria-label="Search the site"
            initial={{ opacity: 0, y: 16, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 8, scale: 0.98 }}
            transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
            className="relative w-full max-w-xl overflow-hidden rounded-2xl border border-[var(--border-hover)] bg-[var(--background)] shadow-2xl"
          >
            <div className="flex items-center gap-3 border-b border-[var(--border)] px-5">
              <Search size={16} className="shrink-0 text-[var(--muted)]" />
              <input
                autoFocus
                value={query}
                onChange={(e) => {
                  setQuery(e.target.value);
                  setActive(0);
                }}
                onKeyDown={onInputKey}
                placeholder="Search pages, projects, essays…"
                role="combobox"
                aria-expanded="true"
                aria-controls="palette-results"
                aria-activedescendant={results[safeActive] ? `palette-${safeActive}` : undefined}
                aria-label="Search"
                className="h-14 w-full bg-transparent text-sm text-[var(--foreground)] outline-none focus-visible:outline-none placeholder:text-[var(--muted)]"
              />
              <kbd className="rounded border border-[var(--border-hover)] px-1.5 py-px font-mono text-[11px] text-[var(--muted)]">
                Esc
              </kbd>
            </div>

            <ul
              ref={listRef}
              id="palette-results"
              role="listbox"
              data-lenis-prevent
              className="max-h-[50vh] overflow-y-auto p-2"
            >
              {results.length === 0 && (
                <li className="px-4 py-10 text-center text-sm text-[var(--muted)]">
                  Nothing matches &ldquo;{query}&rdquo;.
                </li>
              )}

              {groups.map(([group, groupItems]) => (
                <li key={group} role="presentation">
                  <div className="px-3 pb-1 pt-3 font-mono text-[11px] uppercase tracking-[0.2em] text-[var(--muted)]">
                    {group}
                  </div>
                  <ul role="presentation">
                    {groupItems.map((item) => {
                      index += 1;
                      const i = index;
                      const on = i === safeActive;
                      return (
                        <li
                          key={item.id}
                          id={`palette-${i}`}
                          role="option"
                          aria-selected={on}
                          data-index={i}
                          onMouseMove={() => setActive(i)}
                          onClick={item.run}
                          className={`flex cursor-pointer items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition-colors ${
                            on
                              ? "bg-[var(--accent-subtle)] text-[var(--foreground)]"
                              : "text-[var(--secondary)]"
                          }`}
                        >
                          <span className="shrink-0 text-[var(--muted)]">
                            {item.icon === "copy" ? (
                              <Copy size={14} />
                            ) : item.icon === "theme" ? (
                              theme === "dark" ? <Sun size={14} /> : <Moon size={14} />
                            ) : (
                              <ArrowUpRight size={14} />
                            )}
                          </span>
                          <span className="flex-1 truncate">
                            {item.id === "action-email" && copied ? "Copied to clipboard" : item.label}
                          </span>
                          {item.hint && (
                            <span className="hidden truncate font-mono text-[11px] text-[var(--muted)] sm:block">
                              {item.hint}
                            </span>
                          )}
                          {on && <CornerDownLeft size={13} className="shrink-0 text-[var(--muted)]" />}
                        </li>
                      );
                    })}
                  </ul>
                </li>
              ))}
            </ul>

            <div className="flex items-center justify-between border-t border-[var(--border)] px-5 py-3 font-mono text-[11px] text-[var(--muted)]">
              <span>↑ ↓ to move · Enter to open</span>
              <span>{modKey} K to toggle</span>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
