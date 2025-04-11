import React, { useState, useEffect } from 'react';
import { View, Text, Button, Image, ScrollView } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { RootStackParamList } from '../types/navigationTypes';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { adminStyles as styles } from '../styles/adminStyles';
import SearchBar from '../components/SearchBar';

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

  


  return (
    <ScrollView style={{ flex: 1, padding: 20 }}>
      {/* Header */}
      <View style={styles.headerContainer}>
        <Image
          source={require('../assets/logo.png')}
          style={styles.logo}
        />
      </View>

      <Text style={{ fontSize: 18, fontWeight: '600', marginBottom: 20 }}>
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
  );

};

export default AdminScreen;
