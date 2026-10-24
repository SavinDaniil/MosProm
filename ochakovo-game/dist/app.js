(() => {
  'use strict';
  const $ = (s, el=document) => el.querySelector(s);
  const main = $('#main');
  const KEY = 'ochakovo-first-shift-v3';
  let state = {completed:{},storyVersion:0};
  let storageOK = true;
  let cleanup = null;
  let preparedApplication = null;
  try {
    const saved = JSON.parse(localStorage.getItem(KEY) || 'null');
    if (saved && saved.completed && typeof saved.completed === 'object' && !Array.isArray(saved.completed)) {
      state.storyVersion = saved.storyVersion === 2 ? 2 : 0;
      for (const id of ['intro','lab','line','engineering','warehouse']) {
        const item = saved.completed[id];
        if (item && typeof item.learned === 'string') state.completed[id] = {id,score:100,learned:item.learned.slice(0,1500)};
      }
    }
  } catch { storageOK = false; }
  const icons = {
    arrow:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" aria-hidden="true"><path d="M4 12h15M13 6l6 6-6 6"/></svg>',
    back:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" aria-hidden="true"><path d="M20 12H5m6-6-6 6 6 6"/></svg>',
    clock:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" aria-hidden="true"><circle cx="12" cy="12" r="8"/><path d="M12 7v5l3 2"/></svg>',
    map:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" aria-hidden="true"><path d="m3 5 6-2 6 2 6-2v16l-6 2-6-2-6 2zm6-2v16m6-14v16"/></svg>'
  };
  const labels = {intro:'История завода',lab:'Лаборатория',line:'Линия розлива',engineering:'Инженерный участок',warehouse:'Склад'};
  const captions = {intro:'Семь глав об одной компании',lab:'От пробы до решения',line:'Проследи партию вместе с командой',engineering:'Смена с командой автоматики',warehouse:'Собери и проверь заказ'};
  const roles = {
    intro:{name:'История в движении',text:'От открытия московского завода до знакомых вкусов и твоего первого рабочего задания.',tip:'Давай откроем историю вместе. В каждой главе есть действие, которое меняет сцену.'},
    lab:{name:'Химик-лаборант',text:'Берёт пробы, проводит анализы и помогает контролировать качество. Важны аккуратность, внимательность и интерес к химии.',tip:'Сравни каждый показатель с диапазоном. Здесь важна внимательность, а не скорость.'},
    line:{name:'Оператор линии розлива',text:'Следит за потоком, оборудованием и продукцией. Сопоставляет наблюдения с контролем и взаимодействует с командой.',tip:'Проследи партию У-17. Замечай изменения, сверяйся с журналом и передавай наблюдения наставнику.'},
    engineering:{name:'Инженер по автоматизации',text:'Помогает оборудованию работать надёжно, разбирается в датчиках и автоматике. Практические задачи и допуск согласуют с руководителем.',tip:'Безопасность — первое действие. Самостоятельно ремонтировать оборудование новичку нельзя.'},
    warehouse:{name:'Оператор склада',text:'Работает с документами и учётом, помогает правильно комплектовать и отгружать заказы. Кладовщик координирует движение товаров.',tip:'Сравни название, формат и количество по каждой строке. Осмотри упаковку. Если есть повреждение — сообщи кладовщику.'}
  };
  const careerData = [
    {id:'lab',title:'Лаборатория',position:'Лаборант',pay:'от 60 000 ₽',text:'Пробы, анализы и контроль качества. Для тех, кому интересно разбираться в составе и замечать детали.',details:['Обучение с наставником','Сменный график, в том числе дневные и ночные смены','Профильное образование и требования уточнит отдел подбора']},
    {id:'line',title:'Линия розлива',position:'Оператор цеха розлива',pay:'от 70 000 ₽',text:'Оборудование, этикетка, упаковка и стабильная работа линии. Здесь виден результат работы всей команды.',details:['Спецодежда и медосмотр за счёт компании','Смены 08:00–20:00 / 20:00–08:00 по согласованному графику','Работа по инструкции, поддержка наставника']},
    {id:'technology',title:'Технологический цех',position:'Оператор технологического цеха',pay:'от 70 000 ₽',text:'Сырьё, приготовление сиропов и производство напитков. Возможность увидеть технологию изнутри.',details:['Рабочие задачи определяет руководитель','В материалах указан график 2/2 с дневными и ночными сменами','Временный договор с возможностью дальнейшей работы']},
    {id:'warehouse',title:'Склад и логистика',position:'Оператор склада',pay:'от 60 000 ₽',text:'Учёт продукции, накладные и точная комплектация. От внимания команды зависит правильная отгрузка.',details:['Кладовщик — от 56 000 ₽ до вычета налога по материалам компании','Дневные или дневные и ночные смены по графику','Документация, учёт и командная работа']},
    {id:'engineering',title:'Инженерия и автоматика',position:'Практика в инженерном направлении',pay:'Условия по согласованию',text:'Знакомство с автоматизацией производства, датчиками и технологическим оборудованием.',details:['Для профильных студентов и выпускников','Задачи — вместе с наставником и в рамках допуска','Оплата этой практики в исходных материалах не установлена']}
  ];
  const esc = s => String(s ?? '').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const completedCount = () => Object.keys(state.completed).length;
  const nextMission = () => state.storyVersion !== 2 ? window.GameMissions.list.find(m=>m.id==='intro') : window.GameMissions.list.find(m=>!state.completed[m.id]);
  function persist() {
    try { localStorage.setItem(KEY,JSON.stringify(state)); } catch { storageOK=false; }
  }
  function shell(active) {
    const context = roles[active] || ({map:{name:'Исследуем завод',tip:'Начни с истории или загляни в любой участок. Я буду рядом, замечу твои действия и помогу разобраться.'},discoveries:{name:'Твои открытия',tip:'Здесь — рабочие действия, которые ты попробовал. Можно вернуться к любому заданию или выбрать интересное направление практики.'},careers:{name:'Следующий шаг',tip:'Выбирай направление по интересу. Условия и доступные места уточнит отдел подбора, а я помогу подготовить анкету.'}}[active]) || {name:'Первый шаг',tip:'Исследуй в своём темпе. Можно пробовать снова.'};
    window.GameCompanion?.setScene({id:active,title:labels[active]||context.name,role:context.name,tip:context.tip});
    window.GameMotion?.coach({mood:'welcome',text:context.tip});
    const count = completedCount();
    $('#route-count').textContent = `${count} / 5`;
    $('#route-progress-bar').style.width = `${count*20}%`;
    $('#badge-count').textContent = count;
    $('#stations').innerHTML = window.GameMissions.list.map((m,i)=>`<a class="station ${state.completed[m.id]?'done':''} ${active===m.id?'active':''}" href="#mission/${m.id}" ${active===m.id?'aria-current="step"':''}><span class="station-number">${state.completed[m.id]?'✓':i+1}</span><span><span class="station-label">${labels[m.id]}</span><span class="station-caption">${captions[m.id]}</span></span></a>`).join('');
    document.querySelectorAll('[data-nav]').forEach(a=>{const on = a.dataset.nav===active || (a.dataset.nav==='map' && ['intro','lab','line','engineering','warehouse'].includes(active));a.classList.toggle('active',on);if(on)a.setAttribute('aria-current','page');else a.removeAttribute('aria-current');});
  }
  function footer(){return `<div class="footer-note"><span>Небольшая игра о большой команде «Очаково»</span><a href="#careers">Возможности для студентов ${icons.arrow}</a></div>`;}
  function mapPage() {
    shell('map');
    const next = nextMission();
    const buildings = {
      intro: '83,515 122,499 124,474 309,435 374,449 415,473 428,498 495,521 503,553 500,638 408,681 398,701 281,715 168,675 118,684 103,611',
      lab: '174,183 296,132 492,205 494,317 462,332 467,380 433,405 355,390 348,368 299,381 191,337',
      engineering: '639,58 639,30 656,17 732,41 748,60 749,83 799,94 815,121 850,121 886,149 896,162 934,177 940,200 974,222 978,291 987,295 984,328 954,344 957,378 884,407 826,421 748,397 735,357 715,369 673,349 660,357 639,341 620,348 595,332 595,306 574,314 568,302 569,275 583,264 584,250 601,237 614,243 628,235 637,218',
      line: '1016,207 1149,156 1150,146 1161,147 1163,163 1240,177 1241,164 1253,166 1255,184 1459,275 1470,321 1471,433 1407,468 1328,491 1083,391 1018,354',
      warehouse: '816,487 1012,419 1394,566 1420,584 1420,719 1304,773 1190,735 1187,655 1076,613 1044,679 862,592 838,574 815,526'
    };
    main.innerHTML = `<div class="page-intro"><div><h1>Твоя первая смена</h1><p>Загляни за кулисы знакомых напитков.<br>Пять участков — и столько нового о себе.</p></div><div class="tempo">${icons.clock} Пять коротких заданий · без таймера</div></div>
    <section class="map-board" aria-label="Карта завода: выбери участок"><div class="map-scene"><div class="map-artwork"><img class="map-art" src="assets/factory-map.png" alt="Миниатюрный завод с лабораторией, производством, линией розлива, складом и музеем" width="1536" height="1024" fetchpriority="high"><svg class="map-building-shades" viewBox="0 0 1536 1024" preserveAspectRatio="xMidYMid slice" aria-hidden="true">${window.GameMissions.list.filter(m=>!state.completed[m.id]).map(m=>`<polygon data-stage="${m.id}" points="${buildings[m.id]}"/>`).join('')}</svg></div>
    ${window.GameMissions.list.map((m,i)=>`<button class="map-pin pin-${m.id} ${state.completed[m.id]?'completed':''} ${next?.id===m.id?'recommended':''}" data-open="${m.id}" aria-label="${labels[m.id]}${state.completed[m.id]?', пройдено':''}"><span class="pin-num">${state.completed[m.id]?'✓':i+1}</span>${labels[m.id]}</button>`).join('')}
    </div><div class="map-legend"><span></span> Нажми на участок, чтобы заглянуть внутрь</div></section>
    <div class="map-cta"><span class="cta-icon">${icons.map}</span><img class="mobile-coach" src="assets/ochazhok-illustrated-v2.webp" alt="Твой помощник Очажок" width="70" height="80"><div><h3>${completedCount()===5?'Первая смена пройдена!':completedCount()?'Продолжим исследовать?':'Привет! Начнём со знакомства?'}</h3><p>${completedCount()===5?'Все пять открытий — в твоём паспорте. Теперь можно выбрать практику.':completedCount()?'Можно идти по маршруту или открыть любой участок.':'Я Очажок. Покажу завод и познакомлю с его командой.'}</p></div><button class="primary" data-start>${completedCount()===5?'Смотреть мой результат':completedCount()?'Следующий участок':'Начать смену'} ${icons.arrow}</button><a class="mobile-passport" href="#discoveries">Паспорт открытий · ${completedCount()} из 5 ${icons.arrow}</a></div>${!storageOK?'<p class="storage-note">Браузер не разрешает сохранение: прогресс доступен до закрытия вкладки.</p>':''}${footer()}`;
    main.querySelectorAll('[data-open]').forEach(b=>b.addEventListener('click',()=>location.hash=`mission/${b.dataset.open}`));
    $('[data-start]',main).addEventListener('click',()=>location.hash=next?`mission/${next.id}`:'discoveries');
  }
  function missionPage(id) {
    const mission = window.GameMissions.list.find(x=>x.id===id);
    if(!mission) return mapPage();
    shell(id);
    const r = roles[id], index=window.GameMissions.list.findIndex(x=>x.id===id);
    main.innerHTML = `<a href="#map" class="back-link">${icons.back} На карту завода</a><div class="task-topline"><span>Участок ${index+1} из 5 · ${labels[id]}</span><span>${id==='intro'?'Мини-история «Очаково»':state.completed[id]?'Уже в паспорте · можно повторить':'Без таймера'}</span></div><div class="mission-layout"><section><div class="mission-stage ${id==='intro'?'mission-stage--story':''}" id="mission-container"></div><div class="station-actions"><a href="#discoveries">Паспорт открытий: ${completedCount()} из 5</a><button class="secondary" id="skip-mission">Выбрать другой участок</button></div></section></div>${id!=='intro'?`<div class="profession-after"><div><h3>Попробовать профессию на практике</h3></div><a href="#careers">Узнать о практике ${icons.arrow}</a></div>`:''}`;
    cleanup=window.GameMissions.mount($('#mission-container'),id,result=>{
      state.completed[id]={id,score:100,learned:String(result.learned || captions[id])};if(id==='intro')state.storyVersion=2;persist();
      location.hash=id==='intro'&&roles[result.nextId]?`mission/${result.nextId}`:`complete/${id}`;
    });
    $('#skip-mission').addEventListener('click',()=>location.hash='map');
  }
  function completePage(id) {
    if(!state.completed[id]) return mapPage();
    shell(id);const next=nextMission();
    main.innerHTML=`<a href="#map" class="back-link">${icons.back} На карту завода</a><section class="empty-passport"><div><div class="success-heading"><span>✓</span><h2>Ещё одно открытие!</h2></div><p>${esc(state.completed[id].learned)}</p><p><strong>${completedCount()} из 5 участков</strong> в твоём паспорте. ${next?(storageOK?'Можно продолжить или сделать паузу — прогресс сохранится.':'Можно продолжить. Сохранение в этом браузере недоступно: не закрывай вкладку, если хочешь сохранить открытия.'):'Ты познакомился со всей командой. Теперь выбирай, какое направление хочется узнать ближе.'}</p><a class="primary" href="${next?'#mission/'+next.id:'#discoveries'}">${next?'Следующее задание':'Мой результат'} ${icons.arrow}</a><a href="#map" class="text-button">Вернуться на карту</a></div><img src="assets/ochazhok-illustrated-v2.webp" alt="Очажок поздравляет с завершением задания" width="200" height="228"></section>`;
  }
  function discoveriesPage() {
    shell('discoveries');
    const count=completedCount();
    main.innerHTML=`<div class="section-title"><h1>Паспорт открытий</h1><p>Здесь всё, что ты попробовал на заводе. ${count?`Пройдено ${count} из 5 участков.`:'Первые открытия уже ждут на карте.'}</p></div>`;
    if(!count){main.innerHTML+=`<div class="empty-passport"><div><h2>Начни с любопытства</h2><p>Попробуй себя в лаборатории, на линии розлива или на складе. Можно ошибаться, пробовать снова и выбирать свой маршрут.</p><a class="primary" href="#map">Исследовать завод ${icons.arrow}</a></div><img src="assets/ochazhok-illustrated-v2.webp" alt="Очажок приглашает исследовать завод" width="200" height="228"></div>`;return;}
    if(count===5)main.innerHTML+=`<div class="all-done"><div><h2>Первая смена пройдена</h2><p>Пять разных задач — одна большая команда. Какой участок понравился тебе больше?</p></div><a class="primary" href="#careers">Выбрать направление ${icons.arrow}</a></div>`;
    main.innerHTML+=`<div class="discoveries-list">${window.GameMissions.list.filter(m=>state.completed[m.id]).map(m=>`<article class="discovery"><span class="discovery-mark">✓</span><div><h3>${labels[m.id]}</h3><p>${esc(state.completed[m.id].learned)}</p></div><a href="#mission/${m.id}">Попробовать снова</a></article>`).join('')}</div><p class="storage-note">Это знакомство с рабочими задачами. Результат игры не оценивает профессиональную пригодность.</p><div class="station-actions"><a href="#map" class="secondary">${icons.back} На карту</a><button class="text-button" id="reset-progress">Начать маршрут заново</button></div><div id="reset-region"></div>`;
    $('#reset-progress').addEventListener('click',()=>{
      $('#reset-region').innerHTML='<div class="notice">Сбросить все открытия в этом браузере? <button class="text-button" id="confirm-reset">Да, начать заново</button> <button class="text-button" id="cancel-reset">Оставить открытия</button></div>';
      $('#confirm-reset').addEventListener('click',()=>{state={completed:{},storyVersion:0};persist();location.hash='map';});
      $('#cancel-reset').addEventListener('click',()=>$('#reset-region').innerHTML='');
    });
  }
  function careersPage() {
    shell('careers');
    main.innerHTML=`<div class="section-title"><h1>Теперь попробуй по-настоящему</h1><p>Практика и работа в «Очаково» для студентов и выпускников от 18 лет. Выбери направление, которое хочется узнать ближе.</p></div><div class="roles-grid">${careerData.map(r=>`<article class="career-card"><h2>${r.title}</h2><p>${r.text}</p><div class="role-pay">${r.pay}<small>${r.id==='engineering'?'Доступные места и формат уточнит отдел подбора':'В материалах практики · до вычета налога'}</small></div><ul>${r.details.map(d=>`<li>${d}</li>`).join('')}</ul><button class="secondary" data-apply="${r.id}">Мне интересно ${icons.arrow}</button></article>`).join('')}</div><div class="careers-note"><strong>Как устроена практика.</strong> В предоставленных материалах компании указан сезон с марта/апреля по июль/август, временный трудовой договор, наставник и льготное питание. Даты набора, оплата и график требуют подтверждения для конкретной позиции. Это описание направлений, а не список открытых сегодня вакансий. Головная площадка — Москва, ул. Рябиновая, 44. <a href="https://ochakovo.ru/rabota/" target="_blank" rel="noopener">Проверить актуальные предложения на сайте компании</a>.</div><div class="hr-contact"><div><h3>Есть вопросы о первом шаге?</h3><p>Отдел подбора поможет уточнить места, условия и документы для практики.</p></div><div class="hr-links"><a href="tel:+74957853930">+7 495 785-39-30 · доб. 1155, 2107</a><a href="mailto:rabota@ochakovo.ru">rabota@ochakovo.ru ${icons.arrow}</a></div></div>`;
    main.querySelectorAll('[data-apply]').forEach(b=>b.addEventListener('click',()=>location.hash=`apply/${b.dataset.apply}`));
  }
  function applicationPage(roleId) {
    shell('careers');const selected=careerData.find(r=>r.id===roleId);
    const today=new Date();const dateMax=[today.getFullYear(),String(today.getMonth()+1).padStart(2,'0'),String(today.getDate()).padStart(2,'0')].join('-');
    main.innerHTML=`<div class="application-wrap"><a href="#careers" class="back-link">${icons.back} Все направления</a><div class="section-title"><h1>Первый шаг к практике</h1><p>Подготовь короткую анкету, чтобы рассказать о себе отделу подбора.</p></div><div class="form-card"><div class="form-info">Анкета готовится на твоём устройстве. Её можно скачать и самостоятельно отправить на <a href="mailto:rabota@ochakovo.ru">rabota@ochakovo.ru</a> или перенести в официальную форму. Игра автоматически не отправляет персональные данные.</div><form id="candidate-form"><div class="form-grid"><label class="field full">Фамилия, имя, отчество (если есть)<input name="fullName" autocomplete="name" placeholder="Например, Иванова Мария Сергеевна" minlength="4" maxlength="150" required></label><label class="field">Контакт для связи<input name="contact" autocomplete="email" placeholder="Телефон или электронная почта" maxlength="150" required><small>Достаточно одного удобного контакта</small></label><label class="field">Дата рождения<input name="birthDate" type="date" min="1900-01-01" max="${dateMax}" autocomplete="bday" required><small>Практика и трудоустройство — с 18 лет</small></label><label class="field full">Интересующая вакансия / направление<select name="position" required><option value="">Выбери направление</option>${careerData.map(r=>`<option value="${esc(r.position)}" ${selected?.id===r.id?'selected':''}>${r.position}</option>`).join('')}<option>Кладовщик</option><option>Помогите выбрать направление</option></select></label><label class="field">Когда готов(а) выйти<select name="availability" required><option value="">Выбери период</option><option>В ближайшие две недели</option><option>В течение месяца</option><option>На следующий сезон практики</option><option>После окончания учёбы</option><option>Хочу обсудить даты</option></select></label><label class="field">Город<select name="city" required><option>Москва</option><option>Краснодар</option><option>Пенза</option><option>Тюмень</option><option>Готов(а) рассмотреть переезд</option></select></label><label class="field full">Вуз или колледж<input name="institution" autocomplete="organization" maxlength="200" placeholder="Название учебного заведения" required></label><label class="field">Статус обучения<select name="studyStatus" required><option value="">Выбери статус</option><option>Студент(ка) 1–3 курса</option><option>Студент(ка) 4 курса и старше</option><option>Выпускник / выпускница</option><option>Другое</option></select></label><label class="field">Специальность<input name="specialization" placeholder="Например, пищевая технология" maxlength="150"></label></div><p class="form-error" id="form-error" role="alert"></p><div class="form-controls"><button class="primary" type="submit">Подготовить анкету ${icons.arrow}</button><p>Поля без пометки обязательны. Специальность можно пропустить.</p></div></form></div></div>`;
    $('#candidate-form').addEventListener('submit',event=>{
      event.preventDefault();const form=event.currentTarget;const data=Object.fromEntries(new FormData(form));Object.keys(data).forEach(k=>data[k]=String(data[k]).trim());
      const error=$('#form-error');
      if(data.fullName.split(/\s+/).length<2){error.textContent='Укажи фамилию и имя. Отчество — если есть.';form.elements.fullName.focus();return;}
      const phone=data.contact.replace(/[^\d]/g,'');
      if(!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.contact) && !(phone.length>=10 && phone.length<=15 && /^[+\d\s()\-]+$/.test(data.contact))){error.textContent='Укажи полный телефон или электронную почту, например name@example.ru.';form.elements.contact.focus();return;}
      const birth=new Date(`${data.birthDate}T12:00:00`);let age=today.getFullYear()-birth.getFullYear();if(today.getMonth()<birth.getMonth() || (today.getMonth()===birth.getMonth() && today.getDate()<birth.getDate()))age--;
      if(!Number.isFinite(birth.getTime()) || age<18){error.textContent='Практика и трудоустройство доступны с 18 лет. Исследовать завод в игре можно уже сейчас.';form.elements.birthDate.focus();return;}
      if(data.institution.length<2){error.textContent='Укажи название вуза или колледжа.';form.elements.institution.focus();return;}
      preparedApplication=data;showPrepared();
    });
  }
  function applicationText(data){return `Анкета кандидата — Очаково\n\nФИО: ${data.fullName}\nКонтакт: ${data.contact}\nДата рождения: ${data.birthDate}\nИнтересующая вакансия: ${data.position}\nГотовность выйти: ${data.availability}\nГород: ${data.city}\nВуз / колледж: ${data.institution}\nСтатус: ${data.studyStatus}\nСпециальность: ${data.specialization || 'Не указана'}\n\nПодготовлено в игре «Первая смена».\nПройдено участков: ${completedCount()} из 5. Игровой результат не является оценкой профпригодности.\n`;}
  function showPrepared(){
    main.innerHTML=`<div class="application-wrap"><a href="#careers" class="back-link">${icons.back} К направлениям практики</a><div class="form-card"><div class="success-heading"><span>✓</span><h2>Анкета подготовлена</h2></div><p class="saved-note">Проверь данные, скачай анкету и отправь её в отдел подбора самостоятельно. Работодатель пока её не получил.</p><pre class="saved-preview">${esc(applicationText(preparedApplication))}</pre><div class="success-actions"><button class="primary" id="download-application">Скачать анкету .txt ${icons.arrow}</button><a class="secondary" href="mailto:rabota@ochakovo.ru?subject=${encodeURIComponent('Вопрос о практике в Очаково')}">Открыть письмо в отдел подбора</a><a class="text-button" href="https://ochakovo.ru/rabota/" target="_blank" rel="noopener">Официальная форма ${icons.arrow}</a></div><p class="saved-note">При отправке письма прикрепи скачанный файл. На сайте компании можно уточнить актуальные вакансии и правила обработки данных.</p><button class="text-button" id="edit-application">Изменить данные</button><p class="storage-note" id="download-status" role="status"></p></div></div>`;
    $('#download-application').addEventListener('click',()=>{const blob=new Blob(['\uFEFF'+applicationText(preparedApplication)],{type:'text/plain;charset=utf-8'});const url=URL.createObjectURL(blob);const a=document.createElement('a');a.href=url;a.download='Анкета_Очаково.txt';document.body.append(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),1000);$('#download-status').textContent='Файл подготовлен к скачиванию. Для отклика отправь его в отдел подбора.';});
    $('#edit-application').addEventListener('click',()=>{const data={...preparedApplication};applicationPage();const form=$('#candidate-form');Object.entries(data).forEach(([k,v])=>{if(form.elements[k])form.elements[k].value=v;});});
  }
  function route(){
    if(typeof cleanup==='function')cleanup();cleanup=null;
    const [page,id]=(location.hash.slice(1)||'map').split('/');
    document.body.dataset.view=page;document.body.dataset.station=id||'';
    if(page==='mission')missionPage(id);else if(page==='complete')completePage(id);else if(page==='discoveries')discoveriesPage();else if(page==='careers')careersPage();else if(page==='apply')applicationPage(id);else mapPage();
    window.scrollTo({top:0,behavior:'instant'});main.focus({preventScroll:true});
    if(page!=='mission'||id!=='intro')window.GameMotion?.enter(main);
    if(page==='complete')window.GameMotion?.coach({mood:'success',text:'Отличная работа! '+String(state.completed[id]?.learned||'Ещё одно открытие — в твоём паспорте.')});
  }
  const help=$('#help-dialog');$('.help-button').addEventListener('click',()=>{ $('#help-storage').textContent=storageOK?'Прогресс сохраняется в этом браузере. Игра знакомит с профессиями; её баллы не используются для отбора.':'В этом браузере сохранение недоступно: прогресс останется до закрытия вкладки. Игра знакомит с профессиями; её баллы не используются для отбора.';help.showModal();});$('.dialog-close').addEventListener('click',()=>help.close());$('#help-done').addEventListener('click',()=>help.close());help.addEventListener('click',e=>{if(e.target===help){const r=help.getBoundingClientRect();if(e.clientX<r.left||e.clientX>r.right||e.clientY<r.top||e.clientY>r.bottom)help.close();}});
  $('.skip-link').addEventListener('click',e=>{e.preventDefault();main.focus({preventScroll:true});main.scrollIntoView({behavior:'instant'});});
  window.addEventListener('hashchange',route);
  if(!window.GameMissions){main.innerHTML='<h1>Не удалось загрузить задания</h1><p>Обнови страницу, чтобы попробовать снова.</p>';return;}
  window.GameCompanion?.mount($('#companion-host'));
  route();
})();
