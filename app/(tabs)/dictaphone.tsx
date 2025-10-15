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
} from 'react-native';
import * as Clipboard from 'expo-clipboard';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Mic, Square, Play, Pause, Trash2, FileText, Eraser, Send } from 'lucide-react-native';
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


  useEffect(() => {
    if (Platform.OS !== 'web') {
      setupAudioMode();
    }
  }, []);

  const setupAudioMode = async () => {
    try {
      await Audio.requestPermissionsAsync();
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
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
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
      if (Platform.OS === 'web') {
        alert('Error al iniciar la grabación. Verifica los permisos del micrófono.');
      } else {
        Alert.alert('Error', 'Error al iniciar la grabación. Verifica los permisos del micrófono.');
      }
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
      if (Platform.OS === 'web') {
        alert('Error al detener la grabación.');
      } else {
        Alert.alert('Error', 'Error al detener la grabación.');
      }
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
    
    processed = processed.replace(/\bnuevo párrafo\b/gi, '\n\n__CAPITALIZE__');
    processed = processed.replace(/\bnueva línea\b/gi, '\n__CAPITALIZE__');
    
    processed = processed.replace(/__CAPITALIZE__\s*(\w)/g, (match, letter) => {
      return letter.toUpperCase();
    });
    
    return processed;
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
      const transcription = processVoiceCommands(rawTranscription);
      
      setRecordings(prev => 
        prev.map(rec => 
          rec.uri === uri 
            ? { ...rec, transcription } 
            : rec
        )
      );
      
      console.log('Raw Transcription:', rawTranscription);
      console.log('Processed Transcription:', transcription);
    } catch (error) {
      console.error('Error transcribing:', error);
      if (Platform.OS === 'web') {
        alert('Error al transcribir el audio.');
      } else {
        Alert.alert('Error', 'Error al transcribir el audio.');
      }
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
      const transcription = processVoiceCommands(rawTranscription);
      
      setRecordings(prev => {
        const firstRecording = prev[0];
        if (firstRecording) {
          return prev.map((rec, index) => 
            index === 0 
              ? { ...rec, transcription } 
              : rec
          );
        }
        return prev;
      });
      
      console.log('Raw Transcription:', rawTranscription);
      console.log('Processed Transcription:', transcription);
    } catch (error) {
      console.error('Error transcribing:', error);
      alert('Error al transcribir el audio.');
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
      if (Platform.OS === 'web') {
        alert('Texto copiado al portapapeles');
      } else {
        Alert.alert('Éxito', 'Texto copiado al portapapeles');
      }
    } catch (error) {
      console.error('Error copying to clipboard:', error);
      if (Platform.OS === 'web') {
        alert('Error al copiar al portapapeles');
      } else {
        Alert.alert('Error', 'Error al copiar al portapapeles');
      }
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
      </View>

      <ScrollView style={styles.content} contentContainerStyle={styles.contentContainer}>
        <View style={[styles.recordingCard, { backgroundColor: theme.surface, borderColor: theme.outline }]}>
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
                Transcribiendo audio...
              </Text>
            </View>
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
});
