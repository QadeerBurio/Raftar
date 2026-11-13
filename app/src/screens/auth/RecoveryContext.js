import React, { createContext, useContext, useRef, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
const Context = createContext(null);
const key = 'raftar-recovery-challenge';
export function RecoveryProvider({
  children
}) {
  const [challenge, setValue] = useState(null);
  const token = useRef(null);
  const cleared = useRef(false);
  const save = async data => {
    cleared.current = false;
    const safe = {
      challengeId: data.challengeId,
      maskedDestination: data.maskedDestination,
      expiresAt: data.expiresAt,
      resendAt: data.resendAt,
      serverNow: data.serverNow,
      offset: Date.parse(data.serverNow) - Date.now()
    };
    setValue(safe);
    try {
      await AsyncStorage.setItem(key, JSON.stringify(safe));
    } catch (e) {/* In-memory recovery still works when storage is unavailable. */}
  };
  const clear = async () => {
    cleared.current = true;
    token.current = null;
    setValue(null);
    try {
      await AsyncStorage.removeItem(key);
    } catch (e) {/* Server has already invalidated any completed challenge. */}
  };
  return <Context.Provider value={{
    challenge,
    save,
    clear,
    token,
    restore: async () => {
      if (cleared.current) return null;
      try { const v=await AsyncStorage.getItem(key);return v?JSON.parse(v):null; } catch(e) { return null; }
    }
  }}>{children}</Context.Provider>;
}
export const useRecovery = () => useContext(Context);
export { passwordValid } from '../../utils/passwordPolicy';
export function normalizeRecoveryDestination(value) {
  const raw = String(value || '').trim();
  if (/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(raw) && raw.length <= 254) return raw.toLowerCase();
  let n = raw.replace(/[\s()-]/g, '');
  if (n.startsWith('0092')) n = '+' + n.slice(2);else if (n.startsWith('03')) n = '+92' + n.slice(1);else if (/^923\d{9}$/.test(n)) n = '+' + n;else if (/^3\d{9}$/.test(n)) n = '+92' + n;
  return /^\+923\d{9}$/.test(n) ? n : null;
}
