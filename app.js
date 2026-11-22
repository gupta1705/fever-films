// Fever Films: logo opening, film montage, then work, directors, behind the scenes and IP. No framework; Lenis smooths the scroll.
const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
const $ = (s, el = document) => el.querySelector(s);
const $$ = (s, el = document) => [...el.querySelectorAll(s)];
const clamp = (v, a = 0, b = 1) => Math.min(b, Math.max(a, v));

// ---------- films: one source for the lightbox and the drifting field ----------
const yt = (id) => ({ href: `https://www.youtube.com/watch?v=${id}`, embed: `https://www.youtube-nocookie.com/embed/${id}?autoplay=1&rel=0&playsinline=1`, platform: 'YouTube' });
const drive = (id) => ({ href: `https://drive.google.com/file/d/${id}/view`, embed: `https://drive.google.com/file/d/${id}/preview`, platform: 'Google Drive' });
const BRIEF = {
  spotify: 'Diwali prep with the Mishra family from Gullak. Every chore turns into a party the moment the music comes on: Diwali ki taiyaari fun banao, Spotify chalao.',
  cyberdost: 'Raise awareness of the growing threat of cybercrime and show people how to recognise, avoid and report online fraud, with Amitabh Bachchan and the cast of Panchayat.',
  sitaare: "Get people talking about the film's YouTube release with a funny, star-led story built for maximum reach and engagement.",
  ultratech: "Position UltraTech as the brand that understands the sacrifices people make for a better future. Building a home is more than construction: it's a lifelong dream and a family's legacy.",
  aadhar: 'Position Aadhar Housing Finance as the easiest, most trusted way to get a home loan, so owning a home feels simple and within reach.',
  cu: 'Build awareness and consideration for CU Online as a credible way for young working professionals to upskill and move their careers forward.',
  wiom: 'Stories of struggle and aspiration that show Recharge Waala Ghar Ka Net as smart, hassle-free home internet you recharge on your own terms.',
};
const CYBER = 'CyberDost, I4C, Ministry of Home Affairs';
// who directed each brand's films, from the team's list (CU Online: not on it yet)
const DIRECTED_BY = { cyberdost: 'Deepak Mishra', sitaare: 'Vaibhav Bundhoo', aadhar: 'Deepesh Saumitra Jagdish', wiom: 'Parth Manocha',
  ultratech: 'Akshat Vijaywargya', marzi: 'Anand Iyer', spotify: 'Raghav Subbu' };
const FILMS = {
  'cyberdost-phulera': { client: CYBER, title: 'Phulera Mein Cyber Crime ft. Amitabh Bachchan', brief: BRIEF.cyberdost, ...yt('r0bzNean0go') },
  'cyberdost-phulera-2': { client: CYBER, title: 'Phulera Mein Cyber Crime, Part 2', brief: BRIEF.cyberdost, ...yt('rZuU2rsYM5M') },
  'sitaare-zameen-par': { client: 'Aamir Khan Productions', title: 'Sitaare Zameen Par on YouTube: Baap-Bete Ki Nayi Scheme', brief: BRIEF.sitaare, ...yt('GBaRZN8YpH8') },
  // Marzi's account blocks Instagram embeds, so it opens on Instagram instead of the lightbox
  'marzi-find-your-kind': { client: 'Marzi', title: 'Find your kind ft. Suniel Shetty', href: 'https://www.instagram.com/reel/Debz-18x0q4/' },
  'spotify-laddoo': { client: 'Spotify x Gullak', title: 'Laddoo banana fun banao', brief: BRIEF.spotify, ...yt('Ll9335RK9R0') },
  'spotify-lights': { client: 'Spotify x Gullak', title: 'Lights lagana fun banao', brief: BRIEF.spotify, ...yt('LxK1G7hnbZE') },
  'spotify-rangoli': { client: 'Spotify x Gullak', title: 'Rangoli banana fun banao', brief: BRIEF.spotify, ...yt('LdShwDXhHEY') },
  'cu-online-banrakas': { client: 'Chandigarh University Online', title: 'Banrakas Ka Heist ft. Vikas & Bhushan', brief: BRIEF.cu, ...yt('zCt4tXB0suY') },
  'cyberdost-scam-calls': { client: CYBER, title: 'Aise calls aapko bhi aa rahe hain?', brief: BRIEF.cyberdost, ...yt('7wTnUXZS5Eg') },
  'cyberdost-panchayat': { client: CYBER, title: 'Amitabh Bachchan and the Panchayat team', brief: BRIEF.cyberdost, ...yt('AOBFfhWHu4o') },
  'ultratech-ek-ghar': { client: 'UltraTech Cement', title: 'Ek Ghar Banaunga', brief: BRIEF.ultratech, ...yt('gmoEBbsfT30') },
  'aadhar-ghar-le-lo': { client: 'Aadhar Housing Finance', title: 'Ghar Le Lo: Sawaal Nahi, Saath Pao', brief: BRIEF.aadhar, ...yt('5IEB6-KknoI') },
  'aadhar-daga-seth': { client: 'Aadhar Housing Finance', title: 'Ghar Le Lo: Daga Seth Ka Challenge', brief: BRIEF.aadhar, ...yt('cd1QVHG54hs') },
  'wiom-ek-kahani': { client: 'Wiom', title: 'Ek Kahani', brief: BRIEF.wiom, ...yt('h2tKQ756nMs') },
  'wiom-recharge': { client: 'Wiom', title: 'Recharge Waala Ghar Ka Net', brief: BRIEF.wiom, ...yt('J-zpxYp87gU') },
  'wiom-newly-wed': { client: 'Wiom', title: 'Newly Wed', brief: BRIEF.wiom, ...drive('1zf1lv6_4J2HLRiSjgAY6XWjn7hT7jcsL') },
  'wiom-preeti-guddu': { client: 'Wiom', title: 'Preeti & Guddu', brief: BRIEF.wiom, ...drive('1lx2TFdIUFplOWQJP9y_XbMSNTu5r7Rps') },
  'wiom-two-kids': { client: 'Wiom', title: 'Two Kids', brief: BRIEF.wiom, ...drive('13i2K9l_GGiNd0cqgOdKI8uhV56eY3rS-') },
};

// ---------- lightbox ----------
const box = $('.lightbox');
const order = Object.keys(FILMS).filter((k) => FILMS[k].embed);
const media = $('.lb__media');
const field = (name) => $(`[data-field="${name}"]`, box);
let current = -1, opener = null;

function show(slug) {
  current = order.indexOf(slug);
  const f = FILMS[slug];
  const frame = Object.assign(document.createElement('iframe'), { src: f.embed, title: f.title });
  frame.allow = 'autoplay; encrypted-media; fullscreen; picture-in-picture';
  media.replaceChildren(frame);
  field('client').textContent = f.client;
  field('title').textContent = f.title;
  field('desc').textContent = f.brief;
  const by = DIRECTED_BY[slug.split('-')[0]];
  field('director').textContent = by ? ` · Directed by ${by}` : '';
  field('link').href = f.href;
  field('link').textContent = `Watch on ${f.platform}`;
  history.replaceState(null, '', `#${slug}`);
}
const step = (d) => show(order[(current + d + order.length) % order.length]);

document.addEventListener('click', (e) => {
  const a = e.target.closest('[data-film]');
  if (!a || e.metaKey || e.ctrlKey || e.shiftKey || !FILMS[a.dataset.film]?.embed) return;
  e.preventDefault();
  opener = a;
  show(a.dataset.film);
  if (!box.open) box.showModal();
});
$('.lb__prev, .lb__nav--prev').addEventListener('click', () => step(-1));
$('.lb__nav--next').addEventListener('click', () => step(1));
$('.lb__close').addEventListener('click', () => box.close());
box.addEventListener('keydown', (e) => { if (e.key === 'ArrowLeft') step(-1); if (e.key === 'ArrowRight') step(1); });
box.addEventListener('close', () => {
  media.replaceChildren(); // removing the iframe stops playback
  history.replaceState(null, '', location.pathname);
  opener?.focus({ preventScroll: true });
});

// ---------- the drifting field: stills, director portraits and grey placeholders at three depths ----------
let seed = 11;
const rnd = () => (seed = (seed * 16807) % 2147483647) / 2147483647; // deterministic so the layout never jumps
const fieldEl = $('.field');
const pool = [
  ...Object.keys(FILMS).map((k) => ({ src: `img/work/${k}.webp`, film: k })),
  ...['deepak-mishra', 'vaibhav-bundhoo', 'deepesh-saumitra-jagdish', 'akshat-vijaywargya'].map((k) => ({ src: `img/directors/${k}.webp`, portrait: true })),
  ...Array.from({ length: 10 }, () => null),
];
for (let i = pool.length - 1; i > 0; i--) { const j = Math.floor(rnd() * (i + 1)); [pool[i], pool[j]] = [pool[j], pool[i]]; }
const items = pool.map((p, i) => {
  const d = 0.25 + rnd() * 0.75; // depth: far items are smaller and slower
  // stills keep to the edges so the centred text and the pinned film stay clear; on phones they hang half off-screen
  const left = rnd() < 0.5, phone = innerWidth < 760;
  const x = phone ? (left ? -8 + rnd() * 8 : 92 + rnd() * 6) : left ? -3 + rnd() * 17 : 74 + rnd() * 20;
  const w = (p?.portrait ? 6.5 : p ? 11 : 6 + rnd() * 6) * (0.55 + d * 0.65);
  const ratio = p?.portrait ? 1 : p ? 9 / 16 : [1, 0.75, 1.3][Math.floor(rnd() * 3)];
  const link = p && !phone; // on phones the stills are too small to tap, so they stay pictures
  const el = document.createElement(link ? 'a' : 'span');
  el.className = `field__item${p?.portrait ? ' is-portrait' : ''}`;
  el.style.cssText = `left:${x}vw;width:${w}vw;height:${w * ratio}vw`;
  if (p) el.append(Object.assign(new Image(), { src: p.src, alt: '', decoding: 'async' }));
  if (link) {
    el.tabIndex = -1; // decorative duplicate of links that live in the page
    if (p.film) {
      el.href = FILMS[p.film].href;
      el.dataset.film = p.film;
      if (!FILMS[p.film].embed) { el.target = '_blank'; el.rel = 'noopener'; }
    } else el.href = '#directors';
  }
  fieldEl.append(el);
  return { el, d, y: i / pool.length + rnd() * 0.04 };
});

// ---------- behind the scenes: each strip rolls on a loop; a cloned set hides the seam (reduced motion: scroll by hand) ----------
if (!reduce) $$('.bts__track').forEach((track) => {
  const photos = [...track.children];
  photos.forEach((li) => { const copy = li.cloneNode(true); copy.setAttribute('aria-hidden', 'true'); track.append(copy); });
  track.style.setProperty('--dur', `${photos.length * 7}s`);
});

// ---------- directors roster: on a mouse, the hovered director's portrait follows the pointer ----------
const roster = $('.roster');
roster.addEventListener('pointermove', (e) => {
  roster.style.setProperty('--x', `${e.clientX}px`);
  roster.style.setProperty('--y', `${e.clientY}px`);
});

// ---------- Spotify screening: plays while on screen, muted until asked; each film rolls into the next ----------
const video = $('.screen__video');
if (video) {
  const reel = ['laddoo', 'lights', 'rangoli'], sound = $('.screen__sound'), bar = $('.screen__progress');
  let n = 0;
  video.addEventListener('ended', () => {
    n = (n + 1) % reel.length;
    Object.assign(video, { src: `video/spotify-${reel[n]}.mp4`, poster: `img/spotify-${reel[n]}-1280.webp` });
    video.setAttribute('aria-label', `${FILMS[`spotify-${reel[n]}`].title}, Spotify x Gullak`);
    video.play().catch(() => {});
  });
  video.addEventListener('timeupdate', () => { bar.style.transform = `scaleX(${video.currentTime / video.duration || 0})`; });
  video.addEventListener('click', () => (video.paused ? video.play() : video.pause()));
  sound.addEventListener('click', () => {
    video.muted = !video.muted;
    sound.setAttribute('aria-pressed', String(!video.muted));
    sound.textContent = video.muted ? 'Sound on' : 'Sound off';
    video.play().catch(() => {});
  });
  // reduced-motion visitors start it themselves by clicking the film or the sound button
  new IntersectionObserver(([e]) => {
    if (!e.isIntersecting) video.pause();
    else if (!reduce) video.play().catch(() => {});
  }, { threshold: 0.4 }).observe(video);
}

// ---------- menu: the section on screen is marked by the logo's thermometer; the logo docks top-left as the hero scrolls away ----------
const navLinks = $$('.nav > a'), mark = $('.mark'), chrome = $('.chrome'), heroSection = $('#top'), heroScreen = $('.hero__screen');
const rise = $('.mk-rise'); // the logo's mercury above its resting level
let navOn = null;
let heroH = 1, barH = 0, boxW = 16, boxH = 9, band = false, pageH = 1, lead = 0;
const timeline = CSS.supports('animation-timeline: scroll()'); // then the compositor docks the logo and fades the credit (style.css)
const credit = $$('.hero__film, .hero__pause');
let fades = [];
const fadeCredit = () => { // the scroll y at which each part of the credit starts to dissolve: its top 64px under the bar (style.css)
  fades = credit.map((el) => el.getBoundingClientRect().top + scrollY - barH - 64);
  if (timeline) credit.forEach((el, i) => { el.style.animationRange = `${fades[i]}px ${fades[i] + 480}px`; });
};
const measure = () => {
  heroH = heroSection.offsetHeight; barH = chrome.offsetHeight; boxW = heroScreen.clientWidth; boxH = Math.max(1, heroScreen.clientHeight);
  band = heroScreen.offsetTop >= barH; // the phone's layout: the film starts below the chrome, on the client's colour
  pageH = Math.max(1, document.documentElement.scrollHeight - innerHeight);
  // the docked logo's box, and the transform that carries it to the foot of the hero (style.css); travel: how far its foot goes
  const cs = getComputedStyle(document.documentElement), px = (p) => parseFloat(cs.getPropertyValue(p));
  const bw = px('--big-w'), dw = px('--dock-w'), top = (barH - dw * 100 / 504) / 2, travel = px('--big-bottom') - top - dw * 100 / 504;
  mark.style.setProperty('--dx', `${(document.documentElement.clientWidth - bw) / 2 - px('--gut')}px`);
  mark.style.setProperty('--dy', `${travel - (bw - dw) * 100 / 504}px`);
  mark.style.setProperty('--k', bw / dw);
  // a phone's credit sits just under the logo, so there the logo's foot leaves with the first pixel of scroll, 1.25x as fast as the
  // page. dock()'s curve, given to the scroll timeline as its easing (the same cubic)
  lead = band ? Math.min(1, 1.25 * innerHeight * 0.55 / travel) : 0;
  Object.assign(mark.style, { animationRange: `0px ${innerHeight * 1.1}px`, animationTimingFunction: `cubic-bezier(${1 / 3}, ${lead / 3}, ${2 / 3}, 1)` }); // docked half way
  fadeCredit();
};

// ---------- mood: whatever sits at mid-screen sets the background, the field, the logo tone and the active link ----------
const moodEls = $$('main [data-bg], main [data-field]'); // main only: the viewer's [data-field] slots aren't sections
let lastBg = '', lastNav;
function mood(vh) {
  let bg = '#0b0a08', on = false, light = false, nav = null;
  for (const el of moodEls) {
    const r = el.getBoundingClientRect();
    if (r.top > vh / 2 || r.bottom < vh / 2) continue;
    on = el.hasAttribute('data-field');
    bg = el.dataset.bg || '#0b0a08';
    light = el.dataset.tone === 'light';
    nav = el.closest('[data-nav]')?.dataset.nav || null;
  }
  if (bg !== lastBg) {
    lastBg = bg;
    document.documentElement.style.setProperty('--bg-now', bg); // style.css eases the page and the bar to it together
  }
  document.body.classList.toggle('field-on', on);
  document.body.classList.toggle('tone-light', light);
  if (nav !== lastNav) {
    lastNav = nav;
    navOn = navLinks.find((a) => a.hash === `#${nav}`) || null;
    navLinks.forEach((a) => { a.classList.toggle('is-on', a === navOn); a.toggleAttribute('aria-current', a === navOn); });
  }
  return on;
}

// ---------- reveal brand blocks as they arrive ----------
const io = new IntersectionObserver((es) => es.forEach((e) => { if (e.isIntersecting) { e.target.classList.add('is-in'); io.unobserve(e.target); } }), { rootMargin: '0px 0px -12% 0px' });
$$('.brand, .ip-row').forEach((b) => io.observe(b));

// ---------- smooth scroll, the menu, anchors ----------
const lenis = !reduce && window.Lenis ? new window.Lenis({ lerp: 0.085 }) : null;
const navEl = $('#nav'), toggle = $('.nav-toggle'), navReel = $('.nav__reel');
function openMenu(open) {
  if (open === navEl.classList.contains('is-open')) return;
  glide = true; // the logo eases to the dock and back, from where the scroll timeline has it
  mark.style.setProperty('--s', bigNow.toFixed(4)); mark.classList.add('is-gliding');
  navEl.classList.toggle('is-open', open);
  document.body.classList.toggle('menu-open', open);
  toggle.setAttribute('aria-expanded', String(open));
  toggle.textContent = open ? 'Close' : 'Menu';
  $('main').inert = open; // the menu covers the page, so keyboard focus stays in it
  if (lenis) open ? lenis.stop() : lenis.start();
  // the reel runs on behind the menu, from the moment on screen (paused if the visitor paused it, or with reduced motion)
  if (open) { navReel.currentTime = hero.currentTime; if (!heroHeld) navReel.play().catch(() => {}); } else navReel.pause();
  if (open) navLinks[0].focus({ preventScroll: true });
}
toggle.addEventListener('click', () => openMenu(!navEl.classList.contains('is-open')));

document.addEventListener('keydown', (e) => { if (e.key === 'Escape') openMenu(false); });
document.addEventListener('click', (e) => {
  const a = e.target.closest('a[href^="#"]');
  if (!a || a.dataset.film || a.classList.contains('skip')) return;
  const target = $(a.getAttribute('href'));
  if (!target) return;
  e.preventDefault();
  openMenu(false);
  if (lenis) lenis.scrollTo(target, { duration: 1.8 });
  else target.scrollIntoView({ behavior: reduce ? 'auto' : 'smooth' });
});

// ---------- one loop ----------
let mx = 0, tmx = 0;
addEventListener('pointermove', (e) => { tmx = e.clientX / innerWidth - 0.5; }, { passive: true });
addEventListener('resize', measure);
new ResizeObserver(() => measure()).observe(document.documentElement); // the page's height (fonts, images) and the scrollbar coming and going (the opening, the menu)
measure();

// the logo: big over the hero, docked top-left by the time half the hero has gone (and whenever the menu is open)
// On scroll it follows the page exactly (easing it let the credit slide into it); it eases only when the menu opens or closes
let bigNow = null, glide = false;
const smooth = (u) => u * u * (3 - 2 * u);
function dock(y, vh) {
  const open = navEl.classList.contains('is-open'), u = clamp(y / (vh * 0.55)), big = open ? 0 : 1 - smooth(u) - lead * u * (1 - u) ** 2; // lead: starts at that speed
  if (!glide || reduce || bigNow === null || Math.abs(big - bigNow) < 0.001) { bigNow = big; glide = false; } else bigNow += (big - bigNow) * 0.3;
  if (glide || open || !timeline) mark.style.setProperty('--s', bigNow.toFixed(4));
  mark.classList.toggle('is-gliding', glide);
  // the credit dissolves before it reaches the chrome, so it never runs under the docked logo or the block (style.css, on the compositor)
  if (!timeline) credit.forEach((el, i) => { el.style.opacity = clamp(1 - (y - fades[i]) / 48).toFixed(3); });
  credit.forEach((el, i) => el.classList.toggle('is-gone', y > fades[i] + 48)); // once dissolved: no taps or focus on words nobody can see
  document.body.classList.toggle('past-hero', y > heroH - barH);
  if (y < heroH && !band) heroScreen.style.transform = `translate3d(0, ${(y * (reduce ? 0 : 0.35)).toFixed(1)}px, 0)`; // the full-bleed picture lags a little as it leaves
  // the fever: on the hero the mercury climbs with the 18 s reel (Fever's own progress, no other progress chrome); docked, with the page
  const reel = hero.duration ? hero.currentTime / hero.duration : 0;
  rise.setAttribute('width', ((bigNow * reel + (1 - bigNow) * clamp(y / pageH)) * 77.6).toFixed(2)); // 77.6: to the top of the tube
}

function frame(t) {
  lenis?.raf(t);
  const y = scrollY, vh = innerHeight;
  const fieldOn = mood(vh);
  dock(y, vh);
  if (!frameClock) heroTick(hero.currentTime);
  if (fieldOn) {
    mx += (tmx - mx) * 0.06;
    const loop = vh * 2.6;
    for (const it of items) {
      let py = (it.y * loop - y * (reduce ? 0 : 0.3 + it.d * 0.85)) % loop;
      if (py < 0) py += loop;
      it.el.style.transform = `translate3d(${(mx * it.d * 46).toFixed(1)}px, ${(py - vh * 0.35).toFixed(1)}px, 0)`;
    }
  }
  requestAnimationFrame(frame);
}
requestAnimationFrame(frame);

// ---------- hero: the montage loops while on screen; the credit names the client and the film on screen and opens it ----------
const hero = $('.hero__video'), heroFill = $('.hero__fill'), heroFilm = $('.hero__film'), pauseBtn = $('.hero__pause');
const opening = $('.opening');
// [start second, film] for each 1.2 s cut in video/montage.mp4, same order as scripts/make-montage.sh; each client's cuts sit together
const CUTS = [
  'cyberdost-phulera', 'cyberdost-phulera-2', 'cyberdost-scam-calls', 'sitaare-zameen-par', 'marzi-find-your-kind', 'spotify-lights',
  'spotify-laddoo', 'spotify-rangoli', 'spotify-lights', 'cu-online-banrakas', 'cu-online-banrakas', 'ultratech-ek-ghar',
  'aadhar-daga-seth', 'wiom-two-kids', 'wiom-preeti-guddu',
].map((film, i) => [i * 1.2, film]);
// the faces in each cut, read off its frames from first to last (shares of the frame; several cuts hold two shots):
// [a, lo, hi, b, top, bottom]. A tall screen (a phone) shows a slice of the width: it holds lo..hi (the faces it keeps) and stays
// inside a..b (where the next face begins), so every face is in it whole or not at all. top: the frame may be cropped down to here
// (hair, never a forehead); bottom: the lowest face, which must clear the logo across the foot
const FACES = [
  [0, 0.44, 0.7, 1, 0.1, 0.68], [0, 0.31, 0.48, 0.76, 0.06, 0.39], [0, 0.32, 0.48, 0.81, 0.08, 0.39], [0, 0.29, 0.43, 0.485, 0.13, 0.5],
  [0, 0.31, 0.68, 0.76, 0.09, 0.96], [0.14, 0.31, 0.62, 0.65, 0.09, 0.45], [0, 0.36, 0.58, 1, 0.24, 0.42], [0, 0.4, 0.69, 1, 0.12, 0.72],
  [0.25, 0.4, 0.69, 0.9, 0.05, 0.45], [0, 0.25, 0.54, 0.61, 0, 0.4], [0, 0.23, 0.54, 0.72, 0, 0.42], [0, 0.46, 0.63, 1, 0, 0.43],
  [0, 0.33, 0.6, 1, 0.14, 0.6], [0, 0.28, 0.5, 0.77, 0.09, 0.48], [0, 0.38, 0.58, 1, 0, 0.47],
];
// burned-in logos in the top-right corner, where the brief and Menu sit: [left, top, right, bottom] as shares of the frame
const SPOTIFY = [0.83, 0.07, 0.955, 0.13], CU = [0.82, 0.1, 0.975, 0.165];
const LOGO = { 5: SPOTIFY, 6: SPOTIFY, 7: SPOTIFY, 8: SPOTIFY, 9: CU, 10: CU };
const brandOf = (slug) => slug.split('-')[0];
const CLIENT = { cyberdost: 'CyberDost', sitaare: 'Aamir Khan Productions', marzi: 'Marzi', spotify: 'Spotify', cu: 'CU Online',
  ultratech: 'UltraTech', aadhar: 'Aadhar', wiom: 'Wiom' }; // the names Work uses
const WORK = { cyberdost: 'cyberdost', sitaare: 'aamir-khan', marzi: 'marzi', spotify: 'spotify', cu: 'cu-online',
  ultratech: 'ultratech', aadhar: 'aadhar', wiom: 'wiom' }; // each client's Work screen, whose colour grades the hero
let heroHeld = reduce; // reduced motion: the montage waits for Play
const heroPlay = () => { if (!heroHeld && !opening.isConnected) hero.play().catch(() => {}); };
function holdHero(held) {
  heroHeld = held;
  pauseBtn.textContent = held ? 'Play' : 'Pause';
  pauseBtn.setAttribute('aria-label', held ? 'Play the showreel' : 'Pause the showreel');
  held ? hero.pause() : heroPlay();
}
holdHero(heroHeld);
pauseBtn.addEventListener('click', () => holdHero(!heroHeld));
let cutNow = -1;
function heroTick(t) {
  const i = Math.max(0, CUTS.findLastIndex(([at]) => t + 0.015 >= at)); // a hair early, so float error never lags a cut by a frame
  if (i !== cutNow) showCut(i);
}
function showCut(i) { // swaps on the cut itself: no fades, nothing moves
  cutNow = i;
  const slug = CUTS[i][1], f = FILMS[slug];
  Object.assign(heroFilm, { href: f.href, target: f.embed ? '' : '_blank' }); // Marzi opens on Instagram
  heroFilm.dataset.film = slug;
  const brand = brandOf(slug), by = DIRECTED_BY[brand], bg = $(`#${WORK[brand]}`).dataset.bg;
  $('.hero__brand').textContent = CLIENT[brand];
  $('.hero__title').textContent = f.title;
  $('.hero__by').textContent = by ? `Directed by ${by}` : ''; // CU Online's director isn't on the team's list yet
  fadeCredit(); // its top moves with its number of lines
  heroSection.style.setProperty('--tint', bg); // the grade, in the client's Work colour, changing on the cut...
  heroSection.dataset.bg = band ? bg : '#0b0a08'; // ...and on a phone the page colour around the film (mood() eases it in)
  heroFill.style.backgroundImage = `url(img/work/${slug}.webp)`; // already loaded by the drifting field
  frameCut(i);
}
// framing per cut, set on the cut and never animated. A tall screen shows a slice of the width (FACES' a, lo, hi, b); a wide one crops the
// top and bottom, a little more from the bottom so heads stay in, and further when a face would run under the logo, never past FACES' top.
// Spotify's logo, burned into the top-right corner under the brief and Menu, is cropped off the top whole (zooming in from the bottom-right
// corner when there is no height to spare). CU Online's two men have their heads at the very top of the frame, so their logo stays in, below
// the block. A face too tall to clear the logo at full bleed (Marzi's close-up) gets a smaller frame that fits it between the top and the
// logo, against the right edge (the badge stays whole), its open sides fading into a blurred copy of the same still.
const logoLine = () => { // the logo's x-height over the film, in the screen's own px
  const cs = getComputedStyle(document.documentElement), w = parseFloat(cs.getPropertyValue('--big-w'));
  return parseFloat(cs.getPropertyValue('--big-bottom')) - w * 76 / 504 - heroScreen.offsetTop;
};
function frameCut(i, el = hero) {
  const W = boxW, H = boxH, Hd = Math.max(H, W * 9 / 16), Wd = Hd * 16 / 9, v = Math.min(1, W / Wd), spare = Hd - H, logo = LOGO[i];
  const [a, lo, hi, b, top, bottom] = FACES[i], line = logoLine() - 12;
  let l = (lo + hi - v) / 2;
  if (b - a >= v) l = clamp(l, a, b - v);
  l = clamp(l, 0, 1 - v);
  if (logo && l + v > logo[0] && l + v < logo[2]) l = 1 - v; // never half a logo at the slice's edge
  const px = v > 0.98 ? 0.5 : l / (1 - v), keep = spare ? top * Hd / spare : 0;
  const need = spare ? (bottom * Hd - line) / spare : bottom * Hd > line ? 2 : 0;
  let py = clamp(Math.max(Math.min(0.28, keep), need)), z = 1;
  const crop = logo === SPOTIFY && l + v > logo[0];
  if (crop) {
    const hide = logo[3] * Hd + 6;
    if (hide <= spare) py = Math.max(py, hide / spare); else { py = 1; z = H / (Hd - hide); }
  }
  // the Spotify crop lifts the picture too (a push-in from the foot), so it may already clear the logo; a smaller frame would show half
  // the Spotify logo at its top edge, so it is only for faces that still run under the logo
  const low = H - (H - bottom * Hd + py * spare) * z;
  const inset = crop ? low > line : need > Math.min(keep, 1);
  // the reel behind the menu (the same box on desktop) takes the plain framing: its logos stay off, and Marzi sits centred under the scrim
  if (el !== hero) return Object.assign(el.style, inset ? { objectPosition: '', transform: '' } : { objectPosition: `${(px * 100).toFixed(1)}% ${(py * 100).toFixed(1)}%`,
    transformOrigin: '100% 100%', transform: z > 1 ? `scale(${z.toFixed(4)})` : '' });
  heroScreen.classList.toggle('is-inset', inset);
  if (inset) {
    const h = Math.min(Hd, (line - 8) / (bottom - top), (W - 16) / ((hi - lo) * 16 / 9)), w = h * 16 / 9;
    const x = w >= W ? clamp(W / 2 - (lo + hi) / 2 * w, W - w, 0) : W - w, y = Math.min(0, 8 - top * h);
    heroScreen.style.setProperty('--fade-l', x > 0 ? '16%' : '0%'); // only the edges that fall inside the screen fade out
    heroScreen.style.setProperty('--fade-b', y + h < H ? '22%' : '0%');
    return Object.assign(hero.style, { objectFit: 'fill', objectPosition: '', transformOrigin: '0 0',
      transform: `translate(${x.toFixed(1)}px, ${y.toFixed(1)}px) scale(${(w / W).toFixed(4)}, ${(h / H).toFixed(4)})` });
  }
  Object.assign(hero.style, { objectFit: '', objectPosition: `${(px * 100).toFixed(1)}% ${(py * 100).toFixed(1)}%`,
    transformOrigin: '100% 100%', transform: z > 1 ? `scale(${z.toFixed(4)})` : '' });
}
// the frame clock reframes and recaptions on the exact frame of each cut; browsers without it use the page's loop
const frameClock = 'requestVideoFrameCallback' in hero;
if (frameClock) { const onFrame = (now, m) => { heroTick(m.mediaTime); hero.requestVideoFrameCallback(onFrame); }; hero.requestVideoFrameCallback(onFrame); }
hero.addEventListener('seeked', () => heroTick(hero.currentTime));
// the reel behind the menu runs on its own clock (the hero may be off screen and paused), framed on each of its cuts
let reelCut = -1;
const reelTick = (t) => {
  const j = Math.max(0, CUTS.findLastIndex(([at]) => t + 0.015 >= at));
  if (j === reelCut) return;
  reelCut = j;
  band ? Object.assign(navReel.style, { objectPosition: '', transform: '' }) : frameCut(j, navReel); // a phone's reel stays centred
};
if (frameClock) { const onReel = (now, m) => { reelTick(m.mediaTime); navReel.requestVideoFrameCallback(onReel); }; navReel.requestVideoFrameCallback(onReel); }
else navReel.addEventListener('timeupdate', () => reelTick(navReel.currentTime));
navReel.addEventListener('seeked', () => { reelCut = -1; reelTick(navReel.currentTime); });
heroTick(0);
addEventListener('resize', () => { const i = cutNow; cutNow = -1; showCut(Math.max(0, i)); reelCut = -1; reelTick(navReel.currentTime); });
new IntersectionObserver(([e]) => (e.isIntersecting ? heroPlay() : hero.pause())).observe(hero);

// ---------- opening: "How is your fever?" on black; the mercury climbs to 103°F, drops into the logo, and the logo grows into its place
// in the middle of the hero (the .mark, measured here before it can move) while the black lifts off the montage ----------
let openRaf = 0;
function endOpening() {
  if (!opening.isConnected) return;
  cancelAnimationFrame(openRaf);
  opening.remove();
  document.documentElement.classList.remove('is-opening');
  removeEventListener('keydown', endOpening);
  lenis?.start();
  heroPlay();
}
function playOpening() {
  history.scrollRestoration = 'manual';
  scrollTo(0, 0);
  // where the logo lands, measured before the opening hides the scrollbar, so it matches the page the opening hands back to
  const mark = $('.mark__on-dark').getBoundingClientRect();
  document.documentElement.classList.add('is-opening');
  lenis?.stop();
  opening.addEventListener('click', endOpening);
  addEventListener('keydown', endOpening);
  const [line, temp, logo, q] = ['.opening__line', '.opening__temp', '.opening__logo', '.opening__q'].map((s) => $(s, opening));
  const [word, films, tube, merc] = ['.lg-word', '.lg-films', '.lg-tube', '.lg-merc'].map((s) => $(s, logo));
  // logo units to px: the viewBox is 504 x 100 from (83, 120); its mercury bar runs x 101.8-139.6, y 178.1-182
  const vw = innerWidth, mid = innerHeight / 2;
  const W = Math.min(vw * 0.8, 660), k = W / 504, L = (vw - W) / 2, T = mid - 60 * k; // mercury sits on the midline
  logo.setAttribute('width', W);
  logo.setAttribute('height', 100 * k);
  logo.style.transform = `translate(${L}px, ${T}px)`;
  q.style.top = `${mid + 44 * k + 26}px`;
  const bar = { x: L + 18.8 * k, y: T + 58.1 * k, w: 37.8 * k, h: 3.9 * k };
  const tw = temp.offsetWidth;
  const ease = (u) => (u < 0.5 ? 4 * u ** 3 : 1 - (-2 * u + 2) ** 3 / 2), out = (u) => 1 - (1 - u) ** 2, lerp = (a, b, u) => a + (b - a) * u;
  temp.style.opacity = 1;
  let t0;
  const tick = (now) => {
    t0 ??= now;
    const t = now - t0;
    if (t < 1700) { // the line climbs across the screen, the readout riding its tip
      const p = ease(clamp((t - 250) / 1450));
      line.style.transform = `translate(0, ${mid - 3}px) scaleX(${p})`;
      temp.textContent = `${(98.6 + 4.4 * p).toFixed(1)}°F`;
      temp.style.transform = `translate(${clamp(p * vw - tw - 12, 16, vw - tw - 16)}px, ${mid - 34}px)`;
    } else { // ...then drops into the logo's mercury
      const u = ease(clamp((t - 1700) / 320));
      line.style.transform = `translate(${lerp(0, bar.x, u)}px, ${lerp(mid - 3, bar.y, u)}px) scale(${lerp(1, bar.w / vw, u)}, ${lerp(1, bar.h / 6, u)})`;
      temp.style.opacity = 1 - clamp((t - 1700) / 200);
      if (t >= 2020) { line.style.opacity = 0; tube.style.opacity = merc.style.opacity = 1; }
    }
    if (t >= 2020) { // FEVER lands, FILMS follows
      const w = clamp((t - 2020) / 380);
      word.style.opacity = clamp(w * 3);
      word.style.transform = `scale(${w < 0.6 ? lerp(1.08, 0.98, out(w / 0.6)) : lerp(0.98, 1, (w - 0.6) / 0.4)})`;
    }
    if (t >= 2250) { const f = clamp((t - 2250) / 320); films.style.opacity = f; films.style.transform = `translateY(${(1 - out(f)) * 6}px)`; }
    if (t >= 2950) { // hold, then the logo settles into the hero's title card and the black lifts off the montage
      const g = ease(clamp((t - 2950) / 520));
      logo.style.transform = `translate(${lerp(L, mark.left, g)}px, ${lerp(T, mark.top, g)}px) scale(${lerp(1, mark.width / W, g)})`;
      opening.style.setProperty('--black', 1 - g);
      q.style.opacity = 1 - clamp(g * 2.5);
    }
    if (t >= 3500) endOpening();
    else openRaf = requestAnimationFrame(tick);
  };
  tick(performance.now());
}

// a link to a section or a film skips the opening
if (reduce || location.hash) endOpening(); else playOpening();
const linked = location.hash.slice(1);
if (FILMS[linked]?.embed) { show(linked); box.showModal(); }
