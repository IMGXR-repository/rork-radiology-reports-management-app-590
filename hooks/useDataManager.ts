import { useState, useEffect } from 'react';
import { Platform } from 'react-native';
import { Report, ReportCategory, ReportFilter, PhraseCategory, PhraseFilter, CommonPhrase, AppSettings, ProductivityStats, EconomicProfitabilityData } from '@/types';

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
  autoBackup: false,
  showFavoritesFirst: true,
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
  const [isLoading, setIsLoading] = useState(false);
  
  // Legacy compatibility
  const categories = reportCategories;
  const filters = reportFilters;

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      console.log('Starting data load...');
      setIsLoading(true);
      
      const [
        reportsData,
        reportCategoriesData,
        reportFiltersData,
        phrasesData,
        phraseCategoriesData,
        phraseFiltersData,
        settingsData,
        statsData,
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
      setSettings(settingsData ? JSON.parse(settingsData) : defaultSettings);
      
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
    } finally {
      console.log('Setting isLoading to false');
      setIsLoading(false);
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
    };
    const updatedReports = [...reports, newReport];
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
      if (!jsonData || typeof jsonData !== 'string' || jsonData.trim().length === 0) {
        return false;
      }
      const data = JSON.parse(jsonData.trim());
      if (data.reports) await saveReports(data.reports);
      
      // Handle new format
      if (data.reportCategories) await saveReportCategories(data.reportCategories);
      if (data.reportFilters) await saveReportFilters(data.reportFilters);
      if (data.phraseCategories) await savePhraseCategories(data.phraseCategories);
      if (data.phraseFilters) await savePhraseFilters(data.phraseFilters);
      
      // Handle legacy format
      if (data.categories && !data.reportCategories) await saveReportCategories(data.categories);
      if (data.filters && !data.reportFilters) await saveReportFilters(data.filters);
      
      if (data.phrases) await savePhrases(data.phrases);
      if (data.settings) await saveSettings(data.settings);
      if (data.stats) await saveStats(data.stats);
      return true;
    } catch (error) {
      console.error('Error importing data:', error);
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
    // Legacy compatibility
    categories,
    filters,
    saveCategories,
    saveFilters,
  };
}