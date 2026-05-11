export interface Edition {
  number: string;
  issue: number;
  module: string;
  moduleKey: string;
  date: string;
  slug: string;
}

interface EntryMeta {
  issue: number;
  slug: string;
  date: string;
  moduleName: string;
  url: string;
}

function moduleKey(moduleName: string): string {
  return moduleName.replace(/\s*·\s*Parte\s+\w+$/i, "").trim();
}

function toEdition(e: EntryMeta): Edition {
  const num = String(e.issue).padStart(3, "0");
  const mod = e.moduleName.replace(/^M\d+\.\s*/, "");
  return {
    number: num,
    issue: e.issue,
    module: mod,
    moduleKey: moduleKey(mod),
    date: e.date,
    slug: num, // Next.js uses "001", publisher uses "edicion-001"
  };
}

const EDITIONS_URL =
  process.env.EDITIONS_URL ??
  "https://ia.anthonycazares.cafe/editions.json";

export async function getEditions(): Promise<Edition[]> {
  try {
    const res = await fetch(EDITIONS_URL, { next: { revalidate: 300 } });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data: EntryMeta[] = await res.json();
    return data.map(toEdition).sort((a, b) => a.issue - b.issue);
  } catch {
    return [];
  }
}

export async function getLatest(): Promise<Edition | null> {
  const eds = await getEditions();
  return eds[eds.length - 1] ?? null;
}

export async function getBySlug(slug: string): Promise<Edition | undefined> {
  const eds = await getEditions();
  return eds.find((e) => e.slug === slug);
}

export async function groupByModule(): Promise<{ module: string; editions: Edition[] }[]> {
  const eds = await getEditions();
  const map = new Map<string, Edition[]>();
  for (const e of eds) {
    if (!map.has(e.moduleKey)) map.set(e.moduleKey, []);
    map.get(e.moduleKey)!.push(e);
  }
  return Array.from(map.entries()).map(([module, editions]) => ({ module, editions }));
}

// Keep sync versions for generateStaticParams (needs editions at build time)
export const editions: Edition[] = [];
export function getBySlugSync(slug: string): Edition | undefined {
  return editions.find((e) => e.slug === slug);
}
