interface RichTextContentProps {
  html: string;
  className?: string;
}

export function RichTextContent({ html, className = "" }: RichTextContentProps) {
  return (
    <div
      className={`prose prose-invert max-w-none leading-relaxed text-[var(--foreground)] ${className}`}
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
}
