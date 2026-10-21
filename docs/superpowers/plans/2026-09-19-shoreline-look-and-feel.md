# Shoreline Look-and-Feel Polish Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Polish `index.html` so Shoreline’s harbor landing page reads identity → welcome → one intro sentence → two dock cards, without competing hero chrome or emoji icons.

**Architecture:** Stay on the existing single-file page. All visual and structural work is CSS + markup in `index.html`. A tiny Node assert script checks required strings and structure; look-and-feel is verified in the browser. No framework, no new runtime dependencies.

**Tech Stack:** HTML, CSS, existing inline JS, Google Fonts (Inter 400/600/800), Node.js `assert` for structure checks.

## Global Constraints

- Stay on one HTML file for the site: `index.html` (no framework / build step).
- Keep ocean video `#bgvideo`, spray canvas, `.ocean` waves at `opacity: 0.5`, foam/sun/coral palette, nautical chrome.
- Intro copy must be exactly: `A small harbor for personal web projects — notes, games, and whatever gets built next.`
- Email lives only in the coordinate bar (`jacob@shoreline.one`); footer has no second email; remove the large teal hero `.contact` line.
- Dock cards: inline SVG notebook (CloudNotes) and controller (Games); no emoji icons; `aria-hidden` on decorative glyphs.
- Load Inter from Google Fonts weights 400, 600, 800. Keep `--sans` fallback stack.
- No new animation systems. `prefers-reduced-motion` continues to disable waves, blink, and spray.
- Do not change verification files, `robots.txt`, `sitemap.xml`, analytics, or logo artwork.
- Do not re-enable the YouTube reel or add a third dock.

## File map

- Modify: `index.html` — fonts, veil, type, coords bar, hero, docks, footer.
- Create: `test/homepage-structure.mjs` — Node structure checks (stdlib only).
- Do not touch: `BingSiteAuth.xml`, `yandex_*.html`, `zohoverify/`, `robots.txt`, `sitemap.xml`, `vercel.json`.

---

### Task 1: Inter, intro type, stronger veil

**Files:**
- Create: `test/homepage-structure.mjs`
- Modify: `index.html` (head font links; `:root` `--ink-lede`; `body::before`; `header.hero`; `.lede`)

**Interfaces:**
- Consumes: current `index.html` styles around lines 49–204.
- Produces: `--ink-lede: #9bb8c8`; Inter loaded; veil `rgba(4,18,31,0.68) / 0.48 / rgba(11,58,91,0.72)`; hero padding `4vh 0 5vh`; `.lede` at 18px / 1.55 / max-width 34em.

- [ ] **Step 1: Write the failing structure test**

Create `test/homepage-structure.mjs`:

```js
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
```

- [ ] **Step 2: Run test to verify it fails**

Run: `node test/homepage-structure.mjs`

Expected: FAIL with `Inter 400/600/800 must be loaded from Google Fonts` (file missing or assertion error).

- [ ] **Step 3: Add Inter and type/veil CSS**

In `index.html` `<head>`, immediately after `<link rel="icon" href="/favicon.ico" sizes="any" />`, insert:

```html
<link rel="preconnect" href="https://fonts.googleapis.com" />
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
<link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;600;800&display=swap" rel="stylesheet" />
```

In `:root`, after `--ink-dim:#7fa0b4;`, add:

```css
    --ink-lede:#9bb8c8;
```

Replace the `body::before` background with:

```css
    background: linear-gradient(180deg, rgba(4,18,31,0.68) 0%, rgba(4,18,31,0.48) 45%, rgba(11,58,91,0.72) 100%);
```

Replace:

```css
  header.hero {
    padding: 5vh 0 8vh;
  }
```

with:

```css
  header.hero {
    padding: 4vh 0 5vh;
  }
```

Replace the `.lede` rule with:

```css
  .lede {
    max-width: 34em;
    font-size: 18px;
    line-height: 1.55;
    color: var(--ink-lede);
  }
```

- [ ] **Step 4: Run test to verify it passes**

Run: `node test/homepage-structure.mjs`

Expected: `homepage-structure: ok`

- [ ] **Step 5: Commit**

```bash
git add test/homepage-structure.mjs index.html
git commit -m "Load Inter and tighten hero type over a stronger veil"
```

---

### Task 2: Quiet email, intro sentence, footer without duplicate contact

**Files:**
- Modify: `test/homepage-structure.mjs`
- Modify: `index.html` (`.coords` / `.contact` CSS; hero markup; footer)

**Interfaces:**
- Consumes: existing `.coords` flex bar and hero `.contact` (large teal mailto).
- Produces: three-part `.coords` grid with centered `.contact`; intro sentence in `.lede`; footer with tagline + location only; `aria-hidden` only on decorative coord spans so the email stays accessible.

- [ ] **Step 1: Extend the test with structure assertions**

Append these asserts to `test/homepage-structure.mjs` before `console.log`:

```js
assert.match(
  html,
  /A small harbor for personal web projects — notes, games, and whatever gets built next\./,
  "intro sentence must be present"
);
assert.equal(
  (html.match(/jacob@shoreline\.one/g) || []).length,
  1,
  "email must appear once"
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
```

- [ ] **Step 2: Run test to verify it fails**

Run: `node test/homepage-structure.mjs`

Expected: FAIL on intro sentence and/or email appearing more than once.

- [ ] **Step 3: Restyle the coordinate bar and contact link**

Replace the `.coords` / `.blink` / `.contact` CSS (from `/* top coordinate bar` through `.contact:hover { ... }`) with:

```css
  /* top coordinate bar — nautical/terminal flavor */
  .coords {
    font-family: var(--mono);
    font-size: 12px;
    letter-spacing: 0.08em;
    color: var(--ink-dim);
    padding: 20px 0 0;
    display: grid;
    grid-template-columns: 1fr auto 1fr;
    align-items: center;
    gap: 8px;
  }
  .coords .blink {
    color: var(--foam);
    animation: blink 1.6s steps(2, start) infinite;
  }
  @keyframes blink { 50% { opacity: 0.25; } }
  .coords .geo { justify-self: start; }
  .coords .status { justify-self: end; text-align: right; }

  .contact {
    justify-self: center;
    font-family: var(--mono);
    font-size: 12px;
    font-weight: 400;
    letter-spacing: 0.08em;
    color: var(--foam);
    text-decoration: none;
    transition: color .25s;
  }
  .contact:hover,
  .contact:focus-visible {
    color: var(--sun);
  }
  .contact:focus-visible {
    outline: 2px solid var(--foam);
    outline-offset: 3px;
  }

  @media (max-width: 640px) {
    .coords {
      grid-template-columns: 1fr 1fr;
    }
    .coords .contact {
      grid-column: 1 / -1;
      justify-self: start;
    }
  }
```

- [ ] **Step 4: Move email, fill intro, strip footer mailto**

Replace the `.wrap` opening through the hero with:

```html
  <div class="wrap">
    <div class="coords">
      <span class="geo" aria-hidden="true">LAT 44.9°N &nbsp;·&nbsp; LON 79.2°W</span>
      <a class="contact" href="mailto:jacob@shoreline.one">jacob@shoreline.one</a>
      <span class="status" aria-hidden="true">STATUS: <span class="blink">MOORED ▮</span></span>
    </div>

    <header class="hero">
      <img class="logo" src="logotext.png" alt="Shoreline" />
      <span class="badge"><span class="dot"></span>dive deeper, stay grounded</span>
      <h1>Welcome to<br /><span class="tide-word">Shoreline</span></h1>
      <p class="lede">
        A small harbor for personal web projects — notes, games, and whatever gets built next.
      </p>
    </header>
```

Replace the footer with:

```html
  <footer>
    <p>Shoreline · Where The Elements Meet</p>
    <p style="margin-top:6px;">Adrift somewhere near 44.9°N</p>
  </footer>
```

- [ ] **Step 5: Run test to verify it passes**

Run: `node test/homepage-structure.mjs`

Expected: `homepage-structure: ok`

- [ ] **Step 6: Commit**

```bash
git add test/homepage-structure.mjs index.html
git commit -m "Move contact into the coords bar and add the harbor intro"
```

---

### Task 3: Icon-tile dock cards

**Files:**
- Modify: `test/homepage-structure.mjs`
- Modify: `index.html` (`.docks` / `.dock` CSS and the two `<a class="dock">` blocks)

**Interfaces:**
- Consumes: existing `.dock` glassy card, pointer-follow `--mx/--my` script, CloudNotes and Games copy.
- Produces: `.dock-head` row with `.num` + `.glyph`; notebook and gamepad SVGs (`aria-hidden="true"`); `.go` pinned to the bottom with a hairline; no `🗒️` or `🎮`.

- [ ] **Step 1: Extend the test for card structure**

Append before `console.log`:

```js
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
```

- [ ] **Step 2: Run test to verify it fails**

Run: `node test/homepage-structure.mjs`

Expected: FAIL on emoji icons (`🗒️|🎮`).

- [ ] **Step 3: Update dock CSS**

Replace from `/* the "docks"` through `.dock.soon .go { color: var(--ink-dim); }` with:

```css
  /* the "docks" — app cards laid out like moored boats */
  .docks {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(260px, 1fr));
    gap: 20px;
    padding-bottom: 10vh;
    align-items: stretch;
  }

  .dock {
    position: relative;
    display: flex;
    flex-direction: column;
    text-decoration: none;
    color: inherit;
    border-radius: 20px;
    padding: 28px;
    background: linear-gradient(180deg, rgba(4,18,31,0.82), rgba(7,29,49,0.78));
    border: 1px solid rgba(255,255,255,0.09);
    backdrop-filter: blur(8px);
    -webkit-backdrop-filter: blur(8px);
    overflow: hidden;
    transition: transform .3s cubic-bezier(.2,.8,.2,1), border-color .3s, box-shadow .3s;
    isolation: isolate;
  }
  .dock::before {
    content: "";
    position: absolute;
    inset: 0;
    z-index: -1;
    opacity: 0;
    transition: opacity .35s;
    background: radial-gradient(400px 200px at var(--mx, 50%) var(--my, 0%), rgba(127,231,214,0.18), transparent 70%);
  }
  .dock:hover {
    transform: translateY(-6px);
    border-color: rgba(127,231,214,0.5);
    box-shadow: 0 20px 50px -20px rgba(0,0,0,0.7);
  }
  .dock:hover::before { opacity: 1; }
  .dock:focus-visible {
    outline: 2px solid var(--foam);
    outline-offset: 3px;
  }

  .dock-head {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 16px;
  }
  .dock .num {
    font-family: var(--mono);
    font-size: 12px;
    color: var(--foam-2);
    letter-spacing: 0.1em;
  }
  .dock .glyph {
    width: 36px;
    height: 36px;
    border-radius: 10px;
    border: 1px solid rgba(127, 231, 214, 0.35);
    background: rgba(127, 231, 214, 0.08);
    color: var(--foam);
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
  }
  .dock .glyph svg {
    width: 18px;
    height: 18px;
    display: block;
  }
  .dock h2 { font-size: 24px; font-weight: 700; letter-spacing: -0.01em; margin-bottom: 8px; }
  .dock p { color: var(--ink-dim); font-size: 15px; line-height: 1.55; }
  .dock .go {
    margin-top: auto;
    padding-top: 16px;
    border-top: 1px solid rgba(255,255,255,0.08);
    font-family: var(--mono);
    font-size: 13px;
    color: var(--foam);
    display: inline-flex;
    align-items: center;
    gap: 8px;
  }
  .dock .go .arrow { transition: transform .3s; }
  .dock:hover .go .arrow { transform: translateX(6px); }

  .dock.soon { cursor: default; }
  .dock.soon:hover { transform: none; border-color: rgba(255,255,255,0.09); box-shadow: none; }
  .dock.soon:hover::before { opacity: 0; }
  .dock.soon .go { color: var(--ink-dim); }
```

- [ ] **Step 4: Replace dock markup**

Replace `<main class="docks" ...>` through `</main>` with:

```html
    <main class="docks" aria-label="Projects">
      <a class="dock" href="https://notes.shoreline.one">
        <span class="dock-head">
          <span class="num">DOCK 01</span>
          <span class="glyph" aria-hidden="true">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round">
              <path d="M7 4h10a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2z"/>
              <path d="M9 4v16"/>
              <path d="M12 8h5M12 12h5M12 16h3"/>
            </svg>
          </span>
        </span>
        <h2>CloudNotes</h2>
        <p>A fast, private notebook that syncs to the cloud. Sign in, jot things down, come back to them anywhere.</p>
        <span class="go"><span>set sail</span><span class="arrow">→</span></span>
      </a>

      <a class="dock" href="https://games.shoreline.one">
        <span class="dock-head">
          <span class="num">DOCK 02</span>
          <span class="glyph" aria-hidden="true">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round">
              <path d="M6 12h4M8 10v4"/>
              <path d="M15.2 11.2h.1M17.5 13.6h.1"/>
              <path d="M7.2 8.2h9.6a4.2 4.2 0 0 1 4.1 5.2l-.6 1.9A2.4 2.4 0 0 1 18 17.2H6a2.4 2.4 0 0 1-2.3-1.9l-.6-1.9a4.2 4.2 0 0 1 4.1-5.2z"/>
            </svg>
          </span>
        </span>
        <h2>Games</h2>
        <p>A little arcade corner — small browser games to waste a few good minutes on. More get added when the tide's right.</p>
        <span class="go"><span>set sail</span><span class="arrow">→</span></span>
      </a>
    </main>
```

Leave the commented “DOCK 03” block commented. Do not uncomment the YouTube reel.

- [ ] **Step 5: Run test to verify it passes**

Run: `node test/homepage-structure.mjs`

Expected: `homepage-structure: ok`

- [ ] **Step 6: Commit**

```bash
git add test/homepage-structure.mjs index.html
git commit -m "Replace dock emoji with foam icon tiles and pin set-sail"
```

---

### Task 4: Browser verification

**Files:**
- Verify only: `index.html` (no further code unless a check fails)

**Interfaces:**
- Consumes: Tasks 1–3 markup and CSS.
- Produces: Confirmed desktop/mobile hierarchy, hover/focus, reduced-motion, contrast over video.

- [ ] **Step 1: Serve the page locally**

If nothing is already serving the folder, run from the repo root:

```bash
python3 -m http.server 4173
```

Open: `http://127.0.0.1:4173/`

- [ ] **Step 2: Desktop pass**

Confirm:

- Reading order is logo → badge → “Welcome to Shoreline” → intro sentence → two docks.
- Email is a small foam link in the top bar, not a large teal hero line.
- Footer has tagline + location only.
- Docks are equal height; “set sail” sits on a hairline at the bottom of each card.
- Hovering a dock lifts it and shows the pointer glow; hovering email shifts toward `--sun`.
- Keyboard: Tab to email and each dock shows a foam focus ring.
- Waves remain at 50% opacity; video still plays under the stronger veil.
- Intro and card body remain readable over the video.

- [ ] **Step 3: Mobile pass (~390px wide)**

Confirm:

- Coords wrap to two lines without overlapping the email.
- Docks stack full-width.
- “set sail” remains easy to tap.

- [ ] **Step 4: Reduced motion**

In Chrome DevTools: Rendering → emulate `prefers-reduced-motion: reduce`. Reload.

Confirm: waves do not drift, status cursor does not blink, spray particles do not run (the existing script still bails out on that media query).

- [ ] **Step 5: Re-run structure test**

Run: `node test/homepage-structure.mjs`

Expected: `homepage-structure: ok`

If a visual check fails, fix `index.html` in this task, re-run the test, and make a new commit:

```bash
git add index.html
git commit -m "Fix look-and-feel issues found in browser checks"
```

---

## Spec coverage

| Spec item | Task |
| --- | --- |
| Three-part coords bar with quiet email | 2 |
| Remove hero contact; footer without second email | 2 |
| Intro sentence | 2 |
| Inter 400/600/800 | 1 |
| Lede 18px / 1.55 / 34em / `#9bb8c8` | 1 |
| Tighter hero spacing | 1 |
| Stronger veil | 1 |
| Icon-tile docks, equal height, hairline + set sail | 3 |
| Keep video, spray, 50% waves, existing motion | 1–4 (unchanged except veil) |
| Reduced motion | 4 (existing CSS/JS) |
| No YouTube, no third dock, no extra deps | 3–4 |
| Desktop/mobile/hover/contrast checks | 4 |
