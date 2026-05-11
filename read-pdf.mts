import { createRequire } from 'module';
import { readFileSync } from 'fs';

const req = createRequire(import.meta.url);
const pdfParse = req('pdf-parse') as (b: Buffer) => Promise<{ text: string }>;

const path = process.argv[2];
const buf = readFileSync(path);
const { text } = await pdfParse(buf);

// Skip TOC/header lines, get real prose
const lines = text.split('\n').map(l => l.trim()).filter(Boolean);
let startIdx = 0;
for (let i = 0; i < lines.length; i++) {
  const l = lines[i];
  if (l.length > 80 && !/^[\d\.]+\s/.test(l) && !/^(CONTENIDO|Objetivos|Bibliograf)/i.test(l)) {
    startIdx = i;
    break;
  }
}
const content = lines.slice(startIdx).join('\n');
process.stdout.write(content.slice(0, 8000));
