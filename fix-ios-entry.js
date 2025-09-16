// fix-ios-entry.js
const fs = require('fs');
const path = require('path');

// Path to AppDelegate.swift
const appDelegateFilePath = path.join(__dirname, 'ios/barberclean/AppDelegate.swift');
let appDelegateContent = fs.readFileSync(appDelegateFilePath, 'utf8');

// Check if we need to update the AppDelegate
if (appDelegateContent.includes('withModuleName: "main"')) {
  console.log('AppDelegate.swift appears to be correctly configured');
} else {
  console.log('Updating AppDelegate.swift to use main module name...');
  
  // Find the factory.startReactNative line and ensure it uses "main" as the module name
  appDelegateContent = appDelegateContent.replace(
    /factory\.startReactNative\([^)]*\)/,
    'factory.startReactNative(withModuleName: "main", in: window, launchOptions: launchOptions)'
  );
  
  // Write the updated content back
  fs.writeFileSync(appDelegateFilePath, appDelegateContent, 'utf8');
  console.log('AppDelegate.swift updated successfully');
}

console.log('iOS entry point fix complete!');
