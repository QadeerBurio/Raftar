export const COLORS = {
  primary: '#FFD700',
  secondary: '#4ECDC4',
  danger: '#FF6B6B',
  warning: '#FF9F43',
  success: '#00B894',
  info: '#45B7D1',
  background: '#121212',
  surface: '#1E1E1E',
  surfaceLight: '#2A2A2A',
  text: '#FFFFFF',
  textSecondary: '#888888',
  textMuted: '#666666',
  border: '#333333'
};

// Canonical vehicle list — ids must match the server enum in models/Ride.js
// and pricingService.js (bike, rickshaw, car, ac_car, luxury_car).
export const VEHICLE_TYPES = [
  {
    id: 'bike',
    label: 'Bike',
    icon: 'motorbike',
    iconType: 'material-community',
    price: 100,
    pricePerKm: 8,
    capacity: 1,
    capacityLabel: '1 Person',
    time: '5-10 min',
    description: 'Fast & economical',
    color: '#FF6B6B'
  },
  {
    id: 'rickshaw',
    label: 'Rickshaw',
    icon: 'rickshaw',
    iconType: 'material-community',
    price: 150,
    pricePerKm: 12,
    capacity: 3,
    capacityLabel: '3 Persons',
    time: '10-15 min',
    description: 'Budget friendly',
    color: '#FF9F43'
  },
  {
    id: 'car',
    label: 'Car',
    icon: 'car',
    iconType: 'material-community',
    price: 200,
    pricePerKm: 15,
    capacity: 4,
    capacityLabel: '4 Persons',
    time: '8-12 min',
    description: 'Comfortable ride',
    color: '#F9C349'
  },
  {
    id: 'ac_car',
    label: 'AC Car',
    icon: 'snowflake',
    iconType: 'material-community',
    price: 250,
    pricePerKm: 18,
    capacity: 4,
    capacityLabel: '4 Persons',
    time: '10-15 min',
    description: 'Cool & comfortable',
    color: '#4ECDC4'
  },
  {
    id: 'luxury_car',
    label: 'Luxury',
    icon: 'car-sports',
    iconType: 'material-community',
    price: 400,
    pricePerKm: 25,
    capacity: 4,
    capacityLabel: '4 Persons',
    time: '12-20 min',
    description: 'Premium experience',
    color: '#2C3E50'
  }
];

export const getVehicleType = (id) =>
  VEHICLE_TYPES.find(v => v.id === id);

export const RIDE_STATUS = {
  PENDING: 'pending',
  SEARCHING: 'searching',
  ACCEPTED: 'accepted',
  STARTED: 'started',
  COMPLETED: 'completed',
  CANCELLED: 'cancelled'
};

export const PAYMENT_METHODS = [
  { id: 'cash', label: 'Cash', icon: 'money' },
  { id: 'easypaisa', label: 'Easypaisa', icon: 'phone-android' },
  { id: 'jazzcash', label: 'JazzCash', icon: 'phone-android' },
  { id: 'raast', label: 'Raast', icon: 'account-balance' },
  { id: 'wallet', label: 'Wallet', icon: 'account-balance-wallet' }
];

export const DOCUMENT_TYPES = [
  { id: 'cnicFront', label: 'CNIC Front', required: true },
  { id: 'cnicBack', label: 'CNIC Back', required: true },
  { id: 'drivingLicense', label: 'Driving License', required: true },
  { id: 'vehicleRegistration', label: 'Vehicle Registration', required: true },
  { id: 'selfie', label: 'Selfie with CNIC', required: true }
];

export const NOTIFICATION_TYPES = {
  RIDE_REQUEST: 'ride_request',
  RIDE_ACCEPTED: 'ride_accepted',
  RIDE_STARTED: 'ride_started',
  RIDE_COMPLETED: 'ride_completed',
  RIDE_CANCELLED: 'ride_cancelled',
  PAYMENT_RECEIVED: 'payment_received',
  DRIVER_APPROVED: 'driver_approved',
  DRIVER_REJECTED: 'driver_rejected',
  PROMOTIONAL: 'promotional'
};