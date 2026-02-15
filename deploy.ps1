# ============================================
# Deploy Script - MatchEngine
# ============================================

# CONFIGURACIÓN (edita estos valores)
$SSH_HOST = "priceless-fermi"  # tu servidor
$SSH_USER = "root"
$REMOTE_PATH = "/var/www/vhosts/tumanitasia.es/ia.tumanitasia.es"

# Colores
function Write-Success { Write-Host $args -ForegroundColor Green }
function Write-Info { Write-Host $args -ForegroundColor Cyan }
function Write-Error { Write-Host $args -ForegroundColor Red }

Write-Info "🚀 Iniciando deploy de MatchEngine..."

# Verificar que scp existe
try {
    scp -V 2>&1 | Out-Null
} catch {
    Write-Error "❌ SCP no encontrado. Instala OpenSSH o usa WinSCP"
    exit 1
}

Write-Info "📦 Copiando archivos al servidor..."

# Archivos a copiar
$files = @(
    "package.json",
    "src/api/server.ts",
    "src/repositories/userRepository.ts",
    "src/repositories/searchConfigRepository.ts",
    "src/repositories/jobRepository.ts",
    "src/repositories/opportunityRepository.ts",
    "src/workers/pipeline.ts",
    "src/workers/classifierRunner.ts",
    "src/workers/extractorRunner.ts",
    "database/schema.sql",
    "database/migration.sql",
    "database/seed.sql"
)

foreach ($file in $files) {
    if (Test-Path $file) {
        Write-Info "  📄 Copiando $file..."
        
        # Crear directorio remoto si no existe
        $remoteDir = Split-Path "$REMOTE_PATH/$file" -Parent
        ssh "$SSH_USER@$SSH_HOST" "mkdir -p $remoteDir"
        
        # Copiar archivo
        scp $file "${SSH_USER}@${SSH_HOST}:${REMOTE_PATH}/$file"
        
        if ($LASTEXITCODE -eq 0) {
            Write-Success "  ✅ $file copiado"
        } else {
            Write-Error "  ❌ Error copiando $file"
        }
    } else {
        Write-Error "  ⚠️ $file no encontrado"
    }
}

Write-Info "`n📦 Instalando dependencias en servidor..."
ssh "$SSH_USER@$SSH_HOST" "cd $REMOTE_PATH && pnpm install"

Write-Success "`n✅ Deploy completado!"
Write-Info "Para iniciar la API ejecuta en servidor:"
Write-Info "  ssh $SSH_USER@$SSH_HOST"
Write-Info "  cd $REMOTE_PATH"
Write-Info "  pnpm api"
