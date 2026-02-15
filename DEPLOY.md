# ============================================
# Deploy Manual - Lista de comandos
# ============================================

# OPCIÓN 1: Si tienes OpenSSH en Windows
# ============================================

# 1. Copiar package.json
scp package.json root@priceless-fermi:/var/www/vhosts/tumanitasia.es/ia.tumanitasia.es/

# 2. Crear directorio api
ssh root@priceless-fermi "mkdir -p /var/www/vhosts/tumanitasia.es/ia.tumanitasia.es/src/api"

# 3. Copiar archivos nuevos
scp src/api/server.ts root@priceless-fermi:/var/www/vhosts/tumanitasia.es/ia.tumanitasia.es/src/api/
scp src/repositories/userRepository.ts root@priceless-fermi:/var/www/vhosts/tumanitasia.es/ia.tumanitasia.es/src/repositories/
scp src/repositories/searchConfigRepository.ts root@priceless-fermi:/var/www/vhosts/tumanitasia.es/ia.tumanitasia.es/src/repositories/

# 4. Copiar archivos modificados
scp src/repositories/jobRepository.ts root@priceless-fermi:/var/www/vhosts/tumanitasia.es/ia.tumanitasia.es/src/repositories/
scp src/repositories/opportunityRepository.ts root@priceless-fermi:/var/www/vhosts/tumanitasia.es/ia.tumanitasia.es/src/repositories/
scp src/workers/pipeline.ts root@priceless-fermi:/var/www/vhosts/tumanitasia.es/ia.tumanitasia.es/src/workers/
scp src/workers/classifierRunner.ts root@priceless-fermi:/var/www/vhosts/tumanitasia.es/ia.tumanitasia.es/src/workers/
scp src/workers/extractorRunner.ts root@priceless-fermi:/var/www/vhosts/tumanitasia.es/ia.tumanitasia.es/src/workers/

# 5. Instalar dependencias en servidor
ssh root@priceless-fermi "cd /var/www/vhosts/tumanitasia.es/ia.tumanitasia.es && pnpm install"

# 6. Iniciar API
ssh root@priceless-fermi "cd /var/www/vhosts/tumanitasia.es/ia.tumanitasia.es && pnpm api"


# OPCIÓN 2: Usar WinSCP (interfaz gráfica)
# ============================================
# 1. Abre WinSCP
# 2. Conecta a: root@priceless-fermi
# 3. Navega a: /var/www/vhosts/tumanitasia.es/ia.tumanitasia.es
# 4. Arrastra estos archivos desde tu carpeta local:
#    - package.json
#    - src/api/server.ts (crear carpeta api si no existe)
#    - src/repositories/*.ts (todos los archivos)
#    - src/workers/*.ts (todos los archivos)
# 5. En el servidor ejecuta: pnpm install && pnpm api


# OPCIÓN 3: Crear archivos directamente en servidor
# ============================================
# Conecta por SSH y crea cada archivo con nano/vi
# Luego copia el contenido desde VSCode
