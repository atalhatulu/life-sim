import {currentCensus,savedCensus} from "./census.js";
const mode=process.argv[2]??"seed";
const arg=process.argv[3];
const house=process.argv[4]==null?null:Number(process.argv[4]);
if(mode==="seed")console.log(currentCensus(arg??"uyuk-1600",house));
else if(mode==="saved")console.log(savedCensus(arg??"data/uyuk-1600.world.json",house));
else throw new Error("Expected seed or saved");
