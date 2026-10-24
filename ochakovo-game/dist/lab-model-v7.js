/* Educational scenario. Values are not Ochakovo product specifications. */
(() => {
  'use strict';
  const data=Object.freeze({sample:'L-041',batch:'P-214',tank:'T-07',titre:34,brix:9.2,control:10,titreRange:[3.2,3.6],brixRange:[9.8,10.2]});
  const fresh=()=>({v:7,started:false,phase:0,checks:[],registered:false,prep:0,method:'',rig:false,volume:0,mixed:true,observed:false,titreSaved:false,control:false,clean:false,loaded:false,cover:false,read:false,brixSaved:false,noticed:false,judgement:'',reported:false,repeatStage:0,repeatCover:false,done:false});
  const maxPhase=s=>s.reported?4:s.titreSaved&&s.brixSaved?3:s.prep===3?2:s.registered?1:0;
  function normalize(r){
    if(!r||![6,7].includes(r.v))return fresh();
    const s=fresh();
    for(const k of Object.keys(s))if(typeof s[k]==='boolean'&&typeof r[k]==='boolean')s[k]=r[k];
    s.checks=[...new Set((Array.isArray(r.checks)?r.checks:[]).filter(k=>['label','source','seal'].includes(k)))];
    for(const [k,max] of [['prep',3],['volume',50],['repeatStage',4]])s[k]=Math.max(0,Math.min(max,Math.round(Number(r[k])||0)));
    s.method=['titre','brix'].includes(r.method)?r.method:'';
    s.judgement=['hold','release','fix'].includes(r.judgement)?r.judgement:'';
    if(!s.started)return fresh();
    if(s.registered)s.checks=['label','source','seal'];else s.prep=0;
    if(s.prep<3)Object.assign(s,{rig:false,volume:0,mixed:true,observed:false,titreSaved:false,control:false,clean:false,loaded:false,cover:false,read:false,brixSaved:false});
    if(!s.rig){s.volume=0;s.mixed=true;s.titreSaved=false;}
    if(s.volume!==data.titre||!s.mixed)s.titreSaved=s.observed=false;
    if(s.titreSaved)s.observed=true;
    if(!s.control)s.clean=s.loaded=s.cover=s.read=s.brixSaved=false;
    if(!s.clean)s.loaded=s.cover=s.read=s.brixSaved=false;
    if(!s.loaded)s.cover=s.read=s.brixSaved=false;
    if(!s.cover)s.read=s.brixSaved=false;
    if(s.brixSaved)s.read=true;
    if(!s.titreSaved||!s.brixSaved){s.noticed=false;s.judgement='';s.reported=false;}
    if(s.judgement)s.noticed=true;
    if(s.judgement!=='hold')s.reported=false;
    if(!s.reported){s.repeatStage=0;s.repeatCover=false;s.done=false;}
    if(s.repeatStage<2)s.repeatCover=false;
    if(s.repeatStage>=3&&!s.repeatCover)s.repeatStage=2;
    if(s.repeatStage<4)s.done=false;
    s.phase=Math.max(0,Math.min(maxPhase(s),Math.trunc(Number(r.phase)||0)));
    return s;
  }
  function transition(state,type,value){
    let s={...state,checks:[...state.checks]},note='',bad=false,motion='',changed=false;
    const tell=(text,isBad=false)=>{note=text;bad=isBad;};
    const change=animation=>{changed=true;motion=animation||type;};
    if(type==='restart')return {state:fresh(),note:'',bad:false,motion:'restart',changed:true};
    if(type==='start'){s.started=true;change('start');}
    else if(type==='phase'){
      const n=Number(value);if(Number.isInteger(n)&&n>=0&&n<=maxPhase(s)){s.phase=n;change('phase');}
    }else if(s.phase===0){
      if(type==='inspect'&&['label','source','seal'].includes(value)){if(!s.checks.includes(value))s.checks.push(value);change('inspect');}
      if(type==='register'&&s.checks.length===3){s.registered=true;s.phase=1;change('phase');tell('Проба L-041 зарегистрирована. Теперь подготовим её к исследованиям.');}
    }else if(s.phase===1){
      if(type==='prepare'&&s.prep<3){s.prep++;change('prepare-'+s.prep);}
      if(type==='to-tests'&&s.prep===3){s.phase=2;change('phase');}
    }else if(s.phase===2){
      if(type==='method'&&['titre','brix'].includes(value)){s.method=value;change('method');}
      if(s.method==='titre'){
        if(type==='rig'&&!s.rig){s.rig=true;change();tell('Установка проверена наставником. Начальный отсчёт: 0,0 мл.');}
        if(type==='dose'&&[1,10].includes(Number(value))&&s.rig&&s.mixed&&!s.titreSaved&&s.volume<=data.titre){s.volume=Math.min(50,s.volume+Number(value));s.mixed=false;s.observed=false;change('dose');}
        if(type==='mix'&&s.rig&&!s.mixed){s.mixed=true;change('mix');if(s.volume>data.titre)tell('Окраска слишком яркая: конечная точка пройдена. Возьми новую порцию.',true);else if(s.volume<data.titre&&s.volume>=30)tell('После перемешивания окраска исчезла. Продолжай по капле.');}
        if(type==='observe'&&s.rig&&s.mixed&&s.volume>0&&s.volume<=data.titre){
          const persists=s.volume===data.titre;
          if(value==='persists'&&persists){s.observed=true;change('observe');tell('Слабая розовая окраска сохраняется. Наблюдение верное — запиши расход.');}
          else if(value==='fades'&&!persists){change('observe');tell('Верно, окраска исчезла. Нужно продолжить добавление.');}
          else tell(persists?'Посмотри на раствор: после перемешивания остаётся слабая розовая окраска.':'Окраска исчезла после перемешивания. Добавь ещё титрант и проверь снова.',true);
        }
        if(type==='retry-titre'){s.rig=false;s.volume=0;s.mixed=true;s.observed=false;change('retry');tell('Новая порция готова. Попробуй перейти на капли раньше.');}
        if(type==='save-titre'&&s.volume===data.titre&&s.mixed&&s.observed&&!s.titreSaved){s.titreSaved=true;change('record');tell('3,4 мл — в журнале. Результат останется связан с пробой L-041.');}
      }
      if(s.method==='brix'){
        if(type==='control'&&!s.control){s.control=true;change('control');tell('Контроль совпал: 10,0 °Bx. Удали контрольный раствор перед пробой.');}
        if(type==='clean'&&s.control&&!s.clean){s.clean=true;change('clean');}
        if(type==='load'&&s.clean&&!s.loaded){s.loaded=true;change('load');}
        if(type==='cover'&&s.loaded&&!s.cover){s.cover=true;change('cover');}
        if(type==='stable'&&s.cover&&!s.read){s.read=true;change('stable');tell('Показание стабильно. Сохрани 9,2 °Bx в журнале.');}
        if(type==='save-brix'&&s.read&&!s.brixSaved){s.brixSaved=true;change('record');tell('9,2 °Bx — в журнале. Записано именно показание прибора.');}
      }
      if(type==='to-results'&&s.titreSaved&&s.brixSaved){s.phase=3;change('phase');}
    }else if(s.phase===3){
      if(type==='notice'){
        if(value==='brix'){s.noticed=true;change('notice');tell('9,2 °Bx ниже учебного диапазона. Теперь реши, что передать команде.');}
        else tell('3,4 мл внутри учебного диапазона. Проверь второй результат.',true);
      }
      if(type==='judgement'&&s.noticed&&['hold','release','fix'].includes(value)){s.judgement=value;change('choice');}
      if(type==='report'&&s.judgement){
        if(s.judgement==='hold'){s.reported=true;s.phase=4;change('phase');}
        else tell(s.judgement==='fix'?'Состав пробы менять нельзя. Передай фактическое отклонение.':'Результат ниже диапазона нельзя игнорировать. Передай отклонение специалисту качества.',true);
      }
    }else if(s.phase===4){
      if(type==='repeat-clean'&&s.repeatStage===0){s.repeatStage=1;change('clean');}
      if(type==='repeat-load'&&s.repeatStage===1){s.repeatStage=2;change('load');}
      if(type==='repeat-cover'&&s.repeatStage===2&&!s.repeatCover){s.repeatCover=true;change('cover');}
      if(type==='stable'&&s.repeatStage===2&&s.repeatCover){s.repeatStage=3;change('stable');tell('Повтор: 9,2 °Bx. Сохрани его отдельной записью.');}
      if(type==='repeat-save'&&s.repeatStage===3){s.repeatStage=4;change('record');tell('Повтор записан отдельно. Исходное показание сохранено.');}
      if(type==='handover'&&s.repeatStage===4&&!s.done){s.done=true;change('handover');tell('Наставник принял обе записи. Решение по партии остаётся за специалистом качества.');}
    }
    return {state:s,note,bad,motion,changed};
  }
  window.OchakovoLabModel={data,fresh,normalize,maxPhase,transition};
})();
