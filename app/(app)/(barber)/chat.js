import React, { useState, useEffect, useCallback } from 'react';
import { View, TextInput, TouchableOpacity, Text, FlatList, StyleSheet, KeyboardAvoidingView, Platform } from 'react-native';
import { useAuth } from '@/contexts/AuthContext';
import { db } from '@/services/firebase';
import { collection, query, where, orderBy, onSnapshot, addDoc, serverTimestamps, setDoc,doc } from 'firebase/firestore';

import { useLocalSearchParams } from 'expo-router';

export default function BarberChatScreen() {
  const { currentUser } = useAuth();
    const { threadId } = useLocalSearchParams(); // ✅ must match exactly
    const { chatId } = useLocalSearchParams();
    const [messages, setMessages] = useState([]);
    const [newMessage, setNewMessage] = useState('');
    const sendMessage = async () => {
  if (newMessage.trim() === '') return;

    const messagesRef = collection(db, 'chats', chatId, 'messages');
     await addDoc(messagesRef, {
    senderId: currentUser.uid,
    text: newMessage,
    createdAt: serverTimestamp(),
  });

  setNewMessage('');
};
  // Fetch messages
useEffect(() => {
  if (!threadId) return; // prevent crashing if threadId is missing

  const messagesRef = collection(db, 'chats', threadId, 'messages');
  const q = query(messagesRef, orderBy('createdAt'));

  const unsubscribe = onSnapshot(q, (snapshot) => {
    const fetchedMessages = snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));
    setMessages(fetchedMessages);
  });

  return () => unsubscribe();
}, [threadId]);

  const renderItem = ({ item }) => (
    <View
      style={[
        styles.messageBubble,
        item.senderId === currentUser.uid ? styles.myMessage : styles.theirMessage,
      ]}
    >
      <Text style={styles.messageText}>{item.text}</Text>
    </View>
  );

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <FlatList
        data={messages}
        renderItem={renderItem}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.messagesList}
      />
      <View style={styles.inputContainer}>
        <TextInput
          value={newMessage}
          onChangeText={setNewMessage}
          placeholder="Type a message"
          style={styles.input}
        />
        <TouchableOpacity onPress={sendMessage} style={styles.sendButton}>
          <Text style={styles.sendButtonText}>Send</Text>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  messagesList: { padding: 12 },
  messageBubble: {
    padding: 10,
    marginVertical: 4,
    borderRadius: 8,
    maxWidth: '80%',
  },
  myMessage: {
    alignSelf: 'flex-end',
    backgroundColor: '#DCF8C6',
  },
  theirMessage: {
    alignSelf: 'flex-start',
    backgroundColor: '#E5E5EA',
  },
  messageText: { fontSize: 16 },
  inputContainer: {
    flexDirection: 'row',
    borderTopWidth: 1,
    borderColor: '#ddd',
    padding: 8,
  },
  input: {
    flex: 1,
    padding: 10,
    backgroundColor: '#f1f1f1',
    borderRadius: 20,
  },
  sendButton: {
    marginLeft: 8,
    backgroundColor: '#2196F3',
    borderRadius: 20,
    paddingHorizontal: 16,
    justifyContent: 'center',
  },
  sendButtonText: {
    color: '#fff',
    fontWeight: 'bold',
  },
});
