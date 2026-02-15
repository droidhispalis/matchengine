#!/bin/bash
# ============================================
# Script de Estado - MatchEngine Services
# ============================================

echo "📊 Estado de servicios MatchEngine"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

# Mostrar estado PM2
pm2 status

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

# Verificar API
echo "🔍 Verificando API..."
API_STATUS=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:3100 2>/dev/null || echo "000")

if [ "$API_STATUS" = "200" ]; then
    echo "✅ API respondiendo correctamente (HTTP 200)"
else
    echo "❌ API no responde (HTTP $API_STATUS)"
fi

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "📍 URLs:"
echo "   • Dashboard: https://ia.tumanitasia.es"
echo "   • API: https://ia.tumanitasia.es:3100"
echo ""
echo "📌 Comandos:"
echo "   pm2 logs              - Ver logs en tiempo real"
echo "   ./restart-services.sh - Reiniciar servicios"
echo "   ./stop-services.sh    - Parar servicios"
echo ""
