// /scripts/agents/verify_db.ts
import pg from "pg";
const mustTables=["events","orders","spend","experiments","experiment_arms","metrics_daily",
"feedback_loops","safeguards","constraints","resilience_checks"];
const mustColumns:Record<string,string[]>={
  metrics_daily:["day","orders","revenue_cents","gross_margin_cents","traffic"]
};
const mustIndexes=[["events","idx_events_name_time"],["orders","idx_orders_placed_at"],["spend","idx_spend_platform_dt"],["metrics_daily","idx_metrics_day"]];
(async()=>{
  const pool=new pg.Pool({connectionString:process.env.DATABASE_URL||process.env.SUPABASE_DB_URL});
  const c=await pool.connect();
  try{
    for(const t of mustTables){
      const tRes=await c.query(`select to_regclass('public.${t}') as r`);
      if(!tRes.rows[0].r) throw new Error(`Missing table: ${t}`);
      if(mustColumns[t]) for(const col of mustColumns[t]){
        const colRes=await c.query(`select 1 from information_schema.columns where table_schema='public' and table_name=$1 and column_name=$2`,[t,col]);
        if(colRes.rowCount===0) throw new Error(`Missing column: ${t}.${col}`);
      }
    }
    for(const [t,idx] of mustIndexes){
      const iRes=await c.query(`select to_regclass('public.${idx}') as r`);
      if(!iRes.rows[0].r) throw new Error(`Missing index: ${idx} on ${t}`);
    }
    const rls=await c.query(`
      select c.relname, c.relrowsecurity,
             (select count(*) from pg_policies p where p.schemaname='public' and p.tablename=c.relname) as pols
      from pg_class c join pg_namespace n on n.oid=c.relnamespace
      where n.nspname='public' and c.relname = any($1)
    `,[mustTables]);
    for(const r of rls.rows){
      if(!r.relrowsecurity) throw new Error(`RLS not enabled on ${r.relname}`);
      if(Number(r.pols)<1) throw new Error(`No policies on ${r.relname}`);
    }
    console.log("✅ DB verified");
  } finally { c.release(); await pool.end(); }
})().catch(e=>{ console.error(e); process.exit(1); });
