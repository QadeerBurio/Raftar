import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Inbox } from 'lucide-react-native';
import { useTheme } from '../../context/ThemeContext';
import { radius, spacing, typography } from '../../theme/tokens';
import { renderIcon } from './icons';
import Button from './Button';

/** 96x96 Mist icon box, title, one line of text, optional primary button. */
const EmptyState = ({ icon, title, description, buttonText, onButtonPress, style }) => {
  const { colors } = useTheme();
  return (
    <View style={[styles.container, style]}>
      <View style={[styles.iconBox, { backgroundColor: colors.surface }]}>
        {renderIcon(icon || Inbox, { size: 40, color: colors.primary })}
      </View>
      <Text style={[typography.cardTitle, styles.title, { color: colors.text }]}>{title || 'Nothing here yet'}</Text>
      <Text style={[typography.body, styles.description, { color: colors.textSecondary }]}>
        {description || 'There is nothing to show right now.'}
      </Text>
      {buttonText && onButtonPress ? (
        <Button title={buttonText} onPress={onButtonPress} style={styles.button} />
      ) : null}
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: spacing.xxl },
  iconBox: { width: 96, height: 96, borderRadius: radius.cardLarge, alignItems: 'center', justifyContent: 'center', marginBottom: spacing.xl },
  title: { textAlign: 'center', marginBottom: 6 },
  description: { textAlign: 'center', maxWidth: 300 },
  button: { marginTop: spacing.xxl, minWidth: 200 },
});

export default EmptyState;
