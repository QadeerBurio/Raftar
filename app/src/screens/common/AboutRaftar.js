import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useTheme } from '../../context/ThemeContext';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  StatusBar,
  Animated,
  Dimensions,
  Image,
  Linking,
  Alert
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import IconIonic from 'react-native-vector-icons/Ionicons';
import IconFA from 'react-native-vector-icons/FontAwesome5';
import IconMCI from 'react-native-vector-icons/MaterialCommunityIcons';
import * as Animatable from 'react-native-animatable';
import { LinearGradient } from 'expo-linear-gradient';
import { useNavigation } from '@react-navigation/native';

const { width, height } = Dimensions.get('window');

const AboutRaftar = () => {
  const { colors, isDark } = useTheme();
  const styles = useMemo(() => createStyles(colors, isDark), [colors, isDark]);
  const navigation = useNavigation();

  // Animation values
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(30)).current;
  const scaleAnim = useRef(new Animated.Value(0.9)).current;
  const rotateAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    animateEntrance();
    animateRotation();
  }, []);

  const animateEntrance = () => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 800,
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

  const animateRotation = () => {
    Animated.loop(
      Animated.timing(rotateAnim, {
        toValue: 1,
        duration: 20000,
        useNativeDriver: true,
      })
    ).start();
  };

  const rotateInterpolate = rotateAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  const features = [
    {
      id: 1,
      icon: 'car',
      iconType: 'material-community',
      title: 'Safe Rides',
      description: 'Verified drivers with thorough background checks for your safety',
      gradient: ['#FFF8E8', '#FFF0D6']
    },
    {
      id: 2,
      icon: 'people',
      iconType: 'ionicon',
      title: 'Carpool Sharing',
      description: 'Share rides with others and save money while reducing traffic',
      gradient: ['#E8F5F3', '#D4EFEB']
    },
    {
      id: 3,
      icon: 'local-shipping',
      iconType: 'material',
      title: 'Parcel Delivery',
      description: 'Fast and reliable parcel delivery across the city',
      gradient: ['#E8F0F8', '#D4E4F0']
    },
    {
      id: 4,
      icon: 'map',
      iconType: 'material',
      title: 'Intercity Travel',
      description: 'Travel between cities comfortably and affordably',
      gradient: ['#F5E8F8', '#EED4F5']
    },
    {
      id: 5,
      icon: 'shield-check',
      iconType: 'material-community',
      title: 'Insurance Coverage',
      description: 'Every ride is covered with comprehensive insurance',
      gradient: ['#E8F5F0', '#D4EFE5']
    },
    {
      id: 6,
      icon: 'headset',
      iconType: 'material-community',
      title: '24/7 Support',
      description: 'Our support team is always here to help you',
      gradient: ['#FFF0E8', '#FFE4D4']
    }
  ];

  const stats = [
    { id: 1, value: '50K+', label: 'Happy Riders', icon: 'happy', color: colors.accent },
    { id: 2, value: '100K+', label: 'Rides Completed', icon: 'car', color: '#4ECDC4' },
    { id: 3, value: '4.8', label: 'Average Rating', icon: 'star', color: '#FF6B6B' },
    { id: 4, value: '24/7', label: 'Support Available', icon: 'headset', color: '#45B7D1' }
  ];

  const achievements = [
    { id: 1, icon: 'award', label: 'Best Ride App 2024', color: colors.accent },
    { id: 2, icon: 'verified', label: 'ISO Certified', color: '#4ECDC4' },
    { id: 3, icon: 'shield', label: 'Secure Platform', color: '#45B7D1' }
  ];

  const getIcon = (icon, iconType, size, color) => {
    switch (iconType) {
      case 'material':
        return <Icon name={icon} size={size} color={color} />;
      case 'ionicon':
        return <IconIonic name={icon} size={size} color={color} />;
      case 'material-community':
        return <IconMCI name={icon} size={size} color={color} />;
      case 'fontawesome':
        return <IconFA name={icon} size={size} color={color} />;
      default:
        return <Icon name={icon} size={size} color={color} />;
    }
  };

  const handlePressLink = (url) => {
    Linking.openURL(url).catch(() => {
      Alert.alert('Error', 'Unable to open link');
    });
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
              activeOpacity={0.7}
            >
              <Icon name="arrow-back" size={24} color={colors.text} />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>About Raftar</Text>
            <TouchableOpacity
              style={styles.shareButton}
              onPress={() => Alert.alert('Share', 'Share Raftar with friends!')}
              activeOpacity={0.7}
            >
              <Icon name="share" size={22} color={colors.text} />
            </TouchableOpacity>
          </View>

          {/* Hero Section */}
          <Animatable.View
            animation="fadeInUp"
            duration={800}
            delay={100}
            style={styles.heroSection}
          >
            <LinearGradient
              colors={['#FFF8E8', '#FFFFFF']}
              style={styles.heroGradient}
            >
              <Animated.View
                style={{
                  transform: [{ scale: scaleAnim }],
                }}
              >
                <View style={styles.logoContainer}>
                  <View style={styles.logoWrapper}>
                    <Animated.View
                      style={{
                        transform: [{ rotate: rotateInterpolate }],
                      }}
                    >
                      <IconMCI name="car-multiple" size={50} color={colors.accent} />
                    </Animated.View>
                  </View>
                  <Text style={styles.logoText}>Raftar</Text>
                  <View style={styles.logoBadge}>
                    <Text style={styles.logoBadgeText}>v2.0</Text>
                  </View>
                </View>
              </Animated.View>
              <Text style={styles.tagline}>Har Safar, Aap Ke Saath</Text>
              <Text style={styles.taglineSub}>Pakistan's Own Ride</Text>
            </LinearGradient>
          </Animatable.View>

          {/* Quick Stats */}
          <Animatable.View
            animation="fadeInUp"
            duration={800}
            delay={150}
            style={styles.quickStatsContainer}
          >
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.quickStatsScroll}
            >
              {stats.map((stat) => (
                <View key={stat.id} style={[styles.quickStatCard, { borderColor: stat.color + '40' }]}>
                  <View style={[styles.quickStatIcon, { backgroundColor: stat.color + '15' }]}>
                    <IconMCI name={stat.icon} size={24} color={stat.color} />
                  </View>
                  <Text style={styles.quickStatValue}>{stat.value}</Text>
                  <Text style={styles.quickStatLabel}>{stat.label}</Text>
                </View>
              ))}
            </ScrollView>
          </Animatable.View>

          {/* Description */}
          <Animatable.View
            animation="fadeInUp"
            duration={800}
            delay={200}
            style={styles.descriptionSection}
          >
            <View style={styles.sectionHeader}>
              <View style={styles.sectionHeaderLine} />
              <Text style={styles.sectionTitle}>Who We Are</Text>
            </View>
            <Text style={styles.descriptionText}>
              Raftar is Pakistan's premier ride-hailing platform, connecting thousands of 
              riders with reliable drivers across the country. We're committed to making 
              transportation safe, affordable, and accessible for everyone.
            </Text>
            <View style={styles.missionCard}>
              <LinearGradient
                colors={['#FFF8E8', '#FFFFFF']}
                style={styles.missionGradient}
              >
                <IconMCI name="rocket-launch" size={28} color={colors.accent} />
                <Text style={styles.missionText}>
                  Our mission is to revolutionize the way Pakistan travels by providing 
                  innovative mobility solutions that are safe, reliable, and sustainable.
                </Text>
              </LinearGradient>
            </View>
          </Animatable.View>

          {/* Achievements */}
          <Animatable.View
            animation="fadeInUp"
            duration={800}
            delay={250}
            style={styles.achievementsSection}
          >
            <View style={styles.sectionHeader}>
              <View style={styles.sectionHeaderLine} />
              <Text style={styles.sectionTitle}>Achievements</Text>
            </View>
            <View style={styles.achievementsGrid}>
              {achievements.map((item) => (
                <View key={item.id} style={[styles.achievementCard, { borderColor: item.color + '40' }]}>
                  <View style={[styles.achievementIcon, { backgroundColor: item.color + '15' }]}>
                    <IconMCI name={item.icon} size={24} color={item.color} />
                  </View>
                  <Text style={styles.achievementLabel}>{item.label}</Text>
                </View>
              ))}
            </View>
          </Animatable.View>

          {/* Features Section */}
          <Animatable.View
            animation="fadeInUp"
            duration={800}
            delay={300}
            style={styles.featuresSection}
          >
            <View style={styles.sectionHeader}>
              <View style={styles.sectionHeaderLine} />
              <Text style={styles.sectionTitle}>Why Choose Raftar</Text>
            </View>
            <View style={styles.featuresGrid}>
              {features.map((feature, index) => (
                <Animatable.View
                  key={feature.id}
                  animation="fadeInUp"
                  duration={600}
                  delay={index * 80 + 300}
                  style={styles.featureCard}
                >
                  <LinearGradient
                    colors={feature.gradient}
                    style={styles.featureGradient}
                  >
                    <View style={styles.featureIconContainer}>
                      {getIcon(feature.icon, feature.iconType, 28, colors.accent)}
                    </View>
                    <Text style={styles.featureTitle}>{feature.title}</Text>
                    <Text style={styles.featureDescription}>{feature.description}</Text>
                  </LinearGradient>
                </Animatable.View>
              ))}
            </View>
          </Animatable.View>

          {/* Contact & Social */}
          <Animatable.View
            animation="fadeInUp"
            duration={800}
            delay={500}
            style={styles.contactSection}
          >
            <Text style={styles.contactTitle}>Connect With Us</Text>
            <Text style={styles.contactSubtitle}>Follow us on social media</Text>
            <View style={styles.socialLinks}>
              <TouchableOpacity style={styles.socialLink} onPress={() => handlePressLink('https://facebook.com')} activeOpacity={0.7}>
                <LinearGradient
                  colors={['#1877F2', '#0D65D9']}
                  style={styles.socialIconGradient}
                >
                  <IconFA name="facebook-f" size={22} color="#FFF" />
                </LinearGradient>
              </TouchableOpacity>
              <TouchableOpacity style={styles.socialLink} onPress={() => handlePressLink('https://twitter.com')} activeOpacity={0.7}>
                <LinearGradient
                  colors={['#1DA1F2', '#0D8BD9']}
                  style={styles.socialIconGradient}
                >
                  <IconFA name="twitter" size={22} color="#FFF" />
                </LinearGradient>
              </TouchableOpacity>
              <TouchableOpacity style={styles.socialLink} onPress={() => handlePressLink('https://instagram.com')} activeOpacity={0.7}>
                <LinearGradient
                  colors={['#E4405F', '#C13584']}
                  style={styles.socialIconGradient}
                >
                  <IconFA name="instagram" size={22} color="#FFF" />
                </LinearGradient>
              </TouchableOpacity>
              <TouchableOpacity style={styles.socialLink} onPress={() => handlePressLink('https://youtube.com')} activeOpacity={0.7}>
                <LinearGradient
                  colors={['#FF0000', '#CC0000']}
                  style={styles.socialIconGradient}
                >
                  <IconFA name="youtube" size={22} color="#FFF" />
                </LinearGradient>
              </TouchableOpacity>
            </View>
          </Animatable.View>

          {/* Footer */}
          <Animatable.View
            animation="fadeInUp"
            duration={800}
            delay={600}
            style={styles.footer}
          >
            <View style={styles.footerDivider} />
            <Text style={styles.footerText}>© 2024 Raftar. All rights reserved.</Text>
            <Text style={styles.footerSubtext}>Made with ❤️ in Pakistan</Text>
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
    marginBottom: 16,
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
    marginLeft: 4,
  },
  shareButton: {
    padding: 8,
    marginRight: -8,
  },
  heroSection: {
    marginBottom: 24,
    borderRadius: 20,
    overflow: 'hidden',
  },
  heroGradient: {
    padding: 30,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.accent,
    borderRadius: 20,
  },
  logoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  logoWrapper: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: colors.accent + '18',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: colors.accent,
  },
  logoText: {
    fontSize: 40,
    fontWeight: '800',
    color: colors.accent,
    letterSpacing: 1.5,
  },
  logoBadge: {
    backgroundColor: colors.accent,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    alignSelf: 'flex-start',
  },
  logoBadgeText: {
    color: colors.text,
    fontSize: 12,
    fontWeight: '700',
  },
  tagline: {
    fontSize: 18,
    color: colors.textSecondary,
    marginTop: 12,
    fontWeight: '600',
  },
  taglineSub: {
    fontSize: 14,
    color: colors.textSecondary,
    marginTop: 4,
  },
  quickStatsContainer: {
    marginBottom: 24,
  },
  quickStatsScroll: {
    paddingHorizontal: 4,
    gap: 12,
  },
  quickStatCard: {
    minWidth: 90,
    backgroundColor: insetBg,
    padding: 14,
    borderRadius: 14,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border,
    marginRight: 12,
  },
  quickStatIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 6,
  },
  quickStatValue: {
    fontSize: 18,
    fontWeight: '800',
    color: colors.text,
  },
  quickStatLabel: {
    fontSize: 11,
    color: colors.textSecondary,
    marginTop: 2,
  },
  descriptionSection: {
    marginBottom: 28,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 14,
    gap: 10,
  },
  sectionHeaderLine: {
    width: 4,
    height: 24,
    backgroundColor: colors.accent,
    borderRadius: 2,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.text,
  },
  descriptionText: {
    fontSize: 15,
    color: colors.textSecondary,
    lineHeight: 24,
    marginBottom: 14,
  },
  missionCard: {
    borderRadius: 14,
    overflow: 'hidden',
  },
  missionGradient: {
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    borderWidth: 1,
    borderColor: colors.accent,
    borderRadius: 14,
  },
  missionText: {
    flex: 1,
    fontSize: 14,
    color: '#555',
    lineHeight: 22,
  },
  achievementsSection: {
    marginBottom: 28,
  },
  achievementsGrid: {
    flexDirection: 'row',
    gap: 12,
  },
  achievementCard: {
    flex: 1,
    backgroundColor: insetBg,
    padding: 14,
    borderRadius: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border,
  },
  achievementIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 6,
  },
  achievementLabel: {
    fontSize: 12,
    color: colors.textSecondary,
    textAlign: 'center',
    fontWeight: '500',
  },
  featuresSection: {
    marginBottom: 28,
  },
  featuresGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  featureCard: {
    flex: 1,
    minWidth: '45%',
    borderRadius: 14,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: colors.border,
  },
  featureGradient: {
    padding: 16,
    alignItems: 'center',
  },
  featureIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: colors.accent + '18',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 10,
    borderWidth: 1,
    borderColor: colors.accent,
  },
  featureTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 4,
    textAlign: 'center',
  },
  featureDescription: {
    fontSize: 12,
    color: colors.textSecondary,
    lineHeight: 18,
    textAlign: 'center',
  },
  contactSection: {
    marginBottom: 24,
    alignItems: 'center',
  },
  contactTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 4,
  },
  contactSubtitle: {
    fontSize: 14,
    color: colors.textSecondary,
    marginBottom: 16,
  },
  socialLinks: {
    flexDirection: 'row',
    gap: 16,
  },
  socialLink: {
    alignItems: 'center',
  },
  socialIconGradient: {
    width: 54,
    height: 54,
    borderRadius: 27,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 4,
  },
  footer: {
    alignItems: 'center',
    paddingVertical: 16,
  },
  footerDivider: {
    width: 60,
    height: 3,
    backgroundColor: colors.accent,
    borderRadius: 2,
    marginBottom: 12,
  },
  footerText: {
    fontSize: 14,
    color: colors.textSecondary,
    fontWeight: '500',
  },
  footerSubtext: {
    fontSize: 13,
    color: colors.textSecondary,
    marginTop: 4,
  },
  bottomSpacer: {
    height: 10,
  },
  });
};

export default AboutRaftar;