import test from 'node:test';
import assert from 'node:assert/strict';
import {createMonthlyVillage,validateMonthlyVillage} from '../src/monthly-life.js';
test('monthly histories are deterministic and valid',()=>{
 const a=createMonthlyVillage(1),b=createMonthlyVillage(1);
 assert.deepEqual(a,b);
 assert.deepEqual(validateMonthlyVillage(a),[]);
 assert.equal(a.monthCount,852);
 assert.ok(a.people.some(p=>p.generation===3));
 assert.ok(a.people.filter(p=>p.generation>1).every(p=>p.history.some(e=>e.type==='birth'&&e.at===p.bornAt)));
});
test('100 seeds preserve monthly genealogy',()=>{
 for(let seed=1;seed<=100;seed++)assert.deepEqual(validateMonthlyVillage(createMonthlyVillage(seed)),[],'seed '+seed);
});
