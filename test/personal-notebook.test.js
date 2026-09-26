import test from "node:test";
import assert from "node:assert/strict";
import {createLivingLineage} from "../src/lineage.js";
import {createPersonalNotebooks,formatPersonalNotebook,validatePersonalNotebooks} from "../src/personal-notebook.js";
import {GIVEN_NAMES,HOUSE_NAMES} from "../src/names.js";
test("name palette is expanded and has no duplicate names per gender",()=>{
 assert.ok(GIVEN_NAMES.F.length>=25&&GIVEN_NAMES.M.length>=25&&HOUSE_NAMES.length>=20);
 for(const names of [GIVEN_NAMES.F,GIVEN_NAMES.M,HOUSE_NAMES])assert.equal(new Set(names).size,names.length);
});
test("1000 notebook populations have no infant memories or postmortem entries",()=>{
 for(let seed=0;seed<1000;seed++){
  const w=createLivingLineage("notebook-"+seed,8);
  assert.deepEqual(validatePersonalNotebooks(w),[],"seed="+seed);
  const books=createPersonalNotebooks(w);
  assert.equal(books.size,w.people.length);
  for(const p of w.people)for(const e of books.get(p.id).entries){
   assert.ok(e.age>=7);
   assert.ok(e.year<=(p.deathYear??w.year));
   assert.notEqual(e.eventType,"death");
  }
 }
});
test("notebook is deterministic, personal and not the full registry",()=>{
 const w=createLivingLineage("journal",8);
 assert.deepEqual(createPersonalNotebooks(w),createPersonalNotebooks(createLivingLineage("journal",8)));
 assert.match(formatPersonalNotebook(w,1),/Kişisel Defter/);
 assert.throws(()=>formatPersonalNotebook(w,-1));
});
