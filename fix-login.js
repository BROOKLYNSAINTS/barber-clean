// fix-login.js
const fs = require('fs');
const path = require('path');

const loginFilePath = path.join(__dirname, 'app/(auth)/login.js');

const newContent = `import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { loginWithEmail } from '@/services/restAuth';
import { getUserProfile } from '@/services/firebase';
import * as SplashScreen from 'expo-splash-screen';
import { useRouter } from 'expo-router';
import { registerForPushNotifications, saveNotificationToken } from '@/services/notifications';
import DebugUser from '@/components/DebugUser';
import { useAuth } from '@/contexts/AuthContext';

// Environment (process.env)
const { FIREBASE_API_KEY } = process.env;

console.log("📱 LOGIN SCREEN LOADED");
try { SplashScreen.hideAsync(); } catch {}

export default function Login() {
  const router = useRouter();
  const [email,setEmail] = useState('');
  const [password,setPassword] = useState('');
  const [loading,setLoading] = useState(false);
  const [error,setError] = useState('');

  useEffect(() => {
    SplashScreen.hideAsync().catch(()=>{});
    const t = setTimeout(()=>SplashScreen.hideAsync().catch(()=>{}),300);
    return () => clearTimeout(t);
  }, []);

  const goTo = (path) => router.replace(path);

  const handleLogin = async () => {
    try {
      if (!email || !password) { setError('Please enter both email and password'); return; }
      setLoading(true); setError('');
      const user = await loginWithEmail(email,password);
      const profile = await getUserProfile(user.uid);
      if (profile?.role === 'barber') goTo('/(app)/(barber)/dashboard');
      else goTo('/(app)/(customer)');
      const token = await registerForPushNotifications();
      if (token) await saveNotificationToken(user.uid, token);
    } catch (e) {
      setError('Login failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>Welcome Back</Text>
      {error ? <Text style={styles.errorText}>{error}</Text> : null}

      <View style={styles.inputContainer}>
        <Text style={styles.label}>Email</Text>
        <TextInput value={email} onChangeText={setEmail} style={styles.input} autoCapitalize="none" keyboardType="email-address" placeholder="Enter your email" />
      </View>

      <View style={styles.inputContainer}>
        <Text style={styles.label}>Password</Text>
        <TextInput value={password} onChangeText={setPassword} style={styles.input} secureTextEntry placeholder="Enter your password" />
      </View>

      <TouchableOpacity onPress={() => goTo('/(auth)/forgot-password')} style={styles.forgotPassword}>
        <Text style={styles.link}>Forgot Password?</Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.button} onPress={handleLogin} disabled={loading}>
        <Text style={styles.buttonText}>{loading ? 'Logging in...' : 'Login'}</Text>
      </TouchableOpacity>

      <View style={styles.footer}>
        <Text>Don't have an account? </Text>
        <TouchableOpacity onPress={() => goTo('/(auth)/register')}>
          <Text style={styles.link}>Register</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container:{ flexGrow:1, padding:20, backgroundColor:'#fff', justifyContent:'center' },
  title:{ fontSize:24, fontWeight:'bold', marginBottom:20, textAlign:'center' },
  inputContainer:{ marginBottom:15 },
  label:{ marginBottom:5, fontWeight:'500' },
  input:{ borderWidth:1, borderColor:'#ddd', borderRadius:8, padding:12, fontSize:16 },
  forgotPassword:{ alignSelf:'flex-end', marginBottom:15 },
  button:{ backgroundColor:'#2196F3', padding:15, borderRadius:8, alignItems:'center' },
  buttonText:{ color:'#fff', fontSize:16, fontWeight:'bold' },
  footer:{ flexDirection:'row', justifyContent:'center', marginTop:20 },
  link:{ color:'#2196F3', fontWeight:'bold' },
  errorText:{ color:'red', marginBottom:10, textAlign:'center' }
});
`;

fs.writeFileSync(loginFilePath, newContent, 'utf8');
