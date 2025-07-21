// ChatAssistantScreen (fixed intro, barber list, services with price)
import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  View, TextInput, Button, Text, ScrollView, StyleSheet,
  KeyboardAvoidingView, Platform, ActivityIndicator
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { generateChatResponse } from '@/services/openai';
import { useAuth } from '@/contexts/AuthContext';
import {
  createAppointment,
  getUserProfile,
  getBarberAvailability,
  getBarbersByZipcode,
  getBarberServices
} from '@/services/firebase';
import {
  addAppointmentToCalendar,
  scheduleAppointmentReminder
} from '@/services/notifications';
import * as Speech from 'expo-speech';
import Waveform from '@/components/Waveform';
import { useAutoStartRecording } from '@/services/googleSpeech';

export default function ChatAssistantScreen() {
  const { currentUser } = useAuth();
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [selectedBarber, setSelectedBarber] = useState(null);
  const [selectedService, setSelectedService] = useState(null);
  const [selectedTime, setSelectedTime] = useState(null);
  const [availability, setAvailability] = useState([]);
  const [barberList, setBarberList] = useState([]);
const dayMap = {
  sunday: 0, monday: 1, tuesday: 2, wednesday: 3,
  thursday: 4, friday: 5, saturday: 6
};

function parseDayOffset(text) {
  const lower = text.toLowerCase();
  if (lower.includes('today')) return 0;
  if (lower.includes('tomorrow')) return 1;

  const found = Object.keys(dayMap).find(d => lower.includes(d));
  if (found !== undefined) {
    const today = new Date().getDay();
    const target = dayMap[found];
    return (target + 7 - today) % 7 || 7;
  }

  return null;
}
  const scrollRef = useRef();

  useEffect(() => {
    addBotMessage("Hi there! I'm your barber assistant. Ask me anything or say 'book an appointment' to get started.");
  }, []);

  useAutoStartRecording((transcript) => {
    handleSendMessage(transcript);
  });

  const speakMessage = (text) => {
    Speech.speak(text);
  };

  const addBotMessage = (text) => {
    const id = `${Date.now()}-${Math.random().toString(36).substr(2, 5)}`;
    setMessages(prev => [...prev, { id, sender: 'assistant', text }]);
    speakMessage(text);
    scrollRef.current?.scrollToEnd({ animated: true });
  };

  const wordToNumber = (word) => {
    const map = {
      one: 1, two: 2, three: 3, four: 4, five: 5,
      six: 6, seven: 7, eight: 8, nine: 9, ten: 10
    };
    return map[word.toLowerCase()] || parseInt(word);
  };

  const handleSendMessage = useCallback(async (text = input) => {
    if (!text.trim()) return;
    const userMessage = { id: `${Date.now()}-${Math.random().toString(36).substr(2, 5)}`, text, sender: 'user' };
    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setLoading(true);
    setError('');
    scrollRef.current?.scrollToEnd({ animated: true });

    try {
      const profile = await getUserProfile(currentUser?.uid);
      const barbers = await getBarbersByZipcode(profile.zipcode);
      setBarberList(barbers);

      // 👇 If user types "haircut", "book", etc. — show list
      if (!selectedBarber && /(haircut|book|appointment|fade)/i.test(text)) {
        const options = barbers.map((b, i) => `${i + 1}. ${b.name}`).join('\n');
        addBotMessage(`Here are barbers near you:\n${options}\nPlease choose a barber by number.`);
        return;
      }

      if (!selectedBarber) {
        const barberIndex = wordToNumber(text.trim());
        if (!isNaN(barberIndex) && barberIndex >= 1 && barberIndex <= barbers.length) {
          const matchedBarber = barbers[barberIndex - 1];
          const services = await getBarberServices(matchedBarber.id);
          matchedBarber.styles = services.map(s => `${s.name} - $${s.price}`);
          setSelectedBarber(matchedBarber);
          addBotMessage(`👍 You selected barber #${barberIndex}. Here are their services:`);
          const styleList = matchedBarber.styles.map((s, i) => `${i + 1}. ${s}`).join('\n') || 'No services listed';
          addBotMessage(styleList);
          return;
        }
      }

      if (selectedBarber && !selectedService) {
        const word = text.trim().toLowerCase();
        const numberChoice = wordToNumber(word);
        const rawServices = await getBarberServices(selectedBarber.id);
        const serviceNames = rawServices.map(s => s.name);
        let matchedService = null;

        if (!isNaN(numberChoice) && serviceNames[numberChoice - 1]) {
          matchedService = serviceNames[numberChoice - 1];
        } else {
          matchedService = serviceNames.find((name) => word.includes(name.toLowerCase()));
        }

        if (matchedService) {
          setSelectedService(matchedService);
          const index = serviceNames.findIndex(s => s === matchedService);
          addBotMessage(`🎨 You selected ${index + 1}. ${matchedService}. What time would you like today?`);
          return;
        }
      }

      if (selectedBarber && selectedService && !selectedTime) {
        const avail = await getBarberAvailability(selectedBarber.id);
        setAvailability(avail);
        const offset = parseDayOffset(text);
        const targetDate = new Date();
        if (offset !== null) targetDate.setDate(targetDate.getDate() + offset);
        const date = targetDate.toISOString().split('T')[0];

        const timeMatch = text.match(/\b\d{1,2}:\d{2}\s?(AM|PM)\b/i);
        if (timeMatch) {
          const time = timeMatch[0];
          const valid = avail.find(a => a.time.toLowerCase() === time.toLowerCase() && a.date === date);
          console.log("📅 Parsed date:", date);
          console.log("⏰ Requested time:", timeMatch?.[0]);
          console.log("📊 Full availability list:", avail);
          const dayAvail = avail.filter(a => a.date === date);
          console.log("📊 Availability for selected date:", dayAvail);

          if (valid) {
            setSelectedTime({ time: valid.time, date: valid.date });
            addBotMessage(`⏰ ${valid.time} on ${valid.date} is available. Reply "yes" to confirm.`);
            return;
          } else {
            const times = avail.map(a => a.time).join(', ');
            addBotMessage(`❌ That time isn't available. Try one of these for ${date}: ${times}`);
            return;
          }
        } else {
          const times = avail.map(a => a.time).join(', ');
          addBotMessage(`⏰ Please provide a time like "2:30 PM". Available today: ${times}`);
          return;
        }
      }

      if (selectedBarber && selectedService && selectedTime && text.toLowerCase().includes('yes')) {
        const appointmentData = {
          barberId: selectedBarber.id,
          service: selectedService,
          date: selectedTime.date,
          time: selectedTime.time,
          customerId: currentUser.uid,
        };
        await createAppointment(appointmentData);
        await addAppointmentToCalendar(appointmentData);
        await scheduleAppointmentReminder(appointmentData);

        addBotMessage(`✅ Appointment confirmed with ${selectedBarber.name} for "${selectedService}" at ${selectedTime.time} on ${selectedTime.date}.`);

        // Reset for next round
        setSelectedBarber(null);
        setSelectedService(null);
        setSelectedTime(null);
        setAvailability([]);
        return;
      }
    } catch (err) {
      console.error('❌ Error in chat:', err);
      setError('An error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [input, messages, currentUser?.uid, selectedBarber, selectedService, selectedTime]);

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#fff' }}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Chat Assistant</Text>
          <Waveform isListening={isListening} />
        </View>
        <ScrollView
          style={styles.chatBox}
          ref={scrollRef}
          contentContainerStyle={{ padding: 10 }}
          onContentSizeChange={() => scrollRef.current?.scrollToEnd({ animated: true })}
        >
          {messages.map((msg) => (
            <Text key={msg.id} style={msg.sender === 'user' ? styles.userText : styles.botText}>
              {msg.sender === 'user' ? 'You: ' : 'Assistant: '}{msg.text}
            </Text>
          ))}
          {loading && <ActivityIndicator style={{ marginTop: 10 }} size="small" color="gray" />}
          {error && <Text style={{ marginTop: 10, color: 'red' }}>{error}</Text>}
        </ScrollView>
        <View style={styles.inputContainer}>
          <TextInput value={input} onChangeText={setInput} placeholder="Ask me anything..." style={styles.input} onSubmitEditing={() => handleSendMessage()} />
          <Button title="Send" onPress={() => handleSendMessage()} disabled={loading} />
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  header: {
    paddingTop: 48, paddingBottom: 12, alignItems: 'center',
    backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#eee'
  },
  headerTitle: { fontSize: 22, fontWeight: 'bold', color: '#2196F3' },
  chatBox: { flex: 1 },
  userText: { alignSelf: 'flex-end', marginVertical: 2 },
  botText: { alignSelf: 'flex-start', marginVertical: 2, color: 'blue' },
  inputContainer: {
    flexDirection: 'row', alignItems: 'center', padding: 8,
    backgroundColor: '#fff', borderTopWidth: 1, borderTopColor: '#eee'
  },
  input: {
    flex: 1, borderWidth: 1, padding: 10,
    borderRadius: 5, marginRight: 8
  }
});
