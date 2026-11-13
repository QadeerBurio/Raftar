import React from 'react';
import { Pressable, StyleSheet } from 'react-native';
import { useTheme } from '../../context/ThemeContext';
import { radius, sizes, shadows } from '../../theme/tokens';
import { renderIcon } from './icons';

/**
 * Icon-only button. accessibilityLabel is required.
 * shape: 'square' (Mist, radius 14) | 'round' (floating white over map).
 */
const IconButton = ({ icon, onPress, accessibilityLabel, shape = 'square', size = sizes.touch, color, style, disabled }) => {
  const { colors } = useTheme();
  const round = shape === 'round';
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      hitSlop={size < sizes.touch ? (sizes.touch - size) / 2 : 0}
      style={({ pressed }) => [
        styles.base,
        { width: size, height: size },
        round
          ? [{ borderRadius: size / 2, backgroundColor: colors.card }, shadows.soft]
          : { borderRadius: radius.field, backgroundColor: colors.surface },
        pressed && { opacity: 0.8 },
        style,
      ]}
    >
      {renderIcon(icon, { size: 22, color: color || colors.text })}
    </Pressable>
  );
};

const styles = StyleSheet.create({
  base: { alignItems: 'center', justifyContent: 'center' },
});

export default IconButton;
