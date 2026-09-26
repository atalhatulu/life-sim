import test from "node:test";
import assert from "node:assert/strict";
import {generateGenealogy,validateGenealogy} from "../src/genealogy.js";
test("same seed produces the same ancestry",()=>assert.deepEqual(generateGenealogy("uyuk"),generateGenealogy("uyuk")));
test("different seeds produce different ancestry",()=>assert.notDeepEqual(generateGenealogy("a"),generateGenealogy("b")));
test("three generations have reciprocal kinship and valid households",()=>{
 for(let seed=0;seed<100;seed++){
  const w=generateGenealogy(seed,4);
  assert.deepEqual(validateGenealogy(w),[]);
  assert.deepEqual([...new Set(w.people.map(p=>p.generation))],[1,2,3]);
  assert.equal(w.familyTrees.length,4);
  assert.equal(w.observerPersonId,null);
  for(const tree of w.familyTrees) assert.ok(tree.grandchildIds.length>0);
 }
});
test("invalid family count rejected",()=>assert.throws(()=>generateGenealogy("x",0)));
