import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import HomeScreen from '../screens/passenger/HomeScreen';
import BookRideScreen from '../screens/passenger/QuotedRideScreen';
import BookCarpoolScreen from '../screens/passenger/BookCarpoolScreen';
import SendParcelScreen from '../screens/passenger/SendParcelScreen';
import RideTrackingScreen from '../screens/passenger/RideTrackingScreen';
import PaymentScreen from '../screens/passenger/ReceiptScreen';
import ProfileScreen from '../screens/common/ProfileScreen';

const Stack = createStackNavigator();

const PassengerNavigator = () => {
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
        name="Home"
        component={HomeScreen}
        options={{ title: 'Raftar' }}
      />
      <Stack.Screen
        name="BookRide"
        component={BookRideScreen}
        options={{ title: 'Book a Ride' }}
      />
      <Stack.Screen
        name="BookCarpool"
        component={BookCarpoolScreen}
        options={{ title: 'Book Carpool' }}
      />
      <Stack.Screen
        name="SendParcel"
        component={SendParcelScreen}
        options={{ title: 'Send Parcel' }}
      />
      <Stack.Screen
        name="RideTracking"
        component={RideTrackingScreen}
        options={{ title: 'Your Ride' }}
      />
      <Stack.Screen
        name="Payment"
        component={PaymentScreen}
        options={{ title: 'Payment' }}
      />
      <Stack.Screen
        name="Profile"
        component={ProfileScreen}
        options={{ title: 'Profile' }}
      />
    </Stack.Navigator>
  );
};

export default PassengerNavigator;