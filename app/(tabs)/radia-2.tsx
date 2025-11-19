import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  Platform,
  Alert,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Mic, Square, Sparkles, FileText, ListChecks, Brain, Copy, ChevronDown, ChevronUp } from 'lucide-react-native';
import * as Clipboard from 'expo-clipboard';
import { useApp } from '@/contexts/AppContext';
import { useAuth } from '@/contexts/AuthContext';
import { lightTheme, darkTheme } from '@/constants/theme';
import { useAudioRecording } from '@/hooks/useAudioRecording';
import { aiService } from '@/lib/ai-service';

interface GeneratedSection {
  findings: string;
  conclusion: string;
  differentials: string;
}

export default function RadIA2Screen() {
  const { settings, reports, trackAIChatQuery } = useApp();
  const { user } = useAuth();
  const insets = useSafeAreaInsets();
  const theme = settings?.theme === 'dark' ? darkTheme : lightTheme;
  
  const [isGenerating, setIsGenerating] = useState<boolean>(false);
  const [generatedSections, setGeneratedSections] = useState<GeneratedSection>({
    findings: '',
    conclusion: '',
    differentials: '',
  });
  const [commandText, setCommandText] = useState<string>('');
  const [statusMessage, setStatusMessage] = useState<string>('');
  const [errorMessage, setErrorMessage] = useState<string>('');
  const [isInstructionsExpanded, setIsInstructionsExpanded] = useState<boolean>(false);
  
  const scrollViewRef = useRef<ScrollView>(null);
  
  const processVoiceCommands = (rawText: string): string => {
    console.log('🎤 Procesando comandos de voz:', rawText);
    return rawText;
  };
  
  const {
    recordingState,
    isTranscribing,
    startRecording,
    stopRecording,
  } = useAudioRecording({
    onTranscriptionComplete: async (text: string) => {
      console.log('✅ Transcripción completada:', text);
      setCommandText(text);
      await executeVoiceCommand(text);
    },
    onError: (error: string) => {
      console.error('❌ Error en grabación:', error);
      setErrorMessage(error);
      setTimeout(() => setErrorMessage(''), 5000);
    },
    processVoiceCommands,
  });
  
  const handleMicPress = async () => {
    if (recordingState.isRecording) {
      await stopRecording();
    } else {
      setErrorMessage('');
      setStatusMessage('');
      setGeneratedSections({
        findings: '',
        conclusion: '',
        differentials: '',
      });
      const started = await startRecording();
      if (started) {
        setStatusMessage('🎤 Grabando... Habla ahora');
      }
    }
  };
  
  const executeVoiceCommand = async (command: string) => {
    try {
      setIsGenerating(true);
      setStatusMessage('🔍 Buscando informes almacenados...');
      setErrorMessage('');
      
      console.log('🎯 Ejecutando comando:', command);
      
      const lowerCommand = command.toLowerCase();
      let selectedReport = null;
      
      for (const report of reports) {
        const reportTitle = report.title.toLowerCase();
        if (lowerCommand.includes(reportTitle) || 
            lowerCommand.includes(report.title.toLowerCase().split(' ')[0])) {
          selectedReport = report;
          break;
        }
      }
      
      let baseContent = '';
      let contextReports = '';
      
      if (reports.length > 0) {
        const relevantReports = reports
          .slice(0, 5)
          .map(r => `Título: ${r.title}\nContenido: ${r.content}\n---`)
          .join('\n\n');
        
        contextReports = `\n\nINFORMES ALMACENADOS PARA REFERENCIA:\n${relevantReports}`;
        console.log('📚 Se encontraron', reports.length, 'informes almacenados');
        setStatusMessage(`📚 Analizando ${reports.length} informes almacenados...`);
      }
      
      if (selectedReport) {
        console.log('📋 Predefinido encontrado:', selectedReport.title);
        baseContent = selectedReport.content;
        setStatusMessage(`📋 Usando predefinido: ${selectedReport.title} + ${reports.length} informes almacenados`);
      }
      
      const detectStructuredOrNarrative = (cmd: string): 'structured' | 'narrative' | 'auto' => {
        if (cmd.includes('estructurado') || cmd.includes('structure')) {
          return 'structured';
        }
        if (cmd.includes('narrativo') || cmd.includes('narrative')) {
          return 'narrative';
        }
        return 'auto';
      };
      
      const detectLength = (cmd: string): 'brief' | 'detailed' | 'normal' => {
        if (cmd.includes('breve') || cmd.includes('corto') || cmd.includes('brief')) {
          return 'brief';
        }
        if (cmd.includes('extenso') || cmd.includes('detallado') || cmd.includes('detailed')) {
          return 'detailed';
        }
        return 'normal';
      };
      
      const reportStyle = detectStructuredOrNarrative(lowerCommand);
      const reportLength = detectLength(lowerCommand);
      
      let styleInstructions = '';
      if (reportStyle === 'structured') {
        styleInstructions = `Formato ESTRUCTURADO con viñetas, listas y secciones claramente definidas:
- Usa viñetas para enumerar hallazgos
- Organiza por sistemas o regiones anatómicas
- Separa claramente cada hallazgo
- Formato claro y esquemático`;
      } else if (reportStyle === 'narrative') {
        styleInstructions = `Formato NARRATIVO en párrafos fluidos:
- Redacta en prosa médica profesional
- Une los hallazgos en 1-3 párrafos coherentes
- Mantén un flujo narrativo natural
- Evita viñetas y listas`;
      } else {
        styleInstructions = 'Usa el formato más apropiado según el contexto médico (estructurado o narrativo).';
      }
      
      let lengthInstructions = '';
      if (reportLength === 'brief') {
        lengthInstructions = 'Sé BREVE y CONCISO. Solo información esencial.';
      } else if (reportLength === 'detailed') {
        lengthInstructions = 'Sé DETALLADO y COMPLETO. Incluye contexto, detalles y consideraciones clínicas relevantes.';
      } else {
        lengthInstructions = 'Extensión moderada, información relevante sin excesos.';
      }
      
      const systemPrompt = `Eres un asistente médico avanzado especializado en generar informes radiológicos profesionales basados en comandos de voz.

INSTRUCCIONES DE ESTILO:
${styleInstructions}

INSTRUCCIONES DE EXTENSIÓN:
${lengthInstructions}

CONTENIDO BASE:
${baseContent ? `Predefinido seleccionado:\n${baseContent}\n\n` : 'Sin predefinido base.\n'}
${contextReports}

COMANDO RECIBIDO:
"${command}"

IMPORTANTE: Utiliza los informes almacenados como referencia para:
- Mantener consistencia en el estilo y terminología
- Seguir el formato que has usado previamente
- Aprender de ejemplos anteriores
- Pero adapta el contenido específicamente al comando actual

Tu tarea es interpretar el comando y generar un informe médico completo con:

1. HALLAZGOS: Describe los hallazgos radiológicos mencionados en el comando${baseContent ? ', integrándolos con el predefinido' : ''}
2. CONCLUSIÓN: Resumen diagnóstico claro y directo
3. DIFERENCIALES: Diagnósticos diferenciales relevantes (si aplica)

FORMATO DE RESPUESTA:
Debes responder EXACTAMENTE con este formato (sin markdown, sin asteriscos):

HALLAZGOS:
[Texto de hallazgos aquí]

CONCLUSIÓN:
[Texto de conclusión aquí]

DIFERENCIALES:
[Texto de diferenciales aquí, o "No aplica" si no hay diferenciales relevantes]

REGLAS IMPORTANTES:
- Si el comando menciona agregar algo al predefinido, integra el contenido
- Si el comando dice "no usar predefinido", ignora el contenido base
- Si el comando incluye especificaciones técnicas (tamaño, localización, densidad), úsalas
- Mantén el lenguaje médico profesional
- Sé preciso con terminología anatómica
- ${styleInstructions}
- ${lengthInstructions}`;

      const response = await aiService.generateText({
        messages: [
          {
            role: 'user',
            content: systemPrompt,
          },
        ],
      });
      
      console.log('✅ Respuesta de IA recibida');
      console.log('Respuesta completa:', response);
      
      const parseResponse = (text: string): GeneratedSection => {
        const sections: GeneratedSection = {
          findings: '',
          conclusion: '',
          differentials: '',
        };
        
        const findingsMatch = text.match(/HALLAZGOS:?\s*([\s\S]*?)(?=CONCLUSIÓN|CONCLUSION|$)/i);
        const conclusionMatch = text.match(/CONCLUSIÓN:?\s*([\s\S]*?)(?=DIFERENCIALES|DIFFERENTIALS|$)/i);
        const differentialsMatch = text.match(/DIFERENCIALES:?\s*([\s\S]*?)$/i);
        
        if (findingsMatch) {
          sections.findings = findingsMatch[1].trim();
        }
        if (conclusionMatch) {
          sections.conclusion = conclusionMatch[1].trim();
        }
        if (differentialsMatch) {
          sections.differentials = differentialsMatch[1].trim();
        }
        
        if (!sections.findings && !sections.conclusion) {
          sections.findings = text.trim();
        }
        
        return sections;
      };
      
      const parsed = parseResponse(response);
      setGeneratedSections(parsed);
      
      await trackAIChatQuery();
      
      setStatusMessage('✅ Informe generado exitosamente');
      setTimeout(() => {
        scrollViewRef.current?.scrollToEnd({ animated: true });
      }, 100);
      
    } catch (error) {
      console.error('❌ Error ejecutando comando:', error);
      
      let errorMsg = 'Error al procesar el comando: ';
      if (error instanceof Error) {
        errorMsg += error.message;
      } else {
        errorMsg += 'Error desconocido';
      }
      
      setErrorMessage(errorMsg);
      
      if (Platform.OS === 'web') {
        alert(errorMsg);
      } else {
        Alert.alert('Error', errorMsg);
      }
    } finally {
      setIsGenerating(false);
    }
  };
  
  const formatDuration = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };
  
  const copyToClipboard = async (text: string) => {
    try {
      await Clipboard.setStringAsync(text);
    } catch (error) {
      console.error('Error al copiar:', error);
    }
  };
  
  if (!user) {
    return (
      <View style={[styles.container, { backgroundColor: theme.background }]}>
        <View style={[styles.header, { backgroundColor: theme.surface, paddingTop: insets.top }]}>
          <Brain size={24} color={theme.primary} />
          <Text style={[styles.headerTitle, { color: theme.onSurface }]}>RAD IA-2</Text>
        </View>
        <View style={styles.loginPrompt}>
          <Brain size={64} color={theme.outline} />
          <Text style={[styles.loginText, { color: theme.onSurface }]}>
            Inicia sesión para acceder a RAD IA-2
          </Text>
        </View>
      </View>
    );
  }
  
  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <View style={[styles.header, { backgroundColor: theme.surface, borderBottomColor: theme.outline, paddingTop: insets.top }]}>
        <View style={styles.headerContent}>
          <Brain size={24} color={theme.primary} />
          <View style={styles.headerTextContainer}>
            <Text style={[styles.headerTitle, { color: theme.onSurface }]}>RAD IA-2</Text>
            <Text style={[styles.headerSubtitle, { color: theme.outline }]}>
              Comandos de voz inteligentes
            </Text>
          </View>
        </View>
      </View>
      
      <ScrollView 
        ref={scrollViewRef}
        style={styles.content} 
        contentContainerStyle={[styles.contentContainer, { paddingBottom: insets.bottom + 20 }]}
        showsVerticalScrollIndicator={false}
      >
        <TouchableOpacity 
          style={[styles.instructionsCard, { backgroundColor: theme.surface, borderColor: theme.outline }]}
          onPress={() => setIsInstructionsExpanded(!isInstructionsExpanded)}
          activeOpacity={0.7}
        >
          <View style={styles.instructionsHeader}>
            <Sparkles size={20} color={theme.primary} />
            <Text style={[styles.instructionsTitle, { color: theme.onSurface }]}>
              Cómo usar RAD IA-2
            </Text>
            {isInstructionsExpanded ? (
              <ChevronUp size={20} color={theme.outline} />
            ) : (
              <ChevronDown size={20} color={theme.outline} />
            )}
          </View>
          
          {isInstructionsExpanded && (
            <>
              <Text style={[styles.instructionsText, { color: theme.outline }]}>
                Presiona el micrófono y da comandos de voz como:
              </Text>
              <View style={styles.examplesList}>
                <Text style={[styles.exampleItem, { color: theme.onSurface }]}>
                  • &ldquo;Coge el predefinido de ecografía abdominal y agrega masa hepática de 3 cm en lóbulo derecho&rdquo;
                </Text>
                <Text style={[styles.exampleItem, { color: theme.onSurface }]}>
                  • &ldquo;Crea un informe de TC de tórax estructurado con derrame pleural bilateral&rdquo;
                </Text>
                <Text style={[styles.exampleItem, { color: theme.onSurface }]}>
                  • &ldquo;Informe narrativo breve de resonancia cerebral sin hallazgos&rdquo;
                </Text>
                <Text style={[styles.exampleItem, { color: theme.onSurface }]}>
                  • &ldquo;Predefinido de radiografía de tórax sin usar el predefinido, informe extenso&rdquo;
                </Text>
              </View>
            </>
          )}
        </TouchableOpacity>
        
        {commandText !== '' && (
          <View style={[styles.commandCard, { backgroundColor: theme.surface, borderColor: theme.primary }]}>
            <View style={styles.commandHeader}>
              <Mic size={18} color={theme.primary} />
              <Text style={[styles.commandTitle, { color: theme.primary }]}>
                Comando recibido
              </Text>
            </View>
            <Text style={[styles.commandText, { color: theme.onSurface }]}>
              {commandText}
            </Text>
          </View>
        )}
        
        {statusMessage !== '' && (
          <View style={[styles.statusCard, { backgroundColor: theme.primary + '20', borderColor: theme.primary }]}>
            <Text style={[styles.statusText, { color: theme.primary }]}>
              {statusMessage}
            </Text>
          </View>
        )}
        
        {errorMessage !== '' && (
          <View style={[styles.errorCard, { backgroundColor: '#FF6B6B20', borderColor: '#FF6B6B' }]}>
            <Text style={[styles.errorText, { color: '#FF6B6B' }]}>
              {errorMessage}
            </Text>
          </View>
        )}
        
        {isGenerating && (
          <View style={[styles.loadingCard, { backgroundColor: theme.surface, borderColor: theme.outline }]}>
            <ActivityIndicator size="large" color={theme.primary} />
            <Text style={[styles.loadingText, { color: theme.outline }]}>
              Generando informe con IA...
            </Text>
          </View>
        )}
        
        <View style={[styles.sectionCard, { backgroundColor: theme.surface, borderColor: theme.outline }]}>
          <View style={styles.sectionHeader}>
            <ListChecks size={20} color={theme.primary} />
            <Text style={[styles.sectionTitle, { color: theme.onSurface }]}>
              HALLAZGOS
            </Text>
            <TouchableOpacity 
              style={[styles.copyButton, { backgroundColor: generatedSections.findings ? theme.primary : theme.surface, borderColor: theme.outline }]}
              onPress={() => copyToClipboard(generatedSections.findings)}
              disabled={!generatedSections.findings}
            >
              <Copy size={14} color={generatedSections.findings ? '#FFFFFF' : theme.outline} />
              <Text style={[styles.copyButtonText, { color: generatedSections.findings ? '#FFFFFF' : theme.outline }]}>Copiar</Text>
            </TouchableOpacity>
          </View>
          <ScrollView 
            style={[styles.sectionContentScroll, { borderColor: theme.outline }]}
            nestedScrollEnabled={true}
          >
            <TextInput
              style={[styles.sectionContent, { color: theme.onSurface }]}
              value={generatedSections.findings}
              onChangeText={(text) => setGeneratedSections(prev => ({ ...prev, findings: text }))}
              multiline
              textAlignVertical="top"
              placeholder="Los hallazgos aparecerán aquí..."
              placeholderTextColor={theme.outline}
              scrollEnabled={false}
            />
          </ScrollView>
        </View>
        
        <View style={[styles.sectionCard, { backgroundColor: theme.surface, borderColor: theme.outline }]}>
          <View style={styles.sectionHeader}>
            <FileText size={20} color={theme.primary} />
            <Text style={[styles.sectionTitle, { color: theme.onSurface }]}>
              CONCLUSIÓN
            </Text>
            <TouchableOpacity 
              style={[styles.copyButton, { backgroundColor: generatedSections.conclusion ? theme.primary : theme.surface, borderColor: theme.outline }]}
              onPress={() => copyToClipboard(generatedSections.conclusion)}
              disabled={!generatedSections.conclusion}
            >
              <Copy size={14} color={generatedSections.conclusion ? '#FFFFFF' : theme.outline} />
              <Text style={[styles.copyButtonText, { color: generatedSections.conclusion ? '#FFFFFF' : theme.outline }]}>Copiar</Text>
            </TouchableOpacity>
          </View>
          <ScrollView 
            style={[styles.sectionContentScroll, { borderColor: theme.outline }]}
            nestedScrollEnabled={true}
          >
            <TextInput
              style={[styles.sectionContent, { color: theme.onSurface }]}
              value={generatedSections.conclusion}
              onChangeText={(text) => setGeneratedSections(prev => ({ ...prev, conclusion: text }))}
              multiline
              textAlignVertical="top"
              placeholder="La conclusión aparecerá aquí..."
              placeholderTextColor={theme.outline}
              scrollEnabled={false}
            />
          </ScrollView>
        </View>
        
        <View style={[styles.sectionCard, { backgroundColor: theme.surface, borderColor: theme.outline }]}>
          <View style={styles.sectionHeader}>
            <Brain size={20} color={theme.primary} />
            <Text style={[styles.sectionTitle, { color: theme.onSurface }]}>
              DIFERENCIALES
            </Text>
            <TouchableOpacity 
              style={[styles.copyButton, { backgroundColor: (generatedSections.differentials && generatedSections.differentials.toLowerCase() !== 'no aplica') ? theme.primary : theme.surface, borderColor: theme.outline }]}
              onPress={() => copyToClipboard(generatedSections.differentials)}
              disabled={!generatedSections.differentials || generatedSections.differentials.toLowerCase() === 'no aplica'}
            >
              <Copy size={14} color={(generatedSections.differentials && generatedSections.differentials.toLowerCase() !== 'no aplica') ? '#FFFFFF' : theme.outline} />
              <Text style={[styles.copyButtonText, { color: (generatedSections.differentials && generatedSections.differentials.toLowerCase() !== 'no aplica') ? '#FFFFFF' : theme.outline }]}>Copiar</Text>
            </TouchableOpacity>
          </View>
          <ScrollView 
            style={[styles.sectionContentScroll, { borderColor: theme.outline }]}
            nestedScrollEnabled={true}
          >
            <TextInput
              style={[styles.sectionContent, { color: theme.onSurface }]}
              value={generatedSections.differentials}
              onChangeText={(text) => setGeneratedSections(prev => ({ ...prev, differentials: text }))}
              multiline
              textAlignVertical="top"
              placeholder="Los diferenciales aparecerán aquí..."
              placeholderTextColor={theme.outline}
              scrollEnabled={false}
            />
          </ScrollView>
        </View>
      </ScrollView>
      
      <View style={[styles.recordingContainer, { backgroundColor: theme.surface, borderTopColor: theme.outline, paddingBottom: insets.bottom }]}>
        {recordingState.isRecording && (
          <View style={styles.recordingInfo}>
            <View style={[styles.recordingIndicator, { backgroundColor: '#FF6B6B' }]} />
            <Text style={[styles.recordingDuration, { color: theme.onSurface }]}>
              {formatDuration(recordingState.duration)}
            </Text>
          </View>
        )}
        
        {isTranscribing && (
          <View style={styles.transcribingInfo}>
            <ActivityIndicator size="small" color={theme.primary} />
            <Text style={[styles.transcribingText, { color: theme.outline }]}>
              Transcribiendo...
            </Text>
          </View>
        )}
        
        <TouchableOpacity
          style={[
            styles.recordButton,
            {
              backgroundColor: recordingState.isRecording ? '#FF6B6B' : theme.primary,
            },
          ]}
          onPress={handleMicPress}
          disabled={isTranscribing || isGenerating}
        >
          {recordingState.isRecording ? (
            <Square size={20} color="#FFFFFF" fill="#FFFFFF" />
          ) : (
            <Mic size={20} color="#FFFFFF" />
          )}
          <Text style={styles.recordButtonText}>
            {recordingState.isRecording ? 'Detener Grabación' : 'Grabar'}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
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
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  headerTextContainer: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '600',
  },
  headerSubtitle: {
    fontSize: 14,
    marginTop: 2,
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    padding: 16,
    gap: 16,
  },
  instructionsCard: {
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
  },
  instructionsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  instructionsTitle: {
    fontSize: 18,
    fontWeight: '600',
  },
  instructionsText: {
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 12,
    marginTop: 12,
  },
  examplesList: {
    gap: 8,
  },
  exampleItem: {
    fontSize: 13,
    lineHeight: 18,
    fontStyle: 'italic',
  },
  commandCard: {
    padding: 14,
    borderRadius: 12,
    borderWidth: 2,
  },
  commandHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  commandTitle: {
    fontSize: 15,
    fontWeight: '600',
  },
  commandText: {
    fontSize: 15,
    lineHeight: 22,
  },
  statusCard: {
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
  },
  statusText: {
    fontSize: 14,
    textAlign: 'center',
    fontWeight: '500',
  },
  errorCard: {
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
  },
  errorText: {
    fontSize: 14,
    textAlign: 'center',
  },
  loadingCard: {
    padding: 24,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: 'center',
    gap: 12,
  },
  loadingText: {
    fontSize: 14,
    fontStyle: 'italic',
  },
  sectionCard: {
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  copyButton: {
    marginLeft: 'auto',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 8,
    borderWidth: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    minHeight: 32,
  },
  copyButtonText: {
    fontSize: 13,
    fontWeight: '600',
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
  },
  sectionContentScroll: {
    maxHeight: 200,
    borderWidth: 1,
    borderRadius: 8,
  },
  sectionContent: {
    minHeight: 100,
    fontSize: 15,
    lineHeight: 22,
    padding: 12,
  },
  recordingContainer: {
    padding: 16,
    alignItems: 'center',
    borderTopWidth: 1,
    gap: 12,
  },
  recordingInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  recordingIndicator: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  recordingDuration: {
    fontSize: 16,
    fontWeight: '600',
  },
  transcribingInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  transcribingText: {
    fontSize: 14,
    fontStyle: 'italic',
  },
  recordButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    paddingHorizontal: 32,
    borderRadius: 12,
    gap: 10,
    minWidth: 200,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 4,
  },
  recordButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
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
});
