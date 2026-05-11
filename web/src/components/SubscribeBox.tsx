import SubscribeForm from "@/app/suscribirse/SubscribeForm";

interface SubscribeBoxProps {
  variant?: "default" | "compact";
  eyebrow?: string;
  headline?: string;
  body?: string;
}

export default function SubscribeBox({
  variant = "default",
  eyebrow = "Recíbelo cada mañana",
  headline = "Tres ideas, en tu bandeja, antes del café.",
  body = "Lunes a viernes, a las 9am. Sin spam, sin condescendencia.",
}: SubscribeBoxProps) {
  const isCompact = variant === "compact";

  return (
    <section
      className={isCompact ? "py-14" : "py-20 lg:py-24"}
      style={{
        borderTop: "1px solid var(--rule)",
        borderBottom: "1px solid var(--rule)",
        background: "var(--paper, #F5F2EB)",
      }}
    >
      <div className="max-w-[660px] mx-auto px-8 sm:px-12">
        <div className="flex flex-col gap-5">
          <span
            className="text-[9px] tracking-[0.32em] uppercase"
            style={{ color: "var(--ghost)" }}
          >
            {eyebrow}
          </span>
          <h2
            className="font-serif italic font-normal leading-[1.15]"
            style={{
              fontSize: isCompact ? "clamp(24px, 3vw, 30px)" : "clamp(28px, 3.6vw, 36px)",
              color: "var(--foreground)",
            }}
          >
            {headline}
          </h2>
          <p
            className="text-[14px] leading-[1.7] font-light"
            style={{ color: "#2A2520", maxWidth: "52ch" }}
          >
            {body}
          </p>
          <div className="mt-2">
            <SubscribeForm />
          </div>
        </div>
      </div>
    </section>
  );
}
