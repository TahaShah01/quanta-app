/** Turns whatever an admin typed into a link that is safe to render, or "" when it isn't one. */
export function safeHref(value: string | undefined | null): string {
  const raw = (value ?? "").trim();
  if (!raw) return "";
  if (/^(https?:\/\/|mailto:|tel:)/i.test(raw)) return raw;
  if (raw.startsWith("/") && !raw.startsWith("//")) return raw;
  // "example.com" or "www.example.com": assume https
  if (/^[\w-]+(\.[\w-]+)+(\/.*)?$/.test(raw)) return `https://${raw}`;
  return "";
}
