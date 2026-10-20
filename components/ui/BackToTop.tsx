"use client";

import { useEffect, useState } from "react";
import { ArrowUp } from "lucide-react";

export function BackToTop() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    let lastVisible = false;
    let ticking = false;

    const handleScroll = () => {
      if (!ticking) {
        ticking = true;
        requestAnimationFrame(() => {
          const nextVisible = (window.scrollY || document.documentElement.scrollTop) > 400;
          if (nextVisible !== lastVisible) {
            lastVisible = nextVisible;
            setVisible(nextVisible);
          }
          ticking = false;
        });
      }
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    handleScroll();

    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const scrollToTop = () => {
    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  };

  if (!visible) return null;

  return (
    <button
      onClick={scrollToTop}
      aria-label="Scroll back to top"
      className="fixed bottom-6 right-6 z-40 hidden p-3 md:block rounded-full bg-[var(--surface-hover)]/90 border border-[var(--border)] text-[var(--foreground)] shadow-xl hover:border-[var(--accent)] hover:text-[var(--accent)] transition-all duration-300 hover:-translate-y-1 group"
    >
      <ArrowUp size={18} className="transition-transform group-hover:-translate-y-0.5" />
    </button>
  );
}
