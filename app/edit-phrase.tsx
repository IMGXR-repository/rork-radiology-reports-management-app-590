import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ScrollView, Alert, Platform } from 'react-native';
import { Stack, router, useLocalSearchParams } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Save, X, Tag } from 'lucide-react-native';
import { useApp } from '@/contexts/AppContext';
import { CommonPhrase } from '@/types';
import { lightTheme, darkTheme } from '@/constants/theme';

export default function EditPhraseScreen() {
  const { phraseCategories, phraseFilters, phrases, savePhrases, settings } = useApp();
  const theme = settings.theme === 'dark' ? darkTheme : lightTheme;
  const insets = useSafeAreaInsets();
  const { id } = useLocalSearchParams<{ id: string }>();
  
  const [text, setText] = useState('');
  const [selectedFilters, setSelectedFilters] = useState<string[]>([]);
  const [isSaving, setIsSaving] = useState(false);
  const [phrase, setPhrase] = useState<CommonPhrase | null>(null);

  const visibleCategories = phraseCategories.filter(cat => cat.isVisible);
  const activeFilters = phraseFilters.filter(filter => filter.isActive);

  useEffect(() => {
    if (id) {
      console.log('🔍 [Edit Phrase] Buscando frase con ID:', id);
      console.log('🔍 [Edit Phrase] Tipo de ID:', typeof id);
      console.log('🔍 [Edit Phrase] Total de frases:', phrases.length);
      console.log('🔍 [Edit Phrase] IDs de frases:', phrases.map(p => ({ id: p.id, type: typeof p.id })));
      
      const foundPhrase = phrases.find(p => String(p.id) === String(id));
      if (foundPhrase) {
        console.log('✅ [Edit Phrase] Frase encontrada:', foundPhrase.text.substring(0, 50));
        console.log('🔍 [Edit Phrase] Filtros de la frase:', foundPhrase.filters);
        setPhrase(foundPhrase);
        setText(foundPhrase.text);
        setSelectedFilters(foundPhrase.filters || []);
      } else {
        console.error('❌ [Edit Phrase] Frase NO encontrada con ID:', id);
        console.log('⚠️ [Edit Phrase] Retrocediendo...');
        router.back();
      }
    }
  }, [id, phrases]);

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
    if (!phrase) return;
    
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
      const updatedPhrases = phrases.map(p =>
        p.id === phrase.id
          ? {
              ...p,
              text: text.trim(),
              filters: selectedFilters,
            }
          : p
      );

      await savePhrases(updatedPhrases);
      
      if (Platform.OS === 'web') {
        alert('Frase actualizada exitosamente');
      } else {
        Alert.alert('Éxito', 'Frase actualizada exitosamente');
      }
      
      router.back();
    } catch (error) {
      console.error('Error updating phrase:', error);
      if (Platform.OS === 'web') {
        alert('Error al actualizar la frase');
      } else {
        Alert.alert('Error', 'Error al actualizar la frase');
      }
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancel = () => {
    if (!phrase) {
      router.back();
      return;
    }
    
    const hasChanges = 
      text !== phrase.text || 
      JSON.stringify(selectedFilters.sort()) !== JSON.stringify((phrase.filters || []).sort());
    
    if (hasChanges) {
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

  if (!phrase) {
    return (
      <View style={[styles.container, styles.centered, { backgroundColor: theme.background }]}>
        <Text style={[styles.loadingText, { color: theme.onSurface }]}>
          Cargando frase...
        </Text>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
        <Stack.Screen
          options={{
            title: 'Editar Frase',
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
          <View style={styles.formSection}>
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
              {isSaving ? 'Guardando...' : 'Guardar Cambios'}
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
  centered: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 16,
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
    paddingVertical: 16,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
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