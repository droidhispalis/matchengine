#!/bin/bash
# Ejecutar este script en el servidor

cd /var/www/vhosts/tumanitasia.es/ia.tumanitasia.es

echo "📝 Creando userRepository.ts..."
cat > src/repositories/userRepository.ts << 'EOF'
import { pool } from "../db/pool.js";

export async function createUser(email: string, name: string, plan: string = 'free') {
  const [result]: any = await pool.query(`
    INSERT INTO users (email, name, subscription_plan, status)
    VALUES (?, ?, ?, 'active')
  `, [email, name, plan]);
  return result.insertId;
}

export async function getUserByEmail(email: string) {
  const [rows]: any = await pool.query(`
    SELECT * FROM users WHERE email = ? LIMIT 1
  `, [email]);
  return rows[0] || null;
}

export async function getUserById(userId: number) {
  const [rows]: any = await pool.query(`
    SELECT * FROM users WHERE id = ? LIMIT 1
  `, [userId]);
  return rows[0] || null;
}

export async function getAllUsers() {
  const [rows] = await pool.query(`
    SELECT id, email, name, status, subscription_plan, created_at
    FROM users ORDER BY created_at DESC
  `);
  return rows;
}

export async function updateUserPlan(userId: number, plan: string) {
  await pool.query(`
    UPDATE users SET subscription_plan = ?, updated_at = NOW()
    WHERE id = ?
  `, [plan, userId]);
}

export async function getUserStats(userId: number) {
  const [stats]: any = await pool.query(`
    SELECT 
      (SELECT COUNT(*) FROM search_configs WHERE user_id = ?) as total_searches,
      (SELECT COUNT(*) FROM jobs WHERE user_id = ?) as total_jobs,
      (SELECT COUNT(*) FROM user_opportunities WHERE user_id = ?) as total_opportunities
  `, [userId, userId, userId]);
  return stats[0];
}
EOF

echo "📝 Creando searchConfigRepository.ts..."
cat > src/repositories/searchConfigRepository.ts << 'EOF'
import { pool } from "../db/pool.js";

export async function createSearchConfig(
  userId: number, name: string, queries: string[],
  filters: any = {}, maxResults: number = 10, intervalMinutes: number = 60
) {
  const [result]: any = await pool.query(`
    INSERT INTO search_configs 
    (user_id, name, queries, filters, max_results, run_interval_minutes, is_active)
    VALUES (?, ?, ?, ?, ?, ?, 1)
  `, [userId, name, JSON.stringify(queries), JSON.stringify(filters), maxResults, intervalMinutes]);
  return result.insertId;
}

export async function getUserSearchConfigs(userId: number) {
  const [rows]: any = await pool.query(`
    SELECT id, name, queries, filters, max_results, run_interval_minutes,
           is_active, last_run_at, created_at
    FROM search_configs WHERE user_id = ? ORDER BY created_at DESC
  `, [userId]);
  return rows.map((row: any) => ({
    ...row,
    queries: JSON.parse(row.queries),
    filters: row.filters ? JSON.parse(row.filters) : {}
  }));
}

export async function getSearchConfigById(configId: number) {
  const [rows]: any = await pool.query(`
    SELECT * FROM search_configs WHERE id = ? LIMIT 1
  `, [configId]);
  if (!rows[0]) return null;
  return {
    ...rows[0],
    queries: JSON.parse(rows[0].queries),
    filters: rows[0].filters ? JSON.parse(rows[0].filters) : {}
  };
}

export async function getActiveSearchConfigs() {
  const [rows]: any = await pool.query(`
    SELECT sc.*, u.email as user_email, u.subscription_plan
    FROM search_configs sc
    JOIN users u ON sc.user_id = u.id
    WHERE sc.is_active = 1 AND u.status = 'active'
      AND (sc.last_run_at IS NULL 
           OR sc.last_run_at < DATE_SUB(NOW(), INTERVAL sc.run_interval_minutes MINUTE))
    ORDER BY sc.last_run_at ASC LIMIT 10
  `);
  return rows.map((row: any) => ({
    ...row,
    queries: JSON.parse(row.queries),
    filters: row.filters ? JSON.parse(row.filters) : {}
  }));
}

export async function updateLastRun(configId: number) {
  await pool.query(`UPDATE search_configs SET last_run_at = NOW() WHERE id = ?`, [configId]);
}

export async function toggleSearchConfig(configId: number, isActive: boolean) {
  await pool.query(`UPDATE search_configs SET is_active = ? WHERE id = ?`, [isActive ? 1 : 0, configId]);
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
  await pool.query(`UPDATE search_configs SET ${fields.join(', ')}, updated_at = NOW() WHERE id = ?`, values);
}

export async function deleteSearchConfig(configId: number) {
  await pool.query(`DELETE FROM search_configs WHERE id = ?`, [configId]);
}
EOF

echo "✅ Repositories creados"
echo "📦 Instalando dependencias..."
pnpm install

echo "✅ Listo para ejecutar: pnpm api"
