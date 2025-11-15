import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { useApp } from '@/contexts/AppContext';
import { lightTheme, darkTheme } from '@/constants/theme';
import { useTranslation } from '@/hooks/useTranslation';
import { generateText } from '@rork-ai/toolkit-sdk';
import * as Clipboard from 'expo-clipboard';
import CustomSlider from '@/components/CustomSlider';
import { Stack } from 'expo-router';

export default function IterateScreen() {
  const { settings } = useApp();
  const theme = settings?.theme === 'dark' ? darkTheme : lightTheme;
  const { t } = useTranslation();
  
  const placeholderColor = 'textSecondary' in theme ? (theme as typeof lightTheme).textSecondary : theme.onSurface + '80';

  const [inputText, setInputText] = useState<string>('');
  const [outputText, setOutputText] = useState<string>('');
  const [mode, setMode] = useState<'narrative' | 'structured'>('narrative');
  const [level, setLevel] = useState<number>(50);
  const [fidelity, setFidelity] = useState<number>(50);
  const [isProcessing, setIsProcessing] = useState<boolean>(false);

  const handleGenerate = async () => {
    if (!inputText.trim()) {
      Alert.alert(t.common.error, 'Por favor, ingresa un texto para procesar');
      return;
    }

    setIsProcessing(true);
    console.log('🔄 [Iterate] Starting text transformation');
    console.log(`📝 [Iterate] Mode: ${mode}`);
    console.log(`📊 [Iterate] Level: ${level}%`);
    console.log(`🎯 [Iterate] Fidelity: ${fidelity}%`);

    try {
      const modeLabel = mode === 'narrative' ? 'narrativo' : 'estructurado';
      const prompt = `Eres un asistente médico especializado en reescribir textos médicos.

TEXTO ORIGINAL:
${inputText}

INSTRUCCIONES:
- Modo: ${modeLabel}
${mode === 'narrative' 
  ? `- Grado narrativo: ${level}% (${level < 33 ? 'poco narrativo, más directo' : level < 66 ? 'moderadamente narrativo' : 'muy narrativo, descriptivo y fluido'})
- Reescribe el texto en formato narrativo usando párrafos coherentes (1 a 3 párrafos)
- Mantén un flujo natural y descriptivo` 
  : `- Grado de estructuración: ${level}% (${level < 33 ? 'poco estructurado' : level < 66 ? 'moderadamente estructurado' : 'muy estructurado con listas y viñetas'})
- Usa formato estructurado con secciones claras
- Organiza la información de forma esquemática`}
- Respeto al texto original: ${fidelity}% (${fidelity < 33 ? 'permite interpretación libre y parafraseo' : fidelity < 66 ? 'mantén las ideas principales' : 'respeta literalmente el contenido original'})

IMPORTANTE: 
- Devuelve SOLO el texto reescrito, sin explicaciones adicionales
- Mantén el contexto médico y la precisión técnica
- Adapta el tono y estructura según los parámetros indicados`;

      const result = await generateText({ messages: [{ role: 'user', content: prompt }] });
      
      console.log('✅ [Iterate] Text transformation completed');
      setOutputText(result);
    } catch (error) {
      console.error('❌ [Iterate] Error generating text:', error);
      Alert.alert(
        t.common.error,
        'Error al generar el texto. Por favor, intenta de nuevo.'
      );
    } finally {
      setIsProcessing(false);
    }
  };

  const handleClear = () => {
    setInputText('');
    setOutputText('');
    console.log('🗑️ [Iterate] Content cleared');
  };

  const handleCopy = async () => {
    if (outputText.trim()) {
      await Clipboard.setStringAsync(outputText);
      console.log('📋 [Iterate] Text copied to clipboard');
    }
  };

  const styles = createStyles(theme);

  return (
    <View style={styles.container}>
      <Stack.Screen options={{ title: t.iterate.title, headerShown: true }} />
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.section}>
            <Text style={styles.label}>{t.iterate.inputLabel}</Text>
            <TextInput
              style={styles.textInput}
              value={inputText}
              onChangeText={setInputText}
              placeholder={t.iterate.inputPlaceholder}
              placeholderTextColor={placeholderColor}
              multiline
              textAlignVertical="top"
            />
          </View>

          <View style={styles.section}>
            <Text style={styles.label}>{t.iterate.mode}</Text>
            <View style={styles.modeContainer}>
              <TouchableOpacity
                style={[
                  styles.modeButton,
                  mode === 'narrative' && styles.modeButtonActive,
                ]}
                onPress={() => {
                  setMode('narrative');
                  console.log('🔄 [Iterate] Mode changed to: narrative');
                }}
              >
                <Text
                  style={[
                    styles.modeButtonText,
                    mode === 'narrative' && styles.modeButtonTextActive,
                  ]}
                >
                  {t.iterate.narrative}
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.modeButton,
                  mode === 'structured' && styles.modeButtonActive,
                ]}
                onPress={() => {
                  setMode('structured');
                  console.log('🔄 [Iterate] Mode changed to: structured');
                }}
              >
                <Text
                  style={[
                    styles.modeButtonText,
                    mode === 'structured' && styles.modeButtonTextActive,
                  ]}
                >
                  {t.iterate.structured}
                </Text>
              </TouchableOpacity>
            </View>
          </View>

          <View style={styles.section}>
            <View style={styles.sliderHeader}>
              <Text style={styles.label}>
                {mode === 'narrative' ? t.iterate.narrativeLevel : t.iterate.structuredLevel}
              </Text>
              <Text style={styles.valueText}>{level}%</Text>
            </View>
            <CustomSlider
              value={level}
              minimumValue={0}
              maximumValue={100}
              step={1}
              onValueChange={setLevel}
              minimumTrackTintColor={theme.primary}
              maximumTrackTintColor={theme.outline}
              thumbTintColor={theme.primary}
            />
          </View>

          <View style={styles.section}>
            <View style={styles.sliderHeader}>
              <Text style={styles.label}>{t.iterate.fidelityLevel}</Text>
              <Text style={styles.valueText}>{fidelity}%</Text>
            </View>
            <CustomSlider
              value={fidelity}
              minimumValue={0}
              maximumValue={100}
              step={1}
              onValueChange={setFidelity}
              minimumTrackTintColor={theme.primary}
              maximumTrackTintColor={theme.outline}
              thumbTintColor={theme.primary}
            />
          </View>

          <View style={styles.buttonRow}>
            <TouchableOpacity
              style={[styles.button, styles.generateButton]}
              onPress={handleGenerate}
              disabled={isProcessing}
            >
              {isProcessing ? (
                <ActivityIndicator color="#FFFFFF" />
              ) : (
                <Text style={styles.generateButtonText}>{t.iterate.generate}</Text>
              )}
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.button, styles.clearButton]}
              onPress={handleClear}
              disabled={isProcessing}
            >
              <Text style={styles.clearButtonText}>{t.iterate.clear}</Text>
            </TouchableOpacity>
          </View>

          {outputText ? (
            <View style={styles.section}>
              <View style={styles.outputHeader}>
                <Text style={styles.label}>{t.iterate.outputLabel}</Text>
                <TouchableOpacity onPress={handleCopy} style={styles.copyButton}>
                  <Text style={styles.copyButtonText}>{t.iterate.copy}</Text>
                </TouchableOpacity>
              </View>
              <View style={styles.outputContainer}>
                <Text style={styles.outputText}>{outputText}</Text>
              </View>
            </View>
          ) : null}
        </ScrollView>
    </View>
  );
}

function createStyles(theme: typeof lightTheme | typeof darkTheme) {
  return StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.background,
    },
    scrollView: {
      flex: 1,
    },
    scrollContent: {
      padding: 16,
      gap: 20,
    },
    section: {
      gap: 8,
    },
    label: {
      fontSize: 16,
      fontWeight: '600' as const,
      color: theme.onBackground,
      marginBottom: 4,
    },
    textInput: {
      backgroundColor: theme.surface,
      borderRadius: 12,
      padding: 16,
      fontSize: 15,
      color: theme.onSurface,
      minHeight: 150,
      borderWidth: 1,
      borderColor: theme.outline,
    },
    modeContainer: {
      flexDirection: 'row',
      gap: 12,
    },
    modeButton: {
      flex: 1,
      paddingVertical: 12,
      paddingHorizontal: 16,
      borderRadius: 12,
      backgroundColor: theme.surface,
      borderWidth: 2,
      borderColor: theme.outline,
      alignItems: 'center',
    },
    modeButtonActive: {
      backgroundColor: theme.primary,
      borderColor: theme.primary,
    },
    modeButtonText: {
      fontSize: 15,
      fontWeight: '600' as const,
      color: theme.onSurface,
    },
    modeButtonTextActive: {
      color: '#FFFFFF',
    },
    sliderHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
    },
    valueText: {
      fontSize: 15,
      fontWeight: '600' as const,
      color: theme.primary,
    },
    buttonRow: {
      flexDirection: 'row',
      gap: 12,
      marginTop: 8,
    },
    button: {
      flex: 1,
      paddingVertical: 14,
      borderRadius: 12,
      alignItems: 'center',
      justifyContent: 'center',
      minHeight: 48,
    },
    generateButton: {
      backgroundColor: theme.primary,
    },
    generateButtonText: {
      fontSize: 16,
      fontWeight: '600' as const,
      color: '#FFFFFF',
    },
    clearButton: {
      backgroundColor: theme.surface,
      borderWidth: 1,
      borderColor: theme.outline,
    },
    clearButtonText: {
      fontSize: 16,
      fontWeight: '600' as const,
      color: theme.onSurface,
    },
    outputHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
    },
    copyButton: {
      paddingVertical: 6,
      paddingHorizontal: 12,
      borderRadius: 8,
      backgroundColor: theme.primary,
    },
    copyButtonText: {
      fontSize: 14,
      fontWeight: '600' as const,
      color: '#FFFFFF',
    },
    outputContainer: {
      backgroundColor: theme.surface,
      borderRadius: 12,
      padding: 16,
      borderWidth: 1,
      borderColor: theme.outline,
      minHeight: 150,
    },
    outputText: {
      fontSize: 15,
      color: theme.onSurface,
      lineHeight: 22,
    },
  });
}
