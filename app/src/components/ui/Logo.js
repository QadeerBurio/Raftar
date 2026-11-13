import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { palette, fonts } from '../../theme/tokens';

/**
 * Gold rounded square with a teal italic "R" + "Raftar" wordmark.
 * Placeholder until the real logo asset is available.
 * onDark: wordmark in cream (for teal headers).
 */
const Logo = ({ size = 48, showWordmark = true, onDark = false, style }) => (
  <View style={[styles.row, style]} accessibilityRole="image" accessibilityLabel="Raftar">
    <View style={[styles.tile, { width: size, height: size, borderRadius: Math.round(size * 0.3) }]}>
      <Text style={[styles.r, { fontSize: Math.round(size * 0.62), lineHeight: Math.round(size * 0.78) }]}>R</Text>
    </View>
    {showWordmark ? (
      <Text style={[styles.word, { fontSize: Math.round(size * 0.58), color: onDark ? palette.cream : palette.primary }]}>
        Raftar
      </Text>
    ) : null}
  </View>
);

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center' },
  tile: { backgroundColor: palette.accent, alignItems: 'center', justifyContent: 'center' },
  r: { fontFamily: fonts.black, fontStyle: 'italic', color: palette.primary, includeFontPadding: false },
  word: { fontFamily: fonts.extrabold, marginLeft: 10, letterSpacing: -0.5 },
});

export default Logo;
