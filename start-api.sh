#!/bin/bash
# ============================================
# Gestión de la API con PM2
# ============================================

cd /var/www/vhosts/tumanitasia.es/ia.tumanitasia.es

echo "🚀 Instalando PM2..."
pnpm add -g pm2

echo "🚀 Iniciando API con PM2..."
pm2 start "pnpm api" --name matchengine-api

echo "💾 Guardar configuración PM2..."
pm2 save
pm2 startup

echo ""
echo "✅ API corriendo en background!"
echo ""
echo "📋 Comandos útiles:"
echo "  pm2 status                 # Ver estado"
echo "  pm2 logs matchengine-api   # Ver logs"
echo "  pm2 restart matchengine-api # Reiniciar"
echo "  pm2 stop matchengine-api   # Parar"
echo "  pm2 delete matchengine-api # Eliminar"
