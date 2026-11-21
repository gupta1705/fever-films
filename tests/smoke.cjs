// Smoke test for the Fever Films site: loads clean, assets resolve (HEAD, so big videos don't time out), the opening
// hands over to the montage, films open in the viewer, roster and BTS work, nothing overflows on a phone.
// Run: python -m http.server 8765   then   NODE_PATH="$(npm root -g)" node tests/smoke.cjs   (BASE=<url> to test the live site)
const assert = require('node:assert/strict');
const { chromium } = require('playwright');

const BASE = `${process.env.BASE || 'http://localhost:8765'}/`;

// the opening adds .is-opening as soon as the script runs; 'commit' can land before the document exists
const opened = (p) => p.waitForFunction(() => document.documentElement?.classList.contains('is-opening'), null, { timeout: 15000 });

(async () => {
  const browser = await chromium.launch();
  const page = await (await browser.newContext({ viewport: { width: 1440, height: 900 } })).newPage();
  const errors = [];
  page.on('pageerror', (e) => errors.push(`pageerror: ${e.message}`));
  page.on('console', (m) => { if (m.type() === 'error' && (m.location().url || '').startsWith(BASE)) errors.push(m.text()); });

  // opening: "How is your fever?" plays, hands the logo to the top bar, then the montage runs
  await page.goto(BASE, { waitUntil: 'commit' });
  await opened(page);
  assert.ok(await page.locator('.opening__q').isVisible(), '"How is your fever?" opening plays on load');
  await page.locator('.opening').waitFor({ state: 'detached', timeout: 6000 });
  assert.ok(await page.locator('.mark__on-dark').isVisible(), 'logo lands in the top bar');
  await page.waitForTimeout(800);
  assert.ok(await page.evaluate(() => !document.querySelector('.hero__video').paused), 'montage plays after the opening');
  assert.equal(await page.locator('.hero__index a.is-on').textContent(), 'CyberDost', 'the first client is lit from the first frame');

  const local = await page.$$eval('[src],[href],[poster]', (els) => els
    .flatMap((e) => [e.getAttribute('src'), e.getAttribute('href'), e.getAttribute('poster')])
    .filter((u) => u && !/^(https?:|mailto:|#)/.test(u)));
  for (const u of new Set(local)) assert.equal((await page.request.head(new URL(u, BASE).href)).status(), 200, `${u} missing`);
  assert.deepEqual(await page.$$eval('main > [id]', (els) => els.map((e) => e.id)), ['top', 'work', 'spotify', 'directors', 'bts', 'ip', 'about', 'contact'], 'montage, work, directors, BTS, IP');
  assert.equal(await page.evaluate(() => (document.body.innerText.match(/TVF/g) || []).length), 1, 'TVF is named once');

  // the hero names the cut on screen, lights its client in the list and takes that client's Work colour
  // (no seeking: python's http.server has no range requests)
  assert.deepEqual(await page.$$eval('.hero__index a', (els) => els.map((e) => e.textContent)),
    ['CyberDost', 'Aamir Khan Productions', 'Marzi', 'Spotify', 'CU Online', 'UltraTech', 'Aadhar', 'Wiom'], 'hero lists the clients in the agreed order');
  await page.waitForFunction(() => {
    const t = document.querySelector('.hero__video').currentTime, i = CUTS.findLastIndex(([at]) => t >= at);
    const lit = document.querySelector('.hero__index a.is-on');
    return i > 2 && t > CUTS[i][0] + 0.3 && (i + 1 === CUTS.length || t < CUTS[i + 1][0]) && document.querySelector('.hero__film').dataset.film === CUTS[i][1]
      && document.querySelectorAll('.hero__index a.is-on').length === 1 && lit.dataset.brand === CUTS[i][1].split('-')[0]
      && document.querySelector('.hero__brand').textContent === lit.textContent
      && document.getElementById('top').dataset.bg === document.querySelector(lit.hash).dataset.bg;
  }, null, { timeout: 25000 }).catch(() => assert.fail('hero names the film on screen and lights its client'));
  await page.locator('.hero__pause').click();
  assert.ok(await page.evaluate(() => document.querySelector('.hero__video').paused), 'montage pauses');
  assert.equal(await page.locator('.hero__pause').getAttribute('aria-label'), 'Play the showreel', 'button offers Play');
  assert.equal(await page.locator('.hero__pause').textContent(), 'Play', 'the button says Play');
  assert.equal(await page.evaluate(() => new Set(CUTS.map(([, s]) => s.split('-')[0])).size), 8, 'every client is in the montage');
  assert.equal(await page.locator('.hint').count(), 0, 'no "Click a film to watch it" pill');

  // work: brands in the agreed order, each on its own colour, with the side cutouts behind every one of them
  assert.deepEqual(await page.$$eval('.roll .huge, .screening .huge', (els) => els.map((e) => e.textContent)),
    ['CyberDost', 'Aamir Khan Productions', 'Marzi', 'Spotify', 'CU Online', 'UltraTech', 'Aadhar', 'Wiom'], 'work follows the agreed order');
  for (const name of ['CyberDost', 'Marzi', 'CU Online', 'Wiom']) {
    await page.evaluate((name) => {
      const el = [...document.querySelectorAll('.brand')].find((b) => b.querySelector('.huge').textContent === name);
      const y = el.getBoundingClientRect().top + scrollY + el.offsetHeight / 2 - innerHeight / 2;
      lenis ? lenis.scrollTo(y, { immediate: true }) : scrollTo(0, y);
    }, name);
    await page.waitForTimeout(400);
    assert.ok(await page.evaluate(() => document.body.classList.contains('field-on')), `${name}: side cutouts show`);
    assert.notEqual(await page.evaluate(() => document.body.style.backgroundColor), 'rgb(11, 10, 8)', `${name}: brand colour shows`);
  }
  await page.evaluate(() => { const y = document.getElementById('spotify').offsetTop; lenis ? lenis.scrollTo(y, { immediate: true }) : scrollTo(0, y); });
  await page.waitForTimeout(1500);
  assert.ok(await page.evaluate(() => !document.querySelector('.screen__video').paused), 'Spotify films play in place when on screen');
  assert.ok(await page.evaluate(() => document.body.classList.contains('field-on')), 'Spotify: side cutouts show');
  await page.evaluate(() => document.querySelector('.screen__video').dispatchEvent(new Event('ended')));
  assert.match(await page.locator('.screen__video').getAttribute('src'), /spotify-lights\.mp4/, 'the next Spotify film rolls on');
  await page.locator('.brand__films a[data-film="cyberdost-phulera"]').click();
  assert.match(await page.locator('.lb__media iframe').getAttribute('src'), /r0bzNean0go/, 'a film opens in the viewer');
  assert.equal(await page.locator('[data-field="director"]').textContent(), ' · Directed by Deepak Mishra', 'the viewer names the director');
  await page.keyboard.press('ArrowRight');
  assert.match(await page.locator('.lb__media iframe').getAttribute('src'), /rZuU2rsYM5M/, 'next film follows the same order');
  await page.keyboard.press('Escape');
  await page.locator('.lb__media iframe').waitFor({ state: 'detached', timeout: 5000 });

  // directors roster: on a mouse, the hovered director's portrait shows by the pointer
  assert.equal(await page.locator('.roster__row').count(), 8, 'all eight directors from the team list');
  assert.equal(await page.locator('.roster__row').nth(6).locator('.roster__name').textContent(), 'Raghav Subbu', 'roster follows the team list');
  const row = page.locator('.roster__row').nth(2);
  await row.scrollIntoViewIfNeeded();
  await row.hover();
  await page.waitForTimeout(500);
  assert.equal(await row.locator('.roster__face').evaluate((el) => getComputedStyle(el).opacity), '1', "hovered director's portrait shows");

  // behind the scenes: 21 photos, each strip holding a cloned set so the loop has no seam
  assert.equal(await page.locator('.bts__track li:not([aria-hidden]) img').count(), 21, '21 BTS photos');
  assert.equal(await page.locator('.bts__track li[aria-hidden] img').count(), 21, 'BTS strips loop');

  await page.locator('.nav a[href="#ip"]').click();
  await page.waitForTimeout(2600);
  const gap = await page.evaluate(() => Math.abs(scrollY - document.getElementById('ip').offsetTop));
  assert.ok(gap < 40, `nav jumps to IP (off by ${gap}px)`);
  assert.equal(await page.locator('.nav a.is-on').textContent(), 'IP', 'IP lit');
  assert.ok(await page.evaluate(() => Math.abs(document.querySelector('.mercury').getBoundingClientRect().right
    - document.querySelector('.nav a.is-on').getBoundingClientRect().right) < 2), 'mercury runs to the end of IP');
  await page.locator('.ip-row__ads a[data-film="spotify-laddoo"]').click();
  assert.match(await page.locator('.lb__media iframe').getAttribute('src'), /Ll9335RK9R0/, 'IP links open the film');
  await page.keyboard.press('Escape');
  await page.locator('.lb__media iframe').waitFor({ state: 'detached', timeout: 5000 });

  await page.goto(`${BASE}?again`, { waitUntil: 'commit' });
  await opened(page);
  await page.mouse.click(400, 300);
  assert.equal(await page.locator('.opening').count(), 0, 'a click skips the opening');
  await page.goto(`${BASE}?shared#spotify-lights`, { waitUntil: 'domcontentloaded' }); // 'load' would wait for the YouTube player too
  assert.equal(await page.locator('.opening').count(), 0, 'links skip the opening');
  assert.match(await page.locator('.lb__media iframe').getAttribute('src'), /LxK1G7hnbZE/, 'deep link opens its film');
  await page.goto(`${BASE}iteration-3/?old#spotify-lights`, { waitUntil: 'domcontentloaded' });
  await page.waitForURL((u) => !u.pathname.includes('iteration-3'), { timeout: 10000 });
  assert.match(await page.locator('.lb__media iframe').getAttribute('src'), /LxK1G7hnbZE/, 'old /iteration-3/ links forward, film and all');

  // phone
  const phone = await browser.newPage({ viewport: { width: 375, height: 812 } });
  await phone.goto(BASE, { waitUntil: 'commit' });
  await opened(phone);
  await phone.locator('.opening').waitFor({ state: 'detached', timeout: 6000 });
  assert.ok(await phone.evaluate(() => document.documentElement.scrollWidth <= innerWidth), 'no sideways scroll on a phone');
  assert.ok(await phone.locator('.chrome .brief').isVisible(), 'Email a brief visible on phone');
  assert.ok(await phone.evaluate(() => {
    const screen = document.querySelector('.hero__screen').getBoundingClientRect(), brief = document.querySelector('.chrome .brief').getBoundingClientRect();
    return brief.bottom <= screen.top + 1 && screen.left >= 0 && screen.right <= innerWidth + 1 && screen.bottom <= innerHeight;
  }), 'Email a brief sits in the top bar, clear of the whole montage');
  assert.ok(!(await phone.locator('#nav a[href="#about"]').isVisible()), 'phone menu starts closed');
  await phone.locator('.nav-toggle').click();
  assert.ok(await phone.locator('#nav a[href="#about"]').isVisible(), 'phone menu opens full-screen');
  await phone.locator('#nav a[href="#about"]').click();
  await phone.waitForTimeout(700);
  assert.ok(!(await phone.locator('#nav a[href="#about"]').isVisible()), 'phone menu closes after a jump');

  assert.deepEqual(errors, [], 'console errors');
  await browser.close();
  console.log('smoke: all checks passed');
})().catch((e) => { console.error(e.message); process.exit(1); });
