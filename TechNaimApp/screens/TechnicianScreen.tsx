import React, { useEffect, useState } from 'react';
import { View, Text, Button, Modal, TouchableOpacity, ScrollView, StyleSheet, SafeAreaView } from 'react-native';
import io from 'socket.io-client';
import { Calendar } from 'react-native-calendars';
import AsyncStorage from '@react-native-async-storage/async-storage';

const socket = io('http://10.0.0.14:5000/technician');

interface Appointment {
  _id: string;
  scheduledTime: Date;
  customerId: {
    _id: string;
    name: string;
    address: string;
    phone: string;
  }
  notes: string;
}

const TechnicianScreen = () => {
  const [status, setStatus] = useState('Available');
  const [calendarVisible, setCalendarVisible] = useState(false);
  const [selectedDate, setSelectedDate] = useState('');
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [dailyAppointments, setDailyAppointments] = useState<Appointment[]>([]);

  const fetchAppointments = async () => {
    try {
      const token = await AsyncStorage.getItem('token');

      if(!token) {
        console.error('Token not found');
        return;
      }

      const response = await fetch('http://10.0.0.14:5000/api/appointments/technician', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json', 
           Authorization: `Bearer ${token}` },
      });

      const data = await response.json();
      console.log('Fetched Appointments:', data.appointments);
      setAppointments(data.appointments);
    } catch (error) {
      console.error('Error fetching appointments:', error);
    }
  };

  useEffect(() => {
    fetchAppointments();

    socket.on('locationUpdate', (data) => {
      console.log('Received location update:', data);
    });

    return () => { socket.disconnect(); };
  }, []);

  const sendLocationUpdate = () => {
    const locationData = {
      technicianId: 'tech123',
      lat: Math.random() * 90,
      lng: Math.random() * 180,
    };
    socket.emit('locationUpdate', locationData);
  };

  const handleDatePress = (day: any) => {
    setSelectedDate(day.dateString);
    const filteredAppointments = appointments.filter(
      appointment => new Date(appointment.scheduledTime).toDateString() === new Date(day.dateString).toDateString()
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
        markedDates[date].dots.push({ color: 'blue', key: 'appointment' });
      } else {
        markedDates[date] = { dots: [{ color: 'blue', key: 'appointment' }] };
      }
    });
    return markedDates;
  };

  const renderDailyAppointments = () => {
    return (
      dailyAppointments.map((appointment) => (
        <View key={appointment._id} style={styles.appointmentCard}>
          <Text>Name {appointment.customerId.name}</Text>
          <Text>Phone Number: {appointment.customerId.phone}</Text>
          <Text>Address: {appointment.customerId.address}</Text>
          <Text>Notes: {appointment.notes}</Text>
          <Text>Scheduled Time: {new Date(appointment.scheduledTime).toLocaleString()}</Text>
        </View>
      ))
    );
  };

  return (
    <SafeAreaView style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
      <Text>Technician Dashboard</Text>
      <Text>Status: {status}</Text>
      <Button title="Update Location" onPress={sendLocationUpdate} />
      <Button title="Show Calendar" onPress={() => setCalendarVisible(true)} />

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
              <Text style={{ fontSize: 18, fontWeight: 'bold' }}>Appointments on {selectedDate}:</Text>
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
    marginTop: 20,  // Add top margin to details container
  },
  closeButton: {
    marginTop: 20,  // Add top margin to the close button
    alignSelf: 'center',  // Center the button
  },
  appointmentCard: {
    padding: 10,
    marginVertical: 5,
    backgroundColor: '#f0f0f0',
    borderRadius: 5
  },
  companyTitle: {
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 5,
    color: 'green',
    textDecorationLine: 'underline',
    textAlign: 'center'
  }
});

export default TechnicianScreen;
