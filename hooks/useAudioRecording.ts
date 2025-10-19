import { useState, useEffect, useRef } from 'react';
import { Platform } from 'react-native';
import { Audio } from 'expo-av';

interface RecordingState {
  isRecording: boolean;
  isPaused: boolean;
  duration: number;
  uri: string | null;
}

interface WebRecordingState {
  mediaRecorder: MediaRecorder | null;
  audioChunks: Blob[];
  stream: MediaStream | null;
}

interface TranscriptionResult {
  text: string;
  language: string;
}

interface UseAudioRecordingProps {
  onTranscriptionComplete?: (text: string) => void;
  onError?: (error: string) => void;
  processVoiceCommands?: (text: string) => string;
}

export const useAudioRecording = ({
  onTranscriptionComplete,
  onError,
  processVoiceCommands,
}: UseAudioRecordingProps = {}) => {
  const [recording, setRecording] = useState<Audio.Recording | null>(null);
  const [webRecording, setWebRecording] = useState<WebRecordingState>({
    mediaRecorder: null,
    audioChunks: [],
    stream: null,
  });
  const [recordingState, setRecordingState] = useState<RecordingState>({
    isRecording: false,
    isPaused: false,
    duration: 0,
    uri: null,
  });
  const [isTranscribing, setIsTranscribing] = useState<boolean>(false);
  const [isRecordingUnloaded, setIsRecordingUnloaded] = useState<boolean>(false);
  
  const durationIntervalRef = useRef<ReturnType<typeof setInterval> | undefined>(undefined);

  useEffect(() => {
    if (recordingState.isRecording && !recordingState.isPaused) {
      durationIntervalRef.current = setInterval(() => {
        setRecordingState(prev => ({ ...prev, duration: prev.duration + 1 }));
      }, 1000);
    } else {
      if (durationIntervalRef.current) {
        clearInterval(durationIntervalRef.current);
      }
    }

    return () => {
      if (durationIntervalRef.current) {
        clearInterval(durationIntervalRef.current);
      }
    };
  }, [recordingState.isRecording, recordingState.isPaused]);

  useEffect(() => {
    const cleanupOnUnmount = async () => {
      if (Platform.OS === 'web') {
        if (webRecording.mediaRecorder && webRecording.mediaRecorder.state === 'recording') {
          webRecording.mediaRecorder.stop();
        }
        if (webRecording.stream) {
          webRecording.stream.getTracks().forEach(track => track.stop());
        }
      } else {
        if (recording && !isRecordingUnloaded) {
          try {
            await recording.stopAndUnloadAsync();
          } catch (error) {
            console.error('Error during cleanup:', error);
          }
        }
      }
    };

    return () => {
      cleanupOnUnmount();
    };
  }, [recording, isRecordingUnloaded, webRecording]);

  const cleanup = async () => {
    if (Platform.OS === 'web') {
      if (webRecording.mediaRecorder && webRecording.mediaRecorder.state === 'recording') {
        webRecording.mediaRecorder.stop();
      }
      if (webRecording.stream) {
        webRecording.stream.getTracks().forEach(track => track.stop());
      }
    } else {
      if (recording && !isRecordingUnloaded) {
        try {
          await recording.stopAndUnloadAsync();
        } catch (error) {
          console.error('Error during cleanup:', error);
        }
      }
    }
  };

  const requestPermissions = async (): Promise<boolean> => {
    try {
      if (Platform.OS === 'web') {
        console.log('🌐 Solicitando permisos de micrófono web...');
        
        if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
          console.error('❌ API de MediaDevices no disponible');
          if (onError) onError('Tu navegador no soporta grabación de audio. Por favor, usa un navegador moderno (Chrome, Firefox, Safari).');
          return false;
        }
        
        try {
          const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
          stream.getTracks().forEach(track => track.stop());
          console.log('✅ Permisos de micrófono web concedidos');
          return true;
        } catch (mediaError: any) {
          console.error('❌ Error de permisos web:', mediaError);
          
          if (mediaError.name === 'NotAllowedError' || mediaError.name === 'PermissionDeniedError') {
            if (onError) onError('Permiso de micrófono denegado. Por favor, permite el acceso al micrófono en la configuración del navegador y recarga la página.');
          } else if (mediaError.name === 'NotFoundError') {
            if (onError) onError('No se detectó ningún micrófono. Por favor, conecta un micrófono y recarga la página.');
          } else if (mediaError.name === 'NotReadableError') {
            if (onError) onError('El micrófono está siendo usado por otra aplicación. Por favor, cierra otras aplicaciones que usen el micrófono.');
          } else {
            if (onError) onError(`Error al acceder al micrófono: ${mediaError.message || 'Error desconocido'}`);
          }
          return false;
        }
      } else {
        console.log('📱 Solicitando permisos de micrófono móvil...');
        
        try {
          const { status } = await Audio.requestPermissionsAsync();
          console.log('📱 Estado de permisos:', status);
          
          if (status !== 'granted') {
            console.log('❌ Permisos de micrófono denegados');
            if (onError) onError('Permiso de micrófono denegado. Por favor, ve a Configuración > Permisos > Micrófono y permite el acceso a esta aplicación.');
            return false;
          }
          
          console.log('✅ Permisos de micrófono móvil concedidos');
          return true;
        } catch (audioError) {
          console.error('❌ Error al solicitar permisos móvil:', audioError);
          if (onError) onError('Error al solicitar permisos de micrófono. Por favor, reinicia la aplicación e intenta de nuevo.');
          return false;
        }
      }
    } catch (error) {
      console.error('❌ Error inesperado solicitando permisos:', error);
      if (onError) onError('Error inesperado al solicitar permisos de micrófono. Por favor, reinicia la aplicación.');
      return false;
    }
  };

  const transcribeAudioFromBlob = async (audioBlob: Blob, retryCount = 0): Promise<void> => {
    const MAX_RETRIES = 3;
    const RETRY_DELAY = 2000;
    
    setIsTranscribing(true);
    
    try {
      console.log(`🎤 Transcribiendo audio web (intento ${retryCount + 1}/${MAX_RETRIES + 1}):`, {
        size: audioBlob.size,
        type: audioBlob.type
      });
      
      if (audioBlob.size === 0) {
        throw new Error('El audio está vacío. No se grabó ningún contenido. Intenta grabar de nuevo.');
      }
      
      if (audioBlob.size < 1000) {
        console.warn('Audio muy pequeño:', audioBlob.size, 'bytes');
        if (onError) onError('El audio grabado es muy corto (menos de 1 segundo). Por favor, graba un audio más largo.');
        return;
      }
      
      const formData = new FormData();
      
      let fileName = 'recording.webm';
      if (audioBlob.type.includes('mp4')) {
        fileName = 'recording.mp4';
      } else if (audioBlob.type.includes('wav')) {
        fileName = 'recording.wav';
      }
      
      formData.append('audio', audioBlob, fileName);
      
      console.log('📤 Enviando a transcripción:', fileName, audioBlob.size, 'bytes');
      
      const controller = new AbortController();
      const timeoutId = setTimeout(() => {
        controller.abort();
        console.log('⏰ Timeout de transcripción (60 segundos)');
      }, 60000);
      
      let response;
      try {
        response = await fetch('https://toolkit.rork.com/stt/transcribe/', {
          method: 'POST',
          body: formData,
          signal: controller.signal,
        });
      } catch (fetchError: any) {
        clearTimeout(timeoutId);
        
        if (fetchError.name === 'AbortError') {
          throw new Error('La transcripción está tomando demasiado tiempo (más de 60 segundos). Tu audio puede ser muy largo o hay problemas de conexión.');
        }
        
        if (!navigator.onLine) {
          throw new Error('Sin conexión a internet. Por favor, verifica tu conexión e intenta de nuevo.');
        }
        
        throw new Error('Error de red al conectar con el servidor. Verifica tu conexión a internet.');
      }
      
      clearTimeout(timeoutId);
      
      console.log('📥 Respuesta transcripción:', response.status, response.statusText);
      
      if (!response.ok) {
        let errorText = '';
        try {
          errorText = await response.text();
        } catch (e) {
          errorText = 'No se pudo leer el error del servidor';
        }
        
        console.error('❌ Error respuesta:', response.status, errorText);
        
        if (response.status === 413) {
          throw new Error('El archivo de audio es demasiado grande. La grabación no debe superar los 10 MB.');
        } else if (response.status === 415) {
          throw new Error('Formato de audio no soportado por el servidor. Por favor, intenta de nuevo.');
        } else if (response.status === 429) {
          throw new Error('Demasiadas solicitudes. Por favor, espera unos segundos e intenta de nuevo.');
        } else if (response.status >= 500 && response.status < 600) {
          if (retryCount < MAX_RETRIES) {
            console.log(`🔄 Reintentando después de error ${response.status}... (${retryCount + 1}/${MAX_RETRIES})`);
            await new Promise(resolve => setTimeout(resolve, RETRY_DELAY * (retryCount + 1)));
            return await transcribeAudioFromBlob(audioBlob, retryCount + 1);
          }
          throw new Error('El servidor de transcripción está experimentando problemas. Por favor, intenta de nuevo en unos minutos.');
        } else if (response.status === 400) {
          throw new Error('Audio inválido. El servidor no pudo procesar tu grabación. Intenta grabar de nuevo.');
        } else {
          throw new Error(`Error del servidor (${response.status}): ${errorText || 'Error desconocido'}. Por favor, intenta de nuevo.`);
        }
      }
      
      let result: TranscriptionResult;
      try {
        result = await response.json();
      } catch (jsonError) {
        console.error('❌ Error al parsear respuesta JSON:', jsonError);
        throw new Error('Error al procesar la respuesta del servidor. El formato de respuesta es inválido.');
      }
      
      console.log('✅ Transcripción completada:', {
        text: result.text?.substring(0, 100) + '...',
        language: result.language,
        length: result.text?.length
      });
      
      if (!result.text || result.text.trim() === '') {
        console.warn('⚠️ Transcripción vacía');
        if (onError) onError('No se detectó voz clara en el audio. Habla más cerca del micrófono o en un ambiente más silencioso.');
        return;
      }
      
      const rawText = result.text.trim();
      const processedText = processVoiceCommands ? processVoiceCommands(rawText) : rawText;
      
      console.log('Raw text:', rawText);
      console.log('Processed text:', processedText);
      
      if (onTranscriptionComplete) {
        onTranscriptionComplete(processedText);
      }
      
      console.log('✨ Texto agregado exitosamente');
    } catch (error) {
      console.error('❌ Error transcripción:', error);
      
      let errorMessage = 'Error desconocido al transcribir el audio';
      
      if (error instanceof Error) {
        errorMessage = error.message;
      }
      
      if (onError) {
        onError(errorMessage);
      }
      
      console.error('Error de transcripción:', errorMessage);
    } finally {
      setIsTranscribing(false);
    }
  };

  const transcribeAudioFromUri = async (uri: string, retryCount = 0): Promise<void> => {
    const MAX_RETRIES = 3;
    const RETRY_DELAY = 2000;
    
    setIsTranscribing(true);
    
    try {
      console.log(`📱 Transcribiendo desde móvil (intento ${retryCount + 1}/${MAX_RETRIES + 1}):`, uri);
      
      if (!uri) {
        throw new Error('URI de audio no válida. No se pudo acceder al archivo de grabación.');
      }
      
      const formData = new FormData();
      const uriParts = uri.split('.');
      const fileType = uriParts[uriParts.length - 1];
      
      const audioFile = {
        uri,
        name: `recording.${fileType}`,
        type: `audio/${fileType}`,
      } as any;
      
      formData.append('audio', audioFile);
      
      console.log('📤 Enviando archivo móvil:', audioFile.name, 'tipo:', audioFile.type);
      
      const controller = new AbortController();
      const timeoutId = setTimeout(() => {
        controller.abort();
        console.log('⏰ Timeout de transcripción móvil (60 segundos)');
      }, 60000);
      
      let response;
      try {
        response = await fetch('https://toolkit.rork.com/stt/transcribe/', {
          method: 'POST',
          body: formData,
          signal: controller.signal,
        });
      } catch (fetchError: any) {
        clearTimeout(timeoutId);
        
        if (fetchError.name === 'AbortError') {
          throw new Error('La transcripción está tomando demasiado tiempo (más de 60 segundos). Tu audio puede ser muy largo o hay problemas de conexión.');
        }
        
        throw new Error('Error de red al conectar con el servidor. Verifica tu conexión a internet.');
      }
      
      clearTimeout(timeoutId);
      
      console.log('📥 Respuesta móvil:', response.status, response.statusText);
      
      if (!response.ok) {
        let errorText = '';
        try {
          errorText = await response.text();
        } catch (e) {
          errorText = 'No se pudo leer el error del servidor';
        }
        
        console.error('❌ Error respuesta móvil:', response.status, errorText);
        
        if (response.status === 413) {
          throw new Error('El archivo de audio es demasiado grande. La grabación no debe superar los 10 MB.');
        } else if (response.status === 415) {
          throw new Error('Formato de audio no soportado por el servidor. Por favor, intenta de nuevo.');
        } else if (response.status === 429) {
          throw new Error('Demasiadas solicitudes. Por favor, espera unos segundos e intenta de nuevo.');
        } else if (response.status >= 500 && response.status < 600) {
          if (retryCount < MAX_RETRIES) {
            console.log(`🔄 Reintentando después de error ${response.status}... (${retryCount + 1}/${MAX_RETRIES})`);
            await new Promise(resolve => setTimeout(resolve, RETRY_DELAY * (retryCount + 1)));
            return await transcribeAudioFromUri(uri, retryCount + 1);
          }
          throw new Error('El servidor de transcripción está experimentando problemas. Por favor, intenta de nuevo en unos minutos.');
        } else if (response.status === 400) {
          throw new Error('Audio inválido. El servidor no pudo procesar tu grabación. Intenta grabar de nuevo.');
        } else {
          throw new Error(`Error del servidor (${response.status}): ${errorText || 'Error desconocido'}. Por favor, intenta de nuevo.`);
        }
      }
      
      let result: TranscriptionResult;
      try {
        result = await response.json();
      } catch (jsonError) {
        console.error('❌ Error al parsear respuesta JSON:', jsonError);
        throw new Error('Error al procesar la respuesta del servidor. El formato de respuesta es inválido.');
      }
      
      console.log('✅ Transcripción móvil completada:', {
        text: result.text?.substring(0, 100) + '...',
        language: result.language,
        length: result.text?.length
      });
      
      if (!result.text || result.text.trim() === '') {
        console.warn('⚠️ Transcripción móvil vacía');
        if (onError) onError('No se detectó voz clara en el audio. Habla más cerca del micrófono o en un ambiente más silencioso.');
        return;
      }
      
      const rawText = result.text.trim();
      const processedText = processVoiceCommands ? processVoiceCommands(rawText) : rawText;
      
      console.log('Raw text:', rawText);
      console.log('Processed text:', processedText);
      
      if (onTranscriptionComplete) {
        onTranscriptionComplete(processedText);
      }
      
      console.log('✨ Transcripción móvil agregada exitosamente');
    } catch (error) {
      console.error('❌ Error transcripción móvil:', error);
      
      let errorMessage = 'Error desconocido al transcribir el audio';
      
      if (error instanceof Error) {
        errorMessage = error.message;
      }
      
      if (onError) {
        onError(errorMessage);
      }
      
      console.error('Error de transcripción:', errorMessage);
    } finally {
      setIsTranscribing(false);
    }
  };

  const startRecording = async (): Promise<boolean> => {
    try {
      console.log('Iniciando grabación...');
      
      const hasPermission = await requestPermissions();
      if (!hasPermission) {
        const errorMsg = 'Se requieren permisos de micrófono.';
        console.warn(errorMsg);
        if (onError) onError(errorMsg);
        return false;
      }

      if (Platform.OS === 'web') {
        console.log('🌐 Iniciando grabación web...');
        const stream = await navigator.mediaDevices.getUserMedia({ 
          audio: {
            echoCancellation: true,
            noiseSuppression: true,
            autoGainControl: true,
            sampleRate: 48000,
          } 
        });
        
        console.log('📡 Stream obtenido:', stream.getTracks().length, 'pistas');
        
        let mimeType = 'audio/webm;codecs=opus';
        if (!MediaRecorder.isTypeSupported(mimeType)) {
          mimeType = 'audio/webm';
          if (!MediaRecorder.isTypeSupported(mimeType)) {
            mimeType = 'audio/mp4';
            if (!MediaRecorder.isTypeSupported(mimeType)) {
              mimeType = 'audio/ogg;codecs=opus';
            }
          }
        }
        
        console.log('🎵 Usando formato:', mimeType, 'soportado:', MediaRecorder.isTypeSupported(mimeType));
        
        const options: MediaRecorderOptions = { 
          mimeType,
          audioBitsPerSecond: 128000,
        };
        
        const mediaRecorder = new MediaRecorder(stream, options);
        const localAudioChunks: Blob[] = [];
        
        mediaRecorder.ondataavailable = (event) => {
          if (event.data && event.data.size > 0) {
            console.log('📦 Chunk recibido:', event.data.size, 'bytes, tipo:', event.data.type);
            localAudioChunks.push(event.data);
          } else {
            console.warn('⚠️ Chunk vacío recibido');
          }
        };
        
        mediaRecorder.onstop = async () => {
          console.log('🛑 Grabación web detenida, procesando...');
          console.log('📦 Chunks totales:', localAudioChunks.length);
          
          if (localAudioChunks.length === 0) {
            console.error('❌ No se recibieron chunks de audio');
            console.error('No se grabó ningún audio');
            stream.getTracks().forEach(track => track.stop());
            return;
          }
          
          const audioBlob = new Blob(localAudioChunks, { type: mimeType });
          
          console.log('🎵 Audio blob creado:', {
            size: audioBlob.size,
            type: audioBlob.type,
            chunks: localAudioChunks.length
          });
          
          if (audioBlob.size > 0) {
            await transcribeAudioFromBlob(audioBlob);
          } else {
            console.warn('⚠️ Audio vacío, no se puede transcribir');
            console.warn('No se detectó audio para transcribir');
          }
          
          console.log('🔇 Deteniendo pistas de audio...');
          stream.getTracks().forEach(track => {
            console.log('Deteniendo pista:', track.kind, track.label);
            track.stop();
          });
        };
        
        mediaRecorder.onerror = (event) => {
          console.error('Error en MediaRecorder:', event);
          console.error('Error durante la grabación');
        };
        
        setWebRecording({
          mediaRecorder,
          audioChunks: localAudioChunks,
          stream,
        });
        
        mediaRecorder.start(100);
        
        console.log('▶️ MediaRecorder iniciado, estado:', mediaRecorder.state);
        
        setRecordingState({
          isRecording: true,
          isPaused: false,
          duration: 0,
          uri: null,
        });
        
        console.log('✅ Grabación web iniciada correctamente');
        return true;
      } else {
        console.log('📱 Configurando modo de audio móvil...');
        await Audio.setAudioModeAsync({
          allowsRecordingIOS: true,
          playsInSilentModeIOS: true,
          staysActiveInBackground: false,
        });

        console.log('🎙️ Creando grabación móvil...');
        const recordingOptions: Audio.RecordingOptions = {
          android: {
            extension: '.m4a',
            outputFormat: Audio.AndroidOutputFormat.MPEG_4,
            audioEncoder: Audio.AndroidAudioEncoder.AAC,
            sampleRate: 44100,
            numberOfChannels: 2,
            bitRate: 128000,
          },
          ios: {
            extension: '.m4a',
            outputFormat: Audio.IOSOutputFormat.MPEG4AAC,
            audioQuality: Audio.IOSAudioQuality.HIGH,
            sampleRate: 44100,
            numberOfChannels: 2,
            bitRate: 128000,
          },
          web: {
            mimeType: 'audio/webm',
            bitsPerSecond: 128000,
          },
        };
        
        console.log('🎙️ Opciones de grabación:', JSON.stringify(recordingOptions, null, 2));
        
        const { recording: newRecording, status } = await Audio.Recording.createAsync(
          recordingOptions
        );
        
        console.log('📱 Estado de grabación:', status);
        console.log('✅ Grabación móvil creada');
        
        setRecording(newRecording);
        setIsRecordingUnloaded(false);
        setRecordingState({
          isRecording: true,
          isPaused: false,
          duration: 0,
          uri: null,
        });
        
        console.log('✅ Grabación móvil iniciada correctamente');
        return true;
      }
    } catch (error) {
      console.error('Error al iniciar grabación:', error);
      
      let errorMsg = 'No se pudo iniciar la grabación: ';
      
      if (error instanceof Error) {
        if (error.message.includes('NotAllowedError') || error.message.includes('Permission')) {
          errorMsg += 'Permisos de micrófono denegados. Por favor, permite el acceso al micrófono.';
        } else if (error.message.includes('NotFoundError')) {
          errorMsg += 'No se encontró ningún micrófono disponible.';
        } else if (error.message.includes('NotReadableError')) {
          errorMsg += 'El micrófono está siendo usado por otra aplicación.';
        } else {
          errorMsg += error.message;
        }
      } else {
        errorMsg += 'Error desconocido. Por favor, reinicia la aplicación e intenta de nuevo.';
      }
      
      console.error(errorMsg);
      if (onError) onError(errorMsg);
      return false;
    }
  };

  const stopRecording = async (): Promise<void> => {
    try {
      console.log('Deteniendo grabación...');
      
      setRecordingState(prev => ({
        ...prev,
        isRecording: false,
        isPaused: false,
      }));
      
      if (Platform.OS === 'web') {
        console.log('🛑 Deteniendo grabación web, estado:', webRecording.mediaRecorder?.state);
        if (webRecording.mediaRecorder && webRecording.mediaRecorder.state !== 'inactive') {
          webRecording.mediaRecorder.stop();
          console.log('✅ MediaRecorder detenido');
        } else {
          console.warn('⚠️ MediaRecorder no está activo o no existe');
        }
      } else {
        console.log('🛑 Deteniendo grabación móvil...');
        if (!recording || isRecordingUnloaded) {
          console.log('⚠️ No hay grabación activa');
          return;
        }
        
        console.log('📱 Obteniendo URI y deteniendo...');
        const uri = recording.getURI();
        console.log('📍 URI:', uri);
        
        await recording.stopAndUnloadAsync();
        setIsRecordingUnloaded(true);
        
        console.log('🔇 Desactivando modo de grabación...');
        await Audio.setAudioModeAsync({
          allowsRecordingIOS: false,
        });
        
        console.log('✅ Grabación móvil guardada:', uri);
        setRecording(null);
        
        if (uri) {
          await transcribeAudioFromUri(uri);
        } else {
          console.error('❌ URI de grabación es nulo');
        }
      }
    } catch (error) {
      console.error('Error al detener grabación:', error);
      setRecording(null);
      setIsRecordingUnloaded(true);
      
      let errorMsg = 'Error al detener la grabación: ';
      if (error instanceof Error) {
        errorMsg += error.message;
      } else {
        errorMsg += 'Error desconocido. El audio puede no haberse guardado correctamente.';
      }
      
      console.error(errorMsg);
      if (onError) onError(errorMsg);
    }
  };

  const pauseRecording = async (): Promise<void> => {
    try {
      if (Platform.OS === 'web') {
        if (webRecording.mediaRecorder && webRecording.mediaRecorder.state === 'recording') {
          webRecording.mediaRecorder.pause();
          setRecordingState(prev => ({ ...prev, isPaused: true }));
        }
      } else {
        if (recording) {
          await recording.pauseAsync();
          setRecordingState(prev => ({ ...prev, isPaused: true }));
        }
      }
    } catch (error) {
      console.error('Error pausing recording:', error);
    }
  };

  const resumeRecording = async (): Promise<void> => {
    try {
      if (Platform.OS === 'web') {
        if (webRecording.mediaRecorder && webRecording.mediaRecorder.state === 'paused') {
          webRecording.mediaRecorder.resume();
          setRecordingState(prev => ({ ...prev, isPaused: false }));
        }
      } else {
        if (recording) {
          await recording.startAsync();
          setRecordingState(prev => ({ ...prev, isPaused: false }));
        }
      }
    } catch (error) {
      console.error('Error resuming recording:', error);
    }
  };

  const resetRecording = async (): Promise<void> => {
    await cleanup();
    setRecordingState({
      isRecording: false,
      isPaused: false,
      duration: 0,
      uri: null,
    });
    setWebRecording({
      mediaRecorder: null,
      audioChunks: [],
      stream: null,
    });
    setRecording(null);
    setIsRecordingUnloaded(false);
    setIsTranscribing(false);
  };

  return {
    recordingState,
    isTranscribing,
    startRecording,
    stopRecording,
    pauseRecording,
    resumeRecording,
    resetRecording,
  };
};
