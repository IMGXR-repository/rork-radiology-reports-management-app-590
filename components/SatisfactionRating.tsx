import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Modal } from 'react-native';
import { Star, X } from 'lucide-react-native';
import { useApp } from '@/contexts/AppContext';
import { lightTheme, darkTheme } from '@/constants/theme';

interface SatisfactionRatingProps {
  visible: boolean;
  onClose: () => void;
}

export default function SatisfactionRating({ visible, onClose }: SatisfactionRatingProps) {
  const { settings, stats, setSatisfactionRating } = useApp();
  const theme = settings.theme === 'dark' ? darkTheme : lightTheme;
  const [selectedRating, setSelectedRating] = useState<number>(stats.appSatisfactionRating || 0);
  const [hoveredRating, setHoveredRating] = useState<number>(0);

  const handleRatingSubmit = async () => {
    if (selectedRating > 0) {
      await setSatisfactionRating(selectedRating);
      onClose();
    }
  };

  const renderStar = (index: number) => {
    const isFilled = index <= (hoveredRating || selectedRating);
    return (
      <TouchableOpacity
        key={index}
        onPress={() => setSelectedRating(index)}
        onPressIn={() => setHoveredRating(index)}
        onPressOut={() => setHoveredRating(0)}
        style={styles.starButton}
        testID={`satisfaction-star-${index}`}
      >
        <Star
          size={32}
          color={isFilled ? theme.warning : theme.outline}
          fill={isFilled ? theme.warning : 'transparent'}
        />
      </TouchableOpacity>
    );
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <View style={[styles.container, { backgroundColor: theme.surface }]}>
          <View style={styles.header}>
            <Text style={[styles.title, { color: theme.onSurface }]}>
              ¿Qué tan satisfecho estás con la app?
            </Text>
            <TouchableOpacity
              onPress={onClose}
              style={[styles.closeButton, { backgroundColor: theme.outline + '20' }]}
              testID="close-satisfaction-modal"
            >
              <X size={20} color={theme.onSurface} />
            </TouchableOpacity>
          </View>

          <Text style={[styles.subtitle, { color: theme.outline }]}>
            Tu opinión nos ayuda a mejorar
          </Text>

          <View style={styles.starsContainer}>
            {[1, 2, 3, 4, 5].map(renderStar)}
          </View>

          <View style={styles.ratingLabels}>
            <Text style={[styles.ratingLabel, { color: theme.outline }]}>Muy malo</Text>
            <Text style={[styles.ratingLabel, { color: theme.outline }]}>Excelente</Text>
          </View>

          <View style={styles.actions}>
            <TouchableOpacity
              onPress={onClose}
              style={[styles.button, styles.cancelButton, { borderColor: theme.outline }]}
              testID="cancel-satisfaction"
            >
              <Text style={[styles.buttonText, { color: theme.outline }]}>Cancelar</Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              onPress={handleRatingSubmit}
              style={[
                styles.button,
                styles.submitButton,
                { backgroundColor: selectedRating > 0 ? theme.primary : theme.outline + '40' }
              ]}
              disabled={selectedRating === 0}
              testID="submit-satisfaction"
            >
              <Text style={[
                styles.buttonText,
                { color: selectedRating > 0 ? theme.onPrimary : theme.outline }
              ]}>
                Enviar
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  container: {
    width: '100%',
    maxWidth: 400,
    borderRadius: 16,
    padding: 24,
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    flex: 1,
    marginRight: 12,
  },
  closeButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  subtitle: {
    fontSize: 14,
    marginBottom: 24,
  },
  starsContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  starButton: {
    padding: 8,
    marginHorizontal: 4,
  },
  ratingLabels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 32,
    paddingHorizontal: 8,
  },
  ratingLabel: {
    fontSize: 12,
  },
  actions: {
    flexDirection: 'row',
    gap: 12,
  },
  button: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelButton: {
    borderWidth: 1,
  },
  submitButton: {
    // backgroundColor set dynamically
  },
  buttonText: {
    fontSize: 14,
    fontWeight: '500',
  },
});