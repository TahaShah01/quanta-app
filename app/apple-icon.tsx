import { readFileSync } from "node:fs";
import { join } from "node:path";
import { ImageResponse } from "next/og";

export const size = { width: 180, height: 180 };
export const contentType = "image/png";

// iOS wants an opaque square and rounds the corners itself, so the round logo
// sits on the same deep navy as its own disc.
export default function AppleIcon() {
  const svg = readFileSync(join(process.cwd(), "public", "logo.svg"));
  const src = `data:image/svg+xml;base64,${svg.toString("base64")}`;

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "#03101A",
        }}
      >
        <img src={src} width={156} height={156} alt="" />
      </div>
    ),
    { ...size }
  );
}
