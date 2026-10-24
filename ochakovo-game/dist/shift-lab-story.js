(() => {
 'use strict';
 for(const name of ['lab-story.css','lab-story-stages.css']){const css=document.createElement('link');css.rel='stylesheet';css.href=new URL(name+'?v=4',document.currentScript.src).href;document.head.append(css);}
 const learned='Принял и подготовил пробу, измерил °Brix и pH, сохранил исходные показания и повтор, передал подтверждённое отклонение специалисту качества.';
 Object.assign(window.OchakovoShift.roles.lab,{lead:'По ту сторону этикетки: твоя первая смена в рисованной лаборатории.',learned,tools:'Маркированные пробы, рефрактометр, pH-метр и лабораторный журнал.'});
 window.GameMissions.list.find(x=>x.id==='lab').minutes=8;
 window.OchakovoShift.register('lab',a=>{
  let game,finished=false;
  a.root.classList.add('lab-story-shell');
  return {start(){game=window.LabStory.mount(a.content,{onComplete(){finished=true;const b=document.createElement('button');b.dataset.do='finish';b.hidden=true;a.root.append(b);b.click();b.remove();}});},act(){},done:()=>finished,result:()=>({learned}),cleanup(){game?.destroy();},managesFocus:true};
 });
})();
