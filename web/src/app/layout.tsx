import type { Metadata } from "next";
import { Geist } from "next/font/google";
import { Playfair_Display } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const playfair = Playfair_Display({
  variable: "--font-playfair",
  subsets: ["latin"],
  style: ["normal", "italic"],
  weight: ["400", "600"],
});

const SITE_URL = "https://ia.anthonycazares.cafe";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: "Una Vida Examinada — Filosofía Diaria",
    template: "%s — Una Vida Examinada",
  },
  description:
    "Tres ideas filosóficas cada mañana. Textos de una licenciatura en filosofía, sintetizados con ayuda de Claude (IA).",
  openGraph: {
    type: "website",
    locale: "es_MX",
    url: SITE_URL,
    siteName: "Una Vida Examinada",
    title: "Una Vida Examinada — Filosofía Diaria",
    description:
      "Tres ideas filosóficas cada mañana. Textos de una licenciatura en filosofía, sintetizados con ayuda de Claude (IA).",
  },
  twitter: {
    card: "summary_large_image",
    title: "Una Vida Examinada — Filosofía Diaria",
    description:
      "Tres ideas filosóficas cada mañana. Textos de una licenciatura, sintetizados con ayuda de Claude (IA).",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="es"
      className={`${geistSans.variable} ${playfair.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
