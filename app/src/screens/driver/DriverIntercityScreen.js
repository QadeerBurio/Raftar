import FareBreakdown, { pkr } from '../../components/common/FareBreakdown';
import React, { useState, useEffect, useMemo } from 'react';
import { useTheme } from '../../context/ThemeContext';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  ActivityIndicator,
  Alert,
  TextInput,
  RefreshControl,
  SafeAreaView,
  StatusBar,
  Platform,
  Dimensions,
  Modal,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import IconIonic from 'react-native-vector-icons/Ionicons';
import IconMC from 'react-native-vector-icons/MaterialCommunityIcons';
import { LinearGradient } from 'expo-linear-gradient';
import api from '../../services/api';
import { useDispatch } from 'react-redux';
import { useSocket } from '../../context/SocketContext';
import { counterOffer } from '../../redux/slices/driverSlice';

const { width } = Dimensions.get('window');

// Yellow Theme Colors
const getThemePalette = (colors, isDark) => ({
  YELLOW_PRIMARY: colors.accent,
  YELLOW_SECONDARY: colors.accent,
  WHITE: isDark ? colors.card : '#FFFFFF',
  BLACK: colors.text,
  GRAY_DARK: colors.text,
  GRAY_MEDIUM: colors.textSecondary,
  GRAY_LIGHT: isDark ? colors.cardElevated : '#F5F5F5',
  GRAY_BG: colors.background,
});

const DriverIntercityScreen = () => {
  const { colors, isDark } = useTheme();
  const { YELLOW_PRIMARY, YELLOW_SECONDARY, WHITE, BLACK, GRAY_DARK, GRAY_MEDIUM, GRAY_LIGHT, GRAY_BG } = useMemo(() => getThemePalette(colors, isDark), [colors, isDark]);
  const styles = useMemo(() => createStyles(colors, isDark), [colors, isDark]);
  const navigation = useNavigation();
  const dispatch = useDispatch();
  const socket = useSocket();

  const [viewMode, setViewMode] = useState('mode_select');
  const [activeTab, setActiveTab] = useState('available');
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [availableRequests, setAvailableRequests] = useState([]);
  const [myUpcomingRides, setMyUpcomingRides] = useState([]);
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [showCounterOffer, setShowCounterOffer] = useState(false);
  const [counterAmount, setCounterAmount] = useState('');

  useEffect(() => {
    if (viewMode === 'private') {
      fetchData();
    }

    if (socket && viewMode === 'private') {
      const handleNewRide = () => {
        if (activeTab === 'available') fetchData();
      };
      socket.on('new-ride-request', handleNewRide);
      return () => socket.off('new-ride-request', handleNewRide);
    }
  }, [activeTab, viewMode]);

  const fetchData = async () => {
    setLoading(true);
    try {
      if (activeTab === 'available') {
        const response = await api.get('/drivers/ride-requests?type=intercity');
        if (response.data?.success) {
          setAvailableRequests(response.data.rides);
        }
      } else {
        const response = await api.get('/rides/active');
        if (response.data?.success) {
          const active = response.data.rides.filter(r => r.type === 'intercity' && (r.status === 'accepted' || r.status === 'started'));
          setMyUpcomingRides(active);
        }
      }
    } catch (error) {
      console.error('Fetch intercity error:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchData();
  };

  const handleCounterOffer = async (rideId) => {
    if (!counterAmount || parseFloat(counterAmount) <= 0) {
      Alert.alert('Error', 'Please enter a valid amount');
      return;
    }
    try {
      const quotedOffer=await dispatch(counterOffer({ rideId, amount: parseFloat(counterAmount) })).unwrap();
      if(quotedOffer.breakdown)Alert.alert('Offer totals','Passenger total: '+pkr(quotedOffer.breakdown.passengerTotalPaisa)+'; expected driver earnings: '+pkr(quotedOffer.breakdown.driverEntitlementPaisa));
      if (socket) {
        socket.emit('join-ride', rideId);
      }
      Alert.alert('Offer Sent', 'Waiting for passenger to accept your offer');
      setShowCounterOffer(false);
      setCounterAmount('');
      fetchData();
    } catch (error) {
      Alert.alert('Error', error.message || 'Failed to send counter offer');
    }
  };

  const handleAccept = (item) => {
    Alert.alert(
      'Accept Ride',
      'Are you sure you want to accept this intercity ride?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Accept',
          onPress: async () => {
            try {
              if(item.pricing?.pricingMode==='UPFRONT'){
                const result=await api.put('/rides/'+item._id+'/accept');
                navigation.navigate('ActiveRide',{ride:result.data.ride});return;
              }
              const amount = item.fare?.offered || item.fare?.accepted || 0;
              await dispatch(counterOffer({ rideId: item._id, amount })).unwrap();
              if (socket) {
                socket.emit('join-ride', item._id);
              }
              Alert.alert('Offer Sent', 'Waiting for passenger to accept');
              fetchData();
            } catch (error) {
              Alert.alert('Error', error.message || 'Failed to accept');
            }
          }
        }
      ]
    );
  };

  const formatDistance = (distance) => {
    if (!distance) return '';
    return distance < 1 ? `${(distance * 1000).toFixed(0)} m` : `${distance.toFixed(1)} km`;
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'accepted': return '#4ECDC4';
      case 'started': return YELLOW_PRIMARY;
      case 'completed': return '#45B7D1';
      default: return GRAY_MEDIUM;
    }
  };

  const getStatusLabel = (status) => {
    switch (status) {
      case 'accepted': return 'Accepted';
      case 'started': return 'In Progress';
      case 'completed': return 'Completed';
      default: return status;
    }
  };

  const renderAvailableRequest = ({ item }) => (
    <View style={styles.requestCard}>
      <View style={styles.requestHeader}>
        <View style={styles.riderInfo}>
          <View style={styles.avatarContainer}>
            <LinearGradient
              colors={[YELLOW_PRIMARY, YELLOW_SECONDARY]}
              style={styles.avatarGradient}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
            >
              <Text style={styles.avatarText}>
                {item.passengerId?.name?.charAt(0) || '?'}
              </Text>
            </LinearGradient>
            <View style={styles.onlineDot} />
          </View>
          <View>
            <Text style={styles.riderName}>{item.passengerId?.name || 'Unknown'}</Text>
            <View style={styles.riderMeta}>
              <Icon name="star" size={12} color={YELLOW_PRIMARY} />
              <Text style={styles.riderRating}>{item.passengerId?.stats?.rating || 0}</Text>
              <View style={styles.metaDot} />
              <Icon name="schedule" size={12} color={GRAY_MEDIUM} />
              <Text style={styles.riderTime}>
                {item.scheduledTime ? new Date(item.scheduledTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Now'}
              </Text>
            </View>
          </View>
        </View>
        <View style={styles.distanceBadge}>
          <IconMC name="map-marker-distance" size={12} color={YELLOW_PRIMARY} />
          <Text style={styles.distanceText}>{formatDistance(item.distance)}</Text>
        </View>
      </View>

      {item.scheduledTime && (
        <View style={styles.scheduledBadge}>
          <Icon name="event" size={14} color={YELLOW_PRIMARY} />
          <Text style={styles.scheduledText}>
            Scheduled: {new Date(item.scheduledTime).toLocaleString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
          </Text>
        </View>
      )}

      <View style={styles.routeInfo}>
        <View style={styles.routePoint}>
          <View style={styles.routeIconGreen}>
            <Icon name="my-location" size={12} color={WHITE} />
          </View>
          <Text style={styles.routeText} numberOfLines={1}>{item.pickup?.address || 'Pickup location'}</Text>
        </View>
        <View style={styles.routeConnector}>
          <View style={styles.routeLine} />
          <View style={styles.routeDot} />
        </View>
        <View style={styles.routePoint}>
          <View style={styles.routeIconRed}>
            <Icon name="location-on" size={12} color={WHITE} />
          </View>
          <Text style={styles.routeText} numberOfLines={1}>{item.dropoff?.address || 'Dropoff location'}</Text>
        </View>
      </View>

      {item.pricing && <FareBreakdown receipt={item.receipt} pricing={item.pricing} driver />}
      <View style={styles.requestFooter}>
        <View style={styles.fareInfo}>
          <Text style={styles.fareLabel}>Estimated Fare</Text>
          <Text style={styles.fareAmount}>Rs. {item.fare?.offered || item.fare?.accepted || 0}</Text>
        </View>
        <View style={styles.vehicleInfo}>
          <IconMC name="car" size={16} color={GRAY_MEDIUM} />
          <Text style={styles.vehicleText}>{item.vehicleType || 'Economy'}</Text>
        </View>
      </View>

      <View style={styles.actionButtons}>
        <TouchableOpacity 
          style={[styles.actionBtn, styles.declineBtn]}
          onPress={() => {}}
        >
          <Text style={styles.declineBtnText}>Decline</Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={[styles.actionBtn, styles.counterBtn]}
          onPress={() => { setSelectedRequest(item); setShowCounterOffer(true); }}
        >
          <Icon name="trending-up" size={16} color={YELLOW_PRIMARY} />
          <Text style={styles.counterBtnText}>Counter</Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={[styles.actionBtn, styles.acceptBtn]}
          onPress={() => handleAccept(item)}
        >
          <LinearGradient
            colors={[YELLOW_PRIMARY, YELLOW_SECONDARY]}
            style={styles.acceptGradient}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
          >
            <Icon name="check" size={16} color={WHITE} />
            <Text style={styles.acceptBtnText}>Accept</Text>
          </LinearGradient>
        </TouchableOpacity>
      </View>
    </View>
  );

  const renderUpcomingRide = ({ item }) => (
    <View style={styles.upcomingCard}>
      <TouchableOpacity 
        style={styles.upcomingCardContent}
        onPress={() => navigation.navigate('ActiveRide', { ride: item })}
        activeOpacity={0.7}
      >
        <View style={styles.upcomingHeader}>
          <View style={styles.upcomingDate}>
            <Icon name="event" size={16} color={YELLOW_PRIMARY} />
            <Text style={styles.upcomingDateText}>
              {item.scheduledTime ? 
                new Date(item.scheduledTime).toLocaleString([], { 
                  month: 'short', 
                  day: 'numeric', 
                  hour: '2-digit', 
                  minute: '2-digit' 
                }) : 'No Date'}
            </Text>
          </View>
          <View style={[styles.upcomingStatus, { backgroundColor: getStatusColor(item.status) + '15' }]}>
            <View style={[styles.upcomingStatusDot, { backgroundColor: getStatusColor(item.status) }]} />
            <Text style={[styles.upcomingStatusText, { color: getStatusColor(item.status) }]}>
              {getStatusLabel(item.status)}
            </Text>
          </View>
        </View>

        <View style={styles.upcomingRoute}>
          <View style={styles.upcomingRoutePoint}>
            <View style={styles.upcomingRouteIconGreen}>
              <Icon name="my-location" size={10} color={WHITE} />
            </View>
            <Text style={styles.upcomingRouteText} numberOfLines={1}>
              {item.pickup?.address || 'Pickup'}
            </Text>
          </View>
          <View style={styles.upcomingRouteConnector}>
            <View style={styles.upcomingRouteLine} />
          </View>
          <View style={styles.upcomingRoutePoint}>
            <View style={styles.upcomingRouteIconRed}>
              <Icon name="location-on" size={10} color={WHITE} />
            </View>
            <Text style={styles.upcomingRouteText} numberOfLines={1}>
              {item.dropoff?.address || 'Dropoff'}
            </Text>
          </View>
        </View>

        <View style={styles.upcomingFooter}>
          <View style={styles.upcomingPassenger}>
            <View style={styles.upcomingAvatarSmall}>
              <Text style={styles.upcomingAvatarText}>
                {item.passengerId?.name?.charAt(0) || '?'}
              </Text>
            </View>
            <Text style={styles.upcomingPassengerName}>
              {item.passengerId?.name || 'Unknown'}
            </Text>
          </View>
          <Text style={styles.upcomingFare}>
            Rs. {item.fare?.accepted || item.fare?.offered || 0}
          </Text>
        </View>
      </TouchableOpacity>
    </View>
  );

  const renderModeSelect = () => (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle={colors.statusBarStyle} backgroundColor={WHITE} />
      
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => navigation.goBack()}
            activeOpacity={0.7}
          >
            <IconIonic 
              name={Platform.OS === 'ios' ? 'chevron-back' : 'arrow-back'} 
              size={24} 
              color={BLACK} 
            />
          </TouchableOpacity>
          <View style={styles.headerTitleContainer}>
            <Text style={styles.headerTitle}>Intercity</Text>
            <Text style={styles.headerSubtitle}>Choose your service mode</Text>
          </View>
          <View style={styles.headerRightPlaceholder} />
        </View>

        <View style={styles.modeContainer}>
          <View style={styles.modeCard}>
            <TouchableOpacity 
              style={styles.modeCardContent}
              onPress={() => setViewMode('private')}
              activeOpacity={0.8}
            >
              <View style={styles.modeCardInner}>
                <View style={styles.modeIconContainer}>
                  <LinearGradient
                    colors={[YELLOW_PRIMARY, YELLOW_SECONDARY]}
                    style={styles.modeIconGradient}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                  >
                    <Icon name="directions-car" size={32} color={WHITE} />
                  </LinearGradient>
                </View>
                <Text style={styles.modeTitle}>Private Ride</Text>
                <Text style={styles.modeDescription}>
                  Accept private intercity ride requests from passengers
                </Text>
                <View style={styles.modeArrow}>
                  <Icon name="chevron-right" size={24} color={YELLOW_PRIMARY} />
                </View>
              </View>
            </TouchableOpacity>
          </View>

          <View style={styles.modeCard}>
            <TouchableOpacity 
              style={styles.modeCardContent}
              onPress={() => navigation.navigate('ManageCarpools', { isIntercity: true })}
              activeOpacity={0.8}
            >
              <View style={styles.modeCardInner}>
                <View style={styles.modeIconContainer}>
                  <LinearGradient
                    colors={['#4ECDC4', '#44B39D']}
                    style={[styles.modeIconGradient, { backgroundColor: '#4ECDC4' }]}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                  >
                    <Icon name="people" size={32} color={WHITE} />
                  </LinearGradient>
                </View>
                <Text style={styles.modeTitle}>Carpool</Text>
                <Text style={styles.modeDescription}>
                  Offer shared seats to passengers traveling the same route
                </Text>
                <View style={styles.modeArrow}>
                  <Icon name="chevron-right" size={24} color="#4ECDC4" />
                </View>
              </View>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </SafeAreaView>
  );

  const renderPrivateList = () => (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle={colors.statusBarStyle} backgroundColor={WHITE} />
      
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => setViewMode('mode_select')}
            activeOpacity={0.7}
          >
            <IconIonic 
              name={Platform.OS === 'ios' ? 'chevron-back' : 'arrow-back'} 
              size={24} 
              color={BLACK} 
            />
          </TouchableOpacity>
          <View style={styles.headerTitleContainer}>
            <Text style={styles.headerTitle}>Private Intercity</Text>
            <Text style={styles.headerSubtitle}>
              {activeTab === 'available' ? availableRequests.length : myUpcomingRides.length} rides
            </Text>
          </View>
          <TouchableOpacity style={styles.refreshButton} onPress={onRefresh}>
            <Icon name="refresh" size={22} color={GRAY_DARK} />
          </TouchableOpacity>
        </View>

        <View style={styles.tabContainer}>
          <TouchableOpacity 
            style={[styles.tab, activeTab === 'available' && styles.activeTab]} 
            onPress={() => setActiveTab('available')}
            activeOpacity={0.7}
          >
            <View style={styles.tabContent}>
              <IconMC name="clock-time-four" size={16} color={activeTab === 'available' ? YELLOW_PRIMARY : GRAY_MEDIUM} />
              <Text style={[styles.tabText, activeTab === 'available' && styles.activeTabText]}>
                Available
              </Text>
              {availableRequests.length > 0 && (
                <View style={styles.tabBadge}>
                  <Text style={styles.tabBadgeText}>{availableRequests.length}</Text>
                </View>
              )}
            </View>
          </TouchableOpacity>
          <TouchableOpacity 
            style={[styles.tab, activeTab === 'upcoming' && styles.activeTab]} 
            onPress={() => setActiveTab('upcoming')}
            activeOpacity={0.7}
          >
            <View style={styles.tabContent}>
              <IconMC name="calendar-clock" size={16} color={activeTab === 'upcoming' ? YELLOW_PRIMARY : GRAY_MEDIUM} />
              <Text style={[styles.tabText, activeTab === 'upcoming' && styles.activeTabText]}>
                Upcoming
              </Text>
            </View>
          </TouchableOpacity>
        </View>

        {loading && !refreshing ? (
          <View style={styles.center}>
            <ActivityIndicator size="large" color={YELLOW_PRIMARY} />
            <Text style={styles.loadingText}>Loading rides...</Text>
          </View>
        ) : (
          <FlatList
            data={activeTab === 'available' ? availableRequests : myUpcomingRides}
            renderItem={activeTab === 'available' ? renderAvailableRequest : renderUpcomingRide}
            keyExtractor={item => item._id}
            contentContainerStyle={styles.listContent}
            ListEmptyComponent={
              <View style={styles.emptyContainer}>
                <View style={styles.emptyIconContainer}>
                  <IconMC name="car-search" size={48} color={GRAY_LIGHT} />
                </View>
                <Text style={styles.emptyTitle}>
                  {activeTab === 'available' ? 'No Requests Available' : 'No Upcoming Rides'}
                </Text>
                <Text style={styles.emptyText}>
                  {activeTab === 'available' 
                    ? 'There are no intercity ride requests at the moment.' 
                    : 'You have no upcoming intercity rides.'}
                </Text>
              </View>
            }
            refreshControl={
              <RefreshControl 
                refreshing={refreshing} 
                onRefresh={onRefresh} 
                tintColor={YELLOW_PRIMARY}
                colors={[YELLOW_PRIMARY]}
              />
            }
            showsVerticalScrollIndicator={false}
          />
        )}

        {/* Counter Offer Modal */}
        <Modal
          animationType="slide"
          transparent={true}
          visible={showCounterOffer}
          onRequestClose={() => {
            setShowCounterOffer(false);
            setCounterAmount('');
          }}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <View style={styles.modalHandle} />
              
              <Text style={styles.modalTitle}>Counter Offer</Text>
              <Text style={styles.modalSubtitle}>
                Original fare: Rs. {selectedRequest?.fare?.offered || selectedRequest?.fare?.accepted || 0}
              </Text>
              
              <View style={styles.modalInputContainer}>
                <Text style={styles.modalInputLabel}>Your Offer Amount</Text>
                <View style={styles.modalInputWrapper}>
                  <Text style={styles.modalCurrencySymbol}>Rs.</Text>
                  <TextInput
                    style={styles.modalInputField}
                    value={counterAmount}
                    onChangeText={setCounterAmount}
                    placeholder="Enter amount"
                    placeholderTextColor={GRAY_MEDIUM}
                    keyboardType="numeric"
                    autoFocus
                  />
                </View>
              </View>

              <View style={styles.modalButtons}>
                <TouchableOpacity
                  style={styles.modalCancelButton}
                  onPress={() => {
                    setShowCounterOffer(false);
                    setCounterAmount('');
                  }}
                >
                  <Text style={styles.modalCancelText}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.modalSendButton}
                  onPress={() => handleCounterOffer(selectedRequest?._id)}
                >
                  <LinearGradient
                    colors={[YELLOW_PRIMARY, YELLOW_SECONDARY]}
                    style={styles.modalSendGradient}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                  >
                    <Text style={styles.modalSendText}>Send Offer</Text>
                  </LinearGradient>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>
      </View>
    </SafeAreaView>
  );

  return viewMode === 'mode_select' ? renderModeSelect() : renderPrivateList();
};

const createStyles = (colors, isDark) => {
  const { YELLOW_PRIMARY, YELLOW_SECONDARY, WHITE, BLACK, GRAY_DARK, GRAY_MEDIUM, GRAY_LIGHT, GRAY_BG } = getThemePalette(colors, isDark);
  const cardBg = isDark ? colors.card : '#FFFFFF';
  const insetBg = isDark ? colors.cardElevated : '#F5F5F5';
  return StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: WHITE,
  },
  container: {
    flex: 1,
    backgroundColor: GRAY_BG,
    marginTop:23
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: Platform.OS === 'ios' ? 8 : 12,
    paddingBottom: 16,
    backgroundColor: WHITE,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 4,
  },
  headerTitleContainer: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: BLACK,
  },
  headerSubtitle: {
    fontSize: 13,
    color: GRAY_MEDIUM,
    marginTop: 1,
  },
  headerRightPlaceholder: {
    width: 40,
  },
  refreshButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: GRAY_LIGHT,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modeContainer: {
    padding: 16,
    paddingTop: 20,
    flex: 1,
  },
  modeCard: {
    marginBottom: 16,
    borderRadius: 16,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: WHITE,
    shadowColor: BLACK,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
  },
  modeCardContent: {
    overflow: 'hidden',
  },
  modeCardInner: {
    padding: 24,
  },
  modeIconContainer: {
    marginBottom: 16,
  },
  modeIconGradient: {
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modeTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: BLACK,
    marginBottom: 6,
  },
  modeDescription: {
    fontSize: 14,
    color: GRAY_MEDIUM,
    lineHeight: 20,
  },
  modeArrow: {
    marginTop: 16,
    alignSelf: 'flex-start',
  },
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: WHITE,
    paddingHorizontal: 16,
    paddingVertical: 4,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  tab: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  activeTab: {
    borderBottomColor: YELLOW_PRIMARY,
  },
  tabContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  tabText: {
    fontSize: 14,
    fontWeight: '500',
    color: GRAY_MEDIUM,
  },
  activeTabText: {
    color: YELLOW_PRIMARY,
    fontWeight: '600',
  },
  tabBadge: {
    backgroundColor: YELLOW_PRIMARY,
    borderRadius: 10,
    paddingHorizontal: 6,
    paddingVertical: 1,
    minWidth: 18,
    alignItems: 'center',
  },
  tabBadgeText: {
    color: WHITE,
    fontSize: 10,
    fontWeight: '600',
  },
  requestCard: {
    backgroundColor: WHITE,
    marginHorizontal: 16,
    marginBottom: 16,
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.border,
    shadowColor: BLACK,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
  },
  requestHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  riderInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  avatarContainer: {
    position: 'relative',
    marginRight: 12,
  },
  avatarGradient: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    color: WHITE,
    fontSize: 18,
    fontWeight: '700',
  },
  onlineDot: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#4ECDC4',
    borderWidth: 2,
    borderColor: WHITE,
  },
  riderName: {
    fontSize: 16,
    fontWeight: '600',
    color: BLACK,
  },
  riderMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 2,
    gap: 4,
  },
  riderRating: {
    fontSize: 13,
    color: GRAY_MEDIUM,
  },
  metaDot: {
    width: 3,
    height: 3,
    borderRadius: 1.5,
    backgroundColor: GRAY_MEDIUM,
    marginHorizontal: 2,
  },
  riderTime: {
    fontSize: 12,
    color: GRAY_MEDIUM,
  },
  distanceBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: GRAY_LIGHT,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 4,
  },
  distanceText: {
    fontSize: 12,
    color: GRAY_DARK,
    fontWeight: '500',
  },
  scheduledBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: YELLOW_PRIMARY + '10',
    padding: 8,
    borderRadius: 8,
    marginBottom: 12,
    gap: 6,
  },
  scheduledText: {
    fontSize: 13,
    color: YELLOW_PRIMARY,
    fontWeight: '500',
  },
  routeInfo: {
    marginBottom: 12,
  },
  routePoint: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  routeIconGreen: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#4ECDC4',
    justifyContent: 'center',
    alignItems: 'center',
  },
  routeIconRed: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#FF6B6B',
    justifyContent: 'center',
    alignItems: 'center',
  },
  routeText: {
    fontSize: 14,
    color: GRAY_DARK,
    flex: 1,
  },
  routeConnector: {
    alignItems: 'center',
    marginLeft: 11,
    paddingVertical: 2,
  },
  routeLine: {
    width: 2,
    height: 12,
    backgroundColor: '#E0E0E0',
  },
  routeDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#E0E0E0',
    marginTop: 2,
  },
  requestFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    marginBottom: 12,
  },
  fareInfo: {},
  fareLabel: {
    fontSize: 12,
    color: GRAY_MEDIUM,
  },
  fareAmount: {
    fontSize: 18,
    fontWeight: '700',
    color: YELLOW_PRIMARY,
    marginTop: 2,
  },
  vehicleInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: GRAY_LIGHT,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  vehicleText: {
    fontSize: 12,
    color: GRAY_MEDIUM,
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 8,
  },
  actionBtn: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 4,
  },
  declineBtn: {
    backgroundColor: GRAY_LIGHT,
  },
  declineBtnText: {
    fontSize: 14,
    fontWeight: '500',
    color: GRAY_MEDIUM,
  },
  counterBtn: {
    backgroundColor: GRAY_LIGHT,
    borderWidth: 1,
    borderColor: YELLOW_PRIMARY,
  },
  counterBtnText: {
    fontSize: 14,
    fontWeight: '500',
    color: YELLOW_PRIMARY,
  },
  acceptBtn: {
    flex: 1.5,
    overflow: 'hidden',
    padding: 0,
  },
  acceptGradient: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    gap: 4,
  },
  acceptBtnText: {
    fontSize: 14,
    fontWeight: '600',
    color: WHITE,
  },
  upcomingCard: {
    marginHorizontal: 16,
    marginBottom: 16,
  },
  upcomingCardContent: {
    backgroundColor: WHITE,
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.border,
    shadowColor: BLACK,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
  },
  upcomingHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  upcomingDate: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  upcomingDateText: {
    fontSize: 14,
    fontWeight: '500',
    color: GRAY_DARK,
  },
  upcomingStatus: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 4,
  },
  upcomingStatusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  upcomingStatusText: {
    fontSize: 11,
    fontWeight: '600',
  },
  upcomingRoute: {
    marginBottom: 12,
  },
  upcomingRoutePoint: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  upcomingRouteIconGreen: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#4ECDC4',
    justifyContent: 'center',
    alignItems: 'center',
  },
  upcomingRouteIconRed: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#FF6B6B',
    justifyContent: 'center',
    alignItems: 'center',
  },
  upcomingRouteText: {
    fontSize: 13,
    color: GRAY_DARK,
    flex: 1,
  },
  upcomingRouteConnector: {
    alignItems: 'center',
    marginLeft: 9,
    paddingVertical: 2,
  },
  upcomingRouteLine: {
    width: 2,
    height: 10,
    backgroundColor: '#E0E0E0',
  },
  upcomingFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  upcomingPassenger: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  upcomingAvatarSmall: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: YELLOW_PRIMARY,
    justifyContent: 'center',
    alignItems: 'center',
  },
  upcomingAvatarText: {
    color: WHITE,
    fontSize: 12,
    fontWeight: '600',
  },
  upcomingPassengerName: {
    fontSize: 13,
    color: GRAY_DARK,
    fontWeight: '500',
  },
  upcomingFare: {
    fontSize: 16,
    fontWeight: '700',
    color: YELLOW_PRIMARY,
  },
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: 60,
    paddingHorizontal: 40,
  },
  emptyIconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: GRAY_LIGHT,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: BLACK,
  },
  emptyText: {
    fontSize: 14,
    color: GRAY_MEDIUM,
    textAlign: 'center',
    marginTop: 8,
    lineHeight: 20,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: WHITE,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
    paddingBottom: Platform.OS === 'ios' ? 40 : 24,
  },
  modalHandle: {
    width: 40,
    height: 4,
    backgroundColor: '#E0E0E0',
    borderRadius: 2,
    alignSelf: 'center',
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: BLACK,
    marginBottom: 4,
  },
  modalSubtitle: {
    fontSize: 14,
    color: GRAY_MEDIUM,
    marginBottom: 20,
  },
  modalInputContainer: {
    marginBottom: 24,
  },
  modalInputLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: BLACK,
    marginBottom: 8,
  },
  modalInputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: GRAY_LIGHT,
    borderRadius: 12,
    paddingHorizontal: 16,
  },
  modalCurrencySymbol: {
    fontSize: 18,
    fontWeight: '600',
    color: GRAY_DARK,
    marginRight: 8,
  },
  modalInputField: {
    flex: 1,
    fontSize: 18,
    fontWeight: '600',
    color: BLACK,
    paddingVertical: 14,
  },
  modalButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  modalCancelButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalCancelText: {
    fontSize: 16,
    fontWeight: '500',
    color: GRAY_MEDIUM,
  },
  modalSendButton: {
    flex: 2,
    borderRadius: 12,
    overflow: 'hidden',
  },
  modalSendGradient: {
    paddingVertical: 14,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalSendText: {
    fontSize: 16,
    fontWeight: '600',
    color: WHITE,
  },
  listContent: {
    paddingBottom: 100,
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    color: GRAY_MEDIUM,
    fontSize: 14,
    marginTop: 12,
    fontWeight: '500',
  },
  });
};

export default DriverIntercityScreen;