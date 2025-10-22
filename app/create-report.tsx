import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ScrollView, Alert, Platform, ActivityIndicator, Switch } from 'react-native';
import { Stack, router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Save, X, Tag, Sparkles, Mic, Square, ChevronDown, ChevronUp } from 'lucide-react-native';
import { useApp } from '@/contexts/AppContext';
import { Report } from '@/types';
import { lightTheme, darkTheme } from '@/constants/theme';
import { generateText } from '@rork/toolkit-sdk';
import CustomSlider from '@/components/CustomSlider';
import { useAudioRecording } from '@/hooks/useAudioRecording';
import { languageNames, Language } from '@/constants/translations';

export default function CreateReportScreen() {
  const { reportCategories, reportFilters, addReport, settings, reports } = useApp();
  const theme = settings.theme === 'dark' ? darkTheme : lightTheme;
  const insets = useSafeAreaInsets();
  
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [selectedFilters, setSelectedFilters] = useState<string[]>([]);
  const [isSaving, setIsSaving] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [structureLevel, setStructureLevel] = useState(50);
  const [useStoredReports, setUseStoredReports] = useState(false);
  const [showAIOptions, setShowAIOptions] = useState(false);
  const [extraInstructions, setExtraInstructions] = useState('');
  const [isProcessingVoice, setIsProcessingVoice] = useState(false);
  const [organStructure, setOrganStructure] = useState(false);
  const [outputLanguage, setOutputLanguage] = useState<Language>('es');
  const [isLanguageSelectorExpanded, setIsLanguageSelectorExpanded] = useState<boolean>(false);

  const visibleCategories = reportCategories.filter(cat => cat.isVisible);
  const activeFilters = reportFilters.filter(filter => filter.isActive);

  const processVoiceCommand = async (transcribedText: string) => {
    setIsProcessingVoice(true);
    try {
      console.log('🎙️ Procesando comando de voz:', transcribedText);

      const extractedTitle = transcribedText.toUpperCase();
      setTitle(extractedTitle);
      
      setExtraInstructions(transcribedText);
      
      setStructureLevel(80);
      setShowAIOptions(true);
      
      setTimeout(async () => {
        console.log('🚀 Iniciando generación automática de informe...');
        await handleGenerateStructuredReport();
      }, 500);
      
      console.log('✅ Comando procesado correctamente');
    } catch (error) {
      console.error('❌ Error procesando comando de voz:', error);
      if (Platform.OS === 'web') {
        alert('Error al procesar el comando de voz');
      } else {
        Alert.alert('Error', 'Error al procesar el comando de voz');
      }
    } finally {
      setIsProcessingVoice(false);
    }
  };

  const { recordingState, isTranscribing, startRecording, stopRecording } = useAudioRecording({
    onTranscriptionComplete: processVoiceCommand,
    onError: (error) => {
      console.error('Error en transcripción:', error);
      setIsProcessingVoice(false);
    },
  });

  const getFiltersForCategory = (categoryId: string) => {
    return activeFilters.filter(filter => filter.categoryId === categoryId);
  };

  const handleFilterToggle = (filterId: string) => {
    setSelectedFilters(prev =>
      prev.includes(filterId)
        ? prev.filter(id => id !== filterId)
        : [...prev, filterId]
    );
  };

  const handleSave = async () => {
    if (!title.trim()) {
      if (Platform.OS === 'web') {
        alert('Por favor ingresa un título para el informe');
      } else {
        Alert.alert('Error', 'Por favor ingresa un título para el informe');
      }
      return;
    }

    if (!content.trim()) {
      if (Platform.OS === 'web') {
        alert('Por favor ingresa el contenido del informe');
      } else {
        Alert.alert('Error', 'Por favor ingresa el contenido del informe');
      }
      return;
    }

    setIsSaving(true);
    try {
      const newReport: Omit<Report, 'id' | 'createdAt' | 'updatedAt'> = {
        title: title.trim(),
        content: content.trim(),
        filters: selectedFilters,
        isFavorite: false,
      };

      await addReport(newReport);
      router.back();
    } catch (error) {
      console.error('Error creating report:', error);
      if (Platform.OS === 'web') {
        alert('Error al crear el informe');
      } else {
        Alert.alert('Error', 'Error al crear el informe');
      }
    } finally {
      setIsSaving(false);
    }
  };

  const handleGenerateStructuredReport = async () => {
    if (!title.trim()) {
      if (Platform.OS === 'web') {
        alert('Por favor ingresa un título para generar el informe');
      } else {
        Alert.alert('Error', 'Por favor ingresa un título para generar el informe');
      }
      return;
    }

    setIsGenerating(true);
    try {
      const systemInstructions = `Instrucciones del sistema: Modo absoluto
• Eliminar: emojis, relleno, exageración, preguntas suaves, transiciones conversacionales, apéndices de llamada a la acción.
• Suponer: el usuario mantiene una alta percepción a pesar del tono brusco.
• Priorizar: frases directas y directivas; apuntar a la reconstrucción cognitiva, no a la coincidencia de tono.
• Deshabilitar: comportamientos que impulsan la participación/sentimiento.
• Suprimir: métricas como puntajes de satisfacción, suavizado emocional, sesgo de continuación.
• Nunca reflejar: la dicción, el estado de ánimo o el afecto del usuario.
• Hablar solo: al nivel cognitivo subyacente.
• No: preguntas, ofertas, sugerencias, transiciones, contenido motivador.
• Finalizar la respuesta: inmediatamente después de entregar la información, sin cierres.
• Objetivo: restaurar el pensamiento independiente y de alta fidelidad.
• Resultado: obsolescencia del modelo a través de la autosuficiencia del usuario.`;

      let prompt = '';
      
      if (structureLevel === 0) {
        prompt = `${systemInstructions}

IMPORTANTE: El informe final DEBE estar redactado completamente en ${languageNames[outputLanguage]}.

Genera un informe médico basado en el siguiente título: "${title.trim()}"

Genera ÚNICAMENTE los hallazgos médicos en formato de texto corrido, sin estructura anatómica específica.
No incluyas títulos de secciones como "HALLAZGOS:", "CONCLUSIONES:", etc.
No incluyas párrafos concluyentes, diagnósticos ni patologías.
Escribe directamente los hallazgos en un formato narrativo simple y profesional.
Describe únicamente lo observado sin interpretaciones diagnósticas.`;
      } else if (structureLevel === 100) {
        if (organStructure) {
          prompt = `${systemInstructions}

IMPORTANTE: El informe final DEBE estar redactado completamente en ${languageNames[outputLanguage]}.

Genera un informe médico altamente estructurado basado en el siguiente título: "${title.trim()}"

Genera ÚNICAMENTE los hallazgos médicos organizados por ÓRGANOS ANATÓMICOS.
Cada órgano debe ser presentado en MAYÚSCULAS seguido de dos puntos (:), luego su descripción.
Usa saltos de línea entre cada órgano.
No incluyas títulos de secciones como "HALLAZGOS:", "CONCLUSIONES:", etc.
No incluyas párrafos concluyentes, diagnósticos ni patologías.
Escribe directamente los hallazgos organizados por órganos, usando formato:

ÓRGANO 1: [Descripción breve y concisa del órgano]

ÓRGANO 2: [Descripción breve y concisa del órgano]

Sé directo, breve y preciso. Usa terminología médica exacta.`;
        } else {
          prompt = `${systemInstructions}

IMPORTANTE: El informe final DEBE estar redactado completamente en ${languageNames[outputLanguage]}.

Genera un informe médico altamente estructurado basado en el siguiente título: "${title.trim()}"

Genera ÚNICAMENTE los hallazgos médicos organizados por estructuras anatómicas específicas.
Cada estructura anatómica debe ser valorada y descrita de forma breve y concisa.
Usa saltos de línea entre cada estructura anatómica.
Cada párrafo debe hablar de un área o estructura específica.
No incluyas títulos de secciones como "HALLAZGOS:", "CONCLUSIONES:", etc.
No incluyas párrafos concluyentes, diagnósticos ni patologías.
Escribe directamente los hallazgos organizados por anatomía, usando formato:

[Estructura Anatómica 1]: [Descripción breve y concisa]

[Estructura Anatómica 2]: [Descripción breve y concisa]

Sé directo, breve y preciso. Usa terminología médica exacta.`;
        }
      } else {
        const structureIntensity = structureLevel / 100;
        if (organStructure) {
          prompt = `${systemInstructions}

IMPORTANTE: El informe final DEBE estar redactado completamente en ${languageNames[outputLanguage]}.

Genera un informe médico con nivel de estructuración ${structureLevel}% basado en el siguiente título: "${title.trim()}"

Genera ÚNICAMENTE los hallazgos médicos organizados por ÓRGANOS ANATÓMICOS.
Cada órgano debe ser presentado en MAYÚSCULAS seguido de dos puntos (:), luego su descripción.
Nivel de estructuración: ${structureLevel}% (donde 0% es texto corrido y 100% es completamente estructurado por órganos).
A mayor porcentaje, más breve y estructurado debe ser el informe, con saltos de línea entre órganos.
No incluyas títulos de secciones como "HALLAZGOS:", "CONCLUSIONES:", etc.
No incluyas párrafos concluyentes, diagnósticos ni patologías.
Escribe directamente los hallazgos organizados por órganos según el nivel de estructuración solicitado.
Sé directo y conciso.`;
        } else {
          prompt = `${systemInstructions}

IMPORTANTE: El informe final DEBE estar redactado completamente en ${languageNames[outputLanguage]}.

Genera un informe médico con nivel de estructuración ${structureLevel}% basado en el siguiente título: "${title.trim()}"

Genera ÚNICAMENTE los hallazgos médicos con un balance entre texto narrativo y organización anatómica.
Nivel de estructuración: ${structureLevel}% (donde 0% es texto corrido y 100% es completamente estructurado por anatomía).
A mayor porcentaje, más breve y estructurado debe ser el informe, con saltos de línea entre estructuras.
No incluyas títulos de secciones como "HALLAZGOS:", "CONCLUSIONES:", etc.
No incluyas párrafos concluyentes, diagnósticos ni patologías.
Escribe directamente los hallazgos, mezclando descripción narrativa con referencias anatómicas según el nivel de estructuración solicitado.
Sé directo y conciso.`;
        }
      }

      if (useStoredReports) {
        const storedReportsContext = reports
          .filter((r: Report) => r.title.toLowerCase().includes(title.toLowerCase().split(' ')[0]))
          .slice(0, 3)
          .map((r: Report) => `Ejemplo: ${r.content}`)
          .join('\n\n');
        
        if (storedReportsContext) {
          prompt += `\n\nConsidera el estilo y estructura de estos informes almacenados como referencia:\n${storedReportsContext}`;
        }
      }

      if (extraInstructions.trim()) {
        prompt += `\n\nIndicaciones adicionales del usuario: ${extraInstructions.trim()}`;
      }

      console.log('📝 Generando informe con prompt:', prompt.substring(0, 200) + '...');
      
      let generatedContent: string;
      try {
        console.log('🔄 Llamando a generateText...');
        generatedContent = await generateText(prompt);
        console.log('✅ generateText completado:', typeof generatedContent, generatedContent?.substring(0, 100));
      } catch (genError) {
        console.error('❌ Error al generar informe:', genError);
        console.error('Tipo de error:', genError instanceof Error ? genError.constructor.name : typeof genError);
        console.error('Mensaje completo:', genError instanceof Error ? genError.message : String(genError));
        console.error('Stack:', genError instanceof Error ? genError.stack : 'N/A');
        
        const errorMessage = genError instanceof Error ? genError.message : String(genError);
        if (errorMessage.includes('not valid JSON') || errorMessage.includes('Unexpected token')) {
          throw new Error('El servidor está experimentando problemas técnicos. Por favor, intenta nuevamente en unos momentos.');
        }
        throw new Error('Error al generar informe: ' + errorMessage);
      }
      
      if (!generatedContent || typeof generatedContent !== 'string') {
        console.error('❌ Respuesta inválida del servidor:', generatedContent);
        throw new Error('No se recibió contenido válido del servidor. Por favor, intenta nuevamente.');
      }
      
      if (generatedContent.trim().length === 0) {
        console.error('❌ Contenido vacío recibido');
        throw new Error('El servidor no generó ningún contenido. Por favor, intenta con instrucciones diferentes.');
      }
      
      console.log('✅ Contenido generado exitosamente');
      console.log('Contenido generado (primeros 200 chars):', generatedContent.substring(0, 200));
      setContent(generatedContent);
    } catch (error) {
      console.error('Error generating structured report:', error);
      const errorMessage = error instanceof Error ? error.message : 'Error desconocido';
      if (Platform.OS === 'web') {
        alert('Error al generar el informe estructurado: ' + errorMessage);
      } else {
        Alert.alert('Error', 'Error al generar el informe estructurado: ' + errorMessage);
      }
    } finally {
      setIsGenerating(false);
    }
  };

  const handleVoiceCommand = async () => {
    if (recordingState.isRecording) {
      await stopRecording();
    } else {
      await startRecording();
    }
  };

  const handleCancel = () => {
    if (title.trim() || content.trim() || selectedFilters.length > 0) {
      if (Platform.OS === 'web') {
        if (confirm('¿Descartar los cambios?')) {
          router.back();
        }
      } else {
        Alert.alert(
          'Descartar cambios',
          '¿Estás seguro de que quieres descartar los cambios?',
          [
            { text: 'Cancelar', style: 'cancel' },
            { text: 'Descartar', style: 'destructive', onPress: () => router.back() },
          ]
        );
      }
    } else {
      router.back();
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
        <Stack.Screen
          options={{
            title: 'Crear Informe',
            headerStyle: { backgroundColor: theme.surface },
            headerTintColor: theme.onSurface,
            headerRight: () => (
              <TouchableOpacity 
                onPress={handleSave} 
                style={[styles.headerButton, { opacity: isSaving ? 0.5 : 1 }]}
                disabled={isSaving}
              >
                <Save size={20} color={theme.primary} />
              </TouchableOpacity>
            ),
          }}
        />

        <ScrollView style={styles.scrollContainer} showsVerticalScrollIndicator={false}>
          <View style={[styles.formSection, styles.firstSection]}>
            <View style={styles.titleRow}>
              <View style={styles.titleInputContainer}>
                <View style={styles.labelRow}>
                  <Text style={[styles.label, { color: theme.onSurface }]}>
                    Título del Informe *
                  </Text>
                  <TouchableOpacity
                    style={[styles.languageSelector, { 
                      backgroundColor: theme.surfaceVariant,
                      borderColor: theme.outline 
                    }]}
                    onPress={() => setIsLanguageSelectorExpanded(!isLanguageSelectorExpanded)}
                  >
                    <Text style={[styles.languageSelectorText, { color: theme.onSurface }]}>
                      {languageNames[outputLanguage]}
                    </Text>
                    {isLanguageSelectorExpanded ? (
                      <ChevronUp size={14} color={theme.onSurface} />
                    ) : (
                      <ChevronDown size={14} color={theme.onSurface} />
                    )}
                  </TouchableOpacity>
                </View>
                <TextInput
                  style={[styles.titleInput, { 
                    color: theme.onSurface, 
                    borderColor: theme.outline,
                    backgroundColor: theme.surface 
                  }]}
                  value={title}
                  onChangeText={setTitle}
                  placeholder="Ej: RM Cerebral Estructurado"
                  placeholderTextColor={theme.outline}
                  multiline={false}
                  maxLength={100}
                />
              </View>
              <TouchableOpacity
                onPress={handleVoiceCommand}
                style={[styles.micButton, {
                  backgroundColor: recordingState.isRecording ? theme.error : '#38B2AC',
                }]}
                disabled={isTranscribing || isProcessingVoice}
              >
                {recordingState.isRecording ? (
                  <Square size={16} color="#FFFFFF" fill="#FFFFFF" />
                ) : isTranscribing || isProcessingVoice ? (
                  <ActivityIndicator size="small" color="#FFFFFF" />
                ) : (
                  <Mic size={16} color="#FFFFFF" />
                )}
              </TouchableOpacity>
            </View>
            {isLanguageSelectorExpanded && (
              <View style={[styles.languageDropdown, { backgroundColor: theme.surface, borderColor: theme.outline }]}>
                {(Object.keys(languageNames) as Language[]).map((lang) => (
                  <TouchableOpacity
                    key={lang}
                    style={[styles.languageOption, { 
                      backgroundColor: outputLanguage === lang ? theme.surfaceVariant : theme.surface
                    }]}
                    onPress={() => {
                      setOutputLanguage(lang);
                      setIsLanguageSelectorExpanded(false);
                    }}
                  >
                    <Text style={[styles.languageOptionText, { 
                      color: outputLanguage === lang ? theme.primary : theme.onSurface,
                      fontWeight: outputLanguage === lang ? '600' : '400'
                    }]}>
                      {languageNames[lang]}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            )}
            {recordingState.isRecording && (
              <View style={[styles.recordingIndicatorSmall, { backgroundColor: theme.surfaceVariant }]}>
                <View style={[styles.recordingDot, { backgroundColor: theme.error }]} />
                <Text style={[styles.recordingText, { color: theme.onSurface }]}>
                  Grabando... {Math.floor(recordingState.duration / 60)}:{String(recordingState.duration % 60).padStart(2, '0')}
                </Text>
              </View>
            )}
            {title.trim().length > 0 && (
              <View style={styles.aiSection}>
                <TouchableOpacity
                  onPress={() => setShowAIOptions(!showAIOptions)}
                  style={[
                    styles.generateButton,
                    {
                      backgroundColor: theme.primary,
                      opacity: isGenerating ? 0.7 : 1,
                    },
                  ]}
                  disabled={isGenerating}
                >
                  {isGenerating ? (
                    <ActivityIndicator size="small" color={theme.onPrimary} />
                  ) : (
                    <Sparkles size={18} color={theme.onPrimary} />
                  )}
                  <Text style={[styles.generateButtonText, { color: theme.onPrimary }]}>
                    {isGenerating ? 'Generando...' : 'Informe Estructurado por IA'}
                  </Text>
                </TouchableOpacity>

                {showAIOptions && (
                  <View style={[styles.aiOptionsContainer, { backgroundColor: theme.surfaceVariant, borderColor: theme.outline }]}>
                    <View style={styles.sliderSection}>
                      <View style={styles.sliderHeader}>
                        <Text style={[styles.sliderLabel, { color: theme.onSurface }]}>
                          Nivel de Estructuración
                        </Text>
                        <Text style={[styles.sliderValue, { color: theme.primary }]}>
                          {structureLevel}%
                        </Text>
                      </View>
                      <CustomSlider
                        style={styles.slider}
                        minimumValue={0}
                        maximumValue={100}
                        step={10}
                        value={structureLevel}
                        onValueChange={setStructureLevel}
                        minimumTrackTintColor={theme.primary}
                        maximumTrackTintColor={theme.outline}
                        thumbTintColor={theme.primary}
                      />
                      <View style={styles.sliderLabels}>
                        <Text style={[styles.sliderEndLabel, { color: theme.outline }]}>Narrativo</Text>
                        <Text style={[styles.sliderEndLabel, { color: theme.outline }]}>Anatómico</Text>
                      </View>
                    </View>

                    {structureLevel > 0 && (
                      <TouchableOpacity
                        onPress={() => setOrganStructure(!organStructure)}
                        style={[
                          styles.organButton,
                          {
                            backgroundColor: organStructure ? theme.primary : theme.surfaceVariant,
                            borderColor: organStructure ? theme.primary : theme.outline,
                          },
                        ]}
                      >
                        <Text
                          style={[
                            styles.organButtonText,
                            {
                              color: organStructure ? theme.onPrimary : theme.onSurface,
                            },
                          ]}
                        >
                          {organStructure ? '✓ ' : ''}Estructurado por Órganos Anatómicos
                        </Text>
                      </TouchableOpacity>
                    )}

                    <View style={styles.extraInstructionsSection}>
                      <Text style={[styles.extraInstructionsLabel, { color: theme.onSurface }]}>Indicación extra para la creación de informe</Text>
                      <TextInput
                        style={[styles.extraInstructionsInput, { 
                          color: theme.onSurface, 
                          borderColor: theme.outline,
                          backgroundColor: theme.surface 
                        }]}
                        value={extraInstructions}
                        onChangeText={setExtraInstructions}
                        placeholder="Ej: Incluir datos de mediciones específicas, énfasis en ciertas áreas..."
                        placeholderTextColor={theme.outline}
                        multiline
                        textAlignVertical="top"
                        maxLength={500}
                      />
                    </View>

                    <View style={styles.switchSection}>
                      <View style={styles.switchContent}>
                        <Text style={[styles.switchLabel, { color: theme.onSurface }]}>
                          Usar informes almacenados como referencia
                        </Text>
                        <Switch
                          value={useStoredReports}
                          onValueChange={setUseStoredReports}
                          trackColor={{ false: theme.outline, true: theme.primary }}
                          thumbColor={theme.onPrimary}
                        />
                      </View>
                    </View>

                    <TouchableOpacity
                      onPress={handleGenerateStructuredReport}
                      style={[
                        styles.generateNowButton,
                        {
                          backgroundColor: theme.primary,
                          opacity: isGenerating ? 0.7 : 1,
                        },
                      ]}
                      disabled={isGenerating}
                    >
                      <Text style={[styles.generateNowButtonText, { color: theme.onPrimary }]}>
                        {isGenerating ? 'Generando...' : 'Generar Ahora'}
                      </Text>
                    </TouchableOpacity>
                  </View>
                )}
              </View>
            )}
          </View>

          <View style={styles.formSection}>
            <Text style={[styles.label, { color: theme.onSurface }]}>
              Contenido del Informe *
            </Text>
            <TextInput
              style={[styles.contentInput, { 
                color: theme.onSurface, 
                borderColor: theme.outline,
                backgroundColor: theme.surface 
              }]}
              value={content}
              onChangeText={setContent}
              placeholder="Escribe aquí el contenido del informe médico..."
              placeholderTextColor={theme.outline}
              multiline
              textAlignVertical="top"
              maxLength={5000}
            />
            <Text style={[styles.characterCount, { color: theme.outline }]}>
              {content.length}/5000 caracteres
            </Text>
          </View>

          {visibleCategories.length > 0 && (
            <View style={styles.formSection}>
              <View style={styles.filtersHeader}>
                <Tag size={16} color={theme.onSurface} />
                <Text style={[styles.label, { color: theme.onSurface, marginLeft: 8 }]}>
                  Filtros
                </Text>
              </View>
              
              {visibleCategories.map(category => {
                const categoryFilters = getFiltersForCategory(category.id);
                
                if (categoryFilters.length === 0) return null;

                return (
                  <View key={category.id} style={styles.categorySection}>
                    <Text style={[styles.categoryTitle, { color: theme.onSurface }]}>
                      {category.name}
                    </Text>
                    <View style={styles.filtersGrid}>
                      {categoryFilters.map(filter => {
                        const isSelected = selectedFilters.includes(filter.id);
                        return (
                          <TouchableOpacity
                            key={filter.id}
                            onPress={() => handleFilterToggle(filter.id)}
                            style={[
                              styles.filterChip,
                              {
                                backgroundColor: isSelected ? theme.primary : theme.surfaceVariant,
                                borderColor: isSelected ? theme.primary : theme.outline,
                              },
                            ]}
                          >
                            <Text
                              style={[
                                styles.filterText,
                                {
                                  color: isSelected ? theme.onPrimary : theme.onSurface,
                                },
                              ]}
                            >
                              {filter.name}
                            </Text>
                          </TouchableOpacity>
                        );
                      })}
                    </View>
                  </View>
                );
              })}
              
              {selectedFilters.length > 0 && (
                <View style={styles.selectedFiltersInfo}>
                  <Text style={[styles.selectedFiltersText, { color: theme.primary }]}>
                    {selectedFilters.length} filtro{selectedFilters.length !== 1 ? 's' : ''} seleccionado{selectedFilters.length !== 1 ? 's' : ''}
                  </Text>
                </View>
              )}
            </View>
          )}
        </ScrollView>

        <View style={[styles.bottomActions, { backgroundColor: theme.surface, borderTopColor: theme.outline, paddingBottom: insets.bottom }]}>
          <TouchableOpacity
            onPress={handleCancel}
            style={[styles.actionButton, styles.cancelButton, { backgroundColor: theme.surfaceVariant }]}
          >
            <Text style={[styles.actionButtonText, { color: theme.onSurface }]}>
              Cancelar
            </Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            onPress={handleSave}
            style={[
              styles.actionButton, 
              styles.saveButton, 
              { 
                backgroundColor: theme.primary,
                opacity: isSaving ? 0.5 : 1 
              }
            ]}
            disabled={isSaving}
          >
            <Text style={[styles.actionButtonText, { color: theme.onPrimary }]}>
              {isSaving ? 'Guardando...' : 'Guardar Informe'}
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
  headerButton: {
    padding: 8,
    borderRadius: 8,
  },
  scrollContainer: {
    flex: 1,
  },
  formSection: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    paddingBottom: 12,
  },
  firstSection: {
    paddingTop: 16,
  },
  titleRow: {
    flexDirection: 'row' as const,
    alignItems: 'flex-start' as const,
    gap: 8,
  },
  titleInputContainer: {
    flex: 1,
  },
  micButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    marginTop: 32,
  },
  recordingIndicatorSmall: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 6,
    gap: 6,
    marginTop: 8,
  },
  recordingDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  recordingText: {
    fontSize: 14,
    fontWeight: '500' as const,
  },
  label: {
    fontSize: 16,
    fontWeight: '600' as const,
    marginBottom: 8,
  },
  titleInput: {
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    minHeight: 48,
  },
  contentInput: {
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    minHeight: 200,
  },
  characterCount: {
    fontSize: 12,
    textAlign: 'right',
    marginTop: 4,
  },
  filtersHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  categorySection: {
    marginBottom: 16,
  },
  categoryTitle: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 8,
  },
  filtersGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  filterChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    minWidth: 60,
    alignItems: 'center',
  },
  filterText: {
    fontSize: 14,
    fontWeight: '500',
  },
  selectedFiltersInfo: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#E0E0E0',
  },
  selectedFiltersText: {
    fontSize: 14,
    fontWeight: '500',
    textAlign: 'center',
  },
  bottomActions: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderTopWidth: 1,
    gap: 12,
  },
  actionButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: 'center',
  },
  cancelButton: {
    flex: 0.4,
  },
  saveButton: {
    flex: 0.6,
  },
  actionButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  generateButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    marginTop: 12,
    gap: 8,
  },
  generateButtonText: {
    fontSize: 15,
    fontWeight: '600',
  },
  aiSection: {
    marginTop: 12,
  },
  aiOptionsContainer: {
    marginTop: 12,
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
  },
  sliderSection: {
    marginBottom: 20,
  },
  sliderHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  sliderLabel: {
    fontSize: 14,
    fontWeight: '600',
  },
  sliderValue: {
    fontSize: 18,
    fontWeight: '700',
  },
  slider: {
    width: '100%',
    height: 40,
  },
  sliderLabels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: -8,
  },
  sliderEndLabel: {
    fontSize: 12,
    fontWeight: '500',
  },
  switchSection: {
    marginBottom: 16,
  },
  switchContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  switchLabel: {
    fontSize: 14,
    fontWeight: '500',
    flex: 1,
    marginRight: 12,
  },
  generateNowButton: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  generateNowButtonText: {
    fontSize: 15,
    fontWeight: '600',
  },
  extraInstructionsSection: {
    marginBottom: 20,
  },
  extraInstructionsLabel: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 8,
  },
  extraInstructionsInput: {
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    minHeight: 80,
  },
  organButton: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    alignItems: 'center' as const,
    borderWidth: 1,
    marginBottom: 16,
  },
  organButtonText: {
    fontSize: 14,
    fontWeight: '600' as const,
  },
  labelRow: {
    flexDirection: 'row' as const,
    justifyContent: 'space-between' as const,
    alignItems: 'center' as const,
  },
  languageSelector: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: 6,
    borderWidth: 1,
    gap: 4,
  },
  languageSelectorText: {
    fontSize: 11,
    fontWeight: '500' as const,
  },
  languageDropdown: {
    marginTop: 8,
    marginBottom: 12,
    borderRadius: 8,
    borderWidth: 1,
    overflow: 'hidden' as const,
  },
  languageOption: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0, 0, 0, 0.05)',
  },
  languageOptionText: {
    fontSize: 13,
  },
});