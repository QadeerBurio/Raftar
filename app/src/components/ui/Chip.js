import React from 'react';
import { Pressable, Text, View, StyleSheet } from 'react-native';
import { useTheme } from '../../context/ThemeContext';
import { radius, sizes, typography, fonts } from '../../theme/tokens';
import { renderIcon } from './icons';

/** Pill, 40 high. Default Mist; selected = teal bg + cream text. */
const Chip = ({ label, selected = false, onPress, icon, style, disabled, accessibilityLabel }) => {
  const { colors } = useTheme();
  const fg = selected ? colors.onPrimary : colors.text;
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled || !onPress}
      accessibilityRole={onPress ? 'button' : 'text'}
      accessibilityState={{ selected, disabled }}
      accessibilityLabel={accessibilityLabel || label}
      hitSlop={{ top: 2, bottom: 2 }}
      style={[
        styles.chip,
        { backgroundColor: selected ? colors.primary : colors.surface },
        disabled && { opacity: 0.5 },
        style,
      ]}
    >
      {icon ? <View style={styles.icon}>{renderIcon(icon, { size: 16, color: selected ? colors.onPrimary : colors.textSecondary })}</View> : null}
      <Text style={[styles.label, { color: fg }]} numberOfLines={1}>{label}</Text>
    </Pressable>
  );
};

const styles = StyleSheet.create({
  chip: {
    height: sizes.chip,
    borderRadius: radius.chip,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
  },
  icon: { marginRight: 6 },
  label: { ...typography.small, fontFamily: fonts.semibold, fontSize: 14 },
});

export default Chip;
