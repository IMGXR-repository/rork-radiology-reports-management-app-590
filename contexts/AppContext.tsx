import { useMemo, useEffect } from 'react';
import { Platform } from 'react-native';
import createContextHook from '@nkzw/create-context-hook';
import { useDataManager } from '@/hooks/useDataManager';

const BROADCAST_CHANNEL_NAME = 'radia-app-sync';

export const [AppProvider, useApp] = createContextHook(() => {
  const dataManager = useDataManager();
  
  useEffect(() => {
    if (Platform.OS === 'web' && typeof BroadcastChannel !== 'undefined') {
      const channel = new BroadcastChannel(BROADCAST_CHANNEL_NAME);
      
      channel.onmessage = async (event) => {
        console.log('📡 [BroadcastChannel] Mensaje recibido:', event.data);
        
        if (event.data.type === 'transcription-added') {
          console.log('🔄 [BroadcastChannel] Recargando transcripciones...');
          await dataManager.reloadTranscriptions();
        }
      };
      
      return () => {
        channel.close();
      };
    }
  }, [dataManager]);
  
  return useMemo(() => ({
    ...dataManager,
  }), [dataManager]);
});