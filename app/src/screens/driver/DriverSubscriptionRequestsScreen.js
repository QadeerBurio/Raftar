import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useTheme } from '../../context/ThemeContext';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  ActivityIndicator,
  Alert,
  SafeAreaView,
  StatusBar,
  ScrollView,
  Linking,
  Modal
} from 'react-native';
import { useNavigation, useFocusEffect, useRoute } from '@react-navigation/native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import IconIonic from 'react-native-vector-icons/Ionicons';
import IconMC from 'react-native-vector-icons/MaterialCommunityIcons';
import { LinearGradient } from 'expo-linear-gradient';
import api from '../../services/api';
import CarpoolMapPreview from '../../components/common/CarpoolMapPreview';

const DAYS_MAP = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

const DriverSubscriptionRequestsScreen = () => {
  const { colors, isDark } = useTheme();
  const styles = useMemo(() => createStyles(colors, isDark), [colors, isDark]);
  const navigation = useNavigation();
  const route = useRoute();

  // Active Segment: 'AVAILABLE' or 'ACCEPTED'
  const initialTab = route.params?.initialTab || 'AVAILABLE';
  const [activeTab, setActiveTab] = useState(initialTab);

  const [availableRequests, setAvailableRequests] = useState([]);
  const [acceptedSubscriptions, setAcceptedSubscriptions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [acceptingId, setAcceptingId] = useState(null);

  const [selectedSub, setSelectedSub] = useState(null);
  const [modalVisible, setModalVisible] = useState(false);

  const fetchAllData = async () => {
    try {
      const [availRes, acceptedRes] = await Promise.all([
        api.get('/subscriptions'),
        api.get('/subscriptions/driver')
      ]);

      if (availRes.data?.success) {
        setAvailableRequests(availRes.data.subscriptions || []);
      }
      if (acceptedRes.data?.success) {
        setAcceptedSubscriptions(acceptedRes.data.subscriptions || []);
      }
    } catch (error) {
      console.error('Fetch driver subscriptions error:', error);
      Alert.alert('Error', 'Failed to load subscriptions data');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      fetchAllData();
    }, [])
  );

  const onRefresh = () => {
    setRefreshing(true);
    fetchAllData();
  };

  const handleAcceptRequest = async (subscription) => {
    setAcceptingId(subscription._id);
    try {
      const res = await api.post(`/subscriptions/${subscription._id}/accept`);
      if (res.data?.success) {
        Alert.alert(
          'Subscription Accepted! 🎉',
          `You have accepted ${subscription.passengerId?.name || 'the passenger'}'s ${subscription.planType?.toLowerCase() || 'monthly'} subscription.`,
          [
            {
              text: 'View My Subscriptions',
              onPress: () => {
                fetchAllData();
                setActiveTab('ACCEPTED');
              }
            }
          ]
        );
      }
    } catch (error) {
      console.error('Accept subscription error:', error);
      Alert.alert('Error', error.response?.data?.error || 'Failed to accept subscription');
    } finally {
      setAcceptingId(null);
    }
  };

  const handleCallPassenger = (phoneNumber) => {
    if (!phoneNumber) return;
    Linking.openURL(`tel:${phoneNumber}`).catch(() => {
      Alert.alert('Error', 'Unable to place phone call');
    });
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'ACTIVE':
        return { label: 'Active', bg: isDark ? '#063B28' : '#E6F4EA', text: '#10B981' };
      case 'COMPLETED':
        return { label: 'Completed', bg: isDark ? '#102A45' : '#EBF5FF', text: '#3B82F6' };
      case 'TERMINATED_AUTO':
      case 'CANCELLED':
        return { label: 'Terminated', bg: isDark ? '#3B1219' : '#FDE8E8', text: '#EF4444' };
      default:
        return { label: status, bg: colors.cardElevated, text: colors.textSecondary };
    }
  };

  const renderAvailableCard = ({ item }) => {
    const pickup = {
      address: item.commuteDetails?.pickupLocation?.address || 'Pickup Location',
      location: {
        type: 'Point',
        coordinates: [
          item.commuteDetails?.pickupLocation?.lng || 73.0479,
          item.commuteDetails?.pickupLocation?.lat || 33.6844
        ]
      }
    };
    const dropoff = {
      address: item.commuteDetails?.dropoffLocation?.address || 'Dropoff Location',
      location: {
        type: 'Point',
        coordinates: [
          item.commuteDetails?.dropoffLocation?.lng || 73.0479,
          item.commuteDetails?.dropoffLocation?.lat || 33.6844
        ]
      }
    };

    const planTypeStr = item.planType || 'MONTHLY';
    const vehicleStr = (item.vehicleType || 'car').toUpperCase().replace('_', ' ');
    const totalRides = item.financials?.totalRides || 0;
    const passengersCount = item.commuteDetails?.passengersCount || 1;
    const activeDays = (item.commuteDetails?.daysOfWeek || [1, 2, 3, 4, 5])
      .map(d => DAYS_MAP[d])
      .join(', ');

    return (
      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <View style={styles.passengerInfo}>
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>{(item.passengerId?.name || 'P').charAt(0)}</Text>
            </View>
            <View>
              <Text style={styles.passengerName}>{item.passengerId?.name || 'Passenger'}</Text>
              <Text style={styles.passengerRating}>⭐ {item.passengerId?.rating || '4.8'} rating</Text>
            </View>
          </View>
          <View style={styles.badgeRow}>
            <Text style={styles.vehicleBadge}>{vehicleStr}</Text>
            <Text style={styles.passengersBadge}>{passengersCount} Seat{passengersCount > 1 ? 's' : ''}</Text>
          </View>
        </View>

        {/* Route Info */}
        <View style={styles.routeContainer}>
          <View style={styles.routeLine}>
            <View style={[styles.dot, { backgroundColor: colors.pickup }]} />
            <View style={styles.line} />
            <View style={[styles.dot, { backgroundColor: colors.dropoff }]} />
          </View>
          <View style={styles.addressWrapper}>
            <Text style={styles.addressText} numberOfLines={1}>{pickup.address}</Text>
            <Text style={[styles.addressText, { marginTop: 10 }]} numberOfLines={1}>{dropoff.address}</Text>
          </View>
        </View>

        <CarpoolMapPreview pickup={pickup} dropoff={dropoff} style={styles.mapPreview} />

        {/* Schedule */}
        <View style={styles.scheduleBox}>
          <View style={styles.scheduleItem}>
            <IconIonic name="time-outline" size={14} color={colors.accent} />
            <Text style={styles.scheduleText}>
              Morning: {item.commuteDetails?.morningTime} | Evening: {item.commuteDetails?.eveningTime}
            </Text>
          </View>
          <View style={[styles.scheduleItem, { marginTop: 4 }]}>
            <IconIonic name="calendar-outline" size={14} color={colors.textSecondary} />
            <Text style={styles.scheduleTextSub}>{activeDays} ({totalRides} total rides)</Text>
          </View>
        </View>

        <View style={styles.cardFooter}>
          <View>
            <Text style={styles.priceLabel}>Earnings ({planTypeStr.toLowerCase()})</Text>
            <Text style={styles.priceValue}>Rs. {item.financials?.totalPrice?.toLocaleString()}</Text>
          </View>
          <TouchableOpacity
            style={styles.acceptButton}
            onPress={() => handleAcceptRequest(item)}
            disabled={acceptingId === item._id}
          >
            {acceptingId === item._id ? (
              <ActivityIndicator size="small" color="#FFF" />
            ) : (
              <LinearGradient
                colors={['#8E24AA', '#AB47BC']}
                style={styles.acceptGradient}
              >
                <Text style={styles.acceptText}>Accept Plan</Text>
              </LinearGradient>
            )}
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  const renderAcceptedCard = ({ item }) => {
    const pickup = {
      address: item.commuteDetails?.pickupLocation?.address || 'Pickup Location',
      location: {
        type: 'Point',
        coordinates: [
          item.commuteDetails?.pickupLocation?.lng || 73.0479,
          item.commuteDetails?.pickupLocation?.lat || 33.6844
        ]
      }
    };
    const dropoff = {
      address: item.commuteDetails?.dropoffLocation?.address || 'Dropoff Location',
      location: {
        type: 'Point',
        coordinates: [
          item.commuteDetails?.dropoffLocation?.lng || 73.0479,
          item.commuteDetails?.dropoffLocation?.lat || 33.6844
        ]
      }
    };

    const badge = getStatusBadge(item.status);
    const completedRides = item.tracking?.completedRides || 0;
    const totalRides = item.financials?.totalRides || 0;
    const progressPct = totalRides > 0 ? Math.min(100, Math.round((completedRides / totalRides) * 100)) : 0;
    const activeDays = (item.commuteDetails?.daysOfWeek || [1, 2, 3, 4, 5])
      .map(d => DAYS_MAP[d])
      .join(', ');

    return (
      <TouchableOpacity
        style={styles.card}
        activeOpacity={0.88}
        onPress={() => {
          setSelectedSub(item);
          setModalVisible(true);
        }}
      >
        <View style={styles.cardHeader}>
          <View style={styles.passengerInfo}>
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>{(item.passengerId?.name || 'P').charAt(0)}</Text>
            </View>
            <View>
              <Text style={styles.passengerName}>{item.passengerId?.name || 'Passenger'}</Text>
              <Text style={styles.passengerRating}>⭐ {item.passengerId?.rating || '4.9'} rating</Text>
            </View>
          </View>
          <View style={[styles.statusBadge, { backgroundColor: badge.bg }]}>
            <Text style={[styles.statusBadgeText, { color: badge.text }]}>{badge.label}</Text>
          </View>
        </View>

        {/* Route Info */}
        <View style={styles.routeContainer}>
          <View style={styles.routeLine}>
            <View style={[styles.dot, { backgroundColor: colors.pickup }]} />
            <View style={styles.line} />
            <View style={[styles.dot, { backgroundColor: colors.dropoff }]} />
          </View>
          <View style={styles.addressWrapper}>
            <Text style={styles.addressText} numberOfLines={1}>{pickup.address}</Text>
            <Text style={[styles.addressText, { marginTop: 10 }]} numberOfLines={1}>{dropoff.address}</Text>
          </View>
        </View>

        <CarpoolMapPreview pickup={pickup} dropoff={dropoff} style={styles.mapPreview} />

        {/* Schedule */}
        <View style={styles.scheduleBox}>
          <View style={styles.scheduleItem}>
            <IconIonic name="time-outline" size={14} color={colors.accent} />
            <Text style={styles.scheduleText}>
              Morning: {item.commuteDetails?.morningTime} | Evening: {item.commuteDetails?.eveningTime}
            </Text>
          </View>
          <View style={[styles.scheduleItem, { marginTop: 4 }]}>
            <IconIonic name="calendar-outline" size={14} color={colors.textSecondary} />
            <Text style={styles.scheduleTextSub}>{activeDays}</Text>
          </View>
        </View>

        {/* Progress Bar */}
        <View style={styles.progressContainer}>
          <View style={styles.progressHeader}>
            <Text style={styles.progressLabel}>Subscription Progress</Text>
            <Text style={styles.progressValue}>{completedRides} / {totalRides} Rides Completed</Text>
          </View>
          <View style={styles.progressBarBg}>
            <View style={[styles.progressBarFill, { width: `${progressPct}%` }]} />
          </View>
        </View>

        {/* Call Passenger & Footer */}
        <View style={styles.cardFooter}>
          <View>
            <Text style={styles.priceLabel}>Locked Earnings</Text>
            <Text style={styles.priceValue}>Rs. {item.financials?.totalPrice?.toLocaleString()}</Text>
          </View>
          {item.passengerId?.phoneNumber && (
            <TouchableOpacity
              style={styles.callPassengerBtn}
              onPress={() => handleCallPassenger(item.passengerId.phoneNumber)}
            >
              <Icon name="call" size={16} color="#FFF" style={{ marginRight: 6 }} />
              <Text style={styles.callPassengerText}>Call Passenger</Text>
            </TouchableOpacity>
          )}
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle={colors.statusBarStyle} backgroundColor={colors.background} />

      {/* Header */}
      <View style={styles.headerBar}>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
          <IconIonic name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Subscription Hub</Text>
        <View style={{ width: 24 }} />
      </View>

      {/* Segmented Control */}
      <View style={styles.segmentedControlContainer}>
        <TouchableOpacity
          style={[styles.segmentBtn, activeTab === 'AVAILABLE' && styles.segmentBtnActive]}
          onPress={() => setActiveTab('AVAILABLE')}
        >
          <Text style={[styles.segmentText, activeTab === 'AVAILABLE' && styles.segmentTextActive]}>
            Browse Requests ({availableRequests.length})
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.segmentBtn, activeTab === 'ACCEPTED' && styles.segmentBtnActive]}
          onPress={() => setActiveTab('ACCEPTED')}
        >
          <Text style={[styles.segmentText, activeTab === 'ACCEPTED' && styles.segmentTextActive]}>
            My Subscriptions ({acceptedSubscriptions.length})
          </Text>
        </TouchableOpacity>
      </View>

      {/* Main List */}
      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={colors.accent} />
          <Text style={styles.loadingText}>Loading subscriptions...</Text>
        </View>
      ) : activeTab === 'AVAILABLE' ? (
        <FlatList
          data={availableRequests}
          renderItem={renderAvailableCard}
          keyExtractor={item => item._id}
          contentContainerStyle={styles.listContent}
          refreshing={refreshing}
          onRefresh={onRefresh}
          ListEmptyComponent={
            <View style={styles.emptyCenter}>
              <IconMC name="routes-clock" size={48} color={colors.textSecondary} />
              <Text style={styles.emptyTitle}>No Pending Requests</Text>
              <Text style={styles.emptySubtitle}>There are no open passenger subscription requests right now. Check back soon!</Text>
            </View>
          }
        />
      ) : (
        <FlatList
          data={acceptedSubscriptions}
          renderItem={renderAcceptedCard}
          keyExtractor={item => item._id}
          contentContainerStyle={styles.listContent}
          refreshing={refreshing}
          onRefresh={onRefresh}
          ListEmptyComponent={
            <View style={styles.emptyCenter}>
              <IconMC name="file-check-outline" size={48} color={colors.textSecondary} />
              <Text style={styles.emptyTitle}>No Accepted Subscriptions</Text>
              <Text style={styles.emptySubtitle}>You have not committed to any passenger subscriptions yet. Switch to "Browse Requests" to accept one!</Text>
            </View>
          }
        />
      )}

      {/* Details Modal */}
      <Modal
        visible={modalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeaderRow}>
              <Text style={styles.modalTitle}>Subscription Summary</Text>
              <TouchableOpacity onPress={() => setModalVisible(false)}>
                <IconIonic name="close" size={22} color={colors.text} />
              </TouchableOpacity>
            </View>

            {selectedSub && (
              <ScrollView showsVerticalScrollIndicator={false}>
                <View style={styles.modalSection}>
                  <Text style={styles.modalSectionTitle}>PASSENGER</Text>
                  <View style={styles.passengerModalRow}>
                    <View style={styles.avatar}>
                      <Text style={styles.avatarText}>{(selectedSub.passengerId?.name || 'P').charAt(0)}</Text>
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.passengerName}>{selectedSub.passengerId?.name}</Text>
                      <Text style={styles.passengerRating}>⭐ {selectedSub.passengerId?.rating || '4.9'} rating</Text>
                    </View>
                    {selectedSub.passengerId?.phoneNumber && (
                      <TouchableOpacity
                        style={styles.callPassengerBtn}
                        onPress={() => handleCallPassenger(selectedSub.passengerId.phoneNumber)}
                      >
                        <Icon name="call" size={16} color="#FFF" />
                      </TouchableOpacity>
                    )}
                  </View>
                </View>

                <View style={styles.modalSection}>
                  <Text style={styles.modalSectionTitle}>ROUTE & TIMINGS</Text>
                  <Text style={styles.modalText}>Pickup: {selectedSub.commuteDetails?.pickupLocation?.address}</Text>
                  <Text style={[styles.modalText, { marginTop: 6 }]}>Dropoff: {selectedSub.commuteDetails?.dropoffLocation?.address}</Text>
                  <Text style={[styles.modalText, { marginTop: 6 }]}>Morning Pickup: {selectedSub.commuteDetails?.morningTime}</Text>
                  <Text style={[styles.modalText, { marginTop: 6 }]}>Evening Return: {selectedSub.commuteDetails?.eveningTime}</Text>
                </View>

                <View style={styles.modalSection}>
                  <Text style={styles.modalSectionTitle}>EARNINGS & RIDES</Text>
                  <Text style={styles.modalText}>Total Earnings: Rs. {selectedSub.financials?.totalPrice?.toLocaleString()}</Text>
                  <Text style={[styles.modalText, { marginTop: 6 }]}>Completed Rides: {selectedSub.tracking?.completedRides || 0} of {selectedSub.financials?.totalRides || 0}</Text>
                </View>
              </ScrollView>
            )}
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
};

const createStyles = (colors, isDark) => {
  const cardBg = isDark ? colors.card : '#FFFFFF';
  const insetBg = isDark ? colors.cardElevated : '#F5F5F5';

  return StyleSheet.create({
    safeArea: {
      flex: 1,
      backgroundColor: colors.background,
    },
    headerBar: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: 16,
      paddingVertical: 12,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
      backgroundColor: colors.background,
    },
    backBtn: {
      padding: 4,
    },
    headerTitle: {
      fontSize: 18,
      fontWeight: 'bold',
      color: colors.text,
    },
    segmentedControlContainer: {
      flexDirection: 'row',
      backgroundColor: insetBg,
      margin: 12,
      padding: 4,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: colors.border,
    },
    segmentBtn: {
      flex: 1,
      paddingVertical: 10,
      alignItems: 'center',
      borderRadius: 8,
    },
    segmentBtnActive: {
      backgroundColor: colors.accent,
    },
    segmentText: {
      fontSize: 13,
      fontWeight: '600',
      color: colors.textSecondary,
    },
    segmentTextActive: {
      color: colors.onAccent,
      fontWeight: 'bold',
    },
    center: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      padding: 20,
    },
    loadingText: {
      color: colors.textSecondary,
      marginTop: 10,
      fontSize: 14,
    },
    listContent: {
      padding: 16,
      paddingBottom: 40,
    },
    card: {
      backgroundColor: cardBg,
      borderRadius: 16,
      padding: 16,
      marginBottom: 16,
      borderWidth: 1,
      borderColor: colors.border,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: isDark ? 0 : 0.05,
      shadowRadius: 8,
      elevation: isDark ? 0 : 2,
    },
    cardHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 12,
    },
    passengerInfo: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 10,
    },
    avatar: {
      width: 38,
      height: 38,
      borderRadius: 19,
      backgroundColor: colors.accent,
      justifyContent: 'center',
      alignItems: 'center',
    },
    avatarText: {
      color: colors.onAccent,
      fontWeight: 'bold',
      fontSize: 16,
    },
    passengerName: {
      color: colors.text,
      fontSize: 15,
      fontWeight: 'bold',
    },
    passengerRating: {
      color: colors.textSecondary,
      fontSize: 12,
    },
    badgeRow: {
      flexDirection: 'row',
      gap: 6,
    },
    vehicleBadge: {
      backgroundColor: colors.accent,
      color: colors.onAccent,
      fontSize: 11,
      fontWeight: 'bold',
      paddingHorizontal: 8,
      paddingVertical: 3,
      borderRadius: 8,
    },
    passengersBadge: {
      backgroundColor: insetBg,
      color: colors.text,
      fontSize: 11,
      fontWeight: '600',
      paddingHorizontal: 8,
      paddingVertical: 3,
      borderRadius: 8,
    },
    statusBadge: {
      paddingHorizontal: 10,
      paddingVertical: 4,
      borderRadius: 10,
    },
    statusBadgeText: {
      fontSize: 11,
      fontWeight: 'bold',
    },
    routeContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: 12,
    },
    routeLine: {
      alignItems: 'center',
      width: 16,
      marginRight: 10,
    },
    dot: {
      width: 8,
      height: 8,
      borderRadius: 4,
    },
    line: {
      width: 2,
      height: 18,
      backgroundColor: colors.border,
      marginVertical: 2,
    },
    addressWrapper: {
      flex: 1,
    },
    addressText: {
      fontSize: 14,
      fontWeight: '600',
      color: colors.text,
    },
    mapPreview: {
      height: 130,
      borderRadius: 12,
      marginBottom: 12,
      overflow: 'hidden',
    },
    scheduleBox: {
      backgroundColor: insetBg,
      padding: 10,
      borderRadius: 10,
      marginBottom: 12,
    },
    scheduleItem: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
    },
    scheduleText: {
      fontSize: 12,
      fontWeight: '600',
      color: colors.text,
    },
    scheduleTextSub: {
      fontSize: 11,
      color: colors.textSecondary,
    },
    progressContainer: {
      marginBottom: 12,
    },
    progressHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      marginBottom: 4,
    },
    progressLabel: {
      fontSize: 11,
      fontWeight: '600',
      color: colors.textSecondary,
    },
    progressValue: {
      fontSize: 11,
      fontWeight: 'bold',
      color: colors.text,
    },
    progressBarBg: {
      height: 6,
      backgroundColor: insetBg,
      borderRadius: 3,
      overflow: 'hidden',
    },
    progressBarFill: {
      height: '100%',
      backgroundColor: colors.accent,
      borderRadius: 3,
    },
    cardFooter: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingTop: 10,
      borderTopWidth: 1,
      borderTopColor: colors.border,
    },
    priceLabel: {
      fontSize: 11,
      color: colors.textSecondary,
    },
    priceValue: {
      fontSize: 16,
      fontWeight: 'bold',
      color: colors.accent,
    },
    acceptButton: {
      borderRadius: 20,
      overflow: 'hidden',
    },
    acceptGradient: {
      paddingHorizontal: 20,
      paddingVertical: 10,
    },
    acceptText: {
      color: '#FFF',
      fontWeight: 'bold',
      fontSize: 13,
    },
    callPassengerBtn: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: '#10B981',
      paddingHorizontal: 14,
      paddingVertical: 8,
      borderRadius: 18,
    },
    callPassengerText: {
      color: '#FFF',
      fontSize: 13,
      fontWeight: 'bold',
    },
    emptyCenter: {
      alignItems: 'center',
      justifyContent: 'center',
      paddingVertical: 60,
      paddingHorizontal: 24,
    },
    emptyTitle: {
      fontSize: 18,
      fontWeight: 'bold',
      color: colors.text,
      marginTop: 12,
      marginBottom: 6,
    },
    emptySubtitle: {
      fontSize: 14,
      color: colors.textSecondary,
      textAlign: 'center',
      lineHeight: 20,
    },
    modalOverlay: {
      flex: 1,
      backgroundColor: 'rgba(0, 0, 0, 0.6)',
      justifyContent: 'flex-end',
    },
    modalContent: {
      backgroundColor: cardBg,
      borderTopLeftRadius: 24,
      borderTopRightRadius: 24,
      padding: 20,
      maxHeight: '80%',
    },
    modalHeaderRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 16,
    },
    modalTitle: {
      fontSize: 18,
      fontWeight: 'bold',
      color: colors.text,
    },
    modalSection: {
      backgroundColor: insetBg,
      padding: 14,
      borderRadius: 12,
      marginBottom: 14,
    },
    modalSectionTitle: {
      fontSize: 11,
      fontWeight: 'bold',
      color: colors.textSecondary,
      marginBottom: 8,
      letterSpacing: 0.5,
    },
    passengerModalRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 12,
    },
    modalText: {
      fontSize: 14,
      fontWeight: '600',
      color: colors.text,
    },
  });
};

export default DriverSubscriptionRequestsScreen;
