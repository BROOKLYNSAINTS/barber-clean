const fs = require('fs');
const path = require('path');

// Read the existing .env file
const envPath = path.resolve(__dirname, '.env');
let envContent = '';

try {
  envContent = fs.readFileSync(envPath, 'utf8');
} catch (error) {
  console.warn('No .env file found, creating a new one from secrets');
}

// Add or replace environment variables from EAS Secrets
const secretsToAdd = [
  'FIREBASE_DEV_API_KEY',
  'FIREBASE_DEV_AUTH_DOMAIN',
  'FIREBASE_DEV_PROJECT_ID',
  'FIREBASE_DEV_STORAGE_BUCKET',
  'FIREBASE_DEV_MESSAGING_SENDER_ID',
  'FIREBASE_DEV_APP_ID',
  'FIREBASE_DEV_MEASUREMENT_ID',
  'FIREBASE_PROD_API_KEY',
  'FIREBASE_PROD_AUTH_DOMAIN',
  'FIREBASE_PROD_PROJECT_ID',
  'FIREBASE_PROD_STORAGE_BUCKET',
  'FIREBASE_PROD_MESSAGING_SENDER_ID',
  'FIREBASE_PROD_APP_ID',
  'FIREBASE_PROD_MEASUREMENT_ID',
  'STRIPE_PUBLISHABLE_KEY',
  'OPENAI_API_KEY',
];

// For each environment variable that exists in process.env, add or replace it in envContent
let newEnvContent = envContent;
let envAdded = false;

secretsToAdd.forEach(secret => {
  if (process.env[secret]) {
    // Check if the variable already exists in .env
    const regex = new RegExp(`^${secret}=.*`, 'm');
    const exists = regex.test(newEnvContent);

    if (exists) {
      // Replace existing variable
      newEnvContent = newEnvContent.replace(
        regex, 
        `${secret}=${process.env[secret]}`
      );
    } else {
      // Add new variable
      newEnvContent += `\n${secret}=${process.env[secret]}`;
    }
    envAdded = true;
  }
});

// If any environment variables were added or modified, write the new content
if (envAdded) {
  console.log('Updating .env with EAS Secrets...');
  fs.writeFileSync(envPath, newEnvContent.trim() + '\n');
  console.log('.env file updated successfully');
} else {
  console.log('No EAS Secrets found to add to .env');
}
