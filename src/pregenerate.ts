import 'dotenv/config';
import { mkdir, writeFile } from 'fs/promises';
import { existsSync } from 'fs';
import { join } from 'path';
import { CONFIG } from './config.js';
import { listModules, readModulePdfs, type PdfModule } from './pdf-reader.js';
import { buildDigestContent, type DigestContent } from './synthesizer.js';
import { composeHtml } from './composer.js';

const QUEUE_DIR   = process.env.QUEUE_DIR   ?? '/opt/digest/queue';
const CONCURRENCY = parseInt(process.env.PREGEN_CONCURRENCY ?? '5');

const SKIP_MODULES: Set<number> = new Set(
  (process.env.SKIP_MODULES ?? '')
    .split(',')
    .map(s => parseInt(s.trim()))
    .filter(n => !isNaN(n))
);

function toRoman(n: number): string {
  return ['I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII', 'IX', 'X', 'XI', 'XII'][n - 1] ?? String(n);
}

function moduleLabel(name: string, totalParts: number, partIndex: number): string {
  return totalParts <= 1 ? name : `${name} · Parte ${toRoman(partIndex + 1)}`;
}

interface QueueItem {
  moduleIndex: number;
  moduleName:  string;
  partIndex:   number;
  totalParts:  number;
  label:       string;
  topicCount:  number;
  slug:        string;
}

interface PartJob {
  module:    PdfModule;
  partIndex: number;
  totalParts: number;
  pdfItems:  Awaited<ReturnType<typeof readModulePdfs>>;
  label:     string;
  slug:      string;
}

async function planAllParts(modules: PdfModule[]): Promise<PartJob[]> {
  const jobs: PartJob[] = [];
  for (const mod of modules.slice().sort((a, b) => a.index - b.index)) {
    if (SKIP_MODULES.has(mod.index)) {
      console.log(`[plan] M${mod.index}. ${mod.name} — SKIP`);
      continue;
    }
    const items = await readModulePdfs(mod);
    if (items.length === 0) {
      console.log(`[plan] M${mod.index}. ${mod.name} — sin PDFs procesables`);
      continue;
    }
    const totalParts = Math.ceil(items.length / CONFIG.maxPdfItems);
    for (let p = 0; p < totalParts; p++) {
      const offset = p * CONFIG.maxPdfItems;
      const pdfItems = items.slice(offset, offset + CONFIG.maxPdfItems);
      const label = moduleLabel(mod.name, totalParts, p);
      const slug  = `M${String(mod.index).padStart(2, '0')}-P${String(p + 1).padStart(2, '0')}`;
      jobs.push({ module: mod, partIndex: p, totalParts, pdfItems, label, slug });
    }
    console.log(`[plan] M${mod.index}. ${mod.name} — ${items.length} temas → ${totalParts} partes`);
  }
  return jobs;
}

async function generateOne(job: PartJob): Promise<QueueItem> {
  const jsonPath = join(QUEUE_DIR, `${job.slug}.json`);
  const htmlPath = join(QUEUE_DIR, `${job.slug}.html`);

  if (existsSync(jsonPath) && existsSync(htmlPath) && process.env.PREGEN_FORCE !== 'true') {
    console.log(`[skip] ${job.slug} ya existe (use PREGEN_FORCE=true para regenerar)`);
    return {
      moduleIndex: job.module.index,
      moduleName:  job.module.name,
      partIndex:   job.partIndex,
      totalParts:  job.totalParts,
      label:       job.label,
      topicCount:  job.pdfItems.length,
      slug:        job.slug,
    };
  }

  console.log(`[gen] ${job.slug} — ${job.label} (${job.pdfItems.length} temas)…`);
  const digest = await buildDigestContent(job.pdfItems, job.label);

  // HTML pendiente: sin entryUrl (versión standalone), sin unsubscribeUrl
  const html = composeHtml(digest);

  await writeFile(jsonPath, JSON.stringify(digest, null, 2), 'utf-8');
  await writeFile(htmlPath, html, 'utf-8');

  console.log(`[ok]  ${job.slug}`);
  return {
    moduleIndex: job.module.index,
    moduleName:  job.module.name,
    partIndex:   job.partIndex,
    totalParts:  job.totalParts,
    label:       job.label,
    topicCount:  job.pdfItems.length,
    slug:        job.slug,
  };
}

async function runWithConcurrency<T, R>(
  items: T[],
  worker: (item: T) => Promise<R>,
  concurrency: number,
): Promise<R[]> {
  const results: R[] = new Array(items.length);
  let cursor = 0;

  async function next(): Promise<void> {
    while (true) {
      const idx = cursor++;
      if (idx >= items.length) return;
      try {
        results[idx] = await worker(items[idx]);
      } catch (err) {
        console.error(`[err] item ${idx}:`, err instanceof Error ? err.message : err);
        throw err;
      }
    }
  }

  const workers = Array.from({ length: Math.min(concurrency, items.length) }, () => next());
  await Promise.all(workers);
  return results;
}

async function main(): Promise<void> {
  if (!CONFIG.anthropicKey) {
    throw new Error('ANTHROPIC_API_KEY no configurado');
  }

  await mkdir(QUEUE_DIR, { recursive: true });
  console.log(`Queue dir: ${QUEUE_DIR}`);
  console.log(`Concurrency: ${CONCURRENCY}`);
  console.log(`SKIP_MODULES: ${[...SKIP_MODULES].join(',') || '(ninguno)'}\n`);

  const modules = await listModules();
  const jobs    = await planAllParts(modules);
  console.log(`\nTotal de digests a generar: ${jobs.length}\n`);

  const t0 = Date.now();
  const items = await runWithConcurrency(jobs, generateOne, CONCURRENCY);
  const elapsed = Math.round((Date.now() - t0) / 1000);

  // Build manifest
  const manifest = {
    generatedAt: new Date().toISOString(),
    totalItems:  items.length,
    items:       items.sort((a, b) =>
      a.moduleIndex - b.moduleIndex || a.partIndex - b.partIndex
    ),
  };
  await writeFile(join(QUEUE_DIR, 'manifest.json'), JSON.stringify(manifest, null, 2), 'utf-8');

  console.log(`\n✓ Listo en ${elapsed}s. ${items.length} digests en ${QUEUE_DIR}`);
  console.log(`  Manifest: ${join(QUEUE_DIR, 'manifest.json')}`);
}

main().catch(err => {
  console.error('\n[FATAL]', err instanceof Error ? err.message : err);
  process.exit(1);
});
