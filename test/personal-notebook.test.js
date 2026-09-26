import test from "node:test";
import assert from "node:assert/strict";
import {createLivingLineage} from "../src/lineage.js";
import {buildLifeBooks} from "../src/life-book.js";
import {createPersonalNotebooks,formatPersonalNotebook,validatePersonalNotebooks,lifeStage} from "../src/personal-notebook.js";
import {GIVEN_NAMES,HOUSE_NAMES} from "../src/names.js";
test("expanded names and founding ancestors have unknown parents",()=>{
 assert.ok(GIVEN_NAMES.F.length>=25&&GIVEN_NAMES.M.length>=25&&HOUSE_NAMES.length>=20);
 for(const names of [GIVEN_NAMES.F,GIVEN_NAMES.M,HOUSE_NAMES])assert.equal(new Set(names).size,names.length);
 const world=createLivingLineage("founders",8);
 assert.ok(world.people.filter(p=>p.generation===1).every(p=>p.parentIds.length===0));
});
test("1000 seeds: every person has complete, synchronized birth-to-death notebook",()=>{
 for(let seed=0;seed<1000;seed++){
  const w=createLivingLineage("notebook-"+seed,8);
  assert.deepEqual(validatePersonalNotebooks(w),[],"seed="+seed);
  const notebooks=createPersonalNotebooks(w),life=buildLifeBooks(w);
  assert.equal(notebooks.size,w.people.length);
  for(const p of w.people){
   const n=notebooks.get(p.id),source=life.get(p.id);
   assert.equal(n.entries.length,source.entries.length);
   assert.equal(n.entries[0].eventType,"birth");
   assert.deepEqual(n.entries.map(e=>e.year),[...n.entries.map(e=>e.year)].sort((a,b)=>a-b));
   for(const e of n.entries){
    assert.ok(e.year>=p.birthYear&&e.year<=(p.deathYear??w.year));
    assert.equal(e.stage,lifeStage(e.age));
    if(e.age<7)assert.equal(e.provenance,"family_record");
    assert.ok(!("sketch" in e));
   }
   if(!p.alive)assert.ok(n.entries.some(e=>e.eventType==="death"&&e.year===p.deathYear));
  }
 }
});
test("shared births, death, marriage and household changes appear in related books",()=>{
 const w=createLivingLineage("shared-notebook",8),books=createPersonalNotebooks(w);
 for(const child of w.people.filter(p=>p.parentIds.length===2))
  for(const parentId of child.parentIds)
   assert.ok(books.get(parentId).entries.some(e=>e.eventType==="child_birth"&&e.subjectId===child.id));
 for(const p of w.people.filter(p=>!p.alive))
  assert.ok(books.get(p.id).entries.some(e=>e.eventType==="death"));
 for(const marriage of w.marriages)
  for(const id of marriage.partnerIds)
   assert.ok(books.get(id).entries.some(e=>e.eventType==="household_move"));
});
test("notebook is deterministic, stage-filterable and unknown ID fails",()=>{
 const w=createLivingLineage("journal",8);
 assert.deepEqual(createPersonalNotebooks(w),createPersonalNotebooks(createLivingLineage("journal",8)));
 assert.match(formatPersonalNotebook(w,1),/Hayat Defteri/);
 assert.match(formatPersonalNotebook(w,1,{stage:"bebeklik"}),/aile kaydı/);
 assert.throws(()=>formatPersonalNotebook(w,-1));
 assert.throws(()=>formatPersonalNotebook(w,1,{stage:"not-a-stage"}));
});
test("a child's death is recorded in parents' and siblings' notebooks",()=>{
 const w=createLivingLineage("loss-test",8);
 const child=w.people.find(p=>p.generation===3&&p.parentIds.length===2&&p.age>=1);
 assert.ok(child);
 const deathYear=w.year;
 child.alive=false;child.deathYear=deathYear;child.age=deathYear-child.birthYear;
 child.history.push({year:deathYear,type:"death"});
 const household=w.households.find(h=>h.id===child.householdId);
 household.members=household.members.filter(id=>id!==child.id);child.householdId=null;
 const books=createPersonalNotebooks(w);
 for(const id of child.parentIds)
  assert.ok(books.get(id).entries.some(e=>e.eventType==="child_death"&&e.subjectId===child.id));
 for(const sibling of w.people.filter(p=>p.id!==child.id&&p.parentIds.some(id=>child.parentIds.includes(id))))
  assert.ok(books.get(sibling.id).entries.some(e=>e.eventType==="sibling_death"&&e.subjectId===child.id));
 assert.deepEqual(validatePersonalNotebooks(w),[]);
});
