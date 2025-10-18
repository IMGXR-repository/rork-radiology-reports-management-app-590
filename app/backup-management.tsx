import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Platform,
  Alert as RNAlert,
  Modal,
} from 'react-native';
import { Stack, router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  Upload,
  Trash2,
  CheckCircle,
  X,
  Plus,
  Clock,
  HardDrive,
} from 'lucide-react-native';
import { useApp } from '@/contexts/AppContext';
import { lightTheme, darkTheme } from '@/constants/theme';

interface BackupItem {
  key: string;
  name: string;
  date: Date;
  size: string;
  isAuto: boolean;
}

export default function BackupManagementScreen() {
  const { settings, exportData, importData } = useApp();
  const theme = settings.theme === 'dark' ? darkTheme : lightTheme;
  const insets = useSafeAreaInsets();
  const [backups, setBackups] = useState<BackupItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [showConfirmDelete, setShowConfirmDelete] = useState<string | null>(null);
  const [showConfirmUse, setShowConfirmUse] = useState<BackupItem | null>(null);

  useEffect(() => {
    loadBackups();
  }, []);

  const loadBackups = async () => {
    try {
      setLoading(true);
      const backupItems: BackupItem[] = [];

      if (Platform.OS === 'web') {
        const keys = Object.keys(localStorage);
        const backupKeys = keys.filter(
          (key) => key.startsWith('auto_backup_') || key.startsWith('manual_backup_')
        );

        for (const key of backupKeys) {
          const data = localStorage.getItem(key);
          if (data) {
            const isAuto = key.startsWith('auto_backup_');
            const dateStr = key.replace('auto_backup_', '').replace('manual_backup_', '');
            const date = new Date(dateStr);
            
            backupItems.push({
              key,
              name: isAuto ? 'Automático' : 'Manual',
              date,
              size: `${(data.length / 1024).toFixed(2)} KB`,
              isAuto,
            });
          }
        }
      } else {
        const AsyncStorage = require('@react-native-async-storage/async-storage').default;
        const allKeys = await AsyncStorage.getAllKeys();
        const backupKeys = allKeys.filter(
          (key: string) =>
            key.startsWith('auto_backup_') || key.startsWith('manual_backup_')
        );

        for (const key of backupKeys) {
          const data = await AsyncStorage.getItem(key);
          if (data) {
            const isAuto = key.startsWith('auto_backup_');
            const dateStr = key.replace('auto_backup_', '').replace('manual_backup_', '');
            const date = new Date(dateStr);
            
            backupItems.push({
              key,
              name: isAuto ? 'Automático' : 'Manual',
              date,
              size: `${(data.length / 1024).toFixed(2)} KB`,
              isAuto,
            });
          }
        }
      }

      backupItems.sort((a, b) => b.date.getTime() - a.date.getTime());
      setBackups(backupItems);
    } catch (error) {
      console.error('Error loading backups:', error);
      showAlert('Error', 'No se pudieron cargar los respaldos');
    } finally {
      setLoading(false);
    }
  };

  const showAlert = (title: string, message: string) => {
    if (Platform.OS === 'web') {
      alert(`${title}\n\n${message}`);
    } else {
      RNAlert.alert(title, message);
    }
  };

  const handleCreateBackup = async () => {
    try {
      setLoading(true);
      const backupData = await exportData();
      const backupKey = `manual_backup_${new Date().toISOString()}`;

      if (Platform.OS === 'web') {
        localStorage.setItem(backupKey, backupData);
      } else {
        const AsyncStorage = require('@react-native-async-storage/async-storage').default;
        await AsyncStorage.setItem(backupKey, backupData);
      }

      showAlert('Éxito', 'Respaldo manual creado correctamente');
      await loadBackups();
    } catch (error) {
      console.error('Error creating backup:', error);
      showAlert('Error', 'No se pudo crear el respaldo');
    } finally {
      setLoading(false);
    }
  };

  const handleImportBackup = () => {
    showAlert(
      'Importar Respaldo',
      'En una implementación completa, esto abriría el selector de archivos para importar respaldo desde un archivo externo.'
    );
  };

  const handleUseBackup = async (backup: BackupItem) => {
    try {
      setLoading(true);
      setShowConfirmUse(null);

      let backupData: string | null = null;

      if (Platform.OS === 'web') {
        backupData = localStorage.getItem(backup.key);
      } else {
        const AsyncStorage = require('@react-native-async-storage/async-storage').default;
        backupData = await AsyncStorage.getItem(backup.key);
      }

      if (!backupData) {
        showAlert('Error', 'No se pudo cargar el respaldo');
        return;
      }

      const success = await importData(backupData);
      if (success) {
        showAlert('Éxito', 'Respaldo restaurado correctamente. La aplicación se actualizará.');
        setTimeout(() => {
          if (Platform.OS === 'web') {
            window.location.reload();
          } else {
            router.replace('/');
          }
        }, 1500);
      } else {
        showAlert('Error', 'No se pudo restaurar el respaldo');
      }
    } catch (error) {
      console.error('Error using backup:', error);
      showAlert('Error', 'No se pudo restaurar el respaldo');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteBackup = async (backupKey: string) => {
    try {
      setLoading(true);
      setShowConfirmDelete(null);

      if (Platform.OS === 'web') {
        localStorage.removeItem(backupKey);
      } else {
        const AsyncStorage = require('@react-native-async-storage/async-storage').default;
        await AsyncStorage.removeItem(backupKey);
      }

      showAlert('Éxito', 'Respaldo eliminado correctamente');
      await loadBackups();
    } catch (error) {
      console.error('Error deleting backup:', error);
      showAlert('Error', 'No se pudo eliminar el respaldo');
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (date: Date) => {
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    return `${day}/${month}/${year} ${hours}:${minutes}`;
  };

  return (
    <View style={[styles.safeContainer, { backgroundColor: theme.background }]}>
      <View style={[styles.topSafeArea, { height: insets.top, backgroundColor: theme.surface }]} />
      <View style={[styles.container, { backgroundColor: theme.background }]}>
      <Stack.Screen
        options={{
          title: 'Gestión de Respaldos',
          headerStyle: { backgroundColor: theme.surface },
          headerTintColor: theme.onSurface,
        }}
      />

      <View style={styles.header}>
        <TouchableOpacity
          style={[styles.headerButton, { backgroundColor: theme.primary }]}
          onPress={handleCreateBackup}
          disabled={loading}
        >
          <Plus size={20} color={theme.onPrimary} />
          <Text style={[styles.headerButtonText, { color: theme.onPrimary }]}>
            CREAR
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.headerButton,
            { backgroundColor: theme.surface, borderColor: theme.outline, borderWidth: 1 },
          ]}
          onPress={handleImportBackup}
          disabled={loading}
        >
          <Upload size={20} color={theme.primary} />
          <Text style={[styles.headerButtonText, { color: theme.primary }]}>
            SUBIR
          </Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content}>
        <Text style={[styles.sectionTitle, { color: theme.onSurface }]}>
          Mis Respaldos ({backups.length})
        </Text>

        {loading && backups.length === 0 ? (
          <View style={styles.emptyState}>
            <HardDrive size={48} color={theme.outline} />
            <Text style={[styles.emptyText, { color: theme.outline }]}>
              Cargando respaldos...
            </Text>
          </View>
        ) : backups.length === 0 ? (
          <View style={styles.emptyState}>
            <HardDrive size={48} color={theme.outline} />
            <Text style={[styles.emptyText, { color: theme.outline }]}>
              No tienes respaldos aún
            </Text>
            <Text style={[styles.emptySubtext, { color: theme.outline }]}>
              Crea tu primer respaldo para proteger tus datos
            </Text>
          </View>
        ) : (
          backups.map((backup) => (
            <View
              key={backup.key}
              style={[styles.backupCard, { backgroundColor: theme.surface, borderColor: theme.outline }]}
            >
              <View style={styles.backupHeader}>
                <View style={styles.backupInfo}>
                  <View style={styles.backupTitleRow}>
                    <Text style={[styles.backupName, { color: theme.onSurface }]}>
                      {formatDate(backup.date)}
                    </Text>
                    {backup.isAuto && (
                      <View
                        style={[styles.autoTag, { backgroundColor: theme.primary + '20' }]}
                      >
                        <Clock size={12} color={theme.primary} />
                        <Text style={[styles.autoTagText, { color: theme.primary }]}>
                          Auto
                        </Text>
                      </View>
                    )}
                  </View>
                  <Text style={[styles.backupDate, { color: theme.outline }]}>
                    {backup.size}
                  </Text>
                </View>
              </View>

              <View style={styles.backupActions}>
                <TouchableOpacity
                  style={[styles.actionButton, { backgroundColor: theme.primary }]}
                  onPress={() => setShowConfirmUse(backup)}
                  disabled={loading}
                >
                  <CheckCircle size={16} color={theme.onPrimary} />
                  <Text style={[styles.actionButtonText, { color: theme.onPrimary }]}>
                    USAR
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[
                    styles.actionButton,
                    { backgroundColor: theme.error || '#FF6B6B' },
                  ]}
                  onPress={() => setShowConfirmDelete(backup.key)}
                  disabled={loading}
                >
                  <Trash2 size={16} color="#FFFFFF" />
                </TouchableOpacity>
              </View>
            </View>
          ))
        )}
      </ScrollView>

      <Modal
        visible={showConfirmDelete !== null}
        transparent
        animationType="fade"
        onRequestClose={() => setShowConfirmDelete(null)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: theme.surface }]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: theme.onSurface }]}>
                Confirmar eliminación
              </Text>
              <TouchableOpacity onPress={() => setShowConfirmDelete(null)}>
                <X size={24} color={theme.onSurface} />
              </TouchableOpacity>
            </View>

            <Text style={[styles.modalText, { color: theme.outline }]}>
              ¿Estás seguro de que deseas eliminar este respaldo? Esta acción no se puede
              deshacer.
            </Text>

            <View style={styles.modalActions}>
              <TouchableOpacity
                style={[
                  styles.modalButton,
                  { backgroundColor: theme.background, borderColor: theme.outline, borderWidth: 1 },
                ]}
                onPress={() => setShowConfirmDelete(null)}
              >
                <Text style={[styles.modalButtonText, { color: theme.onSurface }]}>
                  Cancelar
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.modalButton, { backgroundColor: theme.error || '#FF6B6B' }]}
                onPress={() => showConfirmDelete && handleDeleteBackup(showConfirmDelete)}
              >
                <Text style={[styles.modalButtonText, { color: '#FFFFFF' }]}>Eliminar</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      <Modal
        visible={showConfirmUse !== null}
        transparent
        animationType="fade"
        onRequestClose={() => setShowConfirmUse(null)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: theme.surface }]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: theme.onSurface }]}>
                Confirmar restauración
              </Text>
              <TouchableOpacity onPress={() => setShowConfirmUse(null)}>
                <X size={24} color={theme.onSurface} />
              </TouchableOpacity>
            </View>

            <Text style={[styles.modalText, { color: theme.outline }]}>
              ¿Estás seguro de que deseas restaurar este respaldo? Los datos actuales serán
              reemplazados por los datos del respaldo.
            </Text>

            <View style={styles.modalActions}>
              <TouchableOpacity
                style={[
                  styles.modalButton,
                  { backgroundColor: theme.background, borderColor: theme.outline, borderWidth: 1 },
                ]}
                onPress={() => setShowConfirmUse(null)}
              >
                <Text style={[styles.modalButtonText, { color: theme.onSurface }]}>
                  Cancelar
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.modalButton, { backgroundColor: theme.primary }]}
                onPress={() => showConfirmUse && handleUseBackup(showConfirmUse)}
              >
                <Text style={[styles.modalButtonText, { color: theme.onPrimary }]}>
                  Restaurar
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
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
  header: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 16,
    gap: 12,
  },
  headerButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 12,
    gap: 8,
  },
  headerButtonText: {
    fontSize: 14,
    fontWeight: '600',
  },
  content: {
    flex: 1,
    paddingHorizontal: 16,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 16,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  backupCard: {
    borderRadius: 12,
    borderWidth: 1,
    padding: 16,
    marginBottom: 12,
  },
  backupHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  backupInfo: {
    flex: 1,
  },
  backupTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 4,
  },
  backupName: {
    fontSize: 16,
    fontWeight: '600',
  },
  autoTag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 12,
  },
  autoTagText: {
    fontSize: 10,
    fontWeight: '600',
  },
  backupDate: {
    fontSize: 12,
  },
  backupActions: {
    flexDirection: 'row',
    gap: 8,
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    borderRadius: 8,
    gap: 6,
  },
  actionButtonText: {
    fontSize: 14,
    fontWeight: '600',
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  emptyText: {
    fontSize: 16,
    fontWeight: '500',
    marginTop: 16,
    textAlign: 'center',
  },
  emptySubtext: {
    fontSize: 14,
    marginTop: 8,
    textAlign: 'center',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    width: '85%',
    maxWidth: 400,
    borderRadius: 16,
    padding: 24,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '600',
  },
  modalText: {
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 24,
  },
  modalActions: {
    flexDirection: 'row',
    gap: 12,
  },
  modalButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: 'center',
  },
  modalButtonText: {
    fontSize: 14,
    fontWeight: '600',
  },
});
