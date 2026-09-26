import { createVillage, stepDay, validateVillage } from "./engine.js";
const seed=process.argv[2] ?? "uyuk-1600";
const days=Number(process.argv[3] ?? 7);
if(!Number.isInteger(days)||days<0||days>3650) throw new Error("days must be between 0 and 3650");
const world=createVillage(seed);
const errors=validateVillage(world);
if(errors.length) throw new Error(errors.join("; "));
console.log(`Üyük | seed=${seed} | ${world.households.length} hane | ${world.people.length} kişi`);
for(let day=0;day<days;day++) {
  const events=stepDay(world);
  console.log(`Gün ${day+1}: `+events.filter(e=>e.targetId===undefined).slice(0,5).map(e=>`${world.people.find(p=>p.id===e.personId).name} #${e.personId}: ${e.activity} (${e.reason})`).join(" | "));
}
console.log(`Toplam ${world.history.length} olay; doğrulama: ${validateVillage(world).length ? "HATA" : "OK"}`);
