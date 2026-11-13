import React, { useState, useMemo } from 'react';
import { useTheme } from '../../context/ThemeContext';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  StatusBar,
  FlatList,
  Image,
  Dimensions,
  RefreshControl,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import IconIonic from 'react-native-vector-icons/Ionicons';
import { LinearGradient } from 'expo-linear-gradient';
import * as Animatable from 'react-native-animatable';

const { width } = Dimensions.get('window');

const Notifications = ({ navigation }) => {
  const { colors, isDark } = useTheme();
  const styles = useMemo(() => createStyles(colors, isDark), [colors, isDark]);
  const [refreshing, setRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState('all');

  // Sample notification data
  const notifications = [
    {
      id: '1',
      type: 'ride',
      title: 'Ride Confirmed',
      message: 'Your ride with John Doe has been confirmed. Driver is on the way.',
      time: '2 min ago',
      read: false,
      icon: 'car',
      iconColor: '#F5A623',
      bgColor: '#FCE4A8',
    },
    {
      id: '2',
      type: 'promo',
      title: 'Special Offer!',
      message: 'Get 20% off on your next 3 rides. Use code: RIDE20',
      time: '15 min ago',
      read: false,
      icon: 'local-offer',
      iconColor: '#4CAF50',
      bgColor: '#C8E6C9',
    },
    {
      id: '3',
      type: 'carpool',
      title: 'Carpool Request Accepted',
      message: 'Sarah accepted your carpool request for the 5:30 PM trip.',
      time: '1 hour ago',
      read: true,
      icon: 'people',
      iconColor: '#2196F3',
      bgColor: '#BBDEFB',
    },
    {
      id: '4',
      type: 'payment',
      title: 'Payment Successful',
      message: 'Your payment of ₹250.00 has been processed successfully.',
      time: '2 hours ago',
      read: true,
      icon: 'payment',
      iconColor: '#9C27B0',
      bgColor: '#E1BEE7',
    },
    {
      id: '5',
      type: 'ride',
      title: 'Ride Completed',
      message: 'Your ride has been completed. Rate your driver now!',
      time: '5 hours ago',
      read: true,
      icon: 'check-circle',
      iconColor: '#4CAF50',
      bgColor: '#C8E6C9',
    },
    {
      id: '6',
      type: 'promo',
      title: 'Refer & Earn',
      message: 'Refer a friend and earn ₹100 credit. Share your referral code now.',
      time: '1 day ago',
      read: true,
      icon: 'share',
      iconColor: '#FF5722',
      bgColor: '#FFCCBC',
    },
    {
      id: '7',
      type: 'carpool',
      title: 'Carpool Request Pending',
      message: 'Your request to join Mike\'s carpool is pending approval.',
      time: '2 days ago',
      read: true,
      icon: 'hourglass-empty',
      iconColor: '#FF9800',
      bgColor: '#FFE0B2',
    },
    {
      id: '8',
      type: 'payment',
      title: 'Wallet Updated',
      message: '₹500.00 has been added to your wallet successfully.',
      time: '3 days ago',
      read: true,
      icon: 'wallet',
      iconColor: '#607D8B',
      bgColor: '#CFD8DC',
    },
  ];

  const [notifData, setNotifData] = useState(notifications);

  const tabs = [
    { id: 'all', label: 'All' },
    { id: 'ride', label: 'Rides' },
    { id: 'carpool', label: 'Carpool' },
    { id: 'promo', label: 'Promos' },
    { id: 'payment', label: 'Payments' },
  ];

  const getFilteredNotifications = () => {
    if (activeTab === 'all') return notifData;
    return notifData.filter(item => item.type === activeTab);
  };

  const getTimeIcon = (time) => {
    if (time.includes('min') || time.includes('hour')) {
      return 'access-time';
    }
    return 'calendar-today';
  };

  const markAsRead = (id) => {
    setNotifData(prev =>
      prev.map(item =>
        item.id === id ? { ...item, read: true } : item
      )
    );
  };

  const markAllAsRead = () => {
    setNotifData(prev =>
      prev.map(item => ({ ...item, read: true }))
    );
  };

  const onRefresh = () => {
    setRefreshing(true);
    // Simulate refresh
    setTimeout(() => {
      setRefreshing(false);
    }, 1500);
  };

  const renderNotification = ({ item }) => (
    <Animatable.View animation="fadeInUp" duration={400} delay={100}>
      <TouchableOpacity
        style={[styles.notificationCard, !item.read && styles.unreadCard]}
        activeOpacity={0.7}
        onPress={() => markAsRead(item.id)}
      >
        <View style={styles.notificationIconContainer}>
          <View style={[styles.iconCircle, { backgroundColor: item.bgColor }]}>
            <Icon name={item.icon} size={24} color={item.iconColor} />
          </View>
          {!item.read && <View style={styles.unreadDot} />}
        </View>

        <View style={styles.notificationContent}>
          <View style={styles.notificationHeader}>
            <Text style={[styles.notificationTitle, !item.read && styles.unreadTitle]}>
              {item.title}
            </Text>
            <View style={styles.timeContainer}>
              <Icon name={getTimeIcon(item.time)} size={12} color={colors.textSecondary} />
              <Text style={styles.timeText}>{item.time}</Text>
            </View>
          </View>
          <Text style={styles.notificationMessage} numberOfLines={2}>
            {item.message}
          </Text>
        </View>
      </TouchableOpacity>
    </Animatable.View>
  );

  const unreadCount = notifData.filter(item => !item.read).length;

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle={colors.statusBarStyle} backgroundColor={colors.background} />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Icon name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Notifications</Text>
        <TouchableOpacity
          style={styles.markAllButton}
          onPress={markAllAsRead}
        >
          <Text style={styles.markAllText}>Mark All Read</Text>
        </TouchableOpacity>
      </View>

      {/* Tabs */}
      <View style={styles.tabsContainer}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.tabsScroll}
        >
          {tabs.map((tab) => (
            <TouchableOpacity
              key={tab.id}
              style={[
                styles.tabButton,
                activeTab === tab.id && styles.activeTabButton,
              ]}
              onPress={() => setActiveTab(tab.id)}
              activeOpacity={0.7}
            >
              <Text
                style={[
                  styles.tabText,
                  activeTab === tab.id && styles.activeTabText,
                ]}
              >
                {tab.label}
              </Text>
              {activeTab === tab.id && (
                <View style={styles.activeTabIndicator} />
              )}
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {/* Unread Count */}
      {unreadCount > 0 && (
        <Animatable.View animation="fadeIn" duration={300} style={styles.unreadCountContainer}>
          <Text style={styles.unreadCountText}>
            {unreadCount} unread notification{unreadCount > 1 ? 's' : ''}
          </Text>
        </Animatable.View>
      )}

      {/* Notifications List */}
      <FlatList
        data={getFilteredNotifications()}
        renderItem={renderNotification}
        keyExtractor={item => item.id}
        contentContainerStyle={styles.listContainer}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor="#F5A623"
            colors={['#F5A623']}
          />
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <LinearGradient
              colors={['#F8F8F8', '#F0F0F0']}
              style={styles.emptyGradient}
            >
              <Icon name="notifications-off" size={64} color="#CCCCCC" />
              <Text style={styles.emptyTitle}>No Notifications</Text>
              <Text style={styles.emptyText}>
                You're all caught up! Check back later for updates.
              </Text>
            </LinearGradient>
          </View>
        }
        ListFooterComponent={<View style={styles.footerSpacer} />}
      />

      {/* FAB for clearing notifications */}
      {notifData.length > 0 && (
        <TouchableOpacity
          style={styles.clearFab}
          activeOpacity={0.8}
          onPress={() => {
            setNotifData([]);
          }}
        >
          <LinearGradient
            colors={['#F5A623', '#D4891A']}
            style={styles.clearFabGradient}
          >
            <Icon name="clear-all" size={24} color="#FFF" />
          </LinearGradient>
        </TouchableOpacity>
      )}
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
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    marginTop:20
  },
  backButton: {
    padding: 4,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.text,
    flex: 1,
    marginLeft: 8,
  },
  markAllButton: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 16,
    backgroundColor: '#FCE4A8',
  },
  markAllText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#D4891A',
  },
  tabsContainer: {
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    backgroundColor: cardBg,
  },
  tabsScroll: {
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  tabButton: {
    paddingHorizontal: 20,
    paddingVertical: 8,
    marginRight: 8,
    borderRadius: 20,
    position: 'relative',
  },
  activeTabButton: {
    backgroundColor: '#FCE4A8',
  },
  tabText: {
    fontSize: 14,
    fontWeight: '500',
    color: colors.textSecondary,
  },
  activeTabText: {
    color: colors.text,
    fontWeight: '600',
  },
  activeTabIndicator: {
    position: 'absolute',
    bottom: 0,
    left: '50%',
    transform: [{ translateX: -12 }],
    width: 24,
    height: 3,
    borderRadius: 2,
    backgroundColor: '#F5A623',
  },
  unreadCountContainer: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    backgroundColor: colors.accent + '18',
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  unreadCountText: {
    fontSize: 13,
    fontWeight: '500',
    color: '#D4891A',
  },
  listContainer: {
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 20,
  },
  notificationCard: {
    flexDirection: 'row',
    backgroundColor: cardBg,
    borderRadius: 16,
    padding: 14,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: colors.border,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 1,
  },
  unreadCard: {
    backgroundColor: colors.accent + '10',
    borderColor: '#FCE4A8',
  },
  notificationIconContainer: {
    marginRight: 14,
    position: 'relative',
  },
  iconCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  unreadDot: {
    position: 'absolute',
    top: -2,
    right: -2,
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#F5A623',
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  notificationContent: {
    flex: 1,
    justifyContent: 'center',
  },
  notificationHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  notificationTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.text,
    flex: 1,
    marginRight: 8,
  },
  unreadTitle: {
    color: colors.text,
  },
  timeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  timeText: {
    fontSize: 11,
    color: colors.textSecondary,
    marginLeft: 4,
  },
  notificationMessage: {
    fontSize: 13,
    color: colors.textSecondary,
    lineHeight: 18,
  },
  emptyContainer: {
    marginTop: 60,
    alignItems: 'center',
  },
  emptyGradient: {
    padding: 40,
    borderRadius: 24,
    alignItems: 'center',
    width: width - 40,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.text,
    marginTop: 16,
  },
  emptyText: {
    fontSize: 14,
    color: colors.textSecondary,
    textAlign: 'center',
    marginTop: 8,
    lineHeight: 20,
  },
  footerSpacer: {
    height: 20,
  },
  clearFab: {
    position: 'absolute',
    bottom: 30,
    right: 30,
    width: 52,
    height: 52,
    borderRadius: 26,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 6,
  },
  clearFabGradient: {
    width: 52,
    height: 52,
    borderRadius: 26,
    justifyContent: 'center',
    alignItems: 'center',
  },
  });
};

export default Notifications;