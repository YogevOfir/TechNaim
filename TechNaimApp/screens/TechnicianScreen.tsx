import React, { useEffect, useState } from 'react';
import { View, Text, Button } from 'react-native';
import io from 'socket.io-client';

const socket = io('http://10.0.0.14:5000/technician');

const TechnicianScreen = () => {
  const [status, setStatus] = useState('Available');

  const sendLocationUpdate = () => {
    const locationData = {
      technicianId: 'tech123',
      lat: Math.random() * 90,
      lng: Math.random() * 180,
    };
    socket.emit('locationUpdate', locationData);
  };

  return (
    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
      <Text>Technician Dashboard</Text>
      <Text>Status: {status}</Text>
      <Button title="Update Location" onPress={sendLocationUpdate} />
    </View>
  );
};

export default TechnicianScreen;
