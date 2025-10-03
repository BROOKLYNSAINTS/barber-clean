import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  TextInput,
  Modal,
  ActivityIndicator,
  Alert,
  StyleSheet,
  Image,
  ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { getBarberServices, addBarberService, updateBarberService, auth } from '@/services/firebase';
import * as ImagePicker from 'expo-image-picker';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';

function Screen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalVisible, setModalVisible] = useState(false);
  const [editingService, setEditingService] = useState(null);

  const [serviceName, setServiceName] = useState('');
  const [duration, setDuration] = useState('');
  const [price, setPrice] = useState('');
  const [serviceImage, setServiceImage] = useState(null);
  const [formError, setFormError] = useState('');
  const [saving, setSaving] = useState(false);

  const viewCustomerReviews = () => {
    router.push('/(app)/(barber)/barber-reviews');
  };

  useEffect(() => {
    fetchServices();
  }, []);

  const fetchServices = async () => {
    try {
      setLoading(true);
      const user = auth.currentUser;
      
      if (!user) {
        console.log('No user logged in');
        setLoading(false);
        return;
      }
      
      const barberServices = await getBarberServices(user.uid);
      setServices(barberServices || []);
    } catch (error) {
      console.log('Error fetching services:', error);
    } finally {
      setLoading(false);
    }
  };

  const openModal = (service = null) => {
    if (service) {
      // Editing existing service
      setEditingService(service);
      setServiceName(service.name || '');
      setDuration(service.duration?.toString() || '');
      setPrice(service.price?.toString() || '');
      setServiceImage(service.image || null);
    } else {
      // Adding new service
      setEditingService(null);
      setServiceName('');
      setDuration('');
      setPrice('');
      setServiceImage(null);
    }
    setFormError('');
    setModalVisible(true);
  };

  const closeModal = () => {
    setModalVisible(false);
    setFormError('');
  };

  const validateForm = () => {
    if (!serviceName.trim()) {
      setFormError('Please enter a service name');
      return false;
    }
    if (!duration.trim() || isNaN(Number(duration)) || Number(duration) <= 0) {
      setFormError('Please enter a valid duration in minutes');
      return false;
    }
    if (!price.trim() || isNaN(Number(price)) || Number(price) <= 0) {
      setFormError('Please enter a valid price');
      return false;
    }
    return true;
  };

  const handleSave = async () => {
    if (!validateForm()) return;
    
    try {
      setSaving(true);
      const user = auth.currentUser;
      
      if (!user) {
        console.log('No user logged in');
        setSaving(false);
        return;
      }
      
      const serviceData = {
        name: serviceName.trim(),
        duration: Number(duration),
        price: Number(price),
        image: serviceImage,
        barberId: user.uid,
      };
      
      if (editingService) {
        // Update existing service
        await updateBarberService(editingService.id, serviceData);
      } else {
        // Add new service
        await addBarberService(serviceData);
      }
      
      // Refresh services list
      fetchServices();
      closeModal();
      
    } catch (error) {
      console.log('Error saving service:', error);
      setFormError('Failed to save service. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const pickImage = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.5,
      });
      
      if (!result.canceled && result.assets && result.assets[0]) {
        setServiceImage(result.assets[0].uri);
      }
    } catch (error) {
      console.log('Error picking image:', error);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header with Reviews button */}
      <View style={[styles.header, { paddingTop: insets.top > 0 ? 0 : 20 }]}>
        <View style={styles.headerContent}>
          <Text style={styles.headerTitle}>✂️ Manage Services</Text>
          <Text style={styles.headerSubtitle}>Add and edit your services</Text>
        </View>
        
        {/* Keep only this reviews button */}
        <TouchableOpacity 
          style={styles.reviewsButton}
          onPress={viewCustomerReviews}
        >
          <Ionicons name="star" size={22} color="#000" />
          <Text style={styles.reviewsButtonText}>VIEW REVIEWS</Text>
        </TouchableOpacity>
      </View>

      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#007BFF" />
          <Text style={styles.loadingText}>Loading services...</Text>
        </View>
      ) : services.length === 0 ? (
        <View style={styles.emptyState}>
          <Ionicons name="cut-outline" size={64} color="#ccc" />
          <Text style={styles.emptyTitle}>No Services Yet</Text>
          <Text style={styles.emptyText}>
            Start by adding your first service!{'\n'}
            Set your prices, duration, and service types.
          </Text>
          <TouchableOpacity style={styles.addFirstButton} onPress={() => openModal()}>
            <Ionicons name="add" size={20} color="#fff" />
            <Text style={styles.addFirstButtonText}>Add Your First Service</Text>
          </TouchableOpacity>
          
          {/* Remove this button - it's redundant with the header button */}
          {/* <TouchableOpacity 
            style={styles.checkReviewsButton} 
            onPress={viewCustomerReviews}
          >
            <Ionicons name="star" size={20} color="#fff" />
            <Text style={styles.checkReviewsText}>Check Your Reviews</Text>
          </TouchableOpacity> */}
        </View>
      ) : (
        <>
          <FlatList
            data={services}
            keyExtractor={item => item.id}
            renderItem={({ item }) => (
              <TouchableOpacity 
                style={styles.serviceRow}
                onPress={() => openModal(item)}
              >
                {/* Column 1: Image */}
                <View style={styles.imageColumn}>
                  {item.image ? (
                    <Image source={{ uri: item.image }} style={styles.serviceImage} />
                  ) : (
                    <View style={styles.imagePlaceholder}>
                      <Ionicons name="cut" size={20} color="#aaa" />
                    </View>
                  )}
                </View>
                
                {/* Column 2: Service Name */}
                <View style={styles.nameColumn}>
                  <Text style={styles.serviceName}>{item.name}</Text>
                </View>
                
                {/* Column 3: Duration */}
                <View style={styles.durationColumn}>
                  <Text style={styles.serviceDuration}>{item.duration} min</Text>
                </View>
                
                {/* Column 4: Price */}
                <View style={styles.priceColumn}>
                  <Text style={styles.servicePrice}>${parseFloat(item.price).toFixed(2)}</Text>
                </View>
              </TouchableOpacity>
            )}
            contentContainerStyle={styles.listContainer}
            ItemSeparatorComponent={() => <View style={styles.separator} />}
          />
          
          <TouchableOpacity style={styles.fab} onPress={() => openModal()}>
            <Ionicons name="add" size={32} color="#fff" />
          </TouchableOpacity>
        </>
      )}

      {/* Service Modal */}
      <Modal visible={modalVisible} transparent animationType="slide">
        <SafeAreaView style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>
                {editingService ? 'Edit Service' : 'Add New Service'}
              </Text>
              <TouchableOpacity onPress={closeModal} style={styles.closeButton}>
                <Ionicons name="close" size={24} color="#000" />
              </TouchableOpacity>
            </View>
            
            <ScrollView style={styles.modalScroll}>
              {/* Image Picker */}
              <TouchableOpacity style={styles.imagePicker} onPress={pickImage}>
                {serviceImage ? (
                  <Image source={{ uri: serviceImage }} style={styles.pickedImage} />
                ) : (
                  <View style={styles.imagePickerPlaceholder}>
                    <Ionicons name="camera" size={40} color="#aaa" />
                    <Text style={styles.imagePickerText}>Add Photo</Text>
                  </View>
                )}
              </TouchableOpacity>
              
              {/* Form Fields */}
              <Text style={styles.label}>Service Name</Text>
              <TextInput
                style={styles.input}
                value={serviceName}
                onChangeText={setServiceName}
                placeholder="e.g., Haircut, Beard Trim, etc."
                placeholderTextColor="#aaa"
              />
              
              <Text style={styles.label}>Duration (minutes)</Text>
              <TextInput
                style={styles.input}
                value={duration}
                onChangeText={setDuration}
                placeholder="e.g., 30, 45, 60"
                placeholderTextColor="#aaa"
                keyboardType="number-pad"
              />
              
              <Text style={styles.label}>Price ($)</Text>
              <TextInput
                style={styles.input}
                value={price}
                onChangeText={setPrice}
                placeholder="e.g., 25, 30.50"
                placeholderTextColor="#aaa"
                keyboardType="decimal-pad"
              />
              
              {formError ? <Text style={styles.errorText}>{formError}</Text> : null}
              
              <TouchableOpacity 
                style={styles.saveButton} 
                onPress={handleSave}
                disabled={saving}
              >
                {saving ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <Text style={styles.saveButtonText}>
                    {editingService ? 'Update Service' : 'Add Service'}
                  </Text>
                )}
              </TouchableOpacity>
            </ScrollView>
          </View>
        </SafeAreaView>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f0f2f5',
  },
  header: {
    backgroundColor: '#fff',
    padding: 20,
    paddingBottom: 20,
    paddingTop: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerContent: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: '700',
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#666',
    marginTop: 2,
  },
  reviewsButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f0f0f0',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: '#000',
  },
  reviewsButtonText: {
    fontWeight: '800',
    fontSize: 14,
    color: '#000',
    marginLeft: 4,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: '#666',
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  emptyTitle: {
    fontSize: 22,
    fontWeight: '700',
    marginTop: 20,
    marginBottom: 10,
  },
  emptyText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginBottom: 30,
    lineHeight: 22,
  },
  addFirstButton: {
    backgroundColor: '#007BFF',
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 25,
    alignItems: 'center',
  },
  addFirstButtonText: {
    color: '#fff',
    fontWeight: '600',
    marginLeft: 8,
    fontSize: 16,
  },
  // Note: Removed checkReviewsButton styles
  listContainer: {
    padding: 16,
    paddingBottom: 100, // Extra padding for FAB
  },
  // Note: Removed reviewsBanner styles
  serviceRow: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    padding: 18, // Increased from 15
    borderRadius: 8,
    alignItems: 'center',
    borderWidth: 2, // Add border
    borderColor: '#000', // Black border for high contrast
  },
  separator: {
    height: 2, // Increased from 1
    backgroundColor: '#000', // Changed from '#e0e0e0' to black
    marginVertical: 12, // Increased from 8
  },
  imageColumn: {
    width: 60, // Increased from 50
    marginRight: 15,
  },
  serviceImage: {
    width: 60, // Increased from 50
    height: 60, // Increased from 50
    borderRadius: 30, // Keep it circular
    backgroundColor: '#f0f0f0',
    borderWidth: 2, // Add border
    borderColor: '#000', // Black border
  },
  imagePlaceholder: {
    width: 60, // Increased from 50
    height: 60, // Increased from 50
    borderRadius: 30, // Keep it circular
    backgroundColor: '#f0f0f0',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2, // Add border
    borderColor: '#000', // Black border
  },
  nameColumn: {
    flex: 1,
    marginRight: 8,
  },
  serviceName: {
    fontSize: 20, // Increased from 16
    fontWeight: '900', // Changed from '600' to '900' for maximum boldness
    color: '#000', // Ensure black color for high contrast
  },
  durationColumn: {
    width: 70,
    alignItems: 'center',
  },
  serviceDuration: {
    fontSize: 16,
    color: '#444',
    fontWeight: '800', // Changed from '600' to '800' for bolder text
  },
  priceColumn: {
    width: 80,
    alignItems: 'flex-end',
  },
  servicePrice: {
    fontSize: 20, // Increased from 16
    fontWeight: '900', // Changed from '700' to '900'
    color: '#000', // Changed from blue to black for consistent bold look
  },
  fab: {
    position: 'absolute',
    bottom: 20,
    right: 20,
    backgroundColor: '#000', // Changed from blue to black for consistency
    width: 64, // Increased from 56
    height: 64, // Increased from 56
    borderRadius: 32, // Keep it circular
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 3,
  },
  modalContainer: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  modalContent: {
    flex: 1,
    backgroundColor: '#fff',
    marginTop: 50,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
  },
  closeButton: {
    padding: 5,
  },
  modalScroll: {
    padding: 20,
  },
  imagePicker: {
    alignItems: 'center',
    marginBottom: 20,
  },
  imagePickerPlaceholder: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: '#f0f0f0',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderStyle: 'dashed',
  },
  pickedImage: {
    width: 120,
    height: 120,
    borderRadius: 60,
  },
  imagePickerText: {
    marginTop: 8,
    color: '#666',
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
    marginTop: 12,
  },
  input: {
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    backgroundColor: '#f9f9f9',
  },
  errorText: {
    color: '#d32f2f',
    marginTop: 10,
    marginBottom: 10,
  },
  saveButton: {
    backgroundColor: '#007BFF',
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 30,
    marginBottom: 30,
  },
  saveButtonText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 16,
  },
});

export default Screen;
