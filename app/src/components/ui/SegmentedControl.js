import React from 'react';
import { View, Pressable, Text, StyleSheet } from 'react-native';
import { useTheme } from '../../context/ThemeContext';
import { radius, shadows, typography, fonts } from '../../theme/tokens';

/** Mist track; selected segment white with soft shadow. options: [{label, value}] or strings. */
const SegmentedControl = ({ options = [], value, onChange, style }) => {
  const { colors } = useTheme();
  const items = options.map((o) => (typeof o === 'string' ? { label: o, value: o } : o));
  return (
    <View style={[styles.track, { backgroundColor: colors.surface }, style]} accessibilityRole="tablist">
      {items.map((item) => {
        const selected = item.value === value;
        return (
          <Pressable
            key={String(item.value)}
            onPress={() => onChange && onChange(item.value)}
            accessibilityRole="tab"
            accessibilityState={{ selected }}
            accessibilityLabel={item.label}
            style={[styles.segment, selected && [styles.selected, { backgroundColor: colors.card }]]}
          >
            <Text style={[styles.label, { color: selected ? colors.accent : colors.textSecondary }, selected && styles.labelSelected]} numberOfLines={1}>
              {item.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
};

const styles = StyleSheet.create({
  track: { flexDirection: 'row', borderRadius: radius.field, padding: 4 },
  segment: { flex: 1, minHeight: 40, borderRadius: radius.field - 4, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 8 },
  selected: { ...shadows.soft },
  label: { ...typography.small, fontFamily: fonts.semibold, fontSize: 14 },
  labelSelected: { fontFamily: fonts.bold },
});

export default SegmentedControl;
