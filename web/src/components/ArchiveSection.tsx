import Link from "next/link";
import { groupByModule } from "@/lib/editions";

export default async function ArchiveSection() {
  const groups = await groupByModule();
  if (groups.length === 0) return null;

  return (
    <section
      className="py-20 lg:py-24"
      style={{ borderTop: "1px solid var(--rule)", borderBottom: "1px solid var(--rule)" }}
    >
      <div className="max-w-[900px] mx-auto px-8 sm:px-12 lg:px-20">
        <div className="grid grid-cols-1 lg:grid-cols-[200px_1fr] gap-12 lg:gap-20">
          {/* Label col */}
          <div className="pt-1 flex flex-col gap-3">
            <span className="text-[9px] tracking-[0.32em] uppercase text-[var(--faint)]">
              Archivo
            </span>
            <Link
              href="/ediciones"
              className="text-[11px] tracking-[0.18em] uppercase no-underline self-start"
              style={{
                color: "var(--accent)",
                borderBottom: "1px solid var(--accent)",
                paddingBottom: "2px",
              }}
            >
              Ver todas →
            </Link>
          </div>

          {/* Groups col */}
          <div className="flex flex-col gap-12">
            {groups.map((group) => (
              <div key={group.module}>
                <p
                  className="text-[9px] tracking-[0.38em] uppercase mb-4 pb-3"
                  style={{
                    color: "var(--ghost)",
                    borderBottom: "1px solid var(--rule-light)",
                    fontVariant: "small-caps",
                    letterSpacing: "0.35em",
                  }}
                >
                  {group.module}
                </p>
                <div className="flex flex-col">
                  {group.editions.map((edition) => (
                    <Link
                      key={edition.slug}
                      href={`/ediciones/${edition.slug}`}
                      className="archive-row group flex items-baseline justify-between gap-6 py-4 no-underline"
                      style={{
                        borderBottom: "1px solid var(--rule-light)",
                        color: "var(--foreground)",
                      }}
                    >
                      <span className="flex items-baseline gap-5 min-w-0">
                        <span
                          className="font-serif italic shrink-0"
                          style={{
                            fontSize: "15px",
                            color: "var(--ghost)",
                            fontWeight: 400,
                          }}
                        >
                          #{edition.number}
                        </span>
                        <span className="text-[15px] font-light truncate">
                          {edition.module}
                        </span>
                      </span>
                      <span
                        className="shrink-0 text-[11px] text-right"
                        style={{ color: "var(--ghost)", minWidth: "max-content" }}
                      >
                        {edition.date}
                      </span>
                    </Link>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <style>{`
        .archive-row { transition: transform 0.2s ease-out, color 0.2s ease-out; }
        .archive-row:hover { transform: translateX(4px); color: var(--accent); }
      `}</style>
    </section>
  );
}
