/* Illustrated preview. Shared v7 model and progress remain compatible with v8. */
(() => {
 'use strict';
 const css=document.createElement('link');css.rel='stylesheet';css.href=new URL('lab-v10.css?v=10.0',document.currentScript.src).href;document.head.append(css);
 const M=window.OchakovoLabModel,I=window.OchakovoLabInteraction,D=M.data,KEY='ochakovo-lab-workbench-v7',LEARNING='ochakovo-lab-learning-v9',MECHANICS='ochakovo-lab-interaction-v10';
 const fmt=n=>Number(n).toFixed(1).replace('.',',');
 const paths={arrow:'M4 12h15m-6-6 6 6-6 6',back:'M20 12H5m6-6-6 6 6 6',check:'m5 12 4 4L19 6',book:'M5 3h14v18H5zM9 7h6M9 11h6M9 15h4',play:'m9 5 10 7-10 7Z',close:'m6 6 12 12M6 18 18 6',info:'M12 10v6m0-10v1',route:'M6 4v16m12-16v16M4 6h16M4 18h16',pause:'M8 5v14M16 5v14'};
 const icon=n=>`<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="${paths[n]||paths.info}"/></svg>`;
 function read(key,fallback){try{return JSON.parse(localStorage.getItem(key))||fallback;}catch{return fallback;}}
 function restore(){return M.normalize(read(KEY,null)||read('ochakovo-lab-visual-v6',null));}
 Object.assign(window.OchakovoShift.roles.lab,{
  lead:'Прими пробу, исследуй её и передай точные данные наставнику.',
  day:'Химик-лаборант принимает и готовит пробы, выполняет измерения по методике, сравнивает результаты с требованиями и сообщает об отклонениях.',
  tools:'Пробы, бюретка, колба, рефрактометр и журнал.',
  learned:'Принял пробу, подготовил условия, выполнил два исследования, сохранил исходный результат и повтор, передал отклонение наставнику.'
 });
 window.GameMissions.list.find(x=>x.id==='lab').minutes=8;
 window.OchakovoShift.register('lab',a=>{
  const esc=a.esc;
  let s=restore(),extra=read(LEARNING,{}),note='',bad=false,hint=false,closeView=false,picking=false,disposed=false,storageOK=true,lastTrigger=null,dialog,world;
  let mechanics=read(MECHANICS,{}),ref=I.refState(s,s.phase===4),opening=0,carry=Number(mechanics.carry)||0,drag=null,frame=0,lastTime=0,measureTimer=0,tempTimer=0,keyboardGrab=false;
  if(mechanics.ref&&mechanics.ref.context===ref.context){ref={...ref,...mechanics.ref,measuring:false};if((s.phase===2&&s.method==='brix')||s.phase===4){if(s.phase===2&&!s.control&&s.clean===false)ref.clean=!!mechanics.ref.clean;}}
  let portions=new Set(extra.portions||[]),quiz=extra.quiz===true&&s.done;
  a.root.classList.add('lab-v10');
  const live=a.root.querySelector('.shift-feedback');live.classList.add('l10-announcer');
  const btn=(type,text,cls='',value='',disabled=false,attrs='')=>a.button('l10-'+type,text,value,'l10-button '+cls,`${disabled?'disabled':''} data-key="${type}:${value}" ${attrs}`);
  const primary=(type,text,value='',disabled=false)=>btn(type,text+icon('arrow'),'l10-primary',value,disabled,'data-next');
  const save=()=>{try{localStorage.setItem(KEY,JSON.stringify(s));localStorage.setItem(LEARNING,JSON.stringify({portions:[...portions],quiz}));localStorage.setItem(MECHANICS,JSON.stringify({carry,ref:{...ref,measuring:false}}));storageOK=true;}catch{storageOK=false;}};
  const help=[
   'На бутылке и в направлении должны совпасть P-214 и T-07. Целая крышка помогает убедиться, что проба дошла без видимого повреждения.',
   'Сначала приведи температуру к учебным условиям. Затем перемешай без добавления воды или сиропа и подготовь обе отдельные порции.',
   'У бюретки после 3,0 мл переходи на 0,1 мл. После каждой добавки перемешивай. Рефрактометр: контроль, чистая ячейка, проба, крышка, стабильное показание.',
   'Сопоставь каждое число с двумя границами рядом. Если оно ниже нижней или выше верхней, сохрани число и сообщи наставнику.',
   'Повтор проверяет воспроизводимость наблюдения. Новая порция и чистая ячейка помогают исключить остатки прошлого измерения. Обе записи нужны наставнику.'
  ];
  // Atlas viewBoxes keep each prop isolated; all letters and readings are HTML.
  const crops=[[78,56,270,415],[452,16,270,453],[812,62,280,410],[1260,34,175,445],[32,480,285,526],[416,584,285,382],[731,622,394,338],[1137,714,390,247]];
  let spriteID=0;
  const sprite=(n,cls='',label='')=>{const [x,y,w,h]=crops[n],id='l10-crop-'+(++spriteID);return `<svg class="l10-sprite ${cls}" viewBox="${x} ${y} ${w} ${h}" ${label?`role="img" aria-label="${esc(label)}"`:'aria-hidden="true"'}><defs><clipPath id="${id}"><rect x="${x}" y="${y}" width="${w}" height="${h}"/></clipPath></defs><image href="assets/lab-v9-atlas.png" width="1536" height="1024" clip-path="url(#${id})"/></svg>`;};
  function bottle(label=D.sample,{empty=false,open=false,cls=''}={}){
   return `<div class="l10-bottle ${empty?'is-empty':''} ${open?'is-open':''} ${cls}" data-info="${label==='Контроль'?'brix':'sample'}">${sprite(empty?2:open?1:0,'',empty?'Чистая пустая ёмкость':'Проба янтарного напитка')}<span class="l10-label"><b>${esc(label)}</b><small>${label==='Контроль'?'10,0 °Bx':D.batch+' · '+D.tank}</small></span></div>`;
  }
  const paperHead=title=>`<header><img src="assets/ochakovo-logo.png" alt="Очаково" width="104" height="25"><h3>${title}</h3><p>Проба ${D.sample} · партия ${D.batch} · ${D.tank}</p></header>`;
  function rows(){return `<dl class="l10-rows"><div><dt>Титрование · расход</dt><dd>${s.titreSaved?fmt(D.titre/10)+' мл':'Ещё не записан'}</dd></div><div><dt>Рефрактометр · исходный</dt><dd>${s.brixSaved?fmt(D.brix)+' °Bx':'Ещё не записан'}</dd></div>${s.repeatStage===4?`<div><dt>Рефрактометр · повтор</dt><dd>${fmt(D.brix)} °Bx</dd></div>`:''}</dl>`;}
  function task(title,copy,detail=''){
   return `<section class="l10-task"><h2 tabindex="-1">${title}</h2><p>${esc(copy)}</p>${detail?btn('detail',icon('info')+'О методе','l10-detail',detail):''}<div class="l10-context"><span>Проба <b>${D.sample}</b></span><span>Партия <b>${D.batch}</b></span></div></section>`;
  }
  function feedback(fallback=''){
   const text=note||fallback;
   return text?`<p class="l10-feedback ${bad?'is-error':''}" role="status">${icon(bad?'info':'check')}${esc(text)}</p>`:'';
  }
  function scene(html,cls=''){return `<div class="l10-scene ${cls}">${html}</div>`;}
  function companion(){
   return `<aside class="l10-companion"><img src="assets/mascot-think.png" alt="Капля" width="70" height="92"><div>${hint?`<p>${esc(help[s.phase])}</p><p id="l10-gesture-help">Мышь или касание: захвати предмет и двигай. Клавиатура: Space — захват, стрелки — движение, Enter — отпустить; можно выбрать место назначения через Tab. Кран: стрелки — открыть, Home/Escape — закрыть. Крышка: ↑ открыть, ↓ закрыть.</p>`:'<span id="l10-gesture-help" class="l10-sr">Space — захват; стрелки — движение; Enter — отпустить. Можно Tab на место назначения. Кран: стрелки, Home закрыть. Крышка: стрелки.</span>'}${btn('hint',hint?'Скрыть помощь':'Помощь Капли','l10-help','',false,`aria-expanded="${hint}"`)}</div></aside>`;
  }
  function welcome(){
   return task('Твоя смена\nв лаборатории','Лаборант помогает контролировать качество напитков. Прими пробу с производства, исследуй её и передай наставнику точные данные.')+scene(`<div class="l10-entry-sample">${bottle(D.sample)}</div><article class="l10-paper l10-assignment">${paperHead('Задание стажёру')}<p>Работай с пробой, бюреткой и рефрактометром. Наблюдай, сравнивай и записывай.</p><p class="l10-muted">Решение о выпуске партии принимает уполномоченный специалист.</p>${primary('start','Принять пробу')}<small>Без таймера и штрафов</small></article>`,'l10-entry');
  }
  function receipt(){
   const checked=k=>s.checks.includes(k);
   return task('Прими пробу','Осмотри крышку и этикетку, затем сверь направление: результат должен относиться к нужной партии.')+scene(`<div class="l10-receipt-bottle">${bottle(D.sample,{open:checked('seal')})}${btn('inspect',checked('seal')?'Крышка целая':'Крышка','l10-cap-check','seal',false,`aria-pressed="${checked('seal')}"`)}${btn('inspect',checked('label')?'Этикетка сверена':'Этикетка','l10-label-check','label',false,`aria-pressed="${checked('label')}"`)}</div><article class="l10-paper l10-direction">${paperHead('Направление')}<dl class="l10-rows"><div><dt>Партия</dt><dd>${D.batch}</dd></div><div><dt>Источник</dt><dd>${D.tank}</dd></div></dl><p>Основа напитка · отбор 10:20<br>До насыщения газом</p>${btn('inspect',checked('source')?icon('check')+'Источник совпал':'Сверить с этикеткой','','source',false,`aria-pressed="${checked('source')}"`)}<p class="l10-count">Проверено ${s.checks.length} из 3</p>${primary('register','Зарегистрировать','',s.checks.length<3)}</article>`,'l10-receipt')+feedback();
  }
  function preparation(){
   const texts=[['Подготовь условия','Перенеси пробу в зону подготовки температуры. Условия могут влиять на показания; учебная карточка задаёт 19–21 °C.'],['Перемешай образец','Возьми бутылку и покачай её в разные стороны. Порции должны отражать состав пробы; ничего не добавляй.'],['Подготовь две порции','Перенеси исходную пробу к каждой чистой ёмкости, чтобы выделить отдельные порции A и B.'],['Обе порции готовы','Температура 20,2 °C, проба перемешана. Отдельные порции связаны с L-041. Выбери первое исследование.']][s.prep];
   let body;
   if(s.prep===3)body=`<div class="l10-portions">${['A','B'].map(v=>`<div>${bottle(D.sample+' · '+v)}<strong>${v==='A'?'Титрование':'Рефрактометрия'}</strong></div>`).join('')}</div>${primary('to-tests','К исследованиям')}`;
   else body=`${grab(s.prep===1?'mix-source':'source','Исходная проба',bottle(D.sample,{open:true}),'l10-prep-source')}<div class="l10-temperature"><span>Температура пробы</span><strong data-temperature>${s.prep===0?'24,3':'20,2'} <small>°C</small></strong><span>Учебные условия: 19–21 °C</span></div>${s.prep===0?'<div class="l10-prep-zone" data-site="temperature" tabindex="0" role="group" aria-label="Зона подготовки температуры"><b>Подготовка температуры</b><span>19–21 °C</span><small>Поставь пробу сюда</small></div>':s.prep===2?`<div class="l10-portion-targets">${['A','B'].map(v=>`<div class="l10-portion-target ${portions.has(v)?'is-filled':''}" data-site="portion-${v}" tabindex="0" role="group" aria-label="Порция ${v}">${bottle(D.sample+' · '+v,{empty:!portions.has(v)})}<b>${portions.has(v)?'Порция '+v+' готова':'Чистая ёмкость '+v}</b></div>`).join('')}</div>`:'<div class="l10-mixing-guide"><b>Плавно покачай образец</b><span>Жидкость реагирует на твои движения</span><meter min="0" max="1" value="0" class="l10-gesture-meter" aria-label="Подготовка перемешивания"></meter></div>'}`;
   return task(...texts)+scene(body,'l10-preparation prep-'+s.prep)+feedback();
  }
  function deviceArt({preview=false}={}){
   const val=ref.measuring?'…':preview?'—':s.phase===4?(s.repeatStage>=3?fmt(D.brix):'—'):s.read?fmt(D.brix):s.control&&ref.well==='control'?fmt(D.control):'—';
   const aria=ref.measuring?'Измерение':val==='—'?'Нет показания':`Показание ${val} градусов Брикс`;
   return `<div class="l10-device" data-info="brix" style="--lid:${preview?1:ref.lid}">${part(0,'l10-device-body','Настольный рефрактометр')}<svg class="l10-device-overlay" viewBox="24 140 632 400" role="img" aria-label="${aria}"><foreignObject width="178" height="112" transform="matrix(.98 .15 -.65 .95 166 200)"><div xmlns="http://www.w3.org/1999/xhtml" class="l10-reading"><strong>${val}</strong><span>°Bx</span><small>${ref.measuring?'ИЗМЕРЕНИЕ':val==='—'?'ГОТОВ К РАБОТЕ':'СТАБИЛЬНО'}</small></div></foreignObject></svg><div class="l10-well ${ref.well?'has-sample':''}" data-site="well" tabindex="${preview?'-1':'0'}" role="group" aria-label="Измерительная ячейка">${ref.well?'<i class="l10-well-liquid"></i>':''}</div><div class="l10-lid" ${preview?'':`data-mechanism="lid" tabindex="0" role="slider" aria-label="Крышка рефрактометра" aria-valuemin="0" aria-valuemax="100" aria-valuenow="${Math.round(ref.lid*100)}" aria-valuetext="${ref.lid>.7?'Открыта':ref.lid<.2?'Закрыта':'Приоткрыта'}" title="Потяни крышку вверх, чтобы открыть; вниз — закрыть"`}>${part(1)}<span class="l10-mechanism-label">Крышка</span></div>${preview?'':btn('instrument-read','Измерение','l10-instrument-key','','', 'aria-label="Клавиша измерения рефрактометра"')}<span class="l10-device-name">РЕФРАКТОМЕТР</span></div>`;
  }
  function methods(){
   return task('Выбери исследование','Один метод помогает исследовать кислотность, другой — оценить содержание растворённых веществ. Нужны оба результата.')+scene(`<div class="l10-method"><div class="l10-method-art">${part(2,'','Бюретка')}${sprite(5,'l10-mini-flask')}</div><h3>Титрование</h3>${primary('method',s.titreSaved?'Открыть запись':'Работать с бюреткой','titre')}</div><div class="l10-method">${deviceArt({preview:true})}<h3>Рефрактометрия</h3>${primary('method',s.brixSaved?'Открыть запись':'Работать с прибором','brix')}</div>`,'l10-methods');
  }
  function recorded(kind){return task('Наблюдение стало записью','Результат сохранён с идентификатором пробы. Команда сможет проследить, что именно исследовали.')+scene(`<article class="l10-paper l10-record">${paperHead('Лабораторный журнал')}${rows()}<p class="l10-saved">${icon('check')}Записано: ${kind==='titre'?fmt(D.titre/10)+' мл':fmt(D.brix)+' °Bx'}</p>${primary('continue',s.titreSaved&&s.brixSaved?'Сверить результаты':kind==='titre'?'К рефрактометру':'К титрованию')}</article>`,'l10-documents')+feedback();}
  function rigArt(){
   const finalPink=s.mixed&&s.volume>=D.titre;
   const flask=`<div class="l10-flask-art">${sprite(5)}<svg class="l10-liquid" viewBox="0 0 200 220" aria-hidden="true"><path class="l10-liquid-base" d="M48 163Q100 150 151 163L176 200Q100 226 24 200Z" fill="${finalPink?s.volume>D.titre?'#d9659a':'#f3b3ce':'#f3e4b6'}"/><ellipse class="l10-reaction-spot" cx="126" cy="173" rx="21" ry="12" fill="#e389b4" opacity="${!s.mixed?'.95':'0'}"/></svg></div>`;
   return `<div class="l10-rig ${s.rig?'is-set':'is-unset'}" data-info="titre">${part(2,'l10-stand','Бюретка на штативе')}<div class="l10-burette-column" style="--used:${s.volume}"><i></i></div><div class="l10-valve" data-mechanism="valve" role="slider" tabindex="0" aria-label="Кран бюретки" aria-valuemin="0" aria-valuemax="100" aria-valuenow="${opening}" aria-valuetext="${opening?'Открыт '+Math.round(opening)+' процентов':'Закрыт'}" title="Поверни кран. Чем больше открытие, тем быстрее поток. Home или Escape — закрыть."><div class="l10-valve-handle">${part(3)}</div><span class="l10-mechanism-label">Кран</span></div><div class="l10-stream" aria-hidden="true"><i></i><i></i></div><div class="l10-flask-seat" data-site="flask-seat" tabindex="0" role="group" aria-label="Рабочее место колбы под бюреткой"></div>${grab('flask','Колба · порция A',flask,'l10-flask '+(s.rig?'is-docked':''))}<div class="l10-burette-scale"><span>Расход титранта</span><strong><b data-volume>${fmt(s.volume/10)}</b> <small>мл</small></strong><span data-flow-status>Кран закрыт</span><small data-flow-rate>0,00 мл/с · начало 0,0 мл</small></div><div class="l10-colour-caption" data-colour>${!s.mixed?'Локальная окраска: перемешай раствор':s.volume===0?'Порция A':finalPink?s.volume>D.titre?'Яркая окраска — момент пройден':'Слабая окраска сохраняется':'Окраска исчезла после перемешивания'}</div><meter class="l10-gesture-meter" min="0" max="1" value="0" aria-label="Движение колбы для перемешивания"></meter></div>`;
  }
  function titration(){
   if(s.titreSaved)return recorded('titre');
   let title,copy,actions='';
   if(!s.rig){title='Поставь колбу под бюретку';copy='Перенеси колбу с порцией A на рабочее место под носиком. Наставник проверил установку; начальный отсчёт — 0,0 мл.';}
   else if(s.volume>D.titre&&s.mixed){title='Возьми новую порцию';copy='После перемешивания окраска слишком яркая: момент завершения пройден. Повтори опыт на новой порции без штрафа.';actions=primary('retry-titre','Новая порция A');}
   else if(s.observed){title='Запиши наблюдение';copy='Слабая окраска сохранилась после перемешивания. Запиши фактический расход: это часть исследования кислотности.';actions=primary('save-titre','Записать '+fmt(s.volume/10)+' мл');}
   else {title=s.volume===0?'Управляй подачей':!s.mixed?'Перемешай и наблюдай':'Оцени окраску';copy=!s.mixed?'Закрой кран, затем возьми колбу и плавно покачай в разные стороны. Окраска в месте падения капли ещё не означает завершение.':s.volume>=30?'Рядом с моментом завершения слегка приоткрывай кран. Останови подачу сам, перемешай и оцени окраску.':'Поверни кран бюретки, чтобы начать подачу. Скорость зависит от открытия; верни кран назад, чтобы остановить.';if(s.mixed&&s.volume>0)actions=`<div class="l10-observation" role="group" aria-label="Наблюдение после перемешивания">${btn('observe','Окраска исчезла','','fades')}${btn('observe','Слабая окраска осталась','','persists')}</div>`;}
   return task(title,copy,'titre')+scene(`${rigArt()}<div class="l10-titre-actions">${actions}</div>${btn('choose-method','Другой метод','l10-switch')}`,'l10-titration')+feedback();
  }
  function refraction(repeat=false){
   if(!repeat&&s.brixSaved)return recorded('brix');
   const measured=repeat?s.repeatStage>=3:s.read;
   let title,copy;
   if(ref.measuring){title='Прибор измеряет';copy='Дождись стабильного показания. Ты уже подготовил ячейку, нанёс образец и закрыл крышку.';}
   else if(measured){title='Считай и запиши';copy='Считай стабильное показание с экрана и внеси его в журнал. °Bx — учебная оценка растворённых веществ, а не точное содержание сахара.';}
   else if(ref.lid<.7&&(!ref.clean||s.control&&ref.well==='control'||ref.well==='residue')){title=repeat?'Подготовь повтор':'Открой ячейку';copy=repeat?'Наставник назначил повтор новой порции. Открой крышку и очисти поверхность: исходная запись останется в журнале.':'Подними крышку прибора. Чтобы остатки не повлияли на показание, измерительную поверхность нужно подготовить.';}
   else if(!ref.clean||s.control&&ref.well==='control'||ref.well==='residue'){title='Подготовь поверхность';copy='Возьми салфетку и протри открытую измерительную поверхность несколькими движениями. Остатки предыдущего измерения нужно убрать.';}
   else if(!ref.well){title=!s.control&&!repeat?'Проверь контроль':'Нанеси новую порцию';copy=!s.control&&!repeat?'Набери пипеткой контрольный материал 10,0 °Bx и перенеси его на чистую ячейку. Известное значение помогает проверить прибор.':repeat?'Набери новую порцию L-041 и перенеси пипеткой на ячейку. Повтор проверит, воспроизводится ли отклонение.':'Набери пипеткой порцию B, затем нанеси её на ячейку. Эта порция не участвовала в титровании.';}
   else if(ref.lid>.15){title='Закрой крышку';copy='Образец на поверхности. Опусти крышку самостоятельно: прибор должен измерять в подготовленных условиях.';}
   else {title='Выполни измерение';copy='Нажми клавишу измерения на корпусе прибора. Потом считай стабильное показание с экрана.';}
   const status=ref.measuring?'Измерение…':measured?'Стабильное показание':ref.well==='residue'?'Требуется очистка':ref.well==='control'?'Контроль на поверхности':ref.well==='sample'?'Проба на поверхности':ref.clean?'Ячейка чистая':'Требуется подготовка';
   const sourceName=repeat?'Новая порция · L-041':'L-041 · B';
   return task(title,copy,'brix')+scene(`<div class="l10-ref-bench"><div class="l10-vials"><div class="l10-vial" data-site="vial-control" tabindex="0" role="group" aria-label="Контрольный материал 10,0 градусов Брикс">${bottle('Контроль')}<strong>10,0 °Bx</strong><span>Контрольный материал</span></div><div class="l10-vial" data-site="vial-sample" tabindex="0" role="group" aria-label="${sourceName}">${bottle(repeat?'L-041 · повтор':'L-041 · B')}<strong>${repeat?'Новая порция':'Порция B'}</strong><span>${D.sample}</span></div></div>${deviceArt()}<div class="l10-tools">${grab('cloth','Салфетка','<div class="l10-cloth-art"></div>','l10-cloth')}${grab('pipette','Пипетка',sprite(3)+`<span class="l10-pipette-content">${ref.pipette?ref.pipette==='control'?'Контроль':'Проба':'Пустая'}</span>`,'l10-pipette '+(ref.pipette?'is-loaded':''))}<div class="l10-tool-rest" data-site="waste" tabindex="0" role="group" aria-label="Лоток для опустошения пипетки">Лоток</div></div><div class="l10-ref-status" data-ref-status>${status}</div>${measured?`<form class="l10-record-form"><label for="l10-value">Показание с экрана, °Bx</label><div><input id="l10-value" inputmode="decimal" autocomplete="off" placeholder="Введи число" aria-label="Показание рефрактометра" value="">${primary('record-reading',repeat?'Сохранить повтор':'Записать в журнал')}</div></form>`:''}</div>${!repeat?btn('choose-method','Другой метод','l10-switch'):''}`,'l10-refraction')+feedback();
  }
  function results(){
   return task(s.noticed?'Сообщи об отклонении':'Сопоставь с диапазоном',s.noticed?'Лаборант сохраняет необычные числа. Выбери следующее действие: решение о выпуске принимает уполномоченный специалист.':'Нажми на результат, который выходит за заданные границы. Это учебные диапазоны, а не нормативы компании.')+scene(`<article class="l10-paper l10-comparison">${paperHead('Сверка данных')}<div class="l10-table-head"><span>Измерено</span><span>Учебный диапазон</span></div>${[['titre','Титрование · расход',D.titre/10,D.titreRange,'мл'],['brix','Рефрактометр',D.brix,D.brixRange,'°Bx']].map(([key,label,value,range,unit])=>btn('notice',`<span>${label}<strong>${fmt(value)} ${unit}</strong></span><span>${range.map(fmt).join('–')} ${unit}${s.noticed&&key==='brix'?'<b>Ниже диапазона</b>':''}</span>`,'l10-result-row '+(s.noticed&&key==='brix'?'is-marked':''),key,false,`aria-label="${label}: ${fmt(value)} ${unit}, учебный диапазон ${range.map(fmt).join('–')} ${unit}"`)).join('')}${s.noticed?`<div class="l10-decisions" role="group" aria-label="Следующее действие">${[['hold','Сообщить наставнику'],['release','Передать без замечаний'],['fix','Изменить состав пробы']].map(([value,label])=>btn('judgement',label,s.judgement===value?'is-selected':'',value,false,`aria-pressed="${s.judgement===value}"`)).join('')}</div>${primary('report','Передать наблюдение','',!s.judgement)}`:'<p class="l10-muted">Какой результат за пределами диапазона?</p>'}</article>`,'l10-documents')+feedback();
  }
  function team(){
   if(s.repeatStage<4)return refraction(true);
   if(s.done)return final();
   return task('Передай всю картину','Оба показания 9,2 °Bx ниже учебного диапазона. Причина не установлена: наставнику нужны обе записи и отметка об отклонении.')+scene(`<article class="l10-paper l10-handover">${paperHead('Для наставника')}${rows()}<p class="l10-conclusion">Отклонение подтверждено повтором.<br>Причина не установлена.</p>${primary('handover','Передать данные наставнику')}<p class="l10-muted">Решение по партии P-214 — у уполномоченного специалиста.</p></article>`,'l10-documents')+feedback();
  }
  function final(){
   return task('Точные данные —\nпомощь команде','Ты принял пробу, подготовил её, выполнил два исследования, заметил отклонение, сохранил повтор и передал данные наставнику.')+scene(`<article class="l10-paper l10-final-paper">${paperHead('Итог первой смены')}${rows()}<p class="l10-conclusion">9,2 °Bx ниже 9,8–10,2 °Bx.<br>Исходное измерение и повтор переданы.</p><p>Лаборант помогает контролировать качество напитков: исследует пробы, получает точные данные и сообщает об отклонениях.</p>${quiz?`<p class="l10-saved">${icon('check')}Передавать нужно обе записи: так команда видит полную картину.</p>${a.button('finish','Записать открытие'+icon('arrow'),'','l10-button l10-primary')}`:`<fieldset class="l10-quiz"><legend>Повтор подтвердил отклонение. Что передашь наставнику?</legend>${btn('answer','Исходный результат, повтор и отметку об отклонении','','all')}${btn('answer','Только повтор: первый результат можно удалить','','repeat')}${btn('answer','Значение из диапазона, чтобы не задерживать партию','','range')}</fieldset>`}${btn('about','О профессии и практике','l10-text')}${btn('restart','Пройти заново','l10-text')}</article>`,'l10-documents l10-final')+feedback();
  }
  function paint(){
   if(disposed)return;a.settle();
   const active=document.activeElement,hadFocus=world.contains(active),key=active?.closest('[data-key]')?.dataset.key,mechanism=active?.dataset.mechanism;
   const html=!s.started?welcome():s.phase===0?receipt():s.phase===1?preparation():s.phase===2?(picking||!s.method?methods():s.method==='titre'?titration():refraction()):s.phase===3?results():team();
   world.innerHTML=html+companion()+`<footer class="l10-foot">${btn('about','Учебная модель','l10-text')}<span>${storageOK?'Прогресс сохранён на устройстве':'Сохранение недоступно: прогресс до закрытия страницы'}</span></footer>`;
   world.className='l10-world '+(!s.started?'is-entry':'is-phase-'+s.phase)+(s.done?' is-final':'');
   if(hadFocus){const next=mechanism?world.querySelector(`[data-mechanism="${mechanism}"]`):[...world.querySelectorAll('[data-key]')].find(n=>n.dataset.key===key&&!n.disabled);(next||world.querySelector('[data-next]:not(:disabled)')||world.querySelector('[data-grab],button:not(:disabled)'))?.focus({preventScroll:true});}
   syncEquipment();
  }
  function part(n,cls='',label=''){
   const boxes=[[24,140,632,400],[760,180,395,315],[165,610,350,625],[760,815,390,205]],v=boxes[n],id='l10-part-'+(++spriteID);
   return `<svg class="l10-sprite ${cls}" viewBox="${v.join(' ')}" ${label?`role="img" aria-label="${esc(label)}"`:'aria-hidden="true"'}><defs><clipPath id="${id}"><rect x="${v[0]}" y="${v[1]}" width="${v[2]}" height="${v[3]}"/></clipPath></defs><image href="assets/lab-v10-mechanics.png" width="1280" height="1280" clip-path="url(#${id})"/></svg>`;
  }
  function grab(kind,label,html,cls='',attrs=''){
   return `<div class="l10-grabbable ${cls}" data-grab="${kind}" tabindex="0" role="button" aria-label="${esc(label)}" aria-describedby="l10-gesture-help" title="${esc(label)}" ${attrs}>${html}<span class="l10-grip-label">${label}</span></div>`;
  }
  function announce(text,error=false){note=text;bad=error;live.textContent=text;const box=world.querySelector('.l10-feedback');if(box){box.innerHTML=icon(error?'info':'check')+esc(text);box.classList.toggle('is-error',error);}else world.insertAdjacentHTML('beforeend',feedback());}
  function syncEquipment(){
   const valve=world.querySelector('[data-mechanism="valve"]');
   if(valve){valve.style.setProperty('--opening',opening);valve.setAttribute('aria-valuenow',String(Math.round(opening)));valve.setAttribute('aria-valuetext',opening?'Открыт '+Math.round(opening)+' процентов':'Закрыт');}
   const volume=world.querySelector('[data-volume]');if(volume)volume.textContent=fmt(s.volume/10);
   const status=world.querySelector('[data-flow-status]');if(status)status.textContent=opening?'Подача · '+Math.round(opening)+'% открытия':'Кран закрыт';
   const rate=world.querySelector('[data-flow-rate]');if(rate)rate.textContent=fmt(I.flowRate(opening)/10)+' мл/с · начало 0,0 мл';
   const rig=world.querySelector('.l10-rig');if(rig){rig.classList.toggle('is-flowing',opening>0);rig.style.setProperty('--used',s.volume);}
   const liquid=world.querySelector('.l10-liquid-base');if(liquid)liquid.setAttribute('fill',s.mixed&&s.volume>=D.titre?(s.volume>D.titre?'#d9659a':'#f3b3ce'):'#f3e4b6');
   const spot=world.querySelector('.l10-reaction-spot');if(spot)spot.setAttribute('opacity',!s.mixed?'.95':'0');
   const caption=world.querySelector('[data-colour]');if(caption)caption.textContent=!s.mixed?'Локальная окраска: закрой кран и перемешай':s.volume===0?'Порция A':s.volume>D.titre?'Яркая окраска — момент пройден':s.volume===D.titre?'Слабая окраска сохраняется':'Окраска исчезла после перемешивания';
   const device=world.querySelector('.l10-ref-bench .l10-device');if(device)device.style.setProperty('--lid',ref.lid);
   const lid=world.querySelector('[data-mechanism="lid"]');if(lid){lid.setAttribute('aria-valuenow',String(Math.round(ref.lid*100)));lid.setAttribute('aria-valuetext',ref.lid>.7?'Открыта':ref.lid<.15?'Закрыта':'Приоткрыта');}
  }
  function setValve(value){
   const next=I.clamp(Number(value)||0,0,100);
   if(next===0&&opening===0){syncEquipment();return;}
   if(next&&(!s.rig||s.titreSaved||s.observed||s.phase!==2||s.method!=='titre')){announce('Сначала установи колбу с порцией A под бюреткой.',true);return;}
   opening=next;syncEquipment();
   if(opening&&!frame){lastTime=performance.now();frame=requestAnimationFrame(flowTick);}
   if(!opening){cancelAnimationFrame(frame);frame=0;save();}
  }
  function flowTick(time){
   frame=0;if(disposed||!opening)return;
   const r=I.integrate(s.volume,carry,opening,(time-lastTime)/1000);lastTime=time;carry=r.carry;
   if(r.volume!==s.volume){s={...s,volume:r.volume,mixed:false,observed:false};save();syncEquipment();}
   if(s.volume>=50){setValve(0);announce('Подача остановлена: учебная вместимость достигнута. Перемешай и оцени раствор.',true);return;}
   frame=requestAnimationFrame(flowTick);
  }
  function stopOperations(){setValve(0);clearTimeout(measureTimer);measureTimer=0;if(ref.measuring)ref.measuring=false;clearInterval(tempTimer);tempTimer=0;}
  function instrumentRead(){
   if(ref.measuring)return;
   if(ref.lid>.15){announce('Закрой крышку перед измерением.',true);return;}
   if(!ref.well||ref.well==='residue'){announce('Нужна подготовленная поверхность и нанесённый материал.',true);return;}
   const repeat=s.phase===4;
   if(ref.well==='sample'&&(!ref.clean||(!repeat&&!s.loaded)||(repeat&&s.repeatStage<2))){announce('Проба ещё не подготовлена к измерению.',true);return;}
   ref.measuring=true;note='';bad=false;paint();
   measureTimer=setTimeout(()=>{measureTimer=0;if(disposed)return;ref.measuring=false;if(ref.well==='control'&&!s.control)dispatch('control');else dispatch('stable');},900);
  }
  function setLid(value,commit=false){
   ref.lid=I.clamp(value,0,1);syncEquipment();
   if(commit){
    if(ref.lid<.15&&ref.well==='sample'){if(s.phase===4&&s.repeatStage===2&&!s.repeatCover)dispatch('repeat-cover');else if(s.phase===2&&s.loaded&&!s.cover)dispatch('cover');else{save();paint();}}
    else if(ref.lid>.7){if(s.phase===2&&!s.brixSaved){s.cover=false;s.read=false;}if(s.phase===4&&s.repeatStage<4){s.repeatCover=false;if(s.repeatStage===3)s.repeatStage=2;}save();paint();}
    else {save();paint();}
   }
  }
  function locateSite(point){return [...world.querySelectorAll('[data-site]')].find(n=>{const r=n.getBoundingClientRect();return point.x>=r.left&&point.x<=r.right&&point.y>=r.top&&point.y<=r.bottom;});}
  function pointForDrag(d){const r=d.node.getBoundingClientRect();return d.kind==='pipette'?{x:r.left+r.width/2,y:r.bottom-8}:{x:d.x,y:d.y};}
  function makeDrag(node,x,y){
   const kind=node.dataset.grab;if(kind==='flask'&&opening){announce('Сначала закрой кран. Подавать раствор в движущуюся колбу нельзя.',true);return null;}
   if(ref.measuring){announce('Дождись показания прибора.',true);return null;}
   const rect=node.getBoundingClientRect();return {node,kind,startX:x,startY:y,x,y,dx:0,dy:0,lastDX:0,lastDY:0,path:I.gesture(),wipe:0,rect};
  }
  function moveDrag(d,x,y){
   const scale=world.querySelector('.l10-rig')?.getBoundingClientRect().height/625||1;
   const docked=d.kind==='flask'&&s.rig,limit=docked||d.kind==='mix-source'?140:1000;
   d.dx=I.clamp(x-d.startX,-limit,limit);d.dy=I.clamp(y-d.startY,-(docked?100:1000),docked?45:1000);d.x=d.startX+d.dx;d.y=d.startY+d.dy;
   const vx=d.dx-d.lastDX,vy=d.dy-d.lastDY;d.lastDX=d.dx;d.lastDY=d.dy;
   d.node.style.transform=`translate(${d.dx}px,${d.dy}px) rotate(${d.kind==='flask'||d.kind==='mix-source'?I.clamp(vx*.35,-12,12):d.kind==='pipette'?-8:0}deg)`;
   d.node.classList.add('is-grabbed');
   const progress=d.path.move(vx/(scale||1),vy/(scale||1));
   world.querySelectorAll('.l10-gesture-meter').forEach(m=>m.value=progress.amount);
   const liquid=d.node.querySelector('.l10-liquid');if(liquid){liquid.style.transform=`rotate(${I.clamp(-vx*.45,-10,10)}deg)`;const spot=liquid.querySelector('.l10-reaction-spot');if(spot&&!s.mixed)spot.style.opacity=String(1-progress.amount*.8);}
   const site=locateSite(pointForDrag(d));world.querySelectorAll('[data-site]').forEach(n=>n.classList.toggle('is-target',n===site));
   if(d.kind==='cloth'&&site?.dataset.site==='well'){
    if(ref.lid<.7){announce('Подними крышку: салфетке нужна открытая поверхность.',true);return;}
    if(d.wasInWell)d.wipe+=Math.hypot(vx,vy);d.wasInWell=true;const well=world.querySelector('.l10-well');if(well)well.style.setProperty('--wipe',Math.min(1,d.wipe/70));
   }else d.wasInWell=false;
  }
  function finishDrag(d,site){
   d.node.style.transform='';d.node.classList.remove('is-grabbed');world.querySelectorAll('.is-target').forEach(n=>n.classList.remove('is-target'));
   const target=site?.dataset.site,progress=d.path.progress();
   if(d.kind==='flask'){
    if(!s.rig){if(target==='flask-seat')dispatch('rig');else announce('Поставь колбу на отмеченное место под носиком бюретки.',true);}
    else if(!s.mixed){if(progress.ready){dispatch('mix');announce(s.volume===D.titre?'После перемешивания слабая окраска остаётся. Оцени наблюдение.':s.volume>D.titre?'Окраска слишком яркая. Для повторения нужна новая порция.':'Окраска исчезла. Ты перемешал раствор; оцени наблюдение или продолжай.');}else{syncEquipment();announce('Нужно перемешать всю порцию: сделай ещё несколько плавных движений в разные стороны.',true);}}
    else announce('Колба возвращена на рабочее место.');
   }else if(d.kind==='mix-source'){if(progress.ready)dispatch('prepare');else announce('Покачай образец в разные стороны: одиночного нажатия недостаточно.',true);}
   else if(d.kind==='source'){
    if(s.prep===0&&target==='temperature')prepareTemperature();
    else if(s.prep===2&&target?.startsWith('portion-')){const v=target.slice(-1);portions.add(v);save();if(portions.size===2)dispatch('prepare');else{note='Порция '+v+' выделена. Подготовь вторую.';paint();}}
    else announce('Перенеси пробу к нужному месту подготовки.',true);
   }else if(d.kind==='cloth'){
    if(ref.lid>=.7&&d.wipe>=70){ref.clean=true;ref.well='';if(s.phase===4)dispatch('repeat-clean');else if(s.control&&!s.clean)dispatch('clean');else{save();note='Поверхность подготовлена. Теперь нужен контрольный материал.';paint();}}
    else announce('Протри открытую ячейку несколькими движениями салфетки.',true);
   }else if(d.kind==='pipette'){
    if(target==='vial-control'||target==='vial-sample'){ref.pipette=target==='vial-control'?'control':'sample';save();note=ref.pipette==='control'?'В пипетке контрольный материал.':'В пипетке отдельная порция пробы.';paint();}
    else if(target==='waste'){ref.pipette='';save();note='Пипетка опустошена в лоток.';paint();}
    else if(target==='well'){
     const needed=s.phase===4||s.control?'sample':'control';
     if(ref.lid<.7)announce('Сначала открой крышку.',true);
     else if(!ref.clean||ref.well)announce('Сначала очисти ячейку от предыдущего материала.',true);
     else if(!ref.pipette)announce('Сначала набери материал из подписанной ёмкости.',true);
     else if(ref.pipette!==needed)announce(needed==='sample'?'Это контроль. Для исследования возьми порцию L-041.':'Сначала проверь прибор контрольным материалом 10,0 °Bx.',true);
     else{ref.well=ref.pipette;ref.pipette='';save();if(needed==='sample')dispatch(s.phase===4?'repeat-load':'load');else{note='Контроль нанесён. Закрой крышку и нажми клавишу измерения.';paint();}}
    }else announce('Пипетка возвращена. Материал переноси между подписанной ёмкостью и открытой ячейкой.',true);
   }
  }
  function prepareTemperature(){
   if(tempTimer)return;const source=world.querySelector('.l10-prep-source'),zone=world.querySelector('[data-site="temperature"]');if(source&&zone){const a=source.getBoundingClientRect(),b=zone.getBoundingClientRect();source.style.transform=`translate(${b.left+b.width/2-a.left-a.width/2}px,${b.top+b.height/2-a.top-a.height/2}px)`;}
   let value=24.3;announce('Проба в зоне подготовки. Условное время подготовки сокращено.');
   tempTimer=setInterval(()=>{value=Math.max(20.2,value-.41);const n=world.querySelector('[data-temperature]');if(n)n.innerHTML=fmt(value)+' <small>°C</small>';if(value<=20.201){clearInterval(tempTimer);tempTimer=0;dispatch('prepare');}},130);
  }
  function pointerDown(event){
   if(event.button!==0)return;const mechanism=event.target.closest('[data-mechanism]');
   if(mechanism){if(ref.measuring)return;event.preventDefault();mechanism.setPointerCapture(event.pointerId);drag={mechanism:mechanism.dataset.mechanism,node:mechanism,startX:event.clientX,startY:event.clientY,initial:mechanism.dataset.mechanism==='valve'?opening:ref.lid,moved:false};return;}
   const node=event.target.closest('[data-grab]');if(!node)return;event.preventDefault();drag=makeDrag(node,event.clientX,event.clientY);if(drag){node.setPointerCapture(event.pointerId);node.focus({preventScroll:true});}
  }
  function pointerMove(event){
   if(!drag||keyboardGrab)return;
   if(drag.mechanism){const dx=event.clientX-drag.startX,dy=event.clientY-drag.startY;if(Math.hypot(dx,dy)>4)drag.moved=true;if(drag.mechanism==='valve')setValve(drag.initial+dx*.8-dy*.4);else setLid(drag.initial-dy/110,false);}
   else moveDrag(drag,event.clientX,event.clientY);
  }
  function pointerUp(event){
   if(!drag||keyboardGrab)return;const d=drag;drag=null;
   if(d.mechanism){if(d.mechanism==='lid')setLid(ref.lid,true);else if(!d.moved&&opening>0)setValve(0);else if(!opening){save();paint();}return;}
   if(d.path.progress().distance<4){d.node.style.transform='';d.node.classList.remove('is-grabbed');showMini(d.kind==='flask'?'flask':'sample');return;}
   finishDrag(d,locateSite(pointForDrag(d)));
  }
  function keyDown(event){
   if(event.key==='Escape'&&world.querySelector('.l10-mini')){world.querySelector('.l10-mini').remove();event.preventDefault();return;}
   const n=event.target.closest('[data-mechanism]');
   if(n){const key=event.key;if(!['ArrowUp','ArrowDown','ArrowLeft','ArrowRight','Home','End','Escape',' ','Enter'].includes(key))return;event.preventDefault();if(n.dataset.mechanism==='valve'){setValve(['Home','Escape'].includes(key)?0:key==='End'?100:['ArrowUp','ArrowRight'].includes(key)?opening+5:['ArrowDown','ArrowLeft'].includes(key)?opening-5:opening?0:8);}else setLid(['Home','ArrowDown','ArrowLeft'].includes(key)?0:['End','ArrowUp','ArrowRight'].includes(key)?1:ref.lid>.5?0:1,true);return;}
   if(event.key==='Escape'){if(drag){drag.node.style.transform='';drag.node.classList.remove('is-grabbed');drag=null;keyboardGrab=false;}setValve(0);return;}
   if(keyboardGrab&&drag){
    if(event.key.startsWith('Arrow')){event.preventDefault();const dx=event.key==='ArrowLeft'?-25:event.key==='ArrowRight'?25:0,dy=event.key==='ArrowUp'?-25:event.key==='ArrowDown'?25:0;if(drag.kind==='cloth'&&event.target.closest('[data-site="well"]')&&!drag.wasInWell){const r=event.target.closest('[data-site="well"]').getBoundingClientRect();moveDrag(drag,r.left+r.width/2,r.top+r.height/2);}moveDrag(drag,drag.x+dx,drag.y+dy);}
    else if(event.key==='Enter'||event.key===' '){event.preventDefault();const site=event.target.closest('[data-site]')||locateSite(pointForDrag(drag));if(site&&drag.kind==='cloth'){const r=site.getBoundingClientRect();moveDrag(drag,r.left+r.width/2,r.top+r.height/2);drag.wipe=Math.max(drag.wipe,0);}const d=drag;drag=null;keyboardGrab=false;finishDrag(d,site);}
    return;
   }
   const node=event.target.closest('[data-grab]');if(node&&(event.key===' '||event.key==='Enter')){event.preventDefault();const r=node.getBoundingClientRect();drag=makeDrag(node,r.left+r.width/2,r.top+r.height/2);if(drag){keyboardGrab=true;node.classList.add('is-grabbed');announce('Предмет взят. Стрелки — двигать; Enter — отпустить. Для переноса можно Tab на место назначения.');}}
  }
  function showMini(kind){
   const content={titre:['Бюретка','Дозирует раствор при исследовании кислотности.',`${fmt(s.volume/10)} мл · кран ${opening?'открыт':'закрыт'}`,'Поверни рукоятку. Меньшее открытие — более медленная подача.','Расход — часть исследования кислотности. Это не pH; методику и расчёт задаёт специалист.'],flask:['Колба','В ней перемешивают порцию и наблюдают окраску.',s.mixed?'Раствор перемешан':'Нужно перемешивание','Захвати и плавно покачай в разные стороны.','Локальная окраска от капли может исчезнуть. Наблюдение оценивают после перемешивания.'],brix:['Рефрактометр','Помогает оценить содержание растворённых веществ.',ref.measuring?'Измеряет':s.read||s.repeatStage>=3?'Показание 9,2 °Bx':ref.clean?'Ячейка подготовлена':'Нужна подготовка','Подготовь поверхность, нанеси материал, закрой крышку, измерь.','°Bx читается «градусы Брикс». Для сложного напитка это не точное содержание только сахара.'],sample:['Проба '+D.sample,'Партия '+D.batch+' · источник '+D.tank,s.registered?'Зарегистрирована':'Ожидает регистрации','Нужны титрование и рефрактометрия.','Номер связывает результаты с конкретной пробой. Лаборант сохраняет точные данные, в том числе необычные.']}[kind]||null;
   if(!content)return;world.querySelector('.l10-mini')?.remove();
   const menu=document.createElement('aside');menu.className='l10-mini';menu.setAttribute('aria-label','Сведения о предмете');menu.innerHTML=btn('mini-close',icon('close'),'l10-close','',false,'aria-label="Закрыть мини-меню"')+`<h3>${content[0]}</h3><p>${content[1]}</p><p><b>${content[2]}</b></p><small>${content[3]}</small>${btn('mini-more','Подробнее','l10-text')}<p class="l10-more" hidden>${content[4]}</p>`;
   const task=world.querySelector('.l10-task');task.insertAdjacentElement('afterend',menu);menu.style.top=(task.offsetTop+task.offsetHeight+15)+'px';
  }
  const details={
   titre:['Бюретка и колба','Титрование — исследование с дозированным добавлением раствора. Бюретка позволяет отсчитать расход титранта, а колба — перемешать пробу и наблюдать окраску.','В этой модели расход 3,4 мл — часть исследования кислотности. Это не pH и не готовый расчёт кислотности. Методика, реактивы и расчёт определяются специалистом.'],
   brix:['Что показывает рефрактометр','Прибор использует преломление света и помогает оценивать содержание растворённых веществ. °Bx читается «градусы Брикс».','В сложном напитке показание нельзя считать точным содержанием только сахара. В игре мы сравниваем его с заданным учебным диапазоном.'],
   label:['Этикетка пробы','Идентификатор связывает измерение с конкретной пробой. На этикетке и в направлении должны совпасть партия и источник.','Если данные расходятся, пробу сначала уточняют у ответственного специалиста; измерение неопознанной пробы не даст надёжного адреса результата.']
  };
  function panel(type,value){
   lastTrigger=document.activeElement;
   let content;
   if(type==='route')content='<h2>Путь пробы</h2>'+`<nav aria-label="Путь пробы">${['Приёмка','Подготовка','Два исследования','Сверка и сообщение','Повтор и передача'].map((label,i)=>btn('phase',label,i===s.phase?'is-selected':'',i,i>M.maxPhase(s),i===s.phase?'aria-current="step"':'')).join('')}</nav>`;
   else if(type==='journal')content=paperHead('Лабораторный журнал')+rows()+(s.noticed?'<p>Отклонение: исходное показание ниже учебного диапазона.</p>':'')+(s.reported?'<p>Наставник уведомлён. Назначен повтор на новой порции.</p>':'')+(s.done?'<p>Данные переданы наставнику. Решение о выпуске — у уполномоченного специалиста.</p>':'');
   else if(type==='film')content='<h2>Работа химика-лаборанта</h2><video controls playsinline preload="metadata" src="assets/lab-work-ochakovo.mp4" aria-label="Ролик компании о химике-лаборанте"></video><p>Ролик из материалов компании.</p>';
   else if(type==='detail'){const d=details[value]||details.label;content=`<h2>${d[0]}</h2><p>${d[1]}</p><p>${d[2]}</p>`;}
   else content='<h2>О профессии и практике</h2><p>Химик-лаборант принимает и готовит пробы, выполняет исследования по установленной методике, сохраняет точные данные и сообщает об отклонениях.</p><p>Стажёр работает с наставником. Решение о выпуске партии принимает уполномоченный специалист.</p><h3>Попробовать профессию</h3><p>В предоставленном описании практики «Очаково» лаборатория указана среди подразделений для практикантов. Среди задач названы взятие проб и контроль качества продукции.</p><p><a href="#careers">Открыть раздел «Практика и работа»</a></p><h3>Об учебной сцене</h3><p>Сюжет, значения, диапазоны и время подготовки условные. Это не нормативы компании и не инструкция для самостоятельной работы. Иллюстрации игровые.</p><p>Расход титранта — часть исследования кислотности. °Bx — учебная оценка растворённых веществ, не точное содержание сахара для любого напитка.</p>';
   dialog.innerHTML=btn('close',icon('close'),'l10-close','',false,'aria-label="Закрыть"')+content;dialog.setAttribute('aria-label',type==='journal'?'Журнал пробы':type==='route'?'Путь пробы':'Справка лаборатории');dialog.showModal();
  }
  function animate(type){
   if(window.GameMotion?.enabled()===false||matchMedia('(prefers-reduced-motion: reduce)').matches)return;
   const q=selector=>world.querySelector(selector);
   a.animate(g=>{
    const t=g.timeline({defaults:{duration:.35,ease:'power2.out'}});
    if(type==='dose')t.fromTo(q('.l10-falling-drop'),{y:0,opacity:1},{y:80,opacity:0,duration:.4,ease:'power2.in'}).fromTo(q('.l10-liquid'),{opacity:.12},{opacity:.85,duration:.18},.3);
    else if(type==='mix')t.to(q('.l10-flask'),{rotation:6,x:10,duration:.18}).to(q('.l10-flask'),{rotation:-5,x:-8,duration:.18}).to(q('.l10-flask'),{rotation:0,x:0,duration:.2,clearProps:'transform'}).fromTo(q('.l10-liquid path'),{fill:'#f3b3ce'},{fill:s.volume<D.titre?'#f3e4b6':s.volume>D.titre?'#d9659a':'#f3b3ce',duration:.4},.2);
    else if(type==='prepare-1')t.fromTo(q('.l10-number'),{opacity:.4},{opacity:1});
    else if(type==='prepare-2')t.fromTo(q('.l10-prep-bottle>.l10-bottle'),{rotation:-8},{rotation:0,duration:.6,clearProps:'transform'});
    else if(type==='load')t.fromTo(q('.l10-sample-drop'),{y:-38,opacity:.4},{y:0,opacity:1,duration:.45,clearProps:'transform,opacity'});
    else if(type==='cover')t.fromTo(q('.l10-device-image'),{rotationX:-12},{rotationX:0,duration:.35,clearProps:'transform'});
    else if(type==='stable')t.fromTo(q('.l10-reading'),{opacity:.35},{opacity:1});
    else if(type==='record'||type==='handover')t.fromTo(q('.l10-paper'),{y:14,opacity:.6},{y:0,opacity:1,clearProps:'transform,opacity'});
    else return null;
    return t;
   });
  }
  function dispatch(type,value){
   setValve(0);
   const oldPhase=s.phase,r=M.transition(s,type,value);s=r.state;note=r.bad?r.note:['record','stable','observe','mix'].includes(r.motion)?'':r.note;bad=r.bad;
   if(type==='method'){picking=false;closeView=false;if(value==='brix'&&ref.context!=='first')ref=I.refState(s,false);}
   if(oldPhase!==s.phase){hint=false;closeView=false;if(s.phase===4&&oldPhase!==4)ref=I.refState(s,true);}
   if(type==='retry-titre'){carry=0;closeView=false;}
   if(type==='restart'){portions.clear();quiz=false;picking=false;hint=false;closeView=false;carry=0;ref=I.refState(s,false);}
   if(r.changed)save();paint();live.textContent=note;
   if(oldPhase!==s.phase||type==='start')world.querySelector('.l10-task h2')?.focus({preventScroll:true});
  }
  function act(type,value){
   if(!type.startsWith('l10-'))return;type=type.slice(4);
   if(type==='detail'){setValve(0);showMini(value);return;}
   if(type==='mini-close'){world.querySelector('.l10-mini')?.remove();return;}
   if(type==='mini-more'){const p=world.querySelector('.l10-more');if(p)p.hidden=!p.hidden;return;}
   if(['route','journal','film','about'].includes(type)){stopOperations();panel(type,value);return;}
   if(type==='close'){dialog.close();return;}
   if(type==='motion'){setValve(0);window.GameMotion?.toggle();return;}
   if(type==='hint'){setValve(0);hint=!hint;paint();return;}
   if(type==='phase'){stopOperations();dialog.close();picking=Number(value)===2;dispatch(type,value);return;}
   if(type==='choose-method'){stopOperations();picking=true;note='';bad=false;paint();return;}
   if(type==='instrument-read'){instrumentRead();return;}
   if(type==='record-reading'){
    const entered=Number((world.querySelector('#l10-value')?.value||'').replace(',','.'));
    if(!Number.isFinite(entered)||Math.abs(entered-D.brix)>.001){announce('Сверь запись с устойчивым показанием на экране. Записывай фактическое число.',true);return;}
    dispatch(s.phase===4?'repeat-save':'save-brix');return;
   }
   if(type==='continue'){dispatch(s.titreSaved&&s.brixSaved?'to-results':'method',s.titreSaved?'brix':'titre');return;}
   if(type==='inspect'){dispatch(type,value);note=value==='seal'?'Крышка целая. Проба открыта для подготовки.':value==='label'?'На этикетке: L-041, партия P-214, источник T-07.':'Источник T-07 совпал с этикеткой.';paint();live.textContent=note;return;}
   if(type==='answer'){if(value==='all'){quiz=true;bad=false;note='';save();}else{bad=true;note=value==='repeat'?'Исходное показание тоже нужно: повтор дополняет его. Попробуй ещё раз.':'Подменять число нельзя. Передай реальные результаты и отклонение. Попробуй ещё раз.';}paint();live.textContent=note;return;}
   if(['dose','mix','prepare','portion','rig','clean','load','cover','control','stable','repeat-clean','repeat-load','repeat-cover'].includes(type))return;
   dispatch(type,value);
  }
  function shell(){
   a.content.innerHTML=`<div class="l10-app"><header class="l10-top"><a href="#map" class="l10-map" aria-label="На карту завода">${icon('back')}<span>Карта завода</span></a><img src="assets/ochakovo-logo.png" alt="Очаково. Натуральные напитки" width="166" height="40"><h1>Лаборатория</h1><nav aria-label="Инструменты лаборатории">${btn('route',icon('route')+'<span>Маршрут</span>','l10-utility','',false,'aria-label="Маршрут пробы"')}${btn('journal',icon('book')+'<span>Журнал</span>','l10-utility','',false,'aria-label="Лабораторный журнал"')}${btn('film',icon('play'),'l10-utility','',false,'aria-label="Ролик компании"')}${btn('motion',icon(window.GameMotion?.enabled()===false?'play':'pause'),'l10-utility','',false,'aria-label="Переключить анимации"')}</nav></header><div class="l10-world"></div><dialog class="l10-dialog"></dialog></div>`;
   world=a.content.querySelector('.l10-world');dialog=a.content.querySelector('dialog');
   dialog.addEventListener('close',()=>{dialog.querySelector('video')?.pause();lastTrigger?.isConnected&&lastTrigger.focus({preventScroll:true});});
   world.addEventListener('pointerdown',pointerDown);world.addEventListener('pointermove',pointerMove);world.addEventListener('pointerup',pointerUp);world.addEventListener('pointercancel',()=>{if(drag?.node){drag.node.style.transform='';drag.node.classList.remove('is-grabbed');}drag=null;keyboardGrab=false;setValve(0);});world.addEventListener('keydown',keyDown);world.addEventListener('submit',e=>e.preventDefault());world.addEventListener('click',e=>{if(e.target.closest('[data-do],[data-grab],[data-mechanism]'))return;const n=e.target.closest('[data-info]');if(n)showMini(n.dataset.info);});
  }
  const motionChange=e=>{const b=a.content.querySelector('[data-do="l10-motion"]');if(b){b.innerHTML=icon(e.detail.enabled?'pause':'play');b.setAttribute('aria-pressed',String(e.detail.enabled));}};
  document.addEventListener('ochakovo:motion',motionChange);
  const pageHide=()=>{stopOperations();if(drag?.node)drag.node.style.transform='';drag=null;keyboardGrab=false;};
  const visibility=()=>{if(document.hidden)pageHide();};document.addEventListener('visibilitychange',visibility);window.addEventListener('pagehide',pageHide);

  return {managesFocus:true,start(){save();shell();paint();},act,done:()=>s.done&&quiz,result:()=>({learned:window.OchakovoShift.roles.lab.learned}),cleanup(){stopOperations();disposed=true;dialog?.querySelector('video')?.pause();document.removeEventListener('ochakovo:motion',motionChange);document.removeEventListener('visibilitychange',visibility);window.removeEventListener('pagehide',pageHide);document.removeEventListener('visibilitychange',visibility);window.removeEventListener('pagehide',pageHide);document.removeEventListener('visibilitychange',visibility);window.removeEventListener('pagehide',pageHide);document.removeEventListener('visibilitychange',visibility);window.removeEventListener('pagehide',pageHide);document.removeEventListener('visibilitychange',visibility);window.removeEventListener('pagehide',pageHide);document.removeEventListener('visibilitychange',visibility);window.removeEventListener('pagehide',pageHide);}};
 });
})();

