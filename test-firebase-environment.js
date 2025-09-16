// test-firebase-environment.js
// This script tests the firebaseEnvironment.js file to ensure it correctly
// identifies the current environment and returns the appropriate Firebase config

import firebaseConfig, { 
  setUseProductionDatabase, 
  setSimulateTestFlight, 
  setSimulateAppStore
} from './src/services/firebaseEnvironment';

// Tests to run
const runTests = async () => {
  console.log('\n🧪 TEST FIREBASE ENVIRONMENT CONFIGURATION 🧪');
  console.log('================================================');
  
  // Test 1: Check default configuration (should be development)
  console.log('\n📊 Test 1: Default Configuration');
  console.log('Default Firebase Config:', firebaseConfig);
  console.log('Project ID:', firebaseConfig.projectId);
  console.log('Should be using DEV database (barber-38b88)');
  
  // Test 2: Simulate production database
  console.log('\n📊 Test 2: Force Production Database');
  await setUseProductionDatabase(true);
  console.log('Project ID should now be:', firebaseConfig.projectId);
  console.log('Should be using PRODUCTION database (barberapp-prod-2d197)');
  
  // Test 3: Simulate TestFlight environment
  console.log('\n📊 Test 3: Simulate TestFlight Environment');
  await setSimulateTestFlight(true);
  console.log('Project ID should now be:', firebaseConfig.projectId);
  console.log('Should be using DEV database (barber-38b88)');
  
  // Test 4: Simulate App Store environment
  console.log('\n📊 Test 4: Simulate App Store Environment');
  await setSimulateAppStore(true);
  console.log('Project ID should now be:', firebaseConfig.projectId);
  console.log('Should be using PRODUCTION database (barberapp-prod-2d197)');
  
  // Test 5: Reset to default
  console.log('\n📊 Test 5: Reset to Default');
  await setUseProductionDatabase(false);
  console.log('Project ID should now be:', firebaseConfig.projectId);
  console.log('Should be using DEV database (barber-38b88)');
  
  console.log('\n✅ All tests completed!');
  console.log('================================================');
};

// Run tests
runTests().catch(error => {
  console.error('❌ Test failed with error:', error);
});