/**
 * Alert Notification Utility
 * Used by Hardonia Ops Agent to send alerts via webhooks
 * Never logs or echoes secret values
 */

interface AlertPayload {
  title: string;
  message: string;
  severity: 'info' | 'warning' | 'critical';
  link?: string;
  source?: string;
  timestamp?: string;
}

type AlertType = 'reliability' | 'security' | 'cost';

const WEBHOOK_ENV_MAP: Record<AlertType, string> = {
  reliability: 'RELIABILITY_ALERT_WEBHOOK',
  security: 'SECURITY_ALERT_WEBHOOK',
  cost: 'COST_ALERT_WEBHOOK',
};

/**
 * Send alert notification via webhook
 * @param type - Type of alert (reliability, security, cost)
 * @param payload - Alert payload
 */
export async function notify(type: AlertType, payload: AlertPayload): Promise<void> {
  const envVarName = WEBHOOK_ENV_MAP[type];
  const webhookUrl = process.env[envVarName];

  if (!webhookUrl) {
    console.warn(`[notify] Webhook not configured: ${envVarName} (secret name only, value not logged)`);
    return;
  }

  const fullPayload = {
    ...payload,
    source: payload.source || 'hardonia-ops-agent',
    timestamp: payload.timestamp || new Date().toISOString(),
  };

  try {
    const response = await fetch(webhookUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(fullPayload),
    });

    if (!response.ok) {
      console.error(`[notify] Failed to send ${type} alert: ${response.status} ${response.statusText}`);
    } else {
      console.log(`[notify] ${type} alert sent successfully`);
    }
  } catch (error) {
    console.error(`[notify] Error sending ${type} alert:`, error instanceof Error ? error.message : 'Unknown error');
    // Never log the webhook URL or secret values
  }
}

/**
 * Check if webhook is configured (without exposing value)
 */
export function isWebhookConfigured(type: AlertType): boolean {
  const envVarName = WEBHOOK_ENV_MAP[type];
  return !!process.env[envVarName];
}

/**
 * Get configured webhook types (for reporting)
 */
export function getConfiguredWebhooks(): AlertType[] {
  return (Object.keys(WEBHOOK_ENV_MAP) as AlertType[]).filter((type) =>
    isWebhookConfigured(type)
  );
}
