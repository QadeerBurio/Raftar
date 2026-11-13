import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useTheme } from '../../context/ThemeContext';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  SafeAreaView,
  StatusBar,
  Animated,
  Dimensions,
  Modal,
  TextInput,
  KeyboardAvoidingView,
  Platform
} from 'react-native';
import { useDispatch, useSelector } from 'react-redux';
import Icon from 'react-native-vector-icons/MaterialIcons';
import * as Animatable from 'react-native-animatable';
import { useNavigation } from '@react-navigation/native';
import { getPaymentMethods, addPaymentMethod, removePaymentMethod } from '../../redux/slices/paymentSlice';

const { width, height } = Dimensions.get('window');

const PaymentMethodsScreen = () => {
  const { colors, isDark } = useTheme();
  const styles = useMemo(() => createStyles(colors, isDark), [colors, isDark]);
  const navigation = useNavigation();
  const dispatch = useDispatch();
  const { paymentMethods = [], loading = false } = useSelector(state => state.payment || { paymentMethods: [], loading: false });
  
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedType, setSelectedType] = useState('card');
  const [cardNumber, setCardNumber] = useState('');
  const [cardHolder, setCardHolder] = useState('');
  const [expiryDate, setExpiryDate] = useState('');
  const [cvv, setCvv] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Animation values
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(30)).current;
  const modalScale = useRef(new Animated.Value(0.8)).current;
  const modalFade = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    animateEntrance();
    fetchPaymentMethods();
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

  const animateModal = (show) => {
    if (show) {
      setModalVisible(true);
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
      ]).start(() => {
        setModalVisible(false);
        resetForm();
      });
    }
  };

  const resetForm = () => {
    setCardNumber('');
    setCardHolder('');
    setExpiryDate('');
    setCvv('');
    setSelectedType('card');
    setIsSubmitting(false);
  };

  const fetchPaymentMethods = async () => {
    try {
      await dispatch(getPaymentMethods());
    } catch (error) {
      console.error('Error fetching payment methods:', error);
    }
  };

  const handleAddCard = () => {
    animateModal(true);
  };

  const handleCloseModal = () => {
    animateModal(false);
  };

  const handleSavePaymentMethod = async () => {
    // Basic validation
    if (!cardHolder.trim()) {
      Alert.alert('Error', 'Please enter card holder name');
      return;
    }
    if (!cardNumber.trim() || cardNumber.length < 16) {
      Alert.alert('Error', 'Please enter a valid card number');
      return;
    }
    if (!expiryDate.trim() || expiryDate.length < 5) {
      Alert.alert('Error', 'Please enter expiry date (MM/YY)');
      return;
    }
    if (!cvv.trim() || cvv.length < 3) {
      Alert.alert('Error', 'Please enter CVV');
      return;
    }

    setIsSubmitting(true);
    try {
      const methodData = {
        type: selectedType,
        name: cardHolder,
        last4: cardNumber.slice(-4),
        expiryDate: expiryDate,
        isDefault: paymentMethods.length === 0
      };
      await dispatch(addPaymentMethod(methodData)).unwrap();
      Alert.alert('Success', 'Payment method added successfully');
      animateModal(false);
      fetchPaymentMethods();
    } catch (error) {
      Alert.alert('Error', 'Failed to add payment method');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRemoveMethod = (methodId) => {
    Alert.alert(
      'Remove Payment Method',
      'Are you sure you want to remove this payment method?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: async () => {
            try {
              await dispatch(removePaymentMethod(methodId));
              fetchPaymentMethods();
            } catch (error) {
              Alert.alert('Error', 'Failed to remove payment method');
            }
          }
        }
      ]
    );
  };

  const getMethodIcon = (type) => {
    switch (type) {
      case 'card':
        return 'credit-card';
      case 'easypaisa':
        return 'phone-android';
      case 'jazzcash':
        return 'phone-android';
      default:
        return 'payment';
    }
  };

  const getMethodColor = (type) => {
    switch (type) {
      case 'card':
        return colors.accent;
      case 'easypaisa':
        return '#4ECDC4';
      case 'jazzcash':
        return '#45B7D1';
      default:
        return '#888';
    }
  };

  const getMethodDisplayName = (type) => {
    switch (type) {
      case 'card':
        return 'Credit/Debit Card';
      case 'easypaisa':
        return 'Easypaisa';
      case 'jazzcash':
        return 'JazzCash';
      default:
        return type.charAt(0).toUpperCase() + type.slice(1);
    }
  };

  const formatCardNumber = (text) => {
    const cleaned = text.replace(/\s/g, '');
    const groups = cleaned.match(/.{1,4}/g) || [];
    return groups.join(' ');
  };

  const formatExpiry = (text) => {
    const cleaned = text.replace(/\D/g, '');
    if (cleaned.length >= 2) {
      return `${cleaned.slice(0, 2)}/${cleaned.slice(2, 4)}`;
    }
    return cleaned;
  };

  const hasPaymentMethods = Array.isArray(paymentMethods) && paymentMethods.length > 0;

  if (loading) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <StatusBar barStyle={colors.statusBarStyle} backgroundColor={colors.background} />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.accent} />
          <Text style={styles.loadingText}>Loading payment methods...</Text>
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
          contentContainerStyle={styles.scrollContent}
        >
          {/* Header */}
          <View style={styles.header}>
            <TouchableOpacity 
              style={styles.backButton}
              onPress={() => navigation.goBack()}
            >
              <Icon name="arrow-back" size={24} color={colors.text} />
            </TouchableOpacity>
            <Text style={styles.title}>Payment Methods</Text>
            <TouchableOpacity 
              style={styles.addButton}
              onPress={handleAddCard}
              activeOpacity={0.8}
            >
              <View style={styles.addButtonInner}>
                <Icon name="add" size={20} color={colors.text} />
                <Text style={styles.addButtonText}>Add</Text>
              </View>
            </TouchableOpacity>
          </View>

          {/* Quick Add Cards */}
          <Animatable.View animation="fadeInUp" duration={600} delay={100} style={styles.quickAddContainer}>
            <Text style={styles.quickAddTitle}>Quick Add</Text>
            <View style={styles.quickAddGrid}>
              <TouchableOpacity style={styles.quickAddItem} onPress={handleAddCard}>
                <View style={[styles.quickAddIcon, { backgroundColor: colors.accent + '18' }]}>
                  <Icon name="credit-card" size={28} color={colors.accent} />
                </View>
                <Text style={styles.quickAddLabel}>Card</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.quickAddItem} onPress={handleAddCard}>
                <View style={[styles.quickAddIcon, { backgroundColor: '#E8F5F3' }]}>
                  <Icon name="phone-android" size={28} color="#4ECDC4" />
                </View>
                <Text style={styles.quickAddLabel}>Easypaisa</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.quickAddItem} onPress={handleAddCard}>
                <View style={[styles.quickAddIcon, { backgroundColor: '#E8F0F8' }]}>
                  <Icon name="phone-android" size={28} color="#45B7D1" />
                </View>
                <Text style={styles.quickAddLabel}>JazzCash</Text>
              </TouchableOpacity>
            </View>
          </Animatable.View>

          {/* Payment Methods List */}
          <Animatable.View animation="fadeInUp" duration={600} delay={200} style={styles.methodsSection}>
            <Text style={styles.sectionTitle}>Saved Methods</Text>
            
            {hasPaymentMethods ? (
              paymentMethods.map((method, index) => (
                <Animatable.View 
                  key={method.id || index} 
                  animation="fadeInUp" 
                  duration={500} 
                  delay={index * 100 + 200}
                >
                  <View style={styles.methodCard}>
                    <View style={styles.methodInfo}>
                      <View style={[styles.methodIcon, { backgroundColor: getMethodColor(method.type) + '15' }]}>
                        <Icon name={getMethodIcon(method.type)} size={24} color={getMethodColor(method.type)} />
                      </View>
                      <View style={styles.methodDetails}>
                        <Text style={styles.methodName}>{getMethodDisplayName(method.type)}</Text>
                        <View style={styles.methodMeta}>
                          {method.last4 && (
                            <Text style={styles.methodLast4}>****{method.last4}</Text>
                          )}
                          {method.isDefault && (
                            <View style={styles.defaultBadge}>
                              <Text style={styles.defaultBadgeText}>Default</Text>
                            </View>
                          )}
                        </View>
                      </View>
                    </View>
                    <TouchableOpacity
                      onPress={() => handleRemoveMethod(method.id)}
                      style={styles.removeButton}
                      activeOpacity={0.7}
                    >
                      <Icon name="delete-outline" size={24} color="#FF3B30" />
                    </TouchableOpacity>
                  </View>
                </Animatable.View>
              ))
            ) : (
              <View style={styles.emptyState}>
                <View style={styles.emptyIconContainer}>
                  <Icon name="payment" size={64} color="#DDD" />
                </View>
                <Text style={styles.emptyTitle}>No Payment Methods</Text>
                <Text style={styles.emptyText}>
                  Add a payment method to start booking rides
                </Text>
                <TouchableOpacity 
                  style={styles.emptyButton}
                  onPress={handleAddCard}
                >
                  <Text style={styles.emptyButtonText}>Add Payment Method</Text>
                  <Icon name="arrow-forward" size={18} color={colors.text} />
                </TouchableOpacity>
              </View>
            )}
          </Animatable.View>

          {/* Security Note */}
          <Animatable.View animation="fadeInUp" duration={600} delay={300} style={styles.securityNote}>
            <Icon name="security" size={20} color={colors.accent} />
            <Text style={styles.securityText}>
              Your payment information is secure and encrypted
            </Text>
          </Animatable.View>

          <View style={styles.bottomSpacer} />
        </ScrollView>
      </Animated.View>

      {/* Add Payment Modal */}
      <Modal
        transparent
        visible={modalVisible}
        animationType="none"
        onRequestClose={handleCloseModal}
      >
        <Animated.View 
          style={[
            styles.modalOverlay,
            {
              opacity: modalFade,
            }
          ]}
        >
          <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            style={styles.modalKeyboardView}
          >
            <Animated.View 
              style={[
                styles.modalContainer,
                {
                  transform: [{ scale: modalScale }],
                }
              ]}
            >
              {/* Modal Header */}
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>Add Payment Method</Text>
                <TouchableOpacity 
                  style={styles.modalCloseButton}
                  onPress={handleCloseModal}
                >
                  <Icon name="close" size={24} color={colors.text} />
                </TouchableOpacity>
              </View>

              {/* Payment Type Selector */}
              <View style={styles.typeSelector}>
                <TouchableOpacity
                  style={[
                    styles.typeOption,
                    selectedType === 'card' && styles.typeOptionActive
                  ]}
                  onPress={() => setSelectedType('card')}
                >
                  <Icon name="credit-card" size={20} color={selectedType === 'card' ? colors.accent : '#888'} />
                  <Text style={[
                    styles.typeOptionText,
                    selectedType === 'card' && styles.typeOptionTextActive
                  ]}>Card</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[
                    styles.typeOption,
                    selectedType === 'easypaisa' && styles.typeOptionActive
                  ]}
                  onPress={() => setSelectedType('easypaisa')}
                >
                  <Icon name="phone-android" size={20} color={selectedType === 'easypaisa' ? '#4ECDC4' : '#888'} />
                  <Text style={[
                    styles.typeOptionText,
                    selectedType === 'easypaisa' && styles.typeOptionTextActive
                  ]}>Easypaisa</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[
                    styles.typeOption,
                    selectedType === 'jazzcash' && styles.typeOptionActive
                  ]}
                  onPress={() => setSelectedType('jazzcash')}
                >
                  <Icon name="phone-android" size={20} color={selectedType === 'jazzcash' ? '#45B7D1' : '#888'} />
                  <Text style={[
                    styles.typeOptionText,
                    selectedType === 'jazzcash' && styles.typeOptionTextActive
                  ]}>JazzCash</Text>
                </TouchableOpacity>
              </View>

              {/* Form Fields */}
              <View style={styles.modalForm}>
                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>Card Holder Name</Text>
                  <View style={styles.inputContainer}>
                    <Icon name="person" size={20} color={colors.textSecondary} />
                    <TextInput
                      style={styles.input}
                      placeholder="John Doe"
                      placeholderTextColor={colors.textSecondary}
                      value={cardHolder}
                      onChangeText={setCardHolder}
                    />
                  </View>
                </View>

                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>Card Number</Text>
                  <View style={styles.inputContainer}>
                    <Icon name="credit-card" size={20} color={colors.textSecondary} />
                    <TextInput
                      style={styles.input}
                      placeholder="1234 5678 9012 3456"
                      placeholderTextColor={colors.textSecondary}
                      value={formatCardNumber(cardNumber)}
                      onChangeText={(text) => setCardNumber(text.replace(/\s/g, ''))}
                      keyboardType="numeric"
                      maxLength={19}
                    />
                  </View>
                </View>

                <View style={styles.inputRow}>
                  <View style={[styles.inputGroup, { flex: 1, marginRight: 12 }]}>
                    <Text style={styles.inputLabel}>Expiry Date</Text>
                    <View style={styles.inputContainer}>
                      <Icon name="calendar-today" size={20} color={colors.textSecondary} />
                      <TextInput
                        style={styles.input}
                        placeholder="MM/YY"
                        placeholderTextColor={colors.textSecondary}
                        value={formatExpiry(expiryDate)}
                        onChangeText={(text) => setExpiryDate(text.replace(/\D/g, ''))}
                        keyboardType="numeric"
                        maxLength={5}
                      />
                    </View>
                  </View>
                  <View style={[styles.inputGroup, { flex: 1 }]}>
                    <Text style={styles.inputLabel}>CVV</Text>
                    <View style={styles.inputContainer}>
                      <Icon name="lock" size={20} color={colors.textSecondary} />
                      <TextInput
                        style={styles.input}
                        placeholder="123"
                        placeholderTextColor={colors.textSecondary}
                        value={cvv}
                        onChangeText={setCvv}
                        keyboardType="numeric"
                        maxLength={4}
                        secureTextEntry
                      />
                    </View>
                  </View>
                </View>
              </View>

              {/* Modal Actions */}
              <View style={styles.modalActions}>
                <TouchableOpacity
                  style={[styles.modalButton, styles.cancelButton]}
                  onPress={handleCloseModal}
                  disabled={isSubmitting}
                >
                  <Text style={styles.cancelButtonText}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.modalButton, styles.saveButton]}
                  onPress={handleSavePaymentMethod}
                  disabled={isSubmitting}
                >
                  {isSubmitting ? (
                    <ActivityIndicator size="small" color={colors.text} />
                  ) : (
                    <Text style={styles.saveButtonText}>Add Payment</Text>
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
    marginTop:34
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 20,
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
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },
  backButton: {
    padding: 4,
  },
  title: {
    fontSize: 22,
    fontWeight: '700',
    color: colors.text,
    flex: 1,
    marginLeft: 12,
  },
  addButton: {
    backgroundColor: colors.accent,
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
  addButtonInner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  addButtonText: {
    color: colors.text,
    fontSize: 14,
    fontWeight: '600',
  },
  quickAddContainer: {
    marginBottom: 24,
  },
  quickAddTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.textSecondary,
    marginBottom: 12,
  },
  quickAddGrid: {
    flexDirection: 'row',
    gap: 12,
  },
  quickAddItem: {
    flex: 1,
    alignItems: 'center',
    backgroundColor: insetBg,
    paddingVertical: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
  },
  quickAddIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  quickAddLabel: {
    color: colors.text,
    fontSize: 12,
    fontWeight: '500',
  },
  methodsSection: {
    flex: 1,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 12,
  },
  methodCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: insetBg,
    padding: 16,
    borderRadius: 16,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: colors.border,
  },
  methodInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  methodIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14,
  },
  methodDetails: {
    flex: 1,
  },
  methodName: {
    color: colors.text,
    fontSize: 16,
    fontWeight: '600',
  },
  methodMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 2,
  },
  methodLast4: {
    color: colors.textSecondary,
    fontSize: 13,
  },
  defaultBadge: {
    backgroundColor: colors.accent,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
  },
  defaultBadgeText: {
    color: colors.text,
    fontSize: 10,
    fontWeight: '700',
  },
  removeButton: {
    padding: 8,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 40,
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
  securityNote: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginTop: 16,
    paddingVertical: 12,
    backgroundColor: colors.accent + '18',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.accent,
  },
  securityText: {
    color: colors.textSecondary,
    fontSize: 13,
    fontWeight: '500',
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
  modalContainer: {
    backgroundColor: cardBg,
    borderRadius: 24,
    padding: 24,
    width: width - 40,
    maxHeight: height * 0.8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.2,
    shadowRadius: 20,
    elevation: 10,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.text,
  },
  modalCloseButton: {
    padding: 4,
  },
  typeSelector: {
    flexDirection: 'row',
    backgroundColor: insetBg,
    borderRadius: 12,
    padding: 4,
    marginBottom: 20,
  },
  typeOption: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    borderRadius: 8,
    gap: 6,
  },
  typeOptionActive: {
    backgroundColor: cardBg,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },
  typeOptionText: {
    color: colors.textSecondary,
    fontSize: 12,
    fontWeight: '500',
  },
  typeOptionTextActive: {
    color: colors.text,
    fontWeight: '700',
  },
  modalForm: {
    marginBottom: 20,
  },
  inputGroup: {
    marginBottom: 14,
  },
  inputLabel: {
    color: colors.text,
    fontSize: 13,
    fontWeight: '600',
    marginBottom: 6,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: insetBg,
    borderRadius: 12,
    paddingHorizontal: 14,
    borderWidth: 1,
    borderColor: colors.border,
    height: 48,
    gap: 10,
  },
  input: {
    flex: 1,
    fontSize: 14,
    color: colors.text,
    height: '100%',
  },
  inputRow: {
    flexDirection: 'row',
  },
  modalActions: {
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
  saveButton: {
    backgroundColor: colors.accent,
  },
  saveButtonText: {
    color: colors.text,
    fontSize: 15,
    fontWeight: '700',
  },
  });
};

export default PaymentMethodsScreen;