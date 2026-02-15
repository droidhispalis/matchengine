# 📧 Sistema de Notificaciones - MatchEngine

## ✅ Implementado

### Base de Datos
- Tabla `notification_settings` con configuración por usuario
- Soporte para email y Telegram
- Opciones de notificación personalizables
- Horario silencioso (quiet hours)

### Backend
- Servicio de notificaciones: `src/services/notificationService.ts`
- Repositorio: `src/repositories/notificationRepository.ts`
- Integración con orchestrator
- Templates HTML para emails
- Formato para Telegram

### API Endpoints
```
GET    /api/users/:userId/notifications       # Obtener config
PUT    /api/users/:userId/notifications       # Crear/actualizar
PATCH  /api/users/:userId/notifications       # Actualizar parcial
```

## 🔧 Configuración

### 1. Variables de Entorno
Añade a tu `.env`:
```bash
# Email (Gmail ejemplo)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=tu_email@gmail.com
SMTP_PASS=tu_contraseña_aplicacion

# Telegram
TELEGRAM_BOT_TOKEN=tu_token_aqui
```

### 2. Crear Bot de Telegram (Opcional)
```
1. Habla con @BotFather en Telegram
2. Comando: /newbot
3. Sigue instrucciones y copia el token
4. Pega el token en .env
```

### 3. Gmail - Contraseña de Aplicación
```
1. Ve a: https://myaccount.google.com/apppasswords
2. Crea una contraseña para "Mail"
3. Copia la contraseña generada (sin espacios)
4. Úsala en SMTP_PASS (no tu contraseña normal)
```

### 4. Migración de Base de Datos
```bash
mysql -u matchengine_user -p matchengine < database/migration_notifications.sql
```

## 📖 Uso

### Activar Notificaciones por Email
```bash
curl -X PUT http://localhost:3100/api/users/1/notifications \
  -H "Content-Type: application/json" \
  -d '{
    "email_enabled": true,
    "email_address": "usuario@example.com",
    "notify_on_new_opportunity": true
  }'
```

### Activar Notificaciones por Telegram
```bash
# 1. Obtén tu chat_id enviando un mensaje a tu bot y consultando:
curl https://api.telegram.org/bot<TOKEN>/getUpdates

# 2. Configura:
curl -X PUT http://localhost:3100/api/users/1/notifications \
  -H "Content-Type: application/json" \
  -d '{
    "telegram_enabled": true,
    "telegram_chat_id": "123456789",
    "notify_on_new_opportunity": true
  }'
```

### Consultar Configuración
```bash
curl http://localhost:3100/api/users/1/notifications
```

## 🎯 Funcionalidades

- ✅ **Email HTML** con tabla de oportunidades
- ✅ **Telegram** con formato bonito
- ✅ **Notificación automática** al extraer nuevas oportunidades
- ✅ **Configuración por usuario**
- ✅ **Detección de nuevas oportunidades** en orchestrator
- ⏭️ **Horario silencioso** (implementado en DB, pendiente lógica)
- ⏭️ **Notificación de plazos próximos** (implementado en DB, pendiente lógica)

## 🔄 Flujo Automático

1. **Orchestrator** ejecuta pipeline cada 5 minutos
2. **Stage 3 (Extract)** extrae nuevas oportunidades
3. **Stage 4 (Notify)** verifica configuración del usuario
4. Si tiene notificaciones habilitadas → envía email/telegram
5. Log del resultado en consola

## 📝 Estructura de Email
- Header con gradiente morado
- Tabla responsive con oportunidades
- Columnas: Título, Cupo Discapacidad, Plazo, Región
- Footer con info del servicio

## 📱 Estructura de Telegram
- Emoji indicadores
- Formato HTML (bold, etc.)
- Máximo 10 oportunidades por mensaje
- Link al dashboard para ver más

## 🐛 Troubleshooting

**Email no se envía:**
- Verifica SMTP_USER y SMTP_PASS en .env
- Gmail: usa contraseña de aplicación
- Revisa logs del orchestrator

**Telegram no funciona:**
- Verifica que el bot token sea correcto
- Chat ID debe ser numérico (sin espacios)
- Primero debes enviar un mensaje al bot

**No recibo notificaciones:**
- Verifica que la configuración esté activa: `GET /api/users/:id/notifications`
- Check logs del orchestrator
- Verifica que el usuario tenga `status='active'`

