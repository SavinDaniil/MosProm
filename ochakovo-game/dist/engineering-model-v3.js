/* A short profession shift. Values and equipment are a training model. */
(function (root, factory) {
  'use strict';
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  if (root) root.OchakovoEngineeringShift = api;
})(typeof window !== 'undefined' ? window : null, function () {
  'use strict';

  const VERSION = 3;
  const signals = Object.freeze([1, 0, 1, 1, 0, 1]);
  const phases = Object.freeze(['Первый день', 'Подготовка', 'Рабочий цикл', 'Задачи смены', 'Нештатная ситуация', 'Передача смены']);
  const needed = Object.freeze({
    visits: ['sensor', 'controller', 'group'],
    prep: ['task', 'log', 'ready'],
    normal: ['sensor', 'controller', 'release'],
    routine: ['inspect', 'signals', 'operator']
  });
  const plain = value => value && typeof value === 'object' && !Array.isArray(value) ? value : {};
  const number = value => typeof value === 'string' && /^\d+$/.test(value) ? Number(value) : value;
  const integer = (value, min, max, fallback = min) => Number.isInteger(value) && value >= min && value <= max ? value : fallback;
  const list = (value, allowed) => Array.isArray(value) ? Array.from(new Set(value.filter(item => allowed.includes(item)))) : [];
  const all = (items, required) => required.every(item => items.includes(item));
  const clone = value => JSON.parse(JSON.stringify(value));
  const on = value => value === true || value === 1;

  function fresh() {
    return {
      version: VERSION,
      phase: 0,
      visits: [], prep: [], normal: [], routine: [],
      incident: {recordOpen: false, frame: 0, marked: [], inspected: false, proposed: false, serviced: false, verification: 0},
      handed: false, done: false
    };
  }

  function normalize(raw) {
    const input = plain(raw), s = fresh();
    if (input.version !== VERSION) return s;
    s.visits = list(input.visits, needed.visits);
    if (all(s.visits, needed.visits)) s.prep = list(input.prep, needed.prep);
    if (all(s.prep, needed.prep)) s.normal = list(input.normal, needed.normal);
    if (all(s.normal, needed.normal)) s.routine = list(input.routine, needed.routine);
    if (all(s.routine, needed.routine)) {
      const i = plain(input.incident);
      s.incident.recordOpen = i.recordOpen === true;
      s.incident.frame = integer(i.frame, 0, 5);
      s.incident.marked = i.recordOpen === true ? list(i.marked, [1, 4]) : [];
      s.incident.inspected = i.recordOpen === true && i.inspected === true;
      s.incident.proposed = s.incident.inspected && all(s.incident.marked, [1, 4]) && i.proposed === true;
      s.incident.serviced = s.incident.proposed && i.serviced === true;
      s.incident.verification = s.incident.serviced ? integer(i.verification, 0, 3) : 0;
    }
    const unlocked = !all(s.visits, needed.visits) ? 0 : !all(s.prep, needed.prep) ? 1 :
      !all(s.normal, needed.normal) ? 2 : !all(s.routine, needed.routine) ? 3 : s.incident.verification < 3 ? 4 : 5;
    s.phase = integer(input.phase, 0, unlocked, unlocked);
    s.handed = unlocked === 5 && input.handed === true;
    s.done = s.handed;
    return s;
  }

  function canAdvance(raw) {
    const s = normalize(raw);
    if (s.phase === 0) return all(s.visits, needed.visits);
    if (s.phase === 1) return all(s.prep, needed.prep);
    if (s.phase === 2) return all(s.normal, needed.normal);
    if (s.phase === 3) return all(s.routine, needed.routine);
    if (s.phase === 4) return s.incident.verification === 3;
    return s.handed;
  }

  function dispatch(raw, action) {
    const before = normalize(raw), s = clone(before), event = plain(action), context = plain(event.context);
    const type = typeof event.type === 'string' ? event.type : '', value = event.value;
    let message = '', error = false;
    const fail = text => { message = text; error = true; };
    const save = (field, id, text) => { if (!s[field].includes(id)) s[field].push(id); message = text; };
    const phaseOnly = phase => {
      if (s.phase === phase) return true;
      fail('Это действие относится к другому моменту смены. Продолжи текущее поручение.');
      return false;
    };

    if (type === 'reset') return {state: fresh(), message: 'Начинаем новую учебную смену.', error: false, changed: true};
    if (type === 'next') {
      if (s.phase >= 5) fail('Передай запись смены наставнику и оператору.');
      else if (!canAdvance(s)) fail([
        'Познакомься с датчиком, контроллером и механизмом группирования прямо на линии.',
        'Открой задание, эталонную запись и сообщение специалиста о готовности участка.',
        'Сохрани три живых наблюдения: распознавание, счёт и выпуск полной группы.',
        'Закончи внешний осмотр, сравнение сигналов и передачу наблюдения оператору.',
        'Заверши наблюдение полного прохода, пустого промежутка и повторного прохода.'
      ][s.phase]);
      else {
        s.phase += 1;
        message = [
          '',
          'Ты знаешь основные узлы. Перед сменой инженер знакомится с заданием и состоянием участка.',
          'Участок подготовлен специалистом. Наблюдай обычный цикл, не вмешиваясь в оборудование.',
          'Обычный цикл сохранён. Теперь выполни повседневные поручения инженера.',
          'Оператор сообщает: бутылки подошли, а группа не вышла. Участок остановлен; разберём запись события.',
          'Проверка завершена. Запись смены собрана из твоих наблюдений — передай её команде.'
        ][s.phase];
      }
    } else if (type === 'visit') {
      if (needed.visits.includes(value)) {
        save('visits', value, {
          sensor: 'S1 — датчик: замечает непрозрачную учебную бутылку и выдаёт сигнал. Инженер сравнивает его с реальным движением.',
          controller: 'Контроллер получает сигналы датчика, ведёт счёт и выдаёт предусмотренную команду. Его показания помогают понять работу линии.',
          group: 'Механизм выпускает полную группу после шести регистраций. За работой линии следит оператор; инженер проверяет согласованность узлов.'
        }[value]);
      } else fail('Выбери датчик, контроллер или механизм группирования.');
    } else if (type === 'read-task' && phaseOnly(1)) {
      save('prep', 'task', 'Задание смены: наблюдать распознавание и счёт. Учебная группа — шесть бутылок. Настройки и режимы меняет уполномоченный специалист.');
    } else if (type === 'read-log' && phaseOnly(1)) {
      save('prep', 'log', 'В эталонной записи: шесть проходов, шесть регистраций, один выпуск. В промежутке без бутылок событий нет — есть с чем сравнивать наблюдения.');
    } else if (type === 'inspect-ready' && phaseOnly(1)) {
      save('prep', 'ready', 'Специалист подтвердил готовность учебного участка: осмотр и предусмотренная подготовка выполнены. Ты знакомишься с записью рядом с наставником.');
    } else if (type === 'capture-sensor' && phaseOnly(2)) {
      if (!on(context.detected)) fail('Дождись бутылки в зоне S1: индикатор распознавания загорится. Тогда сохрани наблюдение.');
      else save('normal', 'sensor', 'Бутылка в зоне S1 — датчик выдал сигнал. Так физическое движение становится информацией для системы.');
    } else if (type === 'capture-controller' && phaseOnly(2)) {
      const count = number(context.count);
      if (!Number.isInteger(count) || count < 1 || count > 6) fail('Дождись, когда контроллер зарегистрирует бутылку: счёт на панели изменится.');
      else save('normal', 'controller', 'Контроллер зарегистрировал '+count+' из 6. Инженер сопоставляет счёт с движением, а не только смотрит на число.');
    } else if (type === 'capture-release' && phaseOnly(2)) {
      if (!on(context.released)) fail('Наблюдай до шести регистраций: механизм выпустит полную группу. Сохрани этот момент.');
      else save('normal', 'release', 'Шесть регистраций — механизм выпустил группу. Датчик, контроллер и исполнительный механизм отработали согласованно.');
    } else if (type === 'inspect-routine' && phaseOnly(3)) {
      save('routine', 'inspect', 'Внешний осмотр из предусмотренной зоны: подача равномерная, видимых повреждений и застрявших бутылок нет. Ты сохранил наблюдение; внутренний осмотр выполняет специалист.');
    } else if (type === 'compare-signals' && phaseOnly(3)) {
      if (Object.prototype.hasOwnProperty.call(context, 'output') && Object.prototype.hasOwnProperty.call(context, 'input') && context.output !== context.input) {
        fail('Выход и вход сейчас различаются. Сохрани событие для наставника; совпадение пока не подтверждено.');
      } else save('routine', 'signals', 'В обычном цикле выход S1 и вход контроллера совпадают. Такое сравнение помогает отличать распознавание от передачи сигнала.');
    } else if (type === 'send-operator' && phaseOnly(3)) {
      if (!all(s.normal, needed.normal)) fail('Сначала сохрани наблюдения обычного цикла, чтобы передать факты.');
      else save('routine', 'operator', 'Оператор получил наблюдения: бутылки распознаются, счёт соответствует проходам, полная группа выпускается. Совместные записи помогают замечать изменения.');
    } else if (type === 'open-record' && phaseOnly(4)) {
      s.incident.recordOpen = true;
      message = 'Открыта запись до остановки: шесть бутылок, четыре регистрации. Передача выхода S1 на вход контроллера совпадает. Найди проходы без распознавания.';
    } else if (type === 'frame' && phaseOnly(4)) {
      const frame = number(value);
      if (!s.incident.recordOpen) fail('Сначала открой запись события у контроллера.');
      else if (!Number.isInteger(frame) || frame < 0 || frame > 5) fail('Выбери один из шести проходов записи.');
      else { s.incident.frame = frame; message = 'Проход '+(frame+1)+': бутылка есть, выход S1 — '+signals[frame]+', вход контроллера — '+signals[frame]+'.'; }
    } else if ((type === 'mark-miss' || type === 'mark') && phaseOnly(4)) {
      const frame = value === undefined || value === '' ? s.incident.frame : number(value);
      if (!s.incident.recordOpen) fail('Сначала открой запись события.');
      else if (!Number.isInteger(frame) || frame < 0 || frame > 5) fail('Выбери проход записи.');
      else if (signals[frame] !== 0) fail('В этом проходе S1 распознал бутылку. Ищи момент, где бутылка есть, а выход датчика равен нулю.');
      else {
        s.incident.frame = frame;
        if (!s.incident.marked.includes(frame)) s.incident.marked.push(frame);
        message = 'Проход '+(frame+1)+' сохранён: бутылка прошла, распознавания нет. Вход повторяет выход — передача сообщения здесь совпадает.';
      }
    } else if (type === 'inspect-window' && phaseOnly(4)) {
      if (!s.incident.recordOpen) fail('Сначала изучи сообщение оператора и запись события.');
      else {
        s.incident.inspected = true;
        message = 'Специалист выполнил осмотр в безопасных условиях: на наружном оптическом окне матовый след; положение и крепление соответствуют отметкам. След может мешать распознаванию — проверим эту версию.';
      }
    } else if (type === 'propose-service' && phaseOnly(4)) {
      if (!all(s.incident.marked, [1, 4])) fail('Сохрани оба пропуска в записи: второй и пятый проходы.');
      else if (!s.incident.inspected) fail('Сначала ознакомься с результатом осмотра оптического окна специалистом.');
      else {
        s.incident.proposed = true;
        message = 'Наставнику переданы два пропуска и результат осмотра. Согласовано обслуживание наружного окна специалистом с последующей проверкой в прежних условиях.';
      }
    } else if (type === 'observe-service' && phaseOnly(4)) {
      if (!s.incident.proposed) fail('Передай наставнику наблюдения и согласуй следующий шаг.');
      else {
        s.incident.serviced = true;
        message = 'Квалифицированный специалист подготовил безопасные условия и обслужил наружное окно. Положение и настройки не менялись. Работа выполнена — результат ещё нужно проверить.';
      }
    } else if (type === 'observe-verification' && phaseOnly(4)) {
      const i = s.incident;
      if (!i.serviced) fail('Сначала наблюдай согласованную работу специалиста.');
      else if (i.verification >= 3) message = 'Оба полных прохода и пустой промежуток уже сохранены. Можно передавать результат.';
      else {
        const hasEvidence = Object.keys(context).length > 0;
        const gap = i.verification === 1;
        const valid = gap ? number(context.count) === 0 && !on(context.detected) : number(context.count) === 6 && on(context.released);
        if (hasEvidence && !valid) fail(gap ? 'Дождись пустого промежутка: счёт и сигнал должны быть нулевыми.' : 'Дождись полного прохода шести бутылок и выпуска группы. Частичного наблюдения пока недостаточно.');
        else {
          i.verification += 1;
          message = [
            '',
            'Проход A завершён: шесть бутылок распознаны, выход и вход совпали, группа выпущена. Дальше наблюдаем пустой промежуток.',
            'В пустом промежутке нет ложных регистраций. Остался повторный полный проход.',
            'Проход B завершён: шесть регистраций и выпуск второй группы. В проверенных условиях пропуски после обслуживания не повторились.'
          ][i.verification];
        }
      }
    } else if ((type === 'handoff' || type === 'handover') && phaseOnly(5)) {
      if (s.incident.verification !== 3) fail('Перед передачей заверши проверку результата.');
      else {
        s.handed = true;
        s.done = true;
        message = 'Запись смены передана наставнику и оператору. Ты изучил оборудование, проверил обычный цикл, сохранил наблюдения и проверку после обслуживания. Инженер помогает системе работать согласованно.';
      }
    } else if (!error) fail('Выбери доступное действие у оборудования.');

    const state = normalize(s);
    return {state, message, error, changed: JSON.stringify(state) !== JSON.stringify(before)};
  }

  function record(raw) {
    const s = normalize(raw), i = s.incident;
    return [
      {title: 'Оборудование', text: s.visits.length ? 'Изучены: '+s.visits.map(id => ({sensor: 'датчик S1', controller: 'контроллер', group: 'механизм группирования'})[id]).join(', ')+'.' : 'Знакомство с участком ещё впереди.'},
      {title: 'Подготовка', text: all(s.prep, needed.prep) ? 'Задание и эталонная запись изучены; сообщение специалиста о готовности участка получено. Учебная группа — шесть бутылок.' : 'Подготовительные сведения ещё не собраны.'},
      {title: 'Обычная смена', text: all(s.normal, needed.normal) ? 'Наблюдались распознавание, рост счёта и выпуск полной группы из шести бутылок.' : 'Наблюдения обычного цикла ещё не завершены.'},
      {title: 'Повседневные задачи', text: all(s.routine, needed.routine) ? 'Внешний осмотр сохранён, выход и вход сигнала сопоставлены, наблюдения переданы оператору.' : 'Поручения смены ещё выполняются.'},
      {title: 'Нештатная ситуация', text: all(i.marked, [1, 4]) ? 'В записи шесть проходов и четыре регистрации. Во втором и пятом проходах нет распознавания. Выход S1 совпадает со входом контроллера.' : 'Запись события ещё не разобрана.'},
      {title: 'Осмотр и работа специалиста', text: i.serviced ? 'При осмотре обнаружен след на наружном окне. Специалист обслужил его; положение и настройки не менялись.' : i.inspected ? 'На наружном оптическом окне обнаружен след. Его влияние на распознавание ещё предстоит проверить.' : 'Осмотр при необходимости выполняет квалифицированный специалист.'},
      {title: 'Проверка результата', text: i.verification === 3 ? 'Два прохода по шесть бутылок: все распознаны, сигналы совпадают, обе группы выпущены. В пустом промежутке — ноль событий.' : 'После работы требуется полный проход, пустой промежуток и повтор.'},
      {title: 'Передача смены', text: s.handed ? 'Наставник и оператор получили запись. При повторении сбоя нужно сохранить новое событие и сообщить наставнику.' : 'Запись собирается из выполненных действий и наблюдений.'}
    ];
  }

  function scene(raw, options) {
    const s = normalize(raw), opt = plain(options), i = s.incident;
    if (s.phase === 4 && i.recordOpen && !i.serviced && opt.historical !== false) {
      return {mode: 'historical', historical: true, status: 'Запись до остановки', frame: i.frame, physical: i.frame + 1, count: signals.slice(0, i.frame + 1).reduce((a, b) => a + b, 0), total: 6, sensor: signals[i.frame], controller: signals[i.frame], groups: 0, cleaned: false, signals: signals.slice()};
    }
    if (s.phase === 4 && i.serviced) {
      const gap = i.verification === 2, count = i.verification === 0 || gap ? 0 : 6;
      return {mode: 'verification', historical: false, status: i.verification === 3 ? 'Проверка завершена' : 'Наблюдение после обслуживания', physical: count, count, total: 6, sensor: count ? 1 : 0, controller: count ? 1 : 0, groups: i.verification === 3 ? 2 : i.verification ? 1 : 0, cleaned: true, signals: Array(count).fill(1)};
    }
    if (s.phase === 4) return {mode: 'stopped', historical: false, status: 'Оператор остановил участок', physical: 6, count: 4, total: 6, sensor: 0, controller: 0, groups: 0, cleaned: false, signals: signals.slice()};
    return {mode: s.phase >= 2 ? 'running' : 'orientation', historical: false, status: s.handed ? 'Смена передана' : s.phase >= 5 ? 'Проверено · готово к передаче' : s.phase >= 2 ? 'Обычная работа' : 'Знакомство с участком', physical: 6, count: 6, total: 6, sensor: 1, controller: 1, groups: s.phase >= 5 ? 2 : 1, cleaned: s.phase >= 5, signals: [1, 1, 1, 1, 1, 1]};
  }

  return Object.freeze({VERSION, phases, steps: phases, signals, needed, fresh, normalize, canAdvance, dispatch, record, scene});
});
