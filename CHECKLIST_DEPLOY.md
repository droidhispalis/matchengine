# 📋 CHECKLIST DE ARCHIVOS PARA SUBIR POR FTP
# ============================================
# Fecha: 2026-02-14
# Versión: API Multi-tenant v1.0

## ✅ ARCHIVOS QUE DEBES SUBIR (en este orden):

### 1. Configuración Base
- [ ] package.json
- [ ] .env (verificar que tiene PORT=3100 y credenciales correctas de MySQL)

### 2. Repositorios (src/repositories/)
- [ ] src/repositories/userRepository.ts
- [ ] src/repositories/searchConfigRepository.ts  
- [ ] src/repositories/jobRepository.ts
- [ ] src/repositories/opportunityRepository.ts

### 3. API
- [ ] src/api/server.ts (con PORT = 3100 hardcodeado)

### 4. Workers
- [ ] src/workers/pipeline.ts
- [ ] src/workers/classifierRunner.ts
- [ ] src/workers/extractorRunner.ts
- [ ] src/workers/agentRunner.ts

### 5. Tools (si hay cambios)
- [ ] src/tools/classifyJob.ts
- [ ] src/tools/extractOpportunity.ts
- [ ] src/tools/searchJobs.ts

### 6. Database
- [ ] src/db/pool.js

## ⚠️ VERIFICACIONES POST-SUBIDA

Ejecuta en servidor:
```bash
cd /var/www/vhosts/tumanitasia.es/ia.tumanitasia.es

# 1. Verificar que server.ts tiene puerto 3100
grep "PORT.*3100" src/api/server.ts

# 2. Verificar .env
cat .env | grep -E "PORT|DB_"

# 3. Instalar dependencias si es necesario
pnpm install

# 4. Probar conexión MySQL manualmente
mysql -u matchengine_user -p'Y78$K$3=Z_F!' matchengine -e "SELECT COUNT(*) FROM users;"

# 5. Arrancar con PM2
pm2 delete matchengine-api
pm2 start "pnpm api" --name matchengine-api

# 6. Ver logs
pm2 logs matchengine-api --lines 20

# 7. Probar API
curl http://localhost:3100
```

## 🔥 PUNTOS CRÍTICOS

1. **NO modificar archivos en servidor directamente**
2. **Siempre subir desde local**
3. **Verificar puerto 3100 en server.ts antes de subir**
4. **Credenciales MySQL en .env deben coincidir**

## 📝 ARCHIVOS LOCALES CORRECTOS

✅ src/api/server.ts → Puerto 3100 hardcodeado (línea 16)
✅ src/repositories/*.ts → Sin template literals (strings simples)
✅ package.json → Script "api" configurado
✅ .env → PORT=3100 agregado
