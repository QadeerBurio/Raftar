import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  Alert,
  Animated,
  StatusBar,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigation } from '@react-navigation/native';
import * as ImagePicker from 'expo-image-picker';
import { User, Lock, Car, X, ArrowRight } from 'lucide-react-native';
import { register, clearError } from '../../redux/slices/authSlice';
import { validatePhoneNumber, validatePassword } from '../../utils/validators';
import { useTheme } from '../../context/ThemeContext';
import { Button, Input, Header, SelectCard, InlineMessage } from '../../components/ui';
import { fonts, spacing, typography } from '../../theme/tokens';

const RegisterScreen = () => {
  const navigation = useNavigation();
  const dispatch = useDispatch();
  const { loading, error } = useSelector((state) => state.auth);
  const { colors } = useTheme();
  const styles = React.useMemo(() => createStyles(colors), [colors]);

  const [formData, setFormData] = useState({
    name: '',
    phoneNumber: '',
    password: '',
    confirmPassword: '',
    gender: 'male',
    role: 'passenger',
    profilePhoto: ''
  });
  const [profilePhoto, setProfilePhoto] = useState(null);
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Animation values
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(30)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 600,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 600,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  const handleChange = (field, value) => {
    setFormData({ ...formData, [field]: value });
    if (errors[field]) {
      setErrors({ ...errors, [field]: null });
    }
    if (error) {
      dispatch(clearError());
    }
  };

  const pickImage = async () => {
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission Needed', 'Please allow access to your photo library to set a profile picture.');
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.7,
      });

      if (!result.canceled && result.assets && result.assets[0]) {
        setProfilePhoto(result.assets[0]);
        setFormData({ ...formData, profilePhoto: result.assets[0].uri });
      }
    } catch (error) {
      console.error('Image picker error:', error);
      Alert.alert('Error', 'Failed to pick image. Please try again.');
    }
  };

  const validate = () => {
    const newErrors = {};
    
    if (!formData.name || formData.name.trim().length < 2) {
      newErrors.name = 'Name must be at least 2 characters';
    } else if (formData.name.trim().length > 50) {
      newErrors.name = 'Name must be less than 50 characters';
    }
    
    if (!formData.phoneNumber) {
      newErrors.phoneNumber = 'Phone number is required';
    } else if (!validatePhoneNumber(formData.phoneNumber)) {
      newErrors.phoneNumber = 'Enter a valid mobile number, for example 3001234567';
    }
    
    if (!formData.password) {
      newErrors.password = 'Password is required';
    } else if (!validatePassword(formData.password)) {
      newErrors.password = 'Use at least 6 characters and at most 72 UTF-8 bytes';
    }
    
    if (!formData.confirmPassword) {
      newErrors.confirmPassword = 'Please confirm your password';
    } else if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
    }

    setErrors(newErrors);
    // Return the fresh errors: the `errors` state is not updated until the next render.
    return newErrors;
  };

  const handleRegister = async () => {
    dispatch(clearError());
    
    const validationErrors = validate();
    const firstError = Object.keys(validationErrors)[0];
    if (firstError) {
      Alert.alert('Validation Error', validationErrors[firstError]);
      return;
    }

    setIsSubmitting(true);

    try {
      const userData = {
        name: formData.name.trim(),
        phoneNumber: formData.phoneNumber.trim(),
        password: formData.password,
        role: formData.role,
        gender: formData.gender,
        profilePhoto: profilePhoto?.uri || formData.profilePhoto || undefined
      };

      const result = await dispatch(register(userData)).unwrap();
      
      if (result && result.success) {
        Alert.alert(
          'Registration Successful',
          'Your account has been created successfully!',
          [
            {
              text: 'OK',
              onPress: () => {
                navigation.reset({
                  index: 0,
                  routes: [{ name: 'Main' }],
                });
              }
            }
          ]
        );
      }
    } catch (error) {
      console.error('Registration error:', error);
      
      let errorMessage = 'Registration failed. Please try again.';
      
      if (typeof error === 'string') {
        errorMessage = error;
      } else if (error.message) {
        errorMessage = error.message;
      } else if (error.error) {
        errorMessage = error.error;
      }

      if (errorMessage.toLowerCase().includes('already exists')) {
        errorMessage = 'This phone number is already registered. Please login instead.';
      } else if (errorMessage.toLowerCase().includes('network')) {
        errorMessage = 'Network error. Please check your internet connection.';
      }

      Alert.alert('Registration Failed', errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  const clearIcon = (field) => (formData[field]?.length > 0 ? X : null);

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'bottom']}>
      <StatusBar barStyle={colors.statusBarStyle} backgroundColor={colors.background} />
      <Header
        title="Create account"
        subtitle="Join Raftar and start your journey"
        style={styles.header}
        onBackPress={() => navigation.navigate('Login')}
      />
      <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView
          contentContainerStyle={styles.scroll}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          <Animated.View style={{ opacity: fadeAnim, transform: [{ translateY: slideAnim }] }}>
            <Input
              label="Full name"
              icon={User}
              placeholder="Enter your full name"
              value={formData.name}
              onChangeText={(v) => handleChange('name', v)}
              autoCapitalize="words"
              textContentType="name"
              autoComplete="name"
              editable={!isSubmitting}
              error={errors.name}
              iconRight={clearIcon('name')}
              iconRightLabel="Clear name"
              onIconPress={() => handleChange('name', '')}
            />
            <Input
              label="Phone number"
              prefix="+92"
              placeholder="3001234567"
              value={formData.phoneNumber}
              onChangeText={(v) => handleChange('phoneNumber', v)}
              keyboardType="phone-pad"
              textContentType="telephoneNumber"
              autoComplete="tel"
              editable={!isSubmitting}
              error={errors.phoneNumber}
              iconRight={clearIcon('phoneNumber')}
              iconRightLabel="Clear phone number"
              onIconPress={() => handleChange('phoneNumber', '')}
            />
            <Input
              label="Password"
              icon={Lock}
              placeholder="At least 6 characters"
              value={formData.password}
              onChangeText={(v) => handleChange('password', v)}
              secureTextEntry
              autoCapitalize="none"
              textContentType="newPassword"
              editable={!isSubmitting}
              error={errors.password}
            />
            <Input
              label="Confirm password"
              icon={Lock}
              placeholder="Re-enter your password"
              value={formData.confirmPassword}
              onChangeText={(v) => handleChange('confirmPassword', v)}
              secureTextEntry
              autoCapitalize="none"
              textContentType="newPassword"
              editable={!isSubmitting}
              error={errors.confirmPassword}
            />

            <Text style={styles.sectionLabel}>Register as</Text>
            <View style={styles.roleRow} accessibilityRole="radiogroup">
              <SelectCard
                style={styles.roleCard}
                icon={User}
                title="Passenger"
                subtitle="Book rides and parcels"
                selected={formData.role === 'passenger'}
                onPress={() => handleChange('role', 'passenger')}
                disabled={isSubmitting}
              />
              <SelectCard
                style={styles.roleCard}
                icon={Car}
                title="Driver"
                subtitle="Drive and earn"
                selected={formData.role === 'driver'}
                onPress={() => handleChange('role', 'driver')}
                disabled={isSubmitting}
              />
            </View>

            {error ? <InlineMessage style={styles.errorBox}>{error}</InlineMessage> : null}

            <Button
              title="Create account"
              iconRight={ArrowRight}
              onPress={handleRegister}
              loading={isSubmitting}
              style={styles.submit}
            />

            <View style={styles.loginRow}>
              <Text style={styles.muted}>Already have an account? </Text>
              <Pressable
                onPress={() => navigation.navigate('Login')}
                disabled={isSubmitting}
                accessibilityRole="link"
                hitSlop={12}
              >
                <Text style={styles.link}>Sign in</Text>
              </Pressable>
            </View>
          </Animated.View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const createStyles = (colors) => StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: colors.background },
  flex: { flex: 1 },
  header: { paddingHorizontal: spacing.screenAuth },
  scroll: { flexGrow: 1, paddingHorizontal: spacing.screenAuth, paddingTop: spacing.l, paddingBottom: spacing.xxl },
  sectionLabel: { ...typography.small, fontFamily: fonts.semibold, color: colors.text, marginBottom: 8 },
  roleRow: { flexDirection: 'row', gap: spacing.l, marginBottom: spacing.xxl },
  roleCard: { flex: 1, minWidth: 0 },
  errorBox: { marginBottom: spacing.xl },
  submit: { marginTop: spacing.xs },
  loginRow: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', marginTop: spacing.xxl, minHeight: 44 },
  muted: { ...typography.body, color: colors.textSecondary },
  link: { ...typography.bodyStrong, fontFamily: fonts.bold, color: colors.accent },
});

export default RegisterScreen;
