import {createMonthlyVillage,validateMonthlyVillage} from "./monthly-life.js";
import {buildVillageSnapshot,validateVillageSnapshot} from "./village-1600.js";
const seed=process.argv[2]??1;
const id=process.argv[3]?Number(process.argv[3]):null;
const world=createMonthlyVillage(seed),snapshot=buildVillageSnapshot(world);
const errors=[...validateMonthlyVillage(world),...validateVillageSnapshot(world,snapshot)];
if(errors.length)throw new Error(errors.join("; "));
console.log(`Üyük ${snapshot.date} · seed ${seed} · ${snapshot.population} yaşayan kişi · ${snapshot.households.length} dolu hane`);
if(id!==null){
 const p=snapshot.profiles.find(x=>x.id===id);
 if(!p)throw new Error("1600 yılında yaşayan kişi bulunamadı: "+id);
 console.log(JSON.stringify(p,null,2));
}else{
 for(const h of snapshot.households){
  console.log("\n"+h.label+" (#"+h.id+")");
  for(const p of snapshot.profiles.filter(p=>p.householdId===h.id))
   console.log(`  #${p.id} ${p.name} · ${p.age} yaş · hobi: ${p.hobby??"henüz yok"} · ${p.history.length} geçmiş kaydı`);
 }
 console.log("\nKişi ayrıntısı: npm run village:1600 -- "+seed+" <kişi-id>");
}
