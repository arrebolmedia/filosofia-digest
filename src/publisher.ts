import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'fs';
import { join } from 'path';
import type { DigestContent, SynthesizedItem } from './synthesizer.js';

const PUBLIC_DIR = process.env.PUBLIC_DIR ?? './public';
const PUBLIC_URL = (process.env.PUBLIC_URL ?? 'http://localhost').replace(/\/$/, '');

interface EntryMeta {
  issue:     number;
  slug:      string;
  date:      string;
  moduleName: string;
  url:       string;
}

const ENTRIES_FILE = process.env.ENTRIES_FILE ?? './entries.json';

function readEntries(): EntryMeta[] {
  if (!existsSync(ENTRIES_FILE)) return [];
  try { return JSON.parse(readFileSync(ENTRIES_FILE, 'utf-8')); }
  catch { return []; }
}

function saveEntries(entries: EntryMeta[]): void {
  writeFileSync(ENTRIES_FILE, JSON.stringify(entries, null, 2), 'utf-8');
}

function esc(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

const THEME_COLORS: Record<string, string> = {
  'Metafísica y Ontología':           '#4A6FA5',
  'Filosofía de la Mente':            '#5A8A7A',
  'Epistemología':                    '#8A7A4A',
  'Ética y Filosofía Moral':          '#5A7A5A',
  'Filosofía Política':               '#8A5A5A',
  'Lógica y Filosofía del Lenguaje':  '#7A6A4A',
  'Filosofía General':                '#7A7A7A',
  'Filosofía de la Religión':         '#7A5A8A',
  'Filosofía de la Ciencia':          '#4A7A8A',
  'Estética':                         '#8A6A5A',
  'Filosofía de la Historia':         '#6A7A5A',
  'Filosofía del Derecho':            '#6A5A7A',
  'Filosofía de la Naturaleza':       '#4A8A6A',
  'Filosofía Antigua':                '#8A7A5A',
  'Filosofía Medieval':               '#7A6A7A',
  'Filosofía Moderna':                '#5A6A8A',
  'Filosofía Contemporánea':          '#6A8A7A',
};

function renderItem(item: SynthesizedItem): string {
  const color = THEME_COLORS[item.theme] ?? THEME_COLORS['Filosofía General'];
  const keywordsHtml = item.keywords.map(k => `<span class="kw">${esc(k)}</span>`).join('');
  const synthesisHtml = item.synthesis
    .split('\n').filter(p => p.trim())
    .map(p => `<p class="syn-para">${esc(p)}</p>`).join('');

  return `
<div class="item">
  <div class="item-meta">
    <span class="badge" style="color:${color}">${esc(item.theme)}</span>
    <span class="source">${esc(item.sourceName)}</span>
  </div>
  <h2 class="item-title">${esc(item.title)}</h2>
  <div class="synthesis">${synthesisHtml}</div>
  ${item.keywords.length ? `<div class="keywords">${keywordsHtml}</div>` : ''}
</div>`;
}

function buildEntryHtml(digest: DigestContent, issueNumber: number): string {
  const issueTag = `#${String(issueNumber).padStart(3, '0')}`;
  const editorialHtml = digest.editorialIntro
    .split('\n').filter(p => p.trim())
    .map(p => `<p>${esc(p)}</p>`).join('\n');
  const sectionsHtml = digest.items.map(renderItem).join('\n');

  return `<!DOCTYPE html>
<html lang="es">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width,initial-scale=1.0">
<title>Una Vida Examinada ${esc(issueTag)} — ${esc(digest.issueDate)}</title>
<link href="https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,400;0,600;1,400&family=Source+Sans+3:wght@300;400;600&display=swap" rel="stylesheet">
<style>
*,*::before,*::after{box-sizing:border-box;margin:0;padding:0}
body{background:#FAFAF8;color:#1A1A1A;font-family:'Source Sans 3',system-ui,sans-serif;font-size:18px;line-height:1.75;font-weight:300}
.wrap{max-width:660px;margin:0 auto;padding:0 24px}
.header{border-bottom:1px solid #D8D4CC;padding:48px 0 36px;text-align:center}
.eyebrow{font-size:10px;letter-spacing:.35em;text-transform:uppercase;color:#9A9590;margin-bottom:16px;font-weight:400}
.title{font-family:'Playfair Display',Georgia,serif;font-size:44px;font-weight:400;color:#1A1A1A;letter-spacing:.01em;margin-bottom:6px;font-style:italic}
.issue{font-size:13px;color:#4A6FA5;margin-top:4px;letter-spacing:.05em}
.date{font-size:13px;color:#8A8580;margin-top:4px}
.module-label{font-size:11px;color:#4A6FA5;margin-top:10px;letter-spacing:.08em;text-transform:uppercase}
.editorial{border-top:2px solid #1A1A1A;border-bottom:1px solid #D8D4CC;margin:40px 0;padding:28px 0}
.editorial-label{font-size:9px;letter-spacing:.3em;text-transform:uppercase;color:#9A9590;margin-bottom:16px;display:block}
.editorial p{color:#1E1A18;font-size:17px;line-height:1.85;margin-bottom:14px;font-weight:300;text-align:justify}
.editorial p:last-child{margin-bottom:0}
.item{border-top:1px solid #E0DCD8;padding:52px 0;margin-bottom:0}
.item:last-of-type{border-bottom:1px solid #E0DCD8}
.item-meta{display:flex;gap:16px;align-items:baseline;margin-bottom:10px}
.badge{font-size:9px;letter-spacing:.2em;text-transform:uppercase;font-weight:600}
.source{font-size:11px;color:#B0ABA5}
.item-title{font-family:'Playfair Display',Georgia,serif;font-size:26px;font-weight:400;color:#1A1A1A;line-height:1.3;margin-bottom:20px;text-align:center}
.syn-para{font-size:16.5px;color:#2A2520;margin-bottom:12px;line-height:1.8;font-weight:300;text-align:justify}
.keywords{margin-top:16px;display:flex;flex-wrap:wrap;gap:6px}
.kw{font-size:10px;letter-spacing:.08em;color:#8A8580;border:1px solid #D8D4CC;padding:3px 10px}
.divider{border:none;border-top:1px solid #D8D4CC;margin:40px 0}
.back{display:block;text-align:center;margin:32px 0;font-size:13px;color:#8A8580;text-decoration:none;letter-spacing:.05em}
.back:hover{color:#1A1A1A}
.footer{border-top:1px solid #D8D4CC;padding:28px 0;text-align:center}
.footer p{font-size:11px;color:#B0ABA5;line-height:1.8;margin-bottom:4px}
.footer a{color:#8A8580}
</style>
</head>
<body>
<div class="header"><div class="wrap">
  <p class="eyebrow">Digest Diario · Filosofía</p>
  <h1 class="title">Una Vida Examinada</h1>
  <p class="issue">${esc(issueTag)}</p>
  <p class="date">${esc(digest.issueDate)}</p>
  ${digest.moduleName ? `<p class="module-label">${esc(digest.moduleName)}</p>` : ''}
</div></div>
<div class="wrap">
  <div class="editorial">
    <span class="editorial-label">Nota editorial</span>
    ${editorialHtml}
  </div>
  ${sectionsHtml}
  <hr class="divider">
  <a href="${PUBLIC_URL}" class="back">← Todas las ediciones</a>
</div>
<div class="footer"><div class="wrap">
  <p><em>Una Vida Examinada</em> — Sintetizado por Claude para el lector filosóficamente curioso.</p>
  <p style="margin-top:8px"><a href="mailto:anthony@arrebol.com.mx">Contacto</a></p>
</div></div>
</body></html>`;
}

function buildIndexHtml(entries: EntryMeta[]): string {
  const sorted = [...entries].sort((a, b) => b.issue - a.issue);
  const latest = sorted[0];
  const rest = sorted.slice(1);

  const latestHtml = latest ? `
<a href="${esc(latest.url)}" class="latest">
  <span class="latest-label">Última edición</span>
  <span class="latest-issue">#${String(latest.issue).padStart(3, '0')}</span>
  <span class="latest-module">${esc(latest.moduleName)}</span>
  <span class="latest-date">${esc(latest.date)}</span>
  <span class="latest-cta">Leer →</span>
</a>` : '';

  const archiveHtml = rest.map(e => `
<a href="${esc(e.url)}" class="entry">
  <span class="entry-issue">#${String(e.issue).padStart(3, '0')}</span>
  <span class="entry-info">
    <span class="entry-module">${esc(e.moduleName)}</span>
    <span class="entry-date">${esc(e.date)}</span>
  </span>
</a>`).join('\n');

  return `<!DOCTYPE html>
<html lang="es">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width,initial-scale=1.0">
<title>Una Vida Examinada — Filosofía Diaria</title>
<meta name="description" content="Un digest diario de filosofía. Cinco ideas, sintetizadas para el lector curioso.">
<link href="https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,400;0,600;1,400;1,600&family=Source+Sans+3:wght@300;400;600&display=swap" rel="stylesheet">
<style>
*,*::before,*::after{box-sizing:border-box;margin:0;padding:0}
html{scroll-behavior:smooth}
body{background:#FAFAF8;color:#1A1A1A;font-family:'Source Sans 3',system-ui,sans-serif;font-size:17px;line-height:1.75;font-weight:300}
.wrap{max-width:660px;margin:0 auto;padding:0 24px}
.wrap-wide{max-width:900px;margin:0 auto;padding:0 24px}

/* ── Hero ── */
.hero{border-bottom:1px solid #D8D4CC;padding:80px 0 72px;text-align:center}
.eyebrow{font-size:10px;letter-spacing:.35em;text-transform:uppercase;color:#9A9590;margin-bottom:24px;font-weight:400}
.hero-title{font-family:'Playfair Display',Georgia,serif;font-size:clamp(48px,8vw,80px);font-weight:400;color:#1A1A1A;font-style:italic;line-height:1.1;margin-bottom:24px}
.hero-sub{font-size:16px;color:#6A6560;line-height:1.7;max-width:480px;margin:0 auto 40px;font-weight:300}
.hero-meta{display:flex;justify-content:center;gap:32px;flex-wrap:wrap}
.hero-stat{display:flex;flex-direction:column;align-items:center;gap:4px}
.hero-stat-n{font-family:'Playfair Display',Georgia,serif;font-size:28px;color:#1A1A1A;font-weight:400}
.hero-stat-l{font-size:10px;letter-spacing:.2em;text-transform:uppercase;color:#9A9590}
.hero-divider{width:1px;height:40px;background:#D8D4CC;align-self:center}

/* ── Manifiesto ── */
.manifesto{padding:64px 0;border-bottom:1px solid #D8D4CC}
.manifesto-label{font-size:9px;letter-spacing:.3em;text-transform:uppercase;color:#9A9590;margin-bottom:20px;display:block}
.manifesto p{font-size:17px;color:#2A2520;line-height:1.85;margin-bottom:16px;font-weight:300;text-align:justify}
.manifesto p:last-child{margin-bottom:0}
.manifesto em{font-family:'Playfair Display',Georgia,serif;font-style:italic;color:#1A1A1A}

/* ── Última edición ── */
.section-label{font-size:9px;letter-spacing:.3em;text-transform:uppercase;color:#9A9590;margin-bottom:20px;display:block;margin-top:56px}
.latest{display:block;border:1px solid #D8D4CC;padding:32px;text-decoration:none;color:inherit;transition:border-color .2s}
.latest:hover{border-color:#4A6FA5}
.latest-label{font-size:9px;letter-spacing:.25em;text-transform:uppercase;color:#9A9590;display:block;margin-bottom:12px}
.latest-issue{font-family:'Playfair Display',Georgia,serif;font-size:13px;color:#B0ABA5;display:block;margin-bottom:6px}
.latest-module{font-family:'Playfair Display',Georgia,serif;font-size:26px;color:#1A1A1A;display:block;margin-bottom:8px;font-style:italic}
.latest-date{font-size:11px;color:#B0ABA5;display:block;margin-bottom:20px}
.latest-cta{font-size:12px;letter-spacing:.12em;text-transform:uppercase;color:#4A6FA5}

/* ── Archivo ── */
.entries{padding-bottom:56px}
.entry{display:flex;align-items:baseline;gap:20px;padding:18px 0;border-bottom:1px solid #E0DCD8;text-decoration:none;color:inherit}
.entry:first-child{border-top:1px solid #E0DCD8}
.entry:hover .entry-module{color:#4A6FA5}
.entry-issue{font-family:'Playfair Display',Georgia,serif;font-size:13px;color:#B0ABA5;flex-shrink:0;width:36px}
.entry-info{display:flex;flex-direction:column;gap:2px}
.entry-module{font-size:15px;color:#1A1A1A;font-weight:400;transition:color .2s}
.entry-date{font-size:11px;color:#B0ABA5}

/* ── Footer ── */
.footer{border-top:2px solid #1A1A1A;padding:40px 0;text-align:center;margin-top:0}
.footer-title{font-family:'Playfair Display',Georgia,serif;font-size:22px;font-style:italic;color:#1A1A1A;margin-bottom:8px}
.footer p{font-size:11px;color:#B0ABA5;line-height:1.9}
.footer a{color:#8A8580;text-decoration:none}
.footer a:hover{color:#1A1A1A}
</style>
</head>
<body>

<div class="hero">
  <div class="wrap">
    <p class="eyebrow">Digest Diario · Filosofía</p>
    <h1 class="hero-title">Una Vida<br>Examinada</h1>
    <p class="hero-sub">Cinco ideas filosóficas cada mañana, sintetizadas para el lector que todavía se pregunta por qué las cosas son como son.</p>
    <div class="hero-meta">
      <div class="hero-stat">
        <span class="hero-stat-n">${sorted.length}</span>
        <span class="hero-stat-l">Ediciones</span>
      </div>
      <div class="hero-divider"></div>
      <div class="hero-stat">
        <span class="hero-stat-n">5</span>
        <span class="hero-stat-l">Ideas por día</span>
      </div>
      <div class="hero-divider"></div>
      <div class="hero-stat">
        <span class="hero-stat-n">22</span>
        <span class="hero-stat-l">Módulos</span>
      </div>
    </div>
  </div>
</div>

<div class="wrap">
  <div class="manifesto">
    <span class="manifesto-label">Por qué existe esto</span>
    <p>La filosofía tiene mala fama. Se la imagina como un pasatiempo de viejos con barba, como algo que no sirve para pagar la renta, como preguntas que nunca tienen respuesta. Y sin embargo, es el único lugar donde se formulan las preguntas que realmente importan.</p>
    <p><em>Una Vida Examinada</em> es un digest diario que toma textos de un programa serio de licenciatura en filosofía y los traduce, sin sacrificar el rigor, al registro de alguien que quiere pensar bien y vivir con más conciencia.</p>
    <p>Cada edición: cinco fragmentos sintetizados, una nota editorial que los hilvana, y la promesa de que algo en tu forma de ver el mundo se moverá un poco.</p>
  </div>

  ${latest ? `<span class="section-label">Última edición</span>${latestHtml}` : ''}

  ${rest.length ? `<span class="section-label" style="margin-top:40px">Archivo</span><div class="entries">${archiveHtml}</div>` : ''}
</div>

<div class="footer">
  <div class="wrap">
    <p class="footer-title">Una Vida Examinada</p>
    <p>Sintetizado por Claude · Lunes a viernes</p>
    <p style="margin-top:8px"><a href="mailto:anthony@arrebol.com.mx">Contacto</a></p>
  </div>
</div>

</body></html>`;
}

export function publishEntry(digest: DigestContent, issueNumber: number): string {
  mkdirSync(PUBLIC_DIR, { recursive: true });

  const slug = `edicion-${String(issueNumber).padStart(3, '0')}`;
  const filename = `${slug}.html`;
  const url = `${PUBLIC_URL}/${filename}`;

  // Write entry HTML
  writeFileSync(join(PUBLIC_DIR, filename), buildEntryHtml(digest, issueNumber), 'utf-8');

  // Update entries registry
  const entries = readEntries();
  if (!entries.find(e => e.issue === issueNumber)) {
    entries.push({
      issue: issueNumber,
      slug,
      date: digest.issueDate,
      moduleName: digest.moduleName ?? '',
      url,
    });
    saveEntries(entries);
  }

  // Regenerate index
  writeFileSync(join(PUBLIC_DIR, 'index.html'), buildIndexHtml(entries), 'utf-8');

  // Write editions.json for Next.js frontend
  writeFileSync(join(PUBLIC_DIR, 'editions.json'), JSON.stringify(entries, null, 2), 'utf-8');

  return url;
}
