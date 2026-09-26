import {createMonthlyVillage,validateMonthlyVillage} from "./monthly-life.js";
const w=createMonthlyVillage(process.argv[2]??1),errors=validateMonthlyVillage(w);
if(errors.length)throw new Error(errors.join("; "));
const descendants=p=>{const seen=new Set(),queue=[p.id];while(queue.length){const next=queue.shift(),x=w.people.find(q=>q.id===next);for(const id of x.childIds)if(!seen.has(id)){seen.add(id);queue.push(id);}}return seen.size;};
const founder=w.people.filter(p=>p.generation===1&&p.sex==="M").sort((a,b)=>descendants(b)-descendants(a))[0];
const ids=new Set([founder.id]),queue=[founder.id];
while(queue.length){const p=w.people.find(x=>x.id===queue.shift());for(const id of p.childIds)if(!ids.has(id)){ids.add(id);queue.push(id);}}
const relatives=w.people.filter(p=>ids.has(p.id)||p.partnerId&&ids.has(p.partnerId));
const date=at=>Math.floor(at/12)+"/"+String(at%12+1).padStart(2,"0");
console.log("Üyük 1600 · seed "+w.seed+" · "+founder.surname+" kurucu soyunun yaşanmış geçmişi");
console.log("Köy: "+w.people.length+" kişi, "+w.households.filter(h=>h.members.length).length+" dolu hane, "+w.monthCount+" ay, "+w.events.length+" kayıtlı olay");
for(const p of relatives){
 const age=Math.floor((w.year*12+w.month-1-p.bornAt)/12);
 console.log("\n#"+p.id+" "+p.name+" "+p.surname+" · "+age+" yaş · kuşak "+p.generation+" · doğum "+date(p.bornAt)+" · yaşadığı ay "+p.experienceMonths);
 console.log("  Eş: "+(w.people.find(x=>x.id===p.partnerId)?.name??"yok")+" · çocuklar: "+(p.childIds.map(id=>w.people.find(x=>x.id===id)?.name+" #"+id).join(", ")||"yok"));
 console.log("  Hobi: "+(p.hobby??"henüz yok")+" · çocukluk yolu: "+(p.educationDecision??"başlangıç yetişkini")+" · iş kazası: "+p.accidents);
 console.log("  Beceriler: "+Object.entries(p.skills).map(([k,v])=>k+" "+v.toFixed(1)).join(", "));
 const own=w.events.filter(e=>e.personIds.includes(p.id)&&["birth","marriage","childhood_path","hobby_discovered","work_accident"].includes(e.type));
 for(const e of own.slice(0,18))console.log("    "+date(e.at)+" "+e.type+(e.path?" ["+e.path+"]":"")+(e.hobby?" ["+e.hobby+"]":"")+(e.severity?" ["+e.severity+"]":""));
 if(own.length>18)console.log("    ... "+(own.length-18)+" ek kayıt");
}
