import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import api from '../../services/api';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Register user
export const register = createAsyncThunk(
  'auth/register',
  async (userData, { rejectWithValue }) => {
    try {
      // Validate required fields
      if (!userData.phoneNumber || !userData.password || !userData.name) {
        return rejectWithValue('Please fill in all required fields');
      }

      const response = await api.post('/auth/register', userData);
      
      // Check if registration was successful
      if (!response.data || !response.data.token || !response.data.user) {
        return rejectWithValue('Registration failed: Invalid response from server');
      }
      
      // Store token and user data
      await AsyncStorage.setItem('token', response.data.token);
      await AsyncStorage.setItem('user', JSON.stringify(response.data.user));
      
      return response.data;
    } catch (error) {
      // Handle different types of errors
      if (error.response) {
        // Server responded with error
        const errorMessage = error.response.data?.error || 
                           error.response.data?.message || 
                           'Registration failed. Please try again.';
        return rejectWithValue(errorMessage);
      } else if (error.request) {
        // Request made but no response
        return rejectWithValue('Network error. Please check your internet connection.');
      } else {
        // Something else happened
        return rejectWithValue(error.message || 'Registration failed. Please try again.');
      }
    }
  }
);

// Login user
export const login = createAsyncThunk(
  'auth/login',
  async ({ phoneNumber, password }, { rejectWithValue }) => {
    try {
      if (!phoneNumber || !password) {
        return rejectWithValue('Please provide phone number and password');
      }

      const response = await api.post('/auth/login', { phoneNumber, password });
      
      if (!response.data || !response.data.token || !response.data.user) {
        return rejectWithValue('Login failed: Invalid response from server');
      }
      
      await AsyncStorage.setItem('token', response.data.token);
      await AsyncStorage.setItem('user', JSON.stringify(response.data.user));
      
      return response.data;
    } catch (error) {
      if (error.response) {
        const errorMessage = error.response.data?.error || 
                           error.response.data?.message || 
                           'Login failed. Please try again.';
        return rejectWithValue(errorMessage);
      } else if (error.request) {
        return rejectWithValue('Network error. Please check your internet connection.');
      } else {
        return rejectWithValue(error.message || 'Login failed. Please try again.');
      }
    }
  }
);

// Verify OTP
export const verifyOTP = createAsyncThunk(
  'auth/verifyOTP',
  async ({ phoneNumber, otp }, { rejectWithValue }) => {
    try {
      if (!phoneNumber || !otp) {
        return rejectWithValue('Please provide phone number and OTP');
      }

      const response = await api.post('/auth/verify-otp', { phoneNumber, otp });
      
      if (!response.data || !response.data.token || !response.data.user) {
        return rejectWithValue('OTP verification failed: Invalid response from server');
      }
      
      await AsyncStorage.setItem('token', response.data.token);
      await AsyncStorage.setItem('user', JSON.stringify(response.data.user));
      
      return response.data;
    } catch (error) {
      if (error.response) {
        const errorMessage = error.response.data?.error || 
                           error.response.data?.message || 
                           'OTP verification failed. Please try again.';
        return rejectWithValue(errorMessage);
      } else if (error.request) {
        return rejectWithValue('Network error. Please check your internet connection.');
      } else {
        return rejectWithValue(error.message || 'OTP verification failed. Please try again.');
      }
    }
  }
);

// Logout
export const logout = createAsyncThunk(
  'auth/logout',
  async (_, { rejectWithValue }) => {
    try {
      await AsyncStorage.removeItem('token');
      await AsyncStorage.removeItem('user');
      return null;
    } catch (error) {
      return rejectWithValue('Logout failed');
    }
  }
);

// Check auth status on app start
export const checkAuthStatus = createAsyncThunk(
  'auth/checkAuthStatus',
  async (_, { rejectWithValue }) => {
    try {
      const token = await AsyncStorage.getItem('token');
      const userString = await AsyncStorage.getItem('user');
      
      if (token && userString) {
        const user = JSON.parse(userString);
        return { token, user };
      }
      
      return null;
    } catch (error) {
      return rejectWithValue('Failed to check auth status');
    }
  }
);

const authSlice = createSlice({
  name: 'auth',
  initialState: {
    user: null,
    token: null,
    isAuthenticated: false,
    loading: false,
    error: null,
    isCheckingAuth: true,
  },
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
    clearAuth: (state) => {
      state.user = null;
      state.token = null;
      state.isAuthenticated = false;
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // Register
      .addCase(register.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(register.fulfilled, (state, action) => {
        state.loading = false;
        state.isAuthenticated = true;
        state.user = action.payload.user;
        state.token = action.payload.token;
        state.error = null;
      })
      .addCase(register.rejected, (state, action) => {
        state.loading = false;
        state.isAuthenticated = false;
        state.user = null;
        state.token = null;
        state.error = action.payload || 'Registration failed';
      })
      
      // Login
      .addCase(login.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(login.fulfilled, (state, action) => {
        state.loading = false;
        state.isAuthenticated = true;
        state.user = action.payload.user;
        state.token = action.payload.token;
        state.error = null;
      })
      .addCase(login.rejected, (state, action) => {
        state.loading = false;
        state.isAuthenticated = false;
        state.user = null;
        state.token = null;
        state.error = action.payload || 'Login failed';
      })
      
      // Verify OTP
      .addCase(verifyOTP.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(verifyOTP.fulfilled, (state, action) => {
        state.loading = false;
        state.isAuthenticated = true;
        state.user = action.payload.user;
        state.token = action.payload.token;
        state.error = null;
      })
      .addCase(verifyOTP.rejected, (state, action) => {
        state.loading = false;
        state.isAuthenticated = false;
        state.user = null;
        state.token = null;
        state.error = action.payload || 'OTP verification failed';
      })
      
      // Logout
      .addCase(logout.fulfilled, (state) => {
        state.user = null;
        state.token = null;
        state.isAuthenticated = false;
        state.error = null;
      })
      
      // Check auth status
      .addCase(checkAuthStatus.pending, (state) => {
        state.isCheckingAuth = true;
      })
      .addCase(checkAuthStatus.fulfilled, (state, action) => {
        state.isCheckingAuth = false;
        if (action.payload) {
          state.isAuthenticated = true;
          state.user = action.payload.user;
          state.token = action.payload.token;
        } else {
          state.isAuthenticated = false;
          state.user = null;
          state.token = null;
        }
      })
      .addCase(checkAuthStatus.rejected, (state) => {
        state.isCheckingAuth = false;
        state.isAuthenticated = false;
        state.user = null;
        state.token = null;
      });
  },
});

export const { clearError, clearAuth } = authSlice.actions;
export default authSlice.reducer;