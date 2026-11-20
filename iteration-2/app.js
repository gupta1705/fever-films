// Fever Films, iteration 2: a Getty "Tracing Art" style scroll story. No framework; Lenis smooths the scroll.
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
const FILMS = {
  'spotify-laddoo': { client: 'Spotify x Gullak', title: 'Laddoo banana fun banao', brief: BRIEF.spotify, ...yt('Ll9335RK9R0') },
  'spotify-lights': { client: 'Spotify x Gullak', title: 'Lights lagana fun banao', brief: BRIEF.spotify, ...yt('LxK1G7hnbZE') },
  'spotify-rangoli': { client: 'Spotify x Gullak', title: 'Rangoli banana fun banao', brief: BRIEF.spotify, ...yt('LdShwDXhHEY') },
  'cyberdost-phulera': { client: CYBER, title: 'Phulera Mein Cyber Crime ft. Amitabh Bachchan', brief: BRIEF.cyberdost, ...yt('r0bzNean0go') },
  'cyberdost-phulera-2': { client: CYBER, title: 'Phulera Mein Cyber Crime, Part 2', brief: BRIEF.cyberdost, ...yt('rZuU2rsYM5M') },
  'cyberdost-scam-calls': { client: CYBER, title: 'Aise calls aapko bhi aa rahe hain?', brief: BRIEF.cyberdost, ...yt('7wTnUXZS5Eg') },
  'cyberdost-panchayat': { client: CYBER, title: 'Amitabh Bachchan and the Panchayat team', brief: BRIEF.cyberdost, ...yt('AOBFfhWHu4o') },
  'sitaare-zameen-par': { client: 'Aamir Khan Productions', title: 'Sitaare Zameen Par on YouTube: Baap-Bete Ki Nayi Scheme', brief: BRIEF.sitaare, ...yt('GBaRZN8YpH8') },
  'ultratech-ek-ghar': { client: 'UltraTech Cement', title: 'Ek Ghar Banaunga', brief: BRIEF.ultratech, ...yt('gmoEBbsfT30') },
  'aadhar-ghar-le-lo': { client: 'Aadhar Housing Finance', title: 'Ghar Le Lo: Sawaal Nahi, Saath Pao', brief: BRIEF.aadhar, ...yt('5IEB6-KknoI') },
  'aadhar-daga-seth': { client: 'Aadhar Housing Finance', title: 'Ghar Le Lo: Daga Seth Ka Challenge', brief: BRIEF.aadhar, ...yt('cd1QVHG54hs') },
  'cu-online-banrakas': { client: 'Chandigarh University Online', title: 'Banrakas Ka Heist ft. Vikas & Bhushan', brief: BRIEF.cu, ...yt('zCt4tXB0suY') },
  'wiom-ek-kahani': { client: 'Wiom', title: 'Ek Kahani', brief: BRIEF.wiom, ...yt('h2tKQ756nMs') },
  'wiom-recharge': { client: 'Wiom', title: 'Recharge Waala Ghar Ka Net', brief: BRIEF.wiom, ...yt('J-zpxYp87gU') },
  'wiom-newly-wed': { client: 'Wiom', title: 'Newly Wed', brief: BRIEF.wiom, ...drive('1zf1lv6_4J2HLRiSjgAY6XWjn7hT7jcsL') },
  'wiom-preeti-guddu': { client: 'Wiom', title: 'Preeti & Guddu', brief: BRIEF.wiom, ...drive('1lx2TFdIUFplOWQJP9y_XbMSNTu5r7Rps') },
  'wiom-two-kids': { client: 'Wiom', title: 'Two Kids', brief: BRIEF.wiom, ...drive('13i2K9l_GGiNd0cqgOdKI8uhV56eY3rS-') },
  // Marzi's account blocks Instagram embeds, so it opens on Instagram instead of the lightbox
  'marzi-find-your-kind': { client: 'Marzi', title: 'Find your kind', href: 'https://www.instagram.com/reel/Debz-18x0q4/' },
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
  ...Object.keys(FILMS).map((k) => ({ src: `../assets/img/work/${k}.webp`, film: k })),
  ...['deepak-mishra', 'vaibhav-bundhoo', 'deepesh-saumitra-jagdish', 'akshat-vijaywargya'].map((k) => ({ src: `../assets/img/directors/${k}.webp`, portrait: true })),
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

// ---------- nav: the link for the section on screen stays underlined; a hairline at the top shows progress ----------
const navLinks = $$('.nav a'), progress = $('.progress');
let maxScroll = 1;
const measure = () => { maxScroll = Math.max(1, document.documentElement.scrollHeight - innerHeight); };

// ---------- mood: whatever sits at mid-screen sets the background, the field, the logo tone and the active link ----------
const moodEls = $$('[data-bg], [data-field]');
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
    document.body.style.backgroundColor = bg;
    document.documentElement.style.setProperty('--bg-now', bg); // the nav's fade matches the chapter colour
  }
  document.body.classList.toggle('field-on', on);
  document.body.classList.toggle('tone-light', light);
  if (nav !== lastNav) { lastNav = nav; navLinks.forEach((a) => a.classList.toggle('is-on', a.hash === `#${nav}`)); }
  return on;
}

// ---------- reveal brand blocks as they arrive ----------
const io = new IntersectionObserver((es) => es.forEach((e) => { if (e.isIntersecting) { e.target.classList.add('is-in'); io.unobserve(e.target); } }), { rootMargin: '0px 0px -12% 0px' });
$$('.brand').forEach((b) => io.observe(b));

// ---------- smooth scroll, phone menu, anchors ----------
const lenis = !reduce && window.Lenis ? new window.Lenis({ lerp: 0.085 }) : null;
const navEl = $('#nav'), toggle = $('.nav-toggle');
function openMenu(open) {
  navEl.classList.toggle('is-open', open);
  toggle.setAttribute('aria-expanded', String(open));
  toggle.textContent = open ? 'Close' : 'Menu';
  if (lenis) open ? lenis.stop() : lenis.start();
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

// ---------- rotating word in the closing line ----------
const words = $$('.rotator span');
if (!reduce) setInterval(() => {
  const i = words.findIndex((w) => w.classList.contains('is-on'));
  words[i].classList.remove('is-on');
  words[(i + 1) % words.length].classList.add('is-on');
}, 2400);

// ---------- one loop ----------
let mx = 0, tmx = 0;
addEventListener('pointermove', (e) => { tmx = e.clientX / innerWidth - 0.5; }, { passive: true });
addEventListener('resize', measure);
addEventListener('load', measure); // fonts and images change the page height
measure();

function frame(t) {
  lenis?.raf(t);
  const y = scrollY, vh = innerHeight;
  const fieldOn = mood(vh);
  progress.style.transform = `scaleX(${clamp(y / maxScroll).toFixed(4)})`;
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

// ---------- loader, then deep link ----------
const done = () => $('.loader').classList.add('is-done');
if (reduce) done(); else { addEventListener('load', done); setTimeout(done, 2200); }
const linked = location.hash.slice(1);
if (FILMS[linked]?.embed) { show(linked); box.showModal(); }
