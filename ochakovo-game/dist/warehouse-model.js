/* Fictional training order. UI and tests share the state transitions. */
((root, factory) => {
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  else root.WarehouseTraining = api;
})(typeof window === 'undefined' ? globalThis : window, () => {
  'use strict';
  const products = [
    { sku:'CC-B05', brand:'CoolCola', format:'ПЭТ 0,5 л', units:12, kind:'bottle', address:'A-01-01', need:2, prefix:'CB', stock:4, tone:'cola' },
    { sku:'CC-C033', brand:'CoolCola', format:'Банка 0,33 л', units:24, kind:'can', address:'A-01-02', need:1, prefix:'CC', stock:3, tone:'cola' },
    { sku:'FA-B05', brand:'Fancy', format:'ПЭТ 0,5 л', units:12, kind:'bottle', address:'A-02-01', need:3, prefix:'FA', stock:3, tone:'fancy' },
    { sku:'ST-B05', brand:'Street', format:'ПЭТ 0,5 л', units:12, kind:'bottle', address:'B-01-01', need:0, prefix:'ST', stock:3, tone:'street' },
    { sku:'TO-C033', brand:'Toness', format:'Банка 0,33 л', units:24, kind:'can', address:'B-02-01', need:0, prefix:'TO', stock:3, tone:'toness' }
  ];
  const getProduct = sku => products.find(p => p.sku === sku);
  const totalNeed = products.reduce((n,p) => n + p.need, 0);
  const unitNeed = products.reduce((n,p) => n + p.need * p.units, 0);
  function create() {
    const boxes = products.flatMap(p => Array.from({length:p.stock},(_,i) => ({ id:`${p.prefix}-${String(i+1).padStart(2,'0')}`, sku:p.sku, address:p.address, location:'rack', scanned:false, inspection:null, damaged:p.prefix==='FA' && i===2 })));
    boxes.push({id:'FA-04',sku:'FA-B05',address:'R-01-01',location:'reserve',scanned:false,inspection:null,damaged:false});
    const state = {started:false,boxes,revision:0,checkedRevision:-1,checks:0,issues:[],history:[],problem:{detected:false,reason:'',reported:false,quarantined:false},released:false,transferred:false};
    const selected = () => state.boxes.filter(b => b.location === 'order');
    const box = id => state.boxes.find(b => b.id === id);
    const log = (type, data={}) => state.history.push({type,...data});
    const change = () => { state.revision++; };
    const editable = () => state.started && !state.transferred;
    const available = b => b && (b.location==='rack' || (b.location==='reserve' && state.released));
    const rows = () => products.map(p => ({...p,actual:selected().filter(b => b.sku===p.sku).length}));
    function problems() {
      const result = [];
      rows().forEach(p => {
        if (p.actual!==p.need) result.push({kind:'count',sku:p.sku,message:p.need===0 ? `${p.brand}: нет в задании, собрано ${p.actual}` : `${p.brand} · ${p.format}: ${p.actual>p.need?'лишних':'не хватает'} ${Math.abs(p.actual-p.need)} кор.`,need:p.need,actual:p.actual});
      });
      selected().forEach(b => {
        if (!b.scanned) result.push({kind:'scan',id:b.id,sku:b.sku,message:`${b.id}: коробка не сканирована`});
        if (!b.inspection) result.push({kind:'inspect',id:b.id,sku:b.sku,message:`${b.id}: упаковка не осмотрена`});
        if (b.inspection==='damage') result.push({kind:'damage',id:b.id,sku:b.sku,message:`${b.id}: повреждённая упаковка в заказе`});
      });
      if (!state.problem.reported || !state.problem.quarantined) result.push({kind:'problem',id:'FA-03',sku:'FA-B05',message:state.problem.detected ? 'FA-03: передай сообщение и направь коробку на проверку' : 'Для третьей Fancy проверь оставшуюся коробку в A-02-01'});
      return result;
    }
    const ready = () => editable() && state.checkedRevision===state.revision && problems().length===0;
    return {
      state,box,selected,rows,available,problems,ready,
      start(){state.started=true;log('start');},
      scan(id){const b=box(id);if(!editable() || !b || b.location==='review' || (!available(b)&&b.location!=='order'))return false;b.scanned=true;change();log('scan',{id,sku:b.sku});return true;},
      inspect(id,decision){const b=box(id);if(!editable() || !b || (!available(b)&&b.location!=='order'))return false;
        if ((decision==='good' && b.damaged) || (decision==='damage' && !b.damaged)) return false;
        if (!['good','damage'].includes(decision)) return false;
        b.inspection=decision;if(b.damaged)state.problem.detected=true;change();log('inspect',{id,decision});return true;},
      add(id){const b=box(id);if(!editable() || !available(b) || b.inspection==='damage')return false;b.location='order';change();log('add',{id,sku:b.sku});return true;},
      returnBox(id){const b=box(id);if(!editable() || !b || b.location!=='order' || b.inspection==='damage')return false;b.location=b.id==='FA-04'?'reserve':'rack';change();log('return',{id,sku:b.sku});return true;},
      verify(){if(!editable())return [];state.issues=problems();state.checkedRevision=state.revision;state.checks++;log('check',{issues:state.issues.map(x=>({...x}))});return state.issues;},
      reason(value){if(!editable() || !state.problem.detected || state.problem.reported)return false;state.problem.reason=value;return true;},
      report(){if(!editable() || !state.problem.detected || state.problem.reason!=='tear')return false;if(state.problem.reported)return true;state.problem.reported=true;state.released=true;change();log('report',{id:'FA-03',recipient:'Кладовщик',reason:'Надрыв стенки коробки'});return true;},
      quarantine(){if(!editable() || !state.problem.reported)return false;const b=box('FA-03');b.location='review';state.problem.quarantined=true;change();log('quarantine',{id:'FA-03'});return true;},
      transfer(){if(!ready())return false;state.transferred=true;log('transfer');return true;},
      summary(){
        const result=['Заказ F-78 передан в зону отгрузки: 6 коробок, 3 позиции.'];
        const returns=state.history.filter(e=>e.type==='return');
        if(returns.length) result.push(`Вернул коробки на хранение: ${returns.length}.`);
        const checks=state.history.filter(e=>e.type==='check');
        if(checks[0] && !checks[0].issues.some(e=>e.kind==='count')) result.push('Состав совпал при первой сверке.');
        else if(checks.some(c=>c.issues.some(e=>e.kind==='count')))result.push('Исправил расхождения и повторно сверил состав.');
        if(state.problem.reported && state.problem.quarantined && box('FA-04').location==='order')result.push('Сообщил кладовщику о повреждении FA-03 и проверил замену FA-04.');
        return result.join(' ');
      }
    };
  }
  return {products,getProduct,totalNeed,unitNeed,create};
});
