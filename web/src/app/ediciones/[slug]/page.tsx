import { notFound } from "next/navigation";
import Link from "next/link";
import { getEditions, getBySlug } from "@/lib/editions";
import { parseEditionHtml } from "@/lib/parseEdition";
import SubscribeBox from "@/components/SubscribeBox";
import type { Metadata } from "next";
import type { ReactNode } from "react";

function renderInline(text: string): ReactNode[] {
  const parts = text.split(/(\*\*?.+?\*\*?)/g);
  return parts.map((part, i) => {
    if (part.startsWith("**") && part.endsWith("**")) {
      return <strong key={i}>{part.slice(2, -2)}</strong>;
    }
    if (part.startsWith("*") && part.endsWith("*")) {
      return <em key={i}>{part.slice(1, -1)}</em>;
    }
    return part;
  });
}

export const revalidate = 300;

export async function generateStaticParams() {
  const eds = await getEditions();
  return eds.map((e) => ({ slug: e.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const edition = await getBySlug(slug);
  if (!edition) return {};
  return {
    title: `#${edition.number} ${edition.module} — Una Vida Examinada`,
    description: `Edición ${edition.number}: ${edition.module}. ${edition.date}.`,
  };
}

export default async function Page({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const edition = await getBySlug(slug);
  if (!edition) notFound();

  let parsed = null;
  try {
    const res = await fetch(
      `https://ia.anthonycazares.cafe/edicion-${slug}.html`,
      { next: { revalidate: 3600 } }
    );
    if (res.ok) {
      const html = await res.text();
      parsed = parseEditionHtml(html);
    }
  } catch {
    // render with metadata only
  }

  return (
    <div
      style={{ background: "var(--background)", color: "var(--foreground)" }}
      className="min-h-[100dvh] flex flex-col"
    >
      {/* ── Header ── */}
      <header style={{ borderBottom: "1px solid var(--rule)" }} className="py-8">
        <div className="max-w-[660px] mx-auto px-6">
          <Link
            href="/ediciones"
            className="text-[10px] tracking-[0.22em] uppercase transition-colors duration-200"
            style={{ color: "var(--ghost)" }}
          >
            ← Archivo
          </Link>
        </div>
      </header>

      {/* ── Issue header ── */}
      <div style={{ borderBottom: "1px solid var(--rule)" }} className="py-14 text-center">
        <div className="max-w-[660px] mx-auto px-6 flex flex-col items-center gap-3">
          <p className="text-[10px] tracking-[0.35em] uppercase" style={{ color: "var(--ghost)" }}>
            Digest Diario · Filosofía
          </p>
          <h1
            className="font-serif italic font-normal leading-[1.05]"
            style={{ fontSize: "clamp(40px, 6vw, 56px)", color: "var(--foreground)" }}
          >
            Una Vida Examinada
          </h1>
          <p className="text-sm tracking-[0.06em]" style={{ color: "var(--accent)" }}>
            {parsed?.issue ?? `#${edition.number}`}
          </p>
          <div className="flex flex-col items-center gap-1 mt-1">
            <span className="text-[9px] tracking-[0.3em] uppercase" style={{ color: "var(--faint)" }}>
              Fecha de publicación
            </span>
            <p className="text-[13px]" style={{ color: "var(--ghost)" }}>
              {parsed?.date ?? edition.date}
            </p>
          </div>
          <p className="text-[11px] tracking-[0.1em] uppercase mt-1" style={{ color: "var(--accent)" }}>
            {parsed?.module ?? edition.module}
          </p>
        </div>
      </div>

      {/* ── Content ── */}
      <div className="max-w-[660px] mx-auto px-6 w-full flex-1">
        {parsed ? (
          <>
            {/* Editorial */}
            <div
              style={{ borderTop: "2px solid var(--foreground)", borderBottom: "1px solid var(--rule)" }}
              className="py-8 my-10"
            >
              <span className="text-[9px] tracking-[0.3em] uppercase block mb-5" style={{ color: "var(--ghost)" }}>
                Nota editorial
              </span>
              <div className="flex flex-col gap-4">
                {parsed.editorial.map((p, i) => (
                  <p key={i} className="text-[17px] leading-[1.85] font-light text-justify" style={{ color: "#2A2520" }}>
                    {renderInline(p)}
                  </p>
                ))}
              </div>
            </div>

            {/* Items */}
            {parsed.items.map((item, idx) => (
              <article key={idx} style={{ borderTop: "1px solid var(--rule-light)" }} className="py-14">
                <div className="flex gap-4 items-baseline mb-3">
                  <span
                    className="text-[9px] tracking-[0.2em] uppercase font-semibold"
                    style={{ color: item.badgeColor }}
                  >
                    {item.badge}
                  </span>
                  <span className="text-[11px]" style={{ color: "var(--ghost)" }}>
                    {item.source}
                  </span>
                </div>

                <h2
                  className="font-serif font-normal leading-[1.3] text-center mb-8"
                  style={{ fontSize: "clamp(22px, 4vw, 28px)", color: "var(--foreground)" }}
                >
                  {item.title}
                </h2>

                <div className="flex flex-col gap-3 mb-8">
                  {item.paragraphs.map((p, i) => (
                    <p key={i} className="text-[16.5px] leading-[1.8] font-light text-justify" style={{ color: "#2A2520" }}>
                      {renderInline(p)}
                    </p>
                  ))}
                </div>

                {item.keywords.length > 0 && (
                  <div className="flex flex-wrap gap-2 mt-4">
                    {item.keywords.map((kw) => (
                      <span
                        key={kw}
                        className="text-[10px] tracking-[0.08em] px-3 py-1"
                        style={{ color: "var(--ghost)", border: "1px solid var(--rule)" }}
                      >
                        {kw}
                      </span>
                    ))}
                  </div>
                )}
              </article>
            ))}

            <div style={{ borderTop: "1px solid var(--rule)" }} className="py-8 text-center">
              <Link
                href="/ediciones"
                className="text-[13px] transition-colors duration-200 hover:text-[var(--foreground)]"
                style={{ color: "var(--ghost)" }}
              >
                ← Volver al archivo
              </Link>
            </div>
          </>
        ) : (
          <p className="py-20 text-center text-sm" style={{ color: "var(--ghost)" }}>
            No se pudo cargar el contenido de esta edición.
          </p>
        )}
      </div>

      {/* ── Suscripción ── */}
      <SubscribeBox
        eyebrow="¿Te gustó esta edición?"
        headline="Recíbelas todas, en orden, cada mañana."
        body="Tres ideas conectadas a un módulo del programa. Lunes a viernes, a las 9am. Sin spam."
      />

      {/* ── Footer ── */}
      <footer style={{ borderTop: "2px solid var(--foreground)" }} className="py-10 text-center">
        <div className="max-w-[660px] mx-auto px-6">
          <p className="font-serif italic text-[20px] mb-2" style={{ color: "var(--foreground)" }}>
            Una Vida Examinada
          </p>
          <p className="text-[11px] leading-[1.9]" style={{ color: "var(--ghost)" }}>
            Sintetizado por Claude · Lunes a viernes
          </p>
          <p className="text-[11px] mt-2">
            <a href="mailto:anthony@arrebol.com.mx" style={{ color: "#8A8580" }}>
              Contacto
            </a>
          </p>
        </div>
      </footer>
    </div>
  );
}
