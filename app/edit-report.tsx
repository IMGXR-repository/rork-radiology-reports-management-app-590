import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ScrollView, Alert, Platform } from 'react-native';
import { Stack, router, useLocalSearchParams } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Save, X, Tag } from 'lucide-react-native';
import { useApp } from '@/contexts/AppContext';
import { Report } from '@/types';
import { lightTheme, darkTheme } from '@/constants/theme';

export default function EditReportScreen() {
  const { reportCategories, reportFilters, reports, updateReport, settings } = useApp();
  const theme = settings.theme === 'dark' ? darkTheme : lightTheme;
  const insets = useSafeAreaInsets();
  const { id } = useLocalSearchParams<{ id: string }>();
  
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [selectedFilters, setSelectedFilters] = useState<string[]>([]);
  const [isSaving, setIsSaving] = useState(false);
  const [report, setReport] = useState<Report | null>(null);

  const visibleCategories = reportCategories.filter(cat => cat.isVisible);
  const activeFilters = reportFilters.filter(filter => filter.isActive);

  useEffect(() => {
    if (id) {
      console.log('🔍 [Edit] Buscando informe con ID:', id);
      console.log('🔍 [Edit] Total de informes:', reports.length);
      console.log('🔍 [Edit] IDs de informes:', reports.map(r => r.id));
      
      const foundReport = reports.find(r => r.id === id);
      
      if (foundReport) {
        console.log('✅ [Edit] Informe encontrado:', foundReport.title);
        console.log('🔍 [Edit] Filtros del informe:', foundReport.filters);
        setReport(foundReport);
        setTitle(foundReport.title);
        setContent(foundReport.content);
        setSelectedFilters(foundReport.filters || []);
      } else {
        console.error('❌ [Edit] Informe NO encontrado con ID:', id);
        console.log('⚠️ [Edit] Retrocediendo...');
        // Report not found, go back
        router.back();
      }
    }
  }, [id, reports]);

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
    if (!report) return;
    
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
      await updateReport(report.id, {
        title: title.trim(),
        content: content.trim(),
        filters: selectedFilters,
      });
      
      if (Platform.OS === 'web') {
        alert('Informe actualizado exitosamente');
      } else {
        Alert.alert('Éxito', 'Informe actualizado exitosamente');
      }
      
      router.back();
    } catch (error) {
      console.error('Error updating report:', error);
      if (Platform.OS === 'web') {
        alert('Error al actualizar el informe');
      } else {
        Alert.alert('Error', 'Error al actualizar el informe');
      }
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancel = () => {
    if (!report) {
      router.back();
      return;
    }
    
    const hasChanges = 
      title !== report.title || 
      content !== report.content || 
      JSON.stringify(selectedFilters.sort()) !== JSON.stringify((report.filters || []).sort());
    
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

  if (!report) {
    return (
      <View style={[styles.container, styles.centered, { backgroundColor: theme.background }]}>
        <Text style={[styles.loadingText, { color: theme.onSurface }]}>
          Cargando informe...
        </Text>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
        <Stack.Screen
          options={{
            title: 'Editar Informe',
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
});