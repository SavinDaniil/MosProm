/* Equipment-led laboratory. The scene is illustrative; method values are educational. */
(() => {
 'use strict';
 const css=document.createElement('link');css.rel='stylesheet';css.href=new URL('lab-v8.css?v=8.0',document.currentScript.src).href;document.head.append(css);
 const M=window.OchakovoLabModel,D=M.data,KEY='ochakovo-lab-workbench-v7';
 const fmt=n=>Number(n).toFixed(1).replace('.',',');
 const paths={arrow:'M4 12h15m-6-6 6 6-6 6',back:'M20 12H5m6-6-6 6 6 6',check:'m5 12 4 4L19 6',drop:'M12 3S5 11 5 15a7 7 0 0 0 14 0c0-4-7-12-7-12Z',book:'M5 3h14v18H5zM9 7h6M9 11h6M9 15h4',play:'m9 5 10 7-10 7Z',close:'m6 6 12 12M6 18 18 6',mix:'M8 3h8m-6 0v7l-5 9h14l-5-9V3M8 15h8',info:'M12 10v6m0-10v1',alert:'m12 3 10 18H2ZM12 9v5m0 3v1',scan:'M3 8V3h5m8 0h5v5m0 8v5h-5M8 21H3v-5M7 12h10',route:'M6 4v16m12-16v16M4 6h16M4 18h16',pause:'M8 5v14M16 5v14',redo:'M4 10a8 8 0 1 1 0 6m0-6V4m0 6h6'};
 const icon=n=>`<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="${paths[n]||paths.info}"/></svg>`;
 function restore(){try{return M.normalize(JSON.parse(localStorage.getItem(KEY)||localStorage.getItem('ochakovo-lab-visual-v6')||'null'));}catch{return M.fresh();}}
 Object.assign(window.OchakovoShift.roles.lab,{lead:'Прими пробу, выполни два исследования и передай точные данные команде.',day:'Химик-лаборант готовит отдельные порции проб, работает по методикам с посудой и приборами, наблюдает и сохраняет результаты. В ролике компании показаны бюретка, колба и настольный рефрактометр.',tools:'Пробы, бюретка, лабораторная посуда, рефрактометр, контрольный материал и журнал.',learned:'Принял пробу, наблюдал конечную точку титрования, выполнил рефрактометрию, сохранил повтор и передал отклонение наставнику.'});
 window.GameMissions.list.find(x=>x.id==='lab').minutes=8;
 window.OchakovoShift.register('lab',a=>{
  const {esc}=a;let s=restore(),note='',bad=false,hint=false,zoom=false,picking=false,busy=false,disposed=false,timer=null,storageOK=true,portions=new Set(),lastTrigger=null,suppressReturn=false;
  a.root.classList.add('lab-v8');a.root.querySelector('.shift-heading').hidden=true;a.root.querySelector('.shift-profession').hidden=true;
  const live=a.root.querySelector('.shift-feedback');live.classList.add('l8-announcer');
  const btn=(action,text,cls='',value='',disabled=false,extra='')=>a.button('l8-'+action,text,value,'l8-button '+cls,`${disabled?'disabled':''} data-key="${action}:${value}:${cls}" ${extra}`);
  const target=(action,text,cls='',value='',extra='')=>btn(action,`<i>${icon('arrow')}</i><span>${text}</span>`,'l8-target '+cls,value,false,extra);
  const stamp=(action,text,value='',disabled=false)=>btn(action,text+icon('arrow'),'l8-stamp',value,disabled,'data-next');
  const save=()=>{try{localStorage.setItem(KEY,JSON.stringify(s));storageOK=true;}catch{storageOK=false;}};
  const tell=(text,error=false)=>{note=text;bad=error;live.textContent=text;if(text)a.say(text,error?'think':'success');};
  const help=[
   'Сверь партию на этикетке с направлением. Проверь источник T-07 и целую крышку. Затем зарегистрируй образец.',
   'Подготовь температуру, аккуратно перемешай и раздели образец на две чистые порции. Ничего не добавляй для изменения состава.',
   'При титровании после 3,0 мл переходи на капли. Оценивай окраску после перемешивания. На рефрактометре очисти ячейку, нанеси пробу, закрой крышку и сохрани стабильное число.',
   'Отметь 9,2 °Bx: это ниже 9,8. Передай фактическое отклонение. Не меняй пробу и не отбрасывай результат.',
   'Выполни назначенный повтор на новой порции. Сохрани его отдельно и передай обе записи наставнику.'
  ];
  function bottle(label,filled=true,cls=''){
   return `<div class="l8-bottle ${cls}"><svg viewBox="${filled?'160':'832'} 0 550 1024" aria-hidden="true"><image href="assets/lab-samples-v8.png" width="1536" height="1024"/></svg><span class="l8-bottle-label"><b>${esc(label)}</b><small>Основа напитка</small></span></div>`;
  }
  function task(top,bottom,copy){
   const text=hint?help[s.phase]:note||copy;
   return `<section class="l8-task ${bad?'has-error':''}"><h2 class="l8-task-title" tabindex="-1"><span>${bad?'Проверь':top}</span><strong>${bad?'ЕЩЁ РАЗ':bottom}</strong></h2><p>${bad?icon('alert'):''}${esc(text)}</p></section>`;
  }
  function companion(){return btn('hint',`<img src="assets/${bad?'mascot-think.png':s.done||s.observed||note&&!bad?'mascot-success.png':'mascot-think.png'}" width="150" height="195" alt="Очажок">`,'l8-companion','',false,`aria-label="Подсказка Очажка" aria-expanded="${hint}"`);}
  const footer=()=>`<img class="l8-pattern" src="assets/lab-brand-pattern.jpg" width="1754" height="1240" alt=""><div class="l8-scene-foot">${btn('about','Учебная модель','l8-foot-link')}<span>${storageOK?'Сохраняется на устройстве':'Сохранение недоступно'}</span></div>`;
  function journalRows(){return `<div><dt>Титрование · расход</dt><dd>${s.titreSaved?'3,4 <small>мл</small>':'ещё не записано'}</dd></div><div><dt>Рефрактометр · исходный</dt><dd>${s.brixSaved?'9,2 <small>°Bx</small>':'ещё не записано'}</dd></div>${s.repeatStage===4?'<div><dt>Рефрактометр · повтор</dt><dd>9,2 <small>°Bx</small></dd></div>':''}`;}
  function paperHeading(title){return `<header><span>ЛАБОРАТОРИЯ · ОЧАКОВО</span><h2>${title}</h2><p>Проба ${D.sample} · партия ${D.batch} · ${D.tank}</p></header>`;}
  function recordPaper(method){
   const titre=method==='titre';
   return task('Сохранили','ТОЧНО','Результат записан вместе с номером пробы. Пора перейти к следующему действию.')+`<div class="l8-props l8-document-scene"><article class="l8-paper l8-record-paper">${paperHeading('Лабораторный журнал')}<dl class="l8-paper-rows">${journalRows()}</dl><div class="l8-saved-mark">${icon('check')}Записано: ${titre?'3,4 мл':'9,2 °Bx'}</div>${stamp('continue',s.titreSaved&&s.brixSaved?'Сверить результаты':titre?'К рефрактометру':'К титрованию')}</article></div>`;
  }
  function welcome(){return task('Точность','В КАЖДОЙ КАПЛЕ','Одна проба. Два исследования. Ты поможешь команде заметить то, чего не видно на глаз.')+`<div class="l8-props l8-welcome-props">${bottle(D.batch,true,'l8-welcome-bottle')}${target('start','Взять пробу','l8-welcome-start','','data-next')}<div class="l8-welcome-slip"><span>Новое задание</span><strong>Проба с производства</strong><p>Без таймера.<br>Ошибку можно исправить.</p></div></div>`;}
  function receipt(){
   const checked=k=>s.checks.includes(k),count=s.checks.length;
   return task('У пробы','ЕСТЬ АДРЕС','Сверь этикетку и направление. Проверь источник и целостность крышки.')+`<div class="l8-props l8-receipt-props"><div class="l8-inspect-bottle">${bottle(s.registered?D.sample:D.batch)}${target('inspect',checked('seal')?'Крышка целая':'Осмотреть крышку','l8-inspect-cap','seal',`aria-pressed="${checked('seal')}"`)}${target('inspect',checked('label')?'Партия совпала':'Сверить этикетку','l8-inspect-label','label',`aria-pressed="${checked('label')}"`)}</div><article class="l8-paper l8-direction"><span>Направление на исследование</span><h3>${D.batch}</h3><p>Основа напитка<br>Отбор 10:20 · до насыщения газом</p><div class="l8-direction-source"><small>Источник</small><strong>${D.tank}</strong>${btn('inspect',icon(checked('source')?'check':'scan')+(checked('source')?'Сверено':'Сверить источник'),'l8-inline','source',false,`aria-pressed="${checked('source')}"`)}</div><div class="l8-receipt-sign"><span>${count} из 3 проверок</span>${stamp('register',s.registered?'К подготовке':'Зарегистрировать', '',count<3)}</div></article></div>`;
  }
  function preparation(){
   const stage=s.prep;
   const titles=[['Подготовь','УСЛОВИЯ'],['Аккуратно','ПЕРЕМЕШАЙ'],['Две чистые','ПОРЦИИ'],['Проба','ГОТОВА']][stage];
   const copy=['Температура образца 24,3 °C. В учебной карточке — 19–21 °C.','Порция должна отражать состав образца. Перемешай без разбавления и вспенивания.','Для каждого метода нужна отдельная порция. Подготовь A и B.','Обе порции связаны с L-041. Выбери, с какого исследования начать.'][stage];
   if(stage===3)return task(...titles,copy)+`<div class="l8-props l8-ready-props"><div>${bottle('L-041 · A')}<b>Титрование</b></div><div>${bottle('L-041 · B')}<b>Рефрактометр</b></div>${target('to-tests','Выбрать исследование','l8-ready-next','','data-next')}</div>`;
   return task(...titles,copy)+`<div class="l8-props l8-prep-props"><div class="l8-prep-source">${bottle(D.sample)}${stage<2?target('prepare',stage===0?'Подготовить температуру':'Перемешать образец','l8-prepare-hit','','data-next'):''}<div class="l8-temperature-tag"><span>Температура образца</span><strong><b class="l8-temp-value">${stage===0?'24,3':'20,2'}</b> <small>°C</small></strong></div></div>${stage===2?`<div class="l8-portion-slots">${['A','B'].map(v=>btn('portion',bottle('L-041 · '+v,portions.has(v))+`<span>${icon(portions.has(v)?'check':'drop')}${portions.has(v)?'Порция готова':'Подготовить '+v}</span>`,'l8-portion',v,false,'data-next')).join('')}</div>`:`<article class="l8-paper l8-method-note"><span>Условия учебной карточки</span><strong>19–21 °C</strong><p>Сохрани свойства образца.<br>Вода и сироп не нужны.</p></article>`}</div>`;
  }
  function methods(){return task('С какого','НАЧНЁМ?','Оба метода нужны команде. Порядок выбираешь ты.')+`<div class="l8-props l8-method-props"><div class="l8-method l8-method-titre"><img src="assets/lab-titration-v6.png" alt="Бюретка и колба" width="1280" height="1280">${target('method','Титрование','','titre','data-next')}</div><div class="l8-method l8-method-brix"><img src="assets/lab-refractometer-v6.png" alt="Настольный рефрактометр" width="1408" height="1152">${target('method','Рефрактометр','','brix','data-next')}</div></div>`;}
  function rigArt(){
   const pink=s.volume>=D.titre&&s.mixed||s.volume>=30&&!s.mixed,over=s.volume>D.titre&&s.mixed;
   return `<svg class="l8-rig-svg" viewBox="${zoom?'350 330 225 270':'0 0 900 620'}" role="img" aria-label="${pink?'Розовый раствор':'Почти бесцветный раствор'} в колбе под бюреткой"><svg class="l8-stand-art" x="150" y="0" width="438" height="584" viewBox="0 0 768 1024"><image href="assets/lab-titration-parts-v7.png" width="1536" height="1024"/></svg><g class="l8-flask-art"><svg x="359.5" y="333.5" width="192" height="256" viewBox="768 0 768 1024"><image href="assets/lab-titration-parts-v7.png" width="1536" height="1024"/></svg><path class="l8-liquid" d="M394 530 Q451 514 508 530 L516 552 Q451 578 387 552Z" fill="${pink?'#e9578a':'#e5c56f'}" opacity="${pink?(over?'.65':'.3'):'.05'}"/></g><path class="l8-droplet" d="M451 391s-5 9-5 12a5 5 0 0 0 10 0c0-3-5-12-5-12Z" fill="#d50032" opacity="0"/></svg>`;
  }
  function titration(){
   if(s.titreSaved)return recordPaper('titre');
   const over=s.volume>D.titre&&s.mixed;
   const [top,bottom,copy]=!s.rig?['Начнём с','УСТАНОВКИ','Наставник проверит установку и начальный отсчёт. Подготовь её к работе.']:over?['Возьми','НОВУЮ ПОРЦИЮ','Яркая окраска: конечная точка пройдена. Повторим без штрафа.']:s.observed?['Запиши','НАБЛЮДЕНИЕ','Слабая окраска осталась после перемешивания. Сохрани расход.']:zoom?['Что стало','С ОКРАСКОЙ?','Посмотри на раствор после перемешивания. Исчезла окраска или сохранилась?']:!s.mixed?['Перемешай','КОЛБУ','Временная окраска может исчезнуть. Аккуратно перемешай колбу и наблюдай.']:['Добавь','ТИТРАНТ',s.volume>=30?'Пора работать по капле. Нажми на кран, затем перемешай раствор.':'Нажми на кран бюретки. После добавления перемешай колбу.'];
   let controls;
   if(!s.rig)controls=target('rig','Подготовить установку','l8-rig-prepare','','data-next');
   else if(over)controls=target('retry-titre','Новая порция','l8-rig-prepare','','data-next');
   else if(s.observed)controls=`<div class="l8-observe-actions">${stamp('save-titre','Записать 3,4 мл')}</div>`;
   else if(zoom)controls=`<div class="l8-observe-actions" role="group" aria-label="Наблюдение окраски">${btn('observe','<i class="l8-colour is-clear"></i>Исчезла','l8-observation','fades',false,'data-next')}${btn('observe','<i class="l8-colour is-pink"></i>Сохранилась','l8-observation','persists')}${btn('unzoom','Вернуться к бюретке','l8-small')}</div>`;
   else if(!s.mixed)controls=target('mix','Перемешать колбу','l8-mix-target','','data-next');
   else controls=`${btn('dose',`<span class="l8-valve-ring"></span><span class="l8-valve-label">${s.volume>=30?'Очажок · 0,1 мл':'Открыть кран · 1 мл'}</span>`,'l8-valve',s.volume>=30?1:10,false,'data-next aria-label="'+(s.volume>=30?'Добавить 0,1 мл':'Добавить 1 мл')+'"')}<div class="l8-dose-choice">${btn('dose','1 мл','',10)}${btn('dose',icon('drop')+'0,1 мл','',1)}</div>${s.volume>0?target('look','Рассмотреть раствор','l8-look-target'):''}`;
   return task(top,bottom,copy)+`<div class="l8-props l8-titration ${zoom?'is-zoomed':''}"><div class="l8-rig-canvas">${rigArt()}${!zoom?`<div class="l8-burette-note"><span>Расход титранта</span><strong>${fmt(s.volume/10)} <small>мл</small></strong><small>Начало: 0,0 мл · порция A</small></div>`:''}${controls}</div>${btn('choose-method','Другой метод','l8-switch-method')}</div>`;
  }
  function refAction(repeat){
   if(busy)return ['skip','Показать результат'];
   if(repeat)return [['repeat-clean','Подготовить прибор'],['repeat-load','Нанести новую порцию'],[s.repeatCover?'repeat-measure':'repeat-cover',s.repeatCover?'Повторить измерение':'Закрыть крышку'],['repeat-save','Сохранить повтор']][s.repeatStage];
   return !s.control?['control','Проверить контроль']:!s.clean?['clean','Очистить ячейку']:!s.loaded?['load','Нанести порцию']:!s.cover?['cover','Закрыть крышку']:!s.read?['measure','Начать измерение']:['save-brix','Записать 9,2 °Bx'];
  }
  function refraction(repeat=false){
   if(!repeat&&s.brixSaved)return recordPaper('brix');
   const control=!repeat&&s.control&&!s.clean,loaded=repeat?s.repeatStage>=2:s.loaded,closed=(repeat?s.repeatCover:s.cover)||control,read=repeat?s.repeatStage>=3:s.read;
   const [action,label]=refAction(repeat);
   const words=busy?['Прибор','ИЗМЕРЯЕТ','Дождись стабильного показания или заверши короткую анимацию кнопкой.']:read?['Стабильный','РЕЗУЛЬТАТ',repeat?'9,2 °Bx — повтор тоже ниже диапазона. Сохрани отдельной записью.':'Показание стабильно. Запиши его вместе с номером пробы.']:action.includes('clean')?['Подготовь','ЯЧЕЙКУ',repeat?'Наставник назначил повтор новой порции. Исходный результат останется в журнале.':'Контроль совпал: 10,0 °Bx. Удали контрольный раствор перед пробой.']:action.includes('load')?['Нанеси','ПОРЦИЮ','В чистую ячейку справа нанеси отдельную порцию. Можно нажать на ячейку или перетащить образец.']:action.includes('cover')?['Закрой','КРЫШКУ','Порция нанесена. Закрой ячейку перед измерением.']:action==='control'?['Проверь','ПРИБОР','Калибровку выполнил наставник. Проверим материал с известным значением 10,0 °Bx.']:['Начни','ИЗМЕРЕНИЕ','Ячейка закрыта. Теперь можно получить показание.'];
   const loadable=action==='load'||action==='repeat-load';
   const cls=read||busy||action.includes('measure')?'l8-device-screen-target':'l8-cell-target';
   return task(...words)+`<div class="l8-props l8-refraction"><div class="l8-ref-source" ${loadable?'draggable="true" data-drag="portion"':''}>${bottle(repeat?'L-041 · повтор':'L-041 · B')}<span>${loadable?'Новая порция для ячейки':repeat?'Назначенный повтор':'Отдельная порция'}</span></div><div class="l8-device ${closed?'is-closed':''} ${loaded?'is-loaded':''}" data-drop="cell"><img class="l8-device-art" src="assets/${closed?'lab-refractometer-closed-v6.png':'lab-refractometer-v6.png'}" alt="Рефрактометр с ${closed?'закрытой':'открытой'} ячейкой справа" width="1408" height="1152"><div class="l8-lcd"><strong>${busy?'…':read?'9,2':control?'10,0':'—'}<small>°Bx</small></strong></div><i class="l8-prism" aria-hidden="true"></i><div class="l8-pipette" aria-hidden="true"><i></i><b></b><span></span></div>${target(action,label,cls,'','data-next')}${busy?'<div class="l8-reading-progress"><i></i></div>':''}</div><div class="l8-device-slip"><b>${control?'Контрольный материал':repeat?'Повтор · L-041':'Проба L-041'}</b><span>${read?'Стабильно · 20,2 °C':control?'Контроль совпал':closed?'Ячейка закрыта':loaded?'Порция нанесена':'Подготовка ячейки'}</span></div>${!repeat?btn('choose-method','Другой метод','l8-switch-method'):''}</div>`;
  }
  function resultRow(kind){
   const titre=kind==='titre',value=titre?D.titre/10:D.brix,[lo,hi]=titre?D.titreRange:D.brixRange,min=titre?2.8:8.8,max=titre?4:10.8,unit=titre?'мл':'°Bx';
   return btn('notice',`<div><span>${titre?'Расход титранта':'Рефрактометр'}</span><strong>${fmt(value)}<small>${unit}</small></strong></div><div class="l8-range" role="img" aria-label="Учебный диапазон ${fmt(lo)}–${fmt(hi)} ${unit}"><i style="left:${(lo-min)/(max-min)*100}%;width:${(hi-lo)/(max-min)*100}%"></i><b style="left:${(value-min)/(max-min)*100}%"></b></div><p>Учебная карточка: ${fmt(lo)}–${fmt(hi)} ${unit}${s.noticed&&kind==='brix'?' · НИЖЕ ДИАПАЗОНА':''}</p>`,'l8-result-row '+(s.noticed&&kind==='brix'?'is-marked':''),kind,false,`aria-label="Отметить отклонение: ${titre?'титрование 3,4 мл':'рефрактометр 9,2 °Bx'}"`);
  }
  function results(){return task(s.noticed?'Передай':'Найди',s.noticed?'ОТКЛОНЕНИЕ':'НЕСОВПАДЕНИЕ',s.noticed?'Выбери, что передать команде. Лаборант сообщает факты, а решение о партии принимает специалист качества.':'Какой результат за пределами диапазона? Отметь его в журнале.')+`<div class="l8-props l8-document-scene"><article class="l8-paper l8-results-paper">${paperHeading('Сверка результатов')}${resultRow('titre')}${resultRow('brix')}${s.noticed?`<div class="l8-decisions" role="group" aria-label="Решение по отклонению">${[['hold','Сообщить'],['release','Без замечаний'],['fix','Изменить пробу']].map(([v,t])=>btn('judgement',icon(s.judgement===v?'check':'arrow')+t,s.judgement===v?'is-selected':'',v,false,`aria-pressed="${s.judgement===v}"`)).join('')}</div>${stamp('report','Передать наблюдение','',!s.judgement)}`:''}</article></div>`;}
  function team(){
   if(s.repeatStage<4)return refraction(true);
   return task(s.done?'Точность':'Передай',s.done?'ПОМОГЛА КОМАНДЕ':'ОБЕ ЗАПИСИ',s.done?'Ты заметил отклонение и сохранил данные. Хорошая смена — это точный вывод.':'Повтор тоже ниже диапазона. Причина пока не установлена. Передай всю картину наставнику.')+`<div class="l8-props l8-document-scene"><article class="l8-paper l8-handover-paper">${paperHeading(s.done?'Наставник принял данные':'Для наставника')}<dl class="l8-paper-rows">${journalRows()}</dl><div class="l8-paper-conclusion"><strong>Отклонение подтверждается.</strong><p>Причина не установлена.<br>P-214 остаётся на удержании.</p></div>${s.done?`<div class="l8-saved-mark">${icon('check')}Данные переданы</div>${a.button('finish','Записать открытие'+icon('arrow'),'','l8-button l8-stamp','data-next')}${btn('restart','Пройти ещё раз','l8-small')}`:stamp('handover','Передать наставнику')}</article></div>`;
  }
  let world,dialog;
  function shell(){
   a.content.innerHTML=`<div class="l8-app"><header class="l8-top"><a class="l8-exit" href="#map" aria-label="На карту завода">${icon('back')}</a><img src="assets/ochakovo-logo.png" alt="Очаково. Натуральные напитки" width="166" height="40"><h1>Лаборатория</h1><div>${btn('route',icon('route')+'<span>Маршрут</span>','l8-utility','',false,'aria-label="Маршрут пробы"')}${btn('journal',icon('book')+'<span>Журнал</span>','l8-utility','',false,'aria-label="Лабораторный журнал"')}${btn('film',icon('play'),'l8-utility','',false,'aria-label="Ролик компании"')}${btn('motion',icon(window.GameMotion?.enabled()===false?'play':'pause'),'l8-utility','',false,'aria-label="Переключить анимации"')}</div></header><div class="l8-world"></div><dialog class="l8-dialog"></dialog></div>`;
   world=a.content.querySelector('.l8-world');dialog=a.content.querySelector('dialog');
   dialog.addEventListener('close',()=>{dialog.querySelector('video')?.pause();if(!suppressReturn)lastTrigger?.focus({preventScroll:true});suppressReturn=false;});
   let drag=null;
   world.addEventListener('pointerdown',e=>{const source=e.target.closest('[data-drag="portion"]');if(!source||busy)return;e.preventDefault();source.draggable=false;source.setPointerCapture(e.pointerId);drag={source,x:e.clientX,y:e.clientY,moved:false};});
   world.addEventListener('pointermove',e=>{if(!drag)return;const x=e.clientX-drag.x,y=e.clientY-drag.y;if(Math.hypot(x,y)>12)drag.moved=true;if(drag.moved){drag.source.style.transform=`translate(${x}px,${y}px)`;drag.source.style.opacity='.8';}});
   const drop=e=>{if(!drag)return;const current=drag;drag=null;current.source.style.transform='';current.source.style.opacity='';current.source.draggable=true;const box=world.querySelector('[data-drop="cell"]')?.getBoundingClientRect();if(current.moved&&box&&e.clientX>=box.left&&e.clientX<=box.right&&e.clientY>=box.top&&e.clientY<=box.bottom)dispatch(s.phase===4?'repeat-load':'load');};
   world.addEventListener('pointerup',drop);world.addEventListener('pointercancel',()=>{if(drag){drag.source.style.transform='';drag.source.style.opacity='';drag=null;}});
  }
  function panel(type){
   lastTrigger=document.activeElement;
   const close=btn('close',icon('close'),'l8-close','',false,'aria-label="Закрыть"');
   const contents=type==='film'?'<h2>Как это в «Очаково»</h2><video controls playsinline preload="metadata" src="assets/lab-work-ochakovo.mp4" aria-label="Ролик компании о химике-лаборанте"></video><p>Материал компании · 32 секунды</p>':type==='route'?`<h2>Путь пробы</h2><nav aria-label="Этапы лаборатории">${['Приёмка','Подготовка','Исследования','Вывод','Команда'].map((t,i)=>btn('phase',`${i<M.maxPhase(s)||s.done?icon('check'):''}${t}`,'',i,busy||i>M.maxPhase(s),i===s.phase?'aria-current="step"':'')).join('')}</nav>`:type==='journal'?`${paperHeading('Лабораторный журнал')}<dl class="l8-paper-rows">${journalRows()}</dl><p>Исходное показание и повтор — отдельные записи.</p>`:'<h2>Химик-лаборант</h2><p>Подготавливает пробы, выполняет исследования по методикам, наблюдает и сохраняет данные. В присланном ролике «Очаково» показаны бюретка, колба и рефрактометр.</p><p>Это учебная модель: сюжет, показатели, диапазоны и условия вымышлены. Приборы и реакция упрощены; время подготовки сокращено. Расход титранта в мл не равен pH. °Brix не является измерением плотности или только чистого сахара.</p><p>Методику, реактивы, расчёт и допуск к работе определяет наставник. Иллюстрации не являются фотографиями реальной лаборатории компании.</p>';
   dialog.innerHTML=close+contents;dialog.setAttribute('aria-label',type==='film'?'Ролик компании':type==='route'?'Путь пробы':type==='journal'?'Лабораторный журнал':'О профессии и учебной модели');dialog.showModal();
  }
  function paint(){
   if(disposed)return;a.settle();
   const active=document.activeElement,hadFocus=world.contains(active),key=active?.closest('[data-key]')?.dataset.key;
   const html=!s.started?welcome():s.phase===0?receipt():s.phase===1?preparation():s.phase===2?(picking||!s.method?methods():s.method==='titre'?titration():refraction()):s.phase===3?results():team();
   world.innerHTML=html+companion()+footer();world.className='l8-world '+(!s.started?'is-welcome':'is-phase-'+s.phase)+(zoom?' is-camera-close':'')+(picking?' is-picking':'');
   if(hadFocus){const next=key?[...world.querySelectorAll('[data-key]')].find(n=>n.dataset.key===key&&!n.disabled):null;(next||world.querySelector('[data-next]:not([disabled])')||world.querySelector('button:not([disabled])'))?.focus({preventScroll:true});}
  }
  function animate(type){
   const q=selector=>world.querySelector(selector);
   a.animate(g=>{const t=g.timeline({defaults:{duration:.35,ease:'power2.out'}});
    if(type==='dose')t.fromTo(q('.l8-droplet'),{y:0,opacity:1},{y:115,opacity:0,duration:.42,ease:'power2.in'});
    else if(type==='mix')t.to(q('.l8-flask-art'),{x:17,y:-10,rotation:5,svgOrigin:'451 520',duration:.18}).to(q('.l8-flask-art'),{x:-14,rotation:-5,duration:.18}).to(q('.l8-flask-art'),{x:9,rotation:3,duration:.18}).to(q('.l8-flask-art'),{x:0,y:0,rotation:0,duration:.2,clearProps:'transform'}).fromTo(q('.l8-liquid'),{opacity:.35},{opacity:s.volume>=D.titre?(s.volume>D.titre?.65:.3):.05,duration:.65},0);
    else if(type==='zoom')t.fromTo(q('.l8-rig-svg'),{attr:{viewBox:'0 0 900 620'}},{attr:{viewBox:'350 330 225 270'},duration:.65,ease:'power3.inOut'});
    else if(type==='unzoom')t.fromTo(q('.l8-rig-svg'),{attr:{viewBox:'350 330 225 270'}},{attr:{viewBox:'0 0 900 620'},duration:.55,ease:'power3.inOut'});
    else if(type==='prepare-1'){const temp={v:24.3};t.to(temp,{v:20.2,duration:.8,onUpdate:()=>{const n=q('.l8-temp-value');if(n)n.textContent=fmt(temp.v);}});}
    else if(type==='prepare-2')t.fromTo(q('.l8-prep-source>.l8-bottle'),{rotation:-8},{rotation:0,duration:.65,clearProps:'transform'});
    else if(type==='portion')t.fromTo(q('.l8-portion-slots'),{y:7},{y:0,duration:.3,clearProps:'transform'});
    else if(type==='load')t.fromTo(q('.l8-pipette'),{x:-130,y:-50,opacity:.2},{x:0,y:0,opacity:1,duration:.7,clearProps:'transform,opacity'});
    else if(type==='cover'||type==='control')t.fromTo(q('.l8-device-art'),{opacity:.65},{opacity:1,duration:.25,clearProps:'opacity'});
    else if(type==='record'||type==='handover')t.fromTo(q('.l8-paper'),{y:55,rotation:-5,opacity:.7},{y:0,rotation:0,opacity:1,duration:.55,clearProps:'transform,opacity'});
    else if(type==='inspect')t.fromTo(q('.l8-direction'),{rotation:1},{rotation:0,duration:.25,clearProps:'transform'});
    else return null;
    return t;
   });
  }
  function dispatch(type,value){
   const oldPhase=s.phase,r=M.transition(s,type,value);s=r.state;
   if(r.note)tell(r.note,r.bad);else{note='';bad=false;live.textContent='';}
   if(type==='observe'&&r.changed&&value==='fades')zoom=false;
   if(type==='retry-titre'||type==='restart'){zoom=false;portions.clear();}
   if(type==='method'){picking=false;zoom=false;}
   if(type==='restart'){picking=false;hint=false;}
   if(oldPhase!==s.phase){zoom=false;hint=false;note='';bad=false;}
   if(r.changed)save();paint();animate(type==='observe'&&r.changed&&value==='fades'?'unzoom':r.motion);
   if(oldPhase!==s.phase||type==='start')world.querySelector('.l8-task-title')?.focus({preventScroll:true});
  }
  function stable(){if(!busy||disposed)return;clearTimeout(timer);timer=null;busy=false;dispatch('stable');}
  function measure(){busy=true;note='';bad=false;paint();if(window.GameMotion?.enabled()===false||window.matchMedia('(prefers-reduced-motion: reduce)').matches){stable();return;}a.animate(g=>g.timeline().fromTo(world.querySelector('.l8-reading-progress>i'),{scaleX:0},{scaleX:1,duration:1.2,ease:'none'}));timer=setTimeout(stable,1200);}
  function act(type,value){
   if(!type.startsWith('l8-'))return;type=type.slice(3);
   if(['route','journal','film','about'].includes(type)){panel(type);return;}
   if(type==='close'){dialog.querySelector('video')?.pause();dialog.close();return;}
   if(type==='motion'){window.GameMotion?.toggle();return;}
   if(type==='hint'){hint=!hint;paint();return;}
   if(type==='skip'){stable();return;}
   if(busy)return;
   if(type==='phase'){suppressReturn=true;dialog.close();picking=Number(value)===2;dispatch(type,value);return;}
   if(type==='choose-method'){picking=true;note='';bad=false;zoom=false;paint();world.querySelector('[data-next]')?.focus({preventScroll:true});return;}
   if(type==='look'){zoom=true;note='';bad=false;paint();animate('zoom');world.querySelector('[data-next]')?.focus({preventScroll:true});return;}
   if(type==='unzoom'){zoom=false;note='';bad=false;paint();animate('unzoom');return;}
   if(type==='portion'&&s.phase===1&&s.prep===2){portions.add(value);if(portions.size===2)dispatch('prepare');else{paint();animate('portion');}return;}
   if(type==='continue'){if(s.titreSaved&&s.brixSaved)dispatch('to-results');else dispatch('method',s.titreSaved?'brix':'titre');return;}
   if(type==='measure'&&s.phase===2&&s.method==='brix'&&s.cover&&!s.read||type==='repeat-measure'&&s.phase===4&&s.repeatStage===2&&s.repeatCover){measure();return;}
   dispatch(type,value);
  }
  const motionChange=e=>{if(!e.detail.enabled&&busy)stable();const b=a.content.querySelector('[data-do="l8-motion"]');if(b)b.innerHTML=icon(e.detail.enabled?'pause':'play');};document.addEventListener('ochakovo:motion',motionChange);
  return {managesFocus:true,start(){save();shell();paint();},act,done:()=>s.done,result:()=>({learned:window.OchakovoShift.roles.lab.learned}),drop(target,value){if(target!=='cell'||value!=='portion'||busy)return;const ready=s.phase===2&&s.method==='brix'&&s.clean&&!s.loaded||s.phase===4&&s.repeatStage===1;if(ready)dispatch(s.phase===4?'repeat-load':'load');else{tell('Сначала подготовь чистую ячейку.',true);paint();}},cleanup(){disposed=true;clearTimeout(timer);dialog?.querySelector('video')?.pause();document.removeEventListener('ochakovo:motion',motionChange);}};
 });
})();
