import { pool } from "../db/pool.js";

export async function createSearchConfig(userId: number, name: string, queries: string[], filters: any = {}, maxResults: number = 10, intervalMinutes: number = 60) {
  const sql = "INSERT INTO search_configs (user_id, name, queries, filters, max_results, run_interval_minutes, is_active) VALUES (?, ?, ?, ?, ?, ?, 1)";
  const [result]: any = await pool.query(sql, [userId, name, JSON.stringify(queries), JSON.stringify(filters), maxResults, intervalMinutes]);
  return result.insertId;
}

export async function getUserSearchConfigs(userId: number) {
  const sql = "SELECT id, name, queries, filters, max_results, run_interval_minutes, is_active, last_run_at, created_at FROM search_configs WHERE user_id = ? ORDER BY created_at DESC";
  const [rows]: any = await pool.query(sql, [userId]);
  return rows.map((row: any) => ({
    ...row,
    queries: JSON.parse(row.queries),
    filters: row.filters ? JSON.parse(row.filters) : {}
  }));
}

export async function getSearchConfigById(configId: number) {
  const sql = "SELECT * FROM search_configs WHERE id = ? LIMIT 1";
  const [rows]: any = await pool.query(sql, [configId]);
  if (!rows[0]) return null;
  return {
    ...rows[0],
    queries: JSON.parse(rows[0].queries),
    filters: rows[0].filters ? JSON.parse(rows[0].filters) : {}
  };
}

export async function getActiveSearchConfigs() {
  const sql = "SELECT sc.*, u.email as user_email, u.subscription_plan FROM search_configs sc JOIN users u ON sc.user_id = u.id WHERE sc.is_active = 1 AND u.status = 'active' AND (sc.last_run_at IS NULL OR sc.last_run_at < DATE_SUB(NOW(), INTERVAL sc.run_interval_minutes MINUTE)) ORDER BY sc.last_run_at ASC LIMIT 10";
  const [rows]: any = await pool.query(sql);
  return rows.map((row: any) => ({
    ...row,
    queries: JSON.parse(row.queries),
    filters: row.filters ? JSON.parse(row.filters) : {}
  }));
}

export async function updateLastRun(configId: number) {
  const sql = "UPDATE search_configs SET last_run_at = NOW() WHERE id = ?";
  await pool.query(sql, [configId]);
}

export async function toggleSearchConfig(configId: number, isActive: boolean) {
  const sql = "UPDATE search_configs SET is_active = ? WHERE id = ?";
  await pool.query(sql, [isActive ? 1 : 0, configId]);
}

export async function updateSearchConfig(configId: number, updates: any) {
  const fields: string[] = [];
  const values: any[] = [];
  if (updates.name) { fields.push('name = ?'); values.push(updates.name); }
  if (updates.queries) { fields.push('queries = ?'); values.push(JSON.stringify(updates.queries)); }
  if (updates.filters) { fields.push('filters = ?'); values.push(JSON.stringify(updates.filters)); }
  if (updates.maxResults) { fields.push('max_results = ?'); values.push(updates.maxResults); }
  if (updates.intervalMinutes) { fields.push('run_interval_minutes = ?'); values.push(updates.intervalMinutes); }
  if (fields.length === 0) return;
  values.push(configId);
  const sql = "UPDATE search_configs SET " + fields.join(', ') + ", updated_at = NOW() WHERE id = ?";
  await pool.query(sql, values);
}

export async function deleteSearchConfig(configId: number) {
  const sql = "DELETE FROM search_configs WHERE id = ?";
  await pool.query(sql, [configId]);
}
