import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, ArrowRight, Calendar, Clock } from "lucide-react";
import { Container } from "@/components/ui/Container";
import { RichTextContent } from "@/components/ui/RichTextContent";
import { PageHero } from "@/components/layout/PageHero";
import { PageCta } from "@/components/layout/PageCta";
import { readBlogPost } from "@/lib/content";
import { getBrand, getPages, getPosts } from "@/lib/site";
import type { BlogPost } from "@/lib/types";
import { Magnetic } from "@/components/ui/Magnetic";

type Params = { params: Promise<{ slug: string }> };

export async function generateStaticParams() {
  return getPosts().map((post) => ({ slug: post.slug }));
}

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const { slug } = await params;
  const post = readBlogPost(slug) as BlogPost | null;
  if (!post) return { title: getPages().blog.detail.notFoundTitle };

  const title = post.seo?.title || post.title;
  const description = post.seo?.description || post.excerpt;

  return {
    title: post.seo?.title || `${post.title} | ${getBrand()}`,
    description,
    openGraph: {
      title,
      description,
      type: "article",
      publishedTime: post.publishedAt,
      authors: [post.author],
    },
    twitter: { card: "summary_large_image", title, description },
  };
}

export default async function BlogPostPage({ params }: Params) {
  const { slug } = await params;
  const { detail } = getPages().blog;
  const post = readBlogPost(slug) as BlogPost | null;

  if (!post || !post.published) notFound();

  const more = getPosts()
    .filter((p) => p.slug !== slug)
    .slice(0, 2);

  return (
    <>
      <PageHero
        eyebrow={post.tags?.[0] ? `#${post.tags[0]}` : detail.fallbackEyebrow}
        shape="lattice"
        lines={[{ text: post.title }]}
        body={post.excerpt}
        meta={`${post.readTime} ${detail.minRead}`}
        actions={
          <Link
            href="/blog"
            className="group inline-flex items-center gap-2 font-mono text-xs uppercase tracking-widest text-[var(--secondary)] transition-colors hover:text-[var(--foreground)]"
          >
            <ArrowLeft size={14} className="transition-transform group-hover:-translate-x-0.5" />
            {detail.backLabel}
          </Link>
        }
      />

      <section className="w-full py-16 md:py-24">
        <Container>
          <article className="mx-auto max-w-3xl">
            <div className="mb-12 flex flex-wrap items-center justify-between gap-4 border-b border-[var(--border)] pb-6 font-mono text-xs text-[var(--muted)]">
              <div className="flex items-center gap-3 text-[var(--foreground)]">
                <span className="flex h-8 w-8 items-center justify-center rounded-full border border-[var(--border)] bg-[var(--surface-hover)] text-xs font-bold text-[var(--accent)]">
                  {post.author.slice(0, 2).toUpperCase()}
                </span>
                <span className="flex flex-col">
                  <span className="font-medium">{post.author}</span>
                  <span className="text-[11px] text-[var(--muted)]">{post.authorRole}</span>
                </span>
              </div>
              <div className="flex items-center gap-4">
                <span className="flex items-center gap-1.5">
                  <Calendar size={13} />
                  {new Date(post.publishedAt).toLocaleDateString("en-US", {
                    month: "long",
                    day: "numeric",
                    year: "numeric",
                  })}
                </span>
                <span className="flex items-center gap-1.5">
                  <Clock size={13} />
                  {post.readTime} {detail.minRead}
                </span>
              </div>
            </div>

            <RichTextContent html={post.content} />

            <div className="my-16 flex flex-col items-start justify-between gap-6 rounded-xl border border-[var(--border)] bg-[var(--surface)] p-6 sm:flex-row sm:items-center md:p-8">
              <div>
                <div className="mb-1 font-mono text-xs uppercase tracking-widest text-[var(--accent)]">
                  {detail.writtenBy} {post.author}
                </div>
                <p className="text-sm text-[var(--secondary)]">
                  {post.authorRole} · {getBrand()}
                </p>
              </div>
              <Magnetic strength={0.25} className="shrink-0">
                <Link
                  href="/contact"
                  className="shrink-0 rounded-full bg-[var(--accent)] px-5 py-2.5 font-mono text-xs font-semibold uppercase tracking-wider text-[var(--accent-foreground)] transition-all hover:brightness-110"
                >
                  {detail.ctaLabel}
                </Link>
              </Magnetic>
            </div>

            {more.length > 0 && (
              <div className="border-t border-[var(--border)] pt-12">
                <div className="text-label mb-8">{detail.moreLabel}</div>
                <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                  {more.map((p) => (
                    <Link
                      key={p.slug}
                      href={`/blog/${p.slug}`}
                      className="group flex flex-col justify-between rounded-xl border border-[var(--border)] bg-[var(--surface)] p-6 transition-all hover:border-[var(--accent)]/50"
                    >
                      <div>
                        <div className="mb-2 text-base font-medium text-[var(--foreground)]">
                          {p.title}
                        </div>
                        <p className="line-clamp-2 text-xs text-[var(--secondary)]">{p.excerpt}</p>
                      </div>
                      <div className="mt-4 flex items-center justify-between font-mono text-[11px] text-[var(--muted)]">
                        <span>{p.readTime} {detail.minRead}</span>
                        <ArrowRight
                          size={13}
                          className="text-[var(--accent)] transition-transform group-hover:translate-x-1"
                        />
                      </div>
                    </Link>
                  ))}
                </div>
              </div>
            )}
          </article>
        </Container>
      </section>

      <PageCta />
    </>
  );
}
