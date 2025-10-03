// Function to filter available slots based on existing appointments

const filterAvailableTimeSlots = (availableSlots, existingAppointments, serviceDuration) => {
  return availableSlots.filter(slot => {
    // Calculate end time for this potential appointment
    const potentialEnd = new Date(slot);
    potentialEnd.setMinutes(potentialEnd.getMinutes() + serviceDuration);
    
    // Check if this slot conflicts with any existing appointment
    return !existingAppointments.some(existing => {
      const existingStart = new Date(existing.date);
      const existingEnd = new Date(existing.date);
      existingEnd.setMinutes(existingEnd.getMinutes() + existing.duration);
      
      return (
        (slot >= existingStart && slot < existingEnd) || // New appointment starts during existing
        (potentialEnd > existingStart && potentialEnd <= existingEnd) || // New appointment ends during existing
        (slot <= existingStart && potentialEnd >= existingEnd) // New appointment completely covers existing
      );
    });
  });
};