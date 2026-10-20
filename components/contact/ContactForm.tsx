"use client";

import { useState, useRef } from "react";
import gsap from "gsap";
import { Send, Check, Loader2 } from "lucide-react";
import { Magnetic } from "@/components/ui/Magnetic";
import type { PagesContent } from "@/lib/pages-types";

interface FormData {
  name: string;
  email: string;
  company: string;
  budget: string;
  message: string;
}

export function ContactForm({ copy }: { copy: PagesContent["contact"]["form"] }) {
  const formRef = useRef<HTMLFormElement>(null);
  const [formData, setFormData] = useState<FormData>({
    name: "",
    email: "",
    company: "",
    budget: "",
    message: "",
  });
  const [submitting, setSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [focusedField, setFocusedField] = useState<string | null>(null);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    setFormData((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setErrorMessage("");

    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setErrorMessage(data.error || "Unable to send inquiry. Please try again or email us directly.");
        setSubmitting(false);
        return;
      }

      setSubmitting(false);
      if (formRef.current) {
        gsap.to(formRef.current, {
          opacity: 0,
          y: -20,
          duration: 0.4,
          ease: "power2.in",
          onComplete: () => {
            setIsSubmitted(true);
          },
        });
      } else {
        setIsSubmitted(true);
      }
    } catch {
      setErrorMessage("Network error. Please check your connection and try again.");
      setSubmitting(false);
    }
  };

  if (isSubmitted) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center rounded-2xl border border-[var(--border)] bg-[var(--surface)]/50 p-8 md:p-12">
        <div className="w-16 h-16 rounded-full border-2 border-emerald-500 bg-emerald-500/10 flex items-center justify-center mb-6 text-emerald-400">
          <Check size={28} />
        </div>
        <h3 className="text-2xl font-medium text-[var(--foreground)] mb-3">
          {copy.successTitle}
        </h3>
        <p className="text-body max-w-md leading-relaxed text-sm md:text-base">
          {copy.successBody.replace("{name}", formData.name.split(" ")[0] || "there")}
        </p>
      </div>
    );
  }

  return (
    <form
      ref={formRef}
      onSubmit={handleSubmit}
      className="flex flex-col gap-8 rounded-2xl border border-[var(--border)] bg-[var(--surface-hover)]/40 p-8 md:p-10 shadow-sm"
    >
      {errorMessage && (
        <div role="alert" className="rounded-lg border border-rose-500/30 bg-rose-500/10 p-4 text-xs font-mono text-rose-400">
          {errorMessage}
        </div>
      )}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Name */}
        <div className="flex flex-col gap-2">
          <label
            htmlFor="contact-name"
            className={`text-xs uppercase tracking-widest font-mono font-medium transition-colors duration-300 ${
              focusedField === "name"
                ? "text-[var(--foreground)]"
                : "text-[var(--muted)]"
            }`}
          >
            {copy.nameLabel}
          </label>
          <input
            id="contact-name"
            name="name"
            type="text"
            required
            value={formData.name}
            onChange={handleChange}
            onFocus={() => setFocusedField("name")}
            onBlur={() => setFocusedField(null)}
            placeholder={copy.namePlaceholder}
            className="w-full bg-[var(--input-bg)] border border-[var(--input-border)] rounded-xl px-4 py-3 text-sm text-[var(--foreground)] placeholder:text-[var(--muted)] focus:border-[var(--accent)] focus:outline-none transition-colors duration-300"
          />
        </div>

        {/* Email */}
        <div className="flex flex-col gap-2">
          <label
            htmlFor="contact-email"
            className={`text-xs uppercase tracking-widest font-mono font-medium transition-colors duration-300 ${
              focusedField === "email"
                ? "text-[var(--foreground)]"
                : "text-[var(--muted)]"
            }`}
          >
            {copy.emailLabel}
          </label>
          <input
            id="contact-email"
            name="email"
            type="email"
            required
            value={formData.email}
            onChange={handleChange}
            onFocus={() => setFocusedField("email")}
            onBlur={() => setFocusedField(null)}
            placeholder={copy.emailPlaceholder}
            className="w-full bg-[var(--input-bg)] border border-[var(--input-border)] rounded-xl px-4 py-3 text-sm text-[var(--foreground)] placeholder:text-[var(--muted)] focus:border-[var(--accent)] focus:outline-none transition-colors duration-300"
          />
        </div>
      </div>

      {/* Company */}
      <div className="flex flex-col gap-2">
        <label
          htmlFor="contact-company"
          className={`text-xs uppercase tracking-widest font-mono font-medium transition-colors duration-300 ${
            focusedField === "company"
              ? "text-[var(--foreground)]"
              : "text-[var(--muted)]"
          }`}
        >
          {copy.companyLabel}
        </label>
        <input
          id="contact-company"
          name="company"
          type="text"
          value={formData.company}
          onChange={handleChange}
          onFocus={() => setFocusedField("company")}
          onBlur={() => setFocusedField(null)}
          placeholder={copy.companyPlaceholder}
          className="w-full bg-[var(--input-bg)] border border-[var(--input-border)] rounded-xl px-4 py-3 text-sm text-[var(--foreground)] placeholder:text-[var(--muted)] focus:border-[var(--accent)] focus:outline-none transition-colors duration-300"
        />
      </div>

      {/* Budget */}
      <div className="flex flex-col gap-3">
        <span
          className={`text-xs uppercase tracking-widest font-mono font-medium transition-colors duration-300 ${
            focusedField === "budget"
              ? "text-[var(--foreground)]"
              : "text-[var(--muted)]"
          }`}
        >
          {copy.budgetLabel}
        </span>
        <div className="flex flex-wrap gap-2.5">
          {copy.budgetOptions.map((option) => (
            <button
              key={option}
              type="button"
              onClick={() => {
                setFormData((prev) => ({ ...prev, budget: option }));
                setFocusedField("budget");
              }}
              className={`px-4 py-2 text-xs font-mono rounded-full border transition-all duration-300 ${
                formData.budget === option
                  ? "border-[var(--accent)] text-[var(--accent-foreground)] bg-[var(--accent)] font-semibold shadow-md"
                  : "border-[var(--border)] text-[var(--secondary)] hover:border-[var(--border-hover)] hover:text-[var(--foreground)]"
              }`}
            >
              {option}
            </button>
          ))}
        </div>
      </div>

      {/* Message */}
      <div className="flex flex-col gap-2">
        <label
          htmlFor="contact-message"
          className={`text-xs uppercase tracking-widest font-mono font-medium transition-colors duration-300 ${
            focusedField === "message"
              ? "text-[var(--foreground)]"
              : "text-[var(--muted)]"
          }`}
        >
          {copy.messageLabel}
        </label>
        <textarea
          id="contact-message"
          name="message"
          required
          rows={5}
          value={formData.message}
          onChange={handleChange}
          onFocus={() => setFocusedField("message")}
          onBlur={() => setFocusedField(null)}
          placeholder={copy.messagePlaceholder}
          className="w-full bg-[var(--input-bg)] border border-[var(--input-border)] rounded-xl px-4 py-3 text-sm text-[var(--foreground)] placeholder:text-[var(--muted)] focus:border-[var(--accent)] focus:outline-none transition-colors duration-300 resize-none leading-relaxed"
        />
      </div>

      {/* Submit Button */}
      <Magnetic strength={0.2} className="w-full md:w-auto md:self-start">
        <button
          type="submit"
          disabled={submitting}
          className="group relative inline-flex items-center justify-center gap-3 bg-[var(--accent)] text-[var(--accent-foreground)] px-8 py-3.5 rounded-full text-sm font-semibold transition-all duration-300 hover:brightness-110 shadow-lg w-full md:w-auto md:self-start disabled:opacity-50"
        >
          {submitting ? (
            <>
              <Loader2 size={16} className="animate-spin" />
              {copy.sending}
            </>
          ) : (
            <>
              {copy.submit}
              <Send
                size={15}
                className="group-hover:translate-x-1 transition-transform duration-300"
              />
            </>
          )}
        </button>
      </Magnetic>
    </form>
  );
}
