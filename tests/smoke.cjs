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

  assert.deepEqual(errors, [], 'console errors');
  await browser.close();
  console.log('smoke: all checks passed');
})().catch((e) => { console.error(e.message); process.exit(1); });
