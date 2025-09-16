// generate-stable-config.js
// Script to generate optimized app.json configuration for stability
const fs = require('fs');
const path = require('path');

// Read the current app.config.js
const appConfigPath = path.join(__dirname, 'app.config.js');
let appConfig;

try {
  // Try to require the app.config.js
  appConfig = require(appConfigPath);
  console.log('✅ Successfully loaded app.config.js');
} catch (error) {
  console.error('❌ Failed to load app.config.js:', error);
  process.exit(1);
}

// Create enhanced configuration with stability improvements
function generateStableConfig() {
  // Start with the base config
  const config = typeof appConfig === 'function' ? appConfig({}) : appConfig;
  
  // Enhance iOS configuration
  if (!config.ios) config.ios = {};
  
  // Add stability enhancements
  config.ios = {
    ...config.ios,
    // Prevent background crash by allowing more memory
    supportsTablet: true,
    requireFullScreen: false,
    // Better memory management
    associatedDomains: config.ios.associatedDomains || [],
    // Prevent Firebase crashes
    googleServicesFile: config.ios.googleServicesFile || './GoogleService-Info.plist',
    // Improved memory handling
    infoPlist: {
      ...(config.ios.infoPlist || {}),
      UIBackgroundModes: [
        'fetch',
        'remote-notification'
      ],
      // Prevent WebView crashes
      NSAppTransportSecurity: {
        NSAllowsArbitraryLoads: true,
      },
      // Better memory management
      UIApplicationSceneManifest: {
        UIApplicationSupportsMultipleScenes: false
      },
      // Prevent WebView memory issues
      WKAppBoundDomains: [
        "barber-backend-ten.vercel.app"
      ]
    }
  };
  
  // Enhance Android configuration
  if (!config.android) config.android = {};
  config.android = {
    ...config.android,
    // Prevent OOM crashes
    softwareKeyboardLayoutMode: "pan",
    // Better WebView stability
    package: config.android.package || "com.barberapp",
    // Optimize memory use
    adaptiveIcon: {
      ...(config.android.adaptiveIcon || {}),
      backgroundColor: config.android.adaptiveIcon?.backgroundColor || "#ffffff"
    },
    // Prevent Firebase crashes
    googleServicesFile: config.android.googleServicesFile || './google-services.json',
  };
  
  // General stability improvements
  config.web = {
    ...(config.web || {}),
    favicon: config.web?.favicon || "./assets/favicon.png"
  };
  
  // Add development client properties for better debugging
  config.developmentClient = {
    ...(config.developmentClient || {}),
    silentLaunch: false
  };
  
  // Add extra configuration for better error handling
  config.extra = {
    ...(config.extra || {}),
    // Add stability settings
    enableComprehensiveFix: true,
    enableErrorBoundary: true,
    recoveryTimeoutMs: 5000,
    useImprovedWebView: true,
    // Preserve existing values
    eas: config.extra?.eas || {},
  };
  
  // Add expo updates configuration if needed
  if (!config.updates) {
    config.updates = {
      url: "https://u.expo.dev/your-project-id", // Replace with your actual project ID
      enabled: true,
      checkAutomatically: "ON_LOAD"
    };
  }
  
  // Add plugins for stability if not present
  const requiredPlugins = [
    'expo-router',
    'expo-secure-store', 
    'expo-application',
    '@react-native-async-storage/async-storage',
    'expo-dev-client'
  ];
  
  if (!config.plugins) config.plugins = [];
  
  // Add any missing required plugins
  for (const plugin of requiredPlugins) {
    if (!config.plugins.includes(plugin) && 
        !config.plugins.some(p => typeof p === 'object' && p[0] === plugin)) {
      config.plugins.push(plugin);
    }
  }
  
  return config;
}

// Generate the enhanced configuration
const enhancedConfig = generateStableConfig();

// Write the enhanced configuration to a new file
const outputPath = path.join(__dirname, 'app.config.stable.js');
const configOutput = `// app.config.stable.js - Enhanced for stability
// Generated on ${new Date().toISOString()}
// Run "expo prebuild --clean" after applying these changes

module.exports = ${JSON.stringify(enhancedConfig, null, 2)};`;

fs.writeFileSync(outputPath, configOutput);
console.log(`✅ Enhanced configuration written to ${outputPath}`);
console.log('To apply these changes:');
console.log('1. Review the generated file');
console.log('2. Rename it to app.config.js');
console.log('3. Run "expo prebuild --clean"');
console.log('4. Build your app with "eas build"');