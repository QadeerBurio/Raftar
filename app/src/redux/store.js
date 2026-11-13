import { configureStore } from '@reduxjs/toolkit';
import authReducer from './slices/authSlice';
import userReducer from './slices/userSlice';
import rideReducer from './slices/rideSlice';
import driverReducer from './slices/driverSlice';
import bookingReducer from './slices/bookingSlice';
import paymentReducer from './slices/paymentSlice';
import parcelReducer from './slices/parcelSlice';
import notificationReducer from './slices/notificationSlice';
import callReducer from './slices/callSlice';

export const store = configureStore({
  reducer: {
    auth: authReducer,
    user: userReducer,
    ride: rideReducer,
    driver: driverReducer,
    booking: bookingReducer,
    payment: paymentReducer,
    parcel: parcelReducer,
    notifications: notificationReducer,
    call: callReducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        ignoredActions: ['persist/PERSIST', 'persist/REHYDRATE'],
      },
    }),
  devTools: process.env.NODE_ENV !== 'production',
});

export default store;