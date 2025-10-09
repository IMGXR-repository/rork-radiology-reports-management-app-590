import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Dimensions } from 'react-native';
import { ChevronDown, ChevronUp } from 'lucide-react-native';
import { useApp } from '@/contexts/AppContext';
import { lightTheme, darkTheme } from '@/constants/theme';

interface FilterChipsProps {
  selectedFilters: string[];
  onFilterToggle: (filterId: string, categoryId: string) => void;
}

export function FilterChips({ selectedFilters, onFilterToggle }: FilterChipsProps) {
  const { filters, categories, settings } = useApp();
  const theme = settings.theme === 'dark' ? darkTheme : lightTheme;

  const visibleCategories = categories.filter(cat => cat.isVisible);
  const activeFilters = filters.filter(filter => filter.isActive);

  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set());
  const screenWidth = Dimensions.get('window').width;

  const getFiltersForCategory = (categoryId: string) => {
    return activeFilters.filter(filter => filter.categoryId === categoryId);
  };

  const isFilterSelected = (filterId: string) => {
    return selectedFilters.includes(filterId);
  };

  const getSelectedFilterForCategory = (categoryId: string) => {
    const categoryFilters = getFiltersForCategory(categoryId);
    return categoryFilters.find(filter => selectedFilters.includes(filter.id));
  };

  const isAllSelected = (categoryId: string) => {
    return !getSelectedFilterForCategory(categoryId);
  };

  const toggleCategoryExpansion = (categoryId: string) => {
    const newExpanded = new Set(expandedCategories);
    if (newExpanded.has(categoryId)) {
      newExpanded.delete(categoryId);
    } else {
      newExpanded.add(categoryId);
    }
    setExpandedCategories(newExpanded);
  };



  if (visibleCategories.length === 0) {
    return null;
  }

  return (
    <View style={styles.container}>
      {visibleCategories.map(category => {
        const categoryFilters = getFiltersForCategory(category.id);
        
        if (categoryFilters.length === 0) {
          return null;
        }

        const isExpanded = expandedCategories.has(category.id);

        return (
          <View key={category.id} style={styles.categorySection}>
            <TouchableOpacity 
              style={styles.categoryHeader}
              onPress={() => toggleCategoryExpansion(category.id)}
              activeOpacity={0.7}
            >
              <Text style={[styles.categoryTitle, { color: theme.onSurface }]}>
                {category.name}
              </Text>
              <View style={[styles.expandButton, { backgroundColor: theme.surfaceVariant }]}>
                {isExpanded ? (
                  <ChevronUp size={16} color={theme.onSurface} />
                ) : (
                  <ChevronDown size={16} color={theme.onSurface} />
                )}
              </View>
            </TouchableOpacity>
            
            {isExpanded && (
              <View style={styles.filtersContainer}>
                <TouchableOpacity
                  key={`all-${category.id}`}
                  onPress={() => onFilterToggle('', category.id)}
                  style={[
                    styles.filterChip,
                    {
                      backgroundColor: isAllSelected(category.id) ? theme.primary : theme.surfaceVariant,
                      borderColor: isAllSelected(category.id) ? theme.primary : theme.outline,
                      maxWidth: screenWidth * 0.4,
                    },
                  ]}
                >
                  <Text
                    style={[
                      styles.filterText,
                      {
                        color: isAllSelected(category.id) ? theme.onPrimary : theme.onSurface,
                      },
                    ]}
                    numberOfLines={1}
                    ellipsizeMode="tail"
                  >
                    Todos
                  </Text>
                </TouchableOpacity>
                {categoryFilters.map(filter => {
                  const isSelected = isFilterSelected(filter.id);
                  return (
                    <TouchableOpacity
                      key={filter.id}
                      onPress={() => onFilterToggle(filter.id, category.id)}
                      style={[
                        styles.filterChip,
                        {
                          backgroundColor: isSelected ? theme.primary : theme.surfaceVariant,
                          borderColor: isSelected ? theme.primary : theme.outline,
                          maxWidth: screenWidth * 0.4,
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
                        numberOfLines={1}
                        ellipsizeMode="tail"
                      >
                        {filter.name}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            )}
          </View>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingVertical: 8,
  },
  categorySection: {
    marginBottom: 16,
    backgroundColor: 'transparent',
    borderRadius: 12,
    overflow: 'hidden',
  },
  categoryHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginHorizontal: 16,
    marginBottom: 8,
    paddingVertical: 4,
  },
  categoryTitle: {
    fontSize: 14,
    fontWeight: '600',
    flex: 1,
  },
  expandButton: {
    padding: 6,
    borderRadius: 12,
    marginLeft: 8,
  },
  filtersContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 16,
    gap: 8,
  },
  filterChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 32,
  },
  filterText: {
    fontSize: 12,
    fontWeight: '500',
    textAlign: 'center',
  },
  moreButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 32,
    opacity: 0.7,
  },
  moreText: {
    fontSize: 12,
    fontWeight: '600',
  },
});