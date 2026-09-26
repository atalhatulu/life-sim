// A life book is an objective, append-only chronology. Personal recollection is separate.
// Books are derived from the world's event history, so relationships remain linked by ID.
const EVENT_LABELS = {
  birth:"Doğum",marriage:"Evlilik",death:"Ölüm",widowed:"Eş kaybı",
  child_birth:"Çocuk doğumu",sibling_birth:"Kardeş doğumu",
  parent_death:"Ebeveyn kaybı",grandparent_death:"Büyükanne/büyükbaba kaybı",
  sibling_death:"Kardeş kaybı",child_death:"Çocuk kaybı",
  household_move:"Hane değişikliği",apprenticeship:"Meslek öğrenimi",
  food_shortage:"Hane erzak sıkıntısı",household_cooperation:"Hane dayanışması",neighbour_aid:"Komşuya yardım"
};
const fullName = p => p ? p.name+" "+p.surname : "Bilinmeyen kişi";
export function buildLifeBooks(world) {
  const byId=new Map(world.people.map(p=>[p.id,p]));
  const books=new Map();
  for(const person of world.people) {
    const entries=[], seen=new Set();
    const add=(year,type,subjectId,details={})=>{
      if(!Number.isInteger(year) || year<person.birthYear || year>(person.deathYear??world.year))return;
      const key=[year,type,subjectId??"",details.householdId??""].join(":");
      if(seen.has(key))return;
      seen.add(key);
      entries.push({year,age:year-person.birthYear,type,label:EVENT_LABELS[type]??type,subjectId:subjectId??null,...details});
    };
    add(person.birthYear,"birth",person.id,{narrator:"record"});
    for(const event of person.history??[]) {
      if(event.type==="birth")continue;
      add(event.year,event.type,event.personId??person.id,{...event,narrator:"record"});
    }
    for(const parentId of person.parentIds??[]) {
      const parent=byId.get(parentId);
      if(parent?.deathYear!==null && parent?.deathYear!==undefined)
        add(parent.deathYear,"parent_death",parentId,{narrator:"record"});
    }
    for(const sibling of world.people) {
      if(sibling.id===person.id || !sibling.parentIds?.some(id=>person.parentIds?.includes(id)))continue;
      if(sibling.birthYear>=person.birthYear)add(sibling.birthYear,"sibling_birth",sibling.id,{narrator:"record"});
      if(sibling.deathYear!=null)add(sibling.deathYear,"sibling_death",sibling.id,{narrator:"record"});
    }
    for(const childId of person.childIds??[]) {
      const child=byId.get(childId);
      if(child){add(child.birthYear,"child_birth",child.id,{narrator:"record"});
        if(child.deathYear!=null)add(child.deathYear,"child_death",child.id,{narrator:"record"});}
    }
    for(const grandparentId of new Set((person.parentIds??[]).flatMap(id=>byId.get(id)?.parentIds??[]))) {
      const grandparent=byId.get(grandparentId);
      if(grandparent?.deathYear!==null && grandparent?.deathYear!==undefined)
        add(grandparent.deathYear,"grandparent_death",grandparentId,{narrator:"record"});
    }
    entries.sort((a,b)=>a.year-b.year || (a.type==="birth"?-1:b.type==="birth"?1:0) || a.type.localeCompare(b.type));
    books.set(person.id,{personId:person.id,title:fullName(person)+" — Hayat Kitabı",
      birthYear:person.birthYear,deathYear:person.deathYear??null,alive:person.alive!==false,
      parentIds:[...(person.parentIds??[])],childIds:[...(person.childIds??[])],
      partnerId:person.partnerId??null,previousPartnerIds:[...(person.previousPartnerIds??[])],
      entries});
  }
  return books;
}
export function formatLifeBook(world,personId) {
  const person=world.people.find(p=>p.id===personId);
  if(!person)throw new Error("Unknown person ID: "+personId);
  const book=buildLifeBooks(world).get(personId);
  const byId=new Map(world.people.map(p=>[p.id,p]));
  const names=ids=>ids.length?ids.map(id=>fullName(byId.get(id))+" (#"+id+")").join(", "):"Yok / bilinmiyor";
  const lines=[book.title,"Doğum: "+book.birthYear+" | "+(book.alive?"Yaşıyor ("+person.age+" yaşında)":"Ölüm: "+book.deathYear+" ("+person.age+" yaşında)"),
    "Anne-baba: "+names(book.parentIds),"Çocuklar: "+names(book.childIds),
    "Eşi: "+(book.partnerId?names([book.partnerId]):"Yok"),
    "Önceki eş bağları: "+names(book.previousPartnerIds),"","Hayatın sayfaları:"];
  for(const entry of book.entries) {
    const subject=entry.subjectId && entry.subjectId!==personId?" — "+fullName(byId.get(entry.subjectId)):"";
    lines.push(entry.year+" | "+entry.age+" yaş: "+entry.label+subject);
  }
  return lines.join("\n");
}
export function validateLifeBooks(world) {
  const books=buildLifeBooks(world),errors=[];
  if(books.size!==world.people.length)errors.push("missing books");
  for(const person of world.people) {
    const book=books.get(person.id);
    if(!book || !book.entries.some(e=>e.type==="birth"&&e.year===person.birthYear))
      errors.push("missing birth: "+person.id);
    if(person.alive===false && !book?.entries.some(e=>e.type==="death"&&e.year===person.deathYear))
      errors.push("missing death: "+person.id);
    for(const entry of book?.entries??[]) {
      if(entry.age<0 || entry.year>(person.deathYear??world.year))errors.push("invalid timeline: "+person.id);
      if(entry.subjectId!==null && !world.people.some(p=>p.id===entry.subjectId))errors.push("missing subject: "+person.id);
    }
  }
  return errors;
}
