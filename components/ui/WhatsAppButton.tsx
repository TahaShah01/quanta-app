"use client";

import { useSite } from "@/components/layout/SiteProvider";

/** Official WhatsApp click-to-chat URL with an optional pre-filled message. */
function buildWhatsAppUrl(number: string, message: string): string {
  const cleaned = number.replace(/\D/g, "");
  if (!cleaned) return "#";
  const base = `https://wa.me/${cleaned}`;
  if (message.trim()) {
    return `${base}?text=${encodeURIComponent(message.trim())}`;
  }
  return base;
}

/**
 * Floating WhatsApp contact button.
 *
 * Rendered on all public pages via SiteShell. Reads configuration from
 * settings.json via the SiteProvider context. If no number is configured,
 * or the button is switched off in admin, it renders nothing.
 *
 * Opens WhatsApp in a new tab with a pre-filled message if configured.
 * Uses rel="noopener noreferrer" for safe external link behaviour.
 */
export function WhatsAppButton() {
  const { settings } = useSite();
  const cfg = settings?.whatsapp;

  if (!cfg?.number?.trim() || !cfg.visible) return null;

  const href = buildWhatsAppUrl(cfg.number, cfg.message || "");

  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      aria-label="Contact us on WhatsApp — opens WhatsApp in a new tab"
      className="whatsapp-fab group"
    >
      {/* WhatsApp official icon (SVG inline for zero-dependency) */}
      <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 32 32"
        aria-hidden="true"
        focusable="false"
        className="h-7 w-7 fill-white transition-transform duration-300 group-hover:scale-110"
      >
        <path d="M16.003 2.667C8.64 2.667 2.667 8.64 2.667 16c0 2.358.62 4.664 1.8 6.695L2.667 29.333l6.8-1.773A13.27 13.27 0 0 0 16.003 29.333c7.36 0 13.33-5.973 13.33-13.333S23.363 2.667 16.003 2.667Zm0 24.4a11.04 11.04 0 0 1-5.627-1.547l-.4-.24-4.04 1.053 1.08-3.92-.267-.413A11.04 11.04 0 0 1 4.93 16c0-6.12 4.953-11.067 11.073-11.067S27.07 9.88 27.07 16 22.12 27.067 16.003 27.067Zm6.067-8.28c-.333-.167-1.973-.973-2.28-1.08-.307-.107-.533-.167-.76.167-.227.333-.867 1.08-1.067 1.307-.2.227-.4.253-.733.08-.333-.167-1.413-.52-2.693-1.66-.993-.88-1.667-1.973-1.867-2.307-.193-.333-.02-.507.147-.667.147-.14.333-.36.5-.547.167-.187.227-.32.333-.533.107-.213.053-.4-.027-.56-.08-.16-.76-1.827-1.04-2.507-.28-.667-.56-.573-.76-.587-.2-.013-.427-.013-.653-.013-.227 0-.6.08-.907.4-.307.32-1.2 1.173-1.2 2.853s1.227 3.307 1.393 3.533c.167.227 2.413 3.68 5.853 5.16.82.36 1.453.573 1.96.733.813.267 1.56.227 2.147.14.653-.1 2.013-.82 2.3-1.6.28-.787.28-1.467.2-1.613-.08-.147-.307-.227-.64-.4Z" />
      </svg>

      {/* Tooltip label */}
      <span
        className="absolute bottom-full right-0 mb-2 hidden whitespace-nowrap rounded-lg bg-[var(--surface)] px-3 py-1.5 text-xs text-[var(--foreground)] shadow-lg ring-1 ring-[var(--border)] group-hover:block"
        aria-hidden="true"
      >
        Chat on WhatsApp
      </span>
    </a>
  );
}
