import React, { useState } from 'react';
import { View, Text, TextInput, Button, Alert } from 'react-native';

import { NavigationProp } from '@react-navigation/native';

const SignupScreen = ({ navigation }: { navigation: NavigationProp<any> }) => {
  const [name, setName] = useState('');
  const [id, setId] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleSignup = async () => {
    try {
      const response = await fetch('http://YOUR_SERVER_URL:5000/api/auth/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, id, email, password })
      });

      const data = await response.json();

      if (!response.ok) throw new Error(data.message);

      Alert.alert('Signup Successful', 'You can now log in.');
      navigation.navigate('Login');
    } catch (error) {
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
        placeholder="id"
        value={email}
        onChangeText={setId}
        style={{ borderWidth: 1, width: 200, marginBottom: 10, padding: 5 }}
      />
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
      <Button title="Sign Up" onPress={handleSignup} />
    </View>
  );
};

export default SignupScreen;
