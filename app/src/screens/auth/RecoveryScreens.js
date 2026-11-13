import React, { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, AppState, BackHandler, KeyboardAvoidingView, Platform, ScrollView, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import api from '../../services/api';
import AppButton from '../../components/common/Button';
function Button({
  variant = 'primary',
  ...props
}) {
  const {
    colors
  } = useTheme();
  return <AppButton {...props} variant={variant} style={{
    marginVertical: 6,
    backgroundColor: variant === 'primary' ? colors.accent : 'transparent',
    borderColor: colors.accent
  }} textStyle={{
    color: variant === 'primary' ? '#111' : colors.accent
  }} />;
}
import { useTheme } from '../../context/ThemeContext';
import { useRecovery, passwordValid, normalizeRecoveryDestination } from './RecoveryContext';
function Frame({
  title,
  error,
  busy,
  children
}) {
  const {
    colors
  } = useTheme();
  return <SafeAreaView style={{
    flex: 1,
    backgroundColor: colors.background
  }}><KeyboardAvoidingView style={{
      flex: 1
    }} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}><ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={{
        padding: 24,
        flexGrow: 1,
        justifyContent: 'center'
      }}><Text style={{
          fontSize: 26,
          fontWeight: 'bold',
          color: colors.text,
          marginBottom: 20
        }}>{title}</Text>{children}{error ? <Text accessibilityRole="alert" style={{
          color: '#D9534F',
          marginVertical: 12
        }}>{error}</Text> : null}{busy && <ActivityIndicator color={colors.accent} />}</ScrollView></KeyboardAvoidingView></SafeAreaView>;
}
function Field(props) {
  const {
    colors
  } = useTheme();
  return <TextInput {...props} placeholderTextColor={colors.textSecondary} style={{
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    padding: 14,
    color: colors.text,
    marginVertical: 8
  }} />;
}
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
export function ForgotPasswordScreen({
  navigation
}) {
  const [dest, setDest] = useState('');
  const recovery = useRecovery(),
    action = useAction();
  const {
    colors
  } = useTheme();
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
  return <Frame title="Forgot password?" {...action}><Text style={{
      color: colors.text
    }}>Use the phone number or email already verified on your account. Pakistan mobile numbers may begin with 03 or +92.</Text><Field accessibilityLabel="Verified phone or email" placeholder="Phone number or email" autoCapitalize="none" autoCorrect={false} autoComplete="username" value={dest} onChangeText={setDest} /><Button loading={action.busy} title="Send OTP" disabled={action.busy} onPress={send} /><Button variant="outline" title="Back to Login" disabled={action.busy} onPress={() => navigation.reset({
      index: 0,
      routes: [{
        name: 'Login'
      }]
    })} /></Frame>;
}
export function VerifyResetOTPScreen({
  navigation
}) {
  const recovery = useRecovery(),
    action = useAction();
  const [otp, setOtp] = useState(''),
    [clock, setClock] = useState(Date.now());
  const {
    colors
  } = useTheme();
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
  return <Frame title="Verify reset code" {...action}><Text style={{
      color: colors.text
    }}>If an eligible account exists, a code has been sent to {c?.maskedDestination}.</Text><Field accessibilityLabel="Six-digit code" placeholder="Six-digit OTP" keyboardType="number-pad" textContentType="oneTimeCode" autoComplete={Platform.OS === 'android' ? 'sms-otp' : 'one-time-code'} maxLength={6} value={otp} onChangeText={v => setOtp(v.replace(/\D/g, '').slice(0, 6))} /><Text style={{
      color: colors.text
    }}>{expiry ? `Code expires in ${expiry}s` : 'Code expired. Request a new code.'}</Text><Button loading={action.busy} title="Verify OTP" disabled={action.busy || !expiry} onPress={verify} /><Button title={cooldown ? `Resend OTP in ${cooldown}s` : 'Resend OTP'} disabled={action.busy || !!cooldown} onPress={resend} /><Button variant="outline" title="Change number/email" disabled={action.busy} onPress={async () => {
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
    }} /></Frame>;
}
export function NewPasswordScreen({
  navigation
}) {
  const recovery = useRecovery(),
    action = useAction();
  const [password, setPassword] = useState(''),
    [confirm, setConfirm] = useState(''),
    [show, setShow] = useState(false),
    [showConfirm, setShowConfirm] = useState(false);
  const {
    colors
  } = useTheme();
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
  return <Frame title="Create new password" {...action}><Text style={{
      color: colors.text
    }}>At least 6 characters; at most 72 UTF-8 bytes. Spaces, paste and password managers are supported.</Text><Field accessibilityLabel="New password" placeholder="New password" secureTextEntry={!show} autoCapitalize="none" autoCorrect={false} textContentType="newPassword" autoComplete="new-password" value={password} onChangeText={setPassword} /><TouchableOpacity accessibilityRole="button" onPress={() => setShow(!show)}><Text style={{
        color: colors.accent
      }}>{show ? 'Hide' : 'Show'} new password</Text></TouchableOpacity><Field accessibilityLabel="Confirm password" placeholder="Confirm password" secureTextEntry={!showConfirm} autoCapitalize="none" autoCorrect={false} textContentType="newPassword" autoComplete="new-password" value={confirm} onChangeText={setConfirm} /><TouchableOpacity accessibilityRole="button" onPress={() => setShowConfirm(!showConfirm)}><Text style={{
        color: colors.accent
      }}>{showConfirm ? 'Hide' : 'Show'} confirmation</Text></TouchableOpacity>{password && !passwordValid(password) ? <Text style={{
      color: '#D9534F'
    }}>Password does not meet the policy.</Text> : null}{confirm && password !== confirm ? <Text style={{
      color: '#D9534F'
    }}>Passwords do not match.</Text> : null}<Button variant="outline" title="Request a new code" disabled={action.busy} onPress={async () => {
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
    }} /><Button loading={action.busy} title="Reset Password" disabled={action.busy || !passwordValid(password) || password !== confirm} onPress={reset} /></Frame>;
}
export function RecoverySuccessScreen({
  navigation
}) {
  const recovery = useRecovery();
  const {
    colors
  } = useTheme();
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
  return <Frame title="Password reset"><Text style={{
      color: colors.text,
      marginBottom: 20
    }}>Password reset successfully. Please sign in with your new password.</Text><Button title="Return to Login" onPress={() => navigation.reset({
      index: 0,
      routes: [{
        name: 'Login'
      }]
    })} /></Frame>;
}
