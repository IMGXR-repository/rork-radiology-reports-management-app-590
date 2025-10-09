import React, { useState } from 'react';
import { View, StyleSheet, PanResponder, Platform } from 'react-native';

interface CustomSliderProps {
  value: number;
  minimumValue: number;
  maximumValue: number;
  step?: number;
  onValueChange: (value: number) => void;
  minimumTrackTintColor?: string;
  maximumTrackTintColor?: string;
  thumbTintColor?: string;
  style?: any;
}

export default function CustomSlider({
  value,
  minimumValue,
  maximumValue,
  step = 1,
  onValueChange,
  minimumTrackTintColor = '#007AFF',
  maximumTrackTintColor = '#E0E0E0',
  thumbTintColor = '#007AFF',
  style,
}: CustomSliderProps) {
  const [sliderWidth, setSliderWidth] = useState(0);
  const [isDragging, setIsDragging] = useState(false);

  const normalizedValue = (value - minimumValue) / (maximumValue - minimumValue);

  const updateValue = (locationX: number) => {
    const percentage = Math.max(0, Math.min(1, locationX / sliderWidth));
    let newValue = minimumValue + percentage * (maximumValue - minimumValue);
    
    if (step > 0) {
      newValue = Math.round(newValue / step) * step;
    }
    
    newValue = Math.max(minimumValue, Math.min(maximumValue, newValue));
    
    if (newValue !== value) {
      onValueChange(newValue);
    }
  };

  const panResponder = PanResponder.create({
    onStartShouldSetPanResponder: () => true,
    onMoveShouldSetPanResponder: () => true,
    onPanResponderGrant: (evt) => {
      setIsDragging(true);
      updateValue(evt.nativeEvent.locationX);
    },
    onPanResponderMove: (evt) => {
      updateValue(evt.nativeEvent.locationX);
    },
    onPanResponderRelease: () => {
      setIsDragging(false);
    },
    onPanResponderTerminate: () => {
      setIsDragging(false);
    },
  });

  return (
    <View
      style={[styles.container, style]}
      onLayout={(e) => setSliderWidth(e.nativeEvent.layout.width)}
      {...panResponder.panHandlers}
    >
      <View style={styles.trackContainer}>
        <View
          style={[
            styles.track,
            { backgroundColor: maximumTrackTintColor },
          ]}
        />
        <View
          style={[
            styles.trackFilled,
            {
              backgroundColor: minimumTrackTintColor,
              width: `${normalizedValue * 100}%`,
            },
          ]}
        />
        <View
          style={[
            styles.thumb,
            {
              backgroundColor: thumbTintColor,
              left: `${normalizedValue * 100}%`,
              transform: [{ scale: isDragging ? 1.2 : 1 }],
            },
          ]}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    height: 40,
    justifyContent: 'center',
    paddingHorizontal: 10,
  },
  trackContainer: {
    height: 4,
    position: 'relative',
    justifyContent: 'center',
  },
  track: {
    height: 4,
    borderRadius: 2,
    width: '100%',
  },
  trackFilled: {
    height: 4,
    borderRadius: 2,
    position: 'absolute',
    left: 0,
  },
  thumb: {
    width: 20,
    height: 20,
    borderRadius: 10,
    position: 'absolute',
    marginLeft: -10,
    ...Platform.select({
      web: {
        cursor: 'pointer',
      },
      default: {},
    }),
  },
});
