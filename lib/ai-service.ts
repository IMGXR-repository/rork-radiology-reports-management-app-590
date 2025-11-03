interface Message {
  role: 'user' | 'assistant';
  content: string;
}

interface GenerateTextOptions {
  messages: Message[];
  onStream?: (text: string) => void;
  provider?: 'rork' | 'groq' | 'gemini' | 'openai';
}

export class AIService {
  private getApiKey(provider: string): string {
    console.log('🔑 [AI Service] Obteniendo API key para provider:', provider);
    console.log('🔑 [AI Service] EXPO_PUBLIC_GROQ_API_KEY:', process.env.EXPO_PUBLIC_GROQ_API_KEY ? 'Configurada' : 'NO configurada');
    console.log('🔑 [AI Service] EXPO_PUBLIC_GEMINI_API_KEY:', process.env.EXPO_PUBLIC_GEMINI_API_KEY ? 'Configurada' : 'NO configurada');
    console.log('🔑 [AI Service] EXPO_PUBLIC_OPENAI_API_KEY:', process.env.EXPO_PUBLIC_OPENAI_API_KEY ? 'Configurada' : 'NO configurada');
    
    switch (provider) {
      case 'openai':
        return process.env.EXPO_PUBLIC_OPENAI_API_KEY || '';
      case 'groq':
        return process.env.EXPO_PUBLIC_GROQ_API_KEY || '';
      case 'gemini':
        return process.env.EXPO_PUBLIC_GEMINI_API_KEY || '';
      default:
        return '';
    }
  }

  async generateText(options: GenerateTextOptions): Promise<string> {
    const provider = options.provider || 'rork';
    
    console.log('🤖 [AI Service] ===== GENERANDO TEXTO =====');
    console.log('🤖 [AI Service] Provider seleccionado:', provider);
    console.log('🤖 [AI Service] Provider desde options:', options.provider);
    console.log('🤖 [AI Service] Cantidad de mensajes:', options.messages.length);
    console.log('🤖 [AI Service] ================================');
    
    try {
      switch (provider) {
        case 'openai':
          return await this.generateWithOpenAI(options, provider);
        case 'groq':
          return await this.generateWithGroq(options, provider);
        case 'gemini':
          return await this.generateWithGemini(options, provider);
        case 'rork':
        default:
          return await this.generateWithRork(options);
      }
    } catch (error) {
      console.error('❌ [AI Service] Error en generateText:', error);
      
      // Si el provider seleccionado falla y es diferente de rork, intentar con rork como fallback
      if (provider !== 'rork' && !String(error).includes('API key no configurada')) {
        console.log('⚠️ [AI Service] Intentando fallback con RORK...');
        try {
          return await this.generateWithRork(options);
        } catch (fallbackError) {
          console.error('❌ [AI Service] Error en fallback RORK:', fallbackError);
          throw error; // Lanzar el error original, no el del fallback
        }
      }
      
      throw error;
    }
  }

  private async generateWithOpenAI(options: GenerateTextOptions, provider: string): Promise<string> {
    const apiKey = this.getApiKey(provider);
    if (!apiKey) {
      throw new Error('OpenAI API key no configurada. Agrega EXPO_PUBLIC_OPENAI_API_KEY en tu archivo .env');
    }

    console.log('🔑 [OpenAI] Generando con OpenAI...');
    
    try {
      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model: 'gpt-4o',
          messages: options.messages,
          temperature: 0.7,
          stream: !!options.onStream,
        }),
      });

      console.log('📥 [OpenAI] Status:', response.status);

      if (!response.ok) {
        const errorText = await response.text();
        console.error('❌ [OpenAI] Error:', errorText);
        throw new Error(`OpenAI Error (${response.status}): ${errorText}`);
      }

      if (options.onStream) {
        return await this.handleOpenAIStream(response, options.onStream);
      } else {
        const data = await response.json();
        return data.choices[0]?.message?.content || '';
      }
    } catch (error) {
      console.error('❌ [OpenAI] Error:', error);
      throw error;
    }
  }

  private async handleOpenAIStream(response: Response, onStream: (text: string) => void): Promise<string> {
    const reader = response.body?.getReader();
    if (!reader) {
      throw new Error('No se pudo obtener el lector de stream');
    }

    const decoder = new TextDecoder();
    let fullText = '';

    try {
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value, { stream: true });
        const lines = chunk.split('\n').filter(line => line.trim() !== '');

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const data = line.slice(6);
            if (data === '[DONE]') continue;

            try {
              const parsed = JSON.parse(data);
              const content = parsed.choices[0]?.delta?.content;
              if (content) {
                fullText += content;
                onStream(content);
              }
            } catch (e) {
              console.warn('⚠️ [OpenAI] Error parseando chunk:', e);
            }
          }
        }
      }
    } catch (error) {
      console.error('❌ [OpenAI] Error en stream:', error);
      throw error;
    }

    return fullText;
  }

  private async generateWithGroq(options: GenerateTextOptions, provider: string): Promise<string> {
    const apiKey = this.getApiKey(provider);
    if (!apiKey) {
      throw new Error('Groq API key no configurada. Agrega EXPO_PUBLIC_GROQ_API_KEY en tu archivo .env');
    }

    console.log('🚀 [Groq] Generando con Groq...');
    
    try {
      const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model: 'llama-3.3-70b-versatile',
          messages: options.messages,
          temperature: 0.7,
          stream: !!options.onStream,
        }),
      });

      console.log('📥 [Groq] Status:', response.status);

      if (!response.ok) {
        const errorText = await response.text();
        console.error('❌ [Groq] Error:', errorText);
        throw new Error(`Groq Error (${response.status}): ${errorText}`);
      }

      if (options.onStream) {
        return await this.handleOpenAIStream(response, options.onStream);
      } else {
        const data = await response.json();
        return data.choices[0]?.message?.content || '';
      }
    } catch (error) {
      console.error('❌ [Groq] Error:', error);
      throw error;
    }
  }

  private async generateWithGemini(options: GenerateTextOptions, provider: string): Promise<string> {
    const apiKey = this.getApiKey(provider);
    if (!apiKey) {
      throw new Error('Gemini API key no configurada. Agrega EXPO_PUBLIC_GEMINI_API_KEY en tu archivo .env');
    }

    console.log('💎 [Gemini] Generando con Gemini...');
    
    try {
      const prompt = options.messages.map(m => m.content).join('\n\n');
      
      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            contents: [
              {
                parts: [
                  {
                    text: prompt,
                  },
                ],
              },
            ],
            generationConfig: {
              temperature: 0.7,
              topK: 40,
              topP: 0.95,
              maxOutputTokens: 8192,
            },
          }),
        }
      );

      console.log('📥 [Gemini] Status:', response.status);

      if (!response.ok) {
        const errorText = await response.text();
        console.error('❌ [Gemini] Error:', errorText);
        throw new Error(`Gemini Error (${response.status}): ${errorText}`);
      }

      const data = await response.json();
      const text = data.candidates?.[0]?.content?.parts?.[0]?.text || '';
      
      if (options.onStream && text) {
        options.onStream(text);
      }
      
      return text;
    } catch (error) {
      console.error('❌ [Gemini] Error:', error);
      throw error;
    }
  }

  private async generateWithRork(options: GenerateTextOptions): Promise<string> {
    console.log('🎯 [Rork] Generando con Rork...');
    
    try {
      const toolkitUrl = (process.env.EXPO_PUBLIC_TOOLKIT_URL || 'https://toolkit.rork.com').trim();
      const apiUrl = `${toolkitUrl}/agent/chat`;
      
      console.log('🌐 [Rork] URL:', apiUrl);
      console.log('📝 [Rork] Mensaje:', options.messages[0]?.content?.substring(0, 100) + '...');

      // Add timeout to prevent hanging
      const controller = new AbortController();
      const timeoutId = setTimeout(() => {
        controller.abort();
        console.log('⏰ [Rork] Request timeout after 60 seconds');
      }, 60000);

      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          messages: options.messages,
        }),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      console.log('📥 [Rork] Status:', response.status);
      console.log('📥 [Rork] Content-Type:', response.headers.get('Content-Type'));

      if (!response.ok) {
        const errorText = await response.text();
        console.error('❌ [Rork] Error:', errorText.substring(0, 200));
        console.error('❌ [Rork] Full status:', response.status, response.statusText);
        
        // Better error messages based on status code
        let errorMessage = '';
        if (response.status === 500) {
          errorMessage = 'El servidor de IA Rork está experimentando problemas técnicos. Por favor, intenta de nuevo en unos minutos.';
        } else if (response.status === 502 || response.status === 503) {
          errorMessage = 'El servicio de IA Rork no está disponible temporalmente. Por favor, intenta de nuevo.';
        } else if (response.status === 429) {
          errorMessage = 'Demasiadas solicitudes. Por favor, espera un momento e intenta de nuevo.';
        } else if (response.status === 401 || response.status === 403) {
          errorMessage = 'Error de autenticación con el servicio de IA.';
        } else {
          errorMessage = `Error del servidor (${response.status}): ${errorText.substring(0, 100)}`;
        }
        
        throw new Error(errorMessage);
      }

      const contentType = response.headers.get('Content-Type') || '';
      
      if (contentType.includes('text/html') || contentType.includes('text/plain')) {
        const errorText = await response.text();
        console.error('❌ [Rork] Respuesta inesperada (HTML/Text):', errorText.substring(0, 200));
        throw new Error('El servidor devolvió una respuesta no válida. El servicio puede estar temporalmente no disponible.');
      }

      const reader = response.body?.getReader();
      if (!reader) {
        throw new Error('No se pudo leer la respuesta del servidor');
      }

      const decoder = new TextDecoder();
      let accumulatedText = '';

      try {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          const chunk = decoder.decode(value, { stream: true });
          const lines = chunk.split('\n');

          for (const line of lines) {
            if (line.trim() === '' || line.trim().length === 0) continue;
            
            if (line.startsWith('0:')) {
              try {
                const jsonStr = line.substring(2).trim();
                
                if (!jsonStr) continue;
                
                const firstChar = jsonStr.charAt(0);
                if (firstChar !== '{' && firstChar !== '[') {
                  console.warn('⚠️ [Rork] Línea no es JSON (no comienza con { o [):', jsonStr.substring(0, 100));
                  continue;
                }
                
                const lastChar = jsonStr.charAt(jsonStr.length - 1);
                if (lastChar !== '}' && lastChar !== ']') {
                  console.warn('⚠️ [Rork] Línea no es JSON completo (no termina con } o ]):', jsonStr.substring(0, 100));
                  continue;
                }
                
                let data;
                try {
                  data = JSON.parse(jsonStr);
                } catch (parseError: any) {
                  console.error('❌ [Rork] Error al parsear JSON:', {
                    error: parseError?.message,
                    line: jsonStr.substring(0, 200)
                  });
                  continue;
                }
                
                if (data && typeof data === 'object' && data.type === 'text-delta' && data.textDelta) {
                  accumulatedText += data.textDelta;
                  if (options.onStream) {
                    options.onStream(data.textDelta);
                  }
                }
              } catch (e: any) {
                console.warn('⚠️ [Rork] Error procesando línea:', {
                  error: e?.message,
                  line: line.substring(0, 100)
                });
              }
            }
          }
        }
      } catch (streamError: any) {
        console.error('❌ [Rork] Error leyendo stream:', streamError);
        console.error('❌ [Rork] Error type:', streamError?.name);
        console.error('❌ [Rork] Error message:', streamError?.message);
        
        if (streamError?.name === 'AbortError') {
          throw new Error('La solicitud tardó demasiado tiempo. El servidor puede estar sobrecargado. Por favor, intenta de nuevo.');
        } else if (streamError?.name === 'DOMException' || streamError?.message?.includes('did not match the expected pattern')) {
          throw new Error('El servidor devolvió datos inválidos. El servicio puede estar experimentando problemas. Por favor, intenta de nuevo en unos minutos.');
        }
        
        throw new Error('Error al leer la respuesta del servidor');
      }

      if (!accumulatedText) {
        throw new Error('No se recibió contenido del servidor');
      }

      console.log('✅ [Rork] Texto generado exitosamente. Longitud:', accumulatedText.length);
      return accumulatedText.trim();
    } catch (error) {
      console.error('❌ [Rork] Error:', error);
      throw error;
    }
  }
}

export const aiService = new AIService();
