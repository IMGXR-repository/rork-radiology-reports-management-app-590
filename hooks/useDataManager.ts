import { useState, useEffect } from 'react';
import { Platform } from 'react-native';
import { Report, ReportCategory, ReportFilter, PhraseCategory, PhraseFilter, CommonPhrase, AppSettings, ProductivityStats, EconomicProfitabilityData, SavedTranscription } from '@/types';

// Simple storage abstraction for cross-platform compatibility
const storage = {
  async getItem(key: string): Promise<string | null> {
    if (Platform.OS === 'web') {
      return localStorage.getItem(key);
    } else {
      const AsyncStorage = require('@react-native-async-storage/async-storage').default;
      return await AsyncStorage.getItem(key);
    }
  },
  async setItem(key: string, value: string): Promise<void> {
    if (Platform.OS === 'web') {
      localStorage.setItem(key, value);
    } else {
      const AsyncStorage = require('@react-native-async-storage/async-storage').default;
      await AsyncStorage.setItem(key, value);
    }
  }
};

const STORAGE_KEYS = {
  REPORTS: 'pref_reports',
  REPORT_CATEGORIES: 'pref_report_categories',
  REPORT_FILTERS: 'pref_report_filters',
  PHRASES: 'pref_phrases',
  PHRASE_CATEGORIES: 'pref_phrase_categories',
  PHRASE_FILTERS: 'pref_phrase_filters',
  SETTINGS: 'pref_settings',
  STATS: 'pref_stats',
  SAVED_TRANSCRIPTIONS: 'pref_saved_transcriptions',
  // Legacy keys for migration
  CATEGORIES: 'pref_categories',
  FILTERS: 'pref_filters',
};

const defaultReportCategories: ReportCategory[] = [
  {
    id: 'report_cat_1',
    name: 'TECNICAS',
    isVisible: true,
    color: '#2196F3',
    icon: 'Settings',
    createdAt: new Date().toISOString(),
  },
  {
    id: 'report_cat_2',
    name: 'ORGANO / SISTEMA',
    isVisible: true,
    color: '#4CAF50',
    icon: 'Heart',
    createdAt: new Date().toISOString(),
  },
];

const defaultPhraseCategories: PhraseCategory[] = [
  {
    id: 'phrase_cat_1',
    name: 'Técnica',
    isVisible: true,
    color: '#9C27B0',
    icon: 'Settings',
    createdAt: new Date().toISOString(),
  },
  {
    id: 'phrase_cat_2',
    name: 'Descripción',
    isVisible: true,
    color: '#FF5722',
    icon: 'FileText',
    createdAt: new Date().toISOString(),
  },
  {
    id: 'phrase_cat_3',
    name: 'Conclusión',
    isVisible: true,
    color: '#607D8B',
    icon: 'CheckCircle',
    createdAt: new Date().toISOString(),
  },
];

const defaultReportFilters: ReportFilter[] = [
  { id: 'report_filter_1', name: 'TC', categoryId: 'report_cat_1', isActive: true, createdAt: new Date().toISOString() },
  { id: 'report_filter_2', name: 'RM', categoryId: 'report_cat_1', isActive: true, createdAt: new Date().toISOString() },
  { id: 'report_filter_3', name: 'ECO', categoryId: 'report_cat_1', isActive: true, createdAt: new Date().toISOString() },
  { id: 'report_filter_4', name: 'RX', categoryId: 'report_cat_1', isActive: true, createdAt: new Date().toISOString() },
  { id: 'report_filter_5', name: 'MAMO', categoryId: 'report_cat_1', isActive: true, createdAt: new Date().toISOString() },
  { id: 'report_filter_6', name: 'NEURO', categoryId: 'report_cat_2', isActive: true, createdAt: new Date().toISOString() },
  { id: 'report_filter_7', name: 'MSK', categoryId: 'report_cat_2', isActive: true, createdAt: new Date().toISOString() },
  { id: 'report_filter_8', name: 'MAMA', categoryId: 'report_cat_2', isActive: true, createdAt: new Date().toISOString() },
  { id: 'report_filter_9', name: 'TORAX', categoryId: 'report_cat_2', isActive: true, createdAt: new Date().toISOString() },
  { id: 'report_filter_10', name: 'ABDOMEN', categoryId: 'report_cat_2', isActive: true, createdAt: new Date().toISOString() },
  { id: 'report_filter_11', name: 'VASCULAR', categoryId: 'report_cat_2', isActive: true, createdAt: new Date().toISOString() },
];

const defaultPhraseFilters: PhraseFilter[] = [
  { id: 'phrase_filter_1', name: 'Contraste', categoryId: 'phrase_cat_1', isActive: true, createdAt: new Date().toISOString() },
  { id: 'phrase_filter_2', name: 'Sin contraste', categoryId: 'phrase_cat_1', isActive: true, createdAt: new Date().toISOString() },
  { id: 'phrase_filter_3', name: 'Normal', categoryId: 'phrase_cat_2', isActive: true, createdAt: new Date().toISOString() },
  { id: 'phrase_filter_4', name: 'Patológico', categoryId: 'phrase_cat_2', isActive: true, createdAt: new Date().toISOString() },
  { id: 'phrase_filter_5', name: 'Recomendación', categoryId: 'phrase_cat_3', isActive: true, createdAt: new Date().toISOString() },
  { id: 'phrase_filter_6', name: 'Seguimiento', categoryId: 'phrase_cat_3', isActive: true, createdAt: new Date().toISOString() },
];

const defaultSettings: AppSettings = {
  theme: 'light',
  language: 'es',
  autoBackup: false,
  showFavoritesFirst: true,
  autoBackupEnabled: false,
  autoBackupFrequencyDays: 3,
  aiProvider: 'rork',
};

const defaultStats: ProductivityStats = {
  reportsCopied: 0,
  phrasesCopied: 0,
  todaysCopies: 0,
  weekCopies: 0,
  monthCopies: 0,
  dailyStats: {},
  // New metrics
  recordingsCount: 0,
  aiReportsGenerated: 0,
  aiChatQueries: 0,
  totalInteractionTime: 0,
  dailyInteractionTime: {},
  totalDaysUsed: 0,
  aiHallazgosCopied: 0,
  aiConclusionsCopied: 0,
  aiDiferencialesCopied: 0,
  reportsShared: 0,
  phrasesShared: 0,
  monthlyProfitability: {},
};

export function useDataManager() {
  const [reports, setReports] = useState<Report[]>([]);
  const [reportCategories, setReportCategories] = useState<ReportCategory[]>([]);
  const [reportFilters, setReportFilters] = useState<ReportFilter[]>([]);
  const [phrases, setPhrases] = useState<CommonPhrase[]>([]);
  const [phraseCategories, setPhraseCategories] = useState<PhraseCategory[]>([]);
  const [phraseFilters, setPhraseFilters] = useState<PhraseFilter[]>([]);
  const [settings, setSettings] = useState<AppSettings>(defaultSettings);
  const [stats, setStats] = useState<ProductivityStats>(defaultStats);
  const [savedTranscriptions, setSavedTranscriptions] = useState<SavedTranscription[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  // Legacy compatibility
  const categories = reportCategories;
  const filters = reportFilters;

  useEffect(() => {
    setIsLoading(false);
    loadData().catch(err => console.error('Error in loadData:', err));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    checkAutoBackup().catch(err => console.error('Error in checkAutoBackup:', err));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [settings.autoBackupEnabled, settings.lastAutoBackupDate, settings.autoBackupFrequencyDays]);

  const checkAutoBackup = async () => {
    if (!settings.autoBackupEnabled) return;
    
    const now = new Date();
    const lastBackup = settings.lastAutoBackupDate ? new Date(settings.lastAutoBackupDate) : null;
    
    if (!lastBackup) {
      await performAutoBackup();
      return;
    }
    
    const daysSinceLastBackup = Math.floor((now.getTime() - lastBackup.getTime()) / (1000 * 60 * 60 * 24));
    const backupFrequency = settings.autoBackupFrequencyDays || 3;
    
    if (daysSinceLastBackup >= backupFrequency) {
      await performAutoBackup();
    }
  };

  const performAutoBackup = async () => {
    try {
      console.log('Realizando respaldo automático...');
      const backupData = await exportData();
      const today = new Date().toISOString().split('T')[0];
      const backupKey = `auto_backup_${today}`;
      await storage.setItem(backupKey, backupData);
      
      await saveSettings({
        ...settings,
        lastAutoBackupDate: new Date().toISOString(),
      });
      
      console.log('Respaldo automático completado');
    } catch (error) {
      console.error('Error en respaldo automático:', error);
    }
  };

  const performAutoBackupOnChange = async () => {
    try {
      console.log('Realizando respaldo automático por cambio de datos...');
      const backupData = await exportData();
      const timestamp = new Date().toISOString();
      const backupKey = `auto_backup_${timestamp}`;
      await storage.setItem(backupKey, backupData);
      
      await cleanOldBackups();
      
      console.log('Respaldo automático por cambio completado');
    } catch (error) {
      console.error('Error en respaldo automático por cambio:', error);
    }
  };

  const cleanOldBackups = async () => {
    try {
      const MAX_BACKUPS = 20;
      let backupKeys: string[] = [];

      if (Platform.OS === 'web') {
        const allKeys = Object.keys(localStorage);
        backupKeys = allKeys.filter(
          (key) => key.startsWith('auto_backup_') || key.startsWith('manual_backup_')
        );
      } else {
        const AsyncStorage = require('@react-native-async-storage/async-storage').default;
        const allKeys = await AsyncStorage.getAllKeys();
        backupKeys = allKeys.filter(
          (key: string) => key.startsWith('auto_backup_') || key.startsWith('manual_backup_')
        );
      }

      backupKeys.sort((a, b) => {
        const dateA = a.replace('auto_backup_', '').replace('manual_backup_', '');
        const dateB = b.replace('auto_backup_', '').replace('manual_backup_', '');
        return dateB.localeCompare(dateA);
      });

      if (backupKeys.length > MAX_BACKUPS) {
        const keysToDelete = backupKeys.slice(MAX_BACKUPS);
        console.log(`Eliminando ${keysToDelete.length} respaldos antiguos...`);

        if (Platform.OS === 'web') {
          keysToDelete.forEach((key) => localStorage.removeItem(key));
        } else {
          const AsyncStorage = require('@react-native-async-storage/async-storage').default;
          await AsyncStorage.multiRemove(keysToDelete);
        }
        
        console.log('Respaldos antiguos eliminados');
      }
    } catch (error) {
      console.error('Error limpiando respaldos antiguos:', error);
    }
  };



  const loadData = async () => {
    try {
      console.log('Starting data load...');
      
      checkAndImportLatestBackup().catch(err => {
        console.error('Error checking backup:', err);
      });
      
      const [
        reportsData,
        reportCategoriesData,
        reportFiltersData,
        phrasesData,
        phraseCategoriesData,
        phraseFiltersData,
        settingsData,
        statsData,
        savedTranscriptionsData,
        // Legacy data for migration
        legacyCategoriesData,
        legacyFiltersData
      ] = await Promise.all([
        storage.getItem(STORAGE_KEYS.REPORTS),
        storage.getItem(STORAGE_KEYS.REPORT_CATEGORIES),
        storage.getItem(STORAGE_KEYS.REPORT_FILTERS),
        storage.getItem(STORAGE_KEYS.PHRASES),
        storage.getItem(STORAGE_KEYS.PHRASE_CATEGORIES),
        storage.getItem(STORAGE_KEYS.PHRASE_FILTERS),
        storage.getItem(STORAGE_KEYS.SETTINGS),
        storage.getItem(STORAGE_KEYS.STATS),
        storage.getItem(STORAGE_KEYS.SAVED_TRANSCRIPTIONS),
        storage.getItem(STORAGE_KEYS.CATEGORIES),
        storage.getItem(STORAGE_KEYS.FILTERS),
      ]);

      setReports(reportsData ? JSON.parse(reportsData) : []);
      
      // Handle report categories and filters (with legacy migration)
      if (reportCategoriesData) {
        setReportCategories(JSON.parse(reportCategoriesData));
      } else if (legacyCategoriesData) {
        // Migrate legacy categories to report categories
        const legacyCategories = JSON.parse(legacyCategoriesData);
        setReportCategories(legacyCategories);
        await storage.setItem(STORAGE_KEYS.REPORT_CATEGORIES, JSON.stringify(legacyCategories));
      } else {
        setReportCategories(defaultReportCategories);
      }
      
      if (reportFiltersData) {
        setReportFilters(JSON.parse(reportFiltersData));
      } else if (legacyFiltersData) {
        // Migrate legacy filters to report filters
        const legacyFilters = JSON.parse(legacyFiltersData);
        setReportFilters(legacyFilters);
        await storage.setItem(STORAGE_KEYS.REPORT_FILTERS, JSON.stringify(legacyFilters));
      } else {
        setReportFilters(defaultReportFilters);
      }
      
      // Handle phrase categories and filters
      setPhraseCategories(phraseCategoriesData ? JSON.parse(phraseCategoriesData) : defaultPhraseCategories);
      setPhraseFilters(phraseFiltersData ? JSON.parse(phraseFiltersData) : defaultPhraseFilters);
      
      setPhrases(phrasesData ? JSON.parse(phrasesData) : []);
      setSavedTranscriptions(savedTranscriptionsData ? JSON.parse(savedTranscriptionsData) : []);
      const loadedSettings = settingsData ? JSON.parse(settingsData) : defaultSettings;
      if (loadedSettings && !loadedSettings.autoBackupFrequencyDays) {
        loadedSettings.autoBackupFrequencyDays = 3;
      }
      if (!loadedSettings.aiProvider) {
        loadedSettings.aiProvider = 'rork';
      }
      setSettings(loadedSettings);
      
      // Load and update stats
      const loadedStats = statsData ? JSON.parse(statsData) : defaultStats;
      const updatedStats = updateStatsForCurrentDate(loadedStats);
      setStats(updatedStats);
      if (JSON.stringify(updatedStats) !== JSON.stringify(loadedStats)) {
        await storage.setItem(STORAGE_KEYS.STATS, JSON.stringify(updatedStats));
      }
      
      console.log('Data loaded successfully');
    } catch (error) {
      console.error('Error loading data:', error);
    }
  };

  const updateStatsForCurrentDate = (currentStats: ProductivityStats): ProductivityStats => {
    const today = new Date().toISOString().split('T')[0];
    const now = new Date();
    const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    
    // Reset daily counters if it's a new day
    const todaysCopies = currentStats.lastCopyDate === today ? currentStats.todaysCopies : 0;
    
    // Calculate week and month copies from daily stats
    let weekCopies = 0;
    let monthCopies = 0;
    
    Object.entries(currentStats.dailyStats).forEach(([date, copies]) => {
      const statDate = new Date(date);
      if (statDate >= weekAgo) {
        weekCopies += copies;
      }
      if (statDate >= monthStart) {
        monthCopies += copies;
      }
    });
    
    // Add today's copies
    weekCopies += todaysCopies;
    monthCopies += todaysCopies;
    
    return {
      ...currentStats,
      todaysCopies,
      weekCopies,
      monthCopies,
    };
  };

  const saveReports = async (newReports: Report[]) => {
    try {
      if (!Array.isArray(newReports)) return;
      await storage.setItem(STORAGE_KEYS.REPORTS, JSON.stringify(newReports));
      setReports(newReports);
      await performAutoBackupOnChange();
    } catch (error) {
      console.error('Error saving reports:', error);
    }
  };

  const saveReportCategories = async (newCategories: ReportCategory[]) => {
    try {
      if (!Array.isArray(newCategories)) return;
      await storage.setItem(STORAGE_KEYS.REPORT_CATEGORIES, JSON.stringify(newCategories));
      setReportCategories(newCategories);
    } catch (error) {
      console.error('Error saving report categories:', error);
    }
  };

  const saveReportFilters = async (newFilters: ReportFilter[]) => {
    try {
      if (!Array.isArray(newFilters)) return;
      await storage.setItem(STORAGE_KEYS.REPORT_FILTERS, JSON.stringify(newFilters));
      setReportFilters(newFilters);
    } catch (error) {
      console.error('Error saving report filters:', error);
    }
  };

  const savePhraseCategories = async (newCategories: PhraseCategory[]) => {
    try {
      if (!Array.isArray(newCategories)) return;
      await storage.setItem(STORAGE_KEYS.PHRASE_CATEGORIES, JSON.stringify(newCategories));
      setPhraseCategories(newCategories);
    } catch (error) {
      console.error('Error saving phrase categories:', error);
    }
  };

  const savePhraseFilters = async (newFilters: PhraseFilter[]) => {
    try {
      if (!Array.isArray(newFilters)) return;
      await storage.setItem(STORAGE_KEYS.PHRASE_FILTERS, JSON.stringify(newFilters));
      setPhraseFilters(newFilters);
    } catch (error) {
      console.error('Error saving phrase filters:', error);
    }
  };

  // Legacy compatibility methods
  const saveCategories = saveReportCategories;
  const saveFilters = saveReportFilters;

  const savePhrases = async (newPhrases: CommonPhrase[]) => {
    try {
      if (!Array.isArray(newPhrases)) return;
      await storage.setItem(STORAGE_KEYS.PHRASES, JSON.stringify(newPhrases));
      setPhrases(newPhrases);
      await performAutoBackupOnChange();
    } catch (error) {
      console.error('Error saving phrases:', error);
    }
  };

  const saveSettings = async (newSettings: AppSettings) => {
    try {
      if (!newSettings || typeof newSettings !== 'object') return;
      await storage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(newSettings));
      setSettings(newSettings);
    } catch (error) {
      console.error('Error saving settings:', error);
    }
  };

  const saveStats = async (newStats: ProductivityStats) => {
    try {
      if (!newStats || typeof newStats !== 'object') return;
      await storage.setItem(STORAGE_KEYS.STATS, JSON.stringify(newStats));
      setStats(newStats);
    } catch (error) {
      console.error('Error saving stats:', error);
    }
  };

  const trackCopy = async (type: 'report' | 'phrase' | 'ai-hallazgos' | 'ai-conclusiones' | 'ai-diferenciales') => {
    const today = new Date().toISOString().split('T')[0];
    const updatedStats = {
      ...stats,
      reportsCopied: type === 'report' ? stats.reportsCopied + 1 : stats.reportsCopied,
      phrasesCopied: type === 'phrase' ? stats.phrasesCopied + 1 : stats.phrasesCopied,
      aiHallazgosCopied: type === 'ai-hallazgos' ? stats.aiHallazgosCopied + 1 : stats.aiHallazgosCopied,
      aiConclusionsCopied: type === 'ai-conclusiones' ? stats.aiConclusionsCopied + 1 : stats.aiConclusionsCopied,
      aiDiferencialesCopied: type === 'ai-diferenciales' ? stats.aiDiferencialesCopied + 1 : stats.aiDiferencialesCopied,
      todaysCopies: stats.todaysCopies + 1,
      lastCopyDate: today,
      dailyStats: {
        ...stats.dailyStats,
        [today]: (stats.dailyStats[today] || 0) + 1,
      },
    };
    
    // Recalculate week and month copies
    const finalStats = updateStatsForCurrentDate(updatedStats);
    await saveStats(finalStats);
  };

  const addReport = async (report: Omit<Report, 'id' | 'createdAt' | 'updatedAt'>) => {
    const newReport: Report = {
      ...report,
      id: Date.now().toString(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      isNewlyCreated: true,
    };
    const updatedReports = [newReport, ...reports];
    await saveReports(updatedReports);
    return newReport;
  };

  const updateReport = async (id: string, updates: Partial<Report>) => {
    const updatedReports = reports.map(report =>
      report.id === id
        ? { ...report, ...updates, updatedAt: new Date().toISOString() }
        : report
    );
    await saveReports(updatedReports);
  };

  const deleteReport = async (id: string) => {
    const updatedReports = reports.filter(report => report.id !== id);
    await saveReports(updatedReports);
  };

  const toggleFavorite = async (id: string) => {
    const report = reports.find(r => r.id === id);
    if (report) {
      await updateReport(id, { isFavorite: !report.isFavorite });
    }
  };

  const addPhrase = async (phrase: Omit<CommonPhrase, 'id' | 'createdAt'>) => {
    const newPhrase: CommonPhrase = {
      ...phrase,
      id: Date.now().toString(),
      createdAt: new Date().toISOString(),
    };
    const updatedPhrases = [...phrases, newPhrase];
    await savePhrases(updatedPhrases);
    return newPhrase;
  };

  const updatePhrase = async (id: string, updates: Partial<CommonPhrase>) => {
    const updatedPhrases = phrases.map(phrase =>
      phrase.id === id
        ? { ...phrase, ...updates }
        : phrase
    );
    await savePhrases(updatedPhrases);
  };

  const deletePhrase = async (id: string) => {
    const updatedPhrases = phrases.filter(phrase => phrase.id !== id);
    await savePhrases(updatedPhrases);
  };

  const togglePhraseFavorite = async (id: string) => {
    const phrase = phrases.find(p => p.id === id);
    if (phrase) {
      await updatePhrase(id, { isFavorite: !phrase.isFavorite });
    }
  };

  // New tracking methods
  const trackRecording = async () => {
    const today = new Date().toISOString().split('T')[0];
    const updatedStats = {
      ...stats,
      recordingsCount: stats.recordingsCount + 1,
      firstUseDate: stats.firstUseDate || today,
    };
    await saveStats(updatedStats);
  };

  const trackAIReportGeneration = async () => {
    const today = new Date().toISOString().split('T')[0];
    const updatedStats = {
      ...stats,
      aiReportsGenerated: stats.aiReportsGenerated + 1,
      firstUseDate: stats.firstUseDate || today,
    };
    await saveStats(updatedStats);
  };

  const trackAIChatQuery = async () => {
    const today = new Date().toISOString().split('T')[0];
    const updatedStats = {
      ...stats,
      aiChatQueries: stats.aiChatQueries + 1,
      firstUseDate: stats.firstUseDate || today,
    };
    await saveStats(updatedStats);
  };

  const trackInteractionTime = async (minutes: number) => {
    const today = new Date().toISOString().split('T')[0];
    const updatedStats = {
      ...stats,
      totalInteractionTime: stats.totalInteractionTime + minutes,
      dailyInteractionTime: {
        ...stats.dailyInteractionTime,
        [today]: (stats.dailyInteractionTime[today] || 0) + minutes,
      },
      firstUseDate: stats.firstUseDate || today,
    };
    await saveStats(updatedStats);
  };

  const setSatisfactionRating = async (rating: number) => {
    const today = new Date().toISOString().split('T')[0];
    const updatedStats = {
      ...stats,
      appSatisfactionRating: rating,
      satisfactionDate: today,
    };
    await saveStats(updatedStats);
  };

  const calculateProductivity = () => {
    const totalCopies = stats.reportsCopied + stats.phrasesCopied + 
                       stats.aiHallazgosCopied + stats.aiConclusionsCopied + 
                       stats.aiDiferencialesCopied;
    
    const totalHours = stats.totalInteractionTime / 60;
    const daysUsed = stats.totalDaysUsed || 1;
    
    if (totalHours === 0 || daysUsed === 0) return 0;
    
    return Number((totalCopies / (totalHours * daysUsed)).toFixed(2));
  };

  const saveEconomicProfitability = async (data: EconomicProfitabilityData) => {
    const now = new Date();
    const monthKey = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
    
    const updatedStats = {
      ...stats,
      economicProfitability: data,
      monthlyProfitability: {
        ...stats.monthlyProfitability,
        [monthKey]: data.monthlyBenefit,
      },
    };
    await saveStats(updatedStats);
  };
  
  const trackReportShare = async () => {
    const updatedStats = {
      ...stats,
      reportsShared: stats.reportsShared + 1,
    };
    await saveStats(updatedStats);
  };
  
  const trackPhraseShare = async () => {
    const updatedStats = {
      ...stats,
      phrasesShared: stats.phrasesShared + 1,
    };
    await saveStats(updatedStats);
  };

  const saveSavedTranscriptions = async (newTranscriptions: SavedTranscription[]) => {
    try {
      if (!Array.isArray(newTranscriptions)) return;
      await storage.setItem(STORAGE_KEYS.SAVED_TRANSCRIPTIONS, JSON.stringify(newTranscriptions));
      setSavedTranscriptions(newTranscriptions);
    } catch (error) {
      console.error('Error saving transcriptions:', error);
    }
  };

  const addSavedTranscription = async (text: string, mode: 'ia' | 'natural') => {
    const newTranscription: SavedTranscription = {
      id: Date.now().toString(),
      text,
      mode,
      createdAt: new Date().toISOString(),
    };
    const updatedTranscriptions = [newTranscription, ...savedTranscriptions];
    await saveSavedTranscriptions(updatedTranscriptions);
    return newTranscription;
  };

  const deleteSavedTranscription = async (id: string) => {
    const updatedTranscriptions = savedTranscriptions.filter(t => t.id !== id);
    await saveSavedTranscriptions(updatedTranscriptions);
  };

  const clearAllSavedTranscriptions = async () => {
    await saveSavedTranscriptions([]);
  };

  const clearNewlyCreatedFlag = async () => {
    const updatedReports = reports.map(report => ({
      ...report,
      isNewlyCreated: false,
    }));
    await saveReports(updatedReports);
  };

  const checkAndImportLatestBackup = async () => {
    try {
      const currentVersion = await storage.getItem('app_version');
      const appVersion = '1.0.0';
      
      if (currentVersion !== appVersion) {
        console.log('Nueva versión detectada, buscando último respaldo...');
        
        const latestBackup = await getLatestAutoBackup();
        if (latestBackup) {
          console.log('Restaurando último respaldo automáticamente...');
          const data = JSON.parse(latestBackup);
          
          if (data.reports) {
            await storage.setItem(STORAGE_KEYS.REPORTS, JSON.stringify(data.reports));
          }
          if (data.reportCategories) {
            await storage.setItem(STORAGE_KEYS.REPORT_CATEGORIES, JSON.stringify(data.reportCategories));
          }
          if (data.reportFilters) {
            await storage.setItem(STORAGE_KEYS.REPORT_FILTERS, JSON.stringify(data.reportFilters));
          }
          if (data.phraseCategories) {
            await storage.setItem(STORAGE_KEYS.PHRASE_CATEGORIES, JSON.stringify(data.phraseCategories));
          }
          if (data.phraseFilters) {
            await storage.setItem(STORAGE_KEYS.PHRASE_FILTERS, JSON.stringify(data.phraseFilters));
          }
          if (data.phrases) {
            await storage.setItem(STORAGE_KEYS.PHRASES, JSON.stringify(data.phrases));
          }
          if (data.settings) {
            await storage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(data.settings));
          }
          if (data.stats) {
            await storage.setItem(STORAGE_KEYS.STATS, JSON.stringify(data.stats));
          }
          
          console.log('Respaldo restaurado correctamente');
        } else {
          console.log('No se encontró ningún respaldo para importar');
        }
        
        await storage.setItem('app_version', appVersion);
      }
    } catch (error) {
      console.error('Error al verificar e importar respaldo:', error);
    }
  };

  const getLatestAutoBackup = async () => {
    try {
      if (Platform.OS === 'web') {
        const keys = Object.keys(localStorage).filter(key => key.startsWith('auto_backup_'));
        if (keys.length === 0) return null;
        
        const latestKey = keys.sort().reverse()[0];
        return localStorage.getItem(latestKey);
      } else {
        const AsyncStorage = require('@react-native-async-storage/async-storage').default;
        const allKeys = await AsyncStorage.getAllKeys();
        const backupKeys = allKeys.filter((key: string) => key.startsWith('auto_backup_'));
        
        if (backupKeys.length === 0) return null;
        
        const latestKey = backupKeys.sort().reverse()[0];
        return await AsyncStorage.getItem(latestKey);
      }
    } catch (error) {
      console.error('Error obteniendo último respaldo:', error);
      return null;
    }
  };

  const exportData = async () => {
    const data = {
      reports,
      reportCategories,
      reportFilters,
      phrases,
      phraseCategories,
      phraseFilters,
      settings,
      stats,
      savedTranscriptions,
      exportDate: new Date().toISOString(),
      version: '2.1.0',
      // Legacy compatibility
      categories: reportCategories,
      filters: reportFilters,
    };
    return JSON.stringify(data, null, 2);
  };

  const importData = async (jsonData: string) => {
    try {
      console.log('🔍 [Import] Iniciando importación de datos...');
      
      if (!jsonData || typeof jsonData !== 'string' || jsonData.trim().length === 0) {
        console.error('❌ [Import] Datos vacíos o inválidos');
        return false;
      }
      
      console.log('🔍 [Import] Longitud de datos:', jsonData.length);
      
      let data;
      try {
        data = JSON.parse(jsonData.trim());
        console.log('✅ [Import] JSON parseado correctamente');
      } catch (parseError) {
        console.error('❌ [Import] Error al parsear JSON:', parseError);
        console.error('🔍 [Import] Primeros 100 caracteres:', jsonData.substring(0, 100));
        return false;
      }
      
      if (!data || typeof data !== 'object') {
        console.error('❌ [Import] Datos parseados no son un objeto válido');
        return false;
      }
      
      console.log('🔍 [Import] Claves encontradas:', Object.keys(data));
      console.log('🔍 [Import] Número de informes:', data.reports?.length || 0);
      console.log('🔍 [Import] Número de frases:', data.phrases?.length || 0);
      console.log('🔍 [Import] Número de categorías de informes:', data.reportCategories?.length || 0);
      console.log('🔍 [Import] Número de filtros de informes:', data.reportFilters?.length || 0);
      
      // PASO 1: Import categories and filters FIRST before reports and phrases
      // This ensures filters are available when editing
      
      // Handle new format categories and filters
      if (data.reportCategories) {
        console.log('📂 [Import] Importando', data.reportCategories.length, 'categorías de informes...');
        const importedCategories = Array.isArray(data.reportCategories) ? data.reportCategories : [];
        await storage.setItem(STORAGE_KEYS.REPORT_CATEGORIES, JSON.stringify(importedCategories));
        setReportCategories(importedCategories);
        console.log('✅ [Import] Categorías de informes guardadas en storage');
      } else if (!data.reportCategories && !data.categories) {
        console.log('⚠️ [Import] No se encontraron categorías, usando las por defecto');
        await storage.setItem(STORAGE_KEYS.REPORT_CATEGORIES, JSON.stringify(defaultReportCategories));
        setReportCategories(defaultReportCategories);
      }
      
      if (data.reportFilters) {
        console.log('🏷️ [Import] Importando', data.reportFilters.length, 'filtros de informes...');
        const importedFilters = Array.isArray(data.reportFilters) ? data.reportFilters : [];
        await storage.setItem(STORAGE_KEYS.REPORT_FILTERS, JSON.stringify(importedFilters));
        setReportFilters(importedFilters);
        console.log('✅ [Import] Filtros de informes guardados en storage');
        console.log('🔍 [Import] IDs de filtros importados:', importedFilters.map((f: ReportFilter) => f.id));
      } else if (!data.reportFilters && !data.filters) {
        console.log('⚠️ [Import] No se encontraron filtros, usando los por defecto');
        await storage.setItem(STORAGE_KEYS.REPORT_FILTERS, JSON.stringify(defaultReportFilters));
        setReportFilters(defaultReportFilters);
      }
      
      if (data.phraseCategories) {
        console.log('📂 [Import] Importando', data.phraseCategories.length, 'categorías de frases...');
        const importedCategories = Array.isArray(data.phraseCategories) ? data.phraseCategories : [];
        await storage.setItem(STORAGE_KEYS.PHRASE_CATEGORIES, JSON.stringify(importedCategories));
        setPhraseCategories(importedCategories);
        console.log('✅ [Import] Categorías de frases guardadas en storage');
      } else if (!data.phraseCategories) {
        console.log('⚠️ [Import] No se encontraron categorías de frases, usando las por defecto');
        await storage.setItem(STORAGE_KEYS.PHRASE_CATEGORIES, JSON.stringify(defaultPhraseCategories));
        setPhraseCategories(defaultPhraseCategories);
      }
      
      if (data.phraseFilters) {
        console.log('🏷️ [Import] Importando', data.phraseFilters.length, 'filtros de frases...');
        const importedFilters = Array.isArray(data.phraseFilters) ? data.phraseFilters : [];
        await storage.setItem(STORAGE_KEYS.PHRASE_FILTERS, JSON.stringify(importedFilters));
        setPhraseFilters(importedFilters);
        console.log('✅ [Import] Filtros de frases guardados en storage');
      } else if (!data.phraseFilters) {
        console.log('⚠️ [Import] No se encontraron filtros de frases, usando los por defecto');
        await storage.setItem(STORAGE_KEYS.PHRASE_FILTERS, JSON.stringify(defaultPhraseFilters));
        setPhraseFilters(defaultPhraseFilters);
      }
      
      // Handle legacy format
      if (data.categories && !data.reportCategories) {
        console.log('📂 [Import] Importando categorías (formato legacy)...');
        const importedCategories = Array.isArray(data.categories) ? data.categories : [];
        await storage.setItem(STORAGE_KEYS.REPORT_CATEGORIES, JSON.stringify(importedCategories));
        setReportCategories(importedCategories);
        console.log('✅ [Import] Categorías (legacy) guardadas en storage');
      }
      if (data.filters && !data.reportFilters) {
        console.log('🏷️ [Import] Importando filtros (formato legacy)...');
        const importedFilters = Array.isArray(data.filters) ? data.filters : [];
        await storage.setItem(STORAGE_KEYS.REPORT_FILTERS, JSON.stringify(importedFilters));
        setReportFilters(importedFilters);
        console.log('✅ [Import] Filtros (legacy) guardados en storage');
        console.log('🔍 [Import] IDs de filtros importados (legacy):', importedFilters.map((f: ReportFilter) => f.id));
      }
      
      // PASO 2: Now import reports and phrases
      if (data.reports) {
        console.log('📝 [Import] Importando', data.reports.length, 'informes...');
        const importedReports = Array.isArray(data.reports) ? data.reports : [];
        
        // Log sample of report filters
        if (importedReports.length > 0) {
          console.log('🔍 [Import] Ejemplo de filtros en informes:', {
            reportId: importedReports[0].id,
            filters: importedReports[0].filters,
            categoryId: importedReports[0].categoryId
          });
        }
        
        await storage.setItem(STORAGE_KEYS.REPORTS, JSON.stringify(importedReports));
        setReports(importedReports);
        console.log('✅ [Import] Informes guardados en storage');
      }
      
      if (data.phrases) {
        console.log('💬 [Import] Importando', data.phrases.length, 'frases...');
        const importedPhrases = Array.isArray(data.phrases) ? data.phrases : [];
        
        // Log sample of phrase filters
        if (importedPhrases.length > 0) {
          console.log('🔍 [Import] Ejemplo de filtros en frases:', {
            phraseId: importedPhrases[0].id,
            filters: importedPhrases[0].filters,
            categoryId: importedPhrases[0].categoryId
          });
        }
        
        await storage.setItem(STORAGE_KEYS.PHRASES, JSON.stringify(importedPhrases));
        setPhrases(importedPhrases);
        console.log('✅ [Import] Frases guardadas en storage');
      }
      
      // PASO 3: Import other data
      if (data.savedTranscriptions) {
        console.log('🎤 [Import] Importando', data.savedTranscriptions.length, 'transcripciones...');
        const importedTranscriptions = Array.isArray(data.savedTranscriptions) ? data.savedTranscriptions : [];
        await storage.setItem(STORAGE_KEYS.SAVED_TRANSCRIPTIONS, JSON.stringify(importedTranscriptions));
        setSavedTranscriptions(importedTranscriptions);
        console.log('✅ [Import] Transcripciones guardadas en storage');
      }
      if (data.settings) {
        console.log('⚙️ [Import] Importando configuración...');
        await storage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(data.settings));
        setSettings(data.settings);
        console.log('✅ [Import] Configuración guardada en storage');
      }
      if (data.stats) {
        console.log('📊 [Import] Importando estadísticas...');
        await storage.setItem(STORAGE_KEYS.STATS, JSON.stringify(data.stats));
        setStats(data.stats);
        console.log('✅ [Import] Estadísticas guardadas en storage');
      }
      
      console.log('✅ [Import] Importación completada con éxito');
      console.log('📊 [Import] Resumen final:');
      console.log('  - Informes:', data.reports?.length || 0);
      console.log('  - Frases:', data.phrases?.length || 0);
      console.log('  - Categorías de informes:', data.reportCategories?.length || data.categories?.length || 0);
      console.log('  - Filtros de informes:', data.reportFilters?.length || data.filters?.length || 0);
      console.log('  - Categorías de frases:', data.phraseCategories?.length || 0);
      console.log('  - Filtros de frases:', data.phraseFilters?.length || 0);
      
      return true;
    } catch (error) {
      console.error('❌ [Import] Error general en importación:', error);
      if (error instanceof Error) {
        console.error('❌ [Import] Stack:', error.stack);
      }
      return false;
    }
  };

  return {
    reports,
    reportCategories,
    reportFilters,
    phrases,
    phraseCategories,
    phraseFilters,
    settings,
    stats,
    savedTranscriptions,
    isLoading,
    addReport,
    updateReport,
    deleteReport,
    toggleFavorite,
    addPhrase,
    updatePhrase,
    deletePhrase,
    togglePhraseFavorite,
    saveReports,
    saveReportCategories,
    saveReportFilters,
    savePhraseCategories,
    savePhraseFilters,
    savePhrases,
    saveSettings,
    saveStats,
    trackCopy,
    trackRecording,
    trackAIReportGeneration,
    trackAIChatQuery,
    trackInteractionTime,
    setSatisfactionRating,
    calculateProductivity,
    saveEconomicProfitability,
    exportData,
    importData,
    clearNewlyCreatedFlag,
    trackReportShare,
    trackPhraseShare,
    getLatestAutoBackup,
    addSavedTranscription,
    deleteSavedTranscription,
    clearAllSavedTranscriptions,
    // Legacy compatibility
    categories,
    filters,
    saveCategories,
    saveFilters,
  };
}