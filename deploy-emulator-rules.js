// deploy-emulator-rules.js
// This script deploys the Firestore rules to the emulator without requiring firebase deploy
const fs = require('fs');
const http = require('http');

console.log('📝 Reading Firestore rules from firestore.rules');
const rules = fs.readFileSync('./firestore.rules', 'utf8');

console.log('🔄 Deploying rules to emulator...');

const options = {
  hostname: 'localhost',
  port: 8080,
  path: '/emulator/v1/projects/demo-barber:ruleset',
  method: 'PUT',
  headers: {
    'Content-Type': 'application/json',
  }
};

const req = http.request(options, (res) => {
  console.log(`🔄 Status: ${res.statusCode}`);
  
  let data = '';
  res.on('data', (chunk) => {
    data += chunk;
  });
  
  res.on('end', () => {
    if (res.statusCode === 200) {
      console.log('✅ Rules successfully deployed to emulator');
    } else {
      console.error('❌ Failed to deploy rules:', data);
    }
  });
});

req.on('error', (error) => {
  console.error('❌ Error deploying rules:', error.message);
});

const rulesetJson = {
  rules: {
    firestore: rules
  }
};

req.write(JSON.stringify(rulesetJson));
req.end();
