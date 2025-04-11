import React, { useEffect, useState } from 'react';
import { View, Text, Button, Modal, TouchableOpacity, ScrollView, StyleSheet, SafeAreaView, Alert, Image } from 'react-native';
import io from 'socket.io-client';
import { Calendar } from 'react-native-calendars';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Location from 'expo-location';
import Constants from 'expo-constants';
import { technicianStyles as styles } from '../styles/technicianStyles';
import { Ionicons } from '@expo/vector-icons';
const moment = require('moment'); // Import moment.js for date formatting
import AppointmentCard from '../components/AppointmentCard';



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
            const response = await fetch('http://10.0.0.14:5000/api/technician//update-location', {
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


    useEffect(() => {
        const interval = setInterval(async () => {
            const inProgressAppointment = todaysAppointments.find(app => app.status === 'in-progress');
            if (inProgressAppointment) {
                let location = await Location.getCurrentPositionAsync({});
                updateLocationOnServer(location);
                sendLocationUpdate(location);
            }
            else {
                clearInterval(interval);
            }
        }, 10 * 60 * 1000); // every 10 minutes
        return () => clearInterval(interval);      
    }, [todaysAppointments]);


    // Send location update (and compute & emit the queue) if there’s an appointment today.
    const sendLocationUpdate = async (location: any) => {
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

        const currentLocation = { lat: location.coords.latitude, lng: location.coords.longitude };


        // Emit location update with additional queue info.
        const locationData = {
            userId: currentUserId,
            technicianId: currentTechnicianId, // assuming technician's id is currentUserId
            lat: currentLocation.lat,
            lng: currentLocation.lng,
            // queue: computedQueue,
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
        const sortedAppointments = dailyAppointments.sort(
            (a, b) =>  new Date(a.scheduledTime).getTime() - new Date(b.scheduledTime).getTime()
        );

        return sortedAppointments.map((appointment) => (
            <AppointmentCard key = {appointment._id} appointment={appointment} role='Technician' />
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