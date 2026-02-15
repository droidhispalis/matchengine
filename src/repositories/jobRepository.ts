import crypto from "crypto";
import { pool } from "../db/pool.js";

function normalizeUrl(url: string) {
  try {
    const u = new URL(url);
    u.search = "";
    return u.toString();
  } catch {
    return url;
  }
}

export async function insertJob(job: any, userId?: number, searchConfigId?: number): Promise<boolean> {
  const cleanUrl = normalizeUrl(job.url);
  const urlHash = crypto.createHash("sha256").update(cleanUrl).digest("hex");
  const sql = "INSERT INTO jobs (user_id, search_config_id, url, url_hash, title, snippet, source, status) VALUES (?, ?, ?, ?, ?, ?, ?, 'pending') ON DUPLICATE KEY UPDATE id=id";
  const [result]: any = await pool.query(sql, [userId || null, searchConfigId || null, cleanUrl, urlHash, job.title || "", job.snippet || job.content || "", job.source || "tavily"]);
  if (result.affectedRows === 1) {
    console.log("🆕 INSERTADA:", cleanUrl);
    return true;
  }
  console.log("⚠️ DUPLICADA:", cleanUrl);
  return false;
}

export async function getUnclassifiedJobs(limit: number = 20, userId?: number, searchConfigId?: number) {
  let sql = "SELECT * FROM jobs WHERE status = 'pending'";
  const params: any[] = [];
  if (userId) { sql += " AND user_id = ?"; params.push(userId); }
  if (searchConfigId) { sql += " AND search_config_id = ?"; params.push(searchConfigId); }
  sql += " ORDER BY created_at ASC LIMIT ?";
  params.push(limit);
  const [rows] = await pool.query(sql, params);
  return rows as any[];
}

export async function markJobClassified(id: number, relevant: boolean) {
  const status = relevant ? 'classified' : 'discarded';
  const sql = "UPDATE jobs SET is_relevant = ?, status = ?, classified_at = NOW() WHERE id = ?";
  await pool.query(sql, [relevant ? 1 : 0, status, id]);
}

export async function getJobsToExtract(limit: number = 10, userId?: number, searchConfigId?: number) {
  let sql = "SELECT * FROM jobs WHERE status = 'classified' AND is_relevant = 1";
  const params: any[] = [];
  if (userId) { sql += " AND user_id = ?"; params.push(userId); }
  if (searchConfigId) { sql += " AND search_config_id = ?"; params.push(searchConfigId); }
  sql += " ORDER BY created_at ASC LIMIT ?";
  params.push(limit);
  const [rows] = await pool.query(sql, params);
  return rows as any[];
}

export async function markJobExtracted(jobId: number, success: boolean = true) {
  const status = success ? 'extracted' : 'extraction_failed';
  const sql = "UPDATE jobs SET status = ?, extracted_at = NOW() WHERE id = ?";
  await pool.query(sql, [status, jobId]);
}

export async function getJobStats() {
  const sql = "SELECT status, COUNT(*) as count FROM jobs GROUP BY status";
  const [rows]: any = await pool.query(sql);
  return rows;
}
