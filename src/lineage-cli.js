import {createLivingLineage,validateLivingLineage} from "./lineage.js";
const seed=process.argv[2] ?? "uyuk-1600";
const families=Number(process.argv[3] ?? 4);
const world=createLivingLineage(seed,families);
const errors=validateLivingLineage(world);
if(errors.length) throw new Error(errors.join("; "));
const people=new Map(world.people.map(p=>[p.id,p]));
const label=id=>{const p=people.get(id);return p.name+" "+p.surname+" (#"+id+", "+(p.alive?p.age+" yaş":"ölüm "+p.deathYear)+")";};
console.log("Üyük | seed="+seed+" | yaşayan="+world.people.filter(p=>p.alive).length+" | ölü atalar="+world.deceasedIds.length+" | hane="+world.households.length);
for(const tree of world.familyTrees){
 console.log("\nAile "+tree.id+":");
 console.log("Atalar: "+tree.ancestorIds.map(label).join("; "));
 console.log("Ebeveynler: "+tree.parentIds.map(label).join("; "));
 console.log("Torunlar: "+tree.grandchildIds.map(label).join("; "));
}
console.log("\nAileler arası evlilikler: "+world.marriages.length);
for(const m of world.marriages) console.log(m.partnerIds.map(label).join(" + ")+" | çocuklar: "+m.childIds.map(label).join("; "));
