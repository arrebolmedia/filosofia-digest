"use client";

import { motion } from "framer-motion";
import type { Variants } from "framer-motion";
import Link from "next/link";
import type { Edition } from "@/lib/editions";

interface ModuleGroup {
  module: string;
  editions: Edition[];
}

interface Props {
  groups: ModuleGroup[];
  beforeFooter?: React.ReactNode;
}

const rowVariants: Variants = {
  hidden: { opacity: 0, x: -8 },
  visible: (i: number) => ({
    opacity: 1,
    x: 0,
    transition: { delay: i * 0.07, duration: 0.4, ease: "easeOut" as const },
  }),
};

const groupVariants: Variants = {
  hidden: { opacity: 0, y: 16 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.5, ease: "easeOut" as const },
  },
};

export default function EdicionesClient({ groups, beforeFooter }: Props) {
  return (
    <main
      className="flex flex-col flex-1"
      style={{ background: "var(--background)", color: "var(--foreground)" }}
    >
      {/* ── Header ── */}
      <header
        className="px-8 sm:px-12 lg:px-20 py-8"
        style={{ borderBottom: "1px solid var(--rule)" }}
      >
        <Link
          href="/"
          className="text-[11px] tracking-[0.22em] uppercase transition-colors duration-200"
          style={{ color: "var(--muted)", textDecoration: "none" }}
          onMouseEnter={(e) =>
            (e.currentTarget.style.color = "var(--foreground)")
          }
          onMouseLeave={(e) =>
            (e.currentTarget.style.color = "var(--muted)")
          }
        >
          ← Una Vida Examinada
        </Link>
      </header>

      {/* ── Page title ── */}
      <div
        className="px-8 sm:px-12 lg:px-20 pt-16 pb-14"
        style={{ borderBottom: "1px solid var(--rule)" }}
      >
        <p
          className="text-[9px] tracking-[0.38em] uppercase mb-3"
          style={{ color: "var(--ghost)" }}
        >
          Todas las ediciones
        </p>
        <h1
          className="font-serif italic font-normal leading-none"
          style={{ fontSize: "clamp(40px, 6vw, 72px)", color: "var(--foreground)" }}
        >
          Archivo
        </h1>
      </div>

      {/* ── Groups ── */}
      <div className="flex-1 px-8 sm:px-12 lg:px-20 py-16 flex flex-col gap-16">
        {groups.map((group) => (
          <motion.section
            key={group.module}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-60px" }}
            variants={groupVariants}
          >
            {/* Module heading */}
            <p
              className="text-[9px] tracking-[0.38em] uppercase mb-5 pb-3"
              style={{
                color: "var(--ghost)",
                borderBottom: "1px solid var(--rule-light)",
                fontVariant: "small-caps",
                letterSpacing: "0.35em",
              }}
            >
              {group.module}
            </p>

            {/* Edition rows */}
            <div className="flex flex-col">
              {group.editions.map((edition, i) => (
                <motion.div
                  key={edition.slug}
                  custom={i}
                  variants={rowVariants}
                >
                  <Link
                    href={`/ediciones/${edition.slug}`}
                    className="group flex items-baseline justify-between gap-6 py-4 no-underline transition-all duration-200"
                    style={{
                      borderBottom: "1px solid var(--rule-light)",
                      color: "var(--foreground)",
                      textDecoration: "none",
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.transform = "translateX(4px)";
                      e.currentTarget.style.color = "var(--accent)";
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.transform = "translateX(0)";
                      e.currentTarget.style.color = "var(--foreground)";
                    }}
                  >
                    {/* Left: number + title */}
                    <span className="flex items-baseline gap-5 min-w-0">
                      <span
                        className="font-serif italic shrink-0"
                        style={{
                          fontSize: "15px",
                          color: "var(--ghost)",
                          transition: "color 200ms",
                          fontWeight: 400,
                        }}
                      >
                        #{edition.number}
                      </span>
                      <span
                        className="text-[15px] font-light truncate"
                        style={{ transition: "color 200ms" }}
                      >
                        {edition.module}
                      </span>
                    </span>

                    {/* Right: date */}
                    <span
                      className="shrink-0 text-[11px] text-right"
                      style={{
                        color: "var(--ghost)",
                        transition: "color 200ms",
                        minWidth: "max-content",
                      }}
                    >
                      {edition.date}
                    </span>
                  </Link>
                </motion.div>
              ))}
            </div>
          </motion.section>
        ))}
      </div>

      {/* ── Slot before footer (e.g. SubscribeBox) ── */}
      {beforeFooter}

      {/* ── Footer ── */}
      <footer
        className="py-12 text-center mt-auto"
        style={{ borderTop: "2px solid var(--foreground)" }}
      >
        <div className="max-w-[660px] mx-auto px-8">
          <p
            className="font-serif italic font-normal mb-2"
            style={{ fontSize: "22px", color: "var(--foreground)" }}
          >
            Una Vida Examinada
          </p>
          <p className="text-[11px] leading-[1.9] text-[var(--ghost)]">
            Sintetizado por Claude · Lunes a viernes
          </p>
        </div>
      </footer>
    </main>
  );
}
