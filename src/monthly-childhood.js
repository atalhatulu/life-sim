// Tunable simulation parameters, not historical estimates.
const clamp=n=>Math.max(0,Math.min(100,n));
export function childCareContext(child,guardian,household,at){
 const ageMonths=at-child.bornAt;
 const dependents=household.members.length;
 const capacity=guardian?clamp(guardian.state.health*0.44+guardian.state.energy*0.23+
  guardian.traits.patience*0.18+guardian.skills.housework*0.15-
  (guardian.state.illness?12:0)-(guardian.state.injury?8:0)):0;
 const pressure=household.workPressure*0.34+Math.max(0,dependents-4)*2.5;
 const care=clamp(guardian?capacity+household.security*0.24-pressure:household.security*0.16-pressure);
 const education=clamp(household.educationSupport*0.54+care*0.34+
  child.traits.curiosity*0.12-household.workPressure*0.16);
 const work=clamp(household.workPressure*0.52+(100-care)*0.23+
  (ageMonths>=12*12?14:0)-education*0.16);
 return {care,education,work,guardianId:guardian?.id??null};
}
export function progressChildhood(child,context,rng){
 const {care,education,work}=context;
 const neglectRisk=Math.max(0,(35-care)/100)*0.11;
 const learningChance=clamp(education*0.68+(child.educationDecision==="learning"?18:0)-work*0.18)/100;
 const workingChance=clamp(work*0.75+(child.educationDecision==="household_work"?18:0)-care*0.09)/100;
 const learning=rng.chance(learningChance);
 const working=rng.chance(workingChance);
 if(learning)child.skills.learning=clamp(child.skills.learning+0.12+education/450);
 if(working)child.skills.housework=clamp(child.skills.housework+0.12+work/480);
 if(!learning&&!working)child.skills.learning=clamp(child.skills.learning+0.025);
 child.childhood.months++;
 child.childhood.careSum+=care;
 child.childhood.learningMonths+=Number(learning);
 child.childhood.workMonths+=Number(working);
 if(rng.chance(neglectRisk)){
  child.state.health=clamp(child.state.health-1.5);
  child.childhood.lowCareMonths++;
 }
 return {learning,working,learningChance,workingChance,neglectRisk};
}
