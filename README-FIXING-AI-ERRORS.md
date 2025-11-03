# Solución de Errores de IA (Error 500)

## ¿Por qué estoy viendo un error 500?

El error 500 (Internal Server Error) significa que el servidor de IA Rork está experimentando problemas técnicos temporales. Esto puede ocurrir por:

1. **Mantenimiento del servidor**: El servidor puede estar siendo actualizado
2. **Alta carga**: Demasiadas solicitudes al mismo tiempo
3. **Problemas técnicos**: Problemas temporales en la infraestructura

## Soluciones

### Opción 1: Esperar y Reintentar (Recomendado)

El servidor de Rork AI usualmente se recupera en pocos minutos. Simplemente:
1. Espera 2-5 minutos
2. Intenta generar el informe de nuevo
3. Si el problema persiste, pasa a la Opción 2

### Opción 2: Usar un Proveedor de IA Alternativo

La aplicación soporta múltiples proveedores de IA. Puedes cambiar temporalmente a otro proveedor:

#### **A. Usar Groq (Recomendado - Rápido y Gratuito)**

1. Visita: https://console.groq.com/keys
2. Crea una cuenta gratuita
3. Genera una API key
4. Abre el archivo `.env` en la raíz del proyecto
5. Descomenta y configura:
   ```env
   EXPO_PUBLIC_AI_PROVIDER=groq
   EXPO_PUBLIC_GROQ_API_KEY=gsk_tu_api_key_aqui
   ```
6. Reinicia el servidor: `bun expo start`

#### **B. Usar OpenAI (Requiere pago)**

1. Visita: https://platform.openai.com/api-keys
2. Crea una cuenta y agrega créditos
3. Genera una API key
4. Abre el archivo `.env`
5. Descomenta y configura:
   ```env
   EXPO_PUBLIC_AI_PROVIDER=openai
   EXPO_PUBLIC_OPENAI_API_KEY=sk-tu_api_key_aqui
   ```
6. Reinicia el servidor: `bun expo start`

#### **C. Usar Gemini (Gratis con límites)**

1. Visita: https://aistudio.google.com/app/apikey
2. Crea una cuenta de Google Cloud
3. Genera una API key
4. Abre el archivo `.env`
5. Descomenta y configura:
   ```env
   EXPO_PUBLIC_AI_PROVIDER=gemini
   EXPO_PUBLIC_GEMINI_API_KEY=AIza_tu_api_key_aqui
   ```
6. Reinicia el servidor: `bun expo start`

### Opción 3: Volver a Rork AI

Una vez que el servidor de Rork se recupere, puedes volver a usarlo:

1. Abre el archivo `.env`
2. Asegúrate que esté configurado así:
   ```env
   EXPO_PUBLIC_AI_PROVIDER=rork
   EXPO_PUBLIC_TOOLKIT_URL=https://toolkit.rork.com
   ```
3. Comenta (agrega `#` al inicio) cualquier otra configuración de API
4. Reinicia el servidor: `bun expo start`

## Verificación de Configuración

Para verificar qué proveedor está usando actualmente:

1. Abre la consola del navegador (F12)
2. Intenta generar un informe
3. Busca en los logs: `[AI Service] Provider seleccionado: ...`
4. Deberías ver el proveedor que configuraste (rork, openai, groq, o gemini)

## Preguntas Frecuentes

### ¿Por qué Rork AI no funciona?

El servicio es gratuito y compartido, por lo que ocasionalmente puede experimentar problemas. Los proveedores alternativos son más estables pero requieren API keys.

### ¿Cuál proveedor es mejor?

- **Rork**: Gratuito, no requiere configuración, pero puede tener downtime ocasional
- **Groq**: Muy rápido, gratuito con límites generosos
- **OpenAI**: Más estable, pero requiere pago
- **Gemini**: Gratuito con límites, buena calidad

### ¿Se pierde mi configuración si cambio de proveedor?

No, todos tus informes, frases y configuraciones están guardadas localmente. Solo cambia el servicio de IA usado para generar nuevos contenidos.

### ¿Puedo usar diferentes proveedores al mismo tiempo?

No, solo puedes usar un proveedor a la vez. Sin embargo, la aplicación intentará usar Rork como fallback si el proveedor configurado falla.

## Soporte

Si los problemas persisten después de probar todas las opciones:

1. Verifica tu conexión a internet
2. Revisa los logs de la consola para más detalles
3. Intenta con un texto más corto
4. Reinicia completamente la aplicación

## Notas de Desarrollo

- Los errores 500 son manejados automáticamente con mensajes descriptivos
- El sistema incluye timeouts de 60 segundos para evitar esperas infinitas
- Todos los proveedores usan el mismo formato de mensajes internamente
