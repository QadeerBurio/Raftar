// src/config/constants.js
export const API_URL = (process.env.EXPO_PUBLIC_API_URL || 'http://192.168.18.93:5000/api').replace(/\/$/, '');
export const SOCKET_URL = process.env.EXPO_PUBLIC_SOCKET_URL || API_URL.replace(/\/api$/, '');
export const GOOGLE_MAPS_API_KEY = 'AIzaSyAZs8JQxEHJoKvfRkof791lRQNEpsGvARA';
// export const STRIPE_PUBLISHABLE_KEY = 'your_stripe_publishable_key_here';
export const VOIP_CALLING_ENABLED = true; // Set to true when Dev Client is built


