import React, { useEffect, useRef, useState } from 'react';
import { AppState, BackHandler, KeyboardAvoidingView, Platform, ScrollView, Text, View, StyleSheet, StatusBar } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { KeyRound, MessageSquareText, LockKeyhole, CircleCheck, AtSign, Lock } from 'lucide-react-native';
import api from '../../services/api';
import { useTheme } from '../../context/ThemeContext';
import { Button, Input, OtpInput, InlineMessage } from '../../components/ui';
import { radius, spacing, typography, fonts } from '../../theme/tokens';
import { useRecovery, passwordValid, normalizeRecoveryDestination } from './RecoveryContext';

// ---------- Presentation helpers (UI only) ----------

function Frame({ icon: Icon, title, description, error, children }) {
  const { colors } = useTheme();
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
      <StatusBar barStyle={colors.statusBarStyle} backgroundColor={colors.background} />
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={frame.scroll}>
          {Icon ? (
            <View style={[frame.iconBox, { backgroundColor: colors.surface }]}>
              <Icon size={36} color={colors.accent} strokeWidth={2} />
            </View>
          ) : null}
          <Text style={[frame.title, { color: colors.text }]} accessibilityRole="header">{title}</Text>
          {description ? <Text style={[frame.description, { color: colors.textSecondary }]}>{description}</Text> : null}
          {children}
          {error ? <InlineMessage style={frame.error}>{error}</InlineMessage> : null}
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const frame = StyleSheet.create({
  scroll: { flexGrow: 1, justifyContent: 'center', paddingHorizontal: spacing.screenAuth, paddingVertical: spacing.xxl },
  iconBox: { width: 72, height: 72, borderRadius: radius.cardLarge, alignItems: 'center', justifyContent: 'center', marginBottom: spacing.xxl },
  title: { ...typography.display },
  description: { ...typography.body, marginTop: spacing.s, marginBottom: spacing.xxl },
  error: { marginTop: spacing.l },
  gap: { height: spacing.l },
  meta: { ...typography.small, textAlign: 'center', marginTop: spacing.l },
  strong: { fontFamily: fonts.bold },
});

// ---------- Logic helpers (unchanged) ----------

function useAction() {
  const [busy, setBusy] = useState(false),
    [error, setError] = useState('');
  const lock = useRef(false);
  const run = async fn => {
    if (lock.current) return;
    lock.current = true;
    setBusy(true);
    setError('');
    try {
      await fn();
    } catch (e) {
      setError(e.response?.data?.error || e.message || 'Please try again.');
    } finally {
      setBusy(false);
      lock.current = false;
    }
  };
  return {
    busy,
    error,
    run,
    setError
  };
}
function useSecretClear(clear) {
  useEffect(() => {
    const subscription = AppState.addEventListener('change', state => {
      if (state !== 'active') clear();
    });
    return () => subscription.remove();
  }, [clear]);
}

// ---------- Screens ----------

export function ForgotPasswordScreen({
  navigation
}) {
  const [dest, setDest] = useState('');
  const recovery = useRecovery(),
    action = useAction();
  const send = () => action.run(async () => {
    const v = normalizeRecoveryDestination(dest);
    if (!v) throw Error('Enter a valid Pakistan phone number or verified email.');
    const r = await api.post('/auth/forgot-password', {
      destination: v
    });
    await recovery.save(r.data);
    navigation.navigate('VerifyResetOTP');
  });
  useEffect(() => {
    recovery.restore().then(async saved => {
      if (saved) {
        try {
          const r = await api.post('/auth/reset-status', {
            challengeId: saved.challengeId
          });
          if (r.data.canVerify) {
            await recovery.save(r.data);
            navigation.navigate('VerifyResetOTP');
          } else await recovery.clear();
        } catch (e) {/* Keep non-secret challenge metadata available for a later retry. */}
      }
    });
  }, []);
  return (
    <Frame
      icon={KeyRound}
      title="Forgot password?"
      description="Enter the phone number or email already verified on your account. Mobile numbers can start with 03 or +92."
      error={action.error}
    >
      <Input
        label="Phone or email"
        icon={AtSign}
        accessibilityLabel="Verified phone or email"
        placeholder="03001234567 or you@email.com"
        autoCapitalize="none"
        autoCorrect={false}
        autoComplete="username"
        value={dest}
        onChangeText={setDest}
      />
      <Button loading={action.busy} title="Send code" disabled={action.busy} onPress={send} />
      <View style={frame.gap} />
      <Button
        variant="secondary"
        title="Back to sign in"
        disabled={action.busy}
        onPress={() => navigation.reset({
          index: 0,
          routes: [{
            name: 'Login'
          }]
        })}
      />
    </Frame>
  );
}

export function VerifyResetOTPScreen({
  navigation
}) {
  const recovery = useRecovery(),
    action = useAction();
  const [otp, setOtp] = useState(''),
    [clock, setClock] = useState(Date.now());
  const { colors } = useTheme();
  const c = recovery.challenge;
  useEffect(() => {
    if (!c) navigation.replace('ForgotPassword');
    const timer = setInterval(() => setClock(Date.now()), 1000);
    const foreground = AppState.addEventListener('change', state => {
      if (state === 'active' && c) api.post('/auth/reset-status', {
        challengeId: c.challengeId
      }).then(r => recovery.save(r.data)).catch(() => {});
    });
    return () => {
      clearInterval(timer);
      foreground.remove();
    };
  }, [c]);
  useSecretClear(() => setOtp(''));
  const now = clock + (c?.offset || 0),
    expiry = Math.max(0, Math.ceil((Date.parse(c?.expiresAt) - now) / 1000)) || 0,
    cooldown = Math.max(0, Math.ceil((Date.parse(c?.resendAt) - now) / 1000)) || 0;
  const verify = () => action.run(async () => {
    if (!/^\d{6}$/.test(otp)) throw Error('Enter the six-digit code.');
    const r = await api.post('/auth/verify-reset-otp', {
      challengeId: c.challengeId,
      otp
    });
    setOtp('');
    recovery.token.current = {
      value: r.data.resetToken,
      expiresAt: r.data.expiresAt
    };
    navigation.replace('NewPassword');
  });
  const resend = () => action.run(async () => {
    const r = await api.post('/auth/resend-reset-otp', {
      challengeId: c.challengeId
    });
    setOtp('');
    await recovery.save(r.data);
  });
  return (
    <Frame
      icon={MessageSquareText}
      title="Enter reset code"
      description={`If an eligible account exists, a 6-digit code has been sent to ${c?.maskedDestination || 'your phone or email'}.`}
      error={action.error}
    >
      <OtpInput accessibilityLabel="Six-digit code" value={otp} onChangeText={setOtp} autoFocus />
      <Text style={[frame.meta, { color: expiry ? colors.textSecondary : colors.warning }]}>
        {expiry ? `Code expires in ${expiry}s` : 'Code expired. Request a new code.'}
      </Text>
      <View style={{ height: spacing.xxl }} />
      <Button loading={action.busy} title="Verify code" disabled={action.busy || !expiry} onPress={verify} />
      <View style={frame.gap} />
      <Button
        variant="secondary"
        title={cooldown ? `Resend code in ${cooldown}s` : 'Resend code'}
        disabled={action.busy || !!cooldown}
        onPress={resend}
      />
      <View style={frame.gap} />
      <Button
        variant="secondary"
        title="Change phone or email"
        disabled={action.busy}
        onPress={async () => {
          setOtp('');
          await recovery.clear();
          navigation.reset({
            index: 1,
            routes: [{
              name: 'Login'
            }, {
              name: 'ForgotPassword'
            }]
          });
        }}
      />
    </Frame>
  );
}

export function NewPasswordScreen({
  navigation
}) {
  const recovery = useRecovery(),
    action = useAction();
  const [password, setPassword] = useState(''),
    [confirm, setConfirm] = useState('');
  useSecretClear(() => {
    setPassword('');
    setConfirm('');
  });
  useEffect(() => {
    if (!recovery.token.current) navigation.replace('ForgotPassword');
    return () => {
      recovery.token.current = null;
    };
  }, []);
  const reset = () => action.run(async () => {
    if (!passwordValid(password)) throw Error('Use at least 6 characters and at most 72 UTF-8 bytes. Spaces are allowed.');
    if (password !== confirm) throw Error('Passwords do not match.');
    const token = recovery.token.current;
    if (!token) throw Error('Verify a new reset code first.');
    await api.post('/auth/reset-password', {
      resetToken: token.value,
      newPassword: password,
      confirmPassword: confirm
    });
    setPassword('');
    setConfirm('');
    await recovery.clear();
    navigation.reset({
      index: 0,
      routes: [{
        name: 'RecoverySuccess'
      }]
    });
  });
  return (
    <Frame
      icon={LockKeyhole}
      title="Create new password"
      description="Use at least 6 characters. Spaces, paste and password managers all work."
      error={action.error}
    >
      <Input
        label="New password"
        icon={Lock}
        accessibilityLabel="New password"
        placeholder="New password"
        secureTextEntry
        autoCapitalize="none"
        autoCorrect={false}
        textContentType="newPassword"
        autoComplete="new-password"
        value={password}
        onChangeText={setPassword}
        error={password && !passwordValid(password) ? 'Password does not meet the policy.' : null}
      />
      <Input
        label="Confirm password"
        icon={Lock}
        accessibilityLabel="Confirm password"
        placeholder="Confirm password"
        secureTextEntry
        autoCapitalize="none"
        autoCorrect={false}
        textContentType="newPassword"
        autoComplete="new-password"
        value={confirm}
        onChangeText={setConfirm}
        error={confirm && password !== confirm ? 'Passwords do not match.' : null}
      />
      <Button
        loading={action.busy}
        title="Reset password"
        disabled={action.busy || !passwordValid(password) || password !== confirm}
        onPress={reset}
      />
      <View style={frame.gap} />
      <Button
        variant="secondary"
        title="Request a new code"
        disabled={action.busy}
        onPress={async () => {
          setPassword('');
          setConfirm('');
          await recovery.clear();
          navigation.reset({
            index: 1,
            routes: [{
              name: 'Login'
            }, {
              name: 'ForgotPassword'
            }]
          });
        }}
      />
    </Frame>
  );
}

export function RecoverySuccessScreen({
  navigation
}) {
  const recovery = useRecovery();
  useEffect(() => {
    recovery.clear();
    const back = BackHandler.addEventListener('hardwareBackPress', () => {
      navigation.reset({
        index: 0,
        routes: [{
          name: 'Login'
        }]
      });
      return true;
    });
    return () => back.remove();
  }, []);
  return (
    <Frame
      icon={CircleCheck}
      title="Password reset"
      description="Your password has been reset. Sign in with your new password."
    >
      <Button
        title="Back to sign in"
        onPress={() => navigation.reset({
          index: 0,
          routes: [{
            name: 'Login'
          }]
        })}
      />
    </Frame>
  );
}
