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

## Round 2 (feedback: "looks very AI, the font style, the way it's written")

- Type: the condensed Imbue serif, the gilt gradient on big names and the italic gold accents are
  gone. It is now Host Grotesk only: bold and tight for names and headings, flat gold for the big names.
- Hero: no headline or eyebrow over the montage, like 1st December. The only text is a credit line
  naming the film on screen (brand + title, taken from the film data). Clicking it opens that film.
- Copy: plain and specific. "Our work", "Our directors", "Your brand, in a TVF show" (CyberDost went
  to Phulera; Spotify spent Diwali with the Mishras), "Got a brief?" with the email. The rotating
  "A story-first studio for…" line is gone.
- Directors: a roster, not the pinned stage. This change is shared with iteration 2.
- Phones: brands in the Work roll sit 7vh apart instead of 14vh.

## Round 3 (team notes, 2026-11-20)

- Visual order, everywhere films are shown: Amitabh Bachchan (CyberDost), Aamir Khan (Sitaare Zameen
  Par), Suniel Shetty (Marzi), Spotify, CU Online, then the other ads. The montage is recut in that
  order (15 cuts, 18 s). The Work list follows it too. Spotify's entry is the three films playing in
  place, so the Work list now runs CyberDost → Aamir Khan Productions → Marzi → Spotify (playing) →
  CU Online → UltraTech → Aadhar → Wiom.
- TVF is named once: "Fever Films has an exclusive partnership with TVF and their IPs." (the IP
  heading). Every other mention is gone: title, meta, "advertising arm of TVF", "TVF's shows", "TVF
  network", "TVF Pitchers" (now "Pitchers") and the footer.

## Behind the scenes (added 2026-11-20)

The section sits between Directors and IP, and the nav has a "BTS" link to it. It has three strips
of photos from the sets: Marzi (September 2026, three shoot days), Wiom (March 2026) and Aadhar
Housing Finance (January 2026). Each strip rolls slowly sideways like film through a gate. Hover holds
a strip; with reduced motion on, the strips don't roll and scroll by hand instead. Each photo carries
its camera frame number.

Source: four BTS folders on Drive, all raw camera-card dumps, about 5,400 files and 245 GB. Only 21
photos are used. They were picked by eye from contact sheets of Drive previews and pulled at 1600px
through Drive's preview endpoint, not the 7–19 MB originals. They are saved as 1200px WebPs in
`iteration-3/img/bts/`, about 1 MB in total. The Wiom stills were shot flat, so they get an
auto-contrast lift. The BTS video clips are left out. They are 100 MB–2 GB camera originals, and the
"CAM-B" Wiom and Marzi clips look like B-camera takes rather than BTS.

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
