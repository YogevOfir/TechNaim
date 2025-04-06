import React, { useEffect, useState } from 'react';
import { View, Text, Button, Modal, TouchableOpacity, ScrollView, StyleSheet, SafeAreaView, Alert } from 'react-native';
import io from 'socket.io-client';
import { Calendar } from 'react-native-calendars';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Location from 'expo-location';
import Constants from '../expo-constants/constants';


const socket = io('http://10.0.0.14:5000/technician');

const WORKING_TIME = 30; // working time (in minutes) between appointments

// Update Appointment interface to include state (e.g. "in-progress", "finished")
interface Appointment {
  _id: string;
  scheduledTime: string;
  status: string;
  customerId: {
    _id: string;
    name: string;
    address: string;
    phone: string;
  };
  notes: string;
}

// Define a type for items in the queue
interface QueueItem {
  appointment: Appointment & { customerCoords?: { lat: number, lng: number } };
  travelTime: number; // travel time from previous point (in minutes)
  estimatedArrival: number; // cumulative minutes from now until arrival at this customer
  queuePosition: number;
}

const TechnicianScreen = () => {
  const [status, setStatus] = useState('Available');
  const [calendarVisible, setCalendarVisible] = useState(false);
  const [selectedDate, setSelectedDate] = useState('');
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [todaysAppointments, setTodaysAppointments] = useState<Appointment[]>([]);
  const [dailyAppointments, setDailyAppointments] = useState<Appointment[]>([]);
  const [currentUserId, setCurrentUserId] = useState<string>('');
  const [currentTechnicianId, setCurrentTechnicianId] = useState<string>('');
  const [queue, setQueue] = useState<QueueItem[]>([]);

  const fetchAppointments = async () => {
    try {
      const token = await AsyncStorage.getItem('token');
      if (!token) {
        console.error('Token not found');
        return;
      }
      const response = await fetch('http://10.0.0.14:5000/api/appointments/technician', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json', 
          Authorization: `Bearer ${token}`,
        },
      });
      const data = await response.json();
      console.log('Fetched Appointments:', data.appointments);
      setAppointments(data.appointments);
      // Filter appointments for today and not finished
      const now = new Date();
      const todaysAppointments = data.appointments.filter((app: Appointment) => {
        const appDate = new Date(app.scheduledTime);
        return appDate.toDateString() === now.toDateString() && app.status === 'in-progress';
      });
      setTodaysAppointments(todaysAppointments);
    } catch (error) {
      console.error('Error fetching appointments:', error);
    }
  };

  // Retrieve current user ID from AsyncStorage (assumes it's stored under 'userId')
  useEffect(() => {
    AsyncStorage.getItem('userId').then((id) => {
      if (id) setCurrentUserId(id);
    });
  }, []);

  useEffect(() => {
    AsyncStorage.getItem('technicianId').then((id) => {
      if (id) setCurrentTechnicianId(id);
    });
  }, []);


  // Fetch appointments when the component mounts
  useEffect(() => {
    fetchAppointments();
  }, []);

  // --- Helper Functions for Geocoding & Directions ---

  // Convert a customer address (string) to coordinates using Google Geocoding API.
  async function getCoordinatesFromAddress(address: string): Promise<{ lat: number; lng: number } | undefined> {
    // const address = '1600 Amphitheatre Parkway, Mountain View, CA' // Reverse the address for better geocoding results
    const apiKey = Constants.expoConfig?.extra?.googleMapsApiKey;
    console.log('Google Maps API Key: ', apiKey);
    const url = `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(address)}&key=${apiKey}`;
    try {
      const response = await fetch(url);
      const data = await response.json();
      if (data.results && data.results.length > 0) {
        const location = data.results[0].geometry.location;
        console.log('Customer coordinates: ', location);
        return { lat: location.lat, lng: location.lng };
      }
    } catch (e) {
      console.error("Geocoding error:", e);
    }
    return undefined;
  }

  // Get travel time in minutes between two coordinates using Google Directions API.
  async function getTravelTime(
    origin: { lat: number; lng: number },
    destination: { lat: number; lng: number }
  ): Promise<number> {
    const apiKey = Constants.expoConfig?.extra?.googleMapsApiKey;
    const originStr = `${origin.lat},${origin.lng}`;
    console.log('Origin: ', originStr);
    const destinationStr = `${destination.lat},${destination.lng}`;
    console.log('Destination: ', destinationStr);
    const url = `https://maps.googleapis.com/maps/api/directions/json?origin=${originStr}&destination=${destinationStr}&key=${apiKey}`;
    try {
      const response = await fetch(url);
      const data = await response.json();
      if (data.routes && data.routes.length > 0) {
        // Using the first route’s first leg.
        const leg = data.routes[0].legs[0];
        const durationInMinutes = Math.ceil(leg.duration.value / 60);
        return durationInMinutes;
      }
    } catch (e) {
      console.error("Directions API error:", e);
    }
    return Infinity;
  }

  // Compute today’s queue: filter appointments that are today and not finished, get each customer's coordinates,
  // sort them by travel time from current location, and calculate sequential estimated arrival times.
  async function computeQueue(currentLocation: { lat: number; lng: number }): Promise<QueueItem[]> {
    const now = new Date();
    // Filter appointments scheduled for today and not finished.
    const todaysAppointments = appointments.filter(app => {
      const appDate = new Date(app.scheduledTime);
      return appDate.toDateString() === now.toDateString() && app.status === 'in-progress';
    });

    // Get customer coordinates for each appointment.
    const appointmentsWithCoords = await Promise.all(
      todaysAppointments.map(async (app) => {
        console.log('Appointment address: ', app.customerId.address);
        const customerCoords = (await getCoordinatesFromAddress(app.customerId.address)) ?? undefined;
        console.log('Customer coordinates: ', customerCoords);
        return { ...app, customerCoords };
      })
    );
    
    console.log('Appointments with coordinates: ', appointmentsWithCoords);

    // Sort appointments by travel time from the technician’s current location.
    const appointmentsSorted = await Promise.all(
      appointmentsWithCoords.map(async (app) => {
        if (app.customerCoords) {
          const travelTime = await getTravelTime(currentLocation, app.customerCoords);
          return { ...app, initialTravelTime: travelTime };
        }
        return { ...app, initialTravelTime: Infinity };
      })
    );
    appointmentsSorted.sort((a, b) => a.initialTravelTime - b.initialTravelTime);

    // Now compute sequential estimated arrival times.
    const queueItems: QueueItem[] = [];
    let previousLocation = currentLocation;
    let cumulativeTime = 0;
    for (let i = 0; i < appointmentsSorted.length; i++) {
      const app = appointmentsSorted[i];
      let travelTime = 0;
      if (app.customerCoords) {
        travelTime = await getTravelTime(previousLocation, app.customerCoords);
      } else {
        travelTime = Infinity;
      }
      cumulativeTime += travelTime;
      // For appointments after the first, add a fixed working time.
      const estimatedArrival = cumulativeTime;
      queueItems.push({
        appointment: app,
        travelTime,
        estimatedArrival,
        queuePosition: i + 1,
      });
      // Add working time for next leg unless this is the last appointment.
      if (i < appointmentsSorted.length - 1) {
        cumulativeTime += WORKING_TIME;
      }
      // Update previous location if available.
      if (app.customerCoords) {
        previousLocation = app.customerCoords;
      }
    }
    return queueItems;
  }

  // --- End of helper functions ---

  // Send location update (and compute & emit the queue) if there’s an appointment today.
  const sendLocationUpdate = async () => {
    const now = new Date();
    
    if (!todaysAppointments) {
      Alert.alert('Location Update', 'No appointment scheduled for today. Not sending location update.');
      console.log('No appointment scheduled for today. Not sending location update.');
      return;
    }
    
    // Request permission and get current location.
    let { status } = await Location.requestForegroundPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission Denied', 'Location permission not granted.');
      return;
    }
    // if its not the working hours, do not send location update
    // const nowHour = new Date().getHours();
    // if (nowHour < 8 || nowHour > 17) {
    //   Alert.alert('Location Update', 'Location updates are only sent after 8AM.');
    //   console.log('It is before 8AM. No location update will be sent.');
    //   return;
    // }

    let location = await Location.getCurrentPositionAsync({});
    const currentLocation = { lat: location.coords.latitude, lng: location.coords.longitude };

    // Compute the queue for today.
    const computedQueue = await computeQueue(currentLocation);
    setQueue(computedQueue);

    // Emit location update with additional queue info.
    const locationData = {
      userId: currentUserId,
      technicianId: currentTechnicianId, // assuming technician's id is currentUserId
      lat: currentLocation.lat,
      lng: currentLocation.lng,
      queue: computedQueue,
    };
    socket.emit('locationUpdate', locationData);
    console.log('Location update sent:', locationData);
  };

  const handleDatePress = (day: any) => {
    setSelectedDate(day.dateString);
    const filteredAppointments = appointments.filter(
      appointment =>
        new Date(appointment.scheduledTime).toDateString() === new Date(day.dateString).toDateString()
    );
    setDailyAppointments(filteredAppointments);
  };

  const closeCalendar = () => {
    setCalendarVisible(false);
    setSelectedDate('');
    setDailyAppointments([]);
  };

  const getMarkedDates = () => {
    const markedDates: { [key: string]: { dots: { color: string, key: string }[] } } = {};
    appointments.forEach(appointment => {
      const date = new Date(appointment.scheduledTime).toISOString().split('T')[0];
      if (markedDates[date]) {
        markedDates[date].dots.push({ color: 'blue', key: appointment._id });
      } else {
        markedDates[date] = { dots: [{ color: 'blue', key: appointment._id }] };
      }
    });
    return markedDates;
  };

  const renderDailyAppointments = () => {
    return dailyAppointments.map((appointment) => (
      <View key={appointment._id} style={styles.appointmentCard}>
        <Text>Name: {appointment.customerId.name}</Text>
        <Text>Phone Number: {appointment.customerId.phone}</Text>
        <Text>Address: {appointment.customerId.address}</Text>
        <Text>Notes: {appointment.notes}</Text>
        <Text>Scheduled Time: {new Date(appointment.scheduledTime).toLocaleString()}</Text>
      </View>
    ));
  };

  return (
    <SafeAreaView style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
      <Text>Technician Dashboard</Text>
      <Text>Status: {status}</Text>
      <Button title="Update Location" onPress={sendLocationUpdate} />
      <Button title="Show Calendar" onPress={() => setCalendarVisible(true)} />
      {/* Display today's appointments */}
      <Text style={{ fontSize: 18, fontWeight: 'bold', marginTop: 20 }}>Today's Appointments:</Text>
      {todaysAppointments.length > 0 ? (
        todaysAppointments.map((appointment) => (
          <View key={appointment._id} style={styles.appointmentCard}>
            <Text style={styles.companyTitle}>{appointment.customerId.name}</Text>
            <Text>Phone: {appointment.customerId.phone}</Text>
            <Text>Address: {appointment.customerId.address}</Text>
            <Text>Notes: {appointment.notes}</Text>
            <Text>Scheduled Time: {new Date(appointment.scheduledTime).toLocaleString()}</Text>
          </View>
        ))
      ) : (
        <Text>No appointments for today.</Text>
      )}

      {/* Display today's queue */}
      {queue.length > 0 && (
        <View style={styles.queueContainer}>
          <Text style={styles.queueHeader}>Today's Queue</Text>
          {queue.map((item) => (
            <View key={item.appointment._id} style={styles.queueItem}>
              <Text>
                {item.queuePosition}. {item.appointment.customerId.name} – ETA: {item.estimatedArrival} min
              </Text>
            </View>
          ))}
        </View>
      )}

      <Modal
        visible={calendarVisible}
        animationType="slide"
        onRequestClose={closeCalendar}
      >
        <SafeAreaView style={{ flex: 1, marginTop: 50 }}>
          <Calendar
            onDayPress={handleDatePress}
            markedDates={getMarkedDates()}
            markingType={'multi-dot'}
          />

          {selectedDate && (
            <View style={styles.detailsContainer}>
              <Text style={{ fontSize: 18, fontWeight: 'bold' }}>
                Appointments on {selectedDate}:
              </Text>
              <ScrollView style={{ marginVertical: 10 }}>
                {dailyAppointments.length > 0 ? (
                  renderDailyAppointments()
                ) : (
                  <Text>No appointments on this date.</Text>
                )}
              </ScrollView>
            </View>
          )}

          <TouchableOpacity onPress={closeCalendar} style={styles.closeButton}>
            <Text style={{ color: 'blue' }}>Close Calendar</Text>
          </TouchableOpacity>
        </SafeAreaView>
      </Modal>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  detailsContainer: {
    marginTop: 20,
  },
  closeButton: {
    marginTop: 20,
    alignSelf: 'center',
  },
  appointmentCard: {
    padding: 10,
    marginVertical: 5,
    backgroundColor: '#f0f0f0',
    borderRadius: 5,
  },
  companyTitle: {
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 5,
    color: 'green',
    textDecorationLine: 'underline',
    textAlign: 'center',
  },
  queueContainer: {
    marginTop: 20,
    width: '90%',
    backgroundColor: '#e0e0e0',
    padding: 10,
    borderRadius: 5,
  },
  queueHeader: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  queueItem: {
    paddingVertical: 5,
  },
});

export default TechnicianScreen;
