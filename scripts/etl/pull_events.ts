#!/usr/bin/env node
import fs from "fs"; import { withDb } from "../lib/db.js"; import { log, err } from "../lib/logger.js";
const args=process.argv.slice(2); const dry=args.includes("--dry-run");
const inputIdx=args.indexOf("--input"); const input=inputIdx>=0?args[inputIdx+1]:undefined;
(async()=>{
  if(!input||!fs.existsSync(input)) throw new Error("Provide --input ./tests/fixtures/events_sample.json");
  const rows=JSON.parse(fs.readFileSync(input,"utf8"));
  log(`Events read: ${rows.length} (dry=${dry})`); if(dry) return;
  await withDb(async c=>{ await c.query("select public.upsert_events($1::jsonb)",[JSON.stringify(rows)]); });
  log("Events upsert complete.");
})().catch(e=>{ err(e); process.exit(1); });
