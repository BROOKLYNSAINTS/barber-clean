// src/services/apiConfig.js
// Central file for all API keys and endpoints
// Important: These values must be hardcoded for production builds

export const API_CONFIG = {
  // Firebase config is in firebaseConfig.js

  // Stripe API configuration
  stripe: {
    publishableKey: "pk_live_XXXXX", // Replace with your actual Stripe publishable key
    apiUrl: "https://api.stripe.com/v1"
  },

  // Google Maps API configuration
  googleMaps: {
    apiKey: "XXXXX", // Replace with your actual Google Maps API key
  },

  // Any other APIs your app uses
  otherApi: {
    apiKey: "XXXXX",
    baseUrl: "https://api.example.com"
  }
};

// Helper function to validate API configuration
export const validateApiConfig = () => {
  const issues = [];
  
  // Check Stripe config
  if (!API_CONFIG.stripe.publishableKey || API_CONFIG.stripe.publishableKey === "pk_live_XXXXX") {
    issues.push("Missing or invalid Stripe publishable key");
  }
  
  // Check Google Maps config
  if (!API_CONFIG.googleMaps.apiKey || API_CONFIG.googleMaps.apiKey === "XXXXX") {
    issues.push("Missing or invalid Google Maps API key");
  }
  
  // Log any issues
  if (issues.length > 0) {
    console.warn("⚠️ API Configuration issues detected:");
    issues.forEach(issue => console.warn(`- ${issue}`));
    return false;
  }
  
  return true;
};

// Call validation on import
validateApiConfig();
