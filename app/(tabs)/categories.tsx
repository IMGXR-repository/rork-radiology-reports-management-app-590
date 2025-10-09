import React, { useState, useEffect } from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet, Switch, Platform } from 'react-native';
import { Stack, router, useLocalSearchParams } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Plus, Edit, Trash2, Settings, ArrowLeft } from 'lucide-react-native';
import { useApp } from '@/contexts/AppContext';
import { ReportCategory, PhraseCategory } from '@/types';
import { lightTheme, darkTheme } from '@/constants/theme';

export default function CategoriesScreen() {
  const { source } = useLocalSearchParams<{ source?: string }>();
  const { 
    reportCategories, 
    reportFilters, 
    phraseCategories, 
    phraseFilters, 
    saveReportCategories, 
    saveReportFilters,
    savePhraseCategories,
    savePhraseFilters,
    settings, 
    isLoading 
  } = useApp();
  const theme = settings.theme === 'dark' ? darkTheme : lightTheme;
  const insets = useSafeAreaInsets();
  
  const [activeTab, setActiveTab] = useState<'reports' | 'phrases'>('reports');
  
  useEffect(() => {
    if (source === 'phrases') {
      setActiveTab('phrases');
    } else {
      setActiveTab('reports');
    }
  }, [source]);
  
  const currentCategories = activeTab === 'reports' ? reportCategories : phraseCategories;
  const currentFilters = activeTab === 'reports' ? reportFilters : phraseFilters;
  const saveCurrentCategories = activeTab === 'reports' ? saveReportCategories : savePhraseCategories;
  const saveCurrentFilters = activeTab === 'reports' ? saveReportFilters : savePhraseFilters;

  const handleToggleVisibility = async (categoryId: string) => {
    const updatedCategories = currentCategories.map(cat =>
      cat.id === categoryId ? { ...cat, isVisible: !cat.isVisible } : cat
    );
    await saveCurrentCategories(updatedCategories);
  };

  const handleCreateCategory = () => {
    const sectionName = activeTab === 'reports' ? 'informes' : 'frases';
    if (Platform.OS === 'web') {
      alert(`Funcionalidad de creación de categorías para ${sectionName} próximamente`);
    } else {
      const Alert = require('react-native').Alert;
      Alert.alert('Crear Categoría', `Funcionalidad de creación de categorías para ${sectionName} próximamente`);
    }
  };

  const handleEditCategory = () => {
    if (Platform.OS === 'web') {
      alert('Funcionalidad de edición próximamente');
    } else {
      const Alert = require('react-native').Alert;
      Alert.alert('Editar Categoría', 'Funcionalidad de edición próximamente');
    }
  };

  const handleDeleteCategory = (category: ReportCategory | PhraseCategory) => {
    const categoryFilters = currentFilters.filter(f => f.categoryId === category.id);
    const message = `¿Estás seguro de que quieres eliminar "${category.name}"? ${
      categoryFilters.length > 0 
        ? `Esto también eliminará ${categoryFilters.length} filtro${categoryFilters.length !== 1 ? 's' : ''} asociado${categoryFilters.length !== 1 ? 's' : ''}.`
        : ''
    }`;
    
    if (Platform.OS === 'web') {
      if (confirm(message)) {
        const updatedCategories = currentCategories.filter(cat => cat.id !== category.id);
        const updatedFilters = currentFilters.filter(f => f.categoryId !== category.id);
        saveCurrentCategories(updatedCategories);
        saveCurrentFilters(updatedFilters);
      }
    } else {
      const Alert = require('react-native').Alert;
      Alert.alert(
        'Eliminar Categoría',
        message,
        [
          { text: 'Cancelar', style: 'cancel' },
          {
            text: 'Eliminar',
            style: 'destructive',
            onPress: async () => {
              const updatedCategories = currentCategories.filter(cat => cat.id !== category.id);
              const updatedFilters = currentFilters.filter(f => f.categoryId !== category.id);
              await saveCurrentCategories(updatedCategories);
              await saveCurrentFilters(updatedFilters);
            },
          },
        ]
      );
    }
  };

  const handleManageFilters = (category: ReportCategory | PhraseCategory) => {
    const sectionName = activeTab === 'reports' ? 'informes' : 'frases';
    if (Platform.OS === 'web') {
      alert(`Gestión de filtros de ${sectionName} para "${category.name}" próximamente`);
    } else {
      const Alert = require('react-native').Alert;
      Alert.alert('Gestionar Filtros', `Gestión de filtros de ${sectionName} para "${category.name}" próximamente`);
    }
  };

  const getFiltersCount = (categoryId: string) => {
    return currentFilters.filter(f => f.categoryId === categoryId).length;
  };

  const getActiveFiltersCount = (categoryId: string) => {
    return currentFilters.filter(f => f.categoryId === categoryId && f.isActive).length;
  };

  const renderCategory = ({ item }: { item: ReportCategory | PhraseCategory }) => {
    const filtersCount = getFiltersCount(item.id);
    const activeFiltersCount = getActiveFiltersCount(item.id);

    return (
      <View style={[styles.categoryCard, { backgroundColor: theme.surface, borderColor: theme.outline }]}>
        <View style={styles.categoryHeader}>
          <View style={styles.categoryInfo}>
            <View style={[styles.categoryIcon, { backgroundColor: item.color }]}>
              <Text style={[styles.categoryIconText, { color: theme.onPrimary }]}>
                {item.name.charAt(0).toUpperCase()}
              </Text>
            </View>
            <View style={styles.categoryDetails}>
              <Text style={[styles.categoryName, { color: theme.onSurface }]}>
                {item.name}
              </Text>
              <Text style={[styles.categoryStats, { color: theme.outline }]}>
                {activeFiltersCount} de {filtersCount} filtros activos
              </Text>
            </View>
          </View>

          <View style={styles.visibilityToggle}>
            <Switch
              value={item.isVisible}
              onValueChange={() => handleToggleVisibility(item.id)}
              trackColor={{ false: theme.outline, true: theme.primary }}
              thumbColor={item.isVisible ? theme.onPrimary : theme.onSurface}
            />
          </View>
        </View>

        <View style={styles.categoryActions}>
          <TouchableOpacity
            onPress={() => handleManageFilters(item)}
            style={[styles.actionButton, { backgroundColor: theme.info }]}
          >
            <Settings size={16} color={theme.onPrimary} />
            <Text style={[styles.actionText, { color: theme.onPrimary }]}>
              Filtros ({filtersCount})
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => handleEditCategory()}
            style={[styles.actionButton, { backgroundColor: theme.secondary }]}
          >
            <Edit size={16} color={theme.onSecondary} />
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => handleDeleteCategory(item)}
            style={[styles.actionButton, { backgroundColor: theme.error }]}
          >
            <Trash2 size={16} color={theme.onError} />
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  const renderEmptyState = () => (
    <View style={styles.emptyState}>
      <Text style={[styles.emptyTitle, { color: theme.onSurface }]}>
        No hay categorías configuradas
      </Text>
      <Text style={[styles.emptySubtitle, { color: theme.outline }]}>
        Crea categorías para organizar tus {activeTab === 'reports' ? 'informes' : 'frases'} y filtros
      </Text>
      <TouchableOpacity
        onPress={handleCreateCategory}
        style={[styles.createButton, { backgroundColor: theme.primary }]}
      >
        <Plus size={20} color={theme.onPrimary} />
        <Text style={[styles.createButtonText, { color: theme.onPrimary }]}>
          Crear Categoría
        </Text>
      </TouchableOpacity>
    </View>
  );

  if (isLoading) {
    return (
      <View style={[styles.safeContainer, { backgroundColor: theme.background }]}>
        <View style={[styles.topSafeArea, { height: insets.top, backgroundColor: theme.surface }]} />
        <View style={[styles.container, styles.centered, { backgroundColor: theme.background }]}>
          <Text style={[styles.loadingText, { color: theme.onSurface }]}>
            Cargando categorías...
          </Text>
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.safeContainer, { backgroundColor: theme.background }]}>
      <View style={[styles.topSafeArea, { height: insets.top, backgroundColor: theme.surface }]} />
      <View style={[styles.container, { backgroundColor: theme.background }]}>
        <Stack.Screen
          options={{
            title: `Categorías - ${source === 'phrases' ? 'Frases' : 'Informes'}`,
            headerStyle: { backgroundColor: theme.surface },
            headerTintColor: theme.onSurface,
            headerLeft: () => (
              <TouchableOpacity onPress={() => {
                if (source === 'phrases') {
                  router.push('/(tabs)/phrases');
                } else {
                  router.push('/(tabs)/home');
                }
              }} style={styles.headerButton}>
                <ArrowLeft size={20} color={theme.onSurface} />
              </TouchableOpacity>
            ),
            headerRight: () => (
              <TouchableOpacity onPress={handleCreateCategory} style={styles.headerButton}>
                <Plus size={20} color={theme.onSurface} />
              </TouchableOpacity>
            ),
          }}
        />



        <View style={[styles.statsContainer, { backgroundColor: theme.surfaceVariant }]}>
          <View style={styles.statItem}>
            <Text style={[styles.statNumber, { color: theme.primary }]}>
              {currentCategories.length}
            </Text>
            <Text style={[styles.statLabel, { color: theme.onSurface }]}>
              Categorías
            </Text>
          </View>
          <View style={styles.statItem}>
            <Text style={[styles.statNumber, { color: theme.secondary }]}>
              {currentCategories.filter(c => c.isVisible).length}
            </Text>
            <Text style={[styles.statLabel, { color: theme.onSurface }]}>
              Visibles
            </Text>
          </View>
          <View style={styles.statItem}>
            <Text style={[styles.statNumber, { color: theme.info }]}>
              {currentFilters.length}
            </Text>
            <Text style={[styles.statLabel, { color: theme.onSurface }]}>
              Filtros
            </Text>
          </View>
        </View>

        <FlatList
          data={currentCategories}
          renderItem={renderCategory}
          keyExtractor={item => item.id}
          contentContainerStyle={currentCategories.length === 0 ? styles.emptyContainer : styles.listContainer}
          ListEmptyComponent={renderEmptyState}
          showsVerticalScrollIndicator={false}
        />
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
  centered: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerButton: {
    padding: 8,
    borderRadius: 8,
  },
  loadingText: {
    fontSize: 16,
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingVertical: 16,
    marginHorizontal: 16,
    marginVertical: 8,
    borderRadius: 12,
  },
  statItem: {
    alignItems: 'center',
  },
  statNumber: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  statLabel: {
    fontSize: 12,
    marginTop: 4,
  },
  listContainer: {
    paddingBottom: 20,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyState: {
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 8,
    textAlign: 'center',
  },
  emptySubtitle: {
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 20,
  },
  createButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 12,
    gap: 8,
  },
  createButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  categoryCard: {
    borderRadius: 12,
    padding: 16,
    marginHorizontal: 16,
    marginVertical: 8,
    borderWidth: 1,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  categoryHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  categoryInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  categoryIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  categoryIconText: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  categoryDetails: {
    flex: 1,
  },
  categoryName: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 2,
  },
  categoryStats: {
    fontSize: 12,
  },
  visibilityToggle: {
    marginLeft: 12,
  },
  categoryActions: {
    flexDirection: 'row',
    gap: 8,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    gap: 4,
    flex: 1,
    justifyContent: 'center',
  },
  actionText: {
    fontSize: 12,
    fontWeight: '500',
  },
  tabContainer: {
    flexDirection: 'row',
    marginHorizontal: 16,
    marginVertical: 8,
    borderRadius: 12,
    padding: 4,
  },
  tabButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    gap: 8,
  },
  tabText: {
    fontSize: 14,
    fontWeight: '600',
  },
});