import React, { useEffect, useState } from 'react';
import { TouchableOpacity, StyleSheet, Platform, View, Text } from 'react-native';
import { Smartphone } from 'lucide-react-native';

const MOBILE_WINDOW_CONFIG = {
  width: 390,
  height: window.screen.availHeight - 50,
  left: 0,
  top: 0,
};

const STORAGE_KEY = 'mobile_window_config';

export function MobileViewButton() {
  const [isInMobileWindow, setIsInMobileWindow] = useState(false);

  useEffect(() => {
    if (Platform.OS === 'web' && typeof window !== 'undefined') {
      const checkIfMobileWindow = () => {
        const urlParams = new URLSearchParams(window.location.search);
        setIsInMobileWindow(urlParams.get('mobileView') === 'true');
      };
      
      checkIfMobileWindow();
      window.addEventListener('popstate', checkIfMobileWindow);
      
      return () => {
        window.removeEventListener('popstate', checkIfMobileWindow);
      };
    }
  }, []);

  const handleOpenMobileView = () => {
    if (Platform.OS !== 'web' || typeof window === 'undefined') return;

    const storedConfig = localStorage.getItem(STORAGE_KEY);
    let config = {
      ...MOBILE_WINDOW_CONFIG,
      height: window.screen.availHeight - 50,
    };
    
    if (storedConfig) {
      try {
        config = JSON.parse(storedConfig);
      } catch (e) {
        console.error('Error parsing stored config:', e);
      }
    }

    const currentUrl = window.location.href;
    const separator = currentUrl.includes('?') ? '&' : '?';
    const mobileUrl = `${currentUrl}${separator}mobileView=true`;

    const features = `width=${config.width},height=${config.height},left=${config.left},top=${config.top},resizable=yes,scrollbars=yes`;
    
    const newWindow = window.open(mobileUrl, 'MobileView', features);

    if (newWindow) {
      let checkInterval: NodeJS.Timeout;
      
      const saveWindowConfig = () => {
        if (newWindow && !newWindow.closed) {
          try {
            const newConfig = {
              width: newWindow.outerWidth,
              height: newWindow.outerHeight,
              left: newWindow.screenX,
              top: newWindow.screenY,
            };
            localStorage.setItem(STORAGE_KEY, JSON.stringify(newConfig));
          } catch (e) {
            console.error('Error saving window config:', e);
          }
        }
      };

      checkInterval = setInterval(() => {
        if (newWindow.closed) {
          clearInterval(checkInterval);
        } else {
          saveWindowConfig();
        }
      }, 1000);

      newWindow.addEventListener('beforeunload', () => {
        saveWindowConfig();
        clearInterval(checkInterval);
      });
    }
  };

  if (Platform.OS !== 'web' || isInMobileWindow) {
    return null;
  }

  return (
    <View style={styles.container}>
      <TouchableOpacity
        style={styles.button}
        onPress={handleOpenMobileView}
        activeOpacity={0.7}
      >
        <Smartphone size={18} color="#fff" />
        <Text style={styles.buttonText}>Vista Móvil</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute' as const,
    top: 10,
    right: 10,
    zIndex: 9999,
  },
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#007AFF',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 20,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
    gap: 6,
  },
  buttonText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
});
