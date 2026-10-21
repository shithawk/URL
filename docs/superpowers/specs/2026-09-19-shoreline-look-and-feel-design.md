# Shoreline homepage look-and-feel polish

Date: 2026-09-19  
Page: `index.html` (single-file landing page for https://shoreline.one/)

## Goal

Keep Shoreline’s harbor identity — ocean video, foam/sun/coral palette, nautical chrome — and make the homepage feel finished. This is polish plus light structure, not a redesign.

Success: a visitor can read identity → welcome → one sentence of purpose → two project docks without competing hero elements, empty gaps, or toy-like emoji.

## Out of scope

- Split / editorial two-column layout
- New projects or a third dock
- Re-enabling the YouTube reel
- Logo artwork changes
- Framework / build step (stay on one HTML file)

## Page structure

Top to bottom, desktop and mobile:

1. **Coordinate bar** — three-part row: `LAT 44.9°N · LON 79.2°W` left, `jacob@shoreline.one` centered as a small foam-colored mailto, `STATUS: MOORED` right. Same 12px mono as today’s coords. Hover: shift toward `--sun`. On narrow screens the three parts wrap onto two lines rather than overlapping.
2. **Logo** — existing `logotext.png`.
3. **Badge** — keep “dive deeper, stay grounded” with the live foam dot.
4. **Heading** — “Welcome to / Shoreline” with the existing tide-word gradient.
5. **Intro** — one sentence, no empty comment placeholder:
   > A small harbor for personal web projects — notes, games, and whatever gets built next.
6. **Docks** — CloudNotes and Games, two-column on desktop, stacked on mobile.
7. **Footer** — “Shoreline · Where The Elements Meet” and “Adrift somewhere near 44.9°N”. No second email.

Remove the large teal `.contact` line from the hero.

## Type

- Load Inter from Google Fonts (weights 400, 600, 800). Keep the existing system-ui stack as fallback.
- Voice (heading, intro, card titles/bodies): Inter / `--sans`.
- Harbor chrome (coords, email, badge, dock numbers, “set sail”, footer): existing `--mono`.
- Intro: ~18px, line-height ~1.55, max-width ~34em, color a step brighter than `--ink-dim` so it reads over the video (approx `#9bb8c8`).
- Tighten hero spacing so the intro sits close to the heading and the docks follow without a large empty band.

## Dock cards

Keep glassy panels, pointer-follow glow, lift on hover, and “set sail →”.

Change:

- Replace emoji with a small (~36px) rounded square: foam stroke, faint foam fill, simple inline SVG (notebook for CloudNotes, controller for Games). Decorative, `aria-hidden`.
- Hierarchy inside the card: `DOCK 0N` + icon on one row, then title, then body, then a hairline, then “set sail”.
- Cards stretch to equal height in the grid; “set sail” sits at the bottom of each card.
- Existing copy stays. Focus ring stays foam.

## Atmosphere and motion

- Keep `#bgvideo`, spray canvas, and `.ocean` waves at 50% opacity.
- Slightly stronger dark veil over the video so heading, intro, and card type stay readable.
- Keep blink / wave / particle motion; all remain off under `prefers-reduced-motion`.
- No new animation systems.

## Implementation notes

All of this lands in `index.html` (CSS, markup, existing scripts). No new dependencies beyond a font stylesheet for Inter (Google Fonts or equivalent). Do not change verification files, `robots.txt`, `sitemap.xml`, or analytics.

## Testing

- Desktop: hierarchy, email in the top bar, intro present, two equal docks, footer without duplicate email.
- Mobile: top bar wraps without collision; docks stack; tap targets still clear.
- Hover/focus on docks and the email link.
- Reduced-motion: waves, blink, and spray do not run.
- Spot-check contrast of intro and card body over the video.
