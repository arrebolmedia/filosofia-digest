import HeroEntrance from "@/components/HeroEntrance";
import LatestCard from "@/components/LatestCard";
import SubscribeBox from "@/components/SubscribeBox";
import ArchiveSection from "@/components/ArchiveSection";

export default function Home() {
  return (
    <div className="flex flex-col" style={{ background: "var(--background)", color: "var(--foreground)" }}>

      {/* ── Hero — asymmetric split ── */}
      <section
        className="min-h-[100dvh] grid grid-cols-1 lg:grid-cols-[1fr_1fr]"
        style={{ borderBottom: "1px solid var(--rule)" }}
      >
        {/* Left: content col */}
        <div className="flex flex-col justify-center px-8 sm:px-12 lg:px-20 py-20 lg:py-0">
          <div className="max-w-md">
            <HeroEntrance />
          </div>
        </div>

        {/* Right: decorative whitespace with subtle rule */}
        <div
          className="hidden lg:flex flex-col justify-end pb-20 px-16 relative"
          style={{ borderLeft: "1px solid var(--rule)" }}
        >
          {/* Decorative pull-quote watermark */}
          <p
            className="font-serif italic text-[var(--rule-light)] select-none leading-[1.25]"
            aria-hidden="true"
            style={{ fontSize: "clamp(22px, 2.4vw, 30px)" }}
          >
            &ldquo;El que no sabe llevar su contabilidad por espacio de tres mil años, se queda como un ignorante en la oscuridad y sólo vive al día.&rdquo;
          </p>
          <p
            className="mt-4 text-[10px] tracking-[0.28em] uppercase"
            style={{ color: "var(--rule)" }}
            aria-hidden="true"
          >
            Goethe
          </p>
        </div>
      </section>

      {/* ── Manifiesto ── */}
      <section
        className="py-20 lg:py-28"
        style={{ borderBottom: "1px solid var(--rule)" }}
      >
        <div className="max-w-[900px] mx-auto px-8 sm:px-12 lg:px-20">
          <div className="grid grid-cols-1 lg:grid-cols-[200px_1fr] gap-12 lg:gap-20">
            {/* Label col */}
            <div className="pt-1">
              <span className="text-[9px] tracking-[0.32em] uppercase text-[var(--faint)]">
                Por qué existe esto
              </span>
            </div>

            {/* Text col */}
            <div className="flex flex-col gap-5">
              <p
                className="text-[17px] leading-[1.85] font-light"
                style={{ color: "#2A2520", textAlign: "justify" }}
              >
                La filosofía tiene mala fama. Se la imagina como un pasatiempo
                de viejos con barba, como algo que no sirve para pagar la renta,
                como preguntas que nunca tienen respuesta. Y sin embargo, es el
                único lugar donde se formulan las preguntas que realmente
                importan.
              </p>
              <p
                className="text-[17px] leading-[1.85] font-light"
                style={{ color: "#2A2520", textAlign: "justify" }}
              >
                <em
                  className="font-serif italic"
                  style={{ color: "var(--foreground)" }}
                >
                  Una Vida Examinada
                </em>{" "}
                es un digest diario que toma textos de un programa serio de
                licenciatura en filosofía y, con ayuda de Claude (IA), los
                traduce sin sacrificar el rigor.
              </p>
              <p
                className="text-[17px] leading-[1.85] font-light"
                style={{ color: "#2A2520", textAlign: "justify" }}
              >
                Cada edición: tres fragmentos sintetizados, una nota editorial
                que los hilvana, y la promesa de que algo en tu forma de ver el
                mundo se moverá un poco.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ── Última edición ── */}
      <section className="py-20 lg:py-24">
        <div className="max-w-[900px] mx-auto px-8 sm:px-12 lg:px-20">
          <div className="grid grid-cols-1 lg:grid-cols-[200px_1fr] gap-12 lg:gap-20">
            {/* Label col */}
            <div className="pt-1">
              <span className="text-[9px] tracking-[0.32em] uppercase text-[var(--faint)]">
                Última edición
              </span>
            </div>

            {/* Card col */}
            <div>
              <LatestCard />
            </div>
          </div>
        </div>
      </section>

      {/* ── Archivo ── */}
      <ArchiveSection />

      {/* ── Suscripción ── */}
      <SubscribeBox />

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
          <p className="mt-2 text-[11px] text-[var(--ghost)]">
            <a
              href="mailto:anthony@arrebol.com.mx"
              className="text-[#8A8580] no-underline hover:text-[var(--foreground)] transition-colors duration-200"
            >
              Contacto
            </a>
          </p>
        </div>
      </footer>
    </div>
  );
}
