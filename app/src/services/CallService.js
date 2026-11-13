import { Alert, Platform } from 'react-native';
import { setIncomingCall, setOutgoingCall, setCallActive, endCall, setCallError } from '../redux/slices/callSlice';
import { store } from '../redux/store';
import { VOIP_CALLING_ENABLED } from '../config/constants';

// We dynamically require these so Expo Go doesn't crash on startup if the flag is false
let RTCPeerConnection, RTCIceCandidate, RTCSessionDescription, mediaDevices;
let RNCallKeep;

if (VOIP_CALLING_ENABLED) {
  try {
    const WebRTC = require('react-native-webrtc');
    RTCPeerConnection = WebRTC.RTCPeerConnection;
    RTCIceCandidate = WebRTC.RTCIceCandidate;
    RTCSessionDescription = WebRTC.RTCSessionDescription;
    mediaDevices = WebRTC.mediaDevices;
    
    RNCallKeep = require('react-native-callkeep').default;
  } catch (e) {
    console.warn('Native calling modules not found. Are you in Expo Go?');
  }
}

const configuration = {
  iceServers: [
    { urls: 'stun:stun.l.google.com:19302' },
  ],
};

class CallService {
  constructor() {
    this.peerConnection = null;
    this.localStream = null;
    this.remoteStream = null;
    this.socket = null;
    this.callUUID = null;
    this.isInitialized = false;
  }

  async init(socket) {
    if (this.isInitialized) return;
    this.socket = socket;

    try {
      if (!RNCallKeep) {
        console.log('RNCallKeep is undefined. Skipping initialization for Expo Go.');
        return;
      }

      const options = {
        ios: {
          appName: 'Raftar',
          includesCallsInRecents: true,
        },
        android: {
          alertTitle: 'Permissions required',
          alertDescription: 'This application needs to access your phone accounts',
          cancelButton: 'Cancel',
          okButton: 'ok',
          additionalPermissions: ['android.permission.RECORD_AUDIO'],
          selfManaged: true,
        }
      };

      await RNCallKeep.setup(options);
      RNCallKeep.setAvailable(true);
      
      this.setupCallKeepListeners();
      this.setupSocketListeners();
      
      this.isInitialized = true;
    } catch (err) {
      console.error('CallKeep setup error:', err);
    }
  }

  setupCallKeepListeners() {
    RNCallKeep.addEventListener('answerCall', this.handleAnswerCall.bind(this));
    RNCallKeep.addEventListener('endCall', this.handleEndCall.bind(this));
  }

  setupSocketListeners() {
    if (!this.socket) return;

    this.socket.on('incoming-call', (data) => {
      this.callUUID = data.callId; // or generate a UUID
      store.dispatch(setIncomingCall(data));
      
      // Native incoming call UI
      if (RNCallKeep) {
        RNCallKeep.displayIncomingCall(
          this.callUUID,
          data.callerName,
          data.callerName,
          'generic',
          true
        );
      }
    });

    this.socket.on('call-answered', async (data) => {
      try {
        if (this.peerConnection) {
          await this.peerConnection.setRemoteDescription(new RTCSessionDescription(data.answer));
          store.dispatch(setCallActive());
        }
      } catch (err) {
        console.error('Error setting remote description:', err);
      }
    });

    this.socket.on('ice-candidate', (data) => {
      if (this.peerConnection) {
        this.peerConnection.addIceCandidate(new RTCIceCandidate(data.candidate));
      }
    });

    this.socket.on('call-ended', () => {
      this.endCallLocally();
    });

    this.socket.on('call-rejected', () => {
      this.endCallLocally();
      store.dispatch(setCallError('Call was rejected'));
    });
  }

  async setupMediaStream() {
    try {
      if (!mediaDevices) {
        Alert.alert('Calling Unavailable', 'You are running in Expo Go. The native calling features cannot access the microphone here. Please build a custom dev client using EAS.');
        throw new Error('mediaDevices is undefined');
      }

      const stream = await mediaDevices.getUserMedia({
        audio: true,
        video: false
      });
      this.localStream = stream;
      return stream;
    } catch (err) {
      console.error('Error getting user media:', err);
      throw err;
    }
  }

  createPeerConnection(rideId, targetUserId) {
    this.peerConnection = new RTCPeerConnection(configuration);

    if (this.localStream) {
      this.localStream.getTracks().forEach(track => {
        this.peerConnection.addTrack(track, this.localStream);
      });
    }

    this.peerConnection.onicecandidate = (event) => {
      if (event.candidate && this.socket) {
        this.socket.emit('ice-candidate', {
          rideId,
          receiverId: targetUserId,
          candidate: event.candidate,
          senderId: store.getState().user.id
        });
      }
    };

    this.peerConnection.ontrack = (event) => {
      this.remoteStream = event.streams[0];
      // In a real app, bind this stream to a RTCView or audio element
    };
  }

  async startCall(rideId, calleeId, calleeName) {
    try {
      await this.setupMediaStream();
      this.createPeerConnection(rideId, calleeId);
      
      const offer = await this.peerConnection.createOffer();
      await this.peerConnection.setLocalDescription(offer);

      const callerId = store.getState().user.id;
      
      store.dispatch(setOutgoingCall({
        rideId,
        calleeId,
        calleeName,
        callId: new Date().getTime().toString() // Temporary ID
      }));

      if (RNCallKeep) {
        RNCallKeep.startCall(this.callUUID, calleeName, calleeName, 'generic', false);
      }

      this.socket.emit('call:initiate', {
        rideId,
        callerId,
        calleeId,
        offer
      });
    } catch (err) {
      console.error('Error starting call:', err);
      store.dispatch(setCallError('Failed to start call. Ensure microphone permissions.'));
    }
  }

  async handleAnswerCall({ callUUID }) {
    if (callUUID !== this.callUUID) return;
    
    const state = store.getState().call;
    
    try {
      await this.setupMediaStream();
      this.createPeerConnection(state.rideId, state.peerId);
      
      // We would normally set remote description here from the initial offer
      // then create answer and send it via socket
      
      store.dispatch(setCallActive());
      
      if (RNCallKeep) {
        RNCallKeep.setCurrentCallActive(callUUID);
      }
    } catch (err) {
      console.error('Error answering call:', err);
    }
  }

  handleEndCall({ callUUID }) {
    const state = store.getState().call;
    
    if (this.socket && state.rideId) {
      this.socket.emit('call:end', {
        rideId: state.rideId,
        senderId: store.getState().user.id,
        receiverId: state.peerId,
        callId: state.callId
      });
    }
    
    this.endCallLocally();
  }

  endCallLocally() {
    if (this.localStream) {
      this.localStream.getTracks().forEach(track => track.stop());
      this.localStream = null;
    }
    
    if (this.peerConnection) {
      this.peerConnection.close();
      this.peerConnection = null;
    }
    
    if (this.callUUID && RNCallKeep) {
      RNCallKeep.endCall(this.callUUID);
      this.callUUID = null;
    }
    
    store.dispatch(endCall());
  }

  toggleMute() {
    if (this.localStream) {
      const audioTrack = this.localStream.getAudioTracks()[0];
      if (audioTrack) {
        audioTrack.enabled = !audioTrack.enabled;
        store.dispatch(toggleMute());
      }
    }
  }
}

export default new CallService();
