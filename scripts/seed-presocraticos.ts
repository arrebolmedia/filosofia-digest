/**
 * seed-presocraticos.ts
 *
 * Pobla el timeline con filósofos presocráticos usando el swarm de Ruflo:
 * - Fase 1: 11 agentes en paralelo (1 por filósofo) extraen ideas del PDF
 *           y depositan JSON en memoria semántica (namespace: presocraticos-seed)
 * - Fase 2: 1 agente aggregator lee toda la memoria y genera conexiones filosóficas
 * - Fase 3: Inserción en PostgreSQL vía Prisma
 *
 * Uso:
 *   PDF_PATH=./scripts/presocraticos.pdf npx tsx scripts/seed-presocraticos.ts
 *
 * Requiere en .env: ANTHROPIC_API_KEY, DATABASE_URL
 */

import 'dotenv/config';
import { readFileSync, writeFileSync, existsSync } from 'fs';
import { createRequire } from 'module';
import Anthropic from '@anthropic-ai/sdk';
import { PrismaClient } from '@prisma/client';

const require = createRequire(import.meta.url);

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
const prisma = new PrismaClient();

// ── Types ────────────────────────────────────────────────────────────────────

interface StatementInput {
  text: string;
  categorySlug: string;
  isDirectQuote: boolean;
  context: string;
  difficultyLevel: number;
}

interface PhilosopherData {
  philosopher: {
    name: string;
    slug: string;
    birthYear: number | null;
    deathYear: number | null;
    nationality: string;
    bioShort: string;
    bioLong: string;
  };
  statements: StatementInput[];
}

interface ConnectionData {
  fromSlug: string;
  fromText: string;
  toSlug: string;
  toText: string;
  connectionType: string;
  explanation: string;
}

// ── DB constants (from existing DB state) ────────────────────────────────────

const CATEGORY_MAP: Record<string, number> = {
  etica: 1, metafisica: 2, epistemologia: 3,
  logica: 4, politica: 5, estetica: 6, mente: 7,
};
const PERIOD_ID = 1;  // Filosofía Antigua
const SCHOOL_ID = 1;  // Presocráticos

// ── Philosopher manifest ──────────────────────────────────────────────────────

const PHILOSOPHERS = [
  { name: 'Tales de Mileto', slug: 'tales-de-mileto',  count: 4 },
  { name: 'Anaximandro',     slug: 'anaximandro',       count: 4 },
  { name: 'Anaxímenes',      slug: 'anaximenes',        count: 3 },
  { name: 'Pitágoras',       slug: 'pitagoras',         count: 5 },
  { name: 'Jenófanes',       slug: 'jenofanes',         count: 3 },
  { name: 'Heráclito',       slug: 'heraclito',         count: 8 },
  { name: 'Parménides',      slug: 'parmenides',        count: 8 },
  { name: 'Zenón de Elea',   slug: 'zenon-de-elea',     count: 4 },
  { name: 'Empédocles',      slug: 'empedocles',        count: 4 },
  { name: 'Anaxágoras',      slug: 'anaxagoras',        count: 4 },
  { name: 'Demócrito',       slug: 'democrito',         count: 5 },
];

// ── Ruflo memory helpers ──────────────────────────────────────────────────────

const SWARM_NS = 'presocraticos-seed';

async function memStore(key: string, value: unknown): Promise<void> {
  const checkpointDir = './scripts/.swarm-memory';
  if (!existsSync(checkpointDir)) {
    const { mkdirSync } = await import('fs');
    mkdirSync(checkpointDir, { recursive: true });
  }
  writeFileSync(`${checkpointDir}/${key}.json`, JSON.stringify(value, null, 2), 'utf-8');
}

async function memRetrieve(key: string): Promise<unknown> {
  const checkpointFile = `./scripts/.swarm-memory/${key}.json`;
  if (!existsSync(checkpointFile)) return null;
  return JSON.parse(readFileSync(checkpointFile, 'utf-8'));
}

async function memListAll(): Promise<PhilosopherData[]> {
  const { readdirSync } = await import('fs');
  const dir = './scripts/.swarm-memory';
  if (!existsSync(dir)) return [];
  return readdirSync(dir)
    .filter(f => f.endsWith('.json') && f.startsWith('philosopher-'))
    .map(f => {
      const raw = readFileSync(`${dir}/${f}`, 'utf-8');
      return JSON.parse(raw) as PhilosopherData;
    });
}

// ── PDF helpers ───────────────────────────────────────────────────────────────

async function extractPdfText(pdfPath: string): Promise<string> {
  // pdf-parse has a bug with ESM dynamic import — use createRequire to avoid it
  const pdfParse = require('pdf-parse');
  const buffer = readFileSync(pdfPath);
  const data = await pdfParse(buffer);
  console.log(`  ${data.numpages} páginas, ~${Math.round(data.text.length / 1000)}k caracteres extraídos`);
  return data.text;
}

function findSection(fullText: string, name: string): string {
  const firstName = name.split(' ')[0];
  const variants = [name.toUpperCase(), firstName.toUpperCase(), name];
  for (const variant of variants) {
    const escaped = variant.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const re = new RegExp(`(\\n|\\r|capítulo|CAPÍTULO|\\d+\\.\\s*)${escaped}`, 'im');
    const m = re.exec(fullText);
    if (m && m.index !== -1) {
      const start = m.index;
      console.log(`    "${variant}" encontrado en pos ${start}`);
      return fullText.slice(start, start + 12000);
    }
  }
  // fallback: first occurrence anywhere
  const idx = fullText.toLowerCase().indexOf(firstName.toLowerCase());
  if (idx !== -1) return fullText.slice(Math.max(0, idx - 100), idx + 12000);
  console.warn(`    ⚠ Sin sección dedicada para "${name}", usando texto inicial`);
  return fullText.slice(0, 12000);
}

// ── Agent: extract one philosopher ───────────────────────────────────────────

async function agentExtractPhilosopher(
  name: string, slug: string, count: number, section: string,
): Promise<PhilosopherData | null> {
  const system = `Eres un agente del swarm de Ruflo especializado en filosofía presocrática.
Extrae datos filosóficos estructurados de un texto académico y responde SOLO con JSON válido.

Estructura requerida:
{
  "philosopher": {
    "name": string, "slug": string,
    "birthYear": number|null, "deathYear": number|null,
    "nationality": string, "bioShort": string, "bioLong": string
  },
  "statements": [
    { "text": string, "categorySlug": string, "isDirectQuote": boolean,
      "context": string, "difficultyLevel": 1|2|3 }
  ]
}

categorySlug: etica | metafisica | epistemologia | logica | politica | estetica | mente
birthYear/deathYear: negativo para a.C. (ej -600), null si desconocido
Para Heráclito y Parménides: incluye sus argumentos y la tensión dialéctica implícita con el otro.`;

  const userMsg = `Extrae exactamente ${count} ideas de "${name}" a partir de este fragmento.
Si el texto es insuficiente, complementa con tu conocimiento experto.

TEXTO:
---
${section.slice(0, 10000)}
---`;

  try {
    const res = await anthropic.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 4096,
      system,
      messages: [{ role: 'user', content: userMsg }],
    });
    const raw = (res.content[0] as { text: string }).text.trim()
      .replace(/^```json\s*/i, '').replace(/^```\s*/i, '').replace(/```\s*$/i, '');
    return JSON.parse(raw) as PhilosopherData;
  } catch (err) {
    console.error(`  ✗ Agente "${name}" falló:`, (err as Error).message);
    return null;
  }
}

// ── Agent: generate connections ───────────────────────────────────────────────

async function agentConnections(allData: PhilosopherData[]): Promise<ConnectionData[]> {
  const corpus = allData.map(d => ({
    philosopher: d.philosopher.name,
    slug: d.philosopher.slug,
    ideas: d.statements.map((s, i) => `[${i}] ${s.text.slice(0, 80)}`),
  }));

  const res = await anthropic.messages.create({
    model: 'claude-sonnet-4-6',
    max_tokens: 4096,
    system: `Eres el agente aggregator del swarm de Ruflo. Analiza el corpus completo de ideas
presocráticas y encuentra conexiones filosóficas significativas. Responde SOLO con JSON.`,
    messages: [{
      role: 'user',
      content: `Corpus:
${JSON.stringify(corpus, null, 2)}

Genera 15-25 conexiones. Tipos: "oppose" | "influence" | "resonate"
Prioriza:
- Heráclito (cambio/logos) ↔ Parménides (ser inmóvil): múltiples "oppose"
- Cadena milesios: Tales → Anaximandro → Anaxímenes ("influence")
- Resonancias de arjé entre escuelas distintas

JSON output:
[{
  "fromSlug": "heraclito",
  "fromText": "primeros 40 chars del statement origen",
  "toSlug": "parmenides",
  "toText": "primeros 40 chars del statement destino",
  "connectionType": "oppose",
  "explanation": "Una oración explicando la conexión."
}]`,
    }],
  });

  const raw = (res.content[0] as { text: string }).text.trim()
    .replace(/^```json\s*/i, '').replace(/^```\s*/i, '').replace(/```\s*$/i, '');
  try {
    return JSON.parse(raw) as ConnectionData[];
  } catch {
    console.error('  Error parseando conexiones, omitiendo.');
    return [];
  }
}

// ── DB insertion ──────────────────────────────────────────────────────────────

async function insertAll(allData: PhilosopherData[], connections: ConnectionData[]): Promise<void> {
  const stmtMap = new Map<string, number>(); // `slug::text40` → statement.id

  for (const { philosopher: p, statements } of allData) {
    const phil = await prisma.philosopher.upsert({
      where: { slug: p.slug },
      update: {
        name: p.name,
        birthYear: p.birthYear ?? undefined,
        deathYear: p.deathYear ?? undefined,
        nationality: p.nationality || undefined,
        bioShort: p.bioShort || undefined,
        bioLong: p.bioLong || undefined,
        periodId: PERIOD_ID,
        schoolId: SCHOOL_ID,
      },
      create: {
        name: p.name, slug: p.slug,
        birthYear: p.birthYear ?? undefined,
        deathYear: p.deathYear ?? undefined,
        nationality: p.nationality || undefined,
        bioShort: p.bioShort || undefined,
        bioLong: p.bioLong || undefined,
        periodId: PERIOD_ID, schoolId: SCHOOL_ID,
      },
    });
    console.log(`  ✓ ${phil.name} (id=${phil.id})`);

    for (let i = 0; i < statements.length; i++) {
      const s = statements[i];
      const catId = CATEGORY_MAP[s.categorySlug] ?? CATEGORY_MAP.metafisica;
      const stmt = await prisma.statement.create({
        data: {
          philosopherId: phil.id,
          text: s.text,
          categoryId: catId,
          isDirectQuote: s.isDirectQuote ?? false,
          context: s.context || undefined,
          difficultyLevel: s.difficultyLevel ?? 2,
          orderInTimeline: i + 1,
          xPosition: p.birthYear ? (p.birthYear + 700) * 0.5 : 100,
          yPosition: 100 + i * 80,
        },
      });
      stmtMap.set(`${p.slug}::${s.text.slice(0, 40)}`, stmt.id);
    }
  }

  let inserted = 0;
  for (const conn of connections) {
    // Match by slug + text prefix
    let fromId: number | undefined;
    let toId: number | undefined;
    for (const [key, id] of stmtMap) {
      if (!fromId && key.startsWith(`${conn.fromSlug}::`) &&
          key.includes(conn.fromText.slice(0, 25))) fromId = id;
      if (!toId && key.startsWith(`${conn.toSlug}::`) &&
          key.includes(conn.toText.slice(0, 25))) toId = id;
    }
    // Fallback: first statement of each philosopher
    if (!fromId) for (const [k, id] of stmtMap) if (k.startsWith(`${conn.fromSlug}::`)) { fromId = id; break; }
    if (!toId)   for (const [k, id] of stmtMap) if (k.startsWith(`${conn.toSlug}::`))   { toId = id;   break; }

    if (!fromId || !toId) {
      console.warn(`  ⚠ Omitida: ${conn.fromSlug} → ${conn.toSlug}`);
      continue;
    }
    await prisma.connection.create({
      data: {
        statementFromId: fromId, statementToId: toId,
        connectionType: conn.connectionType,
        explanation: conn.explanation,
        isBidirectional: conn.connectionType === 'resonate',
        strength: conn.connectionType === 'oppose' ? 5 : conn.connectionType === 'influence' ? 4 : 3,
        confidence: 3,
      },
    });
    inserted++;
  }
  console.log(`  ✓ ${inserted} conexiones insertadas`);
}

// ── Main ──────────────────────────────────────────────────────────────────────

async function run(): Promise<void> {
  const pdfPath = process.env.PDF_PATH ?? './scripts/presocraticos.pdf';

  console.log('=== Seed Presocráticos — Ruflo Swarm ===');
  console.log(`Swarm: swarm-1777915948249-3i3bg1 (hierarchical, 12 agentes)`);
  console.log(`Namespace: ${SWARM_NS}\n`);

  if (!existsSync(pdfPath)) {
    throw new Error(
      `PDF no encontrado en: ${pdfPath}\n` +
      `Copia el PDF ahí o usa: PDF_PATH=<ruta> npx tsx scripts/seed-presocraticos.ts`,
    );
  }

  // Check for existing checkpoint
  const checkpointPath = './scripts/presocraticos-data.json';
  let allData: PhilosopherData[];

  if (existsSync(checkpointPath) && process.env.USE_CHECKPOINT === 'true') {
    console.log('[CHECKPOINT] Cargando datos previos…');
    allData = JSON.parse(readFileSync(checkpointPath, 'utf-8')) as PhilosopherData[];
    console.log(`  ${allData.length} filósofos cargados desde checkpoint.\n`);
  } else {
    // Phase 1: Extract PDF
    console.log('[1/4] Extrayendo texto del PDF…');
    const fullText = await extractPdfText(pdfPath);

    // Phase 2: Swarm — 11 agents in parallel
    console.log('\n[2/4] Swarm: lanzando 11 agentes en paralelo (1 por filósofo)…\n');

    const tasks = PHILOSOPHERS.map(({ name, slug, count }) => {
      console.log(`  → Agente: ${name} (${count} ideas)`);
      const section = findSection(fullText, name);
      return agentExtractPhilosopher(name, slug, count, section).then(async data => {
        if (data) {
          // Store result in swarm memory
          await memStore(`philosopher-${slug}`, data);
          console.log(`  ✓ ${name}: ${data.statements.length} ideas → memoria[${SWARM_NS}]`);
        }
        return data;
      });
    });

    const results = await Promise.all(tasks);
    allData = results.filter(Boolean) as PhilosopherData[];

    // Save checkpoint
    writeFileSync(checkpointPath, JSON.stringify(allData, null, 2), 'utf-8');
    console.log(`\n  ${allData.length}/${PHILOSOPHERS.length} filósofos procesados`);
    console.log(`  Checkpoint guardado: ${checkpointPath}`);
  }

  // Phase 3: Connections agent
  console.log('\n[3/4] Agente aggregator: identificando conexiones filosóficas…');
  const connections = await agentConnections(allData);
  console.log(`  ${connections.length} conexiones identificadas`);

  // Phase 4: DB insertion
  console.log('\n[4/4] Insertando en PostgreSQL (timeline.anthonycazares.cafe)…');
  await insertAll(allData, connections);

  // Final summary
  const [philCount, stmtCount, connCount] = await Promise.all([
    prisma.philosopher.count(),
    prisma.statement.count(),
    prisma.connection.count(),
  ]);

  console.log('\n=== Completado ===');
  console.log(`  Filósofos: ${philCount}`);
  console.log(`  Ideas:     ${stmtCount}`);
  console.log(`  Conexiones: ${connCount}`);
  console.log('\n  → timeline.anthonycazares.cafe');
}

run()
  .catch(err => {
    console.error('\n[FATAL]', err instanceof Error ? err.message : err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
