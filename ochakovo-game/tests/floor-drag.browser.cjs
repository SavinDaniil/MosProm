/* Browser regression: drag only the carton artwork; keep placement rules intact. */
const assert=require('node:assert/strict');
const {chromium}=require(process.env.PLAYWRIGHT_MODULE||'playwright');
(async()=>{
 const browser=await chromium.launch({headless:true,...(process.env.BROWSER_PATH?{executablePath:process.env.BROWSER_PATH}:{}),args:['--no-sandbox']});
 try{
  const page=await browser.newPage({viewport:{width:1440,height:900},reducedMotion:'reduce'});
  const errors=[];page.on('pageerror',e=>errors.push(e.message));
  await page.addInitScript(()=>{
   window.dragPreviews=[];
   const original=DataTransfer.prototype.setDragImage;
   DataTransfer.prototype.setDragImage=function(image,x,y){
    const canvas=document.createElement('canvas');canvas.width=image.naturalWidth;canvas.height=image.naturalHeight;
    const ctx=canvas.getContext('2d');ctx.drawImage(image,0,0);
    const pixels=ctx.getImageData(0,0,canvas.width,canvas.height).data;
    let visible=0;for(let i=3;i<pixels.length;i+=4)if(pixels[i])visible++;
    window.dragPreviews.push({width:canvas.width,height:canvas.height,cornerAlpha:[pixels[3],pixels[canvas.width*4-1],pixels[pixels.length-1]],visible,src:image.src,x,y});
    return original.call(this,image,x,y);
   };
  });
  await page.goto((process.env.GAME_URL||'http://127.0.0.1:4176')+'/#mission/warehouse');
  const click=async(action,value='')=>page.locator(`[data-do="floor-${action}"][data-value="${value}"]`).first().click();
  await click('open-carton','CC-01');for(const field of ['brand','format','batch'])await click('field',field);await click('receipt');
  const carton=()=>page.locator('[data-drag="CC-01"]');
  await carton().dragTo(page.locator('[data-drop="A"]'));
  assert.equal(await carton().count(),1,'Uninspected carton cannot be placed');
  await click('open-carton','CC-01');await click('scan','CC-01');await click('inspect','CC-01');
  await carton().dragTo(page.locator('[data-drop="B"]'));
  assert.equal(await carton().count(),1,'Wrong destination cannot accept the carton');
  await carton().dragTo(page.locator('[data-drop="A"]'));
  assert.equal(await carton().count(),0,'Checked carton can be dragged to its correct zone');
  assert.match(await page.locator('[data-drop="A"]').innerText(),/1 кор. размещено/);
  const previews=await page.evaluate(()=>window.dragPreviews);
  assert.equal(previews.length,3,'Each native drag supplies custom artwork');
  for(const preview of previews){
   assert.deepEqual(preview.cornerAlpha,[0,0,0],'Preview corners are transparent');
   assert.ok(preview.visible>3000&&preview.visible<preview.width*preview.height*.8,'Preview contains the carton, not an opaque rectangular background');
   const svg=decodeURIComponent(preview.src.split(',')[1]);assert.match(svg,/CC-01/);assert.doesNotMatch(svg,/floor-object-tag|floor-background|<image/);
   assert.ok(preview.x>=0&&preview.x<=preview.width&&preview.y>=0&&preview.y<=preview.height);
  }
  assert.deepEqual(errors,[]);
  console.log('PASS: native dragging uses transparent carton artwork; inspection and destination checks still apply.');
 }finally{await browser.close();}
})().catch(error=>{console.error(error);process.exitCode=1;});
