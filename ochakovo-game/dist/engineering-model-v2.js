/* Pure, serializable case model. Training equipment and parameters are fictional. */
(function (root, factory) {
  'use strict';
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  if (root) root.OchakovoEngineeringModel = api;
})(typeof window !== 'undefined' ? window : null, function () {
  'use strict';

  const VERSION = 2;
  const signals = Object.freeze([1, 0, 1, 1, 0, 1]);
  const steps = Object.freeze(['Сообщение', 'Устройство', 'Расхождение', 'Версии', 'Обслуживание', 'Испытание', 'Передача']);
  const questions = Object.freeze([
    {id:'symptom', title:'Что происходило перед остановкой?', reply:'Бутылки шли, но группа не выпускалась. Иногда бутылка проходила, а счёт на панели не менялся.', fact:'Бутылки проходили, но счёт увеличивался не каждый раз.'},
    {id:'repeat', title:'Когда началось? Это повторялось?', reply:'После нескольких нормальных групп. Потом было ещё два таких ожидания. Запись последнего случая сохранил.', fact:'Ожидание повторялось после нормальных групп; запись сохранена.'},
    {id:'unchanged', title:'Менялись бутылки, подача или настройки?', reply:'Тот же учебный комплект. Скорость и настройки не менял. Бутылки подавались по одной.', fact:'По словам оператора, комплект, скорость и настройки прежние.'},
    {id:'stopped', title:'В каком состоянии участок сейчас?', reply:'Остановил штатным способом и сообщил наставнику. Внутрь оборудования не заходил.', fact:'Участок остановлен, наставник уведомлён.'},
    {id:'damage', title:'Были повреждения или застрявшие бутылки?', reply:'Видимых повреждений не заметил. Бутылки у направляющих не застревали.', fact:'Оператор не заметил повреждений и застревания бутылок.'}
  ]);
  const zones = Object.freeze([
    {id:'feed', name:'Подача', role:'Подаёт бутылки по одной', reply:'Бутылки доходят до датчика. Сравним физическое движение с сообщением о нём в точке распознавания.'},
    {id:'sensor', name:'Датчик S1', role:'Замечает бутылку', reply:'S1 — обозначение датчика. Здесь движение бутылки впервые превращается в сообщение для системы.'},
    {id:'controller', name:'Контроллер', role:'Получает сигнал и ведёт счёт', reply:'Контроллер — устройство управления. Чтобы понять его счёт, сначала сравним бутылку и сообщение датчика.'},
    {id:'group', name:'Группирование', role:'Выпускает полную группу', reply:'Механизм ждёт шесть регистраций. Сейчас их четыре: сначала выясним, почему условие не выполнено.'},
    {id:'next', name:'Передача дальше', role:'Принимает готовую группу', reply:'Следующий участок готов. Здесь группа ждёт набора счёта, а не свободного места дальше.'}
  ]);
  const sources = Object.freeze([
    {id:'doc', name:'Описание и схема S1', kind:'Документация', title:'Как датчик замечает бутылку', text:'S1 распознаёт непрозрачную учебную бутылку по отражённому свету. Загрязнение оптического окна и изменение положения могут мешать распознаванию. Выход S1 означает «бутылка распознана»; контроллер получает сообщение и ведёт счёт.', fact:'По описанию загрязнение окна может ослабить отражённый свет.'},
    {id:'history', name:'История обслуживания', kind:'Запись специалиста', title:'Что известно о прежних условиях', text:'При предыдущем осмотре распознавание было устойчивым, положение и настройки зафиксированы. Позже использовался тот же учебный комплект. Изменений настроек не зарегистрировано. Отсутствие записи не доказывает отсутствие любых изменений.', fact:'Раньше распознавание было устойчивым; изменений настроек не зарегистрировано.'},
    {id:'inspect', name:'Осмотр зоны S1', kind:'Осмотр специалиста', title:'Что обнаружено на оптическом окне', text:'Квалифицированный специалист подготовил безопасные условия и осмотрел узел. На наружном оптическом окне виден матовый след. Крепление проверено, положение соответствует исходной отметке. Видимых повреждений корпуса нет.', fact:'На окне есть матовый след; крепление и положение проверены.'},
    {id:'flow', name:'Движение и подача', kind:'Запись события', title:'Между бутылками есть промежутки', text:'Бутылки идут по одной, с видимыми промежутками. Путь одинаковый, остановок перед датчиком и заметного изменения скорости нет.', fact:'Бутылки идут отдельно; подача без видимых нарушений.'},
    {id:'wire', name:'Выход S1 и вход контроллера', kind:'Диагностическая запись', title:'Сообщение доходит без изменения', text:'Вход контроллера повторяет выход S1 во всех шести проходах. Диагностика питания — без зарегистрированных отклонений. Полную исправность электроники эти сведения не доказывают.', fact:'Выход датчика совпадает со входом контроллера во всех проходах.'},
    {id:'gate', name:'Узел группирования', kind:'Состояние механизма', title:'Почему группа ещё не вышла', text:'Состояние — «Ожидание счёта». Зарегистрированы четыре бутылки из шести, поэтому команда выпуска не выдавалась. Следующий участок готов.', fact:'Команда выпуска не выдавалась: условие счёта не выполнено.'},
    {id:'parts', name:'Каталог запасных частей', kind:'Справочник', title:'Деталь есть — причина ещё не установлена', text:'Для учебного стенда предусмотрен совместимый запасной датчик. Каталог помогает подобрать замену после обоснования её необходимости. Наличие детали не объясняет причину сбоя.', fact:'Каталог помогает подобрать деталь, но не доказывает необходимость замены.'}
  ]);
  const hypotheses = Object.freeze([
    {id:'spacing', title:'Бутылки идут вплотную', sources:['flow'], reply:'Между бутылками видны промежутки. В этой записи версия не подтверждается.', effect:'weakened'},
    {id:'position', title:'Датчик сместился', sources:['inspect'], reply:'Специалист проверил крепление и исходную отметку. Оснований для этой версии стало меньше.', effect:'weakened'},
    {id:'dirt', title:'След на окне мешает распознаванию', sources:['inspect','doc'], reply:'След обнаружен, а описание объясняет его возможное влияние. Это ведущая гипотеза, которую ещё нужно проверить после обслуживания.', effect:'supported'},
    {id:'transfer', title:'Теряется передача сигнала', sources:['wire'], reply:'Выход S1 и вход контроллера совпадают. Пропуски возникают уже при распознавании, до передачи.', effect:'weakened'},
    {id:'electronics', title:'Неисправна электроника S1', sources:['wire'], reply:'Полностью исключить нельзя. Но внешний след даёт конкретное условие для первой проверки; если сбой сохранится, диагностику продолжат.', effect:'unresolved'}
  ]);
  const actions = Object.freeze([
    {id:'clean', title:'Обслужить наружное оптическое окно', reply:'Есть наблюдение и связь с принципом работы. Специалист обслужит окно, затем проверит результат в прежних условиях.'},
    {id:'settings', title:'Изменить настройку распознавания', reply:'Комплект прежний, а на окне есть след. Изменение параметров может скрыть проблему и усложнить сравнение.'},
    {id:'replace', title:'Заменить датчик', reply:'Внутренняя неисправность остаётся версией. Сначала проверим конкретное внешнее условие. Если сбой сохранится, специалист продолжит диагностику.'},
    {id:'drive', title:'Проверить привод группирователя', reply:'В исходной записи команда выпуска не выдавалась: счёт не набран. Движение механизма проверим при испытании.'}
  ]);
  const criteria = Object.freeze(['Все бутылки распознаны', 'Выход датчика и вход контроллера совпали', 'В пустом промежутке нет ложных событий', 'Обе группы выпущены']);

  const ids = list => list.map(item => item.id);
  const own = (obj, key) => Object.prototype.hasOwnProperty.call(obj, key);
  const plain = value => value && typeof value === 'object' && !Array.isArray(value) ? value : {};
  const integer = (value, min, max, fallback = min) => Number.isInteger(value) && value >= min && value <= max ? value : fallback;
  const str = (value, allowed, fallback = '') => allowed.includes(value) ? value : fallback;
  const list = (value, allowed) => Array.isArray(value) ? Array.from(new Set(value.filter(item => allowed.includes(item)))) : [];
  const all = (collection, expected) => expected.every(item => collection.includes(item));
  const clone = value => JSON.parse(JSON.stringify(value));
  function fresh() {
    return {version:VERSION, phase:0, unlocked:0, asked:[], question:'', report:'', reportReady:false,
      zone:'', normalSeen:false, mapReady:false, frame:0, marked:[], conclusion:'', signalReady:false,
      source:'doc', read:[], hypothesis:'', linkSource:'', links:{}, leading:'', hypothesesReady:false,
      nextAction:'', evidence:[], work:0, serviceReady:false, test:0, criteria:[], testConclusion:'', testReady:false,
      recordCorrection:'', understanding:'', handed:false, accepted:false, finished:false};
  }
  function normalize(raw) {
    const input = plain(raw), s = fresh();
    if (input.version !== VERSION) return s;
    s.asked = list(input.asked, ids(questions));
    s.question = str(input.question, s.asked);
    s.report = str(input.report, ['mismatch','replace','mechanism','wait']);
    s.reportReady = input.reportReady === true && all(s.asked, ['symptom','repeat','unchanged','stopped']) && s.report === 'mismatch';
    s.zone = str(input.zone, ids(zones));
    s.normalSeen = input.normalSeen === true && s.reportReady;
    s.mapReady = input.mapReady === true && s.reportReady && s.normalSeen && s.zone === 'sensor';
    s.frame = integer(input.frame, 0, 5);
    s.marked = list(input.marked, [0,1,2,3,4,5]);
    s.conclusion = str(input.conclusion, ['detect','wire','gate','feed']);
    s.signalReady = input.signalReady === true && s.mapReady && s.marked.length === 2 && all(s.marked,[1,4]) && s.conclusion === 'detect';
    s.source = str(input.source, ids(sources), 'doc');
    s.read = s.signalReady ? list(input.read, ids(sources)) : [];
    if(s.signalReady)for(const id of ['wire','flow'])if(!s.read.includes(id))s.read.push(id);
    s.hypothesis = str(input.hypothesis, ids(hypotheses));
    s.linkSource = str(input.linkSource, s.read);
    const savedLinks = plain(input.links);
    hypotheses.forEach(h => {
      if (own(savedLinks,h.id) && h.sources.includes(savedLinks[h.id]) && s.read.includes(savedLinks[h.id])) s.links[h.id] = savedLinks[h.id];
    });
    s.leading = str(input.leading, ['dirt']);
    s.hypothesesReady = input.hypothesesReady === true && s.signalReady && all(s.read,['doc','history','inspect']) && !!s.links.dirt && Object.keys(s.links).some(id => id !== 'dirt' && id !== 'electronics') && s.leading === 'dirt';
    s.nextAction = str(input.nextAction, ids(actions));
    s.evidence = list(input.evidence, ['doc','inspect','history','wire']);
    s.work = s.hypothesesReady && s.nextAction === 'clean' && all(s.evidence,['doc','inspect']) ? integer(input.work,0,3) : 0;
    s.serviceReady = input.serviceReady === true && s.work === 3;
    s.test = s.serviceReady ? integer(input.test,0,4) : 0;
    s.criteria = s.test === 4 ? list(input.criteria,[0,1,2,3]) : [];
    s.testConclusion = str(input.testConclusion,['success','mechanism','transfer']);
    s.testReady = input.testReady === true && s.serviceReady && s.test === 4 && s.criteria.length === 4 && s.testConclusion === 'success';
    s.recordCorrection = s.testReady ? str(input.recordCorrection,['recognition','transfer','position']) : '';
    s.understanding = s.testReady ? str(input.understanding,['continue','resume','replace']) : '';
    s.handed = input.handed === true && s.testReady && s.recordCorrection === 'recognition' && s.understanding === 'continue';
    s.accepted = input.accepted === true && s.handed;
    s.finished = input.finished === true && s.accepted;
    s.unlocked = s.testReady ? 6 : s.serviceReady ? 5 : s.hypothesesReady ? 4 : s.signalReady ? 3 : s.mapReady ? 2 : s.reportReady ? 1 : 0;
    s.phase = integer(input.phase,0,s.unlocked,s.unlocked);
    return s;
  }

  function dispatch(input, action) {
    const before = normalize(input), s = clone(before), event = plain(action);
    let type = typeof event.type === 'string' ? event.type : '', value = event.value;
    let message = '', error = false;
    const fail = text => { message = text; error = true; };
    const advance = n => {s.phase=n; s.unlocked=n;};
    const toggle = (field,item) => {s[field] = s[field].includes(item) ? s[field].filter(v => v !== item) : s[field].concat(item);};
    const number = value => typeof value === 'string' && /^\d+$/.test(value) ? Number(value) : value;
    if (type === 'step') {
      const target = number(value);
      if (Number.isInteger(target) && target >= 0 && target <= s.unlocked) s.phase = target;
      else fail('Этот этап ещё не открыт. Продолжи текущее расследование.');
    } else if (type === 'handoff' && s.handed) {
      s.accepted = true; s.phase = 6;
      message = 'Наставник подтвердил результат, оператор принял запись. Учебный участок возвращён в работу.';
    } else if ((type === 'finish' || type === 'record-finish') && s.accepted) {
      s.finished = true; s.phase = 6;
      message = 'Ты разобрал случай и передал результат команде. Открытие готово для паспорта.';
    } else if (s.handed) {
      fail('Запись уже передана. Результаты сохранены; можно просматривать этапы и завершить передачу.');
    } else if (s.phase !== s.unlocked) {
      if (type === 'frame' && s.phase === 2) {
        const frame = number(value);
        if (Number.isInteger(frame) && frame >= 0 && frame < 6) s.frame = frame;
        else fail('Выбери один из шести проходов записи.');
      } else fail('Это сохранённые наблюдения. Вернись к текущему этапу, чтобы продолжить работу.');
    } else if (s.phase === 0) {
      if (type === 'ask') {
        const id = Number.isInteger(number(value)) ? questions[number(value)]?.id : value;
        const q = questions.find(item => item.id === id);
        if (q) {s.question=q.id; if(!s.asked.includes(q.id)) s.asked.push(q.id); message=q.reply;}
        else fail('Выбери вопрос оператору.');
      } else if (type === 'report') {
        const report = str(value,['mismatch','replace','mechanism','wait']);
        if (report) s.report=report; else fail('Выбери наблюдаемое расхождение.');
      } else if (type === 'check-report') {
        const missing = questions.slice(0,4).find(q => !s.asked.includes(q.id));
        if (missing) fail('Уточни у оператора: '+missing.title);
        else if (s.report === 'replace') fail('Необходимость замены — пока предположение. Передай наблюдение: бутылка проходит, а счёт не всегда меняется.');
        else if (s.report !== 'mismatch') fail('Передай наблюдаемое расхождение движения бутылок и зарегистрированного счёта. Причину ещё предстоит выяснить.');
        else {s.reportReady=true; advance(1); message='Факты оператора сохранены с указанием источника. Посмотрим, как движение превращается в сигнал.';}
      } else fail('Сначала уточни сообщение оператора.');
    } else if (s.phase === 1) {
      if (type === 'demo' || type === 'normal-demo') {s.normalSeen=true; message='В нормальном примере бутылка распознана, сигнал дошёл, счёт вырос. После шести регистраций механизм выпустил группу.';}
      else if (type === 'zone') {
        const z=zones.find(item=>item.id===value);
        if(z){s.zone=z.id;message=z.reply;}else fail('Выбери узел учебной линии.');
      } else if(type==='check-zone') {
        if(!s.normalSeen) fail('Сначала посмотри нормальный пример: бутылка → распознавание → сигнал → счёт → выпуск.');
        else if(s.zone!=='sensor') fail(zones.find(z=>z.id===s.zone)?.reply || 'Выбери точку, где сравнить бутылку и сообщение о ней.');
        else {s.mapReady=true;advance(2);message='Сравним движение бутылки и распознавание S1. Это место проверки, а не установленная поломка.';}
      } else fail('Изучи назначение узлов и нормальный пример работы.');
    } else if(s.phase===2) {
      if(type==='frame') {const frame=number(value);if(Number.isInteger(frame)&&frame>=0&&frame<6)s.frame=frame;else fail('Выбери один из шести проходов записи.');}
      else if(type==='mark') {const frame=value===undefined||value===''?s.frame:number(value);if(Number.isInteger(frame)&&frame>=0&&frame<6)toggle('marked',frame);else fail('Выбери проход записи.');}
      else if(type==='signal-conclusion') {if(['detect','wire','gate','feed'].includes(value))s.conclusion=value;else fail('Выбери вывод по записи.');}
      else if(type==='check-signals') {
        if(s.marked.length!==2||!all(s.marked,[1,4]))fail('Сравни наличие бутылки и выход S1. Отметь оба прохода, где бутылка есть, а распознавания нет.');
        else if(s.conclusion==='wire')fail('Выход S1 и вход контроллера совпадают во всех проходах. Пропуски возникают уже при распознавании, до передачи.');
        else if(s.conclusion==='gate')fail('Команды выпуска ещё не было: зарегистрированы четыре бутылки из шести. Ожидание не доказывает неисправность механизма.');
        else if(s.conclusion==='feed')fail('Во втором и пятом проходах бутылка находится у S1. Не зарегистрировано её распознавание.');
        else if(s.conclusion!=='detect')fail('Выбери вывод, который объясняет отмеченные проходы.');
        else {
          s.signalReady=true;
          // These two observations were already compared in the event recording.
          // Reuse them as evidence instead of asking the learner to save them twice.
          for(const id of ['wire','flow'])if(!s.read.includes(id))s.read.push(id);
          advance(3);message='Расхождение найдено при распознавании. Движение бутылок и совпадение сигналов сохранены в журнале. Причина пока не установлена — сопоставим версии с наблюдениями.';
        }
      } else fail('Изучи запись события до остановки.');
    } else if(s.phase===3) {
      if(type==='source'||type==='read-source') {
        const source=sources.find(item=>item.id===value);
        if(!source)fail('Выбери источник наблюдений.');
        else {s.source=source.id;if(type==='read-source'&&!s.read.includes(source.id))s.read.push(source.id);message=source.text;}
      } else if(type==='hypothesis') {if(ids(hypotheses).includes(value)){s.hypothesis=value;s.linkSource='';}else fail('Выбери версию для проверки.');}
      else if(type==='link-source') {if(s.read.includes(value))s.linkSource=value;else fail('Сначала открой и добавь этот источник в журнал.');}
      else if(type==='link-hypothesis') {
        const h=hypotheses.find(item=>item.id===s.hypothesis);
        if(!h||!s.linkSource)fail('Выбери версию и источник из сохранённых наблюдений.');
        else if(!s.read.includes(s.linkSource))fail('Сначала добавь источник в журнал.');
        else if(!h.sources.includes(s.linkSource))fail('Этот источник не проверяет версию напрямую. Найди наблюдение о '+(h.id==='spacing'?'промежутках между бутылками.':h.id==='position'?'креплении и положении.':h.id==='transfer'||h.id==='electronics'?'выходе и входе сигнала.':'поверхности окна или принципе распознавания.'));
        else{s.links[h.id]=s.linkSource;message=h.reply;}
      } else if(type==='check-hypotheses') {
        const missing=['doc','history','inspect'].find(id=>!s.read.includes(id));
        if(missing)fail('Добавь источник «'+sources.find(source=>source.id===missing).name+'»: нужны принцип работы, история и текущее состояние.');
        else if(!s.links.dirt||!Object.keys(s.links).some(id=>id!=='dirt'&&id!=='electronics'))fail('Сопоставь минимум две версии: поддержи гипотезу о следе и проверь альтернативу, которая ослабла по наблюдениям.');
        else if(s.hypothesis!=='dirt')fail('Выбери ведущую гипотезу, которая объединяет обнаруженный след и принцип распознавания.');
        else{s.leading='dirt';s.hypothesesReady=true;advance(4);message='След на окне — ведущая гипотеза. Предложи работу, которая позволит её проверить.';}
      } else fail('Сопоставь версии с доступными наблюдениями.');
    } else if(s.phase===4) {
      if(s.work>0&&type!=='work-next')fail('План согласован. Наблюдай работу специалиста и подготовку испытания.');
      else if(type==='next-action') {if(ids(actions).includes(value))s.nextAction=value;else fail('Выбери предложение для специалиста.');}
      else if(type==='evidence') {if(['doc','inspect','history','wire'].includes(value)&&s.read.includes(value))toggle('evidence',value);else fail('Выбери основание из сохранённых наблюдений.');}
      else if(type==='propose') {
        const proposal=actions.find(item=>item.id===s.nextAction);
        if(!proposal)fail('Выбери следующий шаг для квалифицированного специалиста.');
        else if(proposal.id!=='clean')fail(proposal.reply);
        else if(!all(s.evidence,['doc','inspect']))fail('Нужны два прямых основания: что обнаружено при осмотре и почему это может мешать распознаванию.');
        else{s.work=1;message='Предложение принято. Безопасные условия обслуживания готовит квалифицированный специалист.';}
      } else if(type==='work-next') {
        if(s.work===0)fail('Сначала согласуй предложение и его основания с наставником.');
        else if(s.work===1){s.work=2;message='Специалист выполняет обслуживание наружного оптического окна. Стажёр наблюдает рядом с наставником.';}
        else if(s.work===2){s.work=3;message='Окно обслужено. Положение и настройки не менялись. Теперь нужно проверить результат.';}
        else{s.serviceReady=true;advance(5);message='Сравним результат в прежних условиях: полный проход, пустой промежуток и повтор.';}
      } else fail('Обоснуй предложение и наблюдай обслуживание.');
    } else if(s.phase===5) {
      if(type==='test-start') {if(s.test===0){s.test=1;message='Первые три бутылки распознаны. Это только часть намеченного испытания.';}else fail('Испытание уже началось; продолжи намеченный план.');}
      else if(type==='early-test') {
        if(s.test!==1)fail('Это решение доступно после первых трёх бутылок.');
        else if(value==='continue'){s.test=2;message='Полный проход A: шесть бутылок распознаны, группа выпущена. Дальше — пустой промежуток.';}
        else if(value==='resume')fail('Три успешных бутылки — только начало. Закончи полный проход, пустой промежуток и повтор. Возвращать участок к обычной работе рано.');
        else if(value==='replace')fail('Новых пропусков пока нет; оснований для замены не появилось. Заверши намеченное сравнение.');
        else fail('Выбери, достаточно ли трёх наблюдений для завершения проверки.');
      } else if(type==='test-next') {
        if(s.test===2){s.test=3;message='Пустой промежуток: ноль событий, ложных регистраций нет.';}
        else if(s.test===3){s.test=4;message='Повторный проход B: шесть бутылок распознаны, вторая группа выпущена.';}
        else fail('Начни испытание и последовательно выполни полный проход, пустой промежуток и повтор.');
      } else if(type==='criterion') {
        const id=number(value);
        if(s.test!==4)fail('Сначала закончи оба прохода и пустой промежуток.');
        else if(Number.isInteger(id)&&id>=0&&id<4)toggle('criteria',id);else fail('Выбери критерий завершённого испытания.');
      } else if(type==='test-conclusion') {if(['success','mechanism','transfer'].includes(value))s.testConclusion=value;else fail('Выбери заключение по результатам испытания.');}
      else if(type==='accept-test') {
        if(s.test!==4)fail('Заверши оба прохода и пустой промежуток.');
        else if(s.criteria.length!==4)fail('Проверь все четыре критерия: распознавание, передачу, пустой промежуток и выпуск обеих групп.');
        else if(s.testConclusion==='mechanism')fail('При трёх бутылках механизм ждал полную группу, при шести выпустил её. Это ожидаемая работа.');
        else if(s.testConclusion==='transfer')fail('Выход и вход совпадали до обслуживания и после него. Передачу сигнала не восстанавливали.');
        else if(s.testConclusion!=='success')fail('Выбери заключение, которое соответствует всем наблюдениям.');
        else{s.testReady=true;advance(6);message='После обслуживания пропуски не повторились в двух проходах. Сохраним результат и передадим его команде.';}
      } else fail('Проверь результат обслуживания по всему намеченному плану.');
    } else if(s.phase===6) {
      if(type==='record-correction') {if(['recognition','transfer','position'].includes(value))s.recordCorrection=value;else fail('Выбери точное описание выполненной работы.');}
      else if(type==='understanding') {if(['continue','resume','replace'].includes(value))s.understanding=value;else fail('Выбери решение по короткой рабочей ситуации.');}
      else if(type==='save-record') {
        if(s.recordCorrection!=='recognition')fail('Передачу сигнала и положение не меняли. Специалист обслужил окно; после этого пропуски распознавания не повторились.');
        else if(s.understanding!=='continue')fail('Успешное испытание относится к проверенным условиям. Если сбой повторится, сохрани новые наблюдения и сообщи наставнику: прежняя проверка не объясняет новое событие.');
        else{s.handed=true;message='Точная запись передана наставнику и оператору. Они согласуют возвращение учебного участка в работу.';}
      } else fail('Проверь смысл записи и передай результат команде.');
    }
    const state=normalize(s);
    return {state, message, error, changed:JSON.stringify(state)!==JSON.stringify(before)};
  }

  function scene(raw, options) {
    const s=normalize(raw), historical=plain(options).historical===true || s.phase===2;
    if(historical){const signal=signals[s.frame];return {mode:'historical',historical:true,status:'Запись до остановки',frame:s.frame,physical:s.frame+1,count:signals.slice(0,s.frame+1).reduce((sum,n)=>sum+n,0),total:6,sensor:signal,controller:signal,groups:0,cleaned:false,signals:signals.slice()};}
    if(s.accepted)return {mode:'running',historical:false,status:'Возвращён в работу',physical:6,count:6,total:6,sensor:1,controller:1,groups:2,cleaned:true,signals:[1,1,1,1,1,1]};
    if(s.testReady)return {mode:'checked',historical:false,status:s.handed?'Результат передан':'Проверено · ожидает передачи',physical:6,count:6,total:6,sensor:1,controller:1,groups:2,cleaned:true,signals:[1,1,1,1,1,1]};
    if(s.test>0){const gap=s.test===3, count=s.test===1?3:gap?0:6;return {mode:'testing',historical:false,status:s.test===1?'Испытание · первые три':s.test===2?'Проход A завершён':gap?'Пустой промежуток · 0 событий':'Проход B завершён',physical:count,count,total:6,sensor:gap?0:1,controller:gap?0:1,groups:s.test>=4?2:s.test>=2?1:0,cleaned:true,signals:Array(count).fill(1)};}
    if(s.work===3)return {mode:'serviced',historical:false,status:'Обслужено · ожидает испытания',physical:0,count:0,total:6,sensor:0,controller:0,groups:0,cleaned:true,signals:[]};
    return {mode:s.work?'service':'stopped',historical:false,status:s.work?'Специалист обслуживает':'Участок остановлен',physical:6,count:4,total:6,sensor:0,controller:0,groups:0,cleaned:false,signals:signals.slice()};
  }
  function record(raw) {
    const s=normalize(raw);
    return [
      {title:'Что наблюдали',text:s.signalReady?'Шесть бутылок прошли S1, зарегистрированы четыре. Выход датчика и вход контроллера совпадали.':'Наблюдения ещё не завершены.'},
      {title:'Что предположили',text:s.hypothesesReady?'След на оптическом окне мог мешать распознаванию. Версию сопоставили с документацией, осмотром и альтернативами.':'Ведущая гипотеза ещё не обоснована.'},
      {title:'Что выполнили',text:s.work===3?'Квалифицированный специалист обслужил наружное оптическое окно. Положение и настройки не менялись.':'Обслуживание ещё не завершено.'},
      {title:'Как проверили',text:s.testReady?'Два прохода по шесть бутылок: все распознаны, выход и вход совпали, обе группы выпущены. В пустом промежутке — ноль событий.':'Полный план испытания ещё не подтверждён.'},
      {title:'Что передаём',text:s.handed?'Результаты и рекомендацию при повторении сохранить новое событие и обратиться к наставнику. Запись получили наставник и оператор.':'Черновик результатов для наставника и оператора.'}
    ];
  }
  function facts(raw) {
    const s=normalize(raw);
    return questions.filter(q=>s.asked.includes(q.id)).map(q=>({id:q.id,source:'Оператор',text:q.fact}))
      .concat(sources.filter(source=>s.read.includes(source.id)).map(source=>({id:source.id,source:source.kind,text:source.fact})));
  }
  return Object.freeze({VERSION,signals,steps,questions,zones,sources,hypotheses,actions,criteria,fresh,normalize,dispatch,scene,record,facts});
});
