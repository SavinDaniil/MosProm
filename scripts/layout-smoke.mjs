import {createRequire} from 'node:module';
import {existsSync} from 'node:fs';
import {writeFile} from 'node:fs/promises';
import path from 'node:path';
import assert from 'node:assert/strict';
if(existsSync('.browsers'))process.env.PLAYWRIGHT_BROWSERS_PATH=path.resolve('.browsers');
const {chromium}=createRequire(import.meta.url)('playwright');
const browser=await chromium.launch({headless:true});
const report={date:'2026-10-22',revision:'device-compositions',browser:browser.version(),screens:[]};
for(const [width,height,label] of [[360,800,'phone'],[1154,752,'tablet'],[1920,1080,'desktop']]){
  const ctx=await browser.newContext({viewport:{width,height},hasTouch:width<1200,isMobile:width<760});
  const p=await ctx.newPage(),errors=[];p.on('pageerror',e=>errors.push(e.message));
  const button=name=>p.getByRole('button',{name,exact:true});
  const doc=name=>p.getByRole('navigation',{name:'Предметы на столе'}).getByRole('button',{name,exact:true});
  async function fit(stage){
    await p.locator('.paper').evaluateAll(async xs=>{await Promise.all(xs.flatMap(x=>x.getAnimations()).map(a=>a.finished.catch(()=>{})))});
    const bad=await p.evaluate(()=>[...document.querySelectorAll('.paper,.page-copy,.single-sheet,.paper-holder,.document-slot')].filter(x=>x.clientWidth&&x.clientHeight&&(x.scrollHeight>x.clientHeight+2||x.scrollWidth>x.clientWidth+2)).map(x=>({cls:x.className,client:[x.clientWidth,x.clientHeight],scroll:[x.scrollWidth,x.scrollHeight]})));
    assert.deepEqual(bad,[],`${label} ${stage}`);
  }
  async function nextIfNeeded(){const b=button('Следующий лист');if(await b.count()&&await b.isEnabled())await b.click();}
  await p.goto('http://127.0.0.1:4173/');await button('Приступить к смене').click();await fit('rules');await nextIfNeeded();await fit('rules end');
  await doc('Журнал').click();await fit('journal');await button('К утренней газете').click();await fit('newspaper');await nextIfNeeded();await fit('newspaper end');
  if(label==='desktop'){assert.equal(await p.locator('.paper-pager').count(),0);await doc('Журнал').click();await fit('full journal');}
  await p.locator('.character img').evaluate(x=>x.decode());
  await p.screenshot({path:`output/playwright/layout-${label}-reference.png`,animations:'disabled',scale:'css'});
  await button('Первый посетитель').click();await fit('pass');await p.locator('.character img').evaluate(x=>x.decode());
  await p.screenshot({path:`output/playwright/layout-${label}-visitor.png`,animations:'disabled',scale:'css'});
  await p.locator('[data-decision="allow"]').click();await button('О работе').click();await fit('engineer profession');await p.getByRole('button',{name:/Как проверяют качество напитков/}).click();
  await fit('technologist pass');await p.locator('[data-action="request"]').click();await fit('response');await p.locator('[data-decision="allow"]').click();await button('О работе').click();await fit('technologist profession');
  await p.getByRole('button',{name:/Параметры производственного процесса/}).click();await fit('complete');assert.equal(errors.length,0);
  report.screens.push({width,height,label,passed:true,errors});console.log('PASS',label,width,height);await ctx.close();
}
await browser.close();await writeFile('output/playwright/layout-smoke.json',JSON.stringify(report,null,2));
