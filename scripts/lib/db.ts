import pg from "pg";
export const getPool = () => new pg.Pool({
  connectionString: process.env.SUPABASE_DB_URL || process.env.DATABASE_URL,
  max: 5, idleTimeoutMillis: 10_000, connectionTimeoutMillis: 10_000
});
export async function withDb<T>(fn:(c:pg.PoolClient)=>Promise<T>):Promise<T>{
  const pool=getPool(); const c=await pool.connect();
  try{ return await fn(c); } finally{ c.release(); await pool.end(); }
}
