import React from 'react';
import { View, Text, StyleSheet, useWindowDimensions } from 'react-native';
import Svg, { Path, Circle } from 'react-native-svg';
import { Logo } from '../../components/ui';
import { palette, spacing, typography } from '../../theme/tokens';

export const HERO_HEIGHT = 330;

/**
 * Deep Teal auth header: logo, cream tagline, decorative dotted road and gold circle.
 * Decorative shapes are hidden from screen readers.
 */
const AuthHero = ({ topInset = 0, height = HERO_HEIGHT }) => {
  const { width } = useWindowDimensions();
  const h = height + topInset;

  return (
    <View style={[styles.hero, { height: h, paddingTop: topInset }]}>
      <View style={StyleSheet.absoluteFill} pointerEvents="none" accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
        <Svg width={width} height={h}>
          {/* Gold sun, partly off the top-right edge */}
          <Circle cx={width - 36} cy={topInset + 46} r={64} fill={palette.accent} />
          {/* Dotted road sweeping across the header */}
          <Path
            d={`M -20 ${h - 40} C ${width * 0.25} ${h - 140}, ${width * 0.55} ${h - 10}, ${width + 20} ${h - 150}`}
            stroke={palette.cream}
            strokeOpacity={0.55}
            strokeWidth={3}
            strokeLinecap="round"
            strokeDasharray="1 12"
            fill="none"
          />
          <Path
            d={`M -20 ${h - 40} C ${width * 0.25} ${h - 140}, ${width * 0.55} ${h - 10}, ${width + 20} ${h - 150}`}
            stroke={palette.cream}
            strokeOpacity={0.12}
            strokeWidth={26}
            strokeLinecap="round"
            fill="none"
          />
        </Svg>
      </View>

      <View style={styles.content}>
        <Logo size={52} onDark />
        <Text style={styles.tagline}>Har Safar, Aap Ke Saath</Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  hero: { backgroundColor: palette.primary, overflow: 'hidden' },
  content: { flex: 1, justifyContent: 'center', paddingHorizontal: spacing.screenAuth, paddingBottom: 40 },
  tagline: { ...typography.bodyStrong, fontSize: 16, color: palette.cream, marginTop: spacing.l },
});

export default AuthHero;
