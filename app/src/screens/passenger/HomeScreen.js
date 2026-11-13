import React, { useState, useEffect, useRef, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  StatusBar,
  Animated,
  ActivityIndicator,
  Alert,
  Platform,
  Modal,
  KeyboardAvoidingView,
  ScrollView,
} from 'react-native';
import { useDispatch, useSelector } from 'react-redux';

import CustomPlacesAutocomplete from '../../components/common/CustomPlacesAutocomplete';
import MapView from 'react-native-maps';
import SidebarMenu from '../../components/common/SidebarMenu';

import Icon from 'react-native-vector-icons/MaterialIcons';
import IconIonic from 'react-native-vector-icons/Ionicons';
import IconMCI from 'react-native-vector-icons/MaterialCommunityIcons';
import { useNavigation } from '@react-navigation/native';
import * as Location from 'expo-location';
import api from '../../services/api';
import { useTheme } from '../../context/ThemeContext';

const HomeScreen = () => {
  const navigation = useNavigation();
  const dispatch = useDispatch();
  const { user } = useSelector(state => state.auth);
  const { currentRide } = useSelector(state => state.ride);
  const { colors, isDark } = useTheme();
  const styles = useMemo(() => createStyles(colors, isDark), [colors, isDark]);

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

  const serviceOptions = useMemo(() => [
    {
      id: 'ride',
      title: 'Book a Ride',
      icon: 'car-outline',
      iconType: 'ionicon',
      screen: 'BookRide',
      description: 'City trips',
      bgColor: isDark ? '#2A200B' : '#FFF7E0',
      iconColor: isDark ? '#F5A623' : '#F5A623',
    },
    {
      id: 'carpool',
      title: 'Carpool',
      icon: 'people-outline',
      iconType: 'ionicon',
      screen: 'BookCarpool',
      description: 'Share & save',
      bgColor: isDark ? '#0D271F' : '#E1F5EE',
      iconColor: isDark ? '#1D9E75' : '#1D9E75',
    },
    {
      id: 'subscription',
      title: 'Monthly Sub',
      icon: 'repeat-outline',
      iconType: 'ionicon',
      screen: 'MySubscriptions',
      description: 'Daily commute',
      bgColor: isDark ? '#2D1B36' : '#F3E5F5',
      iconColor: isDark ? '#8E24AA' : '#8E24AA',
    },
    {
      id: 'parcel',
      title: 'Send Parcel',
      icon: 'cube-outline',
      iconType: 'ionicon',
      screen: 'SendParcel',
      description: 'Deliver items',
      bgColor: isDark ? '#2D1B15' : '#FAECE7',
      iconColor: isDark ? '#D85A30' : '#D85A30',
    },
    {
      id: 'intercity',
      title: 'Intercity',
      icon: 'bus-outline',
      iconType: 'ionicon',
      screen: 'BookIntercity',
      description: 'City to city',
      bgColor: isDark ? '#15212D' : '#E6F1FB',
      iconColor: isDark ? '#378ADD' : '#378ADD',
    }
  ], [isDark]);

  const getIcon = (icon, iconType, size, color) => {
    switch (iconType) {
      case 'ionicon':
        return <IconIonic name={icon} size={size} color={color} />;
      case 'material-community':
        return <IconMCI name={icon} size={size} color={color} />;
      default:
        return <Icon name={icon} size={size} color={color} />;
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle={colors.statusBarStyle} backgroundColor={colors.background} />

      <Animated.ScrollView 
        style={[styles.container, { opacity: fadeAnim }]}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 40 }}
      >
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <Text style={styles.greeting}>{getGreeting()},</Text>
            <Text style={styles.userName}>{user?.name || 'there'}</Text>
          </View>
          <View style={styles.headerRight}>
            <TouchableOpacity
              style={styles.headerIconButton}
              onPress={() => navigation.navigate('Notifications')}
              activeOpacity={0.7}
            >
              <IconIonic name="notifications-outline" size={22} color={colors.text} />
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.avatarButton}
              onPress={() => setSidebarVisible(true)}
              activeOpacity={0.7}
            >
              <Text style={styles.avatarText}>
                {(user?.name || 'U').charAt(0).toUpperCase()}
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* (Active ride moved below) */}
        {/* Location Card — the "Where to?" trigger */}
        <TouchableOpacity 
          style={styles.whereToTrigger} 
          activeOpacity={0.9}
          onPress={() => setLocationModalVisible(true)}
        >
          <View style={styles.whereToTriggerContent}>
            <IconIonic name="search" size={24} color={colors.textSecondary} />
            <Text style={styles.whereToTriggerText}>Where to?</Text>
          </View>
          <View style={styles.whereToTriggerTiming}>
            <IconIonic name="time" size={16} color={colors.textSecondary} style={{marginRight: 4}} />
            <Text style={styles.whereToTriggerTimingText}>Now</Text>
            <IconIonic name="chevron-down" size={16} color={colors.textSecondary} />
          </View>
        </TouchableOpacity>

        {/* Active Ride Banner */}
        {currentRide && (currentRide.status === 'searching' || currentRide.status === 'accepted' || currentRide.status === 'started') && (() => {
          const driverPhoto = currentRide.driverId?.userId?.profilePhoto || currentRide.driverId?.profilePhoto || currentRide.driverId?.userId?.profileImage;
          const driverName = currentRide.driverId?.userId?.name || currentRide.driverId?.name;
          const isSubscription = currentRide.type === 'carpool-subscription' || !!currentRide.subscriptionId;
          const subPlanType = currentRide.subscriptionId?.planType;
          const formattedScheduledTime = currentRide.scheduledTime ? new Date(currentRide.scheduledTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true }) : null;

          return (
            <TouchableOpacity
              style={styles.activeRideBanner}
              onPress={() => navigation.navigate('RideTracking', { rideId: currentRide._id })}
              activeOpacity={0.8}
            >
              <View style={styles.activeRideBannerMain}>
                <View style={styles.activeRideHeaderRow}>
                  <View style={styles.activeRideDriverContainer}>
                    {driverPhoto ? (
                      <Image source={{ uri: driverPhoto }} style={styles.activeRideDriverPhoto} />
                    ) : (
                      <View style={styles.activeRideIcon}>
                        <IconIonic name={driverName ? "person-outline" : "car-outline"} size={20} color={colors.accent} />
                      </View>
                    )}
                    <View style={{ flex: 1, marginLeft: driverPhoto ? 10 : 0 }}>
                      <Text style={styles.activeRideBannerTitle}>
                        {driverName ? driverName : (currentRide.status === 'searching' ? 'Searching for Driver...' : 'Driver Assigned')}
                      </Text>
                      {currentRide.driverId?.vehicleDetails && (
                        <Text style={styles.activeRideBannerSubtext} numberOfLines={1}>
                          {currentRide.driverId.vehicleDetails.make || ''} {currentRide.driverId.vehicleDetails.model || ''} {currentRide.driverId.vehicleDetails.plateNumber ? `• ${currentRide.driverId.vehicleDetails.plateNumber}` : ''}
                        </Text>
                      )}
                    </View>
                  </View>
                  <IconIonic name="chevron-forward" size={20} color={colors.textSecondary} />
                </View>

                {/* Ride Details (Subscription, Scheduled Time, Dropoff) */}
                <View style={styles.activeRideDetailsBox}>
                  {isSubscription && (
                    <View style={styles.activeRideDetailRow}>
                      <IconIonic name="repeat-outline" size={14} color={colors.accent} style={{ marginRight: 6 }} />
                      <Text style={styles.activeRideDetailText} numberOfLines={1}>
                        Subscription: <Text style={{ fontWeight: '700' }}>{subPlanType ? `${subPlanType} Plan` : 'Commute Subscription'}</Text>
                      </Text>
                    </View>
                  )}

                  {formattedScheduledTime && (
                    <View style={styles.activeRideDetailRow}>
                      <IconIonic name="time-outline" size={14} color={colors.accent} style={{ marginRight: 6 }} />
                      <Text style={styles.activeRideDetailText}>
                        Scheduled: <Text style={{ fontWeight: '700' }}>{formattedScheduledTime}</Text>
                      </Text>
                    </View>
                  )}

                  <View style={styles.activeRideDetailRow}>
                    <IconIonic name="location-outline" size={14} color={colors.dropoff} style={{ marginRight: 6 }} />
                    <Text style={styles.activeRideBannerStatus} numberOfLines={1}>
                      To: {currentRide.dropoff?.address || 'Destination'}
                    </Text>
                  </View>
                </View>

                {currentRide.type === 'carpool-subscription' && currentRide.status === 'accepted' && (
                  <TouchableOpacity
                    style={styles.reportAbsentBtn}
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
                    <IconIonic name="alert-circle-outline" size={14} color="#FF3B30" style={{ marginRight: 4 }} />
                    <Text style={{ color: '#FF3B30', fontSize: 12, fontWeight: '600' }}>Report Absent</Text>
                  </TouchableOpacity>
                )}
              </View>
            </TouchableOpacity>
          );
        })()}

        {/* Services */}
        <View style={styles.sectionContainer}>
          <Text style={styles.sectionTitle}>Services</Text>
          <View style={styles.servicesGrid}>
            {serviceOptions.map((service) => (
              <TouchableOpacity
                key={service.id}
                activeOpacity={0.8}
                style={styles.serviceCard}
                onPress={() => {
                  if (service.id === 'ride') {
                    setLocationModalVisible(true);
                  } else {
                    navigation.navigate(service.screen);
                  }
                }}
              >
                <View style={[styles.serviceIconContainer, { backgroundColor: service.bgColor }]}>
                  {getIcon(service.icon, service.iconType, 28, service.iconColor)}
                </View>
                <Text style={styles.serviceTitle}>{service.title}</Text>
                <Text style={styles.serviceDescription}>{service.description}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Recent places */}
        {recentRides.length > 0 && (
          <View style={styles.sectionContainer}>
            <Text style={styles.sectionTitle}>Recent</Text>
            <View style={styles.recentCard}>
              {recentRides.map((ride, index) => (
                <TouchableOpacity
                  key={ride._id}
                  style={[
                    styles.recentItem,
                    index < recentRides.length - 1 && styles.recentItemDivider
                  ]}
                  onPress={() => handleRecentPress(ride)}
                  activeOpacity={0.7}
                >
                  <View style={styles.recentIconContainer}>
                    <IconIonic name="time-outline" size={18} color={colors.textSecondary} />
                  </View>
                  <View style={styles.recentTextContainer}>
                    <Text style={styles.recentAddress} numberOfLines={1}>
                      {ride.dropoff?.address}
                    </Text>
                    <Text style={styles.recentSubtitle} numberOfLines={1}>
                      {ride.createdAt
                        ? new Date(ride.createdAt).toLocaleDateString('en-PK', { day: '2-digit', month: 'short' })
                        : 'Past ride'}
                    </Text>
                  </View>
                  <IconIonic name="chevron-forward" size={18} color={isDark ? '#444' : '#CCC'} />
                </TouchableOpacity>
              ))}
            </View>
          </View>
        )}
      </Animated.ScrollView>

      <SidebarMenu
        visible={sidebarVisible}
        onClose={() => setSidebarVisible(false)}
      />

      {/* Ride Booking Location Modal */}
      <Modal visible={locationModalVisible} animationType="slide" transparent={true}>
        <KeyboardAvoidingView
          style={styles.locationModalOverlay}
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        >
          <View style={styles.locationModalContent}>
            <View style={styles.locationModalHeaderRow}>
              <Text style={styles.locationModalTitle}>Plan your ride</Text>
              <TouchableOpacity onPress={() => setLocationModalVisible(false)} style={styles.closeModalBtn}>
                <IconIonic name="close" size={24} color={colors.text} />
              </TouchableOpacity>
            </View>

            <ScrollView 
              style={styles.locationCardModal}
              keyboardShouldPersistTaps="handled"
              showsVerticalScrollIndicator={false}
            >
              <View style={styles.locationHeader}>
                <Text style={styles.locationTitle}>Where to?</Text>
                <TouchableOpacity style={styles.locationAction} onPress={getCurrentLocation}>
                  {locationLoading ? (
                    <ActivityIndicator size="small" color={isDark ? '#D4A373' : '#8A6D1A'} />
                  ) : (
                    <IconIonic name="locate-outline" size={16} color={isDark ? '#D4A373' : '#8A6D1A'} />
                  )}
                  <Text style={styles.locationActionText}>Current</Text>
                </TouchableOpacity>
              </View>

              <View style={[styles.locationInputWrapper, { zIndex: 99 }]}>
                <View style={styles.locationDot}>
                  <View style={[styles.dot, { backgroundColor: colors.pickup }]} />
                  <View style={styles.dotLine} />
                </View>
                <View style={styles.locationInputContainer}>
                  <CustomPlacesAutocomplete
                    ref={pickupRef}
                    placeholder="Pickup Location"
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
                      textInputContainer: [styles.inputContainer, focusedInput === 'pickup' && styles.inputContainerFocused],
                      textInput: styles.textInput,
                      container: styles.autocompleteContainer,
                      listView: styles.autocompleteList,
                      row: styles.autocompleteRow,
                      description: styles.autocompleteDescription
                    }}
                    placeholderTextColor={colors.textSecondary}
                    renderRightButton={() => (
                      <TouchableOpacity onPress={() => openMapPicker('pickup')} style={styles.mapIconBtn}>
                        <IconIonic name="map-outline" size={20} color={colors.pickup} />
                      </TouchableOpacity>
                    )}
                  />
                </View>
              </View>

              <View style={[styles.locationInputWrapper, { zIndex: 98 }]}>
                <View style={styles.locationDot}>
                  <View style={[styles.dot, { backgroundColor: colors.dropoff }]} />
                </View>
                <View style={styles.locationInputContainer}>
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
                      textInputContainer: [styles.inputContainer, focusedInput === 'destination' && styles.inputContainerFocused],
                      textInput: styles.textInput,
                      container: styles.autocompleteContainer,
                      listView: styles.autocompleteList,
                      row: styles.autocompleteRow,
                      description: styles.autocompleteDescription
                    }}
                    placeholderTextColor={colors.textSecondary}
                    renderRightButton={() => (
                      <TouchableOpacity onPress={() => openMapPicker('destination')} style={styles.mapIconBtn}>
                        <IconIonic name="map-outline" size={20} color={colors.dropoff} />
                      </TouchableOpacity>
                    )}
                  />
                </View>
              </View>

              {recentRides.length > 0 && (
                <View style={{ marginTop: 16 }}>
                  <Text style={[styles.sectionTitle, { fontSize: 15, marginBottom: 10, paddingHorizontal: 0 }]}>Recent Destinations</Text>
                  <View style={styles.recentCard}>
                    {recentRides.map((ride, index) => (
                      <TouchableOpacity
                        key={ride._id}
                        style={[
                          styles.recentItem,
                          index < recentRides.length - 1 && styles.recentItemDivider
                        ]}
                        onPress={() => {
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
                        }}
                        activeOpacity={0.7}
                      >
                        <View style={styles.recentIconContainerModal}>
                          <IconIonic name="time-outline" size={18} color={colors.textSecondary} />
                        </View>
                        <View style={styles.recentTextContainer}>
                          <Text style={styles.recentAddress} numberOfLines={1}>
                            {ride.dropoff?.address}
                          </Text>
                          <Text style={styles.recentSubtitle} numberOfLines={1}>
                            {ride.createdAt
                              ? new Date(ride.createdAt).toLocaleDateString('en-PK', { day: '2-digit', month: 'short' })
                              : 'Past ride'}
                          </Text>
                        </View>
                        <IconIonic name="chevron-forward" size={18} color={isDark ? '#444' : '#CCC'} />
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>
              )}

            </ScrollView>

            <TouchableOpacity 
              style={[styles.modalContinueBtn, (!pickup || !destination) && styles.modalContinueBtnDisabled]} 
              onPress={handleWhereToPress}
              disabled={!pickup || !destination}
            >
              <Text style={[styles.modalContinueText, (!pickup || !destination) && styles.modalContinueTextDisabled]}>Continue</Text>
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      {/* Map Picker Modal */}
      <Modal visible={mapPickerVisible} animationType="slide">
        <View style={styles.pickerModalContainer}>
          <View style={styles.pickerModalHeader}>
            <TouchableOpacity onPress={() => setMapPickerVisible(false)} style={styles.pickerBackBtn}>
              <IconIonic name="arrow-back" size={24} color={colors.text} />
            </TouchableOpacity>
            <Text style={styles.pickerModalTitle}>Select {mapPickerType === 'pickup' ? 'Pickup' : 'Dropoff'}</Text>
            <View style={{ width: 32 }} />
          </View>
          {mapPickerCoords && (
            <MapView
              key={`${mapPickerType}-${mapPickerVisible}`}
              ref={pickerMapRef}
              style={styles.pickerMap}
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
          <View style={styles.pickerCenterPin}>
            <IconIonic name="location" size={44} color={mapPickerType === 'pickup' ? colors.pickup : colors.dropoff} />
          </View>
          <View style={styles.pickerBottomCard}>
            <Text style={styles.pickerAddressLabel}>Selected Location</Text>
            <Text style={styles.pickerAddressText}>{mapPickerAddress}</Text>
            <TouchableOpacity style={styles.pickerConfirmBtn} onPress={confirmMapPicker}>
              <Text style={styles.pickerConfirmText}>Confirm Location</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
};

const createStyles = (colors, isDark) => {
  // Per design spec: light mode uses white cards lifted by a soft shadow;
  // dark mode uses #1A1A1A cards where shadows are invisible, so border only.
  const cardBg = isDark ? colors.card : colors.background;
  const insetBg = isDark ? colors.cardElevated : colors.card;
  const softShadow = {
    shadowColor: colors.text,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: isDark ? 0 : 0.06,
    shadowRadius: 8,
    elevation: isDark ? 0 : 2,
  };

  return StyleSheet.create({
    safeArea: {
      flex: 1,
      backgroundColor: colors.background,
    },
    container: {
      flex: 1,
      backgroundColor: colors.background,
      paddingTop: Platform.OS === 'android' ? (StatusBar.currentHeight || 24) : 0,
    },
    header: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingHorizontal: 20,
      paddingTop: 16,
      paddingBottom: 24,
    },
    headerLeft: {
      flex: 1,
    },
    greeting: {
      fontSize: 14,
      color: colors.textSecondary,
    },
    userName: {
      fontSize: 24,
      fontWeight: '700',
      color: colors.text,
      marginTop: 2,
    },
    headerRight: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 10,
    },
    headerIconButton: {
      width: 42,
      height: 42,
      borderRadius: 21,
      backgroundColor: cardBg,
      borderWidth: 1,
      borderColor: colors.border,
      justifyContent: 'center',
      alignItems: 'center',
      ...softShadow,
    },
    avatarButton: {
      width: 42,
      height: 42,
      borderRadius: 21,
      backgroundColor: colors.accent,
      justifyContent: 'center',
      alignItems: 'center',
      ...softShadow,
    },
    avatarText: {
      color: colors.accentText,
      fontSize: 16,
      fontWeight: '700',
    },
    activeRideBanner: {
      backgroundColor: cardBg,
      marginHorizontal: 20,
      marginBottom: 20,
      padding: 16,
      borderRadius: 16,
      borderWidth: 1,
      borderColor: colors.accent,
      ...softShadow,
    },
    activeRideBannerMain: {
      flexDirection: 'column',
      width: '100%',
    },
    activeRideHeaderRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginBottom: 10,
    },
    activeRideDriverContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      flex: 1,
    },
    activeRideDriverPhoto: {
      width: 40,
      height: 40,
      borderRadius: 20,
      marginRight: 10,
    },
    activeRideIcon: {
      width: 38,
      height: 38,
      borderRadius: 19,
      backgroundColor: colors.accent + '15',
      justifyContent: 'center',
      alignItems: 'center',
      marginRight: 12,
    },
    activeRideBannerTitle: {
      color: colors.text,
      fontWeight: '700',
      fontSize: 15,
    },
    activeRideBannerSubtext: {
      color: colors.textSecondary,
      fontSize: 12,
      marginTop: 2,
    },
    activeRideBannerStatus: {
      color: colors.textSecondary,
      fontSize: 13,
      flex: 1,
    },
    activeRideDetailsBox: {
      backgroundColor: insetBg,
      padding: 10,
      borderRadius: 10,
      gap: 6,
    },
    activeRideDetailRow: {
      flexDirection: 'row',
      alignItems: 'center',
    },
    activeRideDetailText: {
      color: colors.text,
      fontSize: 13,
      flex: 1,
    },
    reportAbsentBtn: {
      backgroundColor: '#FF3B3015',
      paddingHorizontal: 12,
      paddingVertical: 8,
      borderRadius: 8,
      borderWidth: 1,
      borderColor: '#FF3B3050',
      marginTop: 10,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      alignSelf: 'flex-start',
    },
    locationModalOverlay: {
      flex: 1,
      justifyContent: 'flex-end',
      backgroundColor: 'rgba(0,0,0,0.5)',
    },
    locationModalContent: {
      backgroundColor: colors.background,
      borderTopLeftRadius: 24,
      borderTopRightRadius: 24,
      padding: 20,
      paddingBottom: Platform.OS === 'ios' ? 40 : 20,
      minHeight: 400,
    },
    locationModalHeaderRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 20,
    },
    locationModalTitle: {
      fontSize: 20,
      fontWeight: '700',
      color: colors.text,
    },
    closeModalBtn: {
      padding: 4,
      backgroundColor: insetBg,
      borderRadius: 20,
    },
    whereToTrigger: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      backgroundColor: cardBg,
      marginHorizontal: 20,
      marginBottom: 28,
      paddingHorizontal: 16,
      paddingVertical: 18,
      borderRadius: 16,
      borderWidth: 1,
      borderColor: isDark ? colors.border : '#FDECA6',
      shadowColor: isDark ? colors.text : '#F5A623',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: isDark ? 0 : 0.08,
      shadowRadius: 12,
      elevation: isDark ? 0 : 4,
    },
    whereToTriggerContent: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 12,
    },
    whereToTriggerText: {
      fontSize: 18,
      fontWeight: '600',
      color: colors.textSecondary,
    },
    whereToTriggerTiming: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: cardBg,
      paddingHorizontal: 12,
      paddingVertical: 6,
      borderRadius: 20,
      borderWidth: 1,
      borderColor: colors.border,
    },
    whereToTriggerTimingText: {
      fontSize: 13,
      fontWeight: '600',
      color: colors.text,
      marginRight: 4,
    },
    locationCardModal: {
      flex: 1,
    },
    locationCard: {
      backgroundColor: cardBg,
      marginHorizontal: 20,
      marginBottom: 28,
      padding: 16,
      borderRadius: 16,
      borderWidth: 1,
      borderColor: colors.border,
      shadowColor: colors.text,
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: isDark ? 0 : 0.08,
      shadowRadius: 12,
      elevation: isDark ? 0 : 3,
    },
    locationHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 16,
    },
    locationTitle: {
      fontSize: 19,
      fontWeight: '700',
      color: colors.text,
    },
    locationAction: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
      paddingHorizontal: 12,
      paddingVertical: 6,
      backgroundColor: isDark ? '#2A2211' : '#FFF7E0',
      borderRadius: 20,
    },
    locationActionText: {
      color: isDark ? '#D4A373' : '#8A6D1A',
      fontSize: 13,
      fontWeight: '600',
    },
    inputContainerFocused: {
      borderColor: '#FFC107',
      borderWidth: 1.5,
    },
    modalContinueBtn: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: '#FFC107',
      borderRadius: 14,
      paddingVertical: 16,
      marginTop: 16,
      width: '100%',
    },
    modalContinueBtnDisabled: {
      backgroundColor: isDark ? '#333' : colors.border,
    },
    modalContinueText: {
      fontSize: 16,
      color: colors.text,
      fontWeight: '700',
    },
    modalContinueTextDisabled: {
      color: isDark ? '#666' : colors.textSecondary,
    },
    recentIconContainerModal: {
      width: 36,
      height: 36,
      borderRadius: 18,
      backgroundColor: isDark ? '#222' : colors.border,
      justifyContent: 'center',
      alignItems: 'center',
      marginRight: 12,
    },
    locationInputWrapper: {
      flexDirection: 'row',
      alignItems: 'flex-start',
    },
    locationDot: {
      width: 20,
      alignItems: 'center',
      marginRight: 10,
      paddingTop: 16,
    },
    dot: {
      width: 10,
      height: 10,
      borderRadius: 5,
    },
    dotLine: {
      width: 2,
      height: 22,
      backgroundColor: colors.border,
      marginTop: 4,
    },
    locationInputContainer: {
      flex: 1,
    },
    inputContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: insetBg,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: colors.border,
      marginBottom: 10,
    },
    textInput: {
      color: colors.text,
      flex: 1,
      paddingHorizontal: 14,
      paddingVertical: 13,
      fontSize: 14,
      backgroundColor: 'transparent',
    },
    autocompleteContainer: {
      flex: 1,
      zIndex: 999,
    },
    autocompleteList: {
      backgroundColor: cardBg,
      borderRadius: 12,
      marginTop: 4,
      maxHeight: 200,
      width: '100%',
      borderWidth: 1,
      borderColor: colors.border,
      ...softShadow,
    },
    autocompleteRow: {
      paddingHorizontal: 16,
      paddingVertical: 12,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
    },
    autocompleteDescription: {
      color: colors.text,
      fontSize: 14,
    },
    mapIconBtn: {
      justifyContent: 'center',
      alignItems: 'center',
      paddingHorizontal: 14,
      height: 46,
    },
    primaryButton: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: colors.accent,
      borderRadius: 14,
      paddingVertical: 15,
      marginTop: 8,
      gap: 8,
    },
    primaryButtonText: {
      fontSize: 16,
      color: colors.accentText,
      fontWeight: '700',
    },
    sectionContainer: {
      paddingHorizontal: 20,
      marginBottom: 28,
    },
    sectionTitle: {
      fontSize: 17,
      fontWeight: '700',
      color: colors.text,
      marginBottom: 14,
    },
    servicesGrid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      justifyContent: 'space-between',
    },
    serviceCard: {
      width: '48%',
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: cardBg,
      borderRadius: 16,
      borderWidth: 1,
      borderColor: colors.border,
      paddingVertical: 16,
      paddingHorizontal: 12,
      marginBottom: 14,
      minHeight: 110,
      ...softShadow,
    },
    serviceIconContainer: {
      width: 64,
      height: 64,
      borderRadius: 32,
      backgroundColor: insetBg,
      justifyContent: 'center',
      alignItems: 'center',
      marginBottom: 10,
    },
    serviceTitle: {
      fontSize: 15,
      fontWeight: '600',
      color: colors.text,
      textAlign: 'center',
    },
    serviceDescription: {
      fontSize: 12,
      color: colors.textSecondary,
      marginTop: 2,
      textAlign: 'center',
    },
    recentCard: {
      backgroundColor: cardBg,
      borderRadius: 16,
      borderWidth: 1,
      borderColor: colors.border,
      ...softShadow,
    },
    recentItem: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: 16,
      paddingVertical: 14,
    },
    recentItemDivider: {
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
    },
    recentIconContainer: {
      width: 36,
      height: 36,
      borderRadius: 18,
      backgroundColor: insetBg,
      justifyContent: 'center',
      alignItems: 'center',
      marginRight: 12,
    },
    recentTextContainer: {
      flex: 1,
      marginRight: 8,
    },
    recentAddress: {
      fontSize: 14,
      fontWeight: '500',
      color: colors.text,
    },
    recentSubtitle: {
      fontSize: 12,
      color: colors.textSecondary,
      marginTop: 2,
    },
    pickerModalContainer: {
      flex: 1,
      backgroundColor: colors.background,
    },
    pickerModalHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      padding: 16,
      backgroundColor: colors.background,
      paddingTop: 50,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
    },
    pickerBackBtn: {
      padding: 4,
    },
    pickerModalTitle: {
      fontSize: 18,
      fontWeight: '600',
      color: colors.text,
    },
    pickerMap: {
      flex: 1,
    },
    pickerCenterPin: {
      position: 'absolute',
      top: '50%',
      left: '50%',
      marginLeft: -22,
      marginTop: -44,
      zIndex: 10,
      backgroundColor: cardBg,
      borderRadius: 28,
      padding: 4,
      ...softShadow,
    },
    pickerBottomCard: {
      backgroundColor: colors.background,
      padding: 20,
      paddingBottom: 40,
      borderTopLeftRadius: 20,
      borderTopRightRadius: 20,
      borderTopWidth: 1,
      borderTopColor: colors.border,
    },
    pickerAddressLabel: {
      color: colors.textSecondary,
      fontSize: 12,
      marginBottom: 8,
      fontWeight: '500',
    },
    pickerAddressText: {
      color: colors.text,
      fontSize: 16,
      fontWeight: '600',
      marginBottom: 20,
    },
    pickerConfirmBtn: {
      backgroundColor: colors.accent,
      padding: 16,
      borderRadius: 14,
      alignItems: 'center',
    },
    pickerConfirmText: {
      color: colors.accentText,
      fontSize: 16,
      fontWeight: '600',
    },
  });
};

export default HomeScreen;
