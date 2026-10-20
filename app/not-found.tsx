import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { Container } from "@/components/ui/Container";
import { Magnetic } from "@/components/ui/Magnetic";
import { getPages } from "@/lib/site";

export default function NotFound() {
  const { notFound } = getPages();
  const [before, after] = notFound.body.split("{shortcut}");

  return (
    <section className="flex min-h-screen w-full items-center justify-center py-32">
      <Container>
        <div className="mx-auto flex max-w-xl flex-col items-center text-center">
          <span
            aria-hidden
            className="mb-6 select-none font-light leading-none tracking-tighter text-[var(--border-hover)] text-[clamp(7rem,28vw,16rem)]"
          >
            {notFound.code}
          </span>
          <h1 className="text-subsection mb-4">{notFound.title}</h1>
          <p className="text-body mb-10">
            {before}
            {after !== undefined && (
              <>
                <kbd className="rounded border border-[var(--border-hover)] px-1.5 py-0.5 font-mono text-xs">
                  Ctrl K
                </kbd>
                {after}
              </>
            )}
          </p>
          <Magnetic strength={0.3}>
            <Link
              href="/"
              className="group inline-flex items-center gap-2 rounded-full bg-[var(--accent)] px-6 py-3 text-sm font-semibold text-[var(--accent-foreground)] transition-all hover:brightness-110"
            >
              <ArrowLeft size={16} className="transition-transform group-hover:-translate-x-0.5" />
              {notFound.button}
            </Link>
          </Magnetic>
        </div>
      </Container>
    </section>
  );
}
