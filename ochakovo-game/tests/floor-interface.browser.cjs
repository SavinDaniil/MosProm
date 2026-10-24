/* Run with a local dist server. PLAYWRIGHT_MODULE / BROWSER_PATH are optional. */
const assert=require('node:assert/strict');
const path=require('node:path');
const fs=require('node:fs');
const {chromium}=require(process.env.PLAYWRIGHT_MODULE||'playwright');
const base=process.env.GAME_URL||'http://127.0.0.1:4176';
const output=path.resolve(__dirname,'../output/reference-ui-qa');
(async()=>{
 fs.mkdirSync(output,{recursive:true});
 const browser=await chromium.launch({headless:true,...(process.env.BROWSER_PATH?{executablePath:process.env.BROWSER_PATH}:{}),args:['--no-sandbox']});
 const errors=[];
 try{
 for(const width of [1440,390]){
  const context=await browser.newContext({viewport:{width,height:900},reducedMotion:'reduce'});
  const page=await context.newPage();page.on('pageerror',error=>errors.push(error.message));
  const click=async(action,value)=>{const selector=`[data-do="floor-${action}"]${value===undefined?'':`[data-value="${value}"]`}`;await page.locator(selector).filter({visible:true}).first().click();};
  const shot=async(name)=>{await page.evaluate(()=>document.fonts.ready);assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),true,`${width} ${name}: horizontal overflow`);await page.screenshot({path:path.join(output,`${width}-${name}.png`),fullPage:true});};
  const phase=async(n)=>assert.equal(await page.locator('[data-floor-phase]').getAttribute('data-floor-phase'),String(n));
  const fields=async()=>{for(const field of ['brand','format','batch'])await click('field',field);};
  await page.goto(base+'/#mission/line');await page.waitForSelector('.floor-game');await shot('line-start');
  await click('journal');assert.match(await page.locator('.floor-journal').innerText(),/Здесь появятся/);await page.keyboard.press('Escape');assert.equal(await page.locator('.floor-journal').count(),0);
  await click('why');assert.equal(await page.locator('.floor-why-copy').count(),1);await click('why');
  await click('open-sample','У-16');await fields();await phase(0);assert.match(await page.locator('.floor-instruction').innerText(),/не совпадает/);await click('close');
  await click('open-sample','У-17');await shot('line-label');
  if(width<801){await click('paper');assert.equal(await page.locator('.floor-clipboard').isVisible(),true);await click('paper');}
  await fields();await click('sample','У-17');await phase(1);await shot('line-route');
  for(const station of ['fill','cap','label','pack'])await click('station',station);
  await phase(2);await shot('line-bottles');
  for(const id of ['B-01','B-02','B-03','B-04']){await click('open-bottle',id);for(const part of ['cap','level','code'])await click('lens',id+':'+part);if(id==='B-02')await shot('line-inspection');await click('decide',id+':'+(id==='B-01'?'pass':'review'));}
  await phase(3);await shot('line-incident');await click('log');await click('response','mentor');await phase(4);await shot('line-engineer');await click('trial');await click('release','separate');await phase(5);await shot('line-packing');
  for(const id of ['B-01','B-05','B-06'])await click('pack',id);await click('handoff');assert.equal(await page.locator('.floor-finished').count(),1);await shot('line-done');
  await click('journal');assert.match(await page.locator('.floor-journal').innerText(),/Упаковка передана складу/);await page.keyboard.press('Escape');
  await page.reload();await page.waitForSelector('.floor-finished');
  await page.goto(base+'/#mission/warehouse');await page.waitForSelector('.floor-game--warehouse');await shot('warehouse-start');await click('open-carton','CC-01');assert.equal(await page.locator('.floor-callout').count(),0);assert.equal(await page.locator('[data-do="floor-receipt"]').isDisabled(),true);await shot('warehouse-label');
  if(width<801){await click('paper');assert.equal(await page.locator('.floor-clipboard').isVisible(),true);await click('paper');}
  await fields();assert.equal(await page.locator('.floor-receipt-row[aria-pressed="true"]').count(),3);await shot('warehouse-label-checked');await click('receipt');await phase(1);await shot('warehouse-receiving');
  for(const [id,zone] of [['CC-01','A'],['CC-02','B'],['FA-01','C'],['KV-01','C'],['FA-02','Q'],['FA-03','C']]){await click('open-carton',id);await click('scan',id);await click('inspect',id);if(id==='FA-02'){await shot('warehouse-damage');await click('report','tear');}await click('place',id+':'+zone);}
  await phase(2);await shot('warehouse-order');for(const id of ['CC-02','FA-01','FA-03'])await click('pick',id);await click('verify');assert.match(await page.locator('.floor-instruction').innerText(),/не совпал|Расхожд|не совпадает/);await click('pick','CC-02');await click('pick','CC-01');await click('verify');assert.equal(await page.locator('[data-do="floor-handoff"]').isEnabled(),true);await click('pick','KV-01');assert.equal(await page.locator('[data-do="floor-handoff"]').isDisabled(),true);await click('pick','KV-01');await click('verify');await click('handoff');await shot('warehouse-done');
  await page.reload();await page.waitForSelector('.floor-finished');await click('journal');assert.match(await page.locator('.floor-journal').innerText(),/Заказ передан/);await click('ask-reset');await click('cancel-reset');assert.equal(await page.locator('.floor-journal').count(),1);await page.keyboard.press('Escape');
  await page.goto(base+'/#map');await page.waitForSelector('.topbar',{state:'visible'});assert.equal(await page.locator('body').evaluate(el=>el.classList.contains('floor-active')),false);
  console.log(`PASS ${width}px: both episodes, journal, explanations, errors, persistence and navigation`);await context.close();
 }
 assert.deepEqual(errors,[]);console.log('No browser errors. Screenshots: '+output);
 }finally{await browser.close();}
})().catch(error=>{console.error(error);process.exitCode=1;});
