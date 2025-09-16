/**
 * Advanced Debug Logger for Barber App
 * Provides comprehensive logging for TestFlight and production builds
 */

import Constants from 'expo-constants';
import * as Application from 'expo-application';
import * as Device from 'expo-device';
import { Platform } from 'react-native';
import { Alert } from 'react-native';

// Log levels
const LOG_LEVEL = {
  DEBUG: 0,
  INFO: 1,
  WARN: 2,
  ERROR: 3,
  CRITICAL: 4
};

// Get environment information
const getEnvironmentInfo = () => {
  return {
    buildType: Constants.expoConfig?.extra?.buildType || 'unknown',
    isTestFlight: Constants.expoConfig?.extra?.isTestFlight || false,
    appVersion: Application.nativeApplicationVersion || 'unknown',
    buildNumber: Application.nativeBuildVersion || 'unknown',
    platform: Platform.OS,
    osVersion: Platform.Version,
    deviceModel: Device.modelName || 'unknown',
    expoVersion: Constants.expoVersion,
    expoSdkVersion: Constants.manifest?.sdkVersion || 'unknown',
    appOwnership: Constants.appOwnership || 'unknown'
  };
};

// Log the environment when this file is imported
console.log('📱 APP ENVIRONMENT:', JSON.stringify(getEnvironmentInfo(), null, 2));

/**
 * Format logs with consistent structure
 */
const formatLog = (level, module, message, data = null) => {
  const timestamp = new Date().toISOString();
  const envInfo = getEnvironmentInfo();
  const buildInfo = `${envInfo.buildType}${envInfo.isTestFlight ? '-TestFlight' : ''}`;
  
  let prefix = '';
  switch(level) {
    case LOG_LEVEL.DEBUG: prefix = '🔍 DEBUG'; break;
    case LOG_LEVEL.INFO: prefix = '📝 INFO'; break;
    case LOG_LEVEL.WARN: prefix = '⚠️ WARNING'; break;
    case LOG_LEVEL.ERROR: prefix = '🛑 ERROR'; break;
    case LOG_LEVEL.CRITICAL: prefix = '⛔ CRITICAL'; break;
  }
  
  return {
    timestamp,
    level: prefix,
    module,
    message,
    data,
    environment: buildInfo,
    deviceInfo: `${envInfo.platform} ${envInfo.osVersion}`,
    appInfo: `${envInfo.appVersion} (${envInfo.buildNumber})`
  };
};

/**
 * Debug logger functions
 */
export const Logger = {
  debug: (module, message, data = null) => {
    const logObject = formatLog(LOG_LEVEL.DEBUG, module, message, data);
    console.log(`${logObject.level} [${logObject.module}] ${logObject.message}`);
    if (data) console.log(JSON.stringify(data, null, 2));
  },
  
  info: (module, message, data = null) => {
    const logObject = formatLog(LOG_LEVEL.INFO, module, message, data);
    console.log(`${logObject.level} [${logObject.module}] ${logObject.message}`);
    if (data) console.log(JSON.stringify(data, null, 2));
  },
  
  warn: (module, message, data = null) => {
    const logObject = formatLog(LOG_LEVEL.WARN, module, message, data);
    console.warn(`${logObject.level} [${logObject.module}] ${logObject.message}`);
    if (data) console.warn(JSON.stringify(data, null, 2));
  },
  
  error: (module, message, error = null, data = null) => {
    const logObject = formatLog(LOG_LEVEL.ERROR, module, message, data);
    console.error(`${logObject.level} [${logObject.module}] ${logObject.message}`);
    
    if (error) {
      console.error('Error details:', {
        name: error.name,
        message: error.message,
        code: error.code,
        stack: error.stack
      });
    }
    
    if (data) console.error(JSON.stringify(data, null, 2));
    
    // Could add remote error logging here
  },
  
  critical: (module, message, error = null, data = null, showAlert = false) => {
    const logObject = formatLog(LOG_LEVEL.CRITICAL, module, message, data);
    console.error(`${logObject.level} [${logObject.module}] ${logObject.message}`);
    
    if (error) {
      console.error('Critical error details:', {
        name: error.name,
        message: error.message,
        code: error.code,
        stack: error.stack
      });
    }
    
    if (data) console.error(JSON.stringify(data, null, 2));
    
    // Show alert if requested (useful for TestFlight debugging)
    if (showAlert) {
      const env = getEnvironmentInfo();
      Alert.alert(
        'Critical Error',
        `${message}\n\nApp: ${env.appVersion} (${env.buildNumber})\nBuild: ${env.buildType}\nDevice: ${env.deviceModel}`,
        [{ text: 'OK' }]
      );
    }
    
    // Could add remote error logging here
  },
  
  // Create a snapshot of current environment
  logEnvironment: (module = 'Environment') => {
    const env = getEnvironmentInfo();
    console.log('📊 ENVIRONMENT SNAPSHOT');
    console.log('- App Version:', env.appVersion);
    console.log('- Build Number:', env.buildNumber);
    console.log('- Build Type:', env.buildType);
    console.log('- Is TestFlight:', env.isTestFlight);
    console.log('- Platform:', env.platform, env.osVersion);
    console.log('- Device Model:', env.deviceModel);
    console.log('- Expo Version:', env.expoVersion);
    console.log('- App Ownership:', env.appOwnership);
    
    // Add all important environment variables and configs
    if (Constants.expoConfig?.extra) {
      console.log('- App Extra Config:', JSON.stringify(Constants.expoConfig.extra, null, 2));
    }
  },
  
  // Log payment transaction for better tracking
  logPayment: (module, status, details) => {
    const logLevel = status === 'success' ? LOG_LEVEL.INFO : LOG_LEVEL.ERROR;
    const message = `Payment ${status}: ${details.type || 'Unknown'} - $${details.amount || 0}`;
    
    const logObject = formatLog(logLevel, module, message, details);
    
    if (status === 'success') {
      console.log(`💰 PAYMENT SUCCESS [${logObject.module}] ${message}`);
    } else {
      console.error(`💰❌ PAYMENT FAILED [${logObject.module}] ${message}`);
    }
    
    console.log('- Payment Details:', JSON.stringify(details, null, 2));
    
    // Could add analytics or payment tracking here
  }
};

export default Logger;