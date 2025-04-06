import React, { useEffect, useState } from 'react';
import { ScrollView, View, Text, StyleSheet, Dimensions } from 'react-native';
import MapView, { Marker } from 'react-native-maps';
import io from 'socket.io-client';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface LocationData {
  lat: number;
  lng: number;
}

interface Appointment {
  _id: string;
  customerId: string;
  scheduledTime: string;
  status: string;
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

const CustomerScreen = ({ route }: { route: any }) => {
  const { user } = route.params;
  const [locationData, setLocationData] = useState<LocationData | null>(null);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [currentAppointment, setCurrentAppointment] = useState<Appointment | null>(null);
  const [estimatedArrival, setEstimatedArrival] = useState<number | null>(null);
  const [queuePosition, setQueuePosition] = useState<number | null>(null);

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
      const filteredAppointments = data.appointments.filter((a: Appointment) => a.status !== 'completed' && a.status !== 'cancelled' && new Date(a.scheduledTime).getTime() > Date.now());
      const sortedAppointments = filteredAppointments.sort((a: Appointment, b: Appointment) => 
        new Date(a.scheduledTime).getTime() - new Date(b.scheduledTime).getTime()
      );
      setAppointments(sortedAppointments);
    } catch (error) {
      console.error('Error fetching appointments:', error);
    }
  };

  // Determine current appointment (for example, the one with state "in-progress")
  useEffect(() => {
    if (appointments.length > 0) {
      const appointmentInProgress = appointments.find(appointment => appointment.status === 'in-progress' || appointment.status === 'pending');
      setCurrentAppointment(appointmentInProgress || null);
    }
  }, [appointments]);

  useEffect(() => {
    // Fetch appointments when the component mounts or when the user changes.
    if(currentAppointment) {
      socket.emit('joinRoom', currentAppointment._id);
      console.log('Joining room for appointment:', currentAppointment._id);
    }
  }, [currentAppointment]);

  // Listen for location updates from the technician.
  useEffect(() => {
    fetchAppointments();

    socket.on('locationUpdate', (data) => {
      console.log('Received location update:', data);
      // Process the queue if provided.
      if (data.queue && Array.isArray(data.queue) && currentAppointment) {
        // Find the queue entry for the current customer's appointment.
        const myQueueInfo = data.queue.find((item: any) => item.appointment._id === currentAppointment._id);
        if (myQueueInfo) {
          setEstimatedArrival(myQueueInfo.estimatedArrival);
          setQueuePosition(myQueueInfo.queuePosition);
        }
      }
      // Update technician location on map if the update is for this technician.
      if (currentAppointment && data.technicianId === currentAppointment.technicianId) {
        setLocationData({ lat: data.lat, lng: data.lng });
      }
    });

    return () => {
      socket.disconnect();
    };
  }, [currentAppointment]);

  return (
    <ScrollView contentContainerStyle={styles.container}>
      {/* Title */}
      <Text style={styles.greeting}>Hello {user.name}</Text>

      {/* Display appointments for today */}
      {currentAppointment ? (
        <>
          <Text style={styles.info}>
            Appointment with {currentAppointment.technicianId.userId.name} from {currentAppointment.technicianId.companyId.name}
          </Text>
          {locationData ? (
            <MapView
              style={styles.map}
              region={{
                latitude: locationData.lat,
                longitude: locationData.lng,
                latitudeDelta: 0.01,
                longitudeDelta: 0.01,
              }}
            >
              <Marker
                coordinate={{ latitude: locationData.lat, longitude: locationData.lng }}
                title={currentAppointment.technicianId.userId.name}
                description={currentAppointment.technicianId.companyId.name}
              />
            </MapView>
          ) : (
            <Text style={styles.loadingText}>Waiting for technician location...</Text>
          )}
          {/* Display queue information for the customer */}
          {queuePosition !== null && estimatedArrival !== null && (
            <Text style={styles.queueText}>
              Your position in queue: {queuePosition}. Estimated arrival time: {estimatedArrival} min.
            </Text>
          )}
        </>
      ) : (
        <Text style={styles.info}>No appointment for today after 8AM.</Text>
      )}

      <Text style={styles.header}>Appointments:</Text>
      {appointments.length > 0 ? (
        appointments.map((appointment) => (
          <View key={appointment._id} style={styles.appointmentCard}>
            <Text style={styles.companyTitle}>{appointment.technicianId.companyId.name}</Text>
            <Text>Technician Name: {appointment.technicianId.userId.name}</Text>
            <Text>Technician Phone: {appointment.technicianId.userId.phone}</Text>
            <Text>
              Scheduled Time: {new Date(appointment.scheduledTime).toLocaleString()}
            </Text>
          </View>
        ))
      ) : (
        <Text>No appointments available.</Text>
      )}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: { flexGrow: 1, justifyContent: 'center', alignItems: 'center', padding: 20 },
  greeting: { fontSize: 22, fontWeight: 'bold' },
  info: { marginVertical: 10, fontSize: 16 },
  header: { marginTop: 20, fontSize: 18, fontWeight: 'bold' },
  appointmentCard: {
    padding: 10,
    marginVertical: 5,
    backgroundColor: '#f0f0f0',
    borderRadius: 5,
    width: '100%',
  },
  companyTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 5,
    color: 'green',
    textDecorationLine: 'underline',
    textAlign: 'center',
  },
  map: {
    width: Dimensions.get('window').width - 40,
    height: 300,
    marginVertical: 10,
  },
  loadingText: { marginVertical: 10 },
  queueText: {
    marginVertical: 10,
    fontSize: 16,
    fontWeight: '600',
    color: 'purple',
  },
});

export default CustomerScreen;
