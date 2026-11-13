import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import api from '../../services/api';

export const registerDriver = createAsyncThunk(
  'driver/register',
  async (driverData, { rejectWithValue }) => {
    try {
      const formData = new FormData();
      Object.keys(driverData).forEach(key => {
        if (key === 'documents') {
          Object.keys(driverData.documents).forEach(docKey => {
            formData.append(docKey, driverData.documents[docKey]);
          });
        } else {
          formData.append(key, JSON.stringify(driverData[key]));
        }
      });
      
      const response = await api.post('/drivers/register', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.error || error.message || 'Failed to register as driver');
    }
  }
);

export const getDriverProfile = createAsyncThunk(
  'driver/getProfile',
  async (_, { rejectWithValue }) => {
    try {
      const response = await api.get('/drivers/profile');
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.error || error.message || 'Failed to get driver profile');
    }
  }
);

export const getDriverStats = createAsyncThunk(
  'driver/getStats',
  async (_, { rejectWithValue }) => {
    try {
      const response = await api.get('/drivers/stats');
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.error || error.message || 'Failed to get driver stats');
    }
  }
);

export const toggleOnlineStatus = createAsyncThunk(
  'driver/toggleOnline',
  async (isOnline, { rejectWithValue }) => {
    try {
      const response = await api.put('/drivers/online-status', { isOnline });
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.error || error.message || 'Failed to toggle online status');
    }
  }
);

export const getRideRequests = createAsyncThunk(
  'driver/getRideRequests',
  async (type, { rejectWithValue }) => {
    try {
      const url = type ? `/drivers/ride-requests?type=${type}` : '/drivers/ride-requests';
      const response = await api.get(url);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.error || error.message || 'Failed to get ride requests');
    }
  }
);

export const acceptRide = createAsyncThunk(
  'driver/acceptRide',
  async (rideId, { rejectWithValue }) => {
    try {
      const response = await api.put(`/rides/${rideId}/accept`);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.error || error.message || 'Failed to accept ride');
    }
  }
);

export const counterOffer = createAsyncThunk(
  'driver/counterOffer',
  async ({ rideId, amount }, { rejectWithValue }) => {
    try {
      const response = await api.put(`/rides/${rideId}/counter-offer`, { amount });
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.error || error.message || 'Failed to send counter offer');
    }
  }
);

export const startRide = createAsyncThunk(
  'driver/startRide',
  async (rideId, { rejectWithValue }) => {
    try {
      const response = await api.put(`/rides/${rideId}/start`);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.error || error.message || 'Failed to start ride');
    }
  }
);

export const completeRide = createAsyncThunk(
  'driver/completeRide',
  async (rideId, { rejectWithValue }) => {
    try {
      const response = await api.put(`/rides/${rideId}/complete`);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.error || error.message || 'Failed to complete ride');
    }
  }
);

export const cancelRide = createAsyncThunk(
  'driver/cancelRide',
  async (rideId, { rejectWithValue }) => {
    try {
      const response = await api.put(`/rides/${rideId}/cancel`);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.error || error.message || 'Failed to cancel ride');
    }
  }
);

const driverSlice = createSlice({
  name: 'driver',
  initialState: {
    driver: null,
    stats: null,
    rideRequests: [],
    loading: false,
    error: null,
    isOnline: false
  },
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
    updateLocation: (state, action) => {
      if (state.driver) {
        state.driver.location = action.payload;
      }
    },
    removeRideRequest: (state, action) => {
      state.rideRequests = state.rideRequests.filter(r => r._id !== action.payload);
    }
  },
  extraReducers: (builder) => {
    builder
      .addCase(registerDriver.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(registerDriver.fulfilled, (state, action) => {
        state.loading = false;
        state.driver = action.payload.driver;
      })
      .addCase(registerDriver.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      .addCase(getDriverProfile.fulfilled, (state, action) => {
        state.driver = action.payload.driver;
        state.isOnline = action.payload.driver?.isOnline || false;
      })
      .addCase(getDriverStats.fulfilled, (state, action) => {
        state.stats = action.payload.stats;
      })
      .addCase(toggleOnlineStatus.fulfilled, (state, action) => {
        state.isOnline = action.payload.isOnline;
        if (state.driver) {
          state.driver.isOnline = action.payload.isOnline;
        }
      })
      .addCase(getRideRequests.fulfilled, (state, action) => {
        state.rideRequests = action.payload.rides;
      });
  }
});

export const { clearError, updateLocation, removeRideRequest } = driverSlice.actions;
export default driverSlice.reducer;