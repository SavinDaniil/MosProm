const test = require('node:test');
const assert = require('node:assert/strict');
const vm = require('node:vm');
const fs = require('node:fs');
const path = require('node:path');
const source = fs.readFileSync(path.join(__dirname, '../dist/shift-line.js'), 'utf8');
const KEY = 'ochakovo-bottling-episode-v5';

function mount({saved, denied=false, reduced=false}={}) {
  const store=new Map([['other-mission','preserve me']]);
  if(saved!==undefined)store.set(KEY,typeof saved==='string'?saved:JSON.stringify(saved));
  let builder,html='',lastFeedback='';
  const element={classList:{toggle(){}},focus(){},innerHTML:''};
  const listeners=new Map();
  const context={console,queueMicrotask,document:{hidden:false,addEventListener(n,f){listeners.set(n,f);},removeEventListener(n){listeners.delete(n);}},localStorage:{getItem(k){if(denied)throw Error('denied');return store.get(k)||null;},setItem(k,v){if(denied)throw Error('denied');store.set(k,v);}},window:{matchMedia:()=>({matches:reduced}),GameMotion:{enabled:()=>!reduced},GameMissions:{list:[{id:'line',minutes:4}]},OchakovoShift:{roles:{line:{}},register(id,f){builder=f;}}}};
  vm.runInNewContext(source,context);
  const rootEvents=new Map();
  const root={dataset:{},classList:{toggle(){}},querySelector(q){return ['.bl-traveller','.bl-toolbar'].includes(q)?null:element;},querySelectorAll(){return [];},addEventListener(n,f){rootEvents.set(n,f);},removeEventListener(n){rootEvents.delete(n);}};
  const api={root,button:(doName,label,value='',className='',attrs='')=>`<button data-do="${doName}" data-value="${value}" ${attrs}>${label}</button>`,esc:String,draw(markup){html=markup;},say(){},feedback(message){lastFeedback=message;}};
  const game=builder(api);game.start();
  return {game,store,listeners,rootEvents,element,step:()=>Number(root.dataset.lineStep),state:()=>JSON.parse(store.get(KEY)),html:()=>html,feedback:()=>lastFeedback};
}
function pathToSample(t){for(const id of ['supply','filler','capper','coder','control','packer'])t.game.act('node',id);t.game.act('next');assert.equal(t.step(),1);}
function sampleToObservation(t){for(const [id,answer] of [['level','visual'],['cap','visual'],['code','visual'],['seal','measure'],['drink','measure']]){t.game.act('check-item',id);t.game.act('classify',answer);}t.game.act('next');assert.equal(t.step(),2);}
function observationToEvent(t){for(const id of ['supply','capper','packer']){t.game.act('observe-point',id);t.game.act('snapshot',id);}t.game.act('next');assert.equal(t.step(),3);}
function eventToAction(t){for(const i of [0,1,2])t.game.act('frame',String(i));t.game.act('defect-lens','cap');t.game.input('link','capper');t.game.act('next');assert.equal(t.step(),4);}
function actionToMessage(t){t.game.act('record');t.game.act('repeat');t.game.act('mentor');t.game.act('next');assert.equal(t.step(),5);}

test('full episode: evidence gates, wrong decisions, separate machine/product outcomes',()=>{
  const t=mount();
  t.game.act('next');assert.equal(t.step(),0);assert.match(t.feedback(),/шесть/);
  pathToSample(t);
  t.game.act('check-item','seal');t.game.act('classify','visual');t.game.act('next');assert.equal(t.step(),1);
  sampleToObservation(t);
  t.game.act('pause');assert.equal(t.state().stopped,false);assert.match(t.html(),/Пауза только/);
  t.game.act('pause');t.game.act('next');assert.equal(t.step(),2);
  observationToEvent(t);
  t.game.act('defect-lens','level');t.game.input('link','filler');t.game.act('next');assert.equal(t.step(),3);
  eventToAction(t);
  t.game.act('mentor');assert.equal(t.state().stopped,false);
  t.game.act('wrong-pass');assert.equal(t.state().stopped,false);
  actionToMessage(t);assert.equal(t.state().stopped,true);
  t.game.input('message-to','0');t.game.act('send');assert.equal(t.state().sent,false);assert.equal(t.state().message.to,'0');
  for(const id of ['to','where','what','state','ask'])t.game.input('message-'+id,'0');
  t.game.input('message-what','1');t.game.act('send');assert.equal(t.state().sent,false);assert.match(t.feedback(),/не установлена/);
  t.game.input('message-what','0');t.game.act('send');t.game.act('next');assert.equal(t.step(),6);
  t.game.act('trial');assert.equal(t.state().trial,false);
  for(const id of ['engineering','lab','technology'])t.game.act('team',id);
  t.game.act('match','product');assert.equal(t.state().matched,false);
  t.game.act('match','equipment');t.game.act('trial');assert.equal(t.state().trial,false);assert.equal(t.state().trialStarted,true);
  assert.match(t.html(),/Проверочный запуск/);assert.match(t.html(),/Проверочный кадр/);
  const newFlow=t.html().split('class="bl-flow"')[1].split('class="bl-node-marker"')[0];
  assert.doesNotMatch(newFlow,/rotate\(-13/);
  assert.match(t.html().split('class="bl-divert')[1],/rotate\(-13/);
  t.game.act('trial-confirm');assert.equal(t.state().trial,false);
  t.game.act('trial-lens','cap');t.game.act('trial-results');t.game.act('trial-confirm');assert.equal(t.state().trial,true);
  assert.match(t.html(),/Работает после проверки/);assert.match(t.html(),/не допущен/);
  t.game.act('next');assert.equal(t.step(),7);
  t.game.act('final','all');assert.equal(t.game.done(),false);
  t.game.act('final','separate');assert.equal(t.game.done(),true);
  assert.equal(t.store.get('other-mission'),'preserve me');
  t.game.cleanup();assert.equal(t.listeners.size,0);
});

test('draft survives leaving and remounting; simulation replay preserves other missions',()=>{
  let t=mount();pathToSample(t);sampleToObservation(t);observationToEvent(t);eventToAction(t);actionToMessage(t);
  t.game.input('message-to','0');t.game.input('message-what','2');const saved=t.state();t.game.cleanup();
  t=mount({saved});assert.match(t.html(),/Продолжим твою смену/);t.game.act('resume');assert.equal(t.step(),5);assert.equal(t.state().message.what,'2');
  t.game.act('replay-event');assert.equal(t.step(),3);assert.equal(t.state().stopped,false);assert.equal(t.state().sent,false);assert.equal(t.store.get('other-mission'),'preserve me');
  t.game.act('restart');assert.equal(t.step(),0);assert.deepEqual(t.state().path,[]);
});

test('reduced motion uses explicit frames with the same evidence gates',()=>{
  const t=mount({reduced:true});assert.match(t.html(),/Следующий кадр/);assert.match(t.html(),/Покадровый просмотр/);
  t.game.act('still-next');assert.equal(t.state().still,1);t.game.act('next');assert.equal(t.step(),0);
  pathToSample(t);sampleToObservation(t);observationToEvent(t);assert.equal(t.state().stopped,false);
});

test('unavailable or damaged storage cannot break the episode',()=>{
  const denied=mount({denied:true});assert.equal(denied.step(),0);assert.match(denied.html(),/Сохранение в браузере недоступно/);
  assert.equal(mount({saved:'{bad json'}).step(),0);
  const baseline=mount().state();const t=mount({saved:{...baseline,phase:3,path:['fake','supply','supply'],teamTab:'broken',frame:999,classified:{cap:'nonsense'},message:{to:'99'}}});
  t.game.act('resume');assert.equal(t.state().path.length,1);assert.equal(t.state().frame,1);assert.equal(t.state().teamTab,'engineering');assert.deepEqual(t.state().message,{});
});

test('failed illustration offers retry and recovers without resetting progress',()=>{
  const t=mount();pathToSample(t);const before=t.state();let recovery='',removed=false,failed=false;
  const panel={classList:{add(){failed=true;},remove(){failed=false;}},querySelector(){return recovery?{remove(){removed=true;recovery='';}}:null;},insertAdjacentHTML(position,markup){recovery=markup;}};
  const target={matches:()=>true,closest:()=>panel,alt:''};
  t.rootEvents.get('error')({target});assert.equal(failed,true);assert.match(recovery,/Повторить загрузку/);
  t.game.act('retry-image');assert.match(t.element.src,/bottling-panorama-v1.png\?retry=/);assert.deepEqual(t.state(),before);
  t.rootEvents.get('load')({target});assert.equal(removed,true);assert.equal(failed,false);assert.equal(t.step(),1);
});
