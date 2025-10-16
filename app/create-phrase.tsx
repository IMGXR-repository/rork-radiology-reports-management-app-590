import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ScrollView, Alert, Platform, ActivityIndicator } from 'react-native';
import { Stack, router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Save, X, Tag, Mic, Square } from 'lucide-react-native';
import { useApp } from '@/contexts/AppContext';
import { CommonPhrase } from '@/types';
import { lightTheme, darkTheme } from '@/constants/theme';
import { useAudioRecording } from '@/hooks/useAudioRecording';

export default function CreatePhraseScreen() {
  const { phraseCategories, phraseFilters, phrases, savePhrases, settings } = useApp();
  const theme = settings.theme === 'dark' ? darkTheme : lightTheme;
  const insets = useSafeAreaInsets();
  
  const [text, setText] = useState('');
  const [selectedFilters, setSelectedFilters] = useState<string[]>([]);
  const [isSaving, setIsSaving] = useState(false);
  const [isProcessingVoice, setIsProcessingVoice] = useState(false);

  const processVoiceCommand = async (transcribedText: string) => {
    setIsProcessingVoice(true);
    try {
      console.log('🎙️ Procesando transcripción de voz:', transcribedText);
      setText(transcribedText);
      console.log('✅ Transcripción procesada correctamente');
    } catch (error) {
      console.error('❌ Error procesando transcripción de voz:', error);
      if (Platform.OS === 'web') {
        alert('Error al procesar la transcripción de voz');
      } else {
        Alert.alert('Error', 'Error al procesar la transcripción de voz');
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

  const visibleCategories = phraseCategories.filter(cat => cat.isVisible);
  const activeFilters = phraseFilters.filter(filter => filter.isActive);

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
    if (!text.trim()) {
      if (Platform.OS === 'web') {
        alert('Por favor ingresa el texto de la frase');
      } else {
        Alert.alert('Error', 'Por favor ingresa el texto de la frase');
      }
      return;
    }

    setIsSaving(true);
    try {
      const newPhrase: CommonPhrase = {
        id: `phrase_${Date.now()}`,
        text: text.trim(),
        filters: selectedFilters,
        isFrequent: false,
        isFavorite: false,
        usageCount: 0,
        createdAt: new Date().toISOString(),
      };

      const updatedPhrases = [...phrases, newPhrase];
      await savePhrases(updatedPhrases);
      
      if (Platform.OS === 'web') {
        alert('Frase creada exitosamente');
      } else {
        Alert.alert('Éxito', 'Frase creada exitosamente');
      }
      
      router.back();
    } catch (error) {
      console.error('Error creating phrase:', error);
      if (Platform.OS === 'web') {
        alert('Error al crear la frase');
      } else {
        Alert.alert('Error', 'Error al crear la frase');
      }
    } finally {
      setIsSaving(false);
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
    if (text.trim() || selectedFilters.length > 0) {
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
            title: 'Crear Frase',
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
            <View style={styles.titleRow}>
              <View style={styles.textInputContainer}>
                <Text style={[styles.label, { color: theme.onSurface }]}>
                  Texto de la Frase *
                </Text>
                <TextInput
                  style={[styles.textInput, { 
                    color: theme.onSurface, 
                    borderColor: theme.outline,
                    backgroundColor: theme.surface 
                  }]}
                  value={text}
                  onChangeText={setText}
                  placeholder="Escribe aquí la frase común que quieres guardar..."
                  placeholderTextColor={theme.outline}
                  multiline
                  textAlignVertical="top"
                  maxLength={1000}
                />
              </View>
              <TouchableOpacity
                onPress={handleVoiceCommand}
                style={[styles.micButton, {
                  backgroundColor: recordingState.isRecording ? theme.error : '#22C55E',
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
            {recordingState.isRecording && (
              <View style={[styles.recordingIndicatorSmall, { backgroundColor: theme.surfaceVariant }]}>
                <View style={[styles.recordingDot, { backgroundColor: theme.error }]} />
                <Text style={[styles.recordingText, { color: theme.onSurface }]}>
                  Grabando... {Math.floor(recordingState.duration / 60)}:{String(recordingState.duration % 60).padStart(2, '0')}
                </Text>
              </View>
            )}
            <Text style={[styles.characterCount, { color: theme.outline }]}>
              {text.length}/1000 caracteres
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
              {isSaving ? 'Guardando...' : 'Guardar Frase'}
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
    paddingVertical: 6,
  },
  titleRow: {
    flexDirection: 'row' as const,
    alignItems: 'flex-start' as const,
    gap: 8,
  },
  textInputContainer: {
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
  textInput: {
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    minHeight: 120,
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
});