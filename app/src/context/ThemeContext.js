import React, { createContext, useContext, useState, useEffect, useMemo, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { palette } from '../theme/tokens';

const THEME_STORAGE_KEY = '@raftar_theme_mode';


// Legacy keys (accent, accentText, pickup, dropoff, danger, ...) are kept so
// existing screens keep working; they now resolve to Raftar brand tokens.
// "accent" is the single primary action color = Deep Teal.
// "gold" is the brand accent (badges, ratings, money buttons).
const SHARED_COLORS = {
  primary: palette.primary,
  onPrimary: palette.cream,
  accent: palette.primary,
  accentText: palette.cream,
  onAccent: palette.onAccent,
  gold: palette.accent,
  onGold: palette.text,
  goldDark: palette.goldDark,
  cream: palette.cream,
  pickup: palette.primary,
  dropoff: palette.accent,
  success: palette.success,
  successBg: palette.successBg,
  danger: palette.warning, // no red in the app: errors/destructive use Slate
  warning: palette.warning,
  stop: palette.goldDark,
  placeholder: palette.placeholder,
  disabledBg: palette.disabledBg,
  disabledText: palette.disabledText,
  onPrimaryMuted: palette.onPrimaryMuted,
  overlay: palette.overlay,
};

export const LIGHT_COLORS = {
  ...SHARED_COLORS,
  background: palette.background,
  card: palette.card,
  cardElevated: palette.surface,
  surface: palette.surface,
  text: palette.text,
  textSecondary: palette.textMuted,
  textMuted: palette.textMuted,
  border: palette.border,
  switchTrackOff: palette.border,
  switchThumbOff: palette.white,
  statusBarStyle: 'dark-content'
};

// Brand-consistent dark variant (teal-tinted neutrals). The design spec is
// light-first; dark stays available through the existing Dark Mode toggle.
export const DARK_COLORS = {
  ...SHARED_COLORS,
  accent: palette.cream,
  accentText: palette.primary,
  onAccent: palette.primary, // accent is cream in dark mode
  pickup: palette.cream,
  background: '#06231F',
  card: '#0B2F2A',
  cardElevated: '#123B35',
  surface: '#123B35',
  text: '#F3F7F5',
  textSecondary: palette.onPrimaryMuted,
  textMuted: palette.onPrimaryMuted,
  border: '#1C4A43',
  switchTrackOff: '#1C4A43',
  switchThumbOff: palette.onPrimaryMuted,
  statusBarStyle: 'light-content'
};

const ThemeContext = createContext({
  mode: 'light',
  isDark: false,
  colors: LIGHT_COLORS,
  setMode: () => {},
  toggleTheme: () => {}
});

export const ThemeProvider = ({ children }) => {
  const [mode, setModeState] = useState('light');

  useEffect(() => {
    AsyncStorage.getItem(THEME_STORAGE_KEY)
      .then(saved => {
        if (saved === 'light' || saved === 'dark') {
          setModeState(saved);
        }
      })
      .catch(error => console.error('Error loading theme:', error));
  }, []);

  const setMode = useCallback((newMode) => {
    setModeState(newMode);
    AsyncStorage.setItem(THEME_STORAGE_KEY, newMode)
      .catch(error => console.error('Error saving theme:', error));
  }, []);

  const toggleTheme = useCallback(() => {
    setModeState(prev => {
      const next = prev === 'dark' ? 'light' : 'dark';
      AsyncStorage.setItem(THEME_STORAGE_KEY, next)
        .catch(error => console.error('Error saving theme:', error));
      return next;
    });
  }, []);

  const value = useMemo(() => ({
    mode,
    isDark: mode === 'dark',
    colors: mode === 'dark' ? DARK_COLORS : LIGHT_COLORS,
    setMode,
    toggleTheme
  }), [mode, setMode, toggleTheme]);

  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => useContext(ThemeContext);
