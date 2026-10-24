/* A small, deterministic learning journey. All numbers are fictional training data. */
(function(root){
  'use strict';
  const KEY='ochakovo-lab-story-v1';
  const steps=['welcome','intake','inspect','register','temperature','mix','portions','ref-control','ref-clean','ref-load','ref-close','ref-read','ref-record','ph-rinse','ph-dip','ph-read','ph-record','compare','report','repeat-clean','repeat-load','repeat-close','repeat-read','repeat-record','conclusion','finish'];
  const fresh=()=>({version:1,step:'welcome',checks:[],records:[],mistakes:0,discoveries:[],completed:false});
  function normalize(raw){
    if(!raw||raw.version!==1||!steps.includes(raw.step))return fresh();
    const index=steps.indexOf(raw.step),s=fresh();
    s.step=raw.step;s.checks=Array.isArray(raw.checks)?[...new Set(raw.checks.filter(x=>['number','source','seal'].includes(x)))]:[];
    if(index>2)s.checks=['number','source','seal'];
    s.records=[...(index>12?[{name:'Растворённые вещества',value:8.2,unit:'°Bx',kind:'original'}]:[]),...(index>16?[{name:'Кислотность',value:3.6,unit:'pH',kind:'ph'}]:[]),...(index>23?[{name:'Повторное измерение',value:8.3,unit:'°Bx',kind:'repeat'}]:[])];
    s.discoveries=Array.isArray(raw.discoveries)?[...new Set(raw.discoveries.filter(x=>['trace','prep','brix','ph','honesty','team'].includes(x)))]:[];
    s.mistakes=Number.isInteger(raw.mistakes)?Math.max(0,Math.min(raw.mistakes,10000)):0;
    s.completed=s.step==='finish';return s;
  }
  const next={welcome:'start',register:'register',temperature:'condition',mix:'mix',portions:'portion','ref-control':'control','ref-clean':'clean','ref-load':'drop','ref-close':'close','ref-read':'measure','ph-rinse':'rinse','ph-dip':'dip','ph-read':'measure',report:'notify','repeat-clean':'clean','repeat-load':'drop','repeat-close':'close','repeat-read':'measure'};
  function transition(current,action,value){
    const s=normalize(current);let accepted=false,message='',animation='';
    const advance=()=>{s.step=steps[steps.indexOf(s.step)+1];accepted=true;};
    const learn=id=>{if(!s.discoveries.includes(id))s.discoveries.push(id);};
    const wrong=text=>{s.mistakes++;message=text;};
    if(s.step==='intake'&&action==='sample'){
      if(value==='07')advance();else wrong('В направлении указана проба 07. У соседней бутылки другой номер — её результат относится к другому образцу. Найди нужную пробу.');
    }else if(s.step==='inspect'&&action==='inspect'){
      if(['number','source','seal'].includes(value)){if(!s.checks.includes(value))s.checks.push(value);accepted=true;if(s.checks.length===3){advance();learn('trace');}}
    }else if(['ref-record','ph-record','repeat-record'].includes(s.step)&&action==='record'){
      const expected=s.step==='ph-record'?3.6:s.step==='repeat-record'?8.3:8.2;
      const n=Number(String(value??'').trim().replace(',','.'));
      if(Math.abs(n-expected)<.001){const kind=s.step==='ph-record'?'ph':s.step==='repeat-record'?'repeat':'original';s.records.push({name:kind==='ph'?'Кислотность':kind==='repeat'?'Повторное измерение':'Растворённые вещества',value:expected,unit:kind==='ph'?'pH':'°Bx',kind});learn(kind==='ph'?'ph':'brix');advance();animation='record';}
      else wrong('Перенеси именно показание прибора. Записывать удобное или ожидаемое число нельзя. Можно использовать запятую или точку.');
    }else if(s.step==='compare'&&action==='compare'){
      if(value==='brix'){advance();learn('honesty');}else wrong('pH 3,6 находится между 3,2 и 4,0. А 8,2 °Bx ниже нижней границы 9,0. Сравни оба результата с их учебными диапазонами.');
    }else if(s.step==='conclusion'&&action==='conclusion'){
      if(value==='report'){advance();learn('team');s.completed=true;}else wrong(value==='fix'?'Лаборант не подгоняет состав напитка под число на приборе. Его задача — сохранить данные и сообщить об отклонении.':'Одного нормального показателя недостаточно. Отклонение подтвердилось при повторе; передай обе записи ответственному специалисту.');
    }else if(next[s.step]===action){
      const old=s.step;advance();animation=action;
      if(old==='portions')learn('prep');
    }else if(action==='skip-prep')wrong('Условия влияют на измерение. По нашей учебной методике сначала нужно подготовить температуру пробы и перемешать её.');
    return {state:s,accepted,message,animation};
  }
  const api={KEY,steps,fresh,normalize,transition};
  if(typeof module!=='undefined'&&module.exports)module.exports=api;
  if(root)root.LabStoryModel=api;
})(typeof window!=='undefined'?window:null);
