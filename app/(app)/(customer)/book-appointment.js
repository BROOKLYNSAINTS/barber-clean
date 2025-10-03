// When booking an appointment:

const handleBookAppointment = async () => {
  try {
    setBooking(true);
    
    // First check for conflicts
    const appointmentData = {
      barberId: selectedBarber.id,
      date: selectedDateTime,
      duration: selectedService.duration, // Use the service duration!
      serviceName: selectedService.name
    };
    
    const conflictCheck = await checkAppointmentConflict(
      selectedBarber.id, 
      appointmentData
    );
    
    if (conflictCheck.hasConflict) {
      // Show conflict alert to customer
      Alert.alert(
        "Scheduling Conflict", 
        "This barber already has an appointment during this time. Please select a different time.",
        [{ text: "OK" }]
      );
      setBooking(false);
      return;
    }
    
    // If no conflicts, proceed with booking
    // ...existing booking code...
  } catch (error) {
    console.error('Error booking appointment:', error);
    Alert.alert('Error', 'Failed to book appointment. Please try again.');
  } finally {
    setBooking(false);
  }
};