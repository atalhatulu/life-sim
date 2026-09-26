import test from "node:test";
import assert from "node:assert/strict";
import {createVillageHistory,validateVillageHistory} from "../src/village-history.js";
import {createPersonalNotebooks,validatePersonalNotebooks} from "../src/personal-notebook.js";
test("300 retrospective villages have consistent residents, ledgers and notebooks",()=>{
 for(let i=0;i<300;i++){
  const w=createVillageHistory("village-"+i,4);
  assert.deepEqual(validateVillageHistory(w),[],"seed="+i);
  assert.deepEqual(validatePersonalNotebooks(w),[],"seed="+i);
  assert.equal(w.villageHistory.timeline.at(-1).year,1600);
  assert.equal(createPersonalNotebooks(w).size,w.people.length);
 }
});
test("founders have unknown parents, children originate in ancestral homes",()=>{
 const w=createVillageHistory("uyuk-1600",4);
 assert.ok(w.people.filter(p=>p.generation===1).every(p=>p.parentIds.length===0));
 for(const p of w.people.filter(p=>p.generation===2))
  assert.equal(p.originHouseholdId,w.people.find(x=>x.id===p.parentIds[0]).originHouseholdId);
});
test("same seed reproduces village years and shared relationships",()=>{
 const a=createVillageHistory("stable",4),b=createVillageHistory("stable",4);
 assert.deepEqual(a.villageHistory,b.villageHistory);
 assert.ok(a.villageHistory.timeline.length>50);
 assert.ok(a.villageHistory.relations.length>0);
 assert.ok(a.villageHistory.occupations.length>0);
});
