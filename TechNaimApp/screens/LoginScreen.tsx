import React, { useState } from 'react';
import { View, Text, TextInput, Button, Alert } from 'react-native';

import { NavigationProp } from '@react-navigation/native';

const LoginScreen = ({ navigation }: { navigation: NavigationProp<any> }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleLogin = () => {
    // Dummy login logic, replace with API call
    if (email === 'customer@example.com') {
      navigation.navigate('Customer');
    } else if (email === 'tech@example.com') {
      navigation.navigate('Technician');
    } else if (email === 'admin@example.com') {
      navigation.navigate('Admin');
    } else {
      Alert.alert('Login Failed', 'Invalid email or password');
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
