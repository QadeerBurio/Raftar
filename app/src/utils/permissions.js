import { Platform } from 'react-native';
import { PERMISSIONS, request, check, RESULTS } from 'react-native-permissions';
import * as Location from 'expo-location';

export const requestLocationPermission = async () => {
  try {
    const { status } = await Location.requestForegroundPermissionsAsync();
    return status === 'granted';
  } catch (error) {
    console.error('Location permission error:', error);
    return false;
  }
};

export const requestCameraPermission = async () => {
  try {
    const status = await request(
      Platform.OS === 'ios' ? PERMISSIONS.IOS.CAMERA : PERMISSIONS.ANDROID.CAMERA
    );
    return status === RESULTS.GRANTED;
  } catch (error) {
    console.error('Camera permission error:', error);
    return false;
  }
};

export const requestGalleryPermission = async () => {
  try {
    const status = await request(
      Platform.OS === 'ios'
        ? PERMISSIONS.IOS.PHOTO_LIBRARY
        : PERMISSIONS.ANDROID.READ_EXTERNAL_STORAGE
    );
    return status === RESULTS.GRANTED;
  } catch (error) {
    console.error('Gallery permission error:', error);
    return false;
  }
};

export const requestMicrophonePermission = async () => {
  try {
    const status = await request(
      Platform.OS === 'ios' ? PERMISSIONS.IOS.MICROPHONE : PERMISSIONS.ANDROID.RECORD_AUDIO
    );
    return status === RESULTS.GRANTED;
  } catch (error) {
    console.error('Microphone permission error:', error);
    return false;
  }
};

export const requestNotificationPermission = async () => {
  try {
    const { status } = await Notifications.requestPermissionsAsync();
    return status === 'granted';
  } catch (error) {
    console.error('Notification permission error:', error);
    return false;
  }
};

export const checkLocationPermission = async () => {
  try {
    const { status } = await Location.getForegroundPermissionsAsync();
    return status === 'granted';
  } catch (error) {
    console.error('Check location permission error:', error);
    return false;
  }
};

export const requestAllPermissions = async () => {
  const permissions = {
    location: await requestLocationPermission(),
    camera: await requestCameraPermission(),
    gallery: await requestGalleryPermission(),
    microphone: await requestMicrophonePermission(),
    notifications: await requestNotificationPermission(),
  };
  return permissions;
};