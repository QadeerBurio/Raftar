import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  KeyboardAvoidingView,
  Platform,
  Alert,
  StatusBar,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useDispatch } from 'react-redux';
import { useNavigation, useRoute } from '@react-navigation/native';
import { ShieldCheck } from 'lucide-react-native';
import { verifyOTP, sendOTP } from '../../redux/slices/authSlice';
import api from '../../services/api';
import { useTheme } from '../../context/ThemeContext';
import { Button, Header, OtpInput } from '../../components/ui';
import { fonts, radius, spacing, typography } from '../../theme/tokens';

const OTPScreen = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const dispatch = useDispatch();
  const { colors } = useTheme();
  const styles = React.useMemo(() => createStyles(colors), [colors]);

  const { phoneNumber } = route.params || {};
  const [otp, setOtp] = useState('');
  const [loading, setLoading] = useState(false);
  const [resendTimer, setResendTimer] = useState(30);
  const [canResend, setCanResend] = useState(false);

  useEffect(() => {
    if (!phoneNumber) {
      navigation.goBack();
    }
    startTimer();
  }, []);

  const startTimer = () => {
    setCanResend(false);
    setResendTimer(30);
    const interval = setInterval(() => {
      setResendTimer((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          setCanResend(true);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  };

  const handleVerifyOTP = async () => {
    if (!otp || otp.length < 4) {
      Alert.alert('Error', 'Please enter the OTP');
      return;
    }

    setLoading(true);
    try {
      await dispatch(verifyOTP({ phoneNumber, otp })).unwrap();
      // Navigation handled by AppNavigator
    } catch (error) {
      Alert.alert('Verification Failed', error.message || 'Invalid OTP');
    } finally {
      setLoading(false);
    }
  };

  const handleResendOTP = async () => {
    if (!canResend) return;
    
    try {
      await api.post('/auth/send-otp', { phoneNumber });
      Alert.alert('Success', 'OTP resent successfully');
      startTimer();
    } catch (error) {
      Alert.alert('Error', 'Failed to resend OTP');
    }
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'bottom']}>
      <StatusBar barStyle={colors.statusBarStyle} backgroundColor={colors.background} />
      <Header title="" style={styles.header} />
      <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <View style={styles.content}>
          <View style={styles.iconBox}>
            <ShieldCheck size={36} color={colors.accent} strokeWidth={2} />
          </View>
          <Text style={styles.title} accessibilityRole="header">Verify your phone</Text>
          <Text style={styles.subtitle}>
            Enter the 6-digit code we sent to{' '}
            <Text style={styles.phone}>{/^3\d{9}$/.test(phoneNumber || '') ? `+92 ${phoneNumber}` : phoneNumber}</Text>
          </Text>

          <OtpInput value={otp} onChangeText={setOtp} autoFocus accessibilityLabel="Six-digit verification code" />

          <Button title="Verify" onPress={handleVerifyOTP} loading={loading} style={styles.verify} />

          <View style={styles.resendRow}>
            <Text style={styles.muted}>Didn&apos;t get the code? </Text>
            {canResend ? (
              <Pressable onPress={handleResendOTP} accessibilityRole="button" hitSlop={12}>
                <Text style={styles.link}>Resend code</Text>
              </Pressable>
            ) : (
              <View style={styles.timerPill} accessibilityLabel={`Resend available in ${resendTimer} seconds`}>
                <Text style={styles.timerText}>Resend in 0:{String(resendTimer).padStart(2, '0')}</Text>
              </View>
            )}
          </View>

          <Pressable style={styles.change} onPress={() => navigation.goBack()} accessibilityRole="button" hitSlop={8}>
            <Text style={styles.changeText}>Change phone number</Text>
          </Pressable>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const createStyles = (colors) => StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: colors.background },
  flex: { flex: 1 },
  header: { paddingHorizontal: spacing.screenAuth },
  content: { flex: 1, paddingHorizontal: spacing.screenAuth, paddingTop: spacing.l },
  iconBox: {
    width: 72, height: 72, borderRadius: radius.cardLarge, backgroundColor: colors.surface,
    alignItems: 'center', justifyContent: 'center', marginBottom: spacing.xxl,
  },
  title: { ...typography.display, color: colors.text },
  subtitle: { ...typography.body, color: colors.textSecondary, marginTop: spacing.s, marginBottom: spacing.xxl },
  phone: { fontFamily: fonts.bold, color: colors.text },
  verify: { marginTop: spacing.xxl },
  resendRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', marginTop: spacing.xxl, minHeight: 44 },
  muted: { ...typography.body, color: colors.textSecondary },
  link: { ...typography.bodyStrong, fontFamily: fonts.bold, color: colors.accent },
  timerPill: { backgroundColor: colors.surface, borderRadius: radius.chip, paddingHorizontal: spacing.l, paddingVertical: 6 },
  timerText: { ...typography.small, fontFamily: fonts.semibold, color: colors.text },
  change: { alignSelf: 'center', minHeight: 44, justifyContent: 'center', marginTop: spacing.s },
  changeText: { ...typography.small, color: colors.textSecondary, textDecorationLine: 'underline' },
});

export default OTPScreen;
