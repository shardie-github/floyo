#!/usr/bin/env node
import { spawnSync } from "node:child_process"; import fs from "fs";
function run(cmd:string,args:string[]){ const r=spawnSync(cmd,args,{stdio:"inherit"}); return r.status??1; }
let status=run("node",["scripts/agents/generate_delta_migration.ts"]);
status=status||run("supabase",["db","push","--db-url",process.env.SUPABASE_DB_URL||""]);
if(status!==0){
  const files=fs.readdirSync("supabase/migrations").filter(f=>f.endsWith(".sql")).sort();
  for(const f of files){ status=run("psql",[process.env.SUPABASE_DB_URL||"","-v","ON_ERROR_STOP=1","-f",`supabase/migrations/${f}`]); if(status!==0) break; }
}
status=status||run("node",["scripts/agents/verify_db.ts"]);
if(status!==0){
  const stamp=new Date().toISOString().slice(0,19).replace(/[:T]/g,"-");
  const path=`backlog/READY_system_fix_${stamp}.md`;
  fs.mkdirSync("backlog",{recursive:true});
  fs.writeFileSync(path,`# System Doctor: Auto Ticket\nIssue: Migration/verification failure\nWhen: ${new Date().toISOString()}\nOwner: Data Eng\nKPI: DQ SLOs green\n`);
  process.exit(1);
}else{ console.log("✅ System Doctor OK"); }
