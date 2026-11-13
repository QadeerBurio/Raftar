import React from 'react';
import { View, Text, StyleSheet, StatusBar } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { ArrowLeft, Menu } from 'lucide-react-native';
import { useTheme } from '../../context/ThemeContext';
import { spacing, typography } from '../../theme/tokens';
import IconButton from './IconButton';

/**
 * Screen header: 44x44 Mist back button + title 22/800 + optional subtitle
 * + optional right icon button (rightIcon/onRightPress/rightLabel) or custom rightComponent.
 */
const Header = ({
  title,
  subtitle,
  showBack = true,
  showMenu = false,
  onBackPress,
  onMenuPress,
  rightIcon,
  onRightPress,
  rightLabel,
  rightComponent,
  style,
}) => {
  const navigation = useNavigation();
  const { colors } = useTheme();

  const handleBack = () => {
    if (onBackPress) onBackPress();
    else if (navigation.canGoBack()) navigation.goBack();
  };

  return (
    <>
      <StatusBar barStyle={colors.statusBarStyle} backgroundColor={colors.background} />
      <View style={[styles.container, { backgroundColor: colors.background }, style]}>
        {showMenu ? (
          <IconButton icon={Menu} onPress={onMenuPress} accessibilityLabel="Open menu" />
        ) : showBack ? (
          <IconButton icon={ArrowLeft} onPress={handleBack} accessibilityLabel="Go back" />
        ) : null}
        <View style={[styles.titleCol, (showBack || showMenu) && styles.titleIndent]}>
          <Text style={[typography.title, { color: colors.text }]} numberOfLines={1} accessibilityRole="header">
            {title}
          </Text>
          {subtitle ? (
            <Text style={[typography.small, { color: colors.textSecondary, marginTop: 2 }]} numberOfLines={1}>
              {subtitle}
            </Text>
          ) : null}
        </View>
        {rightComponent || (rightIcon ? (
          <IconButton icon={rightIcon} onPress={onRightPress} accessibilityLabel={rightLabel || 'More'} />
        ) : null)}
      </View>
    </>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.screen,
    paddingVertical: spacing.l,
  },
  titleCol: { flex: 1 },
  titleIndent: { marginLeft: spacing.l },
});

export default Header;
