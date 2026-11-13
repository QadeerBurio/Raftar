import React from 'react';
import { View, Text, TextInput, Pressable, StyleSheet } from 'react-native';
import { useTheme } from '../../context/ThemeContext';
import { palette, radius, typography } from '../../theme/tokens';

export const PickupDot = ({ size = 14 }) => (
  <View
    style={{
      width: size, height: size, borderRadius: size / 2,
      borderWidth: 3, borderColor: palette.primary, backgroundColor: palette.white,
    }}
  />
);

export const DestinationSquare = ({ size = 14 }) => (
  <View
    style={{
      width: size, height: size, borderRadius: 3,
      borderWidth: 2, borderColor: palette.primary, backgroundColor: palette.accent,
    }}
  />
);

const Row = ({ marker, label, value, placeholder, onPress, onChangeText, editable, colors, right, inputProps }) => {
  const content = (
    <>
      <View style={styles.marker}>{marker}</View>
      <View style={styles.textCol}>
        {label ? <Text style={[styles.label, { color: colors.textSecondary }]}>{label}</Text> : null}
        {editable ? (
          <TextInput
            value={value}
            onChangeText={onChangeText}
            placeholder={placeholder}
            placeholderTextColor={colors.placeholder}
            style={[styles.value, styles.input, { color: colors.text }]}
            accessibilityLabel={label || placeholder}
            {...inputProps}
          />
        ) : (
          <Text numberOfLines={1} style={[styles.value, { color: value ? colors.text : colors.placeholder }]}>
            {value || placeholder}
          </Text>
        )}
      </View>
      {right}
    </>
  );
  if (onPress && !editable) {
    return (
      <Pressable style={styles.row} onPress={onPress} accessibilityRole="button" accessibilityLabel={`${label || placeholder}: ${value || 'not set'}`}>
        {content}
      </Pressable>
    );
  }
  return <View style={styles.row}>{content}</View>;
};

/**
 * One Mist block with pickup (teal ring) and destination (gold square) rows.
 * Pass onPickupPress/onDestinationPress for tap-to-search, or editable + onChange* for inline inputs.
 */
const RouteInput = ({
  pickupValue,
  destinationValue,
  pickupLabel = 'Pickup',
  destinationLabel = 'Destination',
  pickupPlaceholder = 'Current location',
  destinationPlaceholder = 'Where to?',
  onPickupPress,
  onDestinationPress,
  onPickupChange,
  onDestinationChange,
  editable = false,
  pickupRight,
  destinationRight,
  pickupInputProps,
  destinationInputProps,
  style,
}) => {
  const { colors } = useTheme();
  return (
    <View style={[styles.block, { backgroundColor: colors.surface }, style]}>
      <Row
        marker={<PickupDot />} label={pickupLabel} value={pickupValue} placeholder={pickupPlaceholder}
        onPress={onPickupPress} onChangeText={onPickupChange} editable={editable} colors={colors}
        right={pickupRight} inputProps={pickupInputProps}
      />
      <View style={styles.dividerRow}>
        <View style={[styles.connector, { backgroundColor: colors.border }]} />
        <View style={[styles.divider, { backgroundColor: colors.border }]} />
      </View>
      <Row
        marker={<DestinationSquare />} label={destinationLabel} value={destinationValue} placeholder={destinationPlaceholder}
        onPress={onDestinationPress} onChangeText={onDestinationChange} editable={editable} colors={colors}
        right={destinationRight} inputProps={destinationInputProps}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  block: { borderRadius: radius.field + 4, paddingHorizontal: 16, paddingVertical: 4 },
  row: { flexDirection: 'row', alignItems: 'center', minHeight: 56 },
  marker: { width: 24, alignItems: 'center', marginRight: 12 },
  textCol: { flex: 1 },
  label: { ...typography.small, fontSize: 12 },
  value: { ...typography.bodyStrong },
  input: { paddingVertical: 2 },
  dividerRow: { flexDirection: 'row', alignItems: 'center', height: 1 },
  connector: { width: 2, height: 1, marginLeft: 11, marginRight: 23 },
  divider: { flex: 1, height: 1 },
});

export default RouteInput;
