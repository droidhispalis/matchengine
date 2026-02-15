import { pool } from "../db/pool.js";

export async function insertOpportunity(jobId: number, extractedData: any) {
  if (!extractedData || !jobId) {
    throw new Error("insertOpportunity: Faltan datos requeridos");
  }

  const sql = "INSERT INTO opportunities (job_id, title, organism, specialty, position_type, access_type, disability_quota, disability_percentage, education_level, application_deadline, exam_date, syllabus_url, province, autonomous_region, ai_score) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?) ON DUPLICATE KEY UPDATE title = VALUES(title), organism = VALUES(organism), specialty = VALUES(specialty)";

  const [result]: any = await pool.query(sql, [
    jobId,
    extractedData.title || null,
    extractedData.organism || null,
    extractedData.specialty || null,
    extractedData.position_type || null,
    extractedData.access_type || null,
    extractedData.disability_quota ? 1 : 0,
    extractedData.disability_percentage || null,
    extractedData.education_level || null,
    extractedData.application_deadline || null,
    extractedData.exam_date || null,
    extractedData.syllabus_url || null,
    extractedData.province || null,
    extractedData.autonomous_region || null,
    extractedData.ai_score || 50
  ]);

  console.log("💾 Opportunity guardada para job_id=" + jobId);
  return result.insertId;
}

export async function getAllOpportunities(limit: number = 100) {
  const sql = "SELECT o.*, j.url as source_url, j.title as original_title FROM opportunities o JOIN jobs j ON o.job_id = j.id ORDER BY o.created_at DESC LIMIT ?";
  const [rows] = await pool.query(sql, [limit]);
  return rows;
}

export async function getFilteredOpportunities(filters: any = {}, limit: number = 100) {
  let sql = `
    SELECT o.*, j.url as source_url, j.title as original_title 
    FROM opportunities o 
    JOIN jobs j ON o.job_id = j.id 
    WHERE 1=1
  `;
  const params: any[] = [];

  // Filtro: Región autónoma
  if (filters.autonomous_region && filters.autonomous_region !== 'all') {
    sql += ` AND o.autonomous_region = ?`;
    params.push(filters.autonomous_region);
  }

  // Filtro: Cupo discapacidad
  if (filters.disability_quota !== undefined && filters.disability_quota !== 'all') {
    sql += ` AND o.disability_quota = ?`;
    params.push(filters.disability_quota === 'yes' || filters.disability_quota === '1' ? 1 : 0);
  }

  // Filtro: Tipo de acceso
  if (filters.access_type && filters.access_type !== 'all') {
    sql += ` AND o.access_type = ?`;
    params.push(filters.access_type);
  }

  // Filtro: Organismo (búsqueda parcial)
  if (filters.organism) {
    sql += ` AND o.organism LIKE ?`;
    params.push(`%${filters.organism}%`);
  }

  // Filtro: Búsqueda en título
  if (filters.search) {
    sql += ` AND (o.title LIKE ? OR o.specialty LIKE ?)`;
    params.push(`%${filters.search}%`, `%${filters.search}%`);
  }

  // Filtro: Fecha límite desde
  if (filters.deadline_from) {
    sql += ` AND o.application_deadline >= ?`;
    params.push(filters.deadline_from);
  }

  // Filtro: Fecha límite hasta
  if (filters.deadline_to) {
    sql += ` AND o.application_deadline <= ?`;
    params.push(filters.deadline_to);
  }

  // Filtro: Score mínimo IA
  if (filters.min_score) {
    sql += ` AND o.ai_score >= ?`;
    params.push(parseInt(filters.min_score));
  }

  // Orden
  const orderBy = filters.order_by || 'created_at';
  const orderDir = filters.order_dir === 'asc' ? 'ASC' : 'DESC';
  sql += ` ORDER BY o.${orderBy} ${orderDir}`;

  // Límite
  sql += ` LIMIT ?`;
  params.push(limit);

  const [rows] = await pool.query(sql, params);
  return rows;
}

export async function getOpportunityStats() {
  const sql = "SELECT COUNT(*) as total, SUM(disability_quota) as with_disability_quota, COUNT(DISTINCT autonomous_region) as regions FROM opportunities";
  const [rows]: any = await pool.query(sql);
  return rows[0];
}
