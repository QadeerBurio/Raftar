import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, TextInput, ActivityIndicator, Alert } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import api from '../../services/api';

const RatingComponent = ({ bookingId, tripType, ratedUser, ratedUserRole, onDone }) => {
  const [stars, setStars] = useState(0);
  const [complaint, setComplaint] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (stars === 0) {
      Alert.alert('Rating Required', 'Please select a star rating first.');
      return;
    }

    setIsSubmitting(true);
    try {
      await api.post('/ratings/submit', {
        bookingId,
        tripType,
        ratedUser,
        ratedUserRole,
        stars,
        complaint: complaint.trim()
      });
      onDone();
    } catch (error) {
      console.error('Submit rating error:', error);
      Alert.alert('Error', error.response?.data?.error || 'Failed to submit rating. Please try again.');
      setIsSubmitting(false);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Rate your {ratedUserRole}</Text>
      
      <View style={styles.starsContainer}>
        {[1, 2, 3, 4, 5].map((num) => (
          <TouchableOpacity key={num} onPress={() => setStars(num)}>
            <Icon 
              name={num <= stars ? "star" : "star-border"} 
              size={36} 
              color="#FFD700" 
              style={styles.starIcon} 
            />
          </TouchableOpacity>
        ))}
      </View>

      <TextInput
        style={styles.input}
        placeholder="Complaint (optional)"
        placeholderTextColor="#888"
        value={complaint}
        onChangeText={setComplaint}
        multiline
        numberOfLines={3}
      />

      <View style={styles.actions}>
        <TouchableOpacity style={styles.skipButton} onPress={onDone} disabled={isSubmitting}>
          <Text style={styles.skipText}>Skip</Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={[styles.submitButton, stars === 0 && styles.disabledButton]} 
          onPress={handleSubmit}
          disabled={isSubmitting || stars === 0}
        >
          {isSubmitting ? (
            <ActivityIndicator size="small" color="#121212" />
          ) : (
            <Text style={styles.submitText}>Submit</Text>
          )}
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: '100%',
    marginTop: 20,
    borderTopWidth: 1,
    borderTopColor: '#333',
    paddingTop: 20,
  },
  title: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 15,
  },
  starsContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginBottom: 20,
  },
  starIcon: {
    marginHorizontal: 5,
  },
  input: {
    backgroundColor: '#2A2A2A',
    borderRadius: 10,
    color: '#FFF',
    padding: 12,
    minHeight: 80,
    textAlignVertical: 'top',
    marginBottom: 20,
  },
  actions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  skipButton: {
    flex: 1,
    padding: 12,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#444',
    alignItems: 'center',
    marginRight: 10,
  },
  skipText: {
    color: '#CCC',
    fontWeight: 'bold',
    fontSize: 16,
  },
  submitButton: {
    flex: 1,
    backgroundColor: '#FFD700',
    padding: 12,
    borderRadius: 10,
    alignItems: 'center',
    marginLeft: 10,
  },
  submitText: {
    color: '#121212',
    fontWeight: 'bold',
    fontSize: 16,
  },
  disabledButton: {
    opacity: 0.5,
  }
});

export default RatingComponent;
