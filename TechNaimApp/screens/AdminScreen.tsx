import React, { useState, useEffect } from 'react';
import { View, Text, Button, Image, ScrollView, TouchableOpacity } from 'react-native';
import { StackNavigationProp } from '@react-navigation/stack';
import { RootStackParamList } from '../types/navigationTypes';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { adminStyles as styles } from '../styles/adminStyles';
import SearchBar from '../components/SearchBar';
import { useAuth } from '../context/AuthContext';
import { NavigationProp, useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';

// Define the navigation type for this screen
type AdminScreenNavigationProp = StackNavigationProp<RootStackParamList, 'Admin'>;

interface AdminScreenProps {
  route: { params: { user: any } };
}

interface Appointment {
  _id: string;
  customerId: {
    _id: string;
    name: string;
    phone: string;
    address: string;
    country_id: string;
  };
  scheduledTime: string;
  status: string;
  technicianId: {
    _id: string;
    userId: {
      name: string;
      phone: string;
      country_id: string;
    },
    companyId: {
      name: string;
    }
  };
  notes?: string;
}

const AdminScreen = ({ route }: AdminScreenProps) => {
  const navigation = useNavigation<AdminScreenNavigationProp>();
  const { user } = route.params;
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const { logout } = useAuth();


  const fetchAppointments = async () => {
    try {
      const token = await AsyncStorage.getItem('token');
      if (!token) {
        console.error('Token not found');
        return;
      }
      const response = await fetch(`http://10.0.0.14:5000/api/appointments/admin`, {
        method: 'GET',
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await response.json();
      setAppointments(data.appointments);
    } catch (error) {
      console.error('Error fetching appointments:', error);
    }
  }

  useEffect(() => {
    fetchAppointments();
  }, []);

  const handleLogout = async () => {
    // You can perform additional cleanup or navigation if necessary.
    await logout();
    // Optionally navigate to the Login screen:
    navigation.navigate('Login');
  };




  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollGeneralContainer}>
        <View style={styles.headerContainer}>
          <TouchableOpacity onPress={handleLogout} style={styles.logoutButton}>
            <Ionicons name="log-out-outline" size={24} color="#fff" />
            <Text style={styles.logoutButtonText}>Logout</Text>
          </TouchableOpacity>
        </View>
        <Image
          source={require('../assets/logo.png')}
          style={styles.logo}
        />

        <Text style={styles.welcome}>
          Welcome {user.name}
        </Text>

        {/* Action Buttons */}
        <View style={{ marginBottom: 15 }}>
          <Button
            title="Create New Technician"
            onPress={() => navigation.navigate('AdminCreateTechnician', { user })}
          />
        </View>

        <View style={{ marginBottom: 25 }}>
          <Button
            title="Create new Appointment"
            onPress={() => navigation.navigate('CreateAppointment', { user })}
          />
        </View>

        {/* SearchBar (manages internal FlatLists safely) */}
        <SearchBar appointments={appointments} />
      </ScrollView>
    </SafeAreaView>
  );

};

export default AdminScreen;
