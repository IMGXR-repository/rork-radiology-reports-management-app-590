import React from 'react';
import { View, Text, TouchableOpacity, Modal, StyleSheet, Platform } from 'react-native';
import { QrCode } from 'lucide-react-native';
import { RadiaLogo } from './RadiaLogo';

interface QRSyncModalProps {
  visible: boolean;
  onClose: () => void;
  userSyncCode: string;
  userName?: string;
}

export const QRSyncModal: React.FC<QRSyncModalProps> = ({ visible, onClose, userSyncCode, userName = 'Usuario' }) => {
  const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=${encodeURIComponent(userSyncCode)}`;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <View style={styles.modal}>
          <View style={styles.logoSection}>
            <RadiaLogo size="medium" showText={true} />
          </View>

          <Text style={styles.title}>
            ¡Bienvenido, {userName}!
          </Text>
          
          <Text style={styles.subtitle}>
            Vincula desde tu app móvil para sincronizar tu cuenta
          </Text>

          <View style={styles.qrCard}>
            <View style={styles.qrHeader}>
              <QrCode size={24} color="#007AFF" />
              <Text style={styles.qrTitle}>Tu código único de sincronización</Text>
            </View>
            
            <View style={styles.qrContainer}>
              {Platform.OS === 'web' ? (
                <img 
                  src={qrCodeUrl} 
                  alt="QR Code" 
                  style={{ width: 250, height: 250, borderRadius: 12 }}
                />
              ) : (
                <View style={styles.qrPlaceholder}>
                  <QrCode size={100} color="#007AFF" />
                </View>
              )}
            </View>
            
            <Text style={styles.qrInstructions}>
              Abre RAD-IA en tu dispositivo móvil y escanea este código para sincronizar tus informes y frases
            </Text>
          </View>

          <TouchableOpacity
            style={styles.continueButton}
            onPress={onClose}
          >
            <Text style={styles.continueButtonText}>Continuar a la aplicación</Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={styles.skipButton}
            onPress={onClose}
          >
            <Text style={styles.skipButtonText}>Omitir por ahora</Text>
          </TouchableOpacity>
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
    borderRadius: 20,
    padding: 32,
    width: '100%',
    maxWidth: 480,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.3,
        shadowRadius: 16,
      },
      android: {
        elevation: 12,
      },
      web: {
        boxShadow: '0 8px 32px rgba(0, 0, 0, 0.3)',
      },
    }),
  },
  logoSection: {
    alignItems: 'center',
    marginBottom: 24,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: '#1a1a1a',
    marginBottom: 8,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    marginBottom: 32,
    textAlign: 'center',
    lineHeight: 24,
  },
  qrCard: {
    backgroundColor: '#F8F9FA',
    borderRadius: 16,
    padding: 24,
    borderWidth: 1,
    borderColor: '#E5E5E5',
    marginBottom: 24,
  },
  qrHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    marginBottom: 20,
  },
  qrTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1a1a1a',
  },
  qrContainer: {
    backgroundColor: 'white',
    padding: 16,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
      },
      android: {
        elevation: 4,
      },
      web: {
        boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)',
      },
    }),
  },
  qrPlaceholder: {
    width: 250,
    height: 250,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F0F0F0',
    borderRadius: 12,
  },
  qrInstructions: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    lineHeight: 20,
  },
  continueButton: {
    backgroundColor: '#007AFF',
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    marginBottom: 12,
  },
  continueButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  skipButton: {
    paddingVertical: 12,
    alignItems: 'center',
  },
  skipButtonText: {
    color: '#666',
    fontSize: 14,
    fontWeight: '500',
  },
});
