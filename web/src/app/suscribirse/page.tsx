import type { Metadata } from 'next';
import { Playfair_Display } from 'next/font/google';
import SubscribeForm from './SubscribeForm';
import FeaturesSection from './FeaturesSection';

export const metadata: Metadata = {
  title: 'Suscribirse — Una Vida Examinada',
  description:
    'Recibe tres ideas filosóficas cada mañana, de lunes a viernes. Comienza desde el principio con Digest.',
};

const playfair = Playfair_Display({
  subsets: ['latin'],
  variable: '--font-playfair',
  display: 'swap',
});

export default function SuscribirsePage() {
  return (
    <div
      className={`${playfair.variable} min-h-screen flex flex-col`}
      style={{ background: '#FAFAF8', color: '#1A1A1A' }}
    >
      {/* ── Header ── */}
      <header
        className="w-full px-6 md:px-12 py-5 flex items-center"
        style={{ borderBottom: '1px solid #E8E4DC' }}
      >
        <a
          href="/"
          className="group inline-flex items-center gap-1.5 text-sm transition-colors"
          style={{
            color: '#6B6560',
            fontFamily: 'var(--font-geist-sans)',
            textDecoration: 'none',
          }}
        >
          <span
            className="inline-block transition-transform duration-200 group-hover:-translate-x-0.5"
            aria-hidden="true"
          >
            ←
          </span>
          <span className="group-hover:underline underline-offset-2">
            Una Vida Examinada
          </span>
        </a>
      </header>

      {/* ── Hero (asymmetric) ── */}
      <section className="flex-1 w-full max-w-6xl mx-auto px-6 md:px-12 pt-16 pb-20">
        {/* Desktop: two-col asymmetric | Mobile: single col */}
        <div className="flex flex-col lg:flex-row lg:items-start lg:gap-20">

          {/* Left — editorial copy */}
          <div className="flex-1 lg:max-w-[520px]">
            <p
              className="text-xs tracking-[0.18em] uppercase mb-5"
              style={{
                color: '#9E9A94',
                fontFamily: 'var(--font-geist-sans)',
              }}
            >
              Filosofía · Lunes a viernes
            </p>

            <h1
              className="text-5xl md:text-6xl lg:text-7xl leading-[1.08] mb-7"
              style={{
                fontFamily: 'var(--font-playfair)',
                fontStyle: 'italic',
                fontWeight: 700,
                color: '#1A1A1A',
                letterSpacing: '-0.02em',
              }}
            >
              Una Vida<br />Examinada
            </h1>

            <p
              className="text-base md:text-lg leading-relaxed max-w-md"
              style={{
                color: '#4A4540',
                fontFamily: 'var(--font-geist-sans)',
              }}
            >
              Tres ideas cada mañana, en orden.
              Introducción, metafísica, ética, política —
              el programa completo de filosofía,
              sintetizado para el lector curioso.
            </p>

            {/* Decorative rule */}
            <div
              className="mt-8 mb-0 hidden lg:block"
              style={{
                width: '48px',
                height: '2px',
                background: '#4A6FA5',
                borderRadius: '1px',
              }}
            />
          </div>

          {/* Right — form card, anchored top in desktop */}
          <div className="mt-12 lg:mt-2 lg:w-[380px] lg:shrink-0">
            <div
              className="rounded-xl px-7 py-8"
              style={{
                background: '#FFFFFF',
                border: '1px solid #E8E4DC',
                boxShadow: '0 2px 16px rgba(0,0,0,0.06)',
              }}
            >
              <p
                className="text-xs tracking-[0.15em] uppercase mb-1"
                style={{
                  color: '#9E9A94',
                  fontFamily: 'var(--font-geist-sans)',
                }}
              >
                Gratis · Sin compromiso
              </p>
              <h2
                className="text-xl mb-1"
                style={{
                  fontFamily: 'var(--font-playfair)',
                  fontStyle: 'italic',
                  fontWeight: 600,
                  color: '#1A1A1A',
                }}
              >
                Empieza desde el principio
              </h2>
              <p
                className="text-sm mb-6 leading-relaxed"
                style={{
                  color: '#6B6560',
                  fontFamily: 'var(--font-geist-sans)',
                }}
              >
                Ingresa tu correo y el próximo día hábil recibes tu primer
                entrega.
              </p>

              <SubscribeForm />
            </div>
          </div>
        </div>
      </section>

      {/* ── Divider ── */}
      <div
        className="w-full max-w-6xl mx-auto px-6 md:px-12"
        style={{ borderTop: '1px solid #E8E4DC' }}
      />

      {/* ── Features ── */}
      <FeaturesSection />

      {/* ── Footer ── */}
      <footer
        className="w-full px-6 md:px-12 py-8 mt-auto"
        style={{ borderTop: '1px solid #E8E4DC' }}
      >
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <p
            className="text-xs"
            style={{
              color: '#9E9A94',
              fontFamily: 'var(--font-geist-sans)',
            }}
          >
            © {new Date().getFullYear()} Una Vida Examinada · Digest filosófico
          </p>
          <p
            className="text-xs"
            style={{
              color: '#B8B4AC',
              fontFamily: 'var(--font-geist-sans)',
            }}
          >
            &ldquo;Una vida sin examen no merece ser vivida.&rdquo; — Sócrates
          </p>
        </div>
      </footer>
    </div>
  );
}
