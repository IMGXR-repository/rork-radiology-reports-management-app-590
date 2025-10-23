# Configuración de Proveedor de IA

Si el servidor de Rork no está respondiendo, puedes cambiar fácilmente a otro proveedor de IA. Esta app soporta múltiples opciones.

## 🚀 Opciones Disponibles

### 1. **OpenAI** (Recomendado - Más Estable)
- ✅ Más confiable y estable
- ✅ Alta calidad de respuestas médicas
- ❌ Requiere pago (aproximadamente $0.01 por solicitud)
- 📝 Modelo: GPT-4o

**Cómo obtener la API key:**
1. Ve a https://platform.openai.com/signup
2. Crea una cuenta
3. Ve a https://platform.openai.com/api-keys
4. Haz clic en "Create new secret key"
5. Copia la key (empieza con `sk-...`)

### 2. **Groq** (Gratis y Rápido)
- ✅ 100% GRATIS
- ✅ Muy rápido
- ✅ Buena calidad
- ✅ Sin necesidad de tarjeta de crédito
- 📝 Modelo: Llama 3.3 70B

**Cómo obtener la API key:**
1. Ve a https://console.groq.com
2. Crea una cuenta gratis
3. Ve a https://console.groq.com/keys
4. Haz clic en "Create API Key"
5. Copia la key (empieza con `gsk_...`)

### 3. **Google Gemini** (Gratis con Límites Generosos)
- ✅ GRATIS
- ✅ Buenos límites (60 requests/minuto)
- ✅ Buena calidad
- ✅ Sin necesidad de tarjeta de crédito
- 📝 Modelo: Gemini 2.0 Flash

**Cómo obtener la API key:**
1. Ve a https://aistudio.google.com/app/apikey
2. Inicia sesión con tu cuenta de Google
3. Haz clic en "Create API Key"
4. Copia la key

### 4. **Rork** (Por Defecto)
- ⚠️ Puede no estar disponible temporalmente
- ✅ Integrado por defecto
- ❌ Menos confiable actualmente

## ⚙️ Configuración Paso a Paso

### Paso 1: Edita el archivo `.env`

Abre el archivo `.env` en la raíz de tu proyecto y busca estas líneas:

```env
# AI Provider Configuration
EXPO_PUBLIC_AI_PROVIDER=openai
```

### Paso 2: Elige tu proveedor

Cambia el valor de `EXPO_PUBLIC_AI_PROVIDER` a una de estas opciones:
- `openai` - Para usar OpenAI
- `groq` - Para usar Groq (gratis)
- `gemini` - Para usar Google Gemini (gratis)
- `rork` - Para usar Rork (servidor original)

### Paso 3: Agrega tu API Key

Busca la sección del proveedor que elegiste y agrega tu API key:

**Para OpenAI:**
```env
EXPO_PUBLIC_OPENAI_API_KEY=sk-proj-xxxxxxxxxxxxx
```

**Para Groq:**
```env
EXPO_PUBLIC_GROQ_API_KEY=gsk_xxxxxxxxxxxxx
```

**Para Gemini:**
```env
EXPO_PUBLIC_GEMINI_API_KEY=AIzaSyxxxxxxxxxxxxx
```

### Paso 4: Reinicia la aplicación

```bash
# Detén la app (Ctrl+C) y vuélvela a iniciar
npm start
```

O si usas Expo:
```bash
npx expo start --clear
```

## 🎯 Ejemplo Completo

Aquí está un ejemplo de configuración usando **Groq (gratis)**:

```env
# AI Provider Configuration
EXPO_PUBLIC_AI_PROVIDER=groq

# Groq Configuration
EXPO_PUBLIC_GROQ_API_KEY=gsk_1234567890abcdefghijklmnopqrstuvwxyz
```

## 💡 Recomendaciones

1. **Para desarrollo/pruebas**: Usa **Groq** (gratis y rápido)
2. **Para producción**: Usa **OpenAI** (más estable y confiable)
3. **Para uso moderado**: Usa **Gemini** (gratis con límites generosos)

## 🔍 Verificación

Para verificar que está funcionando correctamente:

1. Inicia la app
2. Ve a la pantalla de Recording
3. Graba algo y genera un informe
4. Revisa la consola para ver logs como:
   ```
   🤖 [AI Service] Provider: groq
   📝 [RECORDING] Generando informe...
   ```

## ❓ Preguntas Frecuentes

**P: ¿Cuál es el mejor proveedor gratuito?**  
R: Groq es el más rápido y Gemini tiene mejores límites. Ambos son excelentes opciones gratuitas.

**P: ¿Puedo cambiar de proveedor en cualquier momento?**  
R: Sí, solo cambia el valor en `.env` y reinicia la app.

**P: ¿Necesito todas las API keys?**  
R: No, solo necesitas la API key del proveedor que elijas usar.

**P: ¿Los proveedores gratuitos tienen límites?**  
R: Sí:
- **Groq**: ~30 requests/minuto
- **Gemini**: 60 requests/minuto
- **OpenAI**: Pago por uso (sin límite específico)

**P: ¿Qué pasa si excedo los límites?**  
R: Recibirás un error temporal. Espera un minuto e intenta de nuevo, o cambia a otro proveedor.

## 🆘 Solución de Problemas

### Error: "API key no configurada"
- Verifica que agregaste la API key correcta en `.env`
- Asegúrate de que no haya espacios extra
- Reinicia la aplicación completamente

### Error: "401 Unauthorized"
- Tu API key es inválida o expiró
- Genera una nueva API key desde el sitio del proveedor

### Error: "429 Too Many Requests"
- Excediste el límite de requests
- Espera un minuto y vuelve a intentar
- O cambia a otro proveedor

### La app sigue usando Rork
- Verifica que guardaste el archivo `.env`
- Reinicia la app con `--clear`: `npx expo start --clear`
- Verifica en la consola qué proveedor se está usando

## 📝 Notas Importantes

1. **Nunca compartas tus API keys** - Son privadas y personales
2. **No subas el archivo `.env` a Git** - Ya está en `.gitignore`
3. **Mantén tus keys seguras** - Si alguien obtiene tu key, puede usarla y generarte costos
4. **Rota tus keys regularmente** - Por seguridad, genera nuevas keys cada cierto tiempo

## 🔐 Seguridad

El archivo `.env` está ignorado por Git automáticamente. Sin embargo:
- No compartas capturas de pantalla del archivo `.env`
- No copies y pegues el contenido en lugares públicos
- Si crees que tu key fue comprometida, genera una nueva inmediatamente

---

¿Necesitas más ayuda? Revisa la documentación oficial de cada proveedor:
- [OpenAI Docs](https://platform.openai.com/docs)
- [Groq Docs](https://console.groq.com/docs)
- [Gemini Docs](https://ai.google.dev/docs)
