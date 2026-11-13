import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useTheme } from '../../context/ThemeContext';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  TextInput,
  ActivityIndicator,
  SafeAreaView,
  StatusBar,
  Animated,
  Dimensions,
  Modal,
  KeyboardAvoidingView,
  Platform
} from 'react-native';
import { useDispatch, useSelector } from 'react-redux';
import Icon from 'react-native-vector-icons/MaterialIcons';
import IconMCI from 'react-native-vector-icons/MaterialCommunityIcons';
import * as Animatable from 'react-native-animatable';
import { useNavigation } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';
import { getWalletBalance, addToWallet, withdrawFromWallet, getTransactions } from '../../redux/slices/paymentSlice';

const { width, height } = Dimensions.get('window');

const WalletScreen = () => {
  const { colors, isDark } = useTheme();
  const styles = useMemo(() => createStyles(colors, isDark), [colors, isDark]);
  const navigation = useNavigation();
  const dispatch = useDispatch();
  const { walletBalance = 0, transactions = [], loading = false } = useSelector(state => state.payment || {});
  const [amount, setAmount] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [showWithdrawModal, setShowWithdrawModal] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Animation values
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(30)).current;
  const scaleAnim = useRef(new Animated.Value(0.9)).current;
  const modalScale = useRef(new Animated.Value(0.8)).current;
  const modalFade = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    animateEntrance();
    fetchWalletData();
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
      Animated.spring(scaleAnim, {
        toValue: 1,
        friction: 8,
        tension: 40,
        useNativeDriver: true,
      }),
    ]).start();
  };

  const animateModal = (show) => {
    if (show) {
      Animated.parallel([
        Animated.spring(modalScale, {
          toValue: 1,
          friction: 8,
          tension: 40,
          useNativeDriver: true,
        }),
        Animated.timing(modalFade, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      Animated.parallel([
        Animated.timing(modalScale, {
          toValue: 0.8,
          duration: 200,
          useNativeDriver: true,
        }),
        Animated.timing(modalFade, {
          toValue: 0,
          duration: 200,
          useNativeDriver: true,
        }),
      ]).start();
    }
  };

  const fetchWalletData = async () => {
    try {
      await dispatch(getWalletBalance());
      await dispatch(getTransactions());
    } catch (error) {
      console.error('Error fetching wallet data:', error);
    }
  };

  const handleAddFunds = async () => {
    if (!amount || parseFloat(amount) <= 0) {
      Alert.alert('Error', 'Please enter a valid amount');
      return;
    }

    setIsSubmitting(true);
    try {
      await dispatch(addToWallet({ amount: parseFloat(amount), paymentMethod: 'card' })).unwrap();
      Alert.alert('Success', 'Funds added successfully');
      setShowAddModal(false);
      setAmount('');
      fetchWalletData();
    } catch (error) {
      Alert.alert('Error', error.message || 'Failed to add funds');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleWithdraw = async () => {
    if (!amount || parseFloat(amount) <= 0) {
      Alert.alert('Error', 'Please enter a valid amount');
      return;
    }

    if (parseFloat(amount) > walletBalance) {
      Alert.alert('Error', 'Insufficient balance');
      return;
    }

    setIsSubmitting(true);
    try {
      await dispatch(withdrawFromWallet({ amount: parseFloat(amount) })).unwrap();
      Alert.alert('Success', 'Withdrawal request submitted');
      setShowWithdrawModal(false);
      setAmount('');
      fetchWalletData();
    } catch (error) {
      Alert.alert('Error', error.message || 'Failed to process withdrawal');
    } finally {
      setIsSubmitting(false);
    }
  };

  const formatCurrency = (amount) => {
    return `Rs. ${amount?.toLocaleString() || 0}`;
  };

  const getTransactionIcon = (type) => {
    return type === 'credit' ? 'arrow-upward' : 'arrow-downward';
  };

  const getTransactionColor = (type) => {
    return type === 'credit' ? '#4ECDC4' : '#FF3B30';
  };

  const quickAmounts = [100, 500, 1000, 2000];

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
          contentContainerStyle={styles.scrollContent}
        >
          {/* Header */}
          <View style={styles.header}>
            <TouchableOpacity
              style={styles.backButton}
              onPress={() => navigation.goBack()}
              activeOpacity={0.7}
            >
              <Icon name="arrow-back" size={24} color={colors.text} />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>Wallet</Text>
            <TouchableOpacity
              style={styles.historyButton}
              onPress={() => Alert.alert('Transaction History', 'View full history')}
              activeOpacity={0.7}
            >
              <Icon name="history" size={22} color={colors.accent} />
            </TouchableOpacity>
          </View>

          {/* Balance Card */}
          <Animatable.View
            animation="fadeInUp"
            duration={800}
            delay={100}
            style={styles.balanceCard}
          >
            <LinearGradient
              colors={['#FFF8E8', '#c7e618ff']}
              style={styles.balanceGradient}
            >
              <View style={styles.balanceHeader}>
                <Text style={styles.balanceLabel}>Available Balance</Text>
                <View style={styles.balanceBadge}>
                  <IconMCI name="wallet" size={16} color={colors.accent} />
                  <Text style={styles.balanceBadgeText}>Wallet</Text>
                </View>
              </View>
              <Animated.View
                style={{
                  transform: [{ scale: scaleAnim }],
                }}
              >
                <Text style={styles.balanceAmount}>{formatCurrency(walletBalance)}</Text>
              </Animated.View>
              <View style={styles.balanceActions}>
                <TouchableOpacity
                  style={[styles.balanceAction, styles.addAction]}
                  onPress={() => {
                    navigation.navigate('Credits');
                  }}
                  activeOpacity={0.8}
                >
                  <LinearGradient
                    colors={[colors.accent, '#F7B731']}
                    style={styles.actionGradient}
                  >
                    <Icon name="add" size={20} color={colors.text} />
                    <Text style={styles.balanceActionText}>Add Funds</Text>
                  </LinearGradient>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.balanceAction, styles.withdrawAction]}
                  onPress={() => {
                    setShowWithdrawModal(true);
                    animateModal(true);
                  }}
                  activeOpacity={0.8}
                >
                  <View style={styles.withdrawGradient}>
                    <Icon name="remove" size={20} color={colors.text} />
                    <Text style={styles.balanceActionText}>Withdraw</Text>
                  </View>
                </TouchableOpacity>
              </View>
            </LinearGradient>
          </Animatable.View>

          {/* Quick Stats */}
          <Animatable.View
            animation="fadeInUp"
            duration={800}
            delay={200}
            style={styles.statsContainer}
          >
            <View style={styles.statCard}>
              <View style={[styles.statIcon, { backgroundColor: colors.accent + '18' }]}>
                <IconMCI name="cash" size={20} color={colors.accent} />
              </View>
              <View>
                <Text style={styles.statLabel}>Total Spent</Text>
                <Text style={styles.statValue}>{formatCurrency(0)}</Text>
              </View>
            </View>
            <View style={styles.statCard}>
              <View style={[styles.statIcon, { backgroundColor: '#E8F5F3' }]}>
                <IconMCI name="gift" size={20} color="#4ECDC4" />
              </View>
              <View>
                <Text style={styles.statLabel}>Rewards</Text>
                <Text style={styles.statValue}>0</Text>
              </View>
            </View>
          </Animatable.View>

          {/* Recent Transactions */}
          <Animatable.View
            animation="fadeInUp"
            duration={800}
            delay={300}
            style={styles.transactionsSection}
          >
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Recent Transactions</Text>
              <TouchableOpacity onPress={() => Alert.alert('View All', 'View all transactions')}>
                <Text style={styles.seeAll}>See All</Text>
              </TouchableOpacity>
            </View>

            {loading ? (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color={colors.accent} />
              </View>
            ) : transactions.length > 0 ? (
              transactions.slice(0, 5).map((transaction, index) => (
                <Animatable.View
                  key={index}
                  animation="fadeInUp"
                  duration={400}
                  delay={index * 80 + 300}
                >
                  <View style={styles.transactionItem}>
                    <View style={styles.transactionLeft}>
                      <View style={[styles.transactionIcon, { backgroundColor: getTransactionColor(transaction.type) + '15' }]}>
                        <Icon name={getTransactionIcon(transaction.type)} size={20} color={getTransactionColor(transaction.type)} />
                      </View>
                      <View>
                        <Text style={styles.transactionTitle}>
                          {transaction.type === 'penalty_fee' && transaction.metadata?.reason 
                            ? `Penalty (${transaction.metadata.reason.replace(/_/g, ' ')})`
                            : (transaction.description || transaction.type.replace(/_/g, ' ')).toUpperCase()}
                        </Text>
                        <Text style={styles.transactionDate}>
                          {new Date(transaction.createdAt).toLocaleDateString('en-PK', {
                            day: '2-digit',
                            month: 'short',
                            year: 'numeric'
                          })}
                        </Text>
                      </View>
                    </View>
                    <Text style={[
                      styles.transactionAmount,
                      { color: transaction.type === 'credit' ? '#4ECDC4' : '#FF3B30' }
                    ]}>
                      {transaction.type === 'credit' ? '+' : '-'}{formatCurrency(transaction.amount)}
                    </Text>
                  </View>
                </Animatable.View>
              ))
            ) : (
              <View style={styles.emptyTransactions}>
                <View style={styles.emptyIconContainer}>
                  <IconMCI name="cash-clock" size={64} color="#DDD" />
                </View>
                <Text style={styles.emptyText}>No transactions yet</Text>
                <Text style={styles.emptySubtext}>Your transactions will appear here</Text>
              </View>
            )}
          </Animatable.View>

          <View style={styles.bottomSpacer} />
        </ScrollView>
      </Animated.View>

      {/* Add Funds Modal */}
      <Modal
        transparent
        visible={showAddModal}
        animationType="none"
        onRequestClose={() => {
          setShowAddModal(false);
          animateModal(false);
        }}
      >
        <Animated.View
          style={[
            styles.modalOverlay,
            { opacity: modalFade }
          ]}
        >
          <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            style={styles.modalKeyboardView}
          >
            <Animated.View
              style={[
                styles.modalContent,
                { transform: [{ scale: modalScale }] }
              ]}
            >
              <View style={styles.modalHeader}>
                <View>
                  <Text style={styles.modalTitle}>Add Funds</Text>
                  <Text style={styles.modalSubtitle}>Enter amount to add to your wallet</Text>
                </View>
                <TouchableOpacity
                  style={styles.modalCloseButton}
                  onPress={() => {
                    setShowAddModal(false);
                    animateModal(false);
                  }}
                >
                  <Icon name="close" size={24} color={colors.text} />
                </TouchableOpacity>
              </View>

              <View style={styles.amountContainer}>
                <Text style={styles.currencySymbol}>Rs.</Text>
                <TextInput
                  style={styles.amountInput}
                  value={amount}
                  onChangeText={setAmount}
                  placeholder="0.00"
                  placeholderTextColor={colors.textSecondary}
                  keyboardType="numeric"
                  autoFocus
                />
              </View>

              <View style={styles.quickAmounts}>
                {quickAmounts.map((value) => (
                  <TouchableOpacity
                    key={value}
                    style={[styles.quickAmount, parseFloat(amount) === value && styles.quickAmountActive]}
                    onPress={() => setAmount(value.toString())}
                  >
                    <Text style={[styles.quickAmountText, parseFloat(amount) === value && styles.quickAmountTextActive]}>
                      Rs. {value}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              <View style={styles.modalButtons}>
                <TouchableOpacity
                  style={[styles.modalButton, styles.cancelButton]}
                  onPress={() => {
                    setShowAddModal(false);
                    animateModal(false);
                    setAmount('');
                  }}
                >
                  <Text style={styles.cancelButtonText}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.modalButton, styles.confirmButton]}
                  onPress={handleAddFunds}
                  disabled={isSubmitting}
                >
                  {isSubmitting ? (
                    <ActivityIndicator size="small" color={colors.text} />
                  ) : (
                    <Text style={styles.confirmButtonText}>Add Funds</Text>
                  )}
                </TouchableOpacity>
              </View>
            </Animated.View>
          </KeyboardAvoidingView>
        </Animated.View>
      </Modal>

      {/* Withdraw Modal */}
      <Modal
        transparent
        visible={showWithdrawModal}
        animationType="none"
        onRequestClose={() => {
          setShowWithdrawModal(false);
          animateModal(false);
        }}
      >
        <Animated.View
          style={[
            styles.modalOverlay,
            { opacity: modalFade }
          ]}
        >
          <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            style={styles.modalKeyboardView}
          >
            <Animated.View
              style={[
                styles.modalContent,
                { transform: [{ scale: modalScale }] }
              ]}
            >
              <View style={styles.modalHeader}>
                <View>
                  <Text style={styles.modalTitle}>Withdraw Funds</Text>
                  <Text style={styles.modalSubtitle}>Amount to withdraw from wallet</Text>
                </View>
                <TouchableOpacity
                  style={styles.modalCloseButton}
                  onPress={() => {
                    setShowWithdrawModal(false);
                    animateModal(false);
                  }}
                >
                  <Icon name="close" size={24} color={colors.text} />
                </TouchableOpacity>
              </View>

              <View style={styles.balanceInfo}>
                <IconMCI name="wallet" size={20} color={colors.accent} />
                <Text style={styles.balanceInfoText}>Available: {formatCurrency(walletBalance)}</Text>
              </View>

              <View style={styles.amountContainer}>
                <Text style={styles.currencySymbol}>Rs.</Text>
                <TextInput
                  style={styles.amountInput}
                  value={amount}
                  onChangeText={setAmount}
                  placeholder="0.00"
                  placeholderTextColor={colors.textSecondary}
                  keyboardType="numeric"
                  autoFocus
                />
              </View>

              <View style={styles.quickAmounts}>
                {quickAmounts.map((value) => (
                  <TouchableOpacity
                    key={value}
                    style={[styles.quickAmount, parseFloat(amount) === value && styles.quickAmountActive]}
                    onPress={() => setAmount(value.toString())}
                  >
                    <Text style={[styles.quickAmountText, parseFloat(amount) === value && styles.quickAmountTextActive]}>
                      Rs. {value}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              <View style={styles.modalButtons}>
                <TouchableOpacity
                  style={[styles.modalButton, styles.cancelButton]}
                  onPress={() => {
                    setShowWithdrawModal(false);
                    animateModal(false);
                    setAmount('');
                  }}
                >
                  <Text style={styles.cancelButtonText}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.modalButton, styles.withdrawConfirmButton]}
                  onPress={handleWithdraw}
                  disabled={isSubmitting}
                >
                  {isSubmitting ? (
                    <ActivityIndicator size="small" color="#FFF" />
                  ) : (
                    <Text style={styles.withdrawConfirmText}>Withdraw</Text>
                  )}
                </TouchableOpacity>
              </View>
            </Animated.View>
          </KeyboardAvoidingView>
        </Animated.View>
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
      backgroundColor: cardBg,
    },
    container: {
      flex: 1,
      backgroundColor: cardBg,
      marginTop: 34
    },
    scrollContent: {
      flexGrow: 1,
      paddingHorizontal: 20,
      paddingTop: 8,
      paddingBottom: 20,
    },
    header: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 20,
    },
    backButton: {
      padding: 4,
    },
    headerTitle: {
      fontSize: 22,
      fontWeight: '700',
      color: colors.text,
      flex: 1,
      marginLeft: 12,
    },
    historyButton: {
      padding: 4,
    },
    balanceCard: {
      borderRadius: 20,
      overflow: 'hidden',
      marginBottom: 20,
      borderWidth: 1,
      borderColor: colors.accent,
    },
    balanceGradient: {
      padding: 24,
    },
    balanceHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 8,
    },
    balanceLabel: {
      color: colors.textSecondary,
      fontSize: 14,
      fontWeight: '500',
    },
    balanceBadge: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: colors.accent + '18',
      paddingHorizontal: 10,
      paddingVertical: 4,
      borderRadius: 12,
      gap: 4,
    },
    balanceBadgeText: {
      color: colors.accent,
      fontSize: 11,
      fontWeight: '600',
    },
    balanceAmount: {
      color: colors.text,
      fontSize: 42,
      fontWeight: '800',
      marginVertical: 8,
    },
    balanceActions: {
      flexDirection: 'row',
      gap: 12,
      marginTop: 8,
    },
    balanceAction: {
      flex: 1,
      borderRadius: 25,
      overflow: 'hidden',
    },
    actionGradient: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      paddingVertical: 12,
      gap: 8,
    },
    withdrawGradient: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      paddingVertical: 12,
      backgroundColor: insetBg,
      gap: 8,
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: 25,
    },
    balanceActionText: {
      color: colors.text,
      fontSize: 14,
      fontWeight: '600',
    },
    statsContainer: {
      flexDirection: 'row',
      gap: 12,
      marginBottom: 24,
    },
    statCard: {
      flex: 1,
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: insetBg,
      padding: 14,
      borderRadius: 14,
      borderWidth: 1,
      borderColor: colors.border,
      gap: 12,
    },
    statIcon: {
      width: 40,
      height: 40,
      borderRadius: 20,
      justifyContent: 'center',
      alignItems: 'center',
    },
    statLabel: {
      color: colors.textSecondary,
      fontSize: 12,
    },
    statValue: {
      color: colors.text,
      fontSize: 16,
      fontWeight: '700',
    },
    transactionsSection: {
      flex: 1,
    },
    sectionHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 12,
    },
    sectionTitle: {
      color: colors.text,
      fontSize: 18,
      fontWeight: '700',
    },
    seeAll: {
      color: colors.accent,
      fontSize: 14,
      fontWeight: '600',
    },
    loadingContainer: {
      paddingVertical: 40,
      alignItems: 'center',
    },
    transactionItem: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      backgroundColor: insetBg,
      padding: 14,
      borderRadius: 12,
      marginBottom: 8,
      borderWidth: 1,
      borderColor: colors.border,
    },
    transactionLeft: {
      flexDirection: 'row',
      alignItems: 'center',
      flex: 1,
    },
    transactionIcon: {
      width: 40,
      height: 40,
      borderRadius: 20,
      justifyContent: 'center',
      alignItems: 'center',
      marginRight: 12,
    },
    transactionTitle: {
      color: colors.text,
      fontSize: 14,
      fontWeight: '500',
    },
    transactionDate: {
      color: colors.textSecondary,
      fontSize: 12,
      marginTop: 2,
    },
    transactionAmount: {
      fontSize: 16,
      fontWeight: '700',
    },
    emptyTransactions: {
      paddingVertical: 40,
      alignItems: 'center',
    },
    emptyIconContainer: {
      width: 80,
      height: 80,
      borderRadius: 40,
      backgroundColor: insetBg,
      justifyContent: 'center',
      alignItems: 'center',
      borderWidth: 1,
      borderColor: colors.border,
    },
    emptyText: {
      color: colors.text,
      fontSize: 16,
      fontWeight: '600',
      marginTop: 12,
    },
    emptySubtext: {
      color: colors.textSecondary,
      fontSize: 14,
      marginTop: 4,
    },
    bottomSpacer: {
      height: 10,
    },
    // Modal Styles
    modalOverlay: {
      flex: 1,
      backgroundColor: 'rgba(0, 0, 0, 0.5)',
      justifyContent: 'center',
      alignItems: 'center',
    },
    modalKeyboardView: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      width: '100%',
    },
    modalContent: {
      backgroundColor: cardBg,
      borderRadius: 24,
      padding: 24,
      width: width - 40,
    },
    modalHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'flex-start',
      marginBottom: 20,
    },
    modalTitle: {
      fontSize: 20,
      fontWeight: '700',
      color: colors.text,
    },
    modalSubtitle: {
      color: colors.textSecondary,
      fontSize: 14,
      marginTop: 2,
    },
    modalCloseButton: {
      padding: 4,
    },
    balanceInfo: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: colors.accent + '18',
      padding: 12,
      borderRadius: 12,
      marginBottom: 16,
      gap: 8,
    },
    balanceInfoText: {
      color: colors.text,
      fontSize: 14,
      fontWeight: '500',
    },
    amountContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: insetBg,
      borderRadius: 14,
      paddingHorizontal: 16,
      borderWidth: 1,
      borderColor: colors.border,
      marginBottom: 16,
    },
    currencySymbol: {
      color: colors.text,
      fontSize: 20,
      fontWeight: '700',
      marginRight: 8,
    },
    amountInput: {
      flex: 1,
      color: colors.text,
      fontSize: 24,
      paddingVertical: 14,
    },
    quickAmounts: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      marginBottom: 20,
      gap: 8,
    },
    quickAmount: {
      flex: 1,
      backgroundColor: insetBg,
      paddingVertical: 8,
      borderRadius: 10,
      alignItems: 'center',
      borderWidth: 1,
      borderColor: colors.border,
    },
    quickAmountActive: {
      backgroundColor: colors.accent + '18',
      borderColor: colors.accent,
    },
    quickAmountText: {
      color: colors.textSecondary,
      fontSize: 12,
      fontWeight: '500',
    },
    quickAmountTextActive: {
      color: colors.text,
      fontWeight: '700',
    },
    modalButtons: {
      flexDirection: 'row',
      gap: 12,
    },
    modalButton: {
      flex: 1,
      paddingVertical: 14,
      borderRadius: 12,
      alignItems: 'center',
      justifyContent: 'center',
    },
    cancelButton: {
      backgroundColor: insetBg,
      borderWidth: 1,
      borderColor: colors.border,
    },
    cancelButtonText: {
      color: colors.textSecondary,
      fontSize: 15,
      fontWeight: '600',
    },
    confirmButton: {
      backgroundColor: colors.accent,
    },
    confirmButtonText: {
      color: colors.text,
      fontSize: 15,
      fontWeight: '700',
    },
    withdrawConfirmButton: {
      backgroundColor: '#FF3B30',
    },
    withdrawConfirmText: {
      color: '#FFF',
      fontSize: 15,
      fontWeight: '700',
    },
  });
};

export default WalletScreen;