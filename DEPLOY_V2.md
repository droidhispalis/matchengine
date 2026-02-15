# 🚀 DESPLIEGUE COMPLETO - MatchEngine v2.0
# ============================================

## 📦 ARCHIVOS PARA SUBIR POR FTP

### 1. Core API (modificado)
- [ ] src/api/server.ts

### 2. Nuevo Orchestrator
- [ ] src/workers/orchestrator.ts

### 3. Dashboard HTML
- [ ] public/dashboard.html

### 4. package.json (actualizado)
- [ ] package.json

## 🔧 COMANDOS EN SERVIDOR

```bash
cd /var/www/vhosts/tumanitasia.es/ia.tumanitasia.es

# 1. Instalar dependencias (si es necesario)
pnpm install

# 2. Reiniciar API
pm2 restart matchengine-api

# 3. Iniciar Orchestrator
pm2 start "pnpm orchestrator" --name matchengine-orchestrator

# 4. Ver procesos
pm2 list

# 5. Ver logs
pm2 logs matchengine-orchestrator --lines 20
```

## 🌐 ACCESO

### API
http://localhost:3100

### Dashboard
http://localhost:3100/dashboard.html

O desde fuera (si tienes dominio):
http://ia.tumanitasia.es/dashboard.html

## ✅ VERIFICACIÓN

```bash
# Health check
curl http://localhost:3100

# Stats
curl http://localhost:3100/api/stats

# Usuarios
curl http://localhost:3100/api/users
```

## 🎯 FUNCIONALIDADES IMPLEMENTADAS

✅ **API REST Multi-tenant**
- Gestión de usuarios con autenticación JWT
- Configuraciones de búsqueda por usuario
- CRUD completo
- Login/Registro/Logout
- Middleware de autenticación

✅ **Orchestrator Automático**
- Ejecuta pipeline cada 5 minutos
- Lee configuraciones activas
- Respeta intervalos por usuario
- Pipeline completo: Search → Classify → Extract → Notify & Webhooks

✅ **Dashboard HTML**
- Vista de estadísticas en tiempo real
- Listado de usuarios
- Últimas oportunidades extraídas
- Auto-refresh cada 30 segundos
- Sistema de login/registro
- Filtros avanzados de búsqueda
- Exportación CSV/Excel

✅ **Sistema de Notificaciones**
- Email con templates HTML
- Telegram con formato bonito
- Configuración por usuario
- Integrado en orchestrator

✅ **Filtros Avanzados**
- Por región autónoma
- Cupo de discapacidad
- Tipo de acceso
- Búsqueda en título/especialidad
- Rango de fechas
- Score IA

✅ **Exportación de Datos**
- Formato CSV (UTF-8 con BOM)
- Formato Excel (.xlsx)
- Respeta filtros activos
- Hasta 10,000 registros

✅ **Sistema de Webhooks**
- Configuración por usuario
- 6 eventos disponibles
- HMAC signatures
- Logs detallados
- Retry automático
- Integrado en orchestrator

## 📊 MONITOREO

```bash
# Ver logs del orchestrator
pm2 logs matchengine-orchestrator

# Ver logs de la API
pm2 logs matchengine-api

# Ver métricas
pm2 monit
```

## 🔄 PRÓXIMOS PASOS (OPCIONALES)

- [ ] Dashboard UI para webhooks
- [ ] Panel UI para configurar notificaciones
- [ ] Gráficas y analytics
- [ ] Sistema de alertas por deadlines
- [ ] API pública con rate limiting
- [ ] Integración con Zapier/Make
