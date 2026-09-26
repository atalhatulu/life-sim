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
test("historical marriages and births occur within lifetimes",()=>{
 for(let seed=0;seed<1000;seed++){
  const w=createLivingLineage("history-"+seed,8);
  const byId=new Map(w.people.map(p=>[p.id,p]));
  for(const p of w.people){
   const end=p.deathYear ?? w.year;
   for(const event of p.history){
    assert.ok(event.year>=p.birthYear && event.year<=end,"seed="+seed+" person="+p.id+" event="+event.type);
    if(event.type==="marriage"){
     assert.ok(event.year-p.birthYear>=16,"marriage under 16: seed="+seed+" person="+p.id);
     assert.ok(byId.has(event.personId));
    }
   }
   for(const childId of p.childIds){
    const child=byId.get(childId);
    assert.ok(child.birthYear>=p.birthYear+16);
    assert.ok(p.deathYear===null || child.birthYear<=p.deathYear);
   }
  }
 }
});
