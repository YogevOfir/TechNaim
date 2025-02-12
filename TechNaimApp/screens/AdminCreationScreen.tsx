import React, { useState } from 'react';
import { adminCreationStyles as styles } from '../styles/adminCreationStyles';
import { View, Text, TextInput, TouchableOpacity, Alert } from 'react-native';
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

      if (!token) {
        Alert.alert('Error', 'Token not found');
        return;
      }

      const response = await fetch('http://10.0.0.14:5000/api/auth/create-admin', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ name, country_id, email, password, companyName, role: 'admin' }),
      });

      const data = await response.json();

      if (!response.ok) throw new Error(data.message);

      Alert.alert('Admin Created Successfully', `Admin ${name} added.`);
    } catch (error) {
      Alert.alert('Error', (error as Error).message);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.headerContainer}>
        <Text style={styles.title}>Create Admin</Text>
      </View>
      <View style={styles.contentContainer}>
        <View style={styles.inputContainer}>
          <View style={styles.inputWrapper}>
            <TextInput
              placeholder="Full Name"
              value={name}
              onChangeText={setName}
              style={styles.input}
            />
          </View>
          <View style={styles.inputWrapper}>
            <TextInput
              placeholder="Email"
              value={email}
              onChangeText={setEmail}
              style={styles.input}
            />
          </View>
          <View style={styles.inputWrapper}>
            <TextInput
              placeholder="ID"
              value={country_id}
              onChangeText={setCountryId}
              keyboardType="numeric"
              secureTextEntry
              style={styles.input}
            />
          </View>
          <View style={styles.inputWrapper}>
            <TextInput
              placeholder="Password"
              value={password}
              onChangeText={setPassword}
              secureTextEntry
              style={styles.input}
            />
          </View>
          <View style={styles.inputWrapper}>
            <TextInput
              placeholder="Company Name"
              value={companyName}
              onChangeText={setCompanyName}
              style={styles.input}
            />
          </View>
        </View>
        <View style={styles.buttonContainer}>
          <TouchableOpacity style={styles.createButton} onPress={handleCreateAdmin}>
            <Text style={styles.createButtonText}>Create Admin</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
};

export default AdminCreationScreen;
