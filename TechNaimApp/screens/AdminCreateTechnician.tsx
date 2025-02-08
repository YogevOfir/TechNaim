import React, { useState } from 'react';
import { View, Text, TextInput, Button, Alert } from 'react-native';

import { NavigationProp, RouteProp } from '@react-navigation/native';

interface Props {
  navigation: NavigationProp<any>;
  route: RouteProp<any>;
}

const AdminCreateTechnician = ({ navigation, route }: Props) => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleCreateTechnician = async () => {
    try {
      const token = 'YOUR_ADMIN_AUTH_TOKEN'; // Replace with actual authentication token
      const response = await fetch('http://YOUR_SERVER_URL:5000/api/auth/admin/create-technician', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ name, email, password })
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.message);

      Alert.alert('Success', 'Technician created successfully');
      navigation.goBack();
    } catch (error) {
      if (error instanceof Error) {
        Alert.alert('Error', error.message);
      } else {
        Alert.alert('Error', 'An unknown error occurred');
      }
    }
  };

  return (
    <View>
      <Text>Create Technician</Text>
      <TextInput placeholder="Name" value={name} onChangeText={setName} />
      <TextInput placeholder="Email" value={email} onChangeText={setEmail} />
      <TextInput placeholder="Password" value={password} onChangeText={setPassword} secureTextEntry />
      <Button title="Create Technician" onPress={handleCreateTechnician} />
    </View>
  );
};

export default AdminCreateTechnician;
