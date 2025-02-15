import React, { useEffect, useState } from 'react';
import { ScrollView, View, Text, StyleSheet } from 'react-native';
import io from 'socket.io-client';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface LocationData {
  technicianId: string;
  lat: number;
  lng: number;
}

interface Appointment {
  _id: string;
  customerId: string;
  scheduledTime: Date;
  technicianId: {
    _id: string;
    userId: {
      name: string;
      phone: string;
    },
    companyId: {
      name: string;
    }
  }
}

const socket = io('http://10.0.0.14:5000/customer'); 


const CustomerScreen = ({route}: {route: any}) => {
  const { user } = route.params;
  const [locationData, setLocationData] = useState<LocationData | null>(null);
  const [appointments, setAppointments] = useState<Appointment[]>([]);

  const fetchAppointments = async () => {
    try {
      const token = await AsyncStorage.getItem('token');

      if(!token) {
        console.error('Token not found');
        return;
      }

      const response = await fetch(`http://10.0.0.14:5000/api/appointments/customer`, {
        method: 'GET',
        headers: { Authorization: `Bearer ${token}` },
      });

      const data = await response.json();

      const sortedAppointments = data.appointments.sort((a: Appointment, b: Appointment) => new Date(a.scheduledTime).getTime() - new Date(b.scheduledTime).getTime());

      setAppointments(sortedAppointments);
    } catch (error) {
      console.error('Error fetching appointments:', error);
    }
  };

  useEffect(() => {
    fetchAppointments();

    socket.on('locationUpdate', (data) => {
      console.log('Received location update:', data);
      setLocationData(data);
    });

    return () => { socket.disconnect(); };
  }, [user._id, user.token]);

  return (
    <ScrollView contentContainerStyle={{ flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 }}>
      <Text>Hello {user.name}</Text>
      {locationData && (
        <Text>
          Technician {locationData.technicianId} is at ({locationData.lat}, {locationData.lng})
        </Text>
      )}

      <Text style={{ marginTop: 20, fontSize: 18, fontWeight: 'bold' }}>Appointments:</Text>
      {appointments.length > 0 ? (
        appointments.map((appointment) => (
          <View key={appointment._id} style={styles.appointmentCard}>
            <Text style={styles.companyTitle}>{appointment.technicianId.companyId.name}</Text>
            <Text>Technician Name: {appointment.technicianId.userId.name}</Text>
            <Text>Technician Phone: {appointment.technicianId.userId.phone}</Text>
            <Text>Scheduled Time: {new Date(appointment.scheduledTime).toLocaleString()}</Text>
          </View>
        ))
      ) : (
        <Text>No appointments available.</Text>
      )}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  appointmentCard: {
    padding: 10,
    marginVertical: 5,
    backgroundColor: '#f0f0f0',
    borderRadius: 5
  },
  companyTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 5,
    color: 'green',
    textDecorationLine: 'underline',
    textAlign: 'center'
  }
});

export default CustomerScreen;
