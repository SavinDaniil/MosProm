/* Rules for the two illustrated episodes. No outcome depends on animation. */
(function (global) {
  'use strict';
  const bottles = [
    {id:'B-01', defect:'', title:'Образец в потоке'},
    {id:'B-02', defect:'cap', title:'Бутылка после укупорки'},
    {id:'B-03', defect:'code', title:'Бутылка после маркировки'},
    {id:'B-04', defect:'level', title:'Бутылка после наполнения'}
  ];
  const cartons = [
    {id:'CC-01', brand:'CoolCola', format:'ПЭТ · 1 л', units:6, sku:'CC-P100', batch:'У-17', zone:'A', color:'#be3841'},
    {id:'CC-02', brand:'CoolCola', format:'Банка · 0,33 л', units:24, sku:'CC-C033', batch:'У-18', zone:'B', color:'#be3841'},
    {id:'FA-01', brand:'Fancy', format:'ПЭТ · 0,5 л', units:12, sku:'FA-P050', batch:'Ф-12', zone:'C', color:'#d88a35'},
    {id:'FA-02', brand:'Fancy', format:'ПЭТ · 0,5 л', units:12, sku:'FA-P050', batch:'Ф-12', zone:'C', damage:true, color:'#d88a35'},
    {id:'KV-01', brand:'Очаковский', format:'ПЭТ · 1,5 л', units:6, sku:'KV-P150', batch:'К-09', zone:'C', color:'#8f6b37'},
    {id:'FA-03', brand:'Fancy', format:'ПЭТ · 0,5 л', units:12, sku:'FA-P050', batch:'Ф-12', zone:'C', reserve:true, color:'#d88a35'}
  ];
  const order = [{sku:'CC-P100',count:1},{sku:'FA-P050',count:2}];
  const initial = kind => kind==='line'
    ? {kind, phase:0, fields:[], route:[], inspected:{}, decisions:{}, logged:false, notified:false, trial:false, packed:[], done:false}
    : {kind, phase:0, fields:[], scanned:[], inspected:[], placed:{}, reported:false, picked:[], verified:false, done:false};
  function create(kind, history=[]) {
    if(!['line','warehouse'].includes(kind))throw Error('Unknown episode');
    const s=initial(kind), events=[];
    const yes=message=>({ok:true,message}), no=message=>({ok:false,message});
    function reduce(type,value) {
      if(s.done)return no('Смена уже завершена. Открытие можно записать в паспорт.');
      if(type==='field'&&s.phase===0&&['brand','format','batch'].includes(value)) {
        if(!s.fields.includes(value))s.fields.push(value);
        return yes('Поле сверено с заданием. Проверь остальные данные маркировки.');
      }
      if(kind==='line') {
        if(type==='sample'&&s.phase===0) {
          if(value!=='У-17')return no('В задании партия У-17. Здесь другой код: найди бутылку с нужной маркировкой.');
          if(s.fields.length<3)return no('Сначала сверь на этикетке название, формат и партию: нажми на каждое из трёх полей.');
          s.phase=1;return yes('Совпало: CoolCola, ПЭТ 1 л, партия У-17. Теперь проследи путь бутылки.');
        }
        if(type==='station'&&s.phase===1) {
          const route=['fill','cap','label','pack'];
          if(value!==route[s.route.length])return no('Сначала наполнить тару, затем закрыть крышкой, нанести маркировку и упаковать. Попробуй следующий узел.');
          s.route.push(value);if(s.route.length===4)s.phase=2;
          return yes(s.phase===2?'Путь собран. Теперь проверь четыре бутылки: уровень, крышку и код.':'Верно. Выбери следующий узел на линии.');
        }
        const b=bottles.find(b=>b.id===value?.split(':')[0]);
        if(type==='lens'&&s.phase===2&&b) {
          const part=value.split(':')[1];if(!['level','cap','code'].includes(part))return no('Выбери участок бутылки.');
          s.inspected[b.id]||=[];if(!s.inspected[b.id].includes(part))s.inspected[b.id].push(part);
          const observations={level:'Видимый уровень сопоставим с образцом.',cap:'Крышка расположена ровно.',code:'Код У-17 читается и совпадает с заданием.'};
          const defects={level:'Уровень заметно ниже образца. Точное количество подтверждают измерением.',cap:'Крышка наклонена. Видимого признака достаточно, чтобы направить бутылку на проверку.',code:'На бутылке код У-16. В задании У-17: данные не совпадают.'};
          return yes(b.defect===part?defects[part]:observations[part]);
        }
        if(type==='decide'&&s.phase===2&&b) {
          const decision=value.split(':')[1], seen=s.inspected[b.id]||[];
          if(seen.length<3)return no('Осмотри все три участка: уровень, крышку и код. Кнопки увеличения находятся на бутылке.');
          if(decision!==(b.defect?'review':'pass'))return no(b.defect?'Есть отклонение. Направь бутылку на контроль; её нельзя включать в упаковку.':'Видимых отклонений нет. По условиям учебного задания бутылка может продолжить путь.');
          s.decisions[b.id]=decision;if(Object.keys(s.decisions).length===4)s.phase=3;
          return yes(s.phase===3?'Четыре решения записаны. У следующей бутылки снова перекос крышки. Разберём повтор.':b.defect?'Бутылка отделена и ожидает контроля.':'Бутылка продолжает маршрут. Это не заменяет предусмотренные измерения качества.');
        }
        if(type==='log'&&s.phase===3){s.logged=true;return yes('Записано: партия У-17, выход укупорки, повторный перекос крышки. Причину ещё проверит специалист.');}
        if(type==='response'&&s.phase===3) {
          if(value!=='mentor')return no(value==='repair'?'Вмешательство в оборудование выполняет подготовленный сотрудник. Передай наблюдение наставнику.':'Повторное отклонение нельзя пропускать. Запиши факт и сообщи наставнику.');
          if(!s.logged)return no('Сначала открой журнал и зафиксируй, где и что повторяется.');
          s.notified=true;s.phase=4;return yes('Наставник остановил участок и пригласил инженера. Продукция с отклонениями остаётся на контроле.');
        }
        if(type==='trial'&&s.phase===4){s.trial=true;return yes('Проверочный образец: крышка ровная. Инженер подтвердил работу узла. Ранее отделённая продукция всё ещё ожидает решения качества.');}
        if(type==='release'&&s.phase===4) {
          if(!s.trial)return no('Сначала осмотри проверочный образец после работы специалиста.');
          if(value!=='separate')return no('Проверка оборудования не снимает контроль с ранее отделённых бутылок. Выбери раздельные решения.');
          s.phase=5;return yes('Верно: линия работает после проверки, B-02–B-04 остаются на контроле. Собери упаковку из трёх допущенных бутылок.');
        }
        if(type==='pack'&&s.phase===5) {
          if(!['B-01','B-05','B-06'].includes(value))return no('Эта бутылка на контроле. Для упаковки выбери только допущенную продукцию.');
          if(!s.packed.includes(value))s.packed.push(value);
          return yes('Бутылка '+value+' включена в упаковку. Готово '+s.packed.length+' из 3.');
        }
        if(type==='handoff'&&s.phase===5){if(s.packed.length!==3)return no('Для учебной упаковки нужны три допущенные бутылки.');s.done=true;return yes('Упаковка и запись о контроле переданы складской команде.');}
      } else {
        if(type==='receipt'&&s.phase===0){if(s.fields.length<3)return no('Нажми на название, формат и партию на маркировке, чтобы сверить их с накладной.');s.phase=1;return yes('Приёмка началась. Сканируй коробку, осмотри упаковку и выбери адрес.');}
        const c=cartons.find(c=>c.id===value?.split(':')[0]);
        if(type==='scan'&&s.phase===1&&c&&(!c.reserve||s.reported)) {
          if(!s.scanned.includes(c.id))s.scanned.push(c.id);
          return yes('Считано: '+c.sku+' · '+c.format+' · '+c.units+' шт. Сканер определяет товар; состояние коробки проверь отдельно.');
        }
        if(type==='inspect'&&s.phase===1&&c&&(!c.reserve||s.reported)) {
          if(!s.inspected.includes(c.id))s.inspected.push(c.id);
          return yes(c.damage?'Надрыв боковой стенки. Открой сообщение кладовщику и направь коробку в зону контроля.':'Стенки и края целые. Теперь сопоставь код и формат с адресом хранения.');
        }
        if(type==='report'&&s.phase===1) {
          if(!s.inspected.includes('FA-02'))return no('Сначала осмотри FA-02: сообщение должно содержать наблюдаемый факт.');
          if(value!=='tear')return no('Код совпадает, коробку не вскрывали. Зафиксируй именно видимый надрыв стенки.');
          s.reported=true;return yes('Кладовщик получил сообщение о FA-02 и открыл замену FA-03 из резерва. Повреждённую коробку отдельно направь на контроль.');
        }
        if(type==='place'&&s.phase===1&&c&&(!c.reserve||s.reported)) {
          if(!s.scanned.includes(c.id)||!s.inspected.includes(c.id))return no('Перед размещением нужны два действия: сканирование маркировки и осмотр упаковки.');
          const zone=value.split(':')[1];
          if(c.damage&&!s.reported)return no('О повреждении нужно сообщить кладовщику, затем направить коробку в зону контроля.');
          if(zone!==(c.damage?'Q':c.zone))return no(c.damage?'Повреждённую упаковку размещают отдельно в зоне контроля.':'Адрес не подходит. Сверь формат и код: ПЭТ CoolCola — A, банка CoolCola — B, Fancy и квас — C.');
          s.placed[c.id]=zone;
          if(cartons.every(x=>s.placed[x.id]))s.phase=2;
          return yes(s.phase===2?'Вся продукция размещена. Теперь собери F-78 по двум позициям заказа.':c.damage?'FA-02 изолирована в зоне контроля. Для замены возьми FA-03.':'Коробка '+c.id+' размещена по адресу '+zone+'.');
        }
        if(type==='pick'&&s.phase===2&&c&&s.placed[c.id]&&s.placed[c.id]!=='Q') {
          if(s.picked.includes(c.id))s.picked=s.picked.filter(id=>id!==c.id);else s.picked.push(c.id);
          s.verified=false;return yes('Состав изменён. Сверь формат и количество по накладной.');
        }
        if(type==='verify'&&s.phase===2) {
          const counts={};s.picked.forEach(id=>{const c=cartons.find(c=>c.id===id);counts[c.sku]=(counts[c.sku]||0)+1;});
          if(order.some(row=>(counts[row.sku]||0)!==row.count)||Object.keys(counts).some(sku=>!order.some(row=>row.sku===sku)))return no('Состав не совпал: нужно CoolCola ПЭТ 1 л × 1 и Fancy ПЭТ 0,5 л × 2. Банка и квас не входят в заказ. Нажми на лишнюю коробку, чтобы вернуть её.');
          s.verified=true;return yes('F-78 совпал: 3 коробки, 30 единиц. Повреждённая FA-02 в контроле, замена FA-03 в заказе. Можно передавать.');
        }
        if(type==='handoff'&&s.phase===2){if(!s.verified)return no('Готовность подтверждает актуальная сверка. Сначала сверь состав F-78.');s.done=true;return yes('Заказ F-78 и запись о замене переданы в зону отгрузки.');}
      }
      return no('Сначала выполни текущий шаг.');
    }
    function dispatch(type,value='') {
      const before=JSON.stringify(s);
      const result=reduce(type,String(value));
      if(result.ok&&before!==JSON.stringify(s))events.push([type,String(value)]);
      return result;
    }
    if(Array.isArray(history))history.slice(0,250).forEach(event=>{if(Array.isArray(event)&&event.length===2&&typeof event[0]==='string'&&typeof event[1]==='string')dispatch(...event);});
    return {state:s,dispatch,history:()=>events.map(e=>e.slice()),summary:()=>kind==='line'?'Сверил маркировку У-17, проследил четыре узла, осмотрел четыре бутылки, передал повторное отклонение наставнику и собрал упаковку из допущенной продукции.':'Сверил маркировку и адреса, разместил шесть коробок, сообщил о повреждении FA-02, взял замену FA-03 и передал проверенный F-78: 3 коробки, 30 единиц.'};
  }
  const api={create,bottles,cartons,order};
  if(typeof module==='object'&&module.exports)module.exports=api;
  else global.OchakovoFloorModel=api;
})(typeof window!=='undefined'?window:globalThis);
