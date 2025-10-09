# Despliegue de la App de Radiología en Netlify

## Pasos para crear el repositorio en GitHub y desplegar en Netlify:

### 1. Crear repositorio en GitHub
1. Ve a [GitHub](https://github.com) e inicia sesión
2. Haz clic en "New repository" (botón verde)
3. Nombre sugerido: `radiology-reports-app`
4. Descripción: `App de gestión de reportes radiológicos - ImagenX Radiology`
5. Marca como "Public" o "Private" según prefieras
6. NO marques "Add a README file" (ya tienes uno)
7. Haz clic en "Create repository"

### 2. Subir tu código a GitHub
Desde tu computadora, en la carpeta del proyecto:

```bash
git init
git add .
git commit -m "Initial commit - Radiology Reports App"
git branch -M main
git remote add origin https://github.com/TU_USUARIO/radiology-reports-app.git
git push -u origin main
```

### 3. Configurar Netlify
1. Ve a [Netlify](https://netlify.com) y crea una cuenta
2. Haz clic en "New site from Git"
3. Conecta con GitHub y selecciona tu repositorio
4. Configuración de build:
   - **Build command**: `npm run build`
   - **Publish directory**: `dist`
   - **Node version**: 18
5. Haz clic en "Deploy site"

### 4. Configurar dominio personalizado
1. En el dashboard de Netlify, ve a "Domain settings"
2. Haz clic en "Add custom domain"
3. Ingresa tu subdominio: `app.imagenxradiology.com`
4. Netlify te dará instrucciones para configurar el DNS

### 5. Configurar DNS en tu hosting
En el panel de control de tu dominio imagenxradiology.com:
1. Crea un registro CNAME:
   - **Name**: `app`
   - **Value**: `tu-sitio-netlify.netlify.app`

### 6. Variables de entorno (opcional)
Si necesitas configurar variables de entorno:
1. En Netlify, ve a "Site settings" > "Environment variables"
2. Agrega las variables que necesites

## URLs finales:
- **Repositorio GitHub**: `https://github.com/TU_USUARIO/radiology-reports-app`
- **App en Netlify**: `https://app.imagenxradiology.com`
- **URL temporal**: `https://tu-sitio-netlify.netlify.app`

## Actualizaciones automáticas:
Una vez configurado, cada vez que hagas cambios en RORK y los subas al repositorio de GitHub, Netlify automáticamente reconstruirá y desplegará la nueva versión de tu app.

## Comandos útiles:
- `npm run dev` - Desarrollo local
- `npm run build` - Construir para producción
- `npm run serve` - Servir build local

## Notas importantes:
- La app está optimizada para funcionar tanto en móvil como en web
- Todas las funcionalidades están adaptadas para React Native Web
- El diseño es responsive y se adapta a diferentes tamaños de pantalla