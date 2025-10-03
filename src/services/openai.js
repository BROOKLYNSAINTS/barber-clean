// src/services/openai.js

import Constants from 'expo-constants';

const API_KEY = process.env.EXPO_PUBLIC_OPENAI_API_KEY;
console.log('API KEY available:', !!API_KEY);

// System message for the barber assistant
const SYSTEM_MESSAGE = `You are a barber business management assistant. Help barbers with scheduling, customer management, marketing, and business advice. Your responses should be professional, concise, and helpful for barber shop owners and individual barbers.`;

export const generateChatResponse = async (message) => {
  try {
    if (!API_KEY) {
      console.error('❌ Missing OpenAI API Key');
      return { text: "Error: OpenAI API key not configured", success: false };
    }

    console.log('Generating response for message:', message);
    
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${API_KEY}`
      },
      body: JSON.stringify({
        model: 'gpt-3.5-turbo',
        messages: [
          { role: 'system', content: SYSTEM_MESSAGE },
          { role: 'user', content: message }
        ],
        temperature: 0.7,
        max_tokens: 300
      })
    });

    if (!response.ok) {
      const errorData = await response.text();
      console.error('OpenAI API error:', errorData);
      return { text: "Sorry, there was an error processing your request.", success: false };
    }

    const data = await response.json();
    console.log('🧪 Full OpenAI response:', data);

    const responseText = data?.choices?.[0]?.message?.content || "Sorry, I couldn't generate a response";
    return { text: responseText, success: true };
    
  } catch (error) {
    console.error("Error generating response:", error);
    return { text: "Sorry, there was an error processing your request.", success: false };
  }
};
