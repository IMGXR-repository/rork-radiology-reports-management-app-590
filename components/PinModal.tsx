import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, Modal, StyleSheet, Platform, TextInput, Keyboard } from 'react-native';
import { Lock, X } from 'lucide-react-native';

interface PinModalProps {
  visible: boolean;
  onClose: () => void;
  onSuccess: () => void;
  expectedPin: string;
  userName: string;
}

export const PinModal: React.FC<PinModalProps> = ({ 
  visible, 
  onClose, 
  onSuccess, 
  expectedPin, 
  userName 
}) => {
  const [enteredPin, setEnteredPin] = useState('');
  const [error, setError] = useState('');
  const [attempts, setAttempts] = useState(0);
  const maxAttempts = 3;

  useEffect(() => {
    if (visible) {
      setEnteredPin('');
      setError('');
      setAttempts(0);
    }
  }, [visible]);



  const handlePinChange = (text: string) => {
    const numericText = text.replace(/[^0-9]/g, '');
    if (numericText.length <= 4) {
      setEnteredPin(numericText);
      setError('');
      
      if (numericText.length === 4) {
        Keyboard.dismiss();
        setTimeout(() => {
          if (numericText === expectedPin) {
            onSuccess();
          } else {
            const newAttempts = attempts + 1;
            setAttempts(newAttempts);
            
            if (newAttempts >= maxAttempts) {
              setError(`Demasiados intentos fallidos. Cierra la aplicación y vuelve a intentarlo.`);
            } else {
              setError(`PIN incorrecto. Intentos restantes: ${maxAttempts - newAttempts}`);
            }
            setEnteredPin('');
          }
        }, 100);
      }
    }
  };

  const renderPinInput = () => {
    return (
      <View style={styles.pinInputContainer}>
        <TextInput
          style={styles.pinInput}
          value={enteredPin}
          onChangeText={handlePinChange}
          placeholder="Ingresa tu PIN"
          placeholderTextColor="#999"
          maxLength={4}
          secureTextEntry
          keyboardType="number-pad"
          textAlign="center"
          autoFocus
          editable={attempts < maxAttempts}
        />
      </View>
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
        <View style={styles.modal}>
          <View style={styles.header}>
            <View style={styles.iconContainer}>
              <Lock size={24} color="#007AFF" />
            </View>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <X size={20} color="#666" />
            </TouchableOpacity>
          </View>

          <Text style={styles.title}>Bienvenido de vuelta</Text>
          <Text style={styles.subtitle}>
            Hola {userName}, ingresa tu PIN para continuar
          </Text>

          {renderPinInput()}

          {error ? (
            <Text style={styles.errorText}>{error}</Text>
          ) : null}
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modal: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 24,
    width: '100%',
    maxWidth: 350,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.25,
        shadowRadius: 12,
      },
      android: {
        elevation: 8,
      },
      web: {
        boxShadow: '0 4px 12px rgba(0, 0, 0, 0.25)',
      },
    }),
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F0F8FF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  closeButton: {
    padding: 4,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1a1a1a',
    marginBottom: 8,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    marginBottom: 32,
    lineHeight: 22,
    textAlign: 'center',
  },
  pinInputContainer: {
    marginBottom: 24,
    paddingHorizontal: 20,
  },
  pinInput: {
    height: 50,
    borderWidth: 1,
    borderColor: '#E5E5E5',
    borderRadius: 8,
    backgroundColor: '#FFFFFF',
    fontSize: 14,
    color: '#1a1a1a',
    paddingHorizontal: 12,
  },
  errorText: {
    color: '#FF3B30',
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 16,
    lineHeight: 18,
  },

});