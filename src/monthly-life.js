import {RNG} from "./engine.js";
import {pickName,HOUSE_NAMES} from "./names.js";

// Independent monthly-life prototype. Founding adults are explicit initial conditions;
// every descendant is born and develops in forward-simulated calendar months.
const clamp=n=>Math.max(0,Math.min(100,n));
const monthIndex=(year,month)=>year*12+month-1;
const ageMonths=(p,t)=>t-p.bornAt;
const ancestors=(p,byId)=>{
 const ids=new Set(),visit=x=>{for(const id of x.parentIds){if(ids.has(id))continue;ids.add(id);visit(byId.get(id));}};
 visit(p);return ids;
};
const unrelated=(a,b,byId)=>{
 const aa=ancestors(a,byId),bb=ancestors(b,byId);
 return a.id!==b.id&&!aa.has(b.id)&&!bb.has(a.id)&&![...aa].some(id=>bb.has(id));
};
export function createMonthlyVillage(seed=1,{founderFamilies=8,startYear=1530,endYear=1600}={}){
 if(!Number.isInteger(founderFamilies)||founderFamilies<1||founderFamilies>24)throw new Error("founderFamilies must be 1..24");
 if(!Number.isInteger(startYear)||!Number.isInteger(endYear)||endYear<=startYear)throw new Error("invalid years");
 const rng=new RNG(String(seed)+":monthly-life:v2");
 const world={seed:String(seed),version:"monthly-life:v2",year:startYear,month:1,monthCount:0,
  people:[],households:[],events:[],initialConditions:[],generationLimit:3};
 const byId=new Map();let personId=1,houseId=1;
 const house=(label,generation,formedAt)=>{const h={id:houseId++,label,generation,formedAt,members:[],food:60,security:clamp(rng.int(35,75)),educationSupport:rng.int(15,85),workPressure:rng.int(15,75)};world.households.push(h);return h;};
 const person=(sex,bornAt,surname,home,generation,parents=[],initial=false)=>{
  const p={id:personId++,name:pickName(rng,sex),surname,sex,bornAt,birthYear:Math.floor(bornAt/12),
   birthMonth:bornAt%12+1,generation,parentIds:parents.map(x=>x.id),childIds:[],
   householdId:home.id,originHouseholdId:home.id,partnerId:null,alive:true,deathAt:null,
   traits:{clumsiness:rng.int(10,90),attention:rng.int(10,90),curiosity:rng.int(10,90),patience:rng.int(10,90),sociability:rng.int(10,90)},
   skills:{housework:0,craft:0,animalCare:0,learning:0},hobby:null,educationDecision:null,accidents:0,
   state:{energy:80,health:90},experienceMonths:initial?0:1,history:[]};
  home.members.push(p.id);world.people.push(p);byId.set(p.id,p);
  for(const parent of parents)parent.childIds.push(p.id);
  if(initial)world.initialConditions.push({type:"founder",personId:p.id,bornAt});
  else record("birth",bornAt,[p.id,...p.parentIds],home.id);
  return p;
 };
 const record=(type,at,personIds,householdId,details={})=>{
  const e={type,at,year:Math.floor(at/12),month:at%12+1,personIds,householdId,...details};
  world.events.push(e);
  for(const id of personIds)byId.get(id)?.history.push(e);
  return e;
 };
 const founders=[];
 const start=monthIndex(startYear,1),end=monthIndex(endYear,12);
 for(let i=0;i<founderFamilies;i++){
  const surname=HOUSE_NAMES[i],h=house(surname+" kurucu hanesi",1,start);
  const man=person("M",start-rng.int(19*12,27*12),surname,h,1,[],true);
  const woman=person("F",start-rng.int(18*12,25*12),surname,h,1,[],true);
  man.partnerId=woman.id;woman.partnerId=man.id;
  world.initialConditions.push({type:"founder_marriage",personIds:[man.id,woman.id],at:start});
  founders.push([man,woman]);
 }
 const move=(p,h,at)=>{
  const old=world.households.find(x=>x.id===p.householdId);
  old.members=old.members.filter(id=>id!==p.id);h.members.push(p.id);p.householdId=h.id;
  record("household_move",at,[p.id],h.id,{fromHouseholdId:old.id});
 };
 const marry=(a,b,at)=>{
  if(a.partnerId||b.partnerId||!unrelated(a,b,byId))throw new Error("invalid marriage");
  const h=house(a.surname+" yeni hanesi",a.generation,at);
  a.partnerId=b.id;b.partnerId=a.id;move(a,h,at);move(b,h,at);
  record("marriage",at,[a.id,b.id],h.id);
 };
 const birthCooldown=new Map();
 for(let at=start;at<=end;at++){
  const year=Math.floor(at/12),month=at%12+1;
  world.year=year;world.month=month;world.monthCount++;
  // Monthly routines are summarized; they do not create artificial dramatic events.
  for(const p of world.people){
   if(!p.alive||p.bornAt>at)continue;
   const age=ageMonths(p,at),h=world.households.find(x=>x.id===p.householdId);
   p.experienceMonths++;
   p.state.energy=clamp(p.state.energy+rng.int(-4,5));
   if(age===6*12){
    const support=clamp(h.educationSupport-h.workPressure*0.45+(p.traits.curiosity-50)*0.3);
    p.educationDecision=rng.chance(support/100)?"learning":"household_work";
    record("childhood_path",at,[p.id,...p.parentIds],h.id,{path:p.educationDecision,supportProbability:support/100});
   }
   if(age>=6*12&&age<16*12){
    const workChance=p.educationDecision==="household_work"?0.78:0.26;
    if(rng.chance(workChance))p.skills.housework=clamp(p.skills.housework+0.25);
    else p.skills.learning=clamp(p.skills.learning+0.25);
   }else if(age>=16*12){
    const key=p.surname==="Çoban"?"animalCare":p.surname==="Demirci"?"craft":"housework";
    p.skills[key]=clamp(p.skills[key]+0.14);
    // A work accident is conditional on exposure, coordination, attention and fatigue.
    const risk=clamp(0.12+(p.traits.clumsiness-50)*0.004+(50-p.traits.attention)*0.002+(50-p.state.energy)*0.002)/100;
    if(rng.chance(risk)){
     p.accidents++;const severity=rng.chance(0.14)?"injury":"minor";
     if(severity==="injury")p.state.health=clamp(p.state.health-rng.int(4,12));
     record("work_accident",at,[p.id],h.id,{severity,probability:risk});
    }
   }
   if(age>=8*12&&!p.hobby&&rng.chance(0.018)){
    p.hobby=rng.pick(["oyma yapmak","türkü söylemek","bahçecilik","hikâye anlatmak","yürüyüş"]);
    record("hobby_discovered",at,[p.id],h.id,{hobby:p.hobby});
   }
  }
  // Monthly marriage checks; no child is born from a third-generation couple in the initial history.
  for(const generation of [2,3]){
   const eligible=world.people.filter(p=>p.generation===generation&&!p.partnerId&&p.alive&&ageMonths(p,at)>=18*12&&ageMonths(p,at)<=35*12);
   const women=eligible.filter(p=>p.sex==="F");
   for(const a of eligible.filter(p=>p.sex==="M")){
    if(a.partnerId||!rng.chance(0.025))continue;
    const choices=women.filter(b=>!b.partnerId&&Math.abs(ageMonths(a,at)-ageMonths(b,at))<=10*12&&unrelated(a,b,byId));
    if(choices.length)marry(a,rng.pick(choices),at);
   }
  }
  for(const a of world.people){
   if(!a.alive||a.sex!=="M"||!a.partnerId||a.generation>=3)continue;
   const b=byId.get(a.partnerId);
   if(!b?.alive||b.householdId!==a.householdId)continue;
   const maleAge=ageMonths(a,at),femaleAge=ageMonths(b,at);
   if(maleAge<18*12||maleAge>55*12||femaleAge<18*12||femaleAge>39*12)continue;
   if(at-(birthCooldown.get(a.id)??-Infinity)<24)continue;
   if(rng.chance(0.014)){
    const home=world.households.find(h=>h.id===a.householdId);
    const child=person(rng.chance(0.5)?"F":"M",at,a.surname,home,a.generation+1,[a,b]);
    birthCooldown.set(a.id,at);
    // A birth is a shared event for both parents and the newborn.
    if(child.generation>3)throw new Error("fourth generation in initial history");
   }
  }
 }
 return world;
}
export function validateMonthlyVillage(world){
 const errors=[],byId=new Map(world.people.map(p=>[p.id,p])),members=new Map();
 if(byId.size!==world.people.length)errors.push("duplicate person id");
 for(const h of world.households)for(const id of h.members)members.set(id,(members.get(id)??0)+1);
 for(const p of world.people){
  if(members.get(p.id)!==1)errors.push("household membership "+p.id);
  if(!world.households.some(h=>h.id===p.householdId&&h.members.includes(p.id)))errors.push("household pointer "+p.id);
  if(p.generation<1||p.generation>3)errors.push("generation "+p.id);
  if(p.experienceMonths<1)errors.push("missing lived months "+p.id);
  for(const id of p.parentIds){
   const parent=byId.get(id);
   if(!parent||!parent.childIds.includes(p.id)||p.bornAt-parent.bornAt<17*12||parent.generation!==p.generation-1)errors.push("parent "+p.id);
  }
  if(p.partnerId&&byId.get(p.partnerId)?.partnerId!==p.id)errors.push("partner "+p.id);
  if(p.generation===3&&p.childIds.length)errors.push("fourth generation "+p.id);
 }
 for(const e of world.events){
  if(e.at>monthIndex(world.year,world.month))errors.push("future event");
  if(e.type==="birth"&&e.personIds.some(id=>!byId.has(id)))errors.push("birth person");
 }
 return errors;
}
