#!/usr/bin/env node
import fs from "fs"; import https from "https"; import { spawnSync } from "node:child_process";
const TZ=process.env.TZ||"America/Toronto"; const REPORT_DIR="reports/exec"; const BACKLOG_DIR="backlog";
const stamp=()=>new Date().toISOString().slice(0,10); const nowIso=()=>new Date().toISOString();
function sh(cmd:string,args:string[]){ const r=spawnSync(cmd,args,{stdio:"pipe",encoding:"utf8"}); return {code:r.status??1,out:(r.stdout||"")+(r.stderr||"")}; }
function write(p:string,c:string){ fs.mkdirSync(require("path").dirname(p),{recursive:true}); fs.writeFileSync(p,c); }
async function gh(path:string):Promise<any>{ const token=process.env.GITHUB_TOKEN||process.env.GH_TOKEN; const repo=process.env.GITHUB_REPOSITORY; if(!token||!repo) return {_skipped:"no_token_or_repo"}; const url=`https://api.github.com/repos/${repo}${path}`; const headers={"Authorization":`Bearer ${token}`,"User-Agent":"post-deploy-verifier","Accept":"application/vnd.github+json"}; return await new Promise((res,rej)=>{ https.get(url,{headers},r=>{ let d=""; r.on("data",x=>d+=x); r.on("end",()=>{ try{res(JSON.parse(d))}catch{res({raw:d})} }); }).on("error",rej); }); }
(async()=>{
  let pass=true; const L:string[]=[]; L.push(`# Post-Deploy Verification (${stamp()})`); L.push(`Time: ${nowIso()} (${TZ})\n`);
  try{
    const wf="Supabase Delta Migrate & Verify", branch="main";
    const runs=await gh(`/actions/runs?event=push&branch=${branch}&per_page=10`);
    if(runs._skipped){ L.push("## GitHub Actions\n- Skipped: no token/repo context\n"); }
    else if(runs.workflow_runs){
      const recent=runs.workflow_runs.find((r:any)=>r.name===wf || (r.display_title||"").includes("Supabase Delta Migrate"));
      if(recent && (recent.conclusion==="success"||recent.status==="completed")){
        L.push(`## GitHub Actions\n- Found success #${recent.run_number} at ${recent.updated_at}\n`);
      } else { pass=false; L.push(`## GitHub Actions\n- ❌ No recent successful run of "${wf}" on main\n`); }
    }
  }catch(e:any){ L.push(`## GitHub Actions\n- Error: ${e?.message||e}\n`); }
  const pre=sh("node",["scripts/agents/preflight.ts"]); L.push("## Preflight\n```",pre.out.trim(),"```\n"); if(pre.code!==0) pass=false;
  const v  =sh("node",["scripts/agents/verify_db.ts"]); L.push("## DB Verify\n```",v.out.trim(),"```\n"); if(v.code!==0) pass=false;
  const today=new Date(), yday=new Date(today.getTime()-86400_000); const s=yday.toISOString().slice(0,10), e=today.toISOString().slice(0,10);
  const comp=sh("node",["scripts/etl/compute_metrics.ts","--start",s,"--end",e]); L.push(`## Metrics Recompute (${s}..${e})\n\`\`\`\n${comp.out.trim()}\n\`\`\`\n`); if(comp.code!==0) pass=false;
  const dq =sh("node",["scripts/agents/run_data_quality.ts"]); L.push("## Data Quality\n```",dq.out.trim(),"```\n"); if(dq.code!==0) pass=false;
  const report=`${REPORT_DIR}/post_deploy_verification_${stamp()}.md`; write(report, L.join("\n"));
  if(!pass){ const t=new Date().toISOString().replace(/[:T]/g,"-").slice(0,19); const ticket=`${BACKLOG_DIR}/READY_post_deploy_fix_${t}.md`;
    write(ticket,`# Post-Deploy Fix Ticket\nIssue: One or more verification steps failed\nWhen: ${nowIso()}\nOwner: Data Eng\nKPI: All green on Verify + DQ\nNext: see ${report}\n`);
    console.error("❌ Verification failed. Ticket:", ticket); process.exit(1);
  } else { console.log("✅ Post-deploy verification passed."); }
})().catch(e=>{ console.error(e); process.exit(1); });
