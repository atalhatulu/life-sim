import test from "node:test";
import assert from "node:assert/strict";
import {createMonthlyVillage} from "../src/monthly-life.js";
import {buildVillageSnapshot} from "../src/village-1600.js";
test("hobbies, childhood and family details in 1600 profiles have simulated evidence",()=>{
 for(let seed=1;seed<=100;seed++){
  const w=createMonthlyVillage(seed),v=buildVillageSnapshot(w);
  for(const p of v.profiles){
   if(p.hobby)assert.ok(p.history.some(e=>e.type==="hobby_discovered"&&e.details.hobby===p.hobby),"hobby evidence "+seed+" "+p.id);
   if(p.childhood.path)assert.ok(p.history.some(e=>e.type==="childhood_path"&&e.details.path===p.childhood.path),"childhood evidence "+seed+" "+p.id);
   assert.ok(p.history.every(e=>e.at<=w.year*12+w.month-1),"future event "+seed+" "+p.id);
   assert.ok(p.children.every(c=>w.people.some(x=>x.id===c.id&&x.parentIds.includes(p.id))),"child evidence "+seed+" "+p.id);
   assert.ok(p.parents.every(parent=>w.people.some(x=>x.id===parent.id&&x.childIds.includes(p.id))),"parent evidence "+seed+" "+p.id);
  }
 }
});
