# 📋 CHECKLIST DESPLIEGUE v2.5 - MatchEngine
**Fecha**: 2026-02-15  
**Versión**: 2.5.0 (Notificaciones + Auth + Filtros + Export + Webhooks)

---

## ✅ FASE 1: PREPARACIÓN LOCAL

### 1. Verificar archivos modificados/nuevos
- [ ] `package.json` (actualizadas dependencias)
- [ ] `.env.example` (nuevas variables)
- [ ] `src/middleware/auth.ts` ⭐ NUEVO
- [ ] `src/services/notificationService.ts` ⭐ NUEVO
- [ ] `src/services/exportService.ts` ⭐ NUEVO
- [ ] `src/services/webhookService.ts` ⭐ NUEVO
- [ ] `src/repositories/notificationRepository.ts` ⭐ NUEVO
- [ ] `src/repositories/webhookRepository.ts` ⭐ NUEVO
- [ ] `src/repositories/userRepository.ts` (actualizado)
- [ ] `src/repositories/opportunityRepository.ts` (actualizado)
- [ ] `src/api/server.ts` (actualizado - 24 endpoints nuevos)
- [ ] `src/workers/orchestrator.ts` (actualizado - Stage 4)
- [ ] `public/login.html` ⭐ NUEVO
- [ ] `public/dashboard.html` (actualizado - auth + filtros + export)
- [ ] `database/migration_notifications.sql` ⭐ NUEVO
- [ ] `database/migration_auth.sql` ⭐ NUEVO
- [ ] `database/migration_webhooks.sql` ⭐ NUEVO

---

## ✅ FASE 2: SUBIR ARCHIVOS POR FTP

### Herramientas recomendadas
- FileZilla
- WinSCP
- OpenSSH (Windows)

### Comandos si usas SCP (Windows PowerShell)
```powershell
# Navegar a la carpeta del proyecto
cd C:\ai-agent

# Subir archivos actualizados
scp package.json root@priceless-fermi:/var/www/vhosts/tumanitasia.es/ia.tumanitasia.es/

# Crear directorios si no existen
ssh root@priceless-fermi "mkdir -p /var/www/vhosts/tumanitasia.es/ia.tumanitasia.es/src/middleware"
ssh root@priceless-fermi "mkdir -p /var/www/vhosts/tumanitasia.es/ia.tumanitasia.es/src/services"

# Subir nuevos archivos
scp src/middleware/auth.ts root@priceless-fermi:/var/www/vhosts/tumanitasia.es/ia.tumanitasia.es/src/middleware/
scp src/services/*.ts root@priceless-fermi:/var/www/vhosts/tumanitasia.es/ia.tumanitasia.es/src/services/
scp src/repositories/*.ts root@priceless-fermi:/var/www/vhosts/tumanitasia.es/ia.tumanitasia.es/src/repositories/
scp src/api/server.ts root@priceless-fermi:/var/www/vhosts/tumanitasia.es/ia.tumanitasia.es/src/api/
scp src/workers/orchestrator.ts root@priceless-fermi:/var/www/vhosts/tumanitasia.es/ia.tumanitasia.es/src/workers/
scp public/*.html root@priceless-fermi:/var/www/vhosts/tumanitasia.es/ia.tumanitasia.es/public/
scp database/migration_*.sql root@priceless-fermi:/var/www/vhosts/tumanitasia.es/ia.tumanitasia.es/database/
```

---

## ✅ FASE 3: CONFIGURACIÓN EN SERVIDOR

### 1. Conectar por SSH
```bash
ssh root@priceless-fermi
cd /var/www/vhosts/tumanitasia.es/ia.tumanitasia.es
```

### 2. Actualizar .env
```bash
nano .env
```

**Añadir estas líneas:**
```bash
# JWT Secret
JWT_SECRET=matchengine-super-secret-key-2026-cambiar-en-produccion

# Email (SMTP) - Ejemplo Gmail
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=tu_email@gmail.com
SMTP_PASS=xxxx_xxxx_xxxx_xxxx  # Contraseña de aplicación

# Telegram (Opcional)
TELEGRAM_BOT_TOKEN=1234567890:ABCdefGHIjklMNOpqrsTUVwxyz
```

**💡 Nota Gmail**: Usar "Contraseña de aplicación", NO tu contraseña normal.  
Activar en: https://myaccount.google.com/apppasswords

### 3. Instalar nuevas dependencias
```bash
pnpm install
```

Esto instalará:
- nodemailer
- node-telegram-bot-api
- bcrypt
- jsonwebtoken
- cookie-parser
- csv-writer
- xlsx

---

## ✅ FASE 4: MIGRACIÓN DE BASE DE DATOS

### 1. Backup de seguridad (IMPORTANTE)
```bash
mysqldump -u matchengine_user -p'Y78$K$3=Z_F!' matchengine > backup_before_v2.5_$(date +%Y%m%d).sql
```

### 2. Aplicar migraciones EN ORDEN
```bash
mysql -u matchengine_user -p'Y78$K$3=Z_F!' matchengine < database/migration_notifications.sql
mysql -u matchengine_user -p'Y78$K$3=Z_F!' matchengine < database/migration_auth.sql
mysql -u matchengine_user -p'Y78$K$3=Z_F!' matchengine < database/migration_webhooks.sql
```

### 3. Verificar tablas creadas
```bash
mysql -u matchengine_user -p'Y78$K$3=Z_F!' matchengine -e "SHOW TABLES;"
```

Deberías ver:
- `notification_settings` ⭐
- `user_sessions` ⭐
- `webhooks` ⭐
- `webhook_logs` ⭐

### 4. Verificar columnas en users
```bash
mysql -u matchengine_user -p'Y78$K$3=Z_F!' matchengine -e "DESCRIBE users;"
```

Deberías ver nuevas columnas:
- `password_hash` ⭐
- `last_login_at` ⭐

---

## ✅ FASE 5: INICIAR/REINICIAR SERVICIOS

### 1. Verificar que no hay errores de sintaxis (Opcional)
```bash
cd /var/www/vhosts/tumanitasia.es/ia.tumanitasia.es
tsx src/api/server.ts  # Ctrl+C después de verificar que arranca
```

### 2. Iniciar servicios con PM2

**Si es PRIMERA VEZ o quieres recrear los procesos:**
```bash
# Eliminar procesos existentes (ignorar errores si no existen)
pm2 delete matchengine-api matchengine-orchestrator

# Iniciar procesos
pm2 start src/api/server.ts --name matchengine-api --interpreter tsx
pm2 start src/workers/orchestrator.ts --name matchengine-orchestrator --interpreter tsx

# Guardar configuración para auto-restart en reboot
pm2 save
pm2 startup
```

**Si los procesos ya existen y solo necesitas reiniciar:**
```bash
pm2 restart matchengine-api matchengine-orchestrator
```

### 3. Verificar estado
```bash
pm2 status
```

Deberías ver:
```
┌─────┬───────────────────────────┬─────────┬─────────┐
│ id  │ name                      │ status  │ restart │
├─────┼───────────────────────────┼─────────┼─────────┤
│ 0   │ matchengine-api           │ online  │ 0       │
│ 1   │ matchengine-orchestrator  │ online  │ 0       │
└─────┴───────────────────────────┴─────────┴─────────┘
```

### 4. Ver logs en tiempo real
```bash
pm2 logs
```

Verás logs de ambos procesos. Buscar:
- ✅ "MatchEngine API running on http://localhost:3100"
- ✅ "ORCHESTRATOR INICIADO"
- ❌ Cualquier error

---

## ✅ FASE 6: VERIFICACIÓN Y TESTING

### 1. Health Check
```bash
curl http://localhost:3100
```

Debe responder:
```json
{"service":"MatchEngine API","version":"1.0.0","status":"running"}
```

### 2. Probar registro de usuario
```bash
curl -X POST http://localhost:3100/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","name":"Usuario Test","password":"test1234"}'
```

### 3. Probar login
```bash
curl -X POST http://localhost:3100/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"test1234"}'
```

Deberías recibir un token JWT.

### 4. Verificar tablas de notificaciones
```bash
mysql -u matchengine_user -p'Y78$K$3=Z_F!' matchengine -e "SELECT COUNT(*) FROM notification_settings;"
```

### 5. Verificar webhooks
```bash
mysql -u matchengine_user -p'Y78$K$3=Z_F!' matchengine -e "SELECT COUNT(*) FROM webhooks;"
```

### 6. Probar acceso al dashboard
Abrir en navegador: http://ia.tumanitasia.es/login.html

- [ ] Página de login carga correctamente
- [ ] Puede crear cuenta
- [ ] Puede hacer login
- [ ] Redirige a /dashboard.html
- [ ] Dashboard muestra estadísticas
- [ ] Filtros funcionan
- [ ] Botones de exportación aparecen

---

## ✅ FASE 7: CONFIGURAR PRIMER USUARIO

### 1. Crear usuario admin
```bash
curl -X POST http://localhost:3100/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email":"admin@tumanitasia.es",
    "name":"Admin TuManitasIA",
    "password":"CAMBIAR_CONTRASEÑA_SEGURA_AQUI"
  }'
```

### 2. Configurar búsqueda
```bash
TOKEN="[TOKEN_DEL_PASO_ANTERIOR]"

curl -X POST http://localhost:3100/api/users/1/searches \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{
    "name":"Búsqueda Andalucía Discapacidad",
    "queries":["cupo discapacidad Andalucía","oposiciones discapacidad junta andalucia"],
    "filters":{"autonomous_region":"Andalucía","disability_quota":true},
    "maxResults":20,
    "intervalMinutes":60
  }'
```

### 3. Configurar notificaciones (Opcional)
```bash
curl -X PUT http://localhost:3100/api/users/1/notifications \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{
    "email_enabled":true,
    "email_address":"tu_email@example.com",
    "telegram_enabled":false,
    "notify_on_new_opportunity":true
  }'
```

### 4. Crear webhook de prueba (Opcional)
```bash
curl -X POST http://localhost:3100/api/users/1/webhooks \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{
    "name":"Webhook Test",
    "url":"https://webhook.site/tu-id-unico",
    "events":["opportunity.created"],
    "secret":"mi_secreto_123"
  }'
```

---

## ✅ FASE 8: MONITOREO POST-DEPLOY

### 1. Verificar orchestrator ejecuta correctamente
```bash
pm2 logs matchengine-orchestrator --lines 50
```

Buscar logs de:
- Stage 1: Search
- Stage 2: Classify
- Stage 3: Extract
- Stage 4: Notify & Webhooks ⭐ NUEVO

### 2. Verificar API responde
```bash
pm2 logs matchengine-api --lines 20
```

### 3. Verificar uso de recursos
```bash
pm2 monit
```

### 4. Ver estado general
```bash
pm2 list
```

---

## 🔥 TROUBLESHOOTING

### Error: bcrypt no encuentra binding
```bash
cd /var/www/vhosts/tumanitasia.es/ia.tumanitasia.es
npm rebuild bcrypt --build-from-source
pm2 restart matchengine-api
```

### Error: SMTP not configured
Verifica que en `.env` estén:
- SMTP_HOST
- SMTP_PORT
- SMTP_USER
- SMTP_PASS

### Error: JWT Secret
Añade `JWT_SECRET` a `.env`

### Error: Tabla no existe
Verifica que las migraciones se aplicaron correctamente:
```bash
mysql -u matchengine_user -p'Y78$K$3=Z_F!' matchengine -e "SHOW TABLES;"
```

### Dashboard no carga
- Verifica que `public/login.html` y `public/dashboard.html` se subieron
- Check permisos: `chmod 644 public/*.html`

---

## ✅ CHECKLIST FINAL

- [ ] Todos los archivos subidos
- [ ] Dependencias instaladas (`pnpm install`)
- [ ] Variables de entorno configuradas
- [ ] Migraciones aplicadas
- [ ] API funcionando (port 3100)
- [ ] Orchestrator funcionando (cada 5 min)
- [ ] Login/Registro funciona
- [ ] Dashboard funciona
- [ ] Filtros funcionan
- [ ] Exportación CSV/Excel funciona
- [ ] Notificaciones configuradas (opcional)
- [ ] Webhooks creados (opcional)

---

## 🎉 DESPLIEGUE COMPLETADO

**MatchEngine v2.5** está ahora en producción con todas las funcionalidades:
✅ Autenticación  
✅ Notificaciones  
✅ Filtros avanzados  
✅ Exportación  
✅ Webhooks  

**Fecha**: _______________  
**Desplegado por**: _______________  
**Servidor**: priceless-fermi  

---

## 📞 SOPORTE

**Documentación completa**: Ver `FEATURES_COMPLETED.md`  
**Guía de API**: Ver `API_GUIDE.md`  
**Sistema de notificaciones**: Ver `NOTIFICATION_SYSTEM.md`  
