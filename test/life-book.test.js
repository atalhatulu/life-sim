import test from "node:test";
import assert from "node:assert/strict";
import {createLivingLineage} from "../src/lineage.js";
import {buildLifeBooks,formatLifeBook,validateLifeBooks} from "../src/life-book.js";
test("every generated character has a birth-to-present or birth-to-death book",()=>{
 for(let seed=0;seed<1000;seed++){
  const world=createLivingLineage("book-"+seed,8);
  assert.deepEqual(validateLifeBooks(world),[],"seed="+seed);
  const books=buildLifeBooks(world);
  assert.equal(books.size,world.people.length);
  for(const p of world.people) {
   const b=books.get(p.id);
   assert.equal(b.entries[0].type,"birth");
   assert.ok(b.entries.every(e=>e.year>=p.birthYear&&e.year<=(p.deathYear??world.year)));
   assert.deepEqual(b.entries.map(e=>e.year),[...b.entries.map(e=>e.year)].sort((a,b)=>a-b));
  }
 }
});
test("child birth is recorded in both parents' books",()=>{
 const world=createLivingLineage("shared",8),books=buildLifeBooks(world);
 for(const child of world.people.filter(p=>p.parentIds.length===2)){
  for(const parentId of child.parentIds) {
   const parentBook=books.get(parentId);
   assert.ok(parentBook.entries.some(e=>e.type==="child_birth"&&e.subjectId===child.id));
  }
 }
});
test("life book is reproducible and unknown ID fails",()=>{
 const w=createLivingLineage("book",8);
 assert.equal(formatLifeBook(w,1),formatLifeBook(createLivingLineage("book",8),1));
 assert.throws(()=>formatLifeBook(w,-1));
});
