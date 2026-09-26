import { RNG } from "./engine.js";
import { pickName, HOUSE_NAMES } from "./names.js";

// Three generations are generated from ancestors forward, never from a player avatar.
const FEMALE = ["Ayşe","Fatma","Emine","Hatice","Zeynep","Elif","Meryem"];
const MALE = ["Mehmet","Ali","Hasan","Mustafa","Hüseyin","İbrahim","Osman"];
const FAMILIES = ["Demir","Kaya","Çelik","Arslan","Aydın","Şahin","Yıldız","Akın"];
const TRAITS = ["sabırlı","meraklı","inatçı","yardımsever","çekingen","girişken","titiz","sakin"];
const HOBBIES = ["bahçecilik","balık tutmak","oyma yapmak","hikâye anlatmak","türkü söylemek","yürüyüş"];
export function generateGenealogy(seed = "uyuk-1600", familyCount = 4, year = 1600) {
  if (!Number.isInteger(familyCount) || familyCount < 1 || familyCount > 100) throw new Error("familyCount must be 1..100");
  if (!Number.isInteger(year)) throw new Error("year must be an integer");
  const rng = new RNG(seed), people = [], households = [], familyTrees = [];
  let nextPerson = 1, nextHouse = 1;
  const makeHouse = (name, generation) => {
    const h = { id: nextHouse++, name, generation, members: [] };
    households.push(h); return h;
  };
  const makePerson = ({sex,age,surname,household,generation,parents=[]}) => {
    const p = {id:nextPerson++,name:pickName(rng,sex),surname,sex,age,birthYear:year-age,
      generation,householdId:household.id,parentIds:parents.map(x=>x.id),childIds:[],partnerId:null,
      traits:[rng.pick(TRAITS),rng.pick(TRAITS)],hobby:rng.pick(HOBBIES),
      history:[{year:year-age,type:"birth"}]};
    people.push(p); household.members.push(p.id);
    for(const parent of parents) parent.childIds.push(p.id);
    return p;
  };
  const partner = (a,b,marriageYear) => {
    a.partnerId=b.id; b.partnerId=a.id;
    a.history.push({year:marriageYear,type:"marriage",personId:b.id});
    b.history.push({year:marriageYear,type:"marriage",personId:a.id});
  };
  for(let i=0;i<familyCount;i++) {
    const surnameA=HOUSE_NAMES[(i*2)%HOUSE_NAMES.length], surnameB=HOUSE_NAMES[(i*2+1)%HOUSE_NAMES.length];
    const first=makeHouse(surnameA+" ata hanesi",1), second=makeHouse(surnameB+" ata hanesi",1);
    const grandfatherA=makePerson({sex:"M",age:rng.int(62,75),surname:surnameA,household:first,generation:1});
    const grandmotherA=makePerson({sex:"F",age:rng.int(60,73),surname:surnameA,household:first,generation:1});
    const grandfatherB=makePerson({sex:"M",age:rng.int(62,75),surname:surnameB,household:second,generation:1});
    const grandmotherB=makePerson({sex:"F",age:rng.int(60,73),surname:surnameB,household:second,generation:1});
    partner(grandfatherA,grandmotherA,year-Math.min(grandfatherA.age,grandmotherA.age)+18);partner(grandfatherB,grandmotherB,year-Math.min(grandfatherB.age,grandmotherB.age)+18);
    const childrenA=[], childrenB=[];
    for(let j=0,n=rng.int(2,3);j<n;j++) {
      const age=rng.int(29,42);
      childrenA.push(makePerson({sex:j===0?"M":rng.pick(["M","F"]),age,surname:surnameA,household:first,generation:2,parents:[grandfatherA,grandmotherA]}));
    }
    for(let j=0,n=rng.int(2,3);j<n;j++) {
      const age=rng.int(27,40);
      childrenB.push(makePerson({sex:j===0?"F":rng.pick(["M","F"]),age,surname:surnameB,household:second,generation:2,parents:[grandfatherB,grandmotherB]}));
    }
    const father=childrenA[0],mother=childrenB[0];
    const home=makeHouse(surnameA+" genç hanesi",2);
    for(const p of [father,mother]) {
      const old=households.find(h=>h.id===p.householdId);
      old.members=old.members.filter(id=>id!==p.id);home.members.push(p.id);p.householdId=home.id;
    }
    const marriageYear=year-Math.min(father.age,mother.age)+rng.int(18,22);
    partner(father,mother,marriageYear);
    const grandchildren=[];
    const oldest=Math.min(18,father.age-17,mother.age-17,year-marriageYear);
    for(let j=0,n=rng.int(1,4);j<n;j++) {
      const age=rng.int(0,Math.max(0,oldest));
      grandchildren.push(makePerson({sex:rng.pick(["M","F"]),age,surname:surnameA,household:home,generation:3,parents:[father,mother]}));
    }
    familyTrees.push({id:i+1,ancestorIds:[grandfatherA.id,grandmotherA.id,grandfatherB.id,grandmotherB.id],
      parentIds:[father.id,mother.id],grandchildIds:grandchildren.map(p=>p.id)});
  }
  return {seed:String(seed),year,people,households,familyTrees,observerPersonId:null};
}
export function validateGenealogy(world) {
  const errors=[], people=new Map(world.people.map(p=>[p.id,p])), houses=new Map(world.households.map(h=>[h.id,h]));
  if(people.size!==world.people.length) errors.push("duplicate person ID");
  for(const p of world.people) {
    const h=houses.get(p.householdId);
    if(!h || h.members.filter(id=>id===p.id).length!==1) errors.push("invalid household: "+p.id);
    if(p.birthYear!==world.year-p.age) errors.push("birth year mismatch: "+p.id);
    if(p.partnerId && people.get(p.partnerId)?.partnerId!==p.id) errors.push("asymmetric partner: "+p.id);
    for(const id of p.parentIds) {
      const parent=people.get(id);
      if(!parent || parent.age-p.age<16 || !parent.childIds.includes(p.id) || parent.generation>=p.generation)
        errors.push("invalid parent: "+p.id);
    }
    for(const id of p.childIds) if(!people.get(id)?.parentIds.includes(p.id)) errors.push("invalid child: "+p.id);
  }
  for(const h of world.households) for(const id of h.members) if(!people.has(id)) errors.push("missing person: "+id);
  return errors;
}
