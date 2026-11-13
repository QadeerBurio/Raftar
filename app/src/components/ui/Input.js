import React, { useState } from 'react';
import { View, TextInput, Text, StyleSheet, Pressable } from 'react-native';
import { Eye, EyeOff, Info } from 'lucide-react-native';
import { useTheme } from '../../context/ThemeContext';
import { radius, sizes, typography, fonts } from '../../theme/tokens';
import { renderIcon } from './icons';

/**
 * Text field: 56 high, Mist background, no border, left icon in textMuted.
 * `prefix` renders a fixed prefix (e.g. "+92"). `error` renders an inline Slate message.
 */
const Input = ({
  label,
  value,
  onChangeText,
  placeholder,
  secureTextEntry = false,
  error,
  hint,
  icon,
  iconRight,
  onIconPress,
  iconRightLabel,
  prefix,
  multiline = false,
  numberOfLines = 1,
  style,
  inputStyle,
  onFocus,
  onBlur,
  ...props
}) => {
  const { colors } = useTheme();
  const [isSecure, setIsSecure] = useState(secureTextEntry);
  const [focused, setFocused] = useState(false);

  return (
    <View style={[styles.container, style]}>
      {label ? <Text style={[styles.label, { color: colors.text }]}>{label}</Text> : null}
      <View
        style={[
          styles.field,
          { backgroundColor: colors.surface, borderColor: 'transparent' },
          focused && { borderColor: colors.accent },
          error && { borderColor: colors.warning },
          multiline && styles.multilineField,
        ]}
      >
        {icon ? <View style={styles.leftIcon}>{renderIcon(icon, { size: 20, color: colors.textSecondary })}</View> : null}
        {prefix ? (
          <View style={[styles.prefix, { borderRightColor: colors.border }]}>
            <Text style={[styles.prefixText, { color: colors.text }]}>{prefix}</Text>
          </View>
        ) : null}
        <TextInput
          style={[styles.input, { color: colors.text }, multiline && styles.multilineInput, inputStyle]}
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder}
          placeholderTextColor={colors.placeholder}
          secureTextEntry={isSecure}
          multiline={multiline}
          numberOfLines={numberOfLines}
          accessibilityLabel={label || placeholder}
          onFocus={(e) => { setFocused(true); onFocus && onFocus(e); }}
          onBlur={(e) => { setFocused(false); onBlur && onBlur(e); }}
          {...props}
        />
        {secureTextEntry ? (
          <Pressable
            onPress={() => setIsSecure((s) => !s)}
            style={styles.rightIcon}
            accessibilityRole="button"
            accessibilityLabel={isSecure ? 'Show password' : 'Hide password'}
            hitSlop={8}
          >
            {isSecure
              ? <EyeOff size={20} color={colors.textSecondary} strokeWidth={2} />
              : <Eye size={20} color={colors.textSecondary} strokeWidth={2} />}
          </Pressable>
        ) : null}
        {iconRight ? (
          <Pressable
            onPress={onIconPress}
            style={styles.rightIcon}
            accessibilityRole="button"
            accessibilityLabel={iconRightLabel || 'Field action'}
            hitSlop={8}
          >
            {renderIcon(iconRight, { size: 20, color: colors.textSecondary })}
          </Pressable>
        ) : null}
      </View>
      {error ? (
        <View style={styles.messageRow}>
          <Info size={14} color={colors.warning} strokeWidth={2} />
          <Text style={[styles.message, { color: colors.warning }]}>{error}</Text>
        </View>
      ) : hint ? (
        <Text style={[styles.message, styles.hint, { color: colors.textSecondary }]}>{hint}</Text>
      ) : null}
    </View>
  );
};

const styles = StyleSheet.create({
  container: { marginBottom: 16 },
  label: { ...typography.small, fontFamily: fonts.semibold, marginBottom: 8 },
  field: {
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: sizes.input,
    borderRadius: radius.field,
    borderWidth: 1.5,
    paddingHorizontal: 16,
  },
  multilineField: { alignItems: 'flex-start', paddingVertical: 12 },
  leftIcon: { marginRight: 12 },
  prefix: { paddingRight: 12, marginRight: 12, borderRightWidth: 1 },
  prefixText: { ...typography.bodyStrong },
  input: { flex: 1, ...typography.body, paddingVertical: 12 },
  multilineInput: { minHeight: 96, textAlignVertical: 'top', paddingTop: 0 },
  rightIcon: { marginLeft: 8, minWidth: sizes.touch, minHeight: sizes.touch, alignItems: 'center', justifyContent: 'center', marginRight: -10 },
  messageRow: { flexDirection: 'row', alignItems: 'center', marginTop: 6, gap: 6 },
  message: { ...typography.small, flexShrink: 1 },
  hint: { marginTop: 6 },
});

export default Input;
