@echo off
REM Script de Build y Deploy para Windows
REM Este script automatiza el proceso de build y preparación para deployment

echo 🚀 Iniciando proceso de build para hosting estático...

REM Verificar que estamos en el directorio correcto
if not exist "package.json" (
    echo ❌ No se encontró package.json. Ejecuta este script desde la raíz del proyecto.
    pause
    exit /b 1
)

REM Limpiar builds anteriores
echo 🧹 Limpiando builds anteriores...
if exist "build" rmdir /s /q "build"
if exist "dist" rmdir /s /q "dist"
if exist ".expo" rmdir /s /q ".expo"

REM Instalar dependencias si es necesario
if not exist "node_modules" (
    echo 📦 Instalando dependencias...
    npm install
)

REM Build para web
echo 🔨 Generando build estático para web...
npx expo export --platform web --output-dir build --clear

if not exist "build" (
    echo ❌ El build falló. No se generó la carpeta build/
    pause
    exit /b 1
)

echo ✅ Build generado exitosamente en ./build/

REM Crear archivo .htaccess para Apache (Hostinger)
echo 📝 Creando archivo .htaccess...
(
echo # Habilitar compresión
echo ^<IfModule mod_deflate.c^>
echo     AddOutputFilterByType DEFLATE text/plain
echo     AddOutputFilterByType DEFLATE text/html
echo     AddOutputFilterByType DEFLATE text/xml
echo     AddOutputFilterByType DEFLATE text/css
echo     AddOutputFilterByType DEFLATE application/xml
echo     AddOutputFilterByType DEFLATE application/xhtml+xml
echo     AddOutputFilterByType DEFLATE application/rss+xml
echo     AddOutputFilterByType DEFLATE application/javascript
echo     AddOutputFilterByType DEFLATE application/x-javascript
echo     AddOutputFilterByType DEFLATE application/json
echo ^</IfModule^>
echo.
echo # Cache estático
echo ^<IfModule mod_expires.c^>
echo     ExpiresActive on
echo     ExpiresByType text/css "access plus 1 year"
echo     ExpiresByType application/javascript "access plus 1 year"
echo     ExpiresByType image/png "access plus 1 year"
echo     ExpiresByType image/jpg "access plus 1 year"
echo     ExpiresByType image/jpeg "access plus 1 year"
echo     ExpiresByType image/gif "access plus 1 year"
echo     ExpiresByType image/svg+xml "access plus 1 year"
echo     ExpiresByType image/webp "access plus 1 year"
echo     ExpiresByType font/woff "access plus 1 year"
echo     ExpiresByType font/woff2 "access plus 1 year"
echo ^</IfModule^>
echo.
echo # Rewrite para SPA ^(Single Page Application^)
echo ^<IfModule mod_rewrite.c^>
echo     RewriteEngine On
echo     RewriteBase /
echo.    
echo     # Manejar archivos estáticos
echo     RewriteCond %%{REQUEST_FILENAME} !-f
echo     RewriteCond %%{REQUEST_FILENAME} !-d
echo     RewriteCond %%{REQUEST_URI} !^^/api/
echo     RewriteCond %%{REQUEST_URI} !^^/_expo/
echo     RewriteCond %%{REQUEST_URI} !^^/assets/
echo.    
echo     # Redirigir todo a index.html para routing del lado del cliente
echo     RewriteRule . /index.html [L]
echo ^</IfModule^>
echo.
echo # Seguridad básica
echo ^<IfModule mod_headers.c^>
echo     Header always set X-Content-Type-Options nosniff
echo     Header always set X-Frame-Options SAMEORIGIN
echo     Header always set X-XSS-Protection "1; mode=block"
echo     Header always set Referrer-Policy "strict-origin-when-cross-origin"
echo ^</IfModule^>
) > build\.htaccess

echo ✅ Archivo .htaccess creado

REM Crear archivo de información del build
echo 📊 Creando información del build...
(
echo {
echo   "buildDate": "%date% %time%",
echo   "platform": "web",
echo   "environment": "production",
echo   "buildTool": "expo",
echo   "features": [
echo     "WebRTC P2P Sync",
echo     "Offline Storage",
echo     "Real-time Transcription",
echo     "Cross-platform"
echo   ]
echo }
) > build\build-info.json

REM Crear archivo ZIP para fácil upload
echo 📦 Creando archivo ZIP para deployment...
powershell -command "Compress-Archive -Path 'build\*' -DestinationPath 'radiology-app-build.zip' -Force"

echo ✅ Archivo ZIP creado: radiology-app-build.zip

REM Instrucciones finales
echo.
echo 🎉 Build completado exitosamente!
echo.
echo 📋 Próximos pasos para deployment en Hostinger:
echo.
echo 1. 📁 Opción 1 - File Manager:
echo    • Accede al File Manager de Hostinger
echo    • Ve a public_html ^(o carpeta de tu dominio^)
echo    • Sube el archivo radiology-app-build.zip
echo    • Extrae el contenido en public_html
echo.
echo 2. 🔄 Opción 2 - FTP:
echo    • Usa FileZilla o similar
echo    • Sube todo el contenido de ./build/ a public_html/
echo.
echo 3. 🌐 Configurar servidor de señalización:
echo    • Sube server/signaling-server.js a tu servidor
echo    • Ejecuta: node signaling-server.js
echo    • Actualiza la URL en la app: ws://tu-dominio:8080
echo.
echo 4. ✅ Verificar deployment:
echo    • Visita tu dominio
echo    • Verifica que la app carga correctamente
echo    • Prueba la sincronización WebRTC
echo.
echo 📊 Características incluidas:
echo    ✅ Sincronización P2P WebRTC
echo    ✅ Almacenamiento offline
echo    ✅ Transcripción en tiempo real
echo    ✅ Respaldo e importación de datos
echo    ✅ Interfaz responsive
echo    ✅ PWA ready
echo.
echo 💡 Costos estimados:
echo    • Hostinger: ~$3-5/mes
echo    • Dominio: ~$10-15/año
echo    • Total: ~$50-75/año
echo.
echo 🔗 URLs importantes:
echo    • App: https://tu-dominio.com
echo    • Signaling: ws://tu-dominio.com:8080
echo    • Status: http://tu-dominio.com:8080/status

pause