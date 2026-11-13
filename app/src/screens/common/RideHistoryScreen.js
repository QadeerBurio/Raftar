import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useTheme } from '../../context/ThemeContext';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  SafeAreaView,
  StatusBar,
  Animated,
  Dimensions
} from 'react-native';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigation } from '@react-navigation/native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import * as Animatable from 'react-native-animatable';
import api from '../../services/api';

const { width, height } = Dimensions.get('window');

const RideHistoryScreen = () => {
  const { colors, isDark } = useTheme();
  const styles = useMemo(() => createStyles(colors, isDark), [colors, isDark]);
  const navigation = useNavigation();
  const { user } = useSelector(state => state.auth);
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [filter, setFilter] = useState('all');

  // Animation values
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(30)).current;

  useEffect(() => {
    animateEntrance();
    fetchHistory();
  }, []);

  const animateEntrance = () => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 600,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 600,
        useNativeDriver: true,
      }),
    ]).start();
  };

  const fetchHistory = async () => {
    try {
      const endpoint = user?.role === 'driver' ? '/history/driver' : '/history/passenger';
      const response = await api.get(endpoint);
      if (response.data?.success) {
        setHistory(response.data.history);
      }
    } catch (error) {
      console.error('Failed to fetch history:', error);
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchHistory();
    setRefreshing(false);
  };

  const getStatusColor = (status) => {
    const statusColors = {
      completed: '#4ECDC4',
      cancelled: '#FF3B30',
      started: colors.accent,
      accepted: '#45B7D1',
      pending: '#FF9F43'
    };
    return statusColors[status] || '#888';
  };

  const getStatusIcon = (status) => {
    const icons = {
      completed: 'check-circle',
      cancelled: 'cancel',
      started: 'directions-car',
      accepted: 'check',
      pending: 'schedule'
    };
    return icons[status] || 'help';
  };

  const formatDate = (date) => {
    return new Date(date).toLocaleDateString('en-PK', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const renderRideItem = ({ item, index }) => (
    <Animatable.View 
      animation="fadeInUp" 
      duration={500} 
      delay={index * 80}
      style={styles.rideCardWrapper}
    >
      <TouchableOpacity
        style={styles.rideCard}
        activeOpacity={0.7}
        onPress={() => navigation.navigate(
          item.tripType === 'Carpool' 
            ? (user?.role === 'driver' ? 'ManageCarpools' : 'BookCarpool') 
            : 'RideTracking', 
          { rideId: item._id, carpoolId: item._id }
        )}
      >
        <View style={styles.rideHeader}>
          <View style={styles.rideType}>
            <View style={styles.rideIconContainer}>
              <Icon 
                name={item.tripType === 'Parcel' ? 'local-shipping' : (item.tripType === 'Carpool' ? 'people' : 'directions-car')} 
                size={20} 
                color={colors.accent} 
              />
            </View>
            <Text style={styles.rideTypeText}>{item.tripType || 'Ride'}</Text>
          </View>
          <View style={[styles.statusBadge, { backgroundColor: getStatusColor(item.status) + '15' }]}>
            <Icon name={getStatusIcon(item.status)} size={14} color={getStatusColor(item.status)} />
            <Text style={[styles.statusText, { color: getStatusColor(item.status) }]}>
              {item.status.toUpperCase()}
            </Text>
          </View>
        </View>

        <View style={styles.rideRoute}>
          <View style={styles.routePoint}>
            <View style={styles.routeDotPickup} />
            <Text style={styles.routeText} numberOfLines={1}>
              {item.pickup?.address || 'Unknown Pickup'}
            </Text>
          </View>
          <View style={styles.routeLine} />
          <View style={styles.routePoint}>
            <View style={styles.routeDotDropoff} />
            <Text style={styles.routeText} numberOfLines={1}>
              {item.dropoff?.address || 'Unknown Dropoff'}
            </Text>
          </View>
        </View>

        <View style={styles.rideFooter}>
          <View style={styles.rideInfo}>
            <View style={styles.infoItem}>
              <Icon name="calendar-today" size={14} color={colors.textSecondary} />
              <Text style={styles.rideDate}>{formatDate(item.date)}</Text>
            </View>
            <View style={styles.infoItem}>
              <Icon name="person" size={14} color={colors.textSecondary} />
              <Text style={styles.ridePerson}>
                {user?.role === 'driver' ? item.passengerName : item.driverName}
              </Text>
            </View>
            {item.ratingGiven && (
              <View style={styles.infoItem}>
                <Icon name="star" size={14} color={colors.accent} />
                <Text style={styles.rideRating}>You Rated: {item.ratingGiven}</Text>
              </View>
            )}
          </View>
          <View style={styles.fareContainer}>
            <Text style={[styles.rideFare, item.status === 'cancelled' && styles.cancelledFare]}>
              Rs. {item.status === 'cancelled' ? 0 : (item.fare || item.earnings || 0)}
            </Text>
            {item.status === 'completed' && (
              <View style={styles.completedBadge}>
                <Text style={styles.completedBadgeText}>✓</Text>
              </View>
            )}
          </View>
        </View>
      </TouchableOpacity>
    </Animatable.View>
  );

  const renderHeader = () => (
    <Animated.View 
      style={[
        styles.header,
        {
          opacity: fadeAnim,
          transform: [{ translateY: slideAnim }],
        }
      ]}
    >
      <TouchableOpacity 
        style={styles.backButton}
        onPress={() => navigation.goBack()}
      >
        <Icon name="arrow-back" size={24} color={colors.text} />
      </TouchableOpacity>
      <Text style={styles.headerTitle}>Ride History</Text>
      <View style={styles.headerRight} />
    </Animated.View>
  );

  if (loading && !refreshing) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <StatusBar barStyle={colors.statusBarStyle} backgroundColor={colors.background} />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.accent} />
          <Text style={styles.loadingText}>Loading history...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle={colors.statusBarStyle} backgroundColor={colors.background} />
      
      <View style={styles.container}>
        {renderHeader()}
        
        <FlatList
          data={history}
          renderItem={renderRideItem}
          keyExtractor={item => item._id}
          refreshControl={
            <RefreshControl 
              refreshing={refreshing} 
              onRefresh={onRefresh} 
              tintColor="#F9C349"
              colors={[colors.accent]}
            />
          }
          ListEmptyComponent={
            <Animatable.View animation="fadeInUp" duration={600} style={styles.emptyState}>
              <View style={styles.emptyIconContainer}>
                <Icon name="history" size={64} color="#DDD" />
              </View>
              <Text style={styles.emptyTitle}>No Ride History</Text>
              <Text style={styles.emptyText}>
                Your ride history will appear here once you've completed some rides.
              </Text>
              <TouchableOpacity 
                style={styles.emptyButton}
                onPress={() => navigation.navigate('BookRide')}
              >
                <Text style={styles.emptyButtonText}>Book a Ride</Text>
                <Icon name="arrow-forward" size={18} color={colors.text} />
              </TouchableOpacity>
            </Animatable.View>
          }
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
        />
      </View>
    </SafeAreaView>
  );
};

const createStyles = (colors, isDark) => {
  const cardBg = isDark ? colors.card : '#FFFFFF';
  const insetBg = isDark ? colors.cardElevated : '#F5F5F5';
  return StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: cardBg,
  },
  container: {
    flex: 1,
    backgroundColor: cardBg,
    marginTop:30
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    backgroundColor: cardBg,
  },
  backButton: {
    padding: 8,
    marginLeft: -8,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.text,
    flex: 1,
    marginLeft: 8,
  },
  headerRight: {
    width: 40,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: cardBg,
  },
  loadingText: {
    color: colors.textSecondary,
    fontSize: 14,
    marginTop: 12,
    fontWeight: '500',
  },
  listContent: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 30,
  },
  rideCardWrapper: {
    marginBottom: 12,
  },
  rideCard: {
    backgroundColor: insetBg,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: colors.border,
  },
  rideHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  rideType: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  rideIconContainer: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.accent + '18',
    justifyContent: 'center',
    alignItems: 'center',
  },
  rideTypeText: {
    color: colors.text,
    fontSize: 14,
    fontWeight: '600',
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 4,
  },
  statusText: {
    fontSize: 11,
    fontWeight: '700',
  },
  rideRoute: {
    marginBottom: 12,
    paddingLeft: 4,
  },
  routePoint: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginVertical: 3,
  },
  routeDotPickup: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#4ECDC4',
    marginLeft: 3,
  },
  routeDotDropoff: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#FF3B30',
    marginLeft: 3,
  },
  routeLine: {
    width: 2,
    height: 14,
    backgroundColor: '#E0E0E0',
    marginLeft: 7,
  },
  routeText: {
    color: '#555',
    fontSize: 13,
    flex: 1,
    fontWeight: '500',
  },
  rideFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: colors.border,
    paddingTop: 12,
  },
  rideInfo: {
    flex: 1,
    gap: 3,
  },
  infoItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  rideDate: {
    color: colors.textSecondary,
    fontSize: 12,
  },
  ridePerson: {
    color: colors.textSecondary,
    fontSize: 12,
  },
  rideRating: {
    color: colors.accent,
    fontSize: 12,
    fontWeight: '600',
  },
  fareContainer: {
    alignItems: 'flex-end',
    gap: 4,
  },
  rideFare: {
    color: colors.text,
    fontSize: 18,
    fontWeight: '700',
  },
  cancelledFare: {
    color: colors.textSecondary,
    textDecorationLine: 'line-through',
  },
  completedBadge: {
    backgroundColor: '#4ECDC4',
    borderRadius: 10,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  completedBadgeText: {
    color: '#FFF',
    fontSize: 10,
    fontWeight: '700',
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyIconContainer: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: insetBg,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border,
  },
  emptyTitle: {
    color: colors.text,
    fontSize: 20,
    fontWeight: '700',
    marginTop: 16,
  },
  emptyText: {
    color: colors.textSecondary,
    fontSize: 14,
    textAlign: 'center',
    marginTop: 8,
    paddingHorizontal: 40,
    lineHeight: 20,
  },
  emptyButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.accent,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 25,
    marginTop: 20,
    gap: 8,
  },
  emptyButtonText: {
    color: colors.text,
    fontSize: 14,
    fontWeight: '600',
  },
  });
};

export default RideHistoryScreen;