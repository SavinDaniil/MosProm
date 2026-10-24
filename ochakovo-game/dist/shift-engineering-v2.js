/* Ochakovo: an illustrated investigation. Equipment and values are educational. */
(() => {
  'use strict';
  const css = document.createElement('link');
  css.rel = 'stylesheet'; css.href = new URL('engineering-v2.css?v=2.0', document.currentScript.src).href; document.head.append(css);
  const M = window.OchakovoEngineeringModel, KEY = 'ochakovo-engineering-case-v2';
  const names = ['Сообщение оператора','Устройство линии','Запись события','Проверка версий','Работа специалиста','Испытание','Передача смене'];
  const titles = ['Бутылки есть. Почему линия ждёт?','Как линия замечает бутылку','Найди пропущенные бутылки','У каждой версии есть основание','Проверим нашу версию','Работа выполнена. А результат?','Что узнает следующая смена'];
  const intros = ['Уточни у оператора, что произошло. Факты сами попадут в журнал.','Датчик замечает объект, контроллер считает, механизм выполняет команду.','Сравни бутылку, выход датчика и вход контроллера в одном проходе.','Изучи свидетельства и сопоставь хотя бы две версии.','Предложи работу наставнику и объясни, на что опираешься.','Проверь распознавание, передачу и выпуск полной группы.','Передай точные данные и объясни, зачем нужна проверка.'];
  const questions = [
    ['symptom','Что происходило?','Бутылки проходили, а счёт иногда не менялся. Механизм продолжал ждать группу.'],
    ['repeat','Это повторялось?','После нормальной работы было ещё два ожидания. Запись последнего случая сохранил.'],
    ['unchanged','Что менялось?','Бутылки, скорость и настройки прежние. Бутылки шли по одной. Это ещё проверим по записи.'],
    ['stopped','Участок остановлен?','Да, остановил штатным способом и сообщил наставнику. Внутрь оборудования не заходил.'],
    ['damage','Бутылки застревали?','Застрявших и повреждённых бутылок не заметил. Это наблюдение, а не диагноз.']
  ];
  const sources = [
    {id:'doc',title:'Как работает S1',kind:'Описание стенда',short:'Датчик замечает отражённый от бутылки свет. Положение и состояние окна могут влиять на распознавание.',full:'Выход S1 означает «бутылка распознана». Контроллер получает это сообщение и увеличивает счёт. В этой учебной модели используются одинаковые непрозрачные бутылки. Загрязнение окна и изменение положения способны мешать отражённому свету.'},
    {id:'history',title:'Что было раньше',kind:'История обслуживания',short:'Раньше распознавание было устойчивым. Положение и настройки зафиксированы.',full:'После предыдущего осмотра использовался тот же комплект бутылок. Записей об изменении параметров нет. Отсутствие записи не доказывает отсутствие любых изменений: сведения нужно сопоставить с осмотром.'},
    {id:'inspect',title:'Осмотреть датчик',kind:'Осмотр специалистом',short:'На окне обнаружен матовый след. Крепление и положение соответствуют исходной отметке.',full:'Квалифицированный специалист выполнил осмотр после подготовки безопасных условий. Видимых повреждений корпуса нет. След — наблюдение. Его связь с пропусками ещё предстоит проверить.'},
    {id:'flow',title:'Как идут бутылки',kind:'Запись движения',short:'Бутылки проходят по одной, с промежутками. До датчика доходят все шесть.',full:'Остановок перед S1 и заметного изменения скорости нет. Версия о бутылках, идущих вплотную, этой записью не поддерживается.'},
    {id:'wire',title:'Доходит ли сигнал',kind:'Диагностическая запись',short:'Выход датчика и вход контроллера совпадают во всех шести проходах.',full:'Пропуски уже есть на выходе S1. Диагностика питания без зарегистрированных отклонений. Эти сведения не доказывают полную исправность электроники.'},
    {id:'gate',title:'Почему механизм ждёт',kind:'Состояние узла',short:'Команда выпуска не выдавалась: система насчитала четыре бутылки вместо шести.',full:'Следующий участок готов принять группу. Пока условие счёта не выполнено, ожидание механизма объяснимо. Реальное движение проверим после обслуживания.'},
    {id:'parts',title:'Есть ли запасная деталь',kind:'Каталог',short:'Совместимый датчик есть. Наличие детали не объясняет причину сбоя.',full:'Каталог нужен для выбора замены, когда её необходимость обоснована. Сначала проверим наблюдения.'}
  ];
  const hypotheses = [['spacing','Бутылки идут вплотную'],['position','Датчик сместился'],['dirt','Свету мешает след на окне'],['transfer','Сигнал теряется по пути'],['electronics','Неисправна электроника']];
  const checks = ['Все бутылки распознаны','Выход и вход совпали','В промежутке нет ложных событий','Обе группы выпущены'];
  const paths = {back:'M20 12H4m6-6-6 6 6 6',arrow:'M4 12h16m-6-6 6 6-6 6',book:'M4 4h6c2 0 2 1 2 2 0-1 0-2 2-2h6v15h-6c-2 0-2 1-2 1s0-1-2-1H4zM12 6v14',check:'m5 12 4 4L19 6',close:'m6 6 12 12M6 18 18 6',play:'m8 4 12 8-12 8Z',pause:'M8 4v16M16 4v16',help:'M9 8a3 3 0 1 1 4 3c-1 1-1 2-1 3m0 3v1',redo:'M4 10a8 8 0 1 1 0 6m0-6V4m0 6h6',info:'M12 10v7m0-11v1',route:'M5 5h14M5 12h14M5 19h14',eye:'M2 12s4-7 10-7 10 7 10 7-4 7-10 7S2 12 2 12Zm10-3a3 3 0 1 0 0 6 3 3 0 0 0 0-6Z'};
  const icon = n => `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="${paths[n] || paths.info}"/></svg>`;
  Object.assign(window.OchakovoShift.roles.engineering, {role:'Инженер по автоматизации',lead:'Разберись, почему линия ждёт, вместе с инженером-наставником.',learned:'Уточнил симптомы, сравнил движение и сигналы, обосновал проверку версии, проверил результат и передал данные команде.'});
  window.OchakovoShift.register('engineering', a => {
    const esc = a.esc; let s, storageOK = true, note = '', error = false, source = 'doc', question = '', drawer = '', lastFocus = null, playing = false, timer = null, normalFrame = 0, historicalFrame = null, camera = '', disposed = false;
    try { s = M.normalize(JSON.parse(localStorage.getItem(KEY) || 'null')); } catch { s = M.fresh(); storageOK = false; }
    if(s.accepted)s.phase=6;
    a.root.classList.add('engineering-v2');
    a.root.querySelector('.shift-heading').hidden = true; a.root.querySelector('.shift-profession').hidden = true;
    const live = a.root.querySelector('.shift-feedback'); live.className = 'e2-live';
    const btn = (type,text,value='',cls='',attrs='') => {
      const archived=s.phase<s.unlocked || s.handed && s.phase<6;
      const viewing=['ask','demo','play','prev','next-frame','frame','source','step','route','journal','help','motion','close','object','restart','camera'].includes(type);
      return a.button('e2-'+type,text,value,'e2-button '+cls,`data-key="${esc(type+':'+value)}" ${archived&&!viewing?'disabled':''} ${attrs}`);
    };
    const choice = (type,value,text,on=false) => btn(type,`<span class="e2-choice-mark">${on?icon('check'):''}</span><span>${text}</span>`,value,'e2-choice',`aria-pressed="${on}"`);
    const next = (type,text) => btn(type,text+icon('arrow'),'','e2-primary');
    const has = (key,value) => (s[key] || []).includes(value);
    const frameIndex = () => historicalFrame === null ? s.frame : historicalFrame;
    function save() { try { localStorage.setItem(KEY,JSON.stringify(s)); storageOK = true; } catch { storageOK = false; } }
    function stop() { playing = false; clearTimeout(timer); timer = null; }
    function apply(type,value) {
      const before = s.phase, out = M.dispatch(s,{type,value}); s = out.state; note = out.message || ''; error = !!out.error;
      if(!error && ['ask','read-source'].includes(type))note='';
      if (out.changed) save(); if (before !== s.phase) { stop(); question = ''; historicalFrame = null; camera = ''; }
      live.textContent = out.message || '';
      render(before !== s.phase || type==='handoff' ? 'title' : 'keep');
    }
    function current() {
      if (s.phase === 1 && s.normalSeen) return {mode:'normal',count:normalFrame+1,detected:true,bottle:true,label:'Пример нормальной работы',gate:normalFrame===5};
      if (s.phase === 2) return {mode:'history',count:[1,1,2,3,3,4][frameIndex()],detected:!![1,0,1,1,0,1][frameIndex()],bottle:true,label:'Запись до остановки · проход '+(frameIndex()+1)+' из 6',gate:false};
      if (s.accepted) return {mode:'running',count:6,detected:true,bottle:true,label:'Оператор вернул участок в работу',gate:true};
      if (s.test >= 4) return {mode:'checked',count:6,detected:true,bottle:true,label:'Испытание завершено · обе группы выпущены',gate:true};
      if (s.test === 3) return {mode:'gap',count:0,detected:false,bottle:false,label:'Испытание · промежуток без бутылок',gate:false};
      if (s.test === 2) return {mode:'testing',count:6,detected:true,bottle:true,label:'Испытание · полный проход A',gate:true};
      if (s.test === 1) return {mode:'testing',count:3,detected:true,bottle:true,label:'Испытание · первые три бутылки',gate:false};
      if(s.work===3)return {mode:'serviced',count:0,detected:false,bottle:false,label:'Обслужено · готовится испытание',gate:false};
      return {mode:s.work>0?'service':'stopped',count:4,detected:false,bottle:true,label:s.work===3?'Обслужено · ожидает испытания':s.work>0?'Работает специалист':'Учебный участок остановлен',gate:false};
    }
    const bottle = (n,active=false) => `<span class="e2-bottle ${active?'is-active':''}"><img src="assets/engineering-bottle-v2.png" width="120" height="240" alt=""><b>${n}</b></span>`;
    function machinery(v) {
      const selected = s.phase===2 || s.phase===1 && s.normalSeen;
      const bottles = v.bottle ? (selected ? [bottle(s.phase===2?frameIndex()+1:normalFrame+1,true)] : [1,2,3,4,5,6].map(n=>bottle(n)).join('')) : '';
      return `<div class="e2-plane ${selected?'is-focused-bottle':''} ${v.gate?'is-releasing':''}">
        <img class="e2-line-art" src="assets/${v.gate?'engineering-line-open-v2.png':'engineering-line-v2.png'}" width="1774" height="887" alt="Учебная линия: конвейер, оптический датчик, контроллер и механизм группирования${v.gate?', заслонка открыта':''}">
        <div class="e2-bottles ${selected?'is-single':''} ${playing?'is-playing':''}">${bottles}</div>
        <span class="e2-lamp ${v.detected?'is-on':''}" aria-hidden="true"></span>
        ${has('read','inspect')&&s.work<3?'<span class="e2-window-trace" aria-hidden="true"></span>':''}
        <div class="e2-machine-count" aria-label="Счёт контроллера"><small>Счёт</small><strong>${v.count}<i>/6</i></strong></div>
        <svg class="e2-signal-path" viewBox="0 0 1774 887" aria-hidden="true"><path class="${v.detected?'is-on':''}" d="M800 318H940V210H1115" fill="none" stroke-width="7" stroke-linecap="round" stroke-dasharray="12 14"/></svg>
        ${btn('object','Подача','feed','e2-hotspot e2-hotspot-feed')}${btn('object','Датчик S1','sensor','e2-hotspot e2-hotspot-sensor')}${btn('object','Контроллер','controller','e2-hotspot e2-hotspot-controller')}${btn('object','Механизм','group','e2-hotspot e2-hotspot-group')}
      </div>`;
    }
    function readings(v) {
      const active = ['history','normal','testing','checked','gap','running'].includes(v.mode);
      return `<div class="e2-readings" aria-label="Наблюдения в выбранный момент"><div><span>Бутылка в зоне</span><strong>${active?(v.bottle?'Есть':'Нет'):'Смотри запись'}</strong></div><div><span>Выход датчика</span><strong class="${active&&!v.detected&&v.bottle?'e2-mismatch':''}">${active?(v.detected?'Есть сигнал':'Нет сигнала'):'Ещё не проверено'}</strong></div><div><span>Вход контроллера</span><strong>${active?(v.detected?'Есть сигнал':'Нет сигнала'):'Ещё не проверено'}</strong></div><div><span>Механизм</span><strong>${v.gate?'Группа выпущена':'Ждёт группу'}</strong></div></div>`;
    }
    function scene() {
      const v = current();
      const cam=camera || (s.phase===5||s.phase===6&&s.accepted||s.phase===1&&s.normalSeen&&normalFrame===5?'group':s.phase>=2&&s.phase<=4?'sensor':'all');
      return `<section class="e2-scene" data-mode="${v.mode}" data-camera="${cam}" aria-label="Игровой участок"><div class="e2-scene-state"><i></i><span>${v.label}</span></div><div class="e2-camera" role="group" aria-label="Камера участка">${[['all','Вся линия'],['sensor','Датчик'],['group','Механизм']].map(([id,t])=>btn('camera',t,id,cam===id?'is-current':'',`aria-pressed="${cam===id}"`)).join('')}</div>
        <div class="e2-machine-window">${machinery(v)}</div>
        <div class="e2-companion ${s.phase===4&&s.work>0?'has-mentor':''}"><img src="assets/${s.phase===4&&s.work>0?'engineering-mentor-v2.png':error?'mascot-think.png':s.accepted?'mascot-success.png':'mascot.png'}" width="125" height="165" alt="${s.phase===4&&s.work>0?'Инженер-наставник выполняет работу':'Очажок — твой напарник'}">${btn('help','<span>Подсказка</span> '+icon('help'),'','e2-companion-help','aria-label="Подсказка"')}</div>
        ${s.phase===4&&s.work>0?`<div class="e2-service-focus"><div class="e2-optic"><img src="assets/engineering-line-v2.png" alt="Оптическое окно ${s.work>=3?'после обслуживания':'перед обслуживанием'}">${s.work<3?'<span class="e2-dust" aria-hidden="true"></span>':''}</div><strong>${s.work>=3?'Окно обслужено':'Осмотр и работа специалиста'}</strong></div>`:''}
        <div class="e2-scene-caption"><span>Бутылка → датчик → контроллер → механизм</span><strong>${v.count} из 6 зарегистрировано</strong></div>
        ${readings(v)}
      </section>`;
    }
    const person = (name,text) => `<div class="e2-person"><span>${name==='Оператор'?'О':'И'}</span><div><strong>${name}</strong><p>${text}</p></div></div>`;
    function operator() {
      const q = questions.find(x=>x[0]===question);
      return person('Оператор','Бутылки подошли, а механизм ждёт. Участок остановлен. Поможешь разобраться?')+
        `<div class="e2-question-list">${questions.map(([id,label])=>btn('ask',label+(has('asked',id)?icon('check'):icon('arrow')),id,'e2-question',`aria-pressed="${question===id}"`)).join('')}</div>`+
        (q?`<div class="e2-observation"><strong>Ответ оператора</strong><p>${q[2]}</p><small>${icon('check')} Уже в журнале</small></div>`:'')+
        `<details class="e2-detail"><summary>Как команда предупреждает остановки</summary><p>Инженеры изучают повторные замечания, историю остановок и осмотры. Это помогает заметить неполадку до серьёзного сбоя.</p></details>`+
        (['symptom','repeat','unchanged','stopped'].every(x=>has('asked',x))?`<h3>Что передадим наставнику?</h3><div class="e2-options">${choice('report','mismatch','Бутылки проходят, но счёт иногда не меняется',s.report==='mismatch')}${choice('report','replace','Датчик сломан — сразу заменим',s.report==='replace')}</div>${next('check-report','Передать наблюдение')}`:`<p class="e2-next-note">Уточни симптомы, повторяемость, изменения и статус участка.</p>`);
    }
    function mapStage() {
      return person('Инженер-наставник','В этой модели механизм выпускает группу, когда зарегистрированы шесть бутылок и выполнены условия готовности.')+
        btn('demo',icon(playing?'pause':'play')+' Посмотреть нормальную работу','','e2-demo')+
        (s.normalSeen?'<p class="e2-observation">Бутылка прошла → появился сигнал → счёт вырос. При шести регистрациях группа уходит дальше.</p>':'')+
        `<h3>Где начнём сравнение?</h3><div class="e2-options">${[['feed','Подача бутылок'],['sensor','Распознавание датчиком S1'],['group','Механизм группирования']].map(([id,t])=>choice('zone',id,t,s.zone===id)).join('')}</div>${next('check-zone','Проверить выбранную зону')}`;
    }
    function signals() {
      return `<p class="e2-history-note">Это запись прошлого события. Оборудование сейчас остановлено.</p><div class="e2-player"><div class="e2-player-row">${btn('prev',icon('back'),'','e2-icon','aria-label="Предыдущий проход"')}${btn('play',icon(playing?'pause':'play')+(playing?'Пауза':'Смотреть запись'),'','e2-play')}${btn('next-frame',icon('arrow'),'','e2-icon','aria-label="Следующий проход"')}</div><div class="e2-frame-picker" aria-label="Выбор прохода">${[0,1,2,3,4,5].map(i=>btn('frame',`${i+1}${has('marked',i)?'<i aria-hidden="true"></i>':''}`,i,frameIndex()===i?'is-current':'',`aria-label="Проход ${i+1}${has('marked',i)?', отмечен':''}" aria-pressed="${frameIndex()===i}"`)).join('')}</div></div>`+
        btn('mark',icon('eye')+(has('marked',frameIndex())?'Убрать отметку':'Здесь есть расхождение'),'',`e2-mark ${has('marked',frameIndex())?'is-selected':''}`,`aria-pressed="${has('marked',frameIndex())}"`)+
        `<p class="e2-next-note">Отмечено: ${s.marked.length}. Сравни наличие бутылки и распознавание.</p><h3>Какой вывод подтверждён?</h3><div class="e2-options">${[['detect','Часть бутылок не распознаётся'],['wire','Сигнал теряется между датчиком и контроллером'],['gate','Механизм не выполняет команду'],['feed','Бутылки не доходят до датчика']].map(([id,t])=>choice('signal-conclusion',id,t,s.conclusion===id)).join('')}</div>${next('check-signals','Сопоставить наблюдения')}`;
    }
    function evidenceStage() {
      const item = sources.find(x=>x.id===source)||sources[0];
      return `<div class="e2-source-tabs" aria-label="Источники наблюдений">${sources.map(x=>btn('source',x.title+(has('read',x.id)?icon('check'):''),x.id,source===x.id?'is-current':'',`aria-pressed="${source===x.id}"`)).join('')}</div><article class="e2-evidence"><h3>${item.title}</h3>${source==='inspect'?'<div class="e2-inspect"><div class="e2-optic"><img src="assets/engineering-line-v2.png" alt="Осмотр оптического окна датчика"><span class="e2-dust" aria-hidden="true"></span></div><div><strong>Матовый след на окне</strong><span>Положение по исходной отметке</span></div></div>':''}${evidenceVisual(item.id)}<p>${item.short}</p><details class="e2-detail"><summary>Подробнее · ${item.kind}</summary><p>${item.full}</p></details>${btn('read-source',has('read',item.id)?icon('check')+' Наблюдение сохранено':'Сохранить наблюдение',item.id,'e2-save',has('read',item.id)?'disabled':'')}</article><h3>Сопоставь версии</h3><div class="e2-hypotheses">${hypotheses.map(([id,t])=>choice('hypothesis',id,t+(s.links[id]?'<small>Сопоставлено с данными</small>':''),s.hypothesis===id)).join('')}</div>`+
        (s.hypothesis?`<fieldset class="e2-field"><legend>На какое наблюдение опираешься?</legend>${sources.filter(x=>has('read',x.id)).map(x=>choice('link-source',x.id,x.title,s.linkSource===x.id)).join('')}${!s.read.length?'<p>Сначала сохрани наблюдение из источника.</p>':''}</fieldset>${btn('link-hypothesis','Сопоставить версию','','e2-secondary')}`:'')+
        `<p class="e2-next-note">Сопоставлено версий: ${Object.keys(s.links).length}. Нужны описание, история и осмотр.</p>${next('check-hypotheses','Выбрать ведущую версию')}`;
    }
    function evidenceVisual(id){
      if(id==='wire')return `<div class="e2-witness"><table><caption>Запись шести проходов до остановки</caption><tbody>${[['Выход S1'],['Вход контроллера']].map(([label])=>`<tr><th>${label}</th>${[1,0,1,1,0,1].map(v=>`<td class="${v?'':'is-missing'}">${v}</td>`).join('')}</tr>`).join('')}</tbody></table><p>Обе дорожки совпадают. Ноль означает отсутствие сигнала.</p></div>`;
      if(id==='flow')return `<div class="e2-witness"><div class="e2-flow-witness">${[1,2,3].map(n=>bottle(n)).join('')}</div><p>На записи между бутылками есть промежутки. Все шесть доходят до зоны S1.</p></div>`;
      if(id==='doc')return `<div class="e2-witness e2-principle"><span>Датчик S1</span><div>${icon('arrow')}<small>свет и отражение</small>${icon('back')}</div><img src="assets/engineering-bottle-v2.png" width="50" height="75" alt="Непрозрачная учебная бутылка"></div>`;
      return '';
    }
    function workStage() {
      if (s.work > 0) {
        const work = [null,['Сначала — условия работы','Наставник согласует работу с оператором и готовит условия по применимой инструкции. Стажёр остаётся вне зоны обслуживания.','Наблюдать обслуживание'],['Специалист обслуживает окно','Способ выбран по документации. След удаляют, положение и настройки сохраняют для сравнения результата.','Посмотреть результат'],['Обслужено. Теперь проверим','Окно обслужено. Специалист подготавливает испытание и согласует его с оператором. Причину проверяем результатом.','К испытанию']][s.work];
        return person('Инженер-наставник',work[1])+`<div class="e2-work-change"><span class="e2-work-symbol">${icon(s.work===3?'check':'eye')}</span><h3>${work[0]}</h3><p>${s.work===3?'Изменили одно условие: состояние оптического окна.':'Работу выполняет квалифицированный специалист.'}</p></div>${next('work-next',work[2])}`;
      }
      return person('Инженер-наставник','След на окне связан с принципом распознавания. Это ведущая версия, которую ещё нужно проверить.')+`<h3>Что предложишь специалисту?</h3><div class="e2-options">${[['clean','Обслужить оптическое окно'],['settings','Изменить настройку распознавания'],['replace','Заменить датчик'],['drive','Проверить привод механизма']].map(([id,t])=>choice('next-action',id,t,s.nextAction===id)).join('')}</div><fieldset class="e2-field"><legend>Выбери два прямых основания</legend>${[['inspect','На окне обнаружен след'],['doc','Состояние окна влияет на отражённый свет'],['wire','Выход и вход совпадают'],['history','Раньше датчик работал устойчиво']].map(([id,t])=>choice('evidence',id,t,has('evidence',id))).join('')}</fieldset>${next('propose','Обсудить с наставником')}`;
    }
    function testStage() {
      if (!s.test) return person('Инженер-наставник','Сравним работу в прежних условиях: тот же комплект, положение и настройки. Пуском управляют сотрудники.')+`<ol class="e2-test-plan"><li>Полный проход шести бутылок</li><li>Пустой промежуток без ложных событий</li><li>Второй проход и выпуск группы</li></ol><p class="e2-next-note">Это план учебного испытания, а не норматив предприятия.</p>${next('test-start','Наблюдать испытание')}`;
      if (s.test===1) return `<h3>Три бутылки распознаны</h3><p>Счёт 3 из 6. Механизм ждёт полную группу.</p><h3>Можно завершать проверку?</h3><div class="e2-options">${btn('early-test','Да, предложить возврат к работе','resume','e2-answer')}${btn('early-test','Нет, завершить намеченную проверку','continue','e2-answer')}${btn('early-test','Нужна замена датчика','replace','e2-answer')}</div>`;
      return `<div class="e2-test-log"><div><span>Проход A</span><strong>6 из 6</strong><small>Группа выпущена</small></div><div><span>Пустой промежуток</span><strong>${s.test>=3?'0 событий':'Впереди'}</strong><small>${s.test>=3?'Нет ложных регистраций':'Ещё не проверен'}</small></div><div><span>Проход B</span><strong>${s.test>=4?'6 из 6':'Впереди'}</strong><small>${s.test>=4?'Группа выпущена':'Ещё не проверен'}</small></div></div>`+
        (s.test<4?next('test-next',s.test===2?'Наблюдать пустой промежуток':'Наблюдать второй проход'):`<fieldset class="e2-field"><legend>Что подтверждает результат?</legend>${checks.map((t,i)=>choice('criterion',i,t,has('criteria',i))).join('')}</fieldset><div class="e2-options">${choice('test-conclusion','success','Распознавание восстановлено, работа узла проверена',s.testConclusion==='success')}${choice('test-conclusion','mechanism','Механизму нужна наладка: он ждал при трёх бутылках',s.testConclusion==='mechanism')}${choice('test-conclusion','transfer','Передача всё ещё неисправна',s.testConclusion==='transfer')}</div>${next('accept-test','Сверить с наставником')}`);
    }
    function finalStage() {
      if (s.accepted) return `<div class="e2-finale"><h2>Надёжность — работа команды</h2><p>Ты уточнил симптомы, нашёл расхождение, сопоставил версии, проверил результат и передал данные.</p><h3>Что делает инженер</h3><p>Помогает датчикам, программе управления и механизмам работать согласованно. Выясняет причины сбоев и проверяет результат изменений.</p><p>Инженерная команда также занимается осмотрами, плановым обслуживанием, наладкой и улучшением оборудования. Ты попробовал одну часть этой работы.</p><div class="e2-roles"><p><strong>Оператор</strong> наблюдает линию и возобновляет работу.</p><p><strong>Инженер и специалисты</strong> исследуют причину, выполняют работу и проверяют результат.</p><p><strong>Стажёр</strong> учится и предлагает решения рядом с наставником.</p></div>${a.button('finish','Записать открытие '+icon('arrow'),'','e2-button e2-primary')}<a class="e2-career" href="#careers">Об инженерном направлении и практике ${icon('arrow')}</a><details class="e2-detail"><summary>Какие возможности есть в материалах компании?</summary><p>Работа в паре с инженером технической поддержки, оцифровка линии и план оптимизации приведены как примеры бесплатной практики по договорённости. Актуальные задачи и условия уточняет отдел подбора. Практика — с 18 лет.</p></details><small>Игровое открытие не является оценкой профпригодности.</small></div>`;
      if (s.handed) return person('Инженер-наставник','Результат проверки получил. Согласуем возвращение участка в работу с оператором.')+`<div class="e2-observation"><strong>Оператор принимает участок</strong><p>Обе группы выпущены. Данные переданы, дальнейшее наблюдение продолжается.</p></div>${next('handoff','Наблюдать возвращение к работе')}`;
      return `<article class="e2-record"><h3>Черновик записи</h3><dl><div><dt>Наблюдение</dt><dd>Шесть бутылок прошли, зарегистрированы четыре.</dd></div><div><dt>Работа</dt><dd>Специалист обслужил окно. Положение и настройки не менялись.</dd></div><div><dt>Проверка</dt><dd>Два прохода по шесть, обе группы выпущены. В промежутке — ноль ложных событий.</dd></div></dl></article><h3>Уточни вывод для следующей смены</h3><div class="e2-options">${choice('record-correction','recognition','После обслуживания пропуски распознавания не повторились',s.recordCorrection==='recognition')}${choice('record-correction','transfer','После ремонта передачи сигнал снова доходит',s.recordCorrection==='transfer')}</div><h3>Если сбой повторится?</h3><div class="e2-options">${choice('understanding','continue','Сохранить наблюдения и сообщить наставнику',s.understanding==='continue')}${choice('understanding','resume','Продолжить работу: проверка уже была успешной',s.understanding==='resume')}</div>${next('save-record','Передать запись наставнику')}`;
    }
    function journal() {
      const statuses={position:'Осмотр не подтвердил смещение.',spacing:'Запись не поддерживает версию: между бутылками есть промежутки.',transfer:'Выход и вход совпадают; потеря передачи этой записью не подтверждается.',electronics:'Полностью исключить нельзя; при повторении нужна дальнейшая диагностика.',dirt:s.testReady?'После обслуживания пропуски не повторились в проверенных условиях.':'Ведущая версия, которую нужно проверить результатом обслуживания.'};
      return `<h2 id="e2-dialog-title">Журнал случая</h2><p>Наблюдения сохраняются автоматически с источником.</p><h3>Оператор</h3>${questions.filter(q=>has('asked',q[0])).map(q=>`<p class="e2-journal-item">${q[2]}</p>`).join('')||'<p>Пока нет наблюдений. Поговори с оператором.</p>'}${s.signalReady?'<h3>Запись события до остановки</h3><p>Шесть бутылок прошли, зарегистрированы четыре. Во втором и пятом проходах S1 не распознал бутылку. Выход и вход совпали.</p>':''}<h3>Диагностика</h3>${s.read.map(id=>sources.find(x=>x.id===id)).filter(Boolean).map(x=>`<p class="e2-journal-item"><strong>${x.kind}.</strong> ${x.short}</p>`).join('')||'<p>Сведения появятся после проверки.</p>'}<h3>Версии</h3>${Object.keys(s.links).map(id=>`<p><strong>${hypotheses.find(x=>x[0]===id)?.[1]}.</strong> ${statuses[id]}<br>Источник: «${sources.find(x=>x.id===s.links[id])?.title}».</p>`).join('')||'<p>Причина пока не установлена.</p>'}${s.test>=4?'<h3>Результат испытания</h3><p>Два прохода: 6 из 6. В промежутке 0 событий. Обе группы выпущены.</p>':''}`;
    }
    function dialogContent() {
      if (drawer==='journal') return journal();
      if (drawer==='route') return `<h2 id="e2-dialog-title">Маршрут расследования</h2><p>Можно вернуться к уже открытым наблюдениям.</p><div class="e2-options">${names.map((t,i)=>btn('step',`${i+1}. ${t}${i<s.unlocked?' '+icon('check'):''}`,i,'e2-answer',i>s.unlocked?'disabled':'')).join('')}</div>${s.finished?btn('restart','Повторить случай','','e2-secondary'):''}`;
      const text = {feed:['Подача','В учебной модели бутылки идут по одной. Если бутылки не доходят до датчика, сигналу неоткуда появиться.'],sensor:['Датчик S1','S1 — условное обозначение датчика. Он замечает отражённый от непрозрачной бутылки свет и сообщает о распознавании.'],controller:['Контроллер','Устройство выполняет программу: получает сообщения датчика и ведёт счёт. Панель показывает эти данные.'],group:['Механизм группирования','Получает команду выпустить группу после шести регистраций и выполнения условий готовности. Ожидание само по себе не доказывает поломку.']}[drawer];
      if (text) return `<h2 id="e2-dialog-title">${text[0]}</h2><p>${text[1]}</p>`;
      return `<h2 id="e2-dialog-title">Очажок подсказывает</h2><p>${['Сначала собери наблюдения оператора. Слова «сломался датчик» пока были бы предположением.','Посмотри нормальную цепочку. Где реальная бутылка впервые становится сообщением о ней?','Сравни три вещи в одном проходе: бутылка есть, датчик распознал, сигнал дошёл. Отмечай несовпадение бутылки и распознавания.','Схема объясняет принцип, история — прежние условия, осмотр — текущее состояние. Сопоставь хотя бы две версии.','Предложению нужны два основания: что увидели и почему это может влиять на работу.','Обслуживание — ещё не результат. Закончи все части намеченной проверки.','Запиши то, что действительно выполнили и проверили. При повторении сбоя нужны новые наблюдения.'][s.phase]}</p><p>Без таймера. Ошибку можно исправить.</p><p class="e2-next-note">Ситуация и параметры — учебная модель. Обслуживание и пуск выполняют сотрудники.</p>`;
    }
    function render(focus='keep') {
      if (disposed) return;
      const key = document.activeElement?.dataset?.key;
      const reduced = window.GameMotion?.enabled()===false;
      a.content.innerHTML = `<div class="e2-shell"><header class="e2-top"><a class="e2-back" href="#map" aria-label="На карту завода">${icon('back')}</a><img src="assets/ochakovo-logo.png" width="145" height="35" alt="Очаково. Натуральные напитки"><span class="e2-location">Инженерный участок</span><nav aria-label="Действия участка">${btn('route',icon('route')+'<span>Маршрут</span>','','e2-utility','aria-label="Маршрут"')}${btn('journal',icon('book')+'<span>Журнал</span>','','e2-utility','aria-label="Журнал"')}${btn('motion',icon(reduced?'play':'pause'),'','e2-utility',`aria-label="${reduced?'Включить':'Выключить'} анимации" aria-pressed="${!reduced}"`)}</nav></header><div class="e2-workshop"><header class="e2-heading"><div><h1 tabindex="-1">${s.accepted&&s.phase===6?'Линия снова в работе':titles[s.phase]}</h1><p>${s.accepted&&s.phase===6?'Ты проследил путь от наблюдения до подтверждённого результата.':s.phase<s.unlocked?'Архив наблюдений. Для продолжения открой текущий этап в маршруте.':intros[s.phase]}</p></div><span class="e2-position"><span>${names[s.phase]}</span><b>${s.phase+1} / 7</b></span></header><div class="e2-layout">${scene()}<section class="e2-task" aria-label="Текущее действие">${[operator,mapStage,signals,evidenceStage,workStage,testStage,finalStage][s.phase]()}${note?`<div class="e2-response ${error?'is-error':'is-success'}"><strong>${error?'Проверим ещё раз':'Инженер-наставник'}</strong><p>${esc(note)}</p></div>`:''}</section></div><footer class="e2-foot"><span>Учебная модель · оборудование и параметры условные</span><span>${storageOK?'Прогресс сохраняется на устройстве':'Сохранение недоступно — не закрывай вкладку'}</span><a href="#discoveries">Паспорт открытий ${icon('arrow')}</a></footer></div>${drawer?`<dialog class="e2-dialog" aria-labelledby="e2-dialog-title">${btn('close',icon('close'),'','e2-close','aria-label="Закрыть"')}${dialogContent()}</dialog>`:''}</div>`;
      if (drawer) {
        const el = a.content.querySelector('dialog'); el.showModal(); el.addEventListener('cancel',e=>{e.preventDefault();closeDrawer();});
        el.addEventListener('click',e=>{if(e.target===el){const r=el.getBoundingClientRect();if(e.clientX<r.left||e.clientX>r.right||e.clientY<r.top||e.clientY>r.bottom)closeDrawer();}});
        el.querySelector('button')?.focus({preventScroll:true});
      } else if (focus==='title') { a.content.querySelector('h1')?.focus({preventScroll:true}); window.scrollTo({top:0,behavior:'instant'}); }
      else if (key) [...a.content.querySelectorAll('[data-key]')].find(n=>n.dataset.key===key)?.focus({preventScroll:true});
      // Keep the existing route's engineering caption truthful without touching other episodes.
      document.querySelectorAll('.station[href="#mission/engineering"] .station-caption').forEach(n=>n.textContent='Разберись, почему линия ждёт');
    }
    function openDrawer(id,target) { stop(); lastFocus=target?.dataset.key; drawer=id; render(); }
    function closeDrawer() { drawer=''; render(); if(lastFocus)[...a.content.querySelectorAll('[data-key]')].find(n=>n.dataset.key===lastFocus)?.focus({preventScroll:true}); }
    function playback(normal=false) {
      if (playing) { stop(); render(); return; }
      playing=true;
      if(normal){ const out=M.dispatch(s,{type:'demo'});s=out.state;save();normalFrame=0; }
      else { if(s.handed)historicalFrame=0;else{const out=M.dispatch(s,{type:'frame',value:0});s=out.state;save();} }
      render();
      let n=0;
      const tick=()=>{if(disposed||!playing)return;n++;if(n>5){stop();render();return;}if(normal)normalFrame=n;else{if(s.handed)historicalFrame=n;else{s=M.dispatch(s,{type:'frame',value:n}).state;save();}}render();timer=setTimeout(tick,900);};
      if(window.GameMotion?.enabled()!==false)timer=setTimeout(tick,900);else{playing=false;if(normal)normalFrame=5;render();}
    }
    function act(type,value,target) {
      if (!type.startsWith('e2-')) return;
      type=type.slice(3);
      if (['route','journal','help'].includes(type)) return openDrawer(type,target);
      if(type==='object')return openDrawer(value,target);
      if(type==='close')return closeDrawer();
      if(type==='motion'){window.GameMotion?.toggle?.();stop();render();return;}
      if(type==='play')return playback();
      if(type==='demo')return playback(true);
      if(type==='source'){source=value;note='';render();return;}
      if(type==='camera'){camera=value;render();return;}
      if(type==='prev'||type==='next-frame'){stop();const n=(frameIndex()+(type==='prev'?5:1))%6;if(s.handed){historicalFrame=n;render();return;}return apply('frame',n);}
      if(type==='restart'){s=M.fresh();drawer='';note='';save();render('title');return;}
      if(type==='ask'){question=value;if(s.phase<s.unlocked){note='';render();return;}}
      if(type==='step')drawer='';
      if(type==='frame'||type==='mark')stop();
      if(type==='frame'&&s.handed){historicalFrame=Number(value);render();return;}
      apply(type,value);
    }
    const visibility=()=>{if(document.hidden&&playing){stop();render();}};
    const motion=e=>{if(!e.detail.enabled&&playing){stop();render();}};
    document.addEventListener('visibilitychange',visibility);document.addEventListener('ochakovo:motion',motion);
    render();
    return {act,start:()=>{},managesFocus:true,done:()=>{if(!s.accepted)return false;s=M.dispatch(s,{type:'finish'}).state;save();return true;},result:()=>({learned:window.OchakovoShift.roles.engineering.learned}),cleanup:()=>{disposed=true;stop();document.removeEventListener('visibilitychange',visibility);document.removeEventListener('ochakovo:motion',motion);}};
  });
})();
