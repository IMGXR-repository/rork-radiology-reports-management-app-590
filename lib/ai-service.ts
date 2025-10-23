interface Message {
  role: 'user' | 'assistant';
  content: string;
}

interface GenerateTextOptions {
  messages: Message[];
  onStream?: (text: string) => void;
}

export class AIService {
  private provider: string;
  private apiKey: string;

  constructor() {
    this.provider = process.env.EXPO_PUBLIC_AI_PROVIDER || 'rork';
    
    switch (this.provider) {
      case 'openai':
        this.apiKey = process.env.EXPO_PUBLIC_OPENAI_API_KEY || '';
        break;
      case 'groq':
        this.apiKey = process.env.EXPO_PUBLIC_GROQ_API_KEY || '';
        break;
      case 'gemini':
        this.apiKey = process.env.EXPO_PUBLIC_GEMINI_API_KEY || '';
        break;
      default:
        this.apiKey = '';
    }
  }

  async generateText(options: GenerateTextOptions): Promise<string> {
    console.log('🤖 [AI Service] Provider:', this.provider);
    console.log('🤖 [AI Service] Messages:', options.messages.length);
    
    switch (this.provider) {
      case 'openai':
        return this.generateWithOpenAI(options);
      case 'groq':
        return this.generateWithGroq(options);
      case 'gemini':
        return this.generateWithGemini(options);
      case 'rork':
      default:
        return this.generateWithRork(options);
    }
  }

  private async generateWithOpenAI(options: GenerateTextOptions): Promise<string> {
    if (!this.apiKey) {
      throw new Error('OpenAI API key no configurada. Agrega EXPO_PUBLIC_OPENAI_API_KEY en tu archivo .env');
    }

    console.log('🔑 [OpenAI] Generando con OpenAI...');
    
    try {
      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.apiKey}`,
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

  private async generateWithGroq(options: GenerateTextOptions): Promise<string> {
    if (!this.apiKey) {
      throw new Error('Groq API key no configurada. Agrega EXPO_PUBLIC_GROQ_API_KEY en tu archivo .env');
    }

    console.log('🚀 [Groq] Generando con Groq...');
    
    try {
      const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.apiKey}`,
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

  private async generateWithGemini(options: GenerateTextOptions): Promise<string> {
    if (!this.apiKey) {
      throw new Error('Gemini API key no configurada. Agrega EXPO_PUBLIC_GEMINI_API_KEY en tu archivo .env');
    }

    console.log('💎 [Gemini] Generando con Gemini...');
    
    try {
      const prompt = options.messages.map(m => m.content).join('\n\n');
      
      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${this.apiKey}`,
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

      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          messages: options.messages,
        }),
      });

      console.log('📥 [Rork] Status:', response.status);
      console.log('📥 [Rork] Content-Type:', response.headers.get('Content-Type'));

      if (!response.ok) {
        const errorText = await response.text();
        console.error('❌ [Rork] Error:', errorText.substring(0, 200));
        console.error('❌ [Rork] Full status:', response.status, response.statusText);
        throw new Error(`Rork Error (${response.status}): ${errorText.substring(0, 200)}`);
      }

      const contentType = response.headers.get('Content-Type') || '';
      
      // Validar que la respuesta es del tipo correcto (no HTML)
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
                const jsonStr = line.substring(2);
                
                // Validar que el string parece JSON antes de parsear
                if (!jsonStr.trim().startsWith('{') && !jsonStr.trim().startsWith('[')) {
                  console.warn('⚠️ [Rork] Línea no parece JSON:', jsonStr.substring(0, 50));
                  continue;
                }
                
                const data = JSON.parse(jsonStr);
                if (data.type === 'text-delta' && data.textDelta) {
                  accumulatedText += data.textDelta;
                  if (options.onStream) {
                    options.onStream(data.textDelta);
                  }
                }
              } catch (e) {
                console.warn('⚠️ [Rork] Error parseando chunk:', line.substring(0, 50), e);
              }
            }
          }
        }
      } catch (streamError: any) {
        console.error('❌ [Rork] Error leyendo stream:', streamError);
        console.error('❌ [Rork] Error type:', streamError?.name);
        console.error('❌ [Rork] Error message:', streamError?.message);
        
        // Detectar errores específicos de base64/encoding
        if (streamError?.name === 'DOMException' || streamError?.message?.includes('did not match the expected pattern')) {
          throw new Error('El servidor devolvió datos inválidos. El servicio puede estar experimentando problemas. Por favor, intenta de nuevo en unos minutos.');
        }
        
        throw new Error('Error al leer la respuesta del servidor');
      }

      if (!accumulatedText) {
        throw new Error('No se recibió contenido del servidor');
      }

      return accumulatedText.trim();
    } catch (error) {
      console.error('❌ [Rork] Error:', error);
      throw error;
    }
  }
}

export const aiService = new AIService();
