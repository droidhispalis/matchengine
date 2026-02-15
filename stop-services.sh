#!/bin/bash
# ============================================
# Script de Parada - MatchEngine Services
# ============================================

echo "🛑 Parando servicios MatchEngine..."
echo ""

# Parar servicios
pm2 stop matchengine-api 2>/dev/null || echo "⚠️  matchengine-api no estaba corriendo"
pm2 stop matchengine-orchestrator 2>/dev/null || echo "⚠️  matchengine-orchestrator no estaba corriendo"

# Mostrar estado
echo ""
echo "📊 Estado actual:"
pm2 status

echo ""
echo "✅ Servicios detenidos"
echo ""
echo "💡 Para reiniciar: ./start-services.sh"
echo "💡 Para eliminar completamente: pm2 delete all"
echo ""
