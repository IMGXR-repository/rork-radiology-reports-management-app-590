import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, Modal, StyleSheet, Platform, ScrollView, Alert } from 'react-native';
import { User, Mail, X, MapPin, Globe, Stethoscope, CreditCard, Lock } from 'lucide-react-native';
import { RegistrationData } from '@/types';
import { CustomPicker } from './CustomPicker';
import { RadiaLogo } from './RadiaLogo';
import { COUNTRIES, MEDICAL_SPECIALTIES, getCitiesForCountry } from '@/constants/userOptions';

interface LoginModalProps {
  visible: boolean;
  onClose: () => void;
  onLogin: (email: string, password: string) => void;
  onRegister: (data: RegistrationData) => void;
  onResetPassword?: (email: string) => Promise<boolean>;
  onGoogleSignIn?: () => Promise<void>;
  onAppleSignIn?: () => Promise<void>;
}

export const LoginModal: React.FC<LoginModalProps> = ({ visible, onClose, onLogin, onRegister, onResetPassword, onGoogleSignIn, onAppleSignIn }) => {
  const [mode, setMode] = useState<'login' | 'register' | 'reset'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  
  // Registration form state
  const [formData, setFormData] = useState<RegistrationData>({
    email: '',
    password: '',
    name: '',
    dni: '',
    country: '',
    city: '',
    medicalLicense: '',
    medicalSpecialty: '',
    pin: '',
    confirmPin: ''
  });
  
  const [availableCities, setAvailableCities] = useState<string[]>([]);
  
  useEffect(() => {
    if (formData.country) {
      const cities = getCitiesForCountry(formData.country);
      setAvailableCities(cities);
      // Reset city if it's not available in the new country
      if (formData.city && !cities.includes(formData.city)) {
        updateFormData('city', '');
      }
    } else {
      setAvailableCities([]);
      if (formData.city) {
        updateFormData('city', '');
      }
    }
  }, [formData.country, formData.city]);

  const handleLogin = async () => {
    if (!email.includes('@') || !password) {
      Alert.alert('Error', 'Por favor ingresa email y contraseña');
      return;
    }

    setIsLoading(true);
    try {
      await onLogin(email, password);
      setEmail('');
      setPassword('');
      onClose();
    } catch (error: any) {
      console.error('Error during login:', error);
      Alert.alert('Error', error.message || 'Error al iniciar sesión');
    } finally {
      setIsLoading(false);
    }
  };

  const handleResetPassword = async () => {
    if (!email.includes('@')) {
      Alert.alert('Error', 'Por favor ingresa un email válido');
      return;
    }

    if (!onResetPassword) {
      Alert.alert('Error', 'Función de recuperación no disponible');
      return;
    }

    setIsLoading(true);
    try {
      await onResetPassword(email);
      Alert.alert(
        'Email enviado',
        'Se ha enviado un email con instrucciones para recuperar tu contraseña',
        [{ text: 'OK', onPress: () => switchMode('login') }]
      );
    } catch (error: any) {
      console.error('Error during password reset:', error);
      Alert.alert('Error', error.message || 'Error al enviar email de recuperación');
    } finally {
      setIsLoading(false);
    }
  };

  const handleRegister = async () => {
    // Validation
    if (!formData.email.includes('@')) {
      Alert.alert('Error', 'Por favor ingresa un email válido');
      return;
    }
    
    if (!formData.password || formData.password.length < 6) {
      Alert.alert('Error', 'La contraseña debe tener al menos 6 caracteres');
      return;
    }
    
    if (!formData.name.trim()) {
      Alert.alert('Error', 'Por favor ingresa tu nombre completo');
      return;
    }
    
    if (!formData.dni.trim()) {
      Alert.alert('Error', 'Por favor ingresa tu DNI');
      return;
    }
    
    if (!formData.country.trim()) {
      Alert.alert('Error', 'Por favor ingresa tu país');
      return;
    }
    
    if (!formData.city.trim()) {
      Alert.alert('Error', 'Por favor ingresa tu ciudad');
      return;
    }
    
    if (!formData.medicalLicense.trim()) {
      Alert.alert('Error', 'Por favor ingresa tu número de colegiado');
      return;
    }
    
    if (!formData.medicalSpecialty.trim()) {
      Alert.alert('Error', 'Por favor ingresa tu especialidad médica');
      return;
    }
    
    if (formData.pin.length !== 4 || !/^\d{4}$/.test(formData.pin)) {
      Alert.alert('Error', 'El PIN debe tener exactamente 4 dígitos');
      return;
    }
    
    if (formData.pin !== formData.confirmPin) {
      Alert.alert('Error', 'Los PINs no coinciden');
      return;
    }

    setIsLoading(true);
    try {
      await onRegister(formData);
      // Reset form
      setFormData({
        email: '',
        password: '',
        name: '',
        dni: '',
        country: '',
        city: '',
        medicalLicense: '',
        medicalSpecialty: '',
        pin: '',
        confirmPin: ''
      });
      onClose();
    } catch (error: any) {
      console.error('Error during registration:', error);
      Alert.alert('Error', error.message || 'Error al registrar usuario');
    } finally {
      setIsLoading(false);
    }
  };

  const updateFormData = (field: keyof RegistrationData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const resetForm = () => {
    setEmail('');
    setPassword('');
    setFormData({
      email: '',
      password: '',
      name: '',
      dni: '',
      country: '',
      city: '',
      medicalLicense: '',
      medicalSpecialty: '',
      pin: '',
      confirmPin: ''
    });
  };

  const switchMode = (newMode: 'login' | 'register' | 'reset') => {
    if (!newMode || (newMode !== 'login' && newMode !== 'register' && newMode !== 'reset')) return;
    setMode(newMode);
    resetForm();
  };

  const renderLoginForm = () => (
    <>
      <View style={styles.logoSection}>
        <RadiaLogo size="medium" showText={true} />
      </View>
      <Text style={styles.title}>Iniciar Sesión</Text>
      <Text style={styles.subtitle}>
        Ingresa tu email para acceder a RAD-IA
      </Text>

      <View style={styles.inputContainer}>
        <View style={styles.inputContainerInner}>
          <Mail size={20} color="#666" style={styles.inputIcon} />
          <TextInput
            style={styles.input}
            placeholder="tu@email.com"
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
            autoCorrect={false}
            editable={!isLoading}
          />
        </View>
      </View>

      <View style={styles.inputContainer}>
        <View style={styles.inputContainerInner}>
          <Lock size={20} color="#666" style={styles.inputIcon} />
          <TextInput
            style={styles.input}
            placeholder="Contraseña"
            value={password}
            onChangeText={setPassword}
            secureTextEntry
            autoCapitalize="none"
            autoCorrect={false}
            editable={!isLoading}
          />
        </View>
      </View>

      <TouchableOpacity
        style={[
          styles.actionButton,
          (!email.includes('@') || !password || isLoading) && styles.actionButtonDisabled
        ]}
        onPress={handleLogin}
        disabled={!email.includes('@') || !password || isLoading}
      >
        <Text style={[
          styles.actionButtonText,
          (!email.includes('@') || !password || isLoading) && styles.actionButtonTextDisabled
        ]}>
          {isLoading ? 'Iniciando...' : 'Iniciar Sesión'}
        </Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.forgotPasswordButton}
        onPress={() => switchMode('reset')}
      >
        <Text style={styles.forgotPasswordText}>
          ¿Olvidaste tu contraseña?
        </Text>
      </TouchableOpacity>

      {(onGoogleSignIn || onAppleSignIn) && (
        <>
          <View style={styles.dividerContainer}>
            <View style={styles.divider} />
            <Text style={styles.dividerText}>O continúa con</Text>
            <View style={styles.divider} />
          </View>

          <View style={styles.socialButtonsContainer}>
            {onGoogleSignIn && (
              <TouchableOpacity
                style={styles.socialButton}
                onPress={onGoogleSignIn}
                disabled={isLoading}
              >
                <View style={styles.googleIcon}>
                  <Text style={styles.googleIconText}>G</Text>
                </View>
                <Text style={styles.socialButtonText}>Google</Text>
              </TouchableOpacity>
            )}

            {onAppleSignIn && (
              <TouchableOpacity
                style={[styles.socialButton, styles.appleButton]}
                onPress={onAppleSignIn}
                disabled={isLoading}
              >
                <Text style={styles.appleIcon}></Text>
                <Text style={[styles.socialButtonText, styles.appleButtonText]}>Apple</Text>
              </TouchableOpacity>
            )}
          </View>
        </>
      )}

      <TouchableOpacity
        style={styles.switchButton}
        onPress={() => switchMode('register')}
      >
        <Text style={styles.switchButtonText}>
          ¿No tienes cuenta? Regístrate aquí
        </Text>
      </TouchableOpacity>
    </>
  );

  const renderResetPasswordForm = () => (
    <>
      <View style={styles.logoSection}>
        <RadiaLogo size="medium" showText={true} />
      </View>
      <Text style={styles.title}>Recuperar Contraseña</Text>
      <Text style={styles.subtitle}>
        Ingresa tu email y te enviaremos instrucciones para recuperar tu contraseña
      </Text>

      <View style={styles.inputContainer}>
        <View style={styles.inputContainerInner}>
          <Mail size={20} color="#666" style={styles.inputIcon} />
          <TextInput
            style={styles.input}
            placeholder="tu@email.com"
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
            autoCorrect={false}
            editable={!isLoading}
          />
        </View>
      </View>

      <TouchableOpacity
        style={[
          styles.actionButton,
          (!email.includes('@') || isLoading) && styles.actionButtonDisabled
        ]}
        onPress={handleResetPassword}
        disabled={!email.includes('@') || isLoading}
      >
        <Text style={[
          styles.actionButtonText,
          (!email.includes('@') || isLoading) && styles.actionButtonTextDisabled
        ]}>
          {isLoading ? 'Enviando...' : 'Enviar Email'}
        </Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.switchButton}
        onPress={() => switchMode('login')}
      >
        <Text style={styles.switchButtonText}>
          Volver a iniciar sesión
        </Text>
      </TouchableOpacity>
    </>
  );

  const renderRegistrationForm = () => (
    <>
      <View style={styles.logoSection}>
        <RadiaLogo size="medium" showText={true} />
      </View>
      <Text style={styles.title}>Registro de Usuario</Text>
      <Text style={styles.subtitle}>
        Completa todos los campos para crear tu cuenta en RAD-IA
      </Text>

      <ScrollView style={styles.formContainer} showsVerticalScrollIndicator={false}>
        <View style={styles.inputContainer}>
          <View style={styles.inputContainerInner}>
            <Mail size={20} color="#666" style={styles.inputIcon} />
            <TextInput
              style={styles.input}
              placeholder="Email"
              value={formData.email}
              onChangeText={(value) => updateFormData('email', value)}
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
              editable={!isLoading}
            />
          </View>
        </View>

        <View style={styles.inputContainer}>
          <View style={styles.inputContainerInner}>
            <Lock size={20} color="#666" style={styles.inputIcon} />
            <TextInput
              style={styles.input}
              placeholder="Contraseña (mínimo 6 caracteres)"
              value={formData.password}
              onChangeText={(value) => updateFormData('password', value)}
              secureTextEntry
              autoCapitalize="none"
              autoCorrect={false}
              editable={!isLoading}
            />
          </View>
        </View>

        <View style={styles.inputContainer}>
          <View style={styles.inputContainerInner}>
            <User size={20} color="#666" style={styles.inputIcon} />
            <TextInput
              style={styles.input}
              placeholder="Nombre completo"
              value={formData.name}
              onChangeText={(value) => updateFormData('name', value)}
              autoCapitalize="words"
              editable={!isLoading}
            />
          </View>
        </View>

        <View style={styles.inputContainer}>
          <View style={styles.inputContainerInner}>
            <CreditCard size={20} color="#666" style={styles.inputIcon} />
            <TextInput
              style={styles.input}
              placeholder="DNI"
              value={formData.dni}
              onChangeText={(value) => updateFormData('dni', value)}
              editable={!isLoading}
            />
          </View>
        </View>

        <View style={styles.inputContainer}>
          <CustomPicker
            value={formData.country}
            onValueChange={(value) => updateFormData('country', value)}
            options={COUNTRIES}
            placeholder="Seleccionar país"
            icon={<Globe size={20} color="#666" />}
            disabled={isLoading}
          />
        </View>

        <View style={styles.inputContainer}>
          <CustomPicker
            value={formData.city}
            onValueChange={(value) => updateFormData('city', value)}
            options={availableCities}
            placeholder={formData.country ? "Seleccionar ciudad" : "Primero selecciona un país"}
            icon={<MapPin size={20} color="#666" />}
            disabled={isLoading || !formData.country}
          />
        </View>

        <View style={styles.inputContainer}>
          <View style={styles.inputContainerInner}>
            <CreditCard size={20} color="#666" style={styles.inputIcon} />
            <TextInput
              style={styles.input}
              placeholder="Número de colegiado"
              value={formData.medicalLicense}
              onChangeText={(value) => updateFormData('medicalLicense', value)}
              editable={!isLoading}
            />
          </View>
        </View>

        <View style={styles.inputContainer}>
          <CustomPicker
            value={formData.medicalSpecialty}
            onValueChange={(value) => updateFormData('medicalSpecialty', value)}
            options={MEDICAL_SPECIALTIES}
            placeholder="Seleccionar especialidad médica"
            icon={<Stethoscope size={20} color="#666" />}
            disabled={isLoading}
          />
        </View>

        <View style={styles.inputContainer}>
          <View style={styles.inputContainerInner}>
            <Lock size={20} color="#666" style={styles.inputIcon} />
            <TextInput
              style={styles.input}
              placeholder="PIN de 4 dígitos"
              value={formData.pin}
              onChangeText={(value) => updateFormData('pin', value.replace(/[^0-9]/g, '').slice(0, 4))}
              keyboardType="numeric"
              secureTextEntry
              maxLength={4}
              editable={!isLoading}
            />
          </View>
        </View>

        <View style={styles.inputContainer}>
          <View style={styles.inputContainerInner}>
            <Lock size={20} color="#666" style={styles.inputIcon} />
            <TextInput
              style={styles.input}
              placeholder="Confirmar PIN"
              value={formData.confirmPin}
              onChangeText={(value) => updateFormData('confirmPin', value.replace(/[^0-9]/g, '').slice(0, 4))}
              keyboardType="numeric"
              secureTextEntry
              maxLength={4}
              editable={!isLoading}
            />
          </View>
        </View>
      </ScrollView>

      <TouchableOpacity
        style={[
          styles.actionButton,
          isLoading && styles.actionButtonDisabled
        ]}
        onPress={handleRegister}
        disabled={isLoading}
      >
        <Text style={[
          styles.actionButtonText,
          isLoading && styles.actionButtonTextDisabled
        ]}>
          {isLoading ? 'Registrando...' : 'Crear Cuenta'}
        </Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.switchButton}
        onPress={() => switchMode('login')}
      >
        <Text style={styles.switchButtonText}>
          ¿Ya tienes cuenta? Inicia sesión aquí
        </Text>
      </TouchableOpacity>
    </>
  );

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <View style={[styles.modal, mode === 'register' && styles.modalLarge]}>
          <View style={styles.header}>
            <View style={styles.headerSpacer} />
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <X size={20} color="#666" />
            </TouchableOpacity>
          </View>

          {mode === 'login' ? renderLoginForm() : mode === 'register' ? renderRegistrationForm() : renderResetPasswordForm()}
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
    maxWidth: 400,
    maxHeight: '80%',
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
  modalLarge: {
    maxHeight: '90%',
  },
  formContainer: {
    maxHeight: 300,
    marginBottom: 16,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  headerSpacer: {
    flex: 1,
  },
  logoSection: {
    alignItems: 'center',
    marginBottom: 24,
    paddingVertical: 16,
  },
  closeButton: {
    padding: 4,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1a1a1a',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    marginBottom: 24,
    lineHeight: 22,
  },
  inputContainer: {
    marginBottom: 20,
  },
  inputContainerInner: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E5E5E5',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#FAFAFA',
  },
  inputIcon: {
    marginRight: 12,
  },
  input: {
    flex: 1,
    fontSize: 16,
    color: '#1a1a1a',
    ...Platform.select({
      web: {
        outlineStyle: 'none',
      },
    }),
  },
  actionButton: {
    backgroundColor: '#007AFF',
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    marginBottom: 16,
  },
  actionButtonDisabled: {
    backgroundColor: '#E5E5E5',
  },
  actionButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  actionButtonTextDisabled: {
    color: '#999',
  },
  switchButton: {
    paddingVertical: 12,
    alignItems: 'center',
    marginTop: 4,
  },
  switchButtonText: {
    color: '#1a1a1a',
    fontSize: 15,
    fontWeight: '600',
  },
  forgotPasswordButton: {
    paddingVertical: 8,
    alignItems: 'center',
    marginBottom: 8,
  },
  forgotPasswordText: {
    color: '#666',
    fontSize: 14,
    fontWeight: '500',
  },
  dividerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 20,
  },
  divider: {
    flex: 1,
    height: 1,
    backgroundColor: '#E5E5E5',
  },
  dividerText: {
    marginHorizontal: 16,
    color: '#666',
    fontSize: 14,
  },
  socialButtonsContainer: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 16,
  },
  socialButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'white',
    borderWidth: 2,
    borderColor: '#007AFF',
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: 16,
    ...Platform.select({
      ios: {
        shadowColor: '#007AFF',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.15,
        shadowRadius: 4,
      },
      android: {
        elevation: 3,
      },
      web: {
        boxShadow: '0 2px 4px rgba(0, 122, 255, 0.15)',
      },
    }),
  },
  appleButton: {
    backgroundColor: '#000',
    borderColor: '#000',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.2,
        shadowRadius: 4,
      },
      android: {
        elevation: 3,
      },
      web: {
        boxShadow: '0 2px 4px rgba(0, 0, 0, 0.2)',
      },
    }),
  },
  googleIcon: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#4285F4',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 8,
  },
  googleIconText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '700',
  },
  appleIcon: {
    fontSize: 20,
    marginRight: 8,
  },
  socialButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#1a1a1a',
  },
  appleButtonText: {
    color: 'white',
  },
});