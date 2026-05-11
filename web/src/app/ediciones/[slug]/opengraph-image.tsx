import { ImageResponse } from "next/og";
import { getBySlug } from "@/lib/editions";

export const runtime = "edge";
export const alt = "Una Vida Examinada — Edición";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

const PLAYFAIR_REGULAR = "https://fonts.gstatic.com/s/playfairdisplay/v40/nuFRD-vYSZviVYUb_rj3ij__anPXDTnCjmHKM4nYO7KN_qiTbtY.ttf";
const PLAYFAIR_ITALIC  = "https://fonts.gstatic.com/s/playfairdisplay/v40/nuFvD-vYSZviVYUb_rj3ij__anPXJzDwcbmjWBN2PKdFvUDQ.ttf";

async function loadFont(url: string): Promise<ArrayBuffer> {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Font fetch failed: ${url}`);
  return res.arrayBuffer();
}

export default async function Image({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const edition = await getBySlug(slug);

  const moduleName = edition?.module ?? "Edición";
  const issueTag   = edition ? `#${edition.number}` : "";
  const date       = edition?.date ?? "";

  const [regular, italic] = await Promise.all([
    loadFont(PLAYFAIR_REGULAR),
    loadFont(PLAYFAIR_ITALIC),
  ]);

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
          fontFamily: "Playfair",
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
            display: "flex",
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
    {
      ...size,
      fonts: [
        { name: "Playfair", data: regular, style: "normal", weight: 400 },
        { name: "Playfair", data: italic,  style: "italic", weight: 400 },
      ],
    }
  );
}
