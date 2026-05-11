/**
 * seed-faltantes.ts — Agrega filósofos presocráticos faltantes al timeline
 * Leucipo, Meliso de Samos, Diógenes de Apolonia, Filolao, Arquelao
 */
import 'dotenv/config';
import { readFileSync, existsSync } from 'fs';
import { createRequire } from 'module';
import Anthropic from '@anthropic-ai/sdk';
import { PrismaClient } from '@prisma/client';

const require = createRequire(import.meta.url);
const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
const prisma = new PrismaClient();

const CATEGORY_MAP: Record<string, number> = {
  etica: 1, metafisica: 2, epistemologia: 3,
  logica: 4, politica: 5, estetica: 6, mente: 7,
};
const PERIOD_ID = 1;
const SCHOOL_ID = 1;

const MISSING = [
  { name: 'Leucipo',               slug: 'leucipo',                     count: 4 },
  { name: 'Meliso de Samos',       slug: 'meliso-de-samos',             count: 3 },
  { name: 'Diógenes de Apolonia',  slug: 'diogenes-de-apolonia',        count: 3 },
  { name: 'Filolao',               slug: 'filolao',                     count: 4 },
  { name: 'Arquelao',              slug: 'arquelao',                    count: 3 },
];

const SYSTEM = `Eres un agente del swarm de Ruflo especializado en filosofía presocrática.
Extrae datos filosóficos y responde SOLO con JSON válido:
{
  "philosopher": { "name":string, "slug":string, "birthYear":number|null, "deathYear":number|null, "nationality":string, "bioShort":string, "bioLong":string },
  "statements": [{ "text":string, "categorySlug":string, "isDirectQuote":boolean, "context":string, "difficultyLevel":1|2|3 }]
}
categorySlug: etica|metafisica|epistemologia|logica|politica|estetica|mente. Fechas negativas = a.C.`;

async function extract(name: string, slug: string, count: number, section: string) {
  const res = await anthropic.messages.create({
    model: 'claude-sonnet-4-6',
    max_tokens: 3000,
    system: SYSTEM,
    messages: [{ role: 'user', content: `Extrae exactamente ${count} ideas de "${name}". Si el texto es escaso complementa con tu conocimiento experto.\n\nTEXTO:\n---\n${section.slice(0, 8000)}\n---` }],
  });
  const raw = (res.content[0] as any).text.trim().replace(/^```json\s*/i,'').replace(/^```\s*/i,'').replace(/```\s*$/i,'');
  return JSON.parse(raw);
}

function findSection(text: string, name: string): string {
  const first = name.split(' ')[0];
  for (const v of [name.toUpperCase(), first.toUpperCase(), name]) {
    const re = new RegExp(`(\\n|\\r|capítulo|CAPÍTULO|\\d+\\.\\s*)${v.replace(/[.*+?^${}()|[\]\\]/g,'\\$&')}`, 'im');
    const m = re.exec(text);
    if (m) { console.log(`  "${v}" en pos ${m.index}`); return text.slice(m.index, m.index + 10000); }
  }
  const idx = text.toLowerCase().indexOf(first.toLowerCase());
  if (idx !== -1) return text.slice(Math.max(0, idx - 100), idx + 10000);
  console.warn(`  ⚠ Sin sección para "${name}", usando conocimiento del modelo`);
  return `Información sobre ${name}, filósofo presocrático griego.`;
}

async function run() {
  const pdfPath = process.env.PDF_PATH ?? './scripts/presocraticos.pdf';
  if (!existsSync(pdfPath)) throw new Error(`PDF no encontrado: ${pdfPath}`);

  console.log('=== Seed filósofos faltantes — Ruflo Swarm ===\n');
  console.log('[1/3] Extrayendo texto del PDF…');
  const pdfParse = require('pdf-parse');
  const { text: fullText } = await pdfParse(readFileSync(pdfPath));
  console.log(`  ${Math.round(fullText.length/1000)}k chars\n`);

  console.log('[2/3] Lanzando 5 agentes Sonnet en paralelo…\n');
  const tasks = MISSING.map(({ name, slug, count }) => {
    const section = findSection(fullText, name);
    return extract(name, slug, count, section).then(data => {
      console.log(`  ✓ ${name}: ${data.statements.length} ideas`);
      return data;
    }).catch(err => { console.error(`  ✗ ${name}: ${err.message}`); return null; });
  });
  const results = (await Promise.all(tasks)).filter(Boolean);

  console.log(`\n[3/3] Insertando ${results.length} filósofos en DB…`);
  let stmtCount = 0;
  for (const { philosopher: p, statements } of results) {
    const phil = await prisma.philosopher.upsert({
      where: { slug: p.slug },
      update: { name: p.name, birthYear: p.birthYear ?? undefined, deathYear: p.deathYear ?? undefined, nationality: p.nationality || undefined, bioShort: p.bioShort || undefined, bioLong: p.bioLong || undefined, periodId: PERIOD_ID, schoolId: SCHOOL_ID },
      create: { name: p.name, slug: p.slug, birthYear: p.birthYear ?? undefined, deathYear: p.deathYear ?? undefined, nationality: p.nationality || undefined, bioShort: p.bioShort || undefined, bioLong: p.bioLong || undefined, periodId: PERIOD_ID, schoolId: SCHOOL_ID },
    });
    console.log(`  ✓ ${phil.name} (id=${phil.id})`);
    for (let i = 0; i < statements.length; i++) {
      const s = statements[i];
      await prisma.statement.create({
        data: {
          philosopherId: phil.id,
          text: s.text.length > 200 ? s.text.slice(0, 197) + '…' : s.text,
          categoryId: CATEGORY_MAP[s.categorySlug] ?? 2,
          isDirectQuote: s.isDirectQuote ?? false,
          context: s.context || undefined,
          difficultyLevel: s.difficultyLevel ?? 2,
          orderInTimeline: i + 1,
          xPosition: p.birthYear ? (p.birthYear + 700) * 0.5 : 100,
          yPosition: 100 + i * 80,
        },
      });
      stmtCount++;
    }
  }

  const [philCount, totalStmts] = await Promise.all([prisma.philosopher.count(), prisma.statement.count()]);
  console.log(`\n=== Completado ===`);
  console.log(`  Total filósofos: ${philCount} | Total ideas: ${totalStmts}`);
}

run().catch(e => { console.error('[FATAL]', e.message); process.exit(1); }).finally(() => prisma.$disconnect());
