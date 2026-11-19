# Fever Films website: plan

## Brief

Website for **Fever Films**, the advertising arm of TVF. Copy the structure, look and motion of
[whitetigerfilms.in](https://www.whitetigerfilms.in) (studied with the Awwwards MCP), dressed in Fever's
own identity. Must have: **Work, Directors, About Us, Contact Us**. Spotify ads lead the work.

Sources: `references.txt` → work sheet ("Fever Films work | For Website"), logo pack (Drive),
pitch deck "Fever Films Portfolio" (Canva, 18 slides).

## What White Tiger does (Awwwards MCP evidence)

| Area | White Tiger | Fever Films |
|---|---|---|
| Stack | Wix, static pages | Plain HTML/CSS/JS, no build step |
| Header | Logo left, `Home Work About Contact` right, active link grey | Same, plus `Directors` |
| Home | Full-bleed B&W video, yellow (`#fed700`) manifesto line, yellow pill "SEE OUR WORK ›" | Same; reel cut from Fever's own films, brand yellow `#fcc011` |
| Work | "we produced." + tight 4-col thumbnail grid; click → white full-screen lightbox, video left, title + credits right, prev/next | Same lightbox; 3-col grid so the 3 Spotify films fill the first row |
| About | "same stripes, old roars." + round B&W portraits; elements slide up from 100% inside a mask, 1.2 s, on scroll | Directors page uses the same portraits + reveal; About Us is deck content with the same reveal |
| Contact | Map with office pin | Email + socials (no office address in the sources) |
| Footer | "send us a line." in gradient text, email, socials, © | "send us a brief." in the logo's thermometer gradient (yellow → red) |

Design tokens: Helvetica-style grotesk with tight tracking (→ *Inter Tight*), white page, `#404040` text,
brand yellow `#fcc011`, red `#b52024`, ink `#231f20` (all three from the logo SVG).

## Pages

1. `index.html` — hero reel + manifesto + CTA.
2. `work.html` — 18 films, Spotify x Gullak first, then CyberDost x Panchayat (Amitabh Bachchan),
   Sitaare Zameen Par, UltraTech, Aadhar, CU Online, Wiom, Marzi. Lightbox shows client + the
   objective from the deck. URL hash deep-links a film (`work.html#spotify-laddoo`).
3. `directors.html` — Deepak Mishra, Vaibhav Bundhoo, Deepesh Saumitra Jagdish, Akshat Vijaywargya,
   credits + IMDb ratings + IMDb links (deck slide 9).
4. `about.html` — who we are (TVF arm), why brands work with us, capabilities, impact, TVF track record.
5. `contact.html` — brief prompt, email, Instagram, LinkedIn.

## Where each film plays from

Most films are public on YouTube (links found in the deck and on Spotify India's channel) → embedded
with `youtube-nocookie`. Three Wiom films exist only on Drive (public) → Drive preview embed. Marzi
is only public as an Instagram reel → Instagram embed. Thumbnails are YouTube's auto-captured frames
or frames cut from the Drive masters, saved locally as WebP.

## Assets made

- `assets/video/reel.mp4` — 16 s, 1280×720, B&W, no audio, cut remotely from the public Drive masters
  with ffmpeg (Spotify x Gullak, Wiom, CU Online). `assets/video/reel-poster.webp` first frame.
- `assets/img/work/*.webp` — 960×540 thumbnails.
- `assets/img/directors/*.webp` — square portraits cropped from the deck photos.
- `assets/img/logo.svg`, `favicon.svg` — from the Drive logo pack (viewBox trimmed).

## Gaps (need the team)

- Marzi "Usha" and "Professor", UltraTech, Aadhar and one Wiom file are private on Drive; the site
  uses their public YouTube/Instagram versions. Marzi has only one public film.
- No office address, so no map on Contact.
- Vaibhav Bundhoo's and Deepesh's deck photos are small (≤600 px); swap in high-res headshots.
- Per-film credits (director, DOP…) aren't in the sources, so the lightbox shows client + objective only.

## Check

`tests/smoke.cjs` (Playwright): every page loads without console errors, nav links resolve,
18 tiles render, a tile opens the lightbox with the right embed, arrows move, Esc closes and stops
the video. Then Awwwards `verify_build` against whitetigerfilms.in and a visual pass at 1440 and 390.

Result (2026-11-19): smoke passes. Awwwards motion fingerprint 100/100 vs White Tiger; band score 0
only because Wix renders White Tiger as one anonymous `body` block. Mobile audit: no overflow, no
small text, no small tap targets. Deliberate deviations: hero fits the viewport (White Tiger's runs
past the fold), 3-column grid (so Spotify owns row one), Marzi opens Instagram (embeds blocked).

## Run and ship

```
python -m http.server 8765          # then open http://localhost:8765
NODE_PATH="$(npm root -g)" node tests/smoke.cjs
```

Plain static files: upload the folder to any static host (Netlify, Vercel, GitHub Pages, S3).
`scripts/make-reel.sh <out-dir>` rebuilds the hero reel (edit the clip list to change shots).
