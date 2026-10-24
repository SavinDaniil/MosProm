const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

function load() {
  const context = vm.createContext({ window: {} });
  for (const name of ['lab-model-v7.js', 'lab-interaction-v10.js']) {
    vm.runInContext(fs.readFileSync(path.join(__dirname, '../dist', name), 'utf8'), context);
  }
  return { M: context.window.OchakovoLabModel, I: context.window.OchakovoLabInteraction };
}

test('partial mixing survives release but still requires distance and direction changes', () => {
  const { I } = load();
  const first = I.gesture();
  first.move(50, 0);
  assert.equal(first.move(-50, 0).ready, false);
  const second = I.gesture(first.progress());
  assert.equal(second.progress().distance, 100);
  assert.equal(second.progress().turns, 1);
  assert.equal(second.move(25, 0).ready, false);
  const result = second.move(-25, 0);
  assert.equal(result.distance, 150);
  assert.equal(result.turns, 2);
  assert.equal(result.ready, true);
  assert.equal(result.amount, 1);
  const straight = I.gesture();
  assert.equal(straight.move(300, 0).ready, false);
  const jitter = I.gesture();
  jitter.move(1, 1);
  assert.equal(jitter.progress().distance, 0);
});

test('flow integrates fractional doses, stops when closed and bounds a delayed frame', () => {
  const { I } = load();
  let volume = 0, carry = 0;
  for (let i = 0; i < 10; i++) ({ volume, carry } = I.integrate(volume, carry, 100, 0.1));
  assert.equal(volume, 8);
  assert.ok(Math.abs(carry) < 1e-7);
  const closed = I.integrate(volume, 0.4, 0, 0.1);
  assert.equal(closed.volume, volume);
  assert.equal(closed.carry, 0.4);
  assert.equal(I.integrate(0, 0, 100, 20).volume, 0);
  assert.equal(I.integrate(49, 0.9, 100, 0.1).volume, 50);
});

test('complete model scenario preserves original and repeat through reload and recovery', () => {
  const { M } = load();
  let state = M.fresh();
  const step = (type, value) => {
    const result = M.transition(state, type, value);
    state = result.state;
    return result;
  };
  const reload = () => { state = M.normalize(JSON.parse(JSON.stringify(state))); };
  step('start');
  step('register');
  assert.equal(state.phase, 0, 'cannot register without all checks');
  for (const check of ['seal', 'label', 'source']) step('inspect', check);
  step('register');
  for (let i = 0; i < 3; i++) step('prepare');
  step('to-tests');
  step('method', 'titre');
  step('rig');
  for (let i = 0; i < 4; i++) { step('dose', 10); step('mix'); }
  assert.equal(state.volume, 40);
  step('save-titre');
  assert.equal(state.titreSaved, false, 'overshoot cannot be recorded');
  step('retry-titre');
  step('rig');
  for (let i = 0; i < 3; i++) { step('dose', 10); step('mix'); }
  for (let i = 0; i < 4; i++) { step('dose', 1); step('mix'); }
  assert.equal(step('observe', 'fades').bad, true);
  step('observe', 'persists');
  step('save-titre');
  reload();
  assert.equal(state.titreSaved, true);
  step('method', 'brix');
  step('load');
  assert.equal(state.loaded, false, 'sample requires control and cleaning');
  for (const action of ['control', 'clean', 'load', 'cover', 'stable', 'save-brix']) step(action);
  reload();
  assert.equal(state.brixSaved, true);
  step('to-results');
  assert.equal(step('notice', 'titre').bad, true);
  step('notice', 'brix');
  step('judgement', 'release');
  assert.equal(step('report').bad, true);
  assert.equal(state.phase, 3);
  step('judgement', 'hold');
  step('report');
  step('handover');
  assert.equal(state.done, false, 'handover requires repeat');
  for (const action of ['repeat-clean', 'repeat-load', 'repeat-cover', 'stable']) step(action);
  reload();
  assert.equal(state.repeatStage, 3);
  step('repeat-save');
  step('handover');
  reload();
  assert.equal(state.done, true);
  assert.equal(state.titreSaved, true);
  assert.equal(state.brixSaved, true);
  assert.equal(state.repeatStage, 4);
});
