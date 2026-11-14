import React, { useState, useEffect, useRef, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  StatusBar,
  Animated,
  Alert,
  Platform,
  Modal,
  KeyboardAvoidingView,
  ScrollView,
  Image,
} from 'react-native';
import { useDispatch, useSelector } from 'react-redux';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import CustomPlacesAutocomplete from '../../components/common/CustomPlacesAutocomplete';
import MapView from 'react-native-maps';
import SidebarMenu from '../../components/common/SidebarMenu';

import {
  Menu, Bell, Search, Clock, Car, Users, CalendarClock, Package, BusFront, History,
  ChevronRight, User, Info, X, LocateFixed, Map as MapIcon, ArrowLeft,
} from 'lucide-react-native';
import { useNavigation } from '@react-navigation/native';
import * as Location from 'expo-location';
import api from '../../services/api';
import { useTheme } from '../../context/ThemeContext';
import {
  BottomSheet, Button, Chip, IconButton, IconTile, Badge, PickupDot, DestinationSquare,
} from '../../components/ui';
import { palette, serviceTints, fonts, radius, shadows, spacing, typography } from '../../theme/tokens';

const HomeScreen = () => {
  const navigation = useNavigation();
  const dispatch = useDispatch();
  const { user } = useSelector(state => state.auth);
  const { currentRide } = useSelector(state => state.ride);
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const styles = useMemo(() => createStyles(colors), [colors]);

  const [location, setLocation] = useState(null);
  const [errorMsg, setErrorMsg] = useState(null);
  const [sidebarVisible, setSidebarVisible] = useState(false);
  const [locationModalVisible, setLocationModalVisible] = useState(false);
  const [focusedInput, setFocusedInput] = useState(null);

  const [pickup, setPickup] = useState(null);
  const [destination, setDestination] = useState(null);
  const [hasAutoNavigated, setHasAutoNavigated] = useState(false);
  const [locationLoading, setLocationLoading] = useState(false);
  const [recentRides, setRecentRides] = useState([]);
  const pickupRef = useRef(null);
  const destinationRef = useRef(null);
  const [mapPickerVisible, setMapPickerVisible] = useState(false);
  const [mapPickerType, setMapPickerType] = useState('pickup');
  const [mapPickerCoords, setMapPickerCoords] = useState(null);
  const [mapPickerAddress, setMapPickerAddress] = useState('Loading address...');
  const pickerMapRef = useRef(null);

  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (pickup && destination && !hasAutoNavigated) {
      setHasAutoNavigated(true);
      setLocationModalVisible(false);
      navigation.navigate('BookRide', {
        pickup: pickup,
        destination: destination
      });
    } else if (!pickup || !destination) {
      setHasAutoNavigated(false);
    }
  }, [pickup, destination, hasAutoNavigated, navigation]);

  useEffect(() => {
    if (locationModalVisible) {
      if (pickup) {
        setTimeout(() => {
          pickupRef.current?.setAddressText(pickup.address);
        }, 100);
      } else {
        getCurrentLocation();
      }
    }
  }, [locationModalVisible, pickup]);

  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 400,
      useNativeDriver: true,
    }).start();
    getCurrentLocation();
    checkActiveRides();
    fetchRecentRides();
  }, []);

  const checkActiveRides = async () => {
    try {
      const response = await api.get('/rides/active');
      if (response.data?.success && response.data.rides?.length > 0) {
        const activeRide = response.data.rides.find(r => r.status === 'searching' || r.status === 'accepted' || r.status === 'started');
        if (activeRide) {
          console.log('[HomeScreen] Found active ride:', activeRide._id, 'Status:', activeRide.status);
          dispatch({ type: 'ride/getRideDetails/fulfilled', payload: { ride: activeRide } });
        } else {
          dispatch({ type: 'ride/clearCurrentRide' });
        }
      } else {
        dispatch({ type: 'ride/clearCurrentRide' });
      }
    } catch (error) {
      console.error('[HomeScreen] Check active rides error:', error);
    }
  };

  const fetchRecentRides = async () => {
    try {
      const response = await api.get('/history/passenger');
      const history = response.data?.history || [];
      const seen = new Set();
      const recents = [];
      for (const ride of history) {
        const address = ride.dropoff?.address;
        if (!address || seen.has(address)) continue;
        seen.add(address);
        recents.push(ride);
        if (recents.length === 3) break;
      }
      setRecentRides(recents);
    } catch (error) {
      // Recent places are optional — fail silently
      console.log('[HomeScreen] Recent rides unavailable:', error.message);
    }
  };

  useEffect(() => {
    const socketService = require('../../services/socket').default;

    const handleJoinAccepted = (data) => {
      Alert.alert('Carpool Update', 'Your carpool request was accepted!');
    };
    const handleJoinRejected = (data) => {
      Alert.alert('Carpool Update', 'Your carpool request was rejected.');
    };
    const handleCarpoolStarted = (data) => {
      Alert.alert('Carpool Started', 'Your carpool is now in progress!');
    };
    const handleCarpoolCompleted = (data) => {
      Alert.alert('Carpool Completed', `Your carpool has finished. Fare: Rs. ${data.fare}`);
    };
    const handleRideUpdated = (data) => {
      console.log('[HomeScreen] Received ride-updated:', data);
      checkActiveRides();
      if (data?.message) {
        Alert.alert('Subscription Ride Active', data.message);
      }
    };

    socketService.on('join-accepted', handleJoinAccepted);
    socketService.on('join-rejected', handleJoinRejected);
    socketService.on('carpool-started', handleCarpoolStarted);
    socketService.on('carpool-completed', handleCarpoolCompleted);
    socketService.on('ride-updated', handleRideUpdated);

    return () => {
      socketService.off('join-accepted', handleJoinAccepted);
      socketService.off('join-rejected', handleJoinRejected);
      socketService.off('carpool-started', handleCarpoolStarted);
      socketService.off('carpool-completed', handleCarpoolCompleted);
      socketService.off('ride-updated', handleRideUpdated);
    };
  }, [navigation]);

  const getCurrentLocation = async () => {
    setLocationLoading(true);
    try {
      let { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        setErrorMsg('Permission to access location was denied');
        setLocationLoading(false);
        return;
      }

      let loc = await Location.getCurrentPositionAsync({});
      setLocation(loc);

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
          type: 'Point',
          coordinates: [loc.coords.longitude, loc.coords.latitude]
        }
      });
      pickupRef.current?.setAddressText(addressStr);
    } catch (error) {
      console.error('Location error:', error);
    } finally {
      setLocationLoading(false);
    }
  };

  const openMapPicker = async (type) => {
    setMapPickerType(type);
    setMapPickerVisible(true);
    let coords = type === 'pickup' && pickup ?
      { latitude: pickup.location.coordinates[1], longitude: pickup.location.coordinates[0] } :
      type === 'destination' && destination ?
        { latitude: destination.location.coordinates[1], longitude: destination.location.coordinates[0] } : null;

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
    } else {
      setDestination(data);
      destinationRef.current?.setAddressText(data.address);
    }
    setMapPickerVisible(false);
  };

  const handleWhereToPress = () => {
    setLocationModalVisible(false);
    navigation.navigate('BookRide', {
      pickup: pickup,
      destination: destination
    });
  };

  const handleRecentPress = (ride) => {
    const coords = ride.dropoff?.location?.coordinates;
    if (coords?.length === 2) {
      const data = {
        address: ride.dropoff.address,
        location: {
          type: 'Point',
          coordinates: coords
        }
      };
      setDestination(data);
      if (destinationRef.current) {
        destinationRef.current.setAddressText(data.address);
      }
      
      if (pickup) {
        navigation.navigate('BookRide', { pickup: pickup, destination: data });
      } else {
        setLocationModalVisible(true);
      }
    } else {
      navigation.navigate('BookRide', { pickup: pickup, destination: null });
    }
  };

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 17) return 'Good afternoon';
    return 'Good evening';
  };

  // Service tiles. Colors come from serviceTints in the theme tokens.
  const serviceOptions = useMemo(() => [
    { id: 'ride', title: 'Book a ride', icon: Car, screen: 'BookRide', description: 'City trips, right now', tint: 'ride' },
    { id: 'carpool', title: 'Carpool', icon: Users, screen: 'BookCarpool', description: 'Share and save', tint: 'carpool' },
    { id: 'subscription', title: 'Monthly', icon: CalendarClock, screen: 'MySubscriptions', description: 'Daily commute', tint: 'monthly' },
    { id: 'parcel', title: 'Parcel', icon: Package, screen: 'SendParcel', description: 'Deliver items', tint: 'parcel' },
    { id: 'intercity', title: 'Intercity', icon: BusFront, screen: 'BookIntercity', description: 'City to city', tint: 'intercity' },
  ], []);

  const onServicePress = (service) => {
    if (service.id === 'ride') {
      setLocationModalVisible(true);
    } else {
      navigation.navigate(service.screen);
    }
  };

  const mapRegion = location
    ? { latitude: location.coords.latitude, longitude: location.coords.longitude, latitudeDelta: 0.012, longitudeDelta: 0.012 }
    : { latitude: 33.6844, longitude: 73.0479, latitudeDelta: 0.08, longitudeDelta: 0.08 };

  const rideService = serviceOptions[0];
  const otherServices = serviceOptions.slice(1);

  const renderRecentRow = (ride, index, onPress, inSheet) => (
    <Pressable
      key={ride._id}
      style={({ pressed }) => [styles.recentItem, index < recentRides.length - 1 && styles.recentItemDivider, pressed && styles.pressed]}
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={`Recent destination ${ride.dropoff?.address || ''}`}
    >
      <IconTile icon={History} size="sm" bg={inSheet ? colors.surface : colors.card} color={colors.textSecondary} />
      <View style={styles.recentTextContainer}>
        <Text style={styles.recentAddress} numberOfLines={1}>{ride.dropoff?.address}</Text>
        <Text style={styles.recentSubtitle} numberOfLines={1}>
          {ride.createdAt
            ? new Date(ride.createdAt).toLocaleDateString('en-PK', { day: '2-digit', month: 'short' })
            : 'Past ride'}
        </Text>
      </View>
      <ChevronRight size={18} color={colors.textSecondary} strokeWidth={2} />
    </Pressable>
  );

  return (
    <View style={styles.root}>
      <StatusBar barStyle={colors.statusBarStyle} />

      {/* Full-screen map */}
      <MapView
        key={location ? 'located' : 'default'}
        style={StyleSheet.absoluteFill}
        initialRegion={mapRegion}
        showsUserLocation
        showsMyLocationButton={false}
        toolbarEnabled={false}
      />

      {/* Floating map buttons */}
      <View style={[styles.floatingRow, { top: insets.top + spacing.l }]} pointerEvents="box-none">
        <IconButton icon={Menu} shape="round" size={48} onPress={() => setSidebarVisible(true)} accessibilityLabel="Open menu" />
        <IconButton icon={Bell} shape="round" size={48} onPress={() => navigation.navigate('Notifications')} accessibilityLabel="Notifications" />
      </View>

      {/* Bottom sheet */}
      <Animated.View style={[styles.sheetWrap, { opacity: fadeAnim }]}>
        <BottomSheet style={styles.sheet}>
          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={{ paddingBottom: insets.bottom + spacing.xl }}
            bounces={false}
          >
            <Text style={styles.greeting}>{getGreeting()}, {user?.name?.split(' ')[0] || 'there'}</Text>

            {/* "Where to?" bar */}
            <Pressable
              style={({ pressed }) => [styles.whereTo, pressed && styles.pressed]}
              onPress={() => setLocationModalVisible(true)}
              accessibilityRole="button"
              accessibilityLabel="Where to? Plan a ride now"
            >
              <Search size={22} color={colors.text} strokeWidth={2.25} />
              <Text style={styles.whereToText}>Where to?</Text>
              <View style={styles.nowChip}>
                <Clock size={14} color={colors.text} strokeWidth={2} />
                <Text style={styles.nowChipText}>Now</Text>
              </View>
            </Pressable>

            {/* Active ride banner */}
            {currentRide && (currentRide.status === 'searching' || currentRide.status === 'accepted' || currentRide.status === 'started') && (() => {
              const driverPhoto = currentRide.driverId?.userId?.profilePhoto || currentRide.driverId?.profilePhoto || currentRide.driverId?.userId?.profileImage;
              const driverName = currentRide.driverId?.userId?.name || currentRide.driverId?.name;
              const isSubscription = currentRide.type === 'carpool-subscription' || !!currentRide.subscriptionId;
              const subPlanType = currentRide.subscriptionId?.planType;
              const formattedScheduledTime = currentRide.scheduledTime ? new Date(currentRide.scheduledTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true }) : null;
              const statusLabel = currentRide.status === 'searching' ? 'Finding driver' : currentRide.status === 'accepted' ? 'Driver on the way' : 'On trip';

              return (
                <Pressable
                  style={({ pressed }) => [styles.activeRide, pressed && styles.pressed]}
                  onPress={() => navigation.navigate('RideTracking', { rideId: currentRide._id })}
                  accessibilityRole="button"
                  accessibilityLabel={`Active ride, ${statusLabel}. Open ride tracking`}
                >
                  <View style={styles.activeRideTop}>
                    {driverPhoto ? (
                      <Image source={{ uri: driverPhoto }} style={styles.activeRidePhoto} />
                    ) : (
                      <View style={styles.activeRideIcon}>
                        {driverName ? <User size={20} color={colors.accent} strokeWidth={2} /> : <Car size={20} color={colors.accent} strokeWidth={2} />}
                      </View>
                    )}
                    <View style={styles.flex}>
                      <Badge label={statusLabel} tone="cream" style={styles.activeRideBadge} />
                      <Text style={styles.activeRideTitle} numberOfLines={1}>
                        {driverName ? driverName : (currentRide.status === 'searching' ? 'Searching for driver' : 'Driver assigned')}
                      </Text>
                      {currentRide.driverId?.vehicleDetails && (
                        <Text style={styles.activeRideSub} numberOfLines={1}>
                          {currentRide.driverId.vehicleDetails.make || ''} {currentRide.driverId.vehicleDetails.model || ''} {currentRide.driverId.vehicleDetails.plateNumber ? `· ${currentRide.driverId.vehicleDetails.plateNumber}` : ''}
                        </Text>
                      )}
                    </View>
                    <ChevronRight size={20} color={colors.textSecondary} strokeWidth={2} />
                  </View>

                  <View style={styles.activeRideDetails}>
                    {isSubscription && (
                      <View style={styles.detailRow}>
                        <CalendarClock size={14} color={colors.textSecondary} strokeWidth={2} />
                        <Text style={styles.detailText} numberOfLines={1}>
                          Subscription: <Text style={styles.detailStrong}>{subPlanType ? `${subPlanType} plan` : 'Commute subscription'}</Text>
                        </Text>
                      </View>
                    )}
                    {formattedScheduledTime && (
                      <View style={styles.detailRow}>
                        <Clock size={14} color={colors.textSecondary} strokeWidth={2} />
                        <Text style={styles.detailText}>
                          Scheduled: <Text style={styles.detailStrong}>{formattedScheduledTime}</Text>
                        </Text>
                      </View>
                    )}
                    <View style={styles.detailRow}>
                      <DestinationSquare size={12} />
                      <Text style={styles.detailText} numberOfLines={1}>To {currentRide.dropoff?.address || 'destination'}</Text>
                    </View>
                  </View>

                  {currentRide.type === 'carpool-subscription' && currentRide.status === 'accepted' && (
                    <Pressable
                      style={styles.reportAbsentBtn}
                      accessibilityRole="button"
                      hitSlop={6}
                      onPress={() => {
                        Alert.alert(
                          'Report Driver Absent',
                          'Are you sure you want to report the driver as a no-show? This will cancel the ride.',
                          [
                            { text: 'Cancel', style: 'cancel' },
                            {
                              text: 'Report Absent',
                              style: 'destructive',
                              onPress: async () => {
                                try {
                                  await api.post(`/rides/${currentRide._id}/no-show`);
                                  dispatch({ type: 'ride/clearCurrentRide' });
                                  Alert.alert('Reported', 'The ride has been cancelled and penalized appropriately.');
                                } catch (err) {
                                  Alert.alert('Error', err.response?.data?.error || 'Failed to report absent');
                                }
                              }
                            }
                          ]
                        );
                      }}
                    >
                      <Info size={14} color={colors.warning} strokeWidth={2} />
                      <Text style={styles.reportAbsentText}>Report driver absent</Text>
                    </Pressable>
                  )}
                </Pressable>
              );
            })()}

            {/* Services */}
            <Text style={styles.sectionTitle}>Services</Text>
            <Pressable
              style={({ pressed }) => [styles.rideTile, pressed && styles.pressed]}
              onPress={() => onServicePress(rideService)}
              accessibilityRole="button"
              accessibilityLabel={`${rideService.title}. ${rideService.description}`}
            >
              <View style={styles.flex}>
                <Text style={styles.rideTileTitle}>{rideService.title}</Text>
                <Text style={styles.rideTileDesc}>{rideService.description}</Text>
              </View>
              <IconTile icon={Car} size={56} bg={serviceTints.ride.icon} color={serviceTints.ride.bg} />
            </Pressable>
            <View style={styles.servicesGrid}>
              {otherServices.map((service) => (
                <Pressable
                  key={service.id}
                  style={({ pressed }) => [styles.serviceTile, pressed && styles.pressed]}
                  onPress={() => onServicePress(service)}
                  accessibilityRole="button"
                  accessibilityLabel={`${service.title}. ${service.description}`}
                >
                  <IconTile icon={service.icon} tint={service.tint} size="lg" />
                  <Text style={styles.serviceTitle}>{service.title}</Text>
                  <Text style={styles.serviceDesc} numberOfLines={1}>{service.description}</Text>
                </Pressable>
              ))}
            </View>

            {/* Recent places */}
            {recentRides.length > 0 && (
              <>
                <Text style={styles.sectionTitle}>Recent</Text>
                <View style={styles.recentCard}>
                  {recentRides.map((ride, index) => renderRecentRow(ride, index, () => handleRecentPress(ride), true))}
                </View>
              </>
            )}
          </ScrollView>
        </BottomSheet>
      </Animated.View>

      <SidebarMenu
        visible={sidebarVisible}
        onClose={() => setSidebarVisible(false)}
      />

      {/* Plan ride sheet */}
      <Modal visible={locationModalVisible} animationType="slide" transparent={true} onRequestClose={() => setLocationModalVisible(false)}>
        <KeyboardAvoidingView
          style={styles.modalOverlay}
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        >
          <BottomSheet style={[styles.planSheet, { paddingBottom: insets.bottom + spacing.xl }]}>
            <View style={styles.planHeader}>
              <Text style={styles.planTitle} accessibilityRole="header">Plan your ride</Text>
              <IconButton icon={X} onPress={() => setLocationModalVisible(false)} accessibilityLabel="Close" />
            </View>

            <ScrollView
              style={styles.planScroll}
              keyboardShouldPersistTaps="handled"
              showsVerticalScrollIndicator={false}
            >
              <Chip
                label={locationLoading ? 'Locating' : 'Use current location'}
                icon={LocateFixed}
                onPress={getCurrentLocation}
                disabled={locationLoading}
                style={styles.currentChip}
              />

              {/* Route block: pickup and destination */}
              <View style={styles.routeBlock}>
                <View style={[styles.routeRow, { zIndex: 99 }]}>
                  <View style={styles.routeMarker}><PickupDot /></View>
                  <View style={styles.routeInput}>
                    <CustomPlacesAutocomplete
                      ref={pickupRef}
                      placeholder="Pickup location"
                      onPress={(data, details = null) => {
                        setPickup({
                          address: data.description,
                          location: {
                            type: 'Point',
                            coordinates: [
                              details.geometry.location.lng,
                              details.geometry.location.lat
                            ]
                          },
                          placeId: data.place_id
                        });
                      }}
                      textInputProps={{
                        onFocus: () => setFocusedInput('pickup'),
                        onBlur: () => setFocusedInput(null)
                      }}
                      styles={{
                        textInputContainer: [styles.acInputContainer, focusedInput === 'pickup' && styles.acInputFocused],
                        textInput: styles.acTextInput,
                        container: styles.acContainer,
                        listView: styles.acList,
                      }}
                      placeholderTextColor={colors.placeholder}
                      renderRightButton={() => (
                        <IconButton icon={MapIcon} size={40} onPress={() => openMapPicker('pickup')} accessibilityLabel="Pick pickup on map" style={styles.mapBtn} />
                      )}
                    />
                  </View>
                </View>
                <View style={styles.routeDivider} />
                <View style={[styles.routeRow, { zIndex: 98 }]}>
                  <View style={styles.routeMarker}><DestinationSquare /></View>
                  <View style={styles.routeInput}>
                    <CustomPlacesAutocomplete
                      ref={destinationRef}
                      placeholder="Where to?"
                      onPress={(data, details = null) => {
                        setDestination({
                          address: data.description,
                          location: {
                            type: 'Point',
                            coordinates: [
                              details.geometry.location.lng,
                              details.geometry.location.lat
                            ]
                          },
                          placeId: data.place_id
                        });
                      }}
                      textInputProps={{
                        onFocus: () => setFocusedInput('destination'),
                        onBlur: () => setFocusedInput(null)
                      }}
                      styles={{
                        textInputContainer: [styles.acInputContainer, focusedInput === 'destination' && styles.acInputFocused],
                        textInput: styles.acTextInput,
                        container: styles.acContainer,
                        listView: styles.acList,
                      }}
                      placeholderTextColor={colors.placeholder}
                      renderRightButton={() => (
                        <IconButton icon={MapIcon} size={40} onPress={() => openMapPicker('destination')} accessibilityLabel="Pick destination on map" style={styles.mapBtn} />
                      )}
                    />
                  </View>
                </View>
              </View>

              {recentRides.length > 0 && (
                <View style={styles.planRecent}>
                  <Text style={styles.overline}>Recent destinations</Text>
                  <View style={styles.recentCardPlain}>
                    {recentRides.map((ride, index) => renderRecentRow(ride, index, () => {
                      const coords = ride.dropoff?.location?.coordinates;
                      if (coords?.length === 2) {
                        const destData = {
                          address: ride.dropoff.address,
                          location: {
                            type: 'Point',
                            coordinates: coords
                          }
                        };
                        setDestination(destData);
                        destinationRef.current?.setAddressText(destData.address);
                        if (pickup) {
                          setLocationModalVisible(false);
                          navigation.navigate('BookRide', { pickup, destination: destData });
                        }
                      }
                    }, false))}
                  </View>
                </View>
              )}
            </ScrollView>

            <Button
              title="Continue"
              onPress={handleWhereToPress}
              disabled={!pickup || !destination}
              style={styles.planContinue}
            />
          </BottomSheet>
        </KeyboardAvoidingView>
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
              <Text style={styles.pickerTitle}>Select {mapPickerType === 'pickup' ? 'pickup' : 'destination'}</Text>
            </View>
          </View>
          <View style={styles.pickerCenterPin} pointerEvents="none">
            {mapPickerType === 'pickup' ? (
              <View style={styles.pinPickup}><View style={styles.pinPickupInner} /></View>
            ) : (
              <View style={styles.pinDest} />
            )}
            <View style={styles.pinStem} />
          </View>
          <BottomSheet style={[styles.pickerSheet, { paddingBottom: insets.bottom + spacing.xl }]}>
            <Text style={styles.overline}>Selected location</Text>
            <Text style={styles.pickerAddress} numberOfLines={2}>{mapPickerAddress}</Text>
            <Button title="Confirm location" onPress={confirmMapPicker} />
          </BottomSheet>
        </View>
      </Modal>
    </View>
  );
};

const createStyles = (colors) => StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.surface },
  flex: { flex: 1 },
  pressed: { opacity: 0.85 },

  floatingRow: {
    position: 'absolute', left: spacing.screen, right: spacing.screen,
    flexDirection: 'row', justifyContent: 'space-between',
  },

  sheetWrap: { position: 'absolute', left: 0, right: 0, bottom: 0, maxHeight: '66%' },
  sheet: { paddingBottom: 0 },
  greeting: { ...typography.title, color: colors.text, marginBottom: spacing.l },

  whereTo: {
    flexDirection: 'row', alignItems: 'center', gap: spacing.l,
    minHeight: 60, borderRadius: radius.card - 2, paddingLeft: spacing.xl, paddingRight: spacing.s,
    backgroundColor: colors.surface,
  },
  whereToText: { ...typography.cardTitle, fontSize: 18, color: colors.text, flex: 1 },
  nowChip: {
    flexDirection: 'row', alignItems: 'center', gap: 6, height: 40, paddingHorizontal: 14,
    borderRadius: radius.chip, backgroundColor: colors.card,
  },
  nowChipText: { ...typography.small, fontFamily: fonts.bold, color: colors.text },

  activeRide: {
    marginTop: spacing.xl, padding: spacing.xl, borderRadius: radius.card,
    backgroundColor: colors.card, borderWidth: 1, borderColor: colors.border, ...shadows.soft,
  },
  activeRideTop: { flexDirection: 'row', alignItems: 'center', gap: spacing.l },
  activeRidePhoto: { width: 48, height: 48, borderRadius: 24 },
  activeRideIcon: { width: 48, height: 48, borderRadius: 24, backgroundColor: colors.surface, alignItems: 'center', justifyContent: 'center' },
  activeRideBadge: { marginBottom: 4 },
  activeRideTitle: { ...typography.cardTitle, color: colors.text },
  activeRideSub: { ...typography.small, color: colors.textSecondary, marginTop: 2 },
  activeRideDetails: { marginTop: spacing.l, paddingTop: spacing.l, borderTopWidth: 1, borderTopColor: colors.border, gap: 6 },
  detailRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.s },
  detailText: { ...typography.small, color: colors.textSecondary, flex: 1 },
  detailStrong: { fontFamily: fonts.bold, color: colors.text },
  reportAbsentBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, alignSelf: 'flex-start', minHeight: 44, marginTop: spacing.xs },
  reportAbsentText: { ...typography.small, fontFamily: fonts.semibold, color: colors.warning },

  sectionTitle: { ...typography.overline, color: colors.textSecondary, marginTop: spacing.xxl, marginBottom: spacing.l },
  overline: { ...typography.overline, color: colors.textSecondary, marginBottom: spacing.s },

  rideTile: {
    flexDirection: 'row', alignItems: 'center', gap: spacing.l,
    backgroundColor: serviceTints.ride.bg, borderRadius: radius.card, padding: spacing.xl, minHeight: 92,
  },
  rideTileTitle: { ...typography.title, color: colors.onPrimary },
  rideTileDesc: { ...typography.small, color: colors.onPrimaryMuted, marginTop: 2 },
  servicesGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.l, marginTop: spacing.l },
  serviceTile: {
    width: '48%', flexGrow: 1, backgroundColor: colors.surface, borderRadius: radius.card,
    padding: spacing.xl, minHeight: 120,
  },
  serviceTitle: { ...typography.cardTitle, color: colors.text, marginTop: spacing.l },
  serviceDesc: { ...typography.small, color: colors.textSecondary, marginTop: 2 },

  recentCard: { backgroundColor: colors.surface, borderRadius: radius.card, paddingHorizontal: spacing.l },
  recentCardPlain: { borderRadius: radius.card, borderWidth: 1, borderColor: colors.border, paddingHorizontal: spacing.l },
  recentItem: { flexDirection: 'row', alignItems: 'center', gap: spacing.l, minHeight: 60 },
  recentItemDivider: { borderBottomWidth: 1, borderBottomColor: colors.border },
  recentTextContainer: { flex: 1 },
  recentAddress: { ...typography.bodyStrong, color: colors.text },
  recentSubtitle: { ...typography.small, color: colors.textSecondary },

  // Plan ride sheet
  modalOverlay: { flex: 1, justifyContent: 'flex-end', backgroundColor: colors.overlay },
  planSheet: { maxHeight: '92%' },
  planHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: spacing.l },
  planTitle: { ...typography.title, color: colors.text },
  planScroll: { flexGrow: 0 },
  currentChip: { marginBottom: spacing.l },
  routeBlock: { backgroundColor: colors.surface, borderRadius: radius.card - 2, paddingHorizontal: spacing.l, paddingVertical: spacing.xs },
  routeRow: { flexDirection: 'row', alignItems: 'center' },
  routeMarker: { width: 24, alignItems: 'center', marginRight: spacing.s },
  routeInput: { flex: 1 },
  routeDivider: { height: 1, backgroundColor: colors.border, marginLeft: 32 },
  acContainer: { zIndex: 1 },
  acInputContainer: { minHeight: 56, borderRadius: radius.field, paddingLeft: spacing.xs },
  acInputFocused: { backgroundColor: colors.card },
  acTextInput: { ...typography.bodyStrong, color: colors.text, height: 56 },
  acList: { borderWidth: 1, borderColor: colors.border },
  mapBtn: { backgroundColor: 'transparent' },
  planRecent: { marginTop: spacing.xxl },
  planContinue: { marginTop: spacing.xl },

  // Map picker
  pickerContainer: { flex: 1, backgroundColor: colors.surface },
  pickerTop: { position: 'absolute', left: spacing.screen, right: spacing.screen, flexDirection: 'row', alignItems: 'center', gap: spacing.l },
  pickerTitlePill: { backgroundColor: colors.card, borderRadius: radius.chip, paddingHorizontal: spacing.xl, height: 48, justifyContent: 'center', ...shadows.soft },
  pickerTitle: { ...typography.bodyStrong, fontFamily: fonts.bold, color: colors.text },
  pickerCenterPin: { position: 'absolute', top: '50%', left: '50%', marginLeft: -14, marginTop: -44, alignItems: 'center', width: 28 },
  pinPickup: { width: 28, height: 28, borderRadius: 14, backgroundColor: palette.primary, alignItems: 'center', justifyContent: 'center' },
  pinPickupInner: { width: 10, height: 10, borderRadius: 5, backgroundColor: palette.white },
  pinDest: { width: 26, height: 26, borderRadius: 6, backgroundColor: palette.accent, borderWidth: 3, borderColor: palette.primary },
  pinStem: { width: 3, height: 16, backgroundColor: palette.primary, borderBottomLeftRadius: 2, borderBottomRightRadius: 2 },
  pickerSheet: { position: 'absolute', left: 0, right: 0, bottom: 0 },
  pickerAddress: { ...typography.cardTitle, color: colors.text, marginBottom: spacing.xl },
});

export default HomeScreen;
