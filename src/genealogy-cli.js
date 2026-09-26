import {generateGenealogy,validateGenealogy} from "./genealogy.js";
const seed=process.argv[2] ?? "uyuk-1600";
const count=Number(process.argv[3] ?? 4);
const world=generateGenealogy(seed,count);
const errors=validateGenealogy(world);
if(errors.length) throw new Error(errors.join("; "));
const byId=new Map(world.people.map(p=>[p.id,p]));
const label=id=>{const p=byId.get(id);return `${p.name} ${p.surname} (#${id}, ${p.age} yaş)`;};
console.log(`Üyük soy ağacı | seed=${seed} | ${world.people.length} kişi | ${world.households.length} hane`);
for(const tree of world.familyTrees) {
 console.log(`\nAile ${tree.id} — Atalar: ${tree.ancestorIds.map(label).join("; ")}`);
 console.log(`Anne-baba: ${tree.parentIds.map(label).join("; ")}`);
 console.log(`Torunlar: ${tree.grandchildIds.map(label).join("; ")}`);
}
