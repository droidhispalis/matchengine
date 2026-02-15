# 🎯 MatchEngine

> Sistema automatizado multi-tenant para búsqueda, clasificación y notificación de oposiciones españolas con cupo de discapacidad

[![TypeScript](https://img.shields.io/badge/TypeScript-5.9-blue)](https://www.typescriptlang.org/)
[![Node.js](https://img.shields.io/badge/Node.js-25+-green)](https://nodejs.org/)
[![License](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)

## 📋 Características

- 🔍 **Búsqueda Automatizada** - Utiliza Tavily API para buscar convocatorias
- 🤖 **Clasificación IA** - GPT-4.1-mini clasifica oportunidades relevantes
- 📊 **Extracción Estructurada** - Extrae datos clave (fechas, organismos, cupos)
- 📧 **Notificaciones** - Email (SMTP) y Telegram en tiempo real
- 🔐 **Autenticación JWT** - Sistema seguro con bcrypt
- 🎨 **Dashboard Web** - Interfaz responsive con filtros avanzados
- 📤 **Exportación** - CSV y Excel con filtros activos
- 🔗 **Webhooks** - Integración con sistemas externos (HMAC seguro)

## 🏗️ Arquitectura

```
┌─────────────────────────────────────────┐
│           ORCHESTRATOR                  │
│        (Cada 5 minutos)                 │
└─────────────────────────────────────────┘
              │
    ┌─────────┼─────────┐
    ▼         ▼         ▼
[Search] [Classify] [Extract]
    │         │         │
    └─────────┴─────────┘
              ▼
       [Notify & Webhooks]
```

### Pipeline de 4 Etapas

1. **Search** - Busca en web con Tavily → inserta en `jobs` table
2. **Classify** - GPT clasifica relevancia (SI/NO) → marca `is_relevant`
3. **Extract** - GPT extrae datos estructurados → tabla `opportunities`
4. **Notify** - Envía notificaciones email/Telegram + trigger webhooks

## 🚀 Inicio Rápido

### Prerrequisitos

- Node.js 25+
- pnpm
- MySQL 8+
- Cuentas API: OpenAI, Tavily

### Instalación

```bash
# Clonar repositorio
git clone https://github.com/droidhispalis/matchengine.git
cd matchengine

# Instalar dependencias
pnpm install

# Configurar base de datos
mysql -u root -p < database/schema.sql
mysql -u root -p < database/migration_notifications.sql
mysql -u root -p < database/migration_auth.sql
mysql -u root -p < database/migration_webhooks.sql

# Configurar variables de entorno
cp .env.example .env
# Editar .env con tus credenciales
```

### Configuración (.env)

```env
# OpenAI
OPENAI_API_KEY=sk-...

# Tavily Search
TAVILY_API_KEY=tvly-...

# Database
DB_HOST=localhost
DB_USER=matchengine_user
DB_PASS=tu_password
DB_NAME=matchengine

# JWT
JWT_SECRET=tu-secreto-super-seguro

# Email (SMTP)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=tu@email.com
SMTP_PASS=tu_password
EMAIL_FROM="MatchEngine <noreply@tudominio.com>"

# Telegram
TELEGRAM_BOT_TOKEN=tu_bot_token
```

### Ejecución

```bash
# Desarrollo - API Server
pnpm dev

# Producción con PM2
pm2 start src/api/server.ts --name matchengine-api --interpreter tsx
pm2 start src/workers/orchestrator.ts --name matchengine-orchestrator --interpreter tsx

# Workers individuales
tsx src/workers/agentRunner.ts      # Solo búsqueda
tsx src/workers/classifierRunner.ts # Solo clasificación
tsx src/workers/extractorRunner.ts  # Solo extracción
```

## 📡 API Endpoints

### Autenticación
```bash
POST   /api/auth/register      # Registro nuevo usuario
POST   /api/auth/login         # Login (devuelve JWT)
GET    /api/auth/me           # Info usuario actual
POST   /api/auth/logout       # Cerrar sesión
```

### Oportunidades
```bash
GET    /api/opportunities                           # Listar todas
GET    /api/users/:userId/opportunities/export/csv  # Exportar CSV
GET    /api/users/:userId/opportunities/export/excel # Exportar Excel
GET    /api/opportunities/filter-options           # Opciones de filtros
```

### Webhooks
```bash
POST   /api/users/:userId/webhooks       # Crear webhook
GET    /api/users/:userId/webhooks       # Listar webhooks
PATCH  /api/webhooks/:webhookId         # Actualizar webhook
DELETE /api/webhooks/:webhookId         # Eliminar webhook
GET    /api/webhooks/:webhookId/logs    # Ver logs
```

### Notificaciones
```bash
GET    /api/users/:userId/notifications  # Obtener config
PUT    /api/users/:userId/notifications  # Actualizar config
PATCH  /api/users/:userId/notifications  # Actualización parcial
```

Ver [API_GUIDE_V2.5.md](API_GUIDE_V2.5.md) para ejemplos completos.

## 🗄️ Base de Datos

### Tablas Principales

- **users** - Usuarios del sistema
- **search_configs** - Configuraciones de búsqueda por usuario
- **jobs** - URLs encontradas (con deduplicación)
- **opportunities** - Datos estructurados extraídos
- **notification_settings** - Preferencias de notificación
- **webhooks** - Webhooks registrados
- **webhook_logs** - Histórico de llamadas a webhooks

Ver [database/schema.sql](database/schema.sql) para schema completo.

## 📚 Documentación

- [PROJECT_MEMORY.md](PROJECT_MEMORY.md) - **Memoria completa del proyecto**
- [FEATURES_COMPLETED.md](FEATURES_COMPLETED.md) - Detalle de implementación
- [API_GUIDE_V2.5.md](API_GUIDE_V2.5.md) - Guía de uso de API
- [DEPLOY_CHECKLIST_V2.5.md](DEPLOY_CHECKLIST_V2.5.md) - Checklist deployment
- [NOTIFICATION_SYSTEM.md](NOTIFICATION_SYSTEM.md) - Sistema de notificaciones

## 🛠️ Stack Tecnológico

- **Backend**: Node.js, TypeScript, Express
- **Base de Datos**: MySQL 8
- **IA**: OpenAI GPT-4.1-mini
- **Search**: Tavily API
- **Auth**: JWT, bcrypt
- **Notificaciones**: Nodemailer (SMTP), node-telegram-bot-api
- **Export**: csv-writer, xlsx
- **Process Manager**: PM2

## 🧪 Tests

```bash
# Test clasificador
tsx src/testClassifier.ts

# Test búsqueda
tsx src/testSearchJobs.ts

# Test pipeline completo
tsx src/testPipeline.ts

# Test conexión DB
tsx src/testDB.ts
```

## 📈 Roadmap

### v2.6 (Próximo)
- [ ] Extracción de temarios (syllabusRunner)
- [ ] UI para gestión de webhooks
- [ ] Rate limiting en API
- [ ] Paginación en endpoints

### v3.0 (Futuro)
- [ ] Multi-tenancy completo
- [ ] Plans de suscripción
- [ ] Analytics dashboard
- [ ] API pública con API keys
- [ ] Chat AI para consultas

## 🤝 Contribuir

Las contribuciones son bienvenidas. Por favor:

1. Fork el proyecto
2. Crea una rama para tu feature (`git checkout -b feature/AmazingFeature`)
3. Commit tus cambios (`git commit -m 'Add some AmazingFeature'`)
4. Push a la rama (`git push origin feature/AmazingFeature`)
5. Abre un Pull Request

## 📄 Licencia

Este proyecto está bajo la licencia MIT. Ver [LICENSE](LICENSE) para más detalles.

## 👤 Autor

**droidhispalis**

- GitHub: [@droidhispalis](https://github.com/droidhispalis)
- Proyecto: [matchengine](https://github.com/droidhispalis/matchengine)

## 🙏 Agradecimientos

- OpenAI por GPT-4.1-mini
- Tavily por su excelente API de búsqueda
- Comunidad de TypeScript/Node.js

---

**⭐ Si este proyecto te resulta útil, considera darle una estrella en GitHub!**
