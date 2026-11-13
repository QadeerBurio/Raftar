import React from 'react';
import { View, TouchableOpacity, StyleSheet } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';

const RatingStars = ({
  rating = 0,
  maxStars = 5,
  size = 24,
  editable = false,
  onRatingChange,
  color = '#FFD700',
  emptyColor = '#333'
}) => {
  const handlePress = (index) => {
    if (editable && onRatingChange) {
      onRatingChange(index + 1);
    }
  };

  return (
    <View style={styles.container}>
      {[...Array(maxStars)].map((_, index) => (
        <TouchableOpacity
          key={index}
          onPress={() => handlePress(index)}
          disabled={!editable}
          style={styles.star}
        >
          <Icon
            name={index < rating ? 'star' : 'star-border'}
            size={size}
            color={index < rating ? color : emptyColor}
          />
        </TouchableOpacity>
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  star: {
    paddingHorizontal: 2,
  },
});

export default RatingStars;