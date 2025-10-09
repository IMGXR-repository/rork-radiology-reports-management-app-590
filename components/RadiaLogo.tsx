import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Activity } from 'lucide-react-native';

interface RadiaLogoProps {
  size?: 'small' | 'medium' | 'large';
  showText?: boolean;
  color?: string;
  textColor?: string;
}

export const RadiaLogo: React.FC<RadiaLogoProps> = ({ 
  size = 'medium', 
  showText = true, 
  color = '#007AFF',
  textColor = '#1a1a1a'
}) => {
  const logoSize = size === 'small' ? 32 : size === 'large' ? 64 : 48;
  const iconSize = size === 'small' ? 20 : size === 'large' ? 40 : 28;
  const fontSize = size === 'small' ? 16 : size === 'large' ? 32 : 24;
  const subtitleSize = size === 'small' ? 10 : size === 'large' ? 14 : 12;

  return (
    <View style={styles.container}>
      <View style={[
        styles.logoContainer, 
        { 
          width: logoSize, 
          height: logoSize, 
          backgroundColor: color,
          borderRadius: logoSize / 2
        }
      ]}>
        <Activity size={iconSize} color="white" />
      </View>
      {showText && (
        <View style={styles.textContainer}>
          <Text style={[styles.appName, { fontSize, color: textColor }]}>
            RAD-IA
          </Text>
          <Text style={[styles.subtitle, { fontSize: subtitleSize, color: textColor + '80' }]}>
            Radiología Inteligente
          </Text>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  textContainer: {
    alignItems: 'center',
    marginTop: 8,
  },
  appName: {
    fontWeight: '700',
    letterSpacing: 1,
  },
  subtitle: {
    fontWeight: '500',
    marginTop: 2,
    opacity: 0.8,
  },
});