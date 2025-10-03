/**
 * Import function triggers from their respective submodules:
 *
 * const {onCall} = require("firebase-functions/v2/https");
 * const {onDocumentWritten} = require("firebase-functions/v2/firestore");
 *
 * See a full list of supported triggers at https://firebase.google.com/docs/functions
 */

const {setGlobalOptions} = require("firebase-functions");
const {onRequest} = require("firebase-functions/https");
const logger = require("firebase-functions/logger");
const functions = require("firebase-functions");
const admin = require("firebase-admin");
admin.initializeApp();

// For cost control, you can set the maximum number of containers that can be
// running at the same time. This helps mitigate the impact of unexpected
// traffic spikes by instead downgrading performance. This limit is a
// per-function limit. You can override the limit for each function using the
// `maxInstances` option in the function's options, e.g.
// `onRequest({ maxInstances: 5 }, (req, res) => { ... })`.
// NOTE: setGlobalOptions does not apply to functions using the v1 API. V1
// functions should each use functions.runWith({ maxInstances: 10 }) instead.
// In the v1 API, each function can only serve one request per container, so
// this will be the maximum concurrent request count.
setGlobalOptions({ maxInstances: 10 });

// Function to cancel appointment and restore availability
exports.cancelAppointment = functions.https.onCall(async (data, context) => {
  console.log('Function called with context:', context.auth);
  console.log('Function called with data:', data);

  // Check authentication - allow explicit user ID for testing
  if (!context.auth && !data.userId) {
    console.error('Auth missing:', { contextAuth: context.auth, dataUserId: data.userId });
    throw new functions.https.HttpsError('unauthenticated', 'Must be logged in to cancel appointments');
  }

  // Use either the context auth or the provided userId
  const userId = context.auth?.uid || data.userId;

  const { appointmentId } = data;
  if (!appointmentId) {
    throw new functions.https.HttpsError("invalid-argument", "Missing appointment ID");
  }

  const db = admin.firestore();
  
  try {
    // Get the appointment
    const appointmentRef = db.collection("appointments").doc(appointmentId);
    const appointmentSnap = await appointmentRef.get();
    
    if (!appointmentSnap.exists) {
      throw new functions.https.HttpsError("not-found", "Appointment not found");
    }
    
    const appointment = appointmentSnap.data();
    
    // Check if user is authorized to cancel this appointment
    if (appointment.customerId !== userId && appointment.barberId !== userId) {
      throw new functions.https.HttpsError("permission-denied", "Not authorized to cancel this appointment");
    }
    
    // Update appointment status
    await appointmentRef.update({
      status: "cancelled",
      cancelledAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    });
    
    // Restore time slots in barber's availability
    const { barberId, date } = appointment;
    
    // Get time slots that need to be restored
    let slotsToRestore = [];
    
    // If the appointment has slotsBooked array, use that
    if (Array.isArray(appointment.slotsBooked) && appointment.slotsBooked.length > 0) {
      slotsToRestore = appointment.slotsBooked;
      console.log("Restoring slots from slotsBooked:", slotsToRestore);
    }
    // Otherwise, calculate slots based on time24 and duration
    else {
      const time24 = appointment.time24 || to24Hour(appointment.time);
      
      if (!time24) {
        console.error("Cannot restore availability: invalid time format");
        return { success: true, warning: "Could not restore availability slots" };
      }
      
      const duration = Number(appointment.duration) || 30;
      const intervalMinutes = 30; // Standard interval
      const slotsNeeded = Math.ceil(duration / intervalMinutes);
      
      // Calculate all slots that were used
      const startTimeMinutes = timeToMinutes(time24);
      for (let i = 0; i < slotsNeeded; i++) {
        const slotTime = minutesToTime(startTimeMinutes + (i * intervalMinutes));
        slotsToRestore.push(slotTime);
      }
      
      console.log("Restoring calculated slots:", slotsToRestore);
    }
    
    // Update barber's availability to add back these slots
    if (slotsToRestore.length > 0) {
      const barberRef = db.collection("users").doc(barberId);
      
      // Get current availability
      const barberSnap = await barberRef.get();
      if (!barberSnap.exists) {
        console.error("Cannot restore availability: barber not found");
        return { success: true, warning: "Barber not found"};
      }
      
      const barberData = barberSnap.data();
      const availability = barberData.availability || {};
      const existingSlots = availability[date] || [];
      
      // Add the slots back, keeping them sorted
      const updatedSlots = [...existingSlots, ...slotsToRestore]
        .filter((slot, i, arr) => arr.indexOf(slot) === i) // Deduplicate
        .sort(); // Sort chronologically
      
      // Update the barber's availability
      await barberRef.update({
        [`availability.${date}`]: updatedSlots
      });
      
      console.log("✅ Restored availability slots:", updatedSlots);
    }
    
    return { success: true };
  } catch (error) {
    console.error("Error in cancelAppointment function:", error);
    throw new functions.https.HttpsError("internal", error.message);
  }
});

/**
 * Convert time string (HH:MM) to minutes since midnight.
 * @param {string} time - Time in HH:MM format
 * @return {number} Minutes since midnight
 */
function timeToMinutes(time) {
  if (!time) return 0;
  const [hours, minutes] = time.split(":").map(Number);
  return (hours * 60) + minutes;
}

/**
 * Convert minutes since midnight to time string (HH:MM).
 * @param {number} minutes - Minutes since midnight
 * @return {string} Time in HH:MM format
 */
function minutesToTime(minutes) {
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return `${String(hours).padStart(2, "0")}:${String(mins).padStart(2, "0")}`;
}

/**
 * Convert 12-hour time format to 24-hour format.
 * @param {string} timeStr - Time in 12-hour format (e.g., "3:30 P.M.")
 * @return {string} Time in 24-hour format (e.g., "15:30")
 */
function to24Hour(timeStr) {
  if (!timeStr) return "";
  timeStr = String(timeStr).replace(/[\u202F\u00A0\u2009\u2007\u200A\u200B\u200C\u200D\uFEFF\s]+/g, " ").trim();
  
  const regex = /(\d{1,2}):(\d{2})\s*([AaPp])\.?[Mm]\.?/;
  const match = timeStr.match(regex);
  if (match) {
    let [_, hours, minutes, period] = match;
    hours = parseInt(hours, 10);
    
    // Convert to 24-hour format
    if (period.toLowerCase() === "p" && hours !== 12) {
      hours += 12;
    }
    if (period.toLowerCase() === "a" && hours === 12) {
      hours = 0;
    }
    
    return `${String(hours).padStart(2, "0")}:${minutes}`;
  }
  
  // Fallback to simple splitting
  const parts = timeStr.split(" ");
  const time = parts[0];
  const modifier = parts[1] ? parts[1].toUpperCase() : " ";
  if (!time) return " ";
  let [hours, minutes] = time.split(":");
  hours = parseInt(hours, 10);
  if (modifier.includes("PM") && hours !== 12) {
    hours += 12;
  }
  if (modifier.includes("AM") && hours === 12) {
    hours = 0;
  }
  return `${String(hours).padStart(2, "0")}:${minutes ? minutes.padStart(2, "0") : "00"}`;
}
