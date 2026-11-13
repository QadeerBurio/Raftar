import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import api from '../../services/api';

export const createParcel = createAsyncThunk(
  'parcel/create',
  async (parcelData, { rejectWithValue }) => {
    try {
      const response = await api.post('/parcels', parcelData);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.error || error.message || 'Failed to create parcel');
    }
  }
);

export const getParcelDetails = createAsyncThunk(
  'parcel/getDetails',
  async (parcelId, { rejectWithValue }) => {
    try {
      const response = await api.get(`/parcels/${parcelId}`);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.error || error.message || 'Failed to get parcel details');
    }
  }
);

export const getParcelHistory = createAsyncThunk(
  'parcel/getHistory',
  async (params, { rejectWithValue }) => {
    try {
      const response = await api.get('/parcels/history', { params });
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.error || error.message || 'Failed to get parcel history');
    }
  }
);

const parcelSlice = createSlice({
  name: 'parcel',
  initialState: {
    parcels: [],
    currentParcel: null,
    history: [],
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
      .addCase(createParcel.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(createParcel.fulfilled, (state, action) => {
        state.loading = false;
        state.currentParcel = action.payload.parcel;
        state.parcels.unshift(action.payload.parcel);
      })
      .addCase(createParcel.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      .addCase(getParcelDetails.fulfilled, (state, action) => {
        state.currentParcel = action.payload.parcel;
      })
      .addCase(getParcelHistory.fulfilled, (state, action) => {
        state.history = action.payload.parcels || [];
      });
  }
});

export const { clearError } = parcelSlice.actions;
export default parcelSlice.reducer;