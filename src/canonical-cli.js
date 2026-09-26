import {createCanonicalSnapshot,loadCanonicalSnapshot,saveCanonicalSnapshot,DEFAULT_WORLD_PATH} from "./canonical-village.js";
import {formatPersonalNotebook} from "./personal-notebook.js";
const action=process.argv[2]??"inspect",path=process.argv[3]??DEFAULT_WORLD_PATH;
if(action==="init"){
 const snapshot=saveCanonicalSnapshot(path);
 console.log("Üyük saved: "+path+" | people="+snapshot.world.people.length+" | checksum="+snapshot.checksum);
}else if(action==="inspect"){
 const snapshot=loadCanonicalSnapshot(path),world=snapshot.world;
 console.log("Üyük · "+snapshot.year+" | "+world.people.filter(p=>p.alive).length+" living | "+world.households.length+" historical households");
 console.log("World checksum: "+snapshot.checksum);
 console.log(formatPersonalNotebook(world,Number(process.argv[4]??1)));
}else if(action==="verify"){
 const snapshot=loadCanonicalSnapshot(path);
 console.log("Canonical Üyük verified: "+snapshot.checksum);
}else throw new Error("Usage: npm run uyuk -- init|inspect|verify [file] [personId]");
