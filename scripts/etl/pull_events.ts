#!/usr/bin/env tsx
/**
 * ETL Script: Pull Events
 * Description: Pulls events from generic source and upserts to Supabase
 * Usage: tsx scripts/etl/pull_events.ts [--dry-run] [--start YYYY-MM-DD] [--end YYYY-MM-DD]
 */

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import { z } from 'zod';
import { logger } from '../lib/logger.js';
import { retry } from '../lib/retry.js';

dotenv.config({ path: '.env.local' });
dotenv.config();

const envSchema = z.object({
    SUPABASE_URL: z.string().url(),
    SUPABASE_SERVICE_ROLE_KEY: z.string().min(1),
    TZ: z.string().default('America/Toronto'),
});

const argsSchema = z.object({
    dryRun: z.boolean().default(false),
    start: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
    end: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
});

interface EventData {
    name: string;
    occurred_at: string;
    user_id?: string;
    props?: Record<string, any>;
    source?: string;
}

/**
 * Pull events from generic source (placeholder - implement actual API call)
 */
async function pullEvents(
    startDate: string,
    endDate: string
): Promise<EventData[]> {
    // TODO: Implement actual API call to pull events
    // For now, return empty array (idempotent - safe to re-run)
    logger.info(`Pulling events from ${startDate} to ${endDate}...`);
    
    // Example: If you have an events API, implement here
    // const response = await fetch(`https://api.example.com/events?start=${startDate}&end=${endDate}`);
    // return response.json();
    
    return [];
}

/**
 * Upsert events to Supabase using upsert_events function
 */
async function upsertEvents(
    supabase: ReturnType<typeof createClient>,
    events: EventData[],
    dryRun: boolean
): Promise<number> {
    if (dryRun) {
        logger.info(`DRY RUN - Would upsert ${events.length} events`);
        return events.length;
    }

    let upserted = 0;
    for (const event of events) {
        try {
            const { error } = await retry(
                async () => {
                    const { error } = await supabase.rpc('upsert_events', {
                        event_data: {
                            name: event.name,
                            occurred_at: event.occurred_at,
                            user_id: event.user_id || null,
                            props: event.props || {},
                            source: event.source || 'etl',
                        },
                    });
                    return error;
                },
                { maxRetries: 3, description: `Upsert event ${event.name}` }
            );

            if (error) {
                logger.error(`Failed to upsert event ${event.name}:`, error);
            } else {
                upserted++;
            }
        } catch (error) {
            logger.error(`Error upserting event ${event.name}:`, error);
        }
    }

    return upserted;
}

async function main() {
    const startTime = Date.now();
    logger.info('Starting events ETL...');

    try {
        const env = envSchema.parse({
            SUPABASE_URL: process.env.SUPABASE_URL,
            SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY,
            TZ: process.env.TZ || 'America/Toronto',
        });

        const args = {
            dryRun: process.argv.includes('--dry-run'),
            start: process.argv.includes('--start')
                ? process.argv[process.argv.indexOf('--start') + 1]
                : undefined,
            end: process.argv.includes('--end')
                ? process.argv[process.argv.indexOf('--end') + 1]
                : undefined,
        };

        const parsedArgs = argsSchema.parse(args);

        const startDate = parsedArgs.start || (() => {
            const d = new Date();
            d.setDate(d.getDate() - 7); // Default: last 7 days
            return d.toISOString().split('T')[0];
        })();

        const endDate = parsedArgs.end || new Date().toISOString().split('T')[0];

        if (parsedArgs.dryRun) {
            logger.info('DRY RUN MODE - No data will be written');
        }

        const supabase = createClient(env.SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, {
            auth: {
                autoRefreshToken: false,
                persistSession: false,
            },
        });

        // Pull events
        const events = await pullEvents(startDate, endDate);
        logger.info(`Pulled ${events.length} events`);

        // Upsert events
        const upserted = await upsertEvents(supabase, events, parsedArgs.dryRun);
        logger.info(`Upserted ${upserted} events`);

        const duration = ((Date.now() - startTime) / 1000).toFixed(2);
        logger.info(`Completed successfully in ${duration}s`);

    } catch (error) {
        logger.error('Error:', error);
        process.exit(1);
    }
}

if (import.meta.url === `file://${process.argv[1]}`) {
    main();
}

export { pullEvents, upsertEvents };
