// ErrorBoundary.js - Global error boundary to catch crashes and recover gracefully
import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Platform } from 'react-native';
import * as Updates from 'expo-updates';
import { applyComprehensiveFix } from './comprehensive-fix';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { 
      hasError: false,
      error: null,
      errorInfo: null,
      isRecovering: false
    };
  }

  static getDerivedStateFromError(error) {
    // Update state so the next render will show the fallback UI
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    // Log the error to your analytics service
    console.error('🚨 App crashed with error:', error);
    console.error('🔍 Error details:', errorInfo);
    
    // You could send this to a logging service like Firebase Crashlytics
    this.setState({ errorInfo });
  }

  handleRestart = async () => {
    this.setState({ isRecovering: true });
    
    try {
      // First apply our comprehensive fix
      await applyComprehensiveFix();
      
      // Then reload the app
      if (Platform.OS !== 'web') {
        // In production, use Updates.reloadAsync()
        if (Updates.channel !== 'development') {
          await Updates.reloadAsync();
        } else {
          // In development, we'll just reset the error state
          this.setState({ 
            hasError: false, 
            error: null, 
            errorInfo: null,
            isRecovering: false 
          });
        }
      } else {
        // On web, reload the page
        window.location.reload();
      }
    } catch (error) {
      console.error('❌ Failed to recover from crash:', error);
      this.setState({ isRecovering: false });
    }
  }

  render() {
    if (this.state.hasError) {
      const { isRecovering } = this.state;
      
      // Render fallback UI for crashed app
      return (
        <View style={styles.container}>
          <Text style={styles.title}>Something went wrong</Text>
          <Text style={styles.message}>
            We apologize for the inconvenience. The app encountered an unexpected issue.
          </Text>
          
          <TouchableOpacity 
            style={styles.button} 
            onPress={this.handleRestart}
            disabled={isRecovering}
          >
            <Text style={styles.buttonText}>
              {isRecovering ? 'Recovering...' : 'Restart App'}
            </Text>
          </TouchableOpacity>
          
          {__DEV__ && this.state.error && (
            <View style={styles.devErrorContainer}>
              <Text style={styles.devErrorTitle}>Error Details (Dev Only):</Text>
              <Text style={styles.devErrorText}>{this.state.error.toString()}</Text>
            </View>
          )}
        </View>
      );
    }

    // If no error, render children normally
    return this.props.children;
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
    backgroundColor: '#f8f8f8',
  },
  title: {
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 20,
    textAlign: 'center',
  },
  message: {
    fontSize: 16,
    marginBottom: 30,
    textAlign: 'center',
    lineHeight: 22,
  },
  button: {
    backgroundColor: '#007bff',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
    marginTop: 20,
  },
  buttonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  devErrorContainer: {
    marginTop: 40,
    padding: 20,
    backgroundColor: '#ffe6e6',
    borderRadius: 8,
    width: '100%',
  },
  devErrorTitle: {
    fontWeight: 'bold',
    marginBottom: 10,
    color: '#cc0000',
  },
  devErrorText: {
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
    fontSize: 12,
  }
});

export default ErrorBoundary;