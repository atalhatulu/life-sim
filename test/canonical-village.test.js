import test from "node:test";
import assert from "node:assert/strict";
import {mkdtempSync,rmSync,readFileSync,writeFileSync} from "node:fs";
import {tmpdir} from "node:os";
import {join} from "node:path";
import {createCanonicalSnapshot,saveCanonicalSnapshot,loadCanonicalSnapshot,validateCanonicalSnapshot} from "../src/canonical-village.js";
test("canonical Üyük is deterministic and its people persist across save/load",()=>{
 const a=createCanonicalSnapshot(),b=createCanonicalSnapshot();
 assert.deepEqual(a,b);
 assert.deepEqual(validateCanonicalSnapshot(a),[]);
 const dir=mkdtempSync(join(tmpdir(),"uyuk-world-")),path=join(dir,"village.json");
 try{
  saveCanonicalSnapshot(path);
  const loaded=loadCanonicalSnapshot(path);
  assert.deepEqual(loaded,a);
  assert.throws(()=>saveCanonicalSnapshot(path),/refusing to overwrite/);
  const changed=JSON.parse(readFileSync(path,"utf8"));
  changed.world.people[0].name="DEĞİŞTİRİLDİ";
  writeFileSync(path,JSON.stringify(changed));
  assert.throws(()=>loadCanonicalSnapshot(path),/checksum mismatch/);
 }finally{rmSync(dir,{recursive:true,force:true});}
});
