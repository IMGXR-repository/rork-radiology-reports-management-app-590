import React, { useRef, useState } from 'react';
import {
  View,
  StyleSheet,
  Animated,
  PanResponder,
  Dimensions,
  TouchableOpacity,
  Text,
} from 'react-native';
import { Mic, Square } from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

interface FloatingMicButtonProps {
  isRecording: boolean;
  onStartRecording: () => void;
  onStopRecording: () => void;
  theme: {
    primary: string;
    onPrimary: string;
    surface: string;
  };
}

export const FloatingMicButton: React.FC<FloatingMicButtonProps> = ({
  isRecording,
  onStartRecording,
  onStopRecording,
  theme,
}) => {
  const insets = useSafeAreaInsets();
  const { width, height } = Dimensions.get('window');
  
  const buttonSize = 64;
  const initialX = width - buttonSize - 20;
  const initialY = height / 2 - buttonSize / 2;

  const pan = useRef(new Animated.ValueXY({ x: initialX, y: initialY })).current;
  const [isDragging, setIsDragging] = useState<boolean>(false);

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      onPanResponderGrant: () => {
        setIsDragging(true);
        pan.setOffset({
          x: (pan.x as any)._value,
          y: (pan.y as any)._value,
        });
        pan.setValue({ x: 0, y: 0 });
      },
      onPanResponderMove: Animated.event(
        [
          null,
          { dx: pan.x, dy: pan.y },
        ],
        { useNativeDriver: false }
      ),
      onPanResponderRelease: (_, gesture) => {
        pan.flattenOffset();
        
        const currentX = (pan.x as any)._value;
        const currentY = (pan.y as any)._value;

        const minX = insets.left;
        const maxX = width - buttonSize - insets.right;
        const minY = insets.top;
        const maxY = height - buttonSize - insets.bottom;

        const boundedX = Math.max(minX, Math.min(maxX, currentX));
        const boundedY = Math.max(minY, Math.min(maxY, currentY));

        Animated.spring(pan, {
          toValue: { x: boundedX, y: boundedY },
          useNativeDriver: false,
          friction: 7,
        }).start();

        setTimeout(() => {
          setIsDragging(false);
        }, 100);
      },
    })
  ).current;

  const handlePress = () => {
    if (isDragging) return;
    
    if (isRecording) {
      onStopRecording();
    } else {
      onStartRecording();
    }
  };

  return (
    <Animated.View
      style={[
        styles.container,
        {
          transform: [
            { translateX: pan.x },
            { translateY: pan.y },
          ],
        },
      ]}
      {...panResponder.panHandlers}
    >
      <TouchableOpacity
        onPress={handlePress}
        activeOpacity={0.8}
        style={[
          styles.button,
          {
            backgroundColor: isRecording ? '#FF6B6B' : theme.primary,
            width: buttonSize,
            height: buttonSize,
            borderRadius: buttonSize / 2,
          },
        ]}
      >
        {isRecording ? (
          <View style={styles.recordingContent}>
            <Square size={28} color="#FFFFFF" fill="#FFFFFF" />
          </View>
        ) : (
          <Mic size={28} color="#FFFFFF" />
        )}
      </TouchableOpacity>
      
      {isRecording && (
        <View style={[styles.recordingIndicator, { backgroundColor: theme.surface }]}>
          <View style={styles.recordingDot} />
          <Text style={styles.recordingText}>REC</Text>
        </View>
      )}
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    zIndex: 9999,
  },
  button: {
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 4.65,
    elevation: 8,
  },
  recordingContent: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  recordingIndicator: {
    position: 'absolute',
    top: -8,
    right: -8,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  recordingDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#FF6B6B',
  },
  recordingText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#FF6B6B',
  },
});
