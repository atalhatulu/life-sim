import {RNG} from "./engine.js";
import {createLivingLineage,validateLivingLineage} from "./lineage.js";

// Retrospective village replay: family births/marriages/deaths are the fixed
// demographic inputs; annual household economy and shared village events are
// actually advanced from the first founder's birth to the target year.
const JOBS=["çiftçi","çoban","demirci","dokumacı","değirmenci","marangoz"];
const clamp=(n,a,b)=>Math.max(a,Math.min(b,n));
const aliveAt=(p,y)=>p.birthYear<=y&&(p.deathYear==null||p.deathYear>=y);
const ownHouse=(p,y)=>{
 const moves=(p.history??[]).filter(e=>e.type==="household_move"&&e.year<=y).sort((a,b)=>a.year-b.year);
 return moves.length?moves.at(-1).householdId:p.originHouseholdId;
};
export function createVillageHistory(seed="uyuk-1600",familyCount=4,year=1600){
 const world=createLivingLineage(seed,familyCount,year),rng=new RNG(seed+":village-history:v1");
 const byId=new Map(world.people.map(p=>[p.id,p]));
 const households=new Map(world.households.map(h=>[h.id,{id:h.id,name:h.name,food:22,coin:12,yearly:[]}]));
 const firstYear=Math.min(...world.people.map(p=>p.birthYear));
 const events=[],relations=new Map(),occupations=new Map(),timeline=[];
 const pair=(a,b)=>[a,b].sort((x,y)=>x-y).join(":");
 const link=(a,b,delta,reason,y)=>{
  if(a===b||!byId.has(a)||!byId.has(b))return;
  const key=pair(a,b),r=relations.get(key)??{personIds:[a,b],trust:50,sharedEvents:[]};
  r.trust=clamp(r.trust+delta,0,100);
  r.sharedEvents.push({year:y,reason,delta});relations.set(key,r);
 };
 for(const p of world.people){
  if(p.generation===1)continue;
  for(const id of p.parentIds)link(p.id,id,12,"ebeveyn-çocuk",p.birthYear);
 }
 for(const y of Array.from({length:year-firstYear+1},(_,i)=>firstYear+i)){
  const present=world.people.filter(p=>aliveAt(p,y));
  const homes=new Map();
  for(const p of present){
   const id=ownHouse(p,y);
   if(id==null)continue;
   if(!homes.has(id))homes.set(id,[]);
   homes.get(id).push(p);
  }
  const yearly={year:y,population:present.length,households:homes.size,events:[],foodProduced:0,foodConsumed:0};
  for(const [houseId,members] of [...homes].sort((a,b)=>a[0]-b[0])){
   const h=households.get(houseId);
   const workers=members.filter(p=>y-p.birthYear>=14);
   const mouths=members.reduce((n,p)=>n+(y-p.birthYear<7?0.6:1),0);
   const weather=rng.int(-2,2);
   const harvest=workers.reduce((n,p)=>n+(occupations.get(p.id)==="çiftçi"?7:3),0)+weather;
   const consumed=Math.ceil(mouths*3);
   h.food+=Math.max(0,harvest)-consumed;
   h.coin+=workers.filter(p=>occupations.get(p.id)!=="çiftçi").length*2;
   yearly.foodProduced+=Math.max(0,harvest);yearly.foodConsumed+=consumed;
   if(h.food<0){
    const shortage=Math.abs(h.food);h.food=0;
    const event={year:y,type:"food_shortage",householdId:houseId,severity:shortage,personIds:members.map(p=>p.id)};
    events.push(event);yearly.events.push(event);
    for(const p of members)p.history.push({year:y,type:"food_shortage",householdId:houseId,severity:shortage});
   }
   h.yearly.push({year:y,members:members.map(p=>p.id),workers:workers.length,food:h.food,coin:h.coin});
  }
  for(const p of present){
   const age=y-p.birthYear;
   if(age===14){
    const job=rng.pick(JOBS);occupations.set(p.id,job);
    p.history.push({year:y,type:"apprenticeship",job});
    const event={year:y,type:"apprenticeship",personIds:[p.id],job};
    events.push(event);yearly.events.push(event);
   }
   if(age>=14&&!occupations.has(p.id))occupations.set(p.id,rng.pick(JOBS));
   for(const event of p.history.filter(e=>e.year===y&&["marriage","death"].includes(e.type))){
    const related=event.type==="marriage"?[p.id,event.personId]:[p.id];
    const shared={year:y,type:event.type,personIds:related};
    events.push(shared);yearly.events.push(shared);
    if(event.type==="marriage"&&event.personId)link(p.id,event.personId,18,"evlilik",y);
   }
  }
  // Neighbours share actual annual contact only when alive and co-resident in a house.
  for(const members of homes.values())if(members.length>=2&&rng.chance(0.18)){
   const a=rng.pick(members),b=rng.pick(members.filter(p=>p.id!==a.id));
   link(a.id,b.id,1,"aynı hanede dayanışma",y);
   const event={year:y,type:"household_cooperation",personIds:[a.id,b.id],householdId:ownHouse(a,y)};
   events.push(event);yearly.events.push(event);
   for(const p of [a,b])p.history.push({year:y,type:"household_cooperation",personId:p.id===a.id?b.id:a.id});
  }
  // Inter-household exchanges make neighbours share a concrete history.
  const occupied=[...homes.keys()].sort((a,b)=>a-b);
  if(occupied.length>=2&&rng.chance(0.55)){
   const donorId=rng.pick(occupied),receiverId=rng.pick(occupied.filter(id=>id!==donorId));
   const donor=households.get(donorId),receiver=households.get(receiverId);
   if(donor.food>=8&&receiver.food<=donor.food){
    const amount=Math.min(3,donor.food-5);
    donor.food-=amount;receiver.food+=amount;
    const a=rng.pick(homes.get(donorId)),b=rng.pick(homes.get(receiverId));
    link(a.id,b,4,"komşu haneye erzak yardımı",y);
    const event={year:y,type:"neighbour_aid",personIds:[a.id,b.id],
      fromHouseholdId:donorId,toHouseholdId:receiverId,food:amount};
    events.push(event);yearly.events.push(event);
    for(const [p,other] of [[a,b],[b,a]])
      p.history.push({year:y,type:"neighbour_aid",personId:other.id,food:amount});
   }
  }
  timeline.push(yearly);
 }
 world.villageHistory={startYear:firstYear,endYear:year,events,timeline,
  householdLedgers:[...households.values()],relations:[...relations.values()],
  occupations:[...occupations].map(([personId,job])=>({personId,job}))};
 return world;
}
export function validateVillageHistory(world){
 const errors=validateLivingLineage(world),v=world.villageHistory;
 if(!v)return [...errors,"missing village history"];
 const byId=new Map(world.people.map(p=>[p.id,p]));
 for(const e of v.events){
  if(e.year<v.startYear||e.year>world.year)errors.push("event out of range");
  for(const id of e.personIds??[]){
   const p=byId.get(id);
   if(!p||!aliveAt(p,e.year))errors.push("event participant outside lifetime: "+id);
  }
 }
 for(const h of v.householdLedgers)for(const row of h.yearly){
  if(row.food<0||row.coin<0)errors.push("negative household resources: "+h.id);
  for(const id of row.members)if(!aliveAt(byId.get(id),row.year))errors.push("invalid household membership: "+id);
 }
 return errors;
}
