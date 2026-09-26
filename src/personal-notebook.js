import {buildLifeBooks} from "./life-book.js";
import {RNG} from "./engine.js";

// One event source, two readings: the life book is the canonical chronology;
// this notebook renders every relevant event for every person, including infants.
// "record" pages are not falsely attributed to the character's own memory.
const STAGES=[["bebeklik",0,2],["çocukluk",3,12],["gençlik",13,17],["yetişkinlik",18,59],["yaşlılık",60,Infinity]];
export function lifeStage(age){return STAGES.find(([,min,max])=>age>=min&&age<=max)[0];}
const full=p=>p?p.name+" "+p.surname:"?";
const sentence=(entry,person,subject,rng)=>{
 const name=subject?.name??"bir yakını";
 const variations={
  birth:[person.name+" dünyaya geldi.",person.name+" aileye katıldı."],
  marriage:[name+" ile evlendi.",name+" ile yeni bir hane kurdu."],
  child_birth:[name+" dünyaya geldi; aileye yeni bir çocuk katıldı.",name+" doğdu. Hane bir kişi büyüdü."],
  sibling_birth:[name+" doğdu; artık bir kardeşi daha var.",name+" aileye katıldı. Kardeş sayısı arttı."],
  parent_death:[name+" hayatını kaybetti; ailesindeki yeri boş kaldı.",name+" öldü. Aile bir ebeveynini kaybetti."],
  grandparent_death:[name+" hayatını kaybetti; ailenin eski kuşağından biri eksildi.",name+" öldü. Ailenin geçmişinden bir kişi daha ayrıldı."],
  widowed:[name+" hayatını kaybetti; evliliği ölümle sona erdi.",name+" öldü. Eşini kaybetti."],
  death:[person.name+" hayatını kaybetti.",person.name+"'in hayatı sona erdi."],
  household_move:["Başka bir haneye taşındı.","Yaşadığı hane değişti."]
 };
 return rng.pick(variations[entry.type]??[entry.label+(subject&&subject.id!==person.id?" — "+full(subject):"")+"."]);
};
export function createPersonalNotebooks(world){
 const byId=new Map(world.people.map(p=>[p.id,p]));
 const lifeBooks=buildLifeBooks(world),books=new Map();
 for(const person of world.people){
  const life=lifeBooks.get(person.id);
  const entries=life.entries.map((event,index)=>{
   const rng=new RNG(world.seed+":notebook:"+person.id+":"+event.year+":"+event.type+":"+event.subjectId+":"+index);
   const stage=lifeStage(event.age);
   const provenance=event.age<7?"family_record":"life_account";
   return {year:event.year,age:event.age,stage,eventType:event.type,
    subjectId:event.subjectId,provenance,text:sentence(event,person,byId.get(event.subjectId),rng)};
  });
  books.set(person.id,{personId:person.id,owner:full(person),birthYear:person.birthYear,
   deathYear:person.deathYear??null,alive:person.alive!==false,
   parentIds:[...life.parentIds],childIds:[...life.childIds],
   partnerId:life.partnerId,previousPartnerIds:[...life.previousPartnerIds],
   entries});
 }
 return books;
}
export function formatPersonalNotebook(world,id,{stage=null}={}){
 const person=world.people.find(p=>p.id===id);
 if(!person)throw new Error("Unknown person ID: "+id);
 if(stage!==null&&!STAGES.some(([name])=>name===stage))throw new Error("Unknown life stage: "+stage);
 const book=createPersonalNotebooks(world).get(id),byId=new Map(world.people.map(p=>[p.id,p]));
 const names=ids=>ids.length?ids.map(i=>full(byId.get(i))+" (#"+i+")").join(", "):"?";
 const lines=[book.owner+" — Hayat Defteri",
  "Doğum: "+book.birthYear+" | "+(book.alive?"Hayatta":"Ölüm: "+book.deathYear),
  "Anne-baba: "+names(book.parentIds),"Çocuklar: "+names(book.childIds),
  "Eş: "+(book.partnerId?names([book.partnerId]):"?"),
  "Önceki eş bağları: "+names(book.previousPartnerIds)];
 let previous=null;
 for(const e of book.entries.filter(e=>stage===null||e.stage===stage)){
  if(e.stage!==previous){lines.push("","— "+e.stage.toLocaleUpperCase("tr-TR")+" —");previous=e.stage;}
  lines.push(e.year+" · "+e.age+" yaş"+(e.provenance==="family_record"?" · aile kaydı":"")+": "+e.text);
 }
 if(previous===null)lines.push("","Bu döneme ait kayıt bulunmuyor.");
 return lines.join("\n");
}
export function validatePersonalNotebooks(world){
 const errors=[],books=createPersonalNotebooks(world),lifeBooks=buildLifeBooks(world);
 if(books.size!==world.people.length)errors.push("missing notebooks");
 for(const person of world.people){
  const notebook=books.get(person.id),life=lifeBooks.get(person.id);
  if(!notebook){errors.push("missing notebook: "+person.id);continue;}
  if(notebook.entries.length!==life.entries.length)errors.push("event count mismatch: "+person.id);
  for(let i=0;i<notebook.entries.length;i++){
   const e=notebook.entries[i],source=life.entries[i];
   if(!source||e.year!==source.year||e.eventType!==source.type||e.subjectId!==source.subjectId)
    errors.push("event divergence: "+person.id+":"+i);
   if(e.age<0||e.year>(person.deathYear??world.year)||e.stage!==lifeStage(e.age))
    errors.push("invalid notebook timeline: "+person.id+":"+i);
   if(e.age<7&&e.provenance!=="family_record")errors.push("infant false memory: "+person.id+":"+i);
   if("sketch" in e||"handwriting" in e)errors.push("obsolete drawing field: "+person.id+":"+i);
  }
 }
 return errors;
}
