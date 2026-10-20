"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import { useTheme } from "@/components/theme/ThemeProvider";
import { useSite } from "@/components/layout/SiteProvider";
import { frame } from "@/lib/experience/store";
import { setSoundEnabled } from "@/lib/sound";

const KONAMI = [
  "ArrowUp", "ArrowUp", "ArrowDown", "ArrowDown",
  "ArrowLeft", "ArrowRight", "ArrowLeft", "ArrowRight", "b", "a",
];

interface Line {
  kind: "in" | "out";
  text: string;
}

const HELP = [
  "help              this list",
  "ls                list pages",
  "open <page>       go to a page, e.g. open about",
  "theme [dark|light]",
  "sound [on|off]",
  "email             show our email",
  "whoami",
  "explode           you know you want to",
  "clear / exit",
];

/** Hidden extras: the Konami code scatters the particles, backtick opens a terminal. */
export function Easter() {
  const router = useRouter();
  const { theme, toggleTheme } = useTheme();
  const { settings, searchIndex } = useSite();

  const [toast, setToast] = useState<string | null>(null);
  const [open, setOpen] = useState(false);
  const [lines, setLines] = useState<Line[]>([
    { kind: "out", text: "quanta shell. type `help`." },
  ]);
  const [input, setInput] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);
  const logRef = useRef<HTMLDivElement>(null);

  const explode = useCallback(() => {
    frame.explode = true;
    setToast("Nice. Hold on to your particles.");
    window.setTimeout(() => setToast(null), 2400);
  }, []);

  useEffect(() => {
    let progress = 0;
    const onKey = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement | null;
      const typing =
        target?.tagName === "INPUT" || target?.tagName === "TEXTAREA" || target?.isContentEditable;

      if (e.key === "`" && !typing && !e.metaKey && !e.ctrlKey) {
        e.preventDefault();
        setOpen((v) => !v);
        return;
      }
      if (e.key === "Escape") setOpen(false);
      if (typing) return;

      const expected = KONAMI[progress];
      const key = e.key.length === 1 ? e.key.toLowerCase() : e.key;
      progress = key === expected ? progress + 1 : key === KONAMI[0] ? 1 : 0;
      if (progress === KONAMI.length) {
        progress = 0;
        explode();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [explode]);

  useEffect(() => {
    if (open) inputRef.current?.focus();
  }, [open]);

  useEffect(() => {
    logRef.current?.scrollTo({ top: logRef.current.scrollHeight });
  }, [lines]);

  const run = (raw: string) => {
    const [cmd, ...args] = raw.trim().split(/\s+/);
    const arg = args.join(" ").toLowerCase();
    const out = (...text: string[]) => text.map<Line>((t) => ({ kind: "out", text: t }));
    let result: Line[] = [];

    switch (cmd?.toLowerCase()) {
      case "":
      case undefined:
        break;
      case "help":
        result = out(...HELP);
        break;
      case "ls":
        result = out(...searchIndex.filter((e) => e.group === "Page").map((e) => e.href));
        break;
      case "open":
      case "cd": {
        const match = searchIndex.find(
          (e) => e.href === `/${arg}` || e.label.toLowerCase() === arg || (arg === "home" && e.href === "/")
        );
        if (match) {
          result = out(`opening ${match.href}`);
          setOpen(false);
          router.push(match.href);
        } else {
          result = out(`no such page: ${arg || "(none)"}`);
        }
        break;
      }
      case "theme": {
        const want = arg === "light" || arg === "dark" ? arg : theme === "dark" ? "light" : "dark";
        if (want !== theme) toggleTheme({ x: window.innerWidth / 2, y: window.innerHeight });
        result = out(`theme: ${want}`);
        break;
      }
      case "sound":
        setSoundEnabled(arg !== "off");
        result = out(`sound: ${arg === "off" ? "off" : "on"}`);
        break;
      case "email":
        result = out(settings?.email || "no public email set");
        break;
      case "whoami":
        result = out("a curious visitor", "try the Konami code.");
        break;
      case "explode":
        explode();
        result = out("boom.");
        break;
      case "clear":
        setLines([]);
        return;
      case "exit":
        setOpen(false);
        return;
      default:
        result = out(`command not found: ${cmd}`);
    }
    setLines((prev) => [...prev, { kind: "in", text: raw }, ...result]);
  };

  return (
    <>
      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 8 }}
            role="status"
            className="fixed bottom-8 left-1/2 z-[130] -translate-x-1/2 rounded-full border border-[var(--border-hover)] bg-[var(--background)] px-5 py-2.5 font-mono text-xs text-[var(--foreground)] shadow-xl"
          >
            {toast}
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {open && (
          <motion.div
            role="dialog"
            aria-label="Terminal"
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%" }}
            transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
            className="fixed inset-x-0 bottom-0 z-[110] border-t border-[var(--border-hover)] bg-[var(--background)]/95 backdrop-blur-xl"
            onClick={() => inputRef.current?.focus()}
          >
            <div className="mx-auto flex h-[38vh] max-w-4xl flex-col px-5 py-4 font-mono text-xs">
              <div ref={logRef} data-lenis-prevent className="flex-1 overflow-y-auto pb-3">
                {lines.map((l, i) => (
                  <div
                    key={i}
                    className={l.kind === "in" ? "text-[var(--foreground)]" : "text-[var(--secondary)]"}
                  >
                    {l.kind === "in" ? `> ${l.text}` : l.text}
                  </div>
                ))}
              </div>
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  run(input);
                  setInput("");
                }}
                className="flex items-center gap-2 border-t border-[var(--border)] pt-3 text-[var(--foreground)]"
              >
                <span aria-hidden>&gt;</span>
                <input
                  ref={inputRef}
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  aria-label="Terminal command"
                  autoComplete="off"
                  spellCheck={false}
                  className="w-full bg-transparent outline-none focus-visible:outline-none"
                />
                <span className="text-[var(--muted)]">Esc to close</span>
              </form>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}

