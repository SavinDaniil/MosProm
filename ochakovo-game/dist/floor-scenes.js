/* Illustrated work scenes. Shared shell, separate rules, local event history. */
(() => {
  'use strict';
  const M=window.OchakovoFloorModel;
  const steps={line:['Сверь маркировку','Проследи путь','Проверь бутылки','Заметь повтор','Раздели решения','Собери упаковку'],warehouse:['Прими задание','Размести коробки','Собери заказ']};
  const zones=[{id:'A',title:'A · ПЭТ',text:'CoolCola · 1 л',x:38},{id:'B',title:'B · Банка',text:'CoolCola · 0,33 л',x:59},{id:'C',title:'C · Напитки',text:'Fancy / квас',x:80},{id:'Q',title:'Контроль',text:'Отдельная зона',x:93}];
  const nodes=[{id:'fill',label:'Наполнение',x:32},{id:'cap',label:'Укупорка',x:48},{id:'label',label:'Маркировка',x:64},{id:'pack',label:'Упаковка',x:79}];
  const icon=(name)=>`<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${({arrow:'<path d="M4 12h16m-6-6 6 6-6 6"/>',scan:'<path d="M8 3H3v5m13-5h5v5M3 16v5h5m8 0h5v-5M7 7v10m3-10v10m4-10v10m3-10v10M2 12h20"/>',check:'<path d="m5 12 4 4L19 6"/>',zoom:'<circle cx="10" cy="10" r="6"/><path d="m15 15 6 6M7 10h6m-3-3v6"/>',file:'<path d="M6 3h9l4 4v14H6zM10 10h5m-5 4h5m-5 3h3"/>',pause:'<path d="M8 5v14M16 5v14"/>',help:'<circle cx="12" cy="12" r="9"/><path d="M9 9a3 3 0 1 1 4 3c-1 .5-1 1-1 2m0 3h.01"/>',back:'<path d="M20 12H4m6-6-6 6 6 6"/>'})[name]||''}</svg>`;
  const bottle=(id,defect='',batch='У-17')=>`<svg class="floor-bottle-art" viewBox="0 0 100 240" aria-hidden="true"><defs><linearGradient id="glass-${id}" x1="0" x2="1"><stop stop-color="#a4a69b"/><stop offset=".2" stop-color="#e9e7c9"/><stop offset=".65" stop-color="#c9d1c4"/><stop offset="1" stop-color="#697e75"/></linearGradient></defs><ellipse cx="50" cy="231" rx="37" ry="7" fill="#263c38" opacity=".2"/><path d="M37 28v30c0 14-18 20-18 39v119q0 13 15 13h32q15 0 15-13V97c0-19-18-25-18-39V28Z" fill="url(#glass-${id})" stroke="#3d514d" stroke-width="2"/><path d="M24 ${defect==='level'?119:91}h52v123q0 10-13 10H37q-13 0-13-10Z" fill="#673d2a"/><path d="M28 99v108" stroke="#ffe8bd" stroke-opacity=".55" stroke-width="4" stroke-linecap="round"/><g transform="rotate(${defect==='cap'?-16:0} 50 27)"><rect x="33" y="11" width="34" height="24" rx="5" fill="#c83437" stroke="#613b37" stroke-width="2"/><path d="M38 15v15m6-15v15m6-15v15m6-15v15m6-15v15" stroke="#e86f5b"/></g><path d="M20 140q30 8 60 0v52q-30 8-60 0Z" fill="#f9ead0" stroke="#6a4735" stroke-width="1.5"/><path d="M21 149q29 6 58 0v25q-29 6-58 0Z" fill="#b63b3c"/><text x="50" y="167" text-anchor="middle" fill="#fff1d4" font-size="12" font-weight="800">CoolCola</text><text x="50" y="187" text-anchor="middle" fill="#3d3832" font-size="10" font-weight="700">1 л · ${defect==='code'?'У-16':batch}</text><path d="M24 207q26 7 52 0m-52 9q26 7 52 0" fill="none" stroke="#c9b68b" stroke-opacity=".5"/></svg>`;
  const carton=(c)=>`<svg class="floor-carton-art" viewBox="0 0 160 140" aria-hidden="true"><ellipse cx="82" cy="130" rx="69" ry="8" fill="#354139" opacity=".2"/><path d="m12 38 95-22 42 25-96 25Z" fill="#dfba7e" stroke="#75573d" stroke-width="2"/><path d="m12 38 41 28v64l-41-29Z" fill="#ba8f59" stroke="#75573d" stroke-width="2"/><path d="m53 66 96-25v65l-96 24Z" fill="#d4aa70" stroke="#75573d" stroke-width="2"/><path d="m53 28 43 27v63l15-4V51L68 24Z" fill="#efd4a2" opacity=".7"/><path d="m62 78 76-19v37l-76 19Z" fill="#fff2d5" stroke="#9c7a50"/><path d="m62 78 76-19v13l-76 19Z" fill="${c.color}"/><text x="99" y="81" text-anchor="middle" fill="#fff7df" font-size="10" font-weight="800" transform="rotate(-14 99 81)">${c.brand}</text><text x="99" y="99" text-anchor="middle" fill="#3e4339" font-size="9" font-weight="800" transform="rotate(-14 99 99)">${c.id}</text>${c.damage?'<path d="m22 64 11 10-6 8 14 11-8 9" stroke="#5c3d2b" stroke-width="4" fill="none"/><path d="m22 64 7 17 11 12" fill="none" stroke="#f6d79d" stroke-width="2"/>':''}</svg>`;
  ['line','warehouse'].forEach(kind=>window.OchakovoShift.register(kind,a=>{
    const key='ochakovo-illustrated-'+kind+'-v1';
    let storeOK=true,history=[];
    try{const saved=JSON.parse(localStorage.getItem(key)||'null');if(saved?.version===1)history=saved.events;}catch{storeOK=false;}
    let game=M.create(kind,history),s=game.state,selected='',panel='',message='',tone='',showHint=false,resetOpen=false,paused=window.GameMotion?.enabled()===false,paperOpen=false,journalOpen=false,whyOpen=false;
    let previousDialogue=null;
    const e=a.esc,b=(action,label,value='',cls='',attrs='')=>a.button('floor-'+action,label,value,'floor-button '+cls,attrs);
    const isLine=kind==='line';
    function persist(){try{localStorage.setItem(key,JSON.stringify({version:1,events:game.history()}));}catch{storeOK=false;}}
    const sceneTitles={line:['У каждой бутылки — своя партия','От наполнения до упаковки','Качество складывается из деталей','Повтор — повод разобраться','Оборудование и продукт: два решения','На склад отправляется проверенное'],warehouse:['Путь коробки начинается с приёмки','У каждой коробки — своё место','Три коробки — один точный заказ']};
    const defaults=()=>isLine?[
      'Начнём с задания на выпуск. Название, формат и номер партии помогают понять, что сейчас идёт по линии. Найди нужную бутылку и сверь три детали.',
      'У бутылки свой маршрут: каждый узел выполняет одну работу. Давай проследим, как напиток становится готовой упаковкой.',
      'Даже у похожих бутылок могут отличаться детали. Посмотри на крышку, уровень напитка и код партии — и реши, куда отправить каждую.',
      'Заметил? Крышка снова стоит неровно. Запишем, что и где повторилось, чтобы наставник мог разобраться вместе с инженером.',
      'Инженер проверил узел, теперь посмотрим на новый образец. А бутылки, которые мы отделили раньше, всё ещё ждут решения о качестве.',
      'Осталось передать результат следующей команде. Собери три допущенные бутылки: на складе должны получить проверенную упаковку.'
    ][s.phase]:[
      'Привет на складе! Маркировка связывает коробку с её документами. Сверим напиток, формат и партию — так у каждой коробки будет понятная история.',
      'Сканер подскажет, что внутри, а внимательный осмотр — цела ли упаковка. Проверь оба признака и найди для каждой коробки своё место.',
      'Теперь соберём заказ F-78. Одинаковый бренд ещё не означает одинаковый товар: сверяй формат и количество с листом заказа.'
    ][s.phase];
    const nextAction=()=>{
      if(s.done)return 'Запиши открытие в паспорт и продолжай знакомство с заводом.';
      if(panel==='carton'&&s.phase===0)return s.fields.length===3?'Все строки совпали. Подтверди приёмку коробки.':'Сравни две колонки и нажми на каждую совпадающую строку.';
      if(panel==='sample')return s.fields.length===3?'Все три поля проверены. Подтверди совпадение с документом.':'Нажимай на отмеченные поля маркировки и сравнивай с заданием.';
      if(panel==='bottle')return (s.inspected[selected]||[]).length===3?'Осмотр завершён. Выбери: продолжить путь или направить бутылку на контроль.':'Проверь три отмеченные детали, затем выбери маршрут бутылки.';
      if(panel==='carton'){
        const carton=M.cartons.find(c=>c.id===selected);
        if(carton?.damage&&s.inspected.includes(selected)&&!s.reported)return 'Выбери сообщение о наблюдаемом повреждении.';
        if(s.scanned.includes(selected)&&s.inspected.includes(selected))return carton?.damage?'Направь повреждённую коробку в отдельную зону контроля.':'Обе проверки выполнены. Выбери адрес хранения.';
        return 'Сканируй код и осмотри упаковку: нужны обе проверки.';
      }
      return (isLine?['Нажми на бутылку, чтобы рассмотреть её маркировку.','Нажимай на названия узлов в порядке движения бутылки.','Выбери бутылку на конвейере, чтобы начать осмотр.','Сначала запиши наблюдение, затем сообщи наставнику.','Нажми на проверочный образец, затем выбери решение.','Нажми на допущенные бутылки, чтобы добавить их в упаковку.']:['Нажми на маркировку коробки, чтобы начать сверку.','Выбери коробку на столе приёмки.','Добавь коробки в заказ и нажми «Сверить заказ».'])[s.phase];
    };
    const why=()=> (isLine?[
      'Маркировка позволяет связать продукцию с конкретным заданием и партией. Если данные расходятся, сначала уточняют причину, а затем продолжают работу.',
      'Знание маршрута помогает оператору понять, после какой операции появилось отклонение, и точнее передать наблюдение команде.',
      'Визуальный осмотр помогает заметить отклонение до упаковки. Он дополняет измерения и проверки качества на производстве.',
      'Повторяющийся признак важен для поиска неисправности. Полезное сообщение содержит наблюдение и место, а не догадку о причине.',
      'Исправное оборудование и качество ранее выпущенной продукции проверяют отдельно. Успешный пуск не отменяет контроль отделённых бутылок.',
      'Передача между участками включает и продукцию, и сведения о ней. Так следующая команда понимает, что допущено, а что остаётся на контроле.'
    ]:[
      'При приёмке сверяют фактический товар с документами. Это помогает избежать ошибок в учёте и сохранить связь с производственной партией.',
      'Адрес хранения помогает быстро найти нужный товар. Сканирование и осмотр решают разные задачи: верный код не гарантирует целую упаковку.',
      'Заказ определяется сочетанием товара, формата и количества. После любого изменения состава его сверяют заново, чтобы передать точный заказ.'
    ])[s.phase];
    const hint=()=>isLine?[
      'В задании CoolCola, ПЭТ 1 л, партия У-17. Открой бутылку с этим кодом и нажми на три поля маркировки.',
      'Маршрут: наполнение → укупорка → маркировка → упаковка. Нажми на таблички узлов по порядку.',
      'B-01 без видимых отклонений. У B-02 перекос крышки, у B-03 код У-16, у B-04 низкий уровень. Осмотри три участка каждой бутылки.',
      'Сначала нажми «Записать в журнал», затем «Сообщить наставнику». Причина неисправности пока не установлена.',
      'Нажми на проверочный образец. Затем выбери: линия работает после проверки; отделённая продукция остаётся на контроле.',
      'В упаковку идут B-01, B-05 и B-06. B-02 остаётся на контроле.'
    ][s.phase]:[
      'Открой CC-01. В листе сверки сравни напиток, формат и партию в двух колонках. Отметь три совпадающие строки и подтверди приёмку.',
      'CoolCola ПЭТ → A; CoolCola банка → B; Fancy и квас → C. FA-02 с надрывом: осмотр → сообщение о надрыве → контроль. Затем проверь и размести FA-03.',
      'Выбери CC-01, FA-01 и FA-03. CC-02 — другой формат, KV-01 не входит в заказ. После любого изменения выполни сверку.'
    ][s.phase];
    function clipboard(){
      if(isLine)return `<aside class="floor-clipboard" aria-label="Задание на выпуск"><span class="floor-pin"></span><span class="floor-document-origin">ОТ МАСТЕРА СМЕНЫ</span><h3>Задание на выпуск</h3><dl><div><dt>Напиток</dt><dd>CoolCola</dd></div><div><dt>Формат</dt><dd>ПЭТ · 1 л</dd></div><div><dt>Партия</dt><dd>У-17</dd></div></dl><span class="floor-paper-note">Учебная партия</span></aside>`;
      return `<aside class="floor-clipboard" aria-label="${s.phase===2?'Заказ F-78':'Приходная накладная'}"><span class="floor-pin"></span><span class="floor-document-origin">${s.phase===2?'НА КОМПЛЕКТАЦИЮ':'С ЛИНИИ РОЗЛИВА'}</span><h3>${s.phase===2?'Заказ F-78':'Приход № 17'}</h3>${s.phase===2?`<p>CoolCola · ПЭТ 1 л <b>× 1</b></p><p>Fancy · ПЭТ 0,5 л <b>× 2</b></p><hr><p><b>3 коробки · 30 шт.</b></p>`:`<dl><div><dt>CC-01</dt><dd>CoolCola</dd></div><div><dt>Формат</dt><dd>ПЭТ · 1 л</dd></div><div><dt>Партия</dt><dd>У-17</dd></div></dl>`}<span class="floor-paper-note">${s.phase===2?'Проверь каждую строку':'Приёмка со стороны производства'}</span></aside>`;
    }
    function labelFields(c){return `<div class="floor-label-fields">${[['brand','Напиток',c.brand],['format','Формат',c.format],['batch','Партия',c.batch]].map(([id,label,value])=>b('field',`<small>${label}</small><strong>${e(value)}</strong><span>${s.fields.includes(id)?'✓':'Сверить'}</span>`,id,s.fields.includes(id)?'is-checked':'')).join('')}</div>`;}
    function labelStudy(c,art,action,value=''){
      return `<section class="floor-study" aria-label="${isLine?'Маркировка бутылки':'Маркировка коробки'}"><div class="floor-study-toolbar"><span>МАРКИРОВКА · ${e(isLine?c.batch:c.id)}</span>${b('close',icon('back')+'К предметам','','is-text','aria-label="Закрыть маркировку"')}</div><div class="floor-study-stage ${isLine?'':'is-carton'}"><div class="floor-study-object">${art}</div>${[['brand','Напиток',c.brand],['format','Формат',c.format],['batch','Партия',c.batch]].map(([id,label,text],i)=>b('field',`<span class="floor-callout-index">${s.fields.includes(id)?'✓':String(i+1).padStart(2,'0')}</span><span><small>${label}</small><strong>${e(text)}</strong></span>`,id,`floor-callout callout-${id} ${s.fields.includes(id)?'is-checked':''}`,`aria-pressed="${s.fields.includes(id)}"`)).join('')}</div><div class="floor-study-bottom"><span>${s.fields.length} из 3 полей сверено</span>${b(action,'Подтвердить совпадение '+icon('check'),value,'is-primary',s.fields.length<3?'disabled':'')}</div></section>`;
    }
    function samplePanel(){const batch=selected||'У-17';return labelStudy({brand:'CoolCola',format:'ПЭТ · 1 л',batch},bottle('sample-inspector','',batch),'sample',batch);}
    function bottlePanel(){
      const item=M.bottles.find(x=>x.id===selected);if(!item)return '';
      const seen=s.inspected[item.id]||[];
      return `<section class="floor-study floor-bottle-study" aria-label="Осмотр ${item.id}"><div class="floor-study-toolbar"><span>ВИЗУАЛЬНЫЙ КОНТРОЛЬ · ${item.id}</span>${b('close',icon('back')+'К бутылкам','','is-text','aria-label="Закрыть осмотр"')}</div><div class="floor-study-stage"><div class="floor-study-object">${bottle('lens-'+item.id,item.defect)}<span class="floor-level-guide"></span></div>${[['cap','Крышка','Ровность укупорки'],['level','Уровень','Сравни с образцом'],['code','Код партии','В задании — У-17']].map(([id,label,desc],i)=>b('lens',`<span class="floor-callout-index">${seen.includes(id)?'✓':String(i+1).padStart(2,'0')}</span><span><strong>${label}</strong><small>${seen.includes(id)&&item.defect===id?({cap:'Крышка наклонена',level:'Ниже образца',code:'У-16 ≠ У-17'})[id]:desc}</small></span>`,item.id+':'+id,`floor-callout callout-${id} ${seen.includes(id)?'is-checked':''} ${seen.includes(id)&&item.defect===id?'is-anomaly':''}`,`aria-pressed="${seen.includes(id)}"`)).join('')}</div><div class="floor-decision-row">${b('decide','Продолжить путь '+icon('arrow'),item.id+':pass','is-primary',seen.length<3?'disabled':'')}${b('decide','На контроль',item.id+':review','',seen.length<3?'disabled':'')}</div></section>`;
    }
    function receiptPanel(c){
      const expected=M.cartons[0];
      return `<section class="floor-receipt-desk" aria-label="Сверка коробки с накладной">
        <div class="floor-receipt-toolbar"><span>СТОЛ ПРИЁМКИ · CC-01</span>${b('close',icon('back')+'К коробке','','is-text','aria-label="Закрыть сверку"')}</div>
        <div class="floor-receipt-grid">
          <figure class="floor-receipt-product">${carton(c)}<figcaption><span class="floor-receipt-product-code">${e(c.id)}</span><span>${e(c.brand)} · ${c.units} бутылок</span></figcaption><span class="floor-receipt-arrival">С линии розлива → на склад</span></figure>
          <section class="floor-receipt-ledger" aria-label="Лист сверки">
            <header><span class="floor-document-origin">ПРИХОД № 17</span><h3>Всё ли совпадает?</h3><p>Сверь маркировку с накладной и отметь каждую строку.</p></header>
            <div class="floor-receipt-columns" aria-hidden="true"><span>На коробке</span><span>В накладной</span><span></span></div>
            <div class="floor-receipt-rows">${[['brand','Напиток'],['format','Формат'],['batch','Партия']].map(([id,label])=>b('field',`<span class="floor-receipt-actual"><small>${label}</small><strong>${e(c[id])}</strong></span><span class="floor-receipt-expected">${e(expected[id])}</span><span class="floor-receipt-check" aria-hidden="true">${s.fields.includes(id)?icon('check'):''}</span>`,id,`floor-receipt-row ${s.fields.includes(id)?'is-matched':''}`,`aria-pressed="${s.fields.includes(id)}" aria-label="${label}: на коробке ${e(c[id])}, в накладной ${e(expected[id])}. ${s.fields.includes(id)?'Сверено':'Отметить совпадение'}"`)).join('')}</div>
            <div class="floor-receipt-progress"><span>${s.fields.length===3?'Все данные совпадают':`Сверено ${s.fields.length} из 3`}</span><div aria-hidden="true">${[0,1,2].map(i=>`<i class="${i<s.fields.length?'is-complete':''}"></i>`).join('')}</div></div>
            ${b('receipt','Подтвердить приёмку '+icon('arrow'),'','is-primary floor-receipt-confirm',s.fields.length<3?'disabled':'')}
          </section>
        </div>
      </section>`;
    }
    function cartonPanel(){
      const c=M.cartons.find(x=>x.id===selected);if(!c)return '';
      if(s.phase===0)return receiptPanel(c);
      return `<section class="floor-inspector floor-carton-panel" aria-label="Проверка коробки ${c.id}"><header><div><small>Приёмка · ${c.id}</small><h3>${e(c.brand)} <span>${e(c.format)}</span></h3></div>${b('close','×','','floor-close','aria-label="Закрыть коробку"')}</header><div class="floor-carton-detail"><div>${carton(c)}${s.inspected.includes(c.id)?`<strong class="floor-condition ${c.damage?'is-damaged':''}">${c.damage?'Надрыв стенки':'Упаковка целая'}</strong>`:''}</div><div><p class="floor-sku">${e(c.sku)}</p><p>${e(c.batch)} · ${c.units} шт.</p><div class="floor-barcode" aria-hidden="true"></div>${b('scan',icon(s.scanned.includes(c.id)?'check':'scan')+(s.scanned.includes(c.id)?'Код считан':'Сканировать код'),c.id,s.scanned.includes(c.id)?'is-checked':'')}${b('inspect',icon(s.inspected.includes(c.id)?'check':'zoom')+'Осмотреть упаковку',c.id,s.inspected.includes(c.id)?'is-checked':'')}</div></div>${c.damage&&s.inspected.includes(c.id)&&!s.reported?`<fieldset class="floor-report"><legend>Что сообщим кладовщику?</legend>${b('report','Код не совпадает','code')}${b('report','Надрыв боковой стенки','tear')}${b('report','Не хватает бутылок внутри','count')}</fieldset>`:`<div class="floor-destinations"><small>Выбери место размещения</small><div>${zones.map(z=>b('place',z.title,c.id+':'+z.id,'floor-zone-choice')).join('')}</div></div>`}</section>`;
    }
    function lineRoom(){
      if(panel==='sample')return samplePanel();
      if(panel==='bottle')return bottlePanel();
      if(s.phase===0)return `<div class="floor-products floor-samples">${['У-16','У-17','У-18'].map((batch,i)=>`<button type="button" class="floor-object floor-bottle" data-do="floor-open-sample" data-value="${batch}" aria-label="Открыть маркировку бутылки ${batch}">${bottle('sample-'+i,'',batch)}<span class="floor-object-tag">${icon('zoom')}${batch}</span></button>`).join('')}</div>`;
      if(s.phase===1)return `<div class="floor-route-hotspots">${nodes.map((n,i)=>`<button type="button" class="floor-node ${s.route.includes(n.id)?'is-done':''}" style="--x:${n.x}%" data-do="floor-station" data-value="${n.id}"><span>${s.route.includes(n.id)?'✓':i+1}</span><strong>${n.label}</strong></button>`).join('')}</div><div class="floor-route-strip">${s.route.length?nodes.filter(n=>s.route.includes(n.id)).map(n=>`<span>✓ ${n.label}</span>`).join('<i>→</i>'):'Найди первый узел на линии'}</div>`;
      if(s.phase===2)return `<div class="floor-products floor-inspection-belt">${M.bottles.map(item=>`<button type="button" class="floor-object floor-bottle ${s.decisions[item.id]?'is-resolved':''}" data-do="floor-open-bottle" data-value="${item.id}" aria-label="Осмотреть бутылку ${item.id}${s.decisions[item.id]?', решение записано':''}">${bottle(item.id,item.defect)}<span class="floor-object-tag">${s.decisions[item.id]?'✓':icon('zoom')}${item.id}</span><small>${s.decisions[item.id]==='review'?'На контроле':s.decisions[item.id]==='pass'?'Дальше':''}</small></button>`).join('')}</div><span class="floor-scene-count">Проверено ${Object.keys(s.decisions).length} / 4</span>`;
      if(s.phase===3)return `<div class="floor-incident"><span class="floor-incident-label">Повтор на выходе укупорки</span><div class="floor-repeat-bottles">${bottle('repeat-1','cap')}${bottle('repeat-2','cap')}</div><div class="floor-incident-controls">${b('log',icon(s.logged?'check':'file')+(s.logged?'Факт записан':'Записать в журнал'),'','is-paper')}${b('response','Сообщить наставнику','mentor','is-primary')}${b('response','Самостоятельно поправить узел','repair','is-text')}${b('response','Продолжить выпуск','continue','is-text')}</div></div>`;
      if(s.phase===4)return `<section class="floor-team-card"><span class="floor-eyebrow">Сообщение наставника</span><h3>Узел проверен инженером</h3><p>Проверочный запуск выполнен специалистом. Осмотри образец, затем реши, что передать команде.</p><div class="floor-trial">${b('trial',bottle('trial')+'<span>'+icon(s.trial?'check':'zoom')+'Проверочный образец</span>','','floor-trial-bottle')}<div>${b('release','Линия работает после проверки.<br>Отделённая продукция — на контроле.','separate','is-primary')}${b('release','Разрешить всю продукцию партии','all','is-text')}</div></div></section>`;
      return `<div class="floor-products floor-packing-belt">${['B-01','B-02','B-05','B-06'].map(id=>`<button type="button" class="floor-object floor-bottle ${s.packed.includes(id)?'is-resolved':''}" data-do="floor-pack" data-value="${id}" aria-label="Добавить ${id} в упаковку">${bottle('pack-'+id,id==='B-02'?'cap':'')}<span class="floor-object-tag">${s.packed.includes(id)?'✓':id==='B-02'?'Контроль':'+ В упаковку'}</span><small>${id}</small></button>`).join('')}</div><div class="floor-pack-tray"><strong>Упаковка · ${s.packed.length} / 3</strong><span>${s.packed.map(id=>e(id)).join(' · ')||'Выбери допущенные бутылки'}</span>${b('handoff','Передать складу '+icon('arrow'),'','is-primary',s.packed.length!==3?'disabled':'')}</div>`;
    }
    function lineWorkspace(){
      return `<div class="floor-line-layout ${s.phase===5?'is-packing':''}"><div class="floor-line-main ${panel?'is-inspecting':''}">${lineRoom()}</div>${s.phase<5?`<aside class="floor-line-side">${clipboard()}</aside>`:''}</div>`;
    }
    function warehouseRoom(){
      const shelves=`<div class="floor-shelf-zones" aria-label="Секции хранения">${zones.map(z=>`<div class="floor-shelf-label ${z.id==='Q'?'is-review':''}" data-drop="${z.id}"><strong>${z.title}</strong><span>${z.text}</span><span class="floor-zone-stock">${Object.values(s.placed).filter(v=>v===z.id).length?Object.values(s.placed).filter(v=>v===z.id).length+' кор. размещено':''}</span>${s.phase===1&&selected?b('place','Разместить здесь',selected+':'+z.id,'floor-place-hotspot'):''}</div>`).join('')}</div>`;
      let workspace='';
      if(s.phase===0){
        if(panel==='carton')return `<div class="floor-line-layout floor-receipt-study"><div class="floor-line-main is-inspecting">${cartonPanel()}</div><aside class="floor-line-side">${clipboard()}</aside></div>`;
        workspace=`<div class="floor-receipt-box"><button type="button" class="floor-object" data-do="floor-open-carton" data-value="CC-01" aria-label="Прочитать маркировку коробки CC-01">${carton(M.cartons[0])}<span class="floor-object-tag">${icon('zoom')}Маркировка CC-01</span></button></div>`;
      }else if(s.phase===1){
        const available=M.cartons.filter(c=>!s.placed[c.id]&&(!c.reserve||s.reported));
        workspace=`${shelves}<div class="floor-products floor-receiving-bench">${available.map(c=>`<button type="button" class="floor-object floor-carton ${selected===c.id?'is-selected':''}" data-do="floor-open-carton" data-value="${c.id}" data-drag="${c.id}" draggable="true" aria-label="Проверить коробку ${c.id}, ${c.brand}, ${c.format}">${carton(c)}<span class="floor-object-tag">${icon('zoom')}${c.id}${c.reserve?' · замена':''}</span></button>`).join('')}</div><span class="floor-scene-count">Размещено ${Object.keys(s.placed).length} / 6</span>`;
      }else{
        workspace=`${shelves}<div class="floor-mobile-order">F-78: <b>CoolCola ПЭТ 1 л × 1 · Fancy ПЭТ 0,5 л × 2</b></div><div class="floor-products floor-pick-bench">${M.cartons.filter(c=>s.placed[c.id]!=='Q').map(c=>`<button type="button" class="floor-object floor-carton ${s.picked.includes(c.id)?'is-picked':''}" data-do="floor-pick" data-value="${c.id}" aria-pressed="${s.picked.includes(c.id)}" aria-label="${s.picked.includes(c.id)?'Вернуть':'Взять'} ${c.id}, ${c.brand}, ${c.format}">${carton(c)}<span class="floor-object-tag">${s.picked.includes(c.id)?'✓ В заказе':'+ В заказ'}</span><small>${c.brand} · ${c.format}<br>${c.id} · ${c.units} шт.</small></button>`).join('')}</div><div class="floor-order-tray"><div><strong>Палета F-78 · ${s.picked.length} коробки</strong><span>${s.picked.join(' · ')||'Выбери коробки на столе'}</span></div>${b('verify',icon(s.verified?'check':'scan')+(s.verified?'Состав совпал':'Сверить заказ'),'','is-paper')}${b('handoff','В зону отгрузки '+icon('arrow'),'','is-primary',!s.verified?'disabled':'')}</div>`;
      }
      return `<div class="floor-warehouse-layout ${panel==='carton'?'has-inspector':''}"><div class="floor-warehouse-main">${workspace}</div><aside class="floor-warehouse-side" aria-label="${panel==='carton'?'Проверка маркировки и упаковки':'Документ смены'}">${panel==='carton'?cartonPanel():clipboard()}</aside></div>`;
    }
    function finishRoom(){return `<section class="floor-finished"><span class="floor-finish-seal">✓</span><span class="floor-eyebrow">Смена завершена</span><h3>${isLine?'От линии — к складу':'Точный заказ готов'}</h3><p>${e(game.summary())}</p>${a.button('finish','Записать открытие '+icon('arrow'),'','floor-button is-primary')}</section>`;}
    function journal(){
      const rows=isLine?[
        s.phase>0&&'Маркировка сверена: CoolCola · ПЭТ 1 л · У-17.',
        s.route.length>0&&`Маршрут: ${s.route.map(id=>nodes.find(n=>n.id===id).label).join(' → ')}.`,
        ...Object.entries(s.decisions).map(([id,result])=>`${id}: ${result==='pass'?'продолжает путь':'направлена на контроль'}.`),
        s.logged&&'На выходе укупорки повторился перекос крышки.',
        s.notified&&'Наблюдение передано наставнику. Инженер проверил узел.',
        s.trial&&'Проверочный образец осмотрен: крышка ровная.',
        s.packed.length>0&&`В упаковке: ${s.packed.join(', ')}.`,
        s.done&&'Упаковка передана складу.'
      ]:[
        s.phase>0&&'Приход CC-01 сверен с накладной.',
        ...s.scanned.map(id=>`${id}: код считан${s.inspected.includes(id)?', упаковка осмотрена':''}${s.placed[id]?`, адрес — ${s.placed[id]}`:''}.`),
        s.reported&&'Сообщено о надрыве FA-02. Доступна замена FA-03.',
        s.picked.length>0&&`В заказе F-78: ${s.picked.join(', ')}.`,
        s.verified&&'Состав заказа сверен: 3 коробки, 30 единиц.',
        s.done&&'Заказ передан в зону отгрузки.'
      ];
      return rows.filter(Boolean);
    }
    function render(focusAction='',focusValue=''){
      const oldFocus=document.activeElement,oldAction=oldFocus?.dataset?.do,oldValue=oldFocus?.dataset?.value;
      const title=isLine?'Линия розлива':'Склад',count=steps[kind].length,entries=journal();
      const dialogueText=message||(s.done?'Ты справился! Проверенная продукция и точные записи помогут следующей команде продолжить работу.':defaults());
      const dialogueKey=dialogueText+'\n'+(showHint?hint():'');
      const dialogueUpdated=previousDialogue!==null&&previousDialogue!==dialogueKey;
      previousDialogue=dialogueKey;
      persist();
      a.root.dataset.floorKind=kind;a.root.dataset.floorPhase=String(s.phase);
      a.draw(`<div class="floor-game floor-game--${kind} ${paperOpen?'is-paper-open':''}">
        <header class="floor-top"><a class="floor-back" href="#map" aria-label="Карта завода">${icon('back')}</a><a class="floor-brand" href="#map" aria-label="Очаково — карта завода"><img src="assets/ochakovo-logo.png" alt="Очаково. Натуральные напитки" width="166" height="40"></a><div class="floor-heading"><h1>${title}</h1><span>${s.done?'Смена завершена':steps[kind][s.phase]}</span></div><nav class="floor-tools" aria-label="Инструменты смены">${b('paper',icon('file')+'<span>Задание</span>','','is-text floor-paper-toggle',`aria-label="${paperOpen?'Скрыть задание':'Открыть задание'}" aria-expanded="${paperOpen}"`)}${b('journal',icon('file')+'<span>Журнал</span><b class="floor-journal-count">'+entries.length+'</b>','','is-text',`aria-label="Журнал смены" aria-expanded="${journalOpen}"`)}${b('hint',icon('help')+'<span>Подсказка</span>','','is-text',`aria-label="Подсказка" aria-expanded="${showHint}"`)}${b('pause',paused?'▷':icon('pause'),'','is-text floor-pause',`aria-label="${paused?'Продолжить анимации':'Приостановить анимации'}" aria-pressed="${paused}"`)}</nav></header>
        <div class="floor-room"><img class="floor-background" draggable="false" src="assets/${isLine?'bottling-floor-clean-v2':'warehouse-floor-clean-v2'}.webp" alt="${isLine?'Иллюстрированный цех розлива с конвейером':'Иллюстрированный склад со стеллажами и столом приёмки'}" width="1536" height="864"><div class="floor-scene-heading"><h2>${s.done?'Можно передавать следующей команде':sceneTitles[kind][s.phase]}</h2><span>ШАГ ${String(s.phase+1).padStart(2,'0')} / ${String(count).padStart(2,'0')}</span></div>
        ${s.done?finishRoom():isLine?lineWorkspace():warehouseRoom()}
        <span class="floor-scene-caption">${isLine?'Маркировка и задание должны совпадать':'Точный учёт начинается с внимательной приёмки'}</span>
        ${journalOpen?`<section class="floor-journal" aria-label="Журнал смены"><header><div><span class="floor-document-origin">ТВОИ НАБЛЮДЕНИЯ</span><h3>Журнал смены</h3></div>${b('journal','×','','floor-close','aria-label="Закрыть журнал"')}</header>${entries.length?`<ol>${entries.map(row=>`<li>${e(row)}</li>`).join('')}</ol>`:'<p>Здесь появятся результаты твоих проверок. Начни с маркировки — первая запись уже близко.</p>'}${b('ask-reset','Начать участок заново','','is-text')}</section>`:''}
        ${resetOpen?`<section class="floor-reset-panel"><h3>Начать этот участок заново?</h3><p>Текущие действия на участке будут сброшены. Паспорт открытий сохранится.</p>${b('reset','Начать заново','','is-primary')}${b('cancel-reset','Продолжить смену')}</section>`:''}</div>
        <div class="floor-dialogue"><img class="floor-guide" src="assets/ochazhok-illustrated-v2.webp" alt="Твой наставник Очажок" width="1080" height="1485"><div class="floor-dialogue-copy ${dialogueUpdated?'is-updating':''}"><span class="floor-speaker">ТВОЙ НАСТАВНИК · ОЧАЖОК</span><p class="floor-instruction ${tone}" role="status" aria-live="polite" aria-atomic="true">${e(dialogueText)}</p><p class="floor-next-action">${e(nextAction())}</p>${showHint?`<p class="floor-hint">${e(hint())}</p>`:''}${whyOpen?`<p class="floor-why-copy">${e(why())}</p>`:''}</div>${b('why','Зачем это в работе?','','is-text floor-why',`aria-expanded="${whyOpen}"`)}</div>
        <footer class="floor-foot"><span>${storeOK?'Прогресс сохраняется на этом устройстве':'Сохранение недоступно — прогресс останется только до закрытия страницы'}</span><div class="floor-step-dots" aria-label="Шаг ${s.phase+1} из ${count}">${steps[kind].map((label,i)=>`<span class="${i<s.phase||s.done?'is-done':i===s.phase?'is-current':''}" title="${e(label)}"></span>`).join('')}</div><span>Учебная история · без таймера и штрафов</span></footer></div>`,[],0,'');
      const action=focusAction||oldAction,value=focusAction?focusValue:oldValue;
      if(action){const replacement=[...a.content.querySelectorAll('[data-do]:not(:disabled)')].find(el=>el.dataset.do===action&&(value===undefined||el.dataset.value===value));(replacement||a.content.querySelector('.floor-line-main button:not(:disabled),.floor-warehouse-main button:not(:disabled),.floor-finished button'))?.focus({preventScroll:true});}
    }
    function act(type,value){
      if(!type.startsWith('floor-'))return;
      const action=type.slice(6);
      if(action==='journal'){journalOpen=!journalOpen;render();return;}
      if(action==='why'){whyOpen=!whyOpen;render();return;}
      if(action==='paper'){paperOpen=!paperOpen;render();return;}
      if(action==='hint'){showHint=!showHint;render();return;}
      if(action==='field'&&isLine&&selected!=='У-17'&&value==='batch'){message='Код '+selected+' не совпадает с У-17 в задании. Закрой маркировку и выбери нужную бутылку.';tone='is-error';render();return;}
      if(action==='pause'){paused=!paused;window.GameMotion?.toggle();render();return;}
      if(action==='ask-reset'){resetOpen=true;journalOpen=false;render('floor-reset');return;}
      if(action==='cancel-reset'){resetOpen=false;journalOpen=true;render('floor-ask-reset');return;}
      if(action==='reset'){game=M.create(kind);s=game.state;selected='';panel='';message='';tone='';showHint=false;resetOpen=false;journalOpen=false;paperOpen=false;whyOpen=false;render();return;}
      if(action==='open-sample'){selected=value;panel='sample';message='Название напитка, формат тары и партия должны совпадать с заданием. Посмотрим на каждое поле — спешить некуда.';tone='';render('floor-field','brand');return;}
      if(action==='open-bottle'){selected=value;panel='bottle';message='Давай рассмотрим эту бутылку внимательнее. Три детали помогут решить, продолжит она путь или отправится на контроль.';tone='';render('floor-lens',selected+':cap');return;}
      if(action==='open-carton'){selected=value;panel='carton';message=s.phase===0?'На складе сверяем товар по строкам. Слева — данные коробки, справа — накладной. Отметь совпадения, и можно будет перейти к осмотру упаковки.':'У этой коробки две проверки: код товара и состояние упаковки. После них выберем адрес хранения.';tone='';render(s.phase===0?'floor-field':'floor-scan',s.phase===0?'brand':selected);return;}
      if(action==='close'){const was=panel;panel='';message='';tone='';render(was==='bottle'?'floor-open-bottle':was==='carton'?'floor-open-carton':'floor-open-sample',selected);return;}
      paperOpen=false;
      const phaseBefore=s.phase,result=game.dispatch(action,value);message=result.message;tone=result.ok?'is-success':'is-error';
      if(result.ok&&(['sample','receipt','decide','place'].includes(action)||s.phase!==phaseBefore)){panel='';selected='';showHint=false;paperOpen=false;whyOpen=false;}
      if(result.ok&&action==='field')message=isLine?(s.fields.length===3?'Все три поля совпали. Можно подтвердить сверку и продолжить смену.':`Проверено ${s.fields.length} из 3 полей. Посмотри на оставшиеся отметки и сравни их с документом.`):(s.fields.length===3?'Напиток, формат и партия совпали. Подтверди приёмку — дальше проверим упаковку и найдём место на стеллаже.':`Совпадение отмечено: ${s.fields.length} из 3. Сверь оставшиеся строки с накладной.`);
      render();
      if(result.ok&&s.phase!==phaseBefore)a.content.querySelector('.floor-scene-heading h2')?.scrollIntoView({block:'nearest',behavior:'instant'});
    }
    // Preload standalone SVGs: a native snapshot of the transparent button can
    // include the composited room behind it. The drag image contains only the carton.
    const dragImages=new Map();
    if(!isLine)for(const c of M.cartons){
      const image=new Image(160,140);
      image.src='data:image/svg+xml;charset=utf-8,'+encodeURIComponent(carton(c).replace('<svg ', '<svg xmlns="http://www.w3.org/2000/svg" width="160" height="140" '));
      dragImages.set(c.id,image);
    }
    function cartonDrag(event){
      const source=event.target.closest('[data-drag]');
      if(isLine||!source||!event.dataTransfer)return;
      const image=dragImages.get(source.dataset.drag),art=source.querySelector('.floor-carton-art');
      if(!image?.complete||!image.naturalWidth||!art){event.preventDefault();return;}
      const bounds=art.getBoundingClientRect();
      const x=Math.max(0,Math.min(160,(event.clientX-bounds.left)*160/bounds.width));
      const y=Math.max(0,Math.min(140,(event.clientY-bounds.top)*140/bounds.height));
      event.dataTransfer.setDragImage(image,x,y);
    }
    a.root.addEventListener('dragstart',cartonDrag);
    function escape(event){if(event.key!=='Escape')return;if(resetOpen)act('floor-cancel-reset','');else if(journalOpen)act('floor-journal','');else if(paperOpen)act('floor-paper','');else if(panel)act('floor-close','');}
    a.root.addEventListener('keydown',escape);
    document.body.classList.add('floor-active');
    return {start:render,act,done:()=>s.done,managesFocus:true,result:()=>({learned:game.summary()}),drop(target,id){if(kind==='warehouse')act('floor-place',id+':'+target);},cleanup(){a.root.removeEventListener('dragstart',cartonDrag);dragImages.clear();a.root.removeEventListener('keydown',escape);document.body.classList.remove('floor-active');}};
  }));
})();
