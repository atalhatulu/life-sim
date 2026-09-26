// A read-only view of the forward-simulated village, never a generated backstory.
const date=at=>at===null?null:`${Math.floor(at/12)}/${String(at%12+1).padStart(2,"0")}`;
const name=p=>p?`${p.name} ${p.surname}`:null;
export function buildVillageSnapshot(world){
 const at=world.year*12+world.month-1;
 const byId=new Map(world.people.map(p=>[p.id,p]));
 const households=new Map(world.households.map(h=>[h.id,h]));
 const profiles=world.people.filter(p=>p.alive).map(p=>{
  const h=households.get(p.householdId);
  const childhood=p.childhood;
  return {
   id:p.id,name:name(p),sex:p.sex,age:Math.floor((at-p.bornAt)/12),
   birthDate:date(p.bornAt),generation:p.generation,householdId:h.id,household:h.label,
   parents:p.parentIds.map(id=>({id,name:name(byId.get(id)),alive:byId.get(id).alive})),
   partner:p.partnerId?{id:p.partnerId,name:name(byId.get(p.partnerId))}:null,
   formerPartners:p.previousPartnerIds.map(id=>({id,name:name(byId.get(id))})),
   children:p.childIds.map(id=>({id,name:name(byId.get(id)),alive:byId.get(id).alive})),
   guardian:p.guardianId?{id:p.guardianId,name:name(byId.get(p.guardianId))}:null,
   traits:{...p.traits},skills:{...p.skills},hobby:p.hobby,
   childhood:{path:p.educationDecision,months:childhood.months,
    averageCare:childhood.months?Math.round(childhood.careSum/childhood.months):null,
    learningMonths:childhood.learningMonths,workMonths:childhood.workMonths,
    lowCareMonths:childhood.lowCareMonths},
   health:{...p.state},accidents:p.accidents,bereavements:p.bereavements,
   history:p.history.filter(e=>e.at<=at).map(e=>({
    type:e.type,date:date(e.at),at:e.at,personIds:[...e.personIds],
    details:Object.fromEntries(Object.entries(e).filter(([k])=>!["type","at","year","month","personIds","householdId"].includes(k)))
   }))
  };
 }).sort((a,b)=>a.householdId-b.householdId||a.id-b.id);
 return {date:date(at),seed:world.seed,version:world.version,
  population:profiles.length,households:world.households.filter(h=>h.members.length).map(h=>({
   id:h.id,label:h.label,memberIds:[...h.members]})),profiles};
}
export function validateVillageSnapshot(world,snapshot=buildVillageSnapshot(world)){
 const errors=[],at=world.year*12+world.month-1;
 const alive=world.people.filter(p=>p.alive);
 if(snapshot.population!==alive.length||snapshot.profiles.length!==alive.length)errors.push("population mismatch");
 const ids=new Set(snapshot.profiles.map(p=>p.id));
 if(ids.size!==snapshot.profiles.length)errors.push("duplicate profile");
 for(const p of snapshot.profiles){
  const source=world.people.find(x=>x.id===p.id);
  const home=world.households.find(h=>h.id===p.householdId);
  if(!source?.alive||!home?.members.includes(p.id))errors.push("invalid resident "+p.id);
  if(p.history.some(e=>e.at<source.bornAt||e.at>at||source.deathAt!==null&&e.at>source.deathAt))errors.push("invalid history "+p.id);
  if(p.guardian&&!world.people.some(x=>x.id===p.guardian.id))errors.push("missing guardian "+p.id);
 }
 return errors;
}
