import Image from "@/components/ui/SafeImage";
import { ArrowUpRight } from "lucide-react";
import { Container } from "@/components/ui/Container";
import { FadeIn } from "@/components/animations/FadeIn";
import { SectionHeader } from "@/components/home/SectionHeader";
import type { HomeContent } from "@/lib/home-types";
import { safeHref } from "@/lib/url";
import type { ClientLogo } from "@/lib/types";

/** "Closely working with": the clients and companies the studio chooses to show off. */
export function ClientsWall({
  content,
  ui,
  clients,
}: {
  content: HomeContent["clients"];
  ui: HomeContent["ui"];
  clients: ClientLogo[];
}) {
  return (
    <div className="py-24 md:py-32">
      <Container>
        <SectionHeader content={content} className="mb-14 md:mb-20" />

        <ul className="grid grid-cols-2 gap-px overflow-hidden rounded-2xl border border-[var(--border)] bg-[var(--border)] sm:grid-cols-3 lg:grid-cols-4 2xl:grid-cols-6">
          {clients.map((client, i) => {
            const href = safeHref(client.website);
            const body = (
              <div
                data-scene-hover
                className="group relative flex aspect-[4/3] flex-col items-center justify-center gap-3 bg-[var(--background)] p-6 transition-colors duration-500 hover:bg-[var(--surface-hover)]"
              >
                <div className="relative flex h-14 w-full max-w-[9rem] items-center justify-center">
                  <span className="text-center text-xl font-medium tracking-tight text-[var(--secondary)] transition-colors duration-500 group-hover:text-[var(--foreground)]">
                    {client.name}
                  </span>
                  <Image
                    src={client.logo}
                    alt={client.name}
                    fill
                    sizes="160px"
                    className="bg-[var(--background)] object-contain opacity-60 grayscale transition-all duration-500 group-hover:opacity-100 group-hover:grayscale-0"
                  />
                </div>

                {client.note && (
                  <span className="absolute inset-x-4 bottom-4 translate-y-1 text-center font-mono text-[11px] uppercase tracking-wider text-[var(--muted)] opacity-0 transition-all duration-500 group-hover:translate-y-0 group-hover:opacity-100">
                    {client.note}
                  </span>
                )}

                {href && (
                  <ArrowUpRight
                    size={14}
                    className="absolute right-4 top-4 text-[var(--muted)] opacity-0 transition-all duration-300 group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:opacity-100"
                    aria-hidden
                  />
                )}
              </div>
            );

            return (
              <li key={client.id}>
                <FadeIn delay={Math.min(i, 8) * 0.05} yOffset={12} scroll className="h-full">
                  {href ? (
                    <a
                      href={href}
                      target="_blank"
                      rel="noopener noreferrer"
                      aria-label={`${ui.clientsLabel ?? "Visit"} ${client.name} (opens in a new tab)`}
                      className="block"
                    >
                      {body}
                    </a>
                  ) : (
                    body
                  )}
                </FadeIn>
              </li>
            );
          })}
        </ul>
      </Container>
    </div>
  );
}
