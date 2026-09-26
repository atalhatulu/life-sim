import {createMonthlyVillage,validateMonthlyVillage} from './monthly-life.js';
const world=createMonthlyVillage(process.argv[2]??1);
const errors=validateMonthlyVillage(world);
if(errors.length)throw new Error(errors.slice(0,10).join('; '));
const counts=[1,2,3].map(g=>world.people.filter(p=>p.generation===g).length);
console.log(`Üyük · seed ${world.seed} · ${world.year}/${world.month} · ${world.monthCount} ay`);
console.log(`Kurucular: ${counts[0]} | Çocuklar: ${counts[1]} | Torunlar: ${counts[2]} | Toplam: ${world.people.length}`);
console.log(`Haneler: ${world.households.filter(h=>h.members.length).length} | Kaydedilmiş olaylar: ${world.events.length}`);
for(const h of world.households.filter(h=>h.members.length)){
 console.log(`\n${h.label} (#${h.id})`);
 for(const id of h.members){const p=world.people.find(x=>x.id===id);console.log(`  ${p.name} ${p.surname} · ${Math.floor((world.year*12+world.month-1-p.bornAt)/12)} yaş · kuşak ${p.generation} · hobi: ${p.hobby??'henüz yok'} · yaşadığı ay: ${p.experienceMonths}`);}
}
