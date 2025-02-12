import React, { useState } from 'react';
import { View, Text, TextInput, Button, Alert } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';


import { NavigationProp } from '@react-navigation/native';

const LoginScreen = ({ navigation }: { navigation: NavigationProp<any> }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleLogin = async () => {
      if (!email || !password) {
        Alert.alert('Validation Failed', 'Please fill in all fields.');
        return;
      }

      try {
        // Make a POST request to the server to log in
        const response = await fetch('http://10.0.0.14:5000/api/auth/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email, password })
        });

        const contentType = response.headers.get('content-type');
        if (!contentType || !contentType.includes('application/json')) {
          throw new Error('Expected JSON response');
        }

        const data = await response.json();

        if (!response.ok) throw new Error(data.message);

        // Save the token in local storage
        await AsyncStorage.setItem('token', data.token);

        // Navigate to the home screen
        switch (data.user.role) {
          case 'superAdmin':
              navigation.navigate('AdminCreation', { user: data.user });
            break;
          case 'admin':
            navigation.navigate('Admin', { user: data.user });
            break;
          case 'technician':
            navigation.navigate('Technician', { user: data.user });
            break;
          case 'customer':
            navigation.navigate('Customer', { user: data.user });
            break;
          default:
            throw new Error('Invalid user role: ', data.user.role);
        }
      } catch (error) {
        console.error('Login error:', error);
        if (error instanceof Error) {
          Alert.alert('Login Failed', error.message);
        } else {
          Alert.alert('Login Failed', 'An unknown error occurred.');
        }
      }



  };

  return (
    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
      <Text>Login</Text>
      <TextInput
        placeholder="Email"
        value={email}
        onChangeText={setEmail}
        style={{ borderWidth: 1, width: 200, marginBottom: 10, padding: 5 }}
      />
      <TextInput
        placeholder="Password"
        value={password}
        onChangeText={setPassword}
        secureTextEntry
        style={{ borderWidth: 1, width: 200, marginBottom: 10, padding: 5 }}
      />
      <Button title="Login" onPress={handleLogin} />
      <Button title="Sign Up" onPress={() => navigation.navigate('Signup')} />
    </View>
  );
};

export default LoginScreen;
