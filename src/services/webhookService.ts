import * as crypto from 'crypto';
import { log } from '../utils/logger.js';
import { 
  getActiveWebhooksForEvent, 
  updateWebhookStatus, 
  incrementWebhookRetryCount,
  logWebhookCall 
} from '../repositories/webhookRepository.js';

export interface WebhookPayload {
  event: string;
  timestamp: string;
  user_id: number;
  data: any;
}

export async function triggerWebhooks(event: string, userId: number, data: any): Promise<void> {
  try {
    const webhooks = await getActiveWebhooksForEvent(event);
    
    if (webhooks.length === 0) {
      log(`📡 No hay webhooks activos para el evento: ${event}`);
      return;
    }

    log(`📡 Disparando ${webhooks.length} webhooks para evento: ${event}`);

    // Disparar webhooks en paralelo
    const promises = webhooks
      .filter(webhook => webhook.user_id === userId)
      .map(webhook => sendWebhook(webhook, event, userId, data));

    await Promise.allSettled(promises);

  } catch (error: any) {
    log(`❌ Error disparando webhooks: ${error.message}`);
  }
}

async function sendWebhook(webhook: any, event: string, userId: number, data: any): Promise<void> {
  const startTime = Date.now();
  
  try {
    const payload: WebhookPayload = {
      event,
      timestamp: new Date().toISOString(),
      user_id: userId,
      data
    };

    const headers: any = {
      'Content-Type': 'application/json',
      'User-Agent': 'MatchEngine-Webhook/1.0',
      'X-Webhook-Event': event,
      ...webhook.headers
    };

    // Añadir signature si hay secret
    if (webhook.secret) {
      const signature = generateSignature(JSON.stringify(payload), webhook.secret);
      headers['X-Webhook-Signature'] = signature;
    }

    const response = await fetch(webhook.url, {
      method: webhook.method || 'POST',
      headers,
      body: JSON.stringify(payload),
      signal: AbortSignal.timeout(10000) // 10 segundos timeout
    });

    const durationMs = Date.now() - startTime;
    const responseBody = await response.text().catch(() => null);

    // Log del webhook call
    await logWebhookCall(
      webhook.id,
      event,
      payload,
      response.status,
      responseBody,
      null,
      durationMs
    );

    if (response.ok) {
      await updateWebhookStatus(webhook.id, response.status, null);
      log(`✅ Webhook ${webhook.id} disparado exitosamente (${response.status})`);
    } else {
      await updateWebhookStatus(webhook.id, response.status, `HTTP ${response.status}`);
      log(`⚠️ Webhook ${webhook.id} respondió con error: ${response.status}`);
    }

  } catch (error: any) {
    const durationMs = Date.now() - startTime;
    
    await logWebhookCall(
      webhook.id,
      event,
      { event, user_id: userId, data },
      null,
      null,
      error.message,
      durationMs
    );

    await incrementWebhookRetryCount(webhook.id);
    await updateWebhookStatus(webhook.id, 0, error.message);
    
    log(`❌ Error enviando webhook ${webhook.id}: ${error.message}`);
  }
}

function generateSignature(payload: string, secret: string): string {
  return crypto
    .createHmac('sha256', secret)
    .update(payload)
    .digest('hex');
}

// Eventos disponibles
export const WEBHOOK_EVENTS = {
  OPPORTUNITY_CREATED: 'opportunity.created',
  OPPORTUNITY_UPDATED: 'opportunity.updated',
  OPPORTUNITY_DEADLINE_APPROACHING: 'opportunity.deadline_approaching',
  SEARCH_COMPLETED: 'search.completed',
  CLASSIFICATION_COMPLETED: 'classification.completed',
  EXTRACTION_COMPLETED: 'extraction.completed'
};
