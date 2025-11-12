#!/usr/bin/env node
import { withDb } from "../lib/db.js"; import { log, err } from "../lib/logger.js";
const MUST=["SUPABASE_DB_URL","TZ"];
(async()=>{
  const missing=MUST.filter(k=>!process.env[k]); if(missing.length){ err("Missing env:",missing.join(", ")); process.exit(2); }
  await withDb(async c=>{
    const now=await c.query("select now()"); log("DB OK:", now.rows[0].now);
    const t=await c.query("select to_regclass('public.events') e, to_regclass('public.spend') s, to_regclass('public.metrics_daily') m");
    log("Tables:", t.rows[0]);
  });
  console.log("# Preflight OK");
})().catch(e=>{ err(e); process.exit(1); });
