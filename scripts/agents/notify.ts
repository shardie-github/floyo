#!/usr/bin/env tsx
/**
 * Notification Agent
 * Sends notifications to Slack (if webhook configured) or prints to console
 */

import { logger } from '../lib/logger.js';
import { retry } from '../lib/retry.js';

interface NotificationOptions {
    title: string;
    message: string;
    status?: 'success' | 'warning' | 'error';
    fields?: Array<{ name: string; value: string; short?: boolean }>;
}

async function sendSlackNotification(options: NotificationOptions): Promise<boolean> {
    const webhookUrl = process.env.SLACK_WEBHOOK_URL;
    if (!webhookUrl) {
        return false;
    }

    const colorMap = {
        success: '#36a64f',
        warning: '#ff9900',
        error: '#ff0000',
    };

    const payload = {
        text: options.title,
        attachments: [
            {
                color: colorMap[options.status || 'success'],
                text: options.message,
                fields: options.fields || [],
                footer: 'Self-Healing Data Stack',
                ts: Math.floor(Date.now() / 1000),
            },
        ],
    };

    try {
        await retry(
            async () => {
                const response = await fetch(webhookUrl, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(payload),
                });

                if (!response.ok) {
                    throw new Error(`Slack API error: ${response.status} ${response.statusText}`);
                }
            },
            { maxRetries: 3, description: 'Send Slack notification' }
        );

        return true;
    } catch (error) {
        logger.error('Failed to send Slack notification:', error);
        return false;
    }
}

function printNotification(options: NotificationOptions): void {
    const statusIcon = {
        success: '✅',
        warning: '⚠️',
        error: '❌',
    }[options.status || 'success'];

    logger.info(`${statusIcon} ${options.title}`);
    logger.info(options.message);

    if (options.fields && options.fields.length > 0) {
        logger.info('Details:');
        for (const field of options.fields) {
            logger.info(`  ${field.name}: ${field.value}`);
        }
    }
}

export async function notify(options: NotificationOptions): Promise<void> {
    // Try Slack first, fallback to console
    const sentToSlack = await sendSlackNotification(options);
    
    if (!sentToSlack) {
        printNotification(options);
    } else {
        logger.info('Notification sent to Slack');
    }
}

async function main() {
    const args = process.argv.slice(2);
    
    if (args.length < 2) {
        logger.error('Usage: notify.ts <title> <message> [status]');
        process.exit(1);
    }

    const [title, message, status] = args;
    
    await notify({
        title,
        message,
        status: (status as 'success' | 'warning' | 'error') || 'success',
    });
}

if (import.meta.url === `file://${process.argv[1]}`) {
    main();
}
