import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, Button, Alert, ScrollView, TouchableOpacity, SafeAreaView } from 'react-native';
import { NavigationProp, RouteProp } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import DateTimePickerModal from 'react-native-modal-datetime-picker';
import { RootStackParamList } from '../types/navigationTypes';
import { createAppointmentStyles as styles } from '../styles/createAppointmentStyle';

interface Technician {
  _id: string;
  userId: {
    _id: string;
    name: string;
  };
}

interface Customer {
  _id: string;
  name: string;
}

interface Props {
  navigation: NavigationProp<RootStackParamList, 'CreateAppointment'>;
  route: RouteProp<RootStackParamList, 'CreateAppointment'>;
}

const CreateAppointmentScreen = ({ navigation, route }: Props) => {
  const { user } = route.params;
  
  const [technicians, setTechnicians] = useState<Technician[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [selectedTechnician, setSelectedTechnician] = useState<Technician | null>(null);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [scheduledTime, setScheduledTime] = useState(new Date());
  const [isDatePickerVisible, setDatePickerVisibility] = useState(false);
  const [notes, setNotes] = useState('');

  useEffect(() => {
    fetchTechnicians();
    fetchCustomers();
  }, []);

  const fetchTechnicians = async () => {
    try {
      const token = await AsyncStorage.getItem('token');
      const userString = await AsyncStorage.getItem('user');
      const user = userString ? JSON.parse(userString) : null;
      const companyId = user?.companyId;
      if (!companyId) {
        console.error('Company ID is undefined');
        return;
      }
      const response = await fetch(`http://10.0.0.14:5000/api/technicians?companyId=${companyId}`, {
        method: 'GET',
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await response.json();
      if (Array.isArray(data)) {
        setTechnicians(data);
      } else {
        console.error('Failed to fetch technicians:', data);
      }
    } catch (error) {
      console.error('Error fetching technicians:', error);
    }
  };

  const fetchCustomers = async () => {
    try {
      const token = await AsyncStorage.getItem('token');
      const response = await fetch('http://10.0.0.14:5000/api/customers', {
        method: 'GET',
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await response.json();
      setCustomers(data);
    } catch (error) {
      console.error('Error fetching customers:', error);
    }
  };

  const createAppointment = async () => {
    if (!selectedTechnician || !selectedCustomer || !scheduledTime) {
      Alert.alert('Error', 'Please select a technician, a customer, and a scheduled time.');
      return;
    }
    try {
      const token = await AsyncStorage.getItem('token');
      const response = await fetch('http://10.0.0.14:5000/api/appointments', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          technicianId: selectedTechnician._id,
          customerId: selectedCustomer._id,
          companyId: user.companyId,
          scheduledTime,
          notes
        }),
      });
      if (!response.ok) throw new Error('Failed to create appointment');
      Alert.alert('Success', 'Appointment created successfully');
      navigation.goBack();
    } catch (error) {
      if (error instanceof Error) {
        Alert.alert('Error', error.message);
      } else {
        Alert.alert('Error', 'An unknown error occurred');
      }
    }
  };

  const showDatePicker = () => {
    console.log('Showing date picker');
    setDatePickerVisibility(true);
  };

  const hideDatePicker = () => {
    setDatePickerVisibility(false);
  };

  const handleConfirm = (date: Date) => {
    if (date > new Date()) {
      setScheduledTime(date);
    } else {
      Alert.alert('Invalid Date', 'Please select a future date');
    }
    hideDatePicker();
  };

  return (
    <SafeAreaView style={styles.container}>
    <ScrollView contentContainerStyle={styles.scrollGeneralContainer}>
      <Text style={styles.title}>Create Appointment</Text>

      {/* Select Technician */}
      <Text>Select Technician:</Text>
      {technicians.map(tech => (
        <TouchableOpacity
        key={tech._id}
        onPress={() => setSelectedTechnician(tech)}
        style={[
          styles.buttonWrapper,
          {backgroundColor: selectedTechnician?._id === tech._id ? 'lightblue' : 'white' }
        ]}
        >
          <Text style={{ padding: 10 }}>
            {tech.userId.name}
          </Text>
        </TouchableOpacity>
      ))}

      {/* Select Customer */}
      <Text style={{ marginTop: 20 }}>Select Customer:</Text>
      {customers.map(customer => (
        <TouchableOpacity
        key={customer._id}
        onPress={() => setSelectedCustomer(customer)}
        style={[
          styles.buttonWrapper,
          {backgroundColor: selectedCustomer?._id === customer._id ? 'lightgreen' : 'white' }
        ]}
        >
          <Text style={{ padding: 10 }}>
            {customer.name}
          </Text>
        </TouchableOpacity>
      ))}

      {/* Select Date */}
      <Text style={{ marginTop: 20 }}>Scheduled Time:</Text>
      <Button title="Pick Date & Time" onPress={showDatePicker} />
      <Text style={{ marginTop: 10 }}>{scheduledTime.toLocaleString()}</Text>
      <DateTimePickerModal
        isVisible={isDatePickerVisible}
        mode="datetime"
        display="default"
        onConfirm={handleConfirm}
        onCancel={hideDatePicker}
      />

      {/* Appointment Notes */}
      <Text style={ styles.notesTextHeader }>Notes for the appointment:</Text>
      <TextInput 
        multiline
        style={styles.notesHolder}
        placeholder="Enter notes here..."
        value={notes}
        onChangeText={setNotes}
      />
      
      <View style={{ marginTop: 20 }}>
        <Button title="Create Appointment" onPress={createAppointment} />

        <TouchableOpacity 
          style={styles.cancelButton}
          onPress={() => navigation.goBack()}
        >
          <Text style={styles.cancelButtonText}>Cancel</Text>
        </TouchableOpacity>
      </View>
      
    </ScrollView>
    </SafeAreaView>
  );
};

export default CreateAppointmentScreen;
