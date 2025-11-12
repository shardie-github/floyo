#!/usr/bin/env tsx
/**
 * Delta Migration Generator
 * Introspects database and generates migration with only missing objects
 */

import fs from "fs";
import path from "path";
import pg from "pg";
import { logger } from '../lib/logger.js';

const REQUIRED = {
  tables: {
    events: `CREATE TABLE IF NOT EXISTS public.events(
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  occurred_at timestamptz NOT NULL DEFAULT now(),
  user_id uuid,
  props jsonb NOT NULL DEFAULT '{}'::jsonb,
  source text,
  created_at timestamptz NOT NULL DEFAULT now()
);`,
    orders: `CREATE TABLE IF NOT EXISTS public.orders(
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  placed_at timestamptz NOT NULL DEFAULT now(),
  order_number text UNIQUE,
  user_id uuid,
  items jsonb NOT NULL DEFAULT '[]'::jsonb,
  subtotal_cents integer NOT NULL DEFAULT 0,
  shipping_cents integer NOT NULL DEFAULT 0,
  tax_cents integer NOT NULL DEFAULT 0,
  discount_cents integer NOT NULL DEFAULT 0,
  total_cents integer NOT NULL DEFAULT 0,
  currency text NOT NULL DEFAULT 'USD',
  source text
);`,
    spend: `CREATE TABLE IF NOT EXISTS public.spend(
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  platform text NOT NULL,
  campaign_id text,
  adset_id text,
  date date NOT NULL,
  spend_cents integer NOT NULL DEFAULT 0,
  clicks integer NOT NULL DEFAULT 0,
  impressions integer NOT NULL DEFAULT 0,
  conversions integer NOT NULL DEFAULT 0,
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(platform, campaign_id, adset_id, date)
);`,
    experiments: `CREATE TABLE IF NOT EXISTS public.experiments(
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  key text UNIQUE NOT NULL,
  name text NOT NULL,
  status text NOT NULL DEFAULT 'draft',
  start_at timestamptz,
  end_at timestamptz
);`,
    experiment_arms: `CREATE TABLE IF NOT EXISTS public.experiment_arms(
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  experiment_id uuid REFERENCES public.experiments(id) ON DELETE CASCADE,
  arm_key text NOT NULL,
  weight numeric NOT NULL DEFAULT 0.5
);`,
    metrics_daily: `CREATE TABLE IF NOT EXISTS public.metrics_daily(
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  day date NOT NULL UNIQUE,
  sessions integer NOT NULL DEFAULT 0,
  add_to_carts integer NOT NULL DEFAULT 0,
  orders integer NOT NULL DEFAULT 0,
  revenue_cents integer NOT NULL DEFAULT 0,
  refunds_cents integer NOT NULL DEFAULT 0,
  aov_cents integer NOT NULL DEFAULT 0,
  cac_cents integer NOT NULL DEFAULT 0,
  conversion_rate numeric NOT NULL DEFAULT 0,
  gross_margin_cents integer NOT NULL DEFAULT 0,
  traffic integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);`,
    feedback_loops: `CREATE TABLE IF NOT EXISTS public.feedback_loops(
  id serial PRIMARY KEY,
  name text, loop_type text, delay_days int, bottleneck text,
  leverage_point text, fix text, owner text, metric text, created_at timestamptz default now()
);`,
    safeguards: `CREATE TABLE IF NOT EXISTS public.safeguards(
  id serial PRIMARY KEY,
  action text, risk text, mitigation text, owner text, kpi text, created_at timestamptz default now()
);`,
    constraints: `CREATE TABLE IF NOT EXISTS public.constraints(
  id serial PRIMARY KEY,
  stage text, constraint text, cause text, impact numeric,
  fix text, cost numeric, benefit numeric, owner text, kpi text
);`,
    resilience_checks: `CREATE TABLE IF NOT EXISTS public.resilience_checks(
  id serial PRIMARY KEY,
  subsystem text, failure_mode text, impact text,
  recovery_plan text, score int, owner text, created_at timestamptz default now()
);`
  },
  columns: {
    metrics_daily: {
      gross_margin_cents: "integer NOT NULL DEFAULT 0",
      traffic: "integer NOT NULL DEFAULT 0"
    }
  },
  indexes: {
    events: ["idx_events_name_time(name, occurred_at)", "idx_events_occurred_at(occurred_at DESC)"],
    spend: ["idx_spend_platform_dt(platform, date DESC)", "idx_spend_date(date DESC)"],
    metrics_daily: ["idx_metrics_day(day DESC)"]
  },
  extensions: ["pgcrypto","pg_trgm"],
  rlsTables: [
    "events","spend","metrics_daily"
  ]
};

function stamp(){
  const d=new Date(),p=(n:number)=>String(n).padStart(2,"0");
  return `${d.getUTCFullYear()}${p(d.getUTCMonth()+1)}${p(d.getUTCDate())}${p(d.getUTCHours())}${p(d.getUTCMinutes())}${p(d.getUTCSeconds())}`;
}

export async function generateDeltaMigration(): Promise<string | null> {
  const outDir="supabase/migrations";
  fs.mkdirSync(outDir,{recursive:true});
  const dbUrl=process.env.SUPABASE_DB_URL||process.env.DATABASE_URL;
  if(!dbUrl) throw new Error("Missing SUPABASE_DB_URL or DATABASE_URL");
  const pool=new pg.Pool({connectionString:dbUrl});
  const c=await pool.connect();
  try{
    let sql=""; // build only missing

    // Extensions
    const extRows=await c.query("select extname from pg_extension");
    const have=new Set(extRows.rows.map((r:any)=>r.extname));
    for(const e of REQUIRED.extensions){ if(!have.has(e)) sql+=`CREATE EXTENSION IF NOT EXISTS ${e};\n`; }

    // Tables
    for(const [t,ddl] of Object.entries(REQUIRED.tables)){
      const {rows}=await c.query(`select to_regclass('public.${t}') as r`);
      if(!rows[0].r) sql+=`\n-- create table ${t}\n${ddl}\n`;
    }

    // Columns
    for(const [t,cols] of Object.entries(REQUIRED.columns)){
      for(const [col,def] of Object.entries(cols as Record<string,string>)){
        const {rowCount}=await c.query(
          `select 1 from information_schema.columns where table_schema='public' and table_name=$1 and column_name=$2`,
          [t,col]
        );
        if(rowCount===0) sql+=`\nALTER TABLE public.${t} ADD COLUMN IF NOT EXISTS ${col} ${def};\n`;
      }
    }

    // Indexes
    for(const [t,idxs] of Object.entries(REQUIRED.indexes)){
      for(const idxDef of idxs as string[]){
        const name=idxDef.split("(")[0];
        const ex=await c.query(`select to_regclass('public.${name}') as r`);
        if(!ex.rows[0].r) sql+=`\nCREATE INDEX IF NOT EXISTS ${name} ON public.${t}${idxDef.substring(name.length)};\n`;
      }
    }

    // RLS enable + guarded select policies
    const rls=await c.query(`
      select c.relname, c.relrowsecurity,
             coalesce((select count(*) from pg_policies p where p.schemaname='public' and p.tablename=c.relname),0) as pols
      from pg_class c join pg_namespace n on n.oid=c.relnamespace
      where n.nspname='public' and c.relkind='r' and c.relname = ANY($1)
    `, [REQUIRED.rlsTables]);
    const map=new Map<string,{rowsec:boolean,pols:number}>();
    rls.rows.forEach((r:any)=>map.set(r.relname,{rowsec:r.relrowsecurity,pols:Number(r.pols)}));

    for(const t of REQUIRED.rlsTables){
      if(!map.get(t)?.rowsec) sql+=`\nALTER TABLE public.${t} ENABLE ROW LEVEL SECURITY;\n`;
      sql+=`
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='${t}' AND policyname='${t}_select_all_srv') THEN
    CREATE POLICY ${t}_select_all_srv ON public.${t} FOR SELECT USING (true);
  END IF;
END $$;
`;
    }

    if(sql.trim().length===0){ 
      logger.info("No delta required.");
      return null;
    }
    const file=path.join(outDir,`${stamp()}_delta.sql`);
    fs.writeFileSync(file,`-- AUTO-GENERATED DELTA\nSET statement_timeout=0;\nSET timezone='America/Toronto';\n${sql}`);
    logger.info(`✅ Wrote delta migration: ${file}`);
    return file;
  } finally { c.release(); await pool.end(); }
}

async function main(){
  try {
    await generateDeltaMigration();
  } catch (e) {
    logger.error('Delta migration generation failed:', e);
    process.exit(1);
  }
}

if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}
