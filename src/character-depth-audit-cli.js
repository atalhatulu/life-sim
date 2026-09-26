import {createMonthlyVillage,validateMonthlyVillage} from "./monthly-life.js";
import {buildVillageSnapshot,validateVillageSnapshot} from "./village-1600.js";
const seed=process.argv[2]??1;
const w=createMonthlyVillage(seed),v=buildVillageSnapshot(w);
const errors=[...validateMonthlyVillage(w),...validateVillageSnapshot(w,v)];
if(errors.length)throw Error(errors.join("; "));
const people=v.profiles,adults=people.filter(p=>p.age>=16),children=people.filter(p=>p.age>=6&&p.age<16);
const count=fn=>people.filter(fn).length;
const avg=(arr,fn)=>arr.length?+(arr.reduce((sum,p)=>sum+fn(p),0)/arr.length).toFixed(1):null;
const types=p=>[...new Set(p.history.map(e=>e.type))];
const personal=p=>p.history.filter(e=>e.personIds[0]===p.id);
const meaningful=p=>personal(p).filter(e=>["birth","marriage","household_move","childhood_path","care_assigned","hobby_discovered","work_accident","illness_started","injury_recovered","delivery_complication","childhood_year"].includes(e.type));
const report={seed,date:v.date,living:people.length,adults:adults.length,children6to15:children.length,
 hobby:{withHobby:count(p=>p.hobby!==null),withoutHobby:count(p=>p.hobby===null),withDatedDiscovery:count(p=>p.hobby!==null&&p.history.some(e=>e.type==="hobby_discovered"&&e.details.hobby===p.hobby))},
 skills:{withNonzero:count(p=>Object.values(p.skills).some(n=>n>0)),withTwoNonzero:count(p=>Object.values(p.skills).filter(n=>n>0).length>=2),distinctSkillProfiles:new Set(people.map(p=>JSON.stringify(p.skills))).size},
 childhood:{eligible:children.length,withPath:children.filter(p=>p.childhood.path!==null).length,withAnnualRecords:children.filter(p=>p.history.some(e=>e.type==="childhood_year"&&e.personIds[0]===p.id)).length,adultDescendantsWithPath:adults.filter(p=>p.generation>1&&p.childhood.path!==null).length,adultDescendants:adults.filter(p=>p.generation>1).length},
 history:{avgEvents:avg(people,p=>p.history.length),avgOwnEvents:avg(people,p=>personal(p).length),avgMeaningfulEvents:avg(people,p=>meaningful(p).length),withoutOwnEvent:count(p=>personal(p).length===0),withFiveEventTypes:count(p=>types(p).length>=5),distinctEventTypeSets:new Set(people.map(p=>types(p).sort().join(","))).size},
 family:{withLivingPartner:count(p=>p.partner!==null),withChildren:count(p=>p.children.length>0),withGuardian:count(p=>p.guardian!==null),withBereavement:count(p=>p.bereavements>0)},
 limitations:["No friendship or relationship quality history","No dated hobby practice or skill acquisition events","Founders have no simulated childhood before 1530","No personal goals or individual decision history"]};
console.log("CHARACTER_DEPTH_REPORT "+JSON.stringify(report));
const selected=[...people].filter(p=>p.age>=16).sort((a,b)=>meaningful(b).length-meaningful(a).length||a.id-b.id).slice(0,2);
selected.push(people.filter(p=>p.age>=6&&p.age<16).sort((a,b)=>b.childhood.months-a.childhood.months||a.id-b.id)[0]);
for(const p of selected.filter(Boolean)){
 console.log("CHARACTER_PROFILE "+JSON.stringify({id:p.id,name:p.name,age:p.age,household:p.household,hobby:p.hobby,skills:p.skills,traits:p.traits,childhood:p.childhood,parents:p.parents,partner:p.partner,children:p.children,guardian:p.guardian,history:p.history.filter(e=>["birth","marriage","household_move","childhood_path","care_assigned","hobby_discovered","work_accident","delivery_complication","illness_started","death"].includes(e.type)).slice(0,16).map(e=>({date:e.date,type:e.type,details:e.details}))}));
}
