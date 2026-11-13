import React, { useRef, useState } from 'react';
import { View, Text, TextInput, Pressable, StyleSheet, Platform } from 'react-native';
import { useTheme } from '../../context/ThemeContext';
import { radius, sizes, typography, fonts } from '../../theme/tokens';

/**
 * Six (or `length`) code boxes backed by a single hidden TextInput, so SMS
 * autofill, paste and password managers keep working. The active box gets a
 * teal border. Digits only.
 */
const OtpInput = ({
  value = '',
  onChangeText,
  length = 6,
  autoFocus = false,
  editable = true,
  error = false,
  accessibilityLabel = 'Verification code',
  ...inputProps
}) => {
  const { colors } = useTheme();
  const inputRef = useRef(null);
  const [focused, setFocused] = useState(false);
  const digits = String(value).slice(0, length).split('');
  const activeIndex = Math.min(digits.length, length - 1);

  return (
    <Pressable
      onPress={() => inputRef.current && inputRef.current.focus()}
      accessible={false}
      style={styles.wrap}
    >
      <View style={styles.row} pointerEvents="none" importantForAccessibility="no-hide-descendants" accessibilityElementsHidden>
        {Array.from({ length }).map((_, i) => {
          const isActive = focused && i === activeIndex;
          return (
            <View
              key={i}
              style={[
                styles.box,
                { backgroundColor: colors.surface, borderColor: 'transparent' },
                digits[i] && { backgroundColor: colors.card, borderColor: colors.border },
                isActive && { borderColor: colors.accent, backgroundColor: colors.card },
                error && !isActive && { borderColor: colors.warning },
              ]}
            >
              <Text style={[styles.digit, { color: colors.text }]}>{digits[i] || ''}</Text>
              {isActive && !digits[i] ? <View style={[styles.caret, { backgroundColor: colors.accent }]} /> : null}
            </View>
          );
        })}
      </View>
      <TextInput
        ref={inputRef}
        value={value}
        onChangeText={(v) => onChangeText && onChangeText(v.replace(/\D/g, '').slice(0, length))}
        maxLength={length}
        keyboardType="number-pad"
        textContentType="oneTimeCode"
        autoComplete={Platform.OS === 'android' ? 'sms-otp' : 'one-time-code'}
        autoFocus={autoFocus}
        editable={editable}
        caretHidden
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        accessibilityLabel={accessibilityLabel}
        accessibilityHint={`${length} digits`}
        style={styles.hiddenInput}
        {...inputProps}
      />
    </Pressable>
  );
};

const styles = StyleSheet.create({
  wrap: { width: '100%' },
  row: { flexDirection: 'row', justifyContent: 'space-between', gap: 8 },
  box: {
    flex: 1,
    maxWidth: 56,
    height: sizes.input,
    borderRadius: radius.field,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  digit: { ...typography.title, fontFamily: fonts.extrabold },
  caret: { position: 'absolute', width: 2, height: 22, borderRadius: 1 },
  // Covers the boxes so taps and long-press paste land on the real input.
  hiddenInput: { ...StyleSheet.absoluteFillObject, opacity: 0.02, color: 'transparent' },
});

export default OtpInput;
