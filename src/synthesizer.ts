import Anthropic from '@anthropic-ai/sdk';
import { CONFIG, type PhilosophyTheme } from './config.js';
import type { RawItem } from './fetcher.js';

const client = new Anthropic({ apiKey: CONFIG.anthropicKey });

export interface SynthesizedItem extends RawItem {
  theme:     PhilosophyTheme;
  synthesis: string;
  keywords:  string[];
  isPdf:     boolean;
}

export interface DigestContent {
  items:          SynthesizedItem[];
  editorialIntro: string;
  issueDate:      string;
  moduleName?:    string;
}

// ── Prompts ───────────────────────────────────────────────────────────────────

// Synthesis prompt: editorial voice, attribution-first, no references to source material
const PDF_SYSTEM = `Eres el editor filosófico de un digest cultural de alto nivel. Escribes para lectores cultos e interesados en filosofía, no para académicos especialistas. Tu prosa es clara, viva y rigurosa — el registro de un ensayo de ideas, no de un abstract.

Del fragmento que recibes, produce:
1. Una clasificación temática (uno de los valores exactos de la lista permitida)
2. Una síntesis de 2–3 párrafos (120–180 palabras en total), en español:
   - Párr. 1: La pregunta o problema central — planteado directamente, sin referencia al texto o al autor del fragmento
   - Párr. 2: El argumento o movimiento filosófico clave — atribuye cada idea a su pensador con naturalidad: "Aristóteles sostiene en la Metafísica que…", "Para Parménides, el ser es…", "Tomás de Aquino distingue entre…"
   - Párr. 3 (opcional): Una tensión, una objeción clásica, o una conexión con otro debate filosófico
3. 3–5 conceptos clave (palabras o frases breves, en español)

REGLAS:
- Nunca escribas "el texto dice", "según el texto", "el autor del fragmento", "este módulo" ni ninguna referencia a la fuente como documento. Habla directamente de las ideas y sus autores históricos.
- Atribuye siempre las ideas a su pensador: "según Platón", "Aristóteles distingue", "Para los estoicos".

Temas permitidos (usa EXACTAMENTE uno, en español):
Metafísica y Ontología | Ética y Filosofía Moral | Epistemología | Filosofía de la Mente | Filosofía Política | Lógica y Filosofía del Lenguaje | Filosofía de la Religión | Filosofía de la Ciencia | Estética | Filosofía de la Historia | Filosofía del Derecho | Filosofía de la Naturaleza | Filosofía Antigua | Filosofía Medieval | Filosofía Moderna | Filosofía Contemporánea | Filosofía General

Responde ÚNICAMENTE como objeto JSON con claves: theme, synthesis, keywords. Sin marcas de markdown.`;

const EDITORIAL_SYSTEM = `Eres el editor de un digest filosófico diario. Escribes para lectores curiosos e inteligentes, no para académicos.

Escribe una introducción editorial de 150–200 palabras en español que:
- Identifique 1–2 hilos temáticos que atraviesen los textos del día
- Mencione 2–3 pensadores o ideas concretas por nombre
- Cierre con una pregunta o provocación que invite a seguir leyendo
- Tono: cálido, intelectualmente vivo, nunca condescendiente
- Sin referencias a "módulos", "programas", "textos", "fragmentos" ni "fuentes"
- Prosa fluida, sin bullets ni encabezados

Responde solo con prosa. Sin JSON, sin markdown.`;

// ── Claude API call with retry ────────────────────────────────────────────────

async function callClaude(system: string, user: string, retries = 3): Promise<string> {
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      const response = await client.messages.create({
        model:      CONFIG.model,
        max_tokens: 1024,
        system,
        messages: [{ role: 'user', content: user }],
      });
      const block = response.content[0];
      if (block.type !== 'text') throw new Error('Unexpected content block type');
      return block.text;
    } catch (err: unknown) {
      const e = err as { status?: number; message?: string };
      const isRetryable = e?.status === 429 || e?.status === 529 || e?.message?.includes('rate') || e?.message?.includes('overloaded');
      if (!isRetryable || attempt === retries) {
        if (attempt === retries) throw err;
        await new Promise(r => setTimeout(r, 3_000));
      } else {
        const wait = attempt * 20_000;
        console.warn(`[synthesizer] Retryable error (${e?.status}) — waiting ${wait / 1000}s… (attempt ${attempt}/${retries})`);
        await new Promise(r => setTimeout(r, wait));
      }
    }
  }
  throw new Error('All retries exhausted');
}

// ── Per-item synthesis ────────────────────────────────────────────────────────

function isPdfItem(item: RawItem): boolean {
  return item.sourceName.startsWith('Licenciatura ·');
}

async function synthesizeItem(item: RawItem): Promise<SynthesizedItem> {
  const pdf = isPdfItem(item);

  const userMsg = JSON.stringify({
    title:   item.title,
    source:  item.sourceName,
    excerpt: item.excerpt,
  });

  const raw = await callClaude(PDF_SYSTEM, userMsg);

  let parsed: { theme: PhilosophyTheme; synthesis: string; keywords: string[] };
  try {
    // Strip markdown code fences if Claude wraps the JSON anyway
    const clean = raw.replace(/^```json\s*/i, '').replace(/^```\s*/i, '').replace(/```\s*$/i, '').trim();
    parsed = JSON.parse(clean);
  } catch {
    parsed = { theme: 'Filosofía General', synthesis: raw.replace(/^```json?\s*/i, '').replace(/```\s*$/i, '').trim().slice(0, 400), keywords: [] };
  }

  return { ...item, ...parsed, isPdf: pdf };
}

export async function synthesizeAll(items: RawItem[]): Promise<SynthesizedItem[]> {
  const results: SynthesizedItem[] = [];
  for (const item of items) {
    console.log(`[synthesizer] "${item.title.slice(0, 60)}"`);
    const synthesized = await synthesizeItem(item);
    results.push(synthesized);
    await new Promise(r => setTimeout(r, 2_000));
  }
  return results;
}

// ── Editorial intro ───────────────────────────────────────────────────────────

export async function generateEditorial(
  items: SynthesizedItem[],
  moduleName?: string,
): Promise<string> {
  const list = items
    .map((i, idx) =>
      `${idx + 1}. [${i.isPdf ? 'PROGRAMA' : 'EXTERNO'}] "${i.title}" (${i.sourceName}) — ${i.theme}\n   ${i.synthesis.split('\n')[0]}`,
    )
    .join('\n\n');

  const context = moduleName
    ? `Módulo del día: ${moduleName}\n\n`
    : '';

  return callClaude(
    EDITORIAL_SYSTEM,
    `${context}Textos de hoy (${items.length}):\n\n${list}\n\nEscribe la introducción editorial.`,
  );
}

// ── Orchestrator ──────────────────────────────────────────────────────────────

export async function buildDigestContent(
  items: RawItem[],
  moduleName?: string,
): Promise<DigestContent> {
  const synthesized = await synthesizeAll(items);
  const editorialIntro = await generateEditorial(synthesized, moduleName);
  return {
    items: synthesized,
    editorialIntro,
    moduleName,
    issueDate: new Date().toLocaleDateString('es-MX', {
      weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
    }),
  };
}
