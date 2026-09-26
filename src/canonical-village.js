import {readFileSync,writeFileSync,mkdirSync,existsSync} from "node:fs";
import {dirname} from "node:path";
import {createHash} from "node:crypto";
import {createVillageHistory,validateVillageHistory} from "./village-history.js";
import {validatePersonalNotebooks} from "./personal-notebook.js";

export const CANONICAL_SEED="uyuk-1600";
export const WORLD_FORMAT=1;
export const DEFAULT_WORLD_PATH="data/uyuk-1600.world.json";
const digest=world=>createHash("sha256").update(JSON.stringify(world)).digest("hex");
export function createCanonicalSnapshot(){
 const world=createVillageHistory(CANONICAL_SEED,4,1600);
 const errors=[...validateVillageHistory(world),...validatePersonalNotebooks(world)];
 if(errors.length)throw new Error("Cannot freeze inconsistent village: "+errors.slice(0,5).join("; "));
 return {format:WORLD_FORMAT,villageId:"uyuk",seed:CANONICAL_SEED,year:1600,
  generator:"retrospective-v1",checksum:digest(world),world};
}
export function validateCanonicalSnapshot(snapshot){
 const errors=[];
 if(snapshot?.format!==WORLD_FORMAT||snapshot.villageId!=="uyuk"||
    snapshot.seed!==CANONICAL_SEED||snapshot.year!==1600)
  errors.push("unexpected canonical village metadata");
 if(!snapshot?.world)return [...errors,"missing world"];
 if(snapshot.world.seed!==CANONICAL_SEED||snapshot.world.year!==1600)
  errors.push("world identity mismatch");
 if(snapshot.checksum!==digest(snapshot.world))errors.push("world checksum mismatch");
 return [...errors,...validateVillageHistory(snapshot.world),...validatePersonalNotebooks(snapshot.world)];
}
export function saveCanonicalSnapshot(path=DEFAULT_WORLD_PATH,{overwrite=false}={}){
 if(existsSync(path)&&!overwrite)throw new Error("Canonical world exists; refusing to overwrite: "+path);
 const snapshot=createCanonicalSnapshot();
 mkdirSync(dirname(path),{recursive:true});
 writeFileSync(path,JSON.stringify(snapshot,null,2)+"\n",{flag:overwrite?"w":"wx"});
 return snapshot;
}
export function loadCanonicalSnapshot(path=DEFAULT_WORLD_PATH){
 const snapshot=JSON.parse(readFileSync(path,"utf8"));
 const errors=validateCanonicalSnapshot(snapshot);
 if(errors.length)throw new Error("Invalid canonical village: "+errors.slice(0,8).join("; "));
 return snapshot;
}
