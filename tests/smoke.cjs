// Smoke test for the Fever Films site: loads clean, assets resolve (HEAD, so big videos don't time out), the opening
// hands over to the montage, films open in the viewer, roster and BTS work, nothing overflows on a phone.
// Run: python -m http.server 8765   then   NODE_PATH="$(npm root -g)" node tests/smoke.cjs   (BASE=<url> to test the live site)
const assert = require('node:assert/strict');
const { chromium } = require('playwright');

const BASE = `${process.env.BASE || 'http://localhost:8765'}/`;

// the opening adds .is-opening as soon as the script runs; 'commit' can land before the document exists
const opened = (p) => p.waitForFunction(() => document.documentElement?.classList.contains('is-opening'), null, { timeout: 15000 });
const ALL = Array.from({ length: 15 }, (_, i) => i);
// where each cut's faces land on screen (FACES in app.js: shares of the frame), framed as each cut is shown: the lowest face must clear the
// logo's x-height; with `sides`, the faces the frame keeps are whole across; with `top`, the frame is never cropped past the hairline
const faceCheck = (p, cuts, { sides = false, top = false } = {}) => p.evaluate(({ cuts, sides, top }) => {
  const v = document.querySelector('.hero__video'), sc = document.querySelector('.hero__screen').getBoundingClientRect();
  const mk = document.querySelector('.mark__on-dark').getBoundingClientRect(), line = mk.top + mk.height * 0.24, bad = [];
  for (const i of cuts) {
    frameCut(i);
    const r = v.getBoundingClientRect(), cs = getComputedStyle(v);
    let x0 = r.left, y0 = r.top, w = r.width, h = r.height;
    if (cs.objectFit !== 'fill') {
      const [ox, oy] = cs.objectPosition.split(' ').map((s) => parseFloat(s) / 100), k = Math.max(r.width / 16, r.height / 9);
      w = 16 * k; h = 9 * k; x0 += (r.width - w) * ox; y0 += (r.height - h) * oy;
    }
    const [, lo, hi, , ft, fb] = FACES[i];
    if (y0 + fb * h > line + 0.5) bad.push(`cut ${i}: a face under the logo`);
    if (sides && (x0 + lo * w < sc.left - 1 || x0 + hi * w > sc.right + 1)) bad.push(`cut ${i}: a face cut at the side`);
    if (top && y0 + ft * h < sc.top - 1) bad.push(`cut ${i}: a head cut at the top`);
  }
  frameCut(cutNow);
  return bad;
}, { cuts, sides, top });
// the hero's hand-off into Work: scrolled through the whole hero and back up in 6px steps, each measured on the frame that paints it, no
// visible credit line (client, film, director, Pause) touches the logo or enters the bar. Before, the docked logo sat on the credit for
// the last 72px of the hero, where the bar has no fill yet, and the credit ran on under the brief
const handoffHits = (p) => p.evaluate(async () => {
  const to = (y) => (lenis ? lenis.scrollTo(y, { immediate: true }) : scrollTo(0, y)), frame = () => new Promise((r) => requestAnimationFrame(r));
  const ys = [], bad = [];
  for (let y = 0; y <= document.getElementById('top').offsetHeight + 40; y += 6) ys.push(y);
  for (const y of [...ys, ...[...ys].reverse()]) {
    to(y); await frame();
    const m = document.querySelector('.mark__on-dark').getBoundingClientRect(), bar = document.querySelector('.chrome').offsetHeight;
    for (const el of document.querySelectorAll('.hero__brand, .hero__title, .hero__by, .hero__pause')) {
      if (+getComputedStyle(el.closest('.hero__film') || el).opacity <= 0.02) continue;
      const rg = document.createRange(); rg.selectNodeContents(el);
      for (const r of rg.getClientRects()) if (r.top < bar || (r.right > m.left && r.left < m.right && r.bottom > m.top && r.top < m.bottom)) bad.push(`${el.className} at y=${y}`);
    }
  }
  to(0);
  return [...new Set(bad)];
});

(async () => {
  const browser = await chromium.launch();
  const page = await (await browser.newContext({ viewport: { width: 1440, height: 900 } })).newPage();
  const errors = [];
  page.on('pageerror', (e) => errors.push(`pageerror: ${e.message}`));
  page.on('console', (m) => { if (m.type() === 'error' && (m.location().url || '').startsWith(BASE)) errors.push(m.text()); });

  // opening: "How is your fever?" plays, hands the logo to its place at the foot of the hero, then the montage runs
  await page.goto(BASE, { waitUntil: 'commit' });
  await opened(page);
  assert.ok(await page.locator('.opening__q').isVisible(), '"How is your fever?" opening plays on load');
  await page.locator('.opening').waitFor({ state: 'detached', timeout: 6000 });
  assert.ok(await page.locator('.mark__on-dark').isVisible(), 'logo lands on the hero');
  await page.waitForTimeout(800);
  assert.ok(await page.evaluate(() => !document.querySelector('.hero__video').paused), 'montage plays after the opening');
  assert.equal(await page.locator('.hero__brand').textContent(), 'CyberDost', 'the credit names the first client from the first frame');

  const local = await page.$$eval('[src],[href],[poster]', (els) => els
    .flatMap((e) => [e.getAttribute('src'), e.getAttribute('href'), e.getAttribute('poster')])
    .filter((u) => u && !/^(https?:|mailto:|#)/.test(u)));
  for (const u of new Set(local)) assert.equal((await page.request.head(new URL(u, BASE).href)).status(), 200, `${u} missing`);
  assert.deepEqual(await page.$$eval('main > [id]', (els) => els.map((e) => e.id)), ['top', 'work', 'spotify', 'directors', 'bts', 'ip', 'about', 'contact'], 'montage, work, directors, BTS, IP');
  assert.equal(await page.evaluate(() => (document.body.innerText.match(/TVF/g) || []).length), 1, 'TVF is named once');

  // the hero credits the cut on screen (client, film, director), takes that client's Work colour, and the logo's mercury climbs
  // with the reel (no seeking: python's http.server has no range requests)
  assert.deepEqual(await page.evaluate(() => [...new Set(CUTS.map(([, s]) => CLIENT[s.split('-')[0]]))]),
    ['CyberDost', 'Aamir Khan Productions', 'Marzi', 'Spotify', 'CU Online', 'UltraTech', 'Aadhar', 'Wiom'], 'the montage runs through the clients in the agreed order');
  await page.waitForFunction(() => {
    const v = document.querySelector('.hero__video'), t = v.currentTime, i = CUTS.findLastIndex(([at]) => t >= at);
    if (!(i > 2 && t > CUTS[i][0] + 0.3 && (i + 1 === CUTS.length || t < CUTS[i + 1][0]))) return false;
    const slug = CUTS[i][1], name = CLIENT[slug.split('-')[0]], by = DIRECTED_BY[slug.split('-')[0]];
    const work = [...document.querySelectorAll('main [data-bg]')].find((s) => s.querySelector(':scope > .huge')?.textContent === name);
    return document.querySelector('.hero__film').dataset.film === slug && document.querySelector('.hero__brand').textContent === name
      && document.querySelector('.hero__title').textContent === FILMS[slug].title
      && document.querySelector('.hero__by').textContent === (by ? `Directed by ${by}` : '')
      && work && document.getElementById('top').style.getPropertyValue('--tint') === work.dataset.bg
      && Math.abs(document.querySelector('.mk-rise').getAttribute('width') - (t / v.duration) * 77.6) < 3;
  }, null, { timeout: 25000 }).catch(() => assert.fail('hero credits the film on screen, takes its client colour, and the mercury follows the reel'));
  assert.equal(await page.evaluate(() => getComputedStyle(document.querySelector('.hero__film')).whiteSpace), 'nowrap', 'the credit is one line on desktop');
  assert.ok(await page.evaluate(() => { const b = document.querySelector('.hero__brand'), r = document.createRange(); r.selectNodeContents(b);
    return b.getBoundingClientRect().width - r.getBoundingClientRect().width < 2; }), 'the credit links (and focus-rings) the words, not their empty columns');

  // no burned-in client logo (Spotify, CU Online: top-right) under the brief and Menu, or cut in half by the frame, on any cut,
  // at the smoke size, the client's own viewport and a laptop
  const logosClear = (m = 8) => page.evaluate((m) => { // m: the clearance asked of the block
    const v = document.querySelector('.hero__video'), act = document.querySelector('.chrome__act').getBoundingClientRect();
    const top = document.querySelector('.hero__screen').getBoundingClientRect().top, bad = [];
    for (const i of Object.keys(LOGO).map(Number)) {
      frameCut(i);
      const r = v.getBoundingClientRect(), [ox, oy] = getComputedStyle(v).objectPosition.split(' ').map((s) => parseFloat(s) / 100);
      const s = Math.max(r.width / v.videoWidth, r.height / v.videoHeight), w = v.videoWidth * s, h = v.videoHeight * s;
      const x0 = r.left + (r.width - w) * ox, y0 = r.top + (r.height - h) * oy, l = x0 + LOGO[i][0] * w, t = y0 + LOGO[i][1] * h, b = y0 + LOGO[i][3] * h;
      if (l < act.right && b > act.top - m && t < act.bottom + m) bad.push(`cut ${i} under the brief/Menu`);
      if (t < top && b > top) bad.push(`cut ${i} cut in half`);
    }
    frameCut(cutNow);
    return bad;
  }, m);
  for (const [width, height] of [[1440, 900], [1880, 890], [1366, 768]]) {
    await page.setViewportSize({ width, height });
    await page.waitForTimeout(300);
    assert.deepEqual(await logosClear(), [], `${width}x${height}: no client logo under the chrome`);
  }
  // every cut's faces clear the big logo (Marzi's close-up included) at the client's viewport, a laptop and an ultrawide, framed on the
  // cut and never animated between cuts
  for (const [width, height] of [[1880, 890], [1366, 768], [2560, 1080]]) {
    await page.setViewportSize({ width, height });
    await page.waitForTimeout(300);
    assert.deepEqual(await faceCheck(page, ALL), [], `${width}x${height}: no face under the logo on any cut`);
  }
  assert.equal(await page.evaluate(() => getComputedStyle(document.querySelector('.hero__video')).transitionDuration), '0s', 'the framing changes on the cut, never animated');
  // laptops: CU Online's two men keep their heads (no push-in, the frame's top on the screen's top), and the brief/Menu block sits
  // beside their burned-in logo, never on it
  for (const [width, height] of [[1366, 768], [1280, 720], [1536, 864], [1440, 900]]) {
    await page.setViewportSize({ width, height });
    await page.waitForTimeout(300);
    assert.deepEqual(await faceCheck(page, [9, 10], { sides: true, top: true }), [], `${width}x${height}: CU Online faces whole`);
    assert.ok(await page.evaluate(() => [9, 10].every((i) => { frameCut(i); const v = document.querySelector('.hero__video');
      const ok = !v.style.transform && parseFloat(getComputedStyle(v).objectPosition.split(' ')[1]) === 0; frameCut(cutNow); return ok; })), `${width}x${height}: no push-in on the CU cuts`);
    assert.deepEqual(await logosClear(0), [], `${width}x${height}: the block never sits on a client logo`);
  }
  // a short screen (a landscape phone): the title stays in the lower half, under the faces, and the credit stays on screen below it
  await page.setViewportSize({ width: 844, height: 390 });
  await page.waitForTimeout(300);
  assert.ok(await page.evaluate(() => { const m = document.querySelector('.mark__on-dark').getBoundingClientRect(), c = document.querySelector('.hero__film').getBoundingClientRect();
    return m.top > innerHeight / 2 && m.bottom <= c.top && c.bottom <= innerHeight; }), 'landscape phone: title low, credit on screen');
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.waitForTimeout(300);
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
    assert.notEqual(await page.evaluate(() => document.documentElement.style.getPropertyValue('--bg-now')), '#0b0a08', `${name}: brand colour shows`);
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

  const heatAt = () => page.evaluate(() => +document.querySelector('.mk-rise').getAttribute('width'));
  const heatHigh = await heatAt();
  await page.locator('.nav-toggle').click(); // the sections live in the full-screen menu at every width
  assert.ok(await page.locator('.nav a[href="#ip"]').isVisible(), 'Menu opens the sections');
  await page.locator('.nav a[href="#ip"]').click();
  await page.waitForTimeout(2600);
  const gap = await page.evaluate(() => Math.abs(scrollY - document.getElementById('ip').offsetTop));
  assert.ok(gap < 40, `nav jumps to IP (off by ${gap}px)`);
  assert.ok(!(await page.locator('.nav a[href="#ip"]').isVisible()), 'the menu closes after the jump');
  assert.equal(await page.locator('.nav a.is-on').textContent(), 'IP', 'IP lit');
  assert.ok(await heatAt() > heatHigh, "docked, the logo's mercury rises with the page");
  await page.locator('.nav-toggle').click();
  await page.waitForTimeout(700);
  assert.ok(await page.evaluate(() => { const r = document.querySelector('.nav__reel').getBoundingClientRect(), s = getComputedStyle(document.querySelector('.nav'), '::before');
    return r.width >= innerWidth - 1 && r.height >= innerHeight - 1 && s.backgroundImage.includes('gradient'); }), 'the menu: the reel fills the screen behind a dark scrim');
  assert.ok(await page.evaluate(() => document.querySelector('.nav__reel').paused === document.querySelector('.hero__video').paused), 'the reel behind the menu holds when the showreel is paused');
  assert.ok(await page.evaluate(() => {
    const own = [...document.querySelectorAll('.nav__foot a')].map((a) => a.href), contact = [...document.querySelectorAll('#contact .closing__mail, #contact .row:first-child a')].map((a) => a.href);
    const foot = document.querySelector('.nav__foot').getBoundingClientRect(), list = document.querySelector('.nav a[href="#directors"]').getBoundingClientRect();
    return JSON.stringify(own) === JSON.stringify(contact) && foot.left > list.right && foot.right <= innerWidth;
  }), "the menu's second column holds the Contact section's own details, and nothing else");
  assert.ok(await page.evaluate(() => { const m = getComputedStyle(document.querySelector('.nav a.is-on'), '::before');
    return m.opacity === '1' && m.backgroundImage.includes('b52024'); }), "the thermometer's red mercury marks IP in the menu");
  await page.keyboard.press('Escape');
  await page.waitForTimeout(600);
  await page.locator('.ip-row__ads a[data-film="spotify-laddoo"]').click();
  assert.match(await page.locator('.lb__media iframe').getAttribute('src'), /Ll9335RK9R0/, 'IP links open the film');
  await page.keyboard.press('Escape');
  await page.locator('.lb__media iframe').waitFor({ state: 'detached', timeout: 5000 });

  // the gold About: no gold bar slicing the gold type (the type fades out into the gold, with no edge); the brief and Menu block in black
  await page.evaluate(() => { const y = document.getElementById('about').offsetTop + innerHeight * 0.25; lenis ? lenis.scrollTo(y, { immediate: true }) : scrollTo(0, y); });
  await page.waitForTimeout(1300);
  assert.ok(await page.evaluate(() => { const f = getComputedStyle(document.querySelector('.chrome'), '::before');
    return document.body.classList.contains('tone-light') && f.opacity === '1' && /rgba\(\d+, \d+, \d+, 0\)\)$/.test(f.backgroundImage)
      && getComputedStyle(document.querySelector('.chrome'), '::after').backgroundColor === 'rgba(0, 0, 0, 0)' // no fill, so no hard foot
      && getComputedStyle(document.querySelector('.chrome .brief')).backgroundColor === 'rgb(11, 10, 8)'; }),
    'gold About: no gold bar edge over the gold type (the bar fades out to clear), the brief and Menu block in black');
  // a fast jump into the gold About and out again (up to IP, down to Contact): on every frame of the 0.9 s colour change the bar is the
  // page's own colour, and on gold it is the fade from its first frame, so no band of the old colour and no half-clear bar over the type
  for (const [to, light] of [['ip', false], ['about', true], ['contact', false], ['about', true]]) {
    const { bad, shades } = await page.evaluate(([to, light]) => new Promise((done) => {
      const about = document.getElementById('about'), top = about.getBoundingClientRect().top + scrollY;
      const y = { ip: top - innerHeight * 0.75, contact: top + about.offsetHeight - innerHeight * 0.25,
        about: document.getElementById('about-title').getBoundingClientRect().top + scrollY - 40 }[to]; // about: the headline under the bar
      lenis ? lenis.scrollTo(y, { immediate: true }) : scrollTo(0, y);
      const c = document.querySelector('.chrome'), bad = [], seen = new Set(), t0 = performance.now();
      (function check() {
        if (document.body.classList.contains('tone-light') === light) {
          const page = getComputedStyle(document.body).backgroundColor, fill = getComputedStyle(c, '::after'), fade = getComputedStyle(c, '::before');
          const fadeTop = (/^linear-gradient\((rgba?\([^)]*\))/.exec(fade.backgroundImage) || [])[1];
          seen.add(page);
          if (light ? fill.backgroundColor !== 'rgba(0, 0, 0, 0)' : fill.opacity !== '1' || fill.backgroundColor !== page) bad.push(`bar ${fill.backgroundColor} at ${fill.opacity} on ${page}`);
          if (light ? fade.opacity !== '1' || fadeTop !== page : fade.opacity !== '0') bad.push(`fade ${fadeTop} at ${fade.opacity} on ${page}`);
        }
        if (performance.now() - t0 < 1100) requestAnimationFrame(check); else done({ bad: bad.slice(0, 3), shades: seen.size });
      })();
    }), [to, light]);
    assert.deepEqual(bad, [], `jump to ${to}: the bar is the page's own colour on every frame of the change`);
    assert.ok(shades > 3, `jump to ${to}: the check bites (it saw the colour change, ${shades} shades)`);
  }
  // ...and at the client's screen and every laptop width, the headline scrolled up through the chrome in 6px steps is never cut by the
  // block or the docked logo: where it reaches them it has already dissolved into the solid gold at the top of the fade. On laptops it
  // does pass under the block's columns, which is what clipped it mid-letter ("bran" + block) before the fade covered these widths
  for (const [width, height] of [[1880, 890], [1536, 864], [1440, 900], [1366, 768], [1280, 720]]) {
    await page.setViewportSize({ width, height });
    await page.evaluate(() => { const r = document.getElementById('about-title').getBoundingClientRect(), y = r.top + scrollY - innerHeight * 0.4; lenis ? lenis.scrollTo(y, { immediate: true }) : scrollTo(0, y); });
    await page.waitForTimeout(1300);
    const cut = [];
    let under = 0;
    for (let top = 140; top >= -120; top -= 6) {
      const r = await page.evaluate((top) => new Promise((done) => {
        const h = document.getElementById('about-title'), y = h.getBoundingClientRect().top + scrollY - top;
        lenis ? lenis.scrollTo(y, { immediate: true }) : scrollTo(0, y);
        requestAnimationFrame(() => {
          const c = document.querySelector('.chrome'), f = getComputedStyle(c, '::before'), fade = /calc\(100% - ([\d.]+)px\)/.exec(f.backgroundImage);
          const solid = f.opacity === '1' && fade ? c.getBoundingClientRect().top + parseFloat(f.height) - parseFloat(fade[1]) : -Infinity; // the type is hidden above this
          const rg = document.createRange(); rg.selectNodeContents(h);
          const lines = [...rg.getClientRects()], hits = (b, from) => lines.some((l) => l.right > b.left && l.left < b.right && Math.max(l.top, from) < b.bottom && l.bottom > b.top);
          const act = document.querySelector('.chrome__act').getBoundingClientRect(), mark = document.querySelector('.mark__on-dark').getBoundingClientRect();
          done({ cut: hits(act, solid) || hits(mark, solid), under: hits(act, -Infinity) });
        });
      }), top);
      if (r.cut) cut.push(top);
      under += r.under;
    }
    assert.deepEqual(cut, [], `${width}x${height}: the gold About headline is never cut by the block or the logo (headline top at ${cut.join(', ')})`);
    if (width < 1700) assert.ok(under > 0, `${width}x${height}: the check bites (the headline passes under the block's columns)`);
  }
  for (const [width, height] of [[1880, 890], [1366, 768]]) {
    await page.setViewportSize({ width, height });
    await page.waitForTimeout(300);
    assert.deepEqual(await handoffHits(page), [], `${width}x${height}: no credit line under the logo or in the bar as the hero hands over to Work`);
  }
  await page.setViewportSize({ width: 1440, height: 900 });

  await page.goto(`${BASE}?again`, { waitUntil: 'commit' });
  await opened(page);
  await page.mouse.click(400, 300);
  assert.equal(await page.locator('.opening').count(), 0, 'a click skips the opening');
  await page.goto(`${BASE}?shared#spotify-lights`, { waitUntil: 'domcontentloaded' }); // 'load' would wait for the YouTube player too
  assert.equal(await page.locator('.opening').count(), 0, 'links skip the opening');
  assert.match(await page.locator('.lb__media iframe').getAttribute('src'), /LxK1G7hnbZE/, 'deep link opens its film');
  await page.goto(`${BASE}iteration-3/?old#spotify-lights`, { waitUntil: 'domcontentloaded' });
  await page.waitForURL((u) => !u.pathname.includes('iteration-3'), { timeout: 10000, waitUntil: 'commit' }); // 'load' would wait for the YouTube player
  assert.match(await page.locator('.lb__media iframe').getAttribute('src'), /LxK1G7hnbZE/, 'old /iteration-3/ links forward, film and all');

  // phone
  const phone = await browser.newPage({ viewport: { width: 375, height: 812 } });
  await phone.goto(BASE, { waitUntil: 'commit' });
  await opened(phone);
  await phone.locator('.opening').waitFor({ state: 'detached', timeout: 6000 });
  assert.ok(await phone.evaluate(() => document.documentElement.scrollWidth <= innerWidth), 'no sideways scroll on a phone');
  assert.ok(await phone.locator('.chrome .brief').isVisible(), 'Email a brief visible on phone');
  assert.equal(await phone.evaluate(() => getComputedStyle(document.querySelector('.field')).display), 'none', 'phone: no side cutouts (no edge for them)');
  assert.ok(await phone.evaluate(() => {
    const screen = document.querySelector('.hero__screen').getBoundingClientRect(), brief = document.querySelector('.chrome .brief').getBoundingClientRect();
    return brief.bottom <= screen.top + 1 && screen.left >= 0 && screen.right <= innerWidth + 1 && screen.bottom <= innerHeight;
  }), 'Email a brief sits in the top bar, clear of the whole montage');
  // the phone's first screen is mostly film: a tall crop under the chrome, every cut's faces whole and clear of the logo standing over
  // its foot, the credit under it, and no empty band of flat colour
  for (const [width, height] of [[375, 812], [390, 844], [360, 640], [430, 932]]) {
    await phone.setViewportSize({ width, height });
    await phone.waitForTimeout(300);
    const m = await phone.evaluate(() => {
      const s = document.querySelector('.hero__screen').getBoundingClientRect(), mark = document.querySelector('.mark__on-dark').getBoundingClientRect();
      const c = document.querySelector('.hero__film').getBoundingClientRect(), bar = document.querySelector('.chrome').getBoundingClientRect();
      const b = document.querySelector('.chrome .brief').getBoundingClientRect();
      return { film: s.width * s.height / (innerWidth * innerHeight), full: Math.abs(s.width - innerWidth) < 1 && Math.abs(s.top - bar.bottom) < 1,
        logo: Math.abs(mark.bottom - s.bottom) <= 8, credit: c.top >= s.bottom - 1 && c.bottom <= innerHeight, below: innerHeight - c.bottom,
        brief: b.top >= 0 && b.bottom <= s.top + 1 && b.right <= innerWidth };
    });
    assert.ok(m.full && m.film >= 0.55, `${width}x${height}: the film fills the first screen under the chrome (${Math.round(m.film * 100)}%)`);
    assert.ok(m.logo && m.credit && m.brief, `${width}x${height}: the logo stands on the film's foot, the credit under it, Email a brief in the bar`);
    assert.ok(m.below <= 0.12 * height, `${width}x${height}: no empty band of flat colour under the credit (${Math.round(m.below)}px)`);
    assert.deepEqual(await faceCheck(phone, ALL, { sides: true, top: true }), [], `${width}x${height}: every face whole and clear of the logo, on all 15 cuts`);
  }
  // the first scroll: the logo docks without ever touching the credit under it, measured on every painted frame, scrolling down and back
  // up in 3px steps and in small wheel ticks; it never comes closer than it stands at rest (before, the credit slid up into it)
  const creditGap = `() => { // px from the logo's foot down to the nearest credit word beneath it (box to box)
    const m = document.querySelector('.mark__on-dark').getBoundingClientRect();
    let gap = Infinity;
    for (const el of document.querySelectorAll('.hero__brand, .hero__title, .hero__by, .hero__pause')) {
      const rg = document.createRange(); rg.selectNodeContents(el);
      for (const r of rg.getClientRects()) if (r.right > m.left && r.left < m.right) gap = Math.min(gap, r.top - m.bottom);
    }
    return gap;
  }`;
  for (const [width, height] of [[390, 844], [360, 640], [430, 932]]) {
    await phone.setViewportSize({ width, height });
    await phone.evaluate(() => (lenis ? lenis.scrollTo(0, { immediate: true }) : scrollTo(0, 0)));
    await phone.waitForTimeout(400);
    const steps = await phone.evaluate(async (fn) => { // each step measured on the frame that paints it
      const gap = eval(fn), out = [], frame = () => new Promise((r) => requestAnimationFrame(() => r(gap())));
      const to = (y) => (lenis ? lenis.scrollTo(y, { immediate: true }) : scrollTo(0, y));
      out.push(await frame());
      for (let y = 0; y <= 300; y += 3) { to(y); out.push(await frame()); }
      for (let y = 300; y >= 0; y -= 3) { to(y); out.push(await frame()); }
      return out;
    }, creditGap);
    // wheel frames are read just after each frame renders: inside a rAF, Lenis may already have moved the page for this frame while the
    // scroll timeline that docks the logo still holds the frame's start, a state that is never painted
    await phone.evaluate((fn) => { const gap = eval(fn); window.__gaps = []; window.__rec = true; const t = () => { if (!__rec) return; setTimeout(() => __gaps.push(gap())); requestAnimationFrame(t); }; requestAnimationFrame(t); }, creditGap);
    await phone.mouse.move(width / 2, height / 2);
    for (const d of [...Array(10).fill(24), 0, ...Array(10).fill(-24)]) { await phone.mouse.wheel(0, d); await phone.waitForTimeout(d ? 50 : 900); }
    await phone.waitForTimeout(900);
    const wheel = await phone.evaluate(() => { window.__rec = false; return __gaps; });
    const rest = steps[0], min = Math.min(...steps, ...wheel);
    assert.ok(rest > 0 && wheel.length > 20 && min >= rest - 1, `${width}x${height}: the docking logo never closes on the credit (at rest ${rest.toFixed(1)}px, closest ${min.toFixed(1)}px)`);
    assert.deepEqual(await handoffHits(phone), [], `${width}x${height}: no credit line under the logo or in the bar as the hero hands over to Work`);
  }
  await phone.setViewportSize({ width: 375, height: 812 });
  await phone.evaluate(() => (lenis ? lenis.scrollTo(0, { immediate: true }) : scrollTo(0, 0)));
  await phone.waitForTimeout(300);
  assert.match(await phone.evaluate(() => document.querySelector('.hero__video').currentSrc), /montage\.mp4$/, 'phone plays the 720p cut, at its own sharpness');
  assert.ok(await phone.evaluate(() => { const name = document.querySelector('.hero__brand').textContent;
    const work = [...document.querySelectorAll('main [data-bg]')].find((s) => s.querySelector(':scope > .huge')?.textContent === name);
    return document.getElementById('top').dataset.bg === work.dataset.bg; }), "phone: the field under the film is the client's Work colour");
  await phone.evaluate(() => (lenis ? lenis.scrollTo(innerHeight * 0.4, { immediate: true }) : scrollTo(0, innerHeight * 0.4)));
  await phone.waitForTimeout(400);
  assert.ok(await phone.evaluate(() => document.querySelector('.hero__film').getBoundingClientRect().top
    >= document.querySelector('.hero__screen').getBoundingClientRect().bottom - 1), 'phone: the credit never slides over the film on scroll');
  await phone.evaluate(() => (lenis ? lenis.scrollTo(0, { immediate: true }) : scrollTo(0, 0)));
  await phone.waitForTimeout(300);
  assert.ok(!(await phone.locator('#nav a[href="#about"]').isVisible()), 'phone menu starts closed');
  await phone.locator('.nav-toggle').click();
  assert.ok(await phone.locator('#nav a[href="#about"]').isVisible(), 'phone menu opens full-screen');
  await phone.waitForTimeout(600);
  assert.ok(await phone.evaluate(() => { const f = document.querySelector('.nav__foot').getBoundingClientRect(), last = document.querySelector('.nav a[href="#contact"]').getBoundingClientRect();
    return f.top >= last.bottom && f.right <= innerWidth && f.bottom <= innerHeight && !document.querySelector('.nav__reel').paused; }), 'phone menu: the Contact details under the list, on screen, the reel running behind');
  await phone.locator('#nav a[href="#about"]').click();
  await phone.waitForTimeout(700);
  assert.ok(!(await phone.locator('#nav a[href="#about"]').isVisible()), 'phone menu closes after a jump');
  await phone.evaluate(() => { const y = document.getElementById('about').offsetTop + innerHeight * 0.4; lenis ? lenis.scrollTo(y, { immediate: true }) : scrollTo(0, y); });
  await phone.waitForTimeout(1500);
  assert.ok(await phone.evaluate(() => { const c = document.querySelector('.chrome'), f = getComputedStyle(c, '::before');
    return document.body.classList.contains('tone-light') && f.opacity === '1' && /rgba\(\d+, \d+, \d+, 0\)\)$/.test(f.backgroundImage)
      && getComputedStyle(c, '::after').backgroundColor === 'rgba(0, 0, 0, 0)'; }),
    'phone gold About: the type fades out under the docked logo, with no gold bar edge');

  assert.deepEqual(errors, [], 'console errors');
  await browser.close();
  console.log('smoke: all checks passed');
})().catch((e) => { console.error(e.message); process.exit(1); });
