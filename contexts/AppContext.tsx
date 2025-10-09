import { useMemo } from 'react';
import createContextHook from '@nkzw/create-context-hook';
import { useDataManager } from '@/hooks/useDataManager';

export const [AppProvider, useApp] = createContextHook(() => {
  const dataManager = useDataManager();
  
  return useMemo(() => ({
    ...dataManager,
  }), [dataManager]);
});