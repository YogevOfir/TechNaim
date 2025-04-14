import React, { useEffect, useState } from 'react';
import { View, Text, Button, Modal, TouchableOpacity, ScrollView, StyleSheet, SafeAreaView, Alert } from 'react-native';
import io from 'socket.io-client';
import { Calendar } from 'react-native-calendars';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Location from 'expo-location';
import Constants from 'expo-constants';
import { technicianStyles as styles } from '../styles/technicianStyles';
import { Ionicons } from '@expo/vector-icons';
import { Image } from 'react-native';
const moment = require('moment'); // Import moment.js for date formatting


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
    addressCoordinates: { lat: number; lng: number };
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

interface Customer {
  _id: string;
  name: string;
  address: string;
  phone: string;
  addressCoordinates?: { lat: number; lng: number };
}


interface RouteLeg {
  customer: Customer;
  distance: number; // Approximate distance in kilometers
}


const TechnicianScreen = () => {
  const [status, setStatus] = useState('Available');
  const [calendarVisible, setCalendarVisible] = useState(false);
  const [selectedDate, setSelectedDate] = useState('');
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [previousAppointments, setPreviousAppointments] = useState<Appointment[]>([]);
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
      
      setAppointments(data.appointments);
      
      setTodaysAppointments(data.todaysAppointments);
    } catch (error) {
      console.error('Error fetching appointments:', error);
    }
  };

  async function updateAppointmentsInServer(updatedAppointments: Appointment[]): Promise<void> {
    const token = await AsyncStorage.getItem('token');
    try {
      const response = await fetch('http://10.0.0.14:5000/api/appointments/updateSchedule', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ appointments: updatedAppointments }),
      });
      if (!response.ok) {
        throw new Error('Failed to update appointments schedule on server');
      }
      console.log('Appointments schedule updated successfully on the server.');
    } catch (error) {
      console.error('Error updating appointments schedule:', error);
    }
  }

  async function updateLocationOnServer() {
    let location = await Location.getCurrentPositionAsync({});
    const token = await AsyncStorage.getItem('token');
    try {
      const response = await fetch('http://10.0.0.14:5000/api/technician/update-location', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(location),
      });
      if (!response.ok) {
        throw new Error('Failed to update location on server');
      }
      console.log('Sent location update successfully to the server.');
    } catch (error) {
      console.error('Error sending location update:', error);
    }
  }
  

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

  useEffect(() => {
    // Only update periodically if there is an in-progress appointment.
    // You might check todaysAppointments or current appointment.
    const inProgressAppointment = appointments.find(app => app.status === 'in-progress');
    if (inProgressAppointment) {
      updateLocationOnServer();
      sendLocationUpdate();
    }
  }, [appointments, currentUserId, currentTechnicianId]);


 


  useEffect(() => {
    const newAppointment = appointments.filter(
      appointment => !previousAppointments?.some(
        prevAppointment => prevAppointment._id === appointment._id
      )
    )

    if (newAppointment.length === 0) return; // No new appointments
    
    const dateOfAppointment = new Date(newAppointment[0]?.scheduledTime);


    computeScheduledRoute(dateOfAppointment).then((updatedAppointment) => {

      setPreviousAppointments(updatedAppointment);
      setAppointments(updatedAppointment);
    });
    
  }, [appointments]);



  // --- Helper Functions for Geocoding & Directions ---

  // This function calculates the route and travel time for appointments on dateOfAppointments.
  // It uses Google Maps API to get coordinates from addresses and give the route based on greedy algorithm using lat & lng.
  // then it calculates the travel time for each appointment.

  async function computeScheduledRoute(dateOfAppointments: Date): Promise<Appointment[]> {
    // First compute the approximate route.
    const approxRoute = await computeApproxRoute(dateOfAppointments);

    if (!approxRoute) {
      console.error("No route computed.");
      return appointments;
    }

    if (approxRoute.length === 0) {
      return appointments;
    }
    
    // Retrieve starting coordinates from AsyncStorage.
    const storedCoordString = await AsyncStorage.getItem('addressCoordinates');
    let startCoordinates: { lat: number; lng: number } | undefined;
    if (storedCoordString) {
      try {
        startCoordinates = JSON.parse(storedCoordString);
      } catch (error) {
        console.error("Error parsing stored address coordinates:", error);
      }
    }
    // If not available, use the first route leg's customer coordinates.
    if (!startCoordinates) {
      startCoordinates = approxRoute[0].customer.addressCoordinates!;
    }
    
    // Set the technician's scheduled start time at 8:00 AM on the appointment date.
    const baseTime = new Date(dateOfAppointments);
    baseTime.setHours(8, 0, 0, 0);
    let currentTime = new Date(baseTime.getTime());
    let previousLocation = startCoordinates;
    const WORKING_TIME = 30; // minutes spent at each appointment
    
    // Build a mapping of appointmentId to computed scheduledTime.
    const scheduledTimes: { [appointmentId: string]: Date } = {};
    
    // For each leg in the route, compute travel time and update the scheduled time.
    for (const leg of approxRoute) {
      // Use getTravelTime to get refined travel duration (in minutes) between previous location and the customer's location.
      const travelTime = await getTravelTime(previousLocation, leg.customer.addressCoordinates!);
      // Add travel time to current time.
      currentTime = new Date(currentTime.getTime() + travelTime * 60000);
      // Set the scheduled arrival time for the customer.
      scheduledTimes[leg.customer._id] = new Date(currentTime.getTime());
      // Optionally add the working time after the appointment.
      currentTime = new Date(currentTime.getTime() + WORKING_TIME * 60000);
      // Update previous location.
      previousLocation = leg.customer.addressCoordinates!;
    }

    // Update the appointments with the new scheduled times.
    const updatedAppointments = appointments.map((appointment) => {
      if (scheduledTimes[appointment.customerId._id]) {
        return {
          ...appointment,
          scheduledTime: scheduledTimes[appointment.customerId._id].toISOString(),
        };
      }
      return appointment;
    });

    await updateAppointmentsInServer(updatedAppointments);

    return updatedAppointments;

  }
  



  async function computeApproxRoute(dateOfAppointments: Date) {
    // 1. Filter appointments for the given date and status "pending"
    const appointmentsForDate = appointments.filter(appointment => {
      const appDate = new Date(appointment.scheduledTime);
      console.log("Selected date: ", appDate.getFullYear(), " " ,appDate.getMonth(), " ", appDate.getDate());
      console.log("Date of appointments: ", dateOfAppointments.getFullYear(), " " ,dateOfAppointments.getMonth(), " ", dateOfAppointments.getDate());
      return appDate.getFullYear() === dateOfAppointments.getFullYear() &&
        appDate.getMonth() === dateOfAppointments.getMonth() &&
        appDate.getDate() === dateOfAppointments.getDate() &&
        appointment.status === 'pending';
    });

    if (appointmentsForDate.length === 0) {
      console.log("No appointments found for the selected date.");
      return [];
    }
    else{
      console.log("Amount of appointments found for the selected date: ", appointmentsForDate.length);
    }

    // 2. Convert appointments to Customer objects.
    const customers: Customer[] = await Promise.all(
      appointmentsForDate.map(async (app) => {
      let coords = app.customerId.addressCoordinates;
        return {
          _id: app.customerId._id,
          name: app.customerId.name,
          address: app.customerId.address,
          phone: app.customerId.phone,
          addressCoordinates: coords,
        };
      })
    );

    // 3. Filter out any customers without coordinates.
    const validCustomers = customers.filter((c) => c.addressCoordinates !== undefined);
    if (validCustomers.length === 0) {
      console.log("No valid customer coordinates available for the selected date.");
      return [];
    }

     // 4. Retrieve the starting coordinates from AsyncStorage.
    const storedCoordString = await AsyncStorage.getItem('addressCoordinates');
    let startCoordinates: { lat: number; lng: number } | undefined;
    if (storedCoordString) {
      try {
        startCoordinates = JSON.parse(storedCoordString);
      } catch (error) {
      console.error("Error parsing stored address coordinates:", error);
      }
    }

    if (!startCoordinates) {
      console.error("No starting coordinates available in AsyncStorage.");
      return;
    }

    // 5. Use a greedy nearest-neighbor algorithm to build the route.
    const route: RouteLeg[] = [];
    let currentPos = startCoordinates;
    const remaining = [...validCustomers];

    while (remaining.length > 0) {
      let bestCandidate: Customer | null = null;
      let bestDistance = Infinity;
      // find the nearest customer
      for (const customer of remaining) {
        const distance = haversineDistance(
          currentPos.lat,
          currentPos.lng,
          customer.addressCoordinates!.lat,
          customer.addressCoordinates!.lng
        );
        if (distance < bestDistance) {
          bestDistance = distance;
          bestCandidate = customer;
        }
      }

      if (bestCandidate) {
        route.push({
          customer: bestCandidate,
          distance: bestDistance,
        });
        currentPos = bestCandidate.addressCoordinates!;
        // Remove the selected customer from remaining customers
        const index = remaining.findIndex(c => c._id === bestCandidate._id);
        if (index !== -1) {
          remaining.splice(index, 1);
        }
      }
      else {
          break; 
      }
    }

    return route;
  }

   

  function haversineDistance(
    lat1: number, lng1: number, 
    lat2: number, lng2: number
  ): number {
    const toRad = (value: number) => (value * Math.PI) / 180;
    const R = 6371; // Earth's radius in kilometers
    const dLat = toRad(lat2 - lat1);
    const dLng = toRad(lng2 - lng1);
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(toRad(lat1)) *
        Math.cos(toRad(lat2)) *
        Math.sin(dLng / 2) *
        Math.sin(dLng / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }



  // Convert a customer address (string) to coordinates using Google Geocoding API.
  async function getCoordinatesFromAddress(address: string): Promise<{ lat: number; lng: number } | undefined> {
    // const address = '1600 Amphitheatre Parkway, Mountain View, CA' // Reverse the address for better geocoding results
    const config = Constants.expoConfig || Constants.manifest;
    const apiKey = config?.extra?.googleMapsApiKey;
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
    const config = Constants.expoConfig || Constants.manifest;
    const apiKey = config?.extra?.googleMapsApiKey;
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
        <Text>🙎‍♂️Name: {appointment.customerId.name}</Text>
        <Text>📞Phone Number: {appointment.customerId.phone}</Text>
        <Text>📍Address: {appointment.customerId.address}</Text>
        {appointment.notes && (
          <Text>📝Notes: {appointment.notes}</Text>
        )}
        <Text>🕒Scheduled Time: {new Date(appointment.scheduledTime).toLocaleString()}</Text>
      </View>
    ));
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollGeneralContainer}>
        <View style={{ marginBottom: 20 }} />   
        <Image
          source={require('../assets/logo.png')}
          style={styles.logo}
        />
        <Text style={styles.title}>Technician Dashboard</Text>
        <Text style={styles.status}>Status: {status}</Text>
    
        {/* <TouchableOpacity style={styles.button} onPress={sendLocationUpdate}>
          <Ionicons name="location-outline" size={20} color="#fff" style={styles.buttonIcon} />
          <Text style={styles.buttonText}>Update Location</Text>
        </TouchableOpacity> */}
    
        <TouchableOpacity style={styles.button} onPress={() => setCalendarVisible(true)}>
          <Ionicons name="calendar-outline" size={20} color="#fff" style={styles.buttonIcon} />
          <Text style={styles.buttonText}>Show Calendar</Text>
        </TouchableOpacity>
    
        <Text style={styles.sectionHeader}>Today's Appointments:</Text>
        {todaysAppointments.length > 0 ? (
          todaysAppointments.map((appointment) => (
            <View key={appointment._id} style={styles.appointmentCard}>
              <Text style={styles.companyTitle}>🙎‍♂️ {appointment.customerId.name}</Text>
              <Text style={styles.infoText}>📞 {appointment.customerId.phone}</Text>
              <Text style={styles.infoText}>📍 {appointment.customerId.address}</Text>
              {appointment.notes && (
                <Text style={styles.infoText}>📝 {appointment.notes}</Text>
              )}
              <Text style={styles.infoText}>
                🕒 {new Date(appointment.scheduledTime).toLocaleString()}
              </Text>
            </View>
          ))
        ) : (
          <Text style={styles.noAppointments}>No appointments for today.</Text>
        )}
    
        {queue.length > 0 && (
          <View style={styles.queueContainer}>
            <Text style={styles.sectionHeader}>Today's Queue</Text>
            {queue.map((item) => (
              <View key={item.appointment._id} style={styles.queueItem}>
                <Text style={styles.infoText}>
                  {item.queuePosition}. {item.appointment.customerId.name} – ETA: {item.estimatedArrival} min
                </Text>
              </View>
            ))}
          </View>
        )}
    
        {/* Modal is wrapped in the outer ScrollView, so its content is part of scrollable content */}
        <Modal
          visible={calendarVisible}
          animationType="slide"
          onRequestClose={closeCalendar}
        >
          <SafeAreaView style={styles.modalContainer}>
            <ScrollView contentContainerStyle={styles.modalScrollContent}>
              <Calendar
                onDayPress={handleDatePress}
                markedDates={getMarkedDates()}
                markingType="multi-dot"
              />
    
              {selectedDate && (
                <View style={styles.detailsContainer}>
                  <Text style={styles.sectionHeader}>Appointments on {selectedDate}:</Text>
                  {dailyAppointments.length > 0 ? (
                    renderDailyAppointments()
                  ) : (
                    <Text style={styles.noAppointments}>No appointments on this date.</Text>
                  )}
                </View>
              )}
    
              {/* Place the close button at the end so it scrolls along with the content */}
              <TouchableOpacity onPress={closeCalendar} style={styles.closeButton}>
                <Text style={styles.closeText}>Close Calendar</Text>
              </TouchableOpacity>
            </ScrollView>
          </SafeAreaView>
        </Modal>
      </ScrollView>
    </SafeAreaView>
  );
}

export default TechnicianScreen;
