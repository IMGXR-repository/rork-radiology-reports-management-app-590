import React from 'react';
import { View, TextInput, TouchableOpacity, StyleSheet } from 'react-native';
import { Search, X } from 'lucide-react-native';
import { useApp } from '@/contexts/AppContext';
import { lightTheme, darkTheme } from '@/constants/theme';

interface SearchBarProps {
  value: string;
  onChangeText: (text: string) => void;
  placeholder?: string;
}

export function SearchBar({ value, onChangeText, placeholder = 'Buscar informes...' }: SearchBarProps) {
  const { settings } = useApp();
  const theme = settings && settings.theme === 'dark' ? darkTheme : lightTheme;

  const clearSearch = () => {
    onChangeText('');
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.surfaceVariant, borderColor: theme.outline }]}>
      <Search size={20} color={theme.onSurface} style={styles.searchIcon} />
      <TextInput
        style={[styles.input, { color: theme.onSurface }]}
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={theme.outline}
        returnKeyType="search"
      />
      {value.length > 0 && (
        <TouchableOpacity onPress={clearSearch} style={styles.clearButton}>
          <X size={20} color={theme.onSurface} />
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 12,
    borderWidth: 1,
    paddingHorizontal: 12,
    height: 48,
  },
  searchIcon: {
    marginRight: 8,
  },
  input: {
    flex: 1,
    fontSize: 16,
    paddingVertical: 0,
  },
  clearButton: {
    padding: 4,
    marginLeft: 8,
  },
});