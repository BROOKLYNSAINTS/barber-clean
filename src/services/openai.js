// services/openai.js

import { Configuration, OpenAIApi } from 'openai';
import Constants from 'expo-constants';

const testing = true;  // 👉 Set to false when you are ready for real OpenAI calls

let openai = null;

if (!testing) {
  const configuration = new Configuration({
    apiKey: 'sk-dummy-key-for-demo-purposes-only',
  });
  openai = new OpenAIApi(configuration);
}

// Generate chat response
export const generateChatResponse = async (messages) => {
  if (testing) {
    console.log("Testing mode: generateChatResponse fake output");
    return "This is a fake chat response.";
  }

  try {
    const response = await openai.createChatCompletion({
      model: 'gpt-3.5-turbo',
      messages,
      temperature: 0.7,
      max_tokens: 500,
    });
    return response.data.choices[0].message.content;
  } catch (error) {
    console.error('Error generating chat response:', error);
    throw error;
  }
};

// Generate hair style recommendation
export const generateHairStyleRecommendation = async (userPreferences) => {
  if (testing) {
    console.log("Testing mode: generateHairStyleRecommendation fake output");
    return "This is a fake hairstyle recommendation.";
  }

  try {
    const { faceShape, hairType, currentLength, stylePreference, occasion } = userPreferences;
    const prompt = `As a professional barber, recommend a hairstyle for a client with:
      - Face shape: ${faceShape}
      - Hair type: ${hairType}
      - Current hair length: ${currentLength}
      - Style preference: ${stylePreference}
      - Occasion: ${occasion}`;

    const response = await openai.createCompletion({
      model: 'text-davinci-003',
      prompt,
      temperature: 0.7,
      max_tokens: 500,
    });
    return response.data.choices[0].text.trim();
  } catch (error) {
    console.error('Error generating hair style recommendation:', error);
    throw error;
  }
};

// Analyze appointment preferences
export const analyzeAppointmentPreferences = async (preferences) => {
  if (testing) {
    console.log("Testing mode: analyzeAppointmentPreferences fake output");
    return "This is a fake appointment analysis.";
  }

  try {
    const { serviceType, timePreference, dayPreference, urgency, specialRequests } = preferences;
    const prompt = `Analyze customer preferences for:
      - Service type: ${serviceType}
      - Time preference: ${timePreference}
      - Day preference: ${dayPreference}
      - Urgency: ${urgency}
      - Special requests: ${specialRequests}`;

    const response = await openai.createCompletion({
      model: 'text-davinci-003',
      prompt,
      temperature: 0.7,
      max_tokens: 300,
    });
    return response.data.choices[0].text.trim();
  } catch (error) {
    console.error('Error analyzing appointment preferences:', error);
    throw error;
  }
};

// Generate message templates
export const generateMessageTemplate = async (messageType, customerDetails) => {
  if (testing) {
    console.log("Testing mode: generateMessageTemplate fake output");
    return "This is a fake message template.";
  }

  try {
    const { name, appointmentType, appointmentTime, lastVisit } = customerDetails;
    let prompt = '';

    switch (messageType) {
      case 'appointment_confirmation':
        prompt = `Generate an appointment confirmation for ${name} on ${appointmentTime} for ${appointmentType}.`;
        break;
      case 'appointment_reminder':
        prompt = `Generate an appointment reminder for ${name} on ${appointmentTime} for ${appointmentType}.`;
        break;
      case 'follow_up':
        prompt = `Generate a follow-up message for ${name} who last visited for ${appointmentType} on ${lastVisit}.`;
        break;
      case 'special_offer':
        prompt = `Generate a special offer message for ${name} who last visited for ${appointmentType} on ${lastVisit}.`;
        break;
      default:
        prompt = `Generate a general message for ${name}.`;
    }

    const response = await openai.createCompletion({
      model: 'text-davinci-003',
      prompt,
      temperature: 0.7,
      max_tokens: 200,
    });
    return response.data.choices[0].text.trim();
  } catch (error) {
    console.error('Error generating message template:', error);
    throw error;
  }
};

// Generate barber admin help
export const generateBarberAdminHelp = async (query) => {
  if (testing) {
    console.log("Testing mode: generateBarberAdminHelp fake output");
    return "This is a fake barber admin help response.";
  }

  try {
    const prompt = `As a barber shop AI assistant, help with the following query: "${query}".`;

    const response = await openai.createCompletion({
      model: 'text-davinci-003',
      prompt,
      temperature: 0.7,
      max_tokens: 500,
    });
    return response.data.choices[0].text.trim();
  } catch (error) {
    console.error('Error generating barber admin help:', error);
    throw error;
  }
};

export default {
  generateChatResponse,
  generateHairStyleRecommendation,
  analyzeAppointmentPreferences,
  generateMessageTemplate,
  generateBarberAdminHelp,
};
