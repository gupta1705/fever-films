# Iteration 2: Getty "Tracing Art" treatment

Iteration 1 (White Tiger copy) is saved as git tag `iteration-1` and stays at the repo root.
Iteration 2 lives in `iteration-2/` and reuses iteration 1's content and media (`../assets/img`,
`../assets/video`): same films, directors, copy, logo and colours.

## What Getty does (Awwwards MCP + browser walk-through)

- Nuxt + Three.js/WebGL, GSAP ScrollTrigger (15 scrubbed triggers, no pins), Lenis smooth scroll.
- One long scroll story (81,450 px). White page, black/grey UI; colour comes from the artworks and
  from pale background washes per chapter.
- Type: display serif "Bardford" (30 / 54 / 135 / 207 px, tight tracking) + small Graphik UI text
  (10–14 px).
- Moves, in order: loader → drifting 3D field of artworks and grey placeholders around a centred
  serif headline + "Scroll down" pill → one artwork pinned while narrative lines swap and a year
  timeline ticks along the bottom → zoom into the artwork until it fills the screen → huge serif
  names rolling past with an artwork between them on a tinted background → lone serif statements
  on colour fields → closing statement with a rotating word + hairline "Resources" list.
- Chrome: small wordmark top-left, black rounded-square menu → frosted "About" panel, right-edge
  progress rail, "Click on an artwork to learn more" pill bottom-right.

## Fever version (one page, chapters = the required sections)

| Getty move | Fever chapter |
|---|---|
| Field + headline | Intro: film stills and director portraits drifting around "Here's how TVF's storytellers make ads people watch till the end." |
| Pinned artwork (replaced by request: the films play instead) | **Spotify x Gullak** (first, as asked): the three films play in place, muted until "Sound on", Laddoo → Lights → Rangoli rolling on, gold progress line; 720p web copies in `iteration-2/video/` encoded from the public Drive masters |
| Huge names on tints | **Work**: brand names in huge serif, a still between, every film listed; tint taken from each brand's colour |
| Pinned + timeline | **Directors**: four directors, name huge behind the portrait, credits + IMDb |
| Statements on a colour field | **About**: who we are, why brands work with us, what we make, numbers, TVF record |
| Closing + rotating word + Resources | **Contact**: "A story-first studio for brands / governments / studios / platforms", email, socials |

Signature: the right-edge progress rail is the logo's thermometer — red bulb, yellow mercury that
rises as you scroll.

Tech: static HTML/CSS/JS. Sticky scenes + a ~40-line scroll engine writing `--p` (0→1) per scene
instead of GSAP; CSS 3D transforms instead of WebGL; Lenis 1.1.13 from unpkg for the smooth scroll.
Theme (requested 2026-11-19): black and gold. Warm black `#0b0a08`, ivory text `#efe6d2`, gold
`#d4ae5c` (gilt gradient on the huge names), the logo's red kept only for the thermometer bulb,
white-letter logo (`iteration-2/img/logo-light.svg`). Chapters change colour visibly as you scroll:
each brand gets a deep tone of its own colour (Spotify green, CyberDost navy, Wiom plum…), Directors
bronze, About solid gold with black type, Contact back to black.
Fonts (chosen to avoid the usual AI picks such as Inter, Playfair or Cormorant): Imbue, a condensed
high-contrast serif with optical sizes, for display; Host Grotesk for UI text, in sentence case.
Top bar (requested, after a thermometer-shaped version was rejected): simple. Bare logo left (dark
letters on the gold About chapter); Work · Directors · About · Contact centred, with a gold underline
that slides in on hover and stays under the section you're in; gold "Email a brief" right; a 2px
red→gold progress hairline along the top edge; a soft fade behind the bar in the current chapter's
colour. Phones: "Menu" opens a full-screen overlay of large gold section names; "Email a brief"
floats at the bottom, above everything (also inside the film viewer). No "Scroll down".
Spotify films: no tabs (removed by request); they play one after another on their own.
Directors (changed on request: the pinned portrait, huge gilt name and timeline read as AI-made) are now
a production-house roster. Each row has the name, their shows with IMDb ratings, and an IMDb link. On a
mouse, the hovered director's portrait follows the pointer. On phones it sits beside the name.
Phones: brands in the Work roll sit 7vh apart instead of 14vh (on request, too much gap).
Film data lives once in `iteration-2/app.js`; the lightbox from iteration 1 is reused.
Reduced motion: no smooth scroll, no drift, no zoom; text still steps.

## Check (2026-11-19)

- `tests/smoke.cjs` covers both iterations and passes: assets resolve, no console errors, story
  lines and timeline advance with scroll, lightbox opens / steps / closes, menu jumps to chapters,
  deep links work, no sideways scroll on a phone.
- Awwwards `verify_build` vs Getty: 29/100. Motion 56/100 because Getty runs WebGL + GSAP and this
  build uses CSS transforms + a small scroll script; structure 11/100 because the tool sees Getty as
  three unlabelled blocks. Mobile audit: 0 overflow, 0 small text, 0 small tap targets.
- Not copied: Getty's WebGL depth/blur on the field, its per-artwork info popups (films open the
  lightbox instead), and its 81,000 px length (this story is ~25,000 px).
