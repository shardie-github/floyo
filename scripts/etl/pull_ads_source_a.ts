#!/usr/bin/env node
import fs from "fs"; import { withDb } from "../lib/db.js"; import { retry } from "../lib/retry.js"; import { log, err } from "../lib/logger.js";
const args=process.argv.slice(2); const dry=args.includes("--dry-run");
const input=args.includes("--input")?args[args.indexOf("--input")+1]:undefined;
(async()=>{
  if(!input||!fs.existsSync(input)) throw new Error("Provide --input ./tests/fixtures/source_a_ads_sample.json");
  const payload=JSON.parse(fs.readFileSync(input,"utf8"));
  const flat=payload.map((r:any)=>({platform:"source_a",campaign_id:r.campaign_id??null,adset_id:r.adset_id??null,date:r.date,spend_cents:r.spend_cents??0,clicks:r.clicks??0,impressions:r.impressions??0,conv:r.conv??0}));
  log(`Source A rows: ${flat.length} (dry=${dry})`); if(dry) return;
  await withDb(async c=>{ await retry(async()=>{ await c.query("select public.upsert_spend($1::jsonb)",[JSON.stringify(flat)]); }); });
  log("Source A spend upsert done.");
})().catch(e=>{ err(e); process.exit(1); });
