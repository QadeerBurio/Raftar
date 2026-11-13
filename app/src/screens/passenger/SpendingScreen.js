import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useTheme } from '../../context/ThemeContext';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
  SafeAreaView,
  StatusBar,
  Animated,
  Dimensions
} from 'react-native';
import { useDispatch, useSelector } from 'react-redux';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { LineChart } from 'react-native-chart-kit';
import * as Animatable from 'react-native-animatable';
import { useNavigation } from '@react-navigation/native';
import api from '../../services/api';

const { width } = Dimensions.get('window');

const SpendingScreen = () => {
  const { colors, isDark } = useTheme();
  const styles = useMemo(() => createStyles(colors, isDark), [colors, isDark]);
  const navigation = useNavigation();
  const [loading, setLoading] = useState(true);
  const [selectedPeriod, setSelectedPeriod] = useState('weekly');
  const [earnings, setEarnings] = useState(null);
  const [chartData, setChartData] = useState(null);
  const [refreshing, setRefreshing] = useState(false);

  // Animation values
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(30)).current;

  useEffect(() => {
    animateEntrance();
    fetchStats();
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

  const fetchStats = async () => {
    try {
      const response = await api.get('/history/passenger/spending');
      if (response.data?.success) {
        setEarnings(response.data.spending);
        setChartData(response.data.chartData);
      }
    } catch (error) {
      console.log('Failed to fetch spending:', error);
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchStats();
    setRefreshing(false);
  };

  const formatCurrency = (amount) => {
    return `Rs. ${amount?.toLocaleString() || 0}`;
  };

  const getChartData = () => {
    if (chartData && chartData.labels?.length > 0) {
      return {
        labels: chartData.labels,
        datasets: [
          {
            data: chartData.data,
            color: (opacity = 1) => `rgba(249, 195, 73, ${opacity})`,
            strokeWidth: 2
          }
        ]
      };
    }
    return {
      labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
      datasets: [
        {
          data: [0, 0, 0, 0, 0, 0, 0],
          color: (opacity = 1) => `rgba(249, 195, 73, ${opacity})`,
          strokeWidth: 2
        }
      ]
    };
  };

  if (loading && !refreshing) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <StatusBar barStyle={colors.statusBarStyle} backgroundColor={colors.background} />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.accent} />
          <Text style={styles.loadingText}>Loading spending data...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle={colors.statusBarStyle} backgroundColor={colors.background} />
      
      <Animated.View 
        style={[
          styles.container,
          {
            opacity: fadeAnim,
            transform: [{ translateY: slideAnim }],
          }
        ]}
      >
        <ScrollView
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl 
              refreshing={refreshing} 
              onRefresh={onRefresh} 
              tintColor="#F9C349"
              colors={[colors.accent]}
            />
          }
        >
          {/* Header */}
          <View style={styles.header}>
            <TouchableOpacity 
              style={styles.backButton}
              onPress={() => navigation.goBack()}
            >
              <Icon name="arrow-back" size={24} color={colors.text} />
            </TouchableOpacity>
            <View style={styles.headerContent}>
              <Text style={styles.title}>My Spending</Text>
              <Text style={styles.subtitle}>Track your ride expenses</Text>
            </View>
            <View style={styles.headerRight} />
          </View>

          {/* Total Spending */}
          <Animatable.View animation="fadeInUp" duration={600} delay={100} style={styles.totalCard}>
            <View style={styles.totalIconContainer}>
              <Icon name="account-balance-wallet" size={32} color={colors.accent} />
            </View>
            <Text style={styles.totalLabel}>Total Lifetime Spending</Text>
            <Text style={styles.totalAmount}>{formatCurrency(earnings?.total || 0)}</Text>
            <View style={styles.totalRidesContainer}>
              <Icon name="directions-car" size={16} color={colors.textSecondary} />
              <Text style={styles.totalRides}>{earnings?.rides?.total || 0} lifetime trips completed</Text>
            </View>
          </Animatable.View>

          {/* Period Selector */}
          <Animatable.View animation="fadeInUp" duration={600} delay={200} style={styles.periodSelector}>
            {['daily', 'weekly', 'monthly'].map((period) => (
              <TouchableOpacity
                key={period}
                style={[
                  styles.periodButton,
                  selectedPeriod === period && styles.periodButtonActive
                ]}
                onPress={() => setSelectedPeriod(period)}
              >
                <Text style={[
                  styles.periodText,
                  selectedPeriod === period && styles.periodTextActive
                ]}>
                  {period.charAt(0).toUpperCase() + period.slice(1)}
                </Text>
              </TouchableOpacity>
            ))}
          </Animatable.View>

          {/* Chart */}
          <Animatable.View animation="fadeInUp" duration={600} delay={300} style={styles.chartContainer}>
            <View style={styles.chartHeader}>
              <Text style={styles.chartTitle}>Spending Trends</Text>
              <View style={styles.chartLegend}>
                <View style={styles.legendDot} />
                <Text style={styles.legendText}>Spending</Text>
              </View>
            </View>
            <LineChart
              data={getChartData()}
              width={width - 48}
              height={200}
              chartConfig={{
                backgroundColor: isDark ? colors.card : '#FFFFFF',
                backgroundGradientFrom: '#FFFFFF',
                backgroundGradientTo: '#FFFFFF',
                decimalPlaces: 0,
                color: (opacity = 1) => `rgba(249, 195, 73, ${opacity})`,
                labelColor: (opacity = 1) => `rgba(136, 136, 136, ${opacity})`,
                style: {
                  borderRadius: 16,
                },
                propsForDots: {
                  r: '6',
                  strokeWidth: '2',
                  stroke: colors.accent,
                },
                propsForBackgroundLines: {
                  strokeDasharray: '5, 5',
                },
              }}
              bezier
              style={styles.chart}
              withDots={true}
              withShadow={false}
              withInnerLines={false}
              withOuterLines={true}
              withVerticalLabels={true}
              withHorizontalLabels={true}
            />
          </Animatable.View>

          {/* Spending Breakdown */}
          <Animatable.View animation="fadeInUp" duration={600} delay={400} style={styles.breakdownSection}>
            <Text style={styles.sectionTitle}>Spending Summary</Text>
            
            <View style={styles.breakdownGrid}>
              <View style={styles.breakdownItem}>
                <View style={[styles.breakdownIcon, { backgroundColor: colors.accent + '18' }]}>
                  <Icon name="today" size={20} color={colors.accent} />
                </View>
                <Text style={styles.breakdownLabel}>Today</Text>
                <Text style={styles.breakdownValue}>{formatCurrency(earnings?.today || 0)}</Text>
                <Text style={styles.breakdownSub}>{earnings?.rides?.today || 0} trips</Text>
              </View>
              
              <View style={styles.breakdownItem}>
                <View style={[styles.breakdownIcon, { backgroundColor: colors.accent + '18' }]}>
                  <Icon name="date-range" size={20} color={colors.accent} />
                </View>
                <Text style={styles.breakdownLabel}>This Week</Text>
                <Text style={styles.breakdownValue}>{formatCurrency(earnings?.weekly || 0)}</Text>
                <Text style={styles.breakdownSub}>{earnings?.rides?.weekly || 0} trips</Text>
              </View>
              
              <View style={styles.breakdownItem}>
                <View style={[styles.breakdownIcon, { backgroundColor: colors.accent + '18' }]}>
                  <Icon name="calendar-month" size={20} color={colors.accent} />
                </View>
                <Text style={styles.breakdownLabel}>This Month</Text>
                <Text style={styles.breakdownValue}>{formatCurrency(earnings?.monthly || 0)}</Text>
                <Text style={styles.breakdownSub}>{earnings?.rides?.monthly || 0} trips</Text>
              </View>
              
              <View style={styles.breakdownItem}>
                <View style={[styles.breakdownIcon, { backgroundColor: colors.accent + '18' }]}>
                  <Icon name="stats" size={20} color={colors.accent} />
                </View>
                <Text style={styles.breakdownLabel}>Total Rides</Text>
                <Text style={styles.breakdownValue}>{earnings?.rides?.total || 0}</Text>
                <Text style={styles.breakdownSub}>All time</Text>
              </View>
            </View>
          </Animatable.View>
          
          {/* By Trip Type */}
          <Animatable.View animation="fadeInUp" duration={600} delay={500} style={styles.breakdownSection}>
            <Text style={styles.sectionTitle}>By Trip Type</Text>
            
            <View style={styles.typeCard}>
              <View style={styles.typeRow}>
                <View style={styles.typeItem}>
                  <View style={[styles.typeIcon, { backgroundColor: colors.accent + '18' }]}>
                    <Icon name="directions-car" size={20} color={colors.accent} />
                  </View>
                  <View style={styles.typeInfo}>
                    <Text style={styles.typeLabel}>Rides</Text>
                    <Text style={styles.typeValue}>{formatCurrency(earnings?.breakdown?.ride || 0)}</Text>
                  </View>
                </View>
                <View style={styles.typeItem}>
                  <View style={[styles.typeIcon, { backgroundColor: colors.accent + '18' }]}>
                    <Icon name="people" size={20} color={colors.accent} />
                  </View>
                  <View style={styles.typeInfo}>
                    <Text style={styles.typeLabel}>Carpools</Text>
                    <Text style={styles.typeValue}>{formatCurrency(earnings?.breakdown?.carpool || 0)}</Text>
                  </View>
                </View>
              </View>
              <View style={styles.typeRow}>
                <View style={styles.typeItem}>
                  <View style={[styles.typeIcon, { backgroundColor: colors.accent + '18' }]}>
                    <Icon name="local-shipping" size={20} color={colors.accent} />
                  </View>
                  <View style={styles.typeInfo}>
                    <Text style={styles.typeLabel}>Parcels</Text>
                    <Text style={styles.typeValue}>{formatCurrency(earnings?.breakdown?.parcel || 0)}</Text>
                  </View>
                </View>
                <View style={styles.typeItem}>
                  <View style={[styles.typeIcon, { backgroundColor: colors.accent + '18' }]}>
                    <Icon name="map" size={20} color={colors.accent} />
                  </View>
                  <View style={styles.typeInfo}>
                    <Text style={styles.typeLabel}>Intercity</Text>
                    <Text style={styles.typeValue}>{formatCurrency(earnings?.breakdown?.intercity || 0)}</Text>
                  </View>
                </View>
              </View>
            </View>
          </Animatable.View>

          <View style={styles.bottomSpacer} />
        </ScrollView>
      </Animated.View>
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
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 20,
  },
  backButton: {
    padding: 4,
  },
  headerContent: {
    flex: 1,
    marginLeft: 12,
  },
  headerRight: {
    width: 32,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: colors.text,
  },
  subtitle: {
    color: colors.textSecondary,
    fontSize: 14,
    marginTop: 2,
  },
  totalCard: {
    backgroundColor: colors.accent + '18',
    padding: 24,
    borderRadius: 16,
    alignItems: 'center',
    marginHorizontal: 20,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: colors.accent,
  },
  totalIconContainer: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: cardBg,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
    borderWidth: 1,
    borderColor: colors.accent,
  },
  totalLabel: {
    color: colors.textSecondary,
    fontSize: 14,
    fontWeight: '500',
  },
  totalAmount: {
    color: colors.text,
    fontSize: 40,
    fontWeight: '800',
    marginVertical: 6,
  },
  totalRidesContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  totalRides: {
    color: colors.textSecondary,
    fontSize: 14,
  },
  periodSelector: {
    flexDirection: 'row',
    backgroundColor: insetBg,
    borderRadius: 12,
    padding: 4,
    marginHorizontal: 20,
    marginBottom: 20,
  },
  periodButton: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: 'center',
  },
  periodButtonActive: {
    backgroundColor: cardBg,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },
  periodText: {
    color: colors.textSecondary,
    fontSize: 14,
    fontWeight: '500',
  },
  periodTextActive: {
    color: colors.text,
    fontWeight: '700',
  },
  chartContainer: {
    backgroundColor: insetBg,
    borderRadius: 16,
    padding: 16,
    marginHorizontal: 20,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: colors.border,
  },
  chartHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  chartTitle: {
    color: colors.text,
    fontSize: 14,
    fontWeight: '600',
  },
  chartLegend: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  legendDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: colors.accent,
  },
  legendText: {
    color: colors.textSecondary,
    fontSize: 12,
  },
  chart: {
    borderRadius: 12,
    marginLeft: -16,
  },
  breakdownSection: {
    marginHorizontal: 20,
    marginBottom: 24,
  },
  sectionTitle: {
    color: colors.text,
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 12,
  },
  breakdownGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  breakdownItem: {
    flex: 1,
    minWidth: '45%',
    backgroundColor: insetBg,
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: colors.border,
  },
  breakdownIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  breakdownLabel: {
    color: colors.textSecondary,
    fontSize: 12,
    fontWeight: '500',
  },
  breakdownValue: {
    color: colors.text,
    fontSize: 18,
    fontWeight: '700',
    marginTop: 2,
  },
  breakdownSub: {
    color: colors.textSecondary,
    fontSize: 12,
    marginTop: 2,
  },
  typeCard: {
    backgroundColor: insetBg,
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: colors.border,
  },
  typeRow: {
    flexDirection: 'row',
    marginBottom: 12,
  },
  typeRowLast: {
    marginBottom: 0,
  },
  typeItem: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  typeIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  typeInfo: {
    flex: 1,
  },
  typeLabel: {
    color: colors.textSecondary,
    fontSize: 12,
    fontWeight: '500',
  },
  typeValue: {
    color: colors.text,
    fontSize: 16,
    fontWeight: '700',
  },
  bottomSpacer: {
    height: 20,
  },
  });
};

export default SpendingScreen;