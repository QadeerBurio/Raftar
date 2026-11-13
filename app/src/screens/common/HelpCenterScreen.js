import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useTheme } from '../../context/ThemeContext';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Linking,
  TextInput,
  SafeAreaView,
  StatusBar,
  Animated,
  Dimensions
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import * as Animatable from 'react-native-animatable';
import { useNavigation } from '@react-navigation/native';

const { width, height } = Dimensions.get('window');

const HelpCenterScreen = () => {
  const { colors, isDark } = useTheme();
  const styles = useMemo(() => createStyles(colors, isDark), [colors, isDark]);
  const navigation = useNavigation();
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedFaq, setExpandedFaq] = useState(null);

  // Animation values
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(30)).current;

  useEffect(() => {
    animateEntrance();
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

  const faqs = [
    {
      id: 1,
      question: 'How do I book a ride?',
      answer: 'Open the app, select your pickup location, destination, choose a vehicle type, and confirm your booking. You can track your driver in real-time.'
    },
    {
      id: 2,
      question: 'How do I cancel a ride?',
      answer: 'Go to your active ride, tap on "Cancel Ride" and confirm. Please note that cancellation fees may apply based on the timing.'
    },
    {
      id: 3,
      question: 'What payment methods are accepted?',
      answer: 'We accept Cash, Easypaisa, JazzCash, Raast, and Wallet payments. You can also save multiple payment methods in your account.'
    },
    {
      id: 4,
      question: 'How does carpooling work?',
      answer: 'Carpooling allows you to share a ride with others going in the same direction. You can book a seat instead of the whole vehicle, saving money.'
    },
    {
      id: 5,
      question: 'Is my ride insured?',
      answer: 'Yes, all rides are covered under our comprehensive insurance policy. In case of any incident, please contact our support team immediately.'
    },
    {
      id: 6,
      question: 'How do I track my driver?',
      answer: 'Once your ride is confirmed, you can track your driver\'s location in real-time on the map. You\'ll also receive notifications about their arrival.'
    },
    {
      id: 7,
      question: 'What if I leave something in the car?',
      answer: 'Contact our support team immediately with your ride details. We\'ll help you locate your lost item and arrange for its return.'
    }
  ];

  const filteredFaqs = faqs.filter(faq =>
    faq.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
    faq.answer.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const toggleFaq = (id) => {
    setExpandedFaq(expandedFaq === id ? null : id);
  };

  const handleContactSupport = () => {
    Linking.openURL('mailto:support@raftar.com');
  };

  const handleCallSupport = () => {
    Linking.openURL('tel:+92123456789');
  };

  const handleChatSupport = () => {
    // Navigate to chat or open chat modal
    Alert.alert('Chat Support', 'Our support team is available 24/7');
  };

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
            <Text style={styles.headerTitle}>Help Center</Text>
            <View style={styles.headerRight} />
          </View>

          {/* Search Bar */}
          <Animatable.View animation="fadeInUp" duration={600} delay={100} style={styles.searchContainer}>
            <Icon name="search" size={22} color={colors.textSecondary} />
            <TextInput
              style={styles.searchInput}
              placeholder="Search help articles..."
              placeholderTextColor={colors.textSecondary}
              value={searchQuery}
              onChangeText={setSearchQuery}
            />
            {searchQuery.length > 0 && (
              <TouchableOpacity onPress={() => setSearchQuery('')}>
                <Icon name="close" size={20} color={colors.textSecondary} />
              </TouchableOpacity>
            )}
          </Animatable.View>

          {/* Quick Contact */}
          <Animatable.View animation="fadeInUp" duration={600} delay={200} style={styles.quickContact}>
            <View style={styles.quickContactHeader}>
              <Icon name="support-agent" size={24} color={colors.accent} />
              <Text style={styles.quickContactTitle}>Need immediate help?</Text>
            </View>
            <Text style={styles.quickContactSubtitle}>Our support team is available 24/7</Text>
            <View style={styles.contactButtons}>
              <TouchableOpacity style={styles.contactButton} onPress={handleCallSupport}>
                <View style={[styles.contactIcon, { backgroundColor: colors.accent + '18' }]}>
                  <Icon name="phone" size={24} color={colors.accent} />
                </View>
                <Text style={styles.contactButtonText}>Call</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.contactButton} onPress={handleContactSupport}>
                <View style={[styles.contactIcon, { backgroundColor: '#E8F5F3' }]}>
                  <Icon name="email" size={24} color="#4ECDC4" />
                </View>
                <Text style={styles.contactButtonText}>Email</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.contactButton} onPress={handleChatSupport}>
                <View style={[styles.contactIcon, { backgroundColor: '#E8F0F8' }]}>
                  <Icon name="chat" size={24} color="#45B7D1" />
                </View>
                <Text style={styles.contactButtonText}>Chat</Text>
              </TouchableOpacity>
            </View>
          </Animatable.View>

          {/* FAQs */}
          <Animatable.View animation="fadeInUp" duration={600} delay={300} style={styles.faqSection}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Frequently Asked Questions</Text>
              <Text style={styles.sectionCount}>{filteredFaqs.length} articles</Text>
            </View>
            
            {filteredFaqs.length > 0 ? (
              filteredFaqs.map((faq, index) => (
                <Animatable.View 
                  key={faq.id} 
                  animation="fadeInUp" 
                  duration={400} 
                  delay={index * 80 + 300}
                >
                  <TouchableOpacity
                    style={styles.faqItem}
                    onPress={() => toggleFaq(faq.id)}
                    activeOpacity={0.7}
                  >
                    <View style={styles.faqHeader}>
                      <View style={styles.faqQuestionContainer}>
                        <View style={styles.faqNumber}>
                          <Text style={styles.faqNumberText}>{faq.id}</Text>
                        </View>
                        <Text style={styles.faqQuestion}>{faq.question}</Text>
                      </View>
                      <Icon
                        name={expandedFaq === faq.id ? 'expand-less' : 'expand-more'}
                        size={24}
                        color={colors.textSecondary}
                      />
                    </View>
                    {expandedFaq === faq.id && (
                      <View style={styles.faqAnswerContainer}>
                        <Text style={styles.faqAnswer}>{faq.answer}</Text>
                      </View>
                    )}
                  </TouchableOpacity>
                </Animatable.View>
              ))
            ) : (
              <View style={styles.noResults}>
                <Icon name="search-off" size={48} color="#DDD" />
                <Text style={styles.noResultsText}>No results found</Text>
                <Text style={styles.noResultsSubtext}>Try adjusting your search terms</Text>
              </View>
            )}
          </Animatable.View>

          {/* Report Issue Button */}
          <Animatable.View animation="fadeInUp" duration={600} delay={400} style={styles.reportContainer}>
            <TouchableOpacity
              style={styles.reportButton}
              onPress={() => {}}
              activeOpacity={0.8}
            >
              <View style={styles.reportButtonInner}>
                <Icon name="report-problem" size={20} color={colors.text} />
                <Text style={styles.reportButtonText}>Report an Issue</Text>
              </View>
            </TouchableOpacity>
          </Animatable.View>

          {/* Support Hours */}
          <Animatable.View animation="fadeInUp" duration={600} delay={500} style={styles.supportHours}>
            <View style={styles.supportHoursRow}>
              <Icon name="schedule" size={18} color={colors.accent} />
              <Text style={styles.supportHoursText}>Support Available 24/7</Text>
            </View>
            <Text style={styles.supportHoursSubtext}>Average response time: 2-5 minutes</Text>
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
    marginTop:34
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
  headerRight: {
    width: 32,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: insetBg,
    borderRadius: 12,
    paddingHorizontal: 14,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: colors.border,
    height: 50,
  },
  searchInput: {
    flex: 1,
    color: colors.text,
    paddingVertical: 12,
    paddingHorizontal: 10,
    fontSize: 15,
  },
  quickContact: {
    backgroundColor: insetBg,
    borderRadius: 16,
    padding: 20,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: colors.border,
  },
  quickContactHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 4,
  },
  quickContactTitle: {
    color: colors.text,
    fontSize: 16,
    fontWeight: '700',
  },
  quickContactSubtitle: {
    color: colors.textSecondary,
    fontSize: 13,
    marginBottom: 16,
    marginLeft: 34,
  },
  contactButtons: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: 4,
  },
  contactButton: {
    alignItems: 'center',
    gap: 6,
  },
  contactIcon: {
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
  },
  contactButtonText: {
    color: colors.text,
    fontSize: 12,
    fontWeight: '500',
  },
  faqSection: {
    marginBottom: 20,
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
  sectionCount: {
    color: colors.textSecondary,
    fontSize: 13,
    fontWeight: '500',
  },
  faqItem: {
    backgroundColor: insetBg,
    borderRadius: 12,
    padding: 16,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: colors.border,
  },
  faqHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  faqQuestionContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: 10,
  },
  faqNumber: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: colors.accent + '18',
    justifyContent: 'center',
    alignItems: 'center',
  },
  faqNumberText: {
    color: colors.accent,
    fontSize: 12,
    fontWeight: '700',
  },
  faqQuestion: {
    color: colors.text,
    fontSize: 14,
    fontWeight: '600',
    flex: 1,
  },
  faqAnswerContainer: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  faqAnswer: {
    color: colors.textSecondary,
    fontSize: 14,
    lineHeight: 22,
  },
  noResults: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  noResultsText: {
    color: colors.text,
    fontSize: 18,
    fontWeight: '600',
    marginTop: 12,
  },
  noResultsSubtext: {
    color: colors.textSecondary,
    fontSize: 14,
    marginTop: 4,
  },
  reportContainer: {
    marginBottom: 16,
  },
  reportButton: {
    backgroundColor: colors.accent,
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
  },
  reportButtonInner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  reportButtonText: {
    color: colors.text,
    fontSize: 16,
    fontWeight: '600',
  },
  supportHours: {
    alignItems: 'center',
    paddingVertical: 16,
  },
  supportHoursRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  supportHoursText: {
    color: colors.text,
    fontSize: 14,
    fontWeight: '500',
  },
  supportHoursSubtext: {
    color: colors.textSecondary,
    fontSize: 12,
    marginTop: 4,
  },
  bottomSpacer: {
    height: 10,
  },
  });
};

export default HelpCenterScreen;