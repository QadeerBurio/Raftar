import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import DriverDashboardScreen from '../screens/driver/DriverDashboardScreen';
import RideRequestScreen from '../screens/driver/RideRequestScreen';
import EarningsScreen from '../screens/driver/EarningsScreen';
import ProfileScreen from '../screens/common/ProfileScreen';
import ActiveRideScreen from '../screens/driver/ActiveRideScreen';
import DriverCarpoolRequestsScreen from '../screens/driver/DriverCarpoolRequestsScreen';

const Stack = createStackNavigator();

const DriverNavigator = () => {
  return (
    <Stack.Navigator
      screenOptions={{
        headerStyle: {
          backgroundColor: '#121212',
        },
        headerTitleStyle: {
          color: '#FFD700',
        },
        headerTintColor: '#FFD700',
        headerBackTitleVisible: false,
      }}
    >
      <Stack.Screen
        name="Dashboard"
        component={DriverDashboardScreen}
        options={{ title: 'Driver Dashboard' }}
      />
      <Stack.Screen
        name="RideRequest"
        component={RideRequestScreen}
        options={{ title: 'Ride Requests' }}
      />
      <Stack.Screen
        name="DriverCarpoolRequests"
        component={DriverCarpoolRequestsScreen}
        options={{ title: 'Carpool Requests' }}
      />
      <Stack.Screen
        name="Earnings"
        component={EarningsScreen}
        options={{ title: 'Earnings' }}
      />
      <Stack.Screen
        name="Profile"
        component={ProfileScreen}
        options={{ title: 'Profile' }}
      />
      <Stack.Screen
        name="ActiveRide"
        component={ActiveRideScreen}
        options={{ title: 'Active Ride', headerShown: false }}
      />
    </Stack.Navigator>
  );
};

export default DriverNavigator;