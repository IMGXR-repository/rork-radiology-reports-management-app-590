import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert,
  Platform,
  ActivityIndicator,
  TextInput,

} from 'react-native';
import * as Clipboard from 'expo-clipboard';
import { Audio } from 'expo-av';
import { Mic, Square, FileText, Send, ChevronDown, ChevronUp, Copy, Trash2, RotateCcw } from 'lucide-react-native';

import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useLocalSearchParams } from 'expo-router';
import { useApp } from '@/contexts/AppContext';
import { useTranslation } from '@/hooks/useTranslation';
import { languageNames, Language } from '@/constants/translations';
import { aiService } from '@/lib/ai-service';

import { lightTheme, darkTheme } from '@/constants/theme';
import { SearchBar } from '@/components/SearchBar';
import { Report } from '@/types';

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

export default function RecordingScreen() {
  const { reportId, initialText } = useLocalSearchParams<{ reportId?: string; initialText?: string }>();
  const { settings, reports } = useApp();
  const { t } = useTranslation();

  const theme = settings && settings.theme === 'dark' ? darkTheme : lightTheme;
  const insets = useSafeAreaInsets();
  
  const [recording, setRecording] = useState<Audio.Recording | null>(null);
  const recordingRef = useRef<Audio.Recording | null>(null);
  const isUnloadedRef = useRef<boolean>(false);
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
  
  const [selectedReport, setSelectedReport] = useState<Report | null>(null);
  const [transcribedText, setTranscribedText] = useState<string>('');
  const [lastTranscription, setLastTranscription] = useState<string>('');
  const [finalReport, setFinalReport] = useState<string>('');
  const [findings, setFindings] = useState<string>('');
  const [conclusions, setConclusions] = useState<string>('');
  const [differentials, setDifferentials] = useState<string>('');
  const [isTranscribing, setIsTranscribing] = useState<boolean>(false);
  const [isGenerating, setIsGenerating] = useState<boolean>(false);
  const [reportSearchQuery, setReportSearchQuery] = useState<string>('');
  const [isRecordingUnloaded, setIsRecordingUnloaded] = useState<boolean>(false);
  const [isReportSelectorExpanded, setIsReportSelectorExpanded] = useState<boolean>(false);
  const [outputLanguage, setOutputLanguage] = useState<Language>('es');
  const [isLanguageSelectorExpanded, setIsLanguageSelectorExpanded] = useState<boolean>(false);
  
  const filteredReports = reports ? reports.filter(report =>
    report && report.title && report.content &&
    (report.title.toLowerCase().includes(reportSearchQuery.toLowerCase()) ||
    report.content.toLowerCase().includes(reportSearchQuery.toLowerCase()))
  ) : [];

  useEffect(() => {
    return () => {
      // Cleanup on unmount
      if (Platform.OS === 'web') {
        if (webRecording.mediaRecorder && webRecording.mediaRecorder.state === 'recording') {
          webRecording.mediaRecorder.stop();
        }
        if (webRecording.stream) {
          webRecording.stream.getTracks().forEach(track => track.stop());
        }
      } else {
        if (recordingRef.current && !isUnloadedRef.current) {
          recordingRef.current.stopAndUnloadAsync().catch((error) => {
            console.error('Error during cleanup:', error);
          });
        }
      }
    };
  }, [webRecording]);

  // Preseleccionar el informe si se pasa reportId
  useEffect(() => {
    console.log('📋 [RECORDING DEBUG] Effect triggered:', { reportId, reportsCount: reports.length });
    
    if (reportId && reports.length > 0) {
      console.log('📋 [RECORDING DEBUG] Buscando informe con ID:', reportId);
      console.log('📋 [RECORDING DEBUG] IDs disponibles:', reports.map(r => r.id));
      
      const preselectedReport = reports.find(report => {
        const match = String(report.id) === String(reportId);
        console.log(`📋 [RECORDING DEBUG] Comparando: ${report.id} === ${reportId} = ${match}`);
        return match;
      });
      
      if (preselectedReport) {
        console.log('✅ [RECORDING DEBUG] Informe encontrado y seleccionado:', preselectedReport.title);
        setSelectedReport(preselectedReport);
        setIsReportSelectorExpanded(false);
      } else {
        console.warn('⚠️ [RECORDING DEBUG] No se encontró el informe con ID:', reportId);
      }
    } else if (reportId && reports.length === 0) {
      console.warn('⚠️ [RECORDING DEBUG] reportId presente pero reports está vacío. Esperando carga de datos...');
    }
  }, [reportId, reports]);

  // Cargar texto inicial si se pasa desde otra pantalla
  useEffect(() => {
    if (initialText && typeof initialText === 'string') {
      setTranscribedText(initialText);
    }
  }, [initialText]);

  const startRecording = async () => {
    try {
      console.log('Iniciando grabación...');
      
      if (Platform.OS === 'web') {
        // Web implementation using MediaRecorder
        const stream = await navigator.mediaDevices.getUserMedia({ 
          audio: {
            echoCancellation: true,
            noiseSuppression: true,
            autoGainControl: true
          } 
        }).catch((error) => {
          console.error('Error al solicitar permisos de micrófono:', error);
          console.error('Permiso de micrófono denegado. Por favor, permite el acceso al micrófono.');
          return null;
        });
        
        if (!stream) return;
        
        // Use the most compatible format
        let mimeType = 'audio/webm';
        if (!MediaRecorder.isTypeSupported(mimeType)) {
          mimeType = 'audio/mp4';
          if (!MediaRecorder.isTypeSupported(mimeType)) {
            mimeType = 'audio/wav';
          }
        }
        
        console.log('Usando formato:', mimeType);
        const mediaRecorder = new MediaRecorder(stream, { mimeType });
        const audioChunks: Blob[] = [];
        
        const localAudioChunks: Blob[] = [];
        
        mediaRecorder.ondataavailable = (event) => {
          if (event.data.size > 0) {
            localAudioChunks.push(event.data);
            console.log('Chunk recibido:', event.data.size, 'bytes');
          }
        };
        
        mediaRecorder.onstop = async () => {
          console.log('Grabación web detenida, procesando...');
          const audioBlob = new Blob(localAudioChunks, { type: mimeType });
          
          console.log('Audio blob creado:', {
            size: audioBlob.size,
            type: audioBlob.type,
            chunks: localAudioChunks.length
          });
          
          if (audioBlob.size > 0) {
            await transcribeAudioFromBlob(audioBlob);
          } else {
            console.warn('Audio vacío, no se puede transcribir');
            console.warn('No se detectó audio para transcribir');
          }
          
          // Limpiar recursos
          stream.getTracks().forEach(track => track.stop());
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
        
        mediaRecorder.start(1000); // Chunks más pequeños para mejor captura
        
        setRecordingState({
          isRecording: true,
          isPaused: false,
          duration: 0,
          uri: null,
        });
        
        console.log('Grabación web iniciada');
      } else {
        const { status } = await Audio.requestPermissionsAsync();
        
        if (status !== 'granted') {
          console.error('Permisos de micrófono denegados');
          console.error('Se requieren permisos de micrófono para grabar.');
          return;
        }

        await Audio.setAudioModeAsync({
          allowsRecordingIOS: true,
          playsInSilentModeIOS: true,
        });

        // Configuración optimizada para transcripción
        const { recording: newRecording } = await Audio.Recording.createAsync({
          android: {
            extension: '.m4a',
            outputFormat: Audio.AndroidOutputFormat.MPEG_4,
            audioEncoder: Audio.AndroidAudioEncoder.AAC,
            sampleRate: 44100,
            numberOfChannels: 2,
            bitRate: 128000,
          },
          ios: {
            extension: '.wav',
            outputFormat: Audio.IOSOutputFormat.LINEARPCM,
            audioQuality: Audio.IOSAudioQuality.HIGH,
            sampleRate: 44100,
            numberOfChannels: 2,
            bitRate: 128000,
            linearPCMBitDepth: 16,
            linearPCMIsBigEndian: false,
            linearPCMIsFloat: false,
          },
          web: {
            mimeType: 'audio/webm',
            bitsPerSecond: 128000,
          },
        });
        
        setRecording(newRecording);
        recordingRef.current = newRecording;
        isUnloadedRef.current = false;
        setIsRecordingUnloaded(false);
        setRecordingState({
          isRecording: true,
          isPaused: false,
          duration: 0,
          uri: null,
        });
        
        console.log('Grabación móvil iniciada');
      }
    } catch (error) {
      console.error('Error al iniciar grabación:', error);
      console.error('No se pudo iniciar la grabación:', error);
    }
  };

  const stopRecording = async () => {
    try {
      console.log('Deteniendo grabación...');
      

      setRecordingState(prev => ({
        ...prev,
        isRecording: false,
        isPaused: false,
      }));
      
      if (Platform.OS === 'web') {
        if (webRecording.mediaRecorder && webRecording.mediaRecorder.state === 'recording') {
          webRecording.mediaRecorder.stop();
          console.log('MediaRecorder detenido');
        }
      } else {
        if (!recording || isRecordingUnloaded) {
          console.log('No hay grabación activa');
          return;
        }
        
        const uri = recording.getURI();
        await recording.stopAndUnloadAsync();
        isUnloadedRef.current = true;
        setIsRecordingUnloaded(true);
        
        await Audio.setAudioModeAsync({
          allowsRecordingIOS: false,
        });
        
        console.log('Grabación guardada:', uri);
        recordingRef.current = null;
        setRecording(null);
        
        if (uri) {
          await transcribeAudioFromUri(uri);
        }
      }
    } catch (error) {
      console.error('Error al detener grabación:', error);
      recordingRef.current = null;
      isUnloadedRef.current = true;
      setRecording(null);
      setIsRecordingUnloaded(true);
      console.error('Error al detener la grabación');
    }
  };

  const processVoiceCommands = (text: string): string => {
    let processed = text;
    
    processed = processed.replace(/\b(\d+)\s+por\s+(\d+)\b/gi, '$1x$2');
    
    processed = processed.replace(/\bcoma\b/gi, ',');
    processed = processed.replace(/\bpunto\b/gi, '.');
    processed = processed.replace(/\bpunto y coma\b/gi, ';');
    processed = processed.replace(/\bdos puntos\b/gi, ':');
    processed = processed.replace(/\binterrogación\b/gi, '?');
    processed = processed.replace(/\bexclamación\b/gi, '!');
    processed = processed.replace(/\bguión\b/gi, '-');
    processed = processed.replace(/\bparéntesis abierto\b/gi, '(');
    processed = processed.replace(/\bparéntesis cerrado\b/gi, ')');
    processed = processed.replace(/\bcomillas\b/gi, '"');
    
    processed = processed.replace(/\bnuevo párrafo\b/gi, '\n\n');
    processed = processed.replace(/\bnueva línea\b/gi, '\n');
    
    processed = processed.replace(/\bcentímetros cúbicos\b/gi, 'cc');
    processed = processed.replace(/\bcentimetros cubicos\b/gi, 'cc');
    processed = processed.replace(/\bcentímetro cúbico\b/gi, 'cc');
    processed = processed.replace(/\bcentimetro cubico\b/gi, 'cc');
    processed = processed.replace(/\bcentímetros\b/gi, 'cm');
    processed = processed.replace(/\bcentimetros\b/gi, 'cm');
    processed = processed.replace(/\bcentímetro\b/gi, 'cm');
    processed = processed.replace(/\bcentimetro\b/gi, 'cm');
    processed = processed.replace(/\bmilímetros\b/gi, 'mm');
    processed = processed.replace(/\bmilimetros\b/gi, 'mm');
    processed = processed.replace(/\bmilímetro\b/gi, 'mm');
    processed = processed.replace(/\bmilimetro\b/gi, 'mm');
    processed = processed.replace(/\bmetros\b/gi, 'm');
    processed = processed.replace(/\bmetro\b/gi, 'm');
    processed = processed.replace(/\bkilómetros\b/gi, 'km');
    processed = processed.replace(/\bkilometros\b/gi, 'km');
    processed = processed.replace(/\bkilómetro\b/gi, 'km');
    processed = processed.replace(/\bkilometro\b/gi, 'km');
    processed = processed.replace(/\bgramos\b/gi, 'g');
    processed = processed.replace(/\bgramo\b/gi, 'g');
    processed = processed.replace(/\bkilogramos\b/gi, 'kg');
    processed = processed.replace(/\bkilogramo\b/gi, 'kg');
    processed = processed.replace(/\bmiligramos\b/gi, 'mg');
    processed = processed.replace(/\bmiligramo\b/gi, 'mg');
    processed = processed.replace(/\bmicrogramos\b/gi, 'mcg');
    processed = processed.replace(/\bmicrogramo\b/gi, 'mcg');
    processed = processed.replace(/\blitros\b/gi, 'L');
    processed = processed.replace(/\blitro\b/gi, 'L');
    processed = processed.replace(/\bmililitros\b/gi, 'ml');
    processed = processed.replace(/\bmililitro\b/gi, 'ml');
    processed = processed.replace(/\bmicrolitros\b/gi, 'μl');
    processed = processed.replace(/\bmicrolitro\b/gi, 'μl');
    processed = processed.replace(/\bsegundos\b/gi, 's');
    processed = processed.replace(/\bsegundo\b/gi, 's');
    processed = processed.replace(/\bminutos\b/gi, 'min');
    processed = processed.replace(/\bminuto\b/gi, 'min');
    processed = processed.replace(/\bhoras\b/gi, 'h');
    processed = processed.replace(/\bhora\b/gi, 'h');
    
    return processed;
  };

  // Función para transcribir desde Blob (web)
  const transcribeAudioFromBlob = async (audioBlob: Blob) => {
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
        console.warn('Audio muy corto');
        return;
      }
      
      const formData = new FormData();
      
      // Determinar extensión por tipo MIME
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
        console.warn('No se detectó texto claro en el audio');
        return;
      }
      
      const rawText = result.text.trim();
      const processedText = processVoiceCommands(rawText);
      setLastTranscription(processedText);
      
      const updatedText = transcribedText + (transcribedText.trim() ? '\n\n' : '') + processedText;
      setTranscribedText(updatedText);
      
      console.log('Raw text:', rawText);
      console.log('Processed text:', processedText);
      

      console.log('✨ Texto agregado exitosamente');
    } catch (error) {
      console.error('❌ Error transcripción:', error);
      
      if (error instanceof Error && error.name === 'AbortError') {
        console.error('Timeout de transcripción');
      } else {
        console.error('Error de transcripción:', error);
      }
    } finally {
      setIsTranscribing(false);
    }
  };

  // Función para transcribir desde URI (móvil)
  const transcribeAudioFromUri = async (uri: string) => {
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
        console.warn('No se detectó texto claro en el audio');
        return;
      }
      
      const rawText = result.text.trim();
      const processedText = processVoiceCommands(rawText);
      setLastTranscription(processedText);
      
      const updatedText = transcribedText + (transcribedText.trim() ? '\n\n' : '') + processedText;
      setTranscribedText(updatedText);
      
      console.log('Raw text:', rawText);
      console.log('Processed text:', processedText);
      

      console.log('✨ Transcripción móvil agregada exitosamente');
    } catch (error) {
      console.error('❌ Error transcripción móvil:', error);
      
      if (error instanceof Error && error.name === 'AbortError') {
        console.error('Timeout de transcripción');
      } else {
        console.error('Error de transcripción:', error);
      }
    } finally {
      setIsTranscribing(false);
    }
  };

  const clearTranscriptionBox = () => {
    setTranscribedText('');
    setLastTranscription('');
    setFindings('');
    setConclusions('');
    setDifferentials('');
    setFinalReport('');
  };

  const deleteLastTranscription = () => {
    if (!lastTranscription) {
      console.log('No hay transcripción reciente para eliminar');
      return;
    }
    
    setTranscribedText(prev => {
      const lastIndex = prev.lastIndexOf(lastTranscription);
      if (lastIndex === -1) return prev;
      
      let newText = prev.substring(0, lastIndex) + prev.substring(lastIndex + lastTranscription.length);
      // Limpiar saltos de línea extra
      newText = newText.replace(/\n\n\n+/g, '\n\n').trim();
      return newText;
    });
    
    setLastTranscription('');
  };

  const clearAllTranscriptions = () => {
    if (Platform.OS === 'web') {
      const confirmed = confirm('¿Estás seguro de que quieres borrar todo el texto?');
      if (confirmed) {
        setTranscribedText('');
        setLastTranscription('');
      }
    } else {
      Alert.alert(
        'Confirmar',
        '¿Estás seguro de que quieres borrar todo el texto?',
        [
          { text: 'Cancelar', style: 'cancel' },
          { 
            text: 'Borrar Todo', 
            style: 'destructive',
            onPress: () => {
              setTranscribedText('');
              setLastTranscription('');
            }
          }
        ]
      );
    }
  };

  const generateFinalReport = async () => {
    if (!transcribedText.trim()) {
      console.warn('No hay texto transcrito para generar informe');
      return;
    }

    setIsGenerating(true);
    
    try {
      console.log('Generando informe final...');
      
      let prompt = '';
      
      if (selectedReport) {
        prompt = `Eres radiólogo especialista. Crea informe médico en ${languageNames[outputLanguage]} integrando:

INFORME BASE:
${selectedReport.content}

NUEVOS HALLAZGOS:
${transcribedText}

REGLAS:
1. Si nuevos hallazgos contradicen base, prioriza nuevos hallazgos
2. Mantén párrafos separados por estructura anatómica
3. Formato: HALLAZGOS (descripción técnica), CONCLUSIÓN (2-3 líneas), DIAGNÓSTICOS DIFERENCIALES (6 con %)
4. Sin preguntas, símbolos decorativos o texto extra
5. Coherencia absoluta entre hallazgos y conclusión`;
      } else {
        prompt = `Eres radiólogo especialista. Crea informe médico profesional en ${languageNames[outputLanguage]} de estas observaciones:

${transcribedText}

REGLAS:
1. Organiza por estructura anatómica (párrafo separado cada una)
2. Formato: HALLAZGOS (descripción técnica), CONCLUSIÓN (2-3 líneas), DIAGNÓSTICOS DIFERENCIALES (6 con %)
3. Terminología médica precisa
4. Sin preguntas, símbolos decorativos o texto extra`;
      }
      
      console.log('📝 [RECORDING] Generando informe con generateText...');
      console.log('📝 [RECORDING] Idioma de salida:', outputLanguage, languageNames[outputLanguage]);
      console.log('📝 [RECORDING] Longitud del prompt:', prompt.length);
      
      let reportContent: string;
      try {
        console.log('📝 [RECORDING] Generando informe con prompt de', prompt.length, 'caracteres');
        
        const aiProvider = (process.env.EXPO_PUBLIC_AI_PROVIDER || 'rork') as 'rork' | 'groq' | 'gemini' | 'openai';
        console.log('📝 [RECORDING] Usando proveedor de IA:', aiProvider);
        
        reportContent = await aiService.generateText({
          messages: [
            {
              role: 'user',
              content: prompt,
            },
          ],
          provider: aiProvider,
        });
        
        console.log('📝 [RECORDING] Respuesta recibida:', typeof reportContent);
        console.log('📝 [RECORDING] Primeros 200 chars:', reportContent.substring(0, 200));
      } catch (genError: any) {
        console.error('❌ [RECORDING] Error en generateText:', genError);
        console.error('❌ [RECORDING] Tipo de error:', genError?.constructor?.name || typeof genError);
        console.error('❌ [RECORDING] Mensaje:', genError?.message || String(genError));
        console.error('❌ [RECORDING] Stack:', genError?.stack);
        
        let userMessage = '';
        
        if (genError?.message?.includes('API key no configurada')) {
          userMessage = genError.message + '\n\nConsulta el archivo README-FIXING-AI-ERRORS.md para instrucciones.';
        } else if (genError?.message?.includes('problemas técnicos') || genError?.message?.includes('no está disponible')) {
          userMessage = genError.message + '\n\nPuedes:\n1. Esperar 2-5 minutos e intentar de nuevo\n2. Cambiar a otro proveedor de IA (consulta README-FIXING-AI-ERRORS.md)';
        } else if (genError?.message?.includes('did not match the expected pattern')) {
          userMessage = 'El servidor de IA devolvió una respuesta inválida.\n\nSoluciones:\n1. Intenta de nuevo en unos minutos\n2. Cambia el proveedor de IA (ver README-FIXING-AI-ERRORS.md)';
        } else if (genError?.message?.includes('Failed to fetch') || genError?.message?.includes('NetworkError')) {
          userMessage = 'No se pudo conectar al servidor de IA.\n\nVerifica:\n1. Tu conexión a internet\n2. Que no haya un firewall bloqueando la conexión';
        } else if (genError?.message?.includes('timeout') || genError?.message?.includes('tardó demasiado')) {
          userMessage = 'La solicitud tardó demasiado tiempo.\n\nSoluciones:\n1. Intenta con un texto más corto\n2. Verifica tu conexión a internet\n3. Intenta de nuevo en unos minutos';
        } else if (genError?.message) {
          userMessage = genError.message + '\n\nSi el problema persiste, consulta README-FIXING-AI-ERRORS.md';
        } else {
          userMessage = 'Error desconocido del servidor.\n\nIntenta de nuevo o consulta README-FIXING-AI-ERRORS.md';
        }
        
        throw new Error(userMessage);
      }
      
      if (!reportContent || typeof reportContent !== 'string') {
        console.error('❌ [RECORDING] Respuesta inválida:', reportContent);
        throw new Error('No se recibió contenido válido del servidor');
      }
      
      // Verificar si la respuesta contiene un error del servidor
      if (reportContent.includes('Internal Server Error') || reportContent.includes('Internal S')) {
        console.error('❌ [RECORDING] El servidor devolvió un error:', reportContent.substring(0, 200));
        throw new Error('El servidor de IA está experimentando problemas. Por favor, intenta de nuevo en unos momentos.');
      }

      console.log('✅ [RECORDING] Informe generado. Longitud:', reportContent.length);
      const trimmedReport = reportContent.trim();
      setFinalReport(trimmedReport);
      
      // Separar hallazgos, conclusiones y diferenciales
      const findingsMatch = trimmedReport.match(/(?:hallazgos?|findings?)\s*:?\s*([\s\S]*?)(?=(?:conclusi[oó]n|conclusion|diagn[oó]sticos?\s+diferenciales?)|$)/i);
      const conclusionsMatch = trimmedReport.match(/(?:conclusi[oó]n|conclusion)\s*:?\s*([\s\S]*?)(?=(?:diagn[oó]sticos?\s+diferenciales?)|$)/i);
      const differentialsMatch = trimmedReport.match(/(?:diagn[oó]sticos?\s+diferenciales?)\s*:?\s*([\s\S]*?)$/i);
      
      if (findingsMatch) {
        let findings = findingsMatch[1].trim();
        // Limpiar texto no deseado pero preservar estructura de párrafos
        findings = findings.replace(/¿Deseas que prepare también.*?$/gi, '');
        findings = findings.replace(/¿Te gustaría.*?$/gi, '');
        findings = findings.replace(/Si necesitas.*?$/gi, '');
        findings = findings.replace(/¿.*?$/gi, '');
        findings = findings.replace(/###.*$/gim, '');
        findings = findings.replace(/---+/g, '');
        findings = findings.replace(/\*\*\*/g, '');
        findings = findings.replace(/\*\*/g, '');
        findings = findings.replace(/^---+$/gm, '');
        findings = findings.replace(/^\*\*\*+$/gm, '');
        findings = findings.replace(/---+$/gm, '');
        findings = findings.replace(/\*\*\*+$/gm, '');
        findings = findings.replace(/^---+/gm, '');
        findings = findings.replace(/^\*\*\*+/gm, '');
        // Preservar saltos de línea y estructura de párrafos
        findings = findings.replace(/\n\s*\n/g, '\n\n'); // Normalizar dobles saltos de línea
        findings = findings.trim();
        setFindings(findings);
      }
      
      if (conclusionsMatch) {
        let conclusion = conclusionsMatch[1].trim();
        // Remover texto no deseado de la conclusión
        conclusion = conclusion.replace(/¿Deseas que prepare también.*?$/gi, '');
        conclusion = conclusion.replace(/¿Te gustaría.*?$/gi, '');
        conclusion = conclusion.replace(/Si necesitas.*?$/gi, '');
        conclusion = conclusion.replace(/¿.*?$/gi, '');
        conclusion = conclusion.replace(/###.*$/gim, '');
        conclusion = conclusion.replace(/---+/g, '');
        conclusion = conclusion.replace(/\*\*\*/g, '');
        conclusion = conclusion.replace(/\*\*/g, '');
        conclusion = conclusion.replace(/^---+$/gm, '');
        conclusion = conclusion.replace(/^\*\*\*+$/gm, '');
        conclusion = conclusion.replace(/---+$/gm, '');
        conclusion = conclusion.replace(/\*\*\*+$/gm, '');
        conclusion = conclusion.replace(/^---+/gm, '');
        conclusion = conclusion.replace(/^\*\*\*+/gm, '');
        conclusion = conclusion.trim();
        setConclusions(conclusion);
      }
      
      if (differentialsMatch) {
        let differentials = differentialsMatch[1].trim();
        // Remover texto no deseado de los diferenciales
        differentials = differentials.replace(/¿Deseas que prepare también.*?$/gi, '');
        differentials = differentials.replace(/¿Te gustaría.*?$/gi, '');
        differentials = differentials.replace(/Si necesitas.*?$/gi, '');
        differentials = differentials.replace(/¿.*?$/gi, '');
        differentials = differentials.replace(/###.*$/gim, '');
        differentials = differentials.replace(/---+/g, '');
        differentials = differentials.replace(/\*\*\*/g, '');
        differentials = differentials.replace(/\*\*/g, '');
        differentials = differentials.replace(/^---+$/gm, '');
        differentials = differentials.replace(/^\*\*\*+$/gm, '');
        differentials = differentials.replace(/---+$/gm, '');
        differentials = differentials.replace(/\*\*\*+$/gm, '');
        differentials = differentials.replace(/^---+/gm, '');
        differentials = differentials.replace(/^\*\*\*+/gm, '');
        differentials = differentials.trim();
        setDifferentials(differentials);
      }
    } catch (error) {
      console.error('❌ Error al generar informe:', error);
      
      let errorMessage = 'No se pudo generar el informe final';
      
      if (error instanceof Error) {
        console.error('❌ Tipo de error:', error.name);
        console.error('❌ Mensaje completo:', error.message);
        console.error('❌ Stack:', error.stack);
        
        errorMessage = error.message;
      } else {
        console.error('❌ Error desconocido:', error);
        errorMessage = 'Error desconocido. Consulta README-FIXING-AI-ERRORS.md para más información.';
      }
      
      if (Platform.OS === 'web') {
        alert(`❌ Error al generar informe: ${errorMessage}`);
      } else {
        Alert.alert(
          '❌ Error al generar informe',
          errorMessage,
          [{ text: 'Entendido', style: 'default' }]
        );
      }
    } finally {
      setIsGenerating(false);
    }
  };

  const resetAll = async () => {
    // Clean up recording resources
    if (Platform.OS === 'web') {
      if (webRecording.mediaRecorder && webRecording.mediaRecorder.state === 'recording') {
        webRecording.mediaRecorder.stop();
      }
      if (webRecording.stream) {
        webRecording.stream.getTracks().forEach(track => track.stop());
      }
      setWebRecording({
        mediaRecorder: null,
        audioChunks: [],
        stream: null,
      });
    } else {
      if (recordingRef.current && !isUnloadedRef.current) {
        try {
          await recordingRef.current.stopAndUnloadAsync();
          isUnloadedRef.current = true;
          setIsRecordingUnloaded(true);
        } catch (error) {
          console.error('Error stopping recording during reset:', error);
        }
        recordingRef.current = null;
        setRecording(null);
      }
    }
    
    setSelectedReport(null);
    setTranscribedText('');
    setLastTranscription('');
    setFinalReport('');
    setFindings('');
    setConclusions('');
    setDifferentials('');
    setRecordingState({
      isRecording: false,
      isPaused: false,
      duration: 0,
      uri: null,
    });
    setReportSearchQuery('');
    setIsRecordingUnloaded(false);
    

  };

  return (
    <View style={[styles.container, { backgroundColor: theme.background, paddingTop: insets.top }]}>
      <ScrollView style={styles.scrollView}>
        <View style={styles.content}>
          <View style={[styles.titleContainer, { backgroundColor: '#2196F3' }]}>
            <Text style={[styles.title, { color: '#FFFFFF' }]}>{t.recording.title}</Text>
          </View>
          
          {/* Selector de Informe Compacto */}
          <View style={[styles.compactSection, { 
            backgroundColor: theme.surface,
            borderWidth: selectedReport ? 2 : 1,
            borderColor: selectedReport ? theme.primary : theme.outline
          }]}>
            <TouchableOpacity 
              style={styles.selectorHeader}
              onPress={() => setIsReportSelectorExpanded(!isReportSelectorExpanded)}
            >
              <View style={{ flex: 1 }}>
                <Text style={[styles.compactSectionLabel, { color: theme.outline }]}>
                  {t.recording.selectBaseReport}
                </Text>
                <Text style={[styles.compactSectionTitle, { 
                  color: selectedReport ? theme.primary : theme.onSurface,
                  fontWeight: selectedReport ? '700' : '600'
                }]}>
                  {selectedReport ? selectedReport.title : t.recording.noneSelected}
                </Text>
              </View>
              {isReportSelectorExpanded ? (
                <ChevronUp size={20} color={theme.onSurface} />
              ) : (
                <ChevronDown size={20} color={theme.onSurface} />
              )}
            </TouchableOpacity>
            
            {isReportSelectorExpanded && (
              <View style={styles.expandedSelector}>
                <View style={styles.searchBar}>
                  <SearchBar
                    value={reportSearchQuery}
                    onChangeText={setReportSearchQuery}
                    placeholder={t.recording.searchReport}
                  />
                </View>
                
                <ScrollView style={styles.compactReportsList} nestedScrollEnabled>
                  {filteredReports.map((report) => (
                    <TouchableOpacity
                      key={report.id}
                      style={[
                        styles.compactReportItem,
                        {
                          backgroundColor: selectedReport?.id === report.id ? theme.surfaceVariant : theme.surface,
                          borderColor: theme.outline,
                        },
                      ]}
                      onPress={() => {
                        setSelectedReport(report);
                        setIsReportSelectorExpanded(false);
                      }}
                    >
                      <FileText
                        size={16}
                        color={selectedReport?.id === report.id ? theme.primary : theme.onSurface}
                      />
                      <Text
                        style={[
                          styles.compactReportTitle,
                          {
                            color: selectedReport?.id === report.id ? theme.primary : theme.onSurface,
                          },
                        ]}
                        numberOfLines={1}
                      >
                        {report.title}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>
            )}
          </View>

          {/* Sección de Grabación */}
          <View style={[styles.section, { backgroundColor: theme.surface }]}>
            {/* Botones superiores en una línea: Grabar y Nuevo Informe */}
            <View style={styles.topButtonsRow}>
              {!recordingState.isRecording ? (
                <TouchableOpacity
                  style={[styles.topUniformButton, { backgroundColor: '#38B2AC' }]}
                  onPress={startRecording}
                >
                  <Mic size={18} color="#FFFFFF" />
                  <Text style={[styles.topUniformButtonText, { color: '#FFFFFF' }]}>{t.recording.record}</Text>
                </TouchableOpacity>
              ) : (
                <TouchableOpacity
                  style={[styles.topUniformButton, { backgroundColor: '#E53E3E' }]}
                  onPress={stopRecording}
                >
                  <Square size={18} color="#FFFFFF" />
                  <Text style={[styles.topUniformButtonText, { color: '#FFFFFF' }]}>{t.recording.stop}</Text>
                </TouchableOpacity>
              )}

              <TouchableOpacity
                style={[styles.topUniformButton, { backgroundColor: theme.outline }]}
                onPress={resetAll}
              >
                <RotateCcw size={18} color={theme.onSurface} />
                <Text style={[styles.topUniformButtonText, { color: theme.onSurface }]}>{t.recording.newReport}</Text>
              </TouchableOpacity>
            </View>
            
            {/* Mostrar estado de transcripción automática */}
            {isTranscribing && (
              <View style={[styles.transcriptionStatus, { backgroundColor: theme.surfaceVariant }]}>
                <ActivityIndicator size="small" color={theme.primary} />
                <Text style={[styles.transcriptionStatusText, { color: theme.onSurface }]}>
                  {t.recording.transcribing}
                </Text>
              </View>
            )}
            
            <View style={styles.freeTextHeaderRow}>
              <Text style={[styles.sectionTitle, { color: theme.onSurface }]}>{t.recording.freeText}</Text>
              
              {/* Selector de idioma de salida */}
              <TouchableOpacity
                style={[styles.languageSelector, { 
                  backgroundColor: theme.surfaceVariant,
                  borderColor: theme.outline 
                }]}
                onPress={() => setIsLanguageSelectorExpanded(!isLanguageSelectorExpanded)}
              >
                <Text style={[styles.languageSelectorText, { color: theme.onSurface }]}>
                  {languageNames[outputLanguage]}
                </Text>
                {isLanguageSelectorExpanded ? (
                  <ChevronUp size={16} color={theme.onSurface} />
                ) : (
                  <ChevronDown size={16} color={theme.onSurface} />
                )}
              </TouchableOpacity>
            </View>
            
            {/* Lista expandible de idiomas */}
            {isLanguageSelectorExpanded && (
              <View style={[styles.languageDropdown, { backgroundColor: theme.surface, borderColor: theme.outline }]}>
                {(Object.keys(languageNames) as Language[]).map((lang) => (
                  <TouchableOpacity
                    key={lang}
                    style={[styles.languageOption, { 
                      backgroundColor: outputLanguage === lang ? theme.surfaceVariant : theme.surface
                    }]}
                    onPress={() => {
                      setOutputLanguage(lang);
                      setIsLanguageSelectorExpanded(false);
                    }}
                  >
                    <Text style={[styles.languageOptionText, { 
                      color: outputLanguage === lang ? theme.primary : theme.onSurface,
                      fontWeight: outputLanguage === lang ? '600' : '400'
                    }]}>
                      {languageNames[lang]}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            )}
            
            {/* Caja de Transcripción Automática */}
            <View style={[styles.textInputContainer, { 
              backgroundColor: theme.background, 
              borderColor: isTranscribing ? theme.primary : theme.outline,
              borderWidth: isTranscribing ? 2 : 1
            }]}>
              <TextInput
                style={[styles.textInput, { color: theme.onBackground }]}
                value={transcribedText}
                onChangeText={setTranscribedText}
                placeholder={isTranscribing ? t.recording.transcribing : t.recording.freeText}
                placeholderTextColor={theme.outline}
                multiline
                textAlignVertical="top"
                editable={!isTranscribing}
              />
            </View>
            
            {/* Botones de Control de Texto en una línea */}
            <View style={styles.textControlButtonsRow}>
              <TouchableOpacity
                style={[styles.uniformControlButton, { backgroundColor: theme.secondary, opacity: transcribedText.trim() ? 1 : 0.5 }]}
                onPress={generateFinalReport}
                disabled={isGenerating || !transcribedText.trim()}
              >
                {isGenerating ? (
                  <ActivityIndicator size="small" color={theme.onSecondary} />
                ) : (
                  <Send size={16} color={theme.onSecondary} />
                )}
                <Text style={[styles.uniformControlButtonText, { color: theme.onSecondary }]}>
                  {isGenerating ? t.recording.generating : t.recording.createReport}
                </Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={[styles.uniformControlButton, { backgroundColor: '#F59E0B', opacity: lastTranscription ? 1 : 0.5 }]}
                onPress={deleteLastTranscription}
                disabled={!lastTranscription}
              >
                <Trash2 size={16} color="#FFFFFF" />
                <Text style={[styles.uniformControlButtonText, { color: '#FFFFFF' }]}>{t.recording.deleteLastText}</Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={[styles.uniformControlButton, { backgroundColor: theme.error, opacity: transcribedText.trim() ? 1 : 0.5 }]}
                onPress={clearAllTranscriptions}
                disabled={!transcribedText.trim()}
              >
                <Trash2 size={16} color={theme.onError} />
                <Text style={[styles.uniformControlButtonText, { color: theme.onError }]}>{t.recording.deleteAllText}</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Hallazgos */}
          <View style={[styles.section, { backgroundColor: theme.surface }]}>
            <View style={styles.sectionHeader}>
              <Text style={[styles.sectionTitle, { color: theme.onSurface }]}>{t.recording.findings}</Text>
              <TouchableOpacity
                style={[styles.wideCopyButton, { backgroundColor: theme.primary }]}
                onPress={async () => {
                  if (findings.trim()) {
                    await Clipboard.setStringAsync(findings);
                  }
                }}
                disabled={!findings.trim()}
              >
                <Copy size={16} color={theme.onPrimary} />
                <Text style={[styles.copyButtonText, { color: theme.onPrimary }]}>{t.common.copy.toUpperCase()}</Text>
              </TouchableOpacity>
            </View>
            <View style={[styles.textInputContainer, { backgroundColor: theme.background, borderColor: theme.outline }]}>
              <TextInput
                style={[styles.textInput, { color: theme.onBackground }]}
                value={findings}
                onChangeText={setFindings}
                placeholder={t.recording.findingsPlaceholder}
                placeholderTextColor={theme.outline}
                multiline
                textAlignVertical="top"
              />
            </View>
          </View>

          {/* Conclusiones */}
          <View style={[styles.section, { backgroundColor: theme.surface }]}>
            <View style={styles.sectionHeader}>
              <Text style={[styles.sectionTitle, { color: theme.onSurface }]}>{t.recording.conclusion}</Text>
              <TouchableOpacity
                style={[styles.wideCopyButton, { backgroundColor: theme.primary }]}
                onPress={async () => {
                  if (conclusions.trim()) {
                    await Clipboard.setStringAsync(conclusions);
                  }
                }}
                disabled={!conclusions.trim()}
              >
                <Copy size={16} color={theme.onPrimary} />
                <Text style={[styles.copyButtonText, { color: theme.onPrimary }]}>{t.common.copy.toUpperCase()}</Text>
              </TouchableOpacity>
            </View>
            <View style={[styles.textInputContainer, { backgroundColor: theme.background, borderColor: theme.outline }]}>
              <TextInput
                style={[styles.textInput, { color: theme.onBackground }]}
                value={conclusions}
                onChangeText={setConclusions}
                placeholder={t.recording.conclusionPlaceholder}
                placeholderTextColor={theme.outline}
                multiline
                textAlignVertical="top"
              />
            </View>
          </View>

          {/* Diagnósticos Diferenciales */}
          <View style={[styles.section, { backgroundColor: theme.surface }]}>
            <View style={styles.sectionHeader}>
              <Text style={[styles.sectionTitle, { color: theme.onSurface }]}>{t.recording.differentials}</Text>
              <TouchableOpacity
                style={[styles.wideCopyButton, { backgroundColor: theme.primary }]}
                onPress={async () => {
                  if (differentials.trim()) {
                    await Clipboard.setStringAsync(differentials);
                  }
                }}
                disabled={!differentials.trim()}
              >
                <Copy size={16} color={theme.onPrimary} />
                <Text style={[styles.copyButtonText, { color: theme.onPrimary }]}>{t.common.copy.toUpperCase()}</Text>
              </TouchableOpacity>
            </View>
            <View style={[styles.textInputContainer, { backgroundColor: theme.background, borderColor: theme.outline }]}>
              <TextInput
                style={[styles.textInput, { color: theme.onBackground }]}
                value={differentials}
                onChangeText={setDifferentials}
                placeholder={t.recording.differentialsPlaceholder}
                placeholderTextColor={theme.outline}
                multiline
                textAlignVertical="top"
              />
            </View>
          </View>

          {/* Botón grande Nuevo Informe al final */}
          <TouchableOpacity
            style={[styles.bigNewReportButton, { backgroundColor: theme.primary }]}
            onPress={resetAll}
          >
            <RotateCcw size={18} color={theme.onPrimary} />
            <Text style={[styles.bigNewReportButtonText, { color: theme.onPrimary }]}>{t.recording.newReport}</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  content: {
    padding: 16,
  },
  titleContainer: {
    borderRadius: 12,
    paddingVertical: 16,
    paddingHorizontal: 20,
    marginBottom: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    textAlign: 'center',
    letterSpacing: 0.5,
  },
  section: {
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 12,
  },
  searchBar: {
    marginBottom: 12,
  },
  compactSection: {
    borderRadius: 12,
    padding: 12,
    marginBottom: 16,
  },
  selectorHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  compactSectionLabel: {
    fontSize: 12,
    fontWeight: '500',
    marginBottom: 2,
  },
  compactSectionTitle: {
    fontSize: 16,
    fontWeight: '600',
  },
  expandedSelector: {
    marginTop: 12,
  },
  compactReportsList: {
    maxHeight: 150,
  },
  compactReportItem: {
    flexDirection: 'row',
    padding: 8,
    borderRadius: 6,
    borderWidth: 1,
    marginBottom: 6,
    alignItems: 'center',
  },
  compactReportTitle: {
    fontSize: 14,
    fontWeight: '500',
    marginLeft: 8,
    flex: 1,
  },
  compactRecordingControls: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
    gap: 12,
  },
  iconButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
  },
  reportsList: {
    maxHeight: 200,
  },
  reportItem: {
    flexDirection: 'row',
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    marginBottom: 8,
    alignItems: 'center',
  },
  reportInfo: {
    flex: 1,
    marginLeft: 12,
  },
  reportTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  reportPreview: {
    fontSize: 14,
  },
  recordingControls: {
    alignItems: 'center',
    marginBottom: 16,
  },
  recordButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 25,
  },
  recordButtonText: {
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  transcribeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
  },
  generateButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
    marginTop: 12,
  },
  compactButtonText: {
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 6,
  },
  resetButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
    marginTop: 16,
  },
  buttonText: {
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  textContainer: {
    borderRadius: 8,
    borderWidth: 1,
    padding: 12,
    minHeight: 100,
  },
  textInputContainer: {
    borderRadius: 8,
    borderWidth: 1,
    minHeight: 120,
  },
  textInput: {
    fontSize: 16,
    lineHeight: 24,
    padding: 12,
    minHeight: 120,
  },
  transcribedText: {
    fontSize: 16,
    lineHeight: 24,
  },
  finalReportText: {
    fontSize: 16,
    lineHeight: 24,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  copyButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  topButtonsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'stretch',
    marginBottom: 16,
    gap: 8,
  },
  topUniformButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 8,
    borderRadius: 8,
  },
  topUniformButtonText: {
    fontSize: 12,
    fontWeight: '600',
    marginLeft: 6,
  },
  textControlButtonsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'stretch',
    marginTop: 12,
    gap: 8,
  },
  uniformControlButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 8,
    borderRadius: 8,
  },
  uniformControlButtonText: {
    fontSize: 12,
    fontWeight: '600',
    marginLeft: 6,
  },
  controlButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 8,
    minWidth: 120,
  },
  controlButtonText: {
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 6,
  },
  clearButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 25,
    minWidth: 120,
  },
  clearButtonText: {
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 6,
  },
  wideRecordButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 25,
    minWidth: 150,
  },
  wideTranscribeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
    minWidth: 150,
  },
  wideButtonText: {
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 8,
  },
  wideCopyButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    minWidth: 80,
  },
  copyButtonText: {
    fontSize: 12,
    fontWeight: '600',
    marginLeft: 6,
  },
  transcriptionStatus: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    marginTop: 8,
  },
  transcriptionStatusText: {
    fontSize: 12,
    fontWeight: '600',
    marginLeft: 8,
  },
  bigNewReportButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 8,
    marginTop: 16,
    marginBottom: 16,
  },
  bigNewReportButtonText: {
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 8,
  },
  freeTextHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  languageSelector: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 8,
    borderWidth: 1,
    gap: 6,
  },
  languageSelectorText: {
    fontSize: 13,
    fontWeight: '500',
  },
  languageDropdown: {
    marginTop: 8,
    marginBottom: 12,
    borderRadius: 8,
    borderWidth: 1,
    overflow: 'hidden',
  },
  languageOption: {
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0, 0, 0, 0.05)',
  },
  languageOptionText: {
    fontSize: 14,
  },
});