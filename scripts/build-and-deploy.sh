#!/bin/bash

# Script de Build y Deploy para Hostinger
# Este script automatiza el proceso de build y preparación para deployment

set -e  # Exit on any error

echo "🚀 Iniciando proceso de build para hosting estático..."

# Colores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Función para logging
log() {
    echo -e "${BLUE}[$(date +'%Y-%m-%d %H:%M:%S')]${NC} $1"
}

success() {
    echo -e "${GREEN}✅ $1${NC}"
}

warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

error() {
    echo -e "${RED}❌ $1${NC}"
    exit 1
}

# Verificar que estamos en el directorio correcto
if [ ! -f "package.json" ]; then
    error "No se encontró package.json. Ejecuta este script desde la raíz del proyecto."
fi

# Limpiar builds anteriores
log "Limpiando builds anteriores..."
rm -rf build/
rm -rf dist/
rm -rf .expo/

# Instalar dependencias si es necesario
if [ ! -d "node_modules" ]; then
    log "Instalando dependencias..."
    npm install
fi

# Build para web
log "Generando build estático para web..."
npx expo export --platform web --output-dir build --clear

if [ ! -d "build" ]; then
    error "El build falló. No se generó la carpeta build/"
fi

success "Build generado exitosamente en ./build/"

# Crear archivo .htaccess para Apache (Hostinger)
log "Creando archivo .htaccess..."
cat > build/.htaccess << 'EOF'
# Habilitar compresión
<IfModule mod_deflate.c>
    AddOutputFilterByType DEFLATE text/plain
    AddOutputFilterByType DEFLATE text/html
    AddOutputFilterByType DEFLATE text/xml
    AddOutputFilterByType DEFLATE text/css
    AddOutputFilterByType DEFLATE application/xml
    AddOutputFilterByType DEFLATE application/xhtml+xml
    AddOutputFilterByType DEFLATE application/rss+xml
    AddOutputFilterByType DEFLATE application/javascript
    AddOutputFilterByType DEFLATE application/x-javascript
    AddOutputFilterByType DEFLATE application/json
</IfModule>

# Cache estático
<IfModule mod_expires.c>
    ExpiresActive on
    ExpiresByType text/css "access plus 1 year"
    ExpiresByType application/javascript "access plus 1 year"
    ExpiresByType image/png "access plus 1 year"
    ExpiresByType image/jpg "access plus 1 year"
    ExpiresByType image/jpeg "access plus 1 year"
    ExpiresByType image/gif "access plus 1 year"
    ExpiresByType image/svg+xml "access plus 1 year"
    ExpiresByType image/webp "access plus 1 year"
    ExpiresByType font/woff "access plus 1 year"
    ExpiresByType font/woff2 "access plus 1 year"
</IfModule>

# Rewrite para SPA (Single Page Application)
<IfModule mod_rewrite.c>
    RewriteEngine On
    RewriteBase /
    
    # Manejar archivos estáticos
    RewriteCond %{REQUEST_FILENAME} !-f
    RewriteCond %{REQUEST_FILENAME} !-d
    RewriteCond %{REQUEST_URI} !^/api/
    RewriteCond %{REQUEST_URI} !^/_expo/
    RewriteCond %{REQUEST_URI} !^/assets/
    
    # Redirigir todo a index.html para routing del lado del cliente
    RewriteRule . /index.html [L]
</IfModule>

# Seguridad básica
<IfModule mod_headers.c>
    Header always set X-Content-Type-Options nosniff
    Header always set X-Frame-Options SAMEORIGIN
    Header always set X-XSS-Protection "1; mode=block"
    Header always set Referrer-Policy "strict-origin-when-cross-origin"
</IfModule>

# Prevenir acceso a archivos sensibles
<Files ~ "^\.">
    Order allow,deny
    Deny from all
</Files>

# Configuración MIME types
AddType application/javascript .js
AddType text/css .css
AddType image/svg+xml .svg
AddType font/woff .woff
AddType font/woff2 .woff2
EOF

success "Archivo .htaccess creado"

# Crear archivo de información del build
log "Creando información del build..."
cat > build/build-info.json << EOF
{
  "buildDate": "$(date -u +"%Y-%m-%dT%H:%M:%SZ")",
  "version": "$(node -p "require('./package.json').version")",
  "platform": "web",
  "environment": "production",
  "buildTool": "expo",
  "features": [
    "WebRTC P2P Sync",
    "Offline Storage",
    "Real-time Transcription",
    "Cross-platform"
  ]
}
EOF

# Mostrar estadísticas del build
log "Estadísticas del build:"
echo "📁 Tamaño total: $(du -sh build | cut -f1)"
echo "📄 Archivos generados: $(find build -type f | wc -l)"
echo "🗂️  Estructura:"
find build -type d -maxdepth 2 | head -10 | sed 's/^/   /'

# Verificar archivos críticos
log "Verificando archivos críticos..."
critical_files=("index.html" "manifest.json" ".htaccess")
for file in "${critical_files[@]}"; do
    if [ -f "build/$file" ]; then
        success "$file ✓"
    else
        warning "$file no encontrado"
    fi
done

# Crear archivo ZIP para fácil upload
log "Creando archivo ZIP para deployment..."
cd build
zip -r ../radiology-app-build.zip . -x "*.DS_Store" "*.git*"
cd ..

success "Archivo ZIP creado: radiology-app-build.zip"

# Instrucciones finales
echo ""
echo "🎉 Build completado exitosamente!"
echo ""
echo "📋 Próximos pasos para deployment en Hostinger:"
echo ""
echo "1. 📁 Opción 1 - File Manager:"
echo "   • Accede al File Manager de Hostinger"
echo "   • Ve a public_html (o carpeta de tu dominio)"
echo "   • Sube el archivo radiology-app-build.zip"
echo "   • Extrae el contenido en public_html"
echo ""
echo "2. 🔄 Opción 2 - FTP:"
echo "   • Usa FileZilla o similar"
echo "   • Sube todo el contenido de ./build/ a public_html/"
echo ""
echo "3. 🌐 Configurar servidor de señalización:"
echo "   • Sube server/signaling-server.js a tu servidor"
echo "   • Ejecuta: node signaling-server.js"
echo "   • Actualiza la URL en la app: ws://tu-dominio:8080"
echo ""
echo "4. ✅ Verificar deployment:"
echo "   • Visita tu dominio"
echo "   • Verifica que la app carga correctamente"
echo "   • Prueba la sincronización WebRTC"
echo ""
echo "📊 Características incluidas:"
echo "   ✅ Sincronización P2P WebRTC"
echo "   ✅ Almacenamiento offline"
echo "   ✅ Transcripción en tiempo real"
echo "   ✅ Respaldo e importación de datos"
echo "   ✅ Interfaz responsive"
echo "   ✅ PWA ready"
echo ""
echo "💡 Costos estimados:"
echo "   • Hostinger: ~$3-5/mes"
echo "   • Dominio: ~$10-15/año"
echo "   • Total: ~$50-75/año"
echo ""
echo "🔗 URLs importantes:"
echo "   • App: https://tu-dominio.com"
echo "   • Signaling: ws://tu-dominio.com:8080"
echo "   • Status: http://tu-dominio.com:8080/status"