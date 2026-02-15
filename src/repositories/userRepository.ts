import { pool } from "../db/pool.js";
import bcrypt from 'bcrypt';

const SALT_ROUNDS = 10;

export async function createUser(email: string, name: string, plan: string = 'free') {
  const sql = "INSERT INTO users (email, name, subscription_plan, status) VALUES (?, ?, ?, 'active')";
  const [result]: any = await pool.query(sql, [email, name, plan]);
  return result.insertId;
}

export async function createUserWithPassword(email: string, name: string, password: string, plan: string = 'free') {
  const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);
  const sql = "INSERT INTO users (email, name, password_hash, subscription_plan, status) VALUES (?, ?, ?, ?, 'active')";
  const [result]: any = await pool.query(sql, [email, name, passwordHash, plan]);
  return result.insertId;
}

export async function validateUserPassword(email: string, password: string): Promise<any> {
  const user = await getUserByEmail(email);
  if (!user || !user.password_hash) return null;
  
  const isValid = await bcrypt.compare(password, user.password_hash);
  if (!isValid) return null;
  
  // No devolver el hash
  const { password_hash, ...userWithoutPassword } = user;
  return userWithoutPassword;
}

export async function updateUserPassword(userId: number, newPassword: string) {
  const passwordHash = await bcrypt.hash(newPassword, SALT_ROUNDS);
  const sql = "UPDATE users SET password_hash = ?, updated_at = NOW() WHERE id = ?";
  await pool.query(sql, [passwordHash, userId]);
  return true;
}

export async function updateLastLogin(userId: number) {
  const sql = "UPDATE users SET last_login_at = NOW() WHERE id = ?";
  await pool.query(sql, [userId]);
}

export async function getUserByEmail(email: string) {
  const sql = "SELECT * FROM users WHERE email = ? LIMIT 1";
  const [rows]: any = await pool.query(sql, [email]);
  return rows[0] || null;
}

export async function getUserById(userId: number) {
  const sql = "SELECT * FROM users WHERE id = ? LIMIT 1";
  const [rows]: any = await pool.query(sql, [userId]);
  return rows[0] || null;
}

export async function getAllUsers() {
  const sql = "SELECT id, email, name, status, subscription_plan, created_at FROM users ORDER BY created_at DESC";
  const [rows] = await pool.query(sql);
  return rows;
}

export async function updateUserPlan(userId: number, plan: string) {
  const sql = "UPDATE users SET subscription_plan = ?, updated_at = NOW() WHERE id = ?";
  await pool.query(sql, [plan, userId]);
}

export async function getUserStats(userId: number) {
  const sql = "SELECT (SELECT COUNT(*) FROM search_configs WHERE user_id = ?) as total_searches, (SELECT COUNT(*) FROM jobs WHERE user_id = ?) as total_jobs, (SELECT COUNT(*) FROM user_opportunities WHERE user_id = ?) as total_opportunities";
  const [stats]: any = await pool.query(sql, [userId, userId, userId]);
  return stats[0];
}
