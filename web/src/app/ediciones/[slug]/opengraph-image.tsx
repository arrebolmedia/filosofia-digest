import { ImageResponse } from "next/og";
import { getBySlug } from "@/lib/editions";

export const runtime = "edge";
export const alt = "Una Vida Examinada — Edición";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default async function Image({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const edition = await getBySlug(slug);

  const moduleName = edition?.module ?? "Edición";
  const issueTag   = edition ? `#${edition.number}` : "";
  const date       = edition?.date ?? "";

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          background: "#FAFAF8",
          display: "flex",
          flexDirection: "column",
          padding: "80px",
          fontFamily: "serif",
        }}
      >
        <div
          style={{
            fontSize: 18,
            letterSpacing: "0.32em",
            textTransform: "uppercase",
            color: "#9A9590",
            marginBottom: 16,
          }}
        >
          Una Vida Examinada
        </div>

        <div
          style={{
            fontSize: 24,
            color: "#4A6FA5",
            marginBottom: 24,
            letterSpacing: "0.05em",
          }}
        >
          {issueTag}
        </div>

        <div
          style={{
            fontSize: 84,
            fontStyle: "italic",
            color: "#1A1A1A",
            lineHeight: 1.1,
            fontWeight: 400,
            marginBottom: "auto",
            maxWidth: 1000,
          }}
        >
          {moduleName}
        </div>

        <div
          style={{
            height: 1,
            background: "#D8D4CC",
            marginTop: 32,
            marginBottom: 24,
            display: "flex",
          }}
        />

        <div
          style={{
            fontSize: 22,
            color: "#8A8580",
            display: "flex",
            justifyContent: "space-between",
          }}
        >
          <div>{date}</div>
          <div style={{ fontStyle: "italic" }}>ia.anthonycazares.cafe</div>
        </div>
      </div>
    ),
    size
  );
}
