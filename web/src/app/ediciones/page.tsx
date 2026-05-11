import { groupByModule } from "@/lib/editions";
import EdicionesClient from "./EdicionesClient";
import SubscribeBox from "@/components/SubscribeBox";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Archivo",
  description: "Todas las ediciones del digest filosófico, agrupadas por módulo.",
  openGraph: {
    title: "Archivo — Una Vida Examinada",
    description: "Todas las ediciones del digest filosófico, agrupadas por módulo.",
  },
  twitter: {
    title: "Archivo — Una Vida Examinada",
    description: "Todas las ediciones del digest filosófico, agrupadas por módulo.",
  },
};

export const revalidate = 300;

export default async function EdicionesPage() {
  const groups = await groupByModule();
  return <EdicionesClient groups={groups} beforeFooter={<SubscribeBox />} />;
}
