import React, { useState, useMemo } from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet } from 'react-native';
import { Stack, router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Plus, Heart, Filter, Layers } from 'lucide-react-native';
import { ReportCard } from '@/components/ReportCard';
import { SearchBar } from '@/components/SearchBar';
import { FilterChips } from '@/components/FilterChips';
import { SectionToggle } from '@/components/SectionToggle';

import { useApp } from '@/contexts/AppContext';
import { useSampleData } from '@/hooks/useSampleData';
import { Report } from '@/types';
import { lightTheme, darkTheme } from '@/constants/theme';

export default function ReportsScreen() {
  const { reports, settings, isLoading, filters, clearNewlyCreatedFlag } = useApp();
  const theme = settings.theme === 'dark' ? darkTheme : lightTheme;
  const insets = useSafeAreaInsets();
  
  // Load sample data on first run
  useSampleData();
  
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedFilters, setSelectedFilters] = useState<string[]>([]);
  const [showFavoritesOnly, setShowFavoritesOnly] = useState(false);

  const filteredReports = useMemo(() => {
    let filtered = reports;

    // Filter by search query
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        report =>
          report.title.toLowerCase().includes(query) ||
          report.content.toLowerCase().includes(query)
      );
    }

    // Filter by selected filters
    if (selectedFilters.length > 0) {
      filtered = filtered.filter(report =>
        selectedFilters.some(filterId =>
          report.filters.includes(filterId)
        )
      );
    }

    // Filter by favorites
    if (showFavoritesOnly) {
      filtered = filtered.filter(report => report.isFavorite);
    }

    // Sort: newly created first, then by favorites if enabled, then by date
    filtered.sort((a, b) => {
      if (a.isNewlyCreated && !b.isNewlyCreated) return -1;
      if (!a.isNewlyCreated && b.isNewlyCreated) return 1;
      
      if (settings.showFavoritesFirst) {
        if (a.isFavorite && !b.isFavorite) return -1;
        if (!a.isFavorite && b.isFavorite) return 1;
      }
      
      return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
    });

    return filtered;
  }, [reports, searchQuery, selectedFilters, showFavoritesOnly, settings.showFavoritesFirst]);

  const handleFilterToggle = (filterId: string, categoryId: string) => {
    clearNewlyCreatedFlag();
    setSelectedFilters(prev => {
      // Si filterId está vacío, significa que se seleccionó "Todos" para esta categoría
      if (filterId === '') {
        // Remover todos los filtros de esta categoría
        const categoryFilterIds = filters
          .filter(filter => filter.categoryId === categoryId)
          .map(filter => filter.id);
        return prev.filter(id => !categoryFilterIds.includes(id));
      }
      
      // Remover cualquier filtro existente de esta categoría
      const categoryFilterIds = filters
        .filter(filter => filter.categoryId === categoryId)
        .map(filter => filter.id);
      const withoutCategoryFilters = prev.filter(id => !categoryFilterIds.includes(id));
      
      // Agregar el nuevo filtro seleccionado
      return [...withoutCategoryFilters, filterId];
    });
  };

  const handleCreateReport = () => {
    router.push('/create-report');
  };

  const handleManageFilters = () => {
    router.push('/manage-report-filters');
  };

  const handleCategories = () => {
    router.push('/categories?source=reports');
  };

  const handleEditReport = (report: Report) => {
    router.push(`/edit-report?id=${report.id}`);
  };

  const renderReport = ({ item }: { item: Report }) => (
    <ReportCard report={item} onEdit={handleEditReport} />
  );

  const renderEmptyState = () => (
    <View style={styles.emptyState}>
      <Text style={[styles.emptyTitle, { color: theme.onSurface }]}>
        {searchQuery || selectedFilters.length > 0 || showFavoritesOnly
          ? 'No se encontraron informes'
          : 'No hay informes guardados'}
      </Text>
      <Text style={[styles.emptySubtitle, { color: theme.outline }]}>
        {searchQuery || selectedFilters.length > 0 || showFavoritesOnly
          ? 'Intenta ajustar los filtros de búsqueda'
          : 'Crea tu primer informe médico'}
      </Text>
      {!searchQuery && selectedFilters.length === 0 && !showFavoritesOnly && (
        <TouchableOpacity
          onPress={handleCreateReport}
          style={[styles.createButton, { backgroundColor: theme.primary }]}
        >
          <Plus size={20} color={theme.onPrimary} />
          <Text style={[styles.createButtonText, { color: theme.onPrimary }]}>
            Crear Informe
          </Text>
        </TouchableOpacity>
      )}
    </View>
  );

  if (isLoading) {
    return (
      <View style={[styles.safeContainer, { backgroundColor: theme.background }]}>
        <View style={[styles.topSafeArea, { height: insets.top, backgroundColor: theme.surface }]} />
        <View style={[styles.container, styles.centered, { backgroundColor: theme.background }]}>
          <Text style={[styles.loadingText, { color: theme.onSurface }]}>
            Cargando informes...
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
            title: 'PREF - Informes',
            headerStyle: { backgroundColor: theme.surface },
            headerTintColor: theme.onSurface,
            headerRight: () => (
              <View style={styles.headerActions}>
                <TouchableOpacity
                  onPress={() => setShowFavoritesOnly(!showFavoritesOnly)}
                  style={[
                    styles.headerButton,
                    showFavoritesOnly && { backgroundColor: theme.primaryVariant }
                  ]}
                >
                  <Heart
                    size={20}
                    color={showFavoritesOnly ? theme.onPrimary : theme.onSurface}
                    fill={showFavoritesOnly ? theme.onPrimary : 'transparent'}
                  />
                </TouchableOpacity>
                <TouchableOpacity onPress={handleCreateReport} style={styles.headerButton}>
                  <Plus size={20} color={theme.onSurface} />
                </TouchableOpacity>
              </View>
            ),
          }}
        />

        <SectionToggle />
        



        <View style={styles.actionButtonsContainer}>
          <View style={styles.filterCategoryGroup}>
            <TouchableOpacity
              onPress={handleManageFilters}
              style={[styles.filterButton, { backgroundColor: theme.surfaceVariant, borderColor: theme.outline }]}
            >
              <Filter size={16} color={theme.primary} />
              <Text style={[styles.filterButtonText, { color: theme.primary }]}>Filtros</Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={handleCategories}
              style={[styles.categoryButton, { backgroundColor: theme.surfaceVariant, borderColor: theme.outline }]}
            >
              <Layers size={16} color={theme.primary} />
            </TouchableOpacity>
          </View>
          <TouchableOpacity
            onPress={handleCreateReport}
            style={[styles.addButton, { backgroundColor: theme.primary }]}
          >
            <Plus size={20} color={theme.onPrimary} />
          </TouchableOpacity>
        </View>

        <View style={styles.searchContainer}>
          <SearchBar
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholder="Buscar informes..."
          />
        </View>

        <FilterChips
          selectedFilters={selectedFilters}
          onFilterToggle={handleFilterToggle}
        />

        {selectedFilters.length > 0 && (
          <View style={styles.activeFiltersInfo}>
            <Text style={[styles.activeFiltersText, { color: theme.onSurface }]}>
              {selectedFilters.length} filtro{selectedFilters.length !== 1 ? 's' : ''} activo{selectedFilters.length !== 1 ? 's' : ''}
            </Text>
            <TouchableOpacity onPress={() => setSelectedFilters([])}>
              <Text style={[styles.clearFiltersText, { color: theme.primary }]}>
                Limpiar
              </Text>
            </TouchableOpacity>
          </View>
        )}

        <FlatList
          data={filteredReports}
          renderItem={renderReport}
          keyExtractor={item => item.id}
          contentContainerStyle={filteredReports.length === 0 ? styles.emptyContainer : styles.listContainer}
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
  headerActions: {
    flexDirection: 'row',
    gap: 8,
  },
  headerButton: {
    padding: 8,
    borderRadius: 8,
  },
  loadingText: {
    fontSize: 16,
  },
  activeFiltersInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  activeFiltersText: {
    fontSize: 14,
    fontWeight: '500',
  },
  clearFiltersText: {
    fontSize: 14,
    fontWeight: '600',
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
  searchContainer: {
    paddingHorizontal: 16,
    paddingTop: 8,
  },
  actionButtonsContainer: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 12,
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  filterCategoryGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  filterButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    gap: 6,
  },
  filterButtonText: {
    fontSize: 14,
    fontWeight: '500',
  },
  categoryButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
  },
  addButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
});