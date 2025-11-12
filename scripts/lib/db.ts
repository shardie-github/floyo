/**
 * Database Helper Library
 * Provides PostgreSQL connection pool with retry logic
 */

import pg from 'pg';
import { retry } from './retry.js';
import { logger } from './logger.js';

const { Pool } = pg;

let pool: pg.Pool | null = null;

/**
 * Get or create database connection pool
 */
export function getPool(): pg.Pool {
    if (!pool) {
        const dbUrl = process.env.SUPABASE_DB_URL || process.env.DATABASE_URL;
        if (!dbUrl) {
            throw new Error('Missing SUPABASE_DB_URL or DATABASE_URL environment variable');
        }

        pool = new Pool({
            connectionString: dbUrl,
            max: 10,
            idleTimeoutMillis: 30000,
            connectionTimeoutMillis: 10000,
        });

        pool.on('error', (err) => {
            logger.error('Database pool error:', err);
        });
    }

    return pool;
}

/**
 * Execute a query with retry logic
 */
export async function query<T = any>(
    text: string,
    params?: any[]
): Promise<pg.QueryResult<T>> {
    const pool = getPool();
    return retry(
        async () => {
            const client = await pool.connect();
            try {
                const result = await client.query<T>(text, params);
                return result;
            } finally {
                client.release();
            }
        },
        {
            maxRetries: 3,
            baseDelayMs: 1000,
            description: `Query: ${text.substring(0, 50)}...`,
        }
    );
}

/**
 * Execute a transaction
 */
export async function transaction<T>(
    callback: (client: pg.PoolClient) => Promise<T>
): Promise<T> {
    const pool = getPool();
    const client = await pool.connect();
    try {
        await client.query('BEGIN');
        const result = await callback(client);
        await client.query('COMMIT');
        return result;
    } catch (error) {
        await client.query('ROLLBACK');
        throw error;
    } finally {
        client.release();
    }
}

/**
 * Close the connection pool
 */
export async function closePool(): Promise<void> {
    if (pool) {
        await pool.end();
        pool = null;
    }
}

/**
 * Test database connection
 */
export async function testConnection(): Promise<boolean> {
    try {
        const result = await query('SELECT 1 as test');
        return result.rows[0]?.test === 1;
    } catch (error) {
        logger.error('Database connection test failed:', error);
        return false;
    }
}
