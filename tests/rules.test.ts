import test from 'node:test';
import assert from 'node:assert/strict';
import { initialState, transition, compare, evaluateDecision, saveGame, loadGame, SAVE_KEY } from '../src/model.ts';
import type { GameState } from '../src/model.ts';

const inspection = (visitor: 'andrey' | 'elena' = 'andrey'): GameState => ({...initialState(), phase:'inspection', visitor});

test('Engineer: valid documents require admission, optional check adds evidence without changing the rule',()=>{
  const s=inspection();
  assert.equal(evaluateDecision(s,'allow').correct,true);
  assert.equal(evaluateDecision(s,'deny').correct,false);
  assert.match(evaluateDecision(s,'deny').reason,/действительным допуском/);
  const checked=transition(s,{type:'request'});
  assert.equal(checked.requestsLeft,2);
  assert.equal(checked.responses.andrey,true);
  assert.equal(evaluateDecision(checked,'allow').correct,true);
  assert.equal(s.requestsLeft,3,'transition must not mutate old state');
});

test('Technologist: discovery is free, unresolved conflict blocks admission, correction is necessary',()=>{
  let s=inspection('elena');
  s=transition(s,{type:'field',field:{source:'Заявка',key:'number',label:'Номер',value:'T-218'}});
  s=transition(s,{type:'field',field:{source:'Журнал',key:'number',label:'Номер',value:'T-281'}});
  assert.equal(s.comparison?.kind,'mismatch');
  assert.equal(s.requestsLeft,3);
  assert.equal(evaluateDecision(s,'allow').correct,false);
  assert.equal(evaluateDecision(s,'deny').correct,false);
  s=transition(s,{type:'request'});
  assert.equal(s.selected,null,'old T-218 must not remain selected after correction');
  assert.equal(evaluateDecision(s,'allow').correct,true);
  assert.equal(evaluateDecision(s,'deny').correct,false);
});

test('Repeated taps cannot spend more than one query or finish a case twice; zero requests has a valid path',()=>{
  let s=inspection('elena');
  for(let i=0;i<8;i++) s=transition(s,{type:'request'});
  assert.equal(s.requestsLeft,2);
  s=transition(s,{type:'decide',decision:'allow'});
  for(let i=0;i<8;i++) s=transition(s,{type:'decide',decision:'deny'});
  assert.equal(s.results.length,1);
  assert.equal(s.results[0].decision,'allow');
  let zero={...inspection('elena'),requestsLeft:0};
  assert.equal(evaluateDecision(zero,'deny').correct,true);
  assert.match(evaluateDecision(zero,'deny').reason,/переоформление/);
  zero=transition(zero,{type:'request'});
  assert.equal(zero.requestsLeft,0);
  assert.equal(zero.responses.elena,undefined);
});

test('Interests are explicit and independent from mistakes, demo stops after two cases',()=>{
  let s=inspection();
  s=transition(s,{type:'decide',decision:'deny'});
  s=transition(s,{type:'profession'});
  s=transition(s,{type:'interest',interest:'engineering'});
  assert.equal(s.visitor,'elena');
  assert.equal(s.interests.andrey,'engineering');
  s=transition(s,{type:'decide',decision:'allow'});
  s=transition(s,{type:'profession'});
  s=transition(s,{type:'interest',interest:'recipes'});
  assert.equal(s.phase,'complete');
  assert.equal(s.results.filter(r=>!r.correct).length,2);
  assert.deepEqual(s.interests,{andrey:'engineering',elena:'recipes'});
  assert.equal(transition(s,{type:'inspect'}).phase,'complete');
  assert.equal(transition(s,{type:'request'}).requestsLeft,3);
  assert.equal(initialState().results.length,0);
});

test('Comparison only evaluates a chosen pair of matching field types; checklist is manual',()=>{
  const zone={source:'Пропуск',key:'zone' as const,label:'Зона',value:'Линия розлива № 2'};
  assert.equal(compare(zone,{...zone,source:'Журнал',value:'  Линия   розлива № 2  '}).kind,'match');
  assert.equal(compare(zone,{...zone,source:'Заявка',key:'purpose'}).kind,'unrelated');
  let s=transition(inspection(),{type:'check',key:'zone'});
  assert.equal(s.checks.andrey.includes('zone'),true);
  s=transition(s,{type:'check',key:'zone'});
  assert.equal(s.checks.andrey.length,0);
  assert.equal(s.results.length,0);
});

test('Storage is optional and versioned; corrupted or unsafe progress resets cleanly',()=>{
  let raw='';
  const store={setItem:(key:string,value:string)=>{assert.equal(key,SAVE_KEY);raw=value;},getItem:()=>raw};
  let s=inspection();
  s=transition(s,{type:'request'});
  assert.equal(saveGame(s,store),true);
  assert.equal(loadGame(store)?.requestsLeft,2);
  assert.equal(loadGame(store)?.responses.andrey,true);
  raw='{"version":1,"phase":"not-a-phase"}'; assert.equal(loadGame(store),null);
  raw=JSON.stringify({...initialState(),requestsLeft:-1}); assert.equal(loadGame(store),null);
  raw=JSON.stringify({...initialState(),results:[{visitor:'courier',decision:'allow'}]}); assert.equal(loadGame(store),null);
  const denied={setItem:()=>{throw new Error('disabled');},getItem:()=>{throw new Error('disabled');}};
  assert.equal(saveGame(s,denied),false); assert.equal(loadGame(denied),null);
});
