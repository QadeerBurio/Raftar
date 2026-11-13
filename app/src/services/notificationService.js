import { Platform, Alert } from 'react-native';
import Constants from 'expo-constants';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Check if running in Expo Go
const isExpoGo = Constants.appOwnership === 'expo';

class NotificationService {
  constructor() {
    this.expoPushToken = null;
    this.notificationListener = null;
    this.responseListener = null;
    this.isInitialized = false;
  }

  async registerForPushNotifications() {
    try {
      // If in Expo Go, return mock token
      if (isExpoGo) {
        console.log('📱 Running in Expo Go - Using mock notification service');
        return 'mock-token-expo-go';
      }

      // For production/development builds
      const { default: Notifications } = await import('expo-notifications');

      // Configure notification handler
      Notifications.setNotificationHandler({
        handleNotification: async () => ({
          shouldShowAlert: true,
          shouldPlaySound: true,
          shouldSetBadge: true,
        }),
      });

      const { status: existingStatus } = await Notifications.getPermissionsAsync();
      let finalStatus = existingStatus;
      
      if (existingStatus !== 'granted') {
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
      }
      
      if (finalStatus !== 'granted') {
        console.log('❌ Failed to get push token for push notification');
        return null;
      }

      const token = await Notifications.getExpoPushTokenAsync({
        projectId: Constants.expoConfig?.extra?.eas?.projectId,
      });
      
      this.expoPushToken = token.data;
      console.log('✅ Push Notification Token:', this.expoPushToken);
      
      await AsyncStorage.setItem('pushToken', this.expoPushToken);
      this.isInitialized = true;
      
      return this.expoPushToken;
    } catch (error) {
      console.error('❌ Error registering for push notifications:', error);
      return null;
    }
  }

  setupNotificationListeners() {
    // If in Expo Go, skip setting up listeners
    if (isExpoGo) {
      console.log('📱 Expo Go: Notification listeners not set up');
      return () => {};
    }

    try {
      const setup = async () => {
        const { default: Notifications } = await import('expo-notifications');
        
        this.notificationListener = Notifications.addNotificationReceivedListener(
          this.handleNotification.bind(this)
        );

        this.responseListener = Notifications.addNotificationResponseReceivedListener(
          this.handleNotificationResponse.bind(this)
        );
      };
      
      setup();
      return () => this.cleanup();
    } catch (error) {
      console.error('❌ Error setting up notification listeners:', error);
      return () => {};
    }
  }

  handleNotification(notification) {
    const { title, body, data } = notification.request.content;
    
    if (Platform.OS === 'ios' || Platform.OS === 'android') {
      Alert.alert(title || 'Notification', body || 'You have a new notification');
    }
    
    this.saveNotification({
      id: notification.request.identifier,
      title: title || 'New Notification',
      body: body || '',
      data: data || {},
      timestamp: new Date().toISOString(),
      read: false
    });
  }

  handleNotificationResponse(response) {
    const { data } = response.notification.request.content;
    if (data?.screen) {
      console.log('📱 Navigate to:', data.screen);
    }
  }

  async saveNotification(notification) {
    try {
      const existing = await AsyncStorage.getItem('notifications');
      const notifications = existing ? JSON.parse(existing) : [];
      notifications.unshift(notification);
      
      if (notifications.length > 50) {
        notifications.pop();
      }
      
      await AsyncStorage.setItem('notifications', JSON.stringify(notifications));
    } catch (error) {
      console.error('❌ Error saving notification:', error);
    }
  }

  async getNotifications() {
    try {
      const notifications = await AsyncStorage.getItem('notifications');
      return notifications ? JSON.parse(notifications) : [];
    } catch (error) {
      console.error('❌ Error getting notifications:', error);
      return [];
    }
  }

  async markAsRead(notificationId) {
    try {
      const notifications = await this.getNotifications();
      const updated = notifications.map(notif => 
        notif.id === notificationId ? { ...notif, read: true } : notif
      );
      await AsyncStorage.setItem('notifications', JSON.stringify(updated));
      return updated;
    } catch (error) {
      console.error('❌ Error marking notification as read:', error);
    }
  }

  async clearAllNotifications() {
    try {
      await AsyncStorage.removeItem('notifications');
      return [];
    } catch (error) {
      console.error('❌ Error clearing notifications:', error);
    }
  }

  async sendLocalNotification(title, body, data = {}) {
    if (isExpoGo) {
      console.log('📱 Expo Go: Would send notification:', { title, body, data });
      Alert.alert(title || 'Notification', body || '');
      return;
    }

    try {
      const { default: Notifications } = await import('expo-notifications');
      await Notifications.scheduleNotificationAsync({
        content: {
          title,
          body,
          data,
          sound: true,
        },
        trigger: null,
      });
    } catch (error) {
      console.error('❌ Error sending local notification:', error);
    }
  }

  async getUnreadCount() {
    try {
      const notifications = await this.getNotifications();
      return notifications.filter(n => !n.read).length;
    } catch (error) {
      console.error('❌ Error getting unread count:', error);
      return 0;
    }
  }

  cleanup() {
    if (this.notificationListener) {
      this.notificationListener();
    }
    if (this.responseListener) {
      this.responseListener();
    }
  }

  // Check if notifications are supported
  isSupported() {
    return !isExpoGo;
  }
}

// Export a singleton instance
const notificationService = new NotificationService();
export default notificationService;