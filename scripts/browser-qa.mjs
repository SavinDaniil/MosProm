import {createRequire} from 'node:module';
import {mkdir,writeFile} from 'node:fs/promises';
import {existsSync} from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
if(existsSync('.browsers')&&!process.env.PLAYWRIGHT_BROWSERS_PATH)process.env.PLAYWRIGHT_BROWSERS_PATH=path.resolve('.browsers');
const require=createRequire(import.meta.url),{chromium,webkit}=require('playwright');
const output=path.resolve('output/playwright');await mkdir(output,{recursive:true});
const url=process.env.QA_URL??'http://127.0.0.1:5173/';
const report={date:'2026-10-22',revision:'adaptive-documents-and-tablet-layout',url,engines:[],branches:[],errors:[]};
const key='ochakovo-smena-a-v1';
const state=p=>p.evaluate(k=>JSON.parse(localStorage.getItem(k)),key);
const shot=(p,name)=>p.screenshot({path:path.join(output,name+'.png'),animations:'disabled',scale:'css'});
const nav=(p,name)=>{const v=p.viewportSize();if(v.width>760&&v.height>550&&['Пропуск','Заявка'].includes(name))name='Пропуск и заявка';return p.getByRole('navigation',{name:'Предметы на столе'}).getByRole('button',{name,exact:true});};
const act=(locator,mobile)=>mobile?locator.tap():locator.click();
async function fit(p,label){
  await p.locator('.paper').evaluateAll(async nodes=>{await Promise.all(nodes.flatMap(x=>x.getAnimations()).map(a=>a.finished.catch(()=>{})));});
  const data=await p.evaluate(()=>{
    const shown=x=>x.getBoundingClientRect().width>0&&x.getBoundingClientRect().height>0;
    const bounds=x=>{const r=x.getBoundingClientRect();return{x:r.x,y:r.y,right:r.right,bottom:r.bottom,w:r.width,h:r.height};};
    const regions=[...document.querySelectorAll('.window-scene,.dialogue-zone,.desk,.control-panel,.paper')].filter(shown).map(x=>({cls:x.className,...bounds(x)}));
    const overflows=[...document.querySelectorAll('.paper,.paper-holder,.page-copy,.document-slot,.document-tabs,.tab-row,.single-sheet')].filter(shown).filter(x=>x.scrollHeight>x.clientHeight+2||x.scrollWidth>x.clientWidth+2).map(x=>({cls:x.className,client:[x.clientWidth,x.clientHeight],scroll:[x.scrollWidth,x.scrollHeight]}));
    const clipped=[],overlaps=[];
    for(const paper of document.querySelectorAll('.paper')){if(!shown(paper))continue;const r=paper.getBoundingClientRect();for(const x of paper.querySelectorAll('h1,h2,h3,p,strong,.field,.signature,.paper-pager,.interest-options,button,a')){if(!shown(x))continue;const b=x.getBoundingClientRect();if(b.x<r.x-2||b.right>r.right+2||b.y<r.y-2||b.bottom>r.bottom+2)clipped.push({text:x.textContent.trim().slice(0,70),...bounds(x),paper:bounds(paper)});}}
    for(const paper of document.querySelectorAll('.paper')){const pager=paper.querySelector('.paper-pager');if(!pager||!shown(pager))continue;const top=pager.getBoundingClientRect().top;for(const x of paper.querySelectorAll('.page-copy h3,.page-copy p,.page-copy .field,.page-copy .news-date')){if(shown(x)&&x.getBoundingClientRect().bottom>top+1)overlaps.push(x.textContent.trim().slice(0,70));}}
    const controls=[...document.querySelectorAll('.decision,.primary,.field,.doc-tab,.paper-pager button,.interest-options button')].filter(shown).map(x=>({text:x.textContent.trim().slice(0,30),...bounds(x)}));
    const rows=[...document.querySelectorAll('.tab-row')].filter(x=>getComputedStyle(x).display==='flex').map(row=>[...row.children].map(x=>bounds(x).w));
    return{w:innerWidth,h:innerHeight,sw:document.documentElement.scrollWidth,sh:document.documentElement.scrollHeight,regions,overflows,clipped,overlaps,controls,rows};
  });
  assert(data.sw<=data.w&&data.sh<=data.h,label+' page overflow');
  assert.equal(data.overflows.length,0,label+' internal scrolling: '+JSON.stringify(data.overflows));
  assert.equal(data.clipped.length,0,label+' clipped content: '+JSON.stringify(data.clipped));
  assert.equal(data.overlaps.length,0,label+' pager overlaps text: '+JSON.stringify(data.overlaps));
  for(const r of data.regions)assert(r.x>=0&&r.y>=0&&r.right<=data.w+2&&r.bottom<=data.h+2,label+' outside viewport '+r.cls);
  for(const b of data.controls)assert(b.h>=44&&b.w>=44,label+' target too small '+b.text+' '+b.w+'x'+b.h);
  for(const row of data.rows)assert(Math.max(...row)-Math.min(...row)<1,label+' uneven tabs');
}
async function onboard(p,mobile,check=false){
  await act(p.getByRole('button',{name:'Приступить к смене',exact:true}),mobile);
  if(check)await fit(p,'rules first page');
  const nextRules=p.getByRole('button',{name:'Следующий лист',exact:true});
  if(await nextRules.count())await act(nextRules,mobile);
  assert.match(await p.locator('.rules-paper').innerText(),/Запросов нет/);
  if(check)await fit(p,'rules second page');
  await act(nav(p,'Журнал'),mobile);
  if(check)await fit(p,'briefing journal');
  await act(p.getByRole('button',{name:'К утренней газете',exact:true}),mobile);
  assert.match(await p.locator('.newspaper').innerText(),/18 декабря 1978/);
  if(check)await fit(p,'newspaper first page');
  const nextNews=p.getByRole('button',{name:'Следующий лист',exact:true});
  if(await nextNews.count())await act(nextNews,mobile);
  if(check)await fit(p,'newspaper second page');
  if(check){const v=p.viewportSize();await shot(p,`${p.context().browser().browserType().name()}-${v.width}x${v.height}-newspaper`);}
  await act(p.getByRole('button',{name:'Первый посетитель',exact:true}),mobile);
}
async function finishEngineer(p,mobile,decision='allow',optional=false){
  if(optional){await act(p.locator('[data-action="request"]'),mobile);assert.match(await p.locator('.response-paper').innerText(),/ответственным инженером/);}
  await act(p.locator(`[data-decision="${decision}"]`),mobile);
  assert.equal((await state(p)).results[0].correct,decision==='allow');
  await act(p.getByRole('button',{name:'О работе',exact:true}),mobile);
  assert.equal(await p.locator('.character').count(),0,'visitor must not reappear in profession');
  await act(p.getByRole('button',{name:/Как проверяют качество напитков/}),mobile);
}
for(const [engineName,engine] of [['chromium',chromium],['webkit',webkit]]){
  let browser;try{browser=await engine.launch({headless:true});}catch(e){report.errors.push({engineName,error:String(e)});continue;}
  const entry={name:engineName,version:browser.version(),viewports:[]};report.engines.push(entry);
  for(const [width,height] of [[844,390],[360,800],[390,844],[430,932],[1154,752],[1024,768],[1180,820],[1024,667],[1366,768],[1440,1000],[1920,1080]]){
    const mobile=width<1000,tag=`${engineName}-${width}x${height}`;
    const ctx=await browser.newContext({viewport:{width,height},isMobile:mobile,hasTouch:mobile,deviceScaleFactor:1});
    const p=await ctx.newPage();p.setDefaultTimeout(6000);const errors=[];
    p.on('pageerror',e=>errors.push(e.message));p.on('console',m=>{if(m.type()==='error')errors.push(m.text());});
    await p.addInitScript(()=>{window.departureStarts=[];document.addEventListener('animationstart',e=>{if(e.animationName==='visitor-leave')window.departureStarts.push(performance.now());});});
    try{
      await p.goto(url);await fit(p,tag+' welcome');await shot(p,tag+'-welcome');
      assert.equal(await p.locator('.shift-label,.app-footer,.desk-edge').count(),0);
      assert(!/[·●]/.test(await p.locator('body').innerText()));
      await act(p.getByRole('button',{name:'Об игре',exact:true}),mobile);await fit(p,tag+' about');
      await p.keyboard.press('Escape');assert.equal(await p.getByRole('dialog').count(),0);
      await act(p.getByRole('button',{name:'Включить звук',exact:true}),mobile);await act(p.getByRole('button',{name:'Выключить звук',exact:true}),mobile);
      await onboard(p,mobile,true);
      await fit(p,tag+' pass');await shot(p,tag+'-engineer');
      for(const name of ['Памятка','Газета','Лист сверки','Заявка','Журнал','Пропуск']){await act(nav(p,name),mobile);await fit(p,tag+' '+name);}
      await act(nav(p,'Лист сверки'),mobile);const check=p.getByRole('checkbox',{name:'Совпадение зоны',exact:true});
      await act(check,mobile);assert.equal(await check.getAttribute('aria-checked'),'true');await act(check,mobile);assert.equal(await check.getAttribute('aria-checked'),'false');
      await act(nav(p,'Пропуск'),mobile);await act(p.getByRole('button',{name:'Пропуск: Разрешённая зона — Линия розлива № 2',exact:true}),mobile);
      await act(nav(p,'Заявка'),mobile);assert.match(await p.locator('.compare-bar').innerText(),/Выберите пару/);
      await act(p.getByRole('button',{name:'Заявка: Зона посещения — Линия розлива № 2',exact:true}).first(),mobile);
      assert.match(await p.locator('.compare-bar').innerText(),/Значения совпадают/);await fit(p,tag+' chosen pair');assert.equal((await state(p)).requestsLeft,3);
      await p.reload();assert.equal((await state(p)).phase,'inspection');
      await act(p.locator('[data-decision="allow"]'),mobile);await p.waitForTimeout(100);
      const starts=await p.evaluate(()=>window.departureStarts.length);assert.equal(starts,1,'one engineer departure begins');
      await fit(p,tag+' result');await act(p.getByRole('button',{name:'О работе',exact:true}),mobile);
      await p.waitForTimeout(100);assert.equal(await p.locator('.character').count(),0);assert.equal(await p.evaluate(()=>window.departureStarts.length),starts,'no second departure at profession');
      await fit(p,tag+' profession');await shot(p,tag+'-profession');
      await act(p.getByRole('button',{name:/Как проверяют качество напитков/}),mobile);
      await fit(p,tag+' technologist pass');await act(nav(p,'Заявка'),mobile);
      await act(p.getByRole('button',{name:'Заявка: Номер заявки — T-218',exact:true}).first(),mobile);await act(nav(p,'Журнал'),mobile);
      await act(p.getByRole('button',{name:'Журнал: Номер заявки — T-281',exact:true}).first(),mobile);
      assert.match(await p.locator('.compare-bar').innerText(),/Значения различаются/);await fit(p,tag+' mismatch');await shot(p,tag+'-technologist');
      await act(p.locator('[data-action="request"]'),mobile);await act(p.locator('[data-action="request"]'),mobile);
      assert.equal((await state(p)).requestsLeft,2);assert.match(await p.locator('.response-paper').innerText(),/Выдана исправленная заявка T-281/);await fit(p,tag+' department and seven tabs');
      if(width<760&&height>550)assert.equal(await p.locator('.tab-row').count(),2);
      await act(p.getByRole('button',{name:/Открыть исправленную заявку/}),mobile);await fit(p,tag+' corrected request');
      await act(p.getByRole('button',{name:'Заявка: Номер заявки — T-281',exact:true}).first(),mobile);await act(nav(p,'Журнал'),mobile);
      await act(p.getByRole('button',{name:'Журнал: Номер заявки — T-281',exact:true}).first(),mobile);assert.match(await p.locator('.compare-bar').innerText(),/Значения совпадают/);
      await act(p.locator('[data-decision="allow"]'),mobile);await act(p.getByRole('button',{name:'О работе',exact:true}),mobile);
      assert.equal(await p.locator('.character').count(),0);await fit(p,tag+' technologist profession');
      await act(p.getByRole('button',{name:/Параметры производственного процесса/}),mobile);
      assert.equal((await state(p)).phase,'complete');assert.deepEqual((await state(p)).interests,{andrey:'quality',elena:'process'});
      await fit(p,tag+' complete');await shot(p,tag+'-complete');
      await p.reload();assert(await p.getByRole('heading',{name:/Демонстрационный фрагмент завершён/}).isVisible());
      await act(p.getByRole('button',{name:/Переиграть фрагмент/}),mobile);assert.equal((await state(p)).phase,'welcome');assert.equal((await state(p)).requestsLeft,3);
      assert.equal(errors.length,0,errors.join('\n'));entry.viewports.push({width,height,passed:true,consoleErrors:errors});console.log('PASS',tag);
    }catch(e){entry.viewports.push({width,height,passed:false,error:String(e),consoleErrors:errors});await shot(p,tag+'-failure');console.error('FAIL',tag,String(e));}
    await ctx.close();
  }
  if(engineName==='chromium'){
    const ctx=await browser.newContext({viewport:{width:390,height:844},isMobile:true,hasTouch:true}),p=await ctx.newPage();p.setDefaultTimeout(6000);
    try{
      await p.goto(url);await onboard(p,true);await finishEngineer(p,true,'deny',true);assert.equal((await state(p)).requestsLeft,2);
      await act(p.locator('[data-decision="allow"]'),true);assert.match(await p.locator('.result-paper').innerText(),/до устранения противоречия/);await fit(p,'wrong decision');
      await act(p.getByRole('button',{name:'О работе',exact:true}),true);await act(p.getByRole('button',{name:/Рецептуры напитков/}),true);
      report.branches.push('optional engineer query; wrong refusal; unverified admission; interests remain separate');
      await act(p.getByRole('button',{name:/Переиграть фрагмент/}),true);await onboard(p,true);await finishEngineer(p,true);
      await p.addInitScript(k=>{if(!sessionStorage.getItem('qa-zero')){const s=JSON.parse(localStorage.getItem(k));s.requestsLeft=0;localStorage.setItem(k,JSON.stringify(s));sessionStorage.setItem('qa-zero','done');}},key);
      await p.reload();assert(await p.locator('[data-action="request"]').isDisabled());await act(p.locator('[data-decision="deny"]'),true);assert.equal((await state(p)).results[1].correct,true);
      report.branches.push('zero requests: correct refusal');
      await p.addInitScript(k=>{if(!sessionStorage.getItem('qa-corrupt')){localStorage.setItem(k,'corrupted');sessionStorage.setItem('qa-corrupt','done');}},key);await p.reload();await onboard(p,true);
      await act(nav(p,'Заявка'),true);await act(p.getByRole('button',{name:/Заявка: Номер заявки/}).first(),true);
      await p.setViewportSize({width:844,height:390});await fit(p,'orientation');assert.match(await p.locator('.compare-bar').innerText(),/И-142/);
      await p.setViewportSize({width:360,height:800});await fit(p,'orientation return');
      await act(p.getByRole('button',{name:'Начать заново',exact:true}),true);await act(p.getByRole('button',{name:'Вернуться к столу',exact:true}),true);assert.equal((await state(p)).phase,'inspection');
      await act(p.getByRole('button',{name:'Начать заново',exact:true}),true);await act(p.getByRole('button',{name:'Да, начать заново',exact:true}),true);assert.equal((await state(p)).phase,'welcome');
      report.branches.push('corrupt save; orientation and selected field; reset cancellation and confirmation');
    }catch(e){report.errors.push({branch:String(e)});await shot(p,'branch-failure');}await ctx.close();
    const blocked=await browser.newContext({viewport:{width:390,height:844}});await blocked.addInitScript(()=>{Storage.prototype.setItem=function(){throw new Error('blocked');};Storage.prototype.getItem=function(){throw new Error('blocked');};});
    const bp=await blocked.newPage();await bp.goto(url);await onboard(bp,false);await bp.locator('[data-decision="allow"]').click();assert.match(await bp.locator('.result-paper').innerText(),/Решение принято верно/);
    await bp.getByRole('button',{name:'Об игре',exact:true}).click();assert.match(await bp.getByRole('dialog').innerText(),/Хранилище недоступно/);report.branches.push('unavailable storage still playable');await blocked.close();
  }
  await browser.close();
}
await writeFile(path.join(output,'qa-report.json'),JSON.stringify(report,null,2));
const failures=report.errors.length+report.engines.flatMap(e=>e.viewports).filter(v=>!v.passed).length;
console.log(JSON.stringify({engines:report.engines.map(e=>({name:e.name,version:e.version,passed:e.viewports.filter(v=>v.passed).length})),branches:report.branches,failures},null,2));
if(failures||report.engines.length!==2)process.exitCode=1;
