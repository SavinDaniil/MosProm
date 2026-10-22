import {createRequire} from 'node:module';
import path from 'node:path';
import {existsSync} from 'node:fs';
import {readdir,readFile,writeFile} from 'node:fs/promises';
import {gzipSync,brotliCompressSync} from 'node:zlib';
if(existsSync('.browsers')&&!process.env.PLAYWRIGHT_BROWSERS_PATH)process.env.PLAYWRIGHT_BROWSERS_PATH=path.resolve('.browsers');
const require=createRequire(import.meta.url);const{chromium}=require('playwright');
const browser=await chromium.launch({headless:true});
const context=await browser.newContext({viewport:{width:390,height:844},isMobile:true,hasTouch:true,deviceScaleFactor:1});
const page=await context.newPage();const cdp=await context.newCDPSession(page);
await cdp.send('Network.enable');await cdp.send('Network.setCacheDisabled',{cacheDisabled:true});
await cdp.send('Network.emulateNetworkConditions',{offline:false,latency:150,downloadThroughput:1600000/8,uploadThroughput:750000/8,connectionType:'cellular3g'});
await cdp.send('Emulation.setCPUThrottlingRate',{rate:4});
await page.goto('http://127.0.0.1:4173/',{waitUntil:'load'});
const startup=await page.evaluate(async()=>{
  await new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(r)));
  const nav=performance.getEntriesByType('navigation')[0];
  return {appReadyMs:performance.getEntriesByName('smena-interactive')[0]?.startTime,
    firstPaintMs:performance.getEntriesByName('first-contentful-paint')[0]?.startTime,
    loadEventEndMs:nav.loadEventEnd,observedReadyWithImagesMs:performance.now(),
    imagesReady:[...document.images].every(x=>x.complete&&x.naturalWidth>0),
    buttonReady:!document.querySelector('[data-action="start"]').disabled,
    resources:performance.getEntriesByType('resource').map(x=>({name:new URL(x.name).pathname,transferSize:x.transferSize,encodedBodySize:x.encodedBodySize,duration:x.duration}))};
});
const sampling=page.evaluate(()=>new Promise(resolve=>{const intervals=[];let last=performance.now();function tick(now){intervals.push(now-last);last=now;if(intervals.length<180)requestAnimationFrame(tick);else resolve(intervals.slice(1));}requestAnimationFrame(tick);}));
await page.getByRole('button',{name:'Приступить к смене',exact:true}).tap();
const intervals=await sampling;intervals.sort((a,b)=>a-b);
const files=[];
async function walk(dir){for(const entry of await readdir(dir,{withFileTypes:true})){const p=path.join(dir,entry.name);if(entry.isDirectory())await walk(p);else{const bytes=await readFile(p);files.push({file:path.relative('dist',p).replaceAll('\\','/'),bytes:bytes.length,gzip:gzipSync(bytes).length,brotli:brotliCompressSync(bytes).length});}}}
await walk('dist');
const report={date:'2026-10-22',browser:browser.version(),profile:{viewport:'390x844 CSS px',deviceScaleFactor:1,downloadMbps:1.6,uploadMbps:.75,roundTripLatencyMs:150,cpuSlowdown:4,cache:'disabled; new context',host:'Windows desktop; no physical mobile device'},startup,
  frames:{samples:intervals.length,medianIntervalMs:intervals[Math.floor(intervals.length*.5)],p95IntervalMs:intervals[Math.floor(intervals.length*.95)],meanIntervalMs:intervals.reduce((a,b)=>a+b,0)/intervals.length,approxRafHz:1000/(intervals.reduce((a,b)=>a+b,0)/intervals.length),note:'rAF cadence during intro and document appearance, not a GPU benchmark or physical-phone FPS'},
  files,totals:{rawBytes:files.reduce((n,x)=>n+x.bytes,0),gzipBytes:files.reduce((n,x)=>n+x.gzip,0),brotliBytes:files.reduce((n,x)=>n+x.brotli,0)}};
await writeFile('output/playwright/performance.json',JSON.stringify(report,null,2));
console.log(JSON.stringify(report,null,2));
await context.close();await browser.close();
