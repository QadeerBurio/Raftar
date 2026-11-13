import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Alert,
  Animated,
  StatusBar,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigation } from '@react-navigation/native';
import { Lock, X, ShieldCheck } from 'lucide-react-native';
import { login } from '../../redux/slices/authSlice';
import { useTheme } from '../../context/ThemeContext';
import { Button, Input } from '../../components/ui';
import AuthHero from './AuthHero';
import { fonts, radius, spacing, typography } from '../../theme/tokens';

const LoginScreen = () => {
  const navigation = useNavigation();
  const dispatch = useDispatch();
  const insets = useSafeAreaInsets();
  const { loading } = useSelector(state => state.auth);
  const { colors } = useTheme();
  const styles = React.useMemo(() => createStyles(colors), [colors]);

  const [phoneNumber, setPhoneNumber] = useState('');
  const [password, setPassword] = useState('');
  const [errors, setErrors] = useState({});

  // Entrance animation
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(30)).current;

  React.useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, { toValue: 1, duration: 600, useNativeDriver: true }),
      Animated.timing(slideAnim, { toValue: 0, duration: 600, useNativeDriver: true }),
    ]).start();
  }, []);

  const validate = () => {
    const newErrors = {};
    if (!phoneNumber || phoneNumber.length < 10) {
      newErrors.phoneNumber = 'Valid phone number is required';
    }
    if (!password || password.length < 6) {
      newErrors.password = 'Password must be at least 6 characters';
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleLogin = async () => {
    if (!validate()) return;
    try {
      await dispatch(login({ phoneNumber, password })).unwrap();
      // Navigation is handled by AppNavigator based on auth state
    } catch (error) {
      Alert.alert('Login Failed', error.message || 'Invalid credentials');
    }
  };

  const handleOTPLogin = () => {
    navigation.navigate('OTP', { phoneNumber });
  };

  return (
    <View style={styles.root}>
      <StatusBar barStyle="light-content" backgroundColor={colors.primary} />
      <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView
          contentContainerStyle={styles.scroll}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          bounces={false}
        >
          <AuthHero topInset={insets.top} />

          <Animated.View style={[styles.card, { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }]}>
            <Text style={styles.title} accessibilityRole="header">Welcome back</Text>
            <Text style={styles.subtitle}>Sign in to continue your journey</Text>

            <Input
              label="Phone number"
              prefix="+92"
              placeholder="300 1234567"
              value={phoneNumber}
              onChangeText={setPhoneNumber}
              keyboardType="phone-pad"
              maxLength={13}
              textContentType="telephoneNumber"
              autoComplete="tel"
              error={errors.phoneNumber}
              iconRight={phoneNumber.length > 0 ? X : null}
              iconRightLabel="Clear phone number"
              onIconPress={() => setPhoneNumber('')}
            />

            <Input
              label="Password"
              icon={Lock}
              placeholder="Enter your password"
              value={password}
              onChangeText={setPassword}
              secureTextEntry
              textContentType="password"
              autoComplete="password"
              error={errors.password}
              style={styles.passwordField}
            />

            <Pressable
              style={styles.forgot}
              onPress={() => { setPassword(''); navigation.navigate('ForgotPassword'); }}
              accessibilityRole="link"
              hitSlop={8}
            >
              <Text style={styles.link}>Forgot password?</Text>
            </Pressable>

            <Button title="Sign in" onPress={handleLogin} loading={loading} />

            <View style={styles.divider} accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
              <View style={styles.dividerLine} />
              <Text style={styles.dividerText}>or</Text>
              <View style={styles.dividerLine} />
            </View>

            <Button title="Continue with OTP" variant="secondary" icon={ShieldCheck} onPress={handleOTPLogin} />

            <View style={styles.registerRow}>
              <Text style={styles.muted}>New to Raftar? </Text>
              <Pressable onPress={() => navigation.navigate('Register')} accessibilityRole="link" hitSlop={12}>
                <Text style={styles.link}>Create account</Text>
              </Pressable>
            </View>

            {__DEV__ ? (
              <Pressable onPress={() => navigation.navigate('UiKit')} style={styles.devLink} accessibilityRole="link">
                <Text style={styles.devLinkText}>Open UI kit (dev only)</Text>
              </Pressable>
            ) : null}

            <Text style={styles.version}>Version 1.0.0</Text>
          </Animated.View>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
};

const createStyles = (colors) => StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.primary },
  flex: { flex: 1 },
  scroll: { flexGrow: 1, backgroundColor: colors.background },
  card: {
    flexGrow: 1,
    marginTop: -radius.sheet,
    backgroundColor: colors.background,
    borderTopLeftRadius: radius.sheet,
    borderTopRightRadius: radius.sheet,
    paddingHorizontal: spacing.screenAuth,
    paddingTop: 28,
    paddingBottom: spacing.xxl,
  },
  title: { ...typography.display, color: colors.text },
  subtitle: { ...typography.body, color: colors.textSecondary, marginTop: 4, marginBottom: spacing.xxl },
  passwordField: { marginBottom: 4 },
  forgot: { alignSelf: 'flex-end', minHeight: 44, justifyContent: 'center', marginBottom: spacing.l },
  link: { ...typography.bodyStrong, fontFamily: fonts.bold, color: colors.accent },
  divider: { flexDirection: 'row', alignItems: 'center', marginVertical: spacing.xl },
  dividerLine: { flex: 1, height: 1, backgroundColor: colors.border },
  dividerText: { ...typography.small, color: colors.textSecondary, paddingHorizontal: spacing.l },
  registerRow: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', marginTop: spacing.xxl, minHeight: 44 },
  muted: { ...typography.body, color: colors.textSecondary },
  devLink: { alignSelf: 'center', minHeight: 44, justifyContent: 'center' },
  devLinkText: { ...typography.small, color: colors.textSecondary, textDecorationLine: 'underline' },
  version: { ...typography.small, color: colors.textSecondary, textAlign: 'center', marginTop: spacing.l },
});

export default LoginScreen;
