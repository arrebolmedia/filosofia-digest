import { readdir, readFile } from 'fs/promises';
import { join, basename, extname } from 'path';
import type { RawItem } from './fetcher.js';
import 'dotenv/config';

// pdf-parse 1.x ships only CJS; load via createRequire
import { createRequire } from 'module';
const require = createRequire(import.meta.url);
const pdfParse = require('pdf-parse') as (buf: Buffer) => Promise<{ text: string }>;

export interface PdfModule {
  index:     number;  // 1-based (M1, M2, …)
  name:      string;  // e.g. "Introducción a la Filosofía"
  dirName:   string;  // e.g. "M1. Introducción a la Filosofía"
  fullPath:  string;
}

const PDF_ROOT = process.env.PDF_ROOT ?? 'C:\\Users\\Marketing\\OneDrive\\Desktop\\Licenciatura en Filosofía';

// Match folder names like "M1. Foo" or "M10. Bar"
const MODULE_DIR_RE = /^M(\d+)\.\s+(.+)$/;

// Match topic files like "M1T3. Foo.pdf" — exclude Lecturas/Materiales subfolders
const TOPIC_FILE_RE = /^M\d+T\d+[^/\\]*\.pdf$/i;

export async function listModules(): Promise<PdfModule[]> {
  const entries = await readdir(PDF_ROOT, { withFileTypes: true });
  const modules: PdfModule[] = [];

  for (const entry of entries) {
    if (!entry.isDirectory()) continue;
    const m = entry.name.match(MODULE_DIR_RE);
    if (!m) continue;
    modules.push({
      index:    parseInt(m[1]),
      name:     m[2].trim(),
      dirName:  entry.name,
      fullPath: join(PDF_ROOT, entry.name),
    });
  }

  return modules.sort((a, b) => a.index - b.index);
}

export async function moduleForToday(modules: PdfModule[]): Promise<PdfModule> {
  // Epoch-day offset so day 0 = module 0, day 1 = module 1, etc.
  const dayIndex = Math.floor(Date.now() / 86_400_000);
  return modules[dayIndex % modules.length];
}

async function extractText(filePath: string): Promise<string> {
  const buf = await readFile(filePath);
  const { text } = await pdfParse(buf);

  // Split into lines, drop the header/index block (everything before the first
  // paragraph of real prose). Heuristic: skip lines shorter than 80 chars or
  // that look like numbered TOC entries, until we find a line of real text.
  const lines = text.split('\n').map(l => l.trim()).filter(Boolean);
  let startIdx = 0;
  for (let i = 0; i < lines.length; i++) {
    const l = lines[i];
    // Real prose: long enough and doesn't look like a TOC / heading code
    if (l.length > 80 && !/^[\d\.]+\s/.test(l) && !/^(CONTENIDO|Objetivos|Bibliograf)/i.test(l)) {
      startIdx = i;
      break;
    }
  }

  return lines
    .slice(startIdx)
    .join(' ')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, 2_000);
}

function titleFromFilename(filename: string): string {
  // "M1T3. Métodos de la filosofía.pdf" → "Métodos de la filosofía"
  const noExt = filename.replace(/\.pdf$/i, '');
  const withoutCode = noExt.replace(/^M\d+T\d+\.\s*/, '');
  return withoutCode.trim() || noExt;
}

export async function readModulePdfs(mod: PdfModule): Promise<RawItem[]> {
  const entries = await readdir(mod.fullPath, { withFileTypes: true });

  // Only direct-child PDF files matching topic pattern (no subfolders)
  const pdfFiles = entries
    .filter(e => e.isFile() && TOPIC_FILE_RE.test(e.name))
    .map(e => e.name)
    .sort((a, b) => {
      const n = (s: string) => parseInt(s.match(/T(\d+)/i)?.[1] ?? '0');
      return n(a) - n(b);
    });

  const items: RawItem[] = [];

  for (const filename of pdfFiles) {
    const fullPath = join(mod.fullPath, filename);
    let excerpt = '';
    try {
      excerpt = await extractText(fullPath);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      console.warn(`[pdf-reader] Could not parse "${filename}": ${msg}`);
      continue;
    }

    if (!excerpt.trim()) continue;

    items.push({
      title:      titleFromFilename(basename(filename, extname(filename))),
      link:       `file:///${fullPath.replace(/\\/g, '/')}`,
      pubDate:    new Date(),
      excerpt,
      sourceName: mod.name,
    });
  }

  return items;
}
