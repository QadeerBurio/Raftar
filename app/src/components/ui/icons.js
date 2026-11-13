import React from 'react';
import {
  User, Mail, CreditCard, FileText, Inbox, Phone, Lock, MapPin, Search, Calendar,
  Clock, Car, Wallet, Bell, Star, Info, Navigation, Hash, Building2, Bike, Package,
} from 'lucide-react-native';
import { sizes } from '../../theme/tokens';

// Legacy MaterialIcons names still passed by some screens -> lucide icons.
const LEGACY = {
  person: User,
  email: Mail,
  'credit-card': CreditCard,
  description: FileText,
  inbox: Inbox,
  phone: Phone,
  lock: Lock,
  'location-on': MapPin,
  place: MapPin,
  search: Search,
  event: Calendar,
  schedule: Clock,
  'directions-car': Car,
  'account-balance-wallet': Wallet,
  notifications: Bell,
  star: Star,
  info: Info,
  'my-location': Navigation,
  numbers: Hash,
  'account-balance': Building2,
  'two-wheeler': Bike,
  'local-shipping': Package,
};

/**
 * Renders a lucide icon. `icon` may be a lucide component or a legacy string name.
 */
export const renderIcon = (icon, { size = sizes.icon, color, strokeWidth = sizes.iconStroke } = {}) => {
  if (!icon) return null;
  if (React.isValidElement(icon)) return icon;
  const Cmp = typeof icon === 'string' ? LEGACY[icon] || Info : icon;
  return <Cmp size={size} color={color} strokeWidth={strokeWidth} />;
};
