import type { DigestContent, SynthesizedItem } from './synthesizer.js';

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

function esc(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function renderItem(item: SynthesizedItem): string {
  const color = THEME_COLORS[item.theme] ?? THEME_COLORS['Filosofía General'];
  const keywordsHtml = item.keywords
    .map(k => `<span class="kw">${esc(k)}</span>`)
    .join('');
  const synthesisHtml = item.synthesis
    .split('\n')
    .filter(p => p.trim())
    .map(p => `<p class="syn-para">${esc(p)}</p>`)
    .join('');

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

export interface ComposeOptions {
  unsubscribeUrl?: string;
}

export function composeHtml(digest: DigestContent, entryUrl?: string, opts: ComposeOptions = {}): string {
  const editorialParas = digest.editorialIntro.split('\n').filter(p => p.trim());

  // In email: only first paragraph of editorial + titles + CTA
  // In standalone (no entryUrl): full editorial + full items
  const editorialHtml = entryUrl
    ? `<p>${esc(editorialParas[0] ?? '')}</p>`
    : editorialParas.map(p => `<p>${esc(p)}</p>`).join('\n');

  const titlesHtml = digest.items
    .map(item => {
      const color = THEME_COLORS[item.theme] ?? THEME_COLORS['Filosofía General'];
      return `
<div class="title-row">
  <span class="badge" style="color:${color}">${esc(item.theme)}</span>
  <p class="item-title">${esc(item.title)}</p>
</div>`;
    })
    .join('\n');

  const bodyContent = entryUrl
    ? `${titlesHtml}\n  <div class="cta"><a href="${esc(entryUrl)}" class="cta-btn">Leer edición completa →</a></div>`
    : digest.items.map(renderItem).join('\n') + '\n  <hr class="divider">';

  return `<!DOCTYPE html>
<html lang="es">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width,initial-scale=1.0">
<title>Una Vida Examinada — ${esc(digest.issueDate)}</title>
<link href="https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,400;0,600;1,400&family=Source+Sans+3:wght@300;400;600&display=swap" rel="stylesheet">
<style>
*,*::before,*::after{box-sizing:border-box;margin:0;padding:0}
body{background:#FAFAF8;color:#1A1A1A;font-family:'Source Sans 3',system-ui,sans-serif;font-size:18px;line-height:1.75;font-weight:300}
.wrap{max-width:660px;margin:0 auto;padding:0 24px}
.header{border-bottom:1px solid #D8D4CC;padding:48px 0 36px;text-align:center}
.eyebrow{font-size:10px;letter-spacing:.35em;text-transform:uppercase;color:#9A9590;margin-bottom:16px;font-weight:400}
.title{font-family:'Playfair Display',Georgia,serif;font-size:44px;font-weight:400;color:#1A1A1A;letter-spacing:.01em;margin-bottom:6px;font-style:italic}
.date{font-size:13px;color:#8A8580;margin-top:4px}
.module-label{font-size:11px;color:#4A6FA5;margin-top:10px;letter-spacing:.08em;text-transform:uppercase}
.editorial{border-top:2px solid #1A1A1A;border-bottom:1px solid #D8D4CC;margin:40px 0;padding:28px 0}
.editorial-label{font-size:9px;letter-spacing:.3em;text-transform:uppercase;color:#9A9590;margin-bottom:16px;display:block}
.editorial p{color:#1E1A18;font-size:17px;line-height:1.85;margin-bottom:14px;font-weight:300;text-align:justify}
.editorial p:last-child{margin-bottom:0}
.title-row{border-top:1px solid #E0DCD8;padding:20px 0}
.title-row:last-of-type{border-bottom:1px solid #E0DCD8;margin-bottom:0}
.title-row .item-title{font-family:'Playfair Display',Georgia,serif;font-size:20px;font-weight:400;color:#1A1A1A;line-height:1.3;margin-top:6px;text-align:left}
.cta{text-align:center;padding:40px 0 48px}
.cta-btn{display:inline-block;background:#1A1A1A;color:#FAFAF8;text-decoration:none;font-size:13px;letter-spacing:.1em;text-transform:uppercase;padding:14px 36px;font-weight:400}
.cta-btn:hover{background:#4A6FA5}
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
.footer{border-top:1px solid #D8D4CC;padding:28px 0;text-align:center}
.footer p{font-size:11px;color:#B0ABA5;line-height:1.8;margin-bottom:4px}
.footer a{color:#8A8580}
</style>
</head>
<body>

<div class="header">
  <div class="wrap">
    <p class="eyebrow">Digest Diario · Filosofía</p>
    <h1 class="title">Una Vida Examinada</h1>
    <p class="date">${esc(digest.issueDate)}</p>
    ${digest.moduleName ? `<p class="module-label">${esc(digest.moduleName.replace(/^M\d+\.\s*/, ''))}</p>` : ''}
  </div>
</div>

<div class="wrap">
  <div class="editorial">
    <span class="editorial-label">Nota editorial</span>
    ${editorialHtml}
  </div>

  ${bodyContent}
</div>

<div class="footer">
  <div class="wrap">
    <p><em>Una Vida Examinada</em> — Sintetizado por Claude para el lector filosóficamente curioso.</p>
    <p style="margin-top:8px"><a href="mailto:${esc('anthony@arrebol.com.mx')}">Contacto</a></p>
    ${opts.unsubscribeUrl ? `<p style="margin-top:14px;font-size:10px;color:#C0BBB5">¿Ya no quieres recibir esto? <a href="${esc(opts.unsubscribeUrl)}" style="color:#9A9590;text-decoration:underline">Desuscribirse</a></p>` : ''}
  </div>
</div>

</body>
</html>`;
}
