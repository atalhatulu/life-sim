// Deterministic, player-independent village simulation. Fictional test population.
export class RNG {
  constructor(seed = 1) { this.seed = String(seed); this.state = RNG.hash(this.seed) || 0x6d2b79f5; }
  static hash(s) { let h = 2166136261 >>> 0; for (const c of s) { h ^= c.charCodeAt(0); h = Math.imul(h, 16777619); } return h >>> 0; }
  next() { let t = (this.state += 0x6d2b79f5); t = Math.imul(t ^ t >>> 15, t | 1); t ^= t + Math.imul(t ^ t >>> 7, t | 61); return ((t ^ t >>> 14) >>> 0) / 4294967296; }
  int(a,b) { return a + Math.floor(this.next() * (b-a+1)); }
  pick(a) { return a[this.int(0,a.length-1)]; }
  chance(p) { return this.next() < p; }
}
const GIVEN = ["Mehmet","Ali","Hasan","Ayşe","Fatma","Emine","Hüseyin","Mustafa","Hatice","Zeynep","İbrahim","Elif"];
const SURNAMES = ["Demir","Kaya","Çelik","Yıldız","Arslan","Aydın","Şahin","Öztürk"];
const JOBS = ["çiftçi","marangoz","dokumacı","çoban","demirci","değirmenci"];
const HOBBIES = ["balık tutmak","hikâye anlatmak","oyma yapmak","bahçecilik","türkü söylemek","yürüyüş"];
const clamp = n => Math.max(0,Math.min(100,n));
export function createVillage(seed = 1, householdCount = 20) {
  if (!Number.isInteger(householdCount) || householdCount < 1) throw new Error("householdCount must be a positive integer");
  const rng = new RNG(seed), people = [], households = [];
  let nextId = 1;
  const person = (household, age, role, parents = []) => {
    const p = { id: nextId++, name: rng.pick(GIVEN), surname: household.surname, age, householdId: household.id,
      role, parents, children: [], partnerId: null, job: age >= 16 ? rng.pick(JOBS) : null,
      hobby: rng.pick(HOBBIES), traits: { sociability:rng.int(15,90), diligence:rng.int(15,90), curiosity:rng.int(15,90) },
      needs: { energy:rng.int(55,95), hunger:rng.int(15,45), social:rng.int(35,85) },
      money: age >= 16 ? rng.int(3,20) : 0, memories:[], activity:null };
    people.push(p); household.members.push(p.id); return p;
  };
  for (let i=0;i<householdCount;i++) {
    const h = { id:i+1, surname:rng.pick(SURNAMES), members:[], food:rng.int(18,55), money:rng.int(12,60), home:"Üyük" };
    households.push(h);
    const a=person(h,rng.int(28,56),"adult"), b=person(h,rng.int(25,Math.min(55,a.age+4)),"adult");
    a.partnerId=b.id; b.partnerId=a.id;
    const count=rng.int(0,4);
    for(let c=0;c<count;c++) {
      const maxAge=Math.max(0,Math.min(22,a.age-17,b.age-17));
      const child=person(h,rng.int(0,maxAge),"child",[a.id,b.id]);
      a.children.push(child.id); b.children.push(child.id);
    }
  }
  return { seed:String(seed), day:0, people, households, history:[] };
}
export function stepDay(world) {
  // A day has its own stream: a saved world can resume without RNG state.
  const rng = new RNG(world.seed + ":day:" + world.day);
  const byId = new Map(world.people.map(p=>[p.id,p]));
  const householdById = new Map(world.households.map(h=>[h.id,h]));
  const events = [];
  for (const p of world.people) {
    const h = householdById.get(p.householdId);
    let activity, reason;
    if (p.needs.hunger >= 65 && h.food > 0) { activity="eat"; reason="hungry"; h.food--; p.needs.hunger=clamp(p.needs.hunger-42); p.needs.energy=clamp(p.needs.energy+4); }
    else if (p.needs.energy < 35) { activity="rest"; reason="tired"; p.needs.energy=clamp(p.needs.energy+36); }
    else if (p.needs.social < 38 && h.members.length > 1) {
      activity="visit"; reason="lonely";
      const others=h.members.filter(id=>id!==p.id);
      const other=byId.get(rng.pick(others));
      p.needs.social=clamp(p.needs.social+27); other.needs.social=clamp(other.needs.social+12);
      events.push({day:world.day,personId:p.id,activity,reason,targetId:other.id});
    } else if (p.age >= 16 && h.food < 12 && p.job==="çiftçi") {
      activity="work"; reason="household food shortage"; h.food+=rng.int(2,5); p.needs.energy=clamp(p.needs.energy-23);
    } else if (p.age >= 16 && rng.chance(p.traits.diligence/110)) {
      activity="work"; reason="work and household needs";
      if(p.job==="çiftçi" || p.job==="çoban") h.food+=rng.int(1,3);
      else h.money+=rng.int(1,3);
      p.needs.energy=clamp(p.needs.energy-20);
    } else if (rng.chance(p.traits.curiosity/120)) {
      activity="hobby"; reason=p.hobby; p.needs.energy=clamp(p.needs.energy-8); p.needs.social=clamp(p.needs.social+5);
    } else { activity="rest"; reason="free time"; p.needs.energy=clamp(p.needs.energy+18); }
    p.activity=activity;
    p.needs.hunger=clamp(p.needs.hunger+rng.int(9,16));
    p.needs.social=clamp(p.needs.social-rng.int(3,8));
    events.push({day:world.day,personId:p.id,activity,reason});
    if (activity==="visit" || (activity==="work" && rng.chance(0.08))) {
      p.memories.push({day:world.day,activity,reason});
      if(p.memories.length>30) p.memories.shift();
    }
  }
  world.history.push(...events);
  world.day++;
  return events;
}
export function validateVillage(world) {
  const errors=[], ids=new Set(world.people.map(p=>p.id)), households=new Map(world.households.map(h=>[h.id,h]));
  if(ids.size!==world.people.length) errors.push("duplicate person ID");
  for(const p of world.people) {
    const h=households.get(p.householdId);
    if(!h || h.members.filter(id=>id===p.id).length!==1) errors.push("invalid household for "+p.id);
    for(const parentId of p.parents) {
      const parent=world.people.find(x=>x.id===parentId);
      if(!parent || parent.age-p.age<16 || !parent.children.includes(p.id)) errors.push("invalid parent for "+p.id);
    }
    if(p.partnerId && world.people.find(x=>x.id===p.partnerId)?.partnerId!==p.id) errors.push("asymmetric partnership "+p.id);
  }
  for(const h of world.households) for(const id of h.members) if(!ids.has(id)) errors.push("missing member "+id);
  return errors;
}
