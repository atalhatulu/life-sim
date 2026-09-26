import test from "node:test";
import assert from "node:assert/strict";
import {createVillage,stepDay,validateVillage} from "../src/engine.js";
test("same seed generates identical village",()=>assert.deepEqual(createVillage("sample"),createVillage("sample")));
test("different seeds generate different villages",()=>assert.notDeepEqual(createVillage("a"),createVillage("b")));
test("kinship and household invariants",()=>{for(let i=0;i<100;i++) assert.deepEqual(validateVillage(createVillage(i)),[]);});
test("daily simulation is deterministic and remains valid",()=>{
 const a=createVillage("simulation"), b=createVillage("simulation");
 for(let day=0;day<90;day++){stepDay(a);stepDay(b);}
 assert.deepEqual(a,b);assert.deepEqual(validateVillage(a),[]);
 assert.equal(a.day,90);assert.ok(a.history.some(e=>e.activity==="work"));assert.ok(a.history.some(e=>e.activity==="visit"));
});
test("invalid household count rejected",()=>assert.throws(()=>createVillage(1,0)));
