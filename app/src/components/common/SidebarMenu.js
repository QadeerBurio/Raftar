import React, { useRef, useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Alert,
  Image,
  Switch,
  Animated,
  Dimensions,
  Modal,
  Pressable,
  Easing,
  ActivityIndicator
} from 'react-native';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigation } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as ImagePicker from 'expo-image-picker';
import {
  UserRound, History, Wallet, ReceiptText, CreditCard, BellRing, Moon, Globe, LifeBuoy, Info,
  LogOut, ChevronRight, Camera, X, Star,
} from 'lucide-react-native';
import { logout } from '../../redux/slices/authSlice';
import { updateProfile } from '../../redux/slices/userSlice';
import { useTheme } from '../../context/ThemeContext';
import { Badge, IconTile } from '../ui';
import { palette, fonts, radius, shadows, spacing, typography } from '../../theme/tokens';

const { width } = Dimensions.get('window');

const SidebarMenu = ({ visible, onClose }) => {
  const navigation = useNavigation();
  const dispatch = useDispatch();
  const { user } = useSelector(state => state.auth);

  const [notifications, setNotifications] = useState(true);
  const [language, setLanguage] = useState('English');
  const [isImageLoading, setIsImageLoading] = useState(false);
  const { colors, isDark, toggleTheme } = useTheme();
  const insets = useSafeAreaInsets();

  const sidebarTranslateX = useRef(new Animated.Value(width)).current;
  const sidebarOverlayOpacity = useRef(new Animated.Value(0)).current;
  const sidebarScale = useRef(new Animated.Value(0.95)).current;

  useEffect(() => {
    if (visible) {
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
    } else {
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
      ]).start();
    }
  }, [visible]);

  const handleLogout = () => {
    onClose();
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
              if (window.locationInterval) {
                clearInterval(window.locationInterval);
                window.locationInterval = null;
              }
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

  const sidebarMenuItems = [
    { icon: UserRound, label: 'My Profile', onPress: () => { onClose(); navigation.navigate('Profile'); } },
    { icon: History, label: 'Ride History', count: 12, onPress: () => { onClose(); navigation.navigate('RideHistory'); } },
    { icon: Wallet, label: 'Wallet', onPress: () => { onClose(); navigation.navigate('Wallet'); } },
    { icon: ReceiptText, label: 'My Spending', onPress: () => { onClose(); navigation.navigate('Spending'); } },
    { icon: CreditCard, label: 'Payment Methods', count: 2, onPress: () => { onClose(); navigation.navigate('PaymentMethods'); } },
    { icon: BellRing, label: 'Push Notifications', isSwitch: true, switchValue: notifications, onSwitchChange: setNotifications },
    { icon: Moon, label: 'Dark Mode', isSwitch: true, switchValue: isDark, onSwitchChange: toggleTheme },
    { icon: Globe, label: 'Language', value: language, onPress: () => { onClose(); Alert.alert('Select Language', 'Choose your preferred language', [{ text: 'English', onPress: () => setLanguage('English') }, { text: 'Urdu', onPress: () => setLanguage('Urdu') }, { text: 'Arabic', onPress: () => setLanguage('Arabic') }, { text: 'Cancel', style: 'cancel' }]); } },
    { icon: LifeBuoy, label: 'Help & Support', onPress: () => { onClose(); navigation.navigate('HelpCenter'); } },
    { icon: Info, label: 'About Raftar', onPress: () => { onClose(); navigation.navigate('About'); } },
  ];

  const stats = [
    { value: '12', label: 'Rides' },
    { value: '4.8', label: 'Rating', star: true },
    { value: '2.3k', label: 'Points' },
  ];

  return (
    <Modal transparent={true} visible={visible} onRequestClose={onClose} statusBarTranslucent={true}>
      <Animated.View style={[styles.overlay, { opacity: sidebarOverlayOpacity }]}>
        <Pressable style={styles.flex} onPress={onClose} accessibilityRole="button" accessibilityLabel="Close menu" />
      </Animated.View>
      <Animated.View style={[styles.panel, { backgroundColor: colors.background, transform: [{ translateX: sidebarTranslateX }, { scale: sidebarScale }] }]}>
        {/* Teal header */}
        <View style={[styles.header, { paddingTop: insets.top + spacing.l }]}>
          <View style={styles.headerTop}>
            <Pressable
              style={styles.avatarWrap}
              onPress={pickImage}
              accessibilityRole="button"
              accessibilityLabel="Change profile photo"
            >
              {user?.profilePhoto ? (
                <Image source={{ uri: user.profilePhoto }} style={styles.avatar} />
              ) : (
                <View style={[styles.avatar, styles.avatarFallback]}>
                  <Text style={styles.avatarInitial}>{(user?.name || 'G').charAt(0).toUpperCase()}</Text>
                </View>
              )}
              <View style={styles.cameraBadge}>
                {isImageLoading
                  ? <ActivityIndicator size="small" color={palette.primary} />
                  : <Camera size={13} color={palette.primary} strokeWidth={2.25} />}
              </View>
            </Pressable>
            <Pressable
              style={styles.closeBtn}
              onPress={onClose}
              accessibilityRole="button"
              accessibilityLabel="Close menu"
            >
              <X size={22} color={palette.cream} strokeWidth={2} />
            </Pressable>
          </View>
          <Text style={styles.name} numberOfLines={1}>{user?.name || 'Guest User'}</Text>
          <Text style={styles.email} numberOfLines={1}>{user?.email || 'No email'}</Text>

          <View style={styles.statsRow}>
            {stats.map((s) => (
              <View key={s.label} style={styles.statTile} accessible accessibilityLabel={`${s.label} ${s.value}`}>
                <View style={styles.statValueRow}>
                  {s.star ? <Star size={14} color={palette.accent} fill={palette.accent} strokeWidth={2} /> : null}
                  <Text style={styles.statValue}>{s.value}</Text>
                </View>
                <Text style={styles.statLabel}>{s.label}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* Menu */}
        <ScrollView style={styles.flex} contentContainerStyle={styles.menu} showsVerticalScrollIndicator={false}>
          {sidebarMenuItems.map((item) => (
            <Pressable
              key={item.label}
              style={({ pressed }) => [styles.item, pressed && !item.isSwitch && { backgroundColor: colors.surface }]}
              onPress={item.isSwitch ? () => item.onSwitchChange(!item.switchValue) : item.onPress}
              accessibilityRole={item.isSwitch ? 'switch' : 'button'}
              accessibilityState={item.isSwitch ? { checked: !!item.switchValue } : undefined}
              accessibilityLabel={item.value ? `${item.label}, ${item.value}` : item.label}
            >
              <IconTile icon={item.icon} size="md" />
              <View style={styles.itemText}>
                <Text style={[styles.itemLabel, { color: colors.text }]}>{item.label}</Text>
                {item.value ? <Text style={[styles.itemValue, { color: colors.textSecondary }]}>{item.value}</Text> : null}
              </View>
              {item.count ? <Badge label={String(item.count)} style={styles.count} /> : null}
              {item.isSwitch ? (
                <Switch
                  value={item.switchValue}
                  onValueChange={item.onSwitchChange}
                  trackColor={{ false: colors.switchTrackOff, true: colors.primary }}
                  thumbColor={palette.white}
                  ios_backgroundColor={colors.switchTrackOff}
                  accessibilityElementsHidden
                  importantForAccessibility="no"
                />
              ) : (
                <ChevronRight size={20} color={colors.textSecondary} strokeWidth={2} />
              )}
            </Pressable>
          ))}

          <Pressable
            style={({ pressed }) => [styles.logout, { backgroundColor: colors.surface }, pressed && { opacity: 0.85 }]}
            onPress={handleLogout}
            accessibilityRole="button"
            accessibilityLabel="Log out"
          >
            <LogOut size={20} color={colors.warning} strokeWidth={2} />
            <Text style={[styles.logoutText, { color: colors.warning }]}>Log out</Text>
          </Pressable>
        </ScrollView>

        <View style={[styles.footer, { borderTopColor: colors.border, paddingBottom: insets.bottom + spacing.l }]}>
          <Text style={[styles.version, { color: colors.textSecondary }]}>Raftar version 2.0.0</Text>
        </View>
      </Animated.View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  flex: { flex: 1 },
  overlay: { ...StyleSheet.absoluteFillObject, backgroundColor: palette.text, zIndex: 1000 },
  panel: {
    position: 'absolute', top: 0, bottom: 0, right: 0, width: width * 0.86,
    zIndex: 1001, borderTopLeftRadius: radius.sheet, borderBottomLeftRadius: radius.sheet,
    overflow: 'hidden', ...shadows.sheet,
  },

  header: { backgroundColor: palette.primary, paddingHorizontal: spacing.screen, paddingBottom: spacing.screen },
  headerTop: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between' },
  avatarWrap: { width: 72, height: 72 },
  avatar: { width: 72, height: 72, borderRadius: 36, borderWidth: 3, borderColor: palette.cream },
  avatarFallback: { backgroundColor: palette.cream, alignItems: 'center', justifyContent: 'center' },
  avatarInitial: { fontFamily: fonts.extrabold, fontSize: 28, color: palette.primary },
  cameraBadge: {
    position: 'absolute', right: -2, bottom: -2, width: 28, height: 28, borderRadius: 14,
    backgroundColor: palette.accent, alignItems: 'center', justifyContent: 'center',
    borderWidth: 2, borderColor: palette.primary,
  },
  closeBtn: {
    width: 44, height: 44, borderRadius: radius.field, alignItems: 'center', justifyContent: 'center',
    backgroundColor: 'rgba(255,239,179,0.12)',
  },
  name: { ...typography.title, color: palette.cream, marginTop: spacing.l },
  email: { ...typography.small, color: palette.onPrimaryMuted, marginTop: 2 },
  statsRow: { flexDirection: 'row', gap: spacing.s, marginTop: spacing.xl },
  statTile: { flex: 1, borderRadius: radius.field, paddingVertical: spacing.l, alignItems: 'center', backgroundColor: 'rgba(255,239,179,0.1)' },
  statValueRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  statValue: { ...typography.cardTitle, fontFamily: fonts.extrabold, color: palette.cream },
  statLabel: { ...typography.small, fontSize: 12, color: palette.onPrimaryMuted, marginTop: 2 },

  menu: { paddingHorizontal: spacing.l, paddingVertical: spacing.l },
  item: { flexDirection: 'row', alignItems: 'center', gap: spacing.l, minHeight: 60, paddingHorizontal: spacing.s, borderRadius: radius.field },
  itemText: { flex: 1 },
  itemLabel: { ...typography.bodyStrong },
  itemValue: { ...typography.small, marginTop: 1 },
  count: { marginRight: spacing.xs },
  logout: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: spacing.s,
    minHeight: 52, borderRadius: radius.field, marginTop: spacing.l, marginHorizontal: spacing.s,
  },
  logoutText: { ...typography.button },
  footer: { alignItems: 'center', paddingTop: spacing.l, borderTopWidth: 1 },
  version: { ...typography.small, fontSize: 12 },
});

export default SidebarMenu;
