import Link from "next/link";
import { getLatest } from "@/lib/editions";

export default async function LatestCard() {
  const edition = await getLatest();

  if (!edition) {
    return (
      <div className="block border border-[var(--rule)] p-8">
        <span className="block text-[9px] tracking-[0.28em] uppercase text-[var(--faint)] mb-4">
          Última edición
        </span>
        <span className="block text-[13px] text-[var(--ghost)]">
          Aún no hay ediciones publicadas.
        </span>
      </div>
    );
  }

  return (
    <Link
      href={`/ediciones/${edition.slug}`}
      className="latest-card block border p-8 no-underline text-inherit"
      style={{
        borderColor: "var(--rule)",
        transition: "border-color 0.25s cubic-bezier(0.16,1,0.3,1)",
      }}
    >
      <span className="block text-[9px] tracking-[0.28em] uppercase text-[var(--faint)] mb-4">
        Última edición
      </span>
      <span className="block font-serif text-[13px] text-[var(--ghost)] mb-1.5">
        #{edition.number}
      </span>
      <span
        className="block font-serif italic font-normal text-[var(--foreground)] mb-2"
        style={{ fontSize: "clamp(20px, 2.5vw, 26px)" }}
      >
        {edition.module}
      </span>
      <span className="block text-[11px] text-[var(--ghost)] mb-6">
        {edition.date}
      </span>
      <span className="latest-card-cta inline-flex items-center gap-1 text-[11px] tracking-[0.14em] uppercase text-[var(--accent)]">
        Leer <span aria-hidden>→</span>
      </span>

      <style>{`
        .latest-card:hover { border-color: var(--accent) !important; }
        .latest-card:hover .latest-card-cta { transform: translateX(4px); }
        .latest-card-cta { transition: transform 0.3s cubic-bezier(0.16,1,0.3,1); }
      `}</style>
    </Link>
  );
}
