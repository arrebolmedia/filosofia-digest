'use client';

import { motion } from 'framer-motion';
import type { Variants } from 'framer-motion';

const features = [
  {
    numeral: 'I',
    title: 'Desde el principio',
    body: 'El curso empieza en Tales de Mileto y avanza cronológicamente. Cada suscriptor recorre el mismo camino — no hay atajos, no hay spoilers.',
  },
  {
    numeral: 'II',
    title: 'Tres ideas por día',
    body: 'Nada más, nada menos. Cada correo presenta tres conceptos o pasajes con contexto suficiente para entender y una pregunta para quedarte pensando.',
  },
  {
    numeral: 'III',
    title: 'Lunes a viernes',
    body: 'Un ritmo humano. Los fines de semana son tuyos. El lunes llega el siguiente correo puntual a las 9am, hora de México.',
  },
];

const containerVariants: Variants = {
  hidden: {},
  visible: {
    transition: { staggerChildren: 0.15 },
  },
};

const itemVariants: Variants = {
  hidden: { opacity: 0, y: 24 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.55, ease: [0.25, 0.1, 0.25, 1] as [number, number, number, number] },
  },
};

export default function FeaturesSection() {
  return (
    <section
      className="w-full max-w-6xl mx-auto px-6 md:px-12 py-20"
    >
      <p
        className="text-xs tracking-[0.18em] uppercase mb-12"
        style={{
          color: '#9E9A94',
          fontFamily: 'var(--font-geist-sans)',
        }}
      >
        Cómo funciona
      </p>

      <motion.div
        className="grid grid-cols-1 md:grid-cols-3 gap-10 md:gap-8"
        variants={containerVariants}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, margin: '-60px' }}
      >
        {features.map((f) => (
          <motion.article
            key={f.numeral}
            variants={itemVariants}
            className="relative"
          >
            {/* Roman numeral background decoration */}
            <span
              aria-hidden="true"
              className="absolute -top-4 -left-2 select-none leading-none pointer-events-none"
              style={{
                fontFamily: 'var(--font-playfair)',
                fontStyle: 'italic',
                fontWeight: 700,
                fontSize: 'clamp(5rem, 10vw, 7.5rem)',
                color: '#E8E4DC',
                zIndex: 0,
                lineHeight: 1,
              }}
            >
              {f.numeral}
            </span>

            {/* Card content, sits above the numeral */}
            <div className="relative z-10 pt-12 md:pt-14">
              <h3
                className="text-lg mb-3"
                style={{
                  fontFamily: 'var(--font-playfair)',
                  fontStyle: 'italic',
                  fontWeight: 600,
                  color: '#1A1A1A',
                }}
              >
                {f.title}
              </h3>
              <p
                className="text-sm leading-relaxed"
                style={{
                  color: '#5A5550',
                  fontFamily: 'var(--font-geist-sans)',
                }}
              >
                {f.body}
              </p>
            </div>

            {/* Bottom accent line */}
            <div
              className="mt-6"
              style={{
                width: '32px',
                height: '1.5px',
                background: '#4A6FA5',
                borderRadius: '1px',
                opacity: 0.5,
              }}
            />
          </motion.article>
        ))}
      </motion.div>
    </section>
  );
}
