import { ImageResponse } from "next/og";

export const runtime = "edge";
export const alt = "Una Vida Examinada — Digest filosófico diario";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default async function Image() {
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
        {/* Eyebrow */}
        <div
          style={{
            fontSize: 18,
            letterSpacing: "0.32em",
            textTransform: "uppercase",
            color: "#9A9590",
            marginBottom: 40,
          }}
        >
          Digest Diario · Filosofía
        </div>

        {/* Title */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            fontSize: 140,
            fontStyle: "italic",
            color: "#1A1A1A",
            lineHeight: 1.05,
            fontWeight: 400,
            marginBottom: "auto",
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
              fontSize: 22,
              fontStyle: "italic",
              color: "#6A6560",
              lineHeight: 1.45,
              maxWidth: 980,
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
            }}
          >
            Goethe
          </div>
        </div>
      </div>
    ),
    size
  );
}
