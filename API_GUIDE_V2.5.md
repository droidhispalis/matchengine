# 🚀 GUÍA RÁPIDA - MatchEngine v2.5 API

## 🔐 AUTENTICACIÓN

### Registro
```bash
curl -X POST http://localhost:3100/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "usuario@example.com",
    "name": "Usuario Ejemplo",
    "password": "password123"
  }'
```

**Respuesta**:
```json
{
  "token": "eyJhbGc...",
  "user": {
    "id": 1,
    "email": "usuario@example.com",
    "name": "Usuario Ejemplo",
    "subscription_plan": "free"
  }
}
```

### Login
```bash
curl -X POST http://localhost:3100/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "usuario@example.com",
    "password": "password123"
  }'
```

### Obtener usuario actual
```bash
TOKEN="tu_token_aqui"

curl -X GET http://localhost:3100/api/auth/me \
  -H "Authorization: Bearer $TOKEN"
```

---

## 📧 NOTIFICACIONES

### Configurar notificaciones por email
```bash
curl -X PUT http://localhost:3100/api/users/1/notifications \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{
    "email_enabled": true,
    "email_address": "notificaciones@example.com",
    "notify_on_new_opportunity": true
  }'
```

### Configurar Telegram
```bash
# 1. Crear bot con @BotFather en Telegram
# 2. Obtener token
# 3. Enviar mensaje al bot
# 4. Obtener chat_id: https://api.telegram.org/bot<TOKEN>/getUpdates
# 5. Configurar:

curl -X PUT http://localhost:3100/api/users/1/notifications \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{
    "telegram_enabled": true,
    "telegram_chat_id": "123456789",
    "notify_on_new_opportunity": true
  }'
```

### Ver configuración de notificaciones
```bash
curl -X GET http://localhost:3100/api/users/1/notifications \
  -H "Authorization: Bearer $TOKEN"
```

---

## 🔍 BÚSQUEDA CON FILTROS

### Buscar oportunidades sin filtros
```bash
curl -X GET "http://localhost:3100/api/users/1/opportunities?limit=50" \
  -H "Authorization: Bearer $TOKEN"
```

### Filtrar por región
```bash
curl -X GET "http://localhost:3100/api/users/1/opportunities?autonomous_region=Andalucía&limit=100" \
  -H "Authorization: Bearer $TOKEN"
```

### Filtrar por cupo de discapacidad
```bash
curl -X GET "http://localhost:3100/api/users/1/opportunities?disability_quota=yes&limit=100" \
  -H "Authorization: Bearer $TOKEN"
```

### Filtrar por tipo de acceso
```bash
curl -X GET "http://localhost:3100/api/users/1/opportunities?access_type=oposicion&limit=100" \
  -H "Authorization: Bearer $TOKEN"
```

### Búsqueda en título/especialidad
```bash
curl -X GET "http://localhost:3100/api/users/1/opportunities?search=profesor&limit=100" \
  -H "Authorization: Bearer $TOKEN"
```

### Filtrar por rango de fechas
```bash
curl -X GET "http://localhost:3100/api/users/1/opportunities?deadline_from=2026-03-01&deadline_to=2026-06-30&limit=100" \
  -H "Authorization: Bearer $TOKEN"
```

### Filtros combinados
```bash
curl -X GET "http://localhost:3100/api/users/1/opportunities?\
autonomous_region=Andalucía&\
disability_quota=yes&\
access_type=oposicion&\
search=educación&\
deadline_from=2026-03-01&\
min_score=70&\
limit=100" \
  -H "Authorization: Bearer $TOKEN"
```

### Obtener opciones para filtros
```bash
curl -X GET "http://localhost:3100/api/opportunities/filter-options" \
  -H "Authorization: Bearer $TOKEN"
```

**Respuesta**:
```json
{
  "regions": ["Andalucía", "Cataluña", "Madrid", ...],
  "organisms": ["Junta de Andalucía", "Generalitat", ...],
  "access_types": ["libre", "oposicion", "concurso", "concurso-oposicion"]
}
```

---

## 📥 EXPORTACIÓN

### Exportar a CSV
```bash
# Sin filtros
curl -X GET "http://localhost:3100/api/users/1/opportunities/export/csv" \
  -H "Authorization: Bearer $TOKEN" \
  --output oportunidades.csv

# Con filtros
curl -X GET "http://localhost:3100/api/users/1/opportunities/export/csv?\
autonomous_region=Andalucía&\
disability_quota=yes" \
  -H "Authorization: Bearer $TOKEN" \
  --output oportunidades_andalucia.csv
```

### Exportar a Excel
```bash
# Sin filtros
curl -X GET "http://localhost:3100/api/users/1/opportunities/export/excel" \
  -H "Authorization: Bearer $TOKEN" \
  --output oportunidades.xlsx

# Con filtros
curl -X GET "http://localhost:3100/api/users/1/opportunities/export/excel?\
disability_quota=yes&\
deadline_from=2026-03-01" \
  -H "Authorization: Bearer $TOKEN" \
  --output oportunidades_filtradas.xlsx
```

---

## 🪝 WEBHOOKS

### Ver eventos disponibles
```bash
curl -X GET "http://localhost:3100/api/webhooks/events"
```

**Respuesta**:
```json
{
  "events": [
    { "name": "opportunity.created", "description": "Se crea una nueva oportunidad" },
    { "name": "opportunity.updated", "description": "Se actualiza una oportunidad" },
    { "name": "opportunity.deadline_approaching", "description": "Se acerca el plazo" },
    { "name": "search.completed", "description": "Se completa una búsqueda" },
    { "name": "classification.completed", "description": "Se completa clasificación" },
    { "name": "extraction.completed", "description": "Se completa extracción" }
  ]
}
```

### Crear webhook
```bash
curl -X POST http://localhost:3100/api/users/1/webhooks \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{
    "name": "Mi Webhook",
    "url": "https://mi-servidor.com/webhook",
    "events": ["opportunity.created"],
    "method": "POST",
    "headers": {
      "X-Custom-Header": "valor"
    },
    "secret": "mi_secreto_seguro",
    "is_active": true
  }'
```

### Listar webhooks
```bash
curl -X GET "http://localhost:3100/api/users/1/webhooks" \
  -H "Authorization: Bearer $TOKEN"
```

### Ver webhook específico
```bash
curl -X GET "http://localhost:3100/api/webhooks/1" \
  -H "Authorization: Bearer $TOKEN"
```

### Actualizar webhook
```bash
curl -X PATCH http://localhost:3100/api/webhooks/1 \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{
    "is_active": false
  }'
```

### Eliminar webhook
```bash
curl -X DELETE http://localhost:3100/api/webhooks/1 \
  -H "Authorization: Bearer $TOKEN"
```

### Ver logs de webhook
```bash
curl -X GET "http://localhost:3100/api/webhooks/1/logs?limit=100" \
  -H "Authorization: Bearer $TOKEN"
```

---

## 📦 PAYLOAD DE WEBHOOK

Cuando se dispara un webhook, se envía este payload:

```json
{
  "event": "opportunity.created",
  "timestamp": "2026-02-15T10:30:00.000Z",
  "user_id": 1,
  "data": {
    "count": 3,
    "opportunities": [
      {
        "id": 123,
        "title": "Auxiliar Administrativo",
        "organism": "Junta de Andalucía",
        "specialty": "Administración General",
        "application_deadline": "2026-04-15",
        "disability_quota": true,
        "autonomous_region": "Andalucía",
        "syllabus_url": "https://..."
      }
    ],
    "search_config": {
      "id": 1,
      "name": "Búsqueda Andalucía"
    }
  }
}
```

**Headers enviados**:
- `Content-Type: application/json`
- `User-Agent: MatchEngine-Webhook/1.0`
- `X-Webhook-Event: opportunity.created`
- `X-Webhook-Signature: sha256=...` (si hay secret configurado)

---

## 🔐 VERIFICAR WEBHOOK SIGNATURE

Si configuraste un `secret`, verifica la firma:

```javascript
// Node.js ejemplo
const crypto = require('crypto');

function verifyWebhook(payload, signature, secret) {
  const hmac = crypto.createHmac('sha256', secret);
  const digest = hmac.update(JSON.stringify(payload)).digest('hex');
  return signature === digest;
}

// En tu endpoint
app.post('/webhook', (req, res) => {
  const signature = req.headers['x-webhook-signature'];
  const isValid = verifyWebhook(req.body, signature, 'mi_secreto_seguro');
  
  if (!isValid) {
    return res.status(401).send('Invalid signature');
  }
  
  // Procesar webhook
  console.log('Webhook recibido:', req.body);
  res.status(200).send('OK');
});
```

---

## 🎯 EJEMPLOS COMPLETOS

### Crear usuario y configurar todo
```bash
#!/bin/bash

# 1. Registrar usuario
RESPONSE=$(curl -s -X POST http://localhost:3100/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email":"nuevo@example.com",
    "name":"Usuario Nuevo",
    "password":"password123"
  }')

TOKEN=$(echo $RESPONSE | jq -r '.token')
USER_ID=$(echo $RESPONSE | jq -r '.user.id')

echo "Token: $TOKEN"
echo "User ID: $USER_ID"

# 2. Crear configuración de búsqueda
curl -X POST http://localhost:3100/api/users/$USER_ID/searches \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{
    "name":"Búsqueda Personalizada",
    "queries":["oposiciones discapacidad","cupo discapacidad"],
    "filters":{"disability_quota":true},
    "maxResults":20,
    "intervalMinutes":60
  }'

# 3. Configurar notificaciones
curl -X PUT http://localhost:3100/api/users/$USER_ID/notifications \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{
    "email_enabled":true,
    "email_address":"notificaciones@example.com",
    "notify_on_new_opportunity":true
  }'

# 4. Crear webhook
curl -X POST http://localhost:3100/api/users/$USER_ID/webhooks \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{
    "name":"Webhook Principal",
    "url":"https://mi-app.com/webhook",
    "events":["opportunity.created"],
    "secret":"mi_secreto_123"
  }'

echo "✅ Usuario configurado completamente"
```

---

## 📊 ESTADÍSTICAS

### Ver stats globales
```bash
curl -X GET "http://localhost:3100/api/stats" \
  -H "Authorization: Bearer $TOKEN"
```

### Ver stats de usuario
```bash
curl -X GET "http://localhost:3100/api/users/1/stats" \
  -H "Authorization: Bearer $TOKEN"
```

---

## 🖥️ FRONTEND (Dashboard)

### URLs disponibles
- **Login/Registro**: http://localhost:3100/login.html
- **Dashboard**: http://localhost:3100/dashboard.html (requiere auth)

### Funciones JavaScript disponibles
```javascript
// En dashboard.html

// Aplicar filtros
applyFilters();

// Limpiar filtros
clearFilters();

// Exportar CSV
exportCSV();

// Exportar Excel
exportExcel();

// Cerrar sesión
logout();
```

---

## 🔄 FLUJO COMPLETO EJEMPLO

```
1. Usuario se registra en /login.html
   └─> Recibe JWT token

2. Usuario crea configuración de búsqueda
   └─> Define queries, filtros, intervalo

3. Orchestrator ejecuta cada 5 min
   └─> Stage 1: Busca trabajos (Tavily)
   └─> Stage 2: Clasifica (GPT)
   └─> Stage 3: Extrae datos (GPT)
   └─> Stage 4: Notifica y dispara webhooks
       ├─> Envía email si está configurado
       ├─> Envía Telegram si está configurado
       └─> Dispara webhooks activos

4. Usuario ve oportunidades en dashboard
   ├─> Aplica filtros avanzados
   ├─> Exporta a CSV/Excel
   └─> Configura más webhooks si necesita
```

---

## 📞 ENDPOINTS RESUMEN

### Autenticación
- `POST /api/auth/register` - Registro
- `POST /api/auth/login` - Login
- `GET /api/auth/me` - Usuario actual
- `POST /api/auth/logout` - Logout

### Notificaciones
- `GET /api/users/:userId/notifications` - Ver config
- `PUT /api/users/:userId/notifications` - Crear/actualizar
- `PATCH /api/users/:userId/notifications` - Actualizar parcial

### Oportunidades
- `GET /api/users/:userId/opportunities?[filtros]` - Listar con filtros
- `GET /api/opportunities/filter-options` - Opciones para filtros

### Exportación
- `GET /api/users/:userId/opportunities/export/csv?[filtros]` - CSV
- `GET /api/users/:userId/opportunities/export/excel?[filtros]` - Excel

### Webhooks
- `POST /api/users/:userId/webhooks` - Crear
- `GET /api/users/:userId/webhooks` - Listar
- `GET /api/webhooks/:webhookId` - Ver
- `PATCH /api/webhooks/:webhookId` - Actualizar
- `DELETE /api/webhooks/:webhookId` - Eliminar
- `GET /api/webhooks/:webhookId/logs` - Logs
- `GET /api/webhooks/events` - Eventos disponibles

**Total**: 24 endpoints nuevos + los existentes

---

## 🎉 ¡Listo para usar!

Consulta también:
- `FEATURES_COMPLETED.md` - Documentación completa
- `DEPLOY_CHECKLIST_V2.5.md` - Guía de despliegue
- `NOTIFICATION_SYSTEM.md` - Sistema de notificaciones
