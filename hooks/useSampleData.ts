import { useEffect } from 'react';
import { useApp } from '@/contexts/AppContext';
import { sampleReports, samplePhrases } from '@/mocks/sampleData';

export function useSampleData() {
  const { reports, phrases, saveReports, savePhrases, isLoading } = useApp();

  useEffect(() => {
    if (isLoading) return;
    
    const loadSampleData = async () => {
      try {
        // Only load sample data if no data exists
        if (reports.length === 0) {
          console.log('Loading sample reports...');
          await saveReports(sampleReports);
        }
        
        if (phrases.length === 0) {
          console.log('Loading sample phrases...');
          await savePhrases(samplePhrases);
        }
      } catch (error) {
        console.error('Error loading sample data:', error);
      }
    };

    // Small delay to ensure data manager is ready
    const timer = setTimeout(loadSampleData, 500);
    return () => clearTimeout(timer);
  }, [reports.length, phrases.length, saveReports, savePhrases, isLoading]);
}