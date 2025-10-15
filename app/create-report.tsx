import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ScrollView, Alert, Platform, ActivityIndicator, Switch } from 'react-native';
import { Stack, router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Save, X, Tag, Sparkles } from 'lucide-react-native';
import { useApp } from '@/contexts/AppContext';
import { Report } from '@/types';
import { lightTheme, darkTheme } from '@/constants/theme';
import { generateText } from '@rork/toolkit-sdk';
import CustomSlider from '@/components/CustomSlider';

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

  const visibleCategories = reportCategories.filter(cat => cat.isVisible);
  const activeFilters = reportFilters.filter(filter => filter.isActive);

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
      
      if (Platform.OS === 'web') {
        alert('Informe creado exitosamente');
      } else {
        Alert.alert('Éxito', 'Informe creado exitosamente');
      }
      
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

Genera un informe médico basado en el siguiente título: "${title.trim()}"

Genera ÚNICAMENTE los hallazgos médicos en formato de texto corrido, sin estructura anatómica específica.
No incluyas títulos de secciones como "HALLAZGOS:", "CONCLUSIONES:", etc.
No incluyas párrafos concluyentes, diagnósticos ni patologías.
Escribe directamente los hallazgos en un formato narrativo simple y profesional.
Describe únicamente lo observado sin interpretaciones diagnósticas.`;
      } else if (structureLevel === 100) {
        prompt = `${systemInstructions}

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
      } else {
        const structureIntensity = structureLevel / 100;
        prompt = `${systemInstructions}

Genera un informe médico con nivel de estructuración ${structureLevel}% basado en el siguiente título: "${title.trim()}"

Genera ÚNICAMENTE los hallazgos médicos con un balance entre texto narrativo y organización anatómica.
Nivel de estructuración: ${structureLevel}% (donde 0% es texto corrido y 100% es completamente estructurado por anatomía).
A mayor porcentaje, más breve y estructurado debe ser el informe, con saltos de línea entre estructuras.
No incluyas títulos de secciones como "HALLAZGOS:", "CONCLUSIONES:", etc.
No incluyas párrafos concluyentes, diagnósticos ni patologías.
Escribe directamente los hallazgos, mezclando descripción narrativa con referencias anatómicas según el nivel de estructuración solicitado.
Sé directo y conciso.`;
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

      const generatedContent = await generateText(prompt);
      setContent(generatedContent);
    } catch (error) {
      console.error('Error generating structured report:', error);
      if (Platform.OS === 'web') {
        alert('Error al generar el informe estructurado');
      } else {
        Alert.alert('Error', 'Error al generar el informe estructurado');
      }
    } finally {
      setIsGenerating(false);
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
    <View style={[styles.safeContainer, { backgroundColor: theme.background }]}>
      <View style={[styles.topSafeArea, { height: insets.top, backgroundColor: theme.surface }]} />
      <View style={[styles.container, { backgroundColor: theme.background }]}>
        <Stack.Screen
          options={{
            title: 'Crear Informe',
            headerStyle: { backgroundColor: theme.surface },
            headerTintColor: theme.onSurface,
            headerLeft: () => (
              <TouchableOpacity onPress={handleCancel} style={styles.headerButton}>
                <X size={20} color={theme.onSurface} />
              </TouchableOpacity>
            ),
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
          <View style={styles.formSection}>
            <Text style={[styles.label, { color: theme.onSurface }]}>
              Título del Informe *
            </Text>
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

        <View style={[styles.bottomActions, { backgroundColor: theme.surface, borderTopColor: theme.outline }]}>
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
    </View>
  );
}

const styles = StyleSheet.create({
  safeContainer: {
    flex: 1,
  },
  topSafeArea: {
    width: '100%',
  },
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
    paddingVertical: 12,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
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
});