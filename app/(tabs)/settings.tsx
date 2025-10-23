import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Switch, ScrollView, Platform, Image } from 'react-native';
import { Stack, router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Moon, Sun, HardDrive, Heart, Info, User, LogIn, LogOut, Share2, Users, CreditCard, MapPin, Stethoscope, Edit, QrCode, Languages, Bot } from 'lucide-react-native';
import { useApp } from '@/contexts/AppContext';
import { useAuth } from '@/contexts/AuthContext';
import { RadiaLogo } from '@/components/RadiaLogo';
import { QRSyncModal } from '@/components/QRSyncModal';
import { lightTheme, darkTheme } from '@/constants/theme';
import { useTranslation } from '@/hooks/useTranslation';
import { languageNames, Language } from '@/constants/translations';

export default function SettingsScreen() {
  const { settings, saveSettings } = useApp();
  const { user, isAuthenticated, signIn, signOut, getSharedItemsReceived, getSharedItemsSent } = useAuth();
  const userSyncCode = user?.id || 'no-user';
  const theme = settings.theme === 'dark' ? darkTheme : lightTheme;
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const [showSharedItems, setShowSharedItems] = useState(false);
  const [showQRModal, setShowQRModal] = useState(false);
  const [showLanguageSelector, setShowLanguageSelector] = useState(false);
  const [showAIProviderSelector, setShowAIProviderSelector] = useState(false);

  const sharedItemsReceived = getSharedItemsReceived();
  const sharedItemsSent = getSharedItemsSent();

  const handleThemeToggle = async () => {
    const newTheme = settings.theme === 'light' ? 'dark' : 'light';
    await saveSettings({ ...settings, theme: newTheme });
  };

  const handleFavoritesFirstToggle = async () => {
    await saveSettings({ ...settings, showFavoritesFirst: !settings.showFavoritesFirst });
  };

  const handleLanguageChange = async (language: Language) => {
    await saveSettings({ ...settings, language });
    setShowLanguageSelector(false);
  };

  const handleAIProviderChange = async (provider: 'rork' | 'groq' | 'gemini') => {
    await saveSettings({ ...settings, aiProvider: provider });
    setShowAIProviderSelector(false);
  };

  const aiProviderNames: Record<'rork' | 'groq' | 'gemini', string> = {
    rork: 'RORK (Default)',
    groq: 'GROQ',
    gemini: 'GEMINI',
  };





  const handleAbout = () => {
    const aboutTitle = t.settings.about;
    const aboutMessage = 'RAD-IA v1.0.0\n\n' + (settings.language === 'es' ? 
      'Aplicación de radiología inteligente para gestión de informes radiológicos.\n\nDesarrollado para profesionales médicos.' : 
      settings.language === 'en' ? 'Intelligent radiology application for medical report management.\n\nDeveloped for medical professionals.' :
      settings.language === 'de' ? 'Intelligente Radiologieanwendung für die Verwaltung medizinischer Berichte.\n\nEntwickelt für medizinisches Fachpersonal.' :
      settings.language === 'fr' ? 'Application de radiologie intelligente pour la gestion des rapports médicaux.\n\nDéveloppée pour les professionnels de santé.' :
      settings.language === 'pt' ? 'Aplicação de radiologia inteligente para gestão de relatórios médicos.\n\nDesenvolvido para profissionais médicos.' :
      'Applicazione di radiologia intelligente per la gestione dei rapporti medici.\n\nSviluppato per professionisti medici.');
    
    if (Platform.OS === 'web') {
      alert(aboutMessage);
    } else {
      const Alert = require('react-native').Alert;
      Alert.alert(aboutTitle, aboutMessage, [{ text: t.common.ok }]);
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
        {icon}
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
          {rightComponent}
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
          title: t.settings.title,
          headerStyle: { backgroundColor: theme.surface },
          headerTintColor: theme.onSurface,
        }}
      />

      {/* Sección de Usuario */}
      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: theme.onSurface }]}>
          {t.settings.user}
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
                  t.settings.dni,
                  user.dni
                )}
                
                {renderSettingItem(
                  <MapPin size={20} color={theme.primary} />,
                  t.settings.location,
                  `${user.city}, ${user.country}`
                )}
                
                {renderSettingItem(
                  <Stethoscope size={20} color={theme.primary} />,
                  t.settings.specialty,
                  `${user.medicalSpecialty} - Colegiado: ${user.medicalLicense}`
                )}
              </View>
            )}
            
            {renderSettingItem(
              <Share2 size={20} color={theme.primary} />,
              t.settings.sharedItems,
              `${sharedItemsReceived.length} ${t.settings.sharedItemsDescription}`,
              () => setShowSharedItems(!showSharedItems)
            )}
            
            {renderSettingItem(
              <LogOut size={20} color={theme.error || '#FF6B6B'} />,
              t.settings.signOut,
              t.settings.signOutDescription,
              signOut
            )}
          </>
        ) : (
          <>
            {renderSettingItem(
              <LogIn size={20} color={theme.primary} />,
              t.settings.signIn,
              t.settings.signInDescription,
              signIn
            )}
            
            {renderSettingItem(
              <Edit size={20} color={theme.primary} />,
              t.settings.createAccount,
              t.settings.createAccountDescription,
              signIn
            )}
          </>
        )}
      </View>

      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: theme.onSurface }]}>
          {t.settings.appearance}
        </Text>
        
        {renderSettingItem(
          settings.theme === 'dark' ? (
            <Moon size={20} color={theme.primary} />
          ) : (
            <Sun size={20} color={theme.primary} />
          ),
          t.settings.theme,
          settings.theme === 'dark' ? t.settings.darkMode : t.settings.lightMode,
          handleThemeToggle,
          <Switch
            value={settings.theme === 'dark'}
            onValueChange={handleThemeToggle}
            trackColor={{ false: theme.outline, true: theme.primary }}
            thumbColor={settings.theme === 'dark' ? theme.onPrimary : theme.onSurface}
          />
        )}
        
        {renderSettingItem(
          <Bot size={20} color={theme.primary} />,
          settings.language === 'es' ? 'Modelo de IA' :
          settings.language === 'en' ? 'AI Model' :
          settings.language === 'de' ? 'KI-Modell' :
          settings.language === 'fr' ? 'Modèle IA' :
          settings.language === 'pt' ? 'Modelo de IA' :
          'Modello IA',
          aiProviderNames[settings.aiProvider || 'rork'],
          () => setShowAIProviderSelector(!showAIProviderSelector)
        )}
        
        {showAIProviderSelector && (
          <View style={[styles.languageSelector, { backgroundColor: theme.surfaceVariant }]}>
            {(['rork', 'groq', 'gemini'] as const).map((provider) => (
              <TouchableOpacity
                key={provider}
                style={[
                  styles.languageOption,
                  {
                    backgroundColor: (settings.aiProvider || 'rork') === provider ? theme.primary : 'transparent',
                    borderColor: theme.outline,
                  },
                ]}
                onPress={() => handleAIProviderChange(provider)}
              >
                <Text
                  style={[
                    styles.languageOptionText,
                    {
                      color: (settings.aiProvider || 'rork') === provider ? theme.onPrimary : theme.onSurface,
                      fontWeight: (settings.aiProvider || 'rork') === provider ? '600' : '400',
                    },
                  ]}
                >
                  {aiProviderNames[provider]}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        )}
        
        {renderSettingItem(
          <Languages size={20} color={theme.primary} />,
          t.settings.language,
          languageNames[settings.language || 'es'],
          () => setShowLanguageSelector(!showLanguageSelector)
        )}
        
        {showLanguageSelector && (
          <View style={[styles.languageSelector, { backgroundColor: theme.surfaceVariant }]}>
            {(Object.keys(languageNames) as Language[]).map((lang) => (
              <TouchableOpacity
                key={lang}
                style={[
                  styles.languageOption,
                  {
                    backgroundColor: settings.language === lang ? theme.primary : 'transparent',
                    borderColor: theme.outline,
                  },
                ]}
                onPress={() => handleLanguageChange(lang)}
              >
                <Text
                  style={[
                    styles.languageOptionText,
                    {
                      color: settings.language === lang ? theme.onPrimary : theme.onSurface,
                      fontWeight: settings.language === lang ? '600' : '400',
                    },
                  ]}
                >
                  {languageNames[lang]}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        )}
      </View>

      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: theme.onSurface }]}>
          {t.settings.behavior}
        </Text>
        
        {renderSettingItem(
          <Heart size={20} color={theme.primary} />,
          t.settings.favoritesFirst,
          t.settings.favoritesFirstDescription,
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
          {t.settings.syncAndBackup}
        </Text>
        
        {renderSettingItem(
          <HardDrive size={20} color={theme.primary} />,
          t.settings.backupManagement,
          t.settings.backupManagementDescription,
          () => router.push('/backup-management')
        )}
        
        {renderSettingItem(
          <QrCode size={20} color={theme.primary} />,
          t.settings.myQRCode,
          t.settings.myQRCodeDescription,
          () => setShowQRModal(true)
        )}

      </View>

      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: theme.onSurface }]}>
          {t.settings.information}
        </Text>
        
        {renderSettingItem(
          <Info size={20} color={theme.primary} />,
          t.settings.about,
          t.settings.aboutDescription,
          handleAbout
        )}
      </View>

      <View style={styles.footer}>
        <View style={styles.footerLogo}>
          <RadiaLogo size="small" showText={true} color={theme.primary} textColor={theme.onSurface} />
        </View>
        <Text style={[styles.footerText, { color: theme.outline }]}>
          RAD-IA - {settings.language === 'es' ? 'Radiología Inteligente' : 
            settings.language === 'en' ? 'Intelligent Radiology' :
            settings.language === 'de' ? 'Intelligente Radiologie' :
            settings.language === 'fr' ? 'Radiologie Intelligente' :
            settings.language === 'pt' ? 'Radiologia Inteligente' :
            'Radiologia Intelligente'}
        </Text>
        <Text style={[styles.footerText, { color: theme.outline }]}>
          {t.settings.version} 1.0.0
        </Text>
      </View>
      </ScrollView>
      
      <QRSyncModal
        visible={showQRModal}
        onClose={() => setShowQRModal(false)}
        userSyncCode={userSyncCode}
      />
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
  languageSelector: {
    marginTop: 8,
    marginHorizontal: 16,
    borderRadius: 12,
    padding: 8,
    gap: 6,
  },
  languageOption: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    borderWidth: 1,
  },
  languageOptionText: {
    fontSize: 16,
  },
});