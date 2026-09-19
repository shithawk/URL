import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const html = fs.readFileSync(path.join(root, "index.html"), "utf8");

assert.match(
  html,
  /fonts\.googleapis\.com\/css2\?family=Inter:wght@400;600;800/,
  "Inter 400/600/800 must be loaded from Google Fonts"
);
assert.match(html, /--ink-lede:\s*#9bb8c8/, "intro color token --ink-lede must be #9bb8c8");
assert.match(
  html,
  /rgba\(4,18,31,0\.68\).*rgba\(4,18,31,0\.48\).*rgba\(11,58,91,0\.72\)/s,
  "video veil must be the stronger overlay"
);
assert.match(
  html,
  /header\.hero\s*\{\s*padding:\s*4vh 0 5vh;/,
  "hero padding must be 4vh 0 5vh"
);
assert.match(
  html,
  /\.lede\s*\{[^}]*max-width:\s*34em;[^}]*font-size:\s*18px;[^}]*line-height:\s*1\.55;[^}]*color:\s*var\(--ink-lede\);/s,
  "lede must use 18px / 1.55 / 34em / --ink-lede"
);

console.log("homepage-structure: ok");
