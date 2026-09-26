import {createVillageHistory} from "./village-history.js";
import {loadCanonicalSnapshot} from "./canonical-village.js";

const full=p=>p.name+" "+p.surname;
const ageGroup=age=>age<=2?"bebek":age<=12?"çocuk":age<=17?"genç":age<=39?"genç yetişkin":age<=59?"orta yaşlı":"yaşlı";
export function census(world){
 const byId=new Map(world.people.map(p=>[p.id,p]));
 const living=world.people.filter(p=>p.alive);
 const houses=world.households.filter(h=>h.members.length).map(h=>{
  const members=h.members.map(id=>byId.get(id)).sort((a,b)=>b.age-a.age||a.id-b.id);
  return {id:h.id,name:h.name,count:members.length,members:members.map(p=>({
   id:p.id,name:full(p),age:p.age,group:ageGroup(p.age),sex:p.sex,
   parentIds:[...p.parentIds],partnerId:p.partnerId,childIds:[...p.childIds],
   bornInHouseholdId:p.originHouseholdId,
   history:p.history.filter(e=>e.year<=world.year).sort((a,b)=>a.year-b.year)
  }))};
 }).sort((a,b)=>a.id-b.id);
 const groups={bebek:0,çocuk:0,genç:0,"genç yetişkin":0,"orta yaşlı":0,yaşlı:0};
 for(const p of living)groups[ageGroup(p.age)]++;
 return {seed:world.seed,year:world.year,population:living.length,
  deceased:world.people.length-living.length,households:houses.length,
  sex:{female:living.filter(p=>p.sex==="F").length,male:living.filter(p=>p.sex==="M").length},
  ageGroups:groups,houses};
}
export function formatCensus(c,{householdId=null}={}){
 const lines=[`Üyük · ${c.year} · seed ${c.seed}`,
  `Yaşayan nüfus: ${c.population} | Hane: ${c.households} | Ölenler (kayıtlı): ${c.deceased}`,
  `Kadın: ${c.sex.female} | Erkek: ${c.sex.male}`,
  "Yaş dağılımı: "+Object.entries(c.ageGroups).map(([k,v])=>k+" "+v).join(" · ")];
 const houses=householdId==null?c.houses:c.houses.filter(h=>h.id===householdId);
 if(!houses.length)throw new Error("Unknown living household: "+householdId);
 for(const h of houses){
  lines.push("",`HANE #${h.id} — ${h.name} (${h.count} kişi)`);
  for(const p of h.members)lines.push(
   `  #${p.id} ${p.name} · ${p.age} yaş · ${p.group} · ${p.sex==="F"?"kadın":"erkek"}`+
   ` · anne-baba: ${p.parentIds.join(",")||"bilinmiyor"}`+
   ` · eş: ${p.partnerId??"yok"} · çocuklar: ${p.childIds.join(",")||"yok"}`+
   ` · doğduğu hane: #${p.bornInHouseholdId??"bilinmiyor"}`);
 }
 return lines.join("\n");
}
export function currentCensus(seed="uyuk-1600",householdId=null){
 const world=createVillageHistory(seed,4,1600);
 return formatCensus(census(world),{householdId});
}
export function savedCensus(path,householdId=null){
 return formatCensus(census(loadCanonicalSnapshot(path).world),{householdId});
}
