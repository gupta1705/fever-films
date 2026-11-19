// Smoke test: pages load clean, local assets resolve, lightbox works, nothing overflows on a phone.
// Run: python -m http.server 8765   then   NODE_PATH="$(npm root -g)" node tests/smoke.cjs
const assert = require('node:assert/strict');
const { chromium } = require('playwright');

const BASE = process.env.BASE || 'http://localhost:8765';
const PAGES = ['index.html', 'work.html', 'directors.html', 'about.html', 'contact.html'];

(async () => {
  const browser = await chromium.launch();
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const page = await ctx.newPage();
  const errors = [];
  page.on('pageerror', (e) => errors.push(`pageerror: ${e.message}`));
  page.on('console', (m) => { if (m.type() === 'error' && (m.location().url || '').startsWith(BASE)) errors.push(m.text()); });

  for (const p of PAGES) {
    await page.goto(`${BASE}/${p}`, { waitUntil: 'load' });
    assert.equal(await page.locator('#site-nav a').count(), 5, `${p}: nav links`);
    assert.equal(await page.locator('#site-nav a[aria-current="page"]').getAttribute('href'), p, `${p}: active link`);
    const local = await page.$$eval('[src],[href],[poster]', (els) => els
      .flatMap((e) => [e.getAttribute('src'), e.getAttribute('href'), e.getAttribute('poster')])
      .filter((u) => u && !/^(https?:|mailto:|#)/.test(u)));
    for (const u of new Set(local)) {
      const res = await page.request.get(`${BASE}/${u}`);
      assert.equal(res.status(), 200, `${p}: ${u} missing`);
    }
  }

  // Work grid + lightbox
  await page.goto(`${BASE}/work.html`);
  assert.equal(await page.locator('.tile').count(), 18, 'tile count');
  assert.equal(await page.locator('.tile').first().getAttribute('id'), 'spotify-laddoo', 'Spotify leads');
  await page.locator('.tile').first().click();
  assert.ok(await page.locator('dialog.lightbox[open]').isVisible(), 'lightbox opens');
  assert.match(await page.locator('.lb__media iframe').getAttribute('src'), /Ll9335RK9R0/);
  assert.equal(await page.locator('[data-field="title"]').textContent(), 'Laddoo banana fun banao');
  await page.keyboard.press('ArrowRight');
  assert.match(await page.locator('.lb__media iframe').getAttribute('src'), /LxK1G7hnbZE/, 'next film');
  await page.keyboard.press('ArrowLeft');
  await page.keyboard.press('ArrowLeft');
  assert.match(await page.locator('.lb__media iframe').getAttribute('src'), /13i2K9l_GGiNd0cqgOdKI8uhV56eY3rS-/, 'wraps to last embeddable film');
  await page.keyboard.press('Escape');
  assert.equal(await page.locator('dialog.lightbox[open]').count(), 0, 'Esc closes');
  await page.locator('.lb__media iframe').waitFor({ state: 'detached', timeout: 5000 }); // 'close' fires async after Esc

  assert.equal(new URL(page.url()).hash, '', 'hash cleared');
  await page.goto(`${BASE}/work.html?shared#cu-online-banrakas`); // query forces a fresh load, like a shared link
  assert.match(await page.locator('.lb__media iframe').getAttribute('src'), /zCt4tXB0suY/, 'deep link');

  // Phone: no sideways scroll, menu toggles
  const phone = await browser.newPage({ viewport: { width: 375, height: 812 } });
  for (const p of PAGES) {
    await phone.goto(`${BASE}/${p}`);
    assert.ok(await phone.evaluate(() => document.documentElement.scrollWidth <= innerWidth), `${p}: horizontal overflow on phone`);
  }
  assert.ok(!(await phone.locator('#site-nav').isVisible()), 'menu starts closed');
  await phone.locator('.menu-btn').click();
  assert.ok(await phone.locator('#site-nav').isVisible(), 'menu opens');

  // ---------- iteration 2 (Getty treatment) ----------
  const V2 = `${BASE}/iteration-2/`;
  await page.goto(V2, { waitUntil: 'load' });
  const local2 = await page.$$eval('[src],[href]', (els) => els
    .flatMap((e) => [e.getAttribute('src'), e.getAttribute('href')])
    .filter((u) => u && !/^(https?:|mailto:|#)/.test(u)));
  for (const u of new Set(local2)) assert.equal((await page.request.get(new URL(u, V2).href)).status(), 200, `v2: ${u} missing`);
  assert.equal(await page.locator('.field__item img').count(), 22, 'v2: field stills');
  assert.equal(await page.locator('.nav a.is-on').count(), 0, 'v2: no section underlined on the intro');
  await page.evaluate(() => scrollTo(0, document.getElementById('spotify').offsetTop));
  await page.waitForTimeout(1500);
  assert.ok(await page.evaluate(() => !document.querySelector('.screen__video').paused), 'v2: Spotify film plays when on screen');
  assert.equal(await page.locator('.nav a.is-on').textContent(), 'Work', 'v2: Work underlined while the Spotify films play');
  await page.evaluate(() => document.querySelector('.screen__video').dispatchEvent(new Event('ended')));
  assert.match(await page.locator('.screen__video').getAttribute('src'), /spotify-lights\.mp4/, 'v2: the next film rolls on');
  await page.locator('.screen__sound').click();
  assert.equal(await page.evaluate(() => document.querySelector('.screen__video').muted), false, 'v2: sound turns on');
  await page.evaluate(() => { const s = document.getElementById('directors'); scrollTo(0, s.offsetTop + (s.offsetHeight - innerHeight) * 0.6); });
  await page.waitForTimeout(800);
  assert.equal(await page.locator('.person.is-on .person__name').textContent(), 'Deepesh Saumitra Jagdish', 'v2: directors step with scroll');
  assert.equal(await page.locator('#directors .timeline li.is-on').textContent(), 'Deepesh', 'v2: timeline follows');
  await page.locator('.brand__films a[data-film="cyberdost-phulera"]').click();
  assert.match(await page.locator('.lb__media iframe').getAttribute('src'), /r0bzNean0go/, 'v2: lightbox opens');
  await page.keyboard.press('ArrowRight');
  assert.match(await page.locator('.lb__media iframe').getAttribute('src'), /rZuU2rsYM5M/, 'v2: next film');
  await page.keyboard.press('Escape');
  await page.locator('.lb__media iframe').waitFor({ state: 'detached', timeout: 5000 });
  await page.locator('.nav a[href="#directors"]').click();
  await page.waitForTimeout(2600);
  const gap = await page.evaluate(() => Math.abs(scrollY - document.getElementById('directors').offsetTop));
  assert.ok(gap < 40, `v2: nav jumps to Directors (off by ${gap}px)`);
  assert.equal(await page.locator('.nav a.is-on').textContent(), 'Directors', 'v2: Directors underlined');
  assert.ok(await page.locator('.chrome .brief').isVisible(), 'v2: Email a brief stays on screen mid-story');
  assert.equal(await page.locator('.intro .pill').count(), 0, 'v2: no Scroll down button');
  await page.goto(`${V2}?shared#spotify-lights`);
  assert.match(await page.locator('.lb__media iframe').getAttribute('src'), /LxK1G7hnbZE/, 'v2: deep link');
  await phone.goto(V2);
  assert.ok(await phone.evaluate(() => document.documentElement.scrollWidth <= innerWidth), 'v2: horizontal overflow on phone');
  assert.ok(await phone.locator('.chrome .brief').isVisible(), 'v2: Email a brief visible on phone');
  assert.ok(!(await phone.locator('#nav a[href="#about"]').isVisible()), 'v2: phone menu starts closed');
  await phone.locator('.nav-toggle').click();
  assert.ok(await phone.locator('#nav a[href="#about"]').isVisible(), 'v2: phone menu opens full-screen');
  assert.ok(await phone.evaluate(() => {
    const r = document.querySelector('.chrome .brief').getBoundingClientRect();
    return document.elementFromPoint(r.x + r.width / 2, r.y + r.height / 2).classList.contains('brief');
  }), 'v2: Email a brief stays tappable over the open menu');
  await phone.locator('#nav a[href="#about"]').click();
  await phone.waitForTimeout(700);
  assert.ok(!(await phone.locator('#nav a[href="#about"]').isVisible()), 'v2: phone menu closes after a jump');

  assert.deepEqual(errors, [], 'console errors');
  await browser.close();
  console.log('smoke: all checks passed');
})().catch((e) => { console.error(e.message); process.exit(1); });
