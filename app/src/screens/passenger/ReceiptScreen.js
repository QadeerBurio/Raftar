import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Button, SafeAreaView, ScrollView, Text } from 'react-native';
import RidePricingPanel from '../../components/common/RidePricingPanel';
import LegacyPaymentScreen from './PaymentScreen';
import api from '../../services/api';
import { useTheme } from '../../context/ThemeContext';
export default function ReceiptScreen(props) {
  const {
    colors
  } = useTheme();
  const rideId = props.route.params?.rideId;
  const [ride, setRide] = useState(null),
    [error, setError] = useState('');
  const load = () => api.get('/rides/' + rideId).then(r => {
    setRide(r.data.ride);
    setError('');
  }).catch(e => setError(e.response?.data?.error || e.message));
  useEffect(() => {
    if (rideId) load();
  }, [rideId]);
  if (ride && !ride.pricing) return <LegacyPaymentScreen {...props} />;
  return <SafeAreaView style={{
    flex: 1,
    backgroundColor: colors.background
  }}><ScrollView contentContainerStyle={{
      padding: 16
    }}><Text style={{
        color: colors.text,
        fontSize: 24
      }}>Ride receipt & payment</Text>{!rideId ? <Text style={{
        color: colors.text
      }}>A completed ride is required.</Text> : !ride && !error ? <ActivityIndicator /> : error ? <><Text style={{
          color: colors.text
        }}>{error}</Text><Button title="Retry" onPress={load} /></> : <RidePricingPanel rideId={rideId} embedded />}</ScrollView></SafeAreaView>;
}
