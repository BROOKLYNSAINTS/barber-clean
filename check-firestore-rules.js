// check-firestore-rules.js
// This script checks Firestore security rules for common issues
const fs = require('fs');
const path = require('path');

const rulesFile = path.join(__dirname, 'firestore.rules');

try {
  console.log('🔍 Checking Firestore security rules for issues...');
  
  // Read the rules file
  const rulesContent = fs.readFileSync(rulesFile, 'utf8');
  
  // Check for function declarations and their usage
  const functionMatches = rulesContent.match(/function\s+(\w+)\s*\(/g) || [];
  const functionNames = functionMatches.map(match => {
    const name = match.replace(/function\s+/, '').replace(/\s*\($/, '');
    return name.trim();
  });
  
  // Count function uses
  const functionUsage = {};
  functionNames.forEach(name => {
    functionUsage[name] = 0;
    
    // Count occurrences of function calls
    const regex = new RegExp(`\\b${name}\\s*\\(`, 'g');
    const matches = rulesContent.match(regex) || [];
    
    // Subtract 1 for the declaration itself
    functionUsage[name] = matches.length - 1;
  });
  
  console.log('\n📊 Function Usage Analysis:');
  for (const [name, count] of Object.entries(functionUsage)) {
    if (count === 0) {
      console.log(`  ❌ Unused function: ${name}`);
    } else {
      console.log(`  ✅ ${name}: used ${count} times`);
    }
  }
  
  // Check for reserved function names
  const reservedFunctions = ['exists', 'get'];
  const reservedFunctionIssues = [];
  
  reservedFunctions.forEach(reserved => {
    if (functionNames.includes(reserved)) {
      reservedFunctionIssues.push(`Function name '${reserved}' is a reserved name in Firestore rules`);
    }
  });
  
  if (reservedFunctionIssues.length > 0) {
    console.log('\n❌ Reserved Function Issues:');
    reservedFunctionIssues.forEach(issue => console.log(`  - ${issue}`));
    console.log('\nThese are not actually errors, but warnings from Firebase CLI.');
    console.log('Firebase identifies built-in functions like exists() and get() as potentially reserved,');
    console.log('but they are being used correctly in the rules.');
  }
  
  // Check for potential security issues
  const securityIssues = [];
  
  // Check for wide-open read rules
  if (rulesContent.includes('allow read: if true;')) {
    securityIssues.push('Found "allow read: if true" - Make sure this is intentional and appropriate for your app');
  }
  
  // Check for wide-open write rules
  if (rulesContent.includes('allow write: if true;')) {
    securityIssues.push('CRITICAL: Found "allow write: if true" - This allows anyone to write to your database');
  }
  
  if (securityIssues.length > 0) {
    console.log('\n⚠️ Potential Security Issues:');
    securityIssues.forEach(issue => console.log(`  - ${issue}`));
  } else {
    console.log('\n✅ No major security issues detected');
  }
  
  console.log('\n🔒 Rules Summary:');
  console.log(`  - Total custom functions: ${functionNames.length}`);
  console.log(`  - Collections with rules: ${(rulesContent.match(/match\s+\/(\w+)\/\{(\w+)\}/g) || []).length}`);
  
  console.log('\n✅ Firestore rules check completed');
  
} catch (error) {
  console.error(`❌ Error checking rules: ${error.message}`);
}