// debug-stripe-config.js
// This script helps debug Stripe configuration issues

const fs = require('fs');
const path = require('path');
require('dotenv').config();

console.log('🔍 STRIPE CONFIGURATION DEBUG');
console.log('----------------------------');

// Check for .env file
console.log('\n📄 .env FILE CHECK');
try {
  const envPath = path.resolve('.env');
  const envExists = fs.existsSync(envPath);
  console.log(`- .env file exists: ${envExists}`);
  
  if (envExists) {
    const envContent = fs.readFileSync(envPath, 'utf8');
    const stripeLines = envContent
      .split('\n')
      .filter(line => line.trim().startsWith('STRIPE_'))
      .map(line => {
        const [key, ...rest] = line.split('=');
        const value = rest.join('=');
        return {
          key,
          valueLength: value?.length || 0,
          prefix: value?.substring(0, 10) + '...' || 'empty'
        };
      });
    
    console.log(`- Found ${stripeLines.length} Stripe-related environment variables:`);
    stripeLines.forEach(line => {
      console.log(`  - ${line.key}: ${line.valueLength} chars, starts with ${line.prefix}`);
    });
  }
} catch (error) {
  console.error(`- Error reading .env file: ${error.message}`);
}

// Check for app.config.js
console.log('\n📱 APP.CONFIG.JS CHECK');
try {
  const appConfigPath = path.resolve('app.config.js');
  const appConfigExists = fs.existsSync(appConfigPath);
  console.log(`- app.config.js exists: ${appConfigExists}`);
  
  if (appConfigExists) {
    const appConfig = require('./app.config.js');
    
    console.log('- Environment variables in app.config.js:');
    const stripeKeys = [
      'STRIPE_TEST_PUBLISHABLE_KEY',
      'STRIPE_LIVE_PUBLISHABLE_KEY',
      'STRIPE_BACKEND_URL',
      'MERCHANT_IDENTIFIER',
      'URL_SCHEME'
    ];
    
    stripeKeys.forEach(key => {
      const value = appConfig.extra?.[key];
      console.log(`  - ${key}: ${value ? 'defined' : 'undefined'}`);
      if (value && typeof value === 'string') {
        console.log(`    Length: ${value.length}, Prefix: ${value.substring(0, 10)}...`);
      }
    });
  }
} catch (error) {
  console.error(`- Error reading app.config.js: ${error.message}`);
}

// Check for stripeConfig.js
console.log('\n💳 STRIPECONFIG.JS CHECK');
try {
  console.log('- Direct import check may not work due to ES modules vs CommonJS');
  console.log('  This would need to be checked in the running app');
  console.log('  Check the console logs when running the app');
} catch (error) {
  console.error(`- Error checking stripeConfig.js: ${error.message}`);
}

console.log('\n📡 BACKEND CHECK');
const https = require('https');

const checkBackend = (url) => {
  return new Promise((resolve) => {
    console.log(`- Checking backend at: ${url}`);
    
    const request = https.get(url, (response) => {
      let data = '';
      
      response.on('data', (chunk) => {
        data += chunk;
      });
      
      response.on('end', () => {
        console.log(`  - Status: ${response.statusCode}`);
        try {
          const jsonData = JSON.parse(data);
          console.log(`  - Response: ${JSON.stringify(jsonData)}`);
          resolve(true);
        } catch (e) {
          console.log(`  - Response (non-JSON): ${data.substring(0, 100)}...`);
          resolve(false);
        }
      });
    });
    
    request.on('error', (error) => {
      console.error(`  - Error: ${error.message}`);
      resolve(false);
    });
    
    request.end();
  });
};

// Check the backend
const backendUrl = process.env.STRIPE_BACKEND_URL || 'https://barber-backend-ten.vercel.app';

(async () => {
  await checkBackend(`${backendUrl}/health`);
  
  console.log('\n🔑 RECOMMENDATIONS:');
  console.log('1. Ensure STRIPE_BACKEND_URL, STRIPE_LIVE_PUBLISHABLE_KEY, and STRIPE_TEST_PUBLISHABLE_KEY are set in .env');
  console.log('2. Make sure app.config.js correctly passes these values to the app');
  console.log('3. Verify the backend is accessible and returning proper responses');
  console.log('4. Check that the Stripe publishable key format matches what the SDK expects');
  console.log('5. Make sure the backend and frontend are using compatible Stripe API versions');
})();