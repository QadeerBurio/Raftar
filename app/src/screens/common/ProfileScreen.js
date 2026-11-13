import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useTheme } from '../../context/ThemeContext';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  Image,
  Switch,
  Animated,
  Dimensions,
  StatusBar,
  SafeAreaView,
  Platform,
  ActivityIndicator,
  Modal,
  Pressable,
  Easing
} from 'react-native';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigation } from '@react-navigation/native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import IconIonic from 'react-native-vector-icons/Ionicons';
import IconFA from 'react-native-vector-icons/FontAwesome5';
import IconMCI from 'react-native-vector-icons/MaterialCommunityIcons';
import * as ImagePicker from 'expo-image-picker';
import { LinearGradient } from 'expo-linear-gradient';
import * as Animatable from 'react-native-animatable';
import Input from '../../components/common/Input';
import Button from '../../components/common/Button';
import { logout } from '../../redux/slices/authSlice';
import { updateProfile } from '../../redux/slices/userSlice';

const { width, height } = Dimensions.get('window');

const ProfileScreen = () => {
  const { colors, isDark } = useTheme();
  const styles = useMemo(() => createStyles(colors, isDark), [colors, isDark]);
  const navigation = useNavigation();
  const dispatch = useDispatch();
  const { user } = useSelector(state => state.auth);
  
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [sidebarVisible, setSidebarVisible] = useState(false);
  const [profileData, setProfileData] = useState({
    name: user?.name || '',
    phoneNumber: user?.phoneNumber || '',
    email: user?.email || '',
    cnic: user?.cnic || '',
    bio: user?.bio || 'Ride smarter, travel better 🚀'
  });
  const [notifications, setNotifications] = useState(true);
  const [darkMode, setDarkMode] = useState(false);
  const [language, setLanguage] = useState('English');
  const [isImageLoading, setIsImageLoading] = useState(false);

  // Animation refs
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(50)).current;
  const scaleAnim = useRef(new Animated.Value(0.9)).current;
  
  // Sidebar animation refs
  const sidebarTranslateX = useRef(new Animated.Value(width)).current;
  const sidebarOverlayOpacity = useRef(new Animated.Value(0)).current;
  const sidebarScale = useRef(new Animated.Value(0.95)).current;

  useEffect(() => {
    if (user) {
      setProfileData({
        name: user.name || '',
        phoneNumber: user.phoneNumber || '',
        email: user.email || '',
        cnic: user.cnic || '',
        bio: user.bio || 'Ride smarter, travel better 🚀'
      });
    }
    animateEntrance();
  }, [user]);

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
      })
    ]).start();
  };

  const openSidebar = () => {
    setSidebarVisible(true);
    Animated.parallel([
      Animated.timing(sidebarTranslateX, {
        toValue: 0,
        duration: 350,
        easing: Easing.bezier(0.4, 0, 0.2, 1),
        useNativeDriver: true,
      }),
      Animated.timing(sidebarOverlayOpacity, {
        toValue: 0.5,
        duration: 300,
        useNativeDriver: true,
      }),
      Animated.spring(sidebarScale, {
        toValue: 1,
        friction: 8,
        tension: 40,
        useNativeDriver: true,
      })
    ]).start();
  };

  const closeSidebar = () => {
    Animated.parallel([
      Animated.timing(sidebarTranslateX, {
        toValue: width,
        duration: 300,
        easing: Easing.bezier(0.4, 0, 0.2, 1),
        useNativeDriver: true,
      }),
      Animated.timing(sidebarOverlayOpacity, {
        toValue: 0,
        duration: 250,
        useNativeDriver: true,
      })
    ]).start(() => setSidebarVisible(false));
  };

  const pickImage = async () => {
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission Needed', 'Please allow access to your photo library');
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });

      if (!result.canceled) {
        setIsImageLoading(true);
        try {
          await dispatch(updateProfile({ profilePhoto: result.assets[0].uri })).unwrap();
          Alert.alert('Success', 'Profile photo updated successfully');
        } catch (error) {
          Alert.alert('Error', 'Failed to update profile photo');
        } finally {
          setIsImageLoading(false);
        }
      }
    } catch (error) {
      console.error('Image picker error:', error);
      Alert.alert('Error', 'Failed to pick image');
    }
  };

  const handleSave = async () => {
    if (!profileData.name.trim()) {
      Alert.alert('Error', 'Name is required');
      return;
    }

    setLoading(true);
    try {
      await dispatch(updateProfile(profileData)).unwrap();
      Alert.alert('Success', 'Profile updated successfully');
      setIsEditing(false);
    } catch (error) {
      Alert.alert('Error', error.message || 'Failed to update profile');
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    closeSidebar();
    setTimeout(() => {
      Alert.alert(
        'Logout',
        'Are you sure you want to logout?',
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Logout',
            style: 'destructive',
            onPress: async () => {
              await dispatch(logout());
              navigation.reset({
                index: 0,
                routes: [{ name: 'Auth' }],
              });
            }
          }
        ]
      );
    }, 300);
  };

  const sidebarMenuItems = [
    {
      icon: 'person-outline',
      iconType: 'ionicon',
      label: 'My Profile',
      onPress: () => {
        closeSidebar();
      }
    },
    {
      icon: 'time-outline',
      iconType: 'ionicon',
      label: 'Ride History',
      count: 12,
      onPress: () => {
        closeSidebar();
        navigation.navigate('RideHistory');
      }
    },
    {
      icon: 'wallet-outline',
      iconType: 'ionicon',
      label: 'Wallet',
      onPress: () => {
        closeSidebar();
        navigation.navigate('Wallet');
      }
    },
    {
      icon: 'cash-outline',
      iconType: 'ionicon',
      label: 'My Spending',
      onPress: () => {
        closeSidebar();
        navigation.navigate('Spending');
      }
    },
    {
      icon: 'card-outline',
      iconType: 'ionicon',
      label: 'Payment Methods',
      count: 2,
      onPress: () => {
        closeSidebar();
        navigation.navigate('PaymentMethods');
      }
    },
    {
      icon: 'notifications-outline',
      iconType: 'ionicon',
      label: 'Push Notifications',
      isSwitch: true,
      switchValue: notifications,
      onSwitchChange: setNotifications,
    },
    {
      icon: 'moon-outline',
      iconType: 'ionicon',
      label: 'Dark Mode',
      isSwitch: true,
      switchValue: darkMode,
      onSwitchChange: setDarkMode,
    },
    {
      icon: 'globe-outline',
      iconType: 'ionicon',
      label: 'Language',
      value: language,
      onPress: () => {
        closeSidebar();
        Alert.alert(
          'Select Language',
          'Choose your preferred language',
          [
            { text: 'English', onPress: () => setLanguage('English') },
            { text: 'Urdu', onPress: () => setLanguage('Urdu') },
            { text: 'Arabic', onPress: () => setLanguage('Arabic') },
            { text: 'Cancel', style: 'cancel' }
          ]
        );
      }
    },
    {
      icon: 'help-circle-outline',
      iconType: 'ionicon',
      label: 'Help & Support',
      onPress: () => {
        closeSidebar();
        navigation.navigate('HelpCenter');
      }
    },
    {
      icon: 'information-circle-outline',
      iconType: 'ionicon',
      label: 'About Raftar',
      onPress: () => {
        closeSidebar();
        navigation.navigate('About');
      }
    },
    {
      icon: 'log-out-outline',
      iconType: 'ionicon',
      label: 'Logout',
      onPress: handleLogout,
      isDanger: true
    },
  ];

  const stats = [
    { label: 'Total Rides', value: user?.stats?.totalRides?.toString() || '0', icon: 'car', color: colors.accent, iconType: 'ionicon' },
    { label: 'Rating', value: user?.stats?.rating?.toString() || '0', icon: 'star', color: colors.accent },
    { label: 'Points', value: '2.3k', icon: 'trophy', color: colors.accent, iconType: 'ionicon' }
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
        return <Icon name="circle" size={size} color={color} />;
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle={colors.statusBarStyle} backgroundColor={colors.background} />
      
      <Animated.View 
        style={[
          styles.container,
          {
            opacity: fadeAnim,
            transform: [
              { translateY: slideAnim },
              { scale: scaleAnim }
            ]
          }
        ]}
      >
        <ScrollView 
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
        >
          {/* Modern Header */}
          <View style={styles.header}>
            <TouchableOpacity 
              style={styles.backButton}
              onPress={() => navigation.goBack()}
            >
              <Icon name="arrow-back" size={24} color={colors.text} />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>My Profile</Text>
            <TouchableOpacity 
              style={styles.moreButton}
              onPress={openSidebar}
            >
              <Icon name="more-vert" size={24} color={colors.text} />
            </TouchableOpacity>
          </View>

          {/* Modern Cover Photo */}
          <View style={styles.coverContainer}>
            <LinearGradient
              colors={[colors.accent, colors.accent, '#F5A623']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.coverGradient}
            >
              <View style={styles.coverOverlay}>
                <Animatable.View 
                  animation="bounceIn" 
                  duration={1000}
                  style={styles.coverBadgeContainer}
                >
                  <View style={styles.coverBadge}>
                    <Icon name="star" size={14} color={colors.accent} />
                    <Text style={styles.coverBadgeText}>Premium Rider</Text>
                  </View>
                </Animatable.View>
              </View>
            </LinearGradient>
          </View>

          {/* Modern Profile Card - Overlapping */}
          <Animatable.View 
            animation="fadeInUp" 
            duration={800}
            style={styles.profileCardWrapper}
          >
            <View style={styles.profileCard}>
              <View style={styles.profileHeader}>
                {/* Profile Image with Ring */}
                <TouchableOpacity 
                  style={styles.profileImageWrapper}
                  onPress={pickImage}
                  activeOpacity={0.8}
                >
                  <View style={styles.profileImageRing}>
                    <Image
                      source={{ 
                        uri: user?.profilePhoto || 
                             'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=200&h=200&fit=crop&crop=face'
                      }}
                      style={styles.profileImage}
                    />
                    {isImageLoading && (
                      <View style={styles.imageLoadingOverlay}>
                        <ActivityIndicator size="large" color={colors.accent} />
                      </View>
                    )}
                  </View>
                  <View style={styles.cameraIcon}>
                    <Icon name="camera-alt" size={14} color={colors.text} />
                  </View>
                </TouchableOpacity>

                {/* User Info */}
                <View style={styles.userInfoContainer}>
                  <View style={styles.userNameRow}>
                    <Text style={styles.userName} numberOfLines={1}>
                      {user?.name || 'Guest User'}
                    </Text>
                    <View style={styles.verificationBadge}>
                      <Icon name="verified" size={16} color="#4ECDC4" />
                    </View>
                  </View>
                  <View style={styles.userPhoneContainer}>
                    <IconIonic name="call-outline" size={14} color={colors.textSecondary} />
                    <Text style={styles.userPhone}>{user?.phoneNumber || 'N/A'}</Text>
                  </View>
                  <View style={styles.userBioContainer}>
                    <IconIonic name="chatbubble-outline" size={14} color={colors.textSecondary} />
                    <Text style={styles.userBio} numberOfLines={2}>
                      {profileData.bio}
                    </Text>
                  </View>
                </View>
              </View>

              {/* User Meta Info */}
              <View style={styles.metaInfoContainer}>
                <View style={styles.metaItem}>
                  <Icon name="email" size={16} color={colors.accent} />
                  <Text style={styles.metaText}>{user?.email || 'No email'}</Text>
                </View>
                <View style={styles.metaDivider} />
                <View style={styles.metaItem}>
                  <Icon name="credit-card" size={16} color={colors.accent} />
                  <Text style={styles.metaText}>{user?.cnic || 'No CNIC'}</Text>
                </View>
              </View>
            </View>
          </Animatable.View>

          {/* Modern Stats Section */}
          <Animatable.View 
            animation="fadeInUp" 
            duration={800} 
            delay={200}
            style={styles.statsContainer}
          >
            {stats.map((stat, index) => (
              <View key={index} style={styles.statItem}>
                <LinearGradient
                  colors={['#FFF8E8', '#FFFEF5']}
                  style={styles.statIconWrapper}
                >
                  <View style={styles.statIcon}>
                    {getIcon(stat.icon, stat.iconType || 'material', 24, colors.accent)}
                  </View>
                </LinearGradient>
                <Text style={styles.statValue}>{stat.value}</Text>
                <Text style={styles.statLabel}>{stat.label}</Text>
              </View>
            ))}
          </Animatable.View>

          {/* Modern Edit Profile Section */}
          <Animatable.View 
            animation="fadeInUp" 
            duration={800} 
            delay={300}
            style={styles.section}
          >
            <View style={styles.sectionHeader}>
              <View style={styles.sectionTitleContainer}>
                <Icon name="person" size={22} color={colors.accent} />
                <Text style={styles.sectionTitle}>Personal Information</Text>
              </View>
              <TouchableOpacity 
                onPress={() => setIsEditing(!isEditing)}
                style={styles.editButtonContainer}
              >
                <LinearGradient
                  colors={isEditing ? ['#FF3B30', '#FF3B30'] : [colors.accent, colors.accent]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={[styles.editButtonGradient, isEditing && styles.editButtonActive]}
                >
                  <Icon 
                    name={isEditing ? 'close' : 'edit'} 
                    size={16} 
                    color={isEditing ? '#FFF' : '#000'} 
                  />
                  <Text style={[styles.editButton, isEditing && styles.editButtonActiveText]}>
                    {isEditing ? 'Cancel' : 'Edit'}
                  </Text>
                </LinearGradient>
              </TouchableOpacity>
            </View>

            {isEditing ? (
              <View style={styles.editForm}>
                <Input
                  label="Full Name *"
                  value={profileData.name}
                  onChangeText={(text) => setProfileData({ ...profileData, name: text })}
                  placeholder="Enter your name"
                  icon="person"
                />
                <Input
                  label="Email"
                  value={profileData.email}
                  onChangeText={(text) => setProfileData({ ...profileData, email: text })}
                  placeholder="Enter your email"
                  keyboardType="email-address"
                  icon="email"
                />
                <Input
                  label="CNIC"
                  value={profileData.cnic}
                  onChangeText={(text) => setProfileData({ ...profileData, cnic: text })}
                  placeholder="XXXXX-XXXXXXX-X"
                  icon="credit-card"
                />
                <Input
                  label="Bio"
                  value={profileData.bio}
                  onChangeText={(text) => setProfileData({ ...profileData, bio: text })}
                  placeholder="Write something about yourself"
                  icon="description"
                  multiline
                  numberOfLines={3}
                />
                <TouchableOpacity
                  style={styles.saveButton}
                  onPress={handleSave}
                  disabled={loading}
                >
                  <LinearGradient
                    colors={[colors.accent, colors.accent]}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                    style={styles.saveButtonGradient}
                  >
                    {loading ? (
                      <ActivityIndicator size="small" color={colors.text} />
                    ) : (
                      <>
                        <Icon name="save" size={20} color={colors.text} />
                        <Text style={styles.saveButtonText}>Save Changes</Text>
                      </>
                    )}
                  </LinearGradient>
                </TouchableOpacity>
              </View>
            ) : (
              <View style={styles.infoCard}>
                <View style={styles.infoRow}>
                  <View style={styles.infoLabelContainer}>
                    <Icon name="person-outline" size={18} color={colors.textSecondary} />
                    <Text style={styles.infoLabel}>Full Name</Text>
                  </View>
                  <Text style={styles.infoValue}>{user?.name}</Text>
                </View>
                <View style={styles.infoRow}>
                  <View style={styles.infoLabelContainer}>
                    <Icon name="phone" size={18} color={colors.textSecondary} />
                    <Text style={styles.infoLabel}>Phone</Text>
                  </View>
                  <Text style={styles.infoValue}>{user?.phoneNumber}</Text>
                </View>
                <View style={styles.infoRow}>
                  <View style={styles.infoLabelContainer}>
                    <Icon name="email" size={18} color={colors.textSecondary} />
                    <Text style={styles.infoLabel}>Email</Text>
                  </View>
                  <Text style={styles.infoValue}>{user?.email || 'Not set'}</Text>
                </View>
                <View style={[styles.infoRow, styles.lastInfoRow]}>
                  <View style={styles.infoLabelContainer}>
                    <Icon name="credit-card" size={18} color={colors.textSecondary} />
                    <Text style={styles.infoLabel}>CNIC</Text>
                  </View>
                  <Text style={styles.infoValue}>{user?.cnic || 'Not set'}</Text>
                </View>
              </View>
            )}
          </Animatable.View>

          
        </ScrollView>
      </Animated.View>

      {/* Modern Sidebar */}
      <Modal
        transparent={true}
        visible={sidebarVisible}
        onRequestClose={closeSidebar}
        statusBarTranslucent={true}
      >
        <Animated.View 
          style={[
            styles.sidebarOverlay,
            { opacity: sidebarOverlayOpacity }
          ]}
        >
          <Pressable 
            style={styles.sidebarPressable}
            onPress={closeSidebar}
          />
        </Animated.View>
        
        <Animated.View 
          style={[
            styles.sidebarContainer,
            {
              transform: [
                { translateX: sidebarTranslateX },
                { scale: sidebarScale }
              ]
            }
          ]}
        >
          {/* Sidebar Header */}
          <LinearGradient
            colors={[colors.accent, colors.accent]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.sidebarHeader}
          >
            <TouchableOpacity 
              style={styles.sidebarCloseButton}
              onPress={closeSidebar}
            >
              <Icon name="close" size={24} color={colors.text} />
            </TouchableOpacity>
            
            <View style={styles.sidebarUserInfo}>
              <TouchableOpacity 
                style={styles.sidebarAvatarContainer}
                onPress={pickImage}
              >
                <Image
                  source={{ 
                    uri: user?.profilePhoto || 
                         'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=200&h=200&fit=crop&crop=face'
                  }}
                  style={styles.sidebarAvatar}
                />
                <View style={styles.sidebarCameraIcon}>
                  <Icon name="camera-alt" size={12} color={colors.text} />
                </View>
              </TouchableOpacity>
              
              <Text style={styles.sidebarUserName} numberOfLines={1}>
                {user?.name || 'Guest User'}
              </Text>
              <Text style={styles.sidebarUserEmail} numberOfLines={1}>
                {user?.email || 'No email'}
              </Text>
            </View>

            <View style={styles.sidebarStats}>
              <View style={styles.sidebarStat}>
                <Text style={styles.sidebarStatValue}>12</Text>
                <Text style={styles.sidebarStatLabel}>Rides</Text>
              </View>
              <View style={styles.sidebarStatDivider} />
              <View style={styles.sidebarStat}>
                <Text style={styles.sidebarStatValue}>4.8</Text>
                <Text style={styles.sidebarStatLabel}>Rating</Text>
              </View>
              <View style={styles.sidebarStatDivider} />
              <View style={styles.sidebarStat}>
                <Text style={styles.sidebarStatValue}>2.3k</Text>
                <Text style={styles.sidebarStatLabel}>Points</Text>
              </View>
            </View>
          </LinearGradient>

          {/* Sidebar Menu */}
          <ScrollView 
            style={styles.sidebarMenu}
            showsVerticalScrollIndicator={false}
          >
            {sidebarMenuItems.map((item, index) => (
              <TouchableOpacity
                key={index}
                style={[
                  styles.sidebarMenuItem,
                  item.isDanger && styles.sidebarMenuItemDanger
                ]}
                onPress={item.onPress}
                activeOpacity={0.7}
                disabled={item.isSwitch}
              >
                <View style={styles.sidebarMenuItemLeft}>
                  <View style={[
                    styles.sidebarMenuItemIcon,
                    item.isDanger && styles.sidebarMenuItemIconDanger
                  ]}>
                    {getIcon(item.icon, item.iconType, 22, item.isDanger ? '#FF3B30' : colors.accent)}
                  </View>
                  <View style={styles.sidebarMenuItemTextContainer}>
                    <Text style={[
                      styles.sidebarMenuItemText,
                      item.isDanger && styles.sidebarMenuItemTextDanger
                    ]}>
                      {item.label}
                    </Text>
                    {item.value && (
                      <Text style={styles.sidebarMenuItemValue}>{item.value}</Text>
                    )}
                  </View>
                </View>
                <View style={styles.sidebarMenuItemRight}>
                  {item.count && (
                    <View style={styles.sidebarMenuBadge}>
                      <Text style={styles.sidebarMenuBadgeText}>{item.count}</Text>
                    </View>
                  )}
                  {item.isSwitch ? (
                    <Switch
                      value={item.switchValue}
                      onValueChange={item.onSwitchChange}
                      trackColor={{ false: '#E0E0E0', true: colors.accent }}
                      thumbColor={item.switchValue ? '#FFF' : '#999'}
                      ios_backgroundColor="#E0E0E0"
                    />
                  ) : (
                    <Icon name="chevron-right" size={20} color="#CCC" />
                  )}
                </View>
              </TouchableOpacity>
            ))}
          </ScrollView>

          {/* Sidebar Footer */}
          <View style={styles.sidebarFooter}>
            <Text style={styles.sidebarVersion}>Version 2.0.0</Text>
            <View style={styles.sidebarSocialIcons}>
              <TouchableOpacity style={styles.sidebarSocialIcon}>
                <Icon name="facebook" size={20} color={colors.textSecondary} />
              </TouchableOpacity>
              <TouchableOpacity style={styles.sidebarSocialIcon}>
                <Icon name="twitter" size={20} color={colors.textSecondary} />
              </TouchableOpacity>
              <TouchableOpacity style={styles.sidebarSocialIcon}>
                <Icon name="instagram" size={20} color={colors.textSecondary} />
              </TouchableOpacity>
            </View>
          </View>
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
    backgroundColor: colors.background,
    marginTop: 30
  },
  scrollContent: {
    paddingBottom: 40,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: 5,
  },
  backButton: {
    padding: 8,
    borderRadius: 12,
    backgroundColor: 'rgba(0,0,0,0.05)',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.text,
  },
  moreButton: {
    padding: 8,
    borderRadius: 12,
    backgroundColor: 'rgba(0,0,0,0.05)',
  },
  coverContainer: {
    height: 70,
    marginHorizontal: 16,
    marginTop: 8,
    borderRadius: 24,
    overflow: 'hidden',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
  },
  coverGradient: {
    flex: 1,
  },
  coverOverlay: {
    flex: 1,
    padding: 20,
    justifyContent: 'flex-end',
  },
  coverBadgeContainer: {
    alignSelf: 'flex-start',
  },
  coverBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.9)',
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 20,
    gap: 6,
  },
  coverBadgeText: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.text,
  },
  profileCardWrapper: {
    marginTop: -50,
    paddingHorizontal: 16,
  },
  profileCard: {
    backgroundColor: cardBg,
    borderRadius: 24,
    padding: 20,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.05)',
  },
  profileHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  profileImageWrapper: {
    position: 'relative',
    marginRight: 16,
  },
  profileImageRing: {
    width: 80,
    height: 80,
    borderRadius: 40,
    padding: 3,
    backgroundColor: colors.accent,
  },
  profileImage: {
    width: 74,
    height: 74,
    borderRadius: 37,
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  imageLoadingOverlay: {
    position: 'absolute',
    top: 3,
    left: 3,
    right: 3,
    bottom: 3,
    borderRadius: 37,
    backgroundColor: 'rgba(255,255,255,0.7)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  cameraIcon: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    backgroundColor: colors.accent,
    borderRadius: 14,
    width: 28,
    height: 28,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  userInfoContainer: {
    flex: 1,
  },
  userNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 4,
  },
  userName: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.text,
  },
  verificationBadge: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#E8F5F3',
    justifyContent: 'center',
    alignItems: 'center',
  },
  userPhoneContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 4,
  },
  userPhone: {
    color: colors.textSecondary,
    fontSize: 13,
  },
  userBioContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  userBio: {
    color: colors.textSecondary,
    fontSize: 12,
    fontStyle: 'italic',
    flex: 1,
  },
  metaInfoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    gap: 16,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flex: 1,
  },
  metaDivider: {
    width: 1,
    height: 24,
    backgroundColor: insetBg,
  },
  metaText: {
    color: colors.textSecondary,
    fontSize: 12,
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginHorizontal: 16,
    marginTop: 24,
    marginBottom: 24,
    backgroundColor: cardBg,
    paddingVertical: 20,
    borderRadius: 20,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.05)',
  },
  statItem: {
    alignItems: 'center',
  },
  statIconWrapper: {
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  statIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: cardBg,
    justifyContent: 'center',
    alignItems: 'center',
  },
  statValue: {
    color: colors.text,
    fontSize: 20,
    fontWeight: '700',
  },
  statLabel: {
    color: colors.textSecondary,
    fontSize: 11,
    marginTop: 2,
  },
  section: {
    marginHorizontal: 16,
    marginBottom: 24,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  sectionTitle: {
    color: colors.text,
    fontSize: 18,
    fontWeight: '700',
  },
  editButtonContainer: {
    borderRadius: 20,
    overflow: 'hidden',
  },
  editButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    gap: 6,
    borderRadius: 20,
  },
  editButtonActive: {
    backgroundColor: '#FF3B30',
  },
  editButton: {
    color: colors.text,
    fontSize: 13,
    fontWeight: '600',
  },
  editButtonActiveText: {
    color: '#FFF',
  },
  editForm: {
    gap: 12,
  },
  saveButton: {
    borderRadius: 16,
    overflow: 'hidden',
    marginTop: 8,
  },
  saveButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    gap: 8,
  },
  saveButtonText: {
    color: colors.text,
    fontSize: 16,
    fontWeight: '600',
  },
  infoCard: {
    backgroundColor: colors.background,
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.05)',
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.05)',
  },
  lastInfoRow: {
    borderBottomWidth: 0,
    paddingBottom: 0,
  },
  infoLabelContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  infoLabel: {
    color: colors.textSecondary,
    fontSize: 14,
  },
  infoValue: {
    color: colors.text,
    fontSize: 14,
    fontWeight: '500',
    maxWidth: '55%',
    textAlign: 'right',
  },
  
  // Sidebar Styles
  sidebarOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: '#000',
  },
  sidebarPressable: {
    flex: 1,
  },
  sidebarContainer: {
    position: 'absolute',
    top: 0,
    right: 0,
    width: width * 0.82,
    height: '100%',
    backgroundColor: cardBg,
    borderTopLeftRadius: 30,
    borderBottomLeftRadius: 30,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: -4, height: 0 },
    shadowOpacity: 0.15,
    shadowRadius: 20,
    elevation: 10,
  },
  sidebarHeader: {
    paddingTop: Platform.OS === 'ios' ? 50 : 40,
    paddingHorizontal: 24,
    paddingBottom: 20,
    borderBottomLeftRadius: 30,
  },
  sidebarCloseButton: {
    alignSelf: 'flex-end',
    padding: 4,
    backgroundColor: 'rgba(0,0,0,0.05)',
    borderRadius: 20,
    marginBottom: 16,
  },
  sidebarUserInfo: {
    alignItems: 'center',
    marginBottom: 20,
  },
  sidebarAvatarContainer: {
    position: 'relative',
    marginBottom: 12,
  },
  sidebarAvatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    borderWidth: 3,
    borderColor: '#FFFFFF',
  },
  sidebarCameraIcon: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    backgroundColor: colors.accent,
    borderRadius: 14,
    width: 24,
    height: 24,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  sidebarUserName: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 2,
  },
  sidebarUserEmail: {
    fontSize: 13,
    color: 'rgba(0,0,0,0.6)',
  },
  sidebarStats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    backgroundColor: 'rgba(255,255,255,0.3)',
    paddingVertical: 12,
    borderRadius: 16,
  },
  sidebarStat: {
    alignItems: 'center',
  },
  sidebarStatValue: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.text,
  },
  sidebarStatLabel: {
    fontSize: 11,
    color: 'rgba(0,0,0,0.6)',
  },
  sidebarStatDivider: {
    width: 1,
    backgroundColor: 'rgba(0,0,0,0.1)',
  },
  sidebarMenu: {
    flex: 1,
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  sidebarMenuItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderRadius: 12,
    marginBottom: 2,
  },
  sidebarMenuItemDanger: {
    marginTop: 8,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    paddingTop: 16,
  },
  sidebarMenuItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    flex: 1,
  },
  sidebarMenuItemIcon: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: colors.accent + '18',
    justifyContent: 'center',
    alignItems: 'center',
  },
  sidebarMenuItemIconDanger: {
    backgroundColor: colors.danger + '15',
  },
  sidebarMenuItemTextContainer: {
    flex: 1,
  },
  sidebarMenuItemText: {
    fontSize: 15,
    fontWeight: '500',
    color: colors.text,
  },
  sidebarMenuItemTextDanger: {
    color: '#FF3B30',
  },
  sidebarMenuItemValue: {
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: 1,
  },
  sidebarMenuItemRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  sidebarMenuBadge: {
    backgroundColor: colors.accent,
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  sidebarMenuBadgeText: {
    color: colors.text,
    fontSize: 11,
    fontWeight: 'bold',
  },
  sidebarFooter: {
    paddingHorizontal: 24,
    paddingVertical: 16,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  sidebarVersion: {
    fontSize: 12,
    color: '#CCC',
  },
  sidebarSocialIcons: {
    flexDirection: 'row',
    gap: 16,
  },
  sidebarSocialIcon: {
    padding: 4,
  },
  });
};

export default ProfileScreen;