import React, { useState, useEffect, useMemo } from 'react';
import { useTheme } from '../../context/ThemeContext';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  ActivityIndicator,
  Alert
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import api from '../../services/api';
import CarpoolMapPreview from '../../components/common/CarpoolMapPreview';

const DriverCarpoolRequestsScreen = () => {
  const { colors, isDark } = useTheme();
  const styles = useMemo(() => createStyles(colors, isDark), [colors, isDark]);
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigation = useNavigation();

  useEffect(() => {
    fetchRequests();
  }, []);

  const fetchRequests = async () => {
    setLoading(true);
    try {
      const res = await api.get('/bookings/carpool/requests');
      if (res.data?.success) {
        setRequests(res.data.carpools);
      }
    } catch (error) {
      console.error('Fetch carpool requests error:', error);
      Alert.alert('Error', 'Failed to fetch carpool requests');
    } finally {
      setLoading(false);
    }
  };

  const handleAcceptRequest = async (carpool) => {
    try {
      const res = await api.post(`/bookings/carpool/request/${carpool._id}/accept`);
      if (res.data?.success) {
        Alert.alert('Success', `You have accepted ${carpool.passengerId?.name}'s request!`, [
          {
            text: 'OK',
            onPress: () => {
              fetchRequests();
              // Navigate to active carpool tracking screen if needed
              // navigation.navigate('CarpoolExecution', { carpoolId: carpool._id });
            }
          }
        ]);
      }
    } catch (error) {
      console.error('Accept carpool request error:', error);
      Alert.alert('Error', error.response?.data?.error || 'Failed to accept request');
    }
  };

  const renderItem = ({ item }) => {
    return (
      <View style={styles.card}>
        <View style={styles.header}>
          <Text style={styles.passengerName}>{item.passengerId?.name || 'Passenger'}</Text>
          <Text style={styles.status}>{item.status.toUpperCase()}</Text>
        </View>
        <View style={styles.route}>
          <Icon name="my-location" size={16} color="#4ECDC4" />
          <Text style={styles.addressText} numberOfLines={1}>{item.pickup?.address}</Text>
        </View>
        <View style={styles.route}>
          <Icon name="location-on" size={16} color="#FF6B6B" />
          <Text style={styles.addressText} numberOfLines={1}>{item.dropoff?.address}</Text>
        </View>

        <CarpoolMapPreview 
          pickup={item.pickup} 
          dropoff={item.dropoff} 
          style={{ height: 160, marginBottom: 12 }} 
        />
        <View style={styles.footer}>
          <Text style={styles.timeText}>
            {item.timeWindow?.start ? new Date(item.timeWindow.start).toLocaleString() : 'N/A'}
          </Text>
          <TouchableOpacity style={styles.acceptButton} onPress={() => handleAcceptRequest(item)}>
            <Text style={styles.acceptText}>Accept</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={colors.accent} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <FlatList
        data={requests}
        renderItem={renderItem}
        keyExtractor={item => item._id}
        contentContainerStyle={styles.list}
        ListEmptyComponent={
          <View style={styles.center}>
            <Text style={styles.emptyText}>No passenger carpool requests right now.</Text>
          </View>
        }
        refreshing={loading}
        onRefresh={fetchRequests}
      />
    </View>
  );
};

const createStyles = (colors, isDark) => {
  const cardBg = isDark ? colors.card : '#FFFFFF';
  const insetBg = isDark ? colors.cardElevated : '#F5F5F5';
  return StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20
  },
  list: {
    padding: 16
  },
  card: {
    backgroundColor: colors.card,
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: colors.border
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12
  },
  passengerName: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: 'bold'
  },
  status: {
    color: colors.accent,
    fontSize: 12,
    fontWeight: 'bold'
  },
  route: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8
  },
  addressText: {
    color: '#ccc',
    fontSize: 14,
    marginLeft: 8,
    flex: 1
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 12,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    paddingTop: 12
  },
  timeText: {
    color: colors.textSecondary,
    fontSize: 12
  },
  acceptButton: {
    backgroundColor: colors.accent,
    paddingHorizontal: 20,
    paddingVertical: 8,
    borderRadius: 20
  },
  acceptText: {
    color: '#121212',
    fontWeight: 'bold'
  },
  emptyText: {
    color: colors.textSecondary,
    fontSize: 16,
    textAlign: 'center'
  }
  });
};

export default DriverCarpoolRequestsScreen;
