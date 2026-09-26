import {writeFileSync,mkdirSync} from "node:fs";
import {auditSeeds} from "./story-audit.js";
const count=Number(process.argv[2]??100),prefix=process.argv[3]??"story-audit";
const result=auditSeeds({count,seedPrefix:prefix});
const reportDir=process.env.STORY_AUDIT_DIR??"artifacts/story-audit";
mkdirSync(reportDir,{recursive:true});
writeFileSync(reportDir+"/report.json",JSON.stringify(result,null,2)+"\n");
const lines=["# Character story consistency audit","",
 "Seeds: "+result.count+" | People: "+result.totalPeople+" | Shared events: "+result.totalEvents,
 "Errors: "+result.errors.length+" | Modelling warnings: "+result.warnings.length,"",
 "## Errors",...result.errors.slice(0,100).map(f=>"- "+f.seed+" | person="+f.personId+" | year="+f.year+" | "+f.code+": "+f.detail),
 "","## Known limitations",...new Set(result.warnings.map(f=>f.code+": "+f.detail))].join("\n");
writeFileSync(reportDir+"/summary.md",lines+"\n");
console.log(lines);
if(process.env.GITHUB_STEP_SUMMARY)writeFileSync(process.env.GITHUB_STEP_SUMMARY,lines+"\n",{flag:"a"});
if(result.errors.length)process.exitCode=1;
