import { createSlice } from '@reduxjs/toolkit';

const initialState = {
  callState: 'idle', // idle, ringing, connecting, active, ended, failed
  callId: null,
  rideId: null,
  isCaller: false,
  peerId: null,
  peerName: null,
  peerRole: null,
  isMuted: false,
  isSpeaker: false,
  durationSeconds: 0,
  error: null,
};

const callSlice = createSlice({
  name: 'call',
  initialState,
  reducers: {
    setIncomingCall: (state, action) => {
      state.callState = 'ringing';
      state.callId = action.payload.callId;
      state.rideId = action.payload.rideId;
      state.isCaller = false;
      state.peerId = action.payload.callerId;
      state.peerName = action.payload.callerName || 'Unknown';
      state.peerRole = action.payload.callerRole;
      state.error = null;
    },
    setOutgoingCall: (state, action) => {
      state.callState = 'connecting';
      state.callId = action.payload.callId;
      state.rideId = action.payload.rideId;
      state.isCaller = true;
      state.peerId = action.payload.calleeId;
      state.peerName = action.payload.calleeName || 'Unknown';
      state.error = null;
    },
    setCallActive: (state) => {
      state.callState = 'active';
    },
    updateDuration: (state) => {
      if (state.callState === 'active') {
        state.durationSeconds += 1;
      }
    },
    toggleMute: (state) => {
      state.isMuted = !state.isMuted;
    },
    toggleSpeaker: (state) => {
      state.isSpeaker = !state.isSpeaker;
    },
    endCall: (state, action) => {
      state.callState = 'ended';
      state.error = action.payload?.reason || null;
    },
    resetCallState: (state) => {
      return initialState;
    },
    setCallError: (state, action) => {
      state.callState = 'failed';
      state.error = action.payload;
    }
  }
});

export const {
  setIncomingCall,
  setOutgoingCall,
  setCallActive,
  updateDuration,
  toggleMute,
  toggleSpeaker,
  endCall,
  resetCallState,
  setCallError
} = callSlice.actions;

export default callSlice.reducer;
