import React, { createContext, useContext, useEffect, useState } from 'react';
import notificationService from '../services/notificationService';

const NotificationContext = createContext();

export const useNotification = () => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotification must be used within NotificationProvider');
  }
  return context;
};

export const NotificationProvider = ({ children }) => {
  const [pushToken, setPushToken] = useState(null);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    initializeNotifications();
    
    return () => {
      notificationService.cleanup();
    };
  }, []);

  const initializeNotifications = async () => {
    try {
      // Register for push notifications
      const token = await notificationService.registerForPushNotifications();
      setPushToken(token);

      // Setup notification listeners
      notificationService.setupNotificationListeners();

      // Load existing notifications
      const savedNotifications = await notificationService.getNotifications();
      setNotifications(savedNotifications);
      
      const count = await notificationService.getUnreadCount();
      setUnreadCount(count);
    } catch (error) {
      console.error('Error initializing notifications:', error);
    }
  };

  const sendNotification = async (title, body, data = {}) => {
    await notificationService.sendLocalNotification(title, body, data);
    // Refresh notifications
    const updated = await notificationService.getNotifications();
    setNotifications(updated);
    const count = await notificationService.getUnreadCount();
    setUnreadCount(count);
  };

  const markAsRead = async (notificationId) => {
    const updated = await notificationService.markAsRead(notificationId);
    setNotifications(updated);
    const count = await notificationService.getUnreadCount();
    setUnreadCount(count);
  };

  const clearAll = async () => {
    const cleared = await notificationService.clearAllNotifications();
    setNotifications(cleared);
    setUnreadCount(0);
  };

  const value = {
    pushToken,
    notifications,
    unreadCount,
    sendNotification,
    markAsRead,
    clearAll,
    registerForPush: notificationService.registerForPushNotifications.bind(notificationService),
  };

  return (
    <NotificationContext.Provider value={value}>
      {children}
    </NotificationContext.Provider>
  );
};