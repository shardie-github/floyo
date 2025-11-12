#!/usr/bin/env tsx
/**
 * ETL Script: Pull Ads from Source B
 * Description: Pulls advertising data from generic source B and upserts to Supabase
 * Usage: tsx scripts/etl/pull_ads_source_b.ts [--dry-run] [--start YYYY-MM-DD] [--end YYYY-MM-DD]
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
    GENERIC_SOURCE_B_TOKEN: z.string().optional(),
    TZ: z.string().default('America/Toronto'),
});

const argsSchema = z.object({
    dryRun: z.boolean().default(false),
    start: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
    end: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
});

interface SpendData {
    platform: string;
    campaign_id?: string;
    adset_id?: string;
    date: string;
    spend_cents: number;
    clicks: number;
    impressions: number;
    conversions: number;
    metadata?: Record<string, any>;
}

/**
 * Pull ads data from source B (placeholder - implement actual API call)
 */
async function pullAdsSourceB(
    token: string | undefined,
    startDate: string,
    endDate: string
): Promise<SpendData[]> {
    logger.info(`Pulling ads from source B from ${startDate} to ${endDate}...`);
    
    // TODO: Implement actual API call
    // Similar to pull_ads_source_a.ts but for source B
    
    return [];
}

/**
 * Upsert spend data to Supabase using upsert_spend function
 */
async function upsertSpend(
    supabase: ReturnType<typeof createClient>,
    spendData: SpendData[],
    dryRun: boolean
): Promise<number> {
    if (dryRun) {
        logger.info(`DRY RUN - Would upsert ${spendData.length} spend records`);
        return spendData.length;
    }

    let upserted = 0;
    for (const spend of spendData) {
        try {
            const { error } = await retry(
                async () => {
                    const { error } = await supabase.rpc('upsert_spend', {
                        spend_data: {
                            platform: spend.platform,
                            campaign_id: spend.campaign_id || null,
                            adset_id: spend.adset_id || null,
                            date: spend.date,
                            spend_cents: spend.spend_cents,
                            clicks: spend.clicks,
                            impressions: spend.impressions,
                            conversions: spend.conversions,
                            metadata: spend.metadata || {},
                        },
                    });
                    return error;
                },
                { maxRetries: 3, description: `Upsert spend ${spend.platform} ${spend.date}` }
            );

            if (error) {
                logger.error(`Failed to upsert spend ${spend.platform} ${spend.date}:`, error);
            } else {
                upserted++;
            }
        } catch (error) {
            logger.error(`Error upserting spend ${spend.platform} ${spend.date}:`, error);
        }
    }

    return upserted;
}

async function main() {
    const startTime = Date.now();
    logger.info('Starting source B ads ETL...');

    try {
        const env = envSchema.parse({
            SUPABASE_URL: process.env.SUPABASE_URL,
            SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY,
            GENERIC_SOURCE_B_TOKEN: process.env.GENERIC_SOURCE_B_TOKEN,
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

        // Pull ads data
        const spendData = await pullAdsSourceB(env.GENERIC_SOURCE_B_TOKEN, startDate, endDate);
        logger.info(`Pulled ${spendData.length} spend records`);

        // Upsert spend data
        const upserted = await upsertSpend(supabase, spendData, parsedArgs.dryRun);
        logger.info(`Upserted ${upserted} spend records`);

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

export { pullAdsSourceB, upsertSpend };
