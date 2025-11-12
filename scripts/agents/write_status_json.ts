#!/usr/bin/env node
import fs from "fs"; import path from "path"; import { spawnSync } from "node:child_process"; import https from "https";
const TZ=process.env.TZ||"America/Toronto"; const stamp=()=>new Date().toISOString();
function sh(cmd:string,args:string[]){ const r=spawnSync(cmd,args,{stdio:"pipe",encoding:"utf8"}); return {ok:(r.status??1)===0,out:(r.stdout||"")+(r.stderr||"")}; }
function latest(prefix:string){ const dir="reports/exec"; if(!fs.existsSync(dir)) return null; const f=fs.readdirSync(dir).filter(x=>x.startsWith(prefix)).sort().reverse(); return f[0]?`${dir}/${f[0]}`:null; }
async function gh(pathname:string):Promise<any>{ const token=process.env.GITHUB_TOKEN||process.env.GH_TOKEN; const repo=process.env.GITHUB_REPOSITORY; if(!token||!repo) return {_skipped:true}; const url=`https://api.github.com/repos/${repo}${pathname}`; const headers={"Authorization":`Bearer ${token}`,"Accept":"application/vnd.github+json","User-Agent":"status-writer"}; return await new Promise((res,rej)=>{ https.get(url,{headers},r=>{ let d=""; r.on("data",x=>d+=x); r.on("end",()=>{ try{res(JSON.parse(d))}catch{res({raw:d})} }); }).on("error",rej); }); }
(async()=>{
  const verify=sh("node",["scripts/agents/verify_db.ts"]);
  const dq    =sh("node",["scripts/agents/run_data_quality.ts"]);
  const ghRuns=await gh(`/actions/runs?per_page=10&branch=main`);
  const workflows=["Supabase Delta Migrate & Verify","Post-Deploy Verify (Supabase & DQ)","Data Quality (Nightly)","Weekly System Health & Solution Sweep"];
  const ghStatus:any={};
  if(!ghRuns._skipped && Array.isArray(ghRuns.workflow_runs)){
    for(const name of workflows){ const run=ghRuns.workflow_runs.find((r:any)=>r.name===name||(r.display_title||"").includes(name));
      ghStatus[name]={found:!!run, success:!!run&&(run.conclusion==="success"||run.status==="completed"), run_number:run?.run_number, updated_at:run?.updated_at}; }
  }
  const payload={ updatedAt:stamp(), timezone:TZ, checks:{ dbVerify:verify.ok, dataQuality:dq.ok, workflows:ghStatus }, links:{ postDeployReport:latest("post_deploy_verification_"), cadenceReport:latest("cadence_orchestrator_") } };
  fs.mkdirSync("reports",{recursive:true}); fs.writeFileSync(path.join("reports","status.json"), JSON.stringify(payload,null,2));
  console.log("✅ Wrote reports/status.json"); if(!verify.ok||!dq.ok) process.exitCode=1;
})().catch(e=>{ console.error(e); process.exit(1); });
