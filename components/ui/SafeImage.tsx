"use client";

import { useState, type ComponentProps, type ReactNode } from "react";
import NextImage from "next/image";

type Props = ComponentProps<typeof NextImage> & {
  /** Shown instead of the picture when the value is missing, malformed or fails to load */
  fallback?: ReactNode;
};

/**
 * next/image for pictures an admin typed in: a bad value ("kjn", an empty string, a
 * dead link) renders nothing instead of crashing the page, and any https:// address
 * works without being listed in next.config.
 */
export default function SafeImage({ src, alt, onError, fallback = null, ...rest }: Props) {
  const [failed, setFailed] = useState<string | null>(null);

  if (typeof src === "string") {
    const value = src.trim();
    const remote = /^https?:\/\//i.test(value);
    const local = value.startsWith("/") && !value.startsWith("//");
    if ((!remote && !local) || failed === value) return <>{fallback}</>;
    return (
      <NextImage
        {...rest}
        src={value}
        alt={alt}
        unoptimized={remote || rest.unoptimized}
        onError={(e) => {
          setFailed(value);
          onError?.(e);
        }}
      />
    );
  }
  return <NextImage {...rest} src={src} alt={alt} onError={onError} />;
}
