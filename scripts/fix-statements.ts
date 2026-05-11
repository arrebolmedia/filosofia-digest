/**
 * fix-statements.ts
 * Reescribe con Haiku todos los statements truncados (terminan en …)
 * expresando la idea completa en ≤200 caracteres.
 * Swarm: 22 agentes Haiku en paralelo.
 */
import 'dotenv/config';
import Anthropic from '@anthropic-ai/sdk';
import { PrismaClient } from '@prisma/client';

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
const prisma = new PrismaClient();

async function rewrite(id: number, text: string): Promise<string> {
  const res = await anthropic.messages.create({
    model: 'claude-haiku-4-5-20251001',
    max_tokens: 300,
    system: `Eres un editor filosófico. Reescribe la idea dada en español, completa y bien formulada, en MÁXIMO 200 caracteres (incluyendo espacios).
Sin puntos suspensivos. Sin truncar. Captura la esencia filosófica núcleo.
Responde SOLO con el texto reescrito, sin comillas ni explicaciones.`,
    messages: [{ role: 'user', content: `Reescribe esta idea filosófica en ≤200 caracteres:\n\n${text}` }],
  });
  const result = (res.content[0] as any).text.trim().replace(/^["']|["']$/g, '');
  if (result.length > 200) {
    // Emergency hard trim preserving word boundary
    const trimmed = result.slice(0, 197);
    return trimmed.slice(0, trimmed.lastIndexOf(' ')) + '…';
  }
  return result;
}

async function run() {
  console.log('=== Fix statements truncados — Ruflo Swarm (Haiku) ===\n');

  const truncated = await prisma.statement.findMany({
    where: { text: { endsWith: '…' } },
    orderBy: { philosopherId: 'asc' },
  });

  console.log(`${truncated.length} statements a reescribir. Lanzando agentes en paralelo…\n`);

  const tasks = truncated.map(s =>
    rewrite(s.id, s.text).then(async newText => {
      await prisma.statement.update({ where: { id: s.id }, data: { text: newText } });
      console.log(`  ✓ id=${s.id} (${newText.length} chars): ${newText.slice(0, 60)}…`);
      return { id: s.id, len: newText.length };
    }).catch(err => {
      console.error(`  ✗ id=${s.id}: ${err.message}`);
      return null;
    })
  );

  const results = (await Promise.all(tasks)).filter(Boolean) as { id: number; len: number }[];

  // Verify nothing over 200 remains
  const remaining = await prisma.statement.findMany({ where: { text: { endsWith: '…' } } });
  const overLimit = await prisma.$queryRaw<{ id: number; len: number }[]>`
    SELECT id, LENGTH(text) as len FROM statements WHERE LENGTH(text) > 200`;

  console.log(`\n=== Completado ===`);
  console.log(`  Reescritos: ${results.length}`);
  console.log(`  Aún con …: ${remaining.length}`);
  console.log(`  Sobre 200 chars: ${overLimit.length}`);
  if (overLimit.length > 0) console.log('  IDs:', overLimit.map(r => r.id));
}

run()
  .catch(e => { console.error('[FATAL]', e.message); process.exit(1); })
  .finally(() => prisma.$disconnect());
