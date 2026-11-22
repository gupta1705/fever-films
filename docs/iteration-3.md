# Iteration 3: the whiteboard flow

**Status (2026-11-21):** iteration 3 is the only site and lives at the repo root (`index.html`,
`style.css`, `app.js`, `img/`, `video/`). Iterations 1 and 2 were removed by request. They are still in
git history, before commit "Make iteration 3 the site", and iteration 1 is also tagged `iteration-1`.
`iteration-3/index.html` is only a forwarder: it sends old `/iteration-3/` links, and any `#film` on them,
to the root.

It started from iteration 2's look. That means black and gold, the simple nav, the "Email a brief"
button that never leaves the screen, per-chapter colours and the lightbox.

## Round 5 (2026-11-21)

- Feedback: "the side elements are only in the Spotify ad, not others". That means the drifting side
  cutouts (film stills and gold placeholder rectangles) should be behind **every** brand in Work, not
  removed. A film-grid version was tried and dropped. Work is the colour-changing brand roll: CyberDost →
  Aamir Khan Productions → Marzi → Spotify (its three films playing in place) → CU Online → UltraTech →
  Aadhar → Wiom. Each brand has its own background colour, and the cutouts drift behind all of them, as
  on Contact. On phones there are none: the films run edge to edge, and cut down to slivers at the screen edges they looked broken (round 8 feedback).
- The viewer's prev/next order runs by who is on screen. First come the two CyberDost films with Amitabh
  Bachchan, then Aamir Khan, Suniel Shetty, Spotify and CU. The other two CyberDost films follow with
  the rest of the ads.

## Round 6 (2026-11-21): all directors, new top of the page

- **Directors.** All eight from the team's list, in its order: Deepak Mishra (I4C CyberDost), Vaibhav
  Bundhoo (Aamir Khan Productions), Deepesh Saumitra Jagdish (Aadhar Housing), Parth Manocha (Wiom),
  Akshat Vijaywargya (UltraTech, upGrad), Anand Iyer (Marzi), Raghav Subbu (Spotify) and Deeksha
  Tripathi (Kalamandir, in production).
  - Each row opens with "For Fever:", linking the film they directed.
  - Outside credits and IMDb links appear only where they could be checked. Raghav Subbu's come from
    IMDb (Kota Factory, Hostel Daze, F.A.T.H.E.R.S.). Parth, Anand and Deeksha show their Fever work only.
  - The four without a portrait yet get an initials card.
  - Spellings: the team list wrote "Vaibhav Bandhu", "Akshat Vijayvargiya" and "Raghav Suboo". The site
    keeps the deck/IMDb spellings Bundhoo and Vijaywargya, and uses Subbu, as on IMDb.
- Each Work brand's caption, the Spotify line and the film viewer now say "Directed by …". CU Online
  isn't on the team's list, so it has no credit.
- The "Click a film to watch it" pill is gone.
- **Top of the page, rebuilt.**
  - Nav: one floating glass capsule holding the logo, the sections and the gold "Email a brief" pill. A
    highlight slides to the hovered link and rests on the section you're in. On phones the capsule holds
    the logo and Menu, and the brief button floats at the bottom.
  - Hero: the montage plays on a framed screen inset 10px with rounded corners. Over it sits a "Now
    showing" block with a red live dot, the brand in large type and the film title, which links to the
    film. Beside that are a cut counter (03 / 15) and a round pause button. Along the bottom runs a
    segmented progress bar with one segment per cut.

## Round 7 (2026-11-21): the top of the page, again

- Feedback on round 6's top: "it still looks very bad". Before that, the plain version was "so basic" and
  the serif one "very AI". The rejected tops were built from app parts: a glass capsule, a rounded frame,
  a live dot, a counter, a round pause button and a segmented bar. None of those belong to the sections
  the client likes, and the footage was stretched to full screen at about twice its size.
- **Nav: the logo's thermometer laid flat.** A full-width ruled bar on the chapter's colour. It has a logo
  cell, six equal section cells and a gold "Email a brief" block in the corner. A tube runs along its foot,
  and red mercury in it runs to the end of the section you're in; at the top it fills the logo's cell. On
  the gold About chapter the ink goes dark, the logo keeps a black cell and the brief turns black. Up to
  1100px wide the bar shows the logo, the brief and Menu (the full-screen gold menu is unchanged), and the
  mercury shows how far down the page you are.
- **Hero: the films on a sharp screen beside the client list.** The montage plays in a square 16:9
  frame under the Work–About cells, never wider than its 720p picture holds (about 1100px on a 1080p
  monitor). Under it the client on screen is named in large gold type. The eight clients are listed
  beside it in the agreed order. The client on screen is lit gold, and the page takes that client's Work
  colour. Pointing at a client shows its films; clicking goes to it in Work. The film title and a plain
  "Pause" sit under the list. Everything swaps on the cut: no fades, nothing moves. On phones the frame
  runs edge to edge and the list fills the rest of the screen.
- The montage is regrouped so each client's cuts sit together (CyberDost ×3, Aamir Khan, Marzi, Spotify ×4,
  CU Online ×2, UltraTech, Aadhar, Wiom ×2), and re-encoded at CRF 21 (3.3 MB, was 0.75 Mb/s).
- Work brand screens have ids (`#cyberdost`, `#aamir-khan`, `#marzi`, `#cu-online`, `#ultratech`,
  `#aadhar`, `#wiom`; Spotify keeps `#spotify`).

## Round 8 (2026-11-22): Cinema

- Feedback on round 7's top: "I still dont like it at all. Go again". Several directions were built and
  judged against the client's references (1stdecember.com and Banana in a Suit, both full-bleed). Two were
  shown side by side, and the client picked **Cinema**.
- **Hero.** The reel fills the first screen edge to edge, 1080p on desktop (`video/montage-1080.mp4`) and
  720p on phones. Each cut is graded with a faint wash of its client's Work colour, and its foot sinks into
  that colour. The real logo sits big across the foot of the picture like a film title. Its red mercury
  climbs the tube as the 18 s reel plays; that is the only progress indicator.
- **Framing per cut.** `FACES` in `app.js` holds each cut's face positions, read by eye off its first and
  last frames. On the cut, the picture is framed so no face sits under the logo, and on phones the tall
  crop keeps every face whole or out of frame. Burned-in Spotify logos are cropped off on desktop. The CU
  logo stays in frame, just under the brief/Menu block.
- **Credit.** One line under the logo: client, film, "Directed by …" and Pause, locked to the logo's
  edges. It fades out as the hero leaves, so it never runs into the docked logo.
- **Nav.** The logo docks top-left as you scroll, moved by a CSS scroll-driven animation where the
  browser has one (Chrome, Edge, Safari 26), so it moves in the same frame as the page. Firefox has no
  scroll timelines, so app.js moves it there. Top-right is one block: "Email a brief" in gold, Menu in
  black. Menu opens a full screen with the reel playing behind a dark scrim, the six sections in gold and
  the contact details beside them.
- **Page colour.** The colour per section is one value (`--bg-now`), eased once and read by the page
  and the bar together. So a fast scroll into or out of the gold About never shows a band of the old
  colour over the type. On gold the bar has no hard edge: the type dissolves into the gold under the logo
  and the block.
- `tests/smoke.cjs` checks each of these, including faces clear of the logo on every cut at three desktop
  sizes, the credit never touching the logo while scrolling, and the bar matching the page on every
  frame of a colour change.
- Not checked: real phones, Safari and Firefox (only Chromium was run). The push-ins on the 960x540 stills
  (Amitabh's first cut, Marzi) are still soft at full screen; grain and grade hide most of it.

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

`scripts/make-montage.sh` cuts `video/montage.mp4` (720p, phones) and `video/montage-1080.mp4` (1080p,
wider screens) from the same list, and the poster `img/montage.webp`. Now 15 cuts of 1.2 s each, 18 s,
no sound. When first written it had 16 cuts at 720p only, 1.9 MB. It uses two sources:
- 8 motion clips from the public Drive masters (Spotify x Gullak, CU Online), seeking remotely;
- 8 slow push-ins on stills. These cover the films that only exist on YouTube (CyberDost with Amitabh
  Bachchan, Sitaare Zameen Par, UltraTech, Aadhar, Marzi). They also cover Wiom, because its Drive
  masters stopped answering ranged reads while this was being cut. Every brand is in the edit.

The cut list in `app.js` (`CUTS`) must match the script's order. It drives the "on screen" caption.

Media: film stills are in `img/work/`, portraits in `img/directors/`, BTS photos in `img/bts/`, and the
montage in `video/`. The Spotify films now play from YouTube in the viewer like every other film.

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
