import React from 'react';
import { Pressable, Text, View, StyleSheet, ActivityIndicator } from 'react-native';
import { palette, radius, sizes, shadows, typography } from '../../theme/tokens';
import { renderIcon } from './icons';

// Exactly three visual variants. Legacy names map onto them.
const VARIANT_ALIAS = { outline: 'secondary', danger: 'secondary' };

const VARIANTS = {
  primary: {
    container: { backgroundColor: palette.primary, ...shadows.primary },
    pressed: { backgroundColor: palette.primaryPressed },
    text: palette.cream,
  },
  secondary: {
    container: { backgroundColor: palette.cream, borderWidth: 1.5, borderColor: palette.primaryBorder },
    pressed: { backgroundColor: '#FFE89A' },
    text: palette.primary,
  },
  // Only for money actions: Add funds, Withdraw, Request payout, Cash collected.
  money: {
    container: { backgroundColor: palette.accent },
    pressed: { backgroundColor: palette.accentPressed },
    text: palette.text,
  },
};

const HEIGHT = { small: sizes.touch, medium: sizes.button, large: sizes.button };

const Button = ({
  title,
  onPress,
  loading = false,
  disabled = false,
  variant = 'primary',
  size = 'medium',
  icon,
  iconRight,
  fullWidth = false,
  style,
  textStyle,
  accessibilityLabel,
  testID,
}) => {
  const key = VARIANT_ALIAS[variant] || (VARIANTS[variant] ? variant : 'primary');
  const v = VARIANTS[key];
  const isDisabled = disabled || loading;
  const textColor = isDisabled && !loading ? palette.disabledText : v.text;

  return (
    <Pressable
      onPress={onPress}
      disabled={isDisabled}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel || title}
      accessibilityState={{ disabled: isDisabled, busy: loading }}
      testID={testID}
      style={({ pressed }) => [
        styles.base,
        { minHeight: HEIGHT[size] || sizes.button, paddingHorizontal: size === 'small' ? 16 : 24 },
        v.container,
        pressed && !isDisabled && v.pressed,
        isDisabled && !loading && styles.disabled,
        fullWidth && styles.fullWidth,
        style,
      ]}
    >
      {loading ? (
        <ActivityIndicator color={v.text} size="small" />
      ) : (
        <View style={styles.row}>
          {icon ? <View style={styles.iconLeft}>{renderIcon(icon, { size: 20, color: textColor })}</View> : null}
          <Text
            numberOfLines={1}
            style={[typography.button, size === 'small' && styles.smallText, { color: textColor }, textStyle]}
          >
            {title}
          </Text>
          {iconRight ? <View style={styles.iconRight}>{renderIcon(iconRight, { size: 20, color: textColor })}</View> : null}
        </View>
      )}
    </Pressable>
  );
};

const styles = StyleSheet.create({
  base: {
    borderRadius: radius.button,
    alignItems: 'center',
    justifyContent: 'center',
  },
  row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center' },
  iconLeft: { marginRight: 8 },
  iconRight: { marginLeft: 8 },
  smallText: { fontSize: 14 },
  fullWidth: { alignSelf: 'stretch' },
  disabled: {
    backgroundColor: palette.disabledBg,
    borderWidth: 0,
    shadowOpacity: 0,
    elevation: 0,
  },
});

export default Button;
