import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import api from '../../services/api';

export const createRide = createAsyncThunk(
  'ride/createRide',
  async (rideData, { rejectWithValue }) => {
    try {
      const response = await api.post('/rides', rideData);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.error || error.message || 'Failed to create ride');
    }
  }
);

export const getRideDetails = createAsyncThunk(
  'ride/getRideDetails',
  async (rideId, { rejectWithValue }) => {
    try {
      const response = await api.get(`/rides/${rideId}`);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.error || error.message || 'Failed to get ride details');
    }
  }
);

export const cancelRide = createAsyncThunk(
  'ride/cancelRide',
  async (rideId, { rejectWithValue }) => {
    try {
      const response = await api.put(`/rides/${rideId}/cancel`);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.error || error.message || 'Failed to cancel ride');
    }
  }
);

export const acceptRide = createAsyncThunk(
  'ride/acceptRide',
  async (rideId, { rejectWithValue }) => {
    try {
      const response = await api.put(`/rides/${rideId}/accept`);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.error || error.message || 'Failed to accept ride');
    }
  }
);

export const acceptCounterOffer = createAsyncThunk(
  'ride/acceptCounterOffer',
  async ({ rideId, driverId, amount }, { rejectWithValue }) => {
    try {
      const response = await api.put(`/rides/${rideId}/accept-counter`, { driverId, amount });
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.error || error.message || 'Failed to accept counter offer');
    }
  }
);

export const startRide = createAsyncThunk(
  'ride/startRide',
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
  'ride/completeRide',
  async ({ rideId, paymentData }, { rejectWithValue }) => {
    try {
      const response = await api.put(`/rides/${rideId}/complete`, paymentData);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.error || error.message || 'Failed to complete ride');
    }
  }
);

export const sendChatMessage = createAsyncThunk(
  'ride/sendChatMessage',
  async ({ rideId, message }, { rejectWithValue }) => {
    try {
      const response = await api.post(`/rides/${rideId}/chat`, { message });
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.error || error.message || 'Failed to send message');
    }
  }
);

const rideSlice = createSlice({
  name: 'ride',
  initialState: {
    currentRide: null,
    rideHistory: [],
    activeRides: [],
    loading: false,
    error: null,
    chatMessages: []
  },
  reducers: {
    clearCurrentRide: (state) => {
      state.currentRide = null;
    },
    clearError: (state) => {
      state.error = null;
    },
    addChatMessage: (state, action) => {
      state.chatMessages.push(action.payload);
    },
    updateDriverLocation: (state, action) => {
      if (state.currentRide) {
        state.currentRide.driverLocation = action.payload;
      }
    }
  },
  extraReducers: (builder) => {
    builder
      // Create Ride
      .addCase(createRide.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(createRide.fulfilled, (state, action) => {
        state.loading = false;
        state.currentRide = action.payload.ride;
      })
      .addCase(createRide.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      // Get Ride Details
      .addCase(getRideDetails.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(getRideDetails.fulfilled, (state, action) => {
        state.loading = false;
        state.currentRide = action.payload.ride;
      })
      .addCase(getRideDetails.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      // Cancel Ride
      .addCase(cancelRide.fulfilled, (state) => {
        state.currentRide = null;
      })
      // Accept Ride
      .addCase(acceptRide.fulfilled, (state, action) => {
        state.currentRide = action.payload.ride;
      })
      // Accept Counter Offer
      .addCase(acceptCounterOffer.fulfilled, (state, action) => {
        state.currentRide = action.payload.ride;
      })
      // Start Ride
      .addCase(startRide.fulfilled, (state, action) => {
        state.currentRide = action.payload.ride;
      })
      // Complete Ride
      .addCase(completeRide.fulfilled, (state, action) => {
        state.currentRide = null;
        state.rideHistory.unshift(action.payload.ride);
      });
  }
});

export const { clearCurrentRide, clearError, addChatMessage, updateDriverLocation } = rideSlice.actions;
export default rideSlice.reducer;