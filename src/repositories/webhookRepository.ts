import { pool } from "../db/pool.js";

export async function createWebhook(userId: number, name: string, url: string, events: string[], options: any = {}) {
  const [result]: any = await pool.query(`
    INSERT INTO webhooks (user_id, name, url, method, headers, secret, events, is_active)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `, [
    userId,
    name,
    url,
    options.method || 'POST',
    JSON.stringify(options.headers || {}),
    options.secret || null,
    JSON.stringify(events),
    options.is_active !== undefined ? options.is_active : 1
  ]);
  return result.insertId;
}

export async function getUserWebhooks(userId: number) {
  const [rows]: any = await pool.query(`
    SELECT * FROM webhooks WHERE user_id = ? ORDER BY created_at DESC
  `, [userId]);
  
  return rows.map((row: any) => ({
    ...row,
    headers: row.headers ? JSON.parse(row.headers) : {},
    events: row.events ? JSON.parse(row.events) : []
  }));
}

export async function getWebhookById(webhookId: number) {
  const [rows]: any = await pool.query(`
    SELECT * FROM webhooks WHERE id = ? LIMIT 1
  `, [webhookId]);
  
  if (rows.length === 0) return null;
  
  const webhook = rows[0];
  return {
    ...webhook,
    headers: webhook.headers ? JSON.parse(webhook.headers) : {},
    events: webhook.events ? JSON.parse(webhook.events) : []
  };
}

export async function getActiveWebhooksForEvent(event: string) {
  const [rows]: any = await pool.query(`
    SELECT w.*, u.email as user_email, u.name as user_name
    FROM webhooks w
    JOIN users u ON w.user_id = u.id
    WHERE w.is_active = 1 
    AND JSON_CONTAINS(w.events, ?, '$')
    AND u.status = 'active'
  `, [`"${event}"`]);
  
  return rows.map((row: any) => ({
    ...row,
    headers: row.headers ? JSON.parse(row.headers) : {},
    events: row.events ? JSON.parse(row.events) : []
  }));
}

export async function updateWebhook(webhookId: number, updates: any) {
  const fields = [];
  const values = [];
  
  if (updates.name !== undefined) {
    fields.push('name = ?');
    values.push(updates.name);
  }
  if (updates.url !== undefined) {
    fields.push('url = ?');
    values.push(updates.url);
  }
  if (updates.method !== undefined) {
    fields.push('method = ?');
    values.push(updates.method);
  }
  if (updates.headers !== undefined) {
    fields.push('headers = ?');
    values.push(JSON.stringify(updates.headers));
  }
  if (updates.secret !== undefined) {
    fields.push('secret = ?');
    values.push(updates.secret);
  }
  if (updates.events !== undefined) {
    fields.push('events = ?');
    values.push(JSON.stringify(updates.events));
  }
  if (updates.is_active !== undefined) {
    fields.push('is_active = ?');
    values.push(updates.is_active);
  }

  if (fields.length === 0) return false;

  values.push(webhookId);
  await pool.query(`
    UPDATE webhooks SET ${fields.join(', ')} WHERE id = ?
  `, values);
  
  return true;
}

export async function updateWebhookStatus(webhookId: number, status: number, error: string | null = null) {
  await pool.query(`
    UPDATE webhooks 
    SET last_triggered_at = NOW(), last_status = ?, last_error = ?, retry_count = 0
    WHERE id = ?
  `, [status, error, webhookId]);
}

export async function incrementWebhookRetryCount(webhookId: number) {
  await pool.query(`
    UPDATE webhooks SET retry_count = retry_count + 1 WHERE id = ?
  `, [webhookId]);
}

export async function deleteWebhook(webhookId: number) {
  await pool.query('DELETE FROM webhooks WHERE id = ?', [webhookId]);
  return true;
}

export async function logWebhookCall(
  webhookId: number,
  event: string,
  payload: any,
  responseStatus: number | null,
  responseBody: string | null,
  errorMessage: string | null,
  durationMs: number
) {
  await pool.query(`
    INSERT INTO webhook_logs (webhook_id, event, payload, response_status, response_body, error_message, duration_ms)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `, [
    webhookId,
    event,
    JSON.stringify(payload),
    responseStatus,
    responseBody,
    errorMessage,
    durationMs
  ]);
}

export async function getWebhookLogs(webhookId: number, limit: number = 50) {
  const [rows]: any = await pool.query(`
    SELECT * FROM webhook_logs WHERE webhook_id = ? ORDER BY created_at DESC LIMIT ?
  `, [webhookId, limit]);
  
  return rows.map((row: any) => ({
    ...row,
    payload: row.payload ? JSON.parse(row.payload) : {}
  }));
}
