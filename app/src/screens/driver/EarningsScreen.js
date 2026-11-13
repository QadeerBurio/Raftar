import DriverFinance from '../../components/common/DriverFinance';
import React, { useState, useEffect, useMemo } from 'react';
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
  Platform,
  Dimensions,
} from 'react-native';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigation } from '@react-navigation/native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import IconIonic from 'react-native-vector-icons/Ionicons';
import IconMC from 'react-native-vector-icons/MaterialCommunityIcons';
import { LinearGradient } from 'expo-linear-gradient';
import * as Animatable from 'react-native-animatable';
import { LineChart } from 'react-native-chart-kit';
import api from '../../services/api';

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

const EarningsScreen = () => {
  const { colors, isDark } = useTheme();
  const { YELLOW_PRIMARY, YELLOW_SECONDARY, WHITE, BLACK, GRAY_DARK, GRAY_MEDIUM, GRAY_LIGHT, GRAY_BG } = useMemo(() => getThemePalette(colors, isDark), [colors, isDark]);
  const styles = useMemo(() => createStyles(colors, isDark), [colors, isDark]);
  const navigation = useNavigation();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedPeriod, setSelectedPeriod] = useState('weekly');
  const [earnings, setEarnings] = useState(null);
  const [chartData, setChartData] = useState(null);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      const response = await api.get('/drivers/earnings');
      if (response.data?.success) {
        setEarnings(response.data.earnings);
        setChartData(response.data.chartData);
      }
    } catch (error) {
      console.log('Failed to fetch earnings:', error);
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
            color: (opacity = 1) => `rgba(248, 184, 42, ${opacity})`,
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
          color: (opacity = 1) => `rgba(248, 184, 42, ${opacity})`,
          strokeWidth: 2
        }
      ]
    };
  };

  if (loading && !refreshing) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={YELLOW_PRIMARY} />
          <Text style={styles.loadingText}>Loading earnings...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle={colors.statusBarStyle} backgroundColor={WHITE} />
      
      <View style={styles.container}>
        {/* Header with Back Arrow */}
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
            <Text style={styles.headerTitle}>Earnings</Text>
            <Text style={styles.headerSubtitle}>Your earning summary</Text>
          </View>
          <TouchableOpacity style={styles.filterButton}>
            <Icon name="more-vert" size={24} color={GRAY_DARK} />
          </TouchableOpacity>
        </View>

        <ScrollView
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl 
              refreshing={refreshing} 
              onRefresh={onRefresh} 
              tintColor={YELLOW_PRIMARY}
              colors={[YELLOW_PRIMARY]}
            />
          }
        >
          <DriverFinance />
          {/* Total Earnings Card */}
          <Animatable.View animation="fadeInUp" duration={600} style={styles.totalCard}>
            <LinearGradient
              colors={[YELLOW_PRIMARY, YELLOW_SECONDARY]}
              style={styles.totalGradient}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
            >
              <View style={styles.totalContent}>
                <Text style={styles.totalLabel}>Total Lifetime Earnings</Text>
                <Text style={styles.totalAmount}>{formatCurrency(earnings?.total || 0)}</Text>
                <View style={styles.totalRidesContainer}>
                  <IconMC name="car-multiple" size={16} color={WHITE} />
                  <Text style={styles.totalRides}>{earnings?.rides?.total || 0} lifetime trips</Text>
                </View>
              </View>
              <View style={styles.totalIconContainer}>
                <Icon name="account-balance-wallet" size={40} color={WHITE} opacity={0.3} />
              </View>
            </LinearGradient>
          </Animatable.View>

          {/* Period Selector */}
          <View style={styles.periodSelector}>
            {['daily', 'weekly', 'monthly'].map((period) => (
              <TouchableOpacity
                key={period}
                style={[
                  styles.periodButton,
                  selectedPeriod === period && styles.periodButtonActive
                ]}
                onPress={() => setSelectedPeriod(period)}
                activeOpacity={0.7}
              >
                <Text style={[
                  styles.periodText,
                  selectedPeriod === period && styles.periodTextActive
                ]}>
                  {period.charAt(0).toUpperCase() + period.slice(1)}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Chart */}
          <Animatable.View animation="fadeInUp" duration={600} delay={200} style={styles.chartContainer}>
            <View style={styles.chartHeader}>
              <Text style={styles.chartTitle}>Earnings Overview</Text>
              <Text style={styles.chartPeriod}>
                {selectedPeriod === 'daily' ? 'Last 7 Days' : 
                 selectedPeriod === 'weekly' ? 'This Week' : 'This Month'}
              </Text>
            </View>
            <LineChart
              data={getChartData()}
              width={width - 48}
              height={200}
              chartConfig={{
                backgroundColor: WHITE,
                backgroundGradientFrom: WHITE,
                backgroundGradientTo: WHITE,
                decimalPlaces: 0,
                color: (opacity = 1) => `rgba(248, 184, 42, ${opacity})`,
                labelColor: (opacity = 1) => `rgba(51, 51, 51, ${opacity})`,
                style: {
                  borderRadius: 16,
                },
                propsForDots: {
                  r: '5',
                  strokeWidth: '2',
                  stroke: YELLOW_PRIMARY,
                },
                propsForBackgroundLines: {
                  strokeDasharray: '',
                  stroke: '#F0F0F0',
                  strokeWidth: 1,
                },
              }}
              bezier
              style={styles.chart}
              withDots={true}
              withShadow={false}
              withInnerLines={true}
              withOuterLines={true}
              withVerticalLabels={true}
              withHorizontalLabels={true}
              formatYLabel={(value) => `Rs.${value}`}
            />
          </Animatable.View>

          {/* Earnings Summary */}
          <Animatable.View animation="fadeInUp" duration={600} delay={300}>
            <View style={styles.breakdownSection}>
              <Text style={styles.sectionTitle}>Earnings Summary</Text>
              
              <View style={styles.breakdownCard}>
                <View style={styles.breakdownRow}>
                  <View style={styles.breakdownItem}>
                    <View style={[styles.breakdownIconContainer, { backgroundColor: '#4ECDC4' + '15' }]}>
                      <Icon name="today" size={18} color="#4ECDC4" />
                    </View>
                    <Text style={styles.breakdownLabel}>Today</Text>
                    <Text style={styles.breakdownValue}>{formatCurrency(earnings?.today || 0)}</Text>
                    <Text style={styles.breakdownSubtext}>{earnings?.rides?.today || 0} trips</Text>
                  </View>
                  <View style={styles.breakdownDivider} />
                  <View style={styles.breakdownItem}>
                    <View style={[styles.breakdownIconContainer, { backgroundColor: YELLOW_PRIMARY + '15' }]}>
                      <Icon name="date-range" size={18} color={YELLOW_PRIMARY} />
                    </View>
                    <Text style={styles.breakdownLabel}>This Week</Text>
                    <Text style={styles.breakdownValue}>{formatCurrency(earnings?.weekly || 0)}</Text>
                    <Text style={styles.breakdownSubtext}>{earnings?.rides?.weekly || 0} trips</Text>
                  </View>
                </View>
                <View style={styles.breakdownDividerFull} />
                <View style={styles.breakdownRow}>
                  <View style={styles.breakdownItem}>
                    <View style={[styles.breakdownIconContainer, { backgroundColor: '#45B7D1' + '15' }]}>
                      <Icon name="calendar-today" size={18} color="#45B7D1" />
                    </View>
                    <Text style={styles.breakdownLabel}>This Month</Text>
                    <Text style={styles.breakdownValue}>{formatCurrency(earnings?.monthly || 0)}</Text>
                    <Text style={styles.breakdownSubtext}>{earnings?.rides?.monthly || 0} trips</Text>
                  </View>
                  <View style={styles.breakdownDivider} />
                  <View style={styles.breakdownItem}>
                    <View style={[styles.breakdownIconContainer, { backgroundColor: '#FF6B6B' + '15' }]}>
                      <IconMC name="counter" size={18} color="#FF6B6B" />
                    </View>
                    <Text style={styles.breakdownLabel}>Total Rides</Text>
                    <Text style={styles.breakdownValue}>{earnings?.rides?.total || 0}</Text>
                    <Text style={styles.breakdownSubtext}>all time</Text>
                  </View>
                </View>
              </View>
            </View>
          </Animatable.View>
          
          {/* Earnings By Category */}
          <Animatable.View animation="fadeInUp" duration={600} delay={400}>
            <View style={styles.breakdownSection}>
              <Text style={styles.sectionTitle}>By Trip Type</Text>
              
              <View style={styles.categoryCard}>
                <View style={styles.categoryRow}>
                  <View style={styles.categoryItem}>
                    <View style={[styles.categoryIcon, { backgroundColor: '#4ECDC4' + '15' }]}>
                      <Icon name="directions-car" size={20} color="#4ECDC4" />
                    </View>
                    <View style={styles.categoryInfo}>
                      <Text style={styles.categoryLabel}>Rides</Text>
                      <Text style={styles.categoryValue}>{formatCurrency(earnings?.breakdown?.ride || 0)}</Text>
                    </View>
                    <View style={styles.categoryPercentage}>
                      <Text style={styles.percentageText}>
                        {earnings?.total ? Math.round((earnings?.breakdown?.ride || 0) / earnings.total * 100) : 0}%
                      </Text>
                    </View>
                  </View>
                </View>
                <View style={styles.categoryDivider} />
                <View style={styles.categoryRow}>
                  <View style={styles.categoryItem}>
                    <View style={[styles.categoryIcon, { backgroundColor: YELLOW_PRIMARY + '15' }]}>
                      <IconMC name="car-multiple" size={20} color={YELLOW_PRIMARY} />
                    </View>
                    <View style={styles.categoryInfo}>
                      <Text style={styles.categoryLabel}>Carpools</Text>
                      <Text style={styles.categoryValue}>{formatCurrency(earnings?.breakdown?.carpool || 0)}</Text>
                    </View>
                    <View style={styles.categoryPercentage}>
                      <Text style={styles.percentageText}>
                        {earnings?.total ? Math.round((earnings?.breakdown?.carpool || 0) / earnings.total * 100) : 0}%
                      </Text>
                    </View>
                  </View>
                </View>
                <View style={styles.categoryDivider} />
                <View style={[styles.categoryRow, { marginBottom: 0 }]}>
                  <View style={styles.categoryItem}>
                    <View style={[styles.categoryIcon, { backgroundColor: '#FF6B6B' + '15' }]}>
                      <IconMC name="package-variant" size={20} color="#FF6B6B" />
                    </View>
                    <View style={styles.categoryInfo}>
                      <Text style={styles.categoryLabel}>Parcels</Text>
                      <Text style={styles.categoryValue}>{formatCurrency(earnings?.breakdown?.parcel || 0)}</Text>
                    </View>
                    <View style={styles.categoryPercentage}>
                      <Text style={styles.percentageText}>
                        {earnings?.total ? Math.round((earnings?.breakdown?.parcel || 0) / earnings.total * 100) : 0}%
                      </Text>
                    </View>
                  </View>
                </View>
              </View>
            </View>
          </Animatable.View>

          {/* Withdrawal Button */}
          <Animatable.View animation="fadeInUp" duration={600} delay={500}>
            <TouchableOpacity style={styles.withdrawButton} activeOpacity={0.8}>
              <LinearGradient
                colors={[YELLOW_PRIMARY, YELLOW_SECONDARY]}
                style={styles.withdrawGradient}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
              >
                <Icon name="account-balance-wallet" size={22} color={WHITE} />
                <Text style={styles.withdrawButtonText}>Withdraw Earnings</Text>
                <Icon name="chevron-right" size={22} color={WHITE} />
              </LinearGradient>
            </TouchableOpacity>
          </Animatable.View>

          <View style={styles.bottomSpacer} />
        </ScrollView>
      </View>
    </SafeAreaView>
  );
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
    backgroundColor: WHITE,
    marginTop:24,
    paddingBottom:30
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: WHITE,
  },
  loadingText: {
    color: GRAY_MEDIUM,
    fontSize: 14,
    marginTop: 12,
    fontWeight: '500',
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
  filterButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: GRAY_LIGHT,
    justifyContent: 'center',
    alignItems: 'center',
  },
  totalCard: {
    marginHorizontal: 16,
    marginTop: 16,
    marginBottom: 20,
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: BLACK,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  totalGradient: {
    padding: 20,
    position: 'relative',
  },
  totalContent: {
    position: 'relative',
    zIndex: 1,
  },
  totalIconContainer: {
    position: 'absolute',
    right: 10,
    top: 10,
  },
  totalLabel: {
    color: WHITE,
    fontSize: 14,
    fontWeight: '500',
    opacity: 0.9,
  },
  totalAmount: {
    color: WHITE,
    fontSize: 36,
    fontWeight: '700',
    marginVertical: 6,
  },
  totalRidesContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  totalRides: {
    color: WHITE,
    fontSize: 14,
    opacity: 0.9,
  },
  periodSelector: {
    flexDirection: 'row',
    backgroundColor: GRAY_LIGHT,
    borderRadius: 12,
    padding: 4,
    marginHorizontal: 16,
    marginBottom: 20,
  },
  periodButton: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 10,
    alignItems: 'center',
  },
  periodButtonActive: {
    backgroundColor: WHITE,
    shadowColor: BLACK,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },
  periodText: {
    color: GRAY_MEDIUM,
    fontSize: 14,
    fontWeight: '500',
  },
  periodTextActive: {
    color: BLACK,
    fontWeight: '600',
  },
  chartContainer: {
    backgroundColor: WHITE,
    borderRadius: 16,
    padding: 16,
    marginHorizontal: 16,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: colors.border,
    shadowColor: BLACK,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
  },
  chartHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  chartTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: BLACK,
  },
  chartPeriod: {
    fontSize: 12,
    color: GRAY_MEDIUM,
    fontWeight: '500',
  },
  chart: {
    borderRadius: 12,
    marginLeft: -20,
  },
  breakdownSection: {
    marginHorizontal: 16,
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: BLACK,
    marginBottom: 12,
  },
  breakdownCard: {
    backgroundColor: WHITE,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: colors.border,
    shadowColor: BLACK,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
  },
  breakdownRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  breakdownItem: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 8,
  },
  breakdownIconContainer: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 4,
  },
  breakdownLabel: {
    color: GRAY_MEDIUM,
    fontSize: 12,
    fontWeight: '500',
  },
  breakdownValue: {
    color: BLACK,
    fontSize: 18,
    fontWeight: '700',
    marginTop: 2,
  },
  breakdownSubtext: {
    color: GRAY_MEDIUM,
    fontSize: 11,
    marginTop: 2,
  },
  breakdownDivider: {
    width: 1,
    height: 50,
    backgroundColor: insetBg,
  },
  breakdownDividerFull: {
    height: 1,
    backgroundColor: insetBg,
    marginVertical: 4,
  },
  categoryCard: {
    backgroundColor: WHITE,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: colors.border,
    shadowColor: BLACK,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
  },
  categoryRow: {
    marginBottom: 12,
  },
  categoryItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  categoryIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  categoryInfo: {
    flex: 1,
  },
  categoryLabel: {
    color: GRAY_MEDIUM,
    fontSize: 13,
    fontWeight: '500',
  },
  categoryValue: {
    color: BLACK,
    fontSize: 16,
    fontWeight: '600',
    marginTop: 2,
  },
  categoryPercentage: {
    backgroundColor: GRAY_LIGHT,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  percentageText: {
    fontSize: 12,
    fontWeight: '600',
    color: GRAY_DARK,
  },
  categoryDivider: {
    height: 1,
    backgroundColor: insetBg,
    marginVertical: 12,
  },
  withdrawButton: {
    marginHorizontal: 16,
    borderRadius: 14,
    overflow: 'hidden',
    shadowColor: YELLOW_PRIMARY,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  withdrawGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    gap: 10,
  },
  withdrawButtonText: {
    color: WHITE,
    fontSize: 16,
    fontWeight: '600',
  },
  bottomSpacer: {
    height: 70,
  },
  });
};

export default EarningsScreen;