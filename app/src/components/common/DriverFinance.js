import React, { useEffect, useRef, useState } from 'react';
import { Button, Text, TextInput, View } from 'react-native';
import { useSelector } from 'react-redux';
import AsyncStorage from '@react-native-async-storage/async-storage';
import api from '../../services/api';
import { pkr } from './FareBreakdown';
export default function DriverFinance() {
  const owner = useSelector(state => state.auth.user);
  const storageKey = 'driver-payout-pending-' + (owner?.id || owner?._id || 'signed-in');
  const [balances, setBalances] = useState(null),
    [amount, setAmount] = useState(''),
    [bankAccount, setAccount] = useState(''),
    [bankName, setBank] = useState(''),
    [accountHolder, setHolder] = useState(''),
    [error, setError] = useState(''),
    [busy, setBusy] = useState(false);
  const lock = useRef(false);
  const refresh = async () => {
    const r = await api.get('/drivers/profile');
    setBalances(r.data.driver);
  };
  useEffect(() => {
    refresh().catch(e => setError(e.response?.data?.error || e.message));
    AsyncStorage.getItem(storageKey).then(value => {
      if (value) {
        const pending = JSON.parse(value).body;
        setAmount(String(pending.amount));
        setAccount(pending.bankAccount);
        setBank(pending.bankName);
        setHolder(pending.accountHolder);
      }
    }).catch(() => {});
  }, []);
  const withdraw = async () => {
    if (lock.current) return;
    lock.current = true;
    setBusy(true);
    try {
      if (!/^\d+(\.\d{1,2})?$/.test(amount)) throw new Error('Valid PKR amount required');
      if (!bankAccount || !bankName || !accountHolder) throw new Error('Bank account, bank name and holder required');
      let request = JSON.parse((await AsyncStorage.getItem('driver-payout-pending')) || 'null');
      const body = {
        amount,
        bankAccount,
        bankName,
        accountHolder
      };
      if (request && JSON.stringify(request.body) !== JSON.stringify(body)) throw new Error('Retry the pending payout with the same fields before changing the request');
      if (!request) request = {
        body,
        key: 'payout-' + Date.now() + '-' + Math.random().toString(36).slice(2)
      };
      await AsyncStorage.setItem(storageKey, JSON.stringify(request));
      await api.post('/drivers/withdraw', request.body, {
        headers: {
          'Idempotency-Key': request.key
        }
      });
      await AsyncStorage.removeItem(storageKey);
      setError('Payout request submitted. Actual bank payout requires admin review.');
      setAmount('');
      await refresh();
    } catch (e) {
      setError(e.response?.data?.error || e.message);
    } finally {
      lock.current = false;
      setBusy(false);
    }
  };
  const input = {
    borderWidth: 1,
    borderColor: '#AAA',
    padding: 8,
    color: '#222',
    marginVertical: 4
  };
  return <View style={{
    backgroundColor: '#FFF8DC',
    padding: 12,
    margin: 12,
    borderRadius: 8
  }}><Text style={{
      color: '#222',
      fontWeight: 'bold'
    }}>Settled earnings: {pkr(balances?.earningsBalancePaisa)}</Text><Text style={{
      color: '#222'
    }}>Cash platform fees payable: {pkr(balances?.cashPayablePaisa)}</Text><Text style={{
      color: '#222'
    }}>Cash collected from passengers stays with you; remit the disclosed platform fee separately. This account is separate from your passenger wallet.</Text><TextInput style={input} placeholder="Withdrawal PKR" keyboardType="decimal-pad" value={amount} onChangeText={setAmount} /><TextInput style={input} placeholder="Bank account / IBAN" value={bankAccount} onChangeText={setAccount} /><TextInput style={input} placeholder="Bank name" value={bankName} onChangeText={setBank} /><TextInput style={input} placeholder="Account holder" value={accountHolder} onChangeText={setHolder} /><Button title="Request bank payout / retry" disabled={busy} onPress={withdraw} /><Button title="Refresh settled balances" disabled={busy} onPress={() => refresh().catch(e => setError(e.message))} />{error && <Text style={{
      color: '#B00020'
    }}>{error}</Text>}</View>;
}
