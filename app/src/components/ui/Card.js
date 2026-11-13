import React from 'react';
import { View, Pressable, StyleSheet } from 'react-native';
import { useTheme } from '../../context/ThemeContext';
import { radius, shadows } from '../../theme/tokens';

/**
 * Surface card. variant: 'default' (white + border) | 'elevated' (white + soft shadow)
 * | 'outlined' (transparent + border) | 'teal' (Deep Teal) | 'cream' | 'mist'.
 */
const Card = ({ children, style, onPress, variant = 'default', accessibilityLabel }) => {
  const { colors } = useTheme();
  const v = {
    default: { backgroundColor: colors.card, borderWidth: 1, borderColor: colors.border },
    elevated: { backgroundColor: colors.card, ...shadows.soft },
    outlined: { backgroundColor: 'transparent', borderWidth: 1, borderColor: colors.border },
    teal: { backgroundColor: colors.primary },
    cream: { backgroundColor: colors.cream },
    mist: { backgroundColor: colors.surface },
  }[variant] || {};

  if (onPress) {
    return (
      <Pressable
        onPress={onPress}
        accessibilityRole="button"
        accessibilityLabel={accessibilityLabel}
        style={({ pressed }) => [styles.card, v, pressed && { opacity: 0.85 }, style]}
      >
        {children}
      </Pressable>
    );
  }
  return <View style={[styles.card, v, style]}>{children}</View>;
};

const styles = StyleSheet.create({
  card: { borderRadius: radius.card, padding: 16 },
});

export default Card;
