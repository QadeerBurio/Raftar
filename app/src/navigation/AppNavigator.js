import React from 'react';
import { NavigationContainer, DefaultTheme, DarkTheme } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { useSelector } from 'react-redux';
import AuthNavigator from './AuthNavigator';
import MainNavigator from './MainNavigator';
import { StatusBar } from 'react-native';

import IncomingCallScreen from '../screens/common/IncomingCallScreen';
import InCallScreen from '../screens/common/InCallScreen';
import SharedRideViewScreen from '../screens/common/SharedRideViewScreen';
import * as Linking from 'expo-linking';
import { useTheme } from '../context/ThemeContext';

// Dev-only component gallery. Not bundled into production builds.
const UiKitScreen = __DEV__ ? require('../screens/dev/UiKitScreen').default : null;

const prefix = Linking.createURL('/');
const linking = {
  prefixes: [prefix, 'raftar://'],
  config: {
    screens: {
      SharedRideView: 'share/:token',
      ...(__DEV__ ? { UiKit: 'uikit' } : {}),
    }
  }
};

const Stack = createStackNavigator();

const AppNavigator = () => {
  const { isAuthenticated, loading } = useSelector(state => state.auth);
  const { isDark, colors } = useTheme();

  if (loading) {
    return null; // Show splash screen
  }

  const customTheme = {
    ...(isDark ? DarkTheme : DefaultTheme),
    colors: {
      ...(isDark ? DarkTheme.colors : DefaultTheme.colors),
      background: colors.background,
      card: colors.card,
      text: colors.text,
      border: colors.border,
      primary: colors.accent,
    },
  };

  return (
    <>
      <StatusBar barStyle={colors.statusBarStyle} backgroundColor={colors.background} />
      <NavigationContainer linking={linking} theme={customTheme}>
        <Stack.Navigator screenOptions={{ headerShown: false }}>
          {!isAuthenticated ? (
            <Stack.Screen name="Auth" component={AuthNavigator} />
          ) : (
            <>
              <Stack.Screen name="Main" component={MainNavigator} />
              <Stack.Screen 
                name="IncomingCall" 
                component={IncomingCallScreen} 
                options={{ presentation: 'fullScreenModal' }} 
              />
              <Stack.Screen 
                name="InCall" 
                component={InCallScreen} 
                options={{ presentation: 'fullScreenModal' }} 
              />
            </>
          )}
          <Stack.Screen name="SharedRideView" component={SharedRideViewScreen} />
          {__DEV__ && UiKitScreen ? <Stack.Screen name="UiKit" component={UiKitScreen} /> : null}
        </Stack.Navigator>
      </NavigationContainer>
    </>
  );
};

export default AppNavigator;