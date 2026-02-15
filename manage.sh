#!/bin/bash
# ============================================
# MatchEngine Service Manager
# Gestión completa del sistema
# ============================================

set -e

PROJECT_DIR="/var/www/vhosts/tumanitasia.es/ia.tumanitasia.es"
API_NAME="matchengine-api"
ORCHESTRATOR_NAME="matchengine-orchestrator"

# Colores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Funciones de utilidad
log_info() {
    echo -e "${BLUE}ℹ${NC} $1"
}

log_success() {
    echo -e "${GREEN}✓${NC} $1"
}

log_error() {
    echo -e "${RED}✗${NC} $1"
}

log_warning() {
    echo -e "${YELLOW}⚠${NC} $1"
}

# Verificar que estamos en el directorio correcto
check_directory() {
    if [ ! -d "$PROJECT_DIR" ]; then
        log_error "Directorio del proyecto no encontrado: $PROJECT_DIR"
        exit 1
    fi
    cd "$PROJECT_DIR"
}

# Instalar dependencias
cmd_install() {
    log_info "Instalando dependencias..."
    
    if [ ! -f "package.json" ]; then
        log_error "package.json no encontrado"
        exit 1
    fi
    
    # Limpiar instalación anterior
    log_info "Limpiando instalación anterior..."
    rm -rf node_modules pnpm-lock.yaml
    
    # Limpiar caché de pnpm
    log_info "Limpiando caché de pnpm..."
    pnpm store prune || true
    
    # Instalar
    log_info "Instalando con pnpm..."
    pnpm install
    
    log_success "Dependencias instaladas correctamente"
}

# Iniciar servicios
cmd_start() {
    log_info "Iniciando servicios MatchEngine..."
    
    # Verificar node_modules
    if [ ! -d "node_modules" ]; then
        log_warning "node_modules no encontrado, instalando dependencias..."
        cmd_install
    fi
    
    # Parar procesos existentes
    log_info "Limpiando procesos anteriores..."
    pm2 stop $API_NAME 2>/dev/null || true
    pm2 stop $ORCHESTRATOR_NAME 2>/dev/null || true
    pm2 delete $API_NAME 2>/dev/null || true
    pm2 delete $ORCHESTRATOR_NAME 2>/dev/null || true
    
    # Iniciar API
    log_info "Iniciando API..."
    pm2 start src/api/server.ts --name $API_NAME --interpreter tsx
    
    # Iniciar Orchestrator
    log_info "Iniciando Orchestrator..."
    pm2 start src/workers/orchestrator.ts --name $ORCHESTRATOR_NAME --interpreter tsx
    
    # Guardar configuración
    pm2 save
    
    # Esperar 2 segundos
    sleep 2
    
    # Verificar estado
    log_success "Servicios iniciados"
    cmd_status
}

# Parar servicios
cmd_stop() {
    log_info "Parando servicios MatchEngine..."
    
    pm2 stop $API_NAME 2>/dev/null || log_warning "$API_NAME no estaba corriendo"
    pm2 stop $ORCHESTRATOR_NAME 2>/dev/null || log_warning "$ORCHESTRATOR_NAME no estaba corriendo"
    
    log_success "Servicios detenidos"
}

# Reiniciar servicios
cmd_restart() {
    log_info "Reiniciando servicios MatchEngine..."
    
    pm2 restart $API_NAME $ORCHESTRATOR_NAME
    
    sleep 2
    log_success "Servicios reiniciados"
    cmd_status
}

# Estado de servicios
cmd_status() {
    echo ""
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    echo "  Estado de Servicios MatchEngine"
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    echo ""
    
    pm2 status
    
    echo ""
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    
    # Verificar API
    log_info "Verificando API..."
    API_STATUS=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:3100 2>/dev/null || echo "000")
    
    if [ "$API_STATUS" = "200" ]; then
        log_success "API respondiendo correctamente (HTTP 200)"
    else
        log_error "API no responde (HTTP $API_STATUS)"
    fi
    
    echo ""
    echo "📍 URLs:"
    echo "   • Dashboard: https://ia.tumanitasia.es"
    echo "   • API: https://ia.tumanitasia.es:3100"
    echo ""
}

# Ver logs
cmd_logs() {
    local SERVICE=$1
    
    if [ -z "$SERVICE" ]; then
        log_info "Mostrando logs de todos los servicios..."
        pm2 logs
    elif [ "$SERVICE" = "api" ]; then
        log_info "Mostrando logs de API..."
        pm2 logs $API_NAME
    elif [ "$SERVICE" = "orchestrator" ]; then
        log_info "Mostrando logs de Orchestrator..."
        pm2 logs $ORCHESTRATOR_NAME
    else
        log_error "Servicio no válido. Usa: api, orchestrator, o déjalo vacío para todos"
        exit 1
    fi
}

# Eliminar servicios completamente
cmd_delete() {
    log_warning "Eliminando servicios de PM2..."
    
    pm2 delete $API_NAME 2>/dev/null || true
    pm2 delete $ORCHESTRATOR_NAME 2>/dev/null || true
    pm2 save
    
    log_success "Servicios eliminados de PM2"
}

# Desplegar (actualizar código y reiniciar)
cmd_deploy() {
    log_info "Desplegando actualización..."
    
    # Instalar/actualizar dependencias
    cmd_install
    
    # Reiniciar servicios
    cmd_restart
    
    log_success "Despliegue completado"
}

# Backup de base de datos
cmd_backup() {
    log_info "Creando backup de base de datos..."
    
    BACKUP_DIR="$PROJECT_DIR/backups"
    mkdir -p "$BACKUP_DIR"
    
    BACKUP_FILE="$BACKUP_DIR/matchengine_$(date +%Y%m%d_%H%M%S).sql"
    
    mysqldump -u matchengine_user -p'Y78$K$3=Z_F!' matchengine > "$BACKUP_FILE"
    
    log_success "Backup creado: $BACKUP_FILE"
}

# Mostrar ayuda
cmd_help() {
    cat << EOF

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  MatchEngine Service Manager
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

USO:
    ./manage.sh <comando> [argumentos]

COMANDOS:

  Gestión de Servicios:
    start              Iniciar servicios (API + Orchestrator)
    stop               Parar servicios
    restart            Reiniciar servicios
    status             Ver estado de servicios
    delete             Eliminar servicios de PM2
    
  Logs:
    logs               Ver logs de todos los servicios
    logs api           Ver logs solo de API
    logs orchestrator  Ver logs solo de Orchestrator
    
  Mantenimiento:
    install            Instalar/reinstalar dependencias
    deploy             Actualizar código y reiniciar
    backup             Crear backup de base de datos
    
  Información:
    help               Mostrar esta ayuda

EJEMPLOS:
    ./manage.sh start
    ./manage.sh logs api
    ./manage.sh restart
    ./manage.sh backup

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

EOF
}

# Main
main() {
    check_directory
    
    case "${1:-help}" in
        start)
            cmd_start
            ;;
        stop)
            cmd_stop
            ;;
        restart)
            cmd_restart
            ;;
        status)
            cmd_status
            ;;
        logs)
            cmd_logs $2
            ;;
        install)
            cmd_install
            ;;
        delete)
            cmd_delete
            ;;
        deploy)
            cmd_deploy
            ;;
        backup)
            cmd_backup
            ;;
        help|--help|-h)
            cmd_help
            ;;
        *)
            log_error "Comando no válido: $1"
            cmd_help
            exit 1
            ;;
    esac
}

main "$@"
