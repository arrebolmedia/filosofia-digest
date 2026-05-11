import 'dotenv/config';
import { readFileSync, writeFileSync, existsSync, unlinkSync } from 'fs';
import { CONFIG }                                    from './config.js';
import { type DigestContent }                        from './synthesizer.js';
import { composeHtml }                               from './composer.js';
import { publishEntry }                              from './publisher.js';
import { sendDigest }                                from './mailer.js';
import {
  isBaserowConfigured,
  listActiveSubscribers,
  updateSubscriberProgress,
} from './baserow.js';
import { unsubscribeUrl } from './unsubscribe.js';

const COUNTER_FILE = process.env.COUNTER_FILE ?? './issue-counter.json';
const QUEUE_DIR    = process.env.QUEUE_DIR    ?? '/opt/digest/queue';
const LOCK_FILE    = '/tmp/digest.lock';

const SKIP_MODULES: Set<number> = new Set(
  (process.env.SKIP_MODULES ?? '')
    .split(',')
    .map(s => parseInt(s.trim()))
    .filter(n => !isNaN(n))
);

function readIssueNumber(): number {
  if (!existsSync(COUNTER_FILE)) return 1;
  try { return JSON.parse(readFileSync(COUNTER_FILE, 'utf-8')).issue ?? 1; }
  catch { return 1; }
}

function incrementIssueNumber(n: number): void {
  writeFileSync(COUNTER_FILE, JSON.stringify({ issue: n + 1 }), 'utf-8');
}

function slugFor(moduleIndex: number, partIndex: number): string {
  return `M${String(moduleIndex).padStart(2, '0')}-P${String(partIndex + 1).padStart(2, '0')}`;
}

function loadQueuedDigest(moduleIndex: number, partIndex: number): DigestContent | null {
  const path = `${QUEUE_DIR}/${slugFor(moduleIndex, partIndex)}.json`;
  if (!existsSync(path)) return null;
  try { return JSON.parse(readFileSync(path, 'utf-8')); }
  catch { return null; }
}

interface QueueInventory {
  // Map moduleIndex → set of available partIndices
  parts: Map<number, Set<number>>;
  // Sorted list of module indices that have at least one queued part
  modules: number[];
}

function loadQueueInventory(): QueueInventory {
  const parts = new Map<number, Set<number>>();
  const dirEntries = (() => {
    try { return require('fs').readdirSync(QUEUE_DIR) as string[]; }
    catch { return []; }
  })();
  for (const f of dirEntries) {
    const m = f.match(/^M(\d{2})-P(\d{2})\.json$/);
    if (!m) continue;
    const modIdx  = parseInt(m[1]);
    const partIdx = parseInt(m[2]) - 1;
    if (!parts.has(modIdx)) parts.set(modIdx, new Set());
    parts.get(modIdx)!.add(partIdx);
  }
  const modules = [...parts.keys()].sort((a, b) => a - b);
  return { parts, modules };
}

interface ResolvedPosition {
  moduleIndex: number;
  partIndex:   number;
  digest:      DigestContent;
}

/**
 * Resolve the next deliverable digest for a subscriber, advancing past
 * skip-modules or gaps in the queue.
 */
function resolveNext(
  inventory: QueueInventory,
  startModule: number,
  startPart:   number,
): ResolvedPosition | null {
  if (inventory.modules.length === 0) return null;

  let modIdx  = startModule;
  let partIdx = startPart;
  const visited = new Set<string>();

  while (true) {
    const key = `${modIdx}-${partIdx}`;
    if (visited.has(key)) return null;
    visited.add(key);

    // Skip module if in SKIP_MODULES
    if (SKIP_MODULES.has(modIdx)) {
      const next = nextModuleInInventory(inventory, modIdx);
      if (next === null) return null;
      modIdx  = next;
      partIdx = 0;
      continue;
    }

    const available = inventory.parts.get(modIdx);
    if (!available || available.size === 0) {
      // Module has no queued parts — advance to next module in inventory
      const next = nextModuleInInventory(inventory, modIdx);
      if (next === null) return null;
      modIdx  = next;
      partIdx = 0;
      continue;
    }

    if (available.has(partIdx)) {
      const digest = loadQueuedDigest(modIdx, partIdx);
      if (!digest) return null;
      return { moduleIndex: modIdx, partIndex: partIdx, digest };
    }

    // Current partIdx not available — try next part of same module
    const sortedParts = [...available].sort((a, b) => a - b);
    const nextPart = sortedParts.find(p => p > partIdx);
    if (nextPart !== undefined) {
      partIdx = nextPart;
      continue;
    }

    // No more parts in this module — go to next module
    const next = nextModuleInInventory(inventory, modIdx);
    if (next === null) return null;
    modIdx  = next;
    partIdx = 0;
  }
}

function nextModuleInInventory(inv: QueueInventory, currentModule: number): number | null {
  const idx = inv.modules.findIndex(m => m > currentModule);
  if (idx === -1) {
    // Wrap around: return first module if it's different from current
    return inv.modules[0] !== currentModule ? inv.modules[0] : null;
  }
  return inv.modules[idx];
}

function advancePosition(
  inventory: QueueInventory,
  current: ResolvedPosition,
): { moduleIndex: number; partIndex: number } {
  const available  = inventory.parts.get(current.moduleIndex);
  const sortedParts = available ? [...available].sort((a, b) => a - b) : [];
  const nextPart    = sortedParts.find(p => p > current.partIndex);

  if (nextPart !== undefined) {
    return { moduleIndex: current.moduleIndex, partIndex: nextPart };
  }

  const nextMod = nextModuleInInventory(inventory, current.moduleIndex);
  if (nextMod === null) {
    // No further content — stay on current to signal "complete"
    return { moduleIndex: current.moduleIndex, partIndex: current.partIndex + 1 };
  }
  return { moduleIndex: nextMod, partIndex: 0 };
}

async function run(): Promise<void> {
  if (existsSync(LOCK_FILE)) {
    console.warn('Ya hay una instancia corriendo (lock file existe). Saliendo.');
    process.exit(0);
  }
  writeFileSync(LOCK_FILE, String(process.pid), 'utf-8');

  const cleanup = () => { try { unlinkSync(LOCK_FILE); } catch {} };
  process.on('exit', cleanup);
  process.on('SIGINT',  () => { cleanup(); process.exit(130); });
  process.on('SIGTERM', () => { cleanup(); process.exit(143); });

  console.log('=== Una Vida Examinada — Digest Diario de Filosofía ===');
  console.log(`Iniciado: ${new Date().toISOString()}`);
  console.log(`Queue dir: ${QUEUE_DIR}\n`);

  if (!isBaserowConfigured()) {
    throw new Error('BASEROW_DB_TOKEN no configurado.');
  }

  const inventory = loadQueueInventory();
  if (inventory.modules.length === 0) {
    throw new Error(`No se encontraron digests en ${QUEUE_DIR}. Corre el script de pre-generación primero.`);
  }
  const totalQueued = [...inventory.parts.values()].reduce((acc, s) => acc + s.size, 0);
  console.log(`Cola: ${totalQueued} digests en ${inventory.modules.length} módulos.\n`);

  const subscribers = await listActiveSubscribers();
  if (subscribers.length === 0) {
    console.warn('No hay suscriptores activos. Saliendo.');
    return;
  }
  console.log(`${subscribers.length} suscriptores activos.\n`);

  // Track published entries per cache-key so we only publish once per unique digest
  const publishedCache = new Map<string, { entryUrl: string; issueNumber: number }>();

  let sent = 0;
  let skipped = 0;
  let failed = 0;

  for (const sub of subscribers) {
    const startMod  = sub.moduleIndex ?? inventory.modules[0];
    const startPart = sub.partIndex ?? 0;

    console.log(`→ ${sub.Email}  (M${startMod}, parte ${startPart + 1})`);

    const pos = resolveNext(inventory, startMod, startPart);
    if (!pos) {
      console.warn(`  Sin contenido en cola. Saltando.`);
      skipped++;
      continue;
    }

    const cacheKey = `${pos.moduleIndex}-${pos.partIndex}`;
    let pub = publishedCache.get(cacheKey);

    if (!pub) {
      const issueNumber = readIssueNumber();
      const entryUrl    = publishEntry(pos.digest, issueNumber);
      incrementIssueNumber(issueNumber);
      pub = { entryUrl, issueNumber };
      publishedCache.set(cacheKey, pub);
      console.log(`  Publicado: ${entryUrl}  (#${String(issueNumber).padStart(3, '0')})`);
    }

    const issueTag = `#${String(pub.issueNumber).padStart(3, '0')}`;
    const subject  = `Una Vida Examinada ${issueTag}`;
    const html     = composeHtml(pos.digest, pub.entryUrl, {
      unsubscribeUrl: unsubscribeUrl(sub.Email),
    });

    try {
      await sendDigest({ subject, html, to: sub.Email });
      const next = advancePosition(inventory, pos);
      await updateSubscriberProgress(sub.id, next.moduleIndex, next.partIndex);
      console.log(`  Enviado. Siguiente: M${next.moduleIndex} parte ${next.partIndex + 1}.`);
      sent++;
    } catch (err) {
      console.error(`  Falló envío:`, err instanceof Error ? err.message : err);
      failed++;
    }
  }

  console.log(`\nResumen: ${sent} enviados, ${skipped} sin contenido, ${failed} fallidos.`);
}

run().catch(err => {
  console.error('\n[FATAL]', err instanceof Error ? err.message : err);
  process.exit(1);
});
