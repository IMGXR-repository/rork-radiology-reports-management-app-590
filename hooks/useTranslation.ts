import { useApp } from '@/contexts/AppContext';
import { translations, Language } from '@/constants/translations';

export function useTranslation() {
  const { settings } = useApp();
  const language: Language = settings?.language || 'es';
  
  return {
    t: translations[language],
    language,
  };
}
