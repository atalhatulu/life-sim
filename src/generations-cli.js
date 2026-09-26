import {generateThreeGenerations,validateThreeGenerations} from "./three-generations.js";
const seed=process.argv[2]??"1";
const world=generateThreeGenerations(seed);
const errors=validateThreeGenerations(world);
if(errors.length)throw new Error(errors.slice(0,10).join("; "));
console.log("Üyük · seed "+world.seed+" · "+world.year+" · üçüncü kuşakta durdu");
console.log("Kurucular: "+world.generationCounts[0]+" | Çocukları: "+world.generationCounts[1]+
 " | Torunları: "+world.generationCounts[2]+" | Toplam: "+world.people.length);
for(const h of world.households.filter(h=>h.members.length)){
 console.log("\nHane #"+h.id+" · "+h.name+" · "+h.members.length+" kişi");
 for(const id of h.members){
  const p=world.people.find(x=>x.id===id);
  console.log("  #"+p.id+" "+p.name+" "+p.surname+" · "+p.age+" yaş · kuşak "+p.generation+
   " · ebeveynler "+(p.parentIds.join(",")||"bilinmiyor")+
   " · çocuklar "+(p.childIds.join(",")||"yok"));
 }
}
