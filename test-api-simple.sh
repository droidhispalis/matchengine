#!/bin/bash
# Test de la API (ejecutar DESPUÉS de iniciar con PM2)

API_URL="http://localhost:3000"

echo "🧪 Testing MatchEngine API..."
echo ""

# Health check
echo "1. Health Check:"
curl -s $API_URL | jq '.' || curl -s $API_URL
echo ""

# Crear usuario
echo "2. Crear usuario:"
curl -s -X POST $API_URL/api/users \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@tumanitasia.es","name":"Admin","plan":"premium"}' | jq '.' || echo "Error creando usuario"
echo ""

# Ver usuarios
echo "3. Ver usuarios:"
curl -s $API_URL/api/users | jq '.' || curl -s $API_URL/api/users
echo ""

# Stats
echo "4. Estadísticas:"
curl -s $API_URL/api/stats | jq '.' || curl -s $API_URL/api/stats
echo ""

echo "✅ Test completado!"
echo ""
echo "Para crear búsquedas:"
echo "curl -X POST $API_URL/api/users/1/searches -H 'Content-Type: application/json' -d '{\"name\":\"Test\",\"queries\":[\"oposiciones\"]}'"
