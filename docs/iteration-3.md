# Iteration 3: the whiteboard flow

Iteration 3 lives in `iteration-3/` and keeps iteration 2's look. That means black and gold, Imbue and
Host Grotesk, the simple nav, the "Email a brief" button that never leaves the screen, per-chapter
colours and the lightbox. Iteration 2 stays untouched in `iteration-2/`.

## Whiteboard flow → site

| Whiteboard | Site |
|---|---|
| "Banana-logo / Same – blackscreen pe apna logo" + "How is your fever (thermometer in logo)" | **Opening**: it starts on a black screen with *How is your fever?* A red mercury line climbs across the screen while a readout ticks from 98.6°F to 103.0°F. The line then drops into the thermometer inside the logo, *fever* lands, *FILMS* follows, and the logo flies to the top bar. It takes about 3.5 s. A click or any key skips it, and it never plays for reduced-motion visitors or when the link points into the page (`#work`, a film). |
| Page open: snapshots of multiple films, an edit (Banana in a Suit / 1st December) | **Montage hero**: a full-screen, muted, looping cut of our films, like the full-bleed Thums Up loop on 1stdecember.com. The headline sits over it, a caption names the film on screen, and there is a Pause / Play button. |
| Our work | Spotify x Gullak playing in place first, as asked before, then the brand roll |
| Our directors | The four directors, with portraits pinned as you scroll |
| IP | **New**: the TVF shows brands can step into, on the logo's fever red. "8 of 14" Indian shows in IMDb's global Top 250. Panchayat and Gullak each link the ads that used them. The facts come from the deck's "TVF record". |
| (not on the board) | About (gold) and Contact are kept at the end. The TVF record moved from About into IP. |

The red notes on the board (props, Delhi warehouse, 4–5 hours) read as production notes, not site
content, so they are left out.

## Opening animation

The opening starts from the "Brief Box" concept artifact ("Fever rising": mercury line plus temperature
readout, logo flies to the header), moved onto black. It is rebuilt with the official
`FeverFilms-SecondaryLogo` vector from the Drive logo pack, inlined in `index.html` and split into
word / FILMS / tube / mercury so each part can move. A small rAF timeline in `app.js` (`playOpening`)
drives it. The landing spot is measured from the header logo, so the hand-off is pixel-exact. If
the script never runs, a CSS failsafe hides the black layer after 7 s.

## Montage

`scripts/make-montage.sh` cuts `iteration-3/video/montage.mp4`: 16 cuts of 1.2 s each, 19.2 s in total,
720p, no sound, 1.9 MB. It uses two sources:
- 8 motion clips from the public Drive masters (Spotify x Gullak, CU Online), seeking remotely;
- 8 slow push-ins on stills. These cover the films that only exist on YouTube (CyberDost with Amitabh
  Bachchan, Sitaare Zameen Par, UltraTech, Aadhar, Marzi). They also cover Wiom, because its Drive
  masters stopped answering ranged reads while this was being cut. Every brand is in the edit.

The cut list in `app.js` (`CUTS`) must match the script's order. It drives the "on screen" caption.

Shared media: the Spotify films are read from `../iteration-2/video/` (about 20 MB, not copied).
Deleting iteration 2 breaks iteration 3's screening.

## Check (2026-11-19)

`tests/smoke.cjs` now covers iteration 3 and passes, along with iterations 1 and 2. It checks that:
- the opening plays, hands the logo to the top bar and starts the montage;
- a click skips the opening, and links skip it;
- every asset resolves and the chapter order is montage, work, directors, IP, about, contact;
- the caption follows the cuts, and Pause works;
- the nav jumps to IP, and IP links open the lightbox;
- a deep link opens its film;
- on a phone nothing overflows sideways and the caption clears the floating "Email a brief" button.

Seeking can't be tested locally (python's `http.server` has no range requests), so the caption check
plays through to the third cut instead.
