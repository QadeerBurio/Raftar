import React, { useState, useEffect, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Switch,
  Alert,
  Linking,
  Platform
} from 'react-native';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigation } from '@react-navigation/native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import * as Location from 'expo-location';
import * as Notifications from 'expo-notifications';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Button from '../../components/common/Button';
import { updateSettings } from '../../redux/slices/userSlice';
import { logout } from '../../redux/slices/authSlice';
import { useTheme } from '../../context/ThemeContext';
import storage from '../../services/storage';

const SettingsScreen = () => {
  const navigation = useNavigation();
  const dispatch = useDispatch();
  const { user } = useSelector(state => state.auth);
  const { settings } = useSelector(state => state.user);
  const { colors, isDark, toggleTheme } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);

  const [loading, setLoading] = useState(false);
  const [preferences, setPreferences] = useState({
    notifications: true,
    darkMode: true,
    language: 'en',
    locationServices: true,
    soundEnabled: true,
    vibrationEnabled: true,
    autoAcceptRides: false,
    maxDistance: 10,
    shareRideData: false,
    emailNotifications: true,
    smsNotifications: true
  });

  useEffect(() => {
    loadSettings();
    checkPermissions();
  }, []);

  const loadSettings = async () => {
    try {
      const savedSettings = await storage.getSettings();
      if (savedSettings) {
        setPreferences({ ...preferences, ...savedSettings });
      }
    } catch (error) {
      console.error('Error loading settings:', error);
    }
  };

  const checkPermissions = async () => {
    // Check location permission
    const { status: locationStatus } = await Location.getForegroundPermissionsAsync();
    setPreferences(prev => ({
      ...prev,
      locationServices: locationStatus === 'granted'
    }));

    // Check notification permission
    const { status: notificationStatus } = await Notifications.getPermissionsAsync();
    setPreferences(prev => ({
      ...prev,
      notifications: notificationStatus === 'granted'
    }));
  };

  const handleToggle = async (key, value) => {
    setPreferences(prev => ({ ...prev, [key]: value }));
    
    // Save to storage
    await storage.setSettings({ ...preferences, [key]: value });
    
    // Update backend if needed
    if (['notifications', 'darkMode', 'language'].includes(key)) {
      await dispatch(updateSettings({ [key]: value }));
    }

    // Handle specific toggles
    if (key === 'locationServices') {
      handleLocationToggle(value);
    }
    if (key === 'notifications') {
      handleNotificationToggle(value);
    }
  };

  const handleLocationToggle = async (enabled) => {
    if (enabled) {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert(
          'Permission Required',
          'Location permission is needed for ride tracking and finding nearby rides.',
          [
            { text: 'Cancel', style: 'cancel' },
            { text: 'Open Settings', onPress: () => Linking.openSettings() }
          ]
        );
        setPreferences(prev => ({ ...prev, locationServices: false }));
      }
    }
  };

  const handleNotificationToggle = async (enabled) => {
    if (enabled) {
      const { status } = await Notifications.requestPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert(
          'Permission Required',
          'Notification permission is needed for ride alerts and updates.',
          [
            { text: 'Cancel', style: 'cancel' },
            { text: 'Open Settings', onPress: () => Linking.openSettings() }
          ]
        );
        setPreferences(prev => ({ ...prev, notifications: false }));
      }
    }
  };

  const handleLanguageChange = (language) => {
    handleToggle('language', language);
    // Implement language change logic
  };

  const handleClearCache = () => {
    Alert.alert(
      'Clear Cache',
      'This will clear all cached data. Are you sure?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Clear',
          style: 'destructive',
          onPress: async () => {
            try {
              await AsyncStorage.clear();
              Alert.alert('Success', 'Cache cleared successfully');
            } catch (error) {
              Alert.alert('Error', 'Failed to clear cache');
            }
          }
        }
      ]
    );
  };

  const handleLogout = () => {
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
              routes: [{ name: 'Auth' }]
            });
          }
        }
      ]
    );
  };

  const handleDeleteAccount = () => {
    Alert.alert(
      'Delete Account',
      'This action is permanent and cannot be undone. All your data will be deleted.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => {
            // Implement account deletion
            Alert.alert('Account Deletion', 'Please contact support to delete your account.');
          }
        }
      ]
    );
  };

  const renderSection = (title, children) => (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>{title}</Text>
      {children}
    </View>
  );

  const renderToggleItem = (label, key, icon) => (
    <View style={styles.settingItem}>
      <View style={styles.settingItemLeft}>
        {icon && <Icon name={icon} size={24} color={colors.textSecondary} style={styles.settingIcon} />}
        <Text style={styles.settingLabel}>{label}</Text>
      </View>
      <Switch
        value={preferences[key]}
        onValueChange={(value) => handleToggle(key, value)}
        trackColor={{ false: colors.switchTrackOff, true: colors.accent }}
        thumbColor={preferences[key] ? '#FFFFFF' : colors.switchThumbOff}
      />
    </View>
  );

  const renderThemeToggle = () => {
    const handleThemeChange = () => {
      handleToggle('darkMode', !isDark);
      toggleTheme();
    };

    return (
      <View style={styles.settingItem}>
        <View style={styles.settingItemLeft}>
          <Icon name="dark-mode" size={24} color={colors.textSecondary} style={styles.settingIcon} />
          <Text style={styles.settingLabel}>Dark Mode</Text>
        </View>
        <Switch
          value={isDark}
          onValueChange={handleThemeChange}
          trackColor={{ false: colors.switchTrackOff, true: colors.accent }}
          thumbColor={isDark ? '#FFFFFF' : colors.switchThumbOff}
        />
      </View>
    );
  };

  const renderMenuItem = (label, icon, onPress, badge) => (
    <TouchableOpacity style={styles.menuItem} onPress={onPress}>
      <View style={styles.menuItemLeft}>
        <Icon name={icon} size={24} color={colors.textSecondary} style={styles.menuIcon} />
        <Text style={styles.menuLabel}>{label}</Text>
      </View>
      <View style={styles.menuItemRight}>
        {badge && (
          <View style={styles.badge}>
            <Text style={styles.badgeText}>{badge}</Text>
          </View>
        )}
        <Icon name="chevron-right" size={24} color={colors.textSecondary} />
      </View>
    </TouchableOpacity>
  );

  return (
    <ScrollView style={styles.container}>
      {/* Profile Section */}
      <View style={styles.profileSection}>
        <View style={styles.profileInfo}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>
              {user?.name?.charAt(0) || 'U'}
            </Text>
          </View>
          <View style={styles.profileText}>
            <Text style={styles.profileName}>{user?.name}</Text>
            <Text style={styles.profileEmail}>{user?.email || 'No email set'}</Text>
          </View>
        </View>
        <TouchableOpacity onPress={() => navigation.navigate('Profile')}>
          <Text style={styles.editProfile}>Edit</Text>
        </TouchableOpacity>
      </View>

      {/* Preferences Section */}
      {renderSection('Preferences', (
        <>
          {renderToggleItem('Push Notifications', 'notifications', 'notifications')}
          {renderThemeToggle()}
          {renderToggleItem('Location Services', 'locationServices', 'location-on')}
          {renderToggleItem('Sound Effects', 'soundEnabled', 'volume-up')}
          {renderToggleItem('Vibration', 'vibrationEnabled', 'vibration')}
          {renderToggleItem('Auto Accept Rides', 'autoAcceptRides', 'autorenew')}
        </>
      ))}

      {/* Language Section */}
      {renderSection('Language', (
        <View style={styles.languageContainer}>
          {['English', 'Urdu', 'Arabic'].map((lang) => (
            <TouchableOpacity
              key={lang}
              style={[
                styles.languageOption,
                preferences.language === lang.toLowerCase() && styles.languageOptionActive
              ]}
              onPress={() => handleLanguageChange(lang.toLowerCase())}
            >
              <Text style={[
                styles.languageText,
                preferences.language === lang.toLowerCase() && styles.languageTextActive
              ]}>
                {lang}
              </Text>
              {preferences.language === lang.toLowerCase() && (
                <Icon name="check" size={20} color={colors.accent} />
              )}
            </TouchableOpacity>
          ))}
        </View>
      ))}

      {/* Notifications Section */}
      {renderSection('Notification Settings', (
        <>
          {renderToggleItem('Email Notifications', 'emailNotifications', 'email')}
          {renderToggleItem('SMS Notifications', 'smsNotifications', 'sms')}
          {renderToggleItem('Share Ride Data', 'shareRideData', 'share')}
        </>
      ))}

      {/* Account Section */}
      {renderSection('Account', (
        <>
          {renderMenuItem('Payment Methods', 'payment', () => navigation.navigate('PaymentMethods'))}
          {renderMenuItem('Ride History', 'history', () => navigation.navigate('RideHistory'))}
          {renderMenuItem('Wallet', 'account-balance-wallet', () => navigation.navigate('Wallet'))}
          {renderMenuItem('Referral Program', 'share', () => navigation.navigate('Referral'))}
          {renderMenuItem('Saved Places', 'bookmark', () => navigation.navigate('SavedPlaces'))}
        </>
      ))}

      {/* Support Section */}
      {renderSection('Support', (
        <>
          {renderMenuItem('Help Center', 'help', () => navigation.navigate('HelpCenter'))}
          {renderMenuItem('FAQ', 'question-answer', () => navigation.navigate('FAQ'))}
          {renderMenuItem('Contact Support', 'support-agent', () => navigation.navigate('Support'))}
          {renderMenuItem('Report Issue', 'report-problem', () => navigation.navigate('ReportIssue'))}
          {renderMenuItem('Rate Us', 'star', () => navigation.navigate('RateUs'))}
        </>
      ))}

      {/* Legal Section */}
      {renderSection('Legal', (
        <>
          {renderMenuItem('Privacy Policy', 'privacy-tip', () => navigation.navigate('Privacy'))}
          {renderMenuItem('Terms of Service', 'description', () => navigation.navigate('Terms'))}
          {renderMenuItem('About Raftar', 'info', () => navigation.navigate('About'))}
        </>
      ))}

      {/* App Info */}
      <View style={styles.appInfo}>
        <Text style={styles.appVersion}>Version 1.0.0</Text>
        <Text style={styles.appBuild}>Build 100</Text>
      </View>

      {/* Actions */}
      <View style={styles.actionsContainer}>
        <Button
          title="Clear Cache"
          onPress={handleClearCache}
          variant="outline"
          size="medium"
          style={styles.actionButton}
        />
        
        <Button
          title="Logout"
          onPress={handleLogout}
          variant="danger"
          size="medium"
          style={styles.actionButton}
        />

        <TouchableOpacity onPress={handleDeleteAccount}>
          <Text style={styles.deleteAccount}>Delete Account</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
};

const createStyles = (colors) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  profileSection: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    backgroundColor: colors.card,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  profileInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: colors.accent,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    color: colors.accentText,
    fontSize: 20,
    fontWeight: 'bold',
  },
  profileText: {
    marginLeft: 12,
  },
  profileName: {
    color: colors.text,
    fontSize: 18,
    fontWeight: 'bold',
  },
  profileEmail: {
    color: colors.textSecondary,
    fontSize: 14,
  },
  editProfile: {
    color: colors.accent,
    fontSize: 14,
    fontWeight: '500',
  },
  section: {
    marginTop: 20,
    paddingHorizontal: 16,
  },
  sectionTitle: {
    color: colors.textSecondary,
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 8,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  settingItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: colors.card,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: 4,
  },
  settingItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  settingIcon: {
    marginRight: 12,
  },
  settingLabel: {
    color: colors.text,
    fontSize: 16,
  },
  languageContainer: {
    flexDirection: 'row',
    backgroundColor: colors.card,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 4,
  },
  languageOption: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 10,
    borderRadius: 8,
    gap: 8,
  },
  languageOptionActive: {
    backgroundColor: colors.cardElevated,
  },
  languageText: {
    color: colors.textSecondary,
    fontSize: 14,
  },
  languageTextActive: {
    color: colors.text,
    fontWeight: 'bold',
  },
  menuItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: colors.card,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: 4,
  },
  menuItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  menuIcon: {
    marginRight: 12,
  },
  menuLabel: {
    color: colors.text,
    fontSize: 16,
  },
  menuItemRight: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  badge: {
    backgroundColor: colors.accent,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 12,
    marginRight: 8,
  },
  badgeText: {
    color: colors.accentText,
    fontSize: 12,
    fontWeight: 'bold',
  },
  appInfo: {
    alignItems: 'center',
    marginTop: 20,
    paddingVertical: 16,
  },
  appVersion: {
    color: colors.textSecondary,
    fontSize: 14,
  },
  appBuild: {
    color: colors.textSecondary,
    fontSize: 12,
    marginTop: 4,
  },
  actionsContainer: {
    paddingHorizontal: 16,
    paddingVertical: 20,
    gap: 12,
  },
  actionButton: {
    marginBottom: 8,
  },
  deleteAccount: {
    color: colors.danger,
    textAlign: 'center',
    fontSize: 14,
    marginTop: 12,
    textDecorationLine: 'underline',
  },
});

export default SettingsScreen;