import React from 'react';
import { View, StyleSheet } from 'react-native';
import { useTheme } from '../../context/ThemeContext';
import { radius, shadows, spacing } from '../../theme/tokens';

/** Static sheet surface: white, top radius 28, 40x5 grab handle. Positioning is up to the screen. */
const BottomSheet = ({ children, style, showHandle = true }) => {
  const { colors } = useTheme();
  return (
    <View style={[styles.sheet, { backgroundColor: colors.card }, style]}>
      {showHandle ? <View style={[styles.handle, { backgroundColor: colors.border }]} /> : null}
      {children}
    </View>
  );
};

const styles = StyleSheet.create({
  sheet: {
    borderTopLeftRadius: radius.sheet,
    borderTopRightRadius: radius.sheet,
    paddingHorizontal: spacing.screen,
    paddingBottom: spacing.xxl,
    ...shadows.sheet,
  },
  handle: { width: 40, height: 5, borderRadius: 3, alignSelf: 'center', marginTop: 10, marginBottom: 14 },
});

export default BottomSheet;
