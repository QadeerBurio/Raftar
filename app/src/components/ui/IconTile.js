import React from 'react';
import { View } from 'react-native';
import { useTheme } from '../../context/ThemeContext';
import { serviceTints, sizes } from '../../theme/tokens';
import { renderIcon } from './icons';

/**
 * Soft tint square with an icon. size: 'sm' (36) | 'md' (44) | 'lg' (48).
 * tint: a serviceTints key (ride, carpool, monthly, parcel, intercity) or pass bg/color.
 */
const IconTile = ({ icon, size = 'md', tint, bg, color, style }) => {
  const { colors } = useTheme();
  const dim = typeof size === 'number' ? size : sizes.iconTile[size] || 44;
  const t = tint ? serviceTints[tint] : null;
  return (
    <View
      style={[
        {
          width: dim, height: dim, borderRadius: Math.round(dim * 0.32),
          backgroundColor: bg || (t ? t.bg : colors.surface),
          alignItems: 'center', justifyContent: 'center',
        },
        style,
      ]}
    >
      {renderIcon(icon, { size: Math.round(dim * 0.5), color: color || (t ? t.icon : colors.accent) })}
    </View>
  );
};

export default IconTile;
