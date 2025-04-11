import React, { useEffect, useState, useRef } from 'react';
import { ScrollView, View, Text, StyleSheet, Dimensions } from 'react-native';
import MapView, { Marker } from 'react-native-maps';
import io from 'socket.io-client';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons } from '@expo/vector-icons';
import { Image } from 'react-native';
import { customerStyles as styles } from '../styles/customerStyles';
import AppointmentCard from '../components/AppointmentCard';

interface LocationData {
  lat: number;
  lng: number;
}

interface Appointment {
  _id: string;
  customerId: {
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

  const roomJoined = useRef<string | null>(null);
  const joinCountRef = useRef<number>(0);

  const fetchAppointments = async () => {
    try {
      const token = await AsyncStorage.getItem('token');
      if (!token) {
        console.error('Token not found');
        return;
      }
      const response = await fetch(`http://10.0.0.14:5000/api/appointments/customer`, {
        method: 'GET',
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await response.json();
      setAppointments(data.appointments);
    } catch (error) {
      console.error('Error fetching appointments:', error);
    }
  };

  // Determine current appointment (for example, the one with state "in-progress")
  useEffect(() => {
    if (appointments.length > 0) {
      const appointmentInProgress = appointments.find(appointment => appointment.status === 'in-progress');
      setCurrentAppointment(appointmentInProgress || null);
    }
  }, [appointments]);

  useEffect(() => {
    // Fetch appointments when the component mounts or when the user changes.
    if (currentAppointment && currentAppointment._id !== roomJoined.current) {
      joinCountRef.current++;
      console.log('Joining room for appointment:', currentAppointment._id);
      console.log('Join count:', joinCountRef.current);
      socket.emit('JoinRoom', currentAppointment._id);  // Match event name exactly with server.
      roomJoined.current = currentAppointment._id;
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
      console.log('trying to update location data');
      console.log('data.technicianId:', data.technicianId);
      console.log('currentAppointment.technicianId:', currentAppointment?.technicianId._id);
      if (currentAppointment && data.technicianId === currentAppointment.technicianId._id) {
        console.log('Updating location data:', data.lat, data.lng);
        setLocationData({ lat: data.lat, lng: data.lng });
      }
    });

    return () => {
      socket.disconnect();
    };
  }, []);

  return (
    <ScrollView contentContainerStyle={styles.container}>
      {/* Title */}
      {/* <Text style={styles.greeting}>Hello {user.name}</Text> */}
      <Image
        source={require('../assets/logo.png')}
        style={styles.logo}
      />
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
          <AppointmentCard key={appointment._id} appointment={appointment} role='Customer' />
        ))
      ) : (
        <Text>No appointments available.</Text>
      )}
    </ScrollView>
  );
};


export default CustomerScreen;
