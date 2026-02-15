#!/bin/bash
# ============================================
# Script de Inicio - MatchEngine Services
# ============================================

set -e  # Salir si hay errores

echo "🚀 Iniciando servicios MatchEngine..."
echo ""

# Directorio del proyecto
PROJECT_DIR="/var/www/vhosts/tumanitasia.es/ia.tumanitasia.es"
cd "$PROJECT_DIR"

# 1. Verificar que node_modules existe
if [ ! -d "node_modules" ]; then
    echo "📦 Instalando dependencias..."
    pnpm install
    echo "✅ Dependencias instaladas"
    echo ""
fi

# 2. Parar procesos existentes (ignorar errores si no existen)
echo "🛑 Parando procesos anteriores..."
pm2 stop matchengine-api 2>/dev/null || true
pm2 stop matchengine-orchestrator 2>/dev/null || true
pm2 delete matchengine-api 2>/dev/null || true
pm2 delete matchengine-orchestrator 2>/dev/null || true
echo "✅ Procesos anteriores limpiados"
echo ""

# 3. Iniciar servicios con PM2
echo "🔄 Iniciando API..."
pm2 start src/api/server.ts --name matchengine-api --interpreter tsx

echo "🔄 Iniciando Orchestrator..."
pm2 start src/workers/orchestrator.ts --name matchengine-orchestrator --interpreter tsx

# 4. Guardar configuración PM2
echo ""
echo "💾 Guardando configuración PM2..."
pm2 save

# 5. Mostrar estado
echo ""
echo "📊 Estado de servicios:"
pm2 status

# 6. Mostrar logs recientes
echo ""
echo "📝 Últimos logs (presiona Ctrl+C para salir):"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
sleep 2
pm2 logs --lines 20 --nostream

echo ""
echo "✅ Servicios iniciados correctamente!"
echo ""
echo "📍 URLs disponibles:"
echo "   • Dashboard: https://ia.tumanitasia.es"
echo "   • API: https://ia.tumanitasia.es:3100"
echo ""
echo "📌 Comandos útiles:"
echo "   pm2 status          - Ver estado"
echo "   pm2 logs            - Ver logs en tiempo real"
echo "   pm2 restart all     - Reiniciar servicios"
echo "   pm2 stop all        - Parar servicios"
echo "   ./stop-services.sh  - Parar todos los servicios"
echo ""
