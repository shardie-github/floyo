#!/usr/bin/env node
import pg from "pg";
import { log, err } from "../lib/logger.js";

const REQUIRED_TABLES = ["events", "spend", "metrics_daily"];
const REQUIRED_COLUMNS: Record<string, string[]> = {
  metrics_daily: ["day", "orders", "revenue_cents", "gross_margin_cents", "traffic"],
  events: ["event_name", "occurred_at"],
  spend: ["platform", "date", "spend_cents"],
};
const REQUIRED_INDEXES: Array<[string, string]> = [
  ["events", "idx_events_name_time"],
  ["spend", "idx_spend_platform_dt"],
  ["metrics_daily", "idx_metrics_day"],
];

async function verifyDatabase(): Promise<boolean> {
  const dbUrl = process.env.SUPABASE_DB_URL || process.env.DATABASE_URL;
  if (!dbUrl) {
    throw new Error("Missing SUPABASE_DB_URL or DATABASE_URL");
  }

  const pool = new pg.Pool({ connectionString: dbUrl });
  const client = await pool.connect();

  try {
    // Verify tables exist
    for (const table of REQUIRED_TABLES) {
      const result = await client.query(`SELECT to_regclass('public.${table}') as r`);
      if (!result.rows[0].r) {
        throw new Error(`Missing table: ${table}`);
      }
      log(`✅ Table exists: ${table}`);
    }

    // Verify columns exist
    for (const [table, columns] of Object.entries(REQUIRED_COLUMNS)) {
      for (const col of columns) {
        const result = await client.query(
          `SELECT 1 FROM information_schema.columns 
           WHERE table_schema='public' AND table_name=$1 AND column_name=$2`,
          [table, col]
        );
        if (result.rowCount === 0) {
          throw new Error(`Missing column: ${table}.${col}`);
        }
      }
      log(`✅ Columns verified: ${table}`);
    }

    // Verify indexes exist
    for (const [table, index] of REQUIRED_INDEXES) {
      const result = await client.query(`SELECT to_regclass('public.${index}') as r`);
      if (!result.rows[0].r) {
        throw new Error(`Missing index: ${index} on ${table}`);
      }
      log(`✅ Index exists: ${index}`);
    }

    // Verify RLS enabled and policies exist
    const rlsResult = await client.query(`
      SELECT c.relname, c.relrowsecurity,
             (SELECT count(*) FROM pg_policies p 
              WHERE p.schemaname='public' AND p.tablename=c.relname) as pols
      FROM pg_class c 
      JOIN pg_namespace n ON n.oid=c.relnamespace
      WHERE n.nspname='public' AND c.relname = ANY($1)
    `, [REQUIRED_TABLES]);

    for (const row of rlsResult.rows) {
      if (!row.relrowsecurity) {
        throw new Error(`RLS not enabled on ${row.relname}`);
      }
      if (Number(row.pols) < 1) {
        throw new Error(`No policies on ${row.relname}`);
      }
      log(`✅ RLS enabled with policies: ${row.relname}`);
    }

    log("✅ Database verified successfully");
    return true;
  } finally {
    client.release();
    await pool.end();
  }
}

(async () => {
  try {
    await verifyDatabase();
    console.log("# Verify DB: PASS");
  } catch (error: any) {
    err("Database verification failed:", error);
    process.exit(1);
  }
})();
