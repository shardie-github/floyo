#!/usr/bin/env node
import { withDb } from "../lib/db.js"; import { log, err } from "../lib/logger.js";
const args=process.argv.slice(2);
const start=args.includes("--start")?args[args.indexOf("--start")+1]:undefined;
const end  =args.includes("--end")  ?args[args.indexOf("--end")+1]  :undefined;
(async()=>{
  const s=start??new Date(Date.now()-90*86400_000).toISOString().slice(0,10);
  const e=end  ??new Date().toISOString().slice(0,10);
  await withDb(async c=>{ await c.query("select public.recompute_metrics_daily($1::date,$2::date)",[s,e]); });
  log(`Recomputed metrics_daily for ${s}..${e}`);
})().catch(e=>{ err(e); process.exit(1); });
