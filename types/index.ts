export interface Report {
  id: string;
  title: string;
  content: string;
  categoryId?: string;
  filters: string[];
  isFavorite: boolean;
  createdAt: string;
  updatedAt: string;
}

// Categorías y filtros para INFORMES
export interface ReportCategory {
  id: string;
  name: string;
  isVisible: boolean;
  color: string;
  icon: string;
  createdAt: string;
}

export interface ReportFilter {
  id: string;
  name: string;
  categoryId: string;
  isActive: boolean;
  createdAt: string;
}

// Categorías y filtros para FRASES
export interface PhraseCategory {
  id: string;
  name: string;
  isVisible: boolean;
  color: string;
  icon: string;
  createdAt: string;
}

export interface PhraseFilter {
  id: string;
  name: string;
  categoryId: string;
  isActive: boolean;
  createdAt: string;
}

export interface CommonPhrase {
  id: string;
  text: string;
  categoryId?: string;
  filters: string[];
  isFrequent: boolean;
  isFavorite: boolean;
  usageCount: number;
  createdAt: string;
}

// Tipos legacy para compatibilidad
export interface Category extends ReportCategory {}
export interface Filter extends ReportFilter {}

export interface AppSettings {
  theme: 'light' | 'dark';
  defaultCategory?: string;
  autoBackup: boolean;
  showFavoritesFirst: boolean;
}

export interface ProductivityStats {
  reportsCopied: number;
  phrasesCopied: number;
  todaysCopies: number;
  weekCopies: number;
  monthCopies: number;
  lastCopyDate?: string;
  dailyStats: { [date: string]: number };
  // New metrics
  recordingsCount: number;
  aiReportsGenerated: number;
  aiChatQueries: number;
  totalInteractionTime: number; // in minutes
  dailyInteractionTime: { [date: string]: number }; // in minutes
  appSatisfactionRating?: number; // 1-5 stars
  satisfactionDate?: string;
  firstUseDate?: string;
  totalDaysUsed: number;
  // AI-specific copy tracking
  aiHallazgosCopied: number;
  aiConclusionsCopied: number;
  aiDiferencialesCopied: number;
  // Economic profitability data
  economicProfitability?: EconomicProfitabilityData;
}

export interface EconomicProfitabilityData {
  monthlyIncome: number;
  productivityIncrease: number;
  monthlyBenefit: number;
  yearlyBenefit: number;
  dailyBenefit: number;
  hourlyBenefit: number;
  calculatedAt: string;
}

export interface User {
  id: string;
  email: string;
  name: string;
  dni: string;
  country: string;
  city: string;
  medicalLicense: string;
  medicalSpecialty: string;
  pin: string;
  avatar?: string;
  createdAt: string;
  isRegistered: boolean;
}

export interface RegistrationData {
  email: string;
  password: string;
  name: string;
  dni: string;
  country: string;
  city: string;
  medicalLicense: string;
  medicalSpecialty: string;
  pin: string;
  confirmPin: string;
}

export interface SharedItem {
  id: string;
  type: 'report' | 'phrase';
  itemId: string;
  sharedBy: string;
  sharedWith: string;
  sharedAt: string;
  message?: string;
}

export interface ShareRequest {
  itemId: string;
  itemType: 'report' | 'phrase';
  recipientEmail: string;
  message?: string;
}