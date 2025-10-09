# Configuración de Build Estático para Hosting Independiente

Este archivo contiene las configuraciones necesarias para generar un build estático de tu aplicación React Native Web que puedes hospedar en cualquier servidor web, incluyendo Hostinger.

## Scripts de Build

### 1. Script de Build para Web (package.json)

```json
{
  "scripts": {
    "web": "expo start --web",
    "web:build": "expo export --platform web",
    "web:serve": "npx serve dist",
    "build:static": "expo export --platform web --output-dir build --clear",
    "deploy:prepare": "npm run build:static && npm run optimize:assets"
  }
}
```

### 2. Configuración de Expo (app.json)

```json
{
  "expo": {
    "web": {
      "bundler": "metro",
      "output": "static",
      "favicon": "./assets/images/favicon.png"
    }
  }
}
```

## Configuración para Hostinger

### 1. Estructura de archivos después del build

```
build/
├── _expo/
│   └── static/
│       ├── js/
│       ├── css/
│       └── media/
├── assets/
├── index.html
├── manifest.json
└── service-worker.js
```

### 2. Archivo .htaccess para Apache (Hostinger)

```apache
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
</IfModule>

# Rewrite para SPA (Single Page Application)
<IfModule mod_rewrite.c>
    RewriteEngine On
    RewriteBase /
    
    # Manejar archivos estáticos
    RewriteCond %{REQUEST_FILENAME} !-f
    RewriteCond %{REQUEST_FILENAME} !-d
    RewriteCond %{REQUEST_URI} !^/api/
    
    # Redirigir todo a index.html para routing del lado del cliente
    RewriteRule . /index.html [L]
</IfModule>

# Seguridad básica
<IfModule mod_headers.c>
    Header always set X-Content-Type-Options nosniff
    Header always set X-Frame-Options DENY
    Header always set X-XSS-Protection "1; mode=block"
</IfModule>
```

### 3. Configuración de Metro (metro.config.js)

```javascript
const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

// Configuración para web build
config.resolver.platforms = ['web', 'native', 'ios', 'android'];

// Optimizaciones para producción
if (process.env.NODE_ENV === 'production') {
  config.transformer.minifierConfig = {
    keep_fnames: true,
    mangle: {
      keep_fnames: true,
    },
  };
}

module.exports = config;
```

## Proceso de Deployment

### 1. Build local

```bash
# Instalar dependencias
npm install

# Generar build estático
npm run build:static

# El build se genera en la carpeta 'build/'
```

### 2. Subir a Hostinger

1. **Via File Manager:**
   - Accede al File Manager de Hostinger
   - Ve a la carpeta `public_html` (o la carpeta de tu dominio)
   - Sube todo el contenido de la carpeta `build/`
   - Asegúrate de subir también el archivo `.htaccess`

2. **Via FTP:**
   ```bash
   # Usando FileZilla o similar
   # Conectar a tu servidor FTP de Hostinger
   # Subir contenido de build/ a public_html/
   ```

### 3. Configurar dominio

1. En el panel de Hostinger, ve a "Dominios"
2. Apunta tu dominio a la carpeta donde subiste los archivos
3. Habilita HTTPS si está disponible

## Automatización con GitHub Actions

### 1. Workflow de GitHub (.github/workflows/deploy.yml)

```yaml
name: Build and Deploy to Hostinger

on:
  push:
    branches: [ main ]

jobs:
  build-and-deploy:
    runs-on: ubuntu-latest
    
    steps:
    - uses: actions/checkout@v3
    
    - name: Setup Node.js
      uses: actions/setup-node@v3
      with:
        node-version: '18'
        cache: 'npm'
    
    - name: Install dependencies
      run: npm ci
    
    - name: Build for web
      run: npm run build:static
    
    - name: Deploy to server via FTP
      uses: SamKirkland/FTP-Deploy-Action@4.3.3
      with:
        server: ${{ secrets.FTP_SERVER }}
        username: ${{ secrets.FTP_USERNAME }}
        password: ${{ secrets.FTP_PASSWORD }}
        local-dir: ./build/
        server-dir: /public_html/
```

### 2. Variables de entorno en GitHub

En tu repositorio de GitHub, ve a Settings > Secrets and variables > Actions:

```
FTP_SERVER=tu-servidor-hostinger.com
FTP_USERNAME=tu-usuario-ftp
FTP_PASSWORD=tu-contraseña-ftp
```

## Optimizaciones

### 1. Compresión de assets

```bash
# Instalar herramientas de optimización
npm install --save-dev imagemin imagemin-pngquant imagemin-mozjpeg

# Script de optimización
npm run optimize:assets
```

### 2. Service Worker para cache

El build de Expo incluye automáticamente un service worker para cache offline.

### 3. Análisis de bundle

```bash
# Analizar el tamaño del bundle
npx expo export --platform web --analyze
```

## Troubleshooting

### 1. Rutas no funcionan

- Asegúrate de que el archivo `.htaccess` esté en la raíz
- Verifica que mod_rewrite esté habilitado en tu hosting

### 2. Assets no cargan

- Verifica las rutas en `app.json`
- Asegúrate de que los assets estén en la carpeta correcta

### 3. Aplicación no carga

- Revisa la consola del navegador para errores
- Verifica que todos los archivos se hayan subido correctamente

## Monitoreo

### 1. Google Analytics

Agrega Google Analytics a tu `index.html` generado:

```html
<!-- Google Analytics -->
<script async src="https://www.googletagmanager.com/gtag/js?id=GA_MEASUREMENT_ID"></script>
<script>
  window.dataLayer = window.dataLayer || [];
  function gtag(){dataLayer.push(arguments);}
  gtag('js', new Date());
  gtag('config', 'GA_MEASUREMENT_ID');
</script>
```

### 2. Error tracking

Considera usar Sentry para tracking de errores en producción.

## Costos

- **Hostinger**: Desde $2.99/mes (hosting compartido)
- **Dominio**: ~$10-15/año
- **SSL**: Gratis con Let's Encrypt (incluido en Hostinger)
- **Total**: ~$50-60/año

## Ventajas de esta solución

✅ **Completamente independiente** - No dependes de servicios externos
✅ **Bajo costo** - Solo pagas hosting básico
✅ **Control total** - Tienes acceso completo a tu servidor
✅ **Escalable** - Puedes migrar a servidores más potentes cuando necesites
✅ **Backup fácil** - Puedes hacer backup de todos tus archivos
✅ **Sin límites de tráfico** - Depende de tu plan de hosting
✅ **WebRTC P2P** - Sincronización directa entre dispositivos sin servidor intermedio