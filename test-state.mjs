import test from 'node:test';
import assert from 'node:assert/strict';
import {stateAt,soundEvents,project} from './project.js';

test('runes advance only after the corresponding response, and sound lands there',()=>{
  for(let i=0;i<6;i++){
    const t=soundEvents[i].time;
    assert.equal(stateAt(t-0.001).active,i);
    assert.equal(stateAt(t+0.001).active,i+1);
  }
});
test('character position is continuous across the six tier boundaries',()=>{
  for(const t of project.starts) assert.ok(Math.abs(stateAt(t-0.001).heroX-stateAt(t+0.001).heroX)<=1);
});
test('the hero enters after the last rune responds, and reaches the doorway',()=>{
  assert.equal(stateAt(16.5).entering,false);
  assert.equal(stateAt(17.1).active,6);
  assert.equal(stateAt(17.1).entering,true);
  assert.ok(stateAt(17.95).heroX>=238);
});
test('seek order does not change the state',()=>{
  const expected=stateAt(11.8);
  stateAt(18);stateAt(0);stateAt(7);
  assert.deepEqual(stateAt(11.8),expected);
});
