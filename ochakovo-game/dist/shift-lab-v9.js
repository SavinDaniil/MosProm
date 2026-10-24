/* Illustrated preview. Shared v7 model and progress remain compatible with v8. */
(() => {
 'use strict';
 const css=document.createElement('link');css.rel='stylesheet';css.href=new URL('lab-v9.css?v=9.0',document.currentScript.src).href;document.head.append(css);
 const M=window.OchakovoLabModel,D=M.data,KEY='ochakovo-lab-workbench-v7',LEARNING='ochakovo-lab-learning-v9';
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
  let portions=new Set(extra.portions||[]),quiz=extra.quiz===true&&s.done;
  a.root.classList.add('lab-v9');
  const live=a.root.querySelector('.shift-feedback');live.classList.add('l9-announcer');
  const btn=(type,text,cls='',value='',disabled=false,attrs='')=>a.button('l9-'+type,text,value,'l9-button '+cls,`${disabled?'disabled':''} data-key="${type}:${value}" ${attrs}`);
  const primary=(type,text,value='',disabled=false)=>btn(type,text+icon('arrow'),'l9-primary',value,disabled,'data-next');
  const save=()=>{try{localStorage.setItem(KEY,JSON.stringify(s));localStorage.setItem(LEARNING,JSON.stringify({portions:[...portions],quiz}));storageOK=true;}catch{storageOK=false;}};
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
  const sprite=(n,cls='',label='')=>{const [x,y,w,h]=crops[n],id='l9-crop-'+(++spriteID);return `<svg class="l9-sprite ${cls}" viewBox="${x} ${y} ${w} ${h}" ${label?`role="img" aria-label="${esc(label)}"`:'aria-hidden="true"'}><defs><clipPath id="${id}"><rect x="${x}" y="${y}" width="${w}" height="${h}"/></clipPath></defs><image href="assets/lab-v9-atlas.png" width="1536" height="1024" clip-path="url(#${id})"/></svg>`;};
  function bottle(label=D.sample,{empty=false,open=false,cls=''}={}){
   return `<div class="l9-bottle ${empty?'is-empty':''} ${open?'is-open':''} ${cls}">${sprite(empty?2:open?1:0,'',empty?'Чистая пустая ёмкость':'Проба янтарного напитка')}<span class="l9-label"><b>${esc(label)}</b><small>${D.batch} · ${D.tank}</small></span></div>`;
  }
  const paperHead=title=>`<header><img src="assets/ochakovo-logo.png" alt="Очаково" width="104" height="25"><h3>${title}</h3><p>Проба ${D.sample} · партия ${D.batch} · ${D.tank}</p></header>`;
  function rows(){return `<dl class="l9-rows"><div><dt>Титрование · расход</dt><dd>${s.titreSaved?fmt(D.titre/10)+' мл':'Ещё не записан'}</dd></div><div><dt>Рефрактометр · исходный</dt><dd>${s.brixSaved?fmt(D.brix)+' °Bx':'Ещё не записан'}</dd></div>${s.repeatStage===4?`<div><dt>Рефрактометр · повтор</dt><dd>${fmt(D.brix)} °Bx</dd></div>`:''}</dl>`;}
  function task(title,copy,detail=''){
   return `<section class="l9-task"><h2 tabindex="-1">${title}</h2><p>${esc(copy)}</p>${detail?btn('detail',icon('info')+'Как это работает','l9-detail',detail):''}</section>`;
  }
  function feedback(fallback=''){
   const text=note||fallback;
   return text?`<p class="l9-feedback ${bad?'is-error':''}" role="status">${icon(bad?'info':'check')}${esc(text)}</p>`:'';
  }
  function scene(html,cls=''){return `<div class="l9-scene ${cls}">${html}</div>`;}
  function companion(){return `<aside class="l9-companion"><img src="assets/lab-guide-illustrated.png" alt="Огонёк — твой напарник" width="110" height="143"><div>${hint?`<p>${esc(help[s.phase])}</p>`:''}${btn('hint',hint?'Скрыть подсказку':'Помощь Капли','l9-help','',false,`aria-expanded="${hint}"`)}</div></aside>`;}
  function welcome(){return task('Первая проба.\nТвоя смена.','С производства пришла проба напитка. Проверь её свойства, запиши результаты и сообщи наставнику, если обнаружишь отклонение.')+scene(`<div class="l9-sample-hero">${bottle(D.sample)}</div><article class="l9-paper l9-assignment">${paperHead('Задание стажёру')}<p>Принять пробу → подготовить → исследовать → передать данные.</p><p class="l9-muted">Ты получаешь достоверные данные. Решение о выпуске партии принимает уполномоченный специалист.</p>${primary('start','Принять пробу')}<small>Без таймера и штрафов</small></article>`,'l9-entry');}
  function receipt(){
   const checked=k=>s.checks.includes(k);
   return task('У пробы есть адрес','Сверь этикетку с направлением: результат должен относиться к нужной партии.')+scene(`<div class="l9-receipt-bottle">${bottle(D.sample,{open:checked('seal')})}<div class="l9-object-actions">${btn('inspect',checked('seal')?icon('check')+'Крышка целая':'Осмотреть крышку','','seal',false,`aria-pressed="${checked('seal')}"`)}${btn('inspect',checked('label')?icon('check')+'Этикетка сверена':'Сверить этикетку','','label',false,`aria-pressed="${checked('label')}"`)}</div></div><article class="l9-paper l9-direction">${paperHead('Направление')}<dl class="l9-rows"><div><dt>Партия</dt><dd>${D.batch}</dd></div><div><dt>Источник</dt><dd>${D.tank}</dd></div></dl><p class="l9-muted">Основа напитка · отбор 10:20<br>До насыщения газом</p>${btn('inspect',checked('source')?icon('check')+'Источник совпал':'Сверить источник','','source',false,`aria-pressed="${checked('source')}"`)}<p class="l9-count">Сверено: ${s.checks.length} из 3</p>${primary('register','Зарегистрировать','',s.checks.length<3)}</article>`,'l9-receipt')+feedback(s.checks.length===3?'Целостность проверена; P-214 и T-07 совпадают. Можно присвоить пробе запись L-041.':'');
  }
  function preparation(){
   const texts=[['Подготовь температуру','Условия могут влиять на показания. Приведи образец к 19–21 °C по учебной карточке.'],['Перемешай образец','Состав порции должен отражать состав пробы. Аккуратно перемешай, ничего не добавляя.'],['Выдели две порции','Каждое исследование проводим отдельно: так остатки одного исследования не попадут в другое.'],['Проба готова','Температура 20,2 °C, образец перемешан. Обе порции подписаны L-041.']][s.prep];
   let content;
   if(s.prep>=2){content=`<div class="l9-portions">${['A','B'].map(v=>`<div class="l9-portion">${bottle(D.sample+' · '+v,{empty:s.prep===2&&!portions.has(v)})}${s.prep===2?btn('portion',portions.has(v)?icon('check')+'Порция '+v+' готова':'Подготовить '+v,'',v,portions.has(v)):`<b>${v==='A'?'Титрование':'Рефрактометр'}</b>`}</div>`).join('')}</div>${s.prep===3?primary('to-tests','Выбрать исследование'):''}`;}
   else content=`<div class="l9-prep-bottle">${bottle(D.sample,{open:true})}${primary('prepare',s.prep===0?'Подготовить температуру':'Перемешать')}</div><article class="l9-paper l9-temperature"><h3>Температура пробы</h3><strong class="l9-number">${s.prep===0?'24,3':'20,2'} <small>°C</small></strong><p>Учебные условия<br><b>19–21 °C</b></p></article>`;
   return task(...texts)+scene(content,'l9-preparation')+feedback();
  }
  function deviceArt({closed=false,loaded=false,read=false,control=false}={}){
   const value=read?fmt(D.brix):control?fmt(D.control):'—';
   // Overlay and art share source coordinates and preserveAspectRatio.
   // foreignObject keeps the reading live HTML on square phone canvases too.
   const transform=closed?'matrix(.95 .14 -.47 .95 1208 768)':'matrix(.95 .14 -.48 .95 813 748)';
   return `<div class="l9-device ${closed?'is-closed':''} ${loaded?'is-loaded':''}">${sprite(closed?7:6,'l9-device-image','Рефрактометр с '+(closed?'закрытой':'открытой')+' измерительной поверхностью')}<svg class="l9-device-overlay" viewBox="${crops[closed?7:6].join(' ')}" role="img" aria-label="Показание ${value} градусов Брикс${read?', стабильно':''}"><foreignObject width="132" height="58" transform="${transform}"><div xmlns="http://www.w3.org/1999/xhtml" class="l9-reading"><strong>${value}</strong><span>°Bx</span>${read?'<small>Стабильно</small>':''}</div></foreignObject></svg>${loaded&&!closed?'<i class="l9-sample-drop" aria-label="Проба на поверхности"></i>':''}<span class="l9-device-name">РЕФРАКТОМЕТР</span></div>`;
  }
  function methods(){return task('Два взгляда на пробу','Исследуй кислотность и оцени растворённые вещества. Порядок выбираешь ты.')+scene(`<div class="l9-method"><div class="l9-method-art">${sprite(4,'','Бюретка на штативе')}${sprite(5,'l9-mini-flask','Колба')}</div><h3>Титрование</h3><p>Наблюдение за окраской<br>в исследовании кислотности</p>${primary('method',s.titreSaved?'Посмотреть запись':'К бюретке','titre')}</div><div class="l9-method">${deviceArt()}<h3>Рефрактометрия</h3><p>Учебная оценка содержания<br>растворённых веществ</p>${primary('method',s.brixSaved?'Посмотреть запись':'К рефрактометру','brix')}</div>`,'l9-methods');}
  function recorded(kind){return task('Наблюдение стало записью','Результат сохранён с идентификатором пробы. Команда сможет проследить, что именно исследовали.')+scene(`<article class="l9-paper l9-record">${paperHead('Лабораторный журнал')}${rows()}<p class="l9-saved">${icon('check')}Записано: ${kind==='titre'?fmt(D.titre/10)+' мл':fmt(D.brix)+' °Bx'}</p>${primary('continue',s.titreSaved&&s.brixSaved?'Сверить результаты':kind==='titre'?'К рефрактометру':'К титрованию')}</article>`,'l9-documents')+feedback();}
  function rigArt(){
   const pink=!s.mixed||s.volume>=D.titre,over=s.volume>D.titre;
   return `<div class="l9-rig ${closeView?'is-close':''}">${sprite(4,'l9-stand','Бюретка с краном на штативе')}<div class="l9-flask"><svg class="l9-liquid" viewBox="0 0 200 220" role="img" aria-label="${pink?(over?'Яркая':'Слабая')+' розовая окраска':'Окраска исчезла: раствор почти бесцветный'}"><path d="M60 159Q100 150 140 159L159 192Q100 215 41 192Z" fill="${pink?(over?'#d9659a':'#f3b3ce'):'#f3e4b6'}" opacity="${pink?1:.6}"/></svg>${sprite(5,'l9-flask-image')}</div><i class="l9-falling-drop" aria-hidden="true"></i><span class="l9-colour-caption">${!s.mixed?'Появилась локальная окраска':s.volume===0?'Порция A готова':pink?(over?'Яркая окраска':'Слабая окраска сохраняется'):'После перемешивания окраска исчезла'}</span></div>`;
  }
  function titration(){
   if(s.titreSaved)return recorded('titre');
   const over=s.volume>D.titre&&s.mixed;
   let title,copy,controls;
   if(!s.rig){title='Начни с установки';copy='Бюретка дозирует раствор — титрант. В исследовании кислотности его добавляют до нужного изменения окраски.';controls=primary('rig','Проверить с наставником');}
   else if(over){title='Нужна новая порция';copy='Яркая окраска после перемешивания: момент завершения пройден. Этот опыт повторим на новой порции.';controls=primary('retry-titre','Взять новую порцию');}
   else if(s.observed){title='Запиши расход';copy='Слабая окраска сохранилась после перемешивания: наблюдение помогло определить момент завершения.';controls=primary('save-titre','Записать '+fmt(s.volume/10)+' мл');}
   else if(closeView){title='Что стало с окраской?';copy='Оцени раствор после перемешивания. Это наблюдение определяет, продолжать ли добавление.';controls=`<div class="l9-observation" role="group" aria-label="Наблюдение окраски">${btn('observe','Окраска исчезла','','fades')}${btn('observe','Окраска сохранилась','','persists')}${btn('unzoom','К бюретке','l9-text')}</div>`;}
   else if(!s.mixed){title='Перемешай и наблюдай';copy='Окраска в месте падения капли ещё не означает завершение: она может исчезнуть после перемешивания.';controls=primary('mix','Перемешать колбу');}
   else {title='Добавь титрант';copy=s.volume>=30?'Добавляй по 0,1 мл: рядом с моментом завершения важна небольшая добавка. Затем перемешай.':'Открой кран бюретки, затем перемешай колбу. Следи, что происходит с окраской.';controls=`<div class="l9-doses">${primary('dose',s.volume>=30?'Огонёк · 0,1 мл':'Открыть кран · 1 мл',s.volume>=30?1:10)}${btn('dose',s.volume>=30?'Добавить 1 мл':'Добавить 0,1 мл','l9-text',s.volume>=30?10:1)}</div>${s.volume>0?btn('look','Рассмотреть раствор','l9-observe-link'):''}`;}
   return task(title,copy,'titre')+scene(`<div class="l9-titre-work">${rigArt()}<div class="l9-instrument-note"><span>Расход титранта</span><strong>${fmt(s.volume/10)} <small>мл</small></strong><small>Начало 0,0 мл · порция A</small></div><div class="l9-instrument-actions">${controls}</div></div>${btn('choose-method','Выбрать другой метод','l9-switch')}`,'l9-titration')+feedback();
  }
  function refraction(repeat=false){
   if(!repeat&&s.brixSaved)return recorded('brix');
   const control=!repeat&&s.control&&!s.clean,loaded=repeat?s.repeatStage>=2:s.loaded,closed=repeat?s.repeatCover:s.cover,readout=repeat?s.repeatStage>=3:s.read;
   let action,title,copy,label;
   if(repeat){
    [action,title,copy,label]=[
     ['repeat-clean','Наставник назначил повтор','Проверим, воспроизводится ли отклонение. Очисти ячейку: новая порция должна измеряться без остатков предыдущей.','Очистить ячейку'],
     ['repeat-load','Новая порция для повтора','Возьми свежую порцию из L-041. Первый результат остаётся в журнале.','Нанести новую порцию'],
     closed?['stable','Повтори измерение','Крышка закрыта. Считай стабильное показание той же пробы на новой порции.','Считать показание']:['repeat-cover','Закрой крышку','Новая порция нанесена. Закрой измерительную поверхность, как при первом исследовании.','Закрыть крышку'],
     ['repeat-save','Повтор: '+fmt(D.brix)+' °Bx','Отклонение воспроизвелось. Сохрани отдельную запись: повтор не заменяет исходное измерение.','Сохранить повтор']
    ][s.repeatStage];
   }else if(!s.control){action='control';title='Проверь рефрактометр';copy='Прибор помогает оценить содержание растворённых веществ. Проверь материал с известным показанием '+fmt(D.control)+' °Bx после калибровки наставником.';label='Проверить контроль';}
   else if(!s.clean){action='clean';title='Подготовь поверхность';copy='Контроль совпал: '+fmt(D.control)+' °Bx. Очисти измерительную ячейку, чтобы остатки не повлияли на пробу.';label='Очистить ячейку';}
   else if(!s.loaded){action='load';title='Нанеси отдельную порцию';copy='Порция B сохраняет состав исходной пробы. Нанеси её на чистую измерительную поверхность справа.';label='Нанести порцию B';}
   else if(!s.cover){action='cover';title='Закрой крышку';copy='Огонёк покрыла поверхность. Закрой ячейку перед считыванием показания.';label='Закрыть крышку';}
   else if(!s.read){action='stable';title='Считай показание';copy='Условия подготовлены. Записывай стабильное показание прибора.';label='Считать показание';}
   else {action='save-brix';title='Стабильно: '+fmt(D.brix)+' °Bx';copy='°Bx — учебная оценка растворённых веществ, а не точное содержание сахара для любого напитка. Сохрани фактическое число.';label='Записать '+fmt(D.brix)+' °Bx';}
   const status=readout?'Стабильное показание':control?'Контроль: 10,0 °Bx':loaded?(closed?'Крышка закрыта':'Проба нанесена'):repeat?(s.repeatStage===0?'Требуется очистка':'Ячейка чистая'):s.clean?'Ячейка чистая':'Требуется подготовка';
   return task(title,copy,'brix')+scene(`<div class="l9-ref-portion">${bottle(D.sample+(repeat?' · повтор':' · B'),{open:loaded})}<span>${repeat?'Новая порция':'Отдельная порция B'}</span></div><div class="l9-ref-work">${deviceArt({closed:closed||control,loaded:loaded||repeat&&s.repeatStage===0,read:readout,control})}<div class="l9-ref-status">${status}</div>${primary(action,label)}</div>${!repeat?btn('choose-method','Выбрать другой метод','l9-switch'):''}`,'l9-refraction')+feedback();
  }
  function results(){
   return task(s.noticed?'Сообщи об отклонении':'Сопоставь с диапазоном',s.noticed?'Лаборант сохраняет необычные числа. Выбери следующее действие: решение о выпуске принимает уполномоченный специалист.':'Нажми на результат, который выходит за заданные границы. Это учебные диапазоны, а не нормативы компании.')+scene(`<article class="l9-paper l9-comparison">${paperHead('Сверка данных')}<div class="l9-table-head"><span>Измерено</span><span>Учебный диапазон</span></div>${[['titre','Титрование · расход',D.titre/10,D.titreRange,'мл'],['brix','Рефрактометр',D.brix,D.brixRange,'°Bx']].map(([key,label,value,range,unit])=>btn('notice',`<span>${label}<strong>${fmt(value)} ${unit}</strong></span><span>${range.map(fmt).join('–')} ${unit}${s.noticed&&key==='brix'?'<b>Ниже диапазона</b>':''}</span>`,'l9-result-row '+(s.noticed&&key==='brix'?'is-marked':''),key,false,`aria-label="${label}: ${fmt(value)} ${unit}, учебный диапазон ${range.map(fmt).join('–')} ${unit}"`)).join('')}${s.noticed?`<div class="l9-decisions" role="group" aria-label="Следующее действие">${[['hold','Сообщить наставнику'],['release','Передать без замечаний'],['fix','Изменить состав пробы']].map(([value,label])=>btn('judgement',label,s.judgement===value?'is-selected':'',value,false,`aria-pressed="${s.judgement===value}"`)).join('')}</div>${primary('report','Передать наблюдение','',!s.judgement)}`:'<p class="l9-muted">Какой результат за пределами диапазона?</p>'}</article>`,'l9-documents')+feedback();
  }
  function team(){
   if(s.repeatStage<4)return refraction(true);
   if(s.done)return final();
   return task('Передай всю картину','Оба показания 9,2 °Bx ниже учебного диапазона. Причина не установлена: наставнику нужны обе записи и отметка об отклонении.')+scene(`<article class="l9-paper l9-handover">${paperHead('Для наставника')}${rows()}<p class="l9-conclusion">Отклонение подтверждено повтором.<br>Причина не установлена.</p>${primary('handover','Передать данные наставнику')}<p class="l9-muted">Решение по партии P-214 — у уполномоченного специалиста.</p></article>`,'l9-documents')+feedback();
  }
  function final(){
   return task('Точные данные —\nпомощь команде','Ты принял пробу, подготовил её, выполнил два исследования, заметил отклонение, сохранил повтор и передал данные наставнику.')+scene(`<article class="l9-paper l9-final-paper">${paperHead('Итог первой смены')}${rows()}<p class="l9-conclusion">9,2 °Bx ниже 9,8–10,2 °Bx.<br>Исходное измерение и повтор переданы.</p><p>Лаборант помогает контролировать качество напитков: исследует пробы, получает точные данные и сообщает об отклонениях.</p>${quiz?`<p class="l9-saved">${icon('check')}Передавать нужно обе записи: так команда видит полную картину.</p>${a.button('finish','Записать открытие'+icon('arrow'),'','l9-button l9-primary')}`:`<fieldset class="l9-quiz"><legend>Повтор подтвердил отклонение. Что передашь наставнику?</legend>${btn('answer','Исходный результат, повтор и отметку об отклонении','','all')}${btn('answer','Только повтор: первый результат можно удалить','','repeat')}${btn('answer','Значение из диапазона, чтобы не задерживать партию','','range')}</fieldset>`}${btn('about','О профессии и практике','l9-text')}${btn('restart','Пройти заново','l9-text')}</article>`,'l9-documents l9-final')+feedback();
  }
  function paint(){
   if(disposed)return;a.settle();
   const active=document.activeElement,hadFocus=world.contains(active),key=active?.closest('[data-key]')?.dataset.key;
   const html=!s.started?welcome():s.phase===0?receipt():s.phase===1?preparation():s.phase===2?(picking||!s.method?methods():s.method==='titre'?titration():refraction()):s.phase===3?results():team();
   world.innerHTML=html+companion()+`<footer class="l9-foot">${btn('about','Учебная модель','l9-text')}<span>${storageOK?'Прогресс на устройстве':'Сохранение недоступно: прогресс до закрытия страницы'}</span></footer>`;
   world.className='l9-world '+(!s.started?'is-entry':'is-phase-'+s.phase)+(s.done?' is-final':'');
   if(hadFocus){const next=[...world.querySelectorAll('[data-key]')].find(n=>n.dataset.key===key&&!n.disabled);(next||world.querySelector('[data-next]:not(:disabled)')||world.querySelector('button:not(:disabled)'))?.focus({preventScroll:true});}
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
   dialog.innerHTML=btn('close',icon('close'),'l9-close','',false,'aria-label="Закрыть"')+content;dialog.setAttribute('aria-label',type==='journal'?'Журнал пробы':type==='route'?'Путь пробы':'Справка лаборатории');dialog.showModal();
  }
  function animate(type){
   if(window.GameMotion?.enabled()===false||matchMedia('(prefers-reduced-motion: reduce)').matches)return;
   const q=selector=>world.querySelector(selector);
   a.animate(g=>{
    const t=g.timeline({defaults:{duration:.35,ease:'power2.out'}});
    if(type==='dose')t.fromTo(q('.l9-falling-drop'),{y:0,opacity:1},{y:80,opacity:0,duration:.4,ease:'power2.in'}).fromTo(q('.l9-liquid'),{opacity:.12},{opacity:.85,duration:.18},.3);
    else if(type==='mix')t.to(q('.l9-flask'),{rotation:6,x:10,duration:.18}).to(q('.l9-flask'),{rotation:-5,x:-8,duration:.18}).to(q('.l9-flask'),{rotation:0,x:0,duration:.2,clearProps:'transform'}).fromTo(q('.l9-liquid path'),{fill:'#f3b3ce'},{fill:s.volume<D.titre?'#f3e4b6':s.volume>D.titre?'#d9659a':'#f3b3ce',duration:.4},.2);
    else if(type==='prepare-1')t.fromTo(q('.l9-number'),{opacity:.4},{opacity:1});
    else if(type==='prepare-2')t.fromTo(q('.l9-prep-bottle>.l9-bottle'),{rotation:-8},{rotation:0,duration:.6,clearProps:'transform'});
    else if(type==='load')t.fromTo(q('.l9-sample-drop'),{y:-38,opacity:.4},{y:0,opacity:1,duration:.45,clearProps:'transform,opacity'});
    else if(type==='cover')t.fromTo(q('.l9-device-image'),{rotationX:-12},{rotationX:0,duration:.35,clearProps:'transform'});
    else if(type==='stable')t.fromTo(q('.l9-reading'),{opacity:.35},{opacity:1});
    else if(type==='record'||type==='handover')t.fromTo(q('.l9-paper'),{y:14,opacity:.6},{y:0,opacity:1,clearProps:'transform,opacity'});
    else return null;
    return t;
   });
  }
  function dispatch(type,value){
   const oldPhase=s.phase,r=M.transition(s,type,value);s=r.state;note=r.bad?r.note:['record','stable','observe','mix'].includes(r.motion)?'':r.note;bad=r.bad;
   if(type==='method'){picking=false;closeView=false;}
   if(type==='observe'&&r.changed&&value==='fades')closeView=false;
   if(type==='retry-titre')closeView=false;
   if(type==='restart'){portions.clear();quiz=false;picking=false;hint=false;closeView=false;}
   if(oldPhase!==s.phase){hint=false;closeView=false;}
   if(r.changed)save();paint();live.textContent=note;animate(r.motion);
   if(oldPhase!==s.phase||type==='start')world.querySelector('.l9-task h2')?.focus({preventScroll:true});
  }
  function act(type,value){
   if(!type.startsWith('l9-'))return;type=type.slice(3);
   if(['route','journal','film','about','detail'].includes(type)){panel(type,value);return;}
   if(type==='close'){dialog.close();return;}
   if(type==='motion'){window.GameMotion?.toggle();return;}
   if(type==='hint'){hint=!hint;paint();return;}
   if(type==='phase'){dialog.close();picking=Number(value)===2;dispatch(type,value);return;}
   if(type==='choose-method'){picking=true;note='';bad=false;paint();return;}
   if(type==='look'||type==='unzoom'){closeView=type==='look';note='';bad=false;paint();return;}
   if(type==='portion'&&s.phase===1&&s.prep===2){portions.add(value);save();if(portions.size===2)dispatch('prepare');else{note='Порция '+value+' подготовлена и подписана. Осталась вторая.';paint();}return;}
   if(type==='continue'){if(s.titreSaved&&s.brixSaved)dispatch('to-results');else dispatch('method',s.titreSaved?'brix':'titre');return;}
   if(type==='inspect'){dispatch(type,value);note=value==='seal'?'Крышка была целой. Проба открыта для подготовки.':value==='label'?'Этикетка: проба L-041, партия P-214, источник T-07. Сверь эти данные с направлением.':'Источник в направлении T-07 совпадает с этикеткой.';paint();live.textContent=note;return;}
   if(type==='answer'){
    if(value==='all'){quiz=true;bad=false;note='';save();}
    else {bad=true;note=value==='repeat'?'Первое показание тоже важно. Сохрани обе записи: повтор дополняет исходный результат. Попробуй ещё раз.':'Подменять число нельзя. Передай реальные данные и отклонение: состав и выпуск партии решает специалист. Попробуй ещё раз.';}
    paint();live.textContent=note;return;
   }
   dispatch(type,value);
  }
  function shell(){
   a.content.innerHTML=`<div class="l9-app"><header class="l9-top"><a href="#map" class="l9-map" aria-label="На карту завода">${icon('back')}<span>Карта</span></a><img src="assets/ochakovo-logo.png" alt="Очаково. Натуральные напитки" width="145" height="35"><h1>Лаборатория</h1><nav aria-label="Инструменты лаборатории">${btn('route',icon('route')+'<span>Маршрут</span>','l9-utility','',false,'aria-label="Маршрут пробы"')}${btn('journal',icon('book')+'<span>Журнал</span>','l9-utility','',false,'aria-label="Лабораторный журнал"')}${btn('film',icon('play'),'l9-utility','',false,'aria-label="Ролик компании"')}${btn('motion',icon(window.GameMotion?.enabled()===false?'play':'pause'),'l9-utility','',false,'aria-label="Переключить анимации" aria-pressed="'+(window.GameMotion?.enabled()!==false)+'"')}</nav></header><div class="l9-world"></div><dialog class="l9-dialog"></dialog></div>`;
   world=a.content.querySelector('.l9-world');dialog=a.content.querySelector('dialog');
   dialog.addEventListener('close',()=>{dialog.querySelector('video')?.pause();lastTrigger?.isConnected&&lastTrigger.focus({preventScroll:true});});
  }
  const motionChange=e=>{const b=a.content.querySelector('[data-do="l9-motion"]');if(b){b.innerHTML=icon(e.detail.enabled?'pause':'play');b.setAttribute('aria-pressed',String(e.detail.enabled));}};
  document.addEventListener('ochakovo:motion',motionChange);
  return {managesFocus:true,start(){save();shell();paint();},act,done:()=>s.done&&quiz,result:()=>({learned:window.OchakovoShift.roles.lab.learned}),cleanup(){disposed=true;dialog?.querySelector('video')?.pause();document.removeEventListener('ochakovo:motion',motionChange);}};
 });
})();
