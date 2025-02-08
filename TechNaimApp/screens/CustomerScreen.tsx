import React, { useEffect, useState } from 'react';
import { View, Text } from 'react-native';
import io from 'socket.io-client';

interface LocationData {
  technicianId: string;
  lat: number;
  lng: number;
}

const socket = io('http://YOUR_SERVER_URL:5000'); // Replace with backend URL


const CustomerScreen = () => {
  const [locationData, setLocationData] = useState<LocationData | null>(null);

  useEffect(() => {
    socket.on('locationUpdate', (data) => {
      console.log('Received location update:', data);
      setLocationData(data);
    });

    return () => { socket.disconnect(); };
  }, []);

  return (
    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
      <Text>Customer Dashboard</Text>
      {locationData && (
        <Text>
          Technician {locationData.technicianId} is at ({locationData.lat}, {locationData.lng})
        </Text>
      )}
    </View>
  );
};

export default CustomerScreen;
