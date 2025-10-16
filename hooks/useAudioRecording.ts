import { useState, useEffect, useRef } from 'react';
import { Platform, Alert } from 'react-native';
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
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        stream.getTracks().forEach(track => track.stop());
        console.log('✅ Permisos web concedidos');
        return true;
      } else {
        console.log('📱 Solicitando permisos de micrófono móvil...');
        const { status, granted } = await Audio.requestPermissionsAsync();
        console.log('📱 Estado de permisos:', status, 'granted:', granted);
        if (granted) {
          console.log('✅ Permisos móvil concedidos');
        } else {
          console.log('❌ Permisos móvil denegados');
        }
        return granted;
      }
    } catch (error) {
      console.error('❌ Error solicitando permisos:', error);
      return false;
    }
  };

  const transcribeAudioFromBlob = async (audioBlob: Blob): Promise<void> => {
    setIsTranscribing(true);
    
    try {
      console.log('🎤 Transcribiendo audio web:', {
        size: audioBlob.size,
        type: audioBlob.type
      });
      
      if (audioBlob.size === 0) {
        throw new Error('Audio vacío - no se grabó contenido');
      }
      
      if (audioBlob.size < 1000) {
        console.warn('Audio muy pequeño:', audioBlob.size, 'bytes');
        if (Platform.OS === 'web') {
          alert('El audio es muy corto. Intenta grabar por más tiempo.');
        } else {
          Alert.alert('Aviso', 'El audio es muy corto. Intenta grabar por más tiempo.');
        }
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
        console.log('⏰ Timeout de transcripción');
      }, 30000);
      
      const response = await fetch('https://toolkit.rork.com/stt/transcribe/', {
        method: 'POST',
        body: formData,
        signal: controller.signal,
      });
      
      clearTimeout(timeoutId);
      
      console.log('📥 Respuesta transcripción:', response.status, response.statusText);
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('❌ Error respuesta:', response.status, errorText);
        
        if (response.status === 413) {
          throw new Error('El archivo de audio es demasiado grande');
        } else if (response.status === 415) {
          throw new Error('Formato de audio no soportado');
        } else if (response.status >= 500) {
          throw new Error('Error del servidor. Intenta de nuevo en unos momentos');
        } else {
          throw new Error(`Error ${response.status}: ${errorText || 'Error desconocido'}`);
        }
      }
      
      const result: TranscriptionResult = await response.json();
      console.log('✅ Transcripción completada:', {
        text: result.text?.substring(0, 100) + '...',
        language: result.language,
        length: result.text?.length
      });
      
      if (!result.text || result.text.trim() === '') {
        console.warn('⚠️ Transcripción vacía');
        if (Platform.OS === 'web') {
          alert('No se detectó texto claro en el audio. Intenta hablar más cerca del micrófono.');
        } else {
          Alert.alert('Aviso', 'No se detectó texto claro en el audio. Intenta hablar más cerca del micrófono.');
        }
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
      
      const errorMessage = error instanceof Error && error.name === 'AbortError'
        ? 'La transcripción está tomando demasiado tiempo. Verifica tu conexión e intenta de nuevo.'
        : error instanceof Error ? error.message : 'Error desconocido al transcribir el audio';
      
      if (onError) {
        onError(errorMessage);
      }
      
      if (Platform.OS === 'web') {
        alert(errorMessage);
      } else {
        Alert.alert('Error de Transcripción', errorMessage);
      }
    } finally {
      setIsTranscribing(false);
    }
  };

  const transcribeAudioFromUri = async (uri: string): Promise<void> => {
    setIsTranscribing(true);
    
    try {
      console.log('📱 Transcribiendo desde móvil:', uri);
      
      if (!uri) {
        throw new Error('URI de audio no válida');
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
        console.log('⏰ Timeout de transcripción móvil');
      }, 30000);
      
      const response = await fetch('https://toolkit.rork.com/stt/transcribe/', {
        method: 'POST',
        body: formData,
        signal: controller.signal,
      });
      
      clearTimeout(timeoutId);
      
      console.log('📥 Respuesta móvil:', response.status, response.statusText);
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('❌ Error respuesta móvil:', response.status, errorText);
        
        if (response.status === 413) {
          throw new Error('El archivo de audio es demasiado grande');
        } else if (response.status === 415) {
          throw new Error('Formato de audio no soportado');
        } else if (response.status >= 500) {
          throw new Error('Error del servidor. Intenta de nuevo en unos momentos');
        } else {
          throw new Error(`Error ${response.status}: ${errorText || 'Error desconocido'}`);
        }
      }
      
      const result: TranscriptionResult = await response.json();
      console.log('✅ Transcripción móvil completada:', {
        text: result.text?.substring(0, 100) + '...',
        language: result.language,
        length: result.text?.length
      });
      
      if (!result.text || result.text.trim() === '') {
        console.warn('⚠️ Transcripción móvil vacía');
        if (Platform.OS === 'web') {
          alert('No se detectó texto claro en el audio. Intenta hablar más cerca del micrófono.');
        } else {
          Alert.alert('Aviso', 'No se detectó texto claro en el audio. Intenta hablar más cerca del micrófono.');
        }
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
      
      const errorMessage = error instanceof Error && error.name === 'AbortError'
        ? 'La transcripción está tomando demasiado tiempo. Verifica tu conexión e intenta de nuevo.'
        : error instanceof Error ? error.message : 'Error desconocido al transcribir el audio';
      
      if (onError) {
        onError(errorMessage);
      }
      
      if (Platform.OS === 'web') {
        alert(errorMessage);
      } else {
        Alert.alert('Error de Transcripción', errorMessage);
      }
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
        if (onError) onError(errorMsg);
        if (Platform.OS === 'web') {
          alert(errorMsg);
        } else {
          Alert.alert('Error', errorMsg);
        }
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
            if (Platform.OS === 'web') {
              alert('No se grabó ningún audio. Verifica que el micrófono esté funcionando.');
            } else {
              Alert.alert('Error', 'No se grabó ningún audio. Verifica que el micrófono esté funcionando.');
            }
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
            if (Platform.OS === 'web') {
              alert('No se detectó audio para transcribir.');
            } else {
              Alert.alert('Aviso', 'No se detectó audio para transcribir.');
            }
          }
          
          console.log('🔇 Deteniendo pistas de audio...');
          stream.getTracks().forEach(track => {
            console.log('Deteniendo pista:', track.kind, track.label);
            track.stop();
          });
        };
        
        mediaRecorder.onerror = (event) => {
          console.error('Error en MediaRecorder:', event);
          if (Platform.OS === 'web') {
            alert('Error durante la grabación.');
          } else {
            Alert.alert('Error', 'Error durante la grabación.');
          }
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
      const errorMsg = `No se pudo iniciar la grabación: ${error instanceof Error ? error.message : 'Error desconocido'}`;
      if (onError) onError(errorMsg);
      if (Platform.OS === 'web') {
        alert(errorMsg);
      } else {
        Alert.alert('Error', errorMsg);
      }
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
      const errorMsg = 'Error al detener la grabación.';
      if (onError) onError(errorMsg);
      if (Platform.OS === 'web') {
        alert(errorMsg);
      } else {
        Alert.alert('Error', errorMsg);
      }
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
