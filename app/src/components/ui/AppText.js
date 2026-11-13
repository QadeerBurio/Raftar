import React from 'react';
import { Text } from 'react-native';
import { useTheme } from '../../context/ThemeContext';
import { typography } from '../../theme/tokens';

/**
 * Text with a typography variant from the design tokens.
 * variant: display | amount | amountLarge | title | cardTitle | body | bodyStrong | small | overline | button
 * tone: text | muted | primary | onPrimary | gold | warning | success, or pass `color`.
 */
const AppText = ({ variant = 'body', tone = 'text', color, style, children, ...props }) => {
  const { colors } = useTheme();
  const toneColor = {
    text: colors.text,
    muted: colors.textSecondary,
    primary: colors.primary,
    onPrimary: colors.onPrimary,
    gold: colors.goldDark,
    warning: colors.warning,
    success: colors.success,
  }[tone] || colors.text;

  return (
    <Text style={[typography[variant] || typography.body, { color: color || toneColor }, style]} {...props}>
      {children}
    </Text>
  );
};

export default AppText;
