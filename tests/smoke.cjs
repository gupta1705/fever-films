// Smoke test: pages load clean, local assets resolve (HEAD, so big videos don't time out), lightbox works, nothing overflows on a phone.
// Run: python -m http.server 8765   then   NODE_PATH="$(npm root -g)" node tests/smoke.cjs
const assert = require('node:assert/strict');
const { chromium } = require('playwright');

const BASE = process.env.BASE || 'http://localhost:8765';

// Directors roster (iterations 2 and 3): four rows; on a mouse, the hovered director's portrait shows by the pointer
async function rosterCheck(p, tag) {
  assert.equal(await p.locator('.roster__row').count(), 4, `${tag}: four directors`);
  const row = p.locator('.roster__row').nth(2);
  await row.scrollIntoViewIfNeeded();
  await row.hover();
  await p.waitForTimeout(500);
  assert.equal(await row.locator('.roster__face').evaluate((el) => getComputedStyle(el).opacity), '1', `${tag}: hovered director's portrait shows`);
}
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
      const res = await page.request.head(`${BASE}/${u}`);
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
  for (const u of new Set(local2)) assert.equal((await page.request.head(new URL(u, V2).href)).status(), 200, `v2: ${u} missing`);
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
  await rosterCheck(page, 'v2');
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

  // ---------- iteration 3 (whiteboard flow: logo opening, film montage, work, directors, IP) ----------
  const V3 = `${BASE}/iteration-3/`;
  const opened = (p) => p.waitForFunction(() => document.documentElement?.classList.contains('is-opening'), null, { timeout: 15000 }); // 'commit' can land before the document exists
  await page.goto(V3, { waitUntil: 'commit' });
  await opened(page);
  assert.ok(await page.locator('.opening__q').isVisible(), 'v3: "How is your fever?" opening plays on load');
  await page.locator('.opening').waitFor({ state: 'detached', timeout: 6000 });
  assert.ok(await page.locator('.mark__on-dark').isVisible(), 'v3: logo lands in the top bar');
  await page.waitForTimeout(800);
  assert.ok(await page.evaluate(() => !document.querySelector('.hero__video').paused), 'v3: montage plays after the opening');
  const local3 = await page.$$eval('[src],[href],[poster]', (els) => els
    .flatMap((e) => [e.getAttribute('src'), e.getAttribute('href'), e.getAttribute('poster')])
    .filter((u) => u && !/^(https?:|mailto:|#)/.test(u)));
  for (const u of new Set(local3)) assert.equal((await page.request.head(new URL(u, V3).href)).status(), 200, `v3: ${u} missing`);
  assert.deepEqual(await page.$$eval('main > [id]', (els) => els.map((e) => e.id)), ['top', 'work', 'spotify', 'directors', 'bts', 'ip', 'about', 'contact'], 'v3: montage, work, directors, BTS, IP');
  assert.equal(await page.locator('.bts__track li:not([aria-hidden]) img').count(), 21, 'v3: 21 BTS photos');
  assert.equal(await page.locator('.bts__track li[aria-hidden] img').count(), 21, 'v3: BTS strips loop (cloned set)');
  // no seeking (python's http.server has no range requests): wait until the caption matches whatever cut is on
  // screen, past the first one so we know it has changed at least once
  await page.waitForFunction(() => {
    const t = document.querySelector('.hero__video').currentTime, i = CUTS.findLastIndex(([at]) => t >= at);
    return i > 0 && t > CUTS[i][0] + 0.3 && (i + 1 === CUTS.length || t < CUTS[i + 1][0]) && document.querySelector('.hero__film').dataset.film === CUTS[i][1];
  }, null, { timeout: 25000 }).catch(() => assert.fail('v3: caption names the film on screen'));
  await page.locator('.hero__pause').click();
  assert.ok(await page.evaluate(() => document.querySelector('.hero__video').paused), 'v3: montage pauses');
  assert.equal(await page.locator('.hero__pause').textContent(), 'Play', 'v3: button offers Play');
  await page.locator('.nav a[href="#ip"]').click();
  await page.waitForTimeout(2600);
  const gap3 = await page.evaluate(() => Math.abs(scrollY - document.getElementById('ip').offsetTop));
  assert.ok(gap3 < 40, `v3: nav jumps to IP (off by ${gap3}px)`);
  assert.equal(await page.locator('.nav a.is-on').textContent(), 'IP', 'v3: IP underlined');
  await rosterCheck(page, 'v3');
  await page.locator('.ip-row__ads a[data-film="spotify-laddoo"]').click();
  assert.match(await page.locator('.lb__media iframe').getAttribute('src'), /Ll9335RK9R0/, 'v3: IP links open the film');
  await page.keyboard.press('Escape');
  await page.locator('.lb__media iframe').waitFor({ state: 'detached', timeout: 5000 });
  await page.goto(`${V3}?again`, { waitUntil: 'commit' });
  await opened(page);
  await page.mouse.click(400, 300);
  assert.equal(await page.locator('.opening').count(), 0, 'v3: a click skips the opening');
  await page.goto(`${V3}?shared#spotify-lights`);
  assert.equal(await page.locator('.opening').count(), 0, 'v3: links skip the opening');
  assert.match(await page.locator('.lb__media iframe').getAttribute('src'), /LxK1G7hnbZE/, 'v3: deep link');
  await phone.goto(V3, { waitUntil: 'commit' });
  await opened(phone);
  await phone.locator('.opening').waitFor({ state: 'detached', timeout: 6000 });
  assert.ok(await phone.evaluate(() => document.documentElement.scrollWidth <= innerWidth), 'v3: horizontal overflow on phone');
  assert.ok(await phone.locator('.chrome .brief').isVisible(), 'v3: Email a brief visible on phone');
  assert.ok(await phone.evaluate(() => {
    const bar = document.querySelector('.hero__bar').getBoundingClientRect(), brief = document.querySelector('.chrome .brief').getBoundingClientRect();
    return bar.bottom <= brief.top;
  }), 'v3: montage caption clears the floating Email a brief button');

  assert.deepEqual(errors, [], 'console errors');
  await browser.close();
  console.log('smoke: all checks passed');
})().catch((e) => { console.error(e.message); process.exit(1); });
