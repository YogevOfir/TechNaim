import React, { useEffect, useState, useRef } from 'react';
import { ScrollView, View, Text, StyleSheet, Dimensions, FlatList, TouchableOpacity } from 'react-native';
import MapView, { Marker, Region } from 'react-native-maps';
import { NavigationProp, useNavigation } from '@react-navigation/native';
import io from 'socket.io-client';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Image } from 'react-native';
import { customerStyles as styles } from '../styles/customerStyles';
import AppointmentCard from '../components/AppointmentCard';
import { useAuth } from '../context/AuthContext';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';

interface LocationData {
  lat: number;
  lng: number;
}

interface LocationMapping {
  [technicianId: string]: LocationData;
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

const socket = io('http://10.0.0.14:5000');
const CustomerScreen = ({ route }: { route: any }) => {
  const navigation = useNavigation<NavigationProp<any>>();
  const { user } = route.params;
  // change to array in the future
  const [locationData, setLocationData] = useState<LocationMapping>({});
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [inProgressAppointments, setInProgressAppointments] = useState<Appointment[]>([]);
  const [estimatedArrival, setEstimatedArrival] = useState<number | null>(null);
  const [queuePosition, setQueuePosition] = useState<number | null>(null);
  const joinedRoomsRef = useRef<string[]>([]);
  const mapRef = useRef<MapView>(null);
  const { logout } = useAuth();

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

  
  const handleLogout = async () => {
    // You can perform additional cleanup or navigation if necessary.
    await logout();  
    // Optionally navigate to the Login screen:
    navigation.navigate('Login');
  };


  // Determine current appointment (for example, the one with state "in-progress")
  useEffect(() => {
    if (appointments.length > 0) {
      const inProgress = appointments.filter(appointment => appointment.status === 'in-progress');
      setInProgressAppointments(inProgress);
    }
    else {
      setInProgressAppointments([]);
    }
  }, [appointments]);


  // Listen for location updates from the technician.
  useEffect(() => {
    fetchAppointments();
  }, []);


  // Handle joining and leaving rooms based on inProgressAppointments changes
  useEffect(() => {
    // List of technician IDs needed from inProgressAppointments:
    const newRooms = inProgressAppointments.map(app => app.technicianId._id);

    // Join any new room that hasn't been joined already
    newRooms.forEach((room) => {
      if (!joinedRoomsRef.current.includes(room)) {
        socket.emit('joinRoom', { role: 'customer', technicianId: room });
        console.log(`Customer joined room: ${room}`);
        joinedRoomsRef.current.push(room);
      }
    });

    // Check for rooms that are in joinedRoomsRef but not in newRooms
    joinedRoomsRef.current.forEach((room) => {
      if (!newRooms.includes(room)) {
        socket.emit('leaveRoom', { technicianId: room });
        console.log(`Customer left room: ${room}`);
        // Remove that room from our list of joined rooms
        joinedRoomsRef.current = joinedRoomsRef.current.filter(r => r !== room);
      }
    });

    // If no in-progress appointments exist, disconnect completely
    if (newRooms.length === 0) {
      console.log('No active in-progress appointments; disconnecting socket.');
      // Optional: If you plan to reconnect later, you may wish to disconnect only the rooms.
      // socket.disconnect();
      joinedRoomsRef.current = [];
    }

  }, [inProgressAppointments]);


  // Listen for location updates from the technician(s).
  useEffect(() => {
    socket.on('locationUpdate', (data) => {
      console.log('Received location update:', data);
      
      // If location update includes a queue, process it (adapt as needed)
      if (data.queue && Array.isArray(data.queue) && inProgressAppointments.length) {
        const myQueueInfo = data.queue.find((item: any) => 
          inProgressAppointments.some(app => app._id === item.appointment._id)
        );
        if (myQueueInfo) {
          setEstimatedArrival(myQueueInfo.estimatedArrival);
          setQueuePosition(myQueueInfo.queuePosition);
        }
      }
      
      // Update the location only if the update is from a technician with an active appointment.
      if (data.technicianId && inProgressAppointments.some(app => app.technicianId._id === data.technicianId)) {
        setLocationData(prev => ({
          ...prev,
          [data.technicianId]: { lat: data.lat, lng: data.lng }
        }));
      }
    });

    return () => {
      socket.off('locationUpdate');
    };
  }, [inProgressAppointments]);

   // Handler for tech tab press: move the map view to the technician's location
  const handleTechTabPress = (techId: string) => {
    const loc = locationData[techId];
    if (loc && mapRef.current) {
      const region: Region = {
        latitude: loc.lat,
        longitude: loc.lng,
        latitudeDelta: 0.005,
        longitudeDelta: 0.005,
      };
      // Animate the map to the selected region
      mapRef.current.animateToRegion(region, 1000);  // 1 second animation
    }
  };

  const uniqueTechnicians = Array.from(new Set(inProgressAppointments.map(app => app.technicianId._id)))
    .map(techId => {
      return inProgressAppointments.find(app => app.technicianId._id === techId)?.technicianId;
    })
    .filter(Boolean);


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
      
      <Text style={styles.greeting}>Hello {user.name}</Text>

      {/* Only show map if there are technician locations available */}
      {uniqueTechnicians.length && Object.keys(locationData).length ? (
        <>
          <Text style={styles.info}>
            {inProgressAppointments.map(app =>
              `Appointment with ${app.technicianId.userId.name} from ${app.technicianId.companyId.name}`
            ).join(' | ')}
          </Text>
          
          <MapView
            ref={mapRef}
            style={styles.map}
            // Center on the first technician's location if available
            initialRegion={{
              latitude: locationData[inProgressAppointments[0].technicianId._id]?.lat || 0,
              longitude: locationData[inProgressAppointments[0].technicianId._id]?.lng || 0,
              latitudeDelta: 0.005,
              longitudeDelta: 0.005,
            }}
          >
            {Object.entries(locationData).map(([techId, loc]) => {
              const techAppointment = inProgressAppointments.find(app => app.technicianId._id === techId);
              if (!techAppointment) return null;

              return (
                <Marker
                  key={techId}
                  coordinate={{ latitude: loc.lat, longitude: loc.lng }}
                  title={techAppointment.technicianId.userId.name}
                  description={techAppointment.technicianId.companyId.name}
                />
              );
            })}
          </MapView>

          {/* Horizontal scroll of technician tabs */}
          <FlatList
            data={uniqueTechnicians}
            horizontal
            keyExtractor={(item) => item?._id ?? 'unknown'}
            renderItem={({ item }) => (
              <TouchableOpacity
                style={styles.techTab}
                onPress={() => handleTechTabPress(item?._id ?? 'unknown')}
              >
                <Text style={styles.techTabText}>{item?.userId?.name}</Text>
                <Text style={styles.techTabSubText}>{item?.companyId?.name}</Text>
              </TouchableOpacity>
            )}
            contentContainerStyle={styles.techTabsContainer}
            showsHorizontalScrollIndicator={false}
          />

          {queuePosition !== null && estimatedArrival !== null && (
            <Text style={styles.queueText}>
              Your position in queue: {queuePosition}. Estimated arrival time: {estimatedArrival} min.
            </Text>
          )}
        </>
      ) : (
        <Text style={styles.info}>No active technician location available.</Text>
      )}

      <Text style={styles.header}>Appointments:</Text>
      {appointments.length > 0 ? (
        appointments.map((appointment) => (
          <AppointmentCard key={appointment._id} appointment={appointment} role="Customer" />
        ))
      ) : (
        <Text>No appointments available.</Text>
      )}
      </ScrollView>
    </SafeAreaView>
  );
};


export default CustomerScreen;
