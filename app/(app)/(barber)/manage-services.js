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
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { getBarberServices, addBarberService, auth } from '@/services/firebase';


export default function Screen() {
  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalVisible, setModalVisible] = useState(false);
  const [editingService, setEditingService] = useState(null);

  const [serviceName, setServiceName] = useState('');
  const [duration, setDuration] = useState('');
  const [price, setPrice] = useState('');
  const [formError, setFormError] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchServices();
  }, []);

  const fetchServices = async () => {
    try {
      setLoading(true);
      const user = auth.currentUser;
      const data = await getBarberServices(user.uid);
      setServices(data);
    } catch (err) {
      console.error('Failed to fetch services', err);
      Alert.alert('Error', 'Could not load services.');
    } finally {
      setLoading(false);
    }
  };

  const openModal = (service = null) => {
    setEditingService(service);
    setServiceName(service?.name || '');
    setDuration(service?.duration?.toString() || '');
    setPrice(service?.price?.toString() || '');
    setFormError('');
    setModalVisible(true);
  };

  const handleSave = async () => {
    if (!serviceName || !duration || !price) {
      setFormError('Please fill all fields');
      return;
    }

    const parsedDuration = parseInt(duration);
    const parsedPrice = parseFloat(price);

    if (isNaN(parsedDuration) || parsedDuration <= 0) {
      setFormError('Duration must be a valid number');
      return;
    }

    if (isNaN(parsedPrice) || parsedPrice <= 0) {
      setFormError('Price must be a valid number');
      return;
    }

    try {
      setSaving(true);
      const user = auth.currentUser;
      const serviceData = {
        name: serviceName,
        duration: parsedDuration,
        price: parsedPrice,
      };
      await addBarberService(user.uid, serviceData);
      setModalVisible(false);
      fetchServices();
    } catch (err) {
      console.error('Failed to save service', err);
      Alert.alert('Error', 'Could not save service.');
    } finally {
      setSaving(false);
    }
  };

  const renderService = ({ item }) => (
    <View style={styles.card}>
      <Text style={styles.title}>{item.name}</Text>
      <Text>{item.duration} min — ${item.price.toFixed(2)}</Text>
      <TouchableOpacity onPress={() => openModal(item)} style={styles.editButton}>
        <Ionicons name="create-outline" size={18} color="#2196F3" />
      </TouchableOpacity>
    </View>
  );

  return (
    <View style={styles.container}>
      {loading ? (
        <ActivityIndicator size="large" color="#2196F3" />
      ) : (
        <>
          <FlatList
            data={services}
            keyExtractor={(item) => item.id}
            renderItem={renderService}
            contentContainerStyle={{ padding: 16 }}
          />
          <TouchableOpacity style={styles.fab} onPress={() => openModal()}>
            <Ionicons name="add" size={24} color="#fff" />
          </TouchableOpacity>
        </>
      )}

      <Modal visible={modalVisible} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modal}>
            <Text style={styles.modalTitle}>
              {editingService ? 'Edit Service' : 'Add New Service'}
            </Text>

            {formError ? <Text style={styles.error}>{formError}</Text> : null}

            <TextInput
              placeholder="Service Name"
              value={serviceName}
              onChangeText={setServiceName}
              style={styles.input}
            />
            <TextInput
              placeholder="Duration (min)"
              value={duration}
              onChangeText={setDuration}
              keyboardType="numeric"
              style={styles.input}
            />
            <TextInput
              placeholder="Price ($)"
              value={price}
              onChangeText={setPrice}
              keyboardType="decimal-pad"
              style={styles.input}
            />

            <View style={styles.modalActions}>
              <TouchableOpacity onPress={() => setModalVisible(false)} style={styles.cancel}>
                <Text style={styles.cancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={handleSave} style={styles.save}>
                <Text style={styles.saveText}>{saving ? 'Saving...' : 'Save'}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  card: {
    backgroundColor: '#f9f9f9',
    padding: 16,
    borderRadius: 8,
    marginBottom: 12,
    position: 'relative',
  },
  title: { fontWeight: 'bold', fontSize: 16 },
  editButton: { position: 'absolute', top: 10, right: 10 },
  fab: {
    position: 'absolute',
    right: 20,
    bottom: 30,
    backgroundColor: '#2196F3',
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: '#00000088',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modal: {
    backgroundColor: '#fff',
    padding: 20,
    width: '90%',
    borderRadius: 8,
  },
  modalTitle: { fontWeight: 'bold', fontSize: 18, marginBottom: 12 },
  input: {
    borderWidth: 1,
    borderColor: '#ccc',
    padding: 10,
    borderRadius: 6,
    marginBottom: 10,
  },
  modalActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 10,
  },
  cancel: { padding: 10 },
  save: { padding: 10, backgroundColor: '#2196F3', borderRadius: 6 },
  saveText: { color: '#fff', fontWeight: 'bold' },
  cancelText: { color: '#666' },
  error: { color: 'red', marginBottom: 10 },
});
