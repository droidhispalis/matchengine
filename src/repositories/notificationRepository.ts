import { pool } from "../db/pool.js";

export async function createNotificationSettings(userId: number, settings: any = {}) {
  const [result]: any = await pool.query(`
    INSERT INTO notification_settings (user_id, email_enabled, email_address, telegram_enabled, telegram_chat_id, 
                                       notify_on_new_opportunity, notify_on_deadline_approaching, deadline_days_before)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    ON DUPLICATE KEY UPDATE 
      email_enabled=VALUES(email_enabled), 
      email_address=VALUES(email_address),
      telegram_enabled=VALUES(telegram_enabled),
      telegram_chat_id=VALUES(telegram_chat_id),
      notify_on_new_opportunity=VALUES(notify_on_new_opportunity),
      notify_on_deadline_approaching=VALUES(notify_on_deadline_approaching),
      deadline_days_before=VALUES(deadline_days_before)
  `, [
    userId,
    settings.email_enabled || 0,
    settings.email_address || null,
    settings.telegram_enabled || 0,
    settings.telegram_chat_id || null,
    settings.notify_on_new_opportunity !== undefined ? settings.notify_on_new_opportunity : 1,
    settings.notify_on_deadline_approaching || 0,
    settings.deadline_days_before || 7
  ]);
  return result.insertId;
}

export async function getNotificationSettings(userId: number) {
  const [rows]: any = await pool.query(`
    SELECT * FROM notification_settings WHERE user_id = ? LIMIT 1
  `, [userId]);
  return rows[0];
}

export async function getAllEnabledEmailNotifications() {
  const [rows]: any = await pool.query(`
    SELECT ns.*, u.email as user_email, u.name as user_name
    FROM notification_settings ns
    JOIN users u ON ns.user_id = u.id
    WHERE ns.email_enabled = 1 AND ns.email_address IS NOT NULL AND u.status = 'active'
  `);
  return rows;
}

export async function getAllEnabledTelegramNotifications() {
  const [rows]: any = await pool.query(`
    SELECT ns.*, u.email as user_email, u.name as user_name
    FROM notification_settings ns
    JOIN users u ON ns.user_id = u.id
    WHERE ns.telegram_enabled = 1 AND ns.telegram_chat_id IS NOT NULL AND u.status = 'active'
  `);
  return rows;
}

export async function updateNotificationSettings(userId: number, updates: any) {
  const fields = [];
  const values = [];
  
  if (updates.email_enabled !== undefined) {
    fields.push('email_enabled = ?');
    values.push(updates.email_enabled);
  }
  if (updates.email_address !== undefined) {
    fields.push('email_address = ?');
    values.push(updates.email_address);
  }
  if (updates.telegram_enabled !== undefined) {
    fields.push('telegram_enabled = ?');
    values.push(updates.telegram_enabled);
  }
  if (updates.telegram_chat_id !== undefined) {
    fields.push('telegram_chat_id = ?');
    values.push(updates.telegram_chat_id);
  }
  if (updates.notify_on_new_opportunity !== undefined) {
    fields.push('notify_on_new_opportunity = ?');
    values.push(updates.notify_on_new_opportunity);
  }
  if (updates.notify_on_deadline_approaching !== undefined) {
    fields.push('notify_on_deadline_approaching = ?');
    values.push(updates.notify_on_deadline_approaching);
  }
  if (updates.deadline_days_before !== undefined) {
    fields.push('deadline_days_before = ?');
    values.push(updates.deadline_days_before);
  }

  if (fields.length === 0) return false;

  values.push(userId);
  await pool.query(`
    UPDATE notification_settings SET ${fields.join(', ')} WHERE user_id = ?
  `, values);
  
  return true;
}

export async function deleteNotificationSettings(userId: number) {
  await pool.query('DELETE FROM notification_settings WHERE user_id = ?', [userId]);
  return true;
}
