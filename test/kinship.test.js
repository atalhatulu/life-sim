import test from "node:test";
import assert from "node:assert/strict";
import {generateGenealogy} from "../src/genealogy.js";
import {kinshipIndex} from "../src/kinship.js";
test("grandchildren have four ancestors two generations back",()=>{
 const w=generateGenealogy("ancestry",5),k=kinshipIndex(w);
 for(const tree of w.familyTrees)for(const id of tree.grandchildIds){
  assert.equal(k.parents(id).length,2);
  assert.equal(k.ancestors(id,2).filter(x=>x.depth===2).length,4);
  assert.ok(k.descendants(tree.ancestorIds[0]).some(x=>x.person.id===id));
 }
});
test("siblings share parents and do not include self",()=>{
 const w=generateGenealogy("siblings"),k=kinshipIndex(w);
 for(const p of w.people)for(const sibling of k.siblings(p.id)){
  assert.notEqual(sibling.id,p.id);
  assert.ok(sibling.parentIds.some(id=>p.parentIds.includes(id)));
 }
});
test("unknown IDs return empty results",()=>{
 const k=kinshipIndex(generateGenealogy("missing"));
 assert.equal(k.get(-1),null);assert.deepEqual(k.ancestors(-1),[]);assert.deepEqual(k.descendants(-1),[]);
});
