import React from 'react';
import { Pressable, View, Text, StyleSheet } from 'react-native';
import { Check } from 'lucide-react-native';
import { useTheme } from '../../context/ThemeContext';
import { palette, radius, typography } from '../../theme/tokens';
import { renderIcon } from './icons';

/**
 * Selectable card (vehicle / tariff / passenger type).
 * Default Mist; selected = cream bg + 2px teal border + small teal check badge.
 */
const SelectCard = ({
  title,
  subtitle,
  meta, // right-aligned or bottom value, e.g. "Rs 200"
  icon,
  selected = false,
  onPress,
  disabled,
  layout = 'column', // 'column' (tariff tile) | 'row' (list option)
  style,
  children,
  accessibilityLabel,
}) => {
  const { colors } = useTheme();
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      accessibilityRole="radio"
      accessibilityState={{ selected, disabled }}
      accessibilityLabel={accessibilityLabel || [title, subtitle, meta].filter(Boolean).join(', ')}
      style={[
        styles.card,
        layout === 'row' ? styles.row : styles.column,
        { backgroundColor: selected ? colors.cream : colors.surface, borderColor: selected ? colors.primary : 'transparent' },
        disabled && { opacity: 0.5 },
        style,
      ]}
    >
      {selected ? (
        <View style={styles.check}>
          <Check size={12} color={palette.cream} strokeWidth={3} />
        </View>
      ) : null}
      {icon ? (
        <View style={layout === 'row' ? styles.iconRow : styles.iconCol}>
          {renderIcon(icon, { size: 26, color: colors.primary })}
        </View>
      ) : null}
      <View style={layout === 'row' ? styles.flex : null}>
        {title ? <Text style={[styles.title, { color: selected ? palette.primary : colors.text }]} numberOfLines={1}>{title}</Text> : null}
        {subtitle ? <Text style={[styles.subtitle, { color: selected ? palette.textMuted : colors.textSecondary }]} numberOfLines={2}>{subtitle}</Text> : null}
      </View>
      {meta ? <Text style={[styles.meta, { color: selected ? palette.primary : colors.text }, layout === 'column' && styles.metaCol]}>{meta}</Text> : null}
      {children}
    </Pressable>
  );
};

const styles = StyleSheet.create({
  card: { borderRadius: radius.card - 2, borderWidth: 2, padding: 14, minHeight: 44 },
  column: { minWidth: 112 },
  row: { flexDirection: 'row', alignItems: 'center' },
  flex: { flex: 1 },
  iconCol: { marginBottom: 10 },
  iconRow: { marginRight: 12 },
  title: { ...typography.cardTitle, fontSize: 15 },
  subtitle: { ...typography.small, marginTop: 2 },
  meta: { ...typography.cardTitle },
  metaCol: { marginTop: 8 },
  check: {
    position: 'absolute', top: 8, right: 8, width: 20, height: 20, borderRadius: 10,
    backgroundColor: palette.primary, alignItems: 'center', justifyContent: 'center', zIndex: 1,
  },
});

export default SelectCard;
