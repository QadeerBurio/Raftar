import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  ActivityIndicator,
  Alert,
  RefreshControl,
  SafeAreaView,
  StatusBar,
  Modal,
  ScrollView,
  Linking,
  Platform
} from 'react-native';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import IconIonic from 'react-native-vector-icons/Ionicons';
import IconMC from 'react-native-vector-icons/MaterialCommunityIcons';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '../../context/ThemeContext';
import api from '../../services/api';
import CarpoolMapPreview from '../../components/common/CarpoolMapPreview';

const DAYS_MAP = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

const MySubscriptionsScreen = () => {
  const { colors, isDark } = useTheme();
  const styles = useMemo(() => createStyles(colors, isDark), [colors, isDark]);
  const navigation = useNavigation();

  const [subscriptions, setSubscriptions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedFilter, setSelectedFilter] = useState('ALL');
  const [selectedSub, setSelectedSub] = useState(null);
  const [modalVisible, setModalVisible] = useState(false);

  const fetchSubscriptions = async () => {
    try {
      const res = await api.get('/subscriptions/passenger');
      if (res.data?.success) {
        setSubscriptions(res.data.subscriptions || []);
      }
    } catch (error) {
      console.error('Fetch passenger subscriptions error:', error);
      Alert.alert('Error', 'Failed to load your subscriptions');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      fetchSubscriptions();
    }, [])
  );

  const onRefresh = () => {
    setRefreshing(true);
    fetchSubscriptions();
  };

  const filteredSubscriptions = useMemo(() => {
    if (selectedFilter === 'ALL') return subscriptions;
    return subscriptions.filter(sub => sub.status === selectedFilter);
  }, [subscriptions, selectedFilter]);

  const getStatusBadge = (status) => {
    switch (status) {
      case 'PENDING':
        return { label: 'Awaiting Driver', bg: isDark ? '#3D2F0B' : '#FFF8E6', text: '#D97706', icon: 'time-outline' };
      case 'ACTIVE':
        return { label: 'Active', bg: isDark ? '#063B28' : '#E6F4EA', text: '#10B981', icon: 'checkmark-circle-outline' };
      case 'COMPLETED':
        return { label: 'Completed', bg: isDark ? '#102A45' : '#EBF5FF', text: '#3B82F6', icon: 'ribbon-outline' };
      case 'TERMINATED_AUTO':
      case 'CANCELLED':
        return { label: 'Terminated', bg: isDark ? '#3B1219' : '#FDE8E8', text: '#EF4444', icon: 'close-circle-outline' };
      default:
        return { label: status, bg: colors.cardElevated, text: colors.textSecondary, icon: 'help-circle-outline' };
    }
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return 'N/A';
    const d = new Date(dateStr);
    return d.toLocaleDateString('en-PK', { day: '2-digit', month: 'short', year: 'numeric' });
  };

  const openDetailsModal = (sub) => {
    setSelectedSub(sub);
    setModalVisible(true);
  };

  const handleCallDriver = (phoneNumber) => {
    if (!phoneNumber) return;
    Linking.openURL(`tel:${phoneNumber}`).catch(() => {
      Alert.alert('Error', 'Unable to place call');
    });
  };

  const renderCard = ({ item }) => {
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
        onPress={() => openDetailsModal(item)}
      >
        {/* Top Header */}
        <View style={styles.cardHeader}>
          <View style={styles.planContainer}>
            <LinearGradient
              colors={['#8E24AA', '#AB47BC']}
              style={styles.planGradient}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
            >
              <Text style={styles.planText}>{item.planType || 'MONTHLY'}</Text>
            </LinearGradient>
            <View style={styles.vehicleBadgeContainer}>
              <IconMC name={item.vehicleType === 'bike' ? 'motorbike' : 'car'} size={14} color={colors.text} />
              <Text style={styles.vehicleBadgeText}>
                {(item.vehicleType || 'car').toUpperCase().replace('_', ' ')} • {item.commuteDetails?.passengersCount || 1} Seat{(item.commuteDetails?.passengersCount || 1) > 1 ? 's' : ''}
              </Text>
            </View>
          </View>

          <View style={[styles.statusBadge, { backgroundColor: badge.bg }]}>
            <IconIonic name={badge.icon} size={13} color={badge.text} style={{ marginRight: 4 }} />
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
            <Text style={styles.addressText} numberOfLines={1}>
              {pickup.address}
            </Text>
            <Text style={[styles.addressText, { marginTop: 12 }]} numberOfLines={1}>
              {dropoff.address}
            </Text>
          </View>
        </View>

        {/* Map Preview */}
        <CarpoolMapPreview
          pickup={pickup}
          dropoff={dropoff}
          style={styles.mapPreview}
        />

        {/* Schedule & Timing */}
        <View style={styles.infoRow}>
          <View style={styles.infoCol}>
            <Text style={styles.infoLabel}>COMMUTE TIMINGS</Text>
            <Text style={styles.infoValue}>
              <IconIonic name="time-outline" size={13} color={colors.accent} /> {item.commuteDetails?.morningTime || '08:00 AM'} - {item.commuteDetails?.eveningTime || '05:00 PM'}
            </Text>
          </View>
          <View style={styles.infoColRight}>
            <Text style={styles.infoLabel}>ACTIVE DAYS</Text>
            <Text style={styles.infoValue}>{activeDays}</Text>
          </View>
        </View>

        {/* Progress Bar for Active / Completed */}
        {totalRides > 0 && (
          <View style={styles.progressContainer}>
            <View style={styles.progressHeader}>
              <Text style={styles.progressLabel}>Ride Progress</Text>
              <Text style={styles.progressValue}>{completedRides} of {totalRides} rides</Text>
            </View>
            <View style={styles.progressBarBg}>
              <View style={[styles.progressBarFill, { width: `${progressPct}%` }]} />
            </View>
          </View>
        )}

        {/* Driver Assigned Banner */}
        {item.driverId ? (
          <View style={styles.driverBanner}>
            <View style={styles.driverInfoLeft}>
              <View style={styles.driverAvatar}>
                <Text style={styles.driverAvatarText}>{(item.driverId?.name || 'D').charAt(0)}</Text>
              </View>
              <View>
                <Text style={styles.driverName}>{item.driverId?.name || 'Assigned Driver'}</Text>
                <Text style={styles.driverRating}>⭐ {item.driverId?.rating || '4.9'} • Matched Driver</Text>
              </View>
            </View>
            {item.driverId?.phoneNumber && (
              <TouchableOpacity
                style={styles.callButton}
                onPress={() => handleCallDriver(item.driverId.phoneNumber)}
              >
                <Icon name="call" size={16} color="#FFF" />
              </TouchableOpacity>
            )}
          </View>
        ) : (
          <View style={styles.noDriverBanner}>
            <IconIonic name="pulse-outline" size={16} color="#D97706" />
            <Text style={styles.noDriverText}>Looking for matching drivers along your route...</Text>
          </View>
        )}

        {/* Card Footer */}
        <View style={styles.cardFooter}>
          <View>
            <Text style={styles.footerLabel}>Total Fare (Escrowed)</Text>
            <Text style={styles.footerPrice}>Rs. {item.financials?.totalPrice?.toLocaleString() || 0}</Text>
          </View>
          <View style={styles.detailsBtn}>
            <Text style={styles.detailsBtnText}>View Details</Text>
            <IconIonic name="chevron-forward" size={14} color={colors.accent} />
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle={colors.statusBarStyle} backgroundColor={colors.background} />
      
      {/* Top Navigation Bar */}
      <View style={styles.headerBar}>
        <TouchableOpacity
          style={styles.headerBtn}
          onPress={() => navigation.goBack()}
        >
          <IconIonic name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>My Subscriptions</Text>
        <TouchableOpacity
          style={styles.createBtnHeader}
          onPress={() => navigation.navigate('CreateSubscription')}
        >
          <LinearGradient
            colors={['#F8B82A', '#F9C349']}
            style={styles.createBtnGradient}
          >
            <IconIonic name="add" size={22} color="#000" />
          </LinearGradient>
        </TouchableOpacity>
      </View>

      {/* Filter Tabs */}
      <View style={styles.filterBar}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterScroll}>
          {[
            { id: 'ALL', label: 'All' },
            { id: 'ACTIVE', label: 'Active' },
            { id: 'PENDING', label: 'Pending' },
            { id: 'COMPLETED', label: 'Completed' },
          ].map(tab => (
            <TouchableOpacity
              key={tab.id}
              style={[
                styles.filterTab,
                selectedFilter === tab.id && styles.filterTabActive
              ]}
              onPress={() => setSelectedFilter(tab.id)}
            >
              <Text style={[
                styles.filterTabText,
                selectedFilter === tab.id && styles.filterTabTextActive
              ]}>
                {tab.label}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {/* Subscription List */}
      {loading ? (
        <View style={styles.loaderContainer}>
          <ActivityIndicator size="large" color={colors.accent} />
          <Text style={styles.loaderText}>Loading your subscriptions...</Text>
        </View>
      ) : (
        <FlatList
          data={filteredSubscriptions}
          renderItem={renderCard}
          keyExtractor={item => item._id}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor={colors.accent}
              colors={[colors.accent]}
            />
          }
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <View style={styles.emptyIconBg}>
                <IconMC name="calendar-sync-outline" size={48} color={colors.accent} />
              </View>
              <Text style={styles.emptyTitle}>No Subscriptions Found</Text>
              <Text style={styles.emptySubtitle}>
                {selectedFilter === 'ALL'
                  ? 'You have not posted any monthly/weekly commute subscription requests yet.'
                  : `No subscriptions with status "${selectedFilter.toLowerCase()}".`}
              </Text>
              <TouchableOpacity
                style={styles.emptyCreateBtn}
                onPress={() => navigation.navigate('CreateSubscription')}
                activeOpacity={0.85}
              >
                <LinearGradient
                  colors={['#F8B82A', '#F9C349']}
                  style={styles.emptyCreateGradient}
                >
                  <IconIonic name="add-circle-outline" size={20} color="#000" style={{ marginRight: 8 }} />
                  <Text style={styles.emptyCreateText}>Post New Subscription</Text>
                </LinearGradient>
              </TouchableOpacity>
            </View>
          }
        />
      )}

      {/* Floating Action Button */}
      <TouchableOpacity
        style={styles.fab}
        activeOpacity={0.85}
        onPress={() => navigation.navigate('CreateSubscription')}
      >
        <LinearGradient
          colors={['#F8B82A', '#F9C349']}
          style={styles.fabGradient}
        >
          <IconIonic name="add" size={28} color="#000" />
        </LinearGradient>
      </TouchableOpacity>

      {/* Detailed Subscription Modal */}
      <Modal
        visible={modalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeaderRow}>
              <Text style={styles.modalTitle}>Subscription Details</Text>
              <TouchableOpacity onPress={() => setModalVisible(false)} style={styles.modalCloseBtn}>
                <IconIonic name="close" size={22} color={colors.text} />
              </TouchableOpacity>
            </View>

            {selectedSub && (
              <ScrollView showsVerticalScrollIndicator={false} style={{ maxHeight: '85%' }}>
                {/* Route Section */}
                <View style={styles.modalSection}>
                  <Text style={styles.modalSectionTitle}>COMMUTE ROUTE</Text>
                  <View style={styles.modalRouteRow}>
                    <Icon name="my-location" size={18} color={colors.pickup} />
                    <Text style={styles.modalRouteText}>{selectedSub.commuteDetails?.pickupLocation?.address}</Text>
                  </View>
                  <View style={styles.modalRouteRow}>
                    <Icon name="location-on" size={18} color={colors.dropoff} />
                    <Text style={styles.modalRouteText}>{selectedSub.commuteDetails?.dropoffLocation?.address}</Text>
                  </View>
                </View>

                {/* Plan & Schedule */}
                <View style={styles.modalSection}>
                  <Text style={styles.modalSectionTitle}>PLAN & SCHEDULE</Text>
                  <View style={styles.modalGrid}>
                    <View style={styles.modalGridItem}>
                      <Text style={styles.modalGridLabel}>Plan Type</Text>
                      <Text style={styles.modalGridValue}>{selectedSub.planType}</Text>
                    </View>
                    <View style={styles.modalGridItem}>
                      <Text style={styles.modalGridLabel}>Vehicle</Text>
                      <Text style={styles.modalGridValue}>{(selectedSub.vehicleType || 'car').toUpperCase()}</Text>
                    </View>
                    <View style={styles.modalGridItem}>
                      <Text style={styles.modalGridLabel}>Morning Pickup</Text>
                      <Text style={styles.modalGridValue}>{selectedSub.commuteDetails?.morningTime}</Text>
                    </View>
                    <View style={styles.modalGridItem}>
                      <Text style={styles.modalGridLabel}>Evening Return</Text>
                      <Text style={styles.modalGridValue}>{selectedSub.commuteDetails?.eveningTime}</Text>
                    </View>
                    <View style={styles.modalGridItem}>
                      <Text style={styles.modalGridLabel}>Start Date</Text>
                      <Text style={styles.modalGridValue}>{formatDate(selectedSub.dateRange?.startDate)}</Text>
                    </View>
                    <View style={styles.modalGridItem}>
                      <Text style={styles.modalGridLabel}>End Date</Text>
                      <Text style={styles.modalGridValue}>{formatDate(selectedSub.dateRange?.endDate)}</Text>
                    </View>
                  </View>
                </View>

                {/* Financial Summary */}
                <View style={styles.modalSection}>
                  <Text style={styles.modalSectionTitle}>PAYMENT & ESCROW</Text>
                  <View style={styles.modalGrid}>
                    <View style={styles.modalGridItem}>
                      <Text style={styles.modalGridLabel}>Total Price</Text>
                      <Text style={[styles.modalGridValue, { color: colors.accent, fontWeight: 'bold' }]}>
                        Rs. {selectedSub.financials?.totalPrice?.toLocaleString()}
                      </Text>
                    </View>
                    <View style={styles.modalGridItem}>
                      <Text style={styles.modalGridLabel}>Per Ride Fare</Text>
                      <Text style={styles.modalGridValue}>Rs. {selectedSub.financials?.perRideFare?.toLocaleString()}</Text>
                    </View>
                    <View style={styles.modalGridItem}>
                      <Text style={styles.modalGridLabel}>Total Scheduled Rides</Text>
                      <Text style={styles.modalGridValue}>{selectedSub.financials?.totalRides}</Text>
                    </View>
                    <View style={styles.modalGridItem}>
                      <Text style={styles.modalGridLabel}>Completed Rides</Text>
                      <Text style={styles.modalGridValue}>{selectedSub.tracking?.completedRides || 0}</Text>
                    </View>
                  </View>
                </View>

                {/* Driver Info */}
                {selectedSub.driverId && (
                  <View style={styles.modalSection}>
                    <Text style={styles.modalSectionTitle}>ASSIGNED DRIVER</Text>
                    <View style={styles.driverBanner}>
                      <View style={styles.driverInfoLeft}>
                        <View style={styles.driverAvatar}>
                          <Text style={styles.driverAvatarText}>{(selectedSub.driverId?.name || 'D').charAt(0)}</Text>
                        </View>
                        <View>
                          <Text style={styles.driverName}>{selectedSub.driverId?.name}</Text>
                          <Text style={styles.driverRating}>⭐ {selectedSub.driverId?.rating || '4.9'} rating</Text>
                        </View>
                      </View>
                      {selectedSub.driverId?.phoneNumber && (
                        <TouchableOpacity
                          style={styles.callButton}
                          onPress={() => handleCallDriver(selectedSub.driverId.phoneNumber)}
                        >
                          <Icon name="call" size={18} color="#FFF" />
                        </TouchableOpacity>
                      )}
                    </View>
                  </View>
                )}
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
  const insetBg = isDark ? colors.cardElevated : '#F9F9F9';
  
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
    headerBtn: {
      padding: 6,
    },
    headerTitle: {
      fontSize: 18,
      fontWeight: 'bold',
      color: colors.text,
    },
    createBtnHeader: {
      borderRadius: 18,
      overflow: 'hidden',
    },
    createBtnGradient: {
      width: 36,
      height: 36,
      justifyContent: 'center',
      alignItems: 'center',
      borderRadius: 18,
    },
    filterBar: {
      paddingVertical: 10,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
      backgroundColor: colors.background,
    },
    filterScroll: {
      paddingHorizontal: 16,
      gap: 8,
    },
    filterTab: {
      paddingHorizontal: 16,
      paddingVertical: 6,
      borderRadius: 20,
      backgroundColor: insetBg,
      borderWidth: 1,
      borderColor: colors.border,
    },
    filterTabActive: {
      backgroundColor: colors.accent,
      borderColor: colors.accent,
    },
    filterTabText: {
      fontSize: 13,
      fontWeight: '600',
      color: colors.textSecondary,
    },
    filterTabTextActive: {
      color: colors.onAccent,
      fontWeight: 'bold',
    },
    listContent: {
      padding: 16,
      paddingBottom: 90,
    },
    loaderContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      padding: 20,
    },
    loaderText: {
      marginTop: 12,
      fontSize: 14,
      color: colors.textSecondary,
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
    planContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
    },
    planGradient: {
      paddingHorizontal: 10,
      paddingVertical: 4,
      borderRadius: 12,
    },
    planText: {
      color: '#FFF',
      fontSize: 11,
      fontWeight: 'bold',
      letterSpacing: 0.5,
    },
    vehicleBadgeContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: insetBg,
      paddingHorizontal: 8,
      paddingVertical: 4,
      borderRadius: 10,
      gap: 4,
    },
    vehicleBadgeText: {
      fontSize: 11,
      fontWeight: '600',
      color: colors.text,
    },
    statusBadge: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: 10,
      paddingVertical: 4,
      borderRadius: 12,
    },
    statusBadgeText: {
      fontSize: 12,
      fontWeight: '700',
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
    infoRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      backgroundColor: insetBg,
      padding: 10,
      borderRadius: 10,
      marginBottom: 12,
    },
    infoCol: {
      flex: 1,
    },
    infoColRight: {
      flex: 1,
      alignItems: 'flex-end',
    },
    infoLabel: {
      fontSize: 10,
      fontWeight: '700',
      color: colors.textSecondary,
      letterSpacing: 0.5,
      marginBottom: 2,
    },
    infoValue: {
      fontSize: 12,
      fontWeight: '600',
      color: colors.text,
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
    driverBanner: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      backgroundColor: isDark ? '#1C2826' : '#F0FDF4',
      padding: 10,
      borderRadius: 10,
      marginBottom: 12,
      borderWidth: 1,
      borderColor: isDark ? '#274E3E' : '#DCFCE7',
    },
    driverInfoLeft: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 10,
    },
    driverAvatar: {
      width: 36,
      height: 36,
      borderRadius: 18,
      backgroundColor: colors.accent,
      justifyContent: 'center',
      alignItems: 'center',
    },
    driverAvatarText: {
      color: colors.onAccent,
      fontWeight: 'bold',
      fontSize: 16,
    },
    driverName: {
      fontSize: 14,
      fontWeight: 'bold',
      color: colors.text,
    },
    driverRating: {
      fontSize: 11,
      color: colors.textSecondary,
    },
    callButton: {
      backgroundColor: '#10B981',
      padding: 8,
      borderRadius: 18,
    },
    noDriverBanner: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: isDark ? '#2A200B' : '#FFFBEB',
      padding: 10,
      borderRadius: 10,
      marginBottom: 12,
      gap: 8,
      borderWidth: 1,
      borderColor: isDark ? '#4A3710' : '#FEF3C7',
    },
    noDriverText: {
      fontSize: 12,
      color: '#D97706',
      fontWeight: '500',
      flex: 1,
    },
    cardFooter: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingTop: 10,
      borderTopWidth: 1,
      borderTopColor: colors.border,
    },
    footerLabel: {
      fontSize: 11,
      color: colors.textSecondary,
    },
    footerPrice: {
      fontSize: 16,
      fontWeight: 'bold',
      color: colors.accent,
    },
    detailsBtn: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
    },
    detailsBtnText: {
      fontSize: 13,
      fontWeight: '600',
      color: colors.accent,
    },
    fab: {
      position: 'absolute',
      bottom: 24,
      right: 20,
      borderRadius: 28,
      elevation: 6,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.3,
      shadowRadius: 6,
    },
    fabGradient: {
      width: 56,
      height: 56,
      borderRadius: 28,
      justifyContent: 'center',
      alignItems: 'center',
    },
    emptyContainer: {
      alignItems: 'center',
      justifyContent: 'center',
      paddingVertical: 60,
      paddingHorizontal: 20,
    },
    emptyIconBg: {
      width: 80,
      height: 80,
      borderRadius: 40,
      backgroundColor: insetBg,
      justifyContent: 'center',
      alignItems: 'center',
      marginBottom: 16,
    },
    emptyTitle: {
      fontSize: 18,
      fontWeight: 'bold',
      color: colors.text,
      marginBottom: 8,
    },
    emptySubtitle: {
      fontSize: 14,
      color: colors.textSecondary,
      textAlign: 'center',
      lineHeight: 20,
      marginBottom: 24,
    },
    emptyCreateBtn: {
      borderRadius: 25,
      overflow: 'hidden',
    },
    emptyCreateGradient: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: 24,
      paddingVertical: 12,
    },
    emptyCreateText: {
      fontSize: 15,
      fontWeight: 'bold',
      color: '#000',
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
    modalCloseBtn: {
      padding: 4,
    },
    modalSection: {
      marginBottom: 16,
      backgroundColor: insetBg,
      padding: 14,
      borderRadius: 12,
    },
    modalSectionTitle: {
      fontSize: 11,
      fontWeight: 'bold',
      color: colors.textSecondary,
      letterSpacing: 0.5,
      marginBottom: 10,
    },
    modalRouteRow: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: 8,
      gap: 10,
    },
    modalRouteText: {
      fontSize: 14,
      fontWeight: '600',
      color: colors.text,
      flex: 1,
    },
    modalGrid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 12,
    },
    modalGridItem: {
      width: '46%',
    },
    modalGridLabel: {
      fontSize: 11,
      color: colors.textSecondary,
    },
    modalGridValue: {
      fontSize: 14,
      fontWeight: 'bold',
      color: colors.text,
      marginTop: 2,
    },
  });
};

export default MySubscriptionsScreen;
