import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  FlatList,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { generateChatResponse } from '../../../src/services/openai';
import { useRouter } from 'expo-router';

export default function ChatAssistant() {
  const [messages, setMessages] = useState(() => [{
    role: 'assistant',
    content: 'Hello! I\'m your personal barber assistant. How can I help you today?'
  }]);
  
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const flatListRef = useRef(null);
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const exampleQuestions = [
    "How do I properly maintain my clipper blades?",
    "What are the latest haircut trends this season?",
    "How should I price my services?",
    "Tips for improving my fade technique?"
  ];

  const sendMessage = async () => {
    if (!input.trim()) return;
    
    const userMessage = { role: 'user', content: input.trim() };
    
    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setLoading(true);
    
    try {
      const response = await generateChatResponse(userMessage.content);
      
      if (response && response.success) {
        setMessages(prev => [...prev, { 
          role: 'assistant', 
          content: response.text || 'I received your message.'
        }]);
      } else {
        throw new Error(response?.text || 'Unknown error');
      }
    } catch (error) {
      console.error('Error getting assistant response:', error);
      setMessages(prev => [...prev, { 
        role: 'assistant', 
        content: "I'm sorry, I encountered an error. Please try again later." 
      }]);
    } finally {
      setLoading(false);
    }
  };

  const askExampleQuestion = (question) => {
    setInput(question);
  };

  useEffect(() => {
    if (flatListRef.current && messages.length > 0) {
      setTimeout(() => {
        flatListRef.current.scrollToEnd({ animated: true });
      }, 100);
    }
  }, [messages]);

  const renderMessage = ({ item }) => {
    const isUser = item.role === 'user';
    const content = typeof item.content === 'string' ? item.content : String(item.content ?? '');
    return (
      <View style={[styles.messageBubble, isUser ? styles.userBubble : styles.assistantBubble]}>
        <Text style={[styles.messageText, isUser ? styles.userText : styles.assistantText]}>
          {content}
        </Text>
      </View>
    );
  };

  const TypingBubble = () => (
    <View style={[styles.messageBubble, styles.assistantBubble]}>
      <Text style={[styles.messageText, styles.assistantText]}>Assistant is typing…</Text>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={[styles.header, { paddingTop: insets.top > 0 ? 0 : 20 }]}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={28} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>BARBER ASSISTANT</Text>
        <View style={{ width: 40 }} />
      </View>

      <FlatList
        ref={flatListRef}
        data={messages}
        renderItem={renderMessage}
        keyExtractor={(_, index) => index.toString()}
        contentContainerStyle={styles.messagesList}
        showsVerticalScrollIndicator={false}
        ListFooterComponent={loading ? <TypingBubble /> : null}
      />

      {messages.length === 1 && (
        <View style={styles.examplesContainer}>
          <Text style={styles.examplesTitle}>SUGGESTED QUESTIONS:</Text>
          {exampleQuestions.map((q, i) => (
            <TouchableOpacity key={i} style={styles.exampleButton} onPress={() => askExampleQuestion(q)}>
              <Ionicons name="help-circle" size={24} color="#000" />
              <Text style={styles.exampleText}>{q}</Text>
            </TouchableOpacity>
          ))}
        </View>
      )}

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
        style={styles.inputContainer}
      >
        <TextInput
          style={styles.input}
          placeholder="Ask me anything about barbering..."
          placeholderTextColor="#777"
          value={input}
          onChangeText={setInput}
          multiline
          maxHeight={120}
        />
        <TouchableOpacity
          style={[styles.sendButton, !input.trim() && styles.sendButtonDisabled]}
          onPress={sendMessage}
          disabled={!input.trim() || loading}
        >
          {loading ? (
            <ActivityIndicator size="small" color="#fff" />
          ) : (
            <Ionicons name="send" size={24} color="#fff" />
          )}
        </TouchableOpacity>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f0f0f0',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#000',
    padding: 16,
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '900',
    color: '#fff',
  },
  messagesList: {
    padding: 16,
    paddingBottom: 24,
  },
  messageBubble: {
    maxWidth: '80%',
    padding: 16,
    borderRadius: 12,
    marginBottom: 16,
    borderWidth: 2,
    borderColor: '#000',
  },
  userBubble: {
    backgroundColor: '#000',
    alignSelf: 'flex-end',
    marginLeft: '20%',
  },
  assistantBubble: {
    backgroundColor: '#fff',
    alignSelf: 'flex-start',
    marginRight: '20%',
  },
  messageText: {
    fontSize: 18,
    lineHeight: 24,
    fontWeight: '600',
  },
  userText: {
    color: '#fff',
  },
  assistantText: {
    color: '#000',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    padding: 16,
    backgroundColor: '#fff',
    borderTopWidth: 2,
    borderTopColor: '#000',
  },
  input: {
    flex: 1,
    backgroundColor: '#f9f9f9',
    padding: 16,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#000',
    fontSize: 18,
    fontWeight: '500',
    maxHeight: 120,
  },
  sendButton: {
    backgroundColor: '#000',
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 12,
  },
  sendButtonDisabled: {
    backgroundColor: '#666',
  },
  examplesContainer: {
    padding: 16,
    paddingTop: 0,
  },
  examplesTitle: {
    fontSize: 20,
    fontWeight: '900',
    marginBottom: 16,
    color: '#000',
  },
  exampleButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    borderWidth: 2,
    borderColor: '#000',
  },
  exampleText: {
    fontSize: 18,
    fontWeight: '700',
    color: '#000',
    marginLeft: 12,
    flex: 1,
  },
});
