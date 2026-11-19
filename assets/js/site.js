// Fever Films: menu, scroll reveal, hero reel, work lightbox. No dependencies.
const reduceMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;

// Mobile menu
const menuBtn = document.querySelector('.menu-btn');
const nav = document.getElementById('site-nav');
menuBtn?.addEventListener('click', () => {
  const open = menuBtn.getAttribute('aria-expanded') !== 'true';
  menuBtn.setAttribute('aria-expanded', String(open));
  nav.classList.toggle('is-open', open);
});

// Scroll reveal
const io = new IntersectionObserver((entries) => {
  for (const e of entries) if (e.isIntersecting) { e.target.classList.add('is-in'); io.unobserve(e.target); }
}, { rootMargin: '0px 0px -8% 0px' });
document.querySelectorAll('[data-reveal]').forEach((el) => io.observe(el));

// Hero reel: respect reduced motion
const reel = document.querySelector('.hero video');
if (reel && reduceMotion) { reel.removeAttribute('autoplay'); reel.pause(); }

// Work lightbox
const box = document.querySelector('.lightbox');
const tiles = [...document.querySelectorAll('.tile[data-embed]')];
if (box && tiles.length) {
  const media = box.querySelector('.lb__media');
  const field = (name) => box.querySelector(`[data-field="${name}"]`);
  let current = -1;

  const show = (i) => {
    current = (i + tiles.length) % tiles.length;
    const t = tiles[current].dataset;
    const frame = Object.assign(document.createElement('iframe'), { src: t.embed, title: t.title });
    frame.allow = 'autoplay; encrypted-media; fullscreen; picture-in-picture';
    media.replaceChildren(frame);
    field('title').textContent = t.title;
    field('client').textContent = t.client;
    field('desc').textContent = t.desc;
    field('link').href = tiles[current].href;
    field('link').textContent = t.platform ? `Watch on ${t.platform}` : 'Open the film';
    history.replaceState(null, '', `#${tiles[current].id}`);
  };

  tiles.forEach((tile, i) => tile.addEventListener('click', (e) => {
    if (e.metaKey || e.ctrlKey || e.shiftKey) return; // let people open the film in a new tab
    e.preventDefault();
    show(i);
    if (!box.open) box.showModal();
  }));

  box.querySelector('.lb__nav--prev').addEventListener('click', () => show(current - 1));
  box.querySelector('.lb__nav--next').addEventListener('click', () => show(current + 1));
  box.querySelector('.lb__close').addEventListener('click', () => box.close());
  box.addEventListener('keydown', (e) => {
    if (e.key === 'ArrowLeft') show(current - 1);
    if (e.key === 'ArrowRight') show(current + 1);
  });
  box.addEventListener('close', () => {
    media.replaceChildren(); // removing the iframe stops playback
    history.replaceState(null, '', location.pathname);
    tiles[current]?.focus();
  });

  // Deep link: work.html#spotify-laddoo opens that film
  const linked = tiles.findIndex((t) => `#${t.id}` === location.hash);
  if (linked >= 0) { show(linked); box.showModal(); }
}
