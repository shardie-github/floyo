#!/usr/bin/env node
import fs from "fs";
import path from "path";
import pg from "pg";
import { log, err } from "../lib/logger.js";

const REQUIRED = {
  tables: {
    events: `CREATE TABLE IF NOT EXISTS public.events(
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  occurred_at timestamptz NOT NULL DEFAULT now(),
  user_id uuid,
  event_name text NOT NULL,
  props jsonb NOT NULL DEFAULT '{}'::jsonb
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
  conv integer NOT NULL DEFAULT 0
);`,
    metrics_daily: `CREATE TABLE IF NOT EXISTS public.metrics_daily(
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  day date NOT NULL,
  sessions integer NOT NULL DEFAULT 0,
  add_to_carts integer NOT NULL DEFAULT 0,
  orders integer NOT NULL DEFAULT 0,
  revenue_cents integer NOT NULL DEFAULT 0,
  refunds_cents integer NOT NULL DEFAULT 0,
  aov_cents integer NOT NULL DEFAULT 0,
  cac_cents integer NOT NULL DEFAULT 0,
  conversion_rate numeric NOT NULL DEFAULT 0,
  gross_margin_cents integer NOT NULL DEFAULT 0,
  traffic integer NOT NULL DEFAULT 0
);`
  },
  indexes: {
    events: ["idx_events_name_time(event_name, occurred_at)"],
    spend: ["idx_spend_platform_dt(platform, date)"],
    metrics_daily: ["idx_metrics_day(day)"]
  },
  extensions: ["pgcrypto", "pg_trgm"],
  rlsTables: ["events", "spend", "metrics_daily"],
  functions: {
    upsert_events: "public.upsert_events",
    upsert_spend: "public.upsert_spend",
    recompute_metrics_daily: "public.recompute_metrics_daily",
    system_healthcheck: "public.system_healthcheck"
  }
};

function stamp() {
  const d = new Date();
  const p = (n: number) => String(n).padStart(2, "0");
  return `${d.getUTCFullYear()}${p(d.getUTCMonth() + 1)}${p(d.getUTCDate())}${p(d.getUTCHours())}${p(d.getUTCMinutes())}${p(d.getUTCSeconds())}`;
}

export async function generateDeltaMigration(): Promise<string | null> {
  const outDir = "supabase/migrations";
  fs.mkdirSync(outDir, { recursive: true });
  const dbUrl = process.env.SUPABASE_DB_URL || process.env.DATABASE_URL;
  if (!dbUrl) throw new Error("Missing SUPABASE_DB_URL or DATABASE_URL");
  const pool = new pg.Pool({ connectionString: dbUrl });
  const c = await pool.connect();
  try {
    let sql = "";

    // Extensions
    const extRows = await c.query("select extname from pg_extension");
    const have = new Set(extRows.rows.map((r: any) => r.extname));
    for (const e of REQUIRED.extensions) {
      if (!have.has(e)) sql += `CREATE EXTENSION IF NOT EXISTS ${e};\n`;
    }

    // Tables
    for (const [t, ddl] of Object.entries(REQUIRED.tables)) {
      const { rows } = await c.query(`select to_regclass('public.${t}') as r`);
      if (!rows[0].r) sql += `\n-- create table ${t}\n${ddl}\n`;
    }

    // Indexes
    for (const [t, idxs] of Object.entries(REQUIRED.indexes)) {
      for (const idxDef of idxs) {
        const name = idxDef.split("(")[0];
        const ex = await c.query(`select to_regclass('public.${name}') as r`);
        if (!ex.rows[0].r) {
          sql += `\nCREATE INDEX IF NOT EXISTS ${name} ON public.${t}${idxDef.substring(name.length)};\n`;
        }
      }
    }

    // RLS enable + policies
    const rls = await c.query(`
      select c.relname, c.relrowsecurity,
             coalesce((select count(*) from pg_policies p where p.schemaname='public' and p.tablename=c.relname),0) as pols
      from pg_class c join pg_namespace n on n.oid=c.relnamespace
      where n.nspname='public' and c.relkind='r' and c.relname = ANY($1)
    `, [REQUIRED.rlsTables]);
    const map = new Map<string, { rowsec: boolean, pols: number }>();
    rls.rows.forEach((r: any) => map.set(r.relname, { rowsec: r.relrowsecurity, pols: Number(r.pols) }));

    for (const t of REQUIRED.rlsTables) {
      if (!map.get(t)?.rowsec) sql += `\nALTER TABLE public.${t} ENABLE ROW LEVEL SECURITY;\n`;
      sql += `
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='${t}' AND policyname='${t}_select_all_srv') THEN
    CREATE POLICY ${t}_select_all_srv ON public.${t} FOR SELECT USING (true);
  END IF;
END $$;
`;
    }

    // Functions (check if they exist)
    for (const [fnName, fnFullName] of Object.entries(REQUIRED.functions)) {
      const { rows } = await c.query(
        `select proname from pg_proc p join pg_namespace n on n.oid=p.pronamespace where n.nspname='public' and proname=$1`,
        [fnName]
      );
      if (rows.length === 0) {
        // Functions are defined in the base migration, so we'll reference it
        sql += `\n-- Function ${fnName} should be created by base migration 000000000800_upsert_functions.sql\n`;
      }
    }

    if (sql.trim().length === 0) {
      log("No delta required.");
      return null;
    }
    const file = path.join(outDir, `${stamp()}_delta.sql`);
    fs.writeFileSync(file, `-- AUTO-GENERATED DELTA\nSET statement_timeout=0;\nSET timezone='America/Toronto';\n${sql}`);
    log(`✅ Wrote delta migration: ${file}`);
    return file;
  } finally {
    c.release();
    await pool.end();
  }
}

(async () => {
  try {
    await generateDeltaMigration();
  } catch (e: any) {
    err("Delta migration generation failed:", e);
    process.exit(1);
  }
})();
