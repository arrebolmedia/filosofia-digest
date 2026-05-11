"use client";

import { motion } from "framer-motion";

const ease = [0.16, 1, 0.3, 1] as const;

const fadeUp = {
  hidden: { opacity: 0, y: 24 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { duration: 0.8, ease, delay: i * 0.1 },
  }),
};

export default function HeroEntrance() {
  return (
    <div className="flex flex-col gap-10 lg:gap-14">
      {/* Eyebrow */}
      <motion.p
        custom={0}
        initial="hidden"
        animate="visible"
        variants={fadeUp}
        className="text-[10px] tracking-[0.32em] uppercase text-[var(--faint)] font-normal"
      >
        Digest Diario · Filosofía
      </motion.p>

      {/* Title */}
      <motion.h1
        custom={1}
        initial="hidden"
        animate="visible"
        variants={fadeUp}
        className="font-serif italic font-normal text-[var(--foreground)] leading-[1.05]"
        style={{ fontSize: "clamp(52px, 8vw, 96px)" }}
      >
        Una Vida<br />Examinada
      </motion.h1>

      {/* Subtitle */}
      <motion.p
        custom={2}
        initial="hidden"
        animate="visible"
        variants={fadeUp}
        className="text-[16px] text-[var(--muted)] leading-[1.75] font-light max-w-sm"
      >
        Tres ideas filosóficas cada mañana.
        Leo los textos de una licenciatura
        en filosofía y te mando lo útil.
      </motion.p>

      {/* CTA */}
      <motion.a
        custom={6}
        initial="hidden"
        animate="visible"
        variants={fadeUp}
        href="/suscribirse"
        className="self-start text-[11px] tracking-[0.2em] uppercase text-[var(--accent)] border-b border-[var(--accent)] pb-0.5 hover:opacity-70 transition-opacity duration-300"
      >
        Suscribirme
      </motion.a>
    </div>
  );
}
