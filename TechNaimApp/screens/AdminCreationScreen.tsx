import React, { useState } from 'react';
import { View, Text, TextInput, Button, Alert } from 'react-native';
import { NavigationProp, RouteProp } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface Props {
    navigation: NavigationProp<any>;
    route: RouteProp<any>;
    }

const AdminCreationScreen = ({ navigation, route }: Props) => {
    const [name, setName] = useState('');
    const [country_id, setCountryId] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [companyName, setCompanyName] = useState('');

  const handleCreateAdmin = async () => {
    try {

      const token = await AsyncStorage.getItem('token');
      console.log('Stored token:', token);

      if(!token) {
        Alert.alert('Error', 'Token not found');
        return;
      }

      const response = await fetch('http://10.0.0.14:5000/api/auth/create-admin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`
         },
        body: JSON.stringify({ name, country_id, email, password, companyName, role: 'admin' })
      });

      const data = await response.json();

      if (!response.ok) throw new Error(data.message);

      Alert.alert('Admin Created Successfully', `Admin ${name} added.`);
    } catch (error) {
      Alert.alert('Error', (error as Error).message);
    }
  };

  return (
    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <Text>Create Admin</Text>
        <TextInput
            placeholder="Full Name"
            value={name}
            onChangeText={setName}
            style={{ borderWidth: 1, width: 200, marginBottom: 10, padding: 5 }}
        />
        <TextInput
            placeholder="Email"
            value={email}
            onChangeText={setEmail}
            style={{ borderWidth: 1, width: 200, marginBottom: 10, padding: 5 }}
        />
        <TextInput
            placeholder="ID"
            value={country_id}
            onChangeText={setCountryId}
            keyboardType="numeric"
            secureTextEntry
            style={{ borderWidth: 1, width: 200, marginBottom: 10, padding: 5 }}
        />
        <TextInput
            placeholder="Password"
            value={password}
            onChangeText={setPassword}
            secureTextEntry
            style={{ borderWidth: 1, width: 200, marginBottom: 10, padding: 5 }}
        />
        <TextInput
            placeholder="Company Name"
            value={companyName}
            onChangeText={setCompanyName}
            style={{ borderWidth: 1, width: 200, marginBottom: 10, padding: 5 }}
        />
        <Button title="Create Admin" onPress={handleCreateAdmin} />
    </View>
  );
};

export default AdminCreationScreen;
