import {childCareContext,progressChildhood} from "./monthly-childhood.js";
import {progressHealth,mortalityHealthFactor} from "./monthly-health.js";
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
 const rng=new RNG(String(seed)+":monthly-life:v7");
 const world={seed:String(seed),version:"monthly-life:v7",year:startYear,month:1,monthCount:0,
  people:[],households:[],events:[],initialConditions:[],generationLimit:3};
 const byId=new Map();let personId=1,houseId=1;
 const house=(label,generation,formedAt)=>{const h={id:houseId++,label,generation,formedAt,members:[],food:60,security:clamp(rng.int(35,75)),educationSupport:rng.int(15,85),workPressure:rng.int(15,75)};world.households.push(h);return h;};
 const person=(sex,bornAt,surname,home,generation,parents=[],initial=false)=>{
  const p={id:personId++,name:pickName(rng,sex),surname,sex,bornAt,birthYear:Math.floor(bornAt/12),
   birthMonth:bornAt%12+1,generation,parentIds:parents.map(x=>x.id),childIds:[],
   householdId:home.id,originHouseholdId:home.id,partnerId:null,previousPartnerIds:[],alive:true,deathAt:null,deathCause:null,bereavements:0,pregnancy:null,lastBirthAt:null,guardianId:null,childhood:{months:0,careSum:0,learningMonths:0,workMonths:0,lowCareMonths:0},
   traits:{clumsiness:rng.int(10,90),attention:rng.int(10,90),curiosity:rng.int(10,90),patience:rng.int(10,90),sociability:rng.int(10,90)},
   skills:{housework:0,craft:0,animalCare:0,learning:0},hobby:null,educationDecision:null,accidents:0,
   state:{energy:80,health:90,illness:null,injury:null,permanentImpairment:false},experienceMonths:initial?0:1,history:[]};
  home.members.push(p.id);world.people.push(p);byId.set(p.id,p);
  for(const parent of parents)parent.childIds.push(p.id);
  if(initial)world.initialConditions.push({type:"founder",personId:p.id,bornAt});
  else record("birth",bornAt,[p.id,...p.parentIds],home.id);
  return p;
 };
 const record=(type,at,personIds,householdId,details={})=>{
  const e={type,at,year:Math.floor(at/12),month:at%12+1,personIds,householdId,...details};
  world.events.push(e);
  for(const id of personIds){
   const p=byId.get(id);
   if(p&&(p.alive||type==="death"&&details.deceasedId===id))p.history.push(e);
  }
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
  for(const child of world.people)if(child.alive&&ageMonths(child,at)<16*12&&(child.guardianId===a.id||child.guardianId===b.id)&&child.householdId!==h.id)assignCare(child,at);
 };
 const assignCare=(child,at)=>{
  if(!child.alive||ageMonths(child,at)>=16*12)return;
  const parents=child.parentIds.map(id=>byId.get(id));
  const surviving=parents.find(p=>p?.alive);
  const current=child.guardianId?byId.get(child.guardianId):null;
  if(current?.alive&&current.householdId===child.householdId)return;
  const relatives=world.people.filter(p=>p.alive&&p.id!==child.id&&ageMonths(p,at)>=18*12&&(
   p.childIds.includes(child.id)||p.parentIds.some(id=>child.parentIds.includes(id))||
   parents.some(parent=>parent?.parentIds.includes(p.id))));
  const adults=world.households.find(h=>h.id===child.householdId).members.map(id=>byId.get(id)).filter(p=>p.alive&&ageMonths(p,at)>=18*12);
  const guardian=surviving??relatives.find(p=>p.householdId===child.householdId)??relatives[0]??adults[0]??
   world.people.find(p=>p.alive&&ageMonths(p,at)>=18*12&&p.id!==child.id);
  if(!guardian){child.guardianId=null;record("care_unavailable",at,[child.id],child.householdId);return;}
  if(child.householdId!==guardian.householdId)move(child,world.households.find(h=>h.id===guardian.householdId),at);
  child.guardianId=guardian.id;
  record("care_assigned",at,[child.id,guardian.id],child.householdId,{childId:child.id,guardianId:guardian.id,reason:surviving?"surviving_parent":relatives.includes(guardian)?"relative":"household_or_community"});
 };
 const die=(p,at,cause,probability)=>{
  if(!p.alive)return;
  const h=world.households.find(x=>x.id===p.householdId);
  const partner=p.partnerId?byId.get(p.partnerId):null;
  const affected=new Set([p.id,...p.childIds,...h.members]);
  if(partner)affected.add(partner.id);
  if(p.pregnancy){record("pregnancy_loss",at,[p.id,p.pregnancy.fatherId],h.id,{conceivedAt:p.pregnancy.conceivedAt,reason:"maternal_death"});p.pregnancy=null;}
  p.alive=false;p.deathAt=at;p.deathCause=cause;
  if(partner){
   partner.previousPartnerIds.push(p.id);
   partner.partnerId=null;p.previousPartnerIds.push(partner.id);p.partnerId=null;
  }
  h.members=h.members.filter(id=>id!==p.id);
  for(const id of affected)if(id!==p.id){const relative=byId.get(id);if(relative?.alive)relative.bereavements++;}
  record("death",at,[...affected],h.id,{deceasedId:p.id,cause,probability});
  for(const child of world.people)if(child.alive&&ageMonths(child,at)<16*12&&(child.guardianId===p.id||child.parentIds.includes(p.id)))assignCare(child,at);
 };
 const monthlyMortality=(p,at)=>{
  const age=ageMonths(p,at)/12;
  // Fictional simulation parameters, not historical mortality estimates.
  const annual=age<1?0.075:age<5?0.018:age<15?0.003:age<40?0.005:
   age<55?0.012:age<65?0.025:age<75?0.065:age<85?0.15:0.32;
  const healthFactor=mortalityHealthFactor(p);
  const annualRisk=Math.min(0.95,annual*healthFactor);
  return 1-Math.pow(1-annualRisk,1/12);
 };
 const conceptionChance=(mother,at)=>{
  const age=ageMonths(mother,at)/12;
  const ageFactor=age<20?0.75:age<30?1:age<35?0.72:0.38;
  const h=world.households.find(x=>x.id===mother.householdId);
  return 0.075*ageFactor*Math.max(0.2,mother.state.health/100)*(1-h.workPressure/400);
 };
 for(let at=start;at<=end;at++){
  const year=Math.floor(at/12),month=at%12+1;
  world.year=year;world.month=month;world.monthCount++;
  // Monthly routines are summarized; they do not create artificial dramatic events.
  for(const p of world.people){
   if(!p.alive||p.bornAt>at)continue;
   const age=ageMonths(p,at),h=world.households.find(x=>x.id===p.householdId);
   p.experienceMonths++;
   p.state.energy=clamp(p.state.energy+rng.int(-4,5));
   for(const change of progressHealth(p,month,rng))record(change.type,at,[p.id],h.id,change);
   if(age===6*12){
    const guardian=byId.get(p.guardianId);
    const support=childCareContext(p,guardian?.alive?guardian:null,h,at).education;
    p.educationDecision=rng.chance(support/100)?"learning":"household_work";
    record("childhood_path",at,[p.id,...p.parentIds],h.id,{path:p.educationDecision,supportProbability:support/100});
   }
   if(age>=6*12&&age<16*12){
    const guardian=byId.get(p.guardianId);
    const context=childCareContext(p,guardian?.alive?guardian:null,h,at);
    const result=progressChildhood(p,context,rng);
    if(p.childhood.months%12===0)record("childhood_year",at,[p.id,...(context.guardianId?[context.guardianId]:[])],h.id,{
     care:Math.round(p.childhood.careSum/p.childhood.months),learningMonths:p.childhood.learningMonths,
     workMonths:p.childhood.workMonths,lowCareMonths:p.childhood.lowCareMonths,
     guardianId:context.guardianId,learningChance:result.learningChance,workingChance:result.workingChance
    });
   }else if(age>=16*12){
    const key=p.surname==="Çoban"?"animalCare":p.surname==="Demirci"?"craft":"housework";
    p.skills[key]=clamp(p.skills[key]+0.14);
    // A work accident is conditional on exposure, coordination, attention and fatigue.
    const risk=clamp(0.12+(p.traits.clumsiness-50)*0.004+(50-p.traits.attention)*0.002+(50-p.state.energy)*0.002)/100;
    if(rng.chance(risk)){
     p.accidents++;const severity=rng.chance(0.14)?"injury":"minor";
     if(severity==="injury"){
      p.state.health=clamp(p.state.health-rng.int(4,12));
      p.state.injury={severity:rng.int(2,4),months:0};
     }
     record("work_accident",at,[p.id],h.id,{severity,probability:risk});
    }
   }
   if(age>=8*12&&!p.hobby&&rng.chance(0.018)){
    p.hobby=rng.pick(["oyma yapmak","türkü söylemek","bahçecilik","hikâye anlatmak","yürüyüş"]);
    record("hobby_discovered",at,[p.id],h.id,{hobby:p.hobby});
   }
   const deathRisk=monthlyMortality(p,at);
   if(rng.chance(deathRisk)){
    const cause=p.state.illness?"illness":p.state.injury?"injury":p.state.health<55?"poor_health":age>=65*12?"age_related":"other";
    die(p,at,cause,deathRisk);
   }
  }
  // Resolve gestation before new conceptions; deceased fathers remain genealogical parents.
  for(const mother of world.people){
   const pregnancy=mother.pregnancy;
   if(!mother.alive||!pregnancy)continue;
   const father=byId.get(pregnancy.fatherId),elapsed=at-pregnancy.conceivedAt;
   if(elapsed<9){
    const lossChance=elapsed<3?0.012:0.003;
    if(rng.chance(lossChance)){
     record("pregnancy_loss",at,[mother.id,father.id],mother.householdId,{conceivedAt:pregnancy.conceivedAt,reason:"spontaneous",probability:lossChance});
     mother.pregnancy=null;
    }
    continue;
   }
   const home=world.households.find(h=>h.id===mother.householdId);
   const child=person(rng.chance(0.5)?"F":"M",at,father.surname,home,mother.generation+1,[father,mother]);
   mother.lastBirthAt=at;mother.pregnancy=null;
   record("delivery",at,[mother.id,father.id,child.id],home.id,{childId:child.id,conceivedAt:pregnancy.conceivedAt});
   const complicationRisk=Math.min(0.09,0.012+(100-mother.state.health)/2500);
   if(rng.chance(complicationRisk)){
    const damage=rng.int(7,18);
    mother.state.health=clamp(mother.state.health-damage);
    mother.state.injury={severity:2,months:0};
    record("delivery_complication",at,[mother.id,child.id],home.id,{damage,probability:complicationRisk});
   }
   assignCare(child,at);
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
  for(const mother of world.people){
   if(!mother.alive||mother.sex!=="F"||mother.pregnancy||mother.generation>=3||!mother.partnerId)continue;
   const father=byId.get(mother.partnerId);
   if(!father?.alive||father.householdId!==mother.householdId)continue;
   const femaleAge=ageMonths(mother,at),maleAge=ageMonths(father,at);
   if(femaleAge<18*12||femaleAge>39*12||maleAge<18*12||maleAge>55*12)continue;
   if(mother.lastBirthAt!==null&&at-mother.lastBirthAt<15)continue;
   const chance=conceptionChance(mother,at);
   if(rng.chance(chance)){
    mother.pregnancy={conceivedAt:at,fatherId:father.id,dueAt:at+9};
    record("conception",at,[mother.id,father.id],mother.householdId,{dueAt:at+9,probability:chance});
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
  if((members.get(p.id)??0)!==(p.alive?1:0))errors.push("household membership "+p.id);
  if(p.alive&&!world.households.some(h=>h.id===p.householdId&&h.members.includes(p.id)))errors.push("household pointer "+p.id);
  if(p.generation<1||p.generation>3)errors.push("generation "+p.id);
  if(p.experienceMonths<1)errors.push("missing lived months "+p.id);
  if(p.history.some(e=>e.at<p.bornAt||p.deathAt!==null&&e.at>p.deathAt))errors.push("personal history outside lifetime "+p.id);
  for(const id of p.parentIds){
   const parent=byId.get(id);
   if(!parent||!parent.childIds.includes(p.id)||p.bornAt-parent.bornAt<17*12||parent.generation!==p.generation-1)errors.push("parent "+p.id);
  }
  if(p.partnerId&&(!p.alive||!byId.get(p.partnerId)?.alive||byId.get(p.partnerId)?.partnerId!==p.id))errors.push("partner "+p.id);
  if((p.alive&&p.deathAt!==null)||(!p.alive&&p.deathAt===null))errors.push("death state "+p.id);
  if(p.generation===3&&p.childIds.length)errors.push("fourth generation "+p.id);
  if(p.childhood.learningMonths>p.childhood.months||p.childhood.workMonths>p.childhood.months||p.childhood.lowCareMonths>p.childhood.months)errors.push("childhood counters "+p.id);
  if(p.pregnancy&&(!p.alive||p.sex!=="F"||p.generation>=3||p.pregnancy.dueAt!==p.pregnancy.conceivedAt+9))errors.push("pregnancy state "+p.id);
  if(p.alive&&p.generation>1&&ageMonths(p,monthIndex(world.year,world.month))<16*12){
   const guardian=byId.get(p.guardianId);
   if(guardian&&(!guardian.alive||guardian.householdId!==p.householdId||guardian.id===p.id))errors.push("guardian "+p.id);
  }
 }
 for(const e of world.events){
  if(e.at>monthIndex(world.year,world.month))errors.push("future event");
  if(e.type==="birth"&&e.personIds.some(id=>!byId.has(id)))errors.push("birth person");
  if(e.type==="death"&&byId.get(e.deceasedId)?.deathAt!==e.at)errors.push("death event");
  if(e.type==="delivery"){
   const child=byId.get(e.childId);
   if(!child||child.bornAt!==e.at||e.at-e.conceivedAt!==9||!child.parentIds.includes(e.personIds[0])||!child.parentIds.includes(e.personIds[1]))errors.push("delivery chronology");
  }
  if(e.type==="conception"&&e.dueAt!==e.at+9)errors.push("conception chronology");
 }
 return errors;
}
