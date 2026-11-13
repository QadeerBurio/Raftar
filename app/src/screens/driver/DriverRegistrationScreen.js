import React, { useState, useMemo } from 'react';
import { useTheme } from '../../context/ThemeContext';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Image,
  ActivityIndicator,
  Alert,
  SafeAreaView,
  StatusBar,
  Platform,
  Dimensions,
} from 'react-native';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigation } from '@react-navigation/native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import IconIonic from 'react-native-vector-icons/Ionicons';
import IconMC from 'react-native-vector-icons/MaterialCommunityIcons';
import { LinearGradient } from 'expo-linear-gradient';
import * as ImagePicker from 'expo-image-picker';
import { registerDriver, getDriverProfile } from '../../redux/slices/driverSlice';
import { VEHICLE_TYPES } from '../../utils/constants';

const { width } = Dimensions.get('window');

// Yellow Theme Colors
const getThemePalette = (colors, isDark) => ({
  YELLOW_PRIMARY: colors.accent,
  YELLOW_SECONDARY: colors.accent,
  WHITE: isDark ? colors.card : '#FFFFFF',
  BLACK: colors.text,
  GRAY_DARK: colors.text,
  GRAY_MEDIUM: colors.textSecondary,
  GRAY_LIGHT: isDark ? colors.cardElevated : '#F5F5F5',
  GRAY_BG: colors.background,
});

const DriverRegistrationScreen = () => {
  const { colors, isDark } = useTheme();
  const { YELLOW_PRIMARY, YELLOW_SECONDARY, WHITE, BLACK, GRAY_DARK, GRAY_MEDIUM, GRAY_LIGHT, GRAY_BG } = useMemo(() => getThemePalette(colors, isDark), [colors, isDark]);
  const styles = useMemo(() => createStyles(colors, isDark), [colors, isDark]);
  const dispatch = useDispatch();
  const navigation = useNavigation();
  const { loading } = useSelector(state => state.driver);

  const [vehicle, setVehicle] = useState({
    type: 'car',
    model: '',
    year: '',
    color: '',
    plateNumber: ''
  });

  const [documents, setDocuments] = useState({
    cnicFront: null,
    cnicBack: null,
    drivingLicense: null,
    vehicleRegistration: null,
    selfie: null
  });

  const pickImage = async (field) => {
    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      quality: 0.8,
    });
    
    if (!result.canceled) {
      setDocuments(prev => ({
        ...prev,
        [field]: {
          uri: result.assets[0].uri,
          name: `${field}.jpg`,
          type: 'image/jpeg'
        }
      }));
    }
  };

  const handleSubmit = async () => {
    if (!vehicle.model || !vehicle.plateNumber) {
      Alert.alert('Missing Info', 'Please fill all vehicle details');
      return;
    }
    
    if (!documents.cnicFront || !documents.drivingLicense || !documents.selfie) {
      Alert.alert('Missing Documents', 'Please upload at least CNIC Front, Driving License, and Selfie.');
      return;
    }

    try {
      const payload = {
        vehicleDetails: vehicle,
        documents: documents
      };

      const res = await dispatch(registerDriver(payload));
      
      if (res.error) {
        Alert.alert('Registration Failed', res.payload || 'Failed to submit form');
        return;
      }
      
      await dispatch(getDriverProfile());
      
      Alert.alert(
        'Success', 
        'Your profile has been submitted for review. Verification is pending.',
        [{ text: 'OK', onPress: () => navigation.goBack() }]
      );
    } catch (error) {
      Alert.alert('Error', 'An unexpected error occurred.');
    }
  };

  const renderImagePicker = (field, label, icon) => (
    <TouchableOpacity 
      style={styles.imagePicker} 
      onPress={() => pickImage(field)}
      activeOpacity={0.7}
    >
      {documents[field] ? (
        <Image source={{ uri: documents[field].uri }} style={styles.previewImage} />
      ) : (
        <View style={styles.placeholder}>
          <View style={styles.placeholderIcon}>
            <Icon name={icon} size={28} color={YELLOW_PRIMARY} />
          </View>
          <Text style={styles.placeholderText}>{label}</Text>
          <View style={styles.uploadBadge}>
            <Icon name="cloud-upload" size={14} color={WHITE} />
          </View>
        </View>
      )}
    </TouchableOpacity>
  );

  const getDocumentStatus = () => {
    const uploaded = Object.values(documents).filter(doc => doc !== null).length;
    return `${uploaded} / ${Object.keys(documents).length} uploaded`;
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle={colors.statusBarStyle} backgroundColor={WHITE} />
      
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => navigation.goBack()}
            activeOpacity={0.7}
          >
            <IconIonic 
              name={Platform.OS === 'ios' ? 'chevron-back' : 'arrow-back'} 
              size={24} 
              color={BLACK} 
            />
          </TouchableOpacity>
          <View style={styles.headerTitleContainer}>
            <Text style={styles.headerTitle}>Driver Registration</Text>
            <Text style={styles.headerSubtitle}>Complete your profile to start earning</Text>
          </View>
          <View style={styles.headerRightPlaceholder} />
        </View>

        <ScrollView 
          style={styles.scrollView}
          contentContainerStyle={styles.content}
          showsVerticalScrollIndicator={false}
        >
          {/* Progress Indicator */}
          <View style={styles.progressContainer}>
            <View style={styles.progressBar}>
              <View style={[styles.progressFill, { width: '40%' }]} />
            </View>
            <Text style={styles.progressText}>Step 1 of 2</Text>
          </View>

          {/* Vehicle Details Section */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <View style={styles.sectionIcon}>
                <IconMC name="car" size={20} color={YELLOW_PRIMARY} />
              </View>
              <Text style={styles.sectionTitle}>Vehicle Details</Text>
            </View>
            
            <View style={styles.vehicleTypeRow}>
              {VEHICLE_TYPES.map(({ id, icon, label }) => (
                <TouchableOpacity
                  key={id}
                  style={[
                    styles.vehicleTypeButton,
                    vehicle.type === id && styles.vehicleTypeActive
                  ]}
                  onPress={() => setVehicle({ ...vehicle, type: id })}
                  activeOpacity={0.7}
                >
                  <IconMC
                    name={icon}
                    size={22}
                    color={vehicle.type === id ? WHITE : GRAY_MEDIUM}
                  />
                  <Text style={[
                    styles.vehicleTypeText,
                    vehicle.type === id && styles.vehicleTypeTextActive
                  ]}>
                    {label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <View style={styles.inputGroup}>
              <View style={styles.inputIcon}>
                <Icon name="directions-car" size={20} color={GRAY_MEDIUM} />
              </View>
              <TextInput
                style={styles.input}
                placeholder="Make & Model (e.g. Toyota Corolla)"
                placeholderTextColor={GRAY_MEDIUM}
                value={vehicle.model}
                onChangeText={text => setVehicle({ ...vehicle, model: text })}
              />
            </View>

            <View style={styles.inputRow}>
              <View style={[styles.inputGroup, styles.inputHalf]}>
                <View style={styles.inputIcon}>
                  <Icon name="event" size={20} color={GRAY_MEDIUM} />
                </View>
                <TextInput
                  style={styles.input}
                  placeholder="Year"
                  placeholderTextColor={GRAY_MEDIUM}
                  keyboardType="numeric"
                  value={vehicle.year}
                  onChangeText={text => setVehicle({ ...vehicle, year: text })}
                />
              </View>
              <View style={[styles.inputGroup, styles.inputHalf]}>
                <View style={styles.inputIcon}>
                  <Icon name="palette" size={20} color={GRAY_MEDIUM} />
                </View>
                <TextInput
                  style={styles.input}
                  placeholder="Color"
                  placeholderTextColor={GRAY_MEDIUM}
                  value={vehicle.color}
                  onChangeText={text => setVehicle({ ...vehicle, color: text })}
                />
              </View>
            </View>

            <View style={styles.inputGroup}>
              <View style={styles.inputIcon}>
                <Icon name="confirmation-number" size={20} color={GRAY_MEDIUM} />
              </View>
              <TextInput
                style={styles.input}
                placeholder="License Plate Number"
                placeholderTextColor={GRAY_MEDIUM}
                value={vehicle.plateNumber}
                onChangeText={text => setVehicle({ ...vehicle, plateNumber: text.toUpperCase() })}
              />
            </View>
          </View>

          {/* Documents Section */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <View style={styles.sectionIcon}>
                <Icon name="folder" size={20} color={YELLOW_PRIMARY} />
              </View>
              <Text style={styles.sectionTitle}>Documents & Photos</Text>
              <View style={styles.docStatus}>
                <Text style={styles.docStatusText}>{getDocumentStatus()}</Text>
              </View>
            </View>

            <View style={styles.documentGrid}>
              {renderImagePicker('selfie', 'Selfie', 'face')}
              {renderImagePicker('drivingLicense', 'Driving License', 'badge')}
              {renderImagePicker('vehicleRegistration', 'Registration', 'description')}
              {renderImagePicker('cnicFront', 'CNIC Front', 'credit-card')}
              {renderImagePicker('cnicBack', 'CNIC Back', 'credit-card')}
            </View>
          </View>

          {/* Submit Button */}
          <TouchableOpacity 
            style={[styles.submitButton, loading && styles.submitButtonDisabled]}
            onPress={handleSubmit}
            disabled={loading}
            activeOpacity={0.8}
          >
            <LinearGradient
              colors={[YELLOW_PRIMARY, YELLOW_SECONDARY]}
              style={styles.submitGradient}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
            >
              {loading ? (
                <ActivityIndicator color={WHITE} size="small" />
              ) : (
                <>
                  <Icon name="check-circle" size={22} color={WHITE} />
                  <Text style={styles.submitButtonText}>Submit Application</Text>
                </>
              )}
            </LinearGradient>
          </TouchableOpacity>

          <View style={styles.bottomSpacer} />
        </ScrollView>
      </View>
    </SafeAreaView>
  );
};

const createStyles = (colors, isDark) => {
  const { YELLOW_PRIMARY, YELLOW_SECONDARY, WHITE, BLACK, GRAY_DARK, GRAY_MEDIUM, GRAY_LIGHT, GRAY_BG } = getThemePalette(colors, isDark);
  const cardBg = isDark ? colors.card : '#FFFFFF';
  const insetBg = isDark ? colors.cardElevated : '#F5F5F5';
  return StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: WHITE,
  },
  container: {
    flex: 1,
    backgroundColor: GRAY_BG,
    marginTop:23,
    paddingBottom:30
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: Platform.OS === 'ios' ? 8 : 12,
    paddingBottom: 16,
    backgroundColor: WHITE,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 4,
  },
  headerTitleContainer: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: BLACK,
  },
  headerSubtitle: {
    fontSize: 13,
    color: GRAY_MEDIUM,
    marginTop: 1,
  },
  headerRightPlaceholder: {
    width: 40,
  },
  scrollView: {
    flex: 1,
  },
  content: {
    padding: 16,
    paddingBottom: 40,
  },
  progressContainer: {
    marginBottom: 20,
    backgroundColor: WHITE,
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
  },
  progressBar: {
    height: 6,
    backgroundColor: GRAY_LIGHT,
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: YELLOW_PRIMARY,
    borderRadius: 3,
  },
  progressText: {
    fontSize: 12,
    color: GRAY_MEDIUM,
    marginTop: 8,
  },
  section: {
    backgroundColor: WHITE,
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: colors.border,
    shadowColor: BLACK,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: YELLOW_PRIMARY + '10',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: BLACK,
    flex: 1,
  },
  docStatus: {
    backgroundColor: YELLOW_PRIMARY + '10',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  docStatusText: {
    fontSize: 11,
    color: YELLOW_PRIMARY,
    fontWeight: '500',
  },
  vehicleTypeRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 16,
  },
  vehicleTypeButton: {
    width: '31%',
    alignItems: 'center',
    paddingVertical: 10,
    borderRadius: 10,
    backgroundColor: GRAY_LIGHT,
    borderWidth: 1,
    borderColor: colors.border,
    flexDirection: 'column',
    justifyContent: 'center',
    gap: 6,
  },
  vehicleTypeActive: {
    backgroundColor: YELLOW_PRIMARY,
    borderColor: YELLOW_PRIMARY,
  },
  vehicleTypeText: {
    fontSize: 12,
    fontWeight: '500',
    color: GRAY_MEDIUM,
  },
  vehicleTypeTextActive: {
    color: WHITE,
  },
  inputGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: GRAY_LIGHT,
    borderRadius: 10,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: colors.border,
  },
  inputIcon: {
    paddingHorizontal: 12,
  },
  input: {
    flex: 1,
    color: BLACK,
    paddingVertical: 14,
    paddingRight: 12,
    fontSize: 14,
  },
  inputRow: {
    flexDirection: 'row',
    gap: 12,
  },
  inputHalf: {
    flex: 1,
  },
  documentGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  imagePicker: {
    width: '48%',
    aspectRatio: 1,
    backgroundColor: GRAY_LIGHT,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    borderStyle: 'dashed',
    overflow: 'hidden',
    position: 'relative',
  },
  placeholder: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 10,
  },
  placeholderIcon: {
    marginBottom: 6,
  },
  placeholderText: {
    color: GRAY_MEDIUM,
    fontSize: 11,
    textAlign: 'center',
    fontWeight: '500',
  },
  uploadBadge: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: YELLOW_PRIMARY,
    borderRadius: 10,
    padding: 4,
  },
  previewImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  submitButton: {
    borderRadius: 14,
    overflow: 'hidden',
    marginTop: 8,
    shadowColor: YELLOW_PRIMARY,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  submitButtonDisabled: {
    opacity: 0.6,
  },
  submitGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    gap: 10,
  },
  submitButtonText: {
    color: WHITE,
    fontSize: 17,
    fontWeight: '600',
  },
  bottomSpacer: {
    height: 20,
  },
  });
};

export default DriverRegistrationScreen;