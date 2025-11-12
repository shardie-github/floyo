#!/usr/bin/env node
import fs from "fs"; import { withDb } from "../lib/db.js";
(async()=>{
  const sql=fs.readFileSync("tests/data_quality.sql","utf8");
  await withDb(async c=>{ await c.query(sql); });
  console.log("# Data Quality: PASS");
})().catch(e=>{ console.error(e); process.exit(1); });
