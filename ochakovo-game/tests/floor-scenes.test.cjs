const {test}=require('node:test');
const assert=require('node:assert/strict');
// The outer project is type:module, while the shipped browser script is UMD.
const vm=require('node:vm'),fs=require('node:fs'),path=require('node:path');
const sandbox={module:{exports:{}}};
vm.compileFunction(fs.readFileSync(path.join(__dirname,'../dist/floor-model.js'),'utf8'),['module'])(sandbox.module);
const M=sandbox.module.exports;
function fields(g){for(const field of ['brand','format','batch'])assert.equal(g.dispatch('field',field).ok,true);}
function lineToInspection(g){fields(g);g.dispatch('sample','У-17');for(const n of ['fill','cap','label','pack'])g.dispatch('station',n);assert.equal(g.state.phase,2);}
function lineToIncident(g){lineToInspection(g);for(const b of M.bottles){for(const part of ['cap','level','code'])g.dispatch('lens',b.id+':'+part);assert.equal(g.dispatch('decide',b.id+':'+(b.defect?'review':'pass')).ok,true);}assert.equal(g.state.phase,3);}
function lineComplete(){const g=M.create('line');lineToIncident(g);g.dispatch('log');g.dispatch('response','mentor');g.dispatch('trial');g.dispatch('release','separate');for(const id of ['B-01','B-05','B-06'])g.dispatch('pack',id);assert.equal(g.dispatch('handoff').ok,true);return g;}
function receive(g){fields(g);g.dispatch('receipt');}
function store(g,id,zone){assert.equal(g.dispatch('scan',id).ok,true);assert.equal(g.dispatch('inspect',id).ok,true);assert.equal(g.dispatch('place',id+':'+zone).ok,true);}
function warehouseToOrder(g){receive(g);for(const c of M.cartons.filter(c=>!c.reserve&&!c.damage))store(g,c.id,c.zone);g.dispatch('scan','FA-02');g.dispatch('inspect','FA-02');g.dispatch('report','tear');g.dispatch('place','FA-02:Q');store(g,'FA-03','C');assert.equal(g.state.phase,2);}
test('bottling rejects shortcuts and preserves separate equipment/product decisions',()=>{
 const g=M.create('line');assert.equal(g.dispatch('sample','У-17').ok,false);fields(g);assert.equal(g.dispatch('sample','У-16').ok,false);g.dispatch('sample','У-17');assert.equal(g.dispatch('station','pack').ok,false);assert.equal(g.state.route.length,0);
 for(const n of ['fill','cap','label','pack'])g.dispatch('station',n);
 assert.equal(g.dispatch('decide','B-01:pass').ok,false);
 for(const part of ['cap','level','code'])g.dispatch('lens','B-02:'+part);
 assert.equal(g.dispatch('decide','B-02:pass').ok,false);assert.equal(g.state.decisions['B-02'],undefined);
 const h=M.create('line');lineToIncident(h);assert.equal(h.dispatch('response','mentor').ok,false);h.dispatch('log');assert.equal(h.dispatch('response','repair').ok,false);h.dispatch('response','mentor');assert.equal(h.dispatch('release','separate').ok,false);h.dispatch('trial');assert.equal(h.dispatch('release','all').ok,false);h.dispatch('release','separate');assert.equal(h.dispatch('pack','B-02').ok,false);assert.equal(h.dispatch('handoff').ok,false);
 assert.equal(lineComplete().state.done,true);
});
test('warehouse scanning and inspection are separate prerequisites; wrong zones do not mutate stock',()=>{
 const g=M.create('warehouse');assert.equal(g.dispatch('handoff').ok,false);receive(g);g.dispatch('scan','CC-01');assert.equal(g.state.inspected.length,0);assert.equal(g.dispatch('place','CC-01:A').ok,false);g.dispatch('inspect','CC-01');assert.equal(g.dispatch('place','CC-01:B').ok,false);assert.deepEqual(g.state.placed,{});assert.equal(g.dispatch('place','CC-01:A').ok,true);
});
test('damage requires factual report, explicit isolation, and checked reserve replacement',()=>{
 const g=M.create('warehouse');receive(g);assert.equal(g.dispatch('scan','FA-03').ok,false);assert.equal(g.dispatch('report','tear').ok,false);g.dispatch('scan','FA-02');g.dispatch('inspect','FA-02');assert.equal(g.dispatch('report','count').ok,false);assert.equal(g.dispatch('place','FA-02:Q').ok,false);g.dispatch('report','tear');assert.equal(g.state.placed['FA-02'],undefined);assert.equal(g.dispatch('place','FA-02:C').ok,false);g.dispatch('place','FA-02:Q');assert.equal(g.state.scanned.includes('FA-03'),false);assert.equal(g.dispatch('place','FA-03:C').ok,false);
});
test('same brand in another format is not an order match, verification never auto-corrects',()=>{
 const g=M.create('warehouse');warehouseToOrder(g);for(const id of ['CC-02','FA-01','FA-03'])g.dispatch('pick',id);assert.equal(g.dispatch('verify').ok,false);assert.deepEqual(g.state.picked,['CC-02','FA-01','FA-03']);assert.equal(g.dispatch('handoff').ok,false);g.dispatch('pick','CC-02');g.dispatch('pick','CC-01');assert.equal(g.dispatch('verify').ok,true);assert.equal(g.state.verified,true);g.dispatch('pick','KV-01');assert.equal(g.state.verified,false);g.dispatch('pick','KV-01');assert.equal(g.dispatch('handoff').ok,false);g.dispatch('verify');assert.equal(g.dispatch('handoff').ok,true);assert.equal(g.state.done,true);
});
test('replay restores every accepted action; malformed data and duplicates cannot bypass gates',()=>{
 for(const g of [lineComplete(),(()=>{const g=M.create('warehouse');warehouseToOrder(g);return g;})()]){
  const restored=M.create(g.state.kind,g.history());assert.deepEqual(restored.state,g.state);
 }
 const g=M.create('warehouse',[null,{},['handoff',''],['place','FA-03:C'],['receipt',''],['field',{}]]);assert.equal(g.state.phase,0);assert.equal(g.state.done,false);g.dispatch('field','brand');for(let i=0;i<300;i++)g.dispatch('field','brand');assert.equal(g.history().length,1);
});
