import test from "node:test";
import assert from "node:assert/strict";
import {createVillageHistory} from "../src/village-history.js";
import {census,formatCensus} from "../src/census.js";
test("300 villages have complete household census and coherent ages",()=>{
 for(let i=0;i<300;i++){
  const world=createVillageHistory("census-"+i,4),c=census(world);
  assert.equal(c.houses.reduce((n,h)=>n+h.count,0),c.population);
  assert.equal(Object.values(c.ageGroups).reduce((a,b)=>a+b,0),c.population);
  assert.equal(c.sex.female+c.sex.male,c.population);
  const ids=c.houses.flatMap(h=>h.members.map(p=>p.id));
  assert.equal(new Set(ids).size,ids.length);
  assert.ok(c.houses.every(h=>h.count>0));
  for(const h of c.houses)for(const p of h.members){
   assert.ok(p.age>=0);
   assert.ok(p.history.every(e=>e.year<=world.year));
  }
  assert.match(formatCensus(c,{householdId:c.houses[0].id}),/HANE/);
 }
});
