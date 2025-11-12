/**
 * Logger Utility Library
 * Timestamped logs with levels
 */

export enum LogLevel {
    DEBUG = 0,
    INFO = 1,
    WARN = 2,
    ERROR = 3,
}

const LOG_LEVEL = (process.env.LOG_LEVEL || 'INFO').toUpperCase() as keyof typeof LogLevel;
const CURRENT_LEVEL = LogLevel[LOG_LEVEL] ?? LogLevel.INFO;

function formatTimestamp(): string {
    const now = new Date();
    const tz = process.env.TZ || 'America/Toronto';
    return now.toLocaleString('en-US', {
        timeZone: tz,
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: false,
    });
}

function formatMessage(level: string, message: string, meta?: any): string {
    const timestamp = formatTimestamp();
    const metaStr = meta ? ` ${JSON.stringify(meta)}` : '';
    return `[${timestamp}] [${level}] ${message}${metaStr}`;
}

export const logger = {
    debug(message: string, meta?: any): void {
        if (CURRENT_LEVEL <= LogLevel.DEBUG) {
            console.debug(formatMessage('DEBUG', message, meta));
        }
    },

    info(message: string, meta?: any): void {
        if (CURRENT_LEVEL <= LogLevel.INFO) {
            console.log(formatMessage('INFO', message, meta));
        }
    },

    warn(message: string, meta?: any): void {
        if (CURRENT_LEVEL <= LogLevel.WARN) {
            console.warn(formatMessage('WARN', message, meta));
        }
    },

    error(message: string, meta?: any): void {
        if (CURRENT_LEVEL <= LogLevel.ERROR) {
            console.error(formatMessage('ERROR', message, meta));
        }
    },
};
