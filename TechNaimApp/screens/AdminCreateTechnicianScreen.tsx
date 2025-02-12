import React, { useState } from 'react';
import { adminCreateTechnicianStyles as styles } from '../styles/adminCreateTechnicianStyles';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Alert,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  SafeAreaView,
  ActivityIndicator,
} from 'react-native';
import { NavigationProp, RouteProp } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons } from '@expo/vector-icons';

interface Props {
  navigation: NavigationProp<any>;
  route: RouteProp<any>;
}

const AdminCreateTechnicianScreen = ({ navigation, route }: Props) => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [country_id, setCountryId] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleCreateTechnician = async () => {
    // Basic validation
    if (!name || !email || !country_id || !password) {
      Alert.alert('Validation Failed', 'Please fill in all fields.');
      return;
    }

    if (isNaN(Number(country_id))) {
      Alert.alert('Validation Failed', 'ID must be a number.');
      return;
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      Alert.alert('Validation Failed', 'Invalid email address.');
      return;
    }

    if (password.length < 6) {
      Alert.alert('Validation Failed', 'Password must be at least 6 characters long.');
      return;
    }

    setIsLoading(true);
    try {
      const token = await AsyncStorage.getItem('token');
      
      const response = await fetch('http://10.0.0.14:5000/api/auth/create-and-assign-technician', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json', 
          Authorization: `Bearer ${token}` 
        },
        body: JSON.stringify({ name, country_id, email, password })
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
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardAvoidingView}
      >
        <View style={styles.contentContainer}>
          <View style={styles.headerContainer}>
            <Text style={styles.title}>Create Technician</Text>
            <Text style={styles.subtitle}>Add a new team member</Text>
          </View>

          <View style={styles.inputContainer}>
            <View style={styles.inputWrapper}>
              <Ionicons name="person-outline" size={20} color="#666" style={styles.inputIcon} />
              <TextInput
                placeholder="Full Name"
                value={name}
                onChangeText={setName}
                style={styles.input}
                placeholderTextColor="#666"
              />
            </View>

            <View style={styles.inputWrapper}>
              <Ionicons name="mail-outline" size={20} color="#666" style={styles.inputIcon} />
              <TextInput
                placeholder="Email"
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                style={styles.input}
                placeholderTextColor="#666"
                autoCapitalize="none"
              />
            </View>

            <View style={styles.inputWrapper}>
              <Ionicons name="card-outline" size={20} color="#666" style={styles.inputIcon} />
              <TextInput
                placeholder="ID"
                value={country_id}
                onChangeText={setCountryId}
                keyboardType="numeric"
                style={styles.input}
                placeholderTextColor="#666"
              />
            </View>

            <View style={styles.inputWrapper}>
              <Ionicons name="lock-closed-outline" size={20} color="#666" style={styles.inputIcon} />
              <TextInput
                placeholder="Password"
                value={password}
                onChangeText={setPassword}
                secureTextEntry={!showPassword}
                style={styles.input}
                placeholderTextColor="#666"
              />
              <TouchableOpacity
                onPress={() => setShowPassword(!showPassword)}
                style={styles.eyeIcon}
              >
                <Ionicons
                  name={showPassword ? "eye-outline" : "eye-off-outline"}
                  size={20}
                  color="#666"
                />
              </TouchableOpacity>
            </View>
          </View>

          <TouchableOpacity
            style={styles.createButton}
            onPress={handleCreateTechnician}
            disabled={isLoading}
          >
            {isLoading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.createButtonText}>Create Technician</Text>
            )}
          </TouchableOpacity>

          <TouchableOpacity 
            style={styles.cancelButton}
            onPress={() => navigation.goBack()}
          >
            <Text style={styles.cancelButtonText}>Cancel</Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};


export default AdminCreateTechnicianScreen;