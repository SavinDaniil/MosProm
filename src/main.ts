import './style.css';
import './revision.css';
import {initialState,transition,saveGame,loadGame} from './model.ts';
import type {Action,Field,FieldKey,Decision} from './model.ts';
import {visitors,departmentResponse,historyText} from './scenario.ts';
import type {Interest} from './scenario.ts';
import {DeskAudio} from './audio.ts';

type DocumentId='pass'|'request'|'journal'|'rules'|'news'|'checklist'|'response';
const root=document.querySelector<HTMLDivElement>('#app')!;
let state=loadGame()??initialState();
let activeDoc:DocumentId=state.phase==='briefing'?'rules':state.phase==='newspaper'?'news':'pass';
let showAbout=false,showReset=false,storageAvailable=true,showJournal=false,newsRead=false;
let sceneKey='',docKey='';
let departureAt:number|null=null,stampAt:number|null=null;
const pages:Record<string,number>={rules:0,news:0,journal:0};
const pagedDocuments=new Set<string>();
const referenceKey=(id:string)=>`${id}:${state.phase}:${innerWidth}x${innerHeight}`;
const sound=new DeskAudio();
const fields=new Map<string,Field>();
const esc=(v:unknown)=>String(v).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]!));
const portrait=(id:string)=>`/assets/${id}-print.webp`;
const documentsTogether=()=>innerWidth>760&&innerHeight>550;
const logo=()=>'<img class="brand" src="/assets/logo.svg" alt="Очаково — натуральные напитки" width="160" height="38">';
function icon(name:string){
  const paths:Record<string,string>={sound:'<path d="m4 9 4 0 5-4v14l-5-4H4zM17 8q5 4 0 8"/>',mute:'<path d="m4 9 4 0 5-4v14l-5-4H4zM17 9l5 6m0-6-5 6"/>',info:'<circle cx="12" cy="12" r="9"/><path d="M12 11v6m0-11v1"/>',reset:'<path d="M4 10a8 8 0 1 1 1 8M4 3v7h7"/>',pass:'<rect x="3" y="5" width="18" height="15"/><circle cx="8" cy="11" r="2"/><path d="M5 17q3-5 6 0m3-7h4m-4 4h4M9 5V2h6v3"/>',request:'<path d="M6 3h9l4 4v14H6zM14 3v5h5M9 12h7m-7 4h7"/>',journal:'<path d="M4 4h16v17H4zM8 4V2m8 2V2M8 9h8m-8 4h8m-8 4h5"/>',rules:'<path d="m12 3 8 3v6q-1 6-8 9-7-3-8-9V6zM8 12l3 3 5-6"/>',news:'<path d="M3 5h18v15H3zM6 8h12M6 11h5v6H6zm8 0h4m-4 3h4m-4 3h4"/>',checklist:'<rect x="5" y="4" width="15" height="18"/><path d="M9 4V2h7v2M8 10l1 1 2-3m2 2h4m-9 6 1 1 2-3m2 2h4"/>',phone:'<path d="M7 3 3 5q-1 11 15 16l3-4-5-4-3 3q-5-2-5-6l3-2z"/>',arrow:'<path d="M4 12h16m-6-6 6 6-6 6"/>'};
  return `<svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${paths[name]??paths.request}</svg>`;
}
function send(action:Action){
  const oldPhase=state.phase,oldVisitor=state.visitor;
  state=transition(state,action);sound.muted=state.muted;storageAvailable=saveGame(state);
  if(action.type==='decide'&&oldPhase==='inspection'&&state.phase==='result'){departureAt=performance.now();stampAt=departureAt;sound.play('stamp');}
  else sound.play(action.type==='request'?'phone':'button');
  if(oldVisitor!==state.visitor){activeDoc='pass';showJournal=false;pages.journal=0;departureAt=stampAt=null;}
  if(action.type==='newspaper'){activeDoc='news';pages.news=0;newsRead=false;}
  if(action.type==='inspect')activeDoc='pass';
  if(action.type==='start')activeDoc='rules';
  if(action.type==='profession')departureAt=null;
  render();
}
function field(source:string,key:FieldKey,label:string,value:string,extra=''){
  const id=`${source}:${key}:${value}`;fields.set(id,{source,key,label,value});
  const a=state.selected,b=state.comparison?.b;
  const selected=[a,b].some(f=>f?.source===source&&f.key===key&&f.value===value);
  return `<button class="field ${selected?'selected':''} ${extra}" data-field="${esc(id)}" aria-pressed="${selected}" aria-label="${esc(source)}: ${label} — ${esc(value)}"><span class="field-label">${label}</span><strong>${esc(value)}</strong></button>`;
}
function pager(id:string,count=2){const p=pages[id]??0;return `<nav class="paper-pager" aria-label="Страницы документа"><button data-page="${id}" data-step="-1" aria-label="Предыдущий лист" ${p===0?'disabled':''}>← Назад</button><span>${p+1} / ${count}</span><button data-page="${id}" data-step="1" aria-label="Следующий лист" ${p===count-1?'disabled':''}>Дальше →</button></nav>`;}
function passPaper(){const v=visitors[state.visitor];return `<article class="paper badge-paper" aria-label="Пропуск сотрудника"><header class="paper-heading"><h2>Пропуск</h2>${logo()}</header><div class="badge-identity"><div class="id-photo"><img src="${portrait(v.id)}" alt="Портрет ${v.name}" width="64" height="78"></div><div class="badge-info">${field('Пропуск','name','Сотрудник',v.name)}<p class="role">${v.role}</p></div>${field('Пропуск','badge','ID',v.badge,'id-number')}</div><div class="document-fields">${field('Пропуск','zone','Разрешённая зона',v.zone)}${field('Пропуск','purpose','Цель визита',v.purpose)}${field('Пропуск','status','Статус','Действителен')}</div></article>`;}
function requestPaper(){const v=visitors[state.visitor],fixed=v.id==='elena'&&state.responses.elena;return `<article class="paper request-paper" aria-label="Заявка на работы"><header class="paper-heading"><h2>Заявка на работы</h2>${fixed?'<span class="correction">Исправлена</span>':''}</header><div class="document-fields">${field('Заявка','number','Номер заявки',fixed?v.journal:v.request)}${field('Заявка','name','Сотрудник',v.name)}${field('Заявка','zone','Зона посещения',v.zone)}${field('Заявка','purpose','Цель работ',v.purpose)}</div><div class="signature"><span>${fixed?'T-218 отозвана отделом':'Ответственный'}</span><i>${v.id==='andrey'?'И. Петров':'О. Крылова'}</i></div></article>`;}
function journalPaper(){
  const briefing=state.phase==='briefing'||state.phase==='newspaper',full=briefing&&!pagedDocuments.has(referenceKey('journal'));
  const ids=full?['andrey','elena'] as const:[briefing&&pages.journal===1?'elena':state.visitor] as const;
  const records=ids.map(id=>{const v=visitors[id],source=full?`Журнал / ${v.badge}`:'Журнал';return `<section class="reference-section"><time>${v.time}</time><div class="document-fields">${field(source,'number','Номер заявки',v.journal)}${field(source,'name','Сотрудник',v.name)}${field(source,'zone','Зона работ',v.zone)}${field(source,'purpose','Задание',v.purpose)}</div></section>`;}).join('');
  return `<article class="paper journal-paper ${full?'full-reference':''}" data-reference="journal" aria-label="Журнал текущих заявок"><header class="paper-heading"><h2>Журнал работ</h2></header><div class="page-copy">${records}</div>${briefing&&!full?pager('journal'):'<p class="document-note">Согласовано подразделением</p>'}</article>`;
}
function rulesPaper(){
  const parts=['<div class="rule"><h3>Пропустить</h3><p>Пропуск действителен. Зона, цель и заявка совпадают с журналом.</p></div><div class="rule"><h3>Проверить</h3><p>Не хватает данных или есть противоречие — запросите отдел. Три запроса на смену.</p></div><div class="rule"><h3>Отказать</h3><p>Подтверждено нарушение допуска — откажите в проходе.</p></div>','<div class="rule"><h3>Если номера расходятся</h3><p>Пока есть запросы, уточните номер у отдела. До ответа и исправленного документа не пропускайте.</p></div><div class="rule"><h3>Запросов нет?</h3><p>Откажите в текущем проходе и направьте на переоформление. Это корректно, а не обвинение сотрудника.</p></div><p class="document-note">Сравнение бесплатно. Внешность не определяет допуск.</p>'];
  const full=!pagedDocuments.has(referenceKey('rules'));
  return `<article class="paper rules-paper rules-leaf-${pages.rules} ${full?'full-reference':''}" data-reference="rules" aria-label="Памятка контролёра"><header class="paper-heading"><h2>Памятка контролёра</h2></header><div class="page-copy">${full?parts.map(p=>`<section class="reference-section">${p}</section>`).join(''):parts[pages.rules]}</div>${full?'':pager('rules')}</article>`;
}
function newspaperPaper(){
  const parts=[`<h3>С чего всё начиналось</h3><div class="news-date">18 декабря <b>1978</b></div><p>${historyText}</p><a class="source-link" href="https://nonalco.ochakovo.ru/istoriya/" target="_blank" rel="noopener noreferrer">История «Очаково» ↗</a>`,'<div class="news-advice"><h3>Перед плановыми работами</h3><p>Сверяйте допуск и заявку с записью подразделения в журнале.</p></div><div class="news-mystery"><strong>Из архива: F-78</strong><p>Найдена папка с необычной маркировкой. Содержание уточняется.</p></div><p class="document-note">Работы и архивная папка — часть игрового сюжета.</p>'];
  const full=!pagedDocuments.has(referenceKey('news'));
  return `<article class="paper newspaper news-leaf-${pages.news} ${full?'full-reference':''}" data-reference="news" aria-label="Заводской вестник, выпуск 1"><header class="news-masthead"><h2>Заводской<br> вестник</h2><div>${logo()}<span>Выпуск № 1</span></div></header><div class="page-copy">${full?parts.map(p=>`<section class="reference-section">${p}</section>`).join(''):parts[pages.news]}</div>${full?'':pager('news')}</article>`;
}
function checklistPaper(){const labels=[['status','Действительность пропуска'],['zone','Совпадение зоны'],['purpose','Совпадение цели'],['journal','Заявка сверена с журналом']];return `<article class="paper checklist-paper"><header class="paper-heading"><h2>Лист сверки</h2></header><p class="document-note">Ваши отметки. Решение о проходе принимается отдельно.</p><div class="check-rows">${labels.map(([key,label])=>`<button data-check="${key}" class="check-row" role="checkbox" aria-label="${label}" aria-checked="${state.checks[state.visitor].includes(key)}"><span class="checkbox" aria-hidden="true">${state.checks[state.visitor].includes(key)?'✓':''}</span>${label}</button>`).join('')}</div></article>`;}
function responsePaper(){return `<article class="paper response-paper"><header class="paper-heading"><h2>Ответ отдела</h2></header><div class="page-copy"><p>${departmentResponse(state.visitor)}</p>${state.visitor==='elena'?'<button class="ink-button" data-doc="request">Открыть исправленную заявку ↗</button>':''}</div><p class="document-note">Ответ получен. Перечитывание бесплатно.</p></article>`;}
function compareBar(){const c=state.comparison,s=state.selected;if(c){const label=c.kind==='match'?'✓ Значения совпадают':c.kind==='mismatch'?'≠ Значения различаются':'↔ Это разные поля';return `<div class="compare-bar ${c.kind}" aria-live="polite"><div class="compare-pair"><span><small>${c.a.source}</small><b>${esc(c.a.value)}</b></span><em>↔</em><span><small>${c.b.source}</small><b>${esc(c.b.value)}</b></span></div><strong class="compare-verdict">${label}</strong><button data-action="clear" aria-label="Очистить сравнение">×</button></div>`;}return `<div class="compare-bar ${s?'has-selection':''}" aria-live="polite">${s?`<div><small>${s.source}</small><b>${esc(s.value)}</b></div><span class="compare-instruction">Выберите пару</span><button data-action="clear" aria-label="Очистить сравнение">×</button>`:'<span class="compare-instruction">Нажмите поле, затем пару в другом документе</span>'}</div>`;}
function docTabs(){
  const inCase=state.phase==='inspection',combined=documentsTogether();
  const tabs:[DocumentId,string,string][]=inCase?
    [['pass',combined?'Пропуск и заявка':'Пропуск','pass'],...(combined?[]:[['request','Заявка','request'] as [DocumentId,string,string]]),['journal','Журнал','journal'],['rules','Памятка','rules'],['news','Газета','news'],['checklist','Лист сверки','checklist']]:
    [['rules','Памятка','rules'],['journal','Журнал','journal'],...(state.phase==='newspaper'?[['news','Газета','news'] as [DocumentId,string,string]]:[])];
  if(inCase&&state.responses[state.visitor])tabs.push(['response','Ответ отдела','phone']);
  const split=tabs.length>3?Math.ceil(tabs.length/2):tabs.length;
  return `<nav class="document-tabs" aria-label="Предметы на столе">${[tabs.slice(0,split),tabs.slice(split)].filter(x=>x.length).map(row=>`<div class="tab-row">${row.map(([id,label,ico])=>{
    const selected=activeDoc===id||combined&&id==='pass'&&activeDoc==='request';
    return `<button data-doc="${id}" class="doc-tab ${selected?'active':''} ${combined&&id==='pass'?'combined-documents':''}" aria-pressed="${selected}">${icon(ico)}<span>${label}</span></button>`;
  }).join('')}</div>`).join('')}</nav>`;
}
function papers(){
  const primaryDoc=documentsTogether()&&activeDoc==='request'?'pass':activeDoc;
  const paper={pass:passPaper,request:requestPaper,journal:journalPaper,rules:rulesPaper,news:newspaperPaper,checklist:checklistPaper,response:responsePaper}[primaryDoc];
  const secondary=state.phase==='inspection'&&['pass','request','journal'].includes(primaryDoc);
  return `<div class="paper-holder"><div class="papers ${secondary?'two-papers':''}"><div class="document-slot">${paper()}</div>${secondary?`<div class="document-slot secondary-paper">${primaryDoc==='pass'?requestPaper():primaryDoc==='request'?(showJournal?journalPaper():passPaper()):requestPaper()}</div>`:''}</div></div>`;
}
function welcomeDesk(){return `<div class="welcome-desk"><div class="intro-paper paper"><h1>СМЕНА</h1><h2>Первый рабочий день</h2><p>Ты — новый контролёр проходной.<br>Проверяй документы и знакомься<br>с людьми производства.</p><button class="primary" data-action="start">Приступить к смене ${icon('arrow')}</button></div><div class="terminal"><div class="terminal-screen"><p>СОТРУДНИК<br><strong>Новый стажёр</strong></p><p>ДОЛЖНОСТЬ<br><strong>Контролёр КПП</strong></p><p>Начальник смены<br>ожидает вас.</p></div></div></div>`;}
function professionPaper(){const v=visitors[state.visitor];return `<article class="paper profession-paper"><header class="paper-heading"><h2>${v.profession}</h2></header><p class="profession-copy">${v.explanation}</p><h3>${state.visitor==='andrey'?'Что тебе интереснее узнать?':'Что хотелось бы изучить подробнее?'}</h3><div class="interest-options">${v.interests.map(x=>`<button data-interest="${x.id}">${x.text}<span aria-hidden="true">↗</span></button>`).join('')}</div></article>`;}
function resultPaper(){const r=state.results.find(x=>x.visitor===state.visitor)!;return `<article class="paper result-paper ${r.correct?'correct':'mistake'}"><header class="paper-heading"><h2>${r.correct?'Решение принято верно':'Замечание начальника смены'}</h2></header><p>${r.reason}</p><p class="result-reaction">${r.decision==='allow'?'«Спасибо. За проходной у каждого своя задача. Расскажу, чем занимаюсь».':'«Понял. Вопрос с документами решим. А пока расскажу о нашей работе».'}</p></article>`;}
function completeDesk(){return `<article class="paper complete-paper"><h2>Демонстрационный<br>фрагмент завершён</h2><p>Ты познакомился с инженером и технологом.<br>Первая смена ещё не окончена.</p><div class="saved-interests"><h3>Что тебе стало интересно</h3>${(['andrey','elena'] as const).map(id=>`<p>${visitors[id].interests.find(x=>x.id===state.interests[id])?.text??'Не выбрано'}</p>`).join('')}</div><button class="primary" data-action="restart">Переиграть фрагмент ${icon('reset')}</button></article>`;}
function speech(){let name='Виктор Сергеевич',text='';if(state.phase==='briefing')text=!state.opened.rules?'Сначала прочитай памятку. Потом открой журнал. Главное — не торопись с выводами.':!state.opened.journal?'Теперь загляни в журнал. Там подразделения подтверждают работы.':'Разобрались. Теперь можно прочитать утреннюю газету.';else if(state.phase==='inspection'){const v=visitors[state.visitor];name=v.name;text=v.greeting;}return text?`<div class="speech"><b>${name}</b><p>${text}</p></div>`:'';}
function decisionBar(){if(state.phase==='briefing')return `<div class="flow-actions"><button class="primary" data-action="newspaper" ${state.opened.rules&&state.opened.journal?'':'disabled'}>К утренней газете ${icon('arrow')}</button></div>`;if(state.phase==='newspaper')return `<div class="flow-actions"><button class="primary" data-action="inspect" ${newsRead?'':'disabled'}>Первый посетитель ${icon('arrow')}</button></div>`;if(state.phase==='result')return `<div class="flow-actions"><button class="primary" data-action="profession">О работе ${icon('arrow')}</button></div>`;if(state.phase!=='inspection')return '';const a=state.responses[state.visitor];return `<div class="decision-bar"><button class="decision deny" data-decision="deny">Отказать<small>в проходе</small></button><button class="decision verify" data-action="request" ${!a&&state.requestsLeft===0?'disabled':''}>${a?'Ответ отдела':'Проверить'}<small>${a?'без запроса':`осталось ${state.requestsLeft} из 3`}</small></button><button class="decision allow" data-decision="allow">Пропустить<small>открыть проход</small></button></div>`;}
function render(allowFit=true){
  const focused=document.activeElement instanceof HTMLButtonElement&&root.contains(document.activeElement)?Object.entries(document.activeElement.dataset).find(([k])=>['action','doc','field','check','decision','page'].includes(k)):null;
  fields.clear();const elapsed=departureAt===null?Infinity:performance.now()-departureAt;if(elapsed>=1000)departureAt=null;
  const tabletLayout=innerWidth>=761&&innerHeight>550&&innerHeight<900&&innerWidth/innerHeight>=1.25;
  const desktopLayout=!tabletLayout&&innerWidth>=1100&&innerHeight>550;
  const leaving=state.phase==='result'&&departureAt!==null;
  const character=state.phase==='inspection'||leaving?state.visitor:['briefing','newspaper'].includes(state.phase)?'viktor':null;
  const entering=character!==null&&sceneKey!==character&&!leaving;sceneKey=character??state.phase;
  const nextKey=`${activeDoc}-${pages[activeDoc]??0}-${state.visitor}-${state.phase}`,paperEntering=docKey!==nextKey;docKey=nextKey;
  const result=state.results.find(r=>r.visitor===state.visitor),decided=state.phase==='result'||state.phase==='interest',stampElapsed=stampAt===null?Infinity:performance.now()-stampAt;
  const reading=state.phase==='inspection'&&['rules','news','checklist'].includes(activeDoc);
  const desk=state.phase==='welcome'?welcomeDesk():state.phase==='complete'?completeDesk():state.phase==='interest'?`<div class="single-sheet">${professionPaper()}</div>`:state.phase==='result'?`<div class="single-sheet">${resultPaper()}</div>`:`${docTabs()}${state.phase==='inspection'&&!reading?compareBar():''}<div class="desk-content"><aside class="desk-radio"><div class="radio-grille" aria-hidden="true"></div><strong>${state.requestsLeft}<small> / 3</small></strong><span>Запросы отдела</span><button data-doc="checklist">${icon('checklist')}Лист сверки</button></aside>${papers()}<aside class="desk-supplies"><div class="folder-spines" aria-hidden="true"><span>ЗАЯВКИ</span><span>КОНТРОЛЬ</span><span>АРХИВ</span></div>${state.phase==='inspection'?`<button class="journal-shortcut" data-action="pair-journal">${icon('journal')}Сверить<br>с журналом</button>`:''}</aside></div>`;
  root.innerHTML=`<div class="app-shell"><header class="app-header"><div class="app-wordmark">СМЕНА</div><div class="header-controls"><button data-action="reset" aria-label="Начать заново" title="Начать заново">${icon('reset')}</button><button data-action="sound" aria-label="${state.muted?'Включить звук':'Выключить звук'}">${icon(state.muted?'mute':'sound')}</button><button data-action="about" aria-label="Об игре">${icon('info')}</button></div></header><main class="workplace phase-${state.phase} ${reading?'reading-reference':''} ${tabletLayout?'tablet-layout':''} ${desktopLayout?'desktop-layout':''}"><section class="window-scene" aria-label="Окно заводской проходной"><div class="factory-backdrop"></div><div class="brand-plaque">${logo()}<span>ПРОХОДНАЯ</span></div><div class="post-plaque">ПОСТ <b>01</b></div><time class="shift-clock">${state.visitor==='andrey'?'08:10':'08:25'}</time>${character?`<div class="character ${entering?'entering':''} ${leaving?'leaving':''}" ${leaving?`style="--departure-offset:-${Math.max(0,elapsed)}ms"`:''} data-character="${character}"><img src="${portrait(character)}" alt="${character==='viktor'?'Виктор Сергеевич, начальник смены':visitors[state.visitor].name}" draggable="false" width="640" height="960"></div>`:''}<div class="gate-indicator ${decided&&result?.decision==='allow'?'open':''}"><i></i><span>${decided?result?.decision==='allow'?'ПРОХОД ОТКРЫТ':'В ПРОХОДЕ ОТКАЗАНО':'ПРОХОД ЗАКРЫТ'}</span></div><div class="gate-arm ${decided&&result?.decision==='allow'?'raised':''}" aria-hidden="true"></div><div class="window-sill"></div>${decided?`<div class="decision-stamp ${stampElapsed<400&&state.phase==='result'?'stamping':''} ${result?.decision==='allow'?'approved':'rejected'}" style="--stamp-offset:-${Math.min(400,stampElapsed)}ms">${result?.decision==='allow'?'ДОПУЩЕН':'ОТКАЗАНО'}</div>`:''}</section><section class="dialogue-zone" aria-label="Диалог">${speech()}</section><section class="desk ${paperEntering?'paper-entering':''}" aria-label="Рабочий стол">${desk}</section><section class="control-panel" aria-label="Управление проходом">${decisionBar()}</section></main>${showAbout?aboutPanel():''}${showReset?resetPanel():''}</div>`;
  const scene=root.querySelector<HTMLElement>('.window-scene');
  if(scene){const w=Math.min(scene.clientHeight*.96,scene.clientWidth*.86,440);scene.style.setProperty('--portrait-width',w+'px');scene.style.setProperty('--portrait-top',Math.max(0,scene.clientHeight-w*1.5)+'px');}
  const fullPaper=root.querySelector<HTMLElement>('.full-reference');
  if(fullPaper&&allowFit){
    fullPaper.classList.toggle('wide-reference',fullPaper.clientWidth>=600);
    const copy=fullPaper.querySelector<HTMLElement>('.page-copy')!;
    const id=fullPaper.dataset.reference!;
    if(copy.scrollHeight>copy.clientHeight+1||copy.scrollWidth>copy.clientWidth+1){pagedDocuments.add(referenceKey(id));render(false);return;}
    let refresh=false;
    if(id==='rules'&&state.phase==='briefing'&&!state.opened.rules){state=transition(state,{type:'open',document:'rules'});storageAvailable=saveGame(state);refresh=true;}
    if(id==='news'&&state.phase==='newspaper'&&!newsRead){newsRead=true;refresh=true;}
    if(refresh){render();return;}
  }else if(fullPaper){fullPaper.classList.toggle('wide-reference',fullPaper.clientWidth>=600);}
  if(focused)Array.from(root.querySelectorAll<HTMLButtonElement>('button')).find(b=>b.dataset[focused[0]]===focused[1])?.focus({preventScroll:true});
}
function aboutPanel(){return `<div class="service-overlay"><section class="paper about-paper" role="dialog" aria-modal="true" aria-labelledby="about-title"><button class="paper-close" data-action="close-about" aria-label="Закрыть об игре">×</button><h2 id="about-title">Об игре</h2><p>История о людях производства «Очаково».</p><p>Персонажи, документы, пропускные правила и проект F-78 — художественный вымысел. Исправление заявки технолога — игровое допущение.</p><p>Выбор интересов помогает знакомиться с профессиями и не оценивает пригодность к работе.</p><div class="about-links"><a target="_blank" rel="noopener noreferrer" href="https://nonalco.ochakovo.ru/istoriya/">История «Очаково» ↗</a><a target="_blank" rel="noopener noreferrer" href="https://ochakovo.ru/kompaniya/">О компании ↗</a></div>${storageAvailable?'':'<p role="status">Хранилище недоступно: прогресс будет потерян при закрытии.</p>'}</section></div>`;}
function resetPanel(){return `<div class="service-overlay"><section class="paper reset-paper" role="dialog" aria-modal="true" aria-labelledby="reset-title"><h2 id="reset-title">Начать заново?</h2><p>Текущие решения и выбранные интересы будут сброшены.</p><button class="primary" data-action="restart">Да, начать заново</button><button class="ink-button" data-action="cancel-reset">Вернуться к столу</button></section></div>`;}
root.addEventListener('click',event=>{
  const b=(event.target as Element).closest<HTMLButtonElement>('button');if(!b||b.disabled)return;
  if(b.dataset.page){const id=b.dataset.page;pages[id]=Math.max(0,Math.min(1,(pages[id]??0)+Number(b.dataset.step)));sound.play('paper');if(id==='rules'&&pages.rules===1)send({type:'open',document:'rules'});else{if(id==='news'&&pages.news===1)newsRead=true;render();}return;}
  if(b.dataset.doc){activeDoc=b.dataset.doc as DocumentId;sound.play('paper');if(activeDoc==='rules'&&pages.rules===0&&state.phase==='briefing')render();else send({type:'open',document:activeDoc});return;}
  if(b.dataset.field){const f=fields.get(b.dataset.field);if(f)send({type:'field',field:f});return;}
  if(b.dataset.decision){send({type:'decide',decision:b.dataset.decision as Decision});return;}
  if(b.dataset.interest){send({type:'interest',interest:b.dataset.interest as Interest});return;}
  if(b.dataset.check){send({type:'check',key:b.dataset.check});return;}
  switch(b.dataset.action){
    case 'about':showAbout=true;render();root.querySelector<HTMLButtonElement>('[data-action="close-about"]')?.focus();break;
    case 'close-about':showAbout=false;render();root.querySelector<HTMLButtonElement>('[data-action="about"]')?.focus();break;
    case 'reset':showReset=true;render();root.querySelector<HTMLButtonElement>('[data-action="cancel-reset"]')?.focus();break;
    case 'cancel-reset':showReset=false;render();root.querySelector<HTMLButtonElement>('[data-action="reset"]')?.focus();break;
    case 'restart':state=initialState();activeDoc='pass';showJournal=false;showReset=false;pages.rules=pages.news=pages.journal=0;newsRead=false;departureAt=stampAt=null;sound.muted=true;sound.suspend();storageAvailable=saveGame(state);render();break;
    case 'request':if(!state.responses[state.visitor]&&state.requestsLeft>0){activeDoc='response';send({type:'request'});}else if(state.responses[state.visitor]){activeDoc='response';render();}break;
    case 'pair-journal':showJournal=!documentsTogether();activeDoc=documentsTogether()?'journal':'request';send({type:'open',document:'journal'});break;
    case 'start':case 'newspaper':case 'inspect':case 'profession':case 'clear':case 'sound':send({type:b.dataset.action});break;
  }
});
root.addEventListener('animationend',event=>{if(event.animationName==='visitor-leave'&&(event.target as Element).matches('.character.leaving')){departureAt=null;(event.target as Element).remove();}});
document.addEventListener('keydown',event=>{if(event.key==='Escape'&&(showAbout||showReset)){const action=showAbout?'about':'reset';showAbout=showReset=false;render();root.querySelector<HTMLButtonElement>(`[data-action="${action}"]`)?.focus();}if(event.key==='Tab'&&(showAbout||showReset)){const items=Array.from(root.querySelectorAll<HTMLElement>('[role="dialog"] button,[role="dialog"] a')),first=items[0],last=items.at(-1);if(event.shiftKey&&document.activeElement===first){event.preventDefault();last?.focus();}else if(!event.shiftKey&&document.activeElement===last){event.preventDefault();first?.focus();}}});
document.addEventListener('visibilitychange',()=>{document.documentElement.classList.toggle('is-hidden',document.hidden);if(document.hidden){sound.suspend();saveGame(state);}});
window.addEventListener('pagehide',()=>saveGame(state));
let resizeFrame=0;
window.addEventListener('resize',()=>{if(resizeFrame)cancelAnimationFrame(resizeFrame);resizeFrame=requestAnimationFrame(()=>{resizeFrame=0;pagedDocuments.clear();render();});});
render();performance.mark('smena-interactive');

