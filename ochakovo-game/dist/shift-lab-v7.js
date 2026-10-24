(() => {
  'use strict';
  const script=document.currentScript.src;
  const css=document.createElement('link');css.rel='stylesheet';css.href=new URL('lab-v7.css?v=7.3',script).href;document.head.append(css);
  const M=window.OchakovoLabModel,D=M.data,KEY='ochakovo-lab-workbench-v7';
  const phases=['Приёмка','Подготовка','Исследования','Вывод','Команда'];
  const fmt=n=>Number(n).toFixed(1).replace('.',',');
  const paths={arrow:'M4 12h15m-6-6 6 6-6 6',check:'m5 12 4 4L19 6',drop:'M12 3S5 11 5 15a7 7 0 0 0 14 0c0-4-7-12-7-12Z',book:'M5 3h14v18H5zM9 7h6M9 11h6M9 15h4',play:'m9 5 10 7-10 7Z',close:'m6 6 12 12M6 18 18 6',mix:'M8 3h8m-6 0v7l-5 9h14l-5-9V3M8 15h8',info:'M12 10v6m0-10v1',alert:'m12 3 10 18H2ZM12 9v5m0 3v1',scan:'M3 8V3h5m8 0h5v5m0 8v5h-5M8 21H3v-5M7 12h10',thermo:'M10 4a2 2 0 0 1 4 0v10a4 4 0 1 1-4 0ZM12 8v9',redo:'M4 10a8 8 0 1 1 0 6m0-6V4m0 6h6'};
  const icon=n=>`<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="${paths[n]||paths.info}"/></svg>`;
  function restore(){try{return M.normalize(JSON.parse(localStorage.getItem(KEY)||localStorage.getItem('ochakovo-lab-visual-v6')||'null'));}catch{return M.fresh();}}
  Object.assign(window.OchakovoShift.roles.lab,{lead:'Прими пробу, выполни два исследования и передай точные данные команде.',day:'Химик-лаборант связывает пробу с её источником, готовит отдельные порции, работает по методикам, наблюдает и сохраняет результаты. В ролике компании показаны бюретка, колба и настольный рефрактометр.',tools:'Пробы, бюретка, лабораторная посуда, рефрактометр, контрольный материал и журнал.',learned:'Принял пробу, наблюдал конечную точку титрования, выполнил рефрактометрию, сохранил повтор и передал отклонение наставнику.'});
  window.GameMissions.list.find(x=>x.id==='lab').minutes=8;
  window.OchakovoShift.register('lab',a=>{
    const {esc}=a;
    let s=restore(),doc='',note='',bad=false,journal=false,film=false,hint=false,colour=false,seenFading=false,busy=false,disposed=false,timer=null,storageOK=true;
    a.root.classList.add('lab-v7');a.root.querySelector('.shift-heading').hidden=true;a.root.querySelector('.shift-profession').hidden=true;
    const live=a.root.querySelector('.shift-feedback');live.classList.add('l7-announcer');
    const btn=(action,text,cls='',value='',disabled=false,extra='')=>a.button('l7-'+action,text,value,'l7-button '+cls,`${disabled?'disabled':''} data-key="${action}:${value}:${cls}" ${extra}`);
    const primary=(action,text,disabled=false,value='')=>btn(action,text+icon('arrow'),'l7-primary',value,disabled,'data-next');
    const save=()=>{try{localStorage.setItem(KEY,JSON.stringify(s));storageOK=true;}catch{storageOK=false;}};
    const tell=(text,isBad=false)=>{note=text;bad=isBad;live.textContent=text;if(text)a.say(text,isBad?'think':'success');};
    const detail=(title,text)=>`<details class="l7-detail"><summary>${title}</summary><p>${text}</p></details>`;
    const sample=(label=D.sample,small=false)=>`<div class="l7-bottle ${small?'is-small':''}" aria-hidden="true"><i class="l7-cap"></i><i class="l7-neck"></i><div class="l7-bottle-body"><i class="l7-bottle-liquid"></i><span><b>${label}</b><small>Основа напитка</small></span></div></div>`;
    function header(){
      return `<header class="l7-bar"><div><h1>Лаборатория</h1><p>Твоя смена с Каплей</p></div><div class="l7-utilities">${s.started?btn('journal',icon('book')+'<span>Журнал</span>','l7-utility','',false,`aria-label="Журнал пробы" aria-expanded="${journal}"`):''}${btn('film',icon('play')+'<span>Ролик компании</span>','l7-utility','',false,`aria-label="Ролик компании" aria-expanded="${film}"`)}</div></header>
      ${film?`<section class="l7-film" aria-label="Ролик о профессии"><video controls playsinline preload="metadata" src="assets/lab-work-ochakovo.mp4" aria-label="Как работает химик-лаборант в Очаково"></video><p>Из материалов «Очаково» · 32 секунды</p></section>`:''}
      ${s.started?`<nav class="l7-route" aria-label="Путь пробы">${phases.map((p,i)=>btn('phase',`<span>${i<M.maxPhase(s)||s.done?icon('check'):i+1}</span><b>${p}</b>`,i===s.phase?'is-current':'',i,i>M.maxPhase(s)||busy,`aria-label="${p} · этап ${i+1} из 5" ${i===s.phase?'aria-current="step"':''}`)).join('')}</nav><div class="l7-context"><span>${s.registered?'Проба <b>'+D.sample+'</b>':'Проба на приёмке'}<i>·</i>Партия ${D.batch}</span><span class="${s.reported?'is-held':''}">${s.reported?'Партия удерживается':'Работаем в своём темпе'}</span></div>`:''}
      ${s.started&&journal?fullJournal():''}`;
    }
    function journalRows(){return `<div><dt>Титрование</dt><dd>${s.titreSaved?fmt(D.titre/10)+' <small>мл</small>':'<span>ещё не записано</span>'}</dd></div><div><dt>Рефрактометр</dt><dd>${s.brixSaved?fmt(D.brix)+' <small>°Bx</small>':'<span>ещё не записано</span>'}</dd></div>${s.repeatStage===4?`<div class="l7-repeat-row"><dt>Рефрактометр · повтор</dt><dd>${fmt(D.brix)} <small>°Bx</small></dd></div>`:''}`;}
    function fullJournal(){return `<section class="l7-journal" aria-label="Лабораторный журнал"><div><h2>Журнал ${s.registered?D.sample:'будущей пробы'}</h2>${btn('journal',icon('close'),'l7-icon','',false,'aria-label="Закрыть журнал"')}</div><dl>${journalRows()}</dl><p>${D.batch} · источник ${D.tank} · ${s.prep>0?'подготовка 20,2 °C':'подготовка ещё впереди'}${s.repeatStage===4?' · повтор сохранён отдельной записью':''}</p></section>`;}
    function pocket(){return `<section class="l7-pocket" aria-label="Короткий журнал"><header><h3>Твои записи</h3><span>${Number(s.titreSaved)+Number(s.brixSaved)} из 2</span></header><dl>${journalRows()}</dl>${s.phase>=3?`<p>${s.reported?'Отклонение передано':'Теперь сравни их с карточкой'}</p>`:''}</section>`;}
    function coach(text,explanation=''){
      const happy=s.done||s.observed||note&&!bad&&(s.titreSaved||s.brixSaved||s.noticed);
      return `<aside class="l7-side"><div class="l7-coach ${happy?'is-happy':''}"><img src="assets/${happy?'mascot-success.png':'mascot-think.png'}" alt="Капля — твой напарник" width="160" height="210"><div><strong>Капля рядом</strong><p>${text}</p></div></div>${explanation?detail('Зачем это лаборанту?',explanation):''}${s.phase>=2?pocket():''}</aside>`;
    }
    function actionbar(action,caption=''){
      return `<div class="l7-actionbar">${note?`<p class="l7-feedback ${bad?'is-error':''}">${icon(bad?'alert':'check')}${esc(note)}</p>`:''}<div><p>${note&&!bad?'':caption}</p>${action}</div></div>`;
    }
    function workspace(title,instruction,stage,guide,actions,options={}){
      return `<div class="l7-workspace ${options.cls||''}"><div class="l7-headline"><h2 class="l7-title" tabindex="-1">${title}</h2><p>${instruction}</p></div><section class="l7-stage ${options.stageClass||''}" aria-label="${options.sceneLabel||'Рабочее место'}">${stage}</section>${actions}${coach(guide,options.explanation)}</div>`;
    }
    function welcome(){return `<section class="l7-intro"><div class="l7-intro-art"><img class="l7-lab-photo" src="assets/lab-interior-v1.png" alt="Иллюстрация лаборатории напитков" width="1536" height="1024"><div class="l7-intro-note">${icon('drop')}Новая проба для лаборатории</div><img class="l7-intro-mascot" src="assets/mascot-success.png" alt="Капля приглашает тебя на первую смену" width="220" height="285"></div><div class="l7-intro-copy"><h2 class="l7-title" tabindex="-1">Одна проба.<br>Два исследования.</h2><p>Проверь то, чего не видно на глаз. Твои измерения помогут команде заметить отклонение.</p><div class="l7-intro-route"><span>${icon('scan')}Прими и подготовь пробу</span><span>${icon('drop')}Поработай с двумя приборами</span><span>${icon('book')}Передай точные данные</span></div>${primary('start','Принять пробу')}<small>Без таймера. Ошибку можно исправить.</small><img src="assets/lab-brand-pattern.jpg" alt="" width="1754" height="1240"></div></section>`;}
    function receipt(){
      const missing=[['label','партию'],['source','источник'],['seal','крышку']].filter(([k])=>!s.checks.includes(k)).map(([,t])=>t);
      const seen=k=>s.checks.includes(k);
      const evidence=doc==='label'?`<span>Сверка партии</span><div class="l7-match"><div><small>На этикетке</small><b>${D.batch}</b></div>${icon('check')}<div><small>В направлении</small><b>${D.batch}</b></div></div><p>Номера совпадают.</p>`:doc==='source'?`<span>Источник пробы</span><div class="l7-source-trace"><b>${D.tank}</b>${icon('arrow')}<b>${D.batch}</b></div><p>Отбор 10:20 · до насыщения газом</p>`:doc==='seal'?`<span>Осмотр ёмкости</span><div class="l7-seal-symbol">${icon('check')}</div><p>Крышка целая. Следов протечки нет.</p>`:`<span>Направление на исследование</span><strong>${D.batch}</strong><p>Основа напитка<br>Источник: ёмкость ${D.tank}</p><small>Открой точки осмотра на столе.</small>`;
      const stage=`<div class="l7-scene-caption"><span>Приёмный стол</span><strong>${s.checks.length} / 3 сверено</strong></div><div class="l7-receipt-scene"><div class="l7-receipt-sample">${sample(s.registered?D.sample:D.batch)}${btn('inspect',icon(seen('seal')?'check':'scan')+'<span>Осмотреть крышку</span>','l7-hotspot l7-cap-spot','seal',false,`aria-pressed="${doc==='seal'}"`)}${btn('inspect',icon(seen('label')?'check':'scan')+'<span>Сверить партию</span>','l7-hotspot l7-label-spot','label',false,`aria-pressed="${doc==='label'}"`)}</div><div class="l7-receipt-paper"><article class="l7-paper">${evidence}</article>${btn('inspect',icon(seen('source')?'check':'scan')+'Сверить источник','l7-hotspot l7-source-spot','source',false,`aria-pressed="${doc==='source'}"`)}</div></div>`;
      return workspace('У пробы есть адрес.','Сверь партию, источник и целостность ёмкости.',stage,doc==='label'?'Одинаковые номера связывают образец с нужной партией.':doc==='source'?'Источник — не соседняя ёмкость и не догадка. Он указан в направлении.':doc==='seal'?'Целая закрытая ёмкость помогает сохранить образец по дороге в лабораторию.':'Начнём с трёх точек осмотра. Нажимай на подписи рядом с пробой и направлением.',actionbar(primary('register',s.registered?'К подготовке':'Зарегистрировать пробу',missing.length>0),missing.length?'Осталось сверить: '+missing.join(', ')+'.':'Все три проверки готовы. Присвоим номер '+D.sample+'.'),{sceneLabel:'Приёмка пробы',explanation:'Результат нужен конкретной пробе и партии. Если сведения не читаются, лаборант сохраняет пробу отдельно и уточняет их у ответственного сотрудника.'});
    }
    function preparation(){
      const complete=s.prep===3;
      const stage=`<div class="l7-scene-caption"><span>${D.sample} · подготовка</span><strong>${['Температура','Перемешивание','Две порции','Проба готова'][s.prep]}</strong></div><div class="l7-prep-scene ${complete?'has-portions':''}"><div class="l7-prep-source">${sample()}${s.prep===2?`<span class="l7-bottle-note">Однородный образец ${icon('check')}</span>`:''}</div>${complete?`<div class="l7-portion-pair"><div class="l7-portion">${sample('L-041 · A',true)}<b>Титрование</b></div><div class="l7-portion">${sample('L-041 · B',true)}<b>Рефрактометр</b></div></div>`:`<div class="l7-temperature"><span>${icon('thermo')}Температура образца</span><strong><b class="l7-temperature-value">${s.prep===0?'24,3':'20,2'}</b><small>°C</small></strong><div class="l7-temperature-scale"><i></i><b style="left:${s.prep===0?'88':'43'}%"></b></div><p><span>19 °C</span><span>21 °C</span></p><small>Условия учебной карточки: 19–21 °C</small></div>`}</div><ol class="l7-prep-track">${['Температура','Перемешивание','Две порции'].map((t,i)=>`<li class="${s.prep>i?'is-done':s.prep===i?'is-current':''}">${icon(s.prep>i?'check':['thermo','mix','drop'][i])}${t}</li>`).join('')}</ol>`;
      return workspace(['Подготовь условия.','Перемешай образец.','Раздели на две порции.','Всё готово к исследованию.'][s.prep],['Сейчас образец теплее, чем указано в учебной карточке.','Аккуратно приведи состав образца к однородности.','Для каждого метода нужна своя чистая порция.','Можно начать с любого из двух методов.'][s.prep],stage,['Число зависит и от условий. Сначала приведём пробу к указанной температуре.','Перемешиваем аккуратно — без вспенивания и разбавления.','Использованный раствор не возвращают в исходную ёмкость.','Обе порции связаны с одной пробой '+D.sample+'.'][s.prep],actionbar(primary(complete?'to-tests':'prepare',complete?'Выбрать исследование':['Подготовить температуру','Перемешать образец','Подготовить две порции'][s.prep]),complete?'Дальше — работа с приборами.':'Меняется образец на столе — следи за ним.'),{sceneLabel:'Подготовка пробы',explanation:'Правильная подготовка помогает порции отражать исходный образец. Лаборант соблюдает условия методики, а не подгоняет состав под ожидаемый результат.'});
    }
    function methodTabs(){return `<div class="l7-method-tabs" role="group" aria-label="Исследования пробы">${[['titre','Титрование',s.titreSaved],['brix','Рефрактометр',s.brixSaved]].map(([v,t,done])=>btn('method',icon(done?'check':'drop')+t,s.method===v?'is-current':'',v,busy,`aria-pressed="${s.method===v}"`)).join('')}</div>`;}
    function chooseMethod(){return workspace('С чего начнём?','Оба результата нужны команде. Порядок выбираешь ты.',`<div class="l7-method-choice">${btn('method',`<img src="assets/lab-titration-v6.png" alt="" width="1280" height="1280"><span><b>Титрование</b><small>Капля, перемешивание, наблюдение</small>${icon('arrow')}</span>`,'l7-method-card','titre')}${btn('method',`<img src="assets/lab-refractometer-v6.png" alt="" width="1408" height="1152"><span><b>Рефрактометр</b><small>Подготовь ячейку и считай показание</small>${icon('arrow')}</span>`,'l7-method-card','brix')}</div>`,'В титровании ты увидишь изменение раствора. На рефрактометре — получишь число по шкале °Brix.',actionbar('','Выбери прибор на рабочем столе.'),{stageClass:'l7-choice-stage',explanation:'Разные методы дают разные сведения. Лаборант выбирает методику по заданию, выполняет исследования и сохраняет каждое наблюдение.'});}
    function rig(){
      const pink=s.volume>=D.titre&&s.mixed||s.volume>=30&&!s.mixed;
      const over=s.volume>D.titre&&s.mixed;
      return `<div class="l7-scene-caption"><span>Бюретка и колба</span><strong>Порция A · ${D.sample}</strong></div><div class="l7-rig-scene ${over?'is-over':''}"><div class="l7-consumption"><span>Расход титранта</span><strong>${fmt(s.volume/10)}<small>мл</small></strong><p>${s.titreSaved?'Записан в журнал':!s.rig?'Начальный отсчёт: 0,0':!s.mixed?'Теперь перемешай':s.observed?'Конечная точка замечена':'Наблюдай после перемешивания'}</p></div><svg class="l7-rig-visual" viewBox="0 0 900 620" role="img" aria-label="Бюретка и отдельная колба. ${pink?'Розовая окраска раствора':'Почти бесцветный раствор'}"><svg x="150" y="0" width="438" height="584" viewBox="0 0 768 1024"><image href="assets/lab-titration-parts-v7.png" width="1536" height="1024"/></svg><g class="l7-moving-flask"><g id="l7-flask-material"><svg x="359.5" y="333.5" width="192" height="256" viewBox="768 0 768 1024"><image href="assets/lab-titration-parts-v7.png" width="1536" height="1024"/></svg><path class="l7-liquid" d="M394 530 Q451 514 508 530 L516 552 Q451 578 387 552Z" fill="${pink?'#e9578a':'#e5c56f'}" opacity="${pink?(over?'.65':'.3'):'.05'}"/></g></g><path class="l7-droplet" d="M451 391s-5 9-5 12a5 5 0 0 0 10 0c0-3-5-12-5-12Z" fill="#d50032" opacity="0"/></svg><div class="l7-colour-loupe"><span>Раствор крупно</span><svg viewBox="380 490 142 85" aria-hidden="true"><use href="#l7-flask-material"/></svg><small>${s.mixed?'После перемешивания':'До перемешивания'}</small></div>${s.rig&&!s.titreSaved?btn('mix',icon('mix')+'<span>Перемешать</span>','l7-flask-hit','',s.mixed,'aria-label="Перемешать: нажми на колбу"'):''}${s.rig&&!s.titreSaved&&!over?`<div class="l7-dosing" role="group" aria-label="Добавление титранта">${btn('dose','+ 1 мл','l7-dose-coarse',10,!s.mixed)}${btn('dose',icon('drop')+'По капле · 0,1 мл',s.volume>=30?'is-recommended':'',1,!s.mixed)}</div>`:''}${over?`<div class="l7-over-note">${icon('alert')}Конечная точка пройдена</div>`:''}</div>`;
    }
    function titre(){
      let action,caption,guide;
      if(s.titreSaved){action=primary(s.brixSaved?'to-results':'method',s.brixSaved?'Сверить результаты':'К рефрактометру',false,'brix');caption='Расход 3,4 мл сохранён.';guide='Есть первая запись. Каждое число сохраняем отдельно и связываем с пробой.';}
      else if(!s.rig){action=primary('rig','Подготовить установку');caption='Наставник проверит установку и начальный отсчёт.';guide='Добавляй титрант порциями и перемешивай. Ближе к изменению окраски переходи на капли.';}
      else if(!s.mixed){action=primary('mix','Перемешать колбу');caption='Окраску оценивают после перемешивания.';guide='Теперь перемешай колбу. Временная розовая окраска может исчезнуть — это важно заметить.';}
      else if(s.volume>D.titre){action=primary('retry-titre','Взять новую порцию');caption='Эта попытка не станет результатом. Штрафа нет.';guide='Слишком яркая окраска — конечная точка пройдена. Повторим, переходя на капли раньше.';}
      else if(s.observed){action=primary('save-titre','Записать '+fmt(D.titre/10)+' мл');caption='Наблюдение подтверждено. Осталось сохранить расход.';guide='Ты заметил стойкую слабую окраску. Записываем расход титранта, а не pH.';}
      else if(colour){action=`<div class="l7-colour-choices" role="group" aria-label="Что стало с окраской">${btn('observe','<i class="l7-swatch is-clear"></i>Окраска исчезла','','fades')}${btn('observe','<i class="l7-swatch is-pink"></i>Окраска сохранилась','','persists')}</div>`;caption='Что видишь после перемешивания?';guide='Сравни два состояния. Нас интересует слабая окраска, которая остаётся после перемешивания.';}
      else {action=s.volume>=30&&(!seenFading||s.volume===D.titre)?primary('look','Оценить окраску'):primary('dose',s.volume>=30?'Добавить 0,1 мл':s.volume?'Добавить ещё 1 мл':'Добавить 1 мл',false,s.volume>=30?1:10);caption=s.volume>=30?'Добавляй по капле. Оценивай раствор после перемешивания.':'Добавь титрант. Затем перемешай колбу.';guide=s.volume>=30?'До конечной точки может оставаться совсем немного. Для точности работай по 0,1 мл.':'Нажимай на дозирование и на колбу. Ты управляешь добавлением и наблюдаешь реакцию.';}
      const extra=s.rig&&s.mixed&&s.volume>0&&s.volume<30&&!colour&&!s.titreSaved?btn('look','Оценить окраску','l7-text'):'';
      return methodTabs()+workspace('Поймай момент изменения.','Добавляй титрант, перемешивай и наблюдай за раствором.',rig(),guide,actionbar(action+extra,caption),{sceneLabel:'Титрование пробы',cls:'l7-titration',explanation:'После добавления титранта временная окраска может исчезать при перемешивании. В этой учебной модели конец определяется слабой устойчивой окраской. По расходу и утверждённой методике специалист рассчитывает титруемую кислотность; миллилитры не равны pH.'});
    }
    function refState(repeat){
      const control=!repeat&&s.control&&!s.clean,loaded=repeat?s.repeatStage>=2:s.loaded,closed=repeat?s.repeatCover:s.cover,done=repeat?s.repeatStage>=3:s.read;
      return {control,loaded,closed:closed||control,done,value:busy?'…':done?fmt(D.brix):control?'10,0':'—',status:busy?'Измерение…':done?'Стабильно · 20,2 °C':control?'Контроль совпал':closed?'Ячейка закрыта':loaded?'Порция нанесена':(!repeat&&s.clean||repeat&&s.repeatStage===1)?'Ячейка очищена':'Подготовь прибор'};
    }
    function refAction(repeat){
      if(busy)return ['skip','Показать результат'];
      if(repeat)return [['repeat-clean','Подготовить прибор'],['repeat-load','Нанести новую порцию'],[s.repeatCover?'repeat-measure':'repeat-cover',s.repeatCover?'Повторить измерение':'Закрыть крышку ячейки'],['repeat-save','Сохранить повтор']][s.repeatStage]||[];
      return !s.control?['control','Проверить контрольный материал']:!s.clean?['clean','Очистить ячейку']:!s.loaded?['load','Нанести порцию L-041']:!s.cover?['cover','Закрыть крышку ячейки']:!s.read?['measure','Начать измерение']:!s.brixSaved?['save-brix','Записать 9,2 °Bx']:s.titreSaved?['to-results','Сверить результаты']:['method','К титрованию','titre'];
    }
    function refractometer(repeat=false){
      const r=refState(repeat),action=refAction(repeat),isLoad=['load','repeat-load'].includes(action[0]);
      const spot=['control','clean','load','cover','repeat-clean','repeat-load','repeat-cover'].includes(action[0]);
      const spotLabel=({control:'Проверить контроль',clean:'Очистить ячейку',load:'Нанести порцию',cover:'Закрыть крышку','repeat-clean':'Подготовить прибор','repeat-load':'Нанести порцию','repeat-cover':'Закрыть крышку'})[action[0]];
      return `<div class="l7-scene-caption"><span>Настольный рефрактометр</span><strong>${repeat?'Новая порция':r.control?'Контрольный материал':'Порция B'}</strong></div><div class="l7-ref-scene"><div class="l7-ref-portion ${isLoad?'is-draggable':''}" ${isLoad?'draggable="true" data-drag="portion"':''}>${sample(repeat?'L-041 · повтор':'L-041 · B',true)}<span>${isLoad?'Можно перетащить в ячейку':'Отдельная порция'}</span></div><div class="l7-device ${r.loaded?'is-loaded':''} ${r.closed?'is-closed':''} ${busy?'is-measuring':''}" data-drop="cell"><img class="l7-device-art" src="assets/${r.closed?'lab-refractometer-closed-v6.png':'lab-refractometer-v6.png'}" alt="Рефрактометр: экран слева, ячейка справа ${r.closed?'закрыта':'открыта'}" width="1408" height="1152"><div class="l7-lcd"><strong>${r.value}<small>°Bx</small></strong></div><i class="l7-prism" aria-hidden="true"></i><div class="l7-pipette" aria-hidden="true"><i></i><b></b><span></span></div>${spot?btn(action[0],icon(action[0].includes('cover')?'check':isLoad?'drop':'scan')+`<span>${spotLabel}</span>`,'l7-target','',false,`aria-label="На приборе: ${spotLabel.toLowerCase()}"`):''}</div></div><div class="l7-device-status"><span>${repeat?'Повтор · L-041':r.control?'Контрольный материал':r.loaded?'Проба L-041':'Измерительная ячейка'}</span><strong>${r.status}</strong></div>${busy?'<div class="l7-measure-progress" aria-hidden="true"><i></i></div>':''}`;
    }
    function refraction(repeat=false){
      const [action,label,value]=refAction(repeat),r=refState(repeat);
      const guide=repeat?'Повтор выполняем на новой порции исходной пробы. Первое показание останется в журнале.':!s.control?'Наставник выполнил калибровку. Проверим прибор материалом с известным значением 10,0 °Bx.':!s.clean?'Контроль совпал. Перед пробой нужно удалить контрольный раствор и очистить ячейку.':!s.loaded?'Нанеси отдельную порцию в ячейку справа. Можно нажать на подпись или перетащить образец.':!s.cover?'Закрой ячейку перед измерением — теперь все условия подготовлены.':!s.read?'Дождись стабильного показания. Короткую анимацию можно завершить кнопкой.':!s.brixSaved?'Число стабильно. Сохрани его вместе с идентификатором пробы.':'Есть запись рефрактометра. Данные двух методов нужны вместе.';
      const track=!repeat?`<ol class="l7-ref-track" aria-label="Подготовка рефрактометра">${[[s.control,'Контроль'],[s.clean,'Чистота'],[s.loaded,'Порция'],[s.cover,'Крышка'],[s.brixSaved,'Запись']].map(([done,text])=>`<li class="${done?'is-done':''}">${icon(done?'check':'drop')}<span>${text}</span></li>`).join('')}</ol>`:'';
      const response=repeat?`<div class="l7-team-response"><span>${icon('check')}Ты передал отклонение</span><span>${icon('check')}Оператор удерживает P-214</span><span>${icon('redo')}Качество назначило повтор</span></div>`:'';
      return (!repeat?methodTabs():'')+workspace(repeat?'Проверь на новой порции.':'Несколько капель — точное число.',repeat?'Наставник проверил условия и назначил повтор.':'Подготовь ячейку и сохрани стабильное показание.',response+refractometer(repeat)+track,guide,actionbar(primary(action,label,false,value||''),repeat?'Исходный результат не перезаписывается.':r.done?'Показание готово к записи.':'Действуй с прибором на столе.'),{sceneLabel:repeat?'Повторное измерение':'Работа с рефрактометром',explanation:'Рефрактометр измеряет преломление света. Шкала °Brix зависит от разных растворённых веществ: это не отдельное измерение чистого сахара и не измерение плотности. Ячейку и пробу готовят по методике.'});
    }
    function resultSheet(kind){
      const titre=kind==='titre',value=titre?D.titre/10:D.brix,[lo,hi]=titre?D.titreRange:D.brixRange,min=titre?2.8:8.8,max=titre?4:10.8,unit=titre?'мл':'°Bx',title=titre?'Расход титранта':'Рефрактометр';
      return btn('notice',`<div class="l7-result-heading"><span>${title}</span><strong>${fmt(value)}<small>${unit}</small></strong></div><div class="l7-result-range" role="img" aria-label="Результат ${fmt(value)} ${unit}, учебный диапазон ${fmt(lo)}–${fmt(hi)} ${unit}"><i style="left:${(lo-min)/(max-min)*100}%;width:${(hi-lo)/(max-min)*100}%"></i><b style="left:${(value-min)/(max-min)*100}%"></b></div><div class="l7-range-labels"><span>${fmt(min)}</span><span>Диапазон ${fmt(lo)}–${fmt(hi)}</span><span>${fmt(max)}</span></div>${s.noticed&&kind==='brix'?`<p class="l7-result-flag">${icon('alert')}Ниже диапазона</p>`:''}`,'l7-result-sheet '+(s.noticed&&kind==='brix'?'is-noticed':''),kind,false,`aria-label="Отметить отклонение: ${title}, ${fmt(value)} ${unit}"`);
    }
    function results(){
      const stage=`<div class="l7-scene-caption"><span>Учебная карточка · ${D.sample}</span><strong>Два результата</strong></div><div class="l7-result-sheets">${resultSheet('titre')}${resultSheet('brix')}</div><p class="l7-range-note">Диапазоны относятся только к учебной модели.</p>`;
      const decisions=s.noticed?`<div class="l7-decisions" role="group" aria-label="Что передать команде">${[['hold','Сообщить об отклонении'],['release','Передать без замечаний'],['fix','Изменить состав пробы']].map(([v,t])=>btn('judgement',icon(s.judgement===v?'check':'arrow')+t,s.judgement===v?'is-selected':'',v,false,`aria-pressed="${s.judgement===v}"`)).join('')}</div>`:'';
      return workspace(s.noticed?'Число ниже диапазона.':'Какое число требует внимания?',s.noticed?'Выбери, что передать команде.':'Нажми на результат за пределами учебного диапазона.',stage,'Отклонение — повод проверить и передать факты. Его причина пока неизвестна.',decisions+actionbar(s.noticed?primary('report','Передать наблюдение',!s.judgement):'',s.noticed?'Лаборант сообщает измеренное. Решение о партии — у специалистов качества.':'Зелёная область — диапазон карточки. Тонкая отметка — твой результат.'),{explanation:'Сравнивают результат с требованиями конкретной методики и продукта. Нельзя отбросить неудобное число или изменить исходную пробу, чтобы попасть в диапазон. Учебные значения здесь не являются нормативами продукции «Очаково».'});
    }
    function team(){
      if(s.repeatStage<4)return refraction(true);
      const stage=`<div class="l7-scene-caption"><span>${s.done?'Запись принята':'Пакет данных для наставника'}</span><strong>${D.sample}</strong></div><div class="l7-handover-sheet"><div class="l7-handover-stamp">${icon(s.done?'check':'book')}<span>${s.done?'Данные переданы':'Обе записи сохранены'}</span></div><dl><div><dt>Титрование</dt><dd>3,4 <small>мл</small></dd></div><div><dt>Рефрактометр · исходный</dt><dd>9,2 <small>°Bx</small></dd></div><div><dt>Рефрактометр · повтор</dt><dd>9,2 <small>°Bx</small></dd></div></dl><div class="l7-report-conclusion"><strong>Отклонение подтверждается.</strong><p>Причина не установлена. Партия P-214 остаётся на удержании.</p></div></div>`;
      const finish=s.done?a.button('finish','Записать открытие'+icon('arrow'),'','l7-button l7-primary','data-next'):primary('handover','Передать записи наставнику');
      return workspace(s.done?'Точность помогла команде.':'Передай всю картину.',s.done?'Ты вовремя заметил отклонение и сохранил данные.':'Повтор тоже ниже диапазона. Обе записи нужны наставнику.',stage,s.done?'Хорошая смена — это достоверные данные. Даже когда партия пока не может идти дальше.':'Передаём исходное число и повтор. Решение остаётся за уполномоченными специалистами.',actionbar(finish+(s.done?btn('restart',icon('redo')+'Пройти ещё раз','l7-text'):''),s.done?'Открытие сохранится в твоём паспорте.':'Это учебная передача внутри игры.'),{cls:s.done?'is-complete':'',explanation:'Лаборант помогает команде данными. О дальнейших действиях с партией решают уполномоченные специалисты качества вместе с технологом.'});
    }
    function footer(){
      return `${s.started?`<footer class="l7-footer">${btn('hint',icon('info')+'Подсказка','l7-text','',false,`aria-expanded="${hint}"`)}<span>${storageOK?'Прогресс сохранён на устройстве':'Сохранение недоступно — оставь вкладку открытой'}</span>${hint?`<p>${['Нажми на три точки осмотра. После сверки зарегистрируй пробу.','Подготовь температуру, аккуратно перемешай и раздели на две отдельные порции.','На титровании после 3,0 мл переходи на капли. Оценивай окраску после перемешивания. На рефрактометре подготовь ячейку и сохрани стабильное число.','Отметь показание 9,2 °Bx: оно ниже 9,8. Передай отклонение, не изменяя пробу.','Выполни назначенный повтор на новой порции и сохрани отдельной записью. Затем передай наставнику.'][s.phase]}</p>`:''}</footer>`:''}${detail('О профессии и учебной модели','Химик-лаборант работает с пробами, методиками, посудой, приборами и записями. В присланном ролике компании показаны титрование и рефрактометрия. Сюжет, образец, показатели и диапазоны вымышлены. Приборы и реакция упрощены, время подготовки сокращено. Методики, реактивы, расчёты и допуск к работе определяет наставник.')}`;
    }
    function render(){
      if(disposed)return;
      a.settle();
      const active=document.activeElement,hadFocus=a.content.contains(active),key=active?.closest('[data-key]')?.dataset.key,summary=active?.matches('summary')?active.textContent:null;
      const open=new Set([...a.content.querySelectorAll('details[open]')].map(n=>n.querySelector('summary')?.textContent));
      const oldVideo=film?a.content.querySelector('video'):null,playing=oldVideo&&!oldVideo.paused&&!oldVideo.ended;
      a.root.classList.toggle('is-started',s.started);
      const body=!s.started?welcome():s.phase===0?receipt():s.phase===1?preparation():s.phase===2?(!s.method?chooseMethod():s.method==='titre'?titre():refraction()):s.phase===3?results():team();
      a.content.innerHTML=header()+`<div class="l7-body">${body}</div>`+footer();
      for(const d of a.content.querySelectorAll('details'))d.open=open.has(d.querySelector('summary')?.textContent);
      if(oldVideo){a.content.querySelector('video')?.replaceWith(oldVideo);if(playing)oldVideo.play().catch(()=>{});}
      if(hadFocus){
        const target=key?[...a.content.querySelectorAll('[data-key]')].find(n=>n.dataset.key===key&&!n.disabled):active===oldVideo?oldVideo:summary?[...a.content.querySelectorAll('summary')].find(n=>n.textContent===summary):null;
        (target||a.content.querySelector('[data-next]:not([disabled])')||a.content.querySelector('.l7-stage button:not([disabled])')||a.content.querySelector('.l7-title'))?.focus({preventScroll:true});
      }
    }
    function motion(type,old){
      const q=selector=>a.content.querySelector(selector);
      a.animate(g=>{
        const t=g.timeline({defaults:{duration:.35,ease:'power2.out'}});
        const mascot=q('.l7-coach>img');
        if(type==='dose'){
          t.fromTo(q('.l7-droplet'),{y:0,opacity:1},{y:115,opacity:0,duration:.42,ease:'power2.in'},0);
          t.fromTo(q('.l7-liquid'),{opacity:.05},{opacity:s.volume>=30?.3:.05,duration:.3},.2);
        }else if(type==='mix'){
          t.to(q('.l7-moving-flask'),{x:15,y:-8,rotation:5,svgOrigin:'451 520',duration:.2}).to(q('.l7-moving-flask'),{x:-12,rotation:-5,duration:.2}).to(q('.l7-moving-flask'),{x:8,rotation:3,duration:.2}).to(q('.l7-moving-flask'),{x:0,y:0,rotation:0,duration:.2,clearProps:'transform'});
          t.fromTo(q('.l7-liquid'),{opacity:.35},{opacity:s.volume>=D.titre?(s.volume>D.titre?.65:.3):.05,duration:.65},0);
        }else if(type==='prepare-1'){
          const counter={value:24.3};t.to(counter,{value:20.2,duration:.75,onUpdate:()=>{const n=q('.l7-temperature-value');if(n)n.textContent=fmt(counter.value);}});
          t.fromTo(q('.l7-temperature-scale>b'),{x:70},{x:0,duration:.75},0);
        }else if(type==='prepare-2')t.fromTo(q('.l7-prep-source'),{rotation:-7},{rotation:0,duration:.7,ease:'power2.inOut',clearProps:'transform'});
        else if(type==='prepare-3')t.from(q('.l7-portion-pair'),{x:-50,opacity:.4,duration:.55,clearProps:'transform,opacity'});
        else if(type==='load')t.fromTo(q('.l7-pipette'),{x:-110,y:-30,opacity:.3},{x:0,y:0,opacity:1,duration:.65,clearProps:'transform,opacity'});
        else if(type==='cover'||type==='control')t.fromTo(q('.l7-device-art'),{opacity:.6},{opacity:1,duration:.25,clearProps:'opacity'});
        else if(type==='clean')t.fromTo(q('.l7-device'),{opacity:.7},{opacity:1,duration:.3,clearProps:'opacity'});
        else if(type==='record'){
          const n=q('.l7-pocket');if(n)t.fromTo(n,{y:8,opacity:.6},{y:0,opacity:1,duration:.4,clearProps:'transform,opacity'});
          if(mascot)t.fromTo(mascot,{rotation:-6,y:3},{rotation:0,y:0,duration:.45,clearProps:'transform'},0);
        }else if(type==='inspect')t.fromTo(q('.l7-paper'),{y:5,opacity:.65},{y:0,opacity:1,duration:.3,clearProps:'transform,opacity'});
        else if(type==='handover'){
          t.fromTo(q('.l7-handover-stamp'),{scale:.85,opacity:.4},{scale:1,opacity:1,duration:.45,clearProps:'transform,opacity'});
          if(mascot)t.fromTo(mascot,{y:10,rotation:-5},{y:0,rotation:0,duration:.5,clearProps:'transform'},0);
        }else if(type==='phase'||type==='method')t.fromTo(q('.l7-stage'),{opacity:.8},{opacity:1,duration:.2,clearProps:'opacity'});
        else return null;
        return t;
      });
    }
    function stable(){if(!busy||disposed)return;clearTimeout(timer);timer=null;busy=false;dispatch('stable');}
    function measure(){
      if(busy)return;busy=true;note='';colour=false;render();
      if(window.GameMotion?.enabled()===false||window.matchMedia('(prefers-reduced-motion: reduce)').matches){stable();return;}
      a.animate(g=>g.timeline().fromTo(a.content.querySelector('.l7-measure-progress>i'),{scaleX:0},{scaleX:1,duration:1.2,ease:'none'}));
      timer=setTimeout(stable,1200);
    }
    function dispatch(type,value){
      if(disposed)return;
      const old=s,result=M.transition(s,type,value),phaseChanged=result.state.phase!==s.phase||result.state.started!==s.started;
      s=result.state;
      if(type==='inspect')doc=value;
      if(type==='restart'){doc='';journal=false;hint=false;colour=false;}
      if(type==='dose'||type==='retry-titre'||type==='method'||phaseChanged)colour=false;
      if(type==='observe'&&result.changed){colour=false;if(value==='fades')seenFading=true;}if(type==='restart'||type==='retry-titre')seenFading=false;
      if(result.note)tell(result.note,result.bad);else{note='';bad=false;}
      if(result.changed)save();
      if(phaseChanged)hint=false;
      render();motion(result.motion,old);
      if(phaseChanged){hint=false;a.content.querySelector('.l7-title')?.focus({preventScroll:true});a.root.scrollIntoView({block:'start',behavior:'instant'});}
    }
    function act(type,value){
      if(!type.startsWith('l7-'))return;type=type.slice(3);
      if(['journal','film','hint'].includes(type)){if(type==='journal')journal=!journal;if(type==='film')film=!film;if(type==='hint')hint=!hint;render();return;}
      if(type==='skip'){stable();return;}
      if(busy)return;
      if(type==='look'){colour=true;note='';render();a.content.querySelector('.l7-colour-choices button')?.focus({preventScroll:true});return;}
      if(type==='measure'&&s.phase===2&&s.method==='brix'&&s.cover&&!s.read||type==='repeat-measure'&&s.phase===4&&s.repeatStage===2&&s.repeatCover){measure();return;}
      dispatch(type,value);
    }
    const onMotion=e=>{if(!e.detail.enabled&&busy)stable();};document.addEventListener('ochakovo:motion',onMotion);
    return {managesFocus:true,start(){save();render();},act,done:()=>s.done,result:()=>({learned:window.OchakovoShift.roles.lab.learned}),drop(target,value){if(target!=='cell'||value!=='portion'||busy)return;const ready=s.phase===2&&s.method==='brix'&&s.clean&&!s.loaded||s.phase===4&&s.repeatStage===1;if(ready)dispatch(s.phase===4?'repeat-load':'load');else{tell('Сначала подготовь чистую ячейку. Затем нанеси отдельную порцию.',true);render();}},cleanup(){disposed=true;clearTimeout(timer);document.removeEventListener('ochakovo:motion',onMotion);}};
  });
})();
