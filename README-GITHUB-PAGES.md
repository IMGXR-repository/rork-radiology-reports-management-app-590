# Despliegue en GitHub Pages

## Configuración inicial (solo una vez)

### 1. Sube tu código a GitHub
```bash
git init
git add .
git commit -m "Initial commit - Radiology Reports App"
git branch -M main
git remote add origin https://github.com/TU_USUARIO/radiology-reports-app.git
git push -u origin main
```

### 2. Activa GitHub Pages
1. Ve a tu repositorio en GitHub
2. Click en **Settings** (Configuración)
3. En el menú lateral, click en **Pages**
4. En **Source**, selecciona **GitHub Actions**
5. ¡Listo! El workflow se ejecutará automáticamente

## URLs de tu app

Después del primer despliegue, tu app estará disponible en:
- **URL de GitHub Pages**: `https://TU_USUARIO.github.io/radiology-reports-app/`

## Dominio personalizado (opcional)

Si quieres usar tu propio dominio (ej: `app.imagenxradiology.com`):

1. En GitHub Pages settings, agrega tu dominio personalizado
2. En tu proveedor de DNS, crea un registro CNAME:
   - **Name**: `app`
   - **Value**: `TU_USUARIO.github.io`

## Actualizaciones automáticas

Cada vez que hagas `git push` a la rama `main`, GitHub Pages:
1. Construirá automáticamente tu app
2. La desplegará en la URL de GitHub Pages
3. Todo sin intervención manual

## Ventajas de GitHub Pages

✅ **Gratis** - Hosting ilimitado  
✅ **Automático** - Se actualiza con cada push  
✅ **HTTPS** - Certificado SSL incluido  
✅ **Rápido** - CDN global de GitHub  
✅ **Simple** - Sin configuración adicional  

## Sincronización móvil-web

Una vez desplegada la app web en GitHub Pages:

1. **En la web** (PC/laptop):
   - Abre `https://TU_USUARIO.github.io/radiology-reports-app/`
   - Inicia sesión
   - Se mostrará un código QR

2. **En el móvil** (APK instalado):
   - Abre la app
   - Ve a la pestaña "Sincronización"
   - Escanea el QR de la pantalla web
   - ¡Listo! Ambos dispositivos estarán sincronizados

## Comandos útiles

```bash
# Ver cambios locales
git status

# Subir cambios
git add .
git commit -m "Descripción de cambios"
git push

# Ver historial
git log --oneline
```

## Notas importantes

- El servidor de señalización (signaling server) debe estar corriendo para la sincronización
- Los datos se almacenan localmente en cada dispositivo
- La sincronización es en tiempo real cuando ambos dispositivos están conectados
- Si un dispositivo está offline, se sincronizará cuando vuelva a conectarse
