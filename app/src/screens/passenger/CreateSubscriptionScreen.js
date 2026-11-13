//subscription screen
import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useTheme } from '../../context/ThemeContext';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  SafeAreaView,
  StatusBar,
  Dimensions,
  Modal,
  Animated,
  KeyboardAvoidingView,
  Platform
} from 'react-native';
import { useSelector, useDispatch } from 'react-redux';
import { useNavigation } from '@react-navigation/native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import IconMC from 'react-native-vector-icons/MaterialCommunityIcons';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import IconFA from 'react-native-vector-icons/FontAwesome5';
import CustomPlacesAutocomplete from '../../components/common/CustomPlacesAutocomplete';
import DateTimePicker from '@react-native-community/datetimepicker';
import MapView, { Marker, Polyline } from 'react-native-maps';
import * as Location from 'expo-location';
import { LinearGradient } from 'expo-linear-gradient';
import * as Animatable from 'react-native-animatable';
import { getDirections } from '../../services/maps';
import api from '../../services/api';
import { VEHICLE_TYPES } from '../../utils/constants';
import { getWalletBalance } from '../../redux/slices/paymentSlice';

const { width } = Dimensions.get('window');

// FALLBACK VEHICLE TYPES - ALL 5 VEHICLES
const FALLBACK_VEHICLE_TYPES = [
  {
    id: 'bike',
    label: 'Bike',
    price: 80,
    capacity: 1,
    capacityLabel: '1',
    time: '5 min',
    color: '#F5A623'
  },
  {
    id: 'rickshaw',
    label: 'Rickshaw',
    price: 150,
    capacity: 3,
    capacityLabel: '3',
    time: '8 min',
    color: '#1D9E75'
  },
  {
    id: 'car',
    label: 'Car',
    price: 250,
    capacity: 4,
    capacityLabel: '4',
    time: '10 min',
    color: '#378ADD'
  },
  {
    id: 'car-ac',
    label: 'AC Car',
    price: 350,
    capacity: 4,
    capacityLabel: '4',
    time: '10 min',
    color: '#639922'
  },
  {
    id: 'luxury',
    label: 'Luxury',
    price: 500,
    capacity: 4,
    capacityLabel: '4',
    time: '12 min',
    color: '#7F4FC9'
  }
];

const WEEK_DAYS = [
  { id: 1, label: 'Mon' },
  { id: 2, label: 'Tue' },
  { id: 3, label: 'Wed' },
  { id: 4, label: 'Thu' },
  { id: 5, label: 'Fri' },
  { id: 6, label: 'Sat' },
  { id: 0, label: 'Sun' },
];

const CreateSubscriptionScreen = () => {
  const { colors, isDark } = useTheme();
  const styles = useMemo(() => createStyles(colors, isDark), [colors, isDark]);
  const navigation = useNavigation();
  const dispatch = useDispatch();
  const { user } = useSelector(state => state.auth);
  const paymentWalletBalance = useSelector(state => state.payment?.walletBalance);

  const [pickup, setPickup] = useState(null);
  const [dropoff, setDropoff] = useState(null);
  const [selectedPlan, setSelectedPlan] = useState('WEEKLY');
  const [selectedVehicle, setSelectedVehicle] = useState('car');
  const [passengersCount, setPassengersCount] = useState(1);
  const [selectedDays, setSelectedDays] = useState([1, 2, 3, 4, 5]);
  const [searching, setSearching] = useState(false);
  const [calculating, setCalculating] = useState(false);

  const [calculationResult, setCalculationResult] = useState(null);
  const [vehicleFares, setVehicleFares] = useState({});
  const [userBalance, setUserBalance] = useState(
    paymentWalletBalance !== undefined && paymentWalletBalance !== 0
      ? paymentWalletBalance
      : (user?.wallet?.balance || 0)
  );

  useEffect(() => {
    if (paymentWalletBalance !== undefined) {
      setUserBalance(paymentWalletBalance);
    }
  }, [paymentWalletBalance]);

  const [startDate, setStartDate] = useState(new Date());
  const [morningTime, setMorningTime] = useState(new Date(new Date().setHours(8, 0, 0, 0)));
  const [eveningTime, setEveningTime] = useState(new Date(new Date().setHours(17, 0, 0, 0)));

  const [showStartDatePicker, setShowStartDatePicker] = useState(false);
  const [showMorningPicker, setShowMorningPicker] = useState(false);
  const [showEveningPicker, setShowEveningPicker] = useState(false);

  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(30)).current;

  const mapRef = useRef(null);
  const pickupRef = useRef(null);
  const dropoffRef = useRef(null);
  const pickerMapRef = useRef(null);
  const [routeCoords, setRouteCoords] = useState([]);
  const [locationLoading, setLocationLoading] = useState(true);

  const [mapPickerVisible, setMapPickerVisible] = useState(false);
  const [mapPickerType, setMapPickerType] = useState('pickup');
  const [mapPickerCoords, setMapPickerCoords] = useState(null);
  const [mapPickerAddress, setMapPickerAddress] = useState('Loading address...');

  // Use VEHICLE_TYPES from constants, fallback to FALLBACK_VEHICLE_TYPES if empty or too few
  const vehicleTypes = useMemo(() => {
    const types = VEHICLE_TYPES && VEHICLE_TYPES.length >= 5 ? VEHICLE_TYPES : FALLBACK_VEHICLE_TYPES;
    return types;
  }, []);

  const currentVehicleObj = vehicleTypes.find(v => v.id === selectedVehicle) || vehicleTypes[2];
  const maxCapacity = currentVehicleObj.capacity || 4;

  useEffect(() => {
    animateEntrance();
    getCurrentLocation();
    fetchUserProfile();
  }, []);

  const handleSelectVehicle = (vehicleId) => {
    setSelectedVehicle(vehicleId);
    const vObj = vehicleTypes.find(v => v.id === vehicleId);
    if (vehicleId === 'bike') {
      setPassengersCount(1);
    } else if (vObj && passengersCount > vObj.capacity) {
      setPassengersCount(vObj.capacity);
    }
  };

  const getIcon = (icon, iconType, size, color) => {
    switch (iconType) {
      case 'material':
        return <Icon name={icon} size={size} color={color} />;
      case 'material-community':
        return <IconMC name={icon} size={size} color={color} />;
      case 'fontawesome':
        return <IconFA name={icon} size={size} color={color} />;
      default:
        return <Icon name={icon} size={size} color={color} />;
    }
  };

  // EXACT vehicle styles matching BookRideScreen
  const enhancedVehicleTypes = useMemo(() => {
    const vehicleStyles = {
      'bike': { bgLight: '#FFF7E0', bgDark: '#2A200B', iconColor: '#F5A623', icon: 'motorbike', iconType: 'material-community' },
      'rickshaw': { bgLight: '#E1F5EE', bgDark: '#0D271F', iconColor: '#1D9E75', icon: 'rickshaw', iconType: 'material-community' },
      'car': { bgLight: '#E6F1FB', bgDark: '#15212D', iconColor: '#378ADD', icon: 'car', iconType: 'material-community' },
      'car-ac': { bgLight: '#EAF3DE', bgDark: '#1F2A14', iconColor: '#639922', icon: 'car-cool', iconType: 'material-community' },
      'ac_car': { bgLight: '#EAF3DE', bgDark: '#1F2A14', iconColor: '#639922', icon: 'car-cool', iconType: 'material-community' },
      'luxury': { bgLight: '#F3EAFB', bgDark: '#241634', iconColor: '#7F4FC9', icon: 'car-estate', iconType: 'material-community' },
    };

    return vehicleTypes.map(v => ({
      ...v,
      bgColor: isDark ? (vehicleStyles[v.id]?.bgDark || '#222') : (vehicleStyles[v.id]?.bgLight || '#F5F5F5'),
      iconColor: vehicleStyles[v.id]?.iconColor || '#666',
      icon: vehicleStyles[v.id]?.icon || 'car',
      iconType: vehicleStyles[v.id]?.iconType || 'material-community',
    }));
  }, [isDark, vehicleTypes]);

  const fetchUserProfile = async () => {
    try {
      const res = await dispatch(getWalletBalance()).unwrap();
      if (res?.balance !== undefined) {
        setUserBalance(res.balance);
      }
    } catch (e) {
      try {
        const res = await api.get('/payments/wallet/balance');
        if (res.data?.balance !== undefined) {
          setUserBalance(res.data.balance);
        }
      } catch (err) {
        console.error('Failed to fetch wallet balance:', err);
      }
    }
  };

  const calculateSubscriptionFare = async () => {
    if (!pickup || !dropoff || selectedDays.length === 0) {
      setCalculationResult(null);
      return;
    }
    setCalculating(true);
    try {
      const pickupCoords = {
        lat: pickup.location.coordinates ? pickup.location.coordinates[1] : pickup.location.lat,
        lng: pickup.location.coordinates ? pickup.location.coordinates[0] : pickup.location.lng,
        address: pickup.address
      };
      const dropoffCoords = {
        lat: dropoff.location.coordinates ? dropoff.location.coordinates[1] : dropoff.location.lat,
        lng: dropoff.location.coordinates ? dropoff.location.coordinates[0] : dropoff.location.lng,
        address: dropoff.address
      };

      const currentEffectivePassengers = selectedVehicle === 'bike' ? 1 : passengersCount;

      const res = await api.post('/subscriptions/calculate', {
        pickupLocation: pickupCoords,
        dropoffLocation: dropoffCoords,
        planType: selectedPlan,
        daysOfWeek: selectedDays,
        startDate: startDate,
        vehicle: selectedVehicle,
        passengers: currentEffectivePassengers,
        city: 'Karachi'
      });

      setCalculationResult(res.data);

      const fares = {};
      await Promise.all(vehicleTypes.map(async (v) => {
        try {
          const effectivePassengers = v.id === 'bike' ? 1 : Math.min(passengersCount, v.capacity);
          const vRes = await api.post('/subscriptions/calculate', {
            pickupLocation: pickupCoords,
            dropoffLocation: dropoffCoords,
            planType: selectedPlan,
            daysOfWeek: selectedDays,
            startDate: startDate,
            vehicle: v.id,
            passengers: effectivePassengers,
            city: 'Karachi'
          });
          fares[v.id] = vRes.data;
        } catch (err) { }
      }));
      setVehicleFares(fares);

    } catch (error) {
      console.error('Error calculating subscription fare:', error);
    } finally {
      setCalculating(false);
    }
  };

  useEffect(() => {
    if (pickup && dropoff) {
      calculateSubscriptionFare();
      fetchRoute();
    } else {
      setRouteCoords([]);
      setCalculationResult(null);
    }
  }, [pickup, dropoff, selectedPlan, selectedVehicle, passengersCount, selectedDays, startDate]);

  const animateEntrance = () => {
    Animated.parallel([
      Animated.timing(fadeAnim, { toValue: 1, duration: 600, useNativeDriver: true }),
      Animated.timing(slideAnim, { toValue: 0, duration: 500, useNativeDriver: true })
    ]).start();
  };

  const getCurrentLocation = async () => {
    setLocationLoading(true);
    try {
      let { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') return setLocationLoading(false);
      let loc = await Location.getCurrentPositionAsync({});
      let addressStr = 'Current Location';
      try {
        let geo = await Location.reverseGeocodeAsync({ latitude: loc.coords.latitude, longitude: loc.coords.longitude });
        if (geo.length > 0) addressStr = `${geo[0].name || geo[0].street || ''}, ${geo[0].city || ''}`.replace(/^, /, '');
      } catch (e) { }
      const pickupData = { address: addressStr, location: { type: 'Point', coordinates: [loc.coords.longitude, loc.coords.latitude] } };
      setPickup(pickupData);
      pickupRef.current?.setAddressText(addressStr);
    } catch (e) { } finally { setLocationLoading(false); }
  };

  const openMapPicker = async (type) => {
    setMapPickerType(type);
    setMapPickerVisible(true);
    let coords = type === 'pickup' && pickup ?
      { latitude: pickup.location.coordinates[1], longitude: pickup.location.coordinates[0] } :
      type === 'dropoff' && dropoff ?
        { latitude: dropoff.location.coordinates[1], longitude: dropoff.location.coordinates[0] } : null;
    if (!coords) {
      try {
        let loc = await Location.getCurrentPositionAsync({});
        coords = loc.coords;
      } catch (e) {
        coords = { latitude: 33.6844, longitude: 73.0479 };
      }
    }
    setMapPickerCoords(coords);
    setMapPickerAddress('Loading address...');
  };

  const onPickerRegionChangeComplete = async (region) => {
    setMapPickerCoords(region);
    try {
      let geo = await Location.reverseGeocodeAsync({ latitude: region.latitude, longitude: region.longitude });
      if (geo.length > 0) setMapPickerAddress(`${geo[0].name || geo[0].street || ''}, ${geo[0].city || ''}`.replace(/^, /, ''));
      else setMapPickerAddress('Unknown Location');
    } catch (e) { setMapPickerAddress('Unknown Location'); }
  };

  const confirmMapPicker = () => {
    if (!mapPickerCoords) return;
    const data = {
      address: mapPickerAddress,
      location: { type: 'Point', coordinates: [mapPickerCoords.longitude, mapPickerCoords.latitude] }
    };
    if (mapPickerType === 'pickup') { setPickup(data); pickupRef.current?.setAddressText(data.address); }
    else { setDropoff(data); dropoffRef.current?.setAddressText(data.address); }
    setMapPickerVisible(false);
  };

  const fetchRoute = async () => {
    if (!pickup?.location?.coordinates || !dropoff?.location?.coordinates) return;
    const route = await getDirections(pickup, dropoff);
    if (!route) return;
    setRouteCoords(route.coordinates);
    if (mapRef.current && route.coordinates.length) {
      mapRef.current.fitToCoordinates(route.coordinates, { edgePadding: { top: 50, right: 50, bottom: 50, left: 50 }, animated: true });
    }
  };

  const toggleDay = (dayId) => {
    if (selectedDays.includes(dayId)) {
      if (selectedDays.length === 1) {
        Alert.alert('Selection Error', 'At least 1 day must be selected.');
        return;
      }
      setSelectedDays(selectedDays.filter(d => d !== dayId));
    } else {
      setSelectedDays([...selectedDays, dayId]);
    }
  };

  const handlePostRequest = async () => {
    if (!pickup || !dropoff) {
      Alert.alert('Missing Location', 'Please select both pickup and destination locations.');
      return;
    }

    if (!calculationResult) {
      Alert.alert('Missing Fare', 'Please wait while subscription fare is being calculated.');
      return;
    }

    if (userBalance < calculationResult.totalPrice) {
      Alert.alert(
        'Insufficient Balance',
        `Your subscription total is Rs. ${calculationResult.totalPrice.toLocaleString()}, but your wallet balance is Rs. ${userBalance.toLocaleString()}.\n\nPlease top up your wallet to proceed.`
      );
      return;
    }

    try {
      setSearching(true);

      const pickupCoords = {
        lat: pickup.location.coordinates ? pickup.location.coordinates[1] : pickup.location.lat,
        lng: pickup.location.coordinates ? pickup.location.coordinates[0] : pickup.location.lng,
        address: pickup.address
      };
      const dropoffCoords = {
        lat: dropoff.location.coordinates ? dropoff.location.coordinates[1] : dropoff.location.lat,
        lng: dropoff.location.coordinates ? dropoff.location.coordinates[0] : dropoff.location.lng,
        address: dropoff.address
      };

      const morningStr = morningTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      const eveningStr = eveningTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

      const finalPassengers = selectedVehicle === 'bike' ? 1 : passengersCount;

      const res = await api.post('/subscriptions', {
        planType: selectedPlan,
        vehicleType: selectedVehicle,
        commuteDetails: {
          passengersCount: finalPassengers,
          pickupLocation: pickupCoords,
          dropoffLocation: dropoffCoords,
          morningTime: morningStr,
          eveningTime: eveningStr,
          daysOfWeek: selectedDays,
          vacationDates: []
        },
        dateRange: {
          startDate: calculationResult.startDate,
          endDate: calculationResult.endDate
        },
        financials: {
          perRideFare: calculationResult.perRideFare,
          totalRides: calculationResult.totalRides,
          totalPrice: calculationResult.totalPrice
        }
      });

      if (res.data?.success) {
        dispatch(getWalletBalance());
        if (res.data?.newWalletBalance !== undefined) {
          setUserBalance(res.data.newWalletBalance);
        }
        Alert.alert(
          'Subscription Request Posted! 🎉',
          `Rs. ${calculationResult.totalPrice.toLocaleString()} has been safely deducted and locked from your wallet balance. Drivers will see your request now.`,
          [{ text: 'View My Subscriptions', onPress: () => navigation.replace('MySubscriptions') }]
        );
      }
    } catch (error) {
      console.error('Error posting subscription:', error);
      Alert.alert('Subscription Failed', error.response?.data?.error || error.message || 'Failed to post subscription request');
    } finally {
      setSearching(false);
    }
  };

  const isBalanceSufficient = calculationResult ? userBalance >= calculationResult.totalPrice : true;
  const currentPassengers = selectedVehicle === 'bike' ? 1 : passengersCount;

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle={colors.statusBarStyle} backgroundColor={colors.background} />

      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
      >
        <Animated.View style={[styles.container, { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }]}>
          <View style={styles.createHeader}>
            <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
              <Icon name="arrow-back" size={24} color={colors.text} />
            </TouchableOpacity>
            <Text style={styles.createHeaderTitle}>Create Ride Subscription</Text>
            <View style={{ width: 32 }} />
          </View>

          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.scrollContent}
            keyboardShouldPersistTaps="handled"
          >

            {/* Map Section */}
            <Animatable.View animation="fadeIn" duration={600} style={styles.mapContainer}>
              {locationLoading ? (
                <View style={styles.mapLoading}>
                  <ActivityIndicator size="large" color={colors.accent} />
                  <Text style={styles.mapLoadingText}>Finding your location...</Text>
                </View>
              ) : (
                <MapView
                  ref={mapRef}
                  style={styles.map}
                  initialRegion={{
                    latitude: pickup?.location?.coordinates[1] || 33.6844,
                    longitude: pickup?.location?.coordinates[0] || 73.0479,
                    latitudeDelta: 0.02,
                    longitudeDelta: 0.02,
                  }}
                >
                  {pickup?.location?.coordinates && (
                    <Marker coordinate={{ latitude: pickup.location.coordinates[1], longitude: pickup.location.coordinates[0] }}>
                      <View style={styles.pickupMarker}><View style={styles.markerInner} /></View>
                    </Marker>
                  )}
                  {dropoff?.location?.coordinates && (
                    <Marker coordinate={{ latitude: dropoff.location.coordinates[1], longitude: dropoff.location.coordinates[0] }}>
                      <View style={styles.dropoffMarker}><Icon name="flag" size={18} color="#FFF" /></View>
                    </Marker>
                  )}
                  {routeCoords.length > 0 && (
                    <Polyline coordinates={routeCoords} strokeWidth={4} strokeColor="#F9C349" />
                  )}
                </MapView>
              )}
            </Animatable.View>

            {/* Location Inputs Section */}
            <Animatable.View animation="fadeInUp" duration={600} delay={100} style={styles.sectionCard}>
              <Text style={styles.sectionTitle}>Commute Locations</Text>

              <View style={styles.locationInputWrapper}>
                <View style={styles.locationDot}><View style={[styles.dot, { backgroundColor: '#4ECDC4' }]} /><View style={styles.dotLine} /></View>
                <View style={styles.locationInputContainer}>
                  <CustomPlacesAutocomplete
                    ref={pickupRef}
                    placeholder="Morning Pickup Location"
                    onPress={(data, details = null) => {
                      setPickup({
                        address: data.description,
                        location: { type: 'Point', coordinates: [details.geometry.location.lng, details.geometry.location.lat] }
                      });
                    }}
                    styles={{ textInputContainer: styles.pickupInputContainer, textInput: styles.pickupTextInput, listView: styles.autocompleteList }}
                    placeholderTextColor={colors.textSecondary}
                    renderRightButton={() => (
                      <TouchableOpacity onPress={() => openMapPicker('pickup')} style={styles.mapIconBtn}>
                        <Icon name="map" size={22} color="#4ECDC4" />
                      </TouchableOpacity>
                    )}
                  />
                </View>
              </View>

              <View style={styles.locationDivider} />

              <View style={[styles.locationInputWrapper, { zIndex: 1 }]}>
                <View style={styles.locationDot}><View style={[styles.dot, { backgroundColor: '#FF6B6B' }]} /></View>
                <View style={styles.locationInputContainer}>
                  <CustomPlacesAutocomplete
                    ref={dropoffRef}
                    placeholder="Evening Destination"
                    onPress={(data, details = null) => {
                      setDropoff({
                        address: data.description,
                        location: { type: 'Point', coordinates: [details.geometry.location.lng, details.geometry.location.lat] }
                      });
                    }}
                    styles={{ textInputContainer: styles.dropoffInputContainer, textInput: styles.dropoffTextInput, listView: styles.autocompleteList }}
                    placeholderTextColor={colors.textSecondary}
                    renderRightButton={() => (
                      <TouchableOpacity onPress={() => openMapPicker('dropoff')} style={styles.mapIconBtn}>
                        <Icon name="map" size={22} color="#FF6B6B" />
                      </TouchableOpacity>
                    )}
                  />
                </View>
              </View>
            </Animatable.View>

            {/* Plan Type Selection */}
            <Animatable.View animation="fadeInUp" duration={600} delay={150} style={styles.sectionCard}>
              <Text style={styles.sectionTitle}>Choose Subscription Plan</Text>
              <View style={styles.planSelectorRow}>
                <TouchableOpacity
                  style={[styles.planTab, selectedPlan === 'WEEKLY' && styles.planTabActive]}
                  onPress={() => setSelectedPlan('WEEKLY')}
                >
                  <Icon name="date-range" size={20} color={selectedPlan === 'WEEKLY' ? '#000' : colors.textSecondary} />
                  <Text style={[styles.planTabText, selectedPlan === 'WEEKLY' && styles.planTabTextActive]}>Weekly (7 Days)</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.planTab, selectedPlan === 'MONTHLY' && styles.planTabActive]}
                  onPress={() => setSelectedPlan('MONTHLY')}
                >
                  <Icon name="calendar-today" size={20} color={selectedPlan === 'MONTHLY' ? '#000' : colors.textSecondary} />
                  <Text style={[styles.planTabText, selectedPlan === 'MONTHLY' && styles.planTabTextActive]}>Monthly (30 Days)</Text>
                </TouchableOpacity>
              </View>
            </Animatable.View>

            {/* ============================================================ */}
            {/* VEHICLE SELECTION - ONLY ICON AND NAME */}
            {/* ============================================================ */}
            <Animatable.View
              animation="fadeInUp"
              duration={600}
              delay={200}
              style={styles.vehicleSection}
              useNativeDriver
            >
              <View style={styles.vehicleSectionHeader}>
                <Text style={styles.vehicleSectionTitle}>Select Vehicle</Text>
              </View>

              <View style={styles.vehicleGrid}>
                {enhancedVehicleTypes.map((vehicle) => {
                  const isSelected = selectedVehicle === vehicle.id;

                  return (
                    <TouchableOpacity
                      key={vehicle.id}
                      style={[
                        styles.vehicleCard,
                        isSelected && styles.vehicleCardSelected
                      ]}
                      onPress={() => handleSelectVehicle(vehicle.id)}
                      activeOpacity={0.9}
                    >
                      <View style={[
                        styles.vehicleCardContent,
                        isSelected && {
                          borderColor: '#FFC107',
                          backgroundColor: isDark ? '#2A200B' : '#FFFDF5'
                        }
                      ]}>
                        <View style={[
                          styles.vehicleIconContainer,
                          { backgroundColor: vehicle.bgColor }
                        ]}>
                          {getIcon(vehicle.icon, vehicle.iconType, 32, vehicle.iconColor)}
                        </View>
                        <Text style={[
                          styles.vehicleLabel,
                          isSelected && { color: isDark ? '#FFF' : '#000' }
                        ]}>
                          {vehicle.label}
                        </Text>
                        {isSelected && (
                          <View style={[styles.selectedBadge, { backgroundColor: '#FFC107' }]}>
                            <Icon name="check" size={10} color="#000" />
                          </View>
                        )}
                      </View>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </Animatable.View>
            {/* ============================================================ */}

            {selectedVehicle !== 'bike' && (
              <Animatable.View animation="fadeInUp" duration={600} delay={220} style={styles.sectionCard}>
                <View style={styles.sectionHeaderRow}>
                  <Text style={styles.sectionTitle}>Number of Persons</Text>
                  <Text style={styles.capacityNotice}>Max {maxCapacity} seats</Text>
                </View>

                <View style={styles.passengerSelectorRow}>
                  {[1, 2, 3, 4].map((num) => {
                    const isDisabled = num > maxCapacity;
                    const isSelected = passengersCount === num;

                    return (
                      <TouchableOpacity
                        key={num}
                        style={[
                          styles.passengerOptionBtn,
                          isSelected && styles.passengerOptionActive,
                          isDisabled && styles.passengerOptionDisabled
                        ]}
                        onPress={() => {
                          if (!isDisabled) setPassengersCount(num);
                        }}
                        disabled={isDisabled}
                      >
                        <IconMC
                          name="account"
                          size={18}
                          color={isDisabled ? colors.border : isSelected ? '#000' : colors.textSecondary}
                        />
                        <Text style={[
                          styles.passengerOptionText,
                          isSelected && styles.passengerOptionTextActive,
                          isDisabled && styles.passengerOptionTextDisabled
                        ]}>
                          {num}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </Animatable.View>
            )}

            {/* Active Days Selection */}
            <Animatable.View animation="fadeInUp" duration={600} delay={250} style={styles.sectionCard}>
              <Text style={styles.sectionTitle}>Commute Days of the Week</Text>
              <View style={styles.daysRow}>
                {WEEK_DAYS.map((d) => {
                  const isSelected = selectedDays.includes(d.id);
                  return (
                    <TouchableOpacity
                      key={d.id}
                      style={[styles.dayPill, isSelected && styles.dayPillActive]}
                      onPress={() => toggleDay(d.id)}
                    >
                      <Text style={[styles.dayPillText, isSelected && styles.dayPillTextActive]}>{d.label}</Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </Animatable.View>

            {/* Schedule Timing Picker */}
            <Animatable.View animation="fadeInUp" duration={600} delay={300} style={styles.sectionCard}>
              <Text style={styles.sectionTitle}>Daily Pickup & Return Schedule</Text>
              <View style={styles.scheduleCard}>
                <TouchableOpacity style={styles.schedulePicker} onPress={() => setShowStartDatePicker(true)}>
                  <Text style={styles.schedulePickerLabel}>Start Date</Text>
                  <Text style={styles.schedulePickerText}>{startDate.toLocaleDateString()}</Text>
                </TouchableOpacity>
                <View style={styles.scheduleDivider} />
                <TouchableOpacity style={styles.schedulePicker} onPress={() => setShowMorningPicker(true)}>
                  <Text style={styles.schedulePickerLabel}>Morning Pickup Time</Text>
                  <Text style={styles.schedulePickerText}>{morningTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</Text>
                </TouchableOpacity>
                <View style={styles.scheduleDivider} />
                <TouchableOpacity style={styles.schedulePicker} onPress={() => setShowEveningPicker(true)}>
                  <Text style={styles.schedulePickerLabel}>Evening Return Time</Text>
                  <Text style={styles.schedulePickerText}>{eveningTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</Text>
                </TouchableOpacity>
              </View>
            </Animatable.View>

            {showStartDatePicker && (
              <DateTimePicker value={startDate} mode="date" display="default" onChange={(e, d) => { setShowStartDatePicker(false); if (d) setStartDate(d); }} />
            )}
            {showMorningPicker && (
              <DateTimePicker value={morningTime} mode="time" display="default" onChange={(e, d) => { setShowMorningPicker(false); if (d) setMorningTime(d); }} />
            )}
            {showEveningPicker && (
              <DateTimePicker value={eveningTime} mode="time" display="default" onChange={(e, d) => { setShowEveningPicker(false); if (d) setEveningTime(d); }} />
            )}

            {/* Total Rides & Fare Breakdown Summary Card */}
            {calculating ? (
              <View style={styles.summaryCard}>
                <ActivityIndicator size="small" color={colors.accent} />
                <Text style={styles.calculatingText}>Calculating subscription fare...</Text>
              </View>
            ) : calculationResult ? (
              <Animatable.View animation="fadeInUp" duration={600} delay={350} style={styles.summaryCard}>
                <Text style={styles.summaryCardTitle}>Subscription Fare Breakdown</Text>

                <View style={styles.summaryRow}>
                  <Text style={styles.summaryLabel}>Package Duration:</Text>
                  <Text style={styles.summaryValue}>{selectedPlan === 'WEEKLY' ? '7 Days (1 Week)' : '30 Days (1 Month)'}</Text>
                </View>

                <View style={styles.summaryRow}>
                  <Text style={styles.summaryLabel}>Vehicle & Passengers:</Text>
                  <Text style={styles.summaryValue}>{currentVehicleObj.label} {selectedVehicle !== 'bike' ? `(${currentPassengers} ${currentPassengers === 1 ? 'Person' : 'Persons'})` : ''}</Text>
                </View>

                <View style={styles.summaryRow}>
                  <Text style={styles.summaryLabel}>Active Commute Days:</Text>
                  <Text style={styles.summaryValue}>{calculationResult.validDaysCount} Days</Text>
                </View>

                <View style={styles.summaryRow}>
                  <Text style={styles.summaryLabel}>Total Calculated Rides:</Text>
                  <Text style={[styles.summaryValue, { color: colors.accent, fontWeight: 'bold' }]}>
                    {calculationResult.totalRides} Rides ({calculationResult.validDaysCount} days × 2 rides/day)
                  </Text>
                </View>

                {selectedVehicle !== 'bike' && currentPassengers > 1 && (
                  <View style={styles.summaryRow}>
                    <Text style={styles.summaryLabel}>Per-Person Per-Ride Fare:</Text>
                    <Text style={styles.summaryValue}>Rs. {calculationResult.perPersonFare}</Text>
                  </View>
                )}

                <View style={styles.summaryRow}>
                  <Text style={styles.summaryLabel}>Total Fare Per Ride:</Text>
                  <Text style={styles.summaryValue}>Rs. {calculationResult.perRideFare}</Text>
                </View>

                <View style={styles.summaryDivider} />

                <View style={styles.summaryTotalRow}>
                  <Text style={styles.summaryTotalLabel}>TOTAL COST:</Text>
                  <Text style={styles.summaryTotalValue}>Rs. {calculationResult.totalPrice?.toLocaleString()}</Text>
                </View>

                <View style={styles.walletBalanceRow}>
                  <Icon name="account-balance-wallet" size={20} color={colors.textSecondary} />
                  <Text style={styles.walletBalanceText}>Your Wallet Balance: Rs. {userBalance.toLocaleString()}</Text>
                </View>

                {isBalanceSufficient ? (
                  <View style={styles.balanceStatusSuccess}>
                    <Icon name="check-circle" size={18} color="#2ECC71" />
                    <Text style={styles.balanceSuccessText}>Sufficient balance! Rs. {calculationResult.totalPrice?.toLocaleString()} will be locked from your wallet.</Text>
                  </View>
                ) : (
                  <View style={styles.balanceStatusError}>
                    <Icon name="error" size={18} color="#FF6B6B" />
                    <Text style={styles.balanceErrorText}>
                      Insufficient wallet balance! Short by Rs. {(calculationResult.totalPrice - userBalance).toLocaleString()}.
                    </Text>
                  </View>
                )}
              </Animatable.View>
            ) : null}

            {/* Action Submit Button */}
            <Animatable.View animation="fadeInUp" duration={600} delay={400}>
              <TouchableOpacity
                style={[styles.requestButton, (!pickup || !dropoff || searching || !calculationResult || !isBalanceSufficient) && styles.requestButtonDisabled]}
                onPress={handlePostRequest}
                disabled={!pickup || !dropoff || searching || !calculationResult || !isBalanceSufficient}
              >
                <LinearGradient
                  colors={(!pickup || !dropoff || !isBalanceSufficient) ? ['#777', '#555'] : [colors.accent, '#F5A623']}
                  style={styles.requestButtonGradient}
                >
                  {searching ? (
                    <ActivityIndicator color={colors.onAccent} />
                  ) : (
                    <Text style={styles.requestButtonText}>
                      {!isBalanceSufficient
                        ? 'Insufficient Wallet Balance'
                        : calculationResult
                          ? `Create Subscription & Cut Rs. ${calculationResult.totalPrice?.toLocaleString()}`
                          : 'Create Subscription Request'}
                    </Text>
                  )}
                </LinearGradient>
              </TouchableOpacity>
            </Animatable.View>

            <View style={{ height: 40 }} />
          </ScrollView>

          {/* Map Picker Modal */}
          <Modal visible={mapPickerVisible} animationType="slide">
            <View style={styles.mapPickerContainer}>
              <View style={styles.mapPickerHeader}>
                <TouchableOpacity onPress={() => setMapPickerVisible(false)} style={styles.mapPickerClose}>
                  <Icon name="close" size={24} color={colors.text} />
                </TouchableOpacity>
                <Text style={styles.mapPickerTitle}>Select Location on Map</Text>
              </View>
              {mapPickerCoords && (
                <View style={styles.mapWrapper}>
                  <MapView
                    ref={pickerMapRef}
                    style={styles.pickerMap}
                    initialRegion={{ latitude: mapPickerCoords.latitude, longitude: mapPickerCoords.longitude, latitudeDelta: 0.01, longitudeDelta: 0.01 }}
                    onRegionChangeComplete={onPickerRegionChangeComplete}
                  />
                  <View style={styles.mapMarkerFixed}><Icon name="location-on" size={44} color="#4ECDC4" /></View>
                </View>
              )}
              <View style={styles.mapPickerFooter}>
                <Text style={styles.mapPickerAddressText}>{mapPickerAddress}</Text>
                <TouchableOpacity style={styles.mapPickerConfirmBtn} onPress={confirmMapPicker}>
                  <Text style={styles.mapPickerConfirmText}>Confirm Location</Text>
                </TouchableOpacity>
              </View>
            </View>
          </Modal>

        </Animated.View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const createStyles = (colors, isDark) => {
  return StyleSheet.create({
    safeArea: { flex: 1, backgroundColor: colors.background },
    container: { flex: 1, backgroundColor: colors.background },
    createHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 16, marginTop: 30 },
    backButton: { padding: 8 },
    createHeaderTitle: { fontSize: 20, fontWeight: '700', color: colors.text },
    scrollContent: { paddingBottom: 30 },
    mapContainer: { height: 200, marginHorizontal: 16, borderRadius: 16, overflow: 'hidden', marginBottom: 12 },
    map: { ...StyleSheet.absoluteFillObject },
    mapLoading: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: colors.card },
    mapLoadingText: { color: colors.textSecondary, marginTop: 8 },
    pickupMarker: { width: 24, height: 24, borderRadius: 12, backgroundColor: '#4ECDC430', justifyContent: 'center', alignItems: 'center' },
    markerInner: { width: 12, height: 12, borderRadius: 6, backgroundColor: '#4ECDC4' },
    dropoffMarker: { width: 28, height: 28, borderRadius: 14, backgroundColor: '#FF6B6B', justifyContent: 'center', alignItems: 'center' },
    sectionCard: { marginHorizontal: 16, marginBottom: 16, backgroundColor: colors.card, borderRadius: 16, padding: 16, borderWidth: 1, borderColor: colors.border },
    sectionHeaderRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
    sectionTitle: { fontSize: 16, fontWeight: '700', color: colors.text },
    capacityNotice: { fontSize: 12, color: colors.textSecondary },
    locationInputWrapper: { flexDirection: 'row', alignItems: 'center' },
    locationDot: { width: 20, alignItems: 'center' },
    dot: { width: 10, height: 10, borderRadius: 5 },
    dotLine: { width: 2, height: 40, backgroundColor: colors.border },
    locationInputContainer: { flex: 1, marginLeft: 12 },
    autocompleteList: { position: 'absolute', top: 50, zIndex: 1000, width: '100%', backgroundColor: colors.card },
    pickupInputContainer: { backgroundColor: 'transparent', borderBottomWidth: 1, borderBottomColor: colors.border },
    dropoffInputContainer: { backgroundColor: 'transparent', borderBottomWidth: 0 },
    pickupTextInput: { backgroundColor: 'transparent', height: 50, color: colors.text },
    dropoffTextInput: { backgroundColor: 'transparent', height: 50, color: colors.text },
    locationDivider: { height: 1, backgroundColor: colors.border, marginVertical: 8, marginLeft: 32 },
    mapIconBtn: { padding: 8 },
    planSelectorRow: { flexDirection: 'row', gap: 12 },
    planTab: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, paddingVertical: 14, borderRadius: 12, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.surface },
    planTabActive: { backgroundColor: colors.accent, borderColor: colors.accent },
    planTabText: { fontSize: 14, fontWeight: '600', color: colors.textSecondary },
    planTabTextActive: { color: colors.onAccent, fontWeight: 'bold' },

    // ============================================================
    // VEHICLE GRID - ONLY ICON AND NAME
    // ============================================================
    vehicleSection: {
      marginBottom: 16,
      paddingHorizontal: 16,
    },
    vehicleSectionHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 12,
    },
    vehicleSectionTitle: {
      fontSize: 16,
      fontWeight: '700',
      color: colors.text,
    },
    vehicleGrid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      justifyContent: 'space-between',
    },
    vehicleCard: {
      width: (width - 48) / 5,
      marginBottom: 4,
    },
    vehicleCardSelected: {
      transform: [{ scale: 1.02 }],
    },
    vehicleCardContent: {
      backgroundColor: colors.card,
      paddingVertical: 12,
      paddingHorizontal: 4,
      borderRadius: 12,
      alignItems: 'center',
      borderWidth: 2,
      borderColor: colors.border,
      shadowColor: colors.text,
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.04,
      shadowRadius: 4,
      elevation: 1,
    },
    vehicleIconContainer: {
      width: 48,
      height: 48,
      borderRadius: 24,
      justifyContent: 'center',
      alignItems: 'center',
      marginBottom: 6,
    },
    vehicleLabel: {
      color: colors.text,
      fontSize: 11,
      fontWeight: '600',
      textAlign: 'center',
    },
    selectedBadge: {
      position: 'absolute',
      top: -4,
      right: -4,
      width: 18,
      height: 18,
      borderRadius: 9,
      justifyContent: 'center',
      alignItems: 'center',
    },
    // ============================================================

    passengerSelectorRow: { flexDirection: 'row', gap: 8 },
    passengerOptionBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, paddingVertical: 12, borderRadius: 12, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.surface },
    passengerOptionActive: { backgroundColor: colors.accent, borderColor: colors.accent },
    passengerOptionDisabled: { opacity: 0.35, backgroundColor: colors.border },
    passengerOptionText: { fontSize: 14, fontWeight: 'bold', color: colors.textSecondary },
    passengerOptionTextActive: { color: colors.onAccent, fontWeight: 'bold' },
    passengerOptionTextDisabled: { color: colors.textMuted },
    daysRow: { flexDirection: 'row', justifyContent: 'space-between' },
    dayPill: { width: 40, height: 40, borderRadius: 20, borderWidth: 1, borderColor: colors.border, justifyContent: 'center', alignItems: 'center', backgroundColor: colors.surface },
    dayPillActive: { backgroundColor: colors.accent, borderColor: colors.accent },
    dayPillText: { fontSize: 13, fontWeight: '600', color: colors.textSecondary },
    dayPillTextActive: { color: colors.onAccent, fontWeight: 'bold' },
    scheduleCard: { backgroundColor: colors.surface, borderRadius: 12, borderWidth: 1, borderColor: colors.border },
    schedulePicker: { flexDirection: 'row', justifyContent: 'space-between', padding: 16 },
    schedulePickerLabel: { color: colors.textSecondary, fontSize: 14 },
    schedulePickerText: { color: colors.text, fontSize: 14, fontWeight: '600' },
    scheduleDivider: { height: 1, backgroundColor: colors.border, marginHorizontal: 16 },
    summaryCard: { marginHorizontal: 16, marginBottom: 16, backgroundColor: colors.card, borderRadius: 16, padding: 16, borderWidth: 1.5, borderColor: colors.accent },
    summaryCardTitle: { fontSize: 16, fontWeight: '700', color: colors.text, marginBottom: 12 },
    summaryRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
    summaryLabel: { color: colors.textSecondary, fontSize: 13 },
    summaryValue: { color: colors.text, fontSize: 13, fontWeight: '600' },
    summaryDivider: { height: 1, backgroundColor: colors.border, marginVertical: 10 },
    summaryTotalRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    summaryTotalLabel: { fontSize: 15, fontWeight: 'bold', color: colors.text },
    summaryTotalValue: { fontSize: 20, fontWeight: 'bold', color: colors.accent },
    walletBalanceRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 12, paddingTop: 10, borderTopWidth: 1, borderTopColor: colors.border },
    walletBalanceText: { fontSize: 13, color: colors.textSecondary, fontWeight: '600' },
    balanceStatusSuccess: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 8, padding: 8, borderRadius: 8, backgroundColor: '#2ECC7115' },
    balanceSuccessText: { color: '#2ECC71', fontSize: 12, fontWeight: '600', flex: 1 },
    balanceStatusError: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 8, padding: 8, borderRadius: 8, backgroundColor: '#FF6B6B15' },
    balanceErrorText: { color: '#FF6B6B', fontSize: 12, fontWeight: '600', flex: 1 },
    calculatingText: { color: colors.textSecondary, marginTop: 8, textAlign: 'center' },
    requestButton: { marginHorizontal: 16, marginTop: 8, borderRadius: 25, overflow: 'hidden' },
    requestButtonDisabled: { opacity: 0.5 },
    requestButtonGradient: { paddingVertical: 16, alignItems: 'center' },
    requestButtonText: { color: colors.onAccent, fontSize: 16, fontWeight: 'bold' },
    mapPickerContainer: { flex: 1, backgroundColor: colors.background, marginTop: 40 },
    mapPickerHeader: { flexDirection: 'row', justifyContent: 'space-between', padding: 16 },
    mapPickerTitle: { fontSize: 18, color: colors.text, fontWeight: '600' },
    mapPickerClose: { padding: 4 },
    mapWrapper: { flex: 1, position: 'relative' },
    pickerMap: { ...StyleSheet.absoluteFillObject },
    mapMarkerFixed: { position: 'absolute', top: '50%', left: '50%', marginTop: -44, marginLeft: -22 },
    mapPickerFooter: { padding: 20, backgroundColor: colors.card, borderTopLeftRadius: 20, borderTopRightRadius: 20 },
    mapPickerAddressText: { color: colors.text, fontSize: 16, marginBottom: 16 },
    mapPickerConfirmBtn: { backgroundColor: colors.accent, padding: 16, borderRadius: 12, alignItems: 'center' },
    mapPickerConfirmText: { color: colors.onAccent, fontSize: 16, fontWeight: 'bold' }
  });
};

export default CreateSubscriptionScreen;