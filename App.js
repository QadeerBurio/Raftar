import React, { useEffect } from 'react';
import * as SplashScreen from 'expo-splash-screen';

// Keep the native splash up until Inter has loaded (hidden in App below).
SplashScreen.preventAutoHideAsync().catch(() => {});
import { LogBox } from 'react-native';

// --- Error Logging Setup ---
// Expo/React Native sometimes shows errors on device but swallows terminal output.
// This ensures errors always print to the Metro bundler terminal.
if (__DEV__) {
  const originalConsoleError = console.error;
  console.error = (...args) => {
    console.log('\n❌ [EXPO ERROR]:', ...args, '\n');
    originalConsoleError(...args);
  };

  const originalConsoleWarn = console.warn;
  console.warn = (...args) => {
    console.log('\n⚠️ [EXPO WARN]:', ...args, '\n');
    originalConsoleWarn(...args);
  };

  if (global.ErrorUtils) {
    const originalErrorHandler = global.ErrorUtils.getGlobalHandler();
    global.ErrorUtils.setGlobalHandler((error, isFatal) => {
      console.log('\n💥 [FATAL UNHANDLED ERROR]:', error?.message || error);
      console.log('Stack Trace:\n', error?.stack, '\n');
      if (originalErrorHandler) {
        originalErrorHandler(error, isFatal);
      }
    });
  }
}
// ---------------------------
import { Provider } from 'react-redux';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { store } from './app/src/redux/store';
import AppNavigator from './app/src/navigation/AppNavigator';
import { SocketProvider } from './app/src/context/SocketContext';
import { ThemeProvider } from './app/src/context/ThemeContext';
import { NotificationProvider } from './app/src/context/NotificationContext';
import notificationService from './app/src/services/notificationService';
import {
  useFonts,
  Inter_400Regular,
  Inter_500Medium,
  Inter_600SemiBold,
  Inter_700Bold,
  Inter_800ExtraBold,
  Inter_900Black,
} from '@expo-google-fonts/inter';

export default function App() {
  const [fontsLoaded, fontError] = useFonts({
    Inter_400Regular,
    Inter_500Medium,
    Inter_600SemiBold,
    Inter_700Bold,
    Inter_800ExtraBold,
    Inter_900Black,
  });

  useEffect(() => {
    // Initialize notifications
    const initNotifications = async () => {
      await notificationService.registerForPushNotifications();
      notificationService.setupNotificationListeners();
    };
    
    initNotifications();

    // Cleanup on unmount
    return () => {
      notificationService.cleanup();
    };
  }, []);

  const fontsReady = fontsLoaded || !!fontError;

  useEffect(() => {
    // If Inter fails to load, continue with the system font rather than blocking.
    if (fontsReady) {
      SplashScreen.hideAsync().catch(() => {});
    }
  }, [fontsReady]);

  if (!fontsReady) {
    return null;
  }

  return (
    <Provider store={store}>
      <SafeAreaProvider>
       