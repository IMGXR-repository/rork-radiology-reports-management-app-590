import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
} from 'react-native';
import * as Clipboard from 'expo-clipboard';
import { Copy, Eraser, Brain } from 'lucide-react-native';
import { useApp } from '@/contexts/AppContext';
import { lightTheme, darkTheme } from '@/constants/theme';

export default function DictaphoneNaturalScreen() {
  const { settings } = useApp();
  const theme = settings?.theme === 'dark' ? darkTheme : lightTheme;
  const [naturalText, setNaturalText] = useState<string>('');
  const textInputRef = useRef<TextInput>(null);

  useEffect(() => {
    setTimeout(() => {
      textInputRef.current?.focus();
    }, 100);
  }, []);

  const copyToClipboard = async (text: string) => {
    try {
      await Clipboard.setStringAsync(text);
      console.log('Texto copiado al portapapeles');
    } catch (error) {
      console.error('Error al copiar al portapapeles:', error);
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <View style={styles.content}>
        <View style={[styles.card, { backgroundColor: theme.surface, borderColor: theme.outline }]}>
          <View style={styles.header}>
            <Brain size={24} color="#10B981" />
            <Text style={[styles.title, { color: theme.onSurface }]}>
              Modo Natural
            </Text>
          </View>
          
          <Text style={[styles.subtitle, { color: theme.outline }]}>
            Usa el micrófono de tu teclado para dictar
          </Text>

          <View style={[styles.inputContainer, { backgroundColor: theme.background, borderColor: theme.outline }]}>
            <TextInput
              ref={textInputRef}
              style={[styles.input, { color: theme.onSurface }]}
              value={naturalText}
              onChangeText={setNaturalText}
              placeholder="Escribe o usa el micrófono del teclado..."
              placeholderTextColor={theme.outline}
              multiline
              numberOfLines={8}
              textAlignVertical="top"
            />
          </View>

          <View style={styles.buttonsRow}>
            <TouchableOpacity
              style={[styles.copyButton, { backgroundColor: '#10B981' }]}
              onPress={() => {
                if (naturalText.trim()) {
                  copyToClipboard(naturalText);
                }
              }}
              disabled={!naturalText.trim()}
            >
              <Copy size={20} color="#FFFFFF" />
              <Text style={styles.copyButtonText}>Copiar</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.clearButton, { backgroundColor: theme.outline + '20' }]}
              onPress={() => setNaturalText('')}
            >
              <Eraser size={20} color={theme.outline} />
              <Text style={[styles.clearButtonText, { color: theme.outline }]}>
                Limpiar
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
    padding: 16,
  },
  card: {
    borderRadius: 16,
    padding: 24,
    borderWidth: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  title: {
    fontSize: 20,
    fontWeight: '600',
  },
  subtitle: {
    fontSize: 14,
    marginBottom: 16,
    textAlign: 'center',
  },
  inputContainer: {
    width: '100%',
    borderRadius: 12,
    borderWidth: 1,
    padding: 12,
    minHeight: 200,
    marginBottom: 16,
  },
  input: {
    fontSize: 16,
    lineHeight: 24,
    minHeight: 176,
  },
  buttonsRow: {
    flexDirection: 'row',
    gap: 12,
    width: '100%',
  },
  copyButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 12,
    borderRadius: 8,
  },
  copyButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  clearButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 12,
    borderRadius: 8,
  },
  clearButtonText: {
    fontSize: 15,
    fontWeight: '600',
  },
});
