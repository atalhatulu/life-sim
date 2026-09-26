// Queries operate on generated person IDs, never names (names need not be unique).
export function kinshipIndex(world) {
  const people=new Map(world.people.map(p=>[p.id,p]));
  const get=id=>people.get(id) ?? null;
  const parents=id=>(get(id)?.parentIds ?? []).map(get).filter(Boolean);
  const children=id=>(get(id)?.childIds ?? []).map(get).filter(Boolean);
  const siblings=id=>{
    const own=get(id);if(!own)return [];
    const parentIds=new Set(own.parentIds);
    return world.people.filter(p=>p.id!==id && p.parentIds.some(x=>parentIds.has(x)));
  };
  const ancestors=(id,maxDepth=Infinity)=>{
    const result=[],seen=new Set([id]),queue=parents(id).map(p=>({person:p,depth:1}));
    while(queue.length){
      const {person,depth}=queue.shift();
      if(seen.has(person.id)||depth>maxDepth)continue;
      seen.add(person.id);result.push({person,depth});
      if(depth<maxDepth)queue.push(...parents(person.id).map(p=>({person:p,depth:depth+1})));
    }
    return result;
  };
  const descendants=(id,maxDepth=Infinity)=>{
    const result=[],seen=new Set([id]),queue=children(id).map(p=>({person:p,depth:1}));
    while(queue.length){
      const {person,depth}=queue.shift();
      if(seen.has(person.id)||depth>maxDepth)continue;
      seen.add(person.id);result.push({person,depth});
      if(depth<maxDepth)queue.push(...children(person.id).map(p=>({person:p,depth:depth+1})));
    }
    return result;
  };
  return {get,parents,children,siblings,ancestors,descendants};
}
