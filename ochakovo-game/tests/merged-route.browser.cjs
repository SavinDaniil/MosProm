/* Integration check for the mosv3 engineering episode and the shared route. */
const assert = require('node:assert/strict');
const { chromium } = require(process.env.PLAYWRIGHT_MODULE || 'playwright');
const base = process.env.GAME_URL || 'http://127.0.0.1:4199';

(async () => {
  const browser = await chromium.launch({ headless: true,
    ...(process.env.BROWSER_PATH ? { executablePath: process.env.BROWSER_PATH } : {}),
    args: ['--no-sandbox'] });
  const errors = [];
  try {
    const context = await browser.newContext({ viewport: { width: 1440, height: 1000 }, reducedMotion: 'reduce' });
    const page = await context.newPage();
    page.on('pageerror', e => errors.push(e.message));
    page.on('response', r => { if (r.status() >= 400) errors.push(`${r.status()} ${r.url()}`); });
    const click = a => page.locator(`[data-es="${a}"]`).first().click();
    const step = async id => assert.equal(await page.locator('.es').getAttribute('data-step'), id);
    const next = async () => { await page.locator('.es-actions [data-es="next"]').waitFor(); await click('next'); };
    await page.goto(base + '/#mission/engineering');
    await page.locator('.es').waitFor();
    await click('next');
    for (const a of ['guides', 'sensor', 'motor']) {
      await click(a);
      assert.equal(await page.locator(`[data-es="${a}"]`).getAttribute('aria-pressed'), 'true');
      assert.equal(await page.locator('.es-object-popover').count(), 1);
    }
    await page.reload();
    await step('tour');
    await next(); await click('formatA'); await step('order');
    await click('formatB'); await step('order'); await next();
    await click('baseline'); await next();
    await click('motor'); await step('locate'); await click('guides'); await next();
    await click('prepare'); await click('kitA'); await step('tooling');
    await click('kitB'); await next(); await click('install'); await next();
    await click('gap'); await step('gap');
    await page.locator('.es-slider input').fill('4'); await click('gap'); await next();
    await click('drive'); await step('chain');
    for (const a of ['sensor', 'controller', 'drive']) await click(a);
    await next(); await click('recipeA'); await step('recipe');
    await click('recipeB'); await next(); await click('dry'); await next();
    await click('test');
    await page.locator('.es-actions [data-es="next"]').waitFor();
    assert.equal(await page.locator('.es-counter').textContent(), '3 / 3');
    await next();
    for (const a of ['can0', 'can1', 'can2']) await click(a);
    await next(); await click('recordBad'); await step('record');
    await click('recordGood'); await next(); await step('finish');
    await click('journal');
    assert.equal(await page.locator('.es-journal-row.done').count(), 4);
    await page.locator('dialog [data-es="close"]').last().click();
    await click('complete'); await page.waitForURL('**#complete/engineering');
    await page.reload();
    assert.match(await page.locator('#main').innerText(), /1 из 5/);
    console.log('PASS engineering: complete flow, wrong choices, reload, contextual hints, journal, passport');

    for (const width of [1440, 390]) {
      await page.setViewportSize({ width, height: 900 });
      for (const [route, selector] of [
        ['mission/intro', '.chronicle-chapters'], ['mission/lab', '.ls-intro'],
        ['mission/engineering', '.es'], ['mission/line', '.floor-game--line'],
        ['mission/warehouse', '.floor-game--warehouse'], ['map', '.map-board'],
        ['discoveries', '.discoveries-list'], ['careers', '.section-title']
      ]) {
        await page.goto(`${base}/#${route}`);
        await page.locator(selector).first().waitFor();
        await page.evaluate(() => document.fonts.ready);
        assert.equal(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), true, `${width} ${route}: overflow`);
      }
      console.log(`PASS ${width}px: history, laboratory, engineering, bottling, warehouse, map, passport, careers`);
    }
    await page.goto(base + '/laboratory.html');
    await page.locator('.ls-intro').waitFor();
    assert.deepEqual(errors, []);
    console.log('PASS standalone laboratory; no JavaScript or HTTP errors');
    await context.close();
  } finally { await browser.close(); }
})().catch(e => { console.error(e); process.exitCode = 1; });
