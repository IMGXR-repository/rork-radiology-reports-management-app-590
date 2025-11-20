import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  StyleSheet,
  TouchableOpacity,
  Platform,
  ActivityIndicator,
} from 'react-native';
import * as Clipboard from 'expo-clipboard';
import { Mic, Square } from 'lucide-react-native';
import { useApp } from '@/contexts/AppContext';
import { lightTheme, darkTheme } from '@/constants/theme';
import { Audio } from 'expo-av';

const BROADCAST_CHANNEL_NAME = 'radia-app-sync';

export default function DictaphoneMiniScreen() {
  const { settings, addSavedTranscription } = useApp();
  const theme = settings?.theme === 'dark' ? darkTheme : lightTheme;

  const [isRecording, setIsRecording] = useState<boolean>(false);
  const [recording, setRecording] = useState<Audio.Recording | null>(null);
  const [isTranscribing, setIsTranscribing] = useState<boolean>(false);
  const [recordingDuration, setRecordingDuration] = useState<number>(0);
  const [mediaRecorder, setMediaRecorder] = useState<MediaRecorder | null>(null);
  const broadcastChannelRef = useRef<BroadcastChannel | null>(null);

  useEffect(() => {
    if (Platform.OS === 'web' && typeof BroadcastChannel !== 'undefined') {
      broadcastChannelRef.current = new BroadcastChannel(BROADCAST_CHANNEL_NAME);
      console.log('📡 [Mini] BroadcastChannel inicializado');
      
      return () => {
        broadcastChannelRef.current?.close();
      };
    }
  }, []);

  const startRecording = async () => {
    try {
      if (Platform.OS === 'web') {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true }).catch((error) => {
          console.error('Error al solicitar permisos de micrófono:', error);
          alert('Permiso de micrófono denegado. Por favor, permite el acceso al micrófono.');
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
          alert('Se requieren permisos de micrófono para grabar.');
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
      alert('Error al iniciar la grabación.');
    }
  };

  const stopRecording = async () => {
    try {
      if (Platform.OS === 'web') {
        if (mediaRecorder && mediaRecorder.state !== 'inactive') {
          mediaRecorder.stop();
        }
        setIsRecording(false);
        setMediaRecorder(null);
      } else {
        if (!recording) return;

        await recording.stopAndUnloadAsync();
        const uri = recording.getURI();
        
        if (uri) {
          await Audio.setAudioModeAsync({
            allowsRecordingIOS: false,
          });
          
          await transcribeRecording(uri);
        }

        setRecording(null);
        setIsRecording(false);
      }
    } catch (error) {
      console.error('Error stopping recording:', error);
      alert('Error al detener la grabación.');
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
        throw new Error(`Error en transcripción: ${response.status}`);
      }
      
      const result = await response.json();
      const rawTranscription = result.text;
      
      const aiProcessedText = await processVoiceCommandsWithAI(rawTranscription);
      const transcription = processVoiceCommands(aiProcessedText);
      const enhancedText = await enhanceTranscription(transcription);
      
      if (enhancedText) {
        await addSavedTranscription(enhancedText, 'ia');
        await Clipboard.setStringAsync(enhancedText);
        
        if (broadcastChannelRef.current) {
          console.log('📶 [Mini] Enviando notificación de transcripción (móvil)...');
          broadcastChannelRef.current.postMessage({ type: 'transcription-added' });
        }
      }
    } catch (error) {
      console.error('Error transcribing:', error);
      alert('Error al transcribir el audio.');
    } finally {
      setIsTranscribing(false);
    }
  };

  const transcribeAudio = async (audioBlob: Blob) => {
    setIsTranscribing(true);
    try {
      const formData = new FormData();
      formData.append('audio', audioBlob, 'recording.webm');
      
      const response = await fetch('https://toolkit.rork.com/stt/transcribe/', {
        method: 'POST',
        body: formData,
      });
      
      if (!response.ok) {
        throw new Error(`Error en transcripción: ${response.status}`);
      }
      
      const result = await response.json();
      const rawTranscription = result.text;
      
      const aiProcessedText = await processVoiceCommandsWithAI(rawTranscription);
      const transcription = processVoiceCommands(aiProcessedText);
      const enhancedText = await enhanceTranscription(transcription);
      
      if (enhancedText) {
        await addSavedTranscription(enhancedText, 'ia');
        await Clipboard.setStringAsync(enhancedText);
        
        if (broadcastChannelRef.current) {
          console.log('📶 [Mini] Enviando notificación de transcripción (web)...');
          broadcastChannelRef.current.postMessage({ type: 'transcription-added' });
        }
      }
    } catch (error) {
      console.error('Error transcribing:', error);
      alert('Error al transcribir el audio.');
    } finally {
      setIsTranscribing(false);
    }
  };



  useEffect(() => {
    let interval: ReturnType<typeof setInterval> | undefined;
    if (isRecording) {
      interval = setInterval(() => {
        setRecordingDuration(prev => prev + 1);
      }, 1000);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isRecording]);

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <View style={[styles.content, { backgroundColor: 'transparent' }]}>
        <TouchableOpacity
          style={[
            styles.recordButton,
            { backgroundColor: isRecording ? '#FF6B6B' : theme.primary }
          ]}
          onPress={isRecording ? stopRecording : startRecording}
          disabled={isTranscribing}
        >
          {isTranscribing ? (
            <ActivityIndicator size="small" color="#FFFFFF" />
          ) : isRecording ? (
            <Square size={18} color="#FFFFFF" fill="#FFFFFF" />
          ) : (
            <Mic size={18} color="#FFFFFF" />
          )}
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    padding: 0,
    alignItems: 'center',
    justifyContent: 'center',
  },
  recordButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3,
    elevation: 5,
  },
});
