"use client";

import { useEffect } from "react";
import Link from "next/link";
import { AlertCircle, RotateCcw } from "lucide-react";
import { Container } from "@/components/ui/Container";

export default function ErrorBoundary({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="min-h-[70vh] flex items-center justify-center py-24">
      <Container>
        <div className="max-w-md mx-auto text-center flex flex-col items-center p-8 rounded-2xl border border-[var(--border)] bg-[var(--surface-hover)]/40 shadow-sm">
          <div className="w-14 h-14 rounded-full bg-rose-500/10 border border-rose-500/20 text-rose-400 flex items-center justify-center mb-6">
            <AlertCircle size={28} />
          </div>

          <span className="text-xs font-mono uppercase tracking-widest text-rose-400 mb-2">
            Error
          </span>

          <h1 className="text-2xl md:text-3xl font-medium text-[var(--foreground)] mb-3">
            Something went wrong
          </h1>

          <p className="text-sm text-[var(--secondary)] mb-8 leading-relaxed">
            Something broke while loading this page. Try again, or head back home.
          </p>

          <div className="flex flex-wrap items-center justify-center gap-3">
            <button
              onClick={() => reset()}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-[var(--surface-hover)] border border-[var(--border)] text-xs font-mono text-[var(--foreground)] hover:border-[var(--accent)] transition-colors"
            >
              <RotateCcw size={14} /> Try Again
            </button>
            <Link
              href="/"
              className="px-5 py-2.5 rounded-full bg-[var(--accent)] text-[var(--accent-foreground)] text-xs font-mono font-semibold hover:brightness-110 transition-all"
            >
              Back to Home
            </Link>
          </div>
        </div>
      </Container>
    </div>
  );
}
