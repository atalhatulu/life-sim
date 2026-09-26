// Fictional, tunable game probabilities; not historical medical estimates.
export const clampHealth=n=>Math.max(0,Math.min(100,n));
export const illnessMonthlyRisk=(person,month)=>{
 const age=person.experienceMonths/12;
 const seasonal=[11,0,1].includes(month)?1.45:1;
 const ageFactor=age<5?1.65:age>=65?1.5:1;
 return Math.min(0.2,0.012*seasonal*ageFactor*(1+(100-person.state.health)/160));
};
export function progressHealth(person,month,rng){
 const changes=[];
 const health=person.state;
 if(health.illness){
  const illness=health.illness;
  const recovery=Math.max(0.04,0.33-illness.severity*0.055+health.health/500);
  if(rng.chance(recovery)){
   changes.push({type:"illness_recovered",kind:illness.kind,duration:illness.months+1});
   health.illness=null;
  }else{
   illness.months++;
   const damage=illness.severity>=3?rng.int(1,3):rng.int(0,1);
   health.health=clampHealth(health.health-damage);
   if(illness.months>=3&&rng.chance(0.1)){
    illness.severity=Math.min(4,illness.severity+1);
    changes.push({type:"illness_worsened",kind:illness.kind,severity:illness.severity});
   }
  }
 }else if(rng.chance(illnessMonthlyRisk(person,month))){
  const kind=rng.pick(["fever","respiratory","stomach"]);
  const severity=rng.chance(0.13)?3:rng.int(1,2);
  health.illness={kind,severity,months:0};
  changes.push({type:"illness_started",kind,severity});
 }
 if(health.injury){
  health.injury.months++;
  const recovery=Math.max(0.08,0.46-health.injury.severity*0.07+health.health/600);
  if(rng.chance(recovery)){
   changes.push({type:"injury_recovered",severity:health.injury.severity,duration:health.injury.months});
   health.injury=null;
  }else if(health.injury.months>=4&&health.injury.severity>=3&&!health.permanentImpairment&&rng.chance(0.035)){
   health.permanentImpairment=true;
   changes.push({type:"permanent_impairment",severity:health.injury.severity});
  }
 }
 if(!health.illness&&!health.injury&&health.health<95){
  health.health=clampHealth(health.health+(health.permanentImpairment?0.4:1.2));
 }
 return changes;
}
export function mortalityHealthFactor(person){
 const s=person.state;
 return 1+(100-s.health)/100*2.2+(s.illness?.severity??0)*0.22+(s.injury?.severity??0)*0.13;
}
