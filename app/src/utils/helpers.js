import { Platform } from 'react-native';
import * as Location from 'expo-location';

export const formatCurrency = (amount, currency = 'PKR') => {
  return `Rs. ${amount?.toLocaleString() || 0}`;
};

export const formatDate = (date) => {
  const d = new Date(date);
  return d.toLocaleDateString('en-PK', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
};

export const getDistance = (lat1, lon1, lat2, lon2) => {
  const R = 6371;
  const dLat = deg2rad(lat2 - lat1);
  const dLon = deg2rad(lon2 - lon1);
  const a = 
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(deg2rad(lat1)) * Math.cos(deg2rad(lat2)) * 
    Math.sin(dLon/2) * Math.sin(dLon/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  const d = R * c;
  return d;
};

export const deg2rad = (deg) => {
  return deg * (Math.PI/180);
};

export const validatePhoneNumber = (phone) => {
  const regex = /^(\+92|0)?[3][0-9]{9}$/;
  return regex.test(phone);
};

export const validateEmail = (email) => {
  const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return regex.test(email);
};

export const validateCNIC = (cnic) => {
  const regex = /^[0-9]{5}-[0-9]{7}-[0-9]{1}$/;
  return regex.test(cnic);
};

export const getErrorMessage = (error) => {
  if (typeof error === 'string') return error;
  if (error.message) return error.message;
  return 'An unexpected error occurred';
};

export const getInitials = (name) => {
  if (!name) return '';
  return name
    .split(' ')
    .map(word => word[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
};

export const getStatusColor = (status) => {
  const colors = {
    pending: '#FF9F43',
    searching: '#45B7D1',
    accepted: '#4ECDC4',
    started: '#FFD700',
    completed: '#00B894',
    cancelled: '#FF6B6B',
    active: '#00B894',
    inactive: '#FF6B6B'
  };
  return colors[status] || '#888';
};

export const sortByDate = (items, key = 'createdAt', order = 'desc') => {
  return [...items].sort((a, b) => {
    const dateA = new Date(a[key]);
    const dateB = new Date(b[key]);
    return order === 'desc' ? dateB - dateA : dateA - dateB;
  });
};

export const getCurrentLocation = async () => {
  try {
    const { status } = await Location.requestForegroundPermissionsAsync();
    if (status !== 'granted') {
      throw new Error('Location permission denied');
    }
    const location = await Location.getCurrentPositionAsync({});
    return {
      latitude: location.coords.latitude,
      longitude: location.coords.longitude,
      accuracy: location.coords.accuracy
    };
  } catch (error) {
    console.error('Location error:', error);
    throw error;
  }
};

export const debounce = (func, delay = 300) => {
  let timeoutId;
  return (...args) => {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => func(...args), delay);
  };
};

export const throttle = (func, limit = 1000) => {
  let inThrottle;
  return (...args) => {
    if (!inThrottle) {
      func(...args);
      inThrottle = true;
      setTimeout(() => inThrottle = false, limit);
    }
  };
};

export const getOS = () => {
  return Platform.OS === 'ios' ? 'ios' : 'android';
};

export const getAppVersion = () => {
  // Return from package.json or app.json
  return '1.0.0';
};