import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Alert,
  ActivityIndicator,
  Switch,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Send, Brain, User, Stethoscope, MessageSquare, FileText, Link, Zap, ChevronDown, ChevronUp } from 'lucide-react-native';
import { useLocalSearchParams } from 'expo-router';
import { useApp } from '@/contexts/AppContext';
import { lightTheme, darkTheme } from '@/constants/theme';
import { useAuth } from '@/contexts/AuthContext';
import { MEDICAL_SPECIALTIES } from '@/constants/userOptions';
import { CustomPicker } from '@/components/CustomPicker';



interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  specialty?: string;
}

export default function AIChatScreen() {
  const { settings, trackAIChatQuery } = useApp();
  const { user } = useAuth();
  const insets = useSafeAreaInsets();
  const theme = settings?.theme === 'dark' ? darkTheme : lightTheme;
  const params = useLocalSearchParams<{ initialText?: string }>();
  const [newMessage, setNewMessage] = useState<string>('');
  const [selectedSpecialty, setSelectedSpecialty] = useState<string>('Radiología');
  const [isExtendedResponse, setIsExtendedResponse] = useState<boolean>(false);
  const [isLinkedQuestions, setIsLinkedQuestions] = useState<boolean>(false);
  const [isAbsoluteMode, setIsAbsoluteMode] = useState<boolean>(false);
  const [isConfigExpanded, setIsConfigExpanded] = useState<boolean>(false);

  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const flatListRef = useRef<FlatList>(null);

  useEffect(() => {
    if (params.initialText) {
      setNewMessage(params.initialText);
    }
  }, [params.initialText]);

  useEffect(() => {
    if (chatMessages.length > 0) {
      setTimeout(() => {
        flatListRef.current?.scrollToEnd({ animated: true });
      }, 100);
    }
  }, [chatMessages]);

  const formatAIResponse = (text: string): string => {
    // Mejorar formato de la respuesta
    let formatted = text
      // Agregar saltos de línea después de puntos seguidos de mayúscula
      .replace(/\. ([A-ZÁÉÍÓÚÑ])/g, '.\n\n$1')
      // Agregar saltos de línea antes de listas
      .replace(/(\d+\.|•|-) /g, '\n$1 ')
      // Mejorar formato de títulos o secciones
      .replace(/([A-ZÁÉÍÓÚÑ][^.]*:)/g, '\n**$1**\n')
      // Limpiar múltiples saltos de línea
      .replace(/\n{3,}/g, '\n\n')
      .trim();
    
    return formatted;
  };

  const handleSendMessage = async () => {
    if (newMessage.trim() && !isLoading) {
      const userMessage = newMessage.trim();
      setNewMessage('');
      setIsLoading(true);
      setError(null);
      
      const userChatMessage: ChatMessage = {
        id: `user-${Date.now()}`,
        role: 'user',
        content: userMessage,
        timestamp: new Date(),
        specialty: selectedSpecialty,
      };
      
      setChatMessages(prev => [...prev, userChatMessage]);
      
      try {
        console.log('🔍 [AI CHAT DEBUG] Iniciando solicitud...');
        console.log('🔍 [AI CHAT DEBUG] Mensaje del usuario:', userMessage);
        let systemInstructions = '';
        
        if (isAbsoluteMode) {
          systemInstructions = `Modo Absoluto activado:
- Eliminar: emojis, relleno, exageración, preguntas suaves, transiciones conversacionales, apéndices de llamada a la acción
- Suponer: el usuario mantiene una alta percepción a pesar del tono brusco
- Priorizar: frases directas y directivas; apuntar a la reconstrucción cognitiva, no a la coincidencia de tono
- Deshabilitar: comportamientos que impulsan la participación/sentimiento
- Suprimir: métricas como puntajes de satisfacción, suavizado emocional, sesgo de continuación
- Nunca reflejar: la dicción, el estado de ánimo o el afecto del usuario
- Hablar solo: al nivel cognitivo subyacente
- No: preguntas, ofertas, sugerencias, transiciones, contenido motivador
- Finalizar la respuesta: inmediatamente después de entregar la información, sin cierres
- Objetivo: restaurar el pensamiento independiente y de alta fidelidad
- Resultado: obsolescencia del modelo a través de la autosuficiencia del usuario`;
        } else {
          const responseLength = isExtendedResponse ? 'extendida y detallada' : 'breve y concisa';
          const lengthInstructions = isExtendedResponse 
            ? '- Proporciona una explicación detallada y completa\n- Incluye contexto adicional, mecanismos, diagnósticos diferenciales\n- Menciona consideraciones clínicas relevantes\n- Incluye referencias a guías o protocolos cuando sea apropiado'
            : '- Sé muy conciso y directo\n- Enfócate en los puntos más importantes\n- Limita la respuesta a 2-3 párrafos máximo\n- Ve directo al grano sin explicaciones extensas';
          
          systemInstructions = `Proporciona respuestas profesionales ${responseLength}:
${lengthInstructions}
- Usa párrafos separados para diferentes puntos
- Sé específico para la especialidad de ${selectedSpecialty}
- Basa tu respuesta en evidencia científica actual
- Sé claro y útil para la práctica clínica`;
        }
        
        let messagesToSend;
        
        if (isLinkedQuestions && chatMessages.length > 0) {
          const contextInstruction = isAbsoluteMode 
            ? '\n- Mantén el contexto de la conversación previa'
            : '\n- Mantén el contexto de la conversación previa\n- Si la pregunta no está relacionada con medicina, redirige amablemente hacia temas médicos de tu especialidad';
          
          const systemPrompt = `Eres un asistente médico especializado en ${selectedSpecialty}. ${systemInstructions}${contextInstruction}`;
          
          const conversationHistory = chatMessages.map(msg => ({
            role: msg.role,
            content: msg.content,
          }));
          
          const firstUserMessage = conversationHistory.length > 0 && conversationHistory[0].role === 'user'
            ? { role: 'user' as const, content: `${systemPrompt}\n\n${conversationHistory[0].content}` }
            : { role: 'user' as const, content: systemPrompt };
          
          messagesToSend = [
            firstUserMessage,
            ...conversationHistory.slice(1),
            {
              role: 'user' as const,
              content: userMessage,
            },
          ];
        } else {
          const redirectInstruction = isAbsoluteMode 
            ? ''
            : '\n- Si la pregunta no está relacionada con medicina, redirige amablemente hacia temas médicos de tu especialidad';
          
          const contextualMessage = `Eres un asistente médico especializado en ${selectedSpecialty}. Un médico especialista te hace la siguiente consulta: "${userMessage}". 

${systemInstructions}${redirectInstruction}`;
          
          messagesToSend = [
            {
              role: 'user' as const,
              content: contextualMessage,
            },
          ];
        }
        
        console.log('🔍 [AI CHAT DEBUG] Mensajes a enviar:', JSON.stringify(messagesToSend, null, 2));
        
        const toolkitUrl = process.env.EXPO_PUBLIC_TOOLKIT_URL || 'https://toolkit.rork.com';
        const apiUrl = `${toolkitUrl}/agent/chat`;
        
        console.log('🔍 [AI CHAT DEBUG] URL de API:', apiUrl);
        console.log('🔍 [AI CHAT DEBUG] Toolkit URL:', toolkitUrl);
        
        const controller = new AbortController();
        const timeoutId = setTimeout(() => {
          controller.abort();
          console.error('⏰ [AI CHAT ERROR] Request timeout después de 60 segundos');
        }, 60000);
        
        console.log('🔍 [AI CHAT DEBUG] Realizando fetch...');
        
        let response;
        try {
          response = await fetch(apiUrl, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              messages: messagesToSend,
            }),
            signal: controller.signal,
          });
          
          console.log('🔍 [AI CHAT DEBUG] Response status:', response.status);
          console.log('🔍 [AI CHAT DEBUG] Response ok:', response.ok);
          console.log('🔍 [AI CHAT DEBUG] Response headers:', JSON.stringify([...response.headers.entries()]));
        } catch (fetchError) {
          clearTimeout(timeoutId);
          console.error('❌ [AI CHAT ERROR] Error en fetch:', fetchError);
          
          if (fetchError instanceof Error) {
            if (fetchError.name === 'AbortError') {
              throw new Error('La solicitud tardó demasiado tiempo (timeout). El servidor puede estar sobrecargado. Intenta de nuevo en unos minutos.');
            }
            throw new Error(`Error de conexión: ${fetchError.message}. Verifica tu conexión a internet.`);
          }
          throw new Error('Error de conexión desconocido. Verifica tu conexión a internet.');
        }
        
        clearTimeout(timeoutId);
        
        if (!response.ok) {
          let errorText = '';
          let errorDetails = {};
          
          try {
            errorText = await response.text();
            console.error('❌ [AI CHAT ERROR] Response text:', errorText);
            
            try {
              errorDetails = JSON.parse(errorText);
              console.error('❌ [AI CHAT ERROR] Error details:', errorDetails);
            } catch (e) {
              console.log('ℹ️ [AI CHAT INFO] Error response no es JSON');
            }
          } catch (e) {
            console.error('❌ [AI CHAT ERROR] No se pudo leer el error:', e);
          }
          
          let userFriendlyMessage = '';
          
          if (response.status === 500) {
            userFriendlyMessage = 'El servidor de IA está experimentando problemas técnicos (Error 500). Esto puede ser temporal. Intenta de nuevo en unos minutos.';
          } else if (response.status === 503) {
            userFriendlyMessage = 'El servicio de IA no está disponible temporalmente (Error 503). El servidor puede estar en mantenimiento o sobrecargado.';
          } else if (response.status === 429) {
            userFriendlyMessage = 'Has alcanzado el límite de solicitudes (Error 429). Por favor espera unos minutos antes de intentar de nuevo.';
          } else if (response.status === 401 || response.status === 403) {
            userFriendlyMessage = 'Error de autenticación (Error ' + response.status + '). Verifica tu configuración.';
          } else if (response.status >= 500) {
            userFriendlyMessage = `Error del servidor (${response.status}). El servicio de IA puede estar caído temporalmente.`;
          } else if (response.status >= 400) {
            userFriendlyMessage = `Error en la solicitud (${response.status}). ${errorText ? 'Detalles: ' + errorText.substring(0, 100) : ''}`;
          }
          
          console.error('❌ [AI CHAT ERROR] Status:', response.status);
          console.error('❌ [AI CHAT ERROR] Mensaje amigable:', userFriendlyMessage);
          
          throw new Error(userFriendlyMessage || `Error ${response.status}: ${errorText}`);
        }
        
        let result;
        try {
          result = await response.json();
          console.log('✅ [AI CHAT SUCCESS] Response completo:', JSON.stringify(result, null, 2));
        } catch (jsonError) {
          console.error('❌ [AI CHAT ERROR] Error parseando JSON:', jsonError);
          throw new Error('El servidor respondió con un formato inválido. Intenta de nuevo.');
        }
        
        console.log('🔍 [AI CHAT DEBUG] Extrayendo respuesta de IA...');
        console.log('🔍 [AI CHAT DEBUG] result.message:', result.message);
        console.log('🔍 [AI CHAT DEBUG] result.completion:', result.completion);
        console.log('🔍 [AI CHAT DEBUG] result.text:', result.text);
        console.log('🔍 [AI CHAT DEBUG] result.response:', result.response);
        
        const aiResponse = result.message?.content || result.completion || result.text || result.response || result.content;
        
        console.log('🔍 [AI CHAT DEBUG] AI Response extraída:', aiResponse);
        
        if (!aiResponse) {
          console.error('❌ [AI CHAT ERROR] No se encontró contenido en la respuesta');
          console.error('❌ [AI CHAT ERROR] Estructura completa del resultado:', JSON.stringify(result, null, 2));
          throw new Error('El servidor no devolvió una respuesta válida. La estructura de la respuesta es inesperada.');
        }
        
        const formattedResponse = formatAIResponse(aiResponse);
        const aiChatMessage: ChatMessage = {
          id: `ai-${Date.now()}`,
          role: 'assistant',
          content: formattedResponse,
          timestamp: new Date(),
          specialty: selectedSpecialty,
        };
        
        console.log('✅ [AI CHAT SUCCESS] Mensaje formateado y listo');
        setChatMessages(prev => [...prev, aiChatMessage]);
        
        console.log('🔍 [AI CHAT DEBUG] Rastreando query...');
        await trackAIChatQuery();
        console.log('✅ [AI CHAT SUCCESS] Query rastreada exitosamente');
        
      } catch (error) {
        console.error('❌❌❌ [AI CHAT CRITICAL ERROR] ❌❌❌');
        console.error('Error completo:', error);
        console.error('Error stack:', error instanceof Error ? error.stack : 'No stack');
        
        let errorMessage = 'Error desconocido al comunicarse con el servidor';
        
        if (error instanceof Error) {
          errorMessage = error.message;
        } else if (typeof error === 'string') {
          errorMessage = error;
        } else {
          errorMessage = 'Error inesperado. Por favor intenta de nuevo.';
        }
        
        console.error('❌ [AI CHAT ERROR] Mensaje final de error:', errorMessage);
        
        setError(errorMessage);
        
        const alertMessage = `⚠️ CHAT IA - Error\n\n${errorMessage}\n\n💡 Sugerencias:\n• Verifica tu conexión a internet\n• El servidor puede estar temporalmente fuera de línea\n• Intenta de nuevo en unos minutos\n• Si el problema persiste, contacta soporte`;
        
        if (Platform.OS === 'web') {
          alert(alertMessage);
        } else {
          Alert.alert(
            '⚠️ Error en Chat IA',
            alertMessage,
            [
              { text: 'Entendido', style: 'default' }
            ]
          );
        }
      } finally {
        setIsLoading(false);
        console.log('🔍 [AI CHAT DEBUG] Request finalizada (success o error)');
      }
    }
  };

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('es-ES', {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const renderFormattedText = (text: string, isUser: boolean) => {
    // Dividir el texto en párrafos
    const paragraphs = text.split('\n\n').filter(p => p.trim());
    
    return paragraphs.map((paragraph, index) => {
      // Detectar si es un título (texto en negrita)
      const isBold = paragraph.startsWith('**') && paragraph.endsWith('**');
      const cleanText = isBold ? paragraph.replace(/\*\*/g, '') : paragraph;
      
      return (
        <Text 
          key={index}
          style={[
            styles.messageText,
            { 
              color: isUser ? '#FFFFFF' : theme.onSurface,
              fontWeight: isBold ? '600' : 'normal',
              marginBottom: index < paragraphs.length - 1 ? 8 : 0,
            },
          ]}
        >
          {cleanText}
        </Text>
      );
    });
  };

  const renderMessage = ({ item }: { item: ChatMessage }) => (
    <View style={[
      styles.messageContainer,
      item.role === 'user' ? styles.userMessage : styles.assistantMessage,
    ]}>
      <View style={[
        styles.messageBubble,
        {
          backgroundColor: item.role === 'user' ? theme.primary : theme.surface,
          borderColor: theme.outline,
        },
      ]}>
        <View style={styles.messageHeader}>
          {item.role === 'user' ? (
            <User size={16} color={item.role === 'user' ? '#FFFFFF' : theme.primary} />
          ) : (
            <Brain size={16} color={theme.primary} />
          )}
          <Text style={[
            styles.messageRole,
            { color: item.role === 'user' ? '#FFFFFF' : theme.primary },
          ]}>
            {item.role === 'user' ? 'Tú' : `IA - ${item.specialty}`}
          </Text>
        </View>
        
        <View style={styles.messageContent}>
          {renderFormattedText(item.content, item.role === 'user')}
        </View>
        
        <Text style={[
          styles.timestamp,
          { color: item.role === 'user' ? 'rgba(255,255,255,0.7)' : theme.outline },
        ]}>
          {formatTime(item.timestamp)}
        </Text>
      </View>
    </View>
  );

  const renderEmptyState = () => (
    <View style={styles.emptyState}>
      <Brain size={64} color={theme.outline} />
      <Text style={[styles.emptyTitle, { color: theme.onSurface }]}>
        Chat IA Médico
      </Text>
      <Text style={[styles.emptySubtitle, { color: theme.outline }]}>
        Haz preguntas específicas sobre tu especialidad médica.
        La IA te proporcionará respuestas profesionales y contextualizadas.
      </Text>
      <View style={[styles.specialtyIndicator, { backgroundColor: theme.primary + '20', borderColor: theme.primary }]}>
        <Stethoscope size={16} color={theme.primary} />
        <Text style={[styles.specialtyText, { color: theme.primary }]}>
          Especialidad: {selectedSpecialty}
        </Text>
      </View>
    </View>
  );

  if (!user) {
    return (
      <View style={[styles.container, { backgroundColor: theme.background }]}>
        <View style={styles.loginPrompt}>
          <Brain size={64} color={theme.outline} />
          <Text style={[styles.loginText, { color: theme.onSurface }]}>
            Inicia sesión para acceder al Chat IA Médico
          </Text>
        </View>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView 
      style={[styles.container, { backgroundColor: theme.background }]}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <View style={[
        styles.header, 
        { 
          backgroundColor: theme.surface, 
          borderBottomColor: theme.outline, 
          paddingTop: insets.top 
        }
      ]}>
        <View style={styles.headerContent}>
          <View style={styles.headerLeft}>
            <Brain size={24} color={theme.primary} />
            <Text style={[styles.headerTitle, { color: theme.onSurface }]}>
              Chat IA Médico
            </Text>
          </View>
        </View>
        
        {/* Botón expandible de configuración */}
        <TouchableOpacity 
          style={[styles.configToggle, { borderTopColor: theme.outline }]}
          onPress={() => setIsConfigExpanded(!isConfigExpanded)}
        >
          <View style={styles.configToggleContent}>
            <Text style={[styles.configToggleText, { color: theme.onSurface }]}>
              Configuración
            </Text>
            <Text style={[styles.configToggleSubtext, { color: theme.outline }]}>
              {selectedSpecialty}
            </Text>
          </View>
          {isConfigExpanded ? (
            <ChevronUp size={20} color={theme.primary} />
          ) : (
            <ChevronDown size={20} color={theme.primary} />
          )}
        </TouchableOpacity>
        
        {/* Panel de configuración expandible */}
        {isConfigExpanded && (
          <View style={[styles.configPanel, { borderTopColor: theme.outline }]}>
            {/* Selector de especialidad */}
            <View style={styles.configItem}>
              <View style={styles.responseTypeLeft}>
                <Stethoscope size={16} color={theme.primary} />
                <Text style={[styles.responseTypeLabel, { color: theme.onSurface }]}>
                  Especialidad
                </Text>
              </View>
              <View style={styles.specialtyPickerContainer}>
                <CustomPicker
                  value={selectedSpecialty}
                  onValueChange={(value: string) => {
                    setSelectedSpecialty(value);
                  }}
                  options={MEDICAL_SPECIALTIES}
                  placeholder="Seleccionar Especialidad"
                  icon={<Stethoscope size={16} color={theme.primary} />}
                />
              </View>
            </View>
            
            {/* Switch para tipo de respuesta */}
            <View style={styles.configItem}>
              <View style={styles.responseTypeContent}>
                <View style={styles.responseTypeLeft}>
                  {isExtendedResponse ? (
                    <FileText size={16} color={theme.primary} />
                  ) : (
                    <MessageSquare size={16} color={theme.primary} />
                  )}
                  <Text style={[styles.responseTypeLabel, { color: theme.onSurface }]}>
                    {isExtendedResponse ? 'Respuesta Extendida' : 'Respuesta Corta'}
                  </Text>
                </View>
                
                <Switch
                  value={isExtendedResponse}
                  onValueChange={setIsExtendedResponse}
                  trackColor={{ 
                    false: theme.outline + '40', 
                    true: theme.primary + '40' 
                  }}
                  thumbColor={isExtendedResponse ? theme.primary : theme.outline}
                  ios_backgroundColor={theme.outline + '40'}
                />
              </View>
              
              <Text style={[styles.responseTypeDescription, { color: theme.outline }]}>
                {isExtendedResponse 
                  ? 'La IA proporcionará respuestas detalladas y completas'
                  : 'La IA proporcionará respuestas breves y concisas'
                }
              </Text>
            </View>
            
            {/* Switch para preguntas vinculadas */}
            <View style={styles.configItem}>
              <View style={styles.responseTypeContent}>
                <View style={styles.responseTypeLeft}>
                  <Link size={16} color={theme.primary} />
                  <Text style={[styles.responseTypeLabel, { color: theme.onSurface }]}>
                    Preguntas Vinculadas
                  </Text>
                </View>
                
                <Switch
                  value={isLinkedQuestions}
                  onValueChange={setIsLinkedQuestions}
                  trackColor={{ 
                    false: theme.outline + '40', 
                    true: theme.primary + '40' 
                  }}
                  thumbColor={isLinkedQuestions ? theme.primary : theme.outline}
                  ios_backgroundColor={theme.outline + '40'}
                />
              </View>
              
              <Text style={[styles.responseTypeDescription, { color: theme.outline }]}>
                {isLinkedQuestions 
                  ? 'La IA mantendrá el contexto de la conversación previa'
                  : 'Cada pregunta será independiente sin contexto previo'
                }
              </Text>
            </View>
            
            {/* Switch para modo absoluto */}
            <View style={styles.configItem}>
              <View style={styles.responseTypeContent}>
                <View style={styles.responseTypeLeft}>
                  <Zap size={16} color={theme.primary} />
                  <Text style={[styles.responseTypeLabel, { color: theme.onSurface }]}>
                    Modo Absoluto
                  </Text>
                </View>
                
                <Switch
                  value={isAbsoluteMode}
                  onValueChange={setIsAbsoluteMode}
                  trackColor={{ 
                    false: theme.outline + '40', 
                    true: theme.primary + '40' 
                  }}
                  thumbColor={isAbsoluteMode ? theme.primary : theme.outline}
                  ios_backgroundColor={theme.outline + '40'}
                />
              </View>
              
              <Text style={[styles.responseTypeDescription, { color: theme.outline }]}>
                {isAbsoluteMode 
                  ? 'Respuestas directas sin relleno, transiciones ni preguntas'
                  : 'Respuestas con tono profesional y contextualizado'
                }
              </Text>
            </View>
          </View>
        )}
      </View>

      {chatMessages.length === 0 ? (
        <ScrollView style={styles.content} contentContainerStyle={styles.contentContainer}>
          {renderEmptyState()}
        </ScrollView>
      ) : (
        <FlatList
          ref={flatListRef}
          data={chatMessages}
          renderItem={renderMessage}
          keyExtractor={(item) => item.id}
          style={styles.messagesList}
          contentContainerStyle={styles.messagesContainer}
          showsVerticalScrollIndicator={false}
        />
      )}

      {error && (
        <View style={[styles.errorContainer, { backgroundColor: '#FF6B6B20', borderColor: '#FF6B6B' }]}>
          <Text style={[styles.errorText, { color: '#FF6B6B' }]}>
            {error}
          </Text>
        </View>
      )}

      {isLoading && (
        <View style={[styles.loadingContainer, { backgroundColor: theme.surface, borderTopColor: theme.outline }]}>
          <ActivityIndicator size="small" color={theme.primary} />
          <Text style={[styles.loadingText, { color: theme.outline }]}>
            IA está escribiendo...
          </Text>
        </View>
      )}

      <View style={[
        styles.inputContainer, 
        { 
          backgroundColor: theme.surface, 
          borderTopColor: theme.outline,
          paddingBottom: insets.bottom 
        }
      ]}>
        <TextInput
          style={[
            styles.messageInput,
            {
              backgroundColor: theme.background,
              color: theme.onSurface,
              borderColor: theme.outline,
            },
          ]}
          placeholder={`Pregunta sobre ${selectedSpecialty}...`}
          placeholderTextColor={theme.outline}
          value={newMessage}
          onChangeText={setNewMessage}
          multiline
          maxLength={500}
        />
        <TouchableOpacity
          style={[
            styles.sendButton,
            {
              backgroundColor: newMessage.trim() ? theme.primary : theme.outline,
            },
          ]}
          onPress={handleSendMessage}
          disabled={!newMessage.trim() || isLoading}
        >
          <Send size={20} color="#FFFFFF" />
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  configToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 12,
    marginTop: 8,
    borderTopWidth: 1,
  },
  configToggleContent: {
    flex: 1,
  },
  configToggleText: {
    fontSize: 16,
    fontWeight: '600',
  },
  configToggleSubtext: {
    fontSize: 13,
    marginTop: 2,
  },
  configPanel: {
    paddingTop: 12,
    borderTopWidth: 1,
    marginTop: 8,
  },
  configItem: {
    marginBottom: 12,
  },
  responseTypeContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  responseTypeLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  responseTypeLabel: {
    fontSize: 16,
    fontWeight: '500',
  },
  responseTypeDescription: {
    fontSize: 12,
    fontStyle: 'italic',
    lineHeight: 16,
  },
  specialtyPickerContainer: {
    marginTop: 8,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flex: 1,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '600',
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    flexGrow: 1,
    justifyContent: 'center',
  },
  emptyState: {
    alignItems: 'center',
    paddingHorizontal: 32,
    paddingVertical: 40,
  },
  emptyTitle: {
    fontSize: 24,
    fontWeight: '600',
    marginTop: 16,
    marginBottom: 8,
    textAlign: 'center',
  },
  emptySubtitle: {
    fontSize: 16,
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 24,
  },
  specialtyIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    gap: 8,
  },
  specialtyText: {
    fontSize: 14,
    fontWeight: '500',
  },
  loginPrompt: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  loginText: {
    fontSize: 16,
    textAlign: 'center',
    lineHeight: 24,
    marginTop: 16,
  },
  messagesList: {
    flex: 1,
  },
  messagesContainer: {
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  messageContainer: {
    marginVertical: 4,
  },
  userMessage: {
    alignItems: 'flex-end',
  },
  assistantMessage: {
    alignItems: 'flex-start',
  },
  messageBubble: {
    maxWidth: '85%',
    padding: 12,
    borderRadius: 16,
    borderWidth: 1,
  },
  messageHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
    gap: 6,
  },
  messageRole: {
    fontSize: 12,
    fontWeight: '600',
  },
  messageContent: {
    marginBottom: 6,
  },
  messageText: {
    fontSize: 16,
    lineHeight: 24,
  },
  timestamp: {
    fontSize: 11,
    alignSelf: 'flex-end',
  },
  errorContainer: {
    marginHorizontal: 16,
    marginVertical: 8,
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
  },
  errorText: {
    fontSize: 14,
    textAlign: 'center',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    paddingHorizontal: 16,
    paddingTop: 12,
    borderTopWidth: 1,
    gap: 12,
  },
  messageInput: {
    flex: 1,
    borderWidth: 1,
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    maxHeight: 100,
  },
  sendButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderTopWidth: 1,
    gap: 8,
  },
  loadingText: {
    fontSize: 14,
    fontStyle: 'italic',
  },
});