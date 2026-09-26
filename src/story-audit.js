import {createVillageHistory,validateVillageHistory} from "./village-history.js";
import {buildLifeBooks,validateLifeBooks} from "./life-book.js";
import {createPersonalNotebooks,validatePersonalNotebooks} from "./personal-notebook.js";

const isAlive=(p,y)=>p.birthYear<=y&&(p.deathYear==null||y<=p.deathYear);
const key=(id,y,type,subject)=>[id,y,type,subject].join(":");
export function auditVillage(world){
 const findings=[],byId=new Map(world.people.map(p=>[p.id,p]));
 const books=buildLifeBooks(world),notebooks=createPersonalNotebooks(world);
 const add=(severity,code,personId,year,detail)=>findings.push({severity,code,seed:world.seed,personId,year,detail});
 for(const message of [...validateVillageHistory(world),...validateLifeBooks(world),...validatePersonalNotebooks(world)])
  add("error","validator",null,null,message);
 const index=new Set();
 for(const p of world.people){
  const book=books.get(p.id),notebook=notebooks.get(p.id);
  for(const e of book.entries)index.add(key(p.id,e.year,e.type,e.subjectId));
  for(const parentId of p.parentIds){
   const parent=byId.get(parentId);
   if(!parent)continue;
   if(parent.birthYear>p.birthYear-16)add("error","parent_too_young",p.id,p.birthYear,"parent="+parentId);
   if(parent.deathYear!=null&&parent.deathYear<p.birthYear)add("error","birth_after_parent_death",p.id,p.birthYear,"parent="+parentId);
  }
  for(const e of p.history){
   if(e.year<p.birthYear||!isAlive(p,e.year))add("error","event_outside_life",p.id,e.year,e.type);
   if(e.personId!=null&&!byId.has(e.personId))add("error","unknown_event_person",p.id,e.year,e.type+": "+e.personId);
   if(e.type==="marriage"){
    const partner=byId.get(e.personId);
    if(!partner||!isAlive(partner,e.year))add("error","marriage_partner_not_alive",p.id,e.year,String(e.personId));
    if(e.year-p.birthYear<16)add("error","underage_marriage",p.id,e.year,String(e.personId));
    if(partner&&!partner.history.some(x=>x.type==="marriage"&&x.year===e.year&&x.personId===p.id))
     add("error","asymmetric_marriage_history",p.id,e.year,"partner="+partner.id);
   }
   if(["household_cooperation","neighbour_aid"].includes(e.type)){
    const other=byId.get(e.personId);
    if(!other||!isAlive(other,e.year))add("error","shared_event_outside_life",p.id,e.year,String(e.personId));
    else if(!other.history.some(x=>x.type===e.type&&x.year===e.year&&x.personId===p.id))
     add("error","missing_counterpart_history",p.id,e.year,e.type+" other="+other.id);
   }
  }
  if(p.generation===1&&p.parentIds.length)add("error","founder_has_parents",p.id,p.birthYear,"founder ancestry must be unknown");
  if(p.generation===2&&p.parentIds.length){
   const parent=byId.get(p.parentIds[0]);
   if(parent&&p.originHouseholdId!==parent.originHouseholdId)
    add("error","incorrect_birth_house",p.id,p.birthYear,"parent="+parent.id);
  }
  if(book.entries.length!==notebook.entries.length)add("error","notebook_length",p.id,null,"source mismatch");
  if(!book.entries.some(e=>e.type==="birth"&&e.year===p.birthYear))add("error","missing_birth",p.id,p.birthYear,"");
  if(p.deathYear!=null&&!book.entries.some(e=>e.type==="death"&&e.year===p.deathYear))
   add("error","missing_death",p.id,p.deathYear,"");
  for(const e of notebook.entries){
   if(e.age<7&&e.provenance!=="family_record")add("error","infant_memory",p.id,e.year,e.eventType);
   if(e.text.includes("undefined")||e.text.includes("NaN"))add("error","broken_narrative",p.id,e.year,e.text);
  }
 }
 for(const p of world.people){
  for(const parentId of p.parentIds){
   const parent=byId.get(parentId);
   if(parent&&isAlive(parent,p.birthYear)&&!index.has(key(parent.id,p.birthYear,"child_birth",p.id)))
    add("error","parent_missing_birth_entry",parent.id,p.birthYear,"child="+p.id);
  }
  for(const id of p.childIds){
   const child=byId.get(id);
   if(child?.deathYear!=null&&isAlive(p,child.deathYear)&&!index.has(key(p.id,child.deathYear,"child_death",id)))
    add("error","parent_missing_child_death",p.id,child.deathYear,"child="+id);
  }
 }
 for(const event of world.villageHistory.events){
  if(["neighbour_aid","household_cooperation"].includes(event.type)){
   for(const id of event.personIds){
    const other=event.personIds.find(x=>x!==id);
    if(!index.has(key(id,event.year,event.type,other)))
     add("error","missing_shared_notebook_event",id,event.year,event.type+" other="+other);
   }
  }
 }
 // A warning identifies a modelling limitation, not a logically impossible biography.
 if(world.villageHistory.timeline.length&&world.people.some(p=>p.generation===3))
  add("warning","preassigned_demography",null,null,"Births, marriages and founder deaths are preassigned, not caused by annual replay.");
 return {seed:world.seed,people:world.people.length,years:world.villageHistory.timeline.length,
  events:world.villageHistory.events.length,findings};
}
export function auditSeeds({count=100,seedPrefix="story-audit",familyCount=4}={}){
 if(!Number.isInteger(count)||count<1||count>10000)throw new Error("count must be 1..10000");
 const reports=[],findings=[];
 for(let i=0;i<count;i++){
  const report=auditVillage(createVillageHistory(seedPrefix+"-"+i,familyCount));
  reports.push({seed:report.seed,people:report.people,years:report.years,events:report.events,
   errors:report.findings.filter(f=>f.severity==="error").length});
  findings.push(...report.findings);
 }
 return {count,totalPeople:reports.reduce((n,r)=>n+r.people,0),
  totalEvents:reports.reduce((n,r)=>n+r.events,0),
  errors:findings.filter(f=>f.severity==="error"),
  warnings:findings.filter(f=>f.severity==="warning"),
  reports};
}
