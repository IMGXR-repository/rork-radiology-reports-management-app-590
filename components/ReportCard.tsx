import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Platform } from 'react-native';
import { Heart, Share2, Bot } from 'lucide-react-native';
import { router } from 'expo-router';
import * as Clipboard from 'expo-clipboard';
import { Report } from '@/types';
import { useApp } from '@/contexts/AppContext';
import { useAuth } from '@/contexts/AuthContext';
import { ShareModal } from '@/components/ShareModal';
import { lightTheme, darkTheme } from '@/constants/theme';

interface ReportCardProps {
  report: Report;
  onEdit: (report: Report) => void;
}

export function ReportCard({ report, onEdit }: ReportCardProps) {
  const { toggleFavorite, deleteReport, settings, trackCopy } = useApp();
  const { isAuthenticated } = useAuth();
  const theme = settings.theme === 'dark' ? darkTheme : lightTheme;
  const [showShareModal, setShowShareModal] = useState(false);

  const handleCopy = async () => {
    try {
      await Clipboard.setStringAsync(report.content);
      if (Platform.OS !== 'web') {
        const Haptics = require('expo-haptics');
        Haptics.selectionAsync();
      }
      
      // Actualizar estadísticas de productividad
      trackCopy('report');
      
      console.log('Informe copiado al portapapeles');
    } catch {
      console.log('No se pudo copiar el informe');
    }
  };

  const handleDelete = () => {
    if (Platform.OS === 'web') {
      if (confirm('¿Estás seguro de que quieres eliminar este informe?')) {
        deleteReport(report.id);
      }
    } else {
      const Alert = require('react-native').Alert;
      Alert.alert(
        'Eliminar Informe',
        '¿Estás seguro de que quieres eliminar este informe?',
        [
          { text: 'Cancelar', style: 'cancel' },
          {
            text: 'Eliminar',
            style: 'destructive',
            onPress: () => deleteReport(report.id),
          },
        ]
      );
    }
  };

  const handleToggleFavorite = () => {
    toggleFavorite(report.id);
    if (Platform.OS !== 'web') {
      const Haptics = require('expo-haptics');
      Haptics.selectionAsync();
    }
  };

  const handleAIAssist = () => {
    router.push(`/recording?reportId=${report.id}`);
  };

  return (
    <View style={[styles.card, { backgroundColor: theme.surface, borderColor: theme.outline }]}>
      <View style={styles.header}>
        <Text style={[styles.title, { color: theme.onSurface }]} numberOfLines={2}>
          {report.title}
        </Text>
        <View style={styles.headerActions}>
          {isAuthenticated && (
            <TouchableOpacity onPress={() => setShowShareModal(true)} style={styles.shareButton}>
              <Share2 size={18} color={theme.primary} />
            </TouchableOpacity>
          )}
          <TouchableOpacity onPress={handleToggleFavorite} style={styles.favoriteButton}>
            <Heart
              size={20}
              color={report.isFavorite ? theme.error : theme.outline}
              fill={report.isFavorite ? theme.error : 'transparent'}
            />
          </TouchableOpacity>
        </View>
      </View>

      <TouchableOpacity onPress={handleCopy} style={styles.contentContainer}>
        <Text style={[styles.content, { color: theme.onSurface }]} numberOfLines={3}>
          {report.content}
        </Text>
        <Text style={[styles.copyHint, { color: theme.outline }]}>
          Toca en cualquier lugar para copiar el informe completo
        </Text>
      </TouchableOpacity>


      
      <View style={styles.bottomActions}>
        <TouchableOpacity onPress={handleAIAssist} style={styles.aiButton}>
          <Bot size={12} color="#FFFFFF" />
          <Text style={styles.aiButtonText}>IA</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={() => onEdit(report)} style={styles.editButton}>
          <Text style={styles.editButtonText}>Editar</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={handleDelete} style={styles.deleteButton}>
          <Text style={styles.deleteButtonText}>Eliminar</Text>
        </TouchableOpacity>
      </View>
      
      <ShareModal
        visible={showShareModal}
        onClose={() => setShowShareModal(false)}
        itemId={report.id}
        itemType="report"
        itemTitle={report.title}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 12,
    padding: 16,
    paddingBottom: 40,
    marginHorizontal: 16,
    marginVertical: 8,
    borderWidth: 1,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    position: 'relative',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  title: {
    fontSize: 16,
    fontWeight: '600',
    flex: 1,
    marginRight: 8,
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  favoriteButton: {
    padding: 4,
  },
  shareButton: {
    padding: 4,
  },

  contentContainer: {
    marginBottom: 12,
  },
  content: {
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
    backgroundColor: '#3182CE',
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 12,
    minHeight: 32,
    justifyContent: 'center',
  },
  editButtonText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '600',
  },
  deleteButton: {
    backgroundColor: '#E53E3E',
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 12,
    minHeight: 32,
    justifyContent: 'center',
  },
  deleteButtonText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '600',
  },
  aiButton: {
    backgroundColor: '#38B2AC',
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 12,
    minHeight: 32,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
  },
  aiButtonText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '600',
  },

});