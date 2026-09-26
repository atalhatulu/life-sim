import test from "node:test";
import assert from "node:assert/strict";
import {createLivingLineage,validateLivingLineage} from "../src/lineage.js";
test("deterministic extended genealogy",()=>{
 assert.deepEqual(createLivingLineage("same",8),createLivingLineage("same",8));
 assert.notDeepEqual(createLivingLineage("a",8),createLivingLineage("b",8));
});
test("1000 seeds retain chronological kinship and living households",()=>{
 for(let seed=0;seed<1000;seed++) {
  const w=createLivingLineage(seed,8);
  assert.deepEqual(validateLivingLineage(w),[], "seed="+seed);
  assert.equal(w.observerPersonId,null);
  for(const p of w.people) {
   if(!p.alive) assert.ok(p.history.some(e=>e.type==="death"));
   for(const parentId of p.parentIds) {
    const parent=w.people.find(x=>x.id===parentId);
    assert.ok(parent.birthYear<=p.birthYear-16);
   }
  }
 }
});
test("connected families and deceased ancestors occur across seeds",()=>{
 let marriages=0,deaths=0;
 for(let seed=0;seed<100;seed++){
  const w=createLivingLineage(seed,8);
  marriages+=w.marriages.length;deaths+=w.deceasedIds.length;
 }
 assert.ok(marriages>0);assert.ok(deaths>0);
});
