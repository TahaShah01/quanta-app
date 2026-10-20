import type { Metadata } from "next";
import { ContactForm } from "@/components/contact/ContactForm";
import { FaqSection } from "@/components/contact/FaqSection";
import { Clock, MapPin, Mail, ShieldCheck, Users, Zap, type LucideIcon } from "lucide-react";
import { Container } from "@/components/ui/Container";
import { PageHero } from "@/components/layout/PageHero";
import { readJSON } from "@/lib/content";
import { getPages, getSettings } from "@/lib/site";
import type { FaqItem } from "@/lib/types";

export function generateMetadata(): Metadata {
  return getPages().contact.meta;
}

const ENGAGE_ICONS: Record<string, LucideIcon> = { Zap, Users, ShieldCheck, Clock, Mail, MapPin };

export default function ContactPage() {
  let faqItems: FaqItem[] = [];
  try {
    faqItems = readJSON<FaqItem[]>("faq.json")
      .filter((f) => f.published)
      .sort((a, b) => a.order - b.order);
  } catch {
    faqItems = [];
  }

  const settings = getSettings();
  const { contact } = getPages();
  const contactEmail = settings?.email ?? "";
  const location = settings?.location ?? "";

  return (
    <>
      <PageHero
        eyebrow={contact.hero.eyebrow}
        shape="singularity"
        lines={contact.hero.lines}
        body={contact.hero.body}
      />

      {/* Main Form & Info Section */}
      <section className="w-full py-20 md:py-28">
        <Container>
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16 items-start">
            {/* Left: Contact Info & Engagement Process */}
            <div className="lg:col-span-5 flex flex-col gap-10">
              <div className="flex flex-col gap-6">
                <div className="flex items-start gap-4 p-4 rounded-xl border border-[var(--border)] bg-[var(--surface)]/30">
                  <div className="w-10 h-10 rounded-full border border-[var(--border)] bg-[var(--surface-hover)] flex items-center justify-center shrink-0 text-[var(--accent)]">
                    <Mail size={18} />
                  </div>
                  <div className="flex flex-col">
                    <span className="text-xs font-mono uppercase tracking-wider text-[var(--muted)] mb-1">
                      {contact.info.emailLabel}
                    </span>
                    <a
                      href={`mailto:${contactEmail}`}
                      className="text-base text-[var(--foreground)] font-medium hover:text-[var(--accent)] transition-colors"
                    >
                      {contactEmail}
                    </a>
                  </div>
                </div>

                <div className="flex items-start gap-4 p-4 rounded-xl border border-[var(--border)] bg-[var(--surface)]/30">
                  <div className="w-10 h-10 rounded-full border border-[var(--border)] bg-[var(--surface-hover)] flex items-center justify-center shrink-0 text-[var(--accent)]">
                    <MapPin size={18} />
                  </div>
                  <div className="flex flex-col">
                    <span className="text-xs font-mono uppercase tracking-wider text-[var(--muted)] mb-1">
                      {contact.info.locationLabel}
                    </span>
                    <span className="text-base text-[var(--foreground)] font-medium">{location}</span>
                  </div>
                </div>

                <div className="flex items-start gap-4 p-4 rounded-xl border border-[var(--border)] bg-[var(--surface)]/30">
                  <div className="w-10 h-10 rounded-full border border-[var(--border)] bg-[var(--surface-hover)] flex items-center justify-center shrink-0 text-[var(--accent)]">
                    <Clock size={18} />
                  </div>
                  <div className="flex flex-col">
                    <span className="text-xs font-mono uppercase tracking-wider text-[var(--muted)] mb-1">
                      {contact.info.responseLabel}
                    </span>
                    <span className="text-base text-[var(--foreground)] font-medium">
                      {contact.info.responseValue}
                    </span>
                  </div>
                </div>
              </div>

              {/* Engagement Model Card */}
              <div className="p-8 border border-[var(--border)] rounded-2xl bg-[var(--surface-hover)]/40 flex flex-col gap-6 shadow-sm">
                <div className="text-xs font-mono uppercase tracking-widest text-[var(--accent)]">
                  {contact.engage.title}
                </div>

                {contact.engage.items.map((item) => {
                  const Icon = ENGAGE_ICONS[item.icon] ?? Zap;
                  return (
                    <div key={item.title} className="flex items-start gap-3.5">
                      <div className="p-2 rounded-lg bg-[var(--surface-hover)] text-[var(--accent)] shrink-0">
                        <Icon size={16} />
                      </div>
                      <div>
                        <div className="text-sm font-medium text-[var(--foreground)] mb-1">{item.title}</div>
                        <p className="text-xs text-[var(--secondary)] leading-relaxed">{item.description}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Right: Contact Form */}
            <div className="lg:col-span-7">
              <ContactForm copy={contact.form} />
            </div>
          </div>

          <FaqSection items={faqItems} />
        </Container>
      </section>
    </>
  );
}
