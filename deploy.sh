#!/bin/bash

# ============================================
# Deploy Script - MatchEngine
# ============================================

# CONFIGURACIÓN (edita estos valores)
SSH_HOST="priceless-fermi"
SSH_USER="root"
REMOTE_PATH="/var/www/vhosts/tumanitasia.es/ia.tumanitasia.es"

echo "🚀 Iniciando deploy de MatchEngine..."

# Verificar rsync
if ! command -v rsync &> /dev/null; then
    echo "❌ rsync no encontrado. Instalando..."
    sudo apt-get install -y rsync
fi

echo "📦 Sincronizando archivos con servidor..."

# Usar rsync para sincronizar
rsync -avz --progress \
    --include='package.json' \
    --include='src/api/***' \
    --include='src/repositories/***' \
    --include='src/workers/***' \
    --include='src/tools/***' \
    --include='src/db/***' \
    --include='src/utils/***' \
    --include='database/***' \
    --exclude='node_modules/' \
    --exclude='data/' \
    --exclude='.env' \
    --exclude='*.log' \
    ./ "${SSH_USER}@${SSH_HOST}:${REMOTE_PATH}/"

if [ $? -eq 0 ]; then
    echo "✅ Archivos sincronizados"
else
    echo "❌ Error en sincronización"
    exit 1
fi

echo "📦 Instalando dependencias en servidor..."
ssh "${SSH_USER}@${SSH_HOST}" "cd ${REMOTE_PATH} && pnpm install"

echo ""
echo "✅ Deploy completado!"
echo "Para iniciar la API ejecuta en servidor:"
echo "  ssh ${SSH_USER}@${SSH_HOST}"
echo "  cd ${REMOTE_PATH}"
echo "  pnpm api"
