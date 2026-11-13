import React, { useState, useEffect } from 'react';
import { 
  View, Text, StyleSheet, ScrollView, TouchableOpacity, 
  TextInput, Alert, Image, ActivityIndicator 
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/MaterialIcons';
import * as ImagePicker from 'expo-image-picker';
import api from '../../services/api';
import { useSelector } from 'react-redux';

const CreditsScreen = ({ navigation }) => {
  const { user } = useSelector(state => state.auth);
  
  const [balance, setBalance] = useState(0);
  const [loading, setLoading] = useState(false);
  const [requests, setRequests] = useState([]);
  
  // Form State
  const [amount, setAmount] = useState('');
  const [senderName, setSenderName] = useState('');
  const [transactionId, setTransactionId] = useState('');
  const [screenshot, setScreenshot] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const balRes = await api.get('/payments/wallet/balance');
      if (balRes.data.success) {
        setBalance(balRes.data.balance);
      }

      const reqRes = await api.get('/payments/transactions?type=wallet_add');
      if (reqRes.data.success) {
        setRequests(reqRes.data.transactions || []);
      }
    } catch (error) {
      console.error('Error fetching credits data:', error);
    } finally {
      setLoading(false);
    }
  };

  const pickImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission Denied', 'We need camera roll permissions to upload the receipt.');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      quality: 0.8,
    });

    if (!result.canceled) {
      setScreenshot(result.assets[0]);
    }
  };

  const submitRequest = async () => {
    if (!amount || !senderName || !transactionId || !screenshot) {
      Alert.alert('Missing Fields', 'Please fill all fields and attach a screenshot.');
      return;
    }

    setSubmitting(true);
    try {
      const formData = new FormData();
      formData.append('amount', amount);
      formData.append('senderName', senderName);
      formData.append('transactionId', transactionId);
      
      const filename = screenshot.uri.split('/').pop();
      const match = /\.(\w+)$/.exec(filename);
      const type = match ? `image/${match[1]}` : `image`;

      formData.append('screenshot', {
        uri: screenshot.uri,
        name: filename,
        type
      });

      const res = await api.post('/payments/credit-request', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      if (res.data.success) {
        Alert.alert('Success', 'Credit request submitted and is awaiting approval.');
        setAmount('');
        setSenderName('');
        setTransactionId('');
        setScreenshot(null);
        fetchData();
      }
    } catch (error) {
      console.error('Submit error:', error);
      Alert.alert('Error', error.response?.data?.error || 'Failed to submit request');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Icon name="arrow-back" size={24} color="#000" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>My Credits</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Balance Card */}
        <View style={styles.balanceCard}>
          <Text style={styles.balanceLabel}>Current Balance</Text>
          <Text style={styles.balanceValue}>PKR {balance}</Text>
        </View>

        {/* Bank Instructions */}
        <View style={styles.bankCard}>
          <View style={styles.bankHeader}>
            <Icon name="account-balance" size={24} color="#F9C349" />
            <Text style={styles.bankTitle}>Bank Details for Transfer</Text>
          </View>
          <Text style={styles.bankInfo}>Bank Name: Raftar Dummy Bank</Text>
          <Text style={styles.bankInfo}>Account Title: Raftar Operations</Text>
          <Text style={styles.bankInfo}>Account No: 12345678901234</Text>
          <Text style={styles.bankInfo}>IBAN: PK00DUMM012345678901234</Text>
          <Text style={styles.bankSubInfo}>Please transfer funds here and submit the receipt below to get credits.</Text>
        </View>

        {/* Request Form */}
        <View style={styles.formContainer}>
          <Text style={styles.sectionTitle}>Add Credits</Text>
          
          <TextInput
            style={styles.input}
            placeholder="Amount Sent (PKR)"
            keyboardType="numeric"
            value={amount}
            onChangeText={setAmount}
          />
          <TextInput
            style={styles.input}
            placeholder="Sender Name"
            value={senderName}
            onChangeText={setSenderName}
          />
          <TextInput
            style={styles.input}
            placeholder="Bank Challan / Transaction ID"
            value={transactionId}
            onChangeText={setTransactionId}
          />

          <TouchableOpacity style={styles.uploadBtn} onPress={pickImage}>
            <Icon name="cloud-upload" size={24} color="#F9C349" />
            <Text style={styles.uploadText}>
              {screenshot ? 'Screenshot Attached' : 'Upload Receipt Screenshot'}
            </Text>
          </TouchableOpacity>

          {screenshot && (
            <Image source={{ uri: screenshot.uri }} style={styles.previewImage} />
          )}

          <TouchableOpacity 
            style={[styles.submitBtn, submitting && styles.submitBtnDisabled]} 
            onPress={submitRequest}
            disabled={submitting}
          >
            {submitting ? (
              <ActivityIndicator color="#000" />
            ) : (
              <Text style={styles.submitBtnText}>Submit Request</Text>
            )}
          </TouchableOpacity>
        </View>

        {/* Request History */}
        <View style={styles.historyContainer}>
          <Text style={styles.sectionTitle}>Request History</Text>
          {loading ? (
            <ActivityIndicator color="#F9C349" />
          ) : requests.length === 0 ? (
            <Text style={styles.noHistory}>No past requests found.</Text>
          ) : (
            requests.map(req => (
              <View key={req._id} style={styles.historyCard}>
                <View style={styles.historyHeader}>
                  <Text style={styles.historyAmount}>PKR {req.amount}</Text>
                  <Text style={[styles.historyStatus, 
                    { color: req.status === 'completed' ? 'green' : req.status === 'failed' ? 'red' : 'orange' }
                  ]}>
                    {req.status.toUpperCase()}
                  </Text>
                </View>
                <Text style={styles.historyDate}>{new Date(req.createdAt).toLocaleDateString()}</Text>
                <Text style={styles.historyTxn}>Txn ID: {req.transactionId}</Text>
                {req.status === 'failed' && req.metadata?.rejectionReason && (
                  <View style={styles.rejectionBox}>
                    <Text style={styles.rejectionText}>Reason: {req.metadata.rejectionReason}</Text>
                  </View>
                )}
              </View>
            ))
          )}
        </View>
        <View style={{ height: 40 }} />
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F7FA'
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    backgroundColor: '#FFF'
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1A1A2E'
  },
  content: {
    flex: 1,
    padding: 16
  },
  balanceCard: {
    backgroundColor: '#1A1A2E',
    padding: 24,
    borderRadius: 16,
    alignItems: 'center',
    marginBottom: 20
  },
  balanceLabel: {
    color: '#CCC',
    fontSize: 14,
    marginBottom: 8
  },
  balanceValue: {
    color: '#F9C349',
    fontSize: 32,
    fontWeight: 'bold'
  },
  bankCard: {
    backgroundColor: '#FFF',
    padding: 16,
    borderRadius: 12,
    marginBottom: 20,
    borderLeftWidth: 4,
    borderLeftColor: '#F9C349'
  },
  bankHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12
  },
  bankTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1A1A2E',
    marginLeft: 8
  },
  bankInfo: {
    fontSize: 14,
    color: '#333',
    marginBottom: 4,
    fontWeight: '500'
  },
  bankSubInfo: {
    fontSize: 12,
    color: '#888',
    marginTop: 8,
    fontStyle: 'italic'
  },
  formContainer: {
    backgroundColor: '#FFF',
    padding: 16,
    borderRadius: 12,
    marginBottom: 20
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1A1A2E',
    marginBottom: 16
  },
  input: {
    backgroundColor: '#F5F7FA',
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 8,
    padding: 12,
    marginBottom: 12,
    fontSize: 14
  },
  uploadBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFF8E8',
    borderWidth: 1,
    borderColor: '#F9C349',
    borderStyle: 'dashed',
    borderRadius: 8,
    padding: 16,
    marginBottom: 12
  },
  uploadText: {
    marginLeft: 8,
    color: '#1A1A2E',
    fontWeight: '500'
  },
  previewImage: {
    width: '100%',
    height: 150,
    borderRadius: 8,
    marginBottom: 12,
    resizeMode: 'cover'
  },
  submitBtn: {
    backgroundColor: '#F9C349',
    padding: 16,
    borderRadius: 8,
    alignItems: 'center'
  },
  submitBtnDisabled: {
    opacity: 0.7
  },
  submitBtnText: {
    color: '#1A1A2E',
    fontWeight: 'bold',
    fontSize: 16
  },
  historyContainer: {
    marginBottom: 20
  },
  noHistory: {
    color: '#888',
    textAlign: 'center',
    fontStyle: 'italic'
  },
  historyCard: {
    backgroundColor: '#FFF',
    padding: 16,
    borderRadius: 8,
    marginBottom: 12
  },
  historyHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8
  },
  historyAmount: {
    fontWeight: 'bold',
    fontSize: 16,
    color: '#1A1A2E'
  },
  historyStatus: {
    fontWeight: 'bold',
    fontSize: 14
  },
  historyDate: {
    color: '#888',
    fontSize: 12,
    marginBottom: 4
  },
  historyTxn: {
    color: '#555',
    fontSize: 12
  },
  rejectionBox: {
    marginTop: 8,
    backgroundColor: '#FFF0F0',
    padding: 8,
    borderRadius: 4
  },
  rejectionText: {
    color: '#D32F2F',
    fontSize: 12,
    fontWeight: '500'
  }
});

export default CreditsScreen;
