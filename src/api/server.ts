import "dotenv/config";
import express, { Request, Response } from "express";
import cors from "cors";
import path from "path";
import { fileURLToPath } from "url";
import cookieParser from "cookie-parser";
import { createUser, getUserByEmail, getAllUsers, getUserStats, createUserWithPassword, validateUserPassword, updateLastLogin } from "../repositories/userRepository.js";
import { 
  createSearchConfig, 
  getUserSearchConfigs, 
  getSearchConfigById,
  toggleSearchConfig,
  updateSearchConfig 
} from "../repositories/searchConfigRepository.js";
import { getJobStats } from "../repositories/jobRepository.js";
import { getAllOpportunities, getOpportunityStats, getFilteredOpportunities } from "../repositories/opportunityRepository.js";
import { 
  createNotificationSettings, 
  getNotificationSettings, 
  updateNotificationSettings 
} from "../repositories/notificationRepository.js";
import { generateToken, authMiddleware, optionalAuthMiddleware } from "../middleware/auth.js";
import { pool } from "../db/pool.js";
import { generateCSV, generateExcel } from "../services/exportService.js";
import { 
  createWebhook, 
  getUserWebhooks, 
  getWebhookById, 
  updateWebhook, 
  deleteWebhook,
  getWebhookLogs 
} from "../repositories/webhookRepository.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = 3100; // Puerto fijo para evitar conflictos

app.use(cors({
  origin: true,
  credentials: true
}));
app.use(express.json());
app.use(cookieParser());

// Servir archivos estáticos (dashboard)
app.use(express.static(path.join(__dirname, '../../public')));

// ============================================
// HEALTH CHECK
// ============================================
app.get("/", (req, res) => {
  res.json({
    service: "MatchEngine API",
    version: "1.0.0",
    status: "running"
  });
});

// ============================================
// AUTH
// ============================================

// Registro
app.post("/api/auth/register", async (req, res) => {
  try {
    const { email, name, password, plan } = req.body;

    if (!email || !name || !password) {
      return res.status(400).json({ error: "Email, nombre y contraseña son requeridos" });
    }

    if (password.length < 6) {
      return res.status(400).json({ error: "La contraseña debe tener al menos 6 caracteres" });
    }

    // Verificar si existe
    const existing = await getUserByEmail(email);
    if (existing) {
      return res.status(409).json({ error: "El email ya está registrado" });
    }

    const userId = await createUserWithPassword(email, name, password, plan || 'free');
    const user = await getUserByEmail(email);
    const token = generateToken(user);

    res.status(201).json({ 
      token,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        subscription_plan: user.subscription_plan
      }
    });

  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Login
app.post("/api/auth/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: "Email y contraseña son requeridos" });
    }

    const user = await validateUserPassword(email, password);
    if (!user) {
      return res.status(401).json({ error: "Credenciales inválidas" });
    }

    // Actualizar último login
    await updateLastLogin(user.id);

    const token = generateToken(user);

    // Enviar token en cookie también
    res.cookie('token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60 * 1000 // 7 días
    });

    res.json({ 
      token,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        subscription_plan: user.subscription_plan
      }
    });

  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Obtener usuario actual (me)
app.get("/api/auth/me", authMiddleware, async (req: Request, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: "No autenticado" });
    }

    const user = await getUserByEmail(req.user.email);
    if (!user) {
      return res.status(404).json({ error: "Usuario no encontrado" });
    }

    const { password_hash, ...userWithoutPassword } = user;
    res.json(userWithoutPassword);

  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Logout
app.post("/api/auth/logout", (req, res) => {
  res.clearCookie('token');
  res.json({ success: true });
});

// ============================================
// USERS
// ============================================

// Crear usuario
app.post("/api/users", async (req, res) => {
  try {
    const { email, name, plan } = req.body;

    if (!email || !name) {
      return res.status(400).json({ error: "Email y name son requeridos" });
    }

    // Verificar si existe
    const existing = await getUserByEmail(email);
    if (existing) {
      return res.status(409).json({ error: "Usuario ya existe" });
    }

    const userId = await createUser(email, name, plan || 'free');
    res.status(201).json({ userId, email, name });

  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Obtener usuario por email
app.get("/api/users/:email", async (req, res) => {
  try {
    const user = await getUserByEmail(req.params.email);
    if (!user) {
      return res.status(404).json({ error: "Usuario no encontrado" });
    }
    res.json(user);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Listar todos los usuarios
app.get("/api/users", async (req, res) => {
  try {
    const users = await getAllUsers();
    res.json(users);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Stats de usuario
app.get("/api/users/:userId/stats", async (req, res) => {
  try {
    const stats = await getUserStats(parseInt(req.params.userId));
    res.json(stats);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// ============================================
// SEARCH CONFIGS
// ============================================

// Crear configuración de búsqueda
app.post("/api/users/:userId/searches", async (req, res) => {
  try {
    const { name, queries, filters, maxResults, intervalMinutes } = req.body;
    const userId = parseInt(req.params.userId);

    if (!name || !queries || !Array.isArray(queries)) {
      return res.status(400).json({ error: "Name y queries (array) son requeridos" });
    }

    const configId = await createSearchConfig(
      userId,
      name,
      queries,
      filters || {},
      maxResults || 10,
      intervalMinutes || 60
    );

    res.status(201).json({ configId, userId, name });

  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Obtener configuraciones de un usuario
app.get("/api/users/:userId/searches", async (req, res) => {
  try {
    const userId = parseInt(req.params.userId);
    const configs = await getUserSearchConfigs(userId);
    res.json(configs);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Obtener configuración específica
app.get("/api/searches/:configId", async (req, res) => {
  try {
    const config = await getSearchConfigById(parseInt(req.params.configId));
    if (!config) {
      return res.status(404).json({ error: "Configuración no encontrada" });
    }
    res.json(config);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Activar/Desactivar configuración
app.patch("/api/searches/:configId/toggle", async (req, res) => {
  try {
    const { isActive } = req.body;
    await toggleSearchConfig(parseInt(req.params.configId), isActive);
    res.json({ success: true, isActive });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Actualizar configuración
app.patch("/api/searches/:configId", async (req, res) => {
  try {
    const configId = parseInt(req.params.configId);
    await updateSearchConfig(configId, req.body);
    res.json({ success: true });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// ============================================
// OPPORTUNITIES
// ============================================

// Obtener opportunities de un usuario (con filtros)
app.get("/api/users/:userId/opportunities", async (req, res) => {
  try {
    const userId = parseInt(req.params.userId);
    const limit = parseInt(req.query.limit as string) || 100;
    
    // Extraer filtros de query params
    const filters: any = {};
    if (req.query.autonomous_region) filters.autonomous_region = req.query.autonomous_region;
    if (req.query.disability_quota) filters.disability_quota = req.query.disability_quota;
    if (req.query.access_type) filters.access_type = req.query.access_type;
    if (req.query.organism) filters.organism = req.query.organism;
    if (req.query.search) filters.search = req.query.search;
    if (req.query.deadline_from) filters.deadline_from = req.query.deadline_from;
    if (req.query.deadline_to) filters.deadline_to = req.query.deadline_to;
    if (req.query.min_score) filters.min_score = req.query.min_score;
    if (req.query.order_by) filters.order_by = req.query.order_by;
    if (req.query.order_dir) filters.order_dir = req.query.order_dir;

    // Si hay filtros, usar getFilteredOpportunities, sino getAllOpportunities
    const opportunities = Object.keys(filters).length > 0
      ? await getFilteredOpportunities(filters, limit)
      : await getAllOpportunities(limit);

    res.json(opportunities);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Obtener valores únicos para filtros
app.get("/api/opportunities/filter-options", async (req, res) => {
  try {
    const [regions]: any = await pool.query(`
      SELECT DISTINCT autonomous_region 
      FROM opportunities 
      WHERE autonomous_region IS NOT NULL 
      ORDER BY autonomous_region
    `);
    
    const [organisms]: any = await pool.query(`
      SELECT DISTINCT organism 
      FROM opportunities 
      WHERE organism IS NOT NULL 
      ORDER BY organism 
      LIMIT 50
    `);

    const [accessTypes]: any = await pool.query(`
      SELECT DISTINCT access_type 
      FROM opportunities 
      WHERE access_type IS NOT NULL 
      ORDER BY access_type
    `);

    res.json({
      regions: regions.map((r: any) => r.autonomous_region),
      organisms: organisms.map((o: any) => o.organism),
      access_types: accessTypes.map((a: any) => a.access_type)
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// ============================================
// NOTIFICATIONS
// ============================================

// Obtener configuración de notificaciones
app.get("/api/users/:userId/notifications", async (req, res) => {
  try {
    const userId = parseInt(req.params.userId);
    const settings = await getNotificationSettings(userId);
    
    if (!settings) {
      return res.json({
        user_id: userId,
        email_enabled: false,
        telegram_enabled: false,
        notify_on_new_opportunity: true,
        notify_on_deadline_approaching: false,
        deadline_days_before: 7
      });
    }
    
    res.json(settings);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Crear o actualizar configuración de notificaciones
app.put("/api/users/:userId/notifications", async (req, res) => {
  try {
    const userId = parseInt(req.params.userId);
    const settings = req.body;

    // Verificar si existe
    const existing = await getNotificationSettings(userId);
    
    if (existing) {
      await updateNotificationSettings(userId, settings);
    } else {
      await createNotificationSettings(userId, settings);
    }

    res.json({ success: true, userId });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Actualizar configuración de notificaciones (parcial)
app.patch("/api/users/:userId/notifications", async (req, res) => {
  try {
    const userId = parseInt(req.params.userId);
    await updateNotificationSettings(userId, req.body);
    res.json({ success: true });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// ============================================
// STATS GLOBALES
// ============================================

app.get("/api/stats", async (req, res) => {
  try {
    const jobStats = await getJobStats();
    const oppStats = await getOpportunityStats();

    res.json({
      jobs: jobStats,
      opportunities: oppStats
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// ============================================
// TRIGGER WORKERS (manual)
// ============================================

app.post("/api/workers/run/:worker", async (req, res) => {
  try {
    const { worker } = req.params;
    const { userId, searchConfigId } = req.body;

    // TODO: implementar ejecución de workers
    res.json({
      message: `Worker ${worker} encolado`,
      userId,
      searchConfigId
    });

  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// ============================================
// WEBHOOKS
// ============================================

// Crear webhook
app.post("/api/users/:userId/webhooks", authMiddleware, async (req: Request, res) => {
  try {
    const userId = parseInt(req.params.userId);
    const { name, url, events, method, headers, secret, is_active } = req.body;

    if (!name || !url || !events || !Array.isArray(events)) {
      return res.status(400).json({ error: "Name, url y events (array) son requeridos" });
    }

    const webhookId = await createWebhook(userId, name, url, events, {
      method,
      headers,
      secret,
      is_active
    });

    res.status(201).json({ webhookId, userId, name });

  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Obtener webhooks de un usuario
app.get("/api/users/:userId/webhooks", authMiddleware, async (req: Request, res) => {
  try {
    const userId = parseInt(req.params.userId);
    const webhooks = await getUserWebhooks(userId);
    res.json(webhooks);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Obtener webhook específico
app.get("/api/webhooks/:webhookId", authMiddleware, async (req: Request, res) => {
  try {
    const webhookId = parseInt(req.params.webhookId);
    const webhook = await getWebhookById(webhookId);
    
    if (!webhook) {
      return res.status(404).json({ error: "Webhook no encontrado" });
    }
    
    res.json(webhook);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Actualizar webhook
app.patch("/api/webhooks/:webhookId", authMiddleware, async (req: Request, res) => {
  try {
    const webhookId = parseInt(req.params.webhookId);
    await updateWebhook(webhookId, req.body);
    res.json({ success: true });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Eliminar webhook
app.delete("/api/webhooks/:webhookId", authMiddleware, async (req: Request, res) => {
  try {
    const webhookId = parseInt(req.params.webhookId);
    await deleteWebhook(webhookId);
    res.json({ success: true });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Obtener logs de webhook
app.get("/api/webhooks/:webhookId/logs", authMiddleware, async (req: Request, res) => {
  try {
    const webhookId = parseInt(req.params.webhookId);
    const limit = parseInt(req.query.limit as string) || 50;
    const logs = await getWebhookLogs(webhookId, limit);
    res.json(logs);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Listar eventos disponibles
app.get("/api/webhooks/events", (req, res) => {
  res.json({
    events: [
      { name: 'opportunity.created', description: 'Se crea una nueva oportunidad' },
      { name: 'opportunity.updated', description: 'Se actualiza una oportunidad' },
      { name: 'opportunity.deadline_approaching', description: 'Se acerca el plazo de una oportunidad' },
      { name: 'search.completed', description: 'Se completa una búsqueda' },
      { name: 'classification.completed', description: 'Se completa la clasificación' },
      { name: 'extraction.completed', description: 'Se completa la extracción' }
    ]
  });
});

// ============================================
// EXPORT
// ============================================

// Exportar oportunidades a CSV
app.get("/api/users/:userId/opportunities/export/csv", authMiddleware, async (req: Request, res) => {
  try {
    const userId = parseInt(req.params.userId);
    
    // Extraer filtros (igual que en el endpoint de oportunidades)
    const filters: any = {};
    if (req.query.autonomous_region) filters.autonomous_region = req.query.autonomous_region;
    if (req.query.disability_quota) filters.disability_quota = req.query.disability_quota;
    if (req.query.access_type) filters.access_type = req.query.access_type;
    if (req.query.organism) filters.organism = req.query.organism;
    if (req.query.search) filters.search = req.query.search;
    if (req.query.deadline_from) filters.deadline_from = req.query.deadline_from;
    if (req.query.deadline_to) filters.deadline_to = req.query.deadline_to;
    if (req.query.min_score) filters.min_score = req.query.min_score;
    
    const opportunities: any = Object.keys(filters).length > 0
      ? await getFilteredOpportunities(filters, 10000)
      : await getAllOpportunities(10000);

    const csv = generateCSV(opportunities);
    
    const filename = `oportunidades_${new Date().toISOString().split('T')[0]}.csv`;
    
    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.send('\uFEFF' + csv); // BOM para UTF-8

  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Exportar oportunidades a Excel
app.get("/api/users/:userId/opportunities/export/excel", authMiddleware, async (req: Request, res) => {
  try {
    const userId = parseInt(req.params.userId);
    
    // Extraer filtros
    const filters: any = {};
    if (req.query.autonomous_region) filters.autonomous_region = req.query.autonomous_region;
    if (req.query.disability_quota) filters.disability_quota = req.query.disability_quota;
    if (req.query.access_type) filters.access_type = req.query.access_type;
    if (req.query.organism) filters.organism = req.query.organism;
    if (req.query.search) filters.search = req.query.search;
    if (req.query.deadline_from) filters.deadline_from = req.query.deadline_from;
    if (req.query.deadline_to) filters.deadline_to = req.query.deadline_to;
    if (req.query.min_score) filters.min_score = req.query.min_score;
    
    const opportunities: any = Object.keys(filters).length > 0
      ? await getFilteredOpportunities(filters, 10000)
      : await getAllOpportunities(10000);

    const excelBuffer = generateExcel(opportunities);
    
    const filename = `oportunidades_${new Date().toISOString().split('T')[0]}.xlsx`;
    
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.send(excelBuffer);

  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// ============================================
// START SERVER
// ============================================

app.listen(PORT, () => {
  console.log(`🚀 MatchEngine API running on http://localhost:${PORT}`);
  console.log(`📊 Health check: http://localhost:${PORT}/`);
  console.log(`📖 API Docs: http://localhost:${PORT}/api`);
});

export default app;
