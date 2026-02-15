#!/bin/bash
# ============================================
# Script de Reinicio - MatchEngine Services
# ============================================

echo "🔄 Reiniciando servicios MatchEngine..."
echo ""

# Reiniciar servicios
pm2 restart matchengine-api matchengine-orchestrator

# Esperar un momento
sleep 2

# Mostrar estado
echo ""
echo "📊 Estado de servicios:"
pm2 status

# Mostrar logs recientes
echo ""
echo "📝 Últimos logs:"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
pm2 logs --lines 15 --nostream

echo ""
echo "✅ Servicios reiniciados"
echo ""
echo "📍 Dashboard: https://ia.tumanitasia.es"
echo "📍 API: https://ia.tumanitasia.es:3100"
echo ""
