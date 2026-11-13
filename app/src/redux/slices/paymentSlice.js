import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import api from '../../services/api';

export const processPayment = createAsyncThunk(
  'payment/process',
  async (paymentData, { rejectWithValue }) => {
    try {
      const response = await api.post('/payments/process', paymentData);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.error || error.message || 'Payment failed');
    }
  }
);

export const getWalletBalance = createAsyncThunk(
  'payment/getWalletBalance',
  async (_, { rejectWithValue }) => {
    try {
      const response = await api.get('/payments/wallet/balance');
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.error || error.message || 'Failed to get wallet balance');
    }
  }
);

export const addToWallet = createAsyncThunk(
  'payment/addToWallet',
  async ({ amount, paymentMethod }, { rejectWithValue }) => {
    try {
      const response = await api.post('/payments/wallet/add', { amount, paymentMethod });
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.error || error.message || 'Failed to add to wallet');
    }
  }
);

export const getPaymentMethods = createAsyncThunk(
  'payment/getPaymentMethods',
  async (_, { rejectWithValue }) => {
    try {
      const response = await api.get('/payments/methods');
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.error || error.message || 'Failed to get payment methods');
    }
  }
);

export const addPaymentMethod = createAsyncThunk(
  'payment/addPaymentMethod',
  async (methodData, { rejectWithValue }) => {
    try {
      const response = await api.post('/payments/methods', methodData);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.error || error.message || 'Failed to add payment method');
    }
  }
);

export const removePaymentMethod = createAsyncThunk(
  'payment/removePaymentMethod',
  async (methodId, { rejectWithValue }) => {
    try {
      const response = await api.delete(`/payments/methods/${methodId}`);
      return methodId; // return id to remove from state
    } catch (error) {
      return rejectWithValue(error.response?.data?.error || error.message || 'Failed to remove payment method');
    }
  }
);

const paymentSlice = createSlice({
  name: 'payment',
  initialState: {
    walletBalance: 0,
    paymentMethods: [],
    transactions: [],
    currentPayment: null,
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
      .addCase(processPayment.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(processPayment.fulfilled, (state, action) => {
        state.loading = false;
        state.currentPayment = action.payload.payment;
        state.transactions.unshift(action.payload.payment);
      })
      .addCase(processPayment.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      .addCase(getWalletBalance.fulfilled, (state, action) => {
        state.walletBalance = action.payload.balance || 0;
      })
      .addCase(addToWallet.fulfilled, (state, action) => {
        state.walletBalance = action.payload.balance;
      })
      .addCase(getPaymentMethods.fulfilled, (state, action) => {
        state.paymentMethods = action.payload.paymentMethods || action.payload || [];
      })
      .addCase(addPaymentMethod.fulfilled, (state, action) => {
        if (action.payload.paymentMethod) {
          state.paymentMethods.push(action.payload.paymentMethod);
        } else {
          state.paymentMethods.push(action.payload);
        }
      })
      .addCase(removePaymentMethod.fulfilled, (state, action) => {
        state.paymentMethods = state.paymentMethods.filter(method => method.id !== action.payload && method._id !== action.payload);
      });
  }
});

export const { clearError } = paymentSlice.actions;
export default paymentSlice.reducer;