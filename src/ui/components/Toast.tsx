import { Ionicons } from '@expo/vector-icons';
import React, { useEffect, useRef } from 'react';
import { Animated, Pressable, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { RADIUS, SPACING, textOnHex, useTheme } from '../theme';
import Text from './Text';

export type ToastType = 'warning' | 'error' | 'success' | 'info';

export interface ToastProps {
  message: string;
  type?: ToastType;
  visible: boolean;
  onDismiss: () => void;
  duration?: number;
}

const ICON_MAP: Record<ToastType, keyof typeof Ionicons.glyphMap> = {
  warning: 'warning',
  error: 'close-circle',
  success: 'checkmark-circle',
  info: 'information-circle',
};

const Toast: React.FC<ToastProps> = ({
  message,
  type = 'warning',
  visible,
  onDismiss,
  duration = 4000,
}) => {
  const insets = useSafeAreaInsets();
  const theme = useTheme();
  const translateY = useRef(new Animated.Value(-100)).current;
  const opacity = useRef(new Animated.Value(0)).current;

  const getBackgroundColor = (): string => {
    switch (type) {
      case 'error':
        return theme.colors.danger;
      case 'success':
        return theme.colors.success;
      case 'warning':
        return theme.colors.warm;
      case 'info':
      default:
        return theme.colors.primary;
    }
  };

  const backgroundColor = getBackgroundColor();
  const textColor = textOnHex(backgroundColor);

  useEffect(() => {
    if (visible) {
      Animated.parallel([
        Animated.spring(translateY, {
          toValue: 0,
          tension: 80,
          friction: 10,
          useNativeDriver: true,
        }),
        Animated.timing(opacity, {
          toValue: 1,
          duration: 200,
          useNativeDriver: true,
        }),
      ]).start();

      const timer = setTimeout(() => {
        dismissToast();
      }, duration);

      return () => clearTimeout(timer);
    } else {
      translateY.setValue(-100);
      opacity.setValue(0);
    }
  }, [visible, duration]);

  const dismissToast = () => {
    Animated.parallel([
      Animated.timing(translateY, {
        toValue: -100,
        duration: 200,
        useNativeDriver: true,
      }),
      Animated.timing(opacity, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }),
    ]).start(() => {
      onDismiss();
    });
  };

  if (!visible) return null;

  return (
    <Animated.View
      style={[
        styles.container,
        {
          top: insets.top + SPACING.SM,
          transform: [{ translateY }],
          opacity,
        },
      ]}
      pointerEvents="box-none"
    >
      <Pressable
        onPress={dismissToast}
        style={[
          styles.toast,
          {
            backgroundColor,
          },
        ]}
      >
        <Ionicons name={ICON_MAP[type]} size={20} color={textColor} />
        <Text weight="medium" style={[styles.message, { color: textColor }]}>
          {message}
        </Text>
      </Pressable>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    left: SPACING.MD,
    right: SPACING.MD,
    zIndex: 9999,
    alignItems: 'center',
  },
  toast: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: SPACING.SM + 2,
    paddingHorizontal: SPACING.MD,
    borderRadius: RADIUS.LG,
    gap: SPACING.SM,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 8,
    maxWidth: 400,
  },
  message: {
    fontSize: 14,
    flex: 1,
    lineHeight: 20,
  },
});

export default Toast;
