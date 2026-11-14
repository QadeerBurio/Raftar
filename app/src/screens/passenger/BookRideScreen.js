import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  ScrollView,
  ActivityIndicator,
  Alert,
  StatusBar,
  KeyboardAvoidingView,
  Platform,
  Animated,
  Modal,
  Switch,
  Linking,
  InteractionManager
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../../context/ThemeContext';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigation, useRoute } from '@react-navigation/native';
import {
  Car, CarTaxiFront, Motorbike, Snowflake, Crown, Clock, Ruler, X, Plus, Minus, ArrowRight,
  ArrowLeft, UserPlus, Phone, User, Users, Map as MapIcon,
} from 'lucide-react-native';
import CustomPlacesAutocomplete from '../../components/common/CustomPlacesAutocomplete';
import MapView, { Marker, Polyline } from 'react-native-maps';
import * as Location from 'expo-location';
import { createRide } from '../../redux/slices/rideSlice';
import { VEHICLE_TYPES } from '../../utils/constants';
import api from '../../services/api';
import { getDirections } from '../../services/maps';
import {
  BottomSheet, Button, Chip, Header, IconButton, IconTile, Input, RouteInput, SelectCard,
  PickupDot, DestinationSquare,
} from '../../components/ui';
import { palette, fonts, radius, shadows, spacing, typography } from '../../theme/tokens';

// Tariff icons by VEHICLE_TYPES id (UI only).
const VEHICLE_ICONS = {
  bike: Motorbike,
  rickshaw: CarTaxiFront,
  car: Car,
  ac_car: Snowflake,
  luxury_car: Crown,
};

const BookRideScreen = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const dispatch = useDispatch();
  const { user } = useSelector(state => state.auth);
  const { currentRide } = useSelector(state => state.ride);
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const styles = React.useMemo(() => createStyles(colors), [colors]);

  const [loading, setLoading] = useState(false);
  const [pickup, setPickup] = useState(route.params?.pickup || null);
  const [dropoff, setDropoff] = useState(route.params?.destination || null);
  const [stops, setStops] = useState([]);
  const [selectedVehicle, setSelectedVehicle] = useState('car');
  const [estimatedFare, setEstimatedFare] = useState(null);
  const [selectedPriceOption, setSelectedPriceOption] = useState(null);
  const [vehicleFares, setVehicleFares] = useState({});
  const [showVehicleModal, setShowVehicleModal] = useState(false);
  const [showFareModal, setShowFareModal] = useState(false);
  const [searchingDriver, setSearchingDriver] = useState(false);
  const [showStopModal, setShowStopModal] = useState(false);

  const handleRemoveStop = (index) => {
    setStops(stops.filter((_, i) => i !== index));
  };

  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(30)).current;
  const mapRef = useRef(null);
  const [routeCoords, setRouteCoords] = useState([]);
  const [routeInfo, setRouteInfo] = useState(null);

  const pickupRef = useRef(null);
  const dropoffRef = useRef(null);
  const [locationLoading, setLocationLoading] = useState(true);
  const [isGuestBooking, setIsGuestBooking] = useState(false);
  const [guestName, setGuestName] = useState('');
  const [guestPhone, setGuestPhone] = useState('');
  const [guestRelation, setGuestRelation] = useState('');
  const [guestNote, setGuestNote] = useState('');

  const [mapPickerVisible, setMapPickerVisible] = useState(false);
  const [mapPickerType, setMapPickerType] = useState('pickup');
  const [mapPickerCoords, setMapPickerCoords] = useState(null);
  const [mapPickerAddress, setMapPickerAddress] = useState('Loading address...');
  const pickerMapRef = useRef(null);

  useEffect(() => {
    navigation.setOptions({ gestureEnabled: false });
    animateEntrance();
    getCurrentLocation();
  }, [navigation]);

  useEffect(() => {
    if (pickup && dropoff) {
      InteractionManager.runAfterInteractions(() => {
        calculateFare();
        fetchRoute();
      });
    } else {
      setRouteCoords([]);
    }
  }, [pickup, dropoff, stops]);

  const getCurrentLocation = async () => {
    setLocationLoading(true);
    try {
      let { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert(
          'Permission Denied',
          'We need your location to set the pickup point.',
          [
            { text: 'Cancel', style: 'cancel' },
            { text: 'Open Settings', onPress: () => Linking.openSettings() }
          ]
        );
        setLocationLoading(false);
        return;
      }

      let loc = await Location.getCurrentPositionAsync({});
      let addressStr = 'Current Location';
      try {
        let geo = await Location.reverseGeocodeAsync({
          latitude: loc.coords.latitude,
          longitude: loc.coords.longitude
        });
        if (geo.length > 0) {
          addressStr = `${geo[0].name || geo[0].street || ''}, ${geo[0].city || ''}`.replace(/^, /, '');
        }
      } catch (e) { }

      setPickup({
        address: addressStr,
        location: {
          coordinates: [loc.coords.longitude, loc.coords.latitude]
        }
      });
      pickupRef.current?.setAddressText(addressStr);
    } catch (e) {
      console.log('Location error', e);
    } finally {
      setLocationLoading(false);
    }
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
      let geo = await Location.reverseGeocodeAsync({
        latitude: region.latitude,
        longitude: region.longitude
      });
      if (geo.length > 0) {
        setMapPickerAddress(`${geo[0].name || geo[0].street || ''}, ${geo[0].city || ''}`.replace(/^, /, ''));
      } else {
        setMapPickerAddress('Unknown Location');
      }
    } catch (e) {
      setMapPickerAddress('Unknown Location');
    }
  };

  const confirmMapPicker = () => {
    if (!mapPickerCoords) return;
    const data = {
      address: mapPickerAddress,
      location: {
        type: 'Point',
        coordinates: [mapPickerCoords.longitude, mapPickerCoords.latitude]
      }
    };
    if (mapPickerType === 'pickup') {
      setPickup(data);
      pickupRef.current?.setAddressText(data.address);
    } else if (mapPickerType === 'dropoff') {
      setDropoff(data);
      dropoffRef.current?.setAddressText(data.address);
    } else if (mapPickerType === 'stop') {
      setStops([...stops, data]);
      setShowStopModal(false);
    }
    setMapPickerVisible(false);
  };

  const fetchRoute = async () => {
    if (!pickup?.location?.coordinates || !dropoff?.location?.coordinates) return;

    // getDirections picks the fastest of Google's alternative routes, decodes the
    // road polyline, and always resolves (falling back to a flagged straight-line
    // estimate) so the map and the ETA are never left blank.
    const route = await getDirections(pickup, dropoff, stops);
    if (!route) return;

    setRouteCoords(route.coordinates);
    setRouteInfo({
      distanceText: route.distanceText,
      durationText: route.durationText,
      distanceKm: route.distanceKm,
      durationMin: route.durationMin,
      isEstimate: route.isFallback,
    });

    if (mapRef.current && route.coordinates.length) {
      mapRef.current.fitToCoordinates(route.coordinates, {
        edgePadding: { top: 50, right: 50, bottom: 50, left: 50 },
        animated: true,
      });
    }
  };

  const animateEntrance = () => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 600,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 500,
        useNativeDriver: true,
      })
    ]).start();
  };

  const vehicleTypes = VEHICLE_TYPES;

  const calculateFare = async () => {
    if (!pickup || !dropoff) return;
    try {
      const types = VEHICLE_TYPES.map(v => v.id);
      const fares = {};

      await Promise.all(types.map(async (type) => {
        const response = await api.post('/pricing/calculate', {
          pickup: pickup.location.coordinates ? { lng: pickup.location.coordinates[0], lat: pickup.location.coordinates[1] } : pickup,
          dropoff: dropoff.location.coordinates ? { lng: dropoff.location.coordinates[0], lat: dropoff.location.coordinates[1] } : dropoff,
          stops: stops.map(s => s.location.coordinates ? { lng: s.location.coordinates[0], lat: s.location.coordinates[1] } : s),
          vehicle: type,
          city: 'Karachi', // defaulting city or extract from address
          isCarpool: false,
          isIntercity: false,
          passengers: 1,
          driversAvailable: 5,
          hour: new Date().getHours()
        });
        fares[type] = response.data.fare ?? 0;
      }));

      setVehicleFares(fares);
      setEstimatedFare(fares[selectedVehicle] || 0);
    } catch (error) {
      console.error('Error calculating fare:', error);
    }
  };

  useEffect(() => {
    if (vehicleFares[selectedVehicle]) {
      const base = vehicleFares[selectedVehicle];
      setEstimatedFare(base);
      setSelectedPriceOption(Math.round(base));
    } else {
      const v = vehicleTypes.find(v => v.id === selectedVehicle);
      if (v) {
        setEstimatedFare(v.price);
        setSelectedPriceOption(v.price);
      }
    }
  }, [selectedVehicle, vehicleFares]);

  const getPriceOptions = (base) => {
    if (!base) return [];
    const baseFare = Math.round(base);
    const minFare = Math.round(baseFare * 0.8);
    const maxFare = Math.round(baseFare * 1.2);
    const step = (maxFare - minFare) / 4;
    return [
      Math.round(minFare),
      Math.round(minFare + step),
      Math.round(minFare + 2 * step),
      Math.round(minFare + 3 * step),
      Math.round(maxFare)
    ];
  };

  const handlePriceStep = (direction) => {
    const options = getPriceOptions(estimatedFare);
    if (!options.length) return;

    let currentIndex = options.findIndex(p => p === selectedPriceOption);
    if (currentIndex === -1) {
      currentIndex = options.reduce((closestIdx, price, idx) => {
        return Math.abs(price - selectedPriceOption) < Math.abs(options[closestIdx] - selectedPriceOption) ? idx : closestIdx;
      }, 0);
    }

    let newIndex = currentIndex + direction;
    if (newIndex >= 0 && newIndex < options.length) {
      setSelectedPriceOption(options[newIndex]);
    }
  };

  const handleBookRide = async (confirmedPrice) => {
    if (!pickup || !dropoff) {
      Alert.alert('Error', 'Please select pickup and dropoff locations');
      return;
    }

    if (!pickup.location?.coordinates || !dropoff.location?.coordinates) {
      Alert.alert('Error', 'Invalid location format. Please select addresses from the dropdown suggestions.');
      return;
    }

    if (!confirmedPrice || confirmedPrice <= 0) {
      Alert.alert('Error', 'Please select a valid price');
      return;
    }

    if (isGuestBooking && !guestPhone) {
      Alert.alert('Error', 'Please enter the guest\'s phone number');
      return;
    }

    setLoading(true);
    try {
      const rideData = {
        pickup: {
          address: pickup.address,
          location: {
            type: 'Point',
            coordinates: pickup.location.coordinates
          },
          placeId: pickup.placeId
        },
        dropoff: {
          address: dropoff.address,
          location: {
            type: 'Point',
            coordinates: dropoff.location.coordinates
          },
          placeId: dropoff.placeId
        },
        waypoints: stops.map(s => ({
          address: s.address,
          location: {
            type: 'Point',
            coordinates: s.location.coordinates
          }
        })),
        vehicleType: selectedVehicle,
        type: 'solo',
        fare: {
          type: 'offer',
          amount: confirmedPrice,
          offered: confirmedPrice
        },
        ...(isGuestBooking && {
          guest: {
            isGuestBooking: true,
            name: guestName,
            phoneNumber: guestPhone,
            relation: guestRelation,
            note: guestNote
          }
        })
      };

      const result = await dispatch(createRide(rideData)).unwrap();
      if (result.success) {
        navigation.navigate('RideTracking', {
          rideId: result.ride._id,
          rideData: result.ride
        });
      }
    } catch (error) {
      Alert.alert('Booking Failed', error.message || 'Unable to book ride. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const priceFor = (vehicle) => (vehicleFares[vehicle.id] ? Math.round(vehicleFares[vehicle.id]) : vehicle.price);
  const selectedVehicleLabel = vehicleTypes.find(v => v.id === selectedVehicle)?.label || 'ride';

  const renderVehicleCard = (vehicle) => (
    <SelectCard
      key={vehicle.id}
      style={styles.tariffCard}
      icon={VEHICLE_ICONS[vehicle.id] || Car}
      title={vehicle.label}
      subtitle={`${vehicle.capacityLabel} · ${vehicle.time}`}
      meta={`Rs ${priceFor(vehicle)}`}
      selected={selectedVehicle === vehicle.id}
      onPress={() => setSelectedVehicle(vehicle.id)}
    />
  );

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <StatusBar barStyle={colors.statusBarStyle} backgroundColor={colors.background} />

      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
      >
        <Animated.View style={[styles.flex, { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }]}>
          <Header title="Choose a ride" onBackPress={() => navigation.goBack()} />

          {/* Active Ride Banner */}
          {currentRide && (currentRide.status === 'searching' || currentRide.status === 'accepted' || currentRide.status === 'started') && (
            <Pressable
              style={styles.activeRideBanner}
              onPress={() => navigation.navigate('RideTracking', { rideId: currentRide._id })}
              accessibilityRole="button"
              accessibilityLabel={`You have an active ride, status ${currentRide.status}. Open it`}
            >
              <IconTile icon={Car} size="sm" bg={palette.accent} color={palette.primary} />
              <View style={styles.flex}>
                <Text style={styles.activeRideTitle}>Active ride</Text>
                <Text style={styles.activeRideStatus}>{currentRide.status}</Text>
              </View>
              <ArrowRight size={20} color={colors.onPrimary} strokeWidth={2} />
            </Pressable>
          )}

          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.scrollContent}
            keyboardShouldPersistTaps="handled"
          >
            {/* Map */}
            <View style={styles.mapCard}>
              {locationLoading ? (
                <View style={styles.mapLoading}>
                  <ActivityIndicator size="large" color={colors.accent} />
                  <Text style={styles.mapLoadingText}>Finding your location</Text>
                </View>
              ) : (
                <MapView
                  ref={mapRef}
                  style={StyleSheet.absoluteFill}
                  initialRegion={{
                    latitude: pickup?.location?.coordinates[1] || 33.6844,
                    longitude: pickup?.location?.coordinates[0] || 73.0479,
                    latitudeDelta: 0.02,
                    longitudeDelta: 0.02,
                  }}
                >
                  {pickup?.location?.coordinates && (
                    <Marker
                      coordinate={{
                        latitude: pickup.location.coordinates[1],
                        longitude: pickup.location.coordinates[0],
                      }}
                      title="Pickup"
                      anchor={{ x: 0.5, y: 0.5 }}
                    >
                      <PickupDot size={18} />
                    </Marker>
                  )}
                  {dropoff?.location?.coordinates && (
                    <Marker
                      coordinate={{
                        latitude: dropoff.location.coordinates[1],
                        longitude: dropoff.location.coordinates[0],
                      }}
                      title="Dropoff"
                      anchor={{ x: 0.5, y: 0.5 }}
                    >
                      <DestinationSquare size={18} />
                    </Marker>
                  )}
                  {routeCoords.length > 0 && (
                    <Polyline
                      coordinates={routeCoords}
                      strokeWidth={5}
                      strokeColor={palette.primary}
                    />
                  )}
                </MapView>
              )}

              {/* Trip ETA + distance */}
              {routeInfo && (
                <View style={styles.etaPill}>
                  <Clock size={14} color={colors.text} strokeWidth={2} />
                  <Text style={styles.etaValue}>{routeInfo.durationText}</Text>
                  <View style={styles.etaDivider} />
                  <Ruler size={14} color={colors.text} strokeWidth={2} />
                  <Text style={styles.etaValue}>{routeInfo.distanceText}</Text>
                  {routeInfo.isEstimate && <Text style={styles.etaApprox}>approx.</Text>}
                </View>
              )}
            </View>

            {/* Route summary and stops */}
            <View style={styles.section}>
              <RouteInput
                pickupValue={pickup?.address}
                destinationValue={dropoff?.address}
                pickupPlaceholder="Pickup not set"
                destinationPlaceholder="Destination not set"
              />
              {stops.map((stop, index) => (
                <View key={index} style={styles.stopRow}>
                  <View style={styles.stopMarker} />
                  <Text style={styles.stopText} numberOfLines={1}>{stop.address}</Text>
                  <IconButton icon={X} size={36} onPress={() => handleRemoveStop(index)} accessibilityLabel={`Remove stop ${stop.address}`} />
                </View>
              ))}
              {stops.length < 3 && (
                <Chip label="Add stop" icon={Plus} onPress={() => setShowStopModal(true)} style={styles.addStop} />
              )}
            </View>

            {/* Vehicle selection */}
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>Choose your ride</Text>
                <Pressable onPress={() => setShowVehicleModal(true)} hitSlop={12} accessibilityRole="button">
                  <Text style={styles.link}>See all</Text>
                </Pressable>
              </View>
            </View>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.tariffRow}
            >
              {vehicleTypes.map(vehicle => renderVehicleCard(vehicle))}
            </ScrollView>

            {/* Guest booking */}
            <View style={styles.section}>
              <Pressable
                style={styles.guestToggle}
                onPress={() => setIsGuestBooking(!isGuestBooking)}
                accessibilityRole="switch"
                accessibilityState={{ checked: isGuestBooking }}
                accessibilityLabel="Book for someone else"
              >
                <IconTile icon={UserPlus} size="md" />
                <Text style={styles.guestToggleText}>Book for someone else</Text>
                <Switch
                  value={isGuestBooking}
                  onValueChange={setIsGuestBooking}
                  trackColor={{ false: colors.switchTrackOff, true: colors.primary }}
                  thumbColor={palette.white}
                  ios_backgroundColor={colors.switchTrackOff}
                  accessibilityElementsHidden
                  importantForAccessibility="no"
                />
              </Pressable>

              {isGuestBooking && (
                <View style={styles.guestFields}>
                  <Input
                    label="Guest phone number"
                    icon={Phone}
                    placeholder="03001234567"
                    keyboardType="phone-pad"
                    value={guestPhone}
                    onChangeText={setGuestPhone}
                  />
                  <Input
                    label="Guest name (optional)"
                    icon={User}
                    placeholder="Full name"
                    value={guestName}
                    onChangeText={setGuestName}
                  />
                  <Input
                    label="Relation (optional)"
                    icon={Users}
                    placeholder="For example Mother or Friend"
                    value={guestRelation}
                    onChangeText={setGuestRelation}
                  />
                  <Input
                    label="Note for driver (optional)"
                    placeholder="Anything the driver should know"
                    multiline
                    numberOfLines={3}
                    value={guestNote}
                    onChangeText={setGuestNote}
                  />
                </View>
              )}
            </View>

            {/* Price selection */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Your fare offer</Text>
              <View style={styles.priceRow}>
                <IconButton icon={Minus} onPress={() => handlePriceStep(-1)} accessibilityLabel="Lower fare" />
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={styles.priceChips}
                  style={styles.flex}
                >
                  {getPriceOptions(estimatedFare).map((price, index) => (
                    <Chip
                      key={index}
                      label={`Rs ${price}`}
                      selected={selectedPriceOption === price}
                      onPress={() => setSelectedPriceOption(price)}
                    />
                  ))}
                </ScrollView>
                <IconButton icon={Plus} onPress={() => handlePriceStep(1)} accessibilityLabel="Raise fare" />
              </View>
            </View>
          </ScrollView>

          {/* Sticky action bar */}
          {selectedPriceOption > 0 && (
            <View style={[styles.footer, { paddingBottom: insets.bottom + spacing.l }]}>
              <Button
                title={`Book ${selectedVehicleLabel} · Rs ${selectedPriceOption}`}
                onPress={() => handleBookRide(selectedPriceOption)}
                loading={loading || searchingDriver}
              />
            </View>
          )}

          {/* All vehicles sheet */}
          <Modal
            visible={showVehicleModal}
            animationType="slide"
            transparent
            onRequestClose={() => setShowVehicleModal(false)}
          >
            <View style={styles.modalOverlay}>
              <Pressable
                style={styles.flex}
                onPress={() => setShowVehicleModal(false)}
                accessibilityRole="button"
                accessibilityLabel="Close vehicle list"
              />
              <BottomSheet style={{ paddingBottom: insets.bottom + spacing.xl, maxHeight: '80%' }}>
                <View style={styles.modalHeader}>
                  <Text style={styles.modalTitle}>All vehicles</Text>
                  <IconButton icon={X} onPress={() => setShowVehicleModal(false)} accessibilityLabel="Close" />
                </View>
                <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.modalList}>
                  {vehicleTypes.map(vehicle => (
                    <SelectCard
                      key={vehicle.id}
                      layout="row"
                      icon={VEHICLE_ICONS[vehicle.id] || Car}
                      title={vehicle.label}
                      subtitle={`${vehicle.capacityLabel} · ${vehicle.time}`}
                      meta={`Rs ${priceFor(vehicle)}`}
                      selected={selectedVehicle === vehicle.id}
                      onPress={() => {
                        setSelectedVehicle(vehicle.id);
                        setShowVehicleModal(false);
                      }}
                    />
                  ))}
                </ScrollView>
              </BottomSheet>
            </View>
          </Modal>

          {/* Map picker */}
          <Modal visible={mapPickerVisible} animationType="slide" onRequestClose={() => setMapPickerVisible(false)}>
            <View style={styles.pickerContainer}>
              {mapPickerCoords && (
                <MapView
                  key={`${mapPickerType}-${mapPickerVisible}`}
                  ref={pickerMapRef}
                  style={StyleSheet.absoluteFill}
                  initialRegion={{
                    latitude: mapPickerCoords.latitude,
                    longitude: mapPickerCoords.longitude,
                    latitudeDelta: 0.002,
                    longitudeDelta: 0.002,
                  }}
                  onRegionChangeComplete={onPickerRegionChangeComplete}
                  showsUserLocation
                />
              )}
              <View style={[styles.pickerTop, { top: insets.top + spacing.l }]} pointerEvents="box-none">
                <IconButton icon={ArrowLeft} shape="round" size={48} onPress={() => setMapPickerVisible(false)} accessibilityLabel="Go back" />
                <View style={styles.pickerTitlePill}>
                  <Text style={styles.pickerTitle}>
                    Select {mapPickerType === 'pickup' ? 'pickup' : mapPickerType === 'stop' ? 'stop' : 'destination'}
                  </Text>
                </View>
              </View>
              <View style={styles.pickerCenterPin} pointerEvents="none">
                {mapPickerType === 'pickup' ? <PickupDot size={26} /> : mapPickerType === 'stop' ? <View style={styles.stopPin} /> : <DestinationSquare size={26} />}
                <View style={styles.pinStem} />
              </View>
              <BottomSheet style={[styles.pickerSheet, { paddingBottom: insets.bottom + spacing.xl }]}>
                <Text style={styles.overline}>Selected location</Text>
                <Text style={styles.pickerAddress} numberOfLines={2}>{mapPickerAddress}</Text>
                <Button title="Confirm location" onPress={confirmMapPicker} />
              </BottomSheet>
            </View>
          </Modal>
        </Animated.View>

        {/* Add stop */}
        <Modal visible={showStopModal} animationType="slide" onRequestClose={() => setShowStopModal(false)}>
          <SafeAreaView style={styles.safeArea}>
            <Header title="Add stop" onBackPress={() => setShowStopModal(false)} />
            <View style={styles.stopModalBody}>
              <CustomPlacesAutocomplete
                placeholder="Search for a stop"
                onPress={(data, details = null) => {
                  setStops([...stops, {
                    address: data.description,
                    location: {
                      type: 'Point',
                      coordinates: [details.geometry.location.lng, details.geometry.location.lat]
                    },
                    placeId: data.place_id
                  }]);
                  setShowStopModal(false);
                }}
                styles={{
                  textInputContainer: styles.stopInputContainer,
                  textInput: styles.stopTextInput,
                  container: styles.acContainer,
                }}
                placeholderTextColor={colors.placeholder}
                renderRightButton={() => (
                  <IconButton icon={MapIcon} size={40} onPress={() => openMapPicker('stop')} accessibilityLabel="Pick stop on map" style={styles.transparentBtn} />
                )}
              />
            </View>
          </SafeAreaView>
        </Modal>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const createStyles = (colors) => StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: colors.background },
  flex: { flex: 1 },
  scrollContent: { paddingBottom: 120 },

  activeRideBanner: {
    flexDirection: 'row', alignItems: 'center', gap: spacing.l,
    marginHorizontal: spacing.screen, marginBottom: spacing.l, padding: spacing.l,
    borderRadius: radius.card, backgroundColor: colors.primary,
  },
  activeRideTitle: { ...typography.bodyStrong, fontFamily: fonts.bold, color: colors.onPrimary },
  activeRideStatus: { ...typography.small, color: colors.onPrimaryMuted, textTransform: 'capitalize' },

  mapCard: {
    height: 240, marginHorizontal: spacing.screen, borderRadius: radius.cardLarge,
    overflow: 'hidden', backgroundColor: colors.surface,
  },
  mapLoading: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: spacing.l },
  mapLoadingText: { ...typography.small, color: colors.textSecondary },
  etaPill: {
    position: 'absolute', left: spacing.l, bottom: spacing.l,
    flexDirection: 'row', alignItems: 'center', gap: 6,
    backgroundColor: colors.card, borderRadius: radius.chip, paddingHorizontal: spacing.l, height: 36, ...shadows.soft,
  },
  etaValue: { ...typography.small, fontFamily: fonts.bold, color: colors.text },
  etaDivider: { width: 1, height: 14, backgroundColor: colors.border, marginHorizontal: 4 },
  etaApprox: { ...typography.small, fontSize: 12, color: colors.textSecondary },

  section: { paddingHorizontal: spacing.screen, marginTop: spacing.xxl },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  sectionTitle: { ...typography.cardTitle, color: colors.text, marginBottom: spacing.l },
  link: { ...typography.bodyStrong, fontFamily: fonts.bold, color: colors.accent, marginBottom: spacing.l },
  overline: { ...typography.overline, color: colors.textSecondary, marginBottom: spacing.s },

  stopRow: {
    flexDirection: 'row', alignItems: 'center', gap: spacing.l, marginTop: spacing.s,
    backgroundColor: colors.surface, borderRadius: radius.field, paddingLeft: spacing.xl, paddingRight: spacing.xs, minHeight: 48,
  },
  stopMarker: { width: 12, height: 12, borderRadius: 6, backgroundColor: palette.goldDark },
  stopText: { ...typography.body, color: colors.text, flex: 1 },
  addStop: { marginTop: spacing.l },

  tariffRow: { paddingHorizontal: spacing.screen, gap: spacing.l },
  tariffCard: { width: 132 },

  guestToggle: {
    flexDirection: 'row', alignItems: 'center', gap: spacing.l,
    backgroundColor: colors.card, borderWidth: 1, borderColor: colors.border,
    borderRadius: radius.card, padding: spacing.l, minHeight: 64,
  },
  guestToggleText: { ...typography.bodyStrong, color: colors.text, flex: 1 },
  guestFields: { marginTop: spacing.xl },

  priceRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.s },
  priceChips: { gap: spacing.s, paddingHorizontal: spacing.xs, alignItems: 'center' },

  footer: {
    position: 'absolute', left: 0, right: 0, bottom: 0,
    paddingHorizontal: spacing.screen, paddingTop: spacing.l,
    backgroundColor: colors.background, borderTopWidth: 1, borderTopColor: colors.border,
  },

  modalOverlay: { flex: 1, justifyContent: 'flex-end', backgroundColor: colors.overlay },
  modalHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: spacing.l },
  modalTitle: { ...typography.title, color: colors.text },
  modalList: { gap: spacing.m },

  pickerContainer: { flex: 1, backgroundColor: colors.surface },
  pickerTop: { position: 'absolute', left: spacing.screen, right: spacing.screen, flexDirection: 'row', alignItems: 'center', gap: spacing.l },
  pickerTitlePill: { backgroundColor: colors.card, borderRadius: radius.chip, paddingHorizontal: spacing.xl, height: 48, justifyContent: 'center', ...shadows.soft },
  pickerTitle: { ...typography.bodyStrong, fontFamily: fonts.bold, color: colors.text },
  pickerCenterPin: { position: 'absolute', top: '50%', left: '50%', marginLeft: -13, marginTop: -42, alignItems: 'center', width: 26 },
  pinStem: { width: 3, height: 16, backgroundColor: palette.primary, borderBottomLeftRadius: 2, borderBottomRightRadius: 2 },
  stopPin: { width: 26, height: 26, borderRadius: 13, backgroundColor: palette.goldDark, borderWidth: 3, borderColor: palette.white },
  pickerSheet: { position: 'absolute', left: 0, right: 0, bottom: 0 },
  pickerAddress: { ...typography.cardTitle, color: colors.text, marginBottom: spacing.xl },

  stopModalBody: { flex: 1, padding: spacing.screen },
  acContainer: { zIndex: 1 },
  stopInputContainer: { minHeight: 56, borderRadius: radius.field, backgroundColor: colors.surface, paddingLeft: spacing.xl },
  stopTextInput: { ...typography.body, color: colors.text, height: 56 },
  transparentBtn: { backgroundColor: 'transparent' },
});

export default BookRideScreen;
