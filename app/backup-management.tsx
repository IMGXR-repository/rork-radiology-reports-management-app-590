import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Platform,
  Alert as RNAlert,
  Modal,
  Animated,
  Switch,
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
  Download,
  Info,
} from 'lucide-react-native';
import { useApp } from '@/contexts/AppContext';
import { lightTheme, darkTheme } from '@/constants/theme';
import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import * as DocumentPicker from 'expo-document-picker';

interface BackupItem {
  key: string;
  name: string;
  date: Date;
  size: string;
  isAuto: boolean;
}

export default function BackupManagementScreen() {
  const { settings, saveSettings, exportData, importData } = useApp();
  const theme = settings.theme === 'dark' ? darkTheme : lightTheme;
  const insets = useSafeAreaInsets();
  const [backups, setBackups] = useState<BackupItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [showConfirmDelete, setShowConfirmDelete] = useState<string | null>(null);
  const [showConfirmUse, setShowConfirmUse] = useState<BackupItem | null>(null);
  const [showNotification, setShowNotification] = useState(false);
  const notificationOpacity = useRef(new Animated.Value(0)).current;

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
      
      await cleanOldBackups(backupItems);
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

  const cleanOldBackups = async (currentBackups: BackupItem[]) => {
    try {
      const MAX_BACKUPS = 20;
      
      if (currentBackups.length > MAX_BACKUPS) {
        const backupsToDelete = currentBackups.slice(MAX_BACKUPS);
        console.log(`Eliminando ${backupsToDelete.length} respaldos antiguos...`);

        if (Platform.OS === 'web') {
          backupsToDelete.forEach((backup) => localStorage.removeItem(backup.key));
        } else {
          const AsyncStorage = require('@react-native-async-storage/async-storage').default;
          const keysToDelete = backupsToDelete.map(b => b.key);
          await AsyncStorage.multiRemove(keysToDelete);
        }
        

      }
    } catch (error) {
      console.error('Error limpiando respaldos antiguos:', error);
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

      await loadBackups();
    } catch (error) {
      console.error('Error creating backup:', error);
      showAlert('Error', 'No se pudo crear el respaldo');
    } finally {
      setLoading(false);
    }
  };

  const handleImportBackup = async () => {
    try {
      setLoading(true);
      
      if (Platform.OS === 'web') {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = '.json';
        input.onchange = async (e: Event) => {
          const target = e.target as HTMLInputElement;
          const file = target.files?.[0];
          if (file) {
            const text = await file.text();
            const success = await importData(text);
            if (success) {
              setTimeout(() => {
                window.location.reload();
              }, 500);
            } else {
              showAlert('Error', 'No se pudo importar el respaldo');
            }
          }
          setLoading(false);
        };
        input.click();
      } else {
        const result = await DocumentPicker.getDocumentAsync({
          type: 'application/json',
          copyToCacheDirectory: true,
        });

        if (!result.canceled && result.assets && result.assets.length > 0) {
          const fileUri = result.assets[0].uri;
          const fileContent = await FileSystem.readAsStringAsync(fileUri);
          const success = await importData(fileContent);
          
          if (success) {
            await loadBackups();
            router.replace('/(tabs)/home');
          } else {
            showAlert('Error', 'No se pudo importar el respaldo');
          }
        }
        setLoading(false);
      }
    } catch (error) {
      console.error('Error importing backup:', error);
      showAlert('Error', 'No se pudo importar el respaldo');
      setLoading(false);
    }
  };

  const handleDownloadBackup = async (backup: BackupItem) => {
    try {
      setLoading(true);

      let backupData: string | null = null;

      if (Platform.OS === 'web') {
        backupData = localStorage.getItem(backup.key);
      } else {
        const AsyncStorage = require('@react-native-async-storage/async-storage').default;
        backupData = await AsyncStorage.getItem(backup.key);
      }

      if (!backupData) {
        showAlert('Error', 'No se pudo obtener el respaldo');
        return;
      }

      const fileName = `RAD-IA_Respaldo_${formatDate(backup.date).replace(/[/: ]/g, '-')}.json`;

      if (Platform.OS === 'web') {
        const blob = new Blob([backupData], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = fileName;
        a.click();
        URL.revokeObjectURL(url);
      } else {
        const fileUri = `${FileSystem.documentDirectory}${fileName}`;
        await FileSystem.writeAsStringAsync(fileUri, backupData);

        const canShare = await Sharing.isAvailableAsync();
        if (canShare) {
          await Sharing.shareAsync(fileUri, {
            mimeType: 'application/json',
            dialogTitle: 'Guardar respaldo de RAD-IA',
          });
        } else {
          showAlert('Error', 'No se puede compartir archivos en este dispositivo');
        }
      }
    } catch (error) {
      console.error('Error downloading backup:', error);
      showAlert('Error', 'No se pudo descargar el respaldo');
    } finally {
      setLoading(false);
    }
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
        await loadBackups();
        if (Platform.OS === 'web') {
          window.location.reload();
        } else {
          router.replace('/(tabs)/home');
        }
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

  const handleAutoBackupToggle = async () => {
    const newValue = !settings.autoBackupEnabled;
    await saveSettings({ ...settings, autoBackupEnabled: newValue });
    
    if (newValue) {
      setShowNotification(true);
      Animated.sequence([
        Animated.timing(notificationOpacity, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.delay(10000),
        Animated.timing(notificationOpacity, {
          toValue: 0,
          duration: 300,
          useNativeDriver: true,
        }),
      ]).start(() => {
        setShowNotification(false);
      });
    }
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

      <View style={styles.autoBackupSection}>
        <View style={[styles.autoBackupCard, { backgroundColor: theme.surface, borderColor: theme.outline }]}>
          <View style={styles.autoBackupHeader}>
            <View style={styles.autoBackupInfo}>
              <Text style={[styles.autoBackupTitle, { color: theme.onSurface }]}>
                Respaldo Automático
              </Text>
              <Text style={[styles.autoBackupSubtitle, { color: theme.outline }]}>
                Crea respaldos al guardar o eliminar informes y frases
              </Text>
            </View>
            <Switch
              value={settings.autoBackupEnabled}
              onValueChange={handleAutoBackupToggle}
              trackColor={{ false: theme.outline, true: theme.primary }}
              thumbColor={settings.autoBackupEnabled ? theme.onPrimary : theme.onSurface}
            />
          </View>
        </View>
      </View>

      {showNotification && (
        <Animated.View
          style={[
            styles.notification,
            {
              backgroundColor: theme.primary,
              opacity: notificationOpacity,
            },
          ]}
        >
          <Info size={20} color={theme.onPrimary} />
          <Text style={[styles.notificationText, { color: theme.onPrimary }]}>
            Los respaldos automáticos se crean al guardar o eliminar informes y frases. Se mantienen los últimos 20 respaldos.
          </Text>
        </Animated.View>
      )}

      <View style={styles.header}>
        <TouchableOpacity
          style={[styles.headerButton, { backgroundColor: theme.primary }]}
          onPress={handleCreateBackup}
          disabled={loading}
        >
          <Plus size={20} color={theme.onPrimary} />
          <Text style={[styles.headerButtonText, { color: theme.onPrimary }]}>
            CREAR RESPALDO
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
            IMPORTAR
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
                    { backgroundColor: theme.secondary || '#4CAF50' },
                  ]}
                  onPress={() => handleDownloadBackup(backup)}
                  disabled={loading}
                >
                  <Download size={16} color="#FFFFFF" />
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
  autoBackupSection: {
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 8,
  },
  autoBackupCard: {
    borderRadius: 12,
    borderWidth: 1,
    padding: 16,
  },
  autoBackupHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  autoBackupInfo: {
    flex: 1,
    marginRight: 16,
  },
  autoBackupTitle: {
    fontSize: 16,
    fontWeight: '600' as const,
    marginBottom: 4,
  },
  autoBackupSubtitle: {
    fontSize: 13,
    lineHeight: 18,
  },
  notification: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginHorizontal: 16,
    marginBottom: 8,
    padding: 16,
    borderRadius: 12,
    gap: 12,
  },
  notificationText: {
    flex: 1,
    fontSize: 13,
    lineHeight: 18,
  },
  header: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 8,
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
    fontWeight: '600' as const,
  },
  content: {
    flex: 1,
    paddingHorizontal: 16,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '600' as const,
    marginBottom: 16,
    textTransform: 'uppercase' as const,
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
    fontWeight: '600' as const,
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
    fontWeight: '600' as const,
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
    minWidth: 50,
  },
  actionButtonText: {
    fontSize: 14,
    fontWeight: '600' as const,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  emptyText: {
    fontSize: 16,
    fontWeight: '500' as const,
    marginTop: 16,
    textAlign: 'center' as const,
  },
  emptySubtext: {
    fontSize: 14,
    marginTop: 8,
    textAlign: 'center' as const,
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
    fontWeight: '600' as const,
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
    fontWeight: '600' as const,
  },
});
