const test=require('node:test');
const assert=require('node:assert/strict');
// The repository is ESM; load the shipped UMD model like the other game tests.
const vm=require('node:vm'),fs=require('node:fs'),path=require('node:path');
const modelModule={exports:{}};
vm.compileFunction(fs.readFileSync(path.join(__dirname,'../dist/lab-story-model.js'),'utf8'),['module'])(modelModule);
const M=modelModule.exports;

test('a wrong sample and incomplete inspection cannot bypass traceability',()=>{
 let s=M.transition(M.fresh(),'start').state;
 let r=M.transition(s,'sample','08');assert.equal(r.accepted,false);assert.equal(r.state.step,'intake');
 s=M.transition(r.state,'sample','07').state;
 assert.equal(M.transition(s,'register').state.step,'inspect');
 s=M.transition(s,'inspect','number').state;s=M.transition(s,'inspect','number').state;
 assert.deepEqual(s.checks,['number']);
 for(const check of ['source','seal'])s=M.transition(s,'inspect',check).state;
 assert.equal(s.step,'register');assert.equal(s.discoveries.includes('trace'),true);
});
test('out-of-order commands cannot create readings or complete the shift',()=>{
 let s=M.fresh();for(const command of ['measure','drop','register','record','conclusion','notify'])s=M.transition(s,command,'report').state;
 assert.equal(s.step,'welcome');assert.deepEqual(s.records,[]);assert.equal(s.completed,false);
});
test('original and repeat readings survive round-trip; mistaken conclusions remain recoverable',()=>{
 let s=M.fresh();const go=(action,value)=>{const r=M.transition(s,action,value);s=M.normalize(JSON.parse(JSON.stringify(r.state)));return r;};
 go('start');go('sample','07');for(const c of ['number','source','seal'])go('inspect',c);
 for(const action of ['register','condition','mix','portion','control','clean','drop','close','measure'])assert.equal(go(action).accepted,true,action);
 assert.equal(go('record','10').accepted,false);assert.equal(s.step,'ref-record');
 go('record','8,2');for(const action of ['rinse','dip','measure'])go(action);go('record','3.6');
 assert.equal(go('compare','ph').accepted,false);go('compare','brix');go('notify');
 assert.equal(s.records.length,2);
 for(const action of ['clean','drop','close','measure'])go(action);go('record','8.3');
 assert.deepEqual(s.records.map(r=>r.value),[8.2,3.6,8.3]);
 assert.equal(go('conclusion','fix').accepted,false);assert.equal(s.completed,false);
 assert.equal(go('conclusion','release').accepted,false);
 go('conclusion','report');assert.equal(s.step,'finish');assert.equal(s.completed,true);
 assert.equal(s.discoveries.length,6);assert.equal(s.records[0].value,8.2);
});
test('invalid saved state starts clean; valid state repairs record shape',()=>{
 for(const value of [null,{},[],{version:1,step:'missing'},{version:2,step:'finish'}])assert.deepEqual(M.normalize(value),M.fresh());
 const s=M.normalize({version:1,step:'repeat-clean',records:'corrupt',checks:['number','bad'],discoveries:['team','team','fake']});
 assert.equal(s.records.length,2);assert.deepEqual(s.checks,['number','source','seal']);assert.deepEqual(s.discoveries,['team']);
});
