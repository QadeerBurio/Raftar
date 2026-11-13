import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { palette, radius, typography, fonts } from '../../theme/tokens';
import { renderIcon } from './icons';

const TONES = {
  gold: { bg: palette.accent, fg: palette.primary },
  cream: { bg: palette.cream, fg: palette.primary },
  teal: { bg: palette.primary, fg: palette.cream },
  success: { bg: palette.successBg, fg: palette.success },
  mist: { bg: palette.surface, fg: palette.textMuted },
};

/** Pill badge. Default gold bg + teal text. */
const Badge = ({ label, icon, tone = 'gold', style, textStyle }) => {
  const t = TONES[tone] || TONES.gold;
  return (
    <View style={[styles.badge, { backgroundColor: t.bg }, style]}>
      {icon ? <View style={styles.icon}>{renderIcon(icon, { size: 12, color: t.fg })}</View> : null}
      <Text style={[styles.text, { color: t.fg }, textStyle]} numberOfLines={1}>{label}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  badge: {
    flexDirection: 'row', alignItems: 'center', alignSelf: 'flex-start',
    borderRadius: radius.chip, paddingHorizontal: 10, paddingVertical: 4,
  },
  icon: { marginRight: 4 },
  text: { ...typography.small, fontFamily: fonts.bold, fontSize: 12, lineHeight: 16 },
});

export default Badge;
