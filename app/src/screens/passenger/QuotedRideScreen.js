import React, { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Alert, Button, SafeAreaView, ScrollView, Text, TextInput, View } from 'react-native';
import { useSelector } from 'react-redux';
import AsyncStorage from '@react-native-async-storage/async-storage';
import CustomPlacesAutocomplete from '../../components/common/CustomPlacesAutocomplete';
import FareBreakdown, { pkr } from '../../components/common/FareBreakdown';
import api from '../../services/api';
import { useTheme } from '../../context/ThemeContext';
const pendingKey = 'pricing-pending-booking';
const selectedPlace = (data, details) => ({
  address: data.description,
  location: {
    type: 'Point',
    coordinates: [details.geometry.location.lng, details.geometry.location.lat]
  }
});
const key = () => `booking-${Date.now()}-${Math.random().toString(36).slice(2, 12)}`;
export default function QuotedRideScreen({
  navigation,
  route
}) {
  const {
    colors
  } = useTheme();
  const user = useSelector(state => state.auth.user);
  const storageKey = pendingKey + '-' + (user?.id || user?._id || 'signed-in');
  const [catalog, setCatalog] = useState([]),
    [city, setCity] = useState(''),
    [category, setCategory] = useState('economy'),
    [pickup, setPickup] = useState(route.params?.pickup || null),
    [dropoff, setDropoff] = useState(route.params?.destination || null),
    [stops, setStops] = useState([]),
    [mode, setMode] = useState('UPFRONT'),
    [quote, setQuote] = useState(null),
    [offer, setOffer] = useState(''),
    [preview, setPreview] = useState(null),
    [error, setError] = useState(''),
    [busy, setBusy] = useState(false),
    [clock, setClock] = useState(Date.now()),
    [pending, setPending] = useState(null),
    [guestName, setGuestName] = useState(''),
    [guestPhone, setGuestPhone] = useState('');
  const lock = useRef(false),
    sequence = useRef(0),
    bookingKeys = useRef({});
  useEffect(() => {
    api.get('/pricing/v2/catalog').then(r => setCatalog(r.data.cards)).catch(e => setError(e.response?.data?.error || e.message));
    AsyncStorage.getItem(storageKey).then(v => {
      if (v) setPending(JSON.parse(v));
    }).catch(() => {});
    const timer = setInterval(() => setClock(Date.now()), 1000);
    return () => clearInterval(timer);
  }, []);
  useEffect(() => {
    sequence.current++;
    setQuote(null);
    setPreview(null);
  }, [city, category, pickup, dropoff, stops, mode]);
  const invoke = async fn => {
    if (lock.current) return;
    lock.current = true;
    setBusy(true);
    setError('');
    try {
      await fn();
    } catch (e) {
      setError(e.response?.data?.error || e.message || String(e));
    } finally {
      lock.current = false;
      setBusy(false);
    }
  };
  const refresh = () => invoke(async () => {
    if (!city || !pickup || !dropoff) throw new Error('Choose a configured city and both addresses');
    const id = ++sequence.current;
    const r = await api.post('/pricing/v2/quotes', {
      city,
      category,
      pickup,
      dropoff,
      stops,
      pricingMode: mode
    });
    if (sequence.current !== id) return;
    setQuote(r.data.quote);
    setPreview(null);
    setOffer(String(r.data.quote.snapshot.transportFarePaisa / 100));
  });
  const previewOffer = () => invoke(async () => {
    if (!/^\d+(\.\d{1,2})?$/.test(offer)) throw new Error('Enter an offer with at most two decimal places');
    const r = await api.post(`/pricing/v2/quotes/${quote._id}/offer-preview`, {
      offerPaisa: Math.round(Number(offer) * 100)
    });
    setPreview(r.data);
  });
  const remaining = quote ? Math.max(0, Math.ceil((new Date(quote.expiresAt) - clock) / 1000)) : 0;
  const sendBooking = async request => {
    await AsyncStorage.setItem(storageKey, JSON.stringify(request));
    setPending(request);
    const r = await api.post('/rides', request.payload, {
      headers: {
        'Idempotency-Key': request.key
      }
    });
    await AsyncStorage.removeItem(storageKey);
    setPending(null);
    navigation.replace('RideTracking', {
      rideId: r.data.ride._id,
      ride: r.data.ride
    });
  };
  const book = () => invoke(async () => {
    if (pending) throw new Error('Resolve the pending booking before starting another request. Retry it or cancel it below.');
    if (!remaining) throw new Error('Quote expired. Refresh and review the new total.');
    if (mode === 'NEGOTIATED' && preview?.offerPaisa !== Math.round(Number(offer) * 100)) throw new Error('Preview the offer total before booking');
    const qid = quote._id;
    bookingKeys.current[qid] = bookingKeys.current[qid] || key();
    await sendBooking({
      quote,
      key: bookingKeys.current[qid],
      payload: {
        quoteId: qid,
        category,
        type: route.name === 'BookIntercity' ? 'intercity' : 'solo',
        ...(mode === 'NEGOTIATED' ? {
          offerPaisa: preview.offerPaisa
        } : {}),
        ...(guestPhone ? {
          guest: {
            isGuestBooking: true,
            name: guestName,
            phoneNumber: guestPhone
          }
        } : {})
      }
    });
  });
  const discardPending = () => invoke(async () => {
    try {
      await api.delete('/pricing/v2/quotes/' + pending.payload.quoteId);
      await AsyncStorage.removeItem(storageKey);
      setPending(null);
      setQuote(null);
    } catch (error) {
      if (error.response?.status === 409 && error.response?.data?.rideId) {
        const id = error.response.data.rideId;
        await AsyncStorage.removeItem(storageKey);
        setPending(null);
        navigation.replace('RideTracking', {
          rideId: id
        });
      } else throw error;
    }
  });
  const selected = catalog.find(c => c.city === city && c.category === category);
  return <SafeAreaView style={{
    flex: 1,
    backgroundColor: colors.background
  }}><ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={{
      padding: 16
    }}>
    <Text style={{
        color: colors.text,
        fontSize: 24,
        fontWeight: 'bold'
      }}>Book a ride</Text><Text style={{
        color: colors.text
      }}>Select an explicitly configured city. No city rates are used outside its service zone.</Text>
    <View style={{
        flexDirection: 'row',
        flexWrap: 'wrap'
      }}>{[...new Set(catalog.map(c => c.city))].map(c => <Button key={c} title={`${city === c ? '✓ ' : ''}${c}`} onPress={() => setCity(c)} />)}</View>{catalog.length === 0 && <Text style={{
        color: colors.text
      }}>No published pilot rates available. Ask support to configure your city.</Text>}
    <Text style={{
        color: colors.text
      }}>Pickup: {pickup?.address || 'Choose address'}</Text><CustomPlacesAutocomplete placeholder="Pickup address" onPress={(d, x) => setPickup(selectedPlace(d, x))} />
    <Text style={{
        color: colors.text
      }}>Destination: {dropoff?.address || 'Choose address'}</Text><CustomPlacesAutocomplete placeholder="Destination" onPress={(d, x) => setDropoff(selectedPlace(d, x))} />
    {stops.map((s, i) => <View key={`${s.address}-${i}`}><Text style={{
          color: colors.text
        }}>{i + 1}. {s.address}</Text><Button title="Remove stop" onPress={() => setStops(stops.filter((_, n) => n !== i))} /></View>)}{stops.length < 8 && <CustomPlacesAutocomplete placeholder="Optional additional stop" onPress={(d, x) => setStops([...stops, selectedPlace(d, x)])} />}
    <View style={{
        flexDirection: 'row',
        flexWrap: 'wrap'
      }}>{catalog.filter(c => c.city === city).map(c => <Button key={c.category} title={`${category === c.category ? '✓ ' : ''}${c.category}`} onPress={() => {
          setCategory(c.category);
          setMode('UPFRONT');
        }} />)}</View>
    <Button title={`Pricing: ${mode}`} onPress={() => {
        if (selected?.negotiatedEnabled) setMode(mode === 'UPFRONT' ? 'NEGOTIATED' : 'UPFRONT');else Alert.alert('Upfront pricing', 'Negotiated pricing is disabled for this category.');
      }} />
    <TextInput style={{
        color: colors.text,
        borderWidth: 1,
        borderColor: colors.border,
        padding: 8,
        marginVertical: 4
      }} placeholder="Optional guest name" placeholderTextColor={colors.textSecondary} value={guestName} onChangeText={setGuestName} /><TextInput style={{
        color: colors.text,
        borderWidth: 1,
        borderColor: colors.border,
        padding: 8
      }} placeholder="Guest phone (leave blank for yourself)" placeholderTextColor={colors.textSecondary} value={guestPhone} onChangeText={setGuestPhone} />
    <Button title="Get / refresh road-route quote" disabled={busy || !selected} onPress={refresh} />{busy && <ActivityIndicator />}{error && <Text accessibilityRole="alert" style={{
        color: '#D9534F',
        marginVertical: 12
      }}>{error}</Text>}
    {quote && <><FareBreakdown pricing={quote.snapshot} receipt={preview?.breakdown || quote.snapshot.breakdown} /><Text style={{
          color: colors.text
        }}>{quote.snapshot.tollDisclosure || 'Any unexpected toll, parking or airport charge requires your documented approval.'}</Text><Text style={{
          color: remaining ? colors.text : '#D9534F'
        }}>Quote {remaining ? `expires in ${remaining}s` : 'expired — refresh before confirming'}</Text>{mode === 'NEGOTIATED' && <><Text style={{
            color: colors.text
          }}>Transport offer before service fee: {pkr(quote.snapshot.offerBounds.minimumPaisa)} to {pkr(quote.snapshot.offerBounds.maximumPaisa)}</Text><TextInput value={offer} onChangeText={v => {
            setOffer(v);
            setPreview(null);
          }} keyboardType="decimal-pad" style={{
            color: colors.text,
            padding: 10,
            borderWidth: 1,
            borderColor: colors.border
          }} /><Button title="Preview full offer total" onPress={previewOffer} disabled={busy || !remaining} /></>}<Button title={mode === 'UPFRONT' ? 'Confirm disclosed total & book' : 'Send transport offer'} disabled={busy || !remaining || mode === 'NEGOTIATED' && !preview} onPress={book} /></>}
    {pending && <View style={{
        marginVertical: 12
      }}><Text style={{
          color: colors.text
        }}>A booking request is pending. Retry the original request or cancel it before booking another route.</Text><Text style={{
          color: colors.text
        }}>{pending.quote?.route?.pickup?.address} to {pending.quote?.route?.dropoff?.address}</Text>
        <Button title="Cancel pending request / check booking" disabled={busy} onPress={discardPending} />
        <Button title="Retry pending booking" disabled={busy} onPress={() => invoke(() => sendBooking(pending))} /></View>}
  </ScrollView></SafeAreaView>;
}
