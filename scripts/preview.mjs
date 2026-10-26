// Writes preview.html (a dark page embedding every SVG) and prints its path - open it in a browser.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const files = ['banner', 'terminal', 'stats', 'footer'].filter((f) => fs.existsSync(path.join(root, 'assets', `${f}.svg`)));
const html = `<!doctype html><meta charset="utf-8"><title>profile preview</title>
<body style="margin:0;background:#0d1117;color:#8b949e;font:14px system-ui">
<main style="max-width:900px;margin:32px auto;display:grid;gap:24px;padding:0 16px">
${files.map((f) => `<section><p style="margin:0 0 8px">assets/${f}.svg</p><img src="assets/${f}.svg" style="width:100%;display:block"></section>`).join('\n')}
</main></body>`;
fs.writeFileSync(path.join(root, 'preview.html'), html);
console.log('Open', path.join(root, 'preview.html'));
