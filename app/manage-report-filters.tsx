import React, { useState } from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet, TextInput, Alert, Platform } from 'react-native';
import { Stack, router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Plus, Settings, Eye, EyeOff, Edit, Trash2, Save, X } from 'lucide-react-native';
import { useApp } from '@/contexts/AppContext';
import { ReportCategory, ReportFilter } from '@/types';
import { lightTheme, darkTheme } from '@/constants/theme';

export default function ManageReportFiltersScreen() {
  const { reportCategories, reportFilters, saveReportCategories, saveReportFilters, settings } = useApp();
  const theme = settings.theme === 'dark' ? darkTheme : lightTheme;
  const insets = useSafeAreaInsets();
  
  const [editingCategory, setEditingCategory] = useState<string | null>(null);
  const [editingFilter, setEditingFilter] = useState<string | null>(null);
  const [newCategoryName, setNewCategoryName] = useState('');
  const [newFilterName, setNewFilterName] = useState('');
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(null);
  const [showAddCategory, setShowAddCategory] = useState(false);
  const [showAddFilter, setShowAddFilter] = useState(false);

  const handleToggleCategoryVisibility = async (categoryId: string) => {
    const updatedCategories = reportCategories.map(cat =>
      cat.id === categoryId ? { ...cat, isVisible: !cat.isVisible } : cat
    );
    await saveReportCategories(updatedCategories);
  };

  const handleToggleFilterActive = async (filterId: string) => {
    const updatedFilters = reportFilters.map(filter =>
      filter.id === filterId ? { ...filter, isActive: !filter.isActive } : filter
    );
    await saveReportFilters(updatedFilters);
  };

  const handleAddCategory = async () => {
    if (!newCategoryName.trim()) return;
    
    const newCategory: ReportCategory = {
      id: `report_cat_${Date.now()}`,
      name: newCategoryName.trim(),
      isVisible: true,
      color: '#2196F3',
      icon: 'Settings',
      createdAt: new Date().toISOString(),
    };
    
    await saveReportCategories([...reportCategories, newCategory]);
    setNewCategoryName('');
    setShowAddCategory(false);
  };

  const handleAddFilter = async () => {
    if (!newFilterName.trim() || !selectedCategoryId) return;
    
    const newFilter: ReportFilter = {
      id: `report_filter_${Date.now()}`,
      name: newFilterName.trim(),
      categoryId: selectedCategoryId,
      isActive: true,
      createdAt: new Date().toISOString(),
    };
    
    await saveReportFilters([...reportFilters, newFilter]);
    setNewFilterName('');
    setSelectedCategoryId(null);
    setShowAddFilter(false);
  };

  const handleEditCategory = async (categoryId: string, newName: string) => {
    if (!newName.trim()) return;
    
    const updatedCategories = reportCategories.map(cat =>
      cat.id === categoryId ? { ...cat, name: newName.trim() } : cat
    );
    await saveReportCategories(updatedCategories);
    setEditingCategory(null);
  };

  const handleEditFilter = async (filterId: string, newName: string) => {
    if (!newName.trim()) return;
    
    const updatedFilters = reportFilters.map(filter =>
      filter.id === filterId ? { ...filter, name: newName.trim() } : filter
    );
    await saveReportFilters(updatedFilters);
    setEditingFilter(null);
  };

  const handleDeleteCategory = (categoryId: string) => {
    const categoryFilters = reportFilters.filter(f => f.categoryId === categoryId);
    const message = categoryFilters.length > 0 
      ? `Esta categoría tiene ${categoryFilters.length} filtros. ¿Eliminar categoría y todos sus filtros?`
      : '¿Eliminar esta categoría?';
    
    if (Platform.OS === 'web') {
      if (confirm(message)) {
        deleteCategory(categoryId);
      }
    } else {
      Alert.alert(
        'Eliminar Categoría',
        message,
        [
          { text: 'Cancelar', style: 'cancel' },
          { text: 'Eliminar', style: 'destructive', onPress: () => deleteCategory(categoryId) },
        ]
      );
    }
  };

  const deleteCategory = async (categoryId: string) => {
    const updatedCategories = reportCategories.filter(cat => cat.id !== categoryId);
    const updatedFilters = reportFilters.filter(filter => filter.categoryId !== categoryId);
    await saveReportCategories(updatedCategories);
    await saveReportFilters(updatedFilters);
  };

  const handleDeleteFilter = (filterId: string) => {
    if (Platform.OS === 'web') {
      if (confirm('¿Eliminar este filtro?')) {
        deleteFilter(filterId);
      }
    } else {
      Alert.alert(
        'Eliminar Filtro',
        '¿Eliminar este filtro?',
        [
          { text: 'Cancelar', style: 'cancel' },
          { text: 'Eliminar', style: 'destructive', onPress: () => deleteFilter(filterId) },
        ]
      );
    }
  };

  const deleteFilter = async (filterId: string) => {
    const updatedFilters = reportFilters.filter(filter => filter.id !== filterId);
    await saveReportFilters(updatedFilters);
  };

  const getFiltersForCategory = (categoryId: string) => {
    return reportFilters.filter(filter => filter.categoryId === categoryId);
  };

  const renderCategoryItem = ({ item: category }: { item: ReportCategory }) => {
    const categoryFilters = getFiltersForCategory(category.id);
    const isEditing = editingCategory === category.id;
    
    return (
      <View style={[styles.categoryCard, { backgroundColor: theme.surface, borderColor: theme.outline }]}>
        <View style={styles.categoryHeader}>
          <View style={styles.categoryInfo}>
            <View style={[styles.categoryColorIndicator, { backgroundColor: category.color }]} />
            {isEditing ? (
              <TextInput
                style={[styles.editInput, { color: theme.onSurface, borderColor: theme.outline }]}
                value={newCategoryName}
                onChangeText={setNewCategoryName}
                onSubmitEditing={() => handleEditCategory(category.id, newCategoryName)}
                autoFocus
                placeholder="Nombre de categoría"
                placeholderTextColor={theme.outline}
              />
            ) : (
              <Text style={[styles.categoryName, { color: theme.onSurface }]}>
                {category.name}
              </Text>
            )}
          </View>
          
          <View style={styles.categoryActions}>
            <TouchableOpacity
              onPress={() => handleToggleCategoryVisibility(category.id)}
              style={[styles.actionButton, { backgroundColor: category.isVisible ? theme.primary : theme.outline }]}
            >
              {category.isVisible ? (
                <Eye size={16} color={theme.onPrimary} />
              ) : (
                <EyeOff size={16} color={theme.onSurface} />
              )}
            </TouchableOpacity>
            
            {isEditing ? (
              <>
                <TouchableOpacity
                  onPress={() => handleEditCategory(category.id, newCategoryName)}
                  style={[styles.actionButton, { backgroundColor: theme.primary }]}
                >
                  <Save size={16} color={theme.onPrimary} />
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={() => {
                    setEditingCategory(null);
                    setNewCategoryName('');
                  }}
                  style={[styles.actionButton, { backgroundColor: theme.outline }]}
                >
                  <X size={16} color={theme.onSurface} />
                </TouchableOpacity>
              </>
            ) : (
              <>
                <TouchableOpacity
                  onPress={() => {
                    setEditingCategory(category.id);
                    setNewCategoryName(category.name);
                  }}
                  style={[styles.actionButton, { backgroundColor: theme.secondary }]}
                >
                  <Edit size={16} color={theme.onSecondary} />
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={() => handleDeleteCategory(category.id)}
                  style={[styles.actionButton, { backgroundColor: theme.error }]}
                >
                  <Trash2 size={16} color={theme.onError} />
                </TouchableOpacity>
              </>
            )}
          </View>
        </View>
        
        <Text style={[styles.filtersCount, { color: theme.outline }]}>
          {categoryFilters.length} filtros
        </Text>
        
        {categoryFilters.map(filter => {
          const isEditingFilter = editingFilter === filter.id;
          return (
            <View key={filter.id} style={styles.filterItem}>
              <View style={styles.filterInfo}>
                {isEditingFilter ? (
                  <TextInput
                    style={[styles.editInput, { color: theme.onSurface, borderColor: theme.outline }]}
                    value={newFilterName}
                    onChangeText={setNewFilterName}
                    onSubmitEditing={() => handleEditFilter(filter.id, newFilterName)}
                    autoFocus
                    placeholder="Nombre del filtro"
                    placeholderTextColor={theme.outline}
                  />
                ) : (
                  <Text style={[styles.filterName, { color: theme.onSurface, opacity: filter.isActive ? 1 : 0.5 }]}>
                    {filter.name}
                  </Text>
                )}
              </View>
              
              <View style={styles.filterActions}>
                <TouchableOpacity
                  onPress={() => handleToggleFilterActive(filter.id)}
                  style={[
                    styles.actionButton,
                    { backgroundColor: filter.isActive ? theme.primary : theme.outline }
                  ]}
                >
                  <Settings size={14} color={filter.isActive ? theme.onPrimary : theme.onSurface} />
                </TouchableOpacity>
                
                {isEditingFilter ? (
                  <>
                    <TouchableOpacity
                      onPress={() => handleEditFilter(filter.id, newFilterName)}
                      style={[styles.actionButton, { backgroundColor: theme.primary }]}
                    >
                      <Save size={14} color={theme.onPrimary} />
                    </TouchableOpacity>
                    <TouchableOpacity
                      onPress={() => {
                        setEditingFilter(null);
                        setNewFilterName('');
                      }}
                      style={[styles.actionButton, { backgroundColor: theme.outline }]}
                    >
                      <X size={14} color={theme.onSurface} />
                    </TouchableOpacity>
                  </>
                ) : (
                  <>
                    <TouchableOpacity
                      onPress={() => {
                        setEditingFilter(filter.id);
                        setNewFilterName(filter.name);
                      }}
                      style={[styles.actionButton, { backgroundColor: theme.secondary }]}
                    >
                      <Edit size={14} color={theme.onSecondary} />
                    </TouchableOpacity>
                    <TouchableOpacity
                      onPress={() => handleDeleteFilter(filter.id)}
                      style={[styles.actionButton, { backgroundColor: theme.error }]}
                    >
                      <Trash2 size={14} color={theme.onError} />
                    </TouchableOpacity>
                  </>
                )}
              </View>
            </View>
          );
        })}
        
        <TouchableOpacity
          onPress={() => {
            setSelectedCategoryId(category.id);
            setShowAddFilter(true);
          }}
          style={[styles.addFilterButton, { borderColor: theme.primary }]}
        >
          <Plus size={16} color={theme.primary} />
          <Text style={[styles.addFilterText, { color: theme.primary }]}>
            Agregar filtro
          </Text>
        </TouchableOpacity>
      </View>
    );
  };

  return (
    <View style={[styles.safeContainer, { backgroundColor: theme.background }]}>
      <View style={[styles.topSafeArea, { height: insets.top, backgroundColor: theme.surface }]} />
      <View style={[styles.container, { backgroundColor: theme.background }]}>
        <Stack.Screen
          options={{
            title: 'Gestionar Filtros de Informes',
            headerStyle: { backgroundColor: theme.surface },
            headerTintColor: theme.onSurface,
            headerRight: () => (
              <TouchableOpacity
                onPress={() => setShowAddCategory(true)}
                style={styles.headerButton}
              >
                <Plus size={20} color={theme.onSurface} />
              </TouchableOpacity>
            ),
          }}
        />

        <FlatList
          data={reportCategories}
          renderItem={renderCategoryItem}
          keyExtractor={item => item.id}
          contentContainerStyle={styles.listContainer}
          showsVerticalScrollIndicator={false}
        />
      </View>
      
      {/* Add Category Modal */}
      {showAddCategory && (
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: theme.surface }]}>
            <Text style={[styles.modalTitle, { color: theme.onSurface }]}>
              Nueva Categoría
            </Text>
            <TextInput
              style={[styles.modalInput, { color: theme.onSurface, borderColor: theme.outline }]}
              value={newCategoryName}
              onChangeText={setNewCategoryName}
              placeholder="Nombre de la categoría"
              placeholderTextColor={theme.outline}
              autoFocus
            />
            <View style={styles.modalActions}>
              <TouchableOpacity
                onPress={() => {
                  setShowAddCategory(false);
                  setNewCategoryName('');
                }}
                style={[styles.modalButton, { backgroundColor: theme.outline }]}
              >
                <Text style={[styles.modalButtonText, { color: theme.onSurface }]}>Cancelar</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={handleAddCategory}
                style={[styles.modalButton, { backgroundColor: theme.primary }]}
              >
                <Text style={[styles.modalButtonText, { color: theme.onPrimary }]}>Crear</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      )}
      
      {/* Add Filter Modal */}
      {showAddFilter && (
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: theme.surface }]}>
            <Text style={[styles.modalTitle, { color: theme.onSurface }]}>
              Nuevo Filtro
            </Text>
            <TextInput
              style={[styles.modalInput, { color: theme.onSurface, borderColor: theme.outline }]}
              value={newFilterName}
              onChangeText={setNewFilterName}
              placeholder="Nombre del filtro"
              placeholderTextColor={theme.outline}
              autoFocus
            />
            <View style={styles.modalActions}>
              <TouchableOpacity
                onPress={() => {
                  setShowAddFilter(false);
                  setNewFilterName('');
                  setSelectedCategoryId(null);
                }}
                style={[styles.modalButton, { backgroundColor: theme.outline }]}
              >
                <Text style={[styles.modalButtonText, { color: theme.onSurface }]}>Cancelar</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={handleAddFilter}
                style={[styles.modalButton, { backgroundColor: theme.primary }]}
              >
                <Text style={[styles.modalButtonText, { color: theme.onPrimary }]}>Crear</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      )}
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
  listContainer: {
    paddingBottom: 20,
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
    marginBottom: 8,
  },
  categoryInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  categoryColorIndicator: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: 12,
  },
  categoryName: {
    fontSize: 16,
    fontWeight: '600',
    flex: 1,
  },
  categoryActions: {
    flexDirection: 'row',
    gap: 8,
  },
  actionButton: {
    padding: 8,
    borderRadius: 6,
  },
  filtersCount: {
    fontSize: 12,
    marginBottom: 12,
    marginLeft: 24,
  },
  filterItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    paddingLeft: 24,
    borderLeftWidth: 2,
    borderLeftColor: '#E0E0E0',
    marginBottom: 4,
  },
  filterInfo: {
    flex: 1,
  },
  filterName: {
    fontSize: 14,
  },
  filterActions: {
    flexDirection: 'row',
    gap: 6,
  },
  addFilterButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    marginTop: 8,
    borderWidth: 1,
    borderRadius: 8,
    borderStyle: 'dashed',
    gap: 8,
  },
  addFilterText: {
    fontSize: 14,
    fontWeight: '500',
  },
  editInput: {
    borderWidth: 1,
    borderRadius: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontSize: 14,
    flex: 1,
  },
  modalOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    borderRadius: 12,
    padding: 24,
    marginHorizontal: 32,
    width: '80%',
    maxWidth: 400,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 16,
    textAlign: 'center',
  },
  modalInput: {
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    marginBottom: 24,
  },
  modalActions: {
    flexDirection: 'row',
    gap: 12,
  },
  modalButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  modalButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
});