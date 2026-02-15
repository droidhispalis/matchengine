# ============================================
# GUÍA RÁPIDA - MatchEngine API
# ============================================

## API corriendo en: http://localhost:3000

## 1️⃣ CREAR USUARIO
curl -X POST http://localhost:3000/api/users \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@matchengine.com",
    "name": "Admin MatchEngine",
    "plan": "premium"
  }'

## 2️⃣ CREAR CONFIGURACIÓN DE BÚSQUEDA
curl -X POST http://localhost:3000/api/users/1/searches \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Oposiciones Andalucía - Discapacidad",
    "queries": [
      "site:juntadeandalucia.es convocatoria empleo publico discapacidad",
      "site:juntadeandalucia.es proceso selectivo discapacidad"
    ],
    "filters": {
      "autonomous_region": "Andalucía",
      "disability_quota": true
    },
    "maxResults": 10,
    "intervalMinutes": 30
  }'

## 3️⃣ VER CONFIGURACIONES DEL USUARIO
curl http://localhost:3000/api/users/1/searches

## 4️⃣ VER ESTADÍSTICAS GLOBALES
curl http://localhost:3000/api/stats

## 5️⃣ VER OPORTUNIDADES
curl http://localhost:3000/api/users/1/opportunities

## 6️⃣ VER TODOS LOS USUARIOS
curl http://localhost:3000/api/users

## 7️⃣ ACTIVAR/DESACTIVAR BÚSQUEDA
curl -X PATCH http://localhost:3000/api/searches/1/toggle \
  -H "Content-Type: application/json" \
  -d '{"isActive": false}'

## ============================================
## PRÓXIMOS PASOS
## ============================================

# 1. Crear orchestrator que ejecute workers automáticamente
# 2. Dashboard HTML para visualizar datos
# 3. Sistema de notificaciones
# 4. Panel de administración
