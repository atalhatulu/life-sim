import test from "node:test";
import assert from "node:assert/strict";
import {createMonthlyVillage,validateMonthlyVillage} from "../src/monthly-life.js";
import {buildVillageSnapshot,validateVillageSnapshot} from "../src/village-1600.js";
test("1600 profiles reflect only simulated lives across 100 seeds",()=>{
 for(let seed=1;seed<=100;seed++){
  const world=createMonthlyVillage(seed),snapshot=buildVillageSnapshot(world);
  assert.deepEqual(validateMonthlyVillage(world),[],"world seed "+seed);
  assert.deepEqual(validateVillageSnapshot(world,snapshot),[],"snapshot seed "+seed);
  assert.equal(snapshot.population,world.people.filter(p=>p.alive).length);
  for(const p of snapshot.profiles){
   const original=world.people.find(x=>x.id===p.id);
   assert.equal(p.hobby,original.hobby);
   assert.deepEqual(p.traits,original.traits);
   assert.deepEqual(p.skills,original.skills);
   assert.equal(p.history.length,original.history.length);
   assert.ok(p.history.every(e=>e.at>=original.bornAt&&e.at<=world.year*12+world.month-1));
  }
 }
});
test("1600 profiles are reproducible",()=>{
 assert.deepEqual(buildVillageSnapshot(createMonthlyVillage(1)),buildVillageSnapshot(createMonthlyVillage(1)));
});
