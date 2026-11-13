// Raftar design tokens (mobile).
// Keep in sync with admin/src/theme/tokens.js: same values, same names.
// Screens must import colors from here (or useTheme()), never hardcode hex values.

export const palette = {
  primary: '#013E37', // Deep Teal: main buttons, dark cards, headers, selected chips, map route
  primaryPressed: '#012C27',
  accent: '#F4B400', // Raftar Gold: logo tile, badges, ratings, destination marker, money buttons
  accentPressed: '#DCA200',
  cream: '#FFEFB3', // selected cards, tags, secondary buttons, text on teal
  onAccent: '#FFEFB3', // text/icons on theme colors.accent (= Deep Teal). Not for gold: use text on gold.
  text: '#0F1F1C',
  textMuted: '#4F6964',
  placeholder: '#5E7A74',
  surface: '#EAF2EF', // Mist: inputs, tiles, segmented controls
  background: '#FBFAF5',
  card: '#FFFFFF',
  border: '#E3ECE8',
  warning: '#5B6B68', // Slate: warnings, log out, delete. No red anywhere.
  success: '#0F7B3E',
  successBg: '#E6F4EA',
  onPrimaryMuted: '#B7D3CB', // secondary text on teal
  disabledBg: '#E3ECE8',
  disabledText: '#5E7A74',
  white: '#FFFFFF',
  overlay: 'rgba(15,31,28,0.45)',
  primaryBorder: 'rgba(1,62,55,0.35)',
  primaryShadow: 'rgba(1,62,55,0.28)',
  goldDark: '#8A5A00', // gold-family color that passes contrast as text
};

// Service tile tints: { bg, icon }
export const serviceTints = {
  ride: { bg: '#013E37', icon: '#F4B400' },
  carpool: { bg: '#E6F4EA', icon: '#0F7B3E' },
  monthly: { bg: '#E2EFEA', icon: '#0B5C52' },
  parcel: { bg: '#FFF4D1', icon: '#8A5A00' },
  intercity: { bg: '#EAF6DC', icon: '#3F6F14' },
};

// Inter font families (loaded in App.js via @expo-google-fonts/inter).
// On Android, fontWeight does not select a weight for custom fonts, so each
// weight is its own family.
export const fonts = {
  regular: 'Inter_400Regular',
  medium: 'Inter_500Medium',
  semibold: 'Inter_600SemiBold',
  bold: 'Inter_700Bold',
  extrabold: 'Inter_800ExtraBold',
  black: 'Inter_900Black',
};

export const typography = {
  display: { fontFamily: fonts.extrabold, fontSize: 30, lineHeight: 36 },
  amount: { fontFamily: fonts.black, fontSize: 40, lineHeight: 46 },
  amountLarge: { fontFamily: fonts.black, fontSize: 52, lineHeight: 58 },
  title: { fontFamily: fonts.extrabold, fontSize: 22, lineHeight: 28 },
  cardTitle: { fontFamily: fonts.bold, fontSize: 17, lineHeight: 22 },
  body: { fontFamily: fonts.regular, fontSize: 15, lineHeight: 22.5 },
  bodyStrong: { fontFamily: fonts.semibold, fontSize: 15, lineHeight: 22.5 },
  small: { fontFamily: fonts.medium, fontSize: 13, lineHeight: 18 },
  overline: {
    fontFamily: fonts.bold,
    fontSize: 13,
    lineHeight: 18,
    textTransform: 'uppercase',
    letterSpacing: 0.6,
  },
  button: { fontFamily: fonts.bold, fontSize: 16, lineHeight: 20 },
};

export const radius = {
  field: 14,
  button: 18,
  card: 20,
  cardLarge: 24,
  sheet: 28,
  chip: 999,
};

export const spacing = {
  xs: 4,
  s: 8,
  m: 10,
  l: 12,
  xl: 16,
  xxl: 24,
  screen: 20,
  screenAuth: 24,
};

export const sizes = {
  touch: 44,
  button: 56,
  input: 56,
  chip: 40,
  iconTile: { sm: 36, md: 44, lg: 48 },
  icon: 20,
  iconStroke: 2,
};

export const shadows = {
  soft: {
    shadowColor: '#0F1F1C',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 3,
  },
  primary: {
    shadowColor: '#013E37',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.28,
    shadowRadius: 16,
    elevation: 6,
  },
  sheet: {
    shadowColor: '#0F1F1C',
    shadowOffset: { width: 0, height: -6 },
    shadowOpacity: 0.1,
    shadowRadius: 18,
    elevation: 12,
  },
};

// Currency helper: the app shows "Rs", never the rupee glyph.
export const formatRs = (amount) => {
  const n = Number(amount);
  if (!Number.isFinite(n)) return `Rs ${amount ?? 0}`;
  return `Rs ${n.toLocaleString('en-PK', { maximumFractionDigits: 0 })}`;
};

const theme = { palette, serviceTints, fonts, typography, radius, spacing, sizes, shadows };
export default theme;
