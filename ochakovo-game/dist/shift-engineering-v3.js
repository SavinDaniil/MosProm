/* A small engineering shift. The trainee observes a fictional training rig. */
(() => {
 'use strict';
 const style=document.createElement('link');style.rel='stylesheet';style.href=new URL('engineering-v3.css?v=3.0',document.currentScript.src).href;document.head.append(style);
 const M=window.OchakovoEngineeringShift,KEY='ochakovo-engineering-shift-v3';
 const phases=['Первый день','Подготовка','Обычная работа','Поручения','Рабочая ситуация','Передача смены'];
 const coaching=[
  'Ты — стажёр по автоматизации, я — твой наставник. Мы следим за согласованной работой датчиков, программы и механизмов. Начни с трёх узлов линии.',
  'Перед наблюдением сверим учебное задание, предыдущую запись и внешнее состояние. Пуск и готовность оборудования подтверждают сотрудники.',
  'Теперь обычная работа: наблюдай срабатывание, зарегистрированный счёт и выпуск группы. Прикрепи по одному моменту из каждого узла.',
  'В смене есть и плановые поручения: записать осмотр, сравнить дорожки сигналов и передать контрольное наблюдение оператору.',
  'Оператор заметил расхождение. Сопоставь проходы бутылок с сигналами, передай наблюдения наставнику и проверь результат.',
  'Передадим команде факты: что наблюдали в обычной работе, что проверили и какой результат получили.'
 ];
 const goals=[
  [['sensor','Датчик S1'],['controller','Контроллер'],['group','Механизм']],
  [['task','Задание'],['log','Предыдущая запись'],['ready','Внешнее состояние']],
  [['sensor','Срабатывание'],['controller','Регистрация'],['release','Выпуск группы']],
  [['inspect','Плановый осмотр'],['signals','Сравнение сигналов'],['operator','Связь с оператором']],
  [['record','Запись события'],['window','Осмотр'],['service','Работа специалиста'],['test','Контрольный прогон']],
  [['handoff','Передача результатов']]
 ];
 const path={back:'M20 12H4m6-6-6 6 6 6',arrow:'M4 12h16m-6-6 6 6-6 6',close:'m6 6 12 12M6 18 18 6',check:'m5 12 4 4L19 6',play:'m8 4 12 8-12 8Z',pause:'M8 4v16M16 4v16',book:'M4 4h6c2 0 2 1 2 2 0-1 0-2 2-2h6v15h-6c-2 0-2 1-2 1s0-1-2-1H4zM12 6v14',eye:'M2 12s4-7 10-7 10 7 10 7-4 7-10 7S2 12 2 12Zm10-3a3 3 0 1 0 0 6 3 3 0 0 0 0-6Z',help:'M9 8a3 3 0 1 1 4 3c-1 1-1 2-1 3m0 3v1',step:'m5 4 11 8L5 20ZM20 4v16',redo:'M4 10a8 8 0 1 1 0 6m0-6V4m0 6h6'};
 const icon=n=>`<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="${path[n]||path.eye}"/></svg>`;
 Object.assign(window.OchakovoShift.roles.engineering,{role:'Специалист по автоматизации',lead:'Пройди небольшую смену рядом с наставником: оборудование, наблюдения, плановые задачи и работа с командой.',day:'Сверяет задание и записи, наблюдает штатный цикл, сопоставляет сигналы, фиксирует осмотр и передаёт результаты команде. Стажёр работает рядом с наставником в рамках поручений.',learned:'Изучил датчик, контроллер и механизм; сверил задание, наблюдал обычный цикл, выполнил плановые поручения и передал результаты смены.'});
 const card=window.GameMissions?.list.find(x=>x.id==='engineering');if(card)Object.assign(card,{role:'Специалист по автоматизации',minutes:8});
 window.OchakovoShift.register('engineering',a=>{
  let s;try{s=M.normalize(JSON.parse(localStorage.getItem(KEY)||'null'));}catch{s=M.fresh();}
  const esc=a.esc;let menu='',message='',bad=false,paused=window.GameMotion?.enabled()===false,moment=0,trial=false,disposed=false,storage=true,comparison=false,camera='all',lastTime=0;
  a.root.classList.add('engineering-v3');a.root.querySelector('.shift-heading').hidden=true;a.root.querySelector('.shift-profession').hidden=true;
  const live=a.root.querySelector('.shift-feedback');live.className='e3-live';
  const btn=(id,text,value='',cls='',extra='')=>a.button('e3-'+id,text,value,'e3-button '+cls,`data-key="${id}:${esc(value)}" ${extra}`);
  const complete=(group,id)=>s[group]?.includes(id);
  const phaseDone=()=>M.canAdvance(s);
  function persist(){try{localStorage.setItem(KEY,JSON.stringify(s));storage=true;}catch{storage=false;}}
  function context(){
   if(s.phase===4&&s.incident.serviced){
    if(s.incident.verification===1)return {mode:'gap',count:0,detected:false,released:false,bottle:false,label:'Контроль · пустой промежуток'};
    if(s.incident.verification===3)return {mode:'checked',count:6,detected:false,released:true,bottle:false,label:'Проверено · две группы выпущены'};
    if(!trial)return {mode:'ready',count:0,detected:false,released:false,bottle:false,label:'Специалист подготовил контрольный прогон'};
   }
   if(s.phase===4&&s.incident.recordOpen&&!s.incident.serviced){const f=s.incident.frame;return {mode:'record',count:[1,1,2,3,3,4][f],detected:!!M.signals[f],released:false,bottle:true,number:f+1,label:`Запись до остановки · проход ${f+1} из 6`};}
   if(s.phase===4&&!s.incident.serviced)return {mode:'stopped',count:4,detected:false,released:false,bottle:false,label:s.incident.proposed?'Работает специалист':'Оператор остановил участок'};
   if(s.phase===5)return {mode:'checked',count:6,detected:false,released:true,bottle:false,label:s.done?'Смена передана команде':'Итоги смены · проверка завершена'};
   if(s.phase<2)return {mode:'ready',count:0,detected:false,released:false,bottle:false,label:'Учебный участок · знакомство и подготовка'};
   const detected=moment<=11&&moment%2===1,count=Math.min(6,Math.floor((moment+1)/2));
   return {mode:'live',count,detected,released:moment>=13,bottle:moment<=11,number:Math.min(6,Math.floor(moment/2)+1),label:s.phase===4?'Контрольный прогон · наблюдение':'Обычная работа · учебная линия'};
  }
  function execute(type,value,ctx){const old=s.phase,out=M.dispatch(s,{type,value,context:ctx});s=out.state;message=out.message||'';bad=out.error;live.textContent=message;if(out.changed)persist();if(old!==s.phase){menu='';moment=0;trial=false;comparison=false;camera='all';message='';}render();}
  function collected(id){if(s.phase===0)return complete('visits',id);if(s.phase===1)return complete('prep',id);if(s.phase===2)return complete('normal',id);if(s.phase===3)return complete('routine',id);if(s.phase===4)return id==='record'?s.incident.marked.length===2:id==='window'?s.incident.inspected:id==='service'?s.incident.serviced:s.incident.verification===3;return s.handed;}
  function bottle(n,cls=''){return `<span class="e3-bottle ${cls}"><img src="assets/engineering-bottle-v2.png" width="100" height="180" alt=""><b>${n}</b></span>`;}
  function rig(){return `<div class="e3-rig" aria-label="Производственная линия"><img class="e3-machine" src="assets/engineering-line-v2.png" width="1774" height="887" alt="Учебный конвейер с датчиком, контроллером и механизмом группирования"><svg class="e3-wire" viewBox="0 0 1774 887" aria-hidden="true"><path d="M800 318H940V210H1115" fill="none" stroke-width="7" stroke-linecap="round" stroke-dasharray="12 13"/></svg><div class="e3-accumulation"></div><div class="e3-traveller">${bottle(1)}</div><span class="e3-lamp" aria-hidden="true"></span><span class="e3-trace" aria-hidden="true"></span><div class="e3-screen"><small>Счёт</small><strong data-live="count">0 / 6</strong></div><div class="e3-protect p-sensor"></div><div class="e3-protect p-controller"></div><div class="e3-protect p-group"></div>${btn('object','Датчик S1','sensor','e3-node e3-sensor','aria-label="Датчик S1: открыть состояние"')}${btn('object','Контроллер','controller','e3-node e3-controller','aria-label="Контроллер: открыть показания"')}${btn('object','Группирование','group','e3-node e3-group','aria-label="Механизм группирования: открыть состояние"')}</div>`;}
  const purpose={sensor:['Датчик S1','Замечает бутылку по отражённому свету. S1 — его условное обозначение.'],controller:['Контроллер','Получает сигналы, выполняет программу и ведёт счёт. Панель показывает его данные.'],group:['Механизм группирования','Выпускает полную группу после шести регистраций и выполнения условий готовности.'],journal:['Журнал участка','Записи помогают увидеть изменения и передать следующей смене точные наблюдения.'],operator:['Оператор линии','Следит за процессом на месте, сообщает наблюдения и принимает участок после согласования.'],mentor:['Инженер-наставник','Помогает разобраться в устройстве, проверить наблюдения и организовать работу специалистов.']};
  function stateLine(id){if(id==='sensor')return `<div class="e3-state-row"><span>Выход S1</span><strong data-live="signal">Нет сигнала</strong></div>`;if(id==='controller')return `<div class="e3-state-row"><span>Вход</span><strong data-live="signal">Нет сигнала</strong></div><div class="e3-state-row"><span>Счёт</span><strong data-live="count">0 / 6</strong></div>`;if(id==='group')return `<div class="e3-state-row"><span>Состояние</span><strong data-live="gate">Ждёт группу</strong></div>`;return '';}
  function optical(clean){return `<div class="e3-optical"><div><img src="assets/engineering-line-v2.png" width="710" height="355" alt="Внешний вид окна датчика">${clean?'':'<i aria-hidden="true"></i>'}</div><p>${clean?'Поверхность без видимых помех. Крепление по исходной отметке.':'На окне заметен матовый след. Положение проверено специалистом.'}</p></div>`;}
  function controls(){return `<div class="e3-observe-controls">${btn('pause',icon(paused?'play':'pause')+(paused?'Продолжить просмотр':'Пауза наблюдения'))}${btn('step',icon('step')+'Следующий момент')}</div>`;}
  function menuBody(id){
   let html=stateLine(id);
   if(s.phase===0&&['sensor','controller','group'].includes(id))html+='<p class="e3-menu-note">Узел добавлен в твоё знакомство с оборудованием.</p>';
   if(s.phase===1){if(id==='controller')html+=`<div class="e3-work-order"><span>Учебное задание наставника</span><strong>Группа: 6 бутылок</strong><p>Положение и настройки — по исходной записи. Стажёр сверяет данные, параметры не меняет.</p></div>${btn('model','Сверить задание','read-task','e3-primary')}`;if(id==='journal')html+=`<p>Предыдущий контроль: 6 бутылок → 6 регистраций → выпуск группы. Изменений параметров не записано.</p>${btn('model','Сопоставить с заданием','read-log','e3-primary')}`;if(id==='sensor')html+=`<p>Наставник подготовил внешний осмотр с безопасного места.</p>${btn('model','Посмотреть отчёт осмотра','inspect-ready','e3-primary')}${complete('prep','ready')?optical(true):''}`;}
   if(s.phase===2&&['sensor','controller','group'].includes(id)){const action={sensor:'capture-sensor',controller:'capture-controller',group:'capture-release'}[id],label={sensor:'Прикрепить срабатывание',controller:'Записать показание',group:'Сохранить выпуск группы'}[id];html+=controls()+btn('capture',complete('normal',id==='group'?'release':id)?icon('check')+' Наблюдение в журнале':label,action,'e3-primary',complete('normal',id==='group'?'release':id)?'disabled':'');}
   if(s.phase===3){if(id==='sensor')html+=`${optical(true)}${btn('model','Записать плановый осмотр','inspect-routine','e3-primary')}`;if(id==='controller')html+=`<p>Сопоставь выход датчика и вход контроллера для одного и того же штатного цикла.</p>${btn('compare',comparison?'Дорожки наложены':'Наложить дорожки сигналов','','e3-primary')}${comparison?signalTable([1,1,1,1,1,1]):''}`;if(id==='operator')html+=`<p>«Как прошёл контрольный цикл? Прикрепи наблюдение, чтобы мы видели одни и те же данные».</p><div class="e3-attachment">Контрольный кадр · 6/6 · группа выпущена</div>${btn('model','Передать контрольное наблюдение','send-operator','e3-primary')}`;}
   if(s.phase===4){
    if(id==='operator')html+=`<p>«Бутылки прошли, а система насчитала только четыре. Остановил участок и сохранил событие».</p>${btn('model','Открыть запись оператора','open-record','e3-primary')}`;
    if(id==='controller'&&s.incident.recordOpen&&!s.incident.serviced)html+=`<p class="e3-archive">Запись до остановки. Выход и вход отображаются для выбранного прохода.</p><label class="e3-range">Проход <output>${s.incident.frame+1} из 6</output><input type="range" min="0" max="5" step="1" value="${s.incident.frame}" data-input="e3-frame" aria-label="Проход в записи события"></label>${btn('mark','Прикрепить момент расхождения','','e3-primary')}<p class="e3-menu-note">В журнале: ${s.incident.marked.map(x=>x+1).join(', ')||'пока нет отметок'}.</p>${signalTable(M.signals)}`;
    if(id==='sensor'&&!s.incident.serviced)html+=`${s.incident.inspected?optical(false):'<p>Для проверки версии запроси внешний осмотр у специалиста.</p>'}${btn('model',s.incident.inspected?'Передать наблюдения наставнику':'Запросить внешний осмотр',s.incident.inspected?'propose-service':'inspect-window','e3-primary')}`;
    if(id==='mentor'&&s.incident.proposed&&!s.incident.serviced)html+=`<p>«Подготовим условия и обслужим наружное окно по документации. Ты наблюдаешь; положение и настройки сохраняем».</p>${btn('model','Наблюдать работу специалиста','observe-service','e3-primary')}`;
    if(id==='controller'&&s.incident.serviced){const v=s.incident.verification;html+=`<p>${v===0?'Проверим полный проход шести бутылок.':v===1?'Между группами проверим отсутствие ложных событий.':v===2?'Теперь повторим полный проход в прежних условиях.':'Оба прохода 6/6, промежуток без событий. Группы выпущены.'}</p>`;if(v<3){if(v!==1&&!trial)html+=btn('trial','Открыть контрольный прогон','','e3-primary');else html+=controls()+btn('verify',v===1?'Зафиксировать ноль событий':v===0?'Сохранить полный проход A':'Сохранить полный проход B','','e3-primary');}}
   }
   if(id==='journal'&&s.phase!==1){const entries=M.record(s),entry=x=>`<p><strong>${esc(x.title)}</strong>${esc(x.text)}</p>`;html+=`<div class="e3-record">${entries.slice(0,4).filter(x=>x.text&&!/ещё|пока/i.test(x.text)).map(entry).join('')}${s.phase===5?`<details><summary>Ситуация и проверка результата</summary>${entries.slice(4,7).map(entry).join('')}</details>`:''}</div>`;if(s.phase===5)html+=s.done?`<p class="e3-menu-note">Смена передана. Оператор принял результаты, наставник подтвердил проверку.</p>${btn('restart','Новая учебная смена')}`:btn('model','Передать результаты смены','handoff','e3-primary');}
   if(id==='mentor'&&!((s.phase===4)&&s.incident.proposed&&!s.incident.serviced))html+=`<p>${coaching[s.phase]}</p><details><summary>О профессии и полномочиях</summary><p>В этой игре ты — стажёр инженерного направления по автоматизации. Наблюдаешь, сопоставляешь сигналы и ведёшь записи рядом с наставником. Сотрудники выполняют обслуживание, подтверждают готовность и управляют пуском. Это учебная модель, не должностная инструкция конкретного завода.</p></details>`;
   return html;
  }
  function signalTable(values){return `<table class="e3-signals"><caption>${s.phase===4?'Запись события':'Штатный цикл'} · шесть проходов</caption><tbody>${['Выход S1','Вход контроллера'].map(t=>`<tr><th>${t}</th>${values.map(v=>`<td class="${v?'':'is-zero'}">${v}</td>`).join('')}</tr>`).join('')}</tbody></table>`;}
  function menuHTML(){if(!menu)return '';const p=purpose[menu];return `<section class="e3-menu" aria-label="${p[0]}: контекстное меню"><header><h2>${p[0]}</h2>${btn('close',icon('close'),'','e3-menu-close','aria-label="Закрыть мини-меню"')}</header><p class="e3-purpose">${p[1]}</p>${menuBody(menu)}</section>`;}
  function render(){
   if(disposed)return;const key=document.activeElement?.dataset.key;
   a.content.innerHTML=`<div class="e3-shell"><header class="e3-top"><a href="#map" class="e3-back" aria-label="На карту завода">${icon('back')}</a><img src="assets/ochakovo-logo.png" width="145" height="35" alt="Очаково. Натуральные напитки"><h1>Смена с командой автоматики</h1><div>${btn('object',icon('book')+'<span>Журнал</span>','journal','e3-top-action','aria-label="Журнал участка"')}${btn('motion',icon(paused?'play':'pause'),'','e3-top-action',`aria-label="${paused?'Включить':'Приостановить'} движение"`)}</div></header><div class="e3-progress"><span>${s.phase+1} / 6 <strong>${phases[s.phase]}</strong></span><div aria-label="Задачи этапа">${goals[s.phase].map(([id,t])=>`<span class="${collected(id)?'is-done':''}">${collected(id)?icon('check'):'<i></i>'}${t}</span>`).join('')}</div></div><section class="e3-scene" data-camera="${camera}" aria-label="Интерактивная рабочая сцена"><div class="e3-status"><i></i><span data-live="label"></span></div><div class="e3-camera" aria-label="Вид участка">${[['all','Вся линия'],['sensor','Датчик'],['group','Механизм']].map(([id,t])=>btn('camera',t,id,camera===id?'is-current':'')).join('')}</div>${rig()}<div class="e3-people">${btn('object',`<img src="assets/engineering-mentor-v2.png" width="92" height="138" alt=""><span>Наставник</span>`,'mentor','e3-person e3-mentor')}${btn('object',`<span class="e3-operator-avatar">О</span><span>Оператор${s.phase===4&&!s.incident.recordOpen?'<i class="e3-notification"></i>':''}</span>`,'operator','e3-person e3-operator')}</div>${btn('object','Журнал участка '+icon('book'),'journal','e3-journal-object')}${menuHTML()}<div class="e3-mini-readings"><span>Выход S1 <b data-live="signal"></b></span><span>Вход контроллера <b data-live="signal"></b></span><span>Механизм <b data-live="gate"></b></span></div></section><footer class="e3-coach"><img src="assets/mascot-think.png" width="54" height="68" alt="Капля"><div><strong>${message?bad?'Обрати внимание':'Наблюдение сохранено':s.done?'Ты попробовал работу специалиста':'Инженер-наставник'}</strong><p>${esc(message|| (s.done?'Сверка задания, штатное наблюдение, плановый осмотр, работа с сигналами и передача результатов помогают оборудованию работать устойчиво.':coaching[s.phase]))}</p><small>${storage?'Учебная модель · прогресс сохраняется':'Сохранение недоступно · оставь вкладку открытой'}</small></div><div class="e3-coach-actions">${s.done?a.button('finish','В паспорт '+icon('arrow'),'','e3-button e3-primary')+`<a href="#careers">О практике и работе</a>`:btn('next',s.phase===5?'Открой журнал для передачи':phaseDone()?'Продолжить '+icon('arrow'):'Что осталось?','','e3-primary')}${btn('hint',icon('help'),'','e3-hint','aria-label="Подсказать следующее действие"')}</div></footer></div>`;
   update();positionMenu();if(key)[...a.content.querySelectorAll('[data-key]')].find(e=>e.dataset.key===key)?.focus({preventScroll:true});
  }
  function update(){
   if(disposed)return;const c=context(),rigEl=a.content.querySelector('.e3-rig');if(!rigEl)return;
   a.content.querySelectorAll('[data-live=count]').forEach(e=>e.textContent=`${c.count} / 6`);a.content.querySelectorAll('[data-live=signal]').forEach(e=>e.textContent=c.detected?'Есть сигнал':'Нет сигнала');a.content.querySelectorAll('[data-live=gate]').forEach(e=>e.textContent=c.released?'Группа выпущена':'Ждёт группу');a.content.querySelector('[data-live=label]').textContent=c.label+(paused&&c.mode==='live'?' · кадр на паузе':'');
   rigEl.querySelector('.e3-machine').src=`assets/${c.released?'engineering-line-open-v2.png':'engineering-line-v2.png'}`;rigEl.querySelector('.e3-lamp').classList.toggle('is-on',c.detected);rigEl.querySelector('.e3-wire').classList.toggle('is-on',c.detected);rigEl.querySelector('.e3-trace').hidden=!(s.phase===4&&s.incident.inspected&&!s.incident.serviced);
   const traveller=rigEl.querySelector('.e3-traveller');traveller.hidden=!c.bottle;traveller.style.left=c.detected||c.mode==='record'?'39%':'24%';traveller.querySelector('b').textContent=c.number||1;
   const accumulated=c.mode==='record'?0:Math.max(0,c.count-(c.detected?1:0));rigEl.querySelector('.e3-accumulation').innerHTML=Array.from({length:accumulated},(_,i)=>bottle(i+1)).join('');rigEl.querySelector('.e3-accumulation').classList.toggle('is-released',c.released);
  }
  function overlap(a,b){return Math.max(0,Math.min(a.right,b.right)-Math.max(a.left,b.left))*Math.max(0,Math.min(a.bottom,b.bottom)-Math.max(a.top,b.top));}
  function positionMenu(){
   const panel=a.content.querySelector('.e3-menu'),scene=a.content.querySelector('.e3-scene');if(!panel||!scene)return;
   const anchor=a.content.querySelector(`[data-do="e3-object"][data-value="${menu}"]`),base=scene.getBoundingClientRect(),r=anchor?.getBoundingClientRect()||base,w=panel.offsetWidth,h=panel.offsetHeight;
   const blocks=[...scene.querySelectorAll('.e3-protect,.e3-traveller:not([hidden]),.e3-accumulation')].map(e=>e.getBoundingClientRect());
   const x=r.left-base.left+r.width/2-w/2,y=r.top-base.top-h-16;
   const options=[[x,y],[x,12],[12,12],[base.width-w-12,12],[12,base.height-h-65],[base.width-w-12,base.height-h-65]].map(([left,top])=>({left:Math.max(10,Math.min(base.width-w-10,left)),top:Math.max(10,Math.min(base.height-h-10,top))}));
   for(const q of options){const box={left:q.left+base.left,top:q.top+base.top,right:q.left+base.left+w,bottom:q.top+base.top+h};q.score=blocks.reduce((v,b)=>v+overlap(box,b)*200,0)+Math.hypot(box.left+w/2-(r.left+r.width/2),box.bottom-r.top);}
   const best=options.sort((a,b)=>a.score-b.score)[0];panel.style.left=best.left+'px';panel.style.top=best.top+'px';
  }
  function nextMoment(){moment=(moment+1)%16;update();}
  function open(id){menu=id;message='';if(s.phase===0&&['sensor','controller','group'].includes(id)){const out=M.dispatch(s,{type:'visit',value:id});s=out.state;persist();}render();}
  function act(type,value){
   if(!type.startsWith('e3-'))return;type=type.slice(3);
   if(type==='object')return open(value);
   if(type==='restart'){menu='';trial=false;moment=0;comparison=false;camera='all';return execute('reset');}
   if(type==='close'){menu='';render();return;}
   if(type==='camera'){camera=value;render();return;}
   if(type==='motion'){paused=!paused;if(!paused&&window.GameMotion?.enabled()===false)window.GameMotion.toggle();render();return;}
   if(type==='pause'){paused=!paused;render();return;}
   if(type==='step'){paused=true;nextMoment();return;}
   if(type==='capture')return execute(value,'',context());
   if(type==='compare'){comparison=true;return execute('compare-signals');}
   if(type==='model'){if(value==='observe-service'){trial=false;moment=0;}return execute(value);}
   if(type==='mark')return execute('mark-miss');
   if(type==='trial'){trial=true;moment=0;paused=window.GameMotion?.enabled()===false;render();return;}
   if(type==='verify'){const c=context();execute('observe-verification','',c);if(!bad){trial=false;moment=0;render();}return;}
   if(type==='next'){if(s.phase===5){open('journal');return;}return execute('next');}
   if(type==='hint'){const hints=[['sensor','controller','group'].find(id=>!complete('visits',id)),!complete('prep','task')?'controller':!complete('prep','log')?'journal':'sensor',!complete('normal','sensor')?'sensor':!complete('normal','controller')?'controller':'group',!complete('routine','inspect')?'sensor':!complete('routine','signals')?'controller':'operator',!s.incident.recordOpen?'operator':s.incident.marked.length<2?'controller':!s.incident.inspected?'sensor':!s.incident.proposed?'sensor':!s.incident.serviced?'mentor':'controller','journal'];open(hints[s.phase]||'mentor');}
  }
  function input(type,value){if(type==='e3-frame')execute('frame',Number(value));}
  const outside=e=>{if(menu&&!e.target.closest('.e3-menu,[data-do="e3-object"],[data-do="e3-camera"]')){menu='';a.content.querySelector('.e3-menu')?.remove();}};
  const escape=e=>{if(e.key==='Escape'&&menu){menu='';render();}};
  const resize=()=>positionMenu();document.addEventListener('pointerdown',outside);document.addEventListener('keydown',escape);window.addEventListener('resize',resize);
  const timer=setInterval(()=>{if(disposed||document.hidden||paused||window.GameMotion?.enabled()===false)return;const running=s.phase===2||s.phase===3||s.phase===4&&s.incident.serviced&&trial&&s.incident.verification!==1&&s.incident.verification<3;if(running&&Date.now()-lastTime>=900){lastTime=Date.now();nextMoment();}},120);
  render();
  return {start:()=>{},act,input,managesFocus:true,done:()=>s.done,result:()=>({learned:window.OchakovoShift.roles.engineering.learned}),cleanup:()=>{disposed=true;clearInterval(timer);document.removeEventListener('pointerdown',outside);document.removeEventListener('keydown',escape);window.removeEventListener('resize',resize);}};
 });
})();
