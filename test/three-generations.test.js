import test from "node:test";
import assert from "node:assert/strict";
import {generateThreeGenerations,validateThreeGenerations} from "../src/three-generations.js";
test("seed 1 is stable and stops after grandchildren",()=>{
 const a=generateThreeGenerations(1),b=generateThreeGenerations(1);
 assert.deepEqual(a,b);
 assert.deepEqual(validateThreeGenerations(a),[]);
 assert.equal(a.seed,"1");
 assert.equal(a.generationLimit,3);
 assert.ok(a.generationCounts.every(n=>n>0));
 assert.ok(a.people.every(p=>p.generation<=3));
 assert.equal(a.generationCounts[0],16);
 assert.ok(a.people.filter(p=>p.generation===3).every(p=>p.childIds.length===0));
});
test("500 seeds have chronological parents and no fourth generation",()=>{
 for(let i=1;i<=500;i++){
  const w=generateThreeGenerations(i);
  assert.deepEqual(validateThreeGenerations(w),[],"seed "+i);
  assert.equal(w.generationCounts.reduce((a,b)=>a+b),w.people.length);
  assert.ok(w.events.every(e=>e.year<=1600));
  assert.ok(w.people.filter(p=>p.generation===3).every(p=>p.childIds.length===0));
 }
});
