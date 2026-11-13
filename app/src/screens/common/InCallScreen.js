import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, SafeAreaView } from 'react-native';
import { useSelector, useDispatch } from 'react-redux';
import Icon from 'react-native-vector-icons/MaterialIcons';
import CallService from '../../services/CallService';
import { updateDuration, endCall } from '../../redux/slices/callSlice';

const InCallScreen = ({ navigation }) => {
  const dispatch = useDispatch();
  const { peerName, callState, durationSeconds, isMuted, isSpeaker } = useSelector(state => state.call);

  useEffect(() => {
    let interval;
    if (callState === 'active') {
      interval = setInterval(() => {
        dispatch(updateDuration());
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [callState]);

  useEffect(() => {
    if (callState === 'ended' || callState === 'failed') {
      navigation.goBack();
    }
  }, [callState]);

  const handleEndCall = () => {
    CallService.endCallLocally();
    // Removed navigation.goBack() here to prevent double navigation, 
    // the useEffect above will handle it when state changes to 'ended'
  };

  const handleMute = () => {
    CallService.toggleMute();
  };

  const handleSpeaker = () => {
    // Requires react-native-incall-manager for proper routing, just a stub for now
    // CallService.toggleSpeaker();
  };

  const formatDuration = (seconds) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.statusText}>
          {callState === 'connecting' ? 'Calling...' : 
           callState === 'ringing' ? 'Ringing...' :
           formatDuration(durationSeconds)}
        </Text>
      </View>

      <View style={styles.content}>
        <Icon name="person" size={100} color="#FFD700" style={styles.avatar} />
        <Text style={styles.name}>{peerName || 'Raftar User'}</Text>
        <Text style={styles.subtitle}>Raftar Audio Call</Text>
      </View>

      <View style={styles.actions}>
        <TouchableOpacity 
          style={[styles.controlButton, isMuted && styles.controlButtonActive]} 
          onPress={handleMute}
        >
          <Icon name={isMuted ? "mic-off" : "mic"} size={28} color={isMuted ? "#121212" : "#FFF"} />
        </TouchableOpacity>

        <TouchableOpacity 
          style={styles.endButton} 
          onPress={handleEndCall}
        >
          <Icon name="call-end" size={32} color="#FFF" />
        </TouchableOpacity>

        <TouchableOpacity 
          style={[styles.controlButton, isSpeaker && styles.controlButtonActive]} 
          onPress={handleSpeaker}
        >
          <Icon name="volume-up" size={28} color={isSpeaker ? "#121212" : "#FFF"} />
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#121212',
    justifyContent: 'space-between',
  },
  header: {
    alignItems: 'center',
    paddingTop: 40,
  },
  statusText: {
    color: '#FFD700',
    fontSize: 18,
    fontWeight: '500',
  },
  content: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatar: {
    marginBottom: 30,
    backgroundColor: '#333',
    padding: 30,
    borderRadius: 80,
    overflow: 'hidden'
  },
  name: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#FFF',
    marginBottom: 10,
  },
  subtitle: {
    fontSize: 16,
    color: '#888',
  },
  actions: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    paddingBottom: 50,
    paddingHorizontal: 40,
  },
  controlButton: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#333',
    justifyContent: 'center',
    alignItems: 'center',
  },
  controlButtonActive: {
    backgroundColor: '#FFD700',
  },
  endButton: {
    width: 76,
    height: 76,
    borderRadius: 38,
    backgroundColor: '#FF3B30',
    justifyContent: 'center',
    alignItems: 'center',
  }
});

export default InCallScreen;
