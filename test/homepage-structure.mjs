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
assert.match(
  html,
  /A small harbor for personal web projects — notes, games, and whatever gets built next\./,
  "intro sentence must be present"
);
assert.equal(
  (html.match(/mailto:jacob@shoreline\.one/g) || []).length,
  1,
  "mailto contact must appear once"
);
assert.match(
  html,
  /<div class="coords">[\s\S]*mailto:jacob@shoreline\.one[\s\S]*STATUS:/,
  "email must live inside .coords, before STATUS"
);
assert.doesNotMatch(
  html,
  /<header class="hero">[\s\S]*mailto:jacob@shoreline\.one/,
  "hero must not contain the mailto"
);
assert.doesNotMatch(
  html,
  /<footer>[\s\S]*mailto:jacob@shoreline\.one/,
  "footer must not contain the mailto"
);
assert.doesNotMatch(
  html,
  /<div class="coords" aria-hidden="true">/,
  "coords wrapper must not be aria-hidden (email lives there)"
);
assert.doesNotMatch(html, /🗒️|🎮/, "dock cards must not use emoji icons");
assert.match(html, /<span class="dock-head">/, "each dock needs a head row");
assert.match(html, /class="glyph" aria-hidden="true"/, "glyphs must be decorative");
assert.equal((html.match(/<svg[\s>]/g) || []).length, 3, "one ocean svg plus two dock icons");
assert.match(
  html,
  /href="https:\/\/notes\.shoreline\.one"[\s\S]*CloudNotes[\s\S]*A fast, private notebook/,
  "CloudNotes copy must stay"
);
assert.match(
  html,
  /href="https:\/\/games\.shoreline\.one"[\s\S]*Games[\s\S]*A little arcade corner/,
  "Games copy must stay"
);

console.log("homepage-structure: ok");
