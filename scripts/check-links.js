'use strict';

const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const LINK_RE = /\[[^\]]+\]\(([^)\s]+)(?:\s+"[^"]*")?\)/g;
const files = [];
const broken = [];

function walk(dir) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (entry.name === '.git' || entry.name === 'node_modules') continue;
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) walk(full);
    else if (entry.isFile() && full.endsWith('.md')) files.push(full);
  }
}

walk(ROOT);

for (const file of files) {
  const source = fs.readFileSync(file, 'utf8');
  for (const match of source.matchAll(LINK_RE)) {
    const target = match[1].trim().replace(/^<|>$/g, '');
    if (!target || target.startsWith('#') || /^(?:https?:|mailto:|tel:)/i.test(target)) continue;
    const localTarget = decodeURIComponent(target.split('#', 1)[0]);
    if (!localTarget) continue;
    const resolved = path.resolve(path.dirname(file), localTarget);
    if (!resolved.startsWith(ROOT + path.sep) && resolved !== ROOT) {
      broken.push(`${path.relative(ROOT, file)} -> ${target} (outside repository)`);
    } else if (!fs.existsSync(resolved)) {
      broken.push(`${path.relative(ROOT, file)} -> ${target}`);
    }
  }
}

if (broken.length) {
  console.error(`❌ Broken local Markdown links: ${broken.length}`);
  for (const link of broken) console.error(`  - ${link}`);
  process.exit(1);
}

console.log(`✅ Markdown links: ${files.length} files checked, no broken local links`);
