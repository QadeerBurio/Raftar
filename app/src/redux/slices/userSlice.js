import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import api from '../../services/api';
import storage from '../../services/storage';

// Async Thunks
export const getUserProfile = createAsyncThunk(
  'user/getProfile',
  async (_, { rejectWithValue }) => {
    try {
      const response = await api.get('/users/profile');
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.error || error.message || 'Failed to get user profile');
    }
  }
);

export const updateUserProfile = createAsyncThunk(
  'user/updateProfile',
  async (userData, { rejectWithValue }) => {
    try {
      const response = await api.put('/users/profile', userData);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.error || error.message || 'Failed to update profile');
    }
  }
);

export const updateProfilePhoto = createAsyncThunk(
  'user/updatePhoto',
  async (photo, { rejectWithValue }) => {
    try {
      const formData = new FormData();
      formData.append('profilePhoto', {
        uri: photo.uri,
        type: photo.type || 'image/jpeg',
        name: photo.fileName || 'photo.jpg'
      });
      
      const response = await api.put('/users/profile/photo', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.error || error.message || 'Failed to update photo');
    }
  }
);

export const updateSettings = createAsyncThunk(
  'user/updateSettings',
  async (settings, { rejectWithValue }) => {
    try {
      const response = await api.put('/users/settings', settings);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.error || error.message || 'Failed to update settings');
    }
  }
);

export const addEmergencyContact = createAsyncThunk(
  'user/addEmergencyContact',
  async (contact, { rejectWithValue }) => {
    try {
      const response = await api.post('/users/emergency-contacts', contact);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.error || error.message || 'Failed to add emergency contact');
    }
  }
);

export const removeEmergencyContact = createAsyncThunk(
  'user/removeEmergencyContact',
  async (contactId, { rejectWithValue }) => {
    try {
      const response = await api.delete(`/users/emergency-contacts/${contactId}`);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.error || error.message || 'Failed to remove emergency contact');
    }
  }
);

export const addSavedPlace = createAsyncThunk(
  'user/addSavedPlace',
  async (place, { rejectWithValue }) => {
    try {
      const response = await api.post('/users/saved-places', place);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.error || error.message || 'Failed to add saved place');
    }
  }
);

export const removeSavedPlace = createAsyncThunk(
  'user/removeSavedPlace',
  async (placeId, { rejectWithValue }) => {
    try {
      const response = await api.delete(`/users/saved-places/${placeId}`);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.error || error.message || 'Failed to remove saved place');
    }
  }
);

// Initial State
const initialState = {
  user: null,
  profile: null,
  settings: {
    notifications: true,
    darkMode: true,
    language: 'en',
    locationServices: true,
    soundEnabled: true,
    vibrationEnabled: true,
    emailNotifications: true,
    smsNotifications: true
  },
  emergencyContacts: [],
  savedPlaces: [],
  loading: false,
  error: null,
  updateSuccess: false
};

// Slice
const userSlice = createSlice({
  name: 'user',
  initialState,
  reducers: {
    clearUserError: (state) => {
      state.error = null;
    },
    clearUpdateSuccess: (state) => {
      state.updateSuccess = false;
    },
    setUser: (state, action) => {
      state.user = action.payload;
    },
    clearUser: (state) => {
      state.user = null;
      state.profile = null;
      state.emergencyContacts = [];
      state.savedPlaces = [];
    },
    updateLocalSettings: (state, action) => {
      state.settings = { ...state.settings, ...action.payload };
    }
  },
  extraReducers: (builder) => {
    builder
      // Get User Profile
      .addCase(getUserProfile.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(getUserProfile.fulfilled, (state, action) => {
        state.loading = false;
        state.user = action.payload.user;
        state.profile = action.payload.user;
        state.emergencyContacts = action.payload.user?.emergencyContacts || [];
        state.savedPlaces = action.payload.user?.savedPlaces || [];
        if (action.payload.user?.settings) {
          state.settings = { ...state.settings, ...action.payload.user.settings };
        }
        // Save to storage
        storage.setUser(action.payload.user);
      })
      .addCase(getUserProfile.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      
      // Update User Profile
      .addCase(updateUserProfile.pending, (state) => {
        state.loading = true;
        state.error = null;
        state.updateSuccess = false;
      })
      .addCase(updateUserProfile.fulfilled, (state, action) => {
        state.loading = false;
        state.user = action.payload.user;
        state.profile = action.payload.user;
        state.updateSuccess = true;
        storage.setUser(action.payload.user);
      })
      .addCase(updateUserProfile.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
        state.updateSuccess = false;
      })
      
      // Update Profile Photo
      .addCase(updateProfilePhoto.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(updateProfilePhoto.fulfilled, (state, action) => {
        state.loading = false;
        if (state.user) {
          state.user.profilePhoto = action.payload.profilePhoto;
        }
        state.updateSuccess = true;
        storage.setUser(state.user);
      })
      .addCase(updateProfilePhoto.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      
      // Update Settings
      .addCase(updateSettings.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(updateSettings.fulfilled, (state, action) => {
        state.loading = false;
        state.settings = { ...state.settings, ...action.payload.settings };
        state.updateSuccess = true;
      })
      .addCase(updateSettings.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      
      // Add Emergency Contact
      .addCase(addEmergencyContact.fulfilled, (state, action) => {
        state.emergencyContacts.push(action.payload.contact);
        state.updateSuccess = true;
      })
      
      // Remove Emergency Contact
      .addCase(removeEmergencyContact.fulfilled, (state, action) => {
        state.emergencyContacts = state.emergencyContacts.filter(
          contact => (contact.id || contact._id) !== action.payload.contactId
        );
        state.updateSuccess = true;
      })
      
      // Add Saved Place
      .addCase(addSavedPlace.fulfilled, (state, action) => {
        state.savedPlaces.push(action.payload.place);
        state.updateSuccess = true;
      })
      
      // Remove Saved Place
      .addCase(removeSavedPlace.fulfilled, (state, action) => {
        state.savedPlaces = state.savedPlaces.filter(
          place => (place.id || place._id) !== action.payload.placeId
        );
        state.updateSuccess = true;
      });
  }
});

// Actions
export const {
  clearUserError,
  clearUpdateSuccess,
  setUser,
  clearUser,
  updateLocalSettings
} = userSlice.actions;

// Selectors
export const selectUser = (state) => state.user.user;
export const selectUserProfile = (state) => state.user.profile;
export const selectUserSettings = (state) => state.user.settings;
export const selectEmergencyContacts = (state) => state.user.emergencyContacts;
export const selectSavedPlaces = (state) => state.user.savedPlaces;
export const selectUserLoading = (state) => state.user.loading;
export const selectUserError = (state) => state.user.error;
export const selectUpdateSuccess = (state) => state.user.updateSuccess;

export default userSlice.reducer;