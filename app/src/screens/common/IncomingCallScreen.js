import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, SafeAreaView, Vibration } from 'react-native';
import { useSelector, useDispatch } from 'react-redux';
import Icon from 'react-native-vector-icons/MaterialIcons';
import CallService from '../../services/CallService';
import { endCall, setCallError } from '../../redux/slices/callSlice';

const IncomingCallScreen = ({ navigation }) => {
  const dispatch = useDispatch();
  const { peerName, callId, rideId } = useSelector(state => state.call);

  React.useEffect(() => {
    Vibration.vibrate([1000, 2000, 1000, 2000], true);
    return () => Vibration.cancel();
  }, []);

  const handleAccept = async () => {
    Vibration.cancel();
    await CallService.handleAnswerCall({ callUUID: callId });
    navigation.navigate('InCall');
  };

  const handleDecline = () => {
    Vibration.cancel();
    CallService.endCallLocally();
    // Dispatch end to clear state
    dispatch(endCall({ reason: 'declined' }));
    navigation.goBack();
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <Icon name="person" size={80} color="#FFD700" style={styles.avatar} />
        <Text style={styles.title}>Incoming Call</Text>
        <Text style={styles.name}>{peerName || 'Raftar User'}</Text>
        <Text style={styles.subtitle}>Raftar Audio Call</Text>
      </View>

      <View style={styles.actions}>
        <TouchableOpacity style={[styles.actionButton, styles.declineButton]} onPress={handleDecline}>
          <Icon name="call-end" size={32} color="#FFF" />
        </TouchableOpacity>
        <TouchableOpacity style={[styles.actionButton, styles.acceptButton]} onPress={handleAccept}>
          <Icon name="call" size={32} color="#FFF" />
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
  content: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatar: {
    marginBottom: 20,
    backgroundColor: '#333',
    padding: 20,
    borderRadius: 60,
    overflow: 'hidden'
  },
  title: {
    fontSize: 24,
    color: '#FFF',
    marginBottom: 10,
  },
  name: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#FFD700',
    marginBottom: 10,
  },
  subtitle: {
    fontSize: 16,
    color: '#888',
  },
  actions: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingBottom: 50,
  },
  actionButton: {
    width: 70,
    height: 70,
    borderRadius: 35,
    justifyContent: 'center',
    alignItems: 'center',
  },
  declineButton: {
    backgroundColor: '#FF3B30',
  },
  acceptButton: {
    backgroundColor: '#34C759',
  }
});

export default IncomingCallScreen;
