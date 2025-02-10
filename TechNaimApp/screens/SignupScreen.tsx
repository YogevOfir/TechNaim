import React, { useState } from 'react';
import { View, Text, TextInput, Button, Alert } from 'react-native';
import { NavigationProp } from '@react-navigation/native';

const SignupScreen = ({ navigation }: { navigation: NavigationProp<any> }) => {
  const [name, setName] = useState('');
  const [country_id, setId] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleSignup = async () => {
    // Basic validation for empty fields
    if (!name || !country_id || !email || !password) {
      Alert.alert('Validation Failed', 'Please fill in all fields.');
      return;
    }

    // Ensure country_id is numeric
    if (isNaN(Number(country_id))) {
      Alert.alert('Validation Failed', 'Country ID must be a number.');
      return;
    }

    // Ensure email is in format 'name@domain.end'
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      Alert.alert('Validation Failed', 'Invalid email address.');
      return;
    }

    // Ensure password is at least 6 characters long
    if (password.length < 6) {
      Alert.alert('Validation Failed', 'Password must be at least 6 characters long.');
      return;
    }

    try {
      const response = await fetch('http://10.0.0.14:5000/api/auth/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, country_id, email, password, role: 'customer' })
      });

      const data = await response.json();
      // console.log('Signup response:', data);

      if (!response.ok) throw new Error(data.message);

      Alert.alert('Signup Successful', 'You can now log in.');
      navigation.navigate('Login');
    } catch (error) {
      // console.error('Signup error:', error);
      if (error instanceof Error) {
        Alert.alert('Signup Failed', error.message);
      } else {
        Alert.alert('Signup Failed', 'An unknown error occurred.');
      }
    }
  };

  return (
    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
      <Text>Signup</Text>
      <TextInput
        placeholder="Full Name"
        value={name}
        onChangeText={setName}
        style={{ borderWidth: 1, width: 200, marginBottom: 10, padding: 5 }}
      />
      <TextInput
        placeholder="ID"
        value={country_id}
        onChangeText={setId}
        keyboardType="numeric" // Ensure numeric input for country_id
        style={{ borderWidth: 1, width: 200, marginBottom: 10, padding: 5 }}
      />
      <TextInput
        placeholder="Email"
        value={email}
        onChangeText={setEmail}
        keyboardType="email-address" // Set keyboard for email input
        style={{ borderWidth: 1, width: 200, marginBottom: 10, padding: 5 }}
      />
      <TextInput
        placeholder="Password"
        value={password}
        onChangeText={setPassword}
        secureTextEntry
        style={{ borderWidth: 1, width: 200, marginBottom: 10, padding: 5 }}
      />
      <Button title="Signup" onPress={handleSignup} />
    </View>
  );
};

export default SignupScreen;
