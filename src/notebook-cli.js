import {createLivingLineage,validateLivingLineage} from "./lineage.js";
import {formatPersonalNotebook,validatePersonalNotebooks} from "./personal-notebook.js";
const seed=process.argv[2]??"uyuk-1600";
const id=Number(process.argv[3]??1);
const stage=process.argv[4]??null;
const world=createLivingLineage(seed,8);
const errors=[...validateLivingLineage(world),...validatePersonalNotebooks(world)];
if(errors.length)throw new Error(errors.join("; "));
console.log(formatPersonalNotebook(world,id,{stage}));
