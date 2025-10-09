import React, { useState, useMemo } from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet, Platform } from 'react-native';
import { Stack, router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Plus, TrendingUp, Filter, Heart, Share2, Layers } from 'lucide-react-native';
import * as Clipboard from 'expo-clipboard';
import { SearchBar } from '@/components/SearchBar';
import { PhraseFilterChips } from '@/components/PhraseFilterChips';
import { SectionToggle } from '@/components/SectionToggle';
import { useApp } from '@/contexts/AppContext';
import { useAuth } from '@/contexts/AuthContext';
import { ShareModal } from '@/components/ShareModal';
import { CommonPhrase } from '@/types';
import { lightTheme, darkTheme } from '@/constants/theme';

export default function PhrasesScreen() {
  const { phrases, settings, isLoading, togglePhraseFavorite, phraseFilters } = useApp();
  const { isAuthenticated } = useAuth();
  const theme = settings.theme === 'dark' ? darkTheme : lightTheme;
  const insets = useSafeAreaInsets();
  
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedFilters, setSelectedFilters] = useState<string[]>([]);
  const [showFrequentOnly, setShowFrequentOnly] = useState(false);
  const [shareModalVisible, setShareModalVisible] = useState(false);
  const [selectedPhraseForShare, setSelectedPhraseForShare] = useState<CommonPhrase | null>(null);

  const filteredPhrases = useMemo(() => {
    let filtered = phrases;

    // Filter by search query
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(phrase =>
        phrase.text.toLowerCase().includes(query)
      );
    }

    // Filter by selected filters
    if (selectedFilters.length > 0) {
      filtered = filtered.filter(phrase =>
        selectedFilters.some(filterId =>
          phrase.filters?.includes(filterId)
        )
      );
    }

    // Filter by frequent phrases
    if (showFrequentOnly) {
      filtered = filtered.filter(phrase => phrase.isFrequent);
    }

    // Sort by usage count and creation date
    filtered.sort((a, b) => {
      if (a.usageCount !== b.usageCount) {
        return b.usageCount - a.usageCount;
      }
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });

    return filtered;
  }, [phrases, searchQuery, selectedFilters, showFrequentOnly]);

  const handleCopyPhrase = async (phrase: CommonPhrase) => {
    try {
      await Clipboard.setStringAsync(phrase.text);
      if (Platform.OS !== 'web') {
        const Haptics = require('expo-haptics');
        Haptics.selectionAsync();
      }
      console.log('Frase copiada al portapapeles');
    } catch {
      console.log('No se pudo copiar la frase');
    }
  };

  const handleCreatePhrase = () => {
    router.push('/create-phrase');
  };

  const handleManageFilters = () => {
    router.push('/manage-phrase-filters');
  };

  const handleCategories = () => {
    router.push('/categories?source=phrases');
  };

  const handleEditPhrase = (phrase: CommonPhrase) => {
    router.push(`/edit-phrase?id=${phrase.id}`);
  };

  const handleFilterToggle = (filterId: string, categoryId: string) => {
    setSelectedFilters(prev => {
      // Si filterId está vacío, significa que se seleccionó "Todos" para esta categoría
      if (filterId === '') {
        // Remover todos los filtros de esta categoría
        const categoryFilterIds = phraseFilters
          .filter(filter => filter.categoryId === categoryId)
          .map(filter => filter.id);
        return prev.filter(id => !categoryFilterIds.includes(id));
      }
      
      // Remover cualquier filtro existente de esta categoría
      const categoryFilterIds = phraseFilters
        .filter(filter => filter.categoryId === categoryId)
        .map(filter => filter.id);
      const withoutCategoryFilters = prev.filter(id => !categoryFilterIds.includes(id));
      
      // Agregar el nuevo filtro seleccionado
      return [...withoutCategoryFilters, filterId];
    });
  };

  const handleDeletePhrase = () => {
    if (Platform.OS === 'web') {
      if (confirm('¿Estás seguro de que quieres eliminar esta frase?')) {
        console.log('Frase eliminada correctamente');
      }
    } else {
      const Alert = require('react-native').Alert;
      Alert.alert(
        'Eliminar Frase',
        '¿Estás seguro de que quieres eliminar esta frase?',
        [
          { text: 'Cancelar', style: 'cancel' },
          {
            text: 'Eliminar',
            style: 'destructive',
            onPress: () => {
              console.log('Frase eliminada correctamente');
            },
          },
        ]
      );
    }
  };

  const handleSharePhrase = (phrase: CommonPhrase) => {
    if (isAuthenticated) {
      setSelectedPhraseForShare(phrase);
      setShareModalVisible(true);
    } else {
      router.push('/chat');
      console.log('Compartir frase:', phrase.text);
    }
  };

  const handleToggleFavorite = (phrase: CommonPhrase) => {
    togglePhraseFavorite(phrase.id);
    if (Platform.OS !== 'web') {
      const Haptics = require('expo-haptics');
      Haptics.selectionAsync();
    }
  };

  const renderPhrase = ({ item }: { item: CommonPhrase }) => (
    <View style={[styles.phraseCard, { backgroundColor: theme.surface, borderColor: theme.outline }]}>
      <View style={styles.phraseHeader}>
        <View style={styles.headerActions}>
          {isAuthenticated && (
            <TouchableOpacity onPress={() => handleSharePhrase(item)} style={styles.shareButton}>
              <Share2 size={18} color={theme.primary} />
            </TouchableOpacity>
          )}
          <TouchableOpacity onPress={() => handleToggleFavorite(item)} style={styles.favoriteButton}>
            <Heart
              size={20}
              color={item.isFavorite ? theme.error : theme.outline}
              fill={item.isFavorite ? theme.error : 'transparent'}
            />
          </TouchableOpacity>
        </View>
      </View>

      <TouchableOpacity onPress={() => handleCopyPhrase(item)} style={styles.contentContainer}>
        <Text style={[styles.phraseText, { color: theme.onSurface }]} numberOfLines={3}>
          {item.text}
        </Text>
        <Text style={[styles.copyHint, { color: theme.outline }]}>
          Toca en cualquier lugar para copiar la frase completa
        </Text>
      </TouchableOpacity>

      <View style={styles.bottomActions}>
        <TouchableOpacity onPress={() => handleEditPhrase(item)} style={styles.editButton}>
          <Text style={styles.editButtonText}>Editar</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={() => handleDeletePhrase()} style={styles.deleteButton}>
          <Text style={styles.deleteButtonText}>Eliminar</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  const renderEmptyState = () => (
    <View style={styles.emptyState}>
      <Text style={[styles.emptyTitle, { color: theme.onSurface }]}>
        {searchQuery || selectedFilters.length > 0 || showFrequentOnly
          ? 'No se encontraron frases'
          : 'No hay frases guardadas'}
      </Text>
      <Text style={[styles.emptySubtitle, { color: theme.outline }]}>
        {searchQuery || selectedFilters.length > 0 || showFrequentOnly
          ? 'Intenta ajustar los filtros de búsqueda'
          : 'Crea tu primera frase común'}
      </Text>
      {!searchQuery && selectedFilters.length === 0 && !showFrequentOnly && (
        <TouchableOpacity
          onPress={handleCreatePhrase}
          style={[styles.createButton, { backgroundColor: theme.primary }]}
        >
          <Plus size={20} color={theme.onPrimary} />
          <Text style={[styles.createButtonText, { color: theme.onPrimary }]}>
            Crear Frase
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
            Cargando frases...
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
            title: 'Frases Comunes',
            headerStyle: { backgroundColor: theme.surface },
            headerTintColor: theme.onSurface,
            headerRight: () => (
              <View style={styles.headerActionsTop}>
                <TouchableOpacity
                  onPress={() => setShowFrequentOnly(!showFrequentOnly)}
                  style={[
                    styles.headerButton,
                    showFrequentOnly && { backgroundColor: theme.primaryVariant }
                  ]}
                >
                  <TrendingUp
                    size={20}
                    color={showFrequentOnly ? theme.onPrimary : theme.onSurface}
                  />
                </TouchableOpacity>
                <TouchableOpacity onPress={handleCreatePhrase} style={styles.headerButton}>
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
            onPress={handleCreatePhrase}
            style={[styles.addButton, { backgroundColor: theme.primary }]}
          >
            <Plus size={20} color={theme.onPrimary} />
          </TouchableOpacity>
        </View>

        <View style={styles.searchContainer}>
          <SearchBar
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholder="Buscar frases..."
          />
        </View>

        <PhraseFilterChips
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
          data={filteredPhrases}
          renderItem={renderPhrase}
          keyExtractor={item => item.id}
          contentContainerStyle={filteredPhrases.length === 0 ? styles.emptyContainer : styles.listContainer}
          ListEmptyComponent={renderEmptyState}
          showsVerticalScrollIndicator={false}
        />
        
        <ShareModal
          visible={shareModalVisible}
          onClose={() => {
            setShareModalVisible(false);
            setSelectedPhraseForShare(null);
          }}
          itemId={selectedPhraseForShare?.id || ''}
          itemType="phrase"
          itemTitle={selectedPhraseForShare?.text || ''}
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
  headerActionsTop: {
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
  phraseCard: {
    borderRadius: 12,
    padding: 16,
    paddingBottom: 40,
    marginHorizontal: 16,
    marginVertical: 6,
    borderWidth: 1,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    position: 'relative',
  },
  phraseHeader: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  favoriteButton: {
    padding: 4,
  },
  contentContainer: {
    marginBottom: 12,
  },
  phraseText: {
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 4,
  },
  copyHint: {
    fontSize: 12,
    fontStyle: 'italic',
  },

  bottomActions: {
    position: 'absolute',
    bottom: 12,
    right: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  editButton: {
    backgroundColor: '#4A90E2',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 8,
  },
  editButtonText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '500',
  },
  deleteButton: {
    backgroundColor: '#E74C3C',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 8,
  },
  deleteButtonText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '500',
  },
  shareButton: {
    padding: 4,
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