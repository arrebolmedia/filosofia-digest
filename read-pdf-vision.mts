import Anthropic from '@anthropic-ai/sdk';
import { readFileSync } from 'fs';
import { pdf } from 'pdf-to-img';
import 'dotenv/config';

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

const pdfPath = process.argv[2] ?? 'c:\\tmp\\M1T1.pdf';
const scale   = 2; // 2× resolution for legibility

async function extractPageText(imageBuffer: Buffer, pageNum: number): Promise<string> {
  const base64 = imageBuffer.toString('base64');
  const response = await client.messages.create({
    model:      'claude-opus-4-7',
    max_tokens: 2048,
    messages: [{
      role: 'user',
      content: [
        {
          type: 'image',
          source: { type: 'base64', media_type: 'image/png', data: base64 },
        },
        {
          type: 'text',
          text: `Esta es la página ${pageNum} de un texto filosófico académico en español. Transcribe el texto completo tal como aparece, preservando párrafos. Omite encabezados de página, números de página, pies de página y logos institucionales. Solo el cuerpo del texto filosófico.`,
        },
      ],
    }],
  });
  const block = response.content[0];
  return block.type === 'text' ? block.text : '';
}

const doc = await pdf(pdfPath, { scale });
const pages: string[] = [];
let pageNum = 0;

for await (const pageImage of doc) {
  pageNum++;
  process.stderr.write(`\r[vision] página ${pageNum}…`);
  const text = await extractPageText(Buffer.from(pageImage), pageNum);
  pages.push(text);
}

process.stderr.write(`\n[vision] ${pageNum} páginas extraídas\n`);
process.stdout.write(pages.join('\n\n---\n\n'));
