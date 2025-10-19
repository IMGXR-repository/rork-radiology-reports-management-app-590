import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Platform,
  Alert,
  ActivityIndicator,
  ScrollView,
  TextInput,
} from 'react-native';
import * as Clipboard from 'expo-clipboard';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Mic, Square, Play, Pause, Trash2, FileText, Eraser, Send, Sparkles, Copy, Brain } from 'lucide-react-native';
import { useRouter } from 'expo-router';
import { useApp } from '@/contexts/AppContext';
import { lightTheme, darkTheme } from '@/constants/theme';
import { useAuth } from '@/contexts/AuthContext';
import { Audio } from 'expo-av';

interface Recording {
  id: string;
  uri: string;
  duration: number;
  date: Date;
  transcription?: string;
}

export default function DictaphoneScreen() {
  const { settings } = useApp();
  const { user } = useAuth();
  const insets = useSafeAreaInsets();
  const theme = settings?.theme === 'dark' ? darkTheme : lightTheme;
  const router = useRouter();

  const [isRecording, setIsRecording] = useState<boolean>(false);
  const [isPaused, setIsPaused] = useState<boolean>(false);
  const [recording, setRecording] = useState<Audio.Recording | null>(null);
  const [recordings, setRecordings] = useState<Recording[]>([]);
  const [isTranscribing, setIsTranscribing] = useState<boolean>(false);
  const [recordingDuration, setRecordingDuration] = useState<number>(0);
  const [mediaRecorder, setMediaRecorder] = useState<MediaRecorder | null>(null);
  const [correctingGrammar, setCorrectingGrammar] = useState<string | null>(null);
  const [transcriptionMode, setTranscriptionMode] = useState<'ia' | 'natural'>('ia');
  const [naturalText, setNaturalText] = useState<string>('');
  const [error, setError] = useState<string | null>(null);
  const [apiInfo, setApiInfo] = useState<string | null>(null);


  useEffect(() => {
    if (Platform.OS !== 'web') {
      setupAudioMode();
    }
  }, []);

  const setupAudioMode = async () => {
    try {
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true,
      });
    } catch (error) {
      console.error('Error setting up audio mode:', error);
    }
  };

  const startRecording = async () => {
    try {
      if (Platform.OS === 'web') {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true }).catch((error) => {
          console.error('Error al solicitar permisos de micrófono:', error);
          console.error('Permiso de micrófono denegado. Por favor, permite el acceso al micrófono.');
          return null;
        });
        if (!stream) return;
        const recorder = new MediaRecorder(stream);
        const chunks: Blob[] = [];

        recorder.ondataavailable = (e) => {
          if (e.data.size > 0) {
            chunks.push(e.data);
          }
        };

        recorder.onstop = async () => {
          const audioBlob = new Blob(chunks, { type: 'audio/webm' });
          const audioUrl = URL.createObjectURL(audioBlob);
          
          const newRecording: Recording = {
            id: Date.now().toString(),
            uri: audioUrl,
            duration: recordingDuration,
            date: new Date(),
          };
          
          setRecordings(prev => [newRecording, ...prev]);
          
          stream.getTracks().forEach(track => track.stop());
          
          await transcribeAudio(audioBlob);
        };

        recorder.start();
        setMediaRecorder(recorder);
        setIsRecording(true);
        setRecordingDuration(0);
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
        setIsRecording(true);
        setRecordingDuration(0);
      }
    } catch (error) {
      console.error('Error starting recording:', error);
      console.error('Error al iniciar la grabación. Verifica los permisos del micrófono.');
    }
  };

  const stopRecording = async () => {
    try {
      if (Platform.OS === 'web') {
        if (mediaRecorder && mediaRecorder.state !== 'inactive') {
          mediaRecorder.stop();
        }
        setIsRecording(false);
        setIsPaused(false);
        setMediaRecorder(null);
      } else {
        if (!recording) return;

        await recording.stopAndUnloadAsync();
        const uri = recording.getURI();
        
        if (uri) {
          const newRecording: Recording = {
            id: Date.now().toString(),
            uri,
            duration: recordingDuration,
            date: new Date(),
          };
          
          setRecordings(prev => [newRecording, ...prev]);
          
          await Audio.setAudioModeAsync({
            allowsRecordingIOS: false,
          });
          
          await transcribeRecording(uri);
        }

        setRecording(null);
        setIsRecording(false);
        setIsPaused(false);
      }
    } catch (error) {
      console.error('Error stopping recording:', error);
      console.error('Error al detener la grabación.');
    }
  };

  const pauseRecording = async () => {
    try {
      if (Platform.OS === 'web') {
        if (mediaRecorder && mediaRecorder.state === 'recording') {
          mediaRecorder.pause();
          setIsPaused(true);
        }
      } else {
        if (recording) {
          await recording.pauseAsync();
          setIsPaused(true);
        }
      }
    } catch (error) {
      console.error('Error pausing recording:', error);
    }
  };

  const resumeRecording = async () => {
    try {
      if (Platform.OS === 'web') {
        if (mediaRecorder && mediaRecorder.state === 'paused') {
          mediaRecorder.resume();
          setIsPaused(false);
        }
      } else {
        if (recording) {
          await recording.startAsync();
          setIsPaused(false);
        }
      }
    } catch (error) {
      console.error('Error resuming recording:', error);
    }
  };

  const processVoiceCommandsWithAI = async (text: string): Promise<string> => {
    try {
      const response = await fetch(new URL('/agent/chat', process.env['EXPO_PUBLIC_TOOLKIT_URL'] || 'https://toolkit.rork.com').toString(), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          messages: [
            {
              role: 'user',
              content: `Eres un asistente especializado en procesar transcripciones de voz médicas en español. Tu tarea es:

1. DETECTAR Y APLICAR COMANDOS DE VOZ:
   - "nuevo párrafo" / "nuevo parrafo" / "bárrafo" / "barrafo" → Insertar doble salto de línea (\n\n) y capitalizar la siguiente palabra
   - "nueva línea" / "nueva linea" → Insertar salto de línea (\n) y capitalizar la siguiente palabra
   - "punto" → .
   - "coma" → ,
   - "punto y coma" → ;
   - "dos puntos" → :
   - "abrir paréntesis" / "abre paréntesis" → (
   - "cerrar paréntesis" / "cierra paréntesis" / "cierre paréntesis" → )
   - "[número] por [número]" (ej: "3 por 2") → [número]x[número] (ej: 3x2)

2. CORREGIR ERRORES DE TRANSCRIPCIÓN:
   - Palabras médicas mal transcritas
   - Abreviaciones médicas (ej: "AP" para Anteroposterior, "T" para Transversal, "CC" para Craneocaudal)
   - Unidades de medida (mm, cm, etc.)

3. CAPITALIZACIÓN:
   - Después de punto, la siguiente palabra debe empezar en mayúscula
   - Después de comandos de "nuevo párrafo" o "nueva línea", capitalizar la siguiente palabra
   - NO agregar espacios extra al inicio de párrafos nuevos

4. FORMATO:
   - Eliminar espacios antes de puntuación
   - Agregar espacio después de puntuación (excepto al final)
   - NO agregar información adicional
   - Mantener el contenido médico exacto

Texto transcrito:
${text}

Devuelve ÚNICAMENTE el texto procesado con los comandos aplicados y errores corregidos. Sin explicaciones.`,
            },
          ],
        }),
      });

      if (!response.ok) {
        throw new Error(`Error en procesamiento: ${response.status}`);
      }

      const reader = response.body?.getReader();
      if (!reader) {
        throw new Error('No se pudo leer la respuesta');
      }

      const decoder = new TextDecoder();
      let processedText = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value, { stream: true });
        const lines = chunk.split('\n');

        for (const line of lines) {
          if (line.startsWith('0:')) {
            try {
              const jsonStr = line.substring(2);
              const data = JSON.parse(jsonStr);
              if (data.type === 'text-delta' && data.textDelta) {
                processedText += data.textDelta;
              }
            } catch (e) {
              console.error('Error parsing chunk:', e);
            }
          }
        }
      }

      return processedText.trim();
    } catch (error) {
      console.error('Error processing with AI:', error);
      return text;
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
    
    processed = processed.replace(/\b(abrir|abre)\s+paréntesis\b/gi, '(');
    processed = processed.replace(/\b(cerrar|cierra)\s+paréntesis\b/gi, ')');
    
    processed = processed.replace(/\bcomillas\b/gi, '"');
    
    processed = processed.replace(/\bnuevo\s+(párrafo|parrafo|bárrafo|barrafo)\b/gi, '\n\n__CAPITALIZE__');
    processed = processed.replace(/\bnueva\s+(línea|linea)\b/gi, '\n__CAPITALIZE__');
    
    processed = processed.replace(/__CAPITALIZE__\s+/g, '__CAPITALIZE__');
    
    processed = processed.replace(/__CAPITALIZE__(\w)/g, (match, letter) => {
      return letter.toUpperCase();
    });
    
    processed = processed.replace(/__CAPITALIZE__/g, '');
    
    processed = processed.replace(/([.!?])\s+(\w)/g, (match, punctuation, letter) => {
      return punctuation + ' ' + letter.toUpperCase();
    });
    
    processed = processed.replace(/\s+([.,;:?!)])/g, '$1');
    
    processed = processed.replace(/([.,;:?!])\1+/g, '$1');
    
    processed = processed.replace(/([.,;:?!])(?!\s|$)/g, '$1 ');
    
    return processed.trim();
  };

  const correctGrammar = async (text: string, recordingId: string): Promise<void> => {
    setCorrectingGrammar(recordingId);
    try {
      const response = await fetch(new URL('/agent/chat', process.env['EXPO_PUBLIC_TOOLKIT_URL'] || 'https://toolkit.rork.com').toString(), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          messages: [
            {
              role: 'user',
              content: `Eres un asistente especializado en corrección de textos médicos. Tu tarea es corregir la gramática, ortografía y puntuación del siguiente texto transcrito, manteniendo el significado original y el formato (saltos de línea, párrafos). NO agregues información adicional, solo corrige errores gramaticales y ortográficos.

Texto a corregir:
${text}

Devuelve ÚNICAMENTE el texto corregido, sin explicaciones ni comentarios adicionales.`,
            },
          ],
        }),
      });

      if (!response.ok) {
        throw new Error(`Error en corrección: ${response.status}`);
      }

      const reader = response.body?.getReader();
      if (!reader) {
        throw new Error('No se pudo leer la respuesta');
      }

      const decoder = new TextDecoder();
      let correctedText = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value, { stream: true });
        const lines = chunk.split('\n');

        for (const line of lines) {
          if (line.startsWith('0:')) {
            try {
              const jsonStr = line.substring(2);
              const data = JSON.parse(jsonStr);
              if (data.type === 'text-delta' && data.textDelta) {
                correctedText += data.textDelta;
              }
            } catch (e) {
              console.error('Error parsing chunk:', e);
            }
          }
        }
      }

      if (correctedText.trim()) {
        setRecordings(prev =>
          prev.map(rec =>
            rec.id === recordingId
              ? { ...rec, transcription: correctedText.trim() }
              : rec
          )
        );
      }
    } catch (error) {
      console.error('Error correcting grammar:', error);
      console.error('Error al corregir la gramática. Se mantendrá el texto original.');
    } finally {
      setCorrectingGrammar(null);
    }
  };

  const enhanceTranscription = async (text: string): Promise<string> => {
    try {
      const response = await fetch(new URL('/agent/chat', process.env['EXPO_PUBLIC_TOOLKIT_URL'] || 'https://toolkit.rork.com').toString(), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          messages: [
            {
              role: 'user',
              content: `Eres un asistente médico experto en procesar transcripciones de informes radiológicos en español. Tu tarea es corregir y formatear el texto transcrito siguiendo estas reglas EN ORDEN EXACTO:

**PASO 1: CORRECCIÓN DE ERRORES CRÍTICOS DE RECONOCIMIENTO DE VOZ:**
   - "bárrafo" / "barrafo" / "novo párrafo" / "nova párrafo" → ELIMINAR completamente (es comando de salto de párrafo)
   - "uno" al inicio de frase o después de punto → ELIMINAR (es error del STT)
   - "nova línea" / "nueva línea" → ELIMINAR completamente
   - "novo" → ELIMINAR
   - ", ." → "." (eliminar coma antes de punto)
   - " ," → "," (eliminar espacio antes de coma)
   - " ." → "." (eliminar espacio antes de punto)

**PASO 2: CORRECCIÓN MÉDICA Y ORTOGRÁFICA (CRÍTICO):**
   Corregir términos médicos mal transcritos:
   - "intraestrepática" / "intrahestepatica" → "intrahepática"
   - "biabiliar" / "biabilar" / "via biliar" → "vía biliar"
   - "parenchima" → "parénquima"
   - "litias" → "litiasis"
   - "celda pancrática" / "celda pancrética" → "celda pancreática"
   - "páncreda" / "pancrea" → "páncreas"
   - "vesícula viliar" → "vesícula biliar"
   - "viliar" → "biliar"
   - "suprarrenales" → verificar ortografía
   - "bazo" → verificar contexto

**PASO 3: LIMPIEZA DE PUNTUACIÓN:**
   - ELIMINAR todas las comas antes de puntos: ", ." → "."
   - ELIMINAR espacios antes de puntuación: " ," → "," y " ." → "."
   - Agregar espacio después de comas si no existe: "," → ", "
   - Agregar espacio después de puntos si no existe: "." → ". "
   - NO usar punto y coma (;)
   - Eliminar puntos duplicados: ".." → "."
   - Eliminar comas duplicadas: ",," → ","

**PASO 4: CAPITALIZACIÓN:**
   - Primera letra después de punto SIEMPRE en mayúscula
   - Primera letra de la primera palabra del texto en mayúscula
   - Nombres de órganos al inicio de sección en MAYÚSCULA COMPLETA

**PASO 5: ESTRUCTURA Y FORMATO (CRÍTICO):**
   - Detectar cambios de órgano/estructura anatómica
   - Formato: ÓRGANO: Descripción.
   - Cada órgano en nueva línea con línea en blanco antes
   - Ejemplos de órganos a detectar: hígado, vesícula biliar, vía biliar, bazo, páncreas, riñones, glándulas suprarrenales, celda pancreática

**PASO 6: COHERENCIA FINAL:**
   - Eliminar todos los espacios dobles: "  " → " "
   - Eliminar espacios al inicio de líneas
   - Eliminar líneas vacías múltiples (máximo 1 línea en blanco entre secciones)
   - Verificar que no haya comandos de voz residuales

**EJEMPLOS DE TRANSFORMACIÓN:**

EJEMPLO 1:
ENTRADA: "Hígado de tamaño y densidad normal, sin lesiones focales, . Vesícula biliar, sin litias y ni cambios inflamatorios, . Biabilar intra y extra hepática no dilatada, . Novo párrafo, bazo, páncreas, glándulas suprarrenales y celda pancrática sin alteraciones, ."

SALIDA:
"HÍGADO: De tamaño y densidad normal, sin lesiones focales.

VESÍCULA BILIAR: Sin litiasis ni cambios inflamatorios.

VÍA BILIAR: Intra y extrahepática no dilatada.

BAZO, PÁNCREAS, GLÁNDULAS SUPRARRENALES Y CELDA PANCREÁTICA: Sin alteraciones."

EJEMPLO 2:
ENTRADA: "Hígado de tamaño y densidad normal, sin lesiones focales, . , vesícula biliar y via biliar sin alteraciones, . Uno, bárrafo, páncreas y celda pancrética sin alteraciones, ."

SALIDA:
"HÍGADO: De tamaño y densidad normal, sin lesiones focales.

VESÍCULA BILIAR Y VÍA BILIAR: Sin alteraciones.

PÁNCREAS Y CELDA PANCREÁTICA: Sin alteraciones."

**Texto a procesar:**
${text}

**IMPORTANTE: Devuelve ÚNICAMENTE el texto corregido y formateado. Sin explicaciones, sin comentarios adicionales, sin introducción, solo el informe médico procesado.**`,
            },
          ],
        }),
      });

      if (!response.ok) {
        throw new Error(`Error en mejora: ${response.status}`);
      }

      const reader = response.body?.getReader();
      if (!reader) {
        throw new Error('No se pudo leer la respuesta');
      }

      const decoder = new TextDecoder();
      let enhancedText = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value, { stream: true });
        const lines = chunk.split('\n');

        for (const line of lines) {
          if (line.startsWith('0:')) {
            try {
              const jsonStr = line.substring(2);
              const data = JSON.parse(jsonStr);
              if (data.type === 'text-delta' && data.textDelta) {
                enhancedText += data.textDelta;
              }
            } catch (e) {
              console.error('Error parsing chunk:', e);
            }
          }
        }
      }

      return enhancedText.trim();
    } catch (error) {
      console.error('Error enhancing transcription:', error);
      return text;
    }
  };

  const transcribeRecording = async (uri: string) => {
    setIsTranscribing(true);
    setError(null);
    setApiInfo(null);
    try {
      const formData = new FormData();
      
      const uriParts = uri.split('.');
      const fileType = uriParts[uriParts.length - 1];
      
      const audioFile = {
        uri,
        name: `recording.${fileType}`,
        type: `audio/${fileType}`,
      } as any;
      
      formData.append('audio', audioFile);
      
      const response = await fetch('https://toolkit.rork.com/stt/transcribe/', {
        method: 'POST',
        body: formData,
      });
      
      if (!response.ok) {
        if (response.status === 429) {
          const errorMsg = '⚠️ LÍMITE DE API ALCANZADO\n\nDemasiadas solicitudes en poco tiempo. La API de transcripción tiene límites de uso.\n\nPor favor, espera 30-60 segundos antes de volver a intentar.';
          setError(errorMsg);
          setApiInfo('ℹ️ Esta API tiene límites de tasa (rate limiting) para evitar abuso. Si necesitas transcribir múltiples audios, hazlo con pausas entre cada uno.');
          if (Platform.OS !== 'web') {
            Alert.alert(
              'Límite de API',
              errorMsg,
              [{ text: 'Entendido', style: 'default' }]
            );
          } else {
            alert(errorMsg);
          }
        }
        throw new Error(`Error en transcripción: ${response.status}`);
      }
      
      const result = await response.json();
      const rawTranscription = result.text;
      
      const aiProcessedText = await processVoiceCommandsWithAI(rawTranscription);
      
      const transcription = processVoiceCommands(aiProcessedText);
      
      const recordingId = recordings.find(r => r.uri === uri)?.id;
      
      setRecordings(prev => 
        prev.map(rec => 
          rec.uri === uri 
            ? { ...rec, transcription } 
            : rec
        )
      );
      
      console.log('Raw Transcription:', rawTranscription);
      console.log('AI Processed:', aiProcessedText);
      console.log('Transcription:', transcription);
      
      if (recordingId && transcriptionMode === 'ia') {
        const enhancedText = await enhanceTranscription(transcription);
        
        console.log('Enhanced Transcription:', enhancedText);
        
        setRecordings(prev =>
          prev.map(rec =>
            rec.id === recordingId
              ? { ...rec, transcription: enhancedText }
              : rec
          )
        );
      }
    } catch (error) {
      console.error('Error transcribing:', error);
      const errorMsg = error instanceof Error ? error.message : 'Error al transcribir el audio.';
      setError(`❌ ${errorMsg}`);
      if (Platform.OS !== 'web' && !errorMsg.includes('LÍMITE')) {
        Alert.alert('Error de transcripción', errorMsg);
      } else if (!errorMsg.includes('LÍMITE')) {
        alert(`Error de transcripción: ${errorMsg}`);
      }
    } finally {
      setIsTranscribing(false);
    }
  };

  const transcribeAudio = async (audioBlob: Blob) => {
    setIsTranscribing(true);
    setError(null);
    setApiInfo(null);
    try {
      const formData = new FormData();
      formData.append('audio', audioBlob, 'recording.webm');
      
      const response = await fetch('https://toolkit.rork.com/stt/transcribe/', {
        method: 'POST',
        body: formData,
      });
      
      if (!response.ok) {
        if (response.status === 429) {
          const errorMsg = '⚠️ LÍMITE DE API ALCANZADO\n\nDemasiadas solicitudes en poco tiempo. La API de transcripción tiene límites de uso.\n\nPor favor, espera 30-60 segundos antes de volver a intentar.';
          setError(errorMsg);
          setApiInfo('ℹ️ Esta API tiene límites de tasa (rate limiting) para evitar abuso. Si necesitas transcribir múltiples audios, hazlo con pausas entre cada uno.');
          if (Platform.OS !== 'web') {
            Alert.alert(
              'Límite de API',
              errorMsg,
              [{ text: 'Entendido', style: 'default' }]
            );
          } else {
            alert(errorMsg);
          }
        }
        throw new Error(`Error en transcripción: ${response.status}`);
      }
      
      const result = await response.json();
      const rawTranscription = result.text;
      
      const aiProcessedText = await processVoiceCommandsWithAI(rawTranscription);
      
      const transcription = processVoiceCommands(aiProcessedText);
      
      let recordingId: string | undefined;
      
      setRecordings(prev => {
        const firstRecording = prev[0];
        if (firstRecording) {
          recordingId = firstRecording.id;
          return prev.map((rec, index) => 
            index === 0 
              ? { ...rec, transcription } 
              : rec
          );
        }
        return prev;
      });
      
      console.log('Raw Transcription:', rawTranscription);
      console.log('AI Processed:', aiProcessedText);
      console.log('Transcription:', transcription);
      
      if (recordingId && transcriptionMode === 'ia') {
        const enhancedText = await enhanceTranscription(transcription);
        
        console.log('Enhanced Transcription:', enhancedText);
        
        setRecordings(prev =>
          prev.map(rec =>
            rec.id === recordingId
              ? { ...rec, transcription: enhancedText }
              : rec
          )
        );
      }
    } catch (error) {
      console.error('Error transcribing:', error);
      const errorMsg = error instanceof Error ? error.message : 'Error al transcribir el audio.';
      setError(`❌ ${errorMsg}`);
      if (Platform.OS !== 'web' && !errorMsg.includes('LÍMITE')) {
        Alert.alert('Error de transcripción', errorMsg);
      } else if (!errorMsg.includes('LÍMITE')) {
        alert(`Error de transcripción: ${errorMsg}`);
      }
    } finally {
      setIsTranscribing(false);
    }
  };

  const deleteRecording = (id: string) => {
    setRecordings(prev => prev.filter(rec => rec.id !== id));
  };

  const clearAllRecordings = () => {
    if (Platform.OS === 'web') {
      if (confirm('¿Estás seguro de que deseas eliminar todas las grabaciones?')) {
        setRecordings([]);
      }
    } else {
      Alert.alert(
        'Limpiar grabaciones',
        '¿Estás seguro de que deseas eliminar todas las grabaciones?',
        [
          { text: 'Cancelar', style: 'cancel' },
          { text: 'Limpiar', style: 'destructive', onPress: () => setRecordings([]) },
        ]
      );
    }
  };

  const copyToClipboard = async (text: string) => {
    try {
      await Clipboard.setStringAsync(text);
      console.log('Texto copiado al portapapeles');
    } catch (error) {
      console.error('Error al copiar al portapapeles:', error);
    }
  };

  const sendToAI = (text: string) => {
    router.push({
      pathname: '/(tabs)/recording',
      params: { initialText: text },
    });
  };

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  useEffect(() => {
    let interval: ReturnType<typeof setInterval> | undefined;
    if (isRecording && !isPaused) {
      interval = setInterval(() => {
        setRecordingDuration(prev => prev + 1);
      }, 1000);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isRecording, isPaused]);

  if (!user) {
    return (
      <View style={[styles.container, { backgroundColor: theme.background }]}>
        <View style={styles.loginPrompt}>
          <Mic size={64} color={theme.outline} />
          <Text style={[styles.loginText, { color: theme.onSurface }]}>
            Inicia sesión para acceder al Dictáfono
          </Text>
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <View style={[
        styles.header,
        {
          backgroundColor: theme.surface,
          borderBottomColor: theme.outline,
          paddingTop: insets.top,
        },
      ]}>
        <View style={styles.headerContent}>
          <Mic size={24} color={theme.primary} />
          <Text style={[styles.headerTitle, { color: theme.onSurface }]}>
            Dictáfono
          </Text>
        </View>
        <Text style={[styles.headerSubtitle, { color: theme.outline }]}>
          Graba y transcribe audio en tiempo real
        </Text>

        <View style={[styles.modeSelector, { backgroundColor: theme.surfaceVariant }]}>
          <TouchableOpacity
            onPress={() => setTranscriptionMode('ia')}
            style={[
              styles.modeSelectorButton,
              transcriptionMode === 'ia' && { backgroundColor: theme.primary },
              transcriptionMode !== 'ia' && { backgroundColor: 'transparent' }
            ]}
          >
            <Brain 
              size={18} 
              color={transcriptionMode === 'ia' ? theme.onPrimary : theme.onSurface} 
            />
            <Text style={[
              styles.modeSelectorText,
              { color: transcriptionMode === 'ia' ? theme.onPrimary : theme.onSurface }
            ]}>
              Modo IA
            </Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            onPress={() => setTranscriptionMode('natural')}
            style={[
              styles.modeSelectorButton,
              transcriptionMode === 'natural' && { backgroundColor: theme.primary },
              transcriptionMode !== 'natural' && { backgroundColor: 'transparent' }
            ]}
          >
            <Mic 
              size={18} 
              color={transcriptionMode === 'natural' ? theme.onPrimary : theme.onSurface} 
            />
            <Text style={[
              styles.modeSelectorText,
              { color: transcriptionMode === 'natural' ? theme.onPrimary : theme.onSurface }
            ]}>
              Modo Dictado
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView style={styles.content} contentContainerStyle={styles.contentContainer}>
        <View style={[styles.recordingCard, { backgroundColor: theme.surface, borderColor: theme.outline }]}>
          {transcriptionMode === 'ia' && (
            <>
              {isRecording && (
                <View style={styles.recordingIndicator}>
                  <View style={[styles.recordingDot, { backgroundColor: '#FF6B6B' }]} />
                  <Text style={[styles.recordingText, { color: '#FF6B6B' }]}>
                    Grabando
                  </Text>
                </View>
              )}

              <View style={styles.durationContainer}>
                <Text style={[styles.durationText, { color: theme.onSurface }]}>
                  {formatDuration(recordingDuration)}
                </Text>
              </View>

              <View style={styles.controlsContainer}>
                {!isRecording ? (
                  <TouchableOpacity
                    style={[styles.recordButton, { backgroundColor: theme.primary }]}
                    onPress={startRecording}
                  >
                    <Mic size={32} color="#FFFFFF" />
                  </TouchableOpacity>
                ) : (
                  <>
                    <TouchableOpacity
                      style={[styles.controlButton, { backgroundColor: theme.outline + '40' }]}
                      onPress={isPaused ? resumeRecording : pauseRecording}
                    >
                      {isPaused ? (
                        <Play size={24} color={theme.primary} />
                      ) : (
                        <Pause size={24} color={theme.primary} />
                      )}
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={[styles.stopButton, { backgroundColor: '#FF6B6B' }]}
                      onPress={stopRecording}
                    >
                      <Square size={24} color="#FFFFFF" />
                    </TouchableOpacity>
                  </>
                )}
              </View>

              {isTranscribing && (
                <View style={styles.transcribingContainer}>
                  <ActivityIndicator size="small" color={theme.primary} />
                  <Text style={[styles.transcribingText, { color: theme.outline }]}>
                    Procesando y mejorando transcripción...
                  </Text>
                </View>
              )}

              {error && (
                <View style={[styles.errorContainer, { backgroundColor: '#FEE2E2', borderColor: '#EF4444' }]}>
                  <Text style={[styles.errorText, { color: '#991B1B' }]}>
                    {error}
                  </Text>
                </View>
              )}

              {apiInfo && (
                <View style={[styles.infoContainer, { backgroundColor: '#DBEAFE', borderColor: '#3B82F6' }]}>
                  <Text style={[styles.infoText, { color: '#1E40AF' }]}>
                    {apiInfo}
                  </Text>
                </View>
              )}
            </>
          )}

          {transcriptionMode === 'natural' && (
            <>
              <Text style={[styles.naturalModeSubtitle, { color: theme.outline }]}>
                Usa el micrófono de tu teclado para dictar
              </Text>

              <View style={[styles.naturalInputContainer, { backgroundColor: theme.background, borderColor: theme.outline }]}>
                <TextInput
                  style={[styles.naturalInput, { color: theme.onSurface }]}
                  value={naturalText}
                  onChangeText={setNaturalText}
                  placeholder="Escribe o usa el micrófono del teclado..."
                  placeholderTextColor={theme.outline}
                  multiline
                  autoFocus
                  numberOfLines={8}
                  textAlignVertical="top"
                />
              </View>

              <View style={styles.naturalButtonsRow}>
                <TouchableOpacity
                  style={[styles.naturalCopyButton, { backgroundColor: '#10B981' }]}
                  onPress={() => {
                    if (naturalText.trim()) {
                      copyToClipboard(naturalText);
                    }
                  }}
                  disabled={!naturalText.trim()}
                >
                  <Copy size={20} color="#FFFFFF" />
                  <Text style={styles.naturalCopyButtonText}>Copiar</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.clearNaturalButton, { backgroundColor: theme.outline + '20' }]}
                  onPress={() => setNaturalText('')}
                >
                  <Eraser size={20} color={theme.outline} />
                  <Text style={[styles.clearNaturalButtonText, { color: theme.outline }]}>
                    Limpiar
                  </Text>
                </TouchableOpacity>
              </View>
            </>
          )}
        </View>

        {recordings.length > 0 && (
          <View style={styles.recordingsSection}>
            <View style={styles.sectionHeader}>
              <Text style={[styles.sectionTitle, { color: theme.onSurface }]}>
                Grabaciones
              </Text>
              <TouchableOpacity
                onPress={clearAllRecordings}
                style={[styles.clearButton, { backgroundColor: theme.outline + '20' }]}
              >
                <Eraser size={18} color="#FF6B6B" />
                <Text style={[styles.clearButtonText, { color: '#FF6B6B' }]}>
                  Limpiar
                </Text>
              </TouchableOpacity>
            </View>

            {recordings.map((rec) => (
              <View
                key={rec.id}
                style={[styles.recordingItem, { backgroundColor: theme.surface, borderColor: theme.outline }]}
              >
                <View style={styles.recordingHeader}>
                  <FileText size={20} color={theme.primary} />
                  <View style={styles.recordingInfo}>
                    <Text style={[styles.recordingDate, { color: theme.onSurface }]}>
                      {rec.date.toLocaleString('es-ES')}
                    </Text>
                    <Text style={[styles.recordingDuration, { color: theme.outline }]}>
                      {formatDuration(rec.duration)}
                    </Text>
                  </View>
                  <TouchableOpacity
                    onPress={() => deleteRecording(rec.id)}
                    style={styles.deleteButton}
                  >
                    <Trash2 size={20} color="#FF6B6B" />
                  </TouchableOpacity>
                </View>

                {rec.transcription && (
                  <View style={styles.transcriptionWrapper}>
                    {correctingGrammar === rec.id && (
                      <View style={styles.correctingContainer}>
                        <ActivityIndicator size="small" color={theme.primary} />
                        <Sparkles size={16} color={theme.primary} />
                        <Text style={[styles.correctingText, { color: theme.primary }]}>
                          Corrigiendo gramática...
                        </Text>
                      </View>
                    )}
                    
                    <TouchableOpacity
                      onPress={() => copyToClipboard(rec.transcription!)}
                      activeOpacity={0.7}
                      style={[styles.transcriptionContainer, { backgroundColor: theme.background }]}
                    >
                      <Text style={[styles.transcriptionText, { color: theme.onSurface }]}>
                        {rec.transcription}
                      </Text>
                    </TouchableOpacity>
                    
                    <TouchableOpacity
                      onPress={() => sendToAI(rec.transcription!)}
                      style={[styles.sendToAIButton, { backgroundColor: '#10B981' }]}
                    >
                      <Send size={18} color="#FFFFFF" />
                      <Text style={styles.sendToAIButtonText}>
                        Enviar a IA
                      </Text>
                    </TouchableOpacity>
                  </View>
                )}
              </View>
            ))}
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 4,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '600',
  },
  headerSubtitle: {
    fontSize: 14,
    marginTop: 4,
    marginBottom: 12,
  },
  modeSelector: {
    flexDirection: 'row',
    borderRadius: 12,
    padding: 4,
    marginTop: 8,
  },
  modeSelectorButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 8,
    gap: 6,
  },
  modeSelectorText: {
    fontSize: 14,
    fontWeight: '600',
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    padding: 16,
  },
  recordingCard: {
    borderRadius: 16,
    padding: 24,
    borderWidth: 1,
    alignItems: 'center',
  },
  recordingIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 16,
  },
  recordingDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  recordingText: {
    fontSize: 14,
    fontWeight: '600',
  },
  durationContainer: {
    marginBottom: 24,
  },
  durationText: {
    fontSize: 48,
    fontWeight: '600',
    fontVariant: ['tabular-nums'] as any,
  },
  controlsContainer: {
    flexDirection: 'row',
    gap: 16,
    alignItems: 'center',
  },
  recordButton: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  controlButton: {
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
  },
  stopButton: {
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
  },
  transcribingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 16,
  },
  transcribingText: {
    fontSize: 14,
    fontStyle: 'italic',
  },
  loginPrompt: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  loginText: {
    fontSize: 16,
    textAlign: 'center',
    lineHeight: 24,
    marginTop: 16,
  },
  recordingsSection: {
    marginTop: 24,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
  },
  clearButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 10,
  },
  clearButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  recordingItem: {
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    marginBottom: 12,
  },
  recordingHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  recordingInfo: {
    flex: 1,
  },
  recordingDate: {
    fontSize: 14,
    fontWeight: '500',
    marginBottom: 2,
  },
  recordingDuration: {
    fontSize: 12,
  },
  deleteButton: {
    padding: 4,
  },
  transcriptionWrapper: {
    marginTop: 12,
    gap: 8,
  },
  transcriptionContainer: {
    padding: 12,
    borderRadius: 8,
  },
  transcriptionText: {
    fontSize: 14,
    lineHeight: 20,
  },
  sendToAIButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
  },
  sendToAIButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  correctingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 8,
  },
  correctingText: {
    fontSize: 13,
    fontWeight: '500',
  },
  naturalModeSubtitle: {
    fontSize: 14,
    marginBottom: 16,
    textAlign: 'center',
  },
  naturalInputContainer: {
    width: '100%',
    borderRadius: 12,
    borderWidth: 1,
    padding: 12,
    minHeight: 200,
    marginBottom: 16,
  },
  naturalInput: {
    fontSize: 16,
    lineHeight: 24,
    minHeight: 176,
  },
  naturalButtonsRow: {
    flexDirection: 'row',
    gap: 12,
    width: '100%',
  },
  naturalCopyButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 12,
    borderRadius: 8,
  },
  naturalCopyButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  clearNaturalButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 12,
    borderRadius: 8,
  },
  clearNaturalButtonText: {
    fontSize: 15,
    fontWeight: '600',
  },
  errorContainer: {
    marginTop: 16,
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    width: '100%',
  },
  errorText: {
    fontSize: 13,
    lineHeight: 18,
    textAlign: 'center',
  },
  infoContainer: {
    marginTop: 8,
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    width: '100%',
  },
  infoText: {
    fontSize: 12,
    lineHeight: 16,
    textAlign: 'center',
  },
});
