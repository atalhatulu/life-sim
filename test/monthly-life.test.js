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

test('births follow conception by nine months and never precede parental lifetimes',()=>{
 for(let seed=1;seed<=100;seed++){
  const w=createMonthlyVillage(seed),byId=new Map(w.people.map(p=>[p.id,p]));
  for(const e of w.events.filter(e=>e.type==='delivery')){
   const child=byId.get(e.childId),mother=byId.get(e.personIds[0]),father=byId.get(e.personIds[1]);
   assert.equal(e.at-e.conceivedAt,9);
   assert.equal(child.bornAt,e.at);
   assert.ok(mother.deathAt===null||mother.deathAt>=e.at);
   assert.ok(father.deathAt===null||father.deathAt>=e.conceivedAt);
  }
 }
});

test('health events preserve chronology and deceased characters do not recover later',()=>{
 for(let seed=1;seed<=100;seed++){
  const w=createMonthlyVillage(seed),byId=new Map(w.people.map(p=>[p.id,p]));
  for(const p of w.people){
   assert.ok(p.state.health>=0&&p.state.health<=100);
   assert.ok(p.history.filter(e=>e.type.startsWith('illness_')||e.type.startsWith('injury_')).every(e=>p.deathAt===null||e.at<=p.deathAt));
  }
  for(const e of w.events.filter(e=>e.type==='illness_recovered'||e.type==='injury_recovered')){
   const p=byId.get(e.personIds[0]);
   assert.ok(p.bornAt<=e.at);
   assert.ok(p.deathAt===null||e.at<=p.deathAt);
  }
 }
});

test('children retain living guardians and delivery complications have valid participants',()=>{
 for(let seed=1;seed<=100;seed++){
  const w=createMonthlyVillage(seed),byId=new Map(w.people.map(p=>[p.id,p]));
  assert.deepEqual(validateMonthlyVillage(w),[],'seed '+seed);
  for(const p of w.people.filter(p=>p.alive&&p.generation>1&&w.year*12+w.month-1-p.bornAt<16*12)){
   if(p.guardianId){
    const guardian=byId.get(p.guardianId);
    assert.ok(guardian.alive);
    assert.equal(guardian.householdId,p.householdId);
   }
  }
  for(const e of w.events.filter(e=>e.type==='delivery_complication')){
   assert.ok(e.damage>=7&&e.damage<=18);
   assert.ok(byId.get(e.personIds[0]).sex==='F');
   assert.equal(byId.get(e.personIds[1]).bornAt,e.at);
  }
 }
});
