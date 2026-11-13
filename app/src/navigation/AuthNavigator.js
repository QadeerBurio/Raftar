import React from 'react';
import {RecoveryProvider} from '../screens/auth/RecoveryContext';
import {ForgotPasswordScreen,VerifyResetOTPScreen,NewPasswordScreen,RecoverySuccessScreen} from '../screens/auth/RecoveryScreens';
import { createStackNavigator } from '@react-navigation/stack';
import LoginScreen from '../screens/auth/LoginScreen';
import RegisterScreen from '../screens/auth/RegisterScreen';
import OTPScreen from '../screens/auth/OTPScreen';

const Stack = createStackNavigator();

const AuthNavigator = () => {
  return (
    <RecoveryProvider><Stack.Navigator
      initialRouteName="Login"
      screenOptions={{
        headerShown: false,
        cardStyle: { backgroundColor: '#121212' }
      }}
    >
      <Stack.Screen name="ForgotPassword" component={ForgotPasswordScreen} />
      <Stack.Screen name="VerifyResetOTP" component={VerifyResetOTPScreen} />
      <Stack.Screen name="NewPassword" component={NewPasswordScreen} />
      <Stack.Screen name="RecoverySuccess" component={RecoverySuccessScreen} />
      <Stack.Screen name="Login" component={LoginScreen} />
      <Stack.Screen name="Register" component={RegisterScreen} />
      <Stack.Screen name="OTP" component={OTPScreen} />
    </Stack.Navigator></RecoveryProvider>
  );
};

export default AuthNavigator;