import {createLivingLineage,validateLivingLineage} from "./lineage.js";
import {formatLifeBook,validateLifeBooks} from "./life-book.js";
const seed=process.argv[2]??"uyuk-1600";
const id=Number(process.argv[3]??1);
const world=createLivingLineage(seed,8);
const errors=[...validateLivingLineage(world),...validateLifeBooks(world)];
if(errors.length)throw new Error(errors.join("; "));
console.log(formatLifeBook(world,id));
