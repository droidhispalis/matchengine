#!/bin/bash
# Test completo de la API

API_URL="http://localhost:3000"

echo "🧪 Testing MatchEngine API..."
echo "================================"

# 1. Health check
echo -e "\n1️⃣ Health Check:"
curl -s $API_URL | jq

# 2. Crear usuario
echo -e "\n2️⃣ Crear usuario:"
USER_RESPONSE=$(curl -s -X POST $API_URL/api/users \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@matchengine.com",
    "name": "Usuario Test",
    "plan": "premium"
  }')
echo $USER_RESPONSE | jq

USER_ID=$(echo $USER_RESPONSE | jq -r '.userId // 1')

# 3. Crear configuración de búsqueda
echo -e "\n3️⃣ Crear búsqueda:"
SEARCH_RESPONSE=$(curl -s -X POST $API_URL/api/users/$USER_ID/searches \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Oposiciones Test",
    "queries": ["convocatoria oposiciones", "proceso selectivo"],
    "maxResults": 10,
    "intervalMinutes": 60
  }')
echo $SEARCH_RESPONSE | jq

# 4. Ver configuraciones
echo -e "\n4️⃣ Ver búsquedas del usuario:"
curl -s $API_URL/api/users/$USER_ID/searches | jq

# 5. Stats
echo -e "\n5️⃣ Estadísticas:"
curl -s $API_URL/api/stats | jq

echo -e "\n✅ Test completado!"
