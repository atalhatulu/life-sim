import { RNG } from "./engine.js";

// A private notebook is not the omniscient life book. It is a selective, fallible
// account: entries only start once the character can plausibly express memories.
const TEMPLATES={
 marriage:[
  "Bugün {person} ile aynı evi paylaşmaya başladık. Yeni bir hayatın eşiğindeyim.",
  "{person} ile evlendik. Ev kalabalıklaştı, aklımda söylenecek çok söz var.",
  "Düğün bitti. {person} ile bundan sonra nasıl bir hayat kuracağımızı merak ediyorum."
 ],
 child_birth:[
  "{person} dünyaya geldi. Küçücük ellerine uzun uzun baktım.",
  "Bugün {person} doğdu. Evdeki sesler bile değişti.",
  "{person} doğdu. Sevincimin yanında geçim derdi de aklımda."
 ],
 sibling_birth:[
  "Eve yeni bir bebek geldi: {person}. Herkes onun çevresinde.",
  "{person} doğdu. Artık evde bir kişi daha var.",
  "Kardeşim {person} dünyaya geldi. Onu henüz pek tanımıyorum."
 ],
 parent_death:[
  "{person} artık yok. Evde bıraktığı boşluk her köşede.",
  "{person} öldü. Söyleyemediğim sözler aklımda kaldı.",
  "Bugün {person}'i kaybettik. Ev eskisi gibi olmayacak."
 ],
 grandparent_death:[
  "{person}'i kaybettik. Anlattığı hikâyeleri unutmamaya çalışacağım.",
  "{person} öldü. Çocukluğumdan bir ses eksildi.",
  "{person} artık aramızda değil. Onunla ilgili hatırladıklarımı yazdım."
 ],
 widowed:[
  "{person} olmadan eve dönmek tuhaf. Her şey yerli yerinde, bir tek o yok.",
  "{person}'i kaybettim. Bugün pek yazmak istemiyorum.",
  "{person} öldü. Defterin bu sayfasını bitirmek güç."
 ]
};
const SKETCHES={
 marriage:["iki yan yana fincan","yeni evin kapısı"],
 child_birth:["küçük bir el izi","beşik ve örtü"],
 sibling_birth:["beşik","yan yana iki küçük figür"],
 parent_death:["boş sandalye","evin önündeki ağaç"],
 grandparent_death:["eski evin çatısı","baston ve ocak"],
 widowed:["yarım kalmış iki figür","boş sedir"]
};
const render=(template,name)=>template.replaceAll("{person}",name);
export function createPersonalNotebooks(world) {
 const byId=new Map(world.people.map(p=>[p.id,p]));
 const books=new Map();
 for(const person of world.people){
  const rng=new RNG(world.seed+":notebook:"+person.id);
  const entries=[];
  const earliest=person.birthYear+Math.max(7,rng.int(7,11));
  const events=[];
  for(const event of person.history??[])if(event.type!=="birth")events.push({...event,subjectId:event.personId??person.id});
  for(const id of person.childIds??[]){const p=byId.get(id);if(p)events.push({year:p.birthYear,type:"child_birth",subjectId:id});}
  for(const id of person.parentIds??[]){const p=byId.get(id);if(p?.deathYear!=null)events.push({year:p.deathYear,type:"parent_death",subjectId:id});}
  for(const p of world.people){
   if(p.id===person.id||!p.parentIds?.some(id=>person.parentIds?.includes(id)))continue;
   if(p.birthYear>=person.birthYear)events.push({year:p.birthYear,type:"sibling_birth",subjectId:p.id});
  }
  const unique=new Set();
  for(const event of events.sort((a,b)=>a.year-b.year||a.type.localeCompare(b.type))){
   if(event.year<earliest||event.year>(person.deathYear??world.year)||event.type==="death")continue;
   const key=event.year+":"+event.type+":"+event.subjectId;
   if(unique.has(key))continue;unique.add(key);
   const templates=TEMPLATES[event.type];if(!templates)continue;
   // Not every event is written down; this is the person's notebook, not a registry.
   if(!rng.chance(event.type==="parent_death"||event.type==="widowed"?0.92:0.72))continue;
   const subject=byId.get(event.subjectId);
   const name=subject?.name??"bir yakınım";
   const text=render(rng.pick(templates),name);
   const sketch=rng.chance(0.43)?rng.pick(SKETCHES[event.type]):null;
   entries.push({year:event.year,age:event.year-person.birthYear,eventType:event.type,
    subjectId:event.subjectId,text,sketch,handwriting:rng.pick(["düzenli","aceleci","sıkışık","iri harfli"]),
    provenance:"personal_expression"});
  }
  books.set(person.id,{personId:person.id,owner:person.name+" "+person.surname,
    earliestPossibleEntryYear:earliest,entries});
 }
 return books;
}
export function formatPersonalNotebook(world,id){
 const person=world.people.find(p=>p.id===id);
 if(!person)throw new Error("Unknown person ID: "+id);
 const book=createPersonalNotebooks(world).get(id);
 return [book.owner+" — Kişisel Defter","Bu defter hayatın eksiksiz kaydı değildir.",
  ...(book.entries.length?book.entries.flatMap(e=>["",e.year+" · "+e.age+" yaş",e.text,...(e.sketch?["[Karalama: "+e.sketch+"]"]:[])])
   :["Henüz yazılmış bir sayfa yok."])].join("\n");
}
export function validatePersonalNotebooks(world){
 const errors=[],books=createPersonalNotebooks(world),ids=new Set(world.people.map(p=>p.id));
 for(const p of world.people){
  const b=books.get(p.id);
  if(!b){errors.push("missing notebook: "+p.id);continue;}
  for(const e of b.entries){
   if(e.year<b.earliestPossibleEntryYear||e.year>(p.deathYear??world.year)||!ids.has(e.subjectId))
    errors.push("invalid notebook entry: "+p.id);
  }
 }
 return errors;
}
