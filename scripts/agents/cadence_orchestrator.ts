#!/usr/bin/env node
import fs from "fs"; import path from "path"; import https from "https"; import { spawnSync } from "node:child_process";
type Cadence={ timezone:string; phases:Record<string,string[]>; schedules:any; backfill:{enabled:boolean;start_days_ago:number;sources:string[]} };
const TZ=process.env.TZ||"America/Toronto"; const REPORT_DIR="reports/exec"; const BACKLOG_DIR="backlog";
const stamp=()=>new Date().toISOString().slice(0,10); const nowIso=()=>new Date().toISOString();
function readJSON<T>(p:string):T{ return JSON.parse(fs.readFileSync(p,"utf8")) as T; }
function sh(cmd:string,args:string[],env=process.env){ const r=spawnSync(cmd,args,{stdio:"pipe",encoding:"utf8",env}); return {code:r.status??1,out:(r.stdout||"")+(r.stderr||"")}; }
function wfile(p:string,c:string){ fs.mkdirSync(path.dirname(p),{recursive:true}); fs.writeFileSync(p,c); }
async function gh(pathname:string):Promise<any>{ const token=process.env.GITHUB_TOKEN||process.env.GH_TOKEN; const repo=process.env.GITHUB_REPOSITORY; if(!token||!repo) return {_skipped:true}; const url=`https://api.github.com/repos/${repo}${pathname}`; const headers={"Authorization":`Bearer ${token}`,"Accept":"application/vnd.github+json","User-Agent":"cadence-orchestrator"}; return await new Promise((res,rej)=>{ https.get(url,{headers},r=>{ let d=""; r.on("data",x=>d+=x); r.on("end",()=>{ try{res(JSON.parse(d))}catch{res({raw:d})} }); }).on("error",rej); }); }
function runTask(t:string){ const wrap=(cmd:string,args:string[],label:string)=>{ const r=sh(cmd,args); return {code:r.code,note:`${label}: ${r.code===0?"OK":"FAIL"}\n${r.out.trim()}`}; };
  switch(t){
    case "preflight": return wrap("node",["scripts/agents/preflight.ts"],"Preflight");
    case "delta_migrate": { const a=wrap("node",["scripts/agents/generate_delta_migration.ts"],"Delta gen"); if(a.code!==0) return a;
      const b=wrap("supabase",["db","push","--db-url",process.env.SUPABASE_DB_URL||""],"Supabase push"); return b; }
    case "verify_db": return wrap("node",["scripts/agents/verify_db.ts"],"Verify DB");
    case "compute_metrics": { const t=new Date(), y=new Date(t.getTime()-86400_000); const s=y.toISOString().slice(0,10), e=t.toISOString().slice(0,10);
      return wrap("node",["scripts/etl/compute_metrics.ts","--start",s,"--end",e],"Compute metrics"); }
    case "dq": return wrap("node",["scripts/agents/run_data_quality.ts"],"Data Quality");
    case "post_deploy_verify": return wrap("node",["scripts/agents/post_deploy_verify.ts"],"Post-deploy verify");
    case "doctor": return wrap("node",["scripts/agents/system_doctor.ts"],"System Doctor");
    case "system_health": return wrap("node",["scripts/agents/system_health.ts"],"System Health");
    case "backfill_opt": return {code:0,note:"Backfill optional (configure /ops/cadence.json)."};
    default: return {code:0,note:`Unknown task "${t}" skipped.`};
  } }

(async()=>{
  const c:Cadence=readJSON<Cadence>("ops/cadence.json"); const L:string[]=[]; let pass=true;
  L.push(`# Cadence Orchestrator Report (${stamp()})`); L.push(`Time: ${nowIso()} (${TZ})\n`);
  L.push("## GitHub Actions Diagnosis");
  const target=["Supabase Delta Migrate & Verify","Post-Deploy Verify (Supabase & DQ)","Data Quality (Nightly)","Weekly System Health & Solution Sweep"];
  const runs=await gh(`/actions/runs?per_page=20&branch=main`);
  if(runs._skipped){ L.push("- Skipped GH diagnosis (no token or repo)."); }
  else if(Array.isArray(runs.workflow_runs)){
    for(const name of target){
      const m=runs.workflow_runs.find((r:any)=>r.name===name||(r.display_title||"").includes(name));
      if(m&&(m.conclusion==="success"||m.status==="completed")) L.push(`- ✅ ${name}: #${m.run_number} at ${m.updated_at}`);
      else { L.push(`- ❌ ${name}: missing/failed recently`); pass=false; }
    }
  } else { L.push("- Unable to parse GH runs."); }
  L.push("");

  const buckets:{[k:string]:string[]}={FIND:c.phases.find,FIX:c.phases.fix,DEPLOY:c.phases.deploy};
  for(const [k,tasks] of Object.entries(buckets)){
    L.push(`## ${k}`); for(const t of tasks){ const r=runTask(t); L.push(`- **${t}** → ${r.code===0?"OK":"FAIL"}`); if(r.note) L.push("```",r.note,"```"); if(r.code!==0) pass=false; } L.push("");
  }
  const v=runTask("verify_db"); L.push(`## Post-Fix Verify\n- verify_db → ${v.code===0?"OK":"FAIL"}`); if(v.note) L.push("```",v.note,"```");
  const dq=runTask("dq");        L.push(`- dq → ${dq.code===0?"OK":"FAIL"}`);   if(dq.note) L.push("```",dq.note,"```"); if(v.code!==0||dq.code!==0) pass=false;
  const report=`${REPORT_DIR}/cadence_orchestrator_${stamp()}.md`; wfile(report,L.join("\n"));
  if(!pass){ const t=new Date().toISOString().replace(/[:T]/g,"-").slice(0,19); const ticket=`${BACKLOG_DIR}/READY_cadence_fix_${t}.md`;
    wfile(ticket,`# Cadence Fix Ticket\nIssue: cadence tasks failed\nWhen: ${nowIso()}\nOwner: Platform/Data\nKPI: All green on Verify + DQ + Schedules\nSee: ${report}\n`); console.error("❌ Cadence failed. Ticket:",ticket); process.exit(1);
  } else { console.log("✅ Cadence orchestration passed."); }
})().catch(e=>{ console.error(e); process.exit(1); });
