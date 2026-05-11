import { ImageResponse } from "next/og";

export const runtime = "edge";
export const alt = "Una Vida Examinada — Digest filosófico diario";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

const PLAYFAIR_REGULAR = "https://fonts.gstatic.com/s/playfairdisplay/v40/nuFRD-vYSZviVYUb_rj3ij__anPXDTnCjmHKM4nYO7KN_qiTbtY.ttf";
const PLAYFAIR_ITALIC  = "https://fonts.gstatic.com/s/playfairdisplay/v40/nuFvD-vYSZviVYUb_rj3ij__anPXJzDwcbmjWBN2PKdFvUDQ.ttf";

async function loadFont(url: string): Promise<ArrayBuffer> {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Font fetch failed: ${url}`);
  return res.arrayBuffer();
}

export default async function Image() {
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
        }}
      >
        {/* Eyebrow */}
        <div
          style={{
            fontSize: 18,
            letterSpacing: "0.32em",
            textTransform: "uppercase",
            color: "#9A9590",
            marginBottom: 40,
            fontFamily: "Playfair",
          }}
        >
          Digest Diario · Filosofía
        </div>

        {/* Title */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            fontSize: 160,
            fontStyle: "italic",
            color: "#1A1A1A",
            lineHeight: 1.0,
            fontWeight: 400,
            marginBottom: "auto",
            fontFamily: "Playfair",
          }}
        >
          <span>Una Vida</span>
          <span>Examinada</span>
        </div>

        {/* Divider */}
        <div
          style={{
            height: 1,
            background: "#D8D4CC",
            marginTop: 40,
            marginBottom: 32,
            display: "flex",
          }}
        />

        {/* Quote */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: 12,
          }}
        >
          <div
            style={{
              fontSize: 24,
              fontStyle: "italic",
              color: "#6A6560",
              lineHeight: 1.4,
              maxWidth: 980,
              fontFamily: "Playfair",
            }}
          >
            “El que no sabe llevar su contabilidad por espacio de tres mil años, se queda como un ignorante en la oscuridad y sólo vive al día.”
          </div>
          <div
            style={{
              fontSize: 14,
              letterSpacing: "0.28em",
              textTransform: "uppercase",
              color: "#B0ABA5",
              fontFamily: "Playfair",
            }}
          >
            Goethe
          </div>
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
