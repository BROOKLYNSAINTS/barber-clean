// test-payment-feature.js
// Simple test to verify appointment payment functionality

import React from 'react';
import { View, Text, Button, Alert } from 'react-native';
import { processServicePayment, getAppointmentPaymentStatus } from '../src/services/stripe';

export default function TestPaymentFeature() {
  const testAppointment = {
    id: 'test_appointment_123',
    serviceName: 'Test Haircut',
    servicePrice: 25,
    barberName: 'Test Barber',
    barberId: 'test_barber_123'
  };

  const testPayment = async () => {
    try {
      console.log('🧪 Testing payment processing...');
      
      // Test processing a payment
      const result = await processServicePayment(
        'test_customer_123',
        testAppointment.barberId,
        testAppointment.id,
        testAppointment.servicePrice,
        `${testAppointment.serviceName} - ${testAppointment.barberName}`
      );

      console.log('💳 Payment result:', result);

      if (result.success) {
        // Test checking payment status
        const paymentStatus = await getAppointmentPaymentStatus(testAppointment.id);
        console.log('📊 Payment status:', paymentStatus);
        
        Alert.alert(
          'Payment Test Successful',
          `Payment processed: $${testAppointment.servicePrice}\nStatus: ${paymentStatus.isPaid ? 'Paid' : 'Pending'}`
        );
      } else {
        Alert.alert('Payment Test Failed', 'Payment processing failed');
      }
    } catch (error) {
      console.error('❌ Payment test error:', error);
      Alert.alert('Payment Test Error', error.message);
    }
  };

  return (
    <View style={{ padding: 20, alignItems: 'center' }}>
      <Text style={{ fontSize: 18, marginBottom: 20 }}>Payment Feature Test</Text>
      <Text style={{ marginBottom: 10 }}>Service: {testAppointment.serviceName}</Text>
      <Text style={{ marginBottom: 10 }}>Price: ${testAppointment.servicePrice}</Text>
      <Text style={{ marginBottom: 20 }}>Barber: {testAppointment.barberName}</Text>
      
      <Button 
        title="Test Payment Processing" 
        onPress={testPayment}
      />
    </View>
  );
}
