import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import api from '../../services/api';

export const createCarpoolBooking = createAsyncThunk(
  'booking/createCarpool',
  async (bookingData, { rejectWithValue }) => {
    try {
      const response = await api.post('/bookings/carpool', bookingData);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.error || error.message || 'Failed to create carpool');
    }
  }
);

export const createCarpoolRequest = createAsyncThunk(
  'booking/createCarpoolRequest',
  async (requestData, { rejectWithValue }) => {
    try {
      const response = await api.post('/bookings/carpool/request', requestData);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.error || 'Failed to post request');
    }
  }
);

export const getAvailableCarpools = createAsyncThunk(
  'booking/getAvailableCarpools',
  async (params, { rejectWithValue }) => {
    try {
      const response = await api.get('/bookings/carpool/available', { params });
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.error || error.message || 'Failed to get carpools');
    }
  }
);

export const joinCarpool = createAsyncThunk(
  'booking/joinCarpool',
  async ({ carpoolId, pickup, dropoff }, { rejectWithValue }) => {
    try {
      const response = await api.post(`/bookings/carpool/${carpoolId}/join`, { pickup, dropoff });
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.error || error.message || 'Failed to join carpool');
    }
  }
);

export const createMonthlyPass = createAsyncThunk(
  'booking/createMonthlyPass',
  async (passData, { rejectWithValue }) => {
    try {
      const response = await api.post('/bookings/monthly-pass', passData);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.error || error.message || 'Failed to create monthly pass');
    }
  }
);

export const acceptCarpoolRequest = createAsyncThunk(
  'booking/acceptCarpoolRequest',
  async ({ carpoolId, passengerId }, { rejectWithValue }) => {
    try {
      const response = await api.post(`/bookings/carpool/${carpoolId}/accept/${passengerId}`);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.error || 'Failed to accept request');
    }
  }
);

export const acceptPassengerCarpoolRequest = createAsyncThunk(
  'booking/acceptPassengerCarpoolRequest',
  async (carpoolId, { rejectWithValue }) => {
    try {
      const response = await api.post(`/bookings/carpool/request/${carpoolId}/accept`);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.error || 'Failed to accept passenger request');
    }
  }
);

export const rejectCarpoolRequest = createAsyncThunk(
  'booking/rejectCarpoolRequest',
  async ({ carpoolId, passengerId }, { rejectWithValue }) => {
    try {
      const response = await api.post(`/bookings/carpool/${carpoolId}/reject/${passengerId}`);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.error || error.message || 'Failed to reject request');
    }
  }
);

export const startCarpool = createAsyncThunk(
  'booking/startCarpool',
  async (carpoolId, { rejectWithValue }) => {
    try {
      const response = await api.post(`/bookings/carpool/${carpoolId}/start`);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.error || error.message || 'Failed to start carpool');
    }
  }
);

export const completeCarpool = createAsyncThunk(
  'booking/completeCarpool',
  async (carpoolId, { rejectWithValue }) => {
    try {
      const response = await api.post(`/bookings/carpool/${carpoolId}/complete`);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.error || error.message || 'Failed to complete carpool');
    }
  }
);

const bookingSlice = createSlice({
  name: 'booking',
  initialState: {
    carpools: [],
    availableCarpools: [],
    monthlyPasses: [],
    currentBooking: null,
    loading: false,
    error: null
  },
  reducers: {
    clearError: (state) => {
      state.error = null;
    }
  },
  extraReducers: (builder) => {
    builder
      .addCase(createCarpoolBooking.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(createCarpoolBooking.fulfilled, (state, action) => {
        state.loading = false;
        state.currentBooking = action.payload.booking;
        state.carpools.unshift(action.payload.booking);
      })
      .addCase(createCarpoolBooking.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      .addCase(getAvailableCarpools.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(getAvailableCarpools.fulfilled, (state, action) => {
        state.loading = false;
        state.availableCarpools = action.payload.carpools || [];
      })
      .addCase(getAvailableCarpools.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      .addCase(joinCarpool.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(joinCarpool.fulfilled, (state, action) => {
        state.loading = false;
        state.currentBooking = action.payload.booking;
      })
      .addCase(joinCarpool.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });
  }
});

export const { clearError } = bookingSlice.actions;
export default bookingSlice.reducer;