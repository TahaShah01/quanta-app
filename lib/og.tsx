import { ImageResponse } from "next/og";
import { getSettings } from "@/lib/site";

export const OG_SIZE = { width: 1200, height: 630 } as const;
export const OG_TYPE = "image/png";

interface OgCardProps {
  kicker: string;
  title: string;
  description?: string;
  footerLeft?: string;
  footerRight?: string;
}

/** Shared Open Graph card: same monochrome look as the site. */
export function ogCard({
  kicker,
  title,
  description,
  footerLeft,
  footerRight,
}: OgCardProps) {
  const settings = getSettings();
  footerRight ??= (settings?.seo?.siteUrl || "").replace(/^https?:\/\//, "").replace(/\/$/, "");
  const fontSize = title.length > 70 ? 54 : title.length > 40 ? 66 : 80;

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          padding: "72px 80px",
          background: "#050505",
          color: "#f5f5f5",
          fontFamily: "sans-serif",
          position: "relative",
        }}
      >
        <div
          style={{
            position: "absolute",
            inset: 0,
            display: "flex",
            backgroundImage:
              "linear-gradient(to right, rgba(255,255,255,0.05) 1px, transparent 1px), linear-gradient(to bottom, rgba(255,255,255,0.05) 1px, transparent 1px)",
            backgroundSize: "60px 60px",
          }}
        />
        <div
          style={{
            position: "absolute",
            top: -160,
            right: -120,
            width: 620,
            height: 620,
            borderRadius: 620,
            display: "flex",
            background:
              "radial-gradient(circle, rgba(255,255,255,0.12) 0%, transparent 70%)",
          }}
        />

        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
            <div
              style={{
                width: 14,
                height: 14,
                borderRadius: 14,
                background: "#ffffff",
                display: "flex",
              }}
            />
            <span style={{ fontSize: 24, letterSpacing: 8, fontWeight: 600 }}>{(settings?.companyName || "Quanta").toUpperCase()}</span>
          </div>
          <span
            style={{
              fontSize: 20,
              letterSpacing: 4,
              textTransform: "uppercase",
              color: "#a1a1aa",
              border: "1px solid rgba(255,255,255,0.2)",
              borderRadius: 999,
              padding: "8px 20px",
            }}
          >
            {kicker}
          </span>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 24, maxWidth: 980 }}>
          <div
            style={{
              fontSize,
              fontWeight: 600,
              lineHeight: 1.05,
              letterSpacing: -2,
              display: "flex",
            }}
          >
            {title}
          </div>
          {description && (
            <div
              style={{
                fontSize: 28,
                lineHeight: 1.4,
                color: "#a1a1aa",
                display: "flex",
              }}
            >
              {description.length > 150 ? `${description.slice(0, 147)}…` : description}
            </div>
          )}
        </div>

        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            borderTop: "1px solid rgba(255,255,255,0.12)",
            paddingTop: 28,
            fontSize: 20,
            color: "#a1a1aa",
          }}
        >
          <span style={{ display: "flex" }}>{footerLeft ?? ""}</span>
          <span style={{ display: "flex", color: "#f5f5f5" }}>{footerRight}</span>
        </div>
      </div>
    ),
    { ...OG_SIZE }
  );
}
