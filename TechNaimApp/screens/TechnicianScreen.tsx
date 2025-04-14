import React, { useEffect, useState } from 'react';
import { View, Text, Button, Modal, TouchableOpacity, ScrollView, SafeAreaView, Alert, Image } from 'react-native';
import io from 'socket.io-client';
import { Calendar } from 'react-native-calendars';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Location from 'expo-location';
import { technicianStyles as styles } from '../styles/technicianStyles';
import { Ionicons } from '@expo/vector-icons';
import AppointmentCard from '../components/AppointmentCard';



const socket = io('http://10.0.0.14:5000');

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
        country_id: string;
    };
    notes: string;
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


    async function updateLocationOnServer(location: any) {
        const token = await AsyncStorage.getItem('token');
        try {
            console.log("Updating location for technician:", currentTechnicianId , "on location:", location);
            const response = await fetch('http://10.0.0.14:5000/api/technicians/update-location', {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify({
                    lat: location.lat,
                    lng: location.lng,
                    technicianId: currentTechnicianId, // Ensure that currentTechnicianId is set from AsyncStorage on login
                }),
            });
            if (!response.ok) {
                const text = await response.text();
                console.error('Response not ok, status:', response.status, 'body:', text);
                throw new Error('Failed to update location on serverrr');
            }
            console.log('Sent location update successfully to the server.');
        } catch (error) {
            console.error('Error sending locationnn update:', error);
        }
    }

    async function finishTask(appointmentId: string) {
        const token = await AsyncStorage.getItem('token');
        try {
            const response = await fetch('http://10.0.0.14:5000/api/appointments/finish-task/' + appointmentId, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`,
                },
            });
            if (!response.ok) {
                throw new Error('Failed to finish task');
            }
            console.log('Task finished successfully on the server.');

            fetchAppointments();
        }
        catch (error) {
            console.error('Error finishing task:', error);
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



    // -------------------- Helper Function --------------------
    useEffect(() => {
        if (todaysAppointments && todaysAppointments.length > 0) {
          console.log('todaysAppointments changed, triggering immediate schedule recalculation and location update.');
          (async () => {
            // Get current location if there is an in-progress appointment (after 8 AM)
            const inProgress = todaysAppointments.find(app => app.status === 'in-progress');
            if (!inProgress) return;
            if( currentTechnicianId) {
                socket.emit('joinRoom', { role: 'tech', technicianId: currentTechnicianId });
                console.log(`Technician joined room: ${currentTechnicianId}`);
            }
            let permission = await Location.requestForegroundPermissionsAsync();
            if (permission.status !== 'granted') {
              console.error("Location permission not granted on immediate update.");
              return;
            }
            const loc = await Location.getCurrentPositionAsync({});
            const currentLoc = { lat: loc.coords.latitude, lng: loc.coords.longitude };
            // Update location to server and emit
            await updateLocationOnServer(currentLoc);
            await sendLocationUpdate(currentLoc);
            
            // Trigger schedule recalculation for today using current location
            const token = await AsyncStorage.getItem('token');
            const appointmentDate = new Date().toISOString(); // today's appointments
            const requestBody = {
              technicianId: currentTechnicianId,
              appointmentDate,
              currentLocation: currentLoc,
            };
      
            console.log('Immediately calling schedule endpoint with:', requestBody);
            const response = await fetch('http://10.0.0.14:5000/api/schedule/calculateSchedule', {
              method: 'PUT',
              headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${token}`,
              },
              body: JSON.stringify(requestBody),
            });
            if (!response.ok) {
              console.error('Immediate schedule calculation failed.');
              return;
            }
            const result = await response.json();
            console.log("Immediate schedule recalculated:", result.computedSchedule);
          })();
        }
      }, [todaysAppointments, currentTechnicianId, currentUserId]);
      
  
      useEffect(() => {
        const intervalId = setInterval(async () => {
          console.log('Periodic update interval triggered');
          // Check if there is any in-progress appointment for today
          const inProgress = todaysAppointments.find(app => app.status === 'in-progress');
          if (!inProgress) {
            console.log("No in-progress appointment; skipping periodic update.");
            socket.emit('leaveRoom', { technicianId: currentTechnicianId });
            socket.disconnect(); // if you want to disconnect entirely
            return;
          }
          // Get current location
          let permission = await Location.requestForegroundPermissionsAsync();
          if (permission.status !== 'granted') {
            console.error("Location permission not granted on periodic update.");
            return;
          }
          const loc = await Location.getCurrentPositionAsync({});
          const currentLoc = { lat: loc.coords.latitude, lng: loc.coords.longitude };
      
          // Update location on server and notify via socket
          await updateLocationOnServer(currentLoc);
          await sendLocationUpdate(currentLoc);
      
          // Call backend schedule recalculation endpoint
          const token = await AsyncStorage.getItem('token');
          const appointmentDate = new Date().toISOString(); // Today's date
          const requestBody = {
            technicianId: currentTechnicianId,
            appointmentDate,
            currentLocation: currentLoc,
          };
      
          console.log('Periodic schedule endpoint call with:', requestBody);
          const response = await fetch('http://10.0.0.14:5000/api/schedule/calculateSchedule', {
            method: 'PUT',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify(requestBody),
          });
          if (!response.ok) {
            console.error('Periodic schedule calculation failed.');
            return;
          }
          const result = await response.json();
          console.log("Periodic schedule recalculated:", result.computedSchedule);
        }, 10 * 60 * 1000); // 10 minutes interval
      
        return () => clearInterval(intervalId);
      }, [todaysAppointments, currentTechnicianId, currentUserId]);
      



    // Send location update (and compute & emit the queue) if there’s an appointment today.
    async function sendLocationUpdate(location: { lat: number, lng: number }) {
        const locationData = {
          technicianId: currentTechnicianId,
          lat: location.lat,
          lng: location.lng,
        };
        socket.emit('locationUpdate', locationData);
        console.log('Location update emitted:', locationData);
    }


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
        const sortedAppointments = dailyAppointments.sort(
            (a, b) => new Date(a.scheduledTime).getTime() - new Date(b.scheduledTime).getTime()
        );

        return sortedAppointments.map((appointment) => (
            <AppointmentCard key={appointment._id} appointment={appointment} role='Technician' />
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

                <TouchableOpacity style={styles.button} onPress={() => setCalendarVisible(true)}>
                    <Ionicons name="calendar-outline" size={20} color="#fff" style={styles.buttonIcon} />
                    <Text style={styles.buttonText}>Show Calendar</Text>
                </TouchableOpacity>

                <Text style={styles.sectionHeader}>Today's Appointments:</Text>
                {todaysAppointments.length > 0 ? (
                    todaysAppointments.map((appointment) => (
                        <AppointmentCard key={appointment._id} appointment={appointment} onComplete={finishTask} role='Technician' />
                    ))
                ) : (
                    <Text style={styles.noAppointments}>No appointments for today.</Text>
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