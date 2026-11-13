import React, { useEffect, useRef } from 'react';
import { 
  createBottomTabNavigator, 
  BottomTabNavigationOptions 
} from '@react-navigation/bottom-tabs';
import { createStackNavigator, TransitionPresets } from '@react-navigation/stack';
import { useSelector } from 'react-redux';
import { 
  Animated, 
  View, 
  Text, 
  StyleSheet, 
  Dimensions, 
  TouchableOpacity,
  Platform
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import IconIonic from 'react-native-vector-icons/Ionicons';
import IconFA from 'react-native-vector-icons/FontAwesome5';
import IconMC from 'react-native-vector-icons/MaterialCommunityIcons';
import { LinearGradient } from 'expo-linear-gradient';

// Passenger Screens
import HomeScreen from '../screens/passenger/HomeScreen';
import BookRideScreen from '../screens/passenger/QuotedRideScreen';
import BookCarpoolScreen from '../screens/passenger/BookCarpoolScreen';
import CreateSubscriptionScreen from '../screens/passenger/CreateSubscriptionScreen';
import MySubscriptionsScreen from '../screens/passenger/MySubscriptionsScreen';
import SendParcelScreen from '../screens/passenger/SendParcelScreen';
import BookIntercityScreen from '../screens/passenger/QuotedRideScreen';
import RideTrackingScreen from '../screens/passenger/RideTrackingScreen';
import PaymentScreen from '../screens/passenger/ReceiptScreen';
import SpendingScreen from '../screens/passenger/SpendingScreen';
import CreditsScreen from '../screens/passenger/CreditsScreen';

// Driver Screens
import DriverDashboardScreen from '../screens/driver/DriverDashboardScreen';
import RideRequestScreen from '../screens/driver/RideRequestScreen';
import EarningsScreen from '../screens/driver/EarningsScreen';
import DriverRegistrationScreen from '../screens/driver/DriverRegistrationScreen';
import ActiveRideScreen from '../screens/driver/ActiveRideScreen';
import CreateCarpoolScreen from '../screens/driver/CreateCarpoolScreen';
import ManageCarpoolsScreen from '../screens/driver/ManageCarpoolsScreen';
import CarpoolExecutionScreen from '../screens/driver/CarpoolExecutionScreen';
import DriverCarpoolRequestsScreen from '../screens/driver/DriverCarpoolRequestsScreen';
import DriverSubscriptionRequestsScreen from '../screens/driver/DriverSubscriptionRequestsScreen';
import DriverSubscriptionsScreen from '../screens/driver/DriverSubscriptionsScreen';
import DriverIntercityScreen from '../screens/driver/DriverIntercityScreen';

// Common Screens
import ProfileScreen from '../screens/common/ProfileScreen';
import SettingsScreen from '../screens/common/SettingsScreen';
import PaymentMethodsScreen from '../screens/common/PaymentMethodsScreen';
import WalletScreen from '../screens/common/WalletScreen';
import HelpCenterScreen from '../screens/common/HelpCenterScreen';
import RideHistoryScreen from '../screens/common/RideHistoryScreen';
import Notifications from '../screens/common/Notifications';
import AboutRaftar from '../screens/common/AboutRaftar';

const Tab = createBottomTabNavigator();
const Stack = createStackNavigator();
const { width } = Dimensions.get('window');

// Modern Color Palette
const COLORS = {
  primary: '#F8B82A',
  primaryDark: '#E6A520',
  primaryLight: '#FFF8E6',
  primaryGradientStart: '#F8B82A',
  primaryGradientEnd: '#F9C349',
  white: '#FFFFFF',
  black: '#000000',
  dark: '#121212',
  gray: '#F5F5F5',
  grayBorder: '#EEEEEE',
  grayText: '#888888',
  grayLight: '#999999',
  darkGray: '#1A1A1A',
  tabInactive: '#999999',
  tabActive: '#F8B82A',
};

// Custom Tab Bar Button with Enhanced Animation
const CustomTabBarButton = ({ children, onPress, accessibilityState, label }) => {
  const focused = accessibilityState?.selected || false;
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const translateYAnim = useRef(new Animated.Value(0)).current;
  const opacityAnim = useRef(new Animated.Value(1)).current;
  const glowAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.spring(scaleAnim, {
        toValue: focused ? 1.15 : 1,
        friction: 4,
        tension: 80,
        useNativeDriver: true,
      }),
      Animated.spring(translateYAnim, {
        toValue: focused ? -8 : 0,
        friction: 6,
        tension: 60,
        useNativeDriver: true,
      }),
      Animated.timing(opacityAnim, {
        toValue: focused ? 1 : 0.6,
        duration: 200,
        useNativeDriver: true,
      }),
      Animated.spring(glowAnim, {
        toValue: focused ? 1 : 0,
        friction: 5,
        tension: 40,
        useNativeDriver: true,
      }),
    ]).start();
  }, [focused]);

  return (
    <TouchableOpacity
      activeOpacity={0.7}
      onPress={onPress}
      style={styles.customTabButton}
    >
      <Animated.View
        style={{
          transform: [{ scale: scaleAnim }, { translateY: translateYAnim }],
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        {/* Glow Effect */}
        <Animated.View 
          style={[
            styles.tabGlow, 
            { 
              opacity: glowAnim,
              transform: [{ scale: glowAnim.interpolate({
                inputRange: [0, 1],
                outputRange: [0.5, 1.2]
              })}]
            }
          ]} 
        />
        
        {/* Icon Container */}
        <Animated.View style={{ opacity: opacityAnim }}>
          {children}
        </Animated.View>
        
        {/* Label with animation */}
        {focused && (
          <Animated.View 
            style={[
              styles.tabLabelContainer,
              {
                opacity: glowAnim,
                transform: [{ scale: glowAnim.interpolate({
                  inputRange: [0, 1],
                  outputRange: [0.8, 1]
                })}]
              }
            ]}
          >
            <LinearGradient
              colors={[COLORS.primaryGradientStart, COLORS.primaryGradientEnd]}
              style={styles.tabLabelGradient}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
            >
              <Text style={styles.tabLabelText}>{label}</Text>
            </LinearGradient>
          </Animated.View>
        )}
      </Animated.View>
    </TouchableOpacity>
  );
};

// Common screen options for all stacks with modern transitions
const screenOptions = {
  headerShown: false,
  cardStyle: { backgroundColor: 'transparent' },
  ...TransitionPresets.SlideFromRightIOS,
  gestureEnabled: true,
  gestureDirection: 'horizontal',
};

// Passenger Stack Navigator
const PassengerStackNavigator = () => {
  return (
    <Stack.Navigator 
      screenOptions={screenOptions}
      initialRouteName="PassengerHome"
    >
      <Stack.Screen 
        name="PassengerHome" 
        component={HomeScreen}
        options={{
          cardStyle: { backgroundColor: 'transparent' },
        }}
      />
      <Stack.Screen name="BookRide" component={BookRideScreen} />
      <Stack.Screen name="BookCarpool" component={BookCarpoolScreen} />
      <Stack.Screen name="CreateSubscription" component={CreateSubscriptionScreen} />
      <Stack.Screen name="MySubscriptions" component={MySubscriptionsScreen} />
      <Stack.Screen name="SendParcel" component={SendParcelScreen} />
      <Stack.Screen name="Notifications" component={Notifications} />
      <Stack.Screen name="BookIntercity" component={BookIntercityScreen} />
      <Stack.Screen name="RideTracking" component={RideTrackingScreen} />
      <Stack.Screen name="Payment" component={PaymentScreen} />
      <Stack.Screen name="Spending" component={SpendingScreen} />
      <Stack.Screen name="Profile" component={ProfileScreen} />
      <Stack.Screen name="Settings" component={SettingsScreen} />
      <Stack.Screen name="About" component={AboutRaftar} />
      <Stack.Screen name="PaymentMethods" component={PaymentMethodsScreen} />
      <Stack.Screen name="Wallet" component={WalletScreen} />
      <Stack.Screen name="Credits" component={CreditsScreen} />
      <Stack.Screen name="HelpCenter" component={HelpCenterScreen} />
      <Stack.Screen name="RideHistory" component={RideHistoryScreen} />
    </Stack.Navigator>
  );
};

// Driver Stack Navigator
const DriverStackNavigator = () => {
  return (
    <Stack.Navigator 
      screenOptions={screenOptions}
      initialRouteName="DriverHome"
    >
      <Stack.Screen name="DriverHome" component={DriverDashboardScreen} />
      <Stack.Screen name="DriverRegistration" component={DriverRegistrationScreen} />
      <Stack.Screen name="RideRequest" component={RideRequestScreen} />
      <Stack.Screen name="ActiveRide" component={ActiveRideScreen} />
      <Stack.Screen name="CreateCarpool" component={CreateCarpoolScreen} />
      <Stack.Screen name="ManageCarpools" component={ManageCarpoolsScreen} />
      <Stack.Screen name="DriverCarpoolRequests" component={DriverCarpoolRequestsScreen} />
      <Stack.Screen name="DriverSubscriptionRequests" component={DriverSubscriptionRequestsScreen} />
      <Stack.Screen name="DriverSubscriptions" component={DriverSubscriptionsScreen} />
      <Stack.Screen name="CarpoolExecution" component={CarpoolExecutionScreen} />
      <Stack.Screen name="DriverIntercity" component={DriverIntercityScreen} />
      <Stack.Screen name="Earnings" component={EarningsScreen} />
      <Stack.Screen name="Spending" component={SpendingScreen} />
      <Stack.Screen name="Profile" component={ProfileScreen} />
      <Stack.Screen name="Settings" component={SettingsScreen} />
      <Stack.Screen name="Wallet" component={WalletScreen} />
      <Stack.Screen name="Credits" component={CreditsScreen} />
      <Stack.Screen name="HelpCenter" component={HelpCenterScreen} />
      <Stack.Screen name="RideHistory" component={RideHistoryScreen} />
      <Stack.Screen name="Notifications" component={Notifications} />
      <Stack.Screen name="PaymentMethods" component={PaymentMethodsScreen} />
      <Stack.Screen name="About" component={AboutRaftar} />
    </Stack.Navigator>
  );
};

// Driver Earnings Stack Navigator (NEW)
const DriverEarningsStackNavigator = () => {
  return (
    <Stack.Navigator 
      screenOptions={screenOptions}
      initialRouteName="EarningsMain"
    >
      <Stack.Screen name="EarningsMain" component={EarningsScreen} />
      <Stack.Screen name="Profile" component={ProfileScreen} />
      <Stack.Screen name="Settings" component={SettingsScreen} />
      <Stack.Screen name="Wallet" component={WalletScreen} />
      <Stack.Screen name="Credits" component={CreditsScreen} />
      <Stack.Screen name="HelpCenter" component={HelpCenterScreen} />
      <Stack.Screen name="RideHistory" component={RideHistoryScreen} />
      <Stack.Screen name="Notifications" component={Notifications} />
      <Stack.Screen name="PaymentMethods" component={PaymentMethodsScreen} />
      <Stack.Screen name="About" component={AboutRaftar} />
    </Stack.Navigator>
  );
};

// Profile Stack Navigator
const ProfileStackNavigator = () => {
  const { user } = useSelector(state => state.auth || { user: null });
  const isDriver = user?.role === 'driver';

  return (
    <Stack.Navigator 
      screenOptions={screenOptions}
      initialRouteName="ProfileMain"
    >
      <Stack.Screen name="ProfileMain" component={ProfileScreen} />
      <Stack.Screen name="Settings" component={SettingsScreen} />
      <Stack.Screen name="Notifications" component={Notifications} />
      <Stack.Screen name="PaymentMethods" component={PaymentMethodsScreen} />
      <Stack.Screen name="Wallet" component={WalletScreen} />
      <Stack.Screen name="Credits" component={CreditsScreen} />
      <Stack.Screen name="HelpCenter" component={HelpCenterScreen} />
      <Stack.Screen name="RideHistory" component={RideHistoryScreen} />
      <Stack.Screen name="About" component={AboutRaftar} />
      {!isDriver && (
        <Stack.Screen name="Spending" component={SpendingScreen} />
      )}
    </Stack.Navigator>
  );
};

const MainNavigator = () => {
  const { user } = useSelector(state => state.auth || { user: null });
  const isDriver = user?.role === 'driver';

  return isDriver ? <DriverStackNavigator /> : <PassengerStackNavigator />;
};

export default MainNavigator;