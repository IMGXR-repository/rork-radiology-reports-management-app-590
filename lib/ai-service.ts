import { generateText } from "@rork/toolkit-sdk";

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

interface GenerateTextOptions {
  messages: Message[];
  onStream?: (text: string) => void;
}

export class AIService {
  async generateText(options: GenerateTextOptions): Promise<string> {
    console.log('🤖 [AI Service RORK] Generando texto...');
    console.log('📝 [AI Service RORK] Mensajes:', options.messages.length);
    
    try {
      const result = await generateText({
        messages: options.messages,
      });
      
      console.log('✅ [AI Service RORK] Texto generado exitosamente');
      console.log('📊 [AI Service RORK] Longitud:', result.length);
      
      if (options.onStream && result) {
        options.onStream(result);
      }
      
      return result;
    } catch (error) {
      console.error('❌ [AI Service RORK] Error:', error);
      
      let errorMessage = 'Error al comunicarse con el servicio de IA';
      
      if (error instanceof Error) {
        errorMessage = error.message;
      }
      
      throw new Error(errorMessage);
    }
  }
}

export const aiService = new AIService();
