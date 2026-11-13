import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Info, CircleCheck, Clock } from 'lucide-react-native';
import { useTheme } from '../../context/ThemeContext';
import { radius, spacing, typography } from '../../theme/tokens';

/**
 * Inline status message. Replaces raw red error text.
 * tone: 'warning' (Slate on Mist, for errors) | 'info' | 'success' | 'pending'
 */
const InlineMessage = ({ tone = 'warning', children, style, icon }) => {
  const { colors } = useTheme();
  if (!children) return null;
  const t = {
    warning: { bg: colors.surface, fg: colors.warning, Icon: Info },
    info: { bg: colors.surface, fg: colors.textSecondary, Icon: Info },
    success: { bg: colors.successBg, fg: colors.success, Icon: CircleCheck },
    pending: { bg: colors.cream, fg: colors.goldDark, Icon: Clock },
  }[tone] || {};
  const Ico = icon || t.Icon;
  return (
    <View
      style={[styles.box, { backgroundColor: t.bg }, style]}
      accessibilityRole={tone === 'warning' ? 'alert' : undefined}
      accessibilityLiveRegion="polite"
    >
      <Ico size={18} color={t.fg} strokeWidth={2} />
      <Text style={[styles.text, { color: t.fg }]}>{children}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  box: {
    flexDirection: 'row', alignItems: 'center', gap: spacing.s,
    borderRadius: radius.field, paddingHorizontal: spacing.l, paddingVertical: spacing.m,
  },
  text: { ...typography.small, flex: 1 },
});

export default InlineMessage;
