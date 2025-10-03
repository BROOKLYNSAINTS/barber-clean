const fs = require('fs');
const path = require('path');

// This script runs during EAS Build to ensure environment variables are available
function setupEnv() {
  console.log('Setting up environment variables for EAS build...');
  
  // Create a new .env file with hardcoded values for the build
  // These will be used only during build time and won't be committed to git
  const envContent = `
# Firebase Development Environment
EXPO_PUBLIC_FIREBASE_DEV_API_KEY=AIzaSyD3FFprDwIZwECR5TkYCeOkiCUNGLp6qQM
EXPO_PUBLIC_FIREBASE_DEV_AUTH_DOMAIN=barber-38b88.firebaseapp.com
EXPO_PUBLIC_FIREBASE_DEV_PROJECT_ID=barber-38b88
EXPO_PUBLIC_FIREBASE_DEV_STORAGE_BUCKET=barber-38b88.appspot.com
EXPO_PUBLIC_FIREBASE_DEV_MESSAGING_SENDER_ID=910680290414
EXPO_PUBLIC_FIREBASE_DEV_APP_ID=1:910680290414:web:606ee1c0e84c32e6bfcc8c
EXPO_PUBLIC_FIREBASE_DEV_MEASUREMENT_ID=G-B6HMP9YK92

# Stripe Test Keys
EXPO_PUBLIC_STRIPE_TEST_PUBLISHABLE_KEY=pk_test_51RvYLr4MureyHjXxtQW5NTFkSww0Q0seO7oTPzXTTMN1s41g0tBp74EsrPKxB7xthR9zSbGegMOmZcIBe97SHXTi00ut28z7xS
EXPO_PUBLIC_STRIPE_BACKEND_URL=https://barber-backend-ten.vercel.app
`;
  
  const envPath = path.join(__dirname, '.env');
  fs.writeFileSync(envPath, envContent.trim());
  console.log('Created .env file with development values for build');
  
  // Log the values to confirm they're set
  console.log('Environment variables set:');
  console.log('EXPO_PUBLIC_FIREBASE_DEV_API_KEY exists:', !!process.env.EXPO_PUBLIC_FIREBASE_DEV_API_KEY);
}

setupEnv();
