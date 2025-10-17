import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Switch, ScrollView, Platform, Image, Modal } from 'react-native';
import { Stack } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Moon, Sun, Download, Upload, Heart, Info, User, LogIn, LogOut, Share2, Users, CreditCard, MapPin, Stethoscope, Edit, Monitor, QrCode, Clock, X } from 'lucide-react-native';
import { useApp } from '@/contexts/AppContext';
import { useAuth } from '@/contexts/AuthContext';
import { RadiaLogo } from '@/components/RadiaLogo';
import { QRSyncModal } from '@/components/QRSyncModal';
import { lightTheme, darkTheme } from '@/constants/theme';
import { router } from 'expo-router';

export default function SettingsScreen() {
  const { settings, saveSettings, exportData } = useApp();
  const { user, isAuthenticated, signIn, signOut, getSharedItemsReceived, getSharedItemsSent } = useAuth();
  const userSyncCode = user?.id || 'no-user';
  const theme = settings.theme === 'dark' ? darkTheme : lightTheme;
  const insets = useSafeAreaInsets();
  const [showSharedItems, setShowSharedItems] = useState(false);
  const [showQRModal, setShowQRModal] = useState(false);
  const [showFrequencyModal, setShowFrequencyModal] = useState(false);

  const sharedItemsReceived = getSharedItemsReceived();
  const sharedItemsSent = getSharedItemsSent();

  const handleThemeToggle = async () => {
    const newTheme = settings.theme === 'light' ? 'dark' : 'light';
    await saveSettings({ ...settings, theme: newTheme });
  };

  const handleFavoritesFirstToggle = async () => {
    await saveSettings({ ...settings, showFavoritesFirst: !settings.showFavoritesFirst });
  };

  const handleAutoBackupToggle = async () => {
    const newValue = !settings.autoBackupEnabled;
    await saveSettings({ 
      ...settings, 
      autoBackupEnabled: newValue,
      lastAutoBackupDate: newValue ? new Date().toISOString() : settings.lastAutoBackupDate
    });
    
    const frequencyText = `cada ${settings.autoBackupFrequencyDays || 3} día${(settings.autoBackupFrequencyDays || 3) > 1 ? 's' : ''}`;
    
    if (Platform.OS === 'web') {
      alert(newValue ? `Respaldos automáticos activados. Se creará un respaldo ${frequencyText}.` : 'Respaldos automáticos desactivados.');
    } else {
      const Alert = require('react-native').Alert;
      Alert.alert(
        'Respaldos automáticos',
        newValue ? `Respaldos automáticos activados. Se creará un respaldo ${frequencyText}.` : 'Respaldos automáticos desactivados.',
        [{ text: 'OK' }]
      );
    }
  };

  const handleFrequencyChange = async (days: number) => {
    await saveSettings({ 
      ...settings, 
      autoBackupFrequencyDays: days
    });
    setShowFrequencyModal(false);
  };



  const handleExportData = async () => {
    try {
      const data = await exportData();
      if (Platform.OS === 'web') {
        alert('Respaldo creado correctamente. En una implementación completa, esto abriría el selector de archivos para guardar.');
      } else {
        const Alert = require('react-native').Alert;
        Alert.alert(
          'Crear Respaldo',
          'Respaldo creado correctamente. En una implementación completa, esto abriría el selector de archivos para guardar.',
          [{ text: 'OK' }]
        );
      }
      console.log('Exported data:', data);
    } catch {
      if (Platform.OS === 'web') {
        alert('No se pudo crear el respaldo');
      } else {
        const Alert = require('react-native').Alert;
        Alert.alert('Error', 'No se pudo crear el respaldo');
      }
    }
  };

  const handleImportData = () => {
    if (Platform.OS === 'web') {
      alert('En una implementación completa, esto abriría el selector de archivos para importar respaldo.');
    } else {
      const Alert = require('react-native').Alert;
      Alert.alert(
        'Importar Respaldo',
        'En una implementación completa, esto abriría el selector de archivos para importar respaldo.',
        [{ text: 'OK' }]
      );
    }
  };

  const handleAbout = () => {
    if (Platform.OS === 'web') {
      alert('RAD-IA v1.0.0\n\nAplicación de radiología inteligente para gestión de informes radiológicos.\n\nDesarrollado para profesionales médicos.');
    } else {
      const Alert = require('react-native').Alert;
      Alert.alert(
        'Acerca de RAD-IA',
        'RAD-IA v1.0.0\n\nAplicación de radiología inteligente para gestión de informes radiológicos.\n\nDesarrollado para profesionales médicos.',
        [{ text: 'OK' }]
      );
    }
  };

  const renderSettingItem = (
    icon: React.ReactNode,
    title: string,
    subtitle?: string,
    onPress?: () => void,
    rightComponent?: React.ReactNode
  ) => (
    <TouchableOpacity
      style={[styles.settingItem, { backgroundColor: theme.surface, borderColor: theme.outline }]}
      onPress={onPress}
      disabled={!onPress}
    >
      <View style={styles.settingIcon}>
        <Text>{icon}</Text>
      </View>
      <View style={styles.settingContent}>
        <Text style={[styles.settingTitle, { color: theme.onSurface }]}>
          {title}
        </Text>
        {subtitle && (
          <Text style={[styles.settingSubtitle, { color: theme.outline }]}>
            {subtitle}
          </Text>
        )}
      </View>
      {rightComponent && (
        <View style={styles.settingRight}>
          <Text>{rightComponent}</Text>
        </View>
      )}
    </TouchableOpacity>
  );



  return (
    <View style={[styles.safeContainer, { backgroundColor: theme.background }]}>
      <View style={[styles.topSafeArea, { height: insets.top, backgroundColor: theme.surface }]} />
      <ScrollView style={[styles.container, { backgroundColor: theme.background }]}>
      <Stack.Screen
        options={{
          title: 'Configuración',
          headerStyle: { backgroundColor: theme.surface },
          headerTintColor: theme.onSurface,
        }}
      />

      {/* Sección de Usuario */}
      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: theme.onSurface }]}>
          Usuario
        </Text>
        
        {isAuthenticated ? (
          <>
            <View style={[styles.userCard, { backgroundColor: theme.surface, borderColor: theme.outline }]}>
              <View style={styles.userInfo}>
                {user?.avatar ? (
                  <Image source={{ uri: user.avatar }} style={styles.avatar} />
                ) : (
                  <View style={[styles.avatarPlaceholder, { backgroundColor: theme.primary }]}>
                    <User size={24} color={theme.onPrimary} />
                  </View>
                )}
                <View style={styles.userDetails}>
                  <Text style={[styles.userName, { color: theme.onSurface }]}>
                    {user?.name}
                  </Text>
                  <Text style={[styles.userEmail, { color: theme.outline }]}>
                    {user?.email}
                  </Text>
                  {user?.isRegistered && (
                    <>
                      <Text style={[styles.userDetail, { color: theme.outline }]}>
                        DNI: {user.dni}
                      </Text>
                      <Text style={[styles.userDetail, { color: theme.outline }]}>
                        {user.city}, {user.country}
                      </Text>
                      <Text style={[styles.userDetail, { color: theme.outline }]}>
                        {user.medicalSpecialty} - Col. {user.medicalLicense}
                      </Text>
                    </>
                  )}
                </View>
              </View>
            </View>
            
            {/* Show registration info if user is registered */}
            {user?.isRegistered && (
              <View style={styles.section}>
                <Text style={[styles.sectionTitle, { color: theme.onSurface }]}>
                  Información Profesional
                </Text>
                
                {renderSettingItem(
                  <CreditCard size={20} color={theme.primary} />,
                  'DNI',
                  user.dni
                )}
                
                {renderSettingItem(
                  <MapPin size={20} color={theme.primary} />,
                  'Ubicación',
                  `${user.city}, ${user.country}`
                )}
                
                {renderSettingItem(
                  <Stethoscope size={20} color={theme.primary} />,
                  'Especialidad',
                  `${user.medicalSpecialty} - Colegiado: ${user.medicalLicense}`
                )}
              </View>
            )}
            
            {renderSettingItem(
              <Share2 size={20} color={theme.primary} />,
              'Elementos compartidos',
              `${sharedItemsReceived.length} recibidos, ${sharedItemsSent.length} enviados`,
              () => setShowSharedItems(!showSharedItems)
            )}
            
            {renderSettingItem(
              <LogOut size={20} color={theme.error || '#FF6B6B'} />,
              'Cerrar sesión',
              'Salir de tu cuenta',
              signOut
            )}
          </>
        ) : (
          <>
            {renderSettingItem(
              <LogIn size={20} color={theme.primary} />,
              'Iniciar sesión',
              'Accede con una cuenta existente',
              signIn
            )}
            
            {renderSettingItem(
              <Edit size={20} color={theme.primary} />,
              'Crear cuenta nueva',
              'Registro completo con información profesional',
              signIn
            )}
          </>
        )}
      </View>

      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: theme.onSurface }]}>
          Apariencia
        </Text>
        
        {renderSettingItem(
          settings.theme === 'dark' ? (
            <Moon size={20} color={theme.primary} />
          ) : (
            <Sun size={20} color={theme.primary} />
          ),
          'Tema',
          settings.theme === 'dark' ? 'Modo oscuro' : 'Modo claro',
          handleThemeToggle,
          <Switch
            value={settings.theme === 'dark'}
            onValueChange={handleThemeToggle}
            trackColor={{ false: theme.outline, true: theme.primary }}
            thumbColor={settings.theme === 'dark' ? theme.onPrimary : theme.onSurface}
          />
        )}
      </View>

      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: theme.onSurface }]}>
          Comportamiento
        </Text>
        
        {renderSettingItem(
          <Heart size={20} color={theme.primary} />,
          'Favoritos primero',
          'Mostrar informes favoritos al inicio de la lista',
          handleFavoritesFirstToggle,
          <Switch
            value={settings.showFavoritesFirst}
            onValueChange={handleFavoritesFirstToggle}
            trackColor={{ false: theme.outline, true: theme.primary }}
            thumbColor={settings.showFavoritesFirst ? theme.onPrimary : theme.onSurface}
          />
        )}
      </View>

      {/* Mostrar elementos compartidos si está expandido */}
      {showSharedItems && isAuthenticated && (
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: theme.onSurface }]}>
            Elementos Compartidos
          </Text>
          
          {sharedItemsReceived.length > 0 && (
            <View style={[styles.sharedSection, { backgroundColor: theme.surface, borderColor: theme.outline }]}>
              <Text style={[styles.sharedSectionTitle, { color: theme.onSurface }]}>Recibidos</Text>
              {sharedItemsReceived.slice(0, 3).map((item) => (
                <View key={item.id} style={styles.sharedItem}>
                  <Users size={16} color={theme.primary} />
                  <Text style={[styles.sharedItemText, { color: theme.outline }]}>
                    {item.type === 'report' ? 'Informe' : 'Frase'} de {item.sharedBy}
                  </Text>
                </View>
              ))}
              {sharedItemsReceived.length > 3 && (
                <Text style={[styles.moreItems, { color: theme.outline }]}>
                  +{sharedItemsReceived.length - 3} más
                </Text>
              )}
            </View>
          )}
          
          {sharedItemsSent.length > 0 && (
            <View style={[styles.sharedSection, { backgroundColor: theme.surface, borderColor: theme.outline }]}>
              <Text style={[styles.sharedSectionTitle, { color: theme.onSurface }]}>Enviados</Text>
              {sharedItemsSent.slice(0, 3).map((item) => (
                <View key={item.id} style={styles.sharedItem}>
                  <Share2 size={16} color={theme.primary} />
                  <Text style={[styles.sharedItemText, { color: theme.outline }]}>
                    {item.type === 'report' ? 'Informe' : 'Frase'} a {item.sharedWith}
                  </Text>
                </View>
              ))}
              {sharedItemsSent.length > 3 && (
                <Text style={[styles.moreItems, { color: theme.outline }]}>
                  +{sharedItemsSent.length - 3} más
                </Text>
              )}
            </View>
          )}
          
          {sharedItemsReceived.length === 0 && sharedItemsSent.length === 0 && (
            <View style={[styles.emptyShared, { backgroundColor: theme.surface, borderColor: theme.outline }]}>
              <Text style={[styles.emptySharedText, { color: theme.outline }]}>
                No tienes elementos compartidos aún
              </Text>
            </View>
          )}
        </View>
      )}

      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: theme.onSurface }]}>
          Sincronización y Respaldo
        </Text>
        
        {renderSettingItem(
          <Clock size={20} color={theme.primary} />,
          'Respaldos automáticos',
          settings.autoBackupEnabled 
            ? `Activado - Cada ${settings.autoBackupFrequencyDays || 3} día${(settings.autoBackupFrequencyDays || 3) > 1 ? 's' : ''}${settings.lastAutoBackupDate ? ' • Último: ' + new Date(settings.lastAutoBackupDate).toLocaleDateString() : ''}` 
            : `Crear respaldos automáticos cada ${settings.autoBackupFrequencyDays || 3} día${(settings.autoBackupFrequencyDays || 3) > 1 ? 's' : ''}`,
          handleAutoBackupToggle,
          <Switch
            value={settings.autoBackupEnabled}
            onValueChange={handleAutoBackupToggle}
            trackColor={{ false: theme.outline, true: theme.primary }}
            thumbColor={settings.autoBackupEnabled ? theme.onPrimary : theme.onSurface}
          />
        )}
        
        {settings.autoBackupEnabled && renderSettingItem(
          <Clock size={20} color={theme.primary} />,
          'Frecuencia de respaldo',
          `Cada ${settings.autoBackupFrequencyDays || 3} día${(settings.autoBackupFrequencyDays || 3) > 1 ? 's' : ''}`,
          () => setShowFrequencyModal(true)
        )}
        
        {renderSettingItem(
          <QrCode size={20} color={theme.primary} />,
          'Mi Código QR',
          'Código único para sincronizar con otros dispositivos',
          () => setShowQRModal(true)
        )}
        
        {renderSettingItem(
          <Monitor size={20} color={theme.primary} />,
          'Sincronización Web',
          'Sincronizar datos entre dispositivos móviles y web',
          () => router.push('/web-sync')
        )}
        
        {renderSettingItem(
          <Download size={20} color={theme.primary} />,
          'Crear respaldo',
          'Crear copia de seguridad de todos los datos',
          handleExportData
        )}
        
        {renderSettingItem(
          <Upload size={20} color={theme.primary} />,
          'Importar respaldo',
          'Restaurar datos desde copia de seguridad',
          handleImportData
        )}
      </View>

      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: theme.onSurface }]}>
          Información
        </Text>
        
        {renderSettingItem(
          <Info size={20} color={theme.primary} />,
          'Acerca de RAD-IA',
          'Versión e información de la aplicación',
          handleAbout
        )}
      </View>

      <View style={styles.footer}>
        <View style={styles.footerLogo}>
          <RadiaLogo size="small" showText={true} color={theme.primary} textColor={theme.onSurface} />
        </View>
        <Text style={[styles.footerText, { color: theme.outline }]}>
          RAD-IA - Radiología Inteligente
        </Text>
        <Text style={[styles.footerText, { color: theme.outline }]}>
          Versión 1.0.0
        </Text>
      </View>
      </ScrollView>
      
      <QRSyncModal
        visible={showQRModal}
        onClose={() => setShowQRModal(false)}
        userSyncCode={userSyncCode}
      />
      
      <Modal
        visible={showFrequencyModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowFrequencyModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: theme.surface }]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: theme.onSurface }]}>
                Frecuencia de respaldo
              </Text>
              <TouchableOpacity onPress={() => setShowFrequencyModal(false)}>
                <X size={24} color={theme.onSurface} />
              </TouchableOpacity>
            </View>
            
            <Text style={[styles.modalSubtitle, { color: theme.outline }]}>
              Selecciona cada cuántos días deseas crear un respaldo automático
            </Text>
            
            <ScrollView style={styles.frequencyOptions}>
              {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((days) => (
                <TouchableOpacity
                  key={days}
                  style={[
                    styles.frequencyOption,
                    { 
                      backgroundColor: (settings.autoBackupFrequencyDays || 3) === days ? theme.primary : theme.background,
                      borderColor: theme.outline 
                    }
                  ]}
                  onPress={() => handleFrequencyChange(days)}
                >
                  <Text style={[
                    styles.frequencyOptionText,
                    { color: (settings.autoBackupFrequencyDays || 3) === days ? theme.onPrimary : theme.onSurface }
                  ]}>
                    Cada {days} día{days > 1 ? 's' : ''}
                  </Text>
                  {(settings.autoBackupFrequencyDays || 3) === days && (
                    <View style={[styles.selectedIndicator, { backgroundColor: theme.onPrimary }]} />
                  )}
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </View>
      </Modal>
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

  section: {
    marginTop: 24,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    marginHorizontal: 16,
    marginBottom: 8,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 16,
    marginHorizontal: 16,
    marginVertical: 2,
    borderRadius: 12,
    borderWidth: 1,
  },
  settingIcon: {
    marginRight: 16,
  },
  settingContent: {
    flex: 1,
  },
  settingTitle: {
    fontSize: 16,
    fontWeight: '500',
  },
  settingSubtitle: {
    fontSize: 12,
    marginTop: 2,
    lineHeight: 16,
  },
  settingRight: {
    marginLeft: 16,
  },
  footer: {
    alignItems: 'center',
    paddingVertical: 32,
    paddingHorizontal: 16,
  },
  footerLogo: {
    marginBottom: 16,
  },
  footerText: {
    fontSize: 12,
    textAlign: 'center',
    marginVertical: 2,
  },
  userCard: {
    marginHorizontal: 16,
    marginVertical: 2,
    borderRadius: 12,
    borderWidth: 1,
    padding: 16,
  },
  userInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
  },
  avatarPlaceholder: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  userDetails: {
    marginLeft: 16,
    flex: 1,
  },
  userName: {
    fontSize: 18,
    fontWeight: '600',
  },
  userEmail: {
    fontSize: 14,
    marginTop: 2,
  },
  userDetail: {
    fontSize: 12,
    marginTop: 1,
    lineHeight: 16,
  },
  sharedSection: {
    marginHorizontal: 16,
    marginVertical: 2,
    borderRadius: 12,
    borderWidth: 1,
    padding: 16,
  },
  sharedSectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 12,
  },
  sharedItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 4,
  },
  sharedItemText: {
    fontSize: 14,
    marginLeft: 8,
    flex: 1,
  },
  moreItems: {
    fontSize: 12,
    fontStyle: 'italic',
    marginTop: 8,
    textAlign: 'center',
  },
  emptyShared: {
    marginHorizontal: 16,
    marginVertical: 2,
    borderRadius: 12,
    borderWidth: 1,
    padding: 24,
    alignItems: 'center',
  },
  emptySharedText: {
    fontSize: 14,
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
    maxHeight: '70%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '600',
  },
  modalSubtitle: {
    fontSize: 14,
    marginBottom: 20,
    lineHeight: 20,
  },
  frequencyOptions: {
    maxHeight: 300,
  },
  frequencyOption: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 8,
  },
  frequencyOptionText: {
    fontSize: 16,
    fontWeight: '500',
  },
  selectedIndicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
});