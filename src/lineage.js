import { RNG } from "./engine.js";
import { generateGenealogy, validateGenealogy } from "./genealogy.js";

// Enrich a generated population without requiring a player or advancing daily activities.
// A separate RNG stream preserves the original population for the same seed.
export function createLivingLineage(seed = "uyuk-1600", familyCount = 4, year = 1600) {
  const world = generateGenealogy(seed, familyCount, year);
  const rng = new RNG(String(seed) + ":lineage:v1");
  const byId = new Map(world.people.map(p => [p.id, p]));
  let nextPersonId = Math.max(...world.people.map(p => p.id)) + 1;
  let nextHouseId = Math.max(...world.households.map(h => h.id)) + 1;
  const move = (person, destination) => {
    const previous = world.households.find(h => h.id === person.householdId);
    if (previous) previous.members = previous.members.filter(id => id !== person.id);
    destination.members.push(person.id);
    person.householdId = destination.id;
  };
  for (const person of world.people) {
    person.alive = true;
    person.deathYear = null;
    person.previousPartnerIds = [];
    person.originHouseholdId = person.householdId;
  }
  // Marriage between unrelated branches connects otherwise isolated family trees.
  const candidates = world.people.filter(p => p.generation === 2 && !p.partnerId);
  const women = candidates.filter(p => p.sex === "F");
  const men = candidates.filter(p => p.sex === "M");
  const married = [];
  for (const man of men) {
    const options = women.filter(w => !w.partnerId &&
      w.surname !== man.surname &&
      Math.abs(w.age - man.age) <= 12 &&
      !w.parentIds.some(id => man.parentIds.includes(id)));
    if (!options.length || !rng.chance(0.72)) continue;
    const woman = rng.pick(options);
    const marriageYear = year - Math.min(man.age, woman.age) + rng.int(18, 23);
    man.partnerId = woman.id;
    woman.partnerId = man.id;
    man.history.push({year:marriageYear,type:"marriage",personId:woman.id});
    woman.history.push({year:marriageYear,type:"marriage",personId:man.id});
    const household = {id:nextHouseId++,name:man.surname+" yeni hanesi",generation:2,members:[]};
    world.households.push(household);
    move(man, household);
    move(woman, household);
    const children = [];
    const maximumAge = Math.min(12, year-marriageYear, man.age-17, woman.age-17);
    const childCount = maximumAge >= 0 ? rng.int(0,2) : 0;
    for(let i=0;i<childCount;i++) {
      const age = rng.int(0,maximumAge);
      const child = {
        id:nextPersonId++,name:null,surname:man.surname,sex:rng.chance(0.5)?"F":"M",
        age,birthYear:year-age,generation:3,householdId:household.id,
        originHouseholdId:household.id,parentIds:[man.id,woman.id],childIds:[],partnerId:null,
        previousPartnerIds:[],alive:true,deathYear:null,
        traits:[rng.pick(["sabırlı","meraklı","inatçı","yardımsever","çekingen","girişken"])],
        hobby:rng.pick(["bahçecilik","balık tutmak","hikâye anlatmak"]),
        history:[{year:year-age,type:"birth"}]
      };
      child.name=rng.pick(child.sex==="F"?["Ayşe","Fatma","Emine","Hatice","Zeynep","Elif"]:["Mehmet","Ali","Hasan","Mustafa"]); 
      world.people.push(child);byId.set(child.id,child);household.members.push(child.id);
      man.childIds.push(child.id);woman.childIds.push(child.id);children.push(child.id);
    }
    married.push({partnerIds:[man.id,woman.id],childIds:children,householdId:household.id});
  }
  // Some founders are deceased. They remain in the person registry and kinship graph,
  // but no longer occupy a living household or have a current partner.
  const deceased = [];
  for(const person of world.people.filter(p => p.generation === 1)) {
    if(!rng.chance(0.25)) continue;
    const latestChildBirth = Math.max(person.birthYear,...person.childIds.map(id=>byId.get(id).birthYear));
    const earliestDeath = Math.max(latestChildBirth+1,person.birthYear+48,...person.history.map(event=>event.year));
    if(earliestDeath>year) continue;
    const deathYear = rng.int(earliestDeath,year);
    person.alive=false;person.deathYear=deathYear;person.age=deathYear-person.birthYear;
    person.history.push({year:deathYear,type:"death"});
    const household = world.households.find(h=>h.id===person.householdId);
    household.members=household.members.filter(id=>id!==person.id);
    person.householdId=null;
    if(person.partnerId) {
      const spouse=byId.get(person.partnerId);
      spouse.previousPartnerIds.push(person.id);
      spouse.partnerId=null;
      person.previousPartnerIds.push(spouse.id);
      person.partnerId=null;
      if(spouse.alive) spouse.history.push({year:deathYear,type:"widowed",personId:person.id});
    }
    deceased.push(person.id);
  }
  world.marriages = married;
  world.deceasedIds = deceased;
  world.observerPersonId = null;
  return world;
}
export function validateLivingLineage(world) {
  const errors = validateGenealogy(world).filter(e => !e.startsWith("birth year mismatch:") && !e.startsWith("invalid household:") && !e.startsWith("invalid parent:"));
  const people = new Map(world.people.map(p=>[p.id,p]));
  const houses = new Map(world.households.map(h=>[h.id,h]));
  for(const p of world.people) {
    const endYear=p.alive?world.year:p.deathYear;
    if(p.birthYear+p.age!==endYear) errors.push("age/year mismatch: "+p.id);
    if(p.alive && (!houses.has(p.householdId) || !houses.get(p.householdId).members.includes(p.id)))
      errors.push("living person missing household: "+p.id);
    if(!p.alive && (p.householdId!==null || !Number.isInteger(p.deathYear)))
      errors.push("deceased person has household or invalid death: "+p.id);
    for(const parentId of p.parentIds) {
      const parent=people.get(parentId);
      if(!parent || parent.birthYear>p.birthYear-16 ||
        (parent.deathYear!==null && parent.deathYear<p.birthYear) ||
        !parent.childIds.includes(p.id))
        errors.push("invalid chronological parent: "+p.id);
    }
    for(const entry of p.history) if(entry.year<p.birthYear || entry.year>endYear)
      errors.push("event outside lifetime: "+p.id);
    if(p.partnerId) {
      const partner=people.get(p.partnerId);
      if(!partner || !partner.alive || partner.partnerId!==p.id)
        errors.push("invalid current partner: "+p.id);
    }
  }
  for(const h of world.households) for(const id of h.members) {
    const p=people.get(id);
    if(!p || !p.alive || p.householdId!==h.id) errors.push("invalid household member: "+id);
  }
  return errors;
}
