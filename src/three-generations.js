import {RNG} from "./engine.js";
import {pickName,HOUSE_NAMES} from "./names.js";

// Three-generation demographic prototype. Events are created forward in time;
// no person or birth is inserted retroactively to satisfy a population quota.
export function generateThreeGenerations(seed=1,{families=4,endYear=1600}={}){
 if(!Number.isInteger(families)||families<1||families>24)throw new Error("families must be 1..24");
 const rng=new RNG(String(seed)+":three-generations:v1");
 const people=[],households=[],events=[],byId=new Map();
 let nextPerson=1,nextHouse=1;
 const house=(name,year,generation)=>{
  const h={id:nextHouse++,name,formedYear:year,generation,members:[]};
  households.push(h);return h;
 };
 const person=(sex,birthYear,surname,home,generation,parents=[])=>{
  const p={id:nextPerson++,name:pickName(rng,sex),surname,sex,age:0,birthYear,
   generation,householdId:home.id,originHouseholdId:home.id,
   parentIds:parents.map(x=>x.id),childIds:[],partnerId:null,previousPartnerIds:[],
   alive:true,deathYear:null,traits:[],hobby:null,history:[{year:birthYear,type:"birth"}]};
  people.push(p);byId.set(p.id,p);home.members.push(p.id);
  for(const parent of parents)parent.childIds.push(p.id);
  events.push({year:birthYear,type:"birth",personIds:[p.id],householdId:home.id});
  return p;
 };
 const marry=(a,b,year,home)=>{
  if(a.partnerId||b.partnerId||a.id===b.id)throw new Error("invalid marriage");
  a.partnerId=b.id;b.partnerId=a.id;
  for(const [p,other] of [[a,b],[b,a]]){
   p.history.push({year,type:"marriage",personId:other.id});
   const old=households.find(h=>h.id===p.householdId);
   old.members=old.members.filter(id=>id!==p.id);
   home.members.push(p.id);p.householdId=home.id;
   p.history.push({year,type:"household_move",householdId:home.id});
  }
  events.push({year,type:"marriage",personIds:[a.id,b.id],householdId:home.id});
 };
 const founders=[];
 // Founder birth dates and initial marriages are the explicit starting conditions.
 for(let i=0;i<families;i++){
  const surname=HOUSE_NAMES[i%HOUSE_NAMES.length];
  const start=endYear-rng.int(66,75);
  const home=house(surname+" kurucu hanesi",start,1);
  const a=person("M",start,surname,home,1);
  const b=person("F",start+rng.int(0,3),surname,home,1);
  const wedding=Math.max(a.birthYear,b.birthYear)+rng.int(18,22);
  a.partnerId=b.id;b.partnerId=a.id;
  a.history.push({year:wedding,type:"marriage",personId:b.id});
  b.history.push({year:wedding,type:"marriage",personId:a.id});
  events.push({year:wedding,type:"marriage",personIds:[a.id,b.id],householdId:home.id});
  founders.push([a,b]);
 }
 const second=[],third=[];
 const birth=(parents,year,generation)=>{
  const [a,b]=parents;
  if(year<a.birthYear+17||year<b.birthYear+17||year>endYear)throw new Error("invalid child year");
  const home=households.find(h=>h.id===a.householdId);
  if(!home||b.householdId!==home.id)throw new Error("parents not co-resident");
  return person(rng.chance(0.5)?"F":"M",year,a.surname,home,generation,parents);
 };
 // Year-by-year: only currently married adult parents may have children.
 for(let year=Math.min(...founders.flat().map(p=>p.birthYear));year<=endYear;year++){
  for(const couple of founders){
   const [a,b]=couple;
   if(!a.history.some(e=>e.type==="marriage"&&e.year<=year))continue;
   if(year-b.birthYear>39||year-a.birthYear>55)continue;
   if(couple.lastBirth!=null&&year-couple.lastBirth<2)continue;
   if(rng.chance(0.16)){
    const child=birth(couple,year,2);second.push(child);couple.lastBirth=year;
   }
  }
  // The second generation forms new households from unrelated founder families.
  const eligible=second.filter(p=>!p.partnerId&&year-p.birthYear>=18&&year-p.birthYear<=35);
  const men=eligible.filter(p=>p.sex==="M");
  const women=eligible.filter(p=>p.sex==="F");
  for(const a of men){
   if(a.partnerId||!rng.chance(0.24))continue;
   const choices=women.filter(b=>!b.partnerId&&b.originHouseholdId!==a.originHouseholdId&&
    Math.abs(a.birthYear-b.birthYear)<=10);
   if(!choices.length)continue;
   const b=rng.pick(choices),home=house(a.surname+" yeni hanesi",year,2);
   marry(a,b,year,home);
  }
  for(const a of second){
   if(a.sex!=="M"||!a.partnerId)continue;
   const b=byId.get(a.partnerId);
   if(year-b.birthYear>39||year-a.birthYear>55||year-b.birthYear<17)continue;
   if(a.lastBirth!=null&&year-a.lastBirth<2)continue;
   if(rng.chance(0.16)){
    const child=birth([a,b],year,3);third.push(child);a.lastBirth=year;
   }
  }
 }
 for(const p of people)p.age=endYear-p.birthYear;
 const familyTrees=founders.map((pair,i)=>({
  id:i+1,ancestorIds:pair.map(p=>p.id),
  parentIds:second.filter(p=>p.parentIds.includes(pair[0].id)).map(p=>p.id),
  grandchildIds:third.filter(p=>p.parentIds.some(id=>second.some(q=>q.id===id&&q.parentIds.includes(pair[0].id)))).map(p=>p.id)
 }));
 return {seed:String(seed),year:endYear,people,households,familyTrees,events,
  generationLimit:3,observerPersonId:null,marriages:events.filter(e=>e.type==="marriage"),
  deceasedIds:[],generationCounts:[1,2,3].map(g=>people.filter(p=>p.generation===g).length)};
}
export function validateThreeGenerations(world){
 const errors=[],byId=new Map(world.people.map(p=>[p.id,p]));
 if(byId.size!==world.people.length)errors.push("duplicate person IDs");
 if(world.people.some(p=>p.generation<1||p.generation>3))errors.push("generation limit exceeded");
 for(const p of world.people){
  if(p.age!==world.year-p.birthYear)errors.push("age mismatch: "+p.id);
  const home=world.households.find(h=>h.id===p.householdId);
  if(!home||!home.members.includes(p.id))errors.push("missing current household: "+p.id);
  for(const id of p.parentIds){
   const parent=byId.get(id);
   if(!parent||parent.generation!==p.generation-1||p.birthYear-parent.birthYear<17||
    !parent.childIds.includes(p.id))errors.push("invalid parent: "+p.id);
  }
  for(const e of p.history){
   if(e.year<p.birthYear||e.year>world.year)errors.push("event outside life: "+p.id);
   if(e.type==="marriage"&&!byId.get(e.personId)?.history.some(x=>x.type==="marriage"&&x.year===e.year&&x.personId===p.id))
    errors.push("asymmetric marriage: "+p.id);
  }
  if(p.partnerId&&byId.get(p.partnerId)?.partnerId!==p.id)errors.push("asymmetric current spouse: "+p.id);
 }
 for(const h of world.households)for(const id of h.members)if(byId.get(id)?.householdId!==h.id)
  errors.push("duplicate household membership: "+id);
 if(world.people.filter(p=>p.generation===3).some(p=>p.childIds.length))errors.push("fourth generation child");
 return errors;
}
