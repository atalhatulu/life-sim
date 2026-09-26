import test from "node:test";
import assert from "node:assert/strict";
import {createVillageHistory} from "../src/village-history.js";
import {auditVillage,auditSeeds} from "../src/story-audit.js";
test("100 generated villages have consistent cross-character biographies",()=>{
 const result=auditSeeds({count:100,seedPrefix:"audit-test"});
 assert.deepEqual(result.errors.slice(0,10),[]);
 assert.equal(result.errors.length,0);
 assert.ok(result.totalPeople>1000);
});
test("audit detects impossible family and shared event history",()=>{
 const w=createVillageHistory("audit-mutation",4);
 const child=w.people.find(p=>p.parentIds.length);
 const parent=w.people.find(p=>p.id===child.parentIds[0]);
 parent.deathYear=child.birthYear-1;
 const report=auditVillage(w);
 assert.ok(report.findings.some(f=>f.code==="birth_after_parent_death"));
});
