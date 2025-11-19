import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { router, usePathname } from 'expo-router';
import { FileText, MessageSquare } from 'lucide-react-native';
import { useApp } from '@/contexts/AppContext';
import { lightTheme, darkTheme } from '@/constants/theme';

export function SectionToggle() {
  const { settings } = useApp();
  const theme = settings.theme === 'dark' ? darkTheme : lightTheme;
  const pathname = usePathname();
  
  const isReportsActive = pathname === '/home' || pathname === '/';
  const isPhrasesActive = pathname === '/phrases';

  const handleToggle = (section: 'reports' | 'phrases') => {
    if (section === 'reports') {
      router.push('/home');
    } else {
      router.push('/phrases');
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.surfaceVariant }]}>
      <TouchableOpacity
        onPress={() => handleToggle('reports')}
        style={[
          styles.toggleButton,
          isReportsActive && { backgroundColor: theme.primary },
          !isReportsActive && { backgroundColor: 'transparent' }
        ]}
      >
        <FileText 
          size={18} 
          color={isReportsActive ? theme.onPrimary : theme.onSurface} 
        />
        <Text style={[
          styles.toggleText,
          { color: isReportsActive ? theme.onPrimary : theme.onSurface }
        ]}>
          Informes
        </Text>
      </TouchableOpacity>
      
      <TouchableOpacity
        onPress={() => handleToggle('phrases')}
        style={[
          styles.toggleButton,
          isPhrasesActive && { backgroundColor: theme.primary },
          !isPhrasesActive && { backgroundColor: 'transparent' }
        ]}
      >
        <MessageSquare 
          size={18} 
          color={isPhrasesActive ? theme.onPrimary : theme.onSurface} 
        />
        <Text style={[
          styles.toggleText,
          { color: isPhrasesActive ? theme.onPrimary : theme.onSurface }
        ]}>
          Frases
        </Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    marginHorizontal: 16,
    marginTop: 4,
    marginBottom: 6,
    borderRadius: 16,
    padding: 4,
  },
  toggleButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 12,
    gap: 6,
  },
  toggleText: {
    fontSize: 15,
    fontWeight: '600',
  },
});